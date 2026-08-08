import { SITE_NAME, SITE_TAGLINE } from '@/config/site';

/**
 * Audit fix 3.2 — /manifest.json returned 404, so the site could not be
 * installed on mobile and lost the PWA signal. Served as .webmanifest, which
 * is the correct MIME type.
 */

export const dynamic = 'force-static';

export async function GET() {
  const manifest = {
    name: `${SITE_NAME} — ${SITE_TAGLINE}`,
    short_name: SITE_NAME,
    description:
      'Find the right AI tool for video work in under a minute. Honest verification labels, side-by-side comparison, and a graveyard of tools that no longer exist.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#0E0F12',
    theme_color: '#0E0F12',
    categories: ['productivity', 'utilities', 'business'],
    icons: [
      { src: '/logo.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
    ],
    shortcuts: [
      { name: 'All tools', url: '/tools', description: 'Browse the full catalog' },
      { name: 'Compare', url: '/compare', description: 'Compare tools side by side' },
      { name: 'Stack builder', url: '/stack-builder', description: 'Build your toolchain' },
    ],
  };

  return new Response(JSON.stringify(manifest, null, 2), {
    headers: {
      'Content-Type': 'application/manifest+json; charset=utf-8',
      'Cache-Control': 'public, s-maxage=86400',
    },
  });
}
