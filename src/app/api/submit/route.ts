import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { rateLimit, clientIp } from '@/lib/rateLimit';
import { CATEGORIES } from '@/data/tools';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const URL_RE = /^https?:\/\/[^\s]+\.[^\s]{2,}$/i;

export async function POST(request: Request) {
  if (!rateLimit(`submit:${clientIp(request)}`, 3, 10 * 60_000)) {
    return NextResponse.json({ error: 'Too many submissions — please try again in a few minutes.' }, { status: 429 });
  }

  try {
    const body = await request.json();
    const { name, url, tagline, category, pricing, founderEmail, willAddBadge } = body;

    // validation
    if (!name || typeof name !== 'string' || name.trim().length < 2 || name.length > 60) {
      return NextResponse.json({ error: 'Tool name must be 2-60 characters.' }, { status: 400 });
    }
    if (!url || typeof url !== 'string' || !URL_RE.test(url)) {
      return NextResponse.json({ error: 'Please provide a valid http(s) URL.' }, { status: 400 });
    }
    if (!tagline || typeof tagline !== 'string' || tagline.trim().length < 5 || tagline.length > 90) {
      return NextResponse.json({ error: 'Tagline must be 5-90 characters.' }, { status: 400 });
    }
    if (!founderEmail || typeof founderEmail !== 'string' || !EMAIL_RE.test(founderEmail)) {
      return NextResponse.json({ error: 'Please provide a valid contact email.' }, { status: 400 });
    }
    const safeCategory = (CATEGORIES as readonly string[]).includes(category) ? category : 'Video Editing & VFX';
    const safePricing = ['Free', 'Freemium', 'Paid', 'Free Trial'].includes(pricing) ? pricing : 'Freemium';

    if (supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('submissions')
        .insert([{
          tool_name: name.trim(),
          website_url: url.trim(),
          tagline: tagline.trim(),
          category: safeCategory,
          pricing: safePricing,
          founder_email: founderEmail.trim().toLowerCase(),
          will_add_badge: !!willAddBadge,
          status: 'pending',
        }])
        .select();

      if (error) {
        console.error('Supabase Error:', error);
        return NextResponse.json({ error: 'Database insert failed', details: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, message: 'Tool submitted successfully!', data }, { status: 201 });
    }

    // Fallback if Supabase keys aren't set yet.
    // Bug fix — this used to return success:true in "Mock Mode" and the
    // frontend told the user "we got it, we'll email you" while the data was
    // silently dropped. A silent success is the worst kind of failure, so we
    // now return an explicit 503 and the form must surface it as an error.
    return NextResponse.json(
      {
        error:
          'Submission service is not live yet. Please email us instead: no database has been configured to store your submission.',
      },
      { status: 503 }
    );
  } catch {
    return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
  }
}
