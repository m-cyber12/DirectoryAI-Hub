import { NextResponse } from 'next/server';
import { isAdminAuthorized, requireCsrf } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';


export async function GET() {
  if (!(await isAdminAuthorized())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!supabaseAdmin) {
    return NextResponse.json([], { status: 200 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      return NextResponse.json([], { status: 200 });
    }
    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: Request) {
  if (!(await isAdminAuthorized())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!(await requireCsrf(request))) {
    return NextResponse.json({ error: 'Invalid or missing CSRF token' }, { status: 403 });
  }
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  try {
    const { action, submission } = await request.json();
    if (action === 'approve') {
      await supabaseAdmin
        .from('submissions')
        .update({ status: 'approved' })
        .eq('id', submission.id);

      const slug = `${submission.tool_name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')}-${Math.floor(Math.random() * 1000)}`;

      await supabaseAdmin.from('tools').insert([
        {
          name: submission.tool_name,
          slug,
          tagline: submission.tagline,
          description: `${submission.tool_name} is an innovative AI tool for ${submission.category}.`,
          url: submission.website_url,
          logo:
            'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
          cover_image:
            'https://images.unsplash.com/photo-1626544827763-d516dce335e2?w=800&auto=format&fit=crop&q=80',
          category: submission.category || 'Video Editing',
          pricing: submission.pricing || 'Freemium',
          is_featured: false,
          has_founder_badge: !!submission.will_add_badge,
          tags: ['Community', 'AI Tool'],
          status: 'approved',
        },
      ]);
      return NextResponse.json({ success: true, message: 'Approved!' }, { status: 200 });
    } else if (action === 'reject') {
      await supabaseAdmin
        .from('submissions')
        .update({ status: 'rejected' })
        .eq('id', submission.id);
      return NextResponse.json({ success: true, message: 'Rejected' }, { status: 200 });
    }
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
