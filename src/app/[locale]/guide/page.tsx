import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from '@/i18n/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ALL_TOOLS, hasVerifiedScore } from '@/data/tools';
import { REAL_CATEGORIES, categorySlug, getCategoryTools } from '@/lib/categories';
import {
  Search,
  Layers,
  FlaskConical,
  Skull,
  ArrowRight,
  BookOpen,
  ShieldCheck,
  Star,
  Lightbulb,
  Zap,
} from 'lucide-react';

/**
 * Audit fix 3.6 — Getting Started guide.
 * The audit recommended a "New to AI video tools? Start here" page
 * to reduce bounce rate for first-time visitors and provide a
 * human-readable onboarding to the site's unique value propositions.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'guide' });
  return {
    title: t('title'),
    description: t('description'),
    alternates: { canonical: '/guide' },
    openGraph: { title: t('title'), description: t('description'), url: '/guide', type: 'website' },
  };
}

const testedCount = ALL_TOOLS.filter(hasVerifiedScore).length;

const GUIDE_STEPS = [
  {
    icon: Search,
    title: 'Search by what you need, not by tool name',
    description:
      'You don\'t need to know tool names. Type what you want to do — "add captions to TikTok video", "clone my voice for YouTube", "generate B-roll footage" — and we\'ll show you the best options.',
    cta: { label: 'Try a search', href: '/tools?q=caption+generator' },
  },
  {
    icon: ShieldCheck,
    title: 'Look for the verification badge',
    description:
      `Every tool on CreatorAI Hub has one of three verification levels. ${testedCount} tools have been hands-on tested by our team with published scores. Others are pricing-verified or listed from public sources. We never show a fake score.`,
    cta: { label: 'See tested tools', href: '/tools?tested=1' },
  },
  {
    icon: Layers,
    title: 'Build your creator stack',
    description:
      'Most creators need 3-5 tools working together. Our Stack Builder lets you assemble a complete toolchain — video editor + voice tool + thumbnail maker — and see the real monthly cost before subscribing.',
    cta: { label: 'Open Stack Builder', href: '/stack-builder' },
  },
  {
    icon: Star,
    title: 'Compare tools side-by-side',
    description:
      'Found two tools that look similar? Hit the "Compare" button on any tool card to add it to your comparison list, then view them side-by-side with pricing, features, and verification status.',
    cta: { label: 'Browse comparisons', href: '/compare' },
  },
  {
    icon: Skull,
    title: 'Check the Graveyard before subscribing',
    description:
      'AI tools shut down regularly. Before committing to a yearly plan, check our Graveyard — a list of dead tools with migration paths. We check every link weekly.',
    cta: { label: 'Visit the Graveyard', href: '/graveyard' },
  },
  {
    icon: FlaskConical,
    title: 'See our benchmark methodology',
    description:
      'We run every tested tool through the same brief and publish the raw output. No mystery scores, no pay-to-play rankings. You can judge the quality yourself.',
    cta: { label: 'Read methodology', href: '/about' },
  },
];

export default async function GuidePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'guide' });

  const topCategories = [...REAL_CATEGORIES]
    .sort((a, b) => getCategoryTools(b).length - getCategoryTools(a).length)
    .slice(0, 6);

  return (
    <div className="min-h-screen bg-surface-0 text-foreground">
      <Header />

      <main id="main" className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        {/* Hero */}
        <div className="mb-12 text-center">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent-500/20 bg-accent-500/10 px-4 py-1.5 text-2xs font-bold text-accent-300">
            <Lightbulb className="h-3.5 w-3.5" aria-hidden="true" />
            New here? Start with this guide.
          </span>
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
            How to find the right AI tools
            <span className="block text-accent-400">for your video workflow</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-zinc-400">
            CreatorAI Hub catalogues {ALL_TOOLS.length} AI tools for video creators — YouTubers,
            TikTokers, podcasters, and editors. Here is how to get the most out of the site in
            under 5 minutes.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-6">
          {GUIDE_STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className="rounded-2xl border border-white/10 bg-surface-1 p-6 transition-colors hover:border-accent-500/30"
              >
                <div className="flex items-start gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-500/10 text-accent-400">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="flex-1">
                    <h2 className="flex items-center gap-2 text-lg font-bold">
                      <span className="font-mono text-2xs text-zinc-500">{i + 1}.</span>
                      {step.title}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-300">{step.description}</p>
                    <Link
                      href={step.cta.href}
                      className="mt-3 inline-flex items-center gap-1.5 text-2xs font-bold text-accent-400 hover:text-accent-300"
                    >
                      {step.cta.label}
                      <ArrowRight className="h-3 w-3" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick category links */}
        <section className="mt-12">
          <h2 className="mb-5 text-xl font-bold">Popular categories to explore</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {topCategories.map((cat) => (
              <Link
                key={cat}
                href={`/category/${categorySlug(cat)}`}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-surface-1 px-4 py-3 text-sm font-semibold text-zinc-300 transition-colors hover:border-accent-500/40 hover:text-accent-300"
              >
                <span className="truncate">{cat}</span>
                <span className="ml-2 font-mono text-2xs tabular-nums text-zinc-500">
                  {getCategoryTools(cat).length}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Key stats */}
        <section className="mt-12 rounded-2xl border border-accent-500/20 bg-accent-500/5 p-6">
          <h2 className="text-lg font-bold">Why CreatorAI Hub?</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <div className="font-mono text-2xl font-black text-white">{ALL_TOOLS.length}</div>
              <p className="mt-1 text-2xs text-zinc-400">Tools catalogued</p>
            </div>
            <div>
              <div className="font-mono text-2xl font-black text-emerald-400">{testedCount}</div>
              <p className="mt-1 text-2xs text-zinc-400">Hands-on tested with published scores</p>
            </div>
            <div>
              <div className="font-mono text-2xl font-black text-accent-400">3</div>
              <p className="mt-1 text-2xs text-zinc-400">Transparent verification levels</p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mt-12 text-center">
          <h2 className="text-xl font-bold">Ready to explore?</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Browse all {ALL_TOOLS.length} tools, or use the 60-second quiz to get a personalized recommendation.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/tools"
              className="inline-flex items-center gap-2 rounded-xl bg-accent-500 px-6 py-3 text-sm font-bold text-black hover:opacity-90"
            >
              Browse all tools
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-surface-1 px-6 py-3 text-sm font-bold text-zinc-300 hover:text-white transition-colors"
            >
              <Zap className="h-4 w-4 text-accent-400" aria-hidden="true" />
              Take the 60s Quiz
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
