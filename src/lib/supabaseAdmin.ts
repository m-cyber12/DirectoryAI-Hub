import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Server-only Supabase client using the SERVICE ROLE key.
 *
 * Audit fix 1.3 — the real security vulnerability.
 *
 * site-settings.sql shipped these policies:
 *     CREATE POLICY "Anyone can update site settings"
 *       ON public.site_settings FOR UPDATE USING (true);
 *     CREATE POLICY "Anyone can insert site settings"
 *       ON public.site_settings FOR INSERT WITH CHECK (true);
 *
 * NEXT_PUBLIC_SUPABASE_ANON_KEY is visible to everyone in the browser bundle,
 * so any visitor could rewrite hero_title_main, announcement_title or
 * footer_copyright to spam, malware links or worse — straight from the
 * console. The same USING(true) pattern let anyone insert reviews with
 * status:'approved' (bypassing both the rate limit and moderation), flood
 * click_log to burn the Supabase quota, and spam newsletter_subscribers.
 *
 * The fix has two halves and BOTH are required:
 *   1. supabase/migrations/0003_lock_down_rls.sql revokes anon write access.
 *   2. Every write now goes through this client, from server code only.
 *
 * `import 'server-only'` makes the build fail loudly if this is ever pulled
 * into a "use client" component, which would leak the service role key.
 *
 * Env: SUPABASE_SERVICE_ROLE_KEY — note there is NO NEXT_PUBLIC_ prefix, and
 * there must never be one.
 */

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const supabaseAdmin: SupabaseClient | null =
  url && serviceRoleKey
    ? createClient(url, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

/** True when server-side writes are actually possible. */
export const hasAdminDb = () => supabaseAdmin !== null;

/**
 * Guard for API routes that must write. Returns a helpful message in dev
 * rather than a confusing 500 when the key is missing.
 */
export function requireAdminDb(): SupabaseClient | null {
  if (!supabaseAdmin && process.env.NODE_ENV !== 'production') {
    console.warn(
      '[supabaseAdmin] SUPABASE_SERVICE_ROLE_KEY is not set — database writes are disabled. ' +
        'Add it to .env.local (never with a NEXT_PUBLIC_ prefix).'
    );
  }
  return supabaseAdmin;
}
