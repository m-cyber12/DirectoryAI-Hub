import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { rateLimit, clientIp } from '@/lib/rateLimit';
import { ALL_TOOLS } from '@/data/tools';

/**
 * Founder Claim form backend (audit fix 2.2).
 *
 * Before, the form only did setTimeout + a fake success screen and saved
 * nothing. Now a real POST stores the claim in the `founder_claims` table
 * (pending) via the service role, and the admin panel can review it.
 *
 * We deliberately do NOT claim "we emailed you a verification link" here,
 * because domain ownership verification is not wired up yet. The honest copy
 * tells the founder their claim is recorded and that the team will verify
 * ownership before granting a badge.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(request: Request) {
  if (!rateLimit(`founder-claim:${clientIp(request)}`, 3, 10 * 60_000)) {
    return NextResponse.json({ error: 'Too many attempts — please try again later.' }, { status: 429 });
  }

  try {
    const { tool_slug, email, role, notes, willEmbedBadge } = await request.json();

    if (!tool_slug || !ALL_TOOLS.some((t) => t.slug === tool_slug)) {
      return NextResponse.json({ error: 'Please choose a listed tool.' }, { status: 400 });
    }
    if (typeof email !== 'string' || !EMAIL_RE.test(email) || email.length > 254) {
      return NextResponse.json({ error: 'Please provide a valid company email.' }, { status: 400 });
    }
    const safeRole = ['Founder / CEO', 'Co-Founder', 'Head of Growth / Marketing', 'Product Manager'].includes(role)
      ? role
      : 'Founder / CEO';
    const safeNotes = typeof notes === 'string' ? notes.slice(0, 2000) : '';

    if (!supabaseAdmin) {
      // Honest failure, never a fake success.
      return NextResponse.json(
        {
          error:
            'The founder claim service is not live yet. Please email us instead — no database has been configured to store your claim.',
        },
        { status: 503 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('founder_claims')
      .insert([
        {
          tool_slug,
          company_email: email.toLowerCase().trim(),
          role: safeRole,
          notes: safeNotes,
          will_embed_badge: !!willEmbedBadge,
          status: 'pending',
        },
      ])
      .select('id, tool_slug, status, created_at')
      .single();

    if (error) {
      return NextResponse.json({ error: 'Could not record your claim, please try again.' }, { status: 500 });
    }

    return NextResponse.json(
      {
        success: true,
        claim: data,
        message:
          'Your claim has been recorded. Our team will verify you own this tool before granting a badge — we will reply to your company email.',
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
