import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { SITE_URL } from '@/config/site';

/**
 * Double opt-in confirmation and one-click unsubscribe (audit fix 6.5).
 *
 * GET /api/newsletter/confirm?token=…   confirms a subscription
 * GET /api/newsletter/confirm?unsub=…   unsubscribes
 *
 * Both are GET so they work as plain links inside an email client.
 */

export const dynamic = 'force-dynamic';

function page(title: string, message: string, ok = true) {
  const html = `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>${title}</title>
<style>
  body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0E0F12;color:#F4F4F5;
       font-family:system-ui,-apple-system,'Segoe UI',sans-serif;padding:24px}
  .card{max-width:480px;text-align:center;border:1px solid rgba(255,255,255,.1);
        background:#15171C;border-radius:16px;padding:40px}
  h1{font-size:22px;margin:0 0 12px;color:${ok ? '#34D399' : '#FB7185'}}
  p{font-size:15px;line-height:1.6;color:#A1A1AA;margin:0 0 24px}
  a{display:inline-block;background:#F7C948;color:#000;text-decoration:none;
    font-weight:700;font-size:14px;padding:10px 20px;border-radius:10px}
</style></head>
<body><div class="card">
  <h1>${title}</h1><p>${message}</p>
  <a href="${SITE_URL}">Back to CreatorAI Hub</a>
</div></body></html>`;
  return new NextResponse(html, {
    status: ok ? 200 : 400,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  const unsub = url.searchParams.get('unsub');

  if (!supabaseAdmin) {
    return page('Not available', 'The subscription service is not configured yet.', false);
  }

  // ── Unsubscribe ──────────────────────────────────────────────────────
  if (unsub) {
    const { data, error } = await supabaseAdmin
      .from('newsletter_subscribers')
      .update({ unsubscribed_at: new Date().toISOString(), confirmed: false })
      .eq('unsub_token', unsub)
      .select('email')
      .maybeSingle();

    if (error || !data) {
      return page('Link not recognised', 'That unsubscribe link is invalid or already used.', false);
    }
    return page(
      'You are unsubscribed',
      'You will not receive any further emails from us. Sorry to see you go.'
    );
  }

  // ── Confirm ──────────────────────────────────────────────────────────
  if (!token) {
    return page('Missing token', 'This confirmation link is incomplete.', false);
  }

  const { data, error } = await supabaseAdmin
    .from('newsletter_subscribers')
    .update({
      confirmed: true,
      confirmed_at: new Date().toISOString(),
      confirm_token: null,
    })
    .eq('confirm_token', token)
    .select('email')
    .maybeSingle();

  if (error || !data) {
    return page(
      'Link not recognised',
      'That confirmation link is invalid or has already been used. Try subscribing again.',
      false
    );
  }

  return page(
    'Subscription confirmed',
    'You are on the list. We will email you when a tool we have tested changes materially, a price moves, or a service shuts down — and nothing else.'
  );
}
