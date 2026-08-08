import { NextResponse } from 'next/server';
import { localizeEntityBatch, isEnglish, type EntityType } from '@/lib/i18n/content';

/**
 * Public content-translation API.
 *
 * Serves pre-translated catalog content to client components:
 *   GET /api/i18n/content?locale=fa&type=tool&ids=opusclip,munch
 *
 * Reads the same layers as server rendering (Supabase cache → committed
 * snapshots → English fallback) so client-side views are localized without
 * leaking any engine credentials. Rows that have no translation are omitted
 * and the client falls back to the English it already has.
 */
export const dynamic = 'force-dynamic';

const VALID_TYPES: EntityType[] = ['tool', 'news', 'blog', 'category', 'tag', 'deepDive'];

export async function GET(request: Request) {
  const url = new URL(request.url);
  const locale = (url.searchParams.get('locale') ?? 'en').slice(0, 8);
  const type = url.searchParams.get('type') as EntityType | null;
  const idsParam = url.searchParams.get('ids') ?? '';
  const ids = idsParam
    .split(',')
    .map((s) => s.trim().slice(0, 120))
    .filter(Boolean)
    .slice(0, 200);

  if (!type || !VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }
  if (ids.length === 0) {
    return NextResponse.json({ error: 'Missing ids' }, { status: 400 });
  }
  if (isEnglish(locale)) {
    // Nothing to translate — the client already has the English source.
    return NextResponse.json({});
  }

  const data = await localizeEntityBatch(type, ids, locale);
  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'public, max-age=300, s-maxage=3600' },
  });
}
