import { NextResponse } from 'next/server';
import { isAdminAuthorized, issueCsrfToken, getAdminSessionToken } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/auth/csrf — issues a CSRF token bound to the current admin
 * session (audit fix 6.2 / 2.3). The admin client sends it back in the
 * `x-csrf-token` header on every POST/PATCH/DELETE so the server can verify
 * the request is not a cross-site forgery.
 */
export async function GET() {
  if (!(await isAdminAuthorized())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const sessionToken = await getAdminSessionToken();
  const token = sessionToken ? issueCsrfToken(sessionToken) : null;
  if (!token) {
    return NextResponse.json(
      { error: 'Could not issue a CSRF token — ADMIN_SESSION_SECRET is not set.' },
      { status: 500 }
    );
  }
  return NextResponse.json({ token });
}
