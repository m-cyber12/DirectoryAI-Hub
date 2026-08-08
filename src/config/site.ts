/**
 * Single source of truth for site-wide constants.
 *
 * Audit fix 1.10: SITE_URL was hardcoded in 5+ files (layout, sitemap, robots,
 * api/v1/tools, tool/[slug]). Changing the domain meant a search-and-replace.
 * Everything now reads from here. To move to a custom domain, set
 * NEXT_PUBLIC_SITE_URL in the environment and redeploy — nothing else changes.
 */

const FALLBACK_URL = 'https://creatorsaicenter.vercel.app';

/** Absolute origin, never with a trailing slash. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || FALLBACK_URL).replace(/\/$/, '');

export const SITE_NAME = 'CreatorAI Hub';
export const SITE_TAGLINE = 'The Curated AI Toolbox for Video Creators';

/**
 * Contact email.
 * Audit fix 1.10: /contact advertised hello@creatoraihub.com while the site runs
 * on creatorsaicenter.vercel.app — a mismatch that reads as a scam signal.
 * Derived from the live host so it can never drift again.
 */
export const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL || `hello@${new URL(SITE_URL).hostname}`;

/** Build an absolute URL from a site-relative path. */
export const absoluteUrl = (path = '/') => `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;

/**
 * Editorial policy flags.
 *
 * SHOW_UNVERIFIED_SCORES — audit fix 2.1 (rating inflation) and 1.1/1.2 (fake
 * trust claims). 153 of 200 tools were machine-generated with invented ratings
 * between 4.1 and 4.9 and reviewsCount: 0. Publishing those as "Editorial Score"
 * next to an affiliate link is an FTC 16 CFR 255 problem and a Google
 * scaled-content-abuse problem.
 *
 * While this is false, a numeric score is shown ONLY for tools you have marked
 * verificationLevel: 'hands-on-tested' with a real testedAt date. Everything
 * else shows an honest verification badge instead of a number.
 *
 * Flip to true only once every listed tool genuinely carries a defensible score.
 */
export const SHOW_UNVERIFIED_SCORES = false;

/**
 * Minimum number of real, approved community reviews before an
 * aggregateRating is emitted in structured data. Google treats invented
 * aggregateRating as structured-data spam (audit fix 1.2).
 */
export const MIN_REVIEWS_FOR_AGGREGATE_RATING = 3;

export const SOCIAL = {
  twitter: '@creatoraihub',
} as const;
