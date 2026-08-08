import { NextResponse } from 'next/server';
import { ALL_TOOLS } from '@/data/tools';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { rateLimit, clientIp } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/tools/:slug/price-history
 *
 * Critique §11-7 ("price history charts — a killer unique feature").
 * Returns the recorded price points for one tool from the `price_history`
 * table (migration 0004). Points are appended with scripts/record-price.mjs
 * whenever an editor re-checks a vendor pricing page.
 *
 * Honest by construction: when nothing is recorded, the response says so —
 * no synthetic history is ever invented.
 */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (!rateLimit(`pricehist:${clientIp(request)}`, 60, 60_000)) {
    return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 });
  }

  const { slug } = await params;
  const tool = ALL_TOOLS.find((t) => t.slug === slug);
  if (!tool) {
    return NextResponse.json({ error: 'Unknown tool slug.' }, { status: 404 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json(
      {
        slug,
        configured: false,
        points: [],
        note: 'Price tracking is not configured on this deployment yet.',
      },
      { status: 200 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from('price_history')
    .select('starting_price, source_url, noticed_at')
    .eq('tool_slug', slug)
    .order('noticed_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    slug,
    configured: true,
    current: {
      startingPrice: tool.startingPrice ?? null,
      sourceUrl: tool.pricingSourceUrl ?? null,
      checkedAt: tool.pricingCheckedAt ?? null,
    },
    points: data ?? [],
  });
}
