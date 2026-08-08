import { NextResponse } from 'next/server';
import { isAdminAuthorized, requireCsrf } from '@/lib/adminAuth';
import {
  readDbProviderConfig,
  writeDbProviderConfig,
  maskKey,
  getEffectiveProvider,
  getProviderModel,
  type DbProviderConfig,
} from '@/lib/i18n/providerSettings';
import { translateBatch } from '@/lib/i18n/engine';
import { LOCALE_NATIVE_NAMES } from '@/lib/i18n/engine';

/**
 * Admin panel → translation engine configuration.
 *
 *  GET  /api/admin/i18n/provider   — effective provider + MASKED keys (never raw)
 *  PUT  /api/admin/i18n/provider   — save provider, API keys, model overrides
 *  POST /api/admin/i18n/provider/test — run a 2-string translation to verify
 *
 * Keys are stored in site_settings (i18n_*) and read server-side only. The
 * public GET /api/settings never returns them.
 */
export const dynamic = 'force-dynamic';

const VALID_PROVIDERS = ['openai', 'gemini', 'openrouter'];

export async function GET() {
  if (!(await isAdminAuthorized())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const dbCfg = await readDbProviderConfig(true);
  const effective = await getEffectiveProvider();
  const model = effective ? await getProviderModel(effective) : '';

  return NextResponse.json({
    effective: effective ?? null,
    effectiveModel: model,
    db: {
      provider: dbCfg.provider ?? '',
      geminiApiKey: maskKey(dbCfg.geminiApiKey),
      openrouterApiKey: maskKey(dbCfg.openrouterApiKey),
      openaiApiKey: maskKey(dbCfg.openaiApiKey),
      geminiModel: dbCfg.geminiModel ?? '',
      openrouterModel: dbCfg.openrouterModel ?? '',
    },
    env: {
      provider: process.env.TRANSLATION_PROVIDER ?? '',
      hasOpenAI: Boolean(process.env.OPENAI_API_KEY),
      hasGemini: Boolean(process.env.GEMINI_API_KEY),
      hasOpenRouter: Boolean(process.env.OPENROUTER_API_KEY),
    },
  });
}

export async function PUT(request: Request) {
  if (!(await isAdminAuthorized())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!(await requireCsrf(request))) {
    return NextResponse.json({ error: 'Invalid or missing CSRF token' }, { status: 403 });
  }

  let body: DbProviderConfig & { clear?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const provider = (body.provider ?? '').trim();
  if (provider && !VALID_PROVIDERS.includes(provider)) {
    return NextResponse.json({ error: `Provider must be one of: ${VALID_PROVIDERS.join(', ')}` }, { status: 400 });
  }

  // Empty string means "clear this key". Build a config that sets/clears
  // each field explicitly.
  const cfg: DbProviderConfig = {
    provider: provider || undefined,
    geminiApiKey: body.geminiApiKey?.trim() || undefined,
    openrouterApiKey: body.openrouterApiKey?.trim() || undefined,
    openaiApiKey: body.openaiApiKey?.trim() || undefined,
    geminiModel: body.geminiModel?.trim() || undefined,
    openrouterModel: body.openrouterModel?.trim() || undefined,
  };

  // If the admin left a key field empty (did not type anything), keep the
  // existing value unless they explicitly passed clear: ['geminiApiKey'].
  const existing = await readDbProviderConfig(true);
  for (const k of ['geminiApiKey', 'openrouterApiKey', 'openaiApiKey'] as const) {
    if (cfg[k] === undefined && body[k] === '' && !(body.clear ?? []).includes(k)) {
      cfg[k] = existing[k];
    }
    if ((body.clear ?? []).includes(k)) cfg[k] = undefined;
  }

  const res = await writeDbProviderConfig(cfg);
  if (!res.ok) {
    return NextResponse.json({ error: res.error }, { status: 400 });
  }
  return NextResponse.json({ success: true, updated: Object.keys(cfg).filter((k) => cfg[k as keyof DbProviderConfig] !== undefined).length });
}

export async function POST(request: Request) {
  if (!(await isAdminAuthorized())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!(await requireCsrf(request))) {
    return NextResponse.json({ error: 'Invalid or missing CSRF token' }, { status: 403 });
  }

  const effective = await getEffectiveProvider();
  if (!effective) {
    return NextResponse.json({ ok: false, message: 'No translation provider configured yet.' }, { status: 200 });
  }
  const model = await getProviderModel(effective);

  try {
    const res = await translateBatch({
      locale: 'fa',
      texts: [
        'Turn long videos into viral shorts.',
        'Automated Shorts generator with AI voices and captions.',
      ],
      context: 'Provider test — two short catalog strings.',
    });
    if (!res || Object.keys(res.translations).length === 0) {
      return NextResponse.json(
        { ok: false, message: 'Engine returned no output — check the key and quota.' },
        { status: 200 }
      );
    }
    const sample = res.translations[0] ?? '';
    return NextResponse.json({
      ok: true,
      provider: effective,
      model,
      sample: sample.slice(0, 80),
      note: LOCALE_NATIVE_NAMES.fa,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        message: err instanceof Error ? err.message.slice(0, 200) : 'Unknown error',
        provider: effective,
        model,
      },
      { status: 200 }
    );
  }
}
