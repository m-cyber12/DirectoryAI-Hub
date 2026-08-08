import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { rateLimit, clientIp } from '@/lib/rateLimit';

/**
 * Search query logging (audit fix 4.5).
 *
 * "No search data is stored — yet what users are looking for is the single
 * most valuable asset a directory has." Correct: zero-result searches tell you
 * exactly which tools to add next, and popular queries tell you what to test
 * and write about. It also powers a public "most searched" module, which is
 * both useful UX and fresh, self-updating SEO content.
 *
 * Privacy: only the query string, result count and coarse category are
 * recorded. No IP, no user agent, no identifier of any kind — so this needs no
 * cookie consent and cannot be tied back to a person.
 */

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  // Generous limit: this fires on genuine searches, not keystrokes.
  if (!rateLimit(`searchlog:${clientIp(request)}`, 60, 60_000)) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  try {
    const { query, results, category } = await request.json();

    if (typeof query !== 'string') {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const cleaned = query.trim().slice(0, 60);
    // Ignore noise: single characters and empty strings tell us nothing.
    if (cleaned.length < 2) return NextResponse.json({ ok: true }, { status: 200 });

    if (supabaseAdmin) {
      void supabaseAdmin
        .from('search_log')
        .insert([
          {
            query: cleaned,
            results: Number.isFinite(results) ? Math.max(0, Math.min(9999, Number(results))) : 0,
            category: typeof category === 'string' ? category.slice(0, 60) : null,
          },
        ])
        .then(
          () => undefined,
          () => undefined
        );
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    // Logging must never surface an error to the user.
    return NextResponse.json({ ok: true }, { status: 200 });
  }
}
