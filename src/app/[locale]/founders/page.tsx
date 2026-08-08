import type { Metadata } from 'next';
import Link from '@/i18n/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { FounderClaimForm } from './FounderClaimForm';
import { SmartImage } from '@/components/SmartImage';
import { SITE_NAME, SITE_URL } from '@/config/site';
import { ShieldCheck, Trophy, Sparkles, CheckCircle2, Code2, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Founder Program — Claim Your AI Tool Profile & Embed Badge',
  description:
    'Claim ownership of your AI video tool profile on CreatorAI Hub. Get official founder verification, direct pricing updates, and our embeddable SVG backlink badge.',
  alternates: { canonical: '/founders' },
  openGraph: {
    title: 'Founder Program — Claim Your AI Tool Profile & Embed Badge',
    description:
      'Claim ownership of your AI video tool profile: official founder verification, direct pricing updates, and an embeddable badge.',
    type: 'website',
  },
};

export default function FoundersPage() {
  const exampleBadgeUrl = `${SITE_URL}/badge/opusclip.svg`;
  const exampleSnippet = `<a href="${SITE_URL}/tool/opusclip" target="_blank" rel="noopener">\n  <img src="${exampleBadgeUrl}" alt="Featured on ${SITE_NAME}" />\n</a>`;

  return (
    <div className="min-h-screen bg-surface-0 text-white">
      <Header />

      <main id="main" className="mx-auto max-w-5xl px-4 py-14">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-white/10">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-accent-500/10 border border-accent-500/20 px-4 py-1.5 text-xs font-semibold text-accent-300 mb-4">
              <Trophy className="h-3.5 w-3.5" /> Official Founder &amp; Partner Program
            </span>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight">Claim Your AI Tool Profile</h1>
            <p className="mt-3 max-w-2xl text-sm text-zinc-400 leading-relaxed">
              Are you building an AI tool listed on {SITE_NAME}? Claim your official profile to manage pricing details,
              earn the Verified Founder Badge, and embed our authority badge on your site.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-surface-1 border border-white/10 rounded-2xl px-5 py-3">
            <ShieldCheck className="h-6 w-6 text-emerald-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-white">Free Founder Verification</div>
              <div className="text-2xs text-zinc-500">Domain-verified ownership</div>
            </div>
          </div>
        </div>

        {/* Benefits Grid */}
        <section className="mt-12 grid gap-6 sm:grid-cols-3">
          {[
            {
              icon: ShieldCheck,
              title: 'Official Founder Badge',
              desc: 'Displays a verified founder checkmark on your tool card and detail page, signaling authenticity to creators.',
              color: 'text-emerald-400',
            },
            {
              icon: Sparkles,
              title: 'Priority 24-Point Benchmark',
              desc: 'Tools in our Founder Program get prioritized for our hands-on editorial benchmark and video review tests.',
              color: 'text-accent-400',
            },
            {
              icon: Code2,
              title: 'Embeddable Authority Badge',
              desc: 'Display an official SVG badge on your homepage or footer, dynamically rendered from our backlink engine.',
              color: 'text-amber-300',
            },
          ].map((benefit) => (
            <div key={benefit.title} className="rounded-2xl border border-white/10 bg-surface-1 p-6">
              <benefit.icon className={`h-7 w-7 ${benefit.color}`} />
              <h3 className="mt-4 text-base font-bold text-white">{benefit.title}</h3>
              <p className="mt-1.5 text-xs text-zinc-400 leading-relaxed">{benefit.desc}</p>
            </div>
          ))}
        </section>

        {/* Two-Column Area: Claim Form & Badge Generator */}
        <div className="mt-14 grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <h2 className="text-xl font-bold mb-4">Claim Ownership Form</h2>
            <FounderClaimForm />
          </div>

          <div className="lg:col-span-5 space-y-8">
            {/* Live SVG Badge Generator */}
            <div className="rounded-3xl border border-accent-500/30 bg-gradient-to-br from-accent-500/10 via-surface-1 to-surface-2 p-6 sm:p-8">
              <span className="text-2xs font-bold uppercase tracking-wider text-accent-300">
                Backlink Authority Engine
              </span>
              <h3 className="mt-1 text-xl font-extrabold text-white">Your Embeddable Badge</h3>
              <p className="mt-2 text-xs text-zinc-300 leading-relaxed">
                We generate a dynamic SVG badge for every listed tool. Once verified, embed this snippet in your footer
                or &quot;Featured On&quot; section.
              </p>

              <div className="mt-6 rounded-2xl bg-black/60 border border-white/10 p-5 flex items-center justify-center">
                <SmartImage src="/badge/opusclip.svg" alt="Featured on CreatorAI Hub" width={180} height={48} className="max-h-12 w-auto" />
              </div>

              <div className="mt-6">
                <div className="text-2xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  HTML Embed Snippet (Replace slug with yours):
                </div>
                <pre className="overflow-x-auto rounded-xl bg-zinc-950 border border-white/10 p-3 text-2xs font-mono text-accent-300 leading-relaxed">
                  {exampleSnippet}
                </pre>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-surface-1 p-6">
              <h3 className="text-base font-bold text-white">Already claimed your tool?</h3>
              <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
                If you have already claimed ownership and want to submit new pricing, features, or exclusive coupon codes
                for our Deals page, email us directly.
              </p>
              <Link
                href="/contact"
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-accent-400 hover:underline"
              >
                <span>Contact Editorial Team</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
