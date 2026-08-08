import { NextResponse } from 'next/server';
import { runNewsIngest } from '@/lib/newsIngest';
import { autoTranslateNews } from '@/lib/i18n/translateContent';

/**
 * AI News Aggregator — auto-refresh (idea #13).
 *
 * A cron-protected endpoint that pulls the configured RSS feeds, optionally
 * writes an AI summary for each item, and stores survivors as PENDING in
 * `news_items` (they publish only after an editor approves them in
 * /admin → News Queue). The whole pipeline lives in lib/newsIngest.ts and is
 * shared with the admin panel's "Ingest now" button.
 *
 * Env:
 *   - CRON_SECRET           required (Authorization: Bearer <secret>)
 *   - SUPABASE_SERVICE_ROLE_KEY  required to persist (Supabase)
 *   - OPENAI_API_KEY        optional — enables AI summary generation
 *
 * Scheduled daily in vercel.json (Hobby plan allows once per day; use the admin
 * panel's "Ingest now" button for on-demand refreshes).
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(request: Request) {
  // v2.8.2: tolerant scheme parsing — "bearer x" (lowercase, as typed in
  // cron-job.org) and "Bearer x" are both valid; the token itself must match.
  const rawAuth = request.headers.get('authorization') ?? '';
  const token = rawAuth.replace(/^bearer\s+/i, '').trim();
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET is not configured on the server.' }, { status: 503 });
  }
  if (!token || token !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await runNewsIngest();
  if (!result.ok && result.fetched === 0) {
    // The feeds themselves were unreachable — a real failure worth an alert.
    return NextResponse.json(result, { status: 502 });
  }

  // i18n (2026-08-07): translate freshly ingested items into all locales
  // right away (bounded, best-effort). Anything beyond the per-run budget is
  // picked up by the daily /api/cron/translate.
  let translated = 0;
  if (result.insertedNew > 0 && result.items) {
    try {
      translated = await autoTranslateNews(result.items);
    } catch {
      // Never let translation failures break the news refresh.
    }
  }

  // "Nothing passed the gate" or "nothing new to insert" is a SUCCESS for a
  // cron (v2.8.3): returning 404 here made cron-job.org count failures and
  // auto-disable the job. The note explains what happened.
  return NextResponse.json({
    ...result,
    autoTranslatedFields: translated,
    refreshedAt: new Date().toISOString(),
  });
}
