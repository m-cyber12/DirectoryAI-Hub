/** @type {import('next').NextConfig} */
const createNextIntlPlugin = require('next-intl/plugin');

// i18n (2026-08-07): locale dictionaries live in messages/{locale}.json and
// are resolved per-request by src/i18n/request.ts. The plugin also exposes
// getLocale() in the root layout so <html lang dir> follows the route.
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/**
 * Audit fix 1.8 — the live site returned zero security headers.
 * Verified with: curl -sI https://directory-ai-hub.vercel.app/
 * That left the site open to clickjacking and MIME sniffing.
 */
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // 'unsafe-inline' is required for Next.js inline bootstrap + JSON-LD blocks.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://images.unsplash.com https://www.google.com https://logo.clearbit.com https://*.supabase.co",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co https://vitals.vercel-insights.com https://va.vercel-scripts.com",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      'upgrade-insecure-requests',
    ].join('; '),
  },
];

const nextConfig = {
  reactStrictMode: true,
  images: {
    // `domains` is deprecated in Next 15 — remotePatterns is the supported form.
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'logo.clearbit.com' },
      { protocol: 'https', hostname: 'www.google.com' },
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  // Audit fix 5.4 — lucide-react was imported as a barrel in every client
  // component, pulling far more icon code into the bundle than was used.
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },

  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      {
        // Long-lived immutable cache for the dynamic embeddable badge SVGs.
        source: '/badge/:slug*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=3600, s-maxage=86400' }],
      },
    ];
  },

  async redirects() {
    return [
      // Legacy/typo paths kept alive so existing inbound links don't 404.
      { source: '/tool', destination: '/tools', permanent: true },
      { source: '/categories', destination: '/tools', permanent: true },
    ];
  },
};

module.exports = withNextIntl(nextConfig);
