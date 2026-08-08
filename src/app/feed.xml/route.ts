import { BLOG_POSTS } from '@/data/posts';
import { ALL_TOOLS } from '@/data/tools';
import { CURATED_NEWS } from '@/data/news';
import { SITE_URL, SITE_NAME, SITE_TAGLINE } from '@/config/site';

/**
 * Audit fix 3.2 — /feed.xml returned 404. RSS is still a primary distribution
 * channel for directories: it feeds newsletter automation, aggregators and
 * (increasingly) AI crawlers looking for structured freshness signals.
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
  const posts = [...BLOG_POSTS].sort((a, b) => b.isoDate.localeCompare(a.isoDate));

  // Newest tools double as feed items — this is a directory, new listings are news.
  const newestTools = [...ALL_TOOLS]
    .filter((t) => t.launchDate)
    .sort((a, b) => (b.launchDate || '').localeCompare(a.launchDate || ''))
    .slice(0, 15);

  const items = [
    ...posts.map((p) => ({
      title: p.title,
      link: `${SITE_URL}/blog/${p.slug}`,
      guid: `${SITE_URL}/blog/${p.slug}`,
      date: new Date(p.isoDate).toUTCString(),
      description: p.excerpt,
      category: p.category,
    })),
    ...CURATED_NEWS.map((n) => ({
      title: n.title,
      link: `${SITE_URL}/news/${n.slug}`,
      guid: `${SITE_URL}/news/${n.slug}`,
      date: new Date(n.publishedAt).toUTCString(),
      description: n.excerpt,
      category: n.category,
    })),
    ...newestTools.map((t) => ({
      title: `${t.name} — ${t.tagline}`,
      link: `${SITE_URL}/tool/${t.slug}`,
      guid: `${SITE_URL}/tool/${t.slug}`,
      date: new Date(t.launchDate || '2026-01-01').toUTCString(),
      description: t.description,
      category: t.category,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(`${SITE_NAME} — ${SITE_TAGLINE}`)}</title>
    <link>${SITE_URL}</link>
    <description>${esc(
      'New AI tools for video creators, hands-on tests, price changes and shutdown notices.'
    )}</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
${items
  .map(
    (i) => `    <item>
      <title>${esc(i.title)}</title>
      <link>${i.link}</link>
      <guid isPermaLink="true">${i.guid}</guid>
      <pubDate>${i.date}</pubDate>
      <category>${esc(i.category)}</category>
      <description>${esc(i.description)}</description>
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
