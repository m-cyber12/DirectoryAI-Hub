import type { NewsItem } from '@/data/news';

/**
 * Smart search + faceted filtering for the /news archive (v2.8).
 *
 * "Smart" = typo-tolerant, synonym-aware, field-weighted (title ≫ excerpt ≫
 * category/source), plus natural-language intent words ("dubbing", "tts",
 * "captions" all resolve to the same cluster). Pure functions → unit-tested.
 */

const SYNONYMS: Record<string, string[]> = {
  dub: ['dubbing', 'translation', 'translate', 'localization', 'multilingual'],
  dubbing: ['dub', 'translation', 'translate', 'localization'],
  voice: ['tts', 'voiceover', 'narration', 'speech', 'audio'],
  tts: ['voice', 'text to speech', 'voiceover'],
  caption: ['captions', 'subtitle', 'subtitles'],
  subtitle: ['captions', 'caption', 'srt'],
  clip: ['clips', 'clipping', 'shorts', 'repurposing'],
  shorts: ['clips', 'clipping', 'tiktok', 'vertical'],
  thumbnail: ['thumbnails', 'ctr', 'cover'],
  avatar: ['avatars', 'presenter', 'talking head'],
  music: ['song', 'audio', 'soundtrack', 'licensing'],
  price: ['pricing', 'cost', 'free tier'],
  pricing: ['price', 'cost', 'free tier'],
  faceless: ['automation', 'script-to-video', 'youtube automation'],
};

const norm = (s: string) =>
  s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9\s+-]/g, ' ').replace(/\s+/g, ' ').trim();

/** Crude stem so "dubbing" ≈ "dubbed" ≈ "dubs": strip common suffixes and
 *  doubled tail consonants. */
const stem = (w: string) => {
  let s = w.replace(/(bing|ing|ed|es|s)$/, '');
  if (s.length > 3 && s[s.length - 1] === s[s.length - 2]) s = s.slice(0, -1);
  return s;
};

const words = (hay: string) => hay.split(/[\s-]+/).filter(Boolean);

function stemMatch(hay: string, term: string): boolean {
  if (term.length < 4) return false;
  const ts = stem(term);
  return words(hay).some((w) => stem(w) === ts);
}

/** Capped Levenshtein for typo tolerance (same idea as the tool search). */
function fuzzyIncludes(hay: string, needle: string): boolean {
  if (hay.includes(needle)) return true;
  if (needle.length < 5) return false;
  for (const word of hay.split(' ')) {
    if (Math.abs(word.length - needle.length) > 2) continue;
    let prev = Array.from({ length: needle.length + 1 }, (_, i) => i);
    for (let i = 1; i <= word.length; i++) {
      const cur = [i];
      for (let j = 1; j <= needle.length; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (word[i - 1] === needle[j - 1] ? 0 : 1));
      }
      prev = cur;
    }
    if (prev[needle.length] <= 2) return true;
  }
  return false;
}

export function scoreNewsItem(q: string, item: NewsItem): number {
  const cleaned = norm(q);
  if (!cleaned) return 1;
  const terms = cleaned.split(' ').filter((w) => w.length > 1);
  const expanded = new Set(terms);
  for (const t of terms) (SYNONYMS[t] || []).forEach((s) => expanded.add(s));
  // whole-phrase synonyms too ("voice cloning" style)
  if (SYNONYMS[cleaned]) SYNONYMS[cleaned].forEach((s) => expanded.add(s));

  const title = norm(item.title);
  const excerpt = norm(item.excerpt);
  const meta = norm(`${item.category} ${item.source}`);

  let score = 0;
  if (title.includes(cleaned)) score += 60;
  else if (fuzzyIncludes(title, cleaned)) score += 30;
  else if (stemMatch(title, cleaned)) score += 26;
  for (const term of expanded) {
    const w = terms.includes(term) ? 1 : 0.6;
    if (title.includes(term)) score += 24 * w;
    else if (stemMatch(title, term)) score += 18 * w;
    else if (fuzzyIncludes(title, term)) score += 10 * w;
    if (excerpt.includes(term) || stemMatch(excerpt, term)) score += 8 * w;
    if (meta.includes(term)) score += 10 * w;
  }
  return score;
}

export function searchNews(q: string, items: NewsItem[]): NewsItem[] {
  const cleaned = norm(q);
  if (!cleaned) return items;
  return items
    .map((item) => ({ item, score: scoreNewsItem(cleaned, item) }))
    .filter((r) => r.score >= 18)
    .sort((a, b) => b.score - a.score || b.item.publishedAt.localeCompare(a.item.publishedAt))
    .map((r) => r.item);
}

/* ── Month buckets (the date menu) ─────────────────────────────────────── */

export interface MonthBucket {
  key: string; // "2026-08"
  label: string; // "August 2026"
  count: number;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function monthKey(isoDate: string): string {
  return isoDate.slice(0, 7);
}

export function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number);
  if (!y || !m) return key;
  return `${MONTH_NAMES[m - 1]} ${y}`;
}

export function monthBuckets(items: NewsItem[]): MonthBucket[] {
  const map = new Map<string, number>();
  for (const item of items) {
    const k = monthKey(item.isoDate);
    map.set(k, (map.get(k) || 0) + 1);
  }
  return [...map.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, count]) => ({ key, label: monthLabel(key), count }));
}

/* ── Query parsing (shareable URLs: /news?m=2026-05&q=dubing&cat=...) ─── */

export interface NewsQuery {
  q: string;
  month: string; // '' = latest bucket, 'all' = everything
  category: string; // '' = all
}

export function parseNewsQuery(
  sp: Record<string, string | string[] | undefined>,
  buckets: MonthBucket[]
): NewsQuery {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';
  const rawMonth = one(sp.m);
  const latest = buckets[0]?.key ?? '';
  return {
    q: one(sp.q).slice(0, 80),
    month: rawMonth === 'all' ? 'all' : rawMonth && buckets.some((b) => b.key === rawMonth) ? rawMonth : latest,
    category: one(sp.cat),
  };
}

export function buildNewsHref(q: NewsQuery): string {
  const sp = new URLSearchParams();
  if (q.q) sp.set('q', q.q);
  if (q.month && q.month !== 'all') sp.set('m', q.month);
  if (q.month === 'all') sp.set('m', 'all');
  if (q.category) sp.set('cat', q.category);
  const s = sp.toString();
  return `/news${s ? `?${s}` : ''}`;
}

export function applyNewsFilters(items: NewsItem[], query: NewsQuery): NewsItem[] {
  let out = [...items].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  if (query.month !== 'all') out = out.filter((i) => monthKey(i.isoDate) === query.month);
  if (query.category) out = out.filter((i) => i.category === query.category);
  if (query.q.trim()) out = searchNews(query.q, out);
  return out;
}
