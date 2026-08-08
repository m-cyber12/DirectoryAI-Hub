/**
 * Provider settings for the translation engine — editable from the ADMIN
 * PANEL instead of env vars.
 *
 * Keys are stored in the `site_settings` table (allowlisted keys below) and
 * are ONLY ever read server-side. The public /api/settings endpoint never
 * returns them; only the admin-authenticated /api/admin/i18n/provider route
 * can read (masked) or write them.
 *
 * Priority when reading (highest first):
 *   1. Explicit env override  — TRANSLATION_PROVIDER / *_API_KEY / *_MODEL
 *   2. Admin-panel (DB) values
 *
 * No 'server-only' import on purpose: the CLI (scripts/translate.mts) also
 * reads these when SUPABASE env vars are present, so a key entered in the
 * admin panel works from CI too.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export interface DbProviderConfig {
  provider?: string;
  geminiApiKey?: string;
  openrouterApiKey?: string;
  openaiApiKey?: string;
  geminiModel?: string;
  openrouterModel?: string;
}

const KEYS: (keyof DbProviderConfig)[] = [
  'provider',
  'geminiApiKey',
  'openrouterApiKey',
  'openaiApiKey',
  'geminiModel',
  'openrouterModel',
];

function dbKey(k: keyof DbProviderConfig): string {
  return `i18n_${k}`;
}

let cachedDb: SupabaseClient | null | undefined;
function db(): SupabaseClient | null {
  if (cachedDb !== undefined) return cachedDb;
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  cachedDb = url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
  return cachedDb;
}

/* ── read ─────────────────────────────────────────────────────────────── */

let cache: DbProviderConfig | undefined;

/** Read provider config from the DB (cached per process; TTL 60s). */
export async function readDbProviderConfig(force = false): Promise<DbProviderConfig> {
  if (cache !== undefined && !force) return cache;
  cache = {};
  const client = db();
  if (!client) return cache;
  try {
    const { data } = await client
      .from('site_settings')
      .select('key, value')
      .in('key', KEYS.map(dbKey));
    for (const row of data ?? []) {
      const short = row.key.replace(/^i18n_/, '') as keyof DbProviderConfig;
      if (KEYS.includes(short)) cache[short] = row.value;
    }
  } catch {
    // DB unavailable — fall back to env only.
  }
  // Auto-expire the cache so admin edits are picked up within a minute.
  setTimeout(() => (cache = undefined), 60_000).unref?.();
  return cache;
}

/** Best-effort sync peek (used before the async read settles). */
export function getCachedDbProviderConfig(): DbProviderConfig | null {
  return cache ?? null;
}

/** Show only the tail of a secret (last 4 chars). */
export function maskKey(key?: string): string {
  if (!key) return '';
  if (key.length <= 8) return '••••';
  return `••••${key.slice(-4)}`;
}

/* ── write (admin only) ──────────────────────────────────────────────── */

export async function writeDbProviderConfig(cfg: DbProviderConfig): Promise<{ ok: boolean; error?: string }> {
  const client = db();
  if (!client) {
    return { ok: false, error: 'SUPABASE_SERVICE_ROLE_KEY is not configured — cannot persist.' };
  }
  const rows = KEYS.filter((k) => cfg[k] !== undefined).map((k) => ({
    key: dbKey(k),
    value: String(cfg[k]).slice(0, 2000),
  }));
  if (rows.length === 0) return { ok: true };

  const { error } = await client.from('site_settings').upsert(rows, { onConflict: 'key' });
  if (error) return { ok: false, error: error.message };

  // Audit trail.
  void client
    .from('admin_audit_log')
    .insert([{ action: 'i18n.provider.update', entity: 'site_settings', detail: { keys: rows.map((r) => r.key) } }])
    .then(
      () => undefined,
      () => undefined
    );

  cache = undefined; // invalidate so the next read picks it up
  return { ok: true };
}

/* ── effective (env + DB merged) ─────────────────────────────────────── */

export type EffectiveProvider = 'openai' | 'gemini' | 'openrouter';

export function detectEnvProvider(): EffectiveProvider | null {
  if (process.env.OPENAI_API_KEY) return 'openai';
  if (process.env.GEMINI_API_KEY) return 'gemini';
  if (process.env.OPENROUTER_API_KEY) return 'openrouter';
  return null;
}

export async function getEffectiveProvider(): Promise<EffectiveProvider | null> {
  const forcedEnv = process.env.TRANSLATION_PROVIDER?.toLowerCase();
  if (forcedEnv === 'openai' || forcedEnv === 'gemini' || forcedEnv === 'openrouter') return forcedEnv;
  const dbCfg = await readDbProviderConfig();
  // Explicit provider choice saved in the ADMIN PANEL wins over env API keys,
  // so selecting Gemini in /admin actually switches providers even when an
  // old OPENAI_API_KEY still exists in Vercel env.
  const dbProvider = dbCfg.provider;
  if (dbProvider === 'openai' || dbProvider === 'gemini' || dbProvider === 'openrouter') {
    return dbProvider;
  }
  const env = detectEnvProvider();
  if (env) return env;
  if (dbCfg.openaiApiKey) return 'openai';
  if (dbCfg.geminiApiKey) return 'gemini';
  if (dbCfg.openrouterApiKey) return 'openrouter';
  return null;
}

export async function getProviderApiKey(p: EffectiveProvider): Promise<string | null> {
  const dbCfg = await readDbProviderConfig();
  switch (p) {
    case 'openai':
      return dbCfg.openaiApiKey || process.env.OPENAI_API_KEY || null;
    case 'gemini':
      return dbCfg.geminiApiKey || process.env.GEMINI_API_KEY || null;
    case 'openrouter':
      return dbCfg.openrouterApiKey || process.env.OPENROUTER_API_KEY || null;
  }
}

export async function getProviderModel(p: EffectiveProvider): Promise<string> {
  const dbCfg = await readDbProviderConfig();
  switch (p) {
    case 'openai':
      return process.env.TRANSLATION_AI_MODEL || 'gpt-4o-mini';
    case 'gemini':
      return process.env.GEMINI_MODEL || dbCfg.geminiModel || 'gemini-3.6-flash';
    case 'openrouter':
      return process.env.OPENROUTER_MODEL || dbCfg.openrouterModel || 'google/gemini-2.0-flash-exp:free';
  }
}
