import type { Metadata } from 'next';
import Link from '@/i18n/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ALL_TOOLS, CATEGORIES } from '@/data/tools';
import { SITE_URL, SITE_NAME } from '@/config/site';
import { Code2, Zap, Shield, Database } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Public API — Free AI Tools Data for Developers',
  description: `Free read-only JSON API with ${ALL_TOOLS.length}+ curated AI video tools: names, categories, pricing, verification levels, and tags. Rate-limited, no key required.`,
  alternates: { canonical: '/developers' },
  openGraph: {
    title: 'Public API — Free AI Tools Data for Developers',
    description: `Free read-only JSON API with ${ALL_TOOLS.length}+ curated AI video tools. Rate-limited, no key required.`,
    type: 'website',
  },
};

const EXAMPLE = `curl "${SITE_URL}/api/v1/tools?q=voice%20cloning&pricing=Freemium&limit=5"`;

const RESPONSE = `{
  "meta": {
    "total": 12,
    "count": 5,
    "limit": 5,
    "offset": 0,
    "source": "${SITE_NAME} Public API v1"
  },
  "data": [
    {
      "name": "ElevenLabs",
      "slug": "elevenlabs",
      "tagline": "Most realistic AI voice cloning",
      "category": "Voice & Audio",
      "pricing": "Freemium",
      "startingPrice": "$5/mo",
      "verification_level": "pricing-verified",
      "verified_score": null,
      "pricing_source_url": "https://elevenlabs.io/pricing",
      "pricing_checked_at": "2026-08-04",
      "tags": ["Voice Cloning", "Text to Speech"],
      "detailPage": "${SITE_URL}/tool/elevenlabs"
    }
  ]
}`;

export default function DevelopersPage() {
  return (
    <div className="min-h-screen bg-surface-0 text-white">
      <Header />
      <main id="main" className="mx-auto max-w-4xl px-4 py-14">
        <span className="inline-flex items-center gap-2 rounded-full bg-accent-500/10 border border-accent-500/20 px-4 py-1.5 text-xs font-semibold text-accent-300 mb-5">
          <Code2 className="h-3.5 w-3.5" /> Public API v1 — Free
        </span>
        <h1 className="text-3xl md:text-5xl font-black tracking-tight">Build with our tools data</h1>
        <p className="mt-4 max-w-2xl text-sm text-zinc-400 leading-relaxed">
          A free, read-only JSON API exposing all {ALL_TOOLS.length}+ curated AI tools — names, categories, verified pricing,
          verification levels, verified benchmark scores, and tags. No API key required. Just add attribution with a link back to CreatorAI Hub.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { icon: Zap, title: 'No key required', desc: '60 requests/min per IP. CORS enabled for browser apps.' },
            { icon: Database, title: `${ALL_TOOLS.length}+ tools`, desc: `${CATEGORIES.length - 1} categories, refreshed with every site update.` },
            { icon: Shield, title: 'Cached & fast', desc: 'Edge-cached for 1 hour with stale-while-revalidate.' },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-white/10 bg-zinc-900/50 p-5">
              <f.icon className="h-5 w-5 text-accent-400" />
              <h3 className="mt-2 text-sm font-bold">{f.title}</h3>
              <p className="mt-1 text-xs text-zinc-500">{f.desc}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-12 text-xl font-bold">Endpoint</h2>
        <pre className="mt-3 overflow-x-auto rounded-2xl border border-white/10 bg-zinc-950 p-5 text-xs text-emerald-300">
GET /api/v1/tools
        </pre>

        <h2 className="mt-8 text-xl font-bold">Query Parameters</h2>
        <div className="mt-3 overflow-hidden rounded-2xl border border-white/10">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-900 text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-bold">Param</th>
                <th className="px-4 py-3 font-bold">Type</th>
                <th className="px-4 py-3 font-bold">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-zinc-950/60 text-zinc-300">
              <tr><td className="px-4 py-3 font-mono text-accent-300">q</td><td className="px-4 py-3">string</td><td className="px-4 py-3">Search query — typo & synonym tolerant (e.g. <code>caption</code> also matches <code>subtitles</code>).</td></tr>
              <tr><td className="px-4 py-3 font-mono text-accent-300">category</td><td className="px-4 py-3">string</td><td className="px-4 py-3">One of: {CATEGORIES.filter((c) => c !== 'All').join(', ')}.</td></tr>
              <tr><td className="px-4 py-3 font-mono text-accent-300">pricing</td><td className="px-4 py-3">string</td><td className="px-4 py-3">Free · Freemium · Paid · Free Trial</td></tr>
              <tr><td className="px-4 py-3 font-mono text-accent-300">tested</td><td className="px-4 py-3">1</td><td className="px-4 py-3">Only hands-on-tested tools — the only entries that can carry a <code>verified_score</code>.</td></tr>
              <tr><td className="px-4 py-3 font-mono text-accent-300">tags</td><td className="px-4 py-3">csv</td><td className="px-4 py-3">AND-filter on catalog tags, case-insensitive (e.g. <code>Shorts,Auto-Captions</code>).</td></tr>
              <tr><td className="px-4 py-3 font-mono text-accent-300">limit</td><td className="px-4 py-3">int</td><td className="px-4 py-3">1–100, default 50.</td></tr>
              <tr><td className="px-4 py-3 font-mono text-accent-300">offset</td><td className="px-4 py-3">int</td><td className="px-4 py-3">Pagination offset, default 0.</td></tr>
            </tbody>
          </table>
        </div>

        <h2 className="mt-8 text-xl font-bold">Example</h2>
        <pre className="mt-3 overflow-x-auto rounded-2xl border border-white/10 bg-zinc-950 p-5 text-xs text-zinc-300">{EXAMPLE}</pre>

        <h2 className="mt-8 text-xl font-bold">Response</h2>
        <pre className="mt-3 overflow-x-auto rounded-2xl border border-white/10 bg-zinc-950 p-5 text-xs text-zinc-300">{RESPONSE}</pre>

        <div className="mt-10 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 text-xs leading-relaxed text-amber-200/80">
          <strong className="text-amber-300">Terms:</strong> Free for personal and non-commercial projects with visible attribution
          (&quot;Data by CreatorAI Hub&quot; + link). For commercial usage, bulk exports, or webhooks,{' '}
          <Link href="/contact" className="underline">contact us</Link>.
        </div>
      </main>
      <Footer />
    </div>
  );
}
