import 'server-only';
import { ALL_NEWS_SOURCES, type NewsSource } from '@/data/news-sources';
import { newsSlug, type NewsItem } from '@/data/news';
import { parseFeed, type ParsedFeedEntry } from '@/lib/rss';
import { extract } from '@extractus/article-extractor';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { filterRelevant } from '@/lib/newsRelevance';

/**
 * Live news ingestion for the auto-aggregator (idea #13).
 *
 * getNews() is the single entry point the /news pages use. Its behaviour is
 * deliberately fail-safe so the site always builds and the page always
 * renders:
 *
 *   1. If a cron-refreshed snapshot exists in Supabase (news_items), serve it
 *      — this is the "auto-published with AI summaries" production path.
 *   2. Otherwise attempt a live fetch of NEWS_SOURCES with a short timeout.
 *   3. On any failure, fall back to the hand-written CURATED_NEWS.
 *
 * AI summarization is intentionally NOT done here on every render (slow +
 * costly). It happens once per refresh in /api/news/refresh, which persists
 * the summarized snapshot. Live/fallback items therefore keep
 * aiSummarized: false and stay honest about it.
 */

const FETCH_TIMEOUT_MS = 6_000;
// v3: deeper archive — pull as much 2026 news as the feeds provide so the
// archive reaches back to the start of the year (feeds only serve recent
// items; the daily cron keeps accumulating older ones in Supabase).
const MAX_LIVE_ITEMS = 200;
const MAX_SOURCE_ITEMS = 40;

function entryToNewsItem(entry: ParsedFeedEntry, source: NewsSource): NewsItem | null {
  const slug = newsSlug(entry.title);
  if (!slug) return null;
  // Keep only 2026+ stories — the archive starts at the beginning of 2026.
  const publishedAt = entry.publishedAt || new Date().toISOString();
  if (publishedAt < '2026-01-01') return null;
  return {
    slug,
    title: entry.title,
    excerpt: entry.description.slice(0, 240),
    content: entry.content || entry.description || entry.title,
    source: source.name,
    sourceUrl: entry.link,
    publishedAt,
    isoDate: publishedAt.slice(0, 10),
    category: entry.categories[0] || source.category,
    aiSummarized: false,
  };
}

/**
 * In-process full-text cache (v3.2). RSS feeds usually give only a short
 * excerpt; when a story's body is too short we fetch the actual article and
 * extract the full text with @extractus/article-extractor (lightweight,
 * no browser — safe for serverless). Cached per process so re-renders never
 * re-fetch.
 */
const fullTextCache = new Map<string, string>();

/** Convert extracted HTML into plain paragraphs (\n\n separated). */
function htmlToPlain(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<(p|div|h[1-6]|li|blockquote|br)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;|&#x?A0;/gi, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

/**
 * If the item body is too short to be a real article (<600 chars), fetch the
 * source URL and extract the full text. Never throws — returns the item
 * unchanged on failure. Runs at ingest/live-fetch time, not per page view.
 */
const FULL_TEXT_MIN = 600;
async function enrichFullText(item: NewsItem): Promise<NewsItem> {
  if (item.content.length >= FULL_TEXT_MIN) return item;
  const cached = fullTextCache.get(item.sourceUrl);
  if (cached) {
    item.content = cached;
    return item;
  }
  try {
    const art = await extract(item.sourceUrl);
    const text = art?.content ? htmlToPlain(art.content) : '';
    if (text.length > FULL_TEXT_MIN && text.length > item.content.length) {
      fullTextCache.set(item.sourceUrl, text);
      item.content = text;
      // Keep the excerpt a real preview (no AI summary needed).
      if (item.excerpt.length < 120) item.excerpt = text.slice(0, 320);
    }
  } catch {
    // article unreachable — keep whatever the feed gave us
  }
  return item;
}

/**
 * Best-effort: enrich up to `max` items with full text, bounded so a page
 * render can never hang on many slow fetches. Runs sequentially with a small
 * cap; anything skipped keeps the feed's own content.
 */
async function enrichMany(items: NewsItem[], max = 25): Promise<NewsItem[]> {
  let done = 0;
  const out: NewsItem[] = [];
  for (const item of items) {
    if (done >= max) {
      out.push(item);
      continue;
    }
    out.push(await enrichFullText(item));
    done++;
    await new Promise((r) => setTimeout(r, 150)); // polite to publishers
  }
  return out;
}

/** Fetch one feed, returning normalized items (never throws). *//** Fetch one feed, returning normalized items (never throws). */
async function fetchSource(source: NewsSource): Promise<NewsItem[]> {
  try {
    const res = await fetch(source.url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        'user-agent':
          'CreatorAIHub-NewsBot/1.0 (+https://creatorsaicenter.vercel.app/about)',
        accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
      },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const feed = parseFeed(xml);
    return feed.entries
      .map((e) => entryToNewsItem(e, source))
      .filter((n): n is NewsItem => n !== null)
      .slice(0, MAX_SOURCE_ITEMS);
  } catch {
    return [];
  }
}

/** Fetch all configured sources in parallel, merged + deduped by slug. */
/**
 * v3 backfill: fetch AI news from GNews with a date range back to the start
 * of 2026 (free tier: 100 requests/day, ~10 items per request). Optional —
 * enabled by setting GNES_API_KEY (https://gnews.io free key). Gives the
 * archive real stories from January 2026 onward, not just the latest feed
 * items. Never throws; returns [] on any failure.
 */
const GNES_KEY = () => process.env.GNEWS_API_KEY || '';

async function fetchGNewsBackfill(): Promise<NewsItem[]> {
  const apiKey = GNES_KEY();
  if (!apiKey) return [];

  const queries = [
    '"AI video" OR "AI video generation" OR "AI video editor"',
    '"AI voice" OR "AI dubbing" OR "text to speech"',
    '"AI tools" OR "AI for creators" OR "AI content creation"',
    '"AI video generator" OR "AI avatar" OR "AI podcast"',
  ];
  const out: NewsItem[] = [];
  const from = '2026-01-01T00:00:00Z';
  const to = new Date().toISOString();

  for (const q of queries) {
    try {
      const url =
        'https://gnews.io/api/v4/search?lang=en&max=10&from=' +
        encodeURIComponent(from) +
        '&to=' +
        encodeURIComponent(to) +
        '&q=' +
        encodeURIComponent(q) +
        '&apikey=' +
        apiKey;
      const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
      if (!res.ok) continue;
      const data = (await res.json()) as {
        articles?: {
          title?: string;
          description?: string;
          content?: string;
          url?: string;
          image?: string;
          publishedAt?: string;
          source?: { name?: string };
        }[];
      };
      for (const a of data.articles ?? []) {
        if (!a.title || !a.url) continue;
        const publishedAt = a.publishedAt || new Date().toISOString();
        if (publishedAt < '2026-01-01') continue;
        const slug = newsSlug(a.title);
        if (!slug) continue;
        out.push({
          slug,
          title: a.title.trim(),
          excerpt: (a.description || a.content || '').slice(0, 240),
          content: a.content || a.description || a.title,
          source: a.source?.name || 'GNews',
          sourceUrl: a.url,
          publishedAt,
          isoDate: publishedAt.slice(0, 10),
          category: 'Industry',
          image: a.image || undefined,
          aiSummarized: false,
        });
      }
      // Free tier: be polite between queries.
      await new Promise((r) => setTimeout(r, 300));
    } catch {
      // continue with next query
    }
  }
  return out;
}

export async function fetchLiveNews(): Promise<NewsItem[]> {
  const [perSource, gnews] = await Promise.all([
    Promise.all(ALL_NEWS_SOURCES.map(fetchSource)),
    fetchGNewsBackfill(),
  ]);
  const bySlug = new Map<string, NewsItem>();
  for (const items of [...perSource, gnews]) {
    for (const item of items) {
      if (!bySlug.has(item.slug)) bySlug.set(item.slug, item);
    }
  }
  return [...bySlug.values()]
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, MAX_LIVE_ITEMS);
}

/** Try the persisted snapshot, then live, then curated fallback. */
export async function getNews(): Promise<{ items: NewsItem[]; mode: 'supabase' | 'live' | 'empty' }> {
  // 1) Persisted snapshot from the cron refresh (the production "auto" path).
  if (supabaseAdmin) {
    try {
      // v3: no manual approval gate — items are inserted approved=true by the
      // ingester. The relevance filter below double-checks every survivor.
      const { data, error } = await supabaseAdmin
        .from('news_items')
        .select('*')
        .eq('approved', true)
        .order('published_at', { ascending: false })
        .limit(MAX_LIVE_ITEMS);
      if (!error && data && data.length > 0) {
        const items: NewsItem[] = data.map((r) => ({
          slug: r.slug,
          // v2.9: defensively strip any CDATA markers that leaked into rows
          // stored before the parser fix.
          title: String(r.title).replace(/<!\[CDATA\[|\]\]>/g, '').trim(),
          excerpt: r.excerpt,
          content: r.content,
          source: r.source,
          sourceUrl: r.source_url,
          publishedAt: r.published_at,
          isoDate: r.iso_date || r.published_at.slice(0, 10),
          category: r.category,
          image: r.image || undefined,
          aiSummarized: r.ai_summarized === true,
        }));
        // Defence in depth: even an old persisted snapshot can never surface
        // off-topic stories (critique §7) — the gate runs at read time too.
        // Audit fix 2.6: the approved feed no longer merges in the hand-written
        // CURATED_NEWS. The curated seed is not independently sourced, so it
        // must never be presented as approved news — it only appears as a
        // clearly-labelled fallback in 'curated' mode below.
        const relevant = filterRelevant(items);
        if (relevant.length > 0) return { items: relevant, mode: 'supabase' };
      }
    } catch {
      // fall through to live/curated
    }
  }

  // 2) Live RSS fetch (may fail offline / at build time — that's fine).
  //    v3: ONLY real, sourced items are shown. The hand-written sample
  //    stories were removed — fabricated news, even labelled, was worse than
  //    an empty feed on a site whose whole value is honest verification.
  try {
    const live = filterRelevant(await fetchLiveNews());
    if (live.length > 0) {
      const sorted = await enrichMany(dedupeSort(live).slice(0, 30), 25);
      return { items: sorted, mode: 'live' };
    }
  } catch {
    // fall through
  }

  // 3) Honest empty state — no fabricated filler.
  return { items: [], mode: 'empty' };
}

function dedupeSort(items: NewsItem[]): NewsItem[] {
  const seen = new Set<string>();
  const out: NewsItem[] = [];
  for (const item of [...items].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))) {
    if (seen.has(item.slug)) continue;
    seen.add(item.slug);
    out.push(item);
  }
  return out;
}

/** Group a set of news items by category, preserving a stable order. */
export function groupNewsByCategory(items: NewsItem[]): Map<string, NewsItem[]> {
  const order = [
    'Launches',
    'Video Generation',
    'Video Editing & VFX',
    'Video Repurposing',
    'Voice & Audio',
    'Music & Audio',
    'AI Avatars',
    'Automation',
    'Pricing',
    'Technology',
    'Industry',
  ];
  const map = new Map<string, NewsItem[]>();
  for (const item of items) {
    const cat = item.category || 'Industry';
    const list = map.get(cat) ?? [];
    list.push(item);
    map.set(cat, list);
  }
  // Sort keys by the canonical order, then alphabetically, then by newest item.
  const keys = [...map.keys()].sort((a, b) => {
    const ia = order.indexOf(a);
    const ib = order.indexOf(b);
    if (ia !== -1 || ib !== -1) return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    return a.localeCompare(b);
  });
  const sorted = new Map<string, NewsItem[]>();
  for (const key of keys) sorted.set(key, map.get(key)!);
  return sorted;
}
