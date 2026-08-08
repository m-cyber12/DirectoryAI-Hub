import { NextRequest, NextResponse } from 'next/server';
import { ALL_TOOLS } from '@/data/tools';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * Outbound click handler.
 *
 * Audit fixes:
 *  1.6 — affiliateUrl is only honoured when affiliateProgram is set to a real,
 *        approved network. Fifteen tools carried invented ?via=creatoraihub /
 *        ?ref=creatoraihub parameters for programs that were never joined:
 *        those links earned nothing while adding tracking noise to the vendor's
 *        URL. Until a program is genuinely approved we send readers to the
 *        clean canonical URL.
 *  1.3 — click logging moved to the service-role client. The anon key could
 *        previously write click_log directly from any browser, letting anyone
 *        flood the table and burn the Supabase quota.
 *  6.4 — the per-click console.log is gone from production.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = ALL_TOOLS.find((t) => t.slug === slug);

  if (!tool) {
    return NextResponse.redirect(new URL('/tools', request.url), { status: 302 });
  }

  const referer = request.headers.get('referer') || 'direct';

  if (process.env.NODE_ENV !== 'production') {
    console.log(`[click] ${tool.slug} ← ${referer}`);
  }

  // Only use an affiliate URL when the program is real (see audit 1.6).
  const useAffiliate = Boolean(tool.affiliateProgram && tool.affiliateUrl);
  const destination = useAffiliate ? tool.affiliateUrl! : tool.url;

  if (supabaseAdmin) {
    // Fire-and-forget: a logging failure must never block the redirect.
    void supabaseAdmin
      .from('click_log')
      .insert([
        {
          tool_slug: tool.slug,
          referer: referer.slice(0, 500),
          is_affiliate: useAffiliate,
        },
      ])
      .then(
        () => undefined,
        () => undefined
      );
  }

  const response = NextResponse.redirect(destination, { status: 302 });
  // Outbound clicks must never be cached by a CDN.
  response.headers.set('Cache-Control', 'no-store, max-age=0');
  return response;
}
