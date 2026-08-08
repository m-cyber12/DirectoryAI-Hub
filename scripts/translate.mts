#!/usr/bin/env tsx
/**
 * CreatorAI translation CLI (i18n, 2026-08-07).
 *
 * One entry point for every translation workflow:
 *
 *   npm run translate:content            # translate all pending content into
 *                                        #   all 7 locales (DB upsert + snapshot)
 *   npm run translate:content -- --locales fa,es --limit 20
 *   npm run translate:ui                 # (re)translate messages/{locale}.json
 *                                        #   from messages/en.json via the engine
 *   npm run translate:status             # coverage report per locale
 *
 * Flags:
 *   --locales es,pt,fr,de,zh,ar,fa       default: all translated locales
 *   --types tools,news,blog,categories,tags,deepDives
 *   --limit N                            max entities per locale per run
 *   --dry-run                            report what WOULD be translated, do nothing
 *   --snapshot / --no-snapshot           write src/i18n-content/{locale}.json
 *   --db / --no-db                       upsert into Supabase
 *   --sleep MS                           pause between batched LLM calls
 *
 * Requires env (from .env.local): OPENAI_API_KEY, and for DB writes
 * SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 */

import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

/* Tiny .env loader (no dependency): reads .env.local in cwd. */
function loadEnv() {
  const file = path.join(process.cwd(), '.env.local');
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
}
loadEnv();

const args = process.argv.slice(2);
const flag = (name: string, fallback = '') => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : fallback;
};
const has = (name: string) => args.includes(`--${name}`);
const modes = { ui: has('ui'), content: has('content'), status: has('status') };
if (!modes.ui && !modes.content && !modes.status) {
  console.error('Usage: tsx scripts/translate.mts --ui | --content [flags] | --status');
  process.exit(1);
}

const TYPE_ALIASES: Record<string, 'tool' | 'deepDive' | 'news' | 'blog' | 'category' | 'tag'> = {
  tools: 'tool',
  deepdives: 'deepDive',
  news: 'news',
  blog: 'blog',
  categories: 'category',
  tags: 'tag',
};
const parseTypes = () => {
  const raw = flag('types', '');
  if (!raw) return undefined;
  return raw.split(',').map((t) => TYPE_ALIASES[t.trim().toLowerCase()] ?? (t.trim() as never)).filter(Boolean);
};

const sleepMs = Math.max(0, parseInt(flag('sleep', '150'), 10));
const concurrency = Math.max(1, Math.min(parseInt(flag('concurrency', '1'), 10) || 1, 8));
const batch = Math.max(1, parseInt(flag('batch', '1'), 10) || 1);
const pause = () => new Promise((r) => setTimeout(r, sleepMs));

async function main() {
  const { TRANSLATED_LOCALES } = await import('../src/i18n/routing');
  const localesRaw = flag('locales', '');
  const locales = localesRaw
    ? localesRaw.split(',').map((l) => l.trim()).filter(Boolean)
    : [...TRANSLATED_LOCALES];

  if (modes.status) {
    const { translationStatus } = await import('../src/lib/i18n/translateContent');
    const s = await translationStatus(locales);
    console.log('── Translation status ─────────────────────────────');
    console.log(`Supabase configured: ${s.dbConfigured ? 'yes' : 'no'}`);
    console.log(`Engine configured:   ${s.engineConfigured ? 'yes' : 'no'}`);
    for (const locale of locales) {
      const r = s.report[locale];
      console.log(`  ${locale.padEnd(3)} ${r ? `${r.fields} fields / ${r.entities} entities` : 'no data'}`);
    }
    return;
  }

  if (modes.ui) {
    const { translateUiMessages } = await import('../src/lib/i18n/translateUi');
    for (const locale of locales) {
      console.log(`── UI messages → ${locale}`);
      const r = await translateUiMessages(locale, { sleepMs });
      console.log(`   translated ${r.translated} keys, ${r.skipped} skipped`);
    }
    return;
  }

  // ── content mode ─────────────────────────────────────────────────
  const limit = Math.min(parseInt(flag('limit', '40'), 10) || 40, 500);
  const dryRun = has('dry-run');
  const withDb = !has('no-db');
  const withSnapshot = !has('no-snapshot');
  const types = parseTypes();

  if (dryRun) {
    const { collectPending } = await import('../src/lib/i18n/translateContent');
    let total = 0;
    for (const locale of locales) {
      const pending = await collectPending(locale, { types, max: 100000 });
      total += pending.length;
      console.log(`  ${locale}: ${pending.length} entities pending` + (limit ? ` (running capped at ${limit})` : ''));
    }
    console.log(`\nTotal pending entities: ${total}. Re-run without --dry-run to translate.`);
    return;
  }

  const { isEngineConfiguredFull, resolveProvider, providerName } = await import('../src/lib/i18n/engine');
  if (!(await isEngineConfiguredFull())) {
    console.error(
      'No translation provider configured — add a key in the ADMIN PANEL (/admin → Translation)\n' +
        'or in .env.local:\n' +
        '  GEMINI_API_KEY=...      (free tier — aistudio.google.com → Get API key)\n' +
        '  OPENROUTER_API_KEY=...  (free key — openrouter.ai, free models)\n' +
        '  OPENAI_API_KEY=...      (paid)'
    );
    process.exit(1);
  }
  const prov = await resolveProvider();
  const model = prov ? await (await import('../src/lib/i18n/providerSettings')).getProviderModel(prov) : '';
  console.log('Using provider:', providerName(prov, model));

  const { syncAll, writeSnapshots } = await import('../src/lib/i18n/translateContent');
  const { resolveProvider, providerName } = await import('../src/lib/i18n/engine');
  const started = Date.now();
  const stats = await syncAll({ locales, maxPerLocale: limit, types, concurrency, batch });
  console.log('── Sync complete ────────────────────────────────────');
  console.log(`locales:          ${stats.locales.join(', ')}`);
console.log(`entities/call:    ${batch}`);
  console.log(`checked pending:  ${stats.checked}`);
  console.log(`fields translated:${stats.translated}`);
  console.log(`failed:           ${stats.failed}`);
  console.log(`still pending:    ${stats.pendingRemaining} (run again, or raise --limit)`);
  console.log(`elapsed:          ${((Date.now() - started) / 1000).toFixed(1)}s`);

  if (withSnapshot) {
    const written = await writeSnapshots(locales, { types });
    console.log('── Snapshots ───────────────────────────────────────');
    for (const [loc, count] of Object.entries(written)) {
      console.log(`  src/i18n-content/${loc}.json (${count} entity types)`);
    }
  }

  if (!withDb && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('\nNote: SUPABASE_SERVICE_ROLE_KEY not set — translations were not persisted to the DB.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
