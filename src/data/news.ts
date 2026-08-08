/**
 * News & industry-briefing data model for the auto-aggregated news feed.
 *
 * Idea #13 (solo automated zero-investment site) — an AI news aggregator.
 * The `/news` page is built around this shape. Items come from two places:
 *
 *   1. CURATED_NEWS below — hand-picked editorial fallback that always
 *      renders, even with no network access and no API keys. This keeps the
 *      site buildable and the page useful offline.
 *   2. Live RSS ingestion (src/lib/news.ts) — when the server can reach the
 *      configured sources, live items replace/augment the curated set.
 *
 * `aiSummarized` is always truthful: it is only true when an LLM actually
 * produced the excerpt via the optional summarizer. We never claim AI on
 * hand-written copy.
 */

export interface NewsItem {
  /** Stable URL-safe id, used for /news/[slug]. */
  slug: string;
  title: string;
  /** Short summary shown in the grid. Either human-written or AI-generated. */
  excerpt: string;
  /** Body content — plain paragraphs separated by blank lines. */
  content: string;
  /** Display name of the publication / feed. */
  source: string;
  /** Canonical URL of the original article. */
  sourceUrl: string;
  /** ISO timestamp of original publication. */
  publishedAt: string;
  /** Same date as `publishedAt`, kept for parity with the blog schema. */
  isoDate: string;
  /** Coarse grouping label shown as a badge, e.g. "Launches", "Pricing". */
  category: string;
  /** Optional cover image URL. */
  image?: string;
  /** True only if an LLM produced `excerpt`. */
  aiSummarized: boolean;
}

/** Normalise a title into a stable URL slug. */
export function newsSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/** Relative link (site-relative, used everywhere in the UI). */
export function newsHref(item: NewsItem): string {
  return `/news/${item.slug}`;
}

/**
 * Editorial fallback feed (removed 2026-08-08).
 *
 * v3: the hand-written "sample stories" were removed entirely. They were
 * plausible-looking but NOT source-verified — for a directory whose whole
 * value is honest verification, presenting fabricated news even labelled as
 * samples was worse than having no news at all. /news now shows only real
 * items from live RSS sources (with optional AI summaries), and an empty
 * state when none are available.
 */
export const CURATED_NEWS: NewsItem[] = [];

