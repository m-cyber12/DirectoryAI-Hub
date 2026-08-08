import 'server-only';
import { Resend } from 'resend';
import { SITE_NAME, SITE_URL } from '@/config/site';

/**
 * Email delivery for the newsletter (audit fix 2.10).
 *
 * The double opt-in flow was already built — subscribers were stored
 * unconfirmed with a token, and the confirm/unsubscribe links existed — but
 * the confirmation email was never actually sent. That made the "check your
 * inbox" copy a lie and left subscribers in a limbo state.
 *
 * This module sends the confirmation email through Resend. It is a no-op
 * (returns `sent: false`) when no RESEND_API_KEY is configured, so the
 * newsletter still degrades gracefully to an honest "launch waitlist"
 * message instead of promising an email that will never arrive.
 */

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM_EMAIL = process.env.NEWSLETTER_FROM_EMAIL || 'CreatorAI Hub <onboarding@resend.dev>';

/**
 * Send the double opt-in confirmation email.
 * Returns `{ sent: boolean }` — sent is false when no ESP is configured.
 */
export async function sendConfirmEmail(to: string, confirmUrl: string): Promise<{ sent: boolean; error?: string }> {
  if (!resend) return { sent: false };

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Confirm your subscription to ${SITE_NAME}`,
    html: `
      <div style="background:#0E0F12;color:#F4F4F5;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;padding:24px">
        <div style="max-width:480px;margin:0 auto;background:#15171C;border:1px solid rgba(255,255,255,.1);border-radius:16px;padding:32px">
          <h1 style="color:#F7C948;font-size:20px;margin:0 0 12px">You're almost subscribed</h1>
          <p style="color:#A1A1AA;font-size:15px;line-height:1.6;margin:0 0 8px">
            Thanks for joining the ${SITE_NAME} launch list. Tap the button below to confirm — we only email when a
            tool we have <strong>tested</strong> changes materially, a price moves, or a service shuts down.
          </p>
          <p style="margin:24px 0;text-align:center">
            <a href="${confirmUrl}" style="display:inline-block;background:#F7C948;color:#000;text-decoration:none;font-weight:700;font-size:14px;padding:12px 22px;border-radius:10px">
              Confirm my subscription
            </a>
          </p>
          <p style="color:#71717A;font-size:12px;margin:0">
            If you didn't request this, you can ignore this email. <a href="${SITE_URL}" style="color:#F7C948">${SITE_NAME}</a>
          </p>
        </div>
      </div>
    `,
  });

  if (error) return { sent: false, error: error.message };
  return { sent: true };
}
