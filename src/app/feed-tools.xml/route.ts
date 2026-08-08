import { ALL_TOOLS, hasVerifiedScore } from '@/data/tools';
import { SITE_URL, SITE_NAME } from '@/config/site';

/**
 * Audit fix 3.2 — dedicated RSS feed for new tool listings.
 * The main /feed.xml mixes blog posts, news, and tools. This feed is
 * tools-only, which is more useful for automated aggregators and users
 * who only care about new catalogue entries.
 */

export const dynamic = 'force-static';

function esc(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const newestTools = [...ALL_TOOLS]
    .filter((t) => t.launchDate)
    .sort((a, b) => (b.launchDate || '').localeCompare(a.launchDate || ''))
    .slice(0, 30);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(`${SITE_NAME} — New AI Tools for Video Creators`)}</title>
    <link>${SITE_URL}/tools</link>
    <description>${esc(
      `Newly catalogued AI tools for video creators. ${ALL_TOOLS.length} tools total, ${ALL_TOOLS.filter(hasVerifiedScore).length} hands-on tested.`
    )}</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed-tools.xml" rel="self" type="application/rss+xml" />
${newestTools
  .map(
    (t) => `    <item>
      <title>${esc(`${t.name} — ${t.tagline}`)}</title>
      <link>${SITE_URL}/tool/${t.slug}</link>
      <guid isPermaLink="true">${SITE_URL}/tool/${t.slug}</guid>
      <pubDate>${new Date(t.launchDate || '2026-01-01').toUTCString()}</pubDate>
      <category>${esc(t.category)}</category>
      <description>${esc(t.description)}</description>
    </item>`
  )
  .join('\n')}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
