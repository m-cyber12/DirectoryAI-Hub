import { MetadataRoute } from 'next';
import { ALL_TOOLS } from '@/data/tools';
import { BLOG_POSTS } from '@/data/posts';
import { SITE_URL } from '@/config/site';
import { REAL_CATEGORIES, categorySlug } from '@/lib/categories';
import { COMPARISON_PAIRS } from '@/lib/comparisons';
import { PAGE_SIZE } from '@/lib/toolFilters';

/**
 * Audit fixes 3.1, 3.3.
 *
 * Before: 223 URLs, every lastModified hardcoded to 2026-08-01, and the new
 * programmatic templates did not exist. The orphan pages /templates and /jobs
 * were absent from the sitemap yet still indexable.
 *
 * Now: tool pages, category pages, alternatives pages, curated comparison
 * pages and real catalog pagination are all included, and dates are derived
 * from the data instead of frozen.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  // Build date, so freshness signals update on every deploy rather than
  // permanently claiming 2026-08-01.
  const buildDate = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: 'daily', priority: 1.0, lastModified: buildDate },
    { url: `${SITE_URL}/tools`, changeFrequency: 'daily', priority: 0.9, lastModified: buildDate },
    { url: `${SITE_URL}/ai-studio`, changeFrequency: 'weekly', priority: 0.8, lastModified: buildDate },
    { url: `${SITE_URL}/ai-studio/prompt-builder`, changeFrequency: 'monthly', priority: 0.7, lastModified: buildDate },
    { url: `${SITE_URL}/ai-studio/thumbnail-brief`, changeFrequency: 'monthly', priority: 0.7, lastModified: buildDate },
    { url: `${SITE_URL}/ai-studio/thumbnail-text`, changeFrequency: 'monthly', priority: 0.7, lastModified: buildDate },
    { url: `${SITE_URL}/ai-studio/content-calendar`, changeFrequency: 'monthly', priority: 0.7, lastModified: buildDate },
    { url: `${SITE_URL}/ai-studio/image-tools`, changeFrequency: 'monthly', priority: 0.7, lastModified: buildDate },
    { url: `${SITE_URL}/ai-studio/subtitle-tools`, changeFrequency: 'monthly', priority: 0.7, lastModified: buildDate },
    { url: `${SITE_URL}/ai-studio/audio-trimmer`, changeFrequency: 'monthly', priority: 0.7, lastModified: buildDate },
    { url: `${SITE_URL}/ai-studio/video-inspector`, changeFrequency: 'monthly', priority: 0.7, lastModified: buildDate },
    { url: `${SITE_URL}/blog`, changeFrequency: 'weekly', priority: 0.8, lastModified: buildDate },
    { url: `${SITE_URL}/news`, changeFrequency: 'hourly', priority: 0.7, lastModified: buildDate },
    { url: `${SITE_URL}/best-of`, changeFrequency: 'weekly', priority: 0.8, lastModified: buildDate },
    { url: `${SITE_URL}/compare`, changeFrequency: 'weekly', priority: 0.7, lastModified: buildDate },
    { url: `${SITE_URL}/benchmark`, changeFrequency: 'weekly', priority: 0.8, lastModified: buildDate },
    { url: `${SITE_URL}/graveyard`, changeFrequency: 'weekly', priority: 0.7, lastModified: buildDate },
    { url: `${SITE_URL}/stack-builder`, changeFrequency: 'weekly', priority: 0.7, lastModified: buildDate },
    { url: `${SITE_URL}/trending`, changeFrequency: 'daily', priority: 0.8, lastModified: buildDate },
    { url: `${SITE_URL}/changelog`, changeFrequency: 'weekly', priority: 0.8, lastModified: buildDate },
    { url: `${SITE_URL}/calculators`, changeFrequency: 'weekly', priority: 0.7, lastModified: buildDate },
    { url: `${SITE_URL}/founders`, changeFrequency: 'monthly', priority: 0.6, lastModified: buildDate },
    { url: `${SITE_URL}/deals`, changeFrequency: 'weekly', priority: 0.6, lastModified: buildDate },
    { url: `${SITE_URL}/guide`, changeFrequency: 'monthly', priority: 0.8, lastModified: buildDate },
    { url: `${SITE_URL}/about`, changeFrequency: 'monthly', priority: 0.6, lastModified: buildDate },
    { url: `${SITE_URL}/submit`, changeFrequency: 'monthly', priority: 0.5, lastModified: buildDate },
    { url: `${SITE_URL}/developers`, changeFrequency: 'monthly', priority: 0.5, lastModified: buildDate },
    { url: `${SITE_URL}/contact`, changeFrequency: 'yearly', priority: 0.3, lastModified: buildDate },
    { url: `${SITE_URL}/disclosure`, changeFrequency: 'yearly', priority: 0.3, lastModified: buildDate },
    { url: `${SITE_URL}/privacy`, changeFrequency: 'yearly', priority: 0.3, lastModified: buildDate },
    { url: `${SITE_URL}/terms`, changeFrequency: 'yearly', priority: 0.3, lastModified: buildDate },
  ];

  // Real, crawlable catalog pagination (audit fix 1.4).
  const totalPages = Math.ceil(ALL_TOOLS.length / PAGE_SIZE);
  const paginationRoutes: MetadataRoute.Sitemap = Array.from(
    { length: Math.max(0, totalPages - 1) },
    (_, i) => ({
      url: `${SITE_URL}/tools?page=${i + 2}`,
      changeFrequency: 'weekly' as const,
      priority: 0.5,
      lastModified: buildDate,
    })
  );

  const categoryRoutes: MetadataRoute.Sitemap = REAL_CATEGORIES.map((c) => ({
    url: `${SITE_URL}/category/${categorySlug(c)}`,
    changeFrequency: 'weekly',
    priority: 0.8,
    lastModified: buildDate,
  }));

  const toolRoutes: MetadataRoute.Sitemap = ALL_TOOLS.map((tool) => ({
    url: `${SITE_URL}/tool/${tool.slug}`,
    // Real per-tool dates where we have them.
    lastModified: new Date(tool.testedAt || tool.pricingCheckedAt || tool.cataloguedAt || buildDate),
    changeFrequency: 'weekly',
    priority: tool.verificationLevel === 'hands-on-tested' ? 0.9 : 0.7,
  }));

  const alternativeRoutes: MetadataRoute.Sitemap = ALL_TOOLS.map((tool) => ({
    url: `${SITE_URL}/alternatives/${tool.slug}`,
    changeFrequency: 'monthly',
    priority: 0.7,
    lastModified: buildDate,
  }));

  const compareRoutes: MetadataRoute.Sitemap = COMPARISON_PAIRS.map(([a, b]) => ({
    url: `${SITE_URL}/compare/${a}-vs-${b}`,
    changeFrequency: 'monthly',
    priority: 0.7,
    lastModified: buildDate,
  }));

  const blogRoutes: MetadataRoute.Sitemap = BLOG_POSTS.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.isoDate),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  // RSS feeds (audit fix 3.2).
  const rssRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/feed.xml`, changeFrequency: 'daily', priority: 0.5, lastModified: buildDate },
    { url: `${SITE_URL}/feed-tools.xml`, changeFrequency: 'daily', priority: 0.5, lastModified: buildDate },
  ];

  return [
    ...staticRoutes,
    ...paginationRoutes,
    ...categoryRoutes,
    ...toolRoutes,
    ...alternativeRoutes,
    ...compareRoutes,
    ...blogRoutes,
    ...rssRoutes,
  ];
}
