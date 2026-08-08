import 'server-only';
import { createHmac, timingSafeEqual, randomBytes } from 'crypto';
import { cookies } from 'next/headers';

/**
 * Signed admin session tokens.
 *
 * Audit fix 6.2 — the session cookie's value was literally the admin password:
 *     const sessionToken = process.env.ADMIN_SESSION_TOKEN || expected || '';
 *     response.cookies.set('creatorai_admin_session', sessionToken, …)
 * Any cookie leak — an XSS bug, a shared browser, a proxy log — handed over
 * the password itself, not just a session. Password comparison was also a
 * plain `===`, which is vulnerable to timing analysis.
 *
 * Now: the cookie holds `expiry.nonce.hmac`, signed with a server secret.
 * It carries no secret material, expires on its own, and is verified in
 * constant time. Rotating ADMIN_SESSION_SECRET invalidates every session.
 */

export const ADMIN_COOKIE = 'creatorai_admin_session';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

function signingSecret(): string | null {
  // Prefer a dedicated secret; fall back to the password so existing
  // deployments keep working, but warn loudly in development.
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD;
  if (!secret) return null;
  if (!process.env.ADMIN_SESSION_SECRET && process.env.NODE_ENV !== 'production') {
    console.warn(
      '[adminAuth] ADMIN_SESSION_SECRET is not set — falling back to ADMIN_PASSWORD for signing. ' +
        'Set a separate random secret: openssl rand -hex 32'
    );
  }
  return secret;
}

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

/** Constant-time string comparison that tolerates length differences. */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  // Always compare equal-length buffers so length alone leaks nothing.
  const len = Math.max(bufA.length, bufB.length, 1);
  const padA = Buffer.alloc(len);
  const padB = Buffer.alloc(len);
  bufA.copy(padA);
  bufB.copy(padB);
  return timingSafeEqual(padA, padB) && bufA.length === bufB.length;
}

/** Create a signed token. Contains no secret material. */
export function createSessionToken(): string | null {
  const secret = signingSecret();
  if (!secret) return null;
  const expires = Date.now() + SESSION_TTL_MS;
  const nonce = randomBytes(16).toString('hex');
  const payload = `${expires}.${nonce}`;
  return `${payload}.${sign(payload, secret)}`;
}

/** Verify a token's signature and expiry. */
export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const secret = signingSecret();
  if (!secret) return false;

  const parts = token.split('.');
  if (parts.length !== 3) return false;

  const [expiresRaw, nonce, providedSig] = parts;
  const expected = sign(`${expiresRaw}.${nonce}`, secret);
  if (!safeEqual(providedSig, expected)) return false;

  const expires = Number(expiresRaw);
  return Number.isFinite(expires) && Date.now() < expires;
}

/** Verify the admin session from the request cookies. */
export async function isAdminAuthorized(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(ADMIN_COOKIE)?.value);
}

/** Cookie options shared by login and logout. */
export const adminCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: SESSION_TTL_MS / 1000,
};

/**
 * CSRF token bound to the current session (audit fix 6.2 — no CSRF protection
 * existed on admin POST/PATCH/DELETE).
 */
export function issueCsrfToken(sessionToken: string): string | null {
  const secret = signingSecret();
  if (!secret) return null;
  return sign(`csrf:${sessionToken}`, secret);
}

export function verifyCsrfToken(sessionToken: string | undefined, csrf: string | null): boolean {
  if (!sessionToken || !csrf) return false;
  const expected = issueCsrfToken(sessionToken);
  return expected !== null && safeEqual(csrf, expected);
}

/**
 * Read the signed admin session token from the current request cookies.
 * Server-only (uses next/headers).
 */
export async function getAdminSessionToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(ADMIN_COOKIE)?.value;
}

/**
 * Server-side CSRF gate for admin mutation routes (audit fix 6.2 / 2.3).
 *
 * The admin client fetches a token from GET /api/admin/auth/csrf and sends it
 * in the `x-csrf-token` header on every POST/PATCH/DELETE. This verifies that
 * the request originates from a page that can read the session cookie
 * (SameSite=Lax) and carries the matching token. Call AFTER
 * `isAdminAuthorized()`.
 */
export async function requireCsrf(request: Request): Promise<boolean> {
  const header = request.headers.get('x-csrf-token');
  if (!header) return false;
  const sessionToken = await getAdminSessionToken();
  return verifyCsrfToken(sessionToken, header);
}
