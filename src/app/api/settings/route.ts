import { NextResponse } from 'next/server';
import { isAdminAuthorized, requireCsrf } from '@/lib/adminAuth';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * Audit fixes 1.3, 6.2.
 *
 * Two problems here:
 *
 * 1. SECURITY — writes used the public anon client. Combined with the
 *    "Anyone can update site settings" RLS policy, any visitor could rewrite
 *    site copy. Writes now go through supabaseAdmin (service role) and are
 *    gated on a verified admin session; migration 0003 removes the anon
 *    write policy so the direct path is closed too.
 *
 * 2. DEAD SETTINGS — the defaults below used to include hero_title_main
 *    ("THE BOLD AI STUDIO"), hero_badge ("Inspired by Bold Studio •
 *    MotionSites.ai 3D Edition"), theme_accent, grid_layout, card_style and
 *    hero_animation. None of these affected the live site: their only
 *    consumer was the orphaned Hero3D component. The admin panel spent
 *    hundreds of lines editing values nothing rendered, and the badge still
 *    named the template the site was copied from.
 *
 *    Only settings that are genuinely wired to the UI remain. Keys are
 *    allowlisted so the endpoint cannot be used to write arbitrary rows.
 */

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/** Only these keys exist. Anything else is rejected. */
const ALLOWED_KEYS = ['announcement_title', 'announcement_desc', 'announcement_enabled'] as const;
type SettingKey = (typeof ALLOWED_KEYS)[number];

const DEFAULT_SETTINGS: Record<SettingKey, string> = {
  announcement_title: 'Building an AI video tool? Get listed.',
  announcement_desc:
    'Submit your tool for review. If we test it hands-on, you get a full evidence-backed listing.',
  announcement_enabled: 'false',
};

const NO_STORE = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
} as const;

export async function GET() {
  if (!supabase) return NextResponse.json(DEFAULT_SETTINGS, { status: 200 });

  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', ALLOWED_KEYS as unknown as string[]);

    if (error || !data) return NextResponse.json(DEFAULT_SETTINGS, { status: 200 });

    const settings: Record<string, string> = { ...DEFAULT_SETTINGS };
    for (const row of data) {
      if ((ALLOWED_KEYS as readonly string[]).includes(row.key)) {
        settings[row.key] = row.value;
      }
    }
    return NextResponse.json(settings, { status: 200, headers: NO_STORE });
  } catch {
    return NextResponse.json(DEFAULT_SETTINGS, { status: 200 });
  }
}

export async function POST(request: Request) {
  if (!(await isAdminAuthorized())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!(await requireCsrf(request))) {
    return NextResponse.json({ error: 'Invalid or missing CSRF token' }, { status: 403 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: 'SUPABASE_SERVICE_ROLE_KEY is not configured — settings cannot be saved.' },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();

    /**
     * Accepts either a single {key, value} or a full object of settings.
     * Audit fix 6.2 — the admin panel previously fired one POST per key in a
     * loop, producing 12+ sequential round trips to save one form.
     */
    const updates: { key: string; value: string }[] = Array.isArray(body?.settings)
      ? body.settings
      : body?.key !== undefined
        ? [{ key: body.key, value: String(body.value ?? '') }]
        : Object.entries(body ?? {}).map(([key, value]) => ({ key, value: String(value) }));

    const valid = updates.filter((u) => (ALLOWED_KEYS as readonly string[]).includes(u.key));

    if (valid.length === 0) {
      return NextResponse.json(
        { error: `No valid settings. Allowed keys: ${ALLOWED_KEYS.join(', ')}` },
        { status: 400 }
      );
    }

    // Single batched upsert instead of one request per key.
    const { error } = await supabaseAdmin
      .from('site_settings')
      .upsert(
        valid.map((u) => ({ key: u.key, value: u.value.slice(0, 2000) })),
        { onConflict: 'key' }
      );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Audit trail (migration 0004) — the admin panel had no record of changes.
    void supabaseAdmin
      .from('admin_audit_log')
      .insert([{ action: 'settings.update', entity: 'site_settings', detail: { keys: valid.map((v) => v.key) } }])
      .then(
        () => undefined,
        () => undefined
      );

    return NextResponse.json({ success: true, updated: valid.length }, { status: 200, headers: NO_STORE });
  } catch {
    return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
  }
}
