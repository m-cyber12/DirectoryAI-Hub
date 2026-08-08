import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { ALL_TOOLS } from '@/data/tools';
import { rateLimit, clientIp } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

// GET /api/reviews?tool=<slug>
export async function GET(request: Request) {
  const tool = new URL(request.url).searchParams.get('tool');
  if (!tool) return NextResponse.json({ error: 'Missing tool parameter' }, { status: 400 });
  if (!supabase) return NextResponse.json([], { status: 200 });

  const { data, error } = await supabase
    .from('reviews')
    .select('id, tool_slug, rating, title, body, author_name, helpful_count, created_at')
    .eq('tool_slug', tool)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return NextResponse.json([], { status: 200 });
  return NextResponse.json(data, { status: 200 });
}

// POST /api/reviews — submit a review (auto-approved, flagged for moderation)
export async function POST(request: Request) {
  if (!rateLimit(`review:${clientIp(request)}`, 3, 10 * 60_000)) {
    return NextResponse.json({ error: 'Too many reviews — please try again later.' }, { status: 429 });
  }

  try {
    const { tool_slug, rating, title, body, author_name } = await request.json();
    // Bug fix — the client could previously pass any user_id in the body and
    // the review would be attributed to an arbitrary account. user_id must
    // always be derived from a valid server-side session, never trusted from
    // the request body. Guest reviews stay anonymous (null) until real auth is
    // wired up server-side.

    // validation
    if (!tool_slug || !ALL_TOOLS.some((t) => t.slug === tool_slug)) {
      return NextResponse.json({ error: 'Unknown tool' }, { status: 400 });
    }
    const r = Number(rating);
    if (!Number.isInteger(r) || r < 1 || r > 5) {
      return NextResponse.json({ error: 'Rating must be 1-5' }, { status: 400 });
    }
    if (typeof title !== 'string' || title.trim().length < 3 || title.length > 80) {
      return NextResponse.json({ error: 'Title must be 3-80 characters' }, { status: 400 });
    }
    if (typeof body !== 'string' || body.trim().length < 20 || body.length > 1200) {
      return NextResponse.json({ error: 'Review must be 20-1200 characters' }, { status: 400 });
    }
    const safeName = String(author_name || 'Anonymous Creator').slice(0, 40);

    if (!supabaseAdmin) {
      // Never pretend a community contribution was saved when persistence is absent.
      return NextResponse.json(
        { error: 'Reviews are temporarily unavailable while moderation storage is being configured.' },
        { status: 503 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('reviews')
      .insert([{
        tool_slug, rating: r, title: title.trim(), body: body.trim(),
        author_name: safeName, user_id: null, status: 'pending', helpful_count: 0,
      }])
      .select('id, tool_slug, rating, title, body, author_name, helpful_count, created_at')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, review: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
  }
}

// PATCH /api/reviews — { id, action: 'helpful' }
export async function PATCH(request: Request) {
  if (!rateLimit(`helpful:${clientIp(request)}`, 30, 60_000)) {
    return NextResponse.json({ error: 'Rate limited' }, { status: 429 });
  }
  try {
    const { id, action } = await request.json();
    if (action !== 'helpful' || !id) return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    if (!supabaseAdmin) return NextResponse.json({ error: 'Reviews are temporarily unavailable.' }, { status: 503 });
    await supabaseAdmin.rpc('increment_helpful', { review_id: id });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
