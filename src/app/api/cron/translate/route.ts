import { NextResponse } from 'next/server';
import { syncAll } from '@/lib/i18n/translateContent';

/**
 * Auto-translate cron (i18n, 2026-08-07).
 *
 * Finds every content string in the catalog that is missing a translation or
 * whose English source changed (source_hash mismatch) and re-translates it
 * with the professional LLM engine into all 7 locales — this is what makes
 * NEW content (new tools, new blog posts, new news items) appear translated
 * automatically, without any manual work.
 *
 * Runs incrementally (default 40 entities per locale per run) so each
 * invocation fits in the serverless window and the monthly cost stays
 * bounded; on first deploy it catches up over a few days, or instantly via
 * `npm run translate:content` from CI.
 *
 * Scheduled in vercel.json; also triggered from the GitHub Action
 * .github/workflows/translate.yml which commits the snapshot JSON so locales
 * work even on Vercel Hobby (no cron support).
 */
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(request: Request) {
  const rawAuth = request.headers.get('authorization') ?? '';
  const token = rawAuth.replace(/^bearer\s+/i, '').trim();
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET is not configured on the server.' }, { status: 503 });
  }
  if (!token || token !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '40', 10) || 40, 200);
  const localesParam = url.searchParams.get('locales');
  const locales = localesParam ? localesParam.split(',').filter(Boolean) : undefined;

  try {
    const stats = await syncAll({ maxPerLocale: limit, locales });
    return NextResponse.json({ ...stats, ranAt: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : 'Unknown translation error',
        ranAt: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
