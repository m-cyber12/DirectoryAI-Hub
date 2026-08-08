import { NextResponse } from 'next/server';
import { ALL_TOOLS } from '@/data/tools';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * Weekly outbound link health check.
 *
 * Audit fix 1.5 — twelve links were broken at audit time. The root cause was
 * systematic: the generator prefixed every domain with "www.", which does not
 * resolve for most .ai domains. Nine were repaired by hand; three tools were
 * confirmed dead and moved to the graveyard.
 *
 * This prevents the problem recurring. Every directory competitor is full of
 * dead links; being the one that finds them first is a genuine differentiator
 * (audit idea 7.3), and it feeds the graveyard automatically.
 *
 * Scheduled from vercel.json: Mondays at 04:00 UTC.
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const TIMEOUT_MS = 12_000;
const CONCURRENCY = 10;

interface CheckResult {
  tool_slug: string;
  url: string;
  status_code: number;
  final_url: string | null;
  ok: boolean;
  error: string | null;
}

async function checkOne(slug: string, url: string): Promise<CheckResult> {
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        // Identify honestly so vendors can allowlist us rather than 403.
        'user-agent': 'CreatorAIHubBot/1.0 (+https://creatorsaicenter.vercel.app/about)',
        accept: 'text/html,application/xhtml+xml',
      },
    });
    return {
      tool_slug: slug,
      url,
      status_code: res.status,
      final_url: res.url || null,
      // 403/429 usually means bot protection, not a dead site — don't bury
      // a live tool because Cloudflare dislikes our user agent.
      ok: res.status < 400 || res.status === 403 || res.status === 429,
      error: null,
    };
  } catch (err) {
    return {
      tool_slug: slug,
      url,
      status_code: 0,
      final_url: null,
      ok: false,
      error: err instanceof Error ? err.message.slice(0, 200) : 'unknown error',
    };
  }
}

/** Bounded-concurrency map so we don't open 200 sockets at once. */
async function pool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await fn(items[index]);
    }
  });
  await Promise.all(workers);
  return results;
}

export async function GET(request: Request) {
  // Vercel Cron sends this header; a shared secret keeps the endpoint private.
  // Tolerant scheme parsing: "bearer x" and "Bearer x" both accepted.
  const rawAuth = request.headers.get('authorization') ?? '';
  const token = rawAuth.replace(/^bearer\s+/i, '').trim();
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return NextResponse.json(
      { error: 'CRON_SECRET is not configured on the server.' },
      { status: 503 }
    );
  }
  if (!token || token !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results = await pool(ALL_TOOLS, CONCURRENCY, (t) => checkOne(t.slug, t.url));
  const broken = results.filter((r) => !r.ok);

  if (supabaseAdmin) {
    // Chunked insert to stay well within payload limits.
    for (let i = 0; i < results.length; i += 100) {
      await supabaseAdmin.from('link_health').insert(results.slice(i, i + 100));
    }
  }

  return NextResponse.json({
    checked: results.length,
    broken: broken.length,
    brokenTools: broken.map((b) => ({
      slug: b.tool_slug,
      url: b.url,
      status: b.status_code,
      error: b.error,
    })),
    checkedAt: new Date().toISOString(),
    note:
      'Tools failing three consecutive weekly checks should be reviewed and, once confirmed dead, moved to src/data/graveyard.ts.',
  });
}
