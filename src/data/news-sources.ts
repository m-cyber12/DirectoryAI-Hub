/**
 * RSS/Atom sources for the auto-aggregated news feed (idea #13).
 *
 * Keep this list short and trusted. Every source here is fetched by the live
 * ingester in src/lib/news.ts and by the cron refresh in
 * src/app/api/news/refresh/route.ts. If a feed becomes unreliable, remove it
 * here rather than letting a dead fetch drag down the whole page.
 *
 * Sources are grouped so items inherit a coarse category label. When no live
 * source is reachable the page gracefully falls back to CURATED_NEWS.
 */

export interface NewsSource {
  /** Unique id — used as the Supabase primary key for the source. */
  id: string;
  /** Display name shown next to items. */
  name: string;
  /** RSS 2.0 or Atom feed URL. */
  url: string;
  /** Default category label applied to items from this feed. */
  category: string;
}

/**
 * Stable, AI-focused feeds. Every feed URL was verified to return valid
 * RSS/Atom on 2026-08-04.
 *
 * Critique §7 fix: the general Ars Technica feed was REMOVED — it put Tesla
 * earnings, Pixel launches and political stories on an AI-video-tools
 * directory. In addition, every item that arrives is now scored by
 * src/lib/newsRelevance.ts and rejected unless it is genuinely about AI
 * media/creation, so even a broad AI feed cannot dilute topical authority.
 */
export const NEWS_SOURCES: NewsSource[] = [
  {
    id: 'the-verge-ai',
    name: 'The Verge — AI',
    url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml',
    category: 'Industry',
  },
  {
    id: 'venturebeat-ai',
    name: 'VentureBeat — AI',
    url: 'https://venturebeat.com/category/ai/feed/',
    category: 'Industry',
  },
  {
    id: 'techcrunch-ai',
    name: 'TechCrunch — AI',
    url: 'https://techcrunch.com/category/artificial-intelligence/feed/',
    category: 'Industry',
  },
  {
    id: 'openaiblog',
    name: 'OpenAI News',
    url: 'https://openai.com/news/rss.xml',
    category: 'Industry',
  },
  {
    id: 'google-deepmind',
    name: 'Google DeepMind Blog',
    url: 'https://deepmind.google/blog/rss.xml',
    category: 'Research',
  },
  {
    id: 'google-ai-blog',
    name: 'Google AI Blog',
    url: 'https://blog.google/technology/ai/rss/',
    category: 'Research',
  },
];

/**
 * v3 (2026-08-08) — expanded free RSS sources, following the AI-news guide:
 * every feed is free & unlimited (no API key). A relevance gate still
 * rejects anything not genuinely about AI for video/voice/creator work.
 */
export const EXTRA_NEWS_SOURCES: NewsSource[] = [
  {
    id: 'mit-tech-review-ai',
    name: 'MIT Technology Review — AI',
    url: 'https://www.technologyreview.com/topic/artificial-intelligence/feed',
    category: 'Research',
  },
  {
    id: 'ars-technica-ai',
    name: 'Ars Technica — AI',
    url: 'https://arstechnica.com/ai/feed/',
    category: 'Industry',
  },
  {
    id: 'towards-data-science',
    name: 'Towards Data Science',
    url: 'https://towardsdatascience.com/feed',
    category: 'Research',
  },
  {
    id: 'huggingface-blog',
    name: 'Hugging Face Blog',
    url: 'https://huggingface.co/blog/feed.xml',
    category: 'Research',
  },
  {
    id: 'anthropic-news',
    name: 'Anthropic News',
    url: 'https://www.anthropic.com/news/rss.xml',
    category: 'Industry',
  },
  {
    id: 'the-decoder',
    name: 'The Decoder',
    url: 'https://the-decoder.com/feed/',
    category: 'Industry',
  },
];

export const ALL_NEWS_SOURCES: NewsSource[] = [...NEWS_SOURCES, ...EXTRA_NEWS_SOURCES];
