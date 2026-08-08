import { MetadataRoute } from 'next';
import { SITE_URL } from '@/config/site';

/**
 * Audit fix 3.3 — the previous robots.txt left /tools?* fully open, so
 * crawlers burned budget on unlimited filter combinations. Deep parameter
 * combinations are now discouraged here and additionally carry noindex from
 * the page's own metadata, while the clean catalog stays crawlable.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/go/',
          '/admin',
          '/account',
          '/login',
          // Faceted-search noise: these produce near-duplicate pages.
          '/tools?*q=',
          '/tools?*sort=',
          '/tools?*tested=',
          '/*?*utm_',
        ],
      },
      {
        // Let AI crawlers read the catalog and llms.txt — an increasingly
        // significant referral channel (audit idea 7.6).
        userAgent: ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended'],
        allow: ['/', '/llms.txt'],
        disallow: ['/api/', '/go/', '/admin', '/account', '/login'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
