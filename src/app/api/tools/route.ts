import { NextResponse } from 'next/server';
import { isAdminAuthorized } from '@/lib/adminAuth';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { ALL_TOOLS } from '@/data/tools';


/**
 * Bug fix — this legacy public GET endpoint returned raw database rows that
 * carried `rating`, `reviews_count`, `is_trending` and similar fabricated /
 * outdated popularity fields. That leaked scores the site deliberately does
 * not surface to users (and which the evidence-aware v1 API already strips).
 * The public response is now a clean, evidence-aware projection that omits
 * any invented score/popularity signal.
 */
const LEGACY_PUBLIC_FIELDS = new Set([
  'rating',
  'reviewsCount',
  'reviews_count',
  'ratingLabel',
  'isTrending',
  'is_trending',
  'metrics',
]);

function sanitizePublicTool(t: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(t)) {
    if (LEGACY_PUBLIC_FIELDS.has(k)) continue;
    out[k] = v;
  }
  return out;
}

export async function GET() {
  if (!supabase) {
    return NextResponse.json(ALL_TOOLS.map(sanitizePublicTool), { status: 200 });
  }

  try {
    const { data, error } = await supabase
      .from('tools')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return NextResponse.json(ALL_TOOLS.map(sanitizePublicTool), { status: 200 });
    }

    // Merge database tools with ALL_TOOLS so that if DB only has 10, all 20 appear!
    const dbSlugs = new Set(data.map((t: any) => t.slug));
    const merged = [
      ...data,
      ...ALL_TOOLS.filter((t) => !dbSlugs.has(t.slug)),
    ];

    return NextResponse.json(merged.map(sanitizePublicTool), { status: 200 });
  } catch (err) {
    return NextResponse.json(ALL_TOOLS.map(sanitizePublicTool), { status: 200 });
  }
}

export async function POST(request: Request) {
  if (!(await isAdminAuthorized())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const {
      name,
      slug,
      tagline,
      description,
      url,
      affiliate_url,
      logo,
      cover_image,
      category,
      pricing,
      is_featured,
      has_founder_badge,
      tags,
      metrics,
    } = body;

    const { data, error } = await supabaseAdmin
      .from('tools')
      .insert([
        {
          name,
          slug: slug || name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          tagline,
          description,
          url,
          affiliate_url: affiliate_url || null,
          logo:
            logo ||
            'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
          cover_image:
            cover_image ||
            'https://images.unsplash.com/photo-1626544827763-d516dce335e2?w=800&auto=format&fit=crop&q=80',
          category: category || 'Video Editing',
          pricing: pricing || 'Freemium',
          is_featured: !!is_featured,
          has_founder_badge: !!has_founder_badge,
          tags: tags || ['AI Tool', 'Video'],
          metrics: metrics || '10x Speed',
          status: 'approved',
        },
      ])
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  if (!(await isAdminAuthorized())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  try {
    const { id, ...updates } = await request.json();
    const { data, error } = await supabaseAdmin
      .from('tools')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  if (!(await isAdminAuthorized())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  try {
    const id = new URL(request.url).searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from('tools').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
