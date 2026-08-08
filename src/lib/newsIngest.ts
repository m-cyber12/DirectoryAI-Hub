import 'server-only';
import { fetchLiveNews } from '@/lib/news';
import { filterRelevant } from '@/lib/newsRelevance';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import type { NewsItem } from '@/data/news';

/**
 * Shared ingestion pipeline (v2.8): used by the hourly cron
 * (/api/news/refresh) AND by the admin panel's "Ingest now" button
 * (/api/admin/news/refresh).
 *
 * Fetch → creator-relevance gate → optional AI summary → insert as LIVE
 * (approved = true). v3 (2026-08-08): the manual approval gate was removed —
 * items that pass the automated relevance gate publish automatically.
 * Existing rows are never overwritten.
 */

export interface IngestResult {
  ok: boolean;
  fetched: number;
  kept: number;
  insertedNew: number;
  /** The items that passed the gate this run (i18n: auto-translate hook). */
  items?: NewsItem[];
  aiSummarized: number;
  note: string;
}

export async function runNewsIngest(): Promise<IngestResult> {
  const live = await fetchLiveNews();
  if (live.length === 0) {
    return {
      ok: false,
      fetched: 0,
      kept: 0,
      insertedNew: 0,
      aiSummarized: 0,
      note: 'No live news could be fetched from the configured sources.',
    };
  }

  const relevantLive = filterRelevant(live);
  if (relevantLive.length === 0) {
    return {
      ok: false,
      fetched: live.length,
      kept: 0,
      insertedNew: 0,
      aiSummarized: 0,
      note: 'Feeds fetched, but nothing passed the creator-relevance gate.',
    };
  }

  // v3.2: no AI summarization — articles are shown in full (enriched during
  // the live fetch by @extractus/article-extractor). Excerpt stays the feed's
  // own description as a preview.
  const items = relevantLive.map((item) => ({ ...item, aiSummarized: false }));

  if (!supabaseAdmin) {
    return {
      ok: false,
      fetched: items.length,
      kept: relevantLive.length,
      insertedNew: 0,
      aiSummarized: 0,
      note: 'SUPABASE_SERVICE_ROLE_KEY is not configured — nothing was persisted.',
    };
  }

  const rows = items.map((i) => ({
    slug: i.slug,
    title: i.title,
    excerpt: i.excerpt,
    content: i.content,
    source: i.source,
    source_url: i.sourceUrl,
    published_at: i.publishedAt,
    iso_date: i.isoDate,
    category: i.category,
    image: i.image || null,
    ai_summarized: i.aiSummarized,
    approved: true, // auto-publish (v3 — no manual approval gate)
  }));

  let insertedNew = 0;
  for (let i = 0; i < rows.length; i += 50) {
    const { data, error } = await supabaseAdmin
      .from('news_items')
      .upsert(rows.slice(i, i + 50), { onConflict: 'slug', ignoreDuplicates: true })
      .select('slug');
    if (error) {
      return {
        ok: false,
        fetched: items.length,
        kept: relevantLive.length,
        insertedNew,
        aiSummarized: 0,
        note: error.message,
      };
    }
    insertedNew += data?.length ?? 0;
  }

  return {
    ok: true,
    fetched: items.length,
    kept: relevantLive.length,
    insertedNew,
    items,
    aiSummarized: 0,
    note:
      'New items that passed the relevance gate were published automatically (v3). Full text is enriched from the source article when the feed only gives an excerpt.',
  };
}
