import { NextResponse } from 'next/server';
import { isAdminAuthorized } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { ALL_TOOLS } from '@/data/tools';

export const dynamic = 'force-dynamic';

/**
 * v2.8 admin upgrade: one dashboard payload for the Overview tab.
 * Catalog-side numbers come from the static data; DB-side numbers from
 * Supabase when configured (graceful zeros otherwise).
 */
export async function GET() {
  if (!(await isAdminAuthorized())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const catalog = {
    total: ALL_TOOLS.length,
    handsOnTested: ALL_TOOLS.filter((t) => t.verificationLevel === 'hands-on-tested').length,
    pricingVerified: ALL_TOOLS.filter((t) => t.verificationLevel === 'pricing-verified').length,
    listedOnly: ALL_TOOLS.filter((t) => t.verificationLevel === 'listed-only').length,
  };

  const db = {
    configured: Boolean(supabaseAdmin),
    submissionsPending: 0,
    reviewsPending: 0,
    newsPending: 0,
    newsApproved: 0,
    newsletterConfirmed: 0,
    newsletterWaiting: 0,
    poll: { writing: 0, editing: 0, voiceover: 0, thumbnails: 0 },
  };

  if (supabaseAdmin) {
    const count = async (table: string, col?: string, val?: unknown) => {
      let q = supabaseAdmin!.from(table).select('id', { count: 'exact', head: true });
      if (col) q = q.eq(col, val);
      const { count: n } = await q;
      return n ?? 0;
    };
    try {
      db.submissionsPending = await count('submissions', 'status', 'pending');
      db.reviewsPending = await count('reviews', 'status', 'pending');
      db.newsPending = await count('news_items', 'approved', false);
      db.newsApproved = await count('news_items', 'approved', true);
      db.newsletterConfirmed = await count('newsletter_subscribers', 'confirmed', true);
      db.newsletterWaiting = await count('newsletter_subscribers', 'confirmed', false);
      const { data: poll } = await supabaseAdmin.from('stark_poll').select('option_key, votes');
      for (const row of poll ?? []) {
        if (row.option_key === 'writing') db.poll.writing = Number(row.votes) || 0;
        if (row.option_key === 'editing') db.poll.editing = Number(row.votes) || 0;
        if (row.option_key === 'voiceover') db.poll.voiceover = Number(row.votes) || 0;
        if (row.option_key === 'thumbnails') db.poll.thumbnails = Number(row.votes) || 0;
      }
    } catch {
      /* tables may pre-migration: keep zeros */
    }
  }

  return NextResponse.json({ catalog, db });
}
