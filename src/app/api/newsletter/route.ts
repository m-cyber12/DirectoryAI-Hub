import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { rateLimit, clientIp } from '@/lib/rateLimit';
import { SITE_URL } from '@/config/site';
import { sendConfirmEmail } from '@/lib/email';

/**
 * Audit fixes 1.3, 6.5.
 *
 * Before: emails were inserted with the public anon key straight into
 * newsletter_subscribers (which had `with check (true)`, so anyone could spam
 * it directly), there was no confirmation step, no unsubscribe path and no
 * welcome mail. The UI promised a "Founding 500" badge with no system behind
 * it. Storing addresses without confirmation or an opt-out is a GDPR and
 * CAN-SPAM problem.
 *
 * Now: writes use the service role, a confirmation token is generated, and
 * subscribers stay unconfirmed until they click the link. Tokens for
 * unsubscribe are issued up front so every future email can carry a one-click
 * opt-out.
 *
 * NOTE: sending the actual email requires an ESP. Wire one up (Resend, Loops,
 * Beehiiv, ConvertKit) where marked below — until then the confirm URL is
 * returned in development so the flow is testable end to end.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(request: Request) {
  if (!rateLimit(`newsletter:${clientIp(request)}`, 5, 10 * 60_000)) {
    return NextResponse.json(
      { error: 'Too many attempts — please try again later.' },
      { status: 429 }
    );
  }

  try {
    const { email, source, website } = await request.json();

    // Honeypot: bots fill hidden fields. Respond as success so they don't retry.
    if (typeof website === 'string' && website.length > 0) {
      return NextResponse.json({ success: true, message: 'Please check your inbox.' }, { status: 201 });
    }

    if (typeof email !== 'string' || !EMAIL_RE.test(email) || email.length > 254) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    const normalized = email.toLowerCase().trim();

    if (!supabaseAdmin) {
      return NextResponse.json(
        {
          success: true,
          mode: 'waitlist',
          message: 'The newsletter is not live yet. Please check back when subscriptions open.',
        },
        { status: 201 }
      );
    }

    const confirmToken = randomBytes(32).toString('hex');
    const unsubToken = randomBytes(32).toString('hex');

    const { error } = await supabaseAdmin.from('newsletter_subscribers').insert([
      {
        email: normalized,
        source: String(source || 'homepage').slice(0, 40),
        confirmed: false,
        confirm_token: confirmToken,
        unsub_token: unsubToken,
      },
    ]);

    if (error) {
      // Already subscribed — never reveal whether an address is on the list.
      if (error.code === '23505') {
        return NextResponse.json(
          { success: true, message: 'Please check your inbox to confirm your subscription.' },
          { status: 200 }
        );
      }
      return NextResponse.json(
        { error: 'Could not subscribe right now, please try again.' },
        { status: 500 }
      );
    }

    const confirmUrl = `${SITE_URL}/api/newsletter/confirm?token=${confirmToken}`;

    // Audit fix 2.10 — actually send the confirmation email via Resend. If no
    // ESP is configured we do NOT claim an email was sent; we return an honest
    // waitlist message instead (the double opt-in flow stays intact for when
    // delivery is turned on).
    const { sent, error: sendError } = await sendConfirmEmail(normalized, confirmUrl);

    if (sendError) {
      console.error('[newsletter] confirm email send failed:', sendError);
    }

    if (!sent) {
      return NextResponse.json(
        {
          success: true,
          mode: 'waitlist',
          message:
            'You are on the launch waitlist. No confirmation email will be sent until newsletter delivery is configured.',
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Almost there — check your inbox and confirm your subscription.',
        ...(process.env.NODE_ENV !== 'production' && { devConfirmUrl: confirmUrl }),
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
