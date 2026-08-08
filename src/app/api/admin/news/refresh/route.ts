import { NextResponse } from 'next/server';
import { isAdminAuthorized, requireCsrf } from '@/lib/adminAuth';
import { runNewsIngest } from '@/lib/newsIngest';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * v2.8 admin upgrade: run the ingestion pipeline right now from the panel
 * (no waiting for the hourly cron, no needing the CRON_SECRET). Session-based
 * admin auth only.
 */
export async function POST(request: Request) {
  if (!(await isAdminAuthorized())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!(await requireCsrf(request))) {
    return NextResponse.json({ error: 'Invalid or missing CSRF token' }, { status: 403 });
  }
  const result = await runNewsIngest();
  return NextResponse.json({ ...result, refreshedAt: new Date().toISOString() });
}
