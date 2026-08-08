import { NextResponse } from 'next/server';
import { rateLimit, clientIp } from '@/lib/rateLimit';
import {
  ADMIN_COOKIE,
  adminCookieOptions,
  createSessionToken,
  isAdminAuthorized,
  safeEqual,
} from '@/lib/adminAuth';

/**
 * Audit fix 6.2.
 *  - The session cookie no longer contains the password (see lib/adminAuth.ts).
 *  - Password comparison is constant-time rather than `===`.
 *  - Added DELETE so an admin can actually log out; previously the only way
 *    to end a session was to wait eight hours or clear cookies manually.
 */

export async function POST(request: Request) {
  if (!rateLimit(`adminauth:${clientIp(request)}`, 5, 15 * 60_000)) {
    return NextResponse.json(
      { error: 'Too many attempts. Try again in 15 minutes.' },
      { status: 429 }
    );
  }

  try {
    const { password } = await request.json();
    const expected = process.env.ADMIN_PASSWORD;

    if (!expected) {
      return NextResponse.json(
        {
          error:
            'ADMIN_PASSWORD is not configured on the server. Set it in Vercel → Settings → Environment Variables.',
        },
        { status: 503 }
      );
    }

    if (typeof password !== 'string' || !safeEqual(password, expected)) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
    }

    const token = createSessionToken();
    if (!token) {
      return NextResponse.json({ error: 'Session signing is not configured.' }, { status: 503 });
    }

    const response = NextResponse.json({ success: true }, { status: 200 });
    response.cookies.set(ADMIN_COOKIE, token, adminCookieOptions);
    return response;
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

/** Log out — clears the session cookie. */
export async function DELETE() {
  const response = NextResponse.json({ success: true }, { status: 200 });
  response.cookies.set(ADMIN_COOKIE, '', { ...adminCookieOptions, maxAge: 0 });
  return response;
}

/** Lets the admin UI check whether the current session is still valid. */
export async function GET() {
  return NextResponse.json({ authenticated: await isAdminAuthorized() }, { status: 200 });
}
