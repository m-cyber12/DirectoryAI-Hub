import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { rateLimit, clientIp } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

const OPTIONS = ['ironman', 'doom'] as const;
type OptionKey = (typeof OPTIONS)[number];

/**
 * GET  /api/poll          → { configured, counts: { ironman, doom } }
 * POST /api/poll {choice} → increment (rate-limited; service role writes)
 *
 * Backs the Iron Man easter-egg poll. Without Supabase the client falls back
 * to per-browser counts and labels them as such.
 */
export async function GET() {
  if (!supabaseAdmin) {
    return NextResponse.json({ configured: false, counts: { ironman: 0, doom: 0 } });
  }
  const { data, error } = await supabaseAdmin
    .from('stark_poll')
    .select('option_key, votes');
  if (error) return NextResponse.json({ configured: false, counts: { ironman: 0, doom: 0 } });
  const counts: Record<string, number> = { ironman: 0, doom: 0 };
  for (const row of data ?? []) counts[row.option_key] = Number(row.votes) || 0;
  return NextResponse.json({ configured: true, counts });
}

export async function POST(request: Request) {
  if (!rateLimit(`poll:${clientIp(request)}`, 10, 60_000)) {
    return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 });
  }
  if (!supabaseAdmin) {
    return NextResponse.json({ configured: false }, { status: 503 });
  }
  let choice: unknown;
  try {
    choice = ((await request.json()) as { choice?: unknown }).choice;
  } catch {
    return NextResponse.json({ error: 'Invalid body.' }, { status: 400 });
  }
  if (!OPTIONS.includes(choice as OptionKey)) {
    return NextResponse.json({ error: 'Unknown option.' }, { status: 400 });
  }

  // Increment under the service role (anon has no write access).
  const { data } = await supabaseAdmin
    .from('stark_poll')
    .select('votes')
    .eq('option_key', choice)
    .single();
  const next = (Number(data?.votes) || 0) + 1;
  const { error: upErr } = await supabaseAdmin
    .from('stark_poll')
    .update({ votes: next, updated_at: new Date().toISOString() })
    .eq('option_key', choice);
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  const { data: all } = await supabaseAdmin.from('stark_poll').select('option_key, votes');
  const counts: Record<string, number> = { ironman: 0, doom: 0 };
  for (const row of all ?? []) counts[row.option_key] = Number(row.votes) || 0;
  return NextResponse.json({ configured: true, counts });
}
