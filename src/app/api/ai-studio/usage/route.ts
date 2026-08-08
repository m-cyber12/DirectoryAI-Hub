import { NextResponse } from 'next/server';
import { requireAdminDb } from '@/lib/supabaseAdmin';

const TOOLS = new Set(['prompt-builder', 'thumbnail-brief', 'thumbnail-text', 'content-calendar', 'image-tools', 'subtitle-tools', 'audio-trimmer', 'video-inspector']);

async function currentUser(request: Request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const db = requireAdminDb();
  if (!db || !token) return { db, user: null };
  const { data } = await db.auth.getUser(token);
  return { db, user: data.user };
}

export async function GET(request: Request) {
  const { db, user } = await currentUser(request);
  if (!db) return NextResponse.json({ error: 'Studio service is not configured.' }, { status: 503 });
  if (!user) return NextResponse.json({ error: 'Sign in is required.' }, { status: 401 });
  const [{ data: entitlement }, { data: history }, { count }] = await Promise.all([
    db.from('studio_entitlements').select('plan,status,current_period_end').eq('user_id', user.id).maybeSingle(),
    db.from('studio_usage_events').select('id,tool_slug,created_at,input_summary,output_summary').eq('user_id', user.id).order('created_at', { ascending: false }).limit(30),
    db.from('studio_usage_events').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', new Date(new Date().setUTCHours(0, 0, 0, 0)).toISOString()),
  ]);
  const unlimited = entitlement?.plan === 'studio_unlimited' && entitlement.status === 'active' && (!entitlement.current_period_end || new Date(entitlement.current_period_end) > new Date());
  return NextResponse.json({ plan: unlimited ? 'studio_unlimited' : 'free', remaining: unlimited ? -1 : Math.max(0, 3 - (count ?? 0)), history: history ?? [] });
}

export async function POST(request: Request) {
  const { db, user } = await currentUser(request);
  if (!db) return NextResponse.json({ error: 'Studio service is not configured.' }, { status: 503 });
  if (!user) return NextResponse.json({ error: 'Sign in is required.' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  if (!TOOLS.has(body.toolSlug)) return NextResponse.json({ error: 'Unknown Studio utility.' }, { status: 400 });
  const { data, error } = await db.rpc('consume_studio_run', { p_user_id: user.id, p_tool_slug: body.toolSlug });
  if (error) return NextResponse.json({ error: 'Could not record this Studio use.' }, { status: 500 });
  const result = Array.isArray(data) ? data[0] : data;
  if (!result?.allowed) return NextResponse.json({ error: 'Daily free limit reached.', upgrade: true, remaining: 0 }, { status: 429 });
  return NextResponse.json({ eventId: result.event_id, remaining: result.remaining, unlimited: result.unlimited });
}

export async function PATCH(request: Request) {
  const { db, user } = await currentUser(request);
  if (!db || !user) return NextResponse.json({ error: 'Sign in is required.' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  if (typeof body.eventId !== 'string') return NextResponse.json({ error: 'Missing event.' }, { status: 400 });
  // Keep history bounded: only summaries and text output; never raw media bytes.
  const { error } = await db.from('studio_usage_events').update({ input_summary: body.input ?? {}, output_summary: body.output ?? {} }).eq('id', body.eventId).eq('user_id', user.id);
  if (error) return NextResponse.json({ error: 'Could not save history.' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
