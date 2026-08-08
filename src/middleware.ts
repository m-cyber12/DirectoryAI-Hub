import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

/**
 * Locale middleware (next-intl). Responsibilities:
 *
 *  - Rewrites `/es`, `/pt`, `/fr`, `/de`, `/zh`, `/ar`, `/fa/...` onto the
 *    `[locale]` route segment and serves `/` as English (localePrefix
 *    'as-needed').
 *  - Emits `<link rel="alternate" hreflang="...">` headers on every response.
 *  - Offers first-time visitors their Accept-Language locale when supported
 *    (localeDetection), via a 307 redirect that sets a neutral cookie so the
 *    choice sticks.
 *
 * IMPORTANT — why `en` is in the skip list:
 * With `localePrefix: 'as-needed'`, the middleware rewrites `/` to `/en`
 * internally so the `[locale]` segment resolves. If the matcher ALSO matches
 * `/en`, Next.js re-runs this middleware on the rewritten path, and
 * `as-needed` mode then treats `/en` as a non-canonical default-locale URL
 * and 307-redirects it back to `/` — an infinite `/` ⇄ `/en` loop that made
 * the Playwright webServer health check (and any curl) time out.
 * Excluding `en` from the matcher breaks the loop: `/en` renders directly
 * (still valid, just non-canonical — Google already canonicalizes to `/`).
 *
 * Only the App Router segment and its static assets pass through the
 * middleware — API routes, feeds, sitemap, robots and the badge generator
 * stay untouched.
 */
export default createMiddleware(routing);

export const config = {
  matcher: [
    '/((?!api|_next|_vercel|.*\\..*|en|badge|go|feed\\.xml|feed-tools\\.xml|llms\\.txt|robots\\.txt|sitemap\\.xml|manifest\\.webmanifest).*)',
  ],
};
