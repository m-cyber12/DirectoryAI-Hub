import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

/**
 * Locale-aware navigation primitives. Every file in the app must import
 * `Link`, `useRouter`, `usePathname` and `redirect` from HERE instead of
 * `next/link` / `next/navigation` so that hrefs automatically carry the
 * active locale prefix (`/fa/tool/opusclip`, …).
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);

/**
 * The codebase historically imported `Link` as a default export
 * (`import Link from 'next/link'`). Re-export it as default too so the
 * global import swap stayed a pure one-line change per file.
 */
export default Link;
