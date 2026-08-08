import { NextResponse } from 'next/server';
import { isAdminAuthorized, requireCsrf } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * Admin editorial gate for auto-aggregated news (migration 0006).
 *
 * GET   /api/admin/news            → pending + approved items (newest first)
 * PATCH /api/admin/news            → { slug, action: 'approve' | 'reject' }
 *
 * approve sets approved = true (the item becomes eligible for /news);
 * reject deletes the row outright so it can never resurface.
 */

export async function GET() {
  if (!(await isAdminAuthorized())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!supabaseAdmin) return NextResponse.json([], { status: 200 });
  try {
    const { data, error } = await supabaseAdmin
      .from('news_items')
      .select('slug, title, excerpt, source, source_url, category, published_at, approved, ai_summarized')
      .order('published_at', { ascending: false })
      .limit(200);
    if (error) return NextResponse.json([], { status: 200 });
    return NextResponse.json(data || [], { status: 200 });
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}

export async function PATCH(request: Request) {
  if (!(await isAdminAuthorized())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!(await requireCsrf(request))) {
    return NextResponse.json({ error: 'Invalid or missing CSRF token' }, { status: 403 });
  }
  if (!supabaseAdmin) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  try {
    const { slug, action } = await request.json();
    if (!slug || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Expected { slug, action: "approve" | "reject" }' }, { status: 400 });
    }

    if (action === 'approve') {
      const { error } = await supabaseAdmin
        .from('news_items')
        .update({ approved: true })
        .eq('slug', slug);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ success: true, slug, approved: true }, { status: 200 });
    }

    const { error } = await supabaseAdmin.from('news_items').delete().eq('slug', slug);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, slug, rejected: true }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Bad request' }, { status: 400 });
  }
}
