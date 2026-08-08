/**
 * UI message synchronization for the translation CLI.
 *
 * Translates messages/en.json into messages/{locale}.json with the
 * professional engine. It is INCREMENTAL and hash-tracked: a key whose
 * English source has not changed since the last run keeps its existing
 * translation (so hand-polished copy is never clobbered), and only new or
 * changed keys are re-translated.
 *
 * The hash cache lives in messages/.cache/{locale}.json (a sidecar so the
 * message files themselves stay pure string trees for next-intl).
 *
 * The checked-in locale files were hand-translated for the launch; this
 * tool is for keeping them in sync as the UI grows.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { translateFields, hashSource } from './engine';

const MESSAGES_DIR = path.join(process.cwd(), 'messages');
const CACHE_DIR = path.join(MESSAGES_DIR, '.cache');

type Tree = Record<string, unknown>;

function flatten(tree: Tree, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(tree)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object') Object.assign(out, flatten(v as Tree, key));
    else out[key] = String(v);
  }
  return out;
}

function unflatten(flat: Record<string, string>): Tree {
  const out: Tree = {};
  for (const [key, value] of Object.entries(flat)) {
    const parts = key.split('.');
    let node = out;
    for (let i = 0; i < parts.length - 1; i++) {
      const p = parts[i];
      if (typeof node[p] !== 'object' || node[p] === null) node[p] = {};
      node = node[p] as Tree;
    }
    node[parts[parts.length - 1]] = value;
  }
  return out;
}

function loadJson<T>(file: string): T | null {
  try {
    return JSON.parse(readFileSync(file, 'utf8')) as T;
  } catch {
    return null;
  }
}

export async function translateUiMessages(
  locale: string,
  opts: { sleepMs?: number } = {}
): Promise<{ translated: number; skipped: number }> {
  const enFile = path.join(MESSAGES_DIR, 'en.json');
  const localeFile = path.join(MESSAGES_DIR, `${locale}.json`);
  const cacheFile = path.join(CACHE_DIR, `${locale}.json`);

  const en = loadJson<Tree>(enFile);
  if (!en) throw new Error('messages/en.json missing');
  const enFlat = flatten(en);

  const existing = loadJson<Tree>(localeFile);
  const existingFlat = existing ? flatten(existing) : {};
  const cache = (loadJson<Record<string, string>>(cacheFile) ?? {}) as Record<string, string>;

  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set — add it to .env.local to translate UI messages.');
  }

  // Keys that need (re)translation: en changed since last run, or missing.
  const toTranslate: Record<string, string> = {};
  const finalFlat: Record<string, string> = {};
  let skipped = 0;

  for (const [key, enText] of Object.entries(enFlat)) {
    if (cache[key] === hashSource(enText) && existingFlat[key]) {
      finalFlat[key] = existingFlat[key];
      skipped++;
    } else if (!enText.trim()) {
      finalFlat[key] = enText;
      skipped++;
    } else {
      toTranslate[key] = enText;
    }
  }

  const translated: Record<string, string> = {};
  const keys = Object.keys(toTranslate);
  const BATCH = 30;
  for (let i = 0; i < keys.length; i += BATCH) {
    const batchKeys = keys.slice(i, i + BATCH);
    const fields: Record<string, string> = {};
    for (const k of batchKeys) fields[k] = toTranslate[k];
    const res = await translateFields(fields, locale, {
      context: 'UI strings for an AI tools directory for video creators (menus, buttons, headings, labels).',
    });
    if (!res) throw new Error('Engine returned no translations.');
    Object.assign(translated, res);
    if (opts.sleepMs) await new Promise((r) => setTimeout(r, opts.sleepMs));
  }

  for (const [key, text] of Object.entries(translated)) finalFlat[key] = text;

  const tree = unflatten(finalFlat);
  writeFileSync(localeFile, JSON.stringify(tree, null, 2) + '\n', 'utf8');

  mkdirSync(CACHE_DIR, { recursive: true });
  const nextCache: Record<string, string> = { ...cache };
  for (const [key, text] of Object.entries(enFlat)) {
    nextCache[key] = hashSource(text);
  }
  writeFileSync(cacheFile, JSON.stringify(nextCache, null, 2) + '\n', 'utf8');

  return { translated: Object.keys(translated).length, skipped };
}
