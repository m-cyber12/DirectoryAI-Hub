import { ALL_TOOLS, hasVerifiedScore, computeOverall } from '@/data/tools';
import { SITE_NAME } from '@/config/site';

/**
 * Embeddable SVG badge — the backlink engine (audit idea 7.5).
 *
 * Founders embed this on their own site:
 *   <a href="https://…/tool/their-tool">
 *     <img src="https://…/badge/their-tool.svg" alt="Featured on CreatorAI Hub">
 *   </a>
 *
 * Each install is a dofollow link from a real SaaS domain, which is the only
 * link-building strategy that actually scales for a directory.
 *
 * Importantly, the badge reflects the tool's true verification level. A tool
 * we have not tested gets a "Listed on" badge, not a fabricated score — the
 * same honesty rule as the rest of the site, applied off-site where it
 * matters most.
 */

export const dynamic = 'force-static';

export function generateStaticParams() {
  return ALL_TOOLS.map((t) => ({ slug: `${t.slug}.svg` }));
}

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug: raw } = await params;
  const slug = raw.replace(/\.svg$/, '');
  const tool = ALL_TOOLS.find((t) => t.slug === slug);

  if (!tool) {
    return new Response('Not found', { status: 404 });
  }

  const tested = hasVerifiedScore(tool);
  const score = tested && tool.scores ? computeOverall(tool.scores) : null;

  const label = tested ? 'TESTED BY' : 'LISTED ON';
  const accent = tested ? '#34D399' : '#F7C948';
  const width = 260;
  const height = 64;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(
    tool.name
  )} ${tested ? `scored ${score?.toFixed(1)} out of 10` : 'listed'} on ${SITE_NAME}">
  <title>${esc(tool.name)} on ${SITE_NAME}</title>
  <rect width="${width}" height="${height}" rx="10" fill="#0E0F12"/>
  <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="9.5" fill="none" stroke="${accent}" stroke-opacity="0.35"/>
  <rect x="0" y="0" width="4" height="${height}" rx="2" fill="${accent}"/>

  <text x="20" y="24" font-family="system-ui,-apple-system,'Segoe UI',sans-serif"
        font-size="9" font-weight="700" letter-spacing="1.4" fill="${accent}">${label}</text>
  <text x="20" y="43" font-family="system-ui,-apple-system,'Segoe UI',sans-serif"
        font-size="16" font-weight="800" fill="#F4F4F5">CreatorAI Hub</text>
  <text x="20" y="56" font-family="system-ui,-apple-system,'Segoe UI',sans-serif"
        font-size="9" fill="#71717A">${esc(tool.category)}</text>

  ${
    score !== null
      ? `<g transform="translate(${width - 66}, 16)">
    <rect width="50" height="32" rx="7" fill="${accent}" fill-opacity="0.14" stroke="${accent}" stroke-opacity="0.5"/>
    <text x="25" y="16" text-anchor="middle" font-family="ui-monospace,'SF Mono',Menlo,monospace"
          font-size="15" font-weight="800" fill="${accent}">${score.toFixed(1)}</text>
    <text x="25" y="26" text-anchor="middle" font-family="system-ui,sans-serif"
          font-size="7" fill="${accent}" fill-opacity="0.8">OUT OF 10</text>
  </g>`
      : `<g transform="translate(${width - 66}, 22)">
    <circle cx="10" cy="10" r="9" fill="none" stroke="${accent}" stroke-opacity="0.5" stroke-width="1.5"/>
    <path d="M6 10.5l2.8 2.8L14.5 7.5" fill="none" stroke="${accent}" stroke-width="1.8"
          stroke-linecap="round" stroke-linejoin="round"/>
    <text x="26" y="14" font-family="system-ui,sans-serif" font-size="9"
          font-weight="600" fill="${accent}">Verified</text>
  </g>`
  }
</svg>`;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
