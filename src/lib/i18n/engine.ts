/**
 * ─────────────────────────────────────────────────────────────────────────
 *  CreatorAI professional translation engine
 *  (i18n, 2026-08-07)
 *
 *  This is NOT a machine-glossary translator. It is an LLM-powered
 *  localization engine with the same discipline a human localization vendor
 *  applies: terminology control, brand-name protection, tone preservation,
 *  JSON round-tripping and batch cost efficiency.
 *
 *  PROVIDERS (pick the one that fits your budget):
 *    - OpenAI     (default)  — OPENAI_API_KEY, model gpt-4o-mini (~$0.40/run)
 *    - Google Gemini (FREE tier) — GEMINI_API_KEY, model gemini-2.5-flash
 *      Get a free key at https://aistudio.google.com → Get API key.
 *      Free tier ≈ a few hundred requests/day — plenty for one locale/day.
 *    - OpenRouter (FREE models) — OPENROUTER_API_KEY, model
 *      OPENROUTER_MODEL || 'google/gemini-2.0-flash-exp:free'
 *      Free key at https://openrouter.ai (no credits needed for :free models).
 *      Free-tier limit is ~50 requests/day, so use --batch to fit.
 *
 *  Which provider is used:
 *    TRANSLATION_PROVIDER=gemini|openrouter|openai  (explicit override), else
 *    auto-detect by which key is set (OPENAI first, then GEMINI, then
 *    OPENROUTER).
 *
 *  Quality rules are identical across providers (same prompt + glossary +
 *  protected terms), so the output is consistent whichever backend serves it.
 * ─────────────────────────────────────────────────────────────────────────
 */

import { createHash } from 'node:crypto';
import { TRANSLATED_LOCALES, type Locale } from '@/i18n/routing';
import {
  getEffectiveProvider,
  getProviderApiKey,
  getProviderModel,
  type EffectiveProvider,
} from './providerSettings';

export type EngineProvider = 'openai' | 'gemini' | 'openrouter';

export const TRANSLATION_MODEL =
  process.env.TRANSLATION_AI_MODEL ||
  process.env.GEMINI_MODEL ||
  process.env.OPENROUTER_MODEL ||
  'gemini-3.6-flash';

/** Which provider to use for a run (env first, then admin-panel DB values). */
export async function resolveProvider(): Promise<EngineProvider | null> {
  return (await getEffectiveProvider()) as EngineProvider | null;
}

/** True when at least one translation backend is configured (env only — sync). */
export function isEngineConfigured(): boolean {
  const forced = process.env.TRANSLATION_PROVIDER?.toLowerCase();
  if (forced === 'gemini' || forced === 'openrouter' || forced === 'openai') return true;
  return Boolean(process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY || process.env.OPENROUTER_API_KEY);
}

/** True when a backend is configured including admin-panel (DB) keys. */
export async function isEngineConfiguredFull(): Promise<boolean> {
  return (await resolveProvider()) !== null;
}

export function providerName(p: EngineProvider | null, model?: string): string {
  switch (p) {
    case 'gemini':
      return `Gemini (${model || 'gemini-3.6-flash'}) — free tier`;
    case 'openrouter':
      return `OpenRouter (${model || 'google/gemini-2.0-flash-exp:free'}) — free model`;
    case 'openai':
      return `OpenAI (${model || 'gpt-4o-mini'})`;
    default:
      return 'none — English fallback';
  }
}

/** Human-readable engine status incl. admin-panel config (for CLI/status). */
export async function getEngineInfo(): Promise<{ provider: EngineProvider | null; model: string; configured: boolean }> {
  const provider = await resolveProvider();
  if (!provider) return { provider: null, model: '', configured: false };
  const model = await getProviderModel(provider);
  return { provider, model, configured: true };
}

/** Human names used inside the engine prompt. */
export const LOCALE_NATIVE_NAMES: Record<string, string> = {
  es: 'Spanish (Spain-neutral)',
  pt: 'Portuguese (Brazil/global-neutral)',
  fr: 'French (France)',
  de: 'German (Germany)',
  zh: 'Chinese (Simplified, Mainland China)',
  ar: 'Arabic (Modern Standard)',
  fa: 'Persian (Farsi, Iran)',
};

/** The engine can only translate into these locales (English is the source). */
export function isEngineTarget(locale: string): locale is (typeof TRANSLATED_LOCALES)[number] {
  return (TRANSLATED_LOCALES as readonly string[]).includes(locale);
}

export interface BatchOptions {
  /** Target locale, e.g. 'fa'. */
  locale: string;
  /** Strings to translate, in order. `null` entries are skipped. */
  texts: (string | null)[];
  /** Optional: what these strings are (page/component context), for tone. */
  context?: string;
  /** Optional: term → preferred translation glossary entries. */
  glossary?: Record<string, string>;
  /** Tokens that must never be translated (tool names, brands, URLs…). */
  protectedTerms?: string[];
  /** Register hint, default 'natural, clear, professional'. */
  tone?: string;
}

export interface BatchResult {
  /** index → translation, only for indices that were provided. */
  translations: Record<number, string>;
  model: string;
  truncated: boolean;
}

const EMPTY_RESULT: BatchResult = { translations: {}, model: TRANSLATION_MODEL, truncated: false };

/** Trim a string to a sane per-field budget (protects token cost). */
const MAX_FIELD_CHARS = 12_000;

/**
 * Translate a batch of strings in ONE model call.
 *
 * Returns `null` when no provider is configured — callers must fall back to
 * the English source.
 */
export async function translateBatch(opts: BatchOptions): Promise<BatchResult | null> {
  const provider = await resolveProvider();
  if (!provider) {
    return null;
  }
  if (!isEngineTarget(opts.locale)) {
    return EMPTY_RESULT;
  }
  // Resolve keys/models dynamically (env → admin-panel DB), so a key saved in
  // the admin panel is picked up without redeploying.
  const apiKey = await getProviderApiKey(provider);
  if (!apiKey) return null;
  const model = await getProviderModel(provider);

  const indices = opts.texts.map((t, i) => ({ t, i })).filter((x) => x.t && x.t.trim());
  if (indices.length === 0) return EMPTY_RESULT;

  const targetName = LOCALE_NATIVE_NAMES[opts.locale] ?? opts.locale;
  const protectedTerms = (opts.protectedTerms ?? []).slice(0, 120);
  const glossary = opts.glossary ?? {};

  const payload = indices.reduce<Record<string, string>>((acc, { t, i }) => {
    acc[String(i)] = (t as string).slice(0, MAX_FIELD_CHARS);
    return acc;
  }, {});

  const system = [
    'You are a senior professional localization expert translating user-facing content for a video-creator AI tools directory.',
    'Translate the provided strings from English into ' + targetName + '.',
    'Non-negotiable quality rules:',
    '1. NATIVE COPYWRITER, NOT A MACHINE: produce idiomatic, natural, human-quality text in the target language. Never translate word-for-word. Adapt word order, idiomatic expressions and register to how a native speaker actually writes.',
    '2. NEVER translate: tool names, brand names, company names, product names, URLs, domain names, currency codes, numbers, version numbers, file extensions, code, emoji, or anything inside {curly_braces} (these are template placeholders — keep them byte-for-byte).',
    '3. Keep ALL placeholders exactly as they appear: {count}, {name}, {date}, {price}, {year}, {category} etc. Do not reorder or modify them.',
    '4. Preserve meaning, tone and intent exactly. Do not add, remove or invent information.',
    '5. Preserve markdown formatting, line breaks, bullet characters and HTML-like tags.',
    '6. Short marketing labels (taglines, CTAs, badges) must read as punchy, natural copy — never as a literal dictionary translation.',
    '7. Use the provided glossary for domain terminology whenever it applies.',
    '8. Return ONLY a valid JSON object mapping each input index to its translation, e.g. {"0":"…","1":"…"}. Do not wrap it in markdown, do not add commentary.',
  ].join('\n');

  const user: string[] = [];
  if (opts.context) user.push(`Content context: ${opts.context}`);
  if (Object.keys(glossary).length > 0) {
    user.push(
      'Terminology glossary (use these preferred translations for these English terms when the context fits):\n' +
        Object.entries(glossary)
          .map(([k, v]) => `  ${k} → ${v}`)
          .join('\n')
    );
  }
  if (protectedTerms.length > 0) {
    user.push(
      'Protected terms — do NOT translate or transliterate these under any circumstance: ' +
        protectedTerms.join(', ')
    );
  }
  user.push('Strings to translate:');
  user.push(JSON.stringify(payload, null, 0));
  user.push('Return the JSON object now.');

  switch (provider) {
    case 'gemini':
      return translateWithGemini(system, user.join('\n'), apiKey, model);
    case 'openrouter':
      return translateWithOpenRouter(system, user.join('\n'), apiKey, model);
    case 'openai':
    default:
      return translateWithOpenAI(system, user.join('\n'), apiKey, model);
  }
}

/** Shared OpenAI-compatible chat completion request (OpenAI + OpenRouter). */
async function postChatCompletion(
  url: string,
  apiKey: string,
  model: string,
  system: string,
  user: string,
  extraHeaders: Record<string, string> = {}
): Promise<BatchResult> {
  const body: Record<string, unknown> = {
    model,
    temperature: 0.2,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  };

  const call = async (withJsonMode: boolean) => {
    if (withJsonMode) body.response_format = { type: 'json_object' };
    else delete body.response_format;
    const raw = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        ...extraHeaders,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120_000),
    });
    return raw;
  };

  let raw = await call(true);
  if (raw.status === 400) {
    // Some providers/models don't support response_format — retry without it.
    const detail = await raw.text().catch(() => '');
    if (!/response_format|json/i.test(detail)) {
      // not a json-mode issue; surface the real error
      throw new Error(`Translation engine error ${raw.status}: ${detail.slice(0, 300)}`);
    }
    raw = await call(false);
  }

  if (!raw.ok) {
    const detail = await raw.text().catch(() => '');
    // One retry on transient failures (429/5xx).
    if (raw.status === 429 || raw.status >= 500) {
      await new Promise((r) => setTimeout(r, 2500));
      const retry = await call(true);
      if (retry.status === 400) {
        const retry2 = await call(false);
        if (retry2.ok) return parseCompletion(await retry2.json());
      }
      if (retry.ok) return parseCompletion(await retry.json());
    }
    throw new Error(`Translation engine error ${raw.status}: ${detail.slice(0, 300)}`);
  }

  return parseCompletion(await raw.json());
}

function translateWithOpenAI(system: string, user: string, apiKey: string, model: string): Promise<BatchResult> {
  return postChatCompletion('https://api.openai.com/v1/chat/completions', apiKey, model, system, user);
}

function translateWithOpenRouter(system: string, user: string, apiKey: string, model: string): Promise<BatchResult> {
  return postChatCompletion(
    'https://openrouter.ai/api/v1/chat/completions',
    apiKey,
    model,
    system,
    user,
    {
      'HTTP-Referer': 'https://creatorsaicenter.vercel.app',
      'X-Title': 'CreatorAI Hub',
    }
  );
}

/** Google Gemini (generativelanguage.googleapis.com) — free tier supported. */
async function translateWithGemini(system: string, user: string, apiKey: string, model: string): Promise<BatchResult> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const body = {
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: 'user', parts: [{ text: user }] }],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json',
    },
  };

  const call = async () =>
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120_000),
    });

  let raw = await call();
  if (!raw.ok) {
    const detail = await raw.text().catch(() => '');
    // One retry on transient rate limits (429/5xx).
    if (raw.status === 429 || raw.status >= 500) {
      await new Promise((r) => setTimeout(r, 3000));
      raw = await call();
      if (raw.ok) return parseGemini(await raw.json());
    }
    throw new Error(`Gemini error ${raw.status}: ${detail.slice(0, 300)}`);
  }

  return parseGemini(await raw.json());
}

function parseGemini(json: {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
}): BatchResult {
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
  let parsed: Record<string, unknown> = {};
  try {
    parsed = JSON.parse(text.replace(/^```(?:json)?|```$/gm, '').trim());
  } catch {
    const m = text.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        parsed = JSON.parse(m[0]);
      } catch {
        return EMPTY_RESULT;
      }
    } else {
      return EMPTY_RESULT;
    }
  }
  const translations: Record<number, string> = {};
  for (const [k, v] of Object.entries(parsed)) {
    const idx = Number(k);
    if (Number.isInteger(idx) && typeof v === 'string' && v.trim()) {
      translations[idx] = v.trim();
    }
  }
  return { translations, model: TRANSLATION_MODEL, truncated: false };
}


function parseCompletion(json: {
  choices?: { message?: { content?: string } }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number };
}): BatchResult {
  const content = json.choices?.[0]?.message?.content ?? '{}';
  let parsed: Record<string, unknown> = {};
  try {
    parsed = JSON.parse(content.replace(/^```(?:json)?|```$/gm, '').trim());
  } catch {
    // Extremely defensive fallback: try to salvage {…} object.
    const m = content.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        parsed = JSON.parse(m[0]);
      } catch {
        return EMPTY_RESULT;
      }
    } else {
      return EMPTY_RESULT;
    }
  }

  const translations: Record<number, string> = {};
  for (const [k, v] of Object.entries(parsed)) {
    const idx = Number(k);
    if (Number.isInteger(idx) && typeof v === 'string' && v.trim()) {
      translations[idx] = v.trim();
    }
  }
  return { translations, model: TRANSLATION_MODEL, truncated: false };
}

/**
 * Translate every string field of a flat-ish object in one call.
 * `fields` maps a stable key → the source string; returns key → translation.
 */
export async function translateFields(
  fields: Record<string, string>,
  locale: string,
  opts: { context?: string; glossary?: Record<string, string>; protectedTerms?: string[] } = {}
): Promise<Record<string, string> | null> {
  const keys = Object.keys(fields);
  if (keys.length === 0) return {};
  const ordered = keys.map((k) => fields[k]);
  const res = await translateBatch({
    locale,
    texts: ordered,
    context: opts.context,
    glossary: opts.glossary,
    protectedTerms: opts.protectedTerms,
  });
  if (!res) return null;
  const out: Record<string, string> = {};
  for (let i = 0; i < keys.length; i++) {
    const tr = res.translations[i];
    if (tr) out[keys[i]] = tr;
  }
  return out;
}

/** sha1 hex of a source string — used to detect content changes. */
export function hashSource(text: string): string {
  return createHash('sha1').update(text).digest('hex');
}
