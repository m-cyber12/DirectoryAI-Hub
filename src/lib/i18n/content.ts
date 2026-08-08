/**
 * Content localization — read path.
 *
 * Turns the English-only catalog data into per-locale text for rendering.
 * Sources, in priority order:
 *   1. Supabase `content_translations` (live, updated by the auto-translate
 *      cron — covers runtime content like ingested news).
 *   2. Committed JSON snapshots in src/i18n-content/{locale}.json (generated
 *      by `npm run translate:content -- --snapshot` — makes every locale work
 *      even without Supabase credentials).
 *   3. The English source (always the final fallback).
 *
 * This module is server-only: the engine key never leaves the server.
 */

import 'server-only';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import type { Tool } from '@/data/tools';

export type EntityType = 'tool' | 'news' | 'blog' | 'category' | 'tag' | 'deepDive' | 'page';

/** Snapshot shape: { [entityType]: { [entityId]: { [field]: text } } }. */
type SnapshotShape = Record<string, Record<string, Record<string, string>>>;

const snapshotCache = new Map<string, SnapshotShape | null>();

async function loadSnapshot(locale: string): Promise<SnapshotShape | null> {
  if (snapshotCache.has(locale)) return snapshotCache.get(locale) ?? null;
  try {
    // Contextual import — every src/i18n-content/*.json gets bundled as its
    // own chunk; missing files resolve to null instead of breaking the build.
    const mod = await import(`../../i18n-content/${locale}.json`);
    const shape = (mod.default ?? {}) as SnapshotShape;
    snapshotCache.set(locale, shape);
    return shape;
  } catch {
    snapshotCache.set(locale, null);
    return null;
  }
}

export function isEnglish(locale: string): boolean {
  return !locale || locale === 'en';
}

/**
 * Batch-read translations for a set of entities of one type.
 * Returns { [entityId]: { [field]: translatedText } }.
 */
export async function localizeEntityBatch(
  entityType: EntityType,
  ids: string[],
  locale: string
): Promise<Record<string, Record<string, string>>> {
  if (isEnglish(locale) || ids.length === 0) return {};
  const unique = [...new Set(ids)];
  const out: Record<string, Record<string, string>> = {};

  // 1) Snapshot layer.
  const snapshot = await loadSnapshot(locale);
  const snap = snapshot?.[entityType];
  if (snap) {
    for (const id of unique) {
      const fields = snap[id];
      if (fields && Object.keys(fields).length > 0) {
        out[id] = { ...fields };
      }
    }
  }

  // 2) DB layer (wins over snapshot so live edits propagate immediately).
  if (supabaseAdmin) {
    const byId = new Map<string, Map<string, string>>();
    for (let i = 0; i < unique.length; i += 200) {
      const chunk = unique.slice(i, i + 200);
      const { data } = await supabaseAdmin
        .from('content_translations')
        .select('entity_id, field, translated_text')
        .eq('locale', locale)
        .eq('entity_type', entityType)
        .in('entity_id', chunk);
      for (const row of data ?? []) {
        let m = byId.get(row.entity_id);
        if (!m) {
          m = new Map();
          byId.set(row.entity_id, m);
        }
        m.set(row.field, row.translated_text);
      }
    }
    for (const id of unique) {
      const m = byId.get(id);
      if (m && m.size > 0) {
        out[id] = { ...(out[id] ?? {}), ...Object.fromEntries(m) };
      }
    }
  }

  return out;
}

/** Single-field lookup (snapshot → DB → null). */
export async function getLocalizedField(
  entityType: EntityType,
  entityId: string,
  field: string,
  locale: string
): Promise<string | null> {
  if (isEnglish(locale)) return null;
  const map = await localizeEntityBatch(entityType, [entityId], locale);
  return map[entityId]?.[field] ?? null;
}

/**
 * Tool fields the engine translates. Everything else on a Tool (url, logo,
 * ratings, dates, enums) is locale-independent by design.
 */
const TOOL_FIELDS = [
  'tagline',
  'description',
  'longDescription',
  'pageIntro',
  'bestFor',
  'verdictBestFor',
  'verdictSkipIf',
  'pros',
  'cons',
] as const;

/**
 * Return a clone of `tools` with the translatable text fields localized for
 * `locale`. English is returned untouched (zero copy).
 */
export async function localizeTools(tools: Tool[], locale: string): Promise<Tool[]> {
  if (isEnglish(locale) || tools.length === 0) return tools;
  const map = await localizeEntityBatch(
    'tool',
    tools.map((t) => t.slug),
    locale
  );

  const tagMap = await localizeEntityBatch(
    'tag',
    [...new Set(tools.flatMap((t) => t.tags ?? []))],
    locale
  );

  return tools.map((tool) => {
    const fields = map[tool.slug];
    if (!fields) return tool;

    const next: Tool = { ...tool };
    for (const f of TOOL_FIELDS) {
      const tr = fields[f];
      if (!tr) continue;
      if (f === 'verdictBestFor' || f === 'verdictSkipIf') {
        if (next.verdict) {
          next.verdict = {
            ...next.verdict,
            ...(f === 'verdictBestFor' ? { bestFor: tr } : { skipIf: tr }),
          };
        }
      } else if (f === 'pros' || f === 'cons') {
        (next as unknown as Record<string, unknown>)[f] = tr
          .split('\n')
          .map((x) => x.replace(/^[-+•]\s*/, '').trim())
          .filter(Boolean);
      } else {
        (next as unknown as Record<string, unknown>)[f] = tr;
      }
    }

    // i18n: every tool ships a longDescription, so until the engine (or a
    // snapshot) translates it, a translated page must not fall back to the
    // long ENGLISH paragraph. If longDescription is untranslated but the
    // short description IS translated, use the short one instead — the page
    // stays fully localized instead of mixing languages mid-card.
    if (!fields.longDescription && fields.description && tool.longDescription) {
      next.longDescription = fields.description;
    }

    // Tags: localized labels, English key order preserved.
    if (tagMap && tool.tags) {
      next.tags = tool.tags.map((t) => tagMap[t]?.label ?? t);
    }

    return next;
  });
}

/**
 * Localized category display label. Falls back to the English name used in
 * URLs and filter params (which always stay English — they are canonical).
 */
export async function localizedCategoryLabel(category: string, locale: string): Promise<string> {
  if (isEnglish(locale)) return category;
  return (await getLocalizedField('category', category, 'label', locale)) ?? category;
}

/**
 * Localized tag label (for filter chips and tool cards).
 */
export async function localizedTagLabel(tag: string, locale: string): Promise<string> {
  if (isEnglish(locale)) return tag;
  return (await getLocalizedField('tag', tag, 'label', locale)) ?? tag;
}

/**
 * Localize news items (title / excerpt / content / category label).
 * English is returned untouched.
 */
export async function localizeNews<T extends { slug: string; title: string; excerpt: string; content: string; category: string }>(
  items: T[],
  locale: string
): Promise<T[]> {
  if (isEnglish(locale) || items.length === 0) return items;
  const map = await localizeEntityBatch('news', items.map((i) => i.slug), locale);
  return items.map((item) => {
    const fields = map[item.slug];
    if (!fields) return item;
    return {
      ...item,
      title: fields.title ?? item.title,
      excerpt: fields.excerpt ?? item.excerpt,
      content: fields.content ?? item.content,
      category: fields.categoryLabel ?? item.category,
    };
  });
}

/**
 * Localize blog posts (title / excerpt / content / category label).
 */
export async function localizeBlogPosts<T extends { slug: string; title: string; excerpt: string; content: string; category: string }>(
  posts: T[],
  locale: string
): Promise<T[]> {
  if (isEnglish(locale) || posts.length === 0) return posts;
  const map = await localizeEntityBatch('blog', posts.map((p) => p.slug), locale);
  return posts.map((post) => {
    const fields = map[post.slug];
    if (!fields) return post;
    return {
      ...post,
      title: fields.title ?? post.title,
      excerpt: fields.excerpt ?? post.excerpt,
      content: fields.content ?? post.content,
      category: fields.categoryLabel ?? post.category,
    };
  });
}
