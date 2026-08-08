import { NextResponse } from 'next/server';
import { ALL_TOOLS, CATEGORIES, hasVerifiedScore, computeOverall } from '@/data/tools';
import { searchToolsAdvanced } from '@/lib/search';
import { rateLimit, clientIp } from '@/lib/rateLimit';
import { SITE_URL, SITE_NAME } from '@/config/site';

export const dynamic = 'force-dynamic';

/**
 * Public read-only API — v1
 *
 * GET /api/v1/tools
 *   ?q=<query>            full-text search (typo & synonym tolerant)
 *   ?category=<name>      filter by category
 *   ?pricing=Free|Freemium|Paid|Free Trial
 *   ?tested=1             only hands-on-tested tools (the only ones with scores)
 *   ?tags=a,b             AND-filter on catalog tags (case-insensitive)
 *   ?limit=<1-100>        default 50
 *   ?offset=<n>           default 0
 *
 * Response: { meta: {...}, data: Tool[] }
 */
export async function GET(request: Request) {
  if (!rateLimit(`apiv1:${clientIp(request)}`, 60, 60_000)) {
    return NextResponse.json({ error: 'Rate limit exceeded: 60 requests/minute.' }, { status: 429 });
  }

  const url = new URL(request.url);
  const q = url.searchParams.get('q') || '';
  const category = url.searchParams.get('category');
  const pricing = url.searchParams.get('pricing');
  const tested = url.searchParams.get('tested') === '1';
  const tags = (url.searchParams.get('tags') || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '50', 10) || 50, 1), 100);
  const offset = Math.max(parseInt(url.searchParams.get('offset') || '0', 10) || 0, 0);

  let result = ALL_TOOLS;
  if (category) {
    if (!(CATEGORIES as readonly string[]).includes(category)) {
      return NextResponse.json({ error: `Unknown category. Valid: ${CATEGORIES.filter((c) => c !== 'All').join(', ')}` }, { status: 400 });
    }
    result = result.filter((t) => t.category === category);
  }
  if (pricing) result = result.filter((t) => t.pricing === pricing);
  if (tested) result = result.filter(hasVerifiedScore);
  if (tags.length > 0) {
    result = result.filter((t) => {
      const toolTags = t.tags.map((x) => x.toLowerCase());
      return tags.every((tag) => toolTags.includes(tag));
    });
  }
  if (q) result = searchToolsAdvanced(q, result, 300);

  const page = result.slice(offset, offset + limit).map((t) => ({
    name: t.name,
    slug: t.slug,
    tagline: t.tagline,
    description: t.description,
    url: t.url,
    logo: t.logo,
    category: t.category,
    pricing: t.pricing,
    startingPrice: t.startingPrice || null,
    verification_level: t.verificationLevel,
    /**
     * Integrity fix: a numeric score is only ever emitted for genuinely
     * hands-on-tested tools (the `t.scores` fallback chain previously leaked
     * the unverified seed rating). `rating` was removed entirely — the seed
     * value is an internal ordering hint, never a published rating.
     */
    verified_score: hasVerifiedScore(t) && t.scores ? computeOverall(t.scores) : null,
    pricing_source_url: t.pricingSourceUrl || null,
    pricing_checked_at: t.pricingCheckedAt || null,
    tags: t.tags,
    cataloguedAt: t.cataloguedAt || null,
    detailPage: `${SITE_URL}/tool/${t.slug}`,
  }));

  return NextResponse.json(
    {
      meta: {
        total: result.length,
        count: page.length,
        limit,
        offset,
        source: `${SITE_NAME} Public API v1`,
        docs: `${SITE_URL}/developers`,
        license: 'Free for non-commercial use with attribution and a link back.',
      },
      data: page,
    },
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    }
  );
}
