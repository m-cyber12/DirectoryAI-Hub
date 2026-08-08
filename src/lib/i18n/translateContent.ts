/**
 * Content translation — write path.
 *
 * The engine + storage layer behind "new content gets translated
 * automatically". One registry describes every translatable entity in the
 * catalog; `syncAll` finds the fields that are missing or whose English
 * source changed (via source_hash) and re-translates just those, then
 * upserts into Supabase (and/or emits committed JSON snapshots).
 *
 * Used by:
 *   - /api/cron/translate            (Vercel cron / cron-job.org)
 *   - scripts/translate.mts          (npm run translate:content)
 *   - /api/news/refresh              (auto-translate freshly ingested news)
 *
 * NOTE: this module deliberately does NOT import 'server-only' so the same
 * code runs in Next.js route handlers AND in the standalone CLI. The service
 * role key is only ever read from server env vars either way.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { ALL_TOOLS } from '@/data/tools';
import { TOOL_DESCRIPTIONS } from '@/data/descriptions';
import { TOOL_DEEP_DIVES } from '@/data/tool-deep-dives';
import { CURATED_NEWS, type NewsItem } from '@/data/news';
import { BLOG_POSTS, type BlogPost } from '@/data/posts';
import { CATEGORY_CONTENT } from '@/lib/categories';
import { TRANSLATED_LOCALES } from '@/i18n/routing';
import { translateFields, hashSource, isEngineTarget, isEngineConfiguredFull } from './engine';
import { GLOSSARY } from './glossary';
import type { EntityType } from './content';

/* ───────────────────────────────────────────────────────────────────────
 * DB client (no server-only: usable from the CLI too)
 * ─────────────────────────────────────────────────────────────────────── */

let cachedDb: SupabaseClient | null | undefined;

/**
 * In-process store of freshly translated fields (locale → type → id → field).
 * Lets writeSnapshots produce complete files even when Supabase is not
 * configured: existing seed snapshot + DB rows + this run's translations.
 */
const runtimeStore = new Map<string, { [id: string]: { [field: string]: string } }>();
export function getRuntimeStore() {
  return runtimeStore;
}
export function translationDb(): SupabaseClient | null {
  if (cachedDb !== undefined) return cachedDb;
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  cachedDb = url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
  return cachedDb;
}

export const hasEngine = () => Boolean(process.env.OPENAI_API_KEY && process.env.TRANSLATION_AI_MODEL !== 'disabled');

/* ───────────────────────────────────────────────────────────────────────
 * Entity registry — where every translatable string in the catalog lives
 * ─────────────────────────────────────────────────────────────────────── */

/** Well-known brands that must never be translated anywhere. */
const KNOWN_PROTECTED = [
  'YouTube', 'TikTok', 'Instagram', 'Twitch', 'Vimeo', 'X (Twitter)', 'LinkedIn',
  'OpenAI', 'ChatGPT', 'Sora', 'Midjourney', 'Stable Diffusion', 'Runway',
  'ElevenLabs', 'Synthesia', 'HeyGen', 'Descript', 'CapCut', 'Canva', 'Adobe',
  'Premiere Pro', 'After Effects', 'Final Cut Pro', 'DaVinci Resolve', 'OBS',
  'CreatorAI Hub', 'Google', 'Meta', 'Apple', 'Microsoft',
];

export interface EntitySource {
  type: EntityType;
  id: string;
  /** field → English source text. */
  fields: Record<string, string>;
  context?: string;
  protectedTerms?: string[];
}

const joinLines = (arr: string[] | undefined) => (arr && arr.length ? arr.join('\n') : '');

export function buildToolEntities(): EntitySource[] {
  return ALL_TOOLS.map((t) => {
    const fields: Record<string, string> = {
      tagline: t.tagline,
      description: t.description,
    };
    const desc = TOOL_DESCRIPTIONS[t.slug];
    if (desc?.longDescription) fields.longDescription = desc.longDescription;
    if (desc?.pageIntro) fields.pageIntro = desc.pageIntro;
    if (desc?.bestFor) fields.bestFor = desc.bestFor;
    if (t.verdict?.bestFor) fields.verdictBestFor = t.verdict.bestFor;
    if (t.verdict?.skipIf) fields.verdictSkipIf = t.verdict.skipIf;
    if (t.pros?.length) fields.pros = t.pros.join('\n');
    if (t.cons?.length) fields.cons = t.cons.join('\n');
    return {
      type: 'tool' as const,
      id: t.slug,
      fields,
      context: `Tool listing page for "${t.name}" (category: ${t.category}). Tagline, description and verdict copy.`,
      protectedTerms: [t.name, t.slug, ...KNOWN_PROTECTED],
    };
  });
}

export function buildDeepDiveEntities(): EntitySource[] {
  return Object.entries(TOOL_DEEP_DIVES).map(([slug, dd]) => {
    const fields: Record<string, string> = {
      overview: joinLines(dd.overview),
      useCases: joinLines(dd.useCases),
      bestFor: joinLines(dd.bestFor),
      avoidIf: joinLines(dd.avoidIf),
    };
    if (dd.pricingNotes) fields.pricingNotes = dd.pricingNotes;
    dd.faqs?.forEach((f, i) => {
      fields[`faqs.${i}.q`] = f.q;
      fields[`faqs.${i}.a`] = f.a;
    });
    return {
      type: 'deepDive' as const,
      id: slug,
      fields,
      context: `Long-form editorial deep dive for the AI tool "${slug}". Markdown-ish multi-line text; keep line structure.`,
      protectedTerms: [slug, ...KNOWN_PROTECTED],
    };
  });
}

export function buildNewsEntities(items?: NewsItem[]): EntitySource[] {
  const list = items ?? CURATED_NEWS;
  return list.map((n) => ({
    type: 'news' as const,
    id: n.slug,
    fields: {
      title: n.title,
      excerpt: n.excerpt,
      content: n.content,
      categoryLabel: n.category,
    },
    context: `AI industry news article for video creators. Keep headline punchy, body in plain paragraphs separated by blank lines.`,
    protectedTerms: [...KNOWN_PROTECTED, n.source],
  }));
}

export function buildBlogEntities(posts?: BlogPost[]): EntitySource[] {
  const list = posts ?? BLOG_POSTS;
  return list.map((p) => ({
    type: 'blog' as const,
    id: p.slug,
    fields: {
      title: p.title,
      excerpt: p.excerpt,
      content: p.content,
      categoryLabel: p.category,
    },
    context: `Blog guide for video creators. Content is markdown — keep headings, lists and line breaks exactly.`,
    protectedTerms: [...KNOWN_PROTECTED],
  }));
}

export function buildCategoryEntities(): EntitySource[] {
  return Object.entries(CATEGORY_CONTENT).map(([name, c]) => ({
    type: 'category' as const,
    id: name,
    fields: {
      label: name,
      intro: c.intro,
      whatMatters: joinLines(c.whatMatters),
      reality: c.reality,
    },
    context: `Directory category page for "${name}". Short editorial orientation copy.`,
    protectedTerms: [...KNOWN_PROTECTED],
  }));
}

export function buildTagEntities(): EntitySource[] {
  const tags = [...new Set(ALL_TOOLS.flatMap((t) => t.tags ?? []).filter(Boolean))];
  return tags.map((tag) => ({
    type: 'tag' as const,
    id: tag,
    fields: { label: tag },
    context: 'Short capability tag shown as a filter chip and on tool cards.',
    protectedTerms: [...KNOWN_PROTECTED],
  }));
}

export function allEntityTypes(): EntityType[] {
  return ['tool', 'deepDive', 'news', 'blog', 'category', 'tag'];
}

/** Registry lookup shared by every pipeline entry point. */
export function entitiesForType(type: EntityType): EntitySource[] {
  switch (type) {
    case 'tool':
      return buildToolEntities();
    case 'deepDive':
      return buildDeepDiveEntities();
    case 'news':
      return buildNewsEntities();
    case 'blog':
      return buildBlogEntities();
    case 'category':
      return buildCategoryEntities();
    case 'tag':
      return buildTagEntities();
    default:
      return [];
  }
}

/* ───────────────────────────────────────────────────────────────────────
 * Pending detection (source_hash change detection) + translation
 * ─────────────────────────────────────────────────────────────────────── */

export interface PendingEntity {
  source: EntitySource;
  /** field → English source text for fields that need (re)translation. */
  missing: Record<string, string>;
}

export async function collectPending(
  locale: string,
  opts: { types?: EntityType[]; max?: number } = {}
): Promise<PendingEntity[]> {
  if (!isEngineTarget(locale)) return [];
  const types = opts.types ?? allEntityTypes();
  const db = translationDb();
  const pending: PendingEntity[] = [];

  // Committed snapshots (src/i18n-content/{locale}.json) also count as
  // "already translated", so the engine only retranslates fields the seed
  // does NOT cover (longDescription, deep dives, full article bodies, …).
  const snapshots = loadSnapshotMap(locale);

  for (const type of types) {
    const entities = entitiesForType(type);
    if (entities.length === 0) continue;

    // Load every existing row for this locale+type once (field-level hash).
    const stored = new Map<string, Map<string, string>>(); // id → field → hash
    if (db) {
      for (let i = 0; i < entities.length; i += 300) {
        const chunk = entities.slice(i, i + 300).map((e) => e.id);
        const { data } = await db
          .from('content_translations')
          .select('entity_id, field, source_hash')
          .eq('locale', locale)
          .eq('entity_type', type)
          .in('entity_id', chunk);
        for (const row of data ?? []) {
          let m = stored.get(row.entity_id);
          if (!m) {
            m = new Map();
            stored.set(row.entity_id, m);
          }
          m.set(row.field, row.source_hash);
        }
      }
    }
    // Seed from snapshots: a field present in the snapshot is treated as
    // translated for the CURRENT English source (hash equality). If the
    // English source later changes, the hash mismatches and it is
    // retranslated — exactly the same change-detection as the DB rows.
    const snapType = snapshots[type];
    if (snapType) {
      for (const [id, fields] of Object.entries(snapType)) {
        let m = stored.get(id);
        if (!m) {
          m = new Map();
          stored.set(id, m);
        }
        for (const field of Object.keys(fields)) {
          if (!m.has(field)) m.set(field, 'snapshot'); // DB rows win
        }
      }
    }

    for (const e of entities) {
      if (opts.max && pending.length >= opts.max) break;
      const missing: Record<string, string> = {};
      const hashes = stored.get(e.id);
      for (const [field, text] of Object.entries(e.fields)) {
        if (!text || !text.trim()) continue;
        const h = hashSource(text);
        const storedHash = hashes?.get(field);
        // Snapshot rows carry the placeholder 'snapshot'; they are only
        // considered covered when the entity is genuinely in the snapshot.
        const covered =
          storedHash === h || (storedHash === 'snapshot' && snapType?.[e.id]?.[field] != null);
        if (!covered) {
          missing[field] = text;
        }
      }
      if (Object.keys(missing).length > 0) {
        pending.push({ source: e, missing });
      }
    }
    if (opts.max && pending.length >= opts.max) break;
  }
  return pending;
}

export interface TranslateOutcome {
  entityId: string;
  type: EntityType;
  translated: number;
  failed: boolean;
}

/**
 * Translate one entity into one locale (single batched LLM call) and upsert
 * into Supabase. Returns the outcome; `failed: true` on engine error.
 */
export async function translateEntity(
  locale: string,
  pending: PendingEntity
): Promise<TranslateOutcome> {
  const { source, missing } = pending;
  const glossary = GLOSSARY[locale] ?? {};
  const translated = await translateFields(missing, locale, {
    context: source.context,
    glossary,
    protectedTerms: source.protectedTerms,
  });

  const outcome: TranslateOutcome = {
    entityId: source.id,
    type: source.type,
    translated: 0,
    failed: true,
  };

  if (!translated) {
    // Engine not configured — nothing to do, callers treat as no-op.
    outcome.failed = false;
    return outcome;
  }

  const rows = Object.entries(translated)
    .filter(([, text]) => text && text.trim())
    .map(([field, text]) => ({
      locale,
      entity_type: source.type,
      entity_id: source.id,
      field,
      source_hash: hashSource(missing[field] ?? ''),
      translated_text: text,
      provider: 'openai',
    }));

  const db = translationDb();
  if (db && rows.length > 0) {
    await db.from('content_translations').upsert(rows, {
      onConflict: 'locale,entity_type,entity_id,field',
    });
  }

  // Record into the runtime store regardless of DB, so snapshots are complete.
  const key = `${locale}/${source.type}`;
  let byId = runtimeStore.get(key);
  if (!byId) {
    byId = {};
    runtimeStore.set(key, byId);
  }
  let fields = byId[source.id];
  if (!fields) {
    fields = {};
    byId[source.id] = fields;
  }
  for (const row of rows) fields[row.field] = row.translated_text;

  outcome.translated = rows.length;
  outcome.failed = rows.length === 0;
  return outcome;
}

/**
 * Translate MULTIPLE entities in one model call — for providers with low
 * per-day quotas (Gemini free tier, OpenRouter free models). Flattens every
 * field of `pendingList` into one JSON map (`<entityIdx>:<field>` → text) so
 * `entityBatch` entities cost only 1 API request. Results are split back.
 */
export async function translateEntityBatch(
  locale: string,
  pendingList: PendingEntity[],
  opts: { glossary?: Record<string, string> } = {}
): Promise<TranslateOutcome[]> {
  const outcomes: TranslateOutcome[] = pendingList.map((p) => ({
    entityId: p.source.id,
    type: p.source.type,
    translated: 0,
    failed: false,
  }));
  if (pendingList.length === 0) return outcomes;

  // Flatten: key `${bi}:${field}` → English text.
  const flat: Record<string, string> = {};
  pendingList.forEach((p, bi) => {
    for (const [field, text] of Object.entries(p.missing)) {
      flat[`${bi}:${field}`] = text;
    }
  });

  const translated = await translateFields(flat, locale, {
    context: pendingList.map((p) => p.source.context).filter(Boolean).join(' | ').slice(0, 600),
    glossary: opts.glossary ?? GLOSSARY[locale] ?? {},
    protectedTerms: [
      ...new Set(pendingList.flatMap((p) => p.source.protectedTerms ?? [])),
    ].slice(0, 120),
  });
  if (!translated) return outcomes;

  const byEntity = pendingList.map(() => ({} as Record<string, string>));
  for (const [key, text] of Object.entries(translated)) {
    const sep = key.indexOf(':');
    if (sep < 0) continue;
    const bi = Number(key.slice(0, sep));
    const field = key.slice(sep + 1);
    if (Number.isInteger(bi) && byEntity[bi]) byEntity[bi][field] = text;
  }

  const db = translationDb();
  for (let bi = 0; bi < pendingList.length; bi++) {
    const p = pendingList[bi];
    const fields = byEntity[bi];
    const rows = Object.entries(fields)
      .filter(([, text]) => text && text.trim())
      .map(([field, text]) => ({
        locale,
        entity_type: p.source.type,
        entity_id: p.source.id,
        field,
        source_hash: hashSource(p.missing[field] ?? ''),
        translated_text: text,
        provider: 'llm',
      }));
    if (rows.length === 0) continue;

    if (db) {
      await db.from('content_translations').upsert(rows, {
        onConflict: 'locale,entity_type,entity_id,field',
      });
    }
    // Runtime store so snapshots merge even without DB.
    const key = `${locale}/${p.source.type}`;
    let byId = runtimeStore.get(key);
    if (!byId) {
      byId = {};
      runtimeStore.set(key, byId);
    }
    let ent = byId[p.source.id];
    if (!ent) {
      ent = {};
      byId[p.source.id] = ent;
    }
    for (const row of rows) ent[row.field] = row.translated_text;

    outcomes[bi].translated = rows.length;
    outcomes[bi].failed = rows.length === 0;
  }
  return outcomes;
}

export interface SyncStats {
  locales: string[];
  checked: number;
  translated: number;
  failed: number;
  skipped: number;
  pendingRemaining: number;
}

/**
 * Incremental full sync used by the cron. Translates up to `maxPerLocale`
 * pending entities per locale per run, so each run stays inside the
 * serverless time limit and the cost envelope. Re-run daily until caught up.
 */
export async function syncAll(
  opts: {
    locales?: string[];
    maxPerLocale?: number;
    types?: EntityType[];
    concurrency?: number;
    /** Entities per model call — >1 saves API quota (free tiers). */
    batch?: number;
  } = {}
): Promise<SyncStats> {
  const locales = (opts.locales ?? [...TRANSLATED_LOCALES]).filter(isEngineTarget);
  const max = opts.maxPerLocale ?? 40;
  const concurrency = Math.max(1, Math.min(opts.concurrency ?? 1, 8));
  const batchSize = Math.max(1, opts.batch ?? 1);
  const stats: SyncStats = {
    locales,
    checked: 0,
    translated: 0,
    failed: 0,
    skipped: 0,
    pendingRemaining: 0,
  };

  for (const locale of locales) {
    const pending = await collectPending(locale, { types: opts.types, max });
    stats.checked += pending.length;
    const batch = pending.slice(0, max);

    // Small worker pool — independent groups, so we translate in parallel
    // (default 1 for cron safety; the CLI passes --concurrency). When
    // batchSize > 1, each "unit" is a group of entities sent in ONE call.
    let cursor = 0;
    const units: PendingEntity[][] = [];
    for (let i = 0; i < batch.length; i += batchSize) units.push(batch.slice(i, i + batchSize));
    const workers = Array.from({ length: Math.min(concurrency, units.length) }, async () => {
      while (cursor < units.length) {
        const unit = units[cursor++];
        try {
          const outcomes = await translateEntityBatch(locale, unit);
          for (const o of outcomes) {
            if (o.failed) stats.failed++;
            else {
              stats.translated += o.translated;
              stats.skipped += o.translated === 0 ? 1 : 0;
            }
          }
        } catch {
          stats.failed += unit.length;
        }
        // Be polite to the provider between batched calls.
        await new Promise((r) => setTimeout(r, 120));
      }
    });
    await Promise.all(workers);
    console.log(`  [${locale}] done — ${batch.length} entities / ${units.length} calls (${stats.translated} fields so far)`);
    // How far behind are we? (max was consumed if still pending)
    stats.pendingRemaining += Math.max(0, pending.length - max);
  }

  return stats;
}

/* ───────────────────────────────────────────────────────────────────────
 * News auto-translate hook (called right after ingestion)
 * ─────────────────────────────────────────────────────────────────────── */

/**
 * Translate freshly ingested news items into every locale, best-effort,
 * bounded so it can never stall the refresh cron. The daily translate cron
 * catches anything that overflows this budget.
 */
export async function autoTranslateNews(
  items: NewsItem[],
  opts: { maxItems?: number } = {}
): Promise<number> {
  if (!(await isEngineConfiguredFull()) || items.length === 0) return 0;
  const maxItems = opts.maxItems ?? 6;
  const entities = buildNewsEntities(items.slice(0, maxItems));
  let done = 0;
  for (const locale of TRANSLATED_LOCALES) {
    for (const e of entities) {
      const missing: Record<string, string> = {};
      for (const [f, t] of Object.entries(e.fields)) {
        if (t && t.trim()) missing[f] = t;
      }
      if (Object.keys(missing).length === 0) continue;
      try {
        const out = await translateEntity(locale, { source: e, missing });
        done += out.translated;
      } catch {
        // Never let translation failures break the news refresh.
      }
      await new Promise((r) => setTimeout(r, 120));
    }
  }
  return done;
}

/* ───────────────────────────────────────────────────────────────────────
 * Snapshot generation (committed JSON so locales work DB-less)
 * ─────────────────────────────────────────────────────────────────────── */

import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

export function snapshotPath(locale: string): string {
  return path.join(process.cwd(), 'src', 'i18n-content', `${locale}.json`);
}

/**
 * Write src/i18n-content/{locale}.json from the current DB contents (or from
 * freshly translated in-memory results). Called by the CLI and by the
 * GitHub Action that keeps snapshots in sync.
 */
export async function writeSnapshotFile(locale: string, opts: { types?: EntityType[] } = {}): Promise<number> {
  const db = translationDb();
  const types = opts.types ?? allEntityTypes();
  const out: Record<string, Record<string, Record<string, string>>> = {};

  // Start from whatever the committed snapshot already has (seed content),
  // so this run only adds/overrides the newly translated fields.
  const existingFile = path.join(process.cwd(), 'src', 'i18n-content', `${locale}.json`);
  if (existsSync(existingFile)) {
    try {
      const existing = JSON.parse(readFileSync(existingFile, 'utf8')) as Record<
        string,
        Record<string, Record<string, string>>
      >;
      for (const [type, entities] of Object.entries(existing)) {
        out[type] = { ...(out[type] ?? {}), ...(entities ?? {}) };
      }
    } catch {
      // corrupt/empty — start fresh
    }
  }

  // This run's in-memory translations (wins over seed so long fields merge in).
  const rtKeyPrefix = `${locale}/`;
  for (const [key, byId] of runtimeStore) {
    if (!key.startsWith(rtKeyPrefix)) continue;
    const type = key.slice(rtKeyPrefix.length);
    if (!types.includes(type as EntityType)) continue;
    out[type] = out[type] ?? {};
    for (const [id, fields] of Object.entries(byId)) {
      out[type][id] = { ...(out[type][id] ?? {}), ...fields };
    }
  }

  if (db) {
    for (const type of types) {
      const map: Record<string, Record<string, string>> = {};
      let from = 0;
      for (;;) {
        const { data, error } = await db
          .from('content_translations')
          .select('entity_id, field, translated_text')
          .eq('locale', locale)
          .eq('entity_type', type)
          .order('entity_id', { ascending: true })
          .range(from, from + 499);
        if (error) throw error;
        for (const row of data ?? []) {
          (map[row.entity_id] ??= {})[row.field] = row.translated_text;
        }
        if (!data || data.length < 500) break;
        from += 500;
      }
      if (Object.keys(map).length > 0) out[type] = map;
    }
  }

  mkdirSync(path.dirname(snapshotPath(locale)), { recursive: true });
  writeFileSync(snapshotPath(locale), JSON.stringify(out, null, 2) + '\n', 'utf8');
  return Object.keys(out).length;
}

/** Convenience: write snapshots for many locales. */
export async function writeSnapshots(locales: string[], opts: { types?: EntityType[] } = {}) {
  const written: Record<string, number> = {};
  for (const locale of locales) {
    if (!isEngineTarget(locale)) continue;
    written[locale] = await writeSnapshotFile(locale, opts);
  }
  return written;
}

/* ───────────────────────────────────────────────────────────────────────
 * Status / coverage report (used by `npm run translate:status`)
 * ─────────────────────────────────────────────────────────────────────── */

export async function translationStatus(locales: string[] = [...TRANSLATED_LOCALES]) {
  const db = translationDb();
  const report: Record<string, { fields: number; entities: number }> = {};

  if (db) {
    for (const locale of locales) {
      const { data } = await db
        .from('content_translations')
        .select('entity_type, entity_id')
        .eq('locale', locale);
      const entities = new Set((data ?? []).map((r) => `${r.entity_type}/${r.entity_id}`));
      report[locale] = { fields: data?.length ?? 0, entities: entities.size };
    }
  }
  return { dbConfigured: Boolean(db), engineConfigured: await isEngineConfiguredFull(), report };
}

/* ───────────────────────────────────────────────────────────────────────
 * Snapshot read (for pending-detection) — no 'server-only', CLI-safe.
 * ─────────────────────────────────────────────────────────────────────── */

let snapshotCache = new Map<string, Record<string, Record<string, Record<string, string>>>>();

export function loadSnapshotMap(locale: string): Record<string, Record<string, Record<string, string>>> {
  if (snapshotCache.has(locale)) return snapshotCache.get(locale)!;
  try {
    const file = path.join(process.cwd(), 'src', 'i18n-content', `${locale}.json`);
    snapshotCache.set(locale, JSON.parse(readFileSync(file, 'utf8')) ?? {});
  } catch {
    snapshotCache.set(locale, {});
  }
  return snapshotCache.get(locale)!;
}
