import type { Metadata } from 'next';
import Link from '@/i18n/navigation';
import {
  ArrowRight,
  ClipboardCheck,
  LayoutGrid,
  Rocket,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { HomeSearch } from '@/components/HomeSearch';
import { ToolCard } from '@/components/ToolCard';
import { NewsletterForm } from '@/components/NewsletterForm';
import { InfinityGauntlet } from '@/components/InfinityGauntlet';
import { HomeAnimations } from '@/components/HomeAnimations';
import { HomeMarquee } from '@/components/HomeMarquee';
import { RotatingWord } from '@/components/RotatingWord';
import { TestingQueueWidget } from '@/components/TestingQueueWidget';
import { ALL_TOOLS, CATEGORIES } from '@/data/tools';
import { localizeTools } from '@/lib/i18n/content';

type LocaleParams = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home' });
  return {
    title: `${t('metaTitle')}`,
    description: t('metaDescription'),
    alternates: { canonical: '/' },
  };
}

export default async function HomePage({ params }: { params: LocaleParams }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'home' });
  const tc = await getTranslations({ locale, namespace: 'categories' });
  const rotatingWords = (t.raw('rotatingWords') as string[]) ?? [
    'clips',
    'captions',
    'dubbing',
    'editing',
    'thumbnails',
  ];

  const STEPS = [
    {
      icon: Search,
      title: t('step1Title'),
      text: t('step1Text'),
      href: '/tools',
      cta: t('step1Cta'),
    },
    {
      icon: Scale,
      title: t('step2Title'),
      text: t('step2Text'),
      href: '/compare',
      cta: t('step2Cta'),
    },
    {
      icon: Rocket,
      title: t('step3Title'),
      text: t('step3Text'),
      href: '/stack-builder',
      cta: t('step3Cta'),
    },
  ];

  const priceChecked = ALL_TOOLS.filter((tool) => tool.verificationLevel === 'pricing-verified');
  const featured = [...priceChecked, ...ALL_TOOLS.filter((tool) => tool.verificationLevel === 'listed-only')].slice(0, 6);
  const categoryCount = CATEGORIES.filter((c) => c !== 'All').length;
  const localizedTools = await localizeTools(featured, locale);
  const localizedCategory = (c: string) => (tc.has(c) ? tc(c) : c);

  return (
    <div className="min-h-screen bg-surface-0 text-white">
      <Header />

      <main id="main">
      <section className="relative isolate flex min-h-[82svh] flex-col overflow-hidden">
        <div className="hero-aurora" aria-hidden="true">
          <div className="aurora-third" />
        </div>
        <div aria-hidden="true" className="bg-grid absolute inset-0 z-[1]" />
        <div aria-hidden="true" className="bg-noise absolute inset-0 z-[1]" />

        {/* Floating glass chips (desktop only) */}
        <div data-hero-chips aria-hidden="true" className="pointer-events-none absolute inset-0 z-[2] hidden lg:block">
          <div className="float-slow glass-panel absolute left-[6%] top-[24%] rounded-xl px-4 py-2.5 font-mono text-2xs font-bold tracking-wide text-zinc-300 shadow-xl">
            {t('chipPriceChecked')}
          </div>
          <div className="float-slower glass-panel absolute right-[7%] top-[30%] rounded-xl px-4 py-2.5 font-mono text-2xs font-bold tracking-wide text-zinc-300 shadow-xl">
            <span className="text-accent-400">{ALL_TOOLS.length}+</span> {t('chipToolsCatalogued')}
          </div>
          <div className="float-slower glass-panel absolute left-[10%] bottom-[26%] rounded-xl px-4 py-2.5 font-mono text-2xs font-bold tracking-wide text-zinc-300 shadow-xl">
            {t('chipBenchmark')}
          </div>
          <div className="float-slow glass-panel absolute right-[9%] bottom-[22%] rounded-xl px-4 py-2.5 font-mono text-2xs font-bold tracking-wide text-zinc-300 shadow-xl">
            {t('chipNoInvented')}
          </div>
        </div>

        {/* Hero content */}
        <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-4 pb-14 pt-20 text-center">
          <span
            data-hero-badge
            className="shine inline-flex items-center gap-2 rounded-full border border-accent-500/30 bg-accent-500/10 px-4 py-1.5 text-2xs font-bold text-accent-300"
          >
            <Sparkles className="h-3.5 w-3.5 text-accent-400" aria-hidden="true" />
            {t('heroBadge')}
          </span>

          <h1
            data-hero-title
            className="mt-7 text-4xl font-black leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl"
          >
            {t('heroTitle1')}
            <br />
            <span className="text-gradient">{t('heroTitleAccent')}</span>
          </h1>

          <p data-hero-sub className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-zinc-300 sm:text-lg">
            {t('heroSub1')} <RotatingWord words={rotatingWords} /> — {t('heroSubSeparator')}{' '}
            <span className="font-semibold text-accent-300">{t('heroSubPriceChecks')}</span>{' '}
            {t('heroSubFrom')}{' '}
            <span className="font-semibold text-emerald-400">{t('heroSubBenchmarked')}</span>.
          </p>

          <div data-hero-search className="mx-auto mt-9 w-full max-w-2xl">
            <HomeSearch />
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              data-hero-cta
              href="/stack-builder"
              className="cta-glow group inline-flex items-center gap-2 rounded-xl bg-accent-500 px-6 py-3 text-sm font-bold text-black transition-transform hover:scale-[1.03]"
            >
              {t('heroCtaPlan')}
              <ArrowRight className="h-4 w-4 transition-transform rtl-flip group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" aria-hidden="true" />
            </Link>
            <Link
              data-hero-cta
              href="/tools"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-surface-1/70 px-6 py-3 text-sm font-bold text-zinc-200 backdrop-blur-md transition-all hover:border-accent-500/50 hover:text-white"
            >
              {t('heroCtaBrowse')}
            </Link>
          </div>

          <div data-hero-cta className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-2xs text-zinc-500">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" /> {t('trustNoInvented')}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ClipboardCheck className="h-3.5 w-3.5 text-accent-400" aria-hidden="true" /> {t('trustPricingSources')}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <LayoutGrid className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" /> {t('trustCategories', { count: categoryCount })}
            </span>
          </div>
        </div>

        <InfinityGauntlet />
      </section>

      {/* TICKER */}
      <HomeMarquee />

      {/* STATS */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: ClipboardCheck,
              label: t('statCatalogued'),
              count: ALL_TOOLS.length,
              tint: 'text-accent-300',
              glow: 'hover:shadow-[0_20px_60px_-20px_rgba(247,201,72,0.45)]',
            },
            {
              icon: ShieldCheck,
              label: t('statPriceChecked'),
              count: priceChecked.length,
              tint: 'text-emerald-400',
              glow: 'hover:shadow-[0_20px_60px_-20px_rgba(52,211,153,0.45)]',
            },
            {
              icon: Search,
              label: t('statEvidence'),
              count: 0,
              tint: 'text-cyan-400',
              glow: 'hover:shadow-[0_20px_60px_-20px_rgba(34,211,238,0.45)]',
            },
            {
              icon: LayoutGrid,
              label: t('statCategories'),
              count: categoryCount,
              tint: 'text-fuchsia-400',
              glow: 'hover:shadow-[0_20px_60px_-20px_rgba(232,121,249,0.45)]',
            },
          ].map((stat, i) => (
            <div
              key={stat.label}
              data-reveal
              data-reveal-delay={String(i * 90)}
              className={`glass-panel group rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 ${stat.glow}`}
            >
              <stat.icon className={`h-5 w-5 ${stat.tint} transition-transform duration-300 group-hover:scale-110`} aria-hidden="true" />
              <p className="mt-4 font-mono text-3xl font-black tabular-nums">
                <span data-count={String(stat.count)}>{stat.count}</span>
              </p>
              <p className="mt-1 text-sm text-zinc-400">{stat.label}</p>
            </div>
          ))}
        </div>
        <p data-reveal className="mt-6 text-center text-2xs text-zinc-500">
          {t('benchmarkNote')}{' '}
          <Link className="text-accent-300 underline underline-offset-2 hover:text-accent-200" href="/methodology">
            {t('seeTheStandard')}
          </Link>
        </p>
      </section>

      {/* CATEGORIES */}
      <section className="relative mx-auto max-w-6xl px-4 py-10">
        <div className="flex items-end justify-between gap-4">
          <div data-reveal>
            <p className="eyebrow-line text-2xs font-bold uppercase tracking-widest text-accent-300">
              {t('startWithOutcome')}
            </p>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">{t('whatAreYouMaking')}</h2>
          </div>
          <Link
            data-reveal
            href="/tools"
            className="hidden text-sm font-semibold text-accent-300 transition-colors hover:text-accent-200 sm:block"
          >
            {t('allTools')}
          </Link>
        </div>
        <div className="mt-7 flex flex-wrap gap-2.5">
          {CATEGORIES.filter((c) => c !== 'All').map((category, i) => (
            <Link
              key={category}
              data-reveal
              data-reveal-delay={String(i * 40)}
              href={`/tools?category=${encodeURIComponent(category)}`}
              className="group relative rounded-full border border-white/10 bg-surface-1 px-5 py-2.5 text-sm text-zinc-300 transition-all duration-300 hover:-translate-y-0.5 hover:border-accent-500/60 hover:text-white hover:shadow-[0_10px_30px_-10px_rgba(247,201,72,0.5)]"
            >
              <span className="relative z-10">{localizedCategory(category)}</span>
              <span
                aria-hidden="true"
                className="absolute inset-0 rounded-full bg-gradient-to-r from-accent-500/15 via-fuchsia-500/10 to-cyan-400/15 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />
            </Link>
          ))}
        </div>
      </section>

      {/* STEPS */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-4 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <Link
              key={step.title}
              href={step.href}
              data-reveal
              data-reveal-delay={String(i * 110)}
              className="glass-panel group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-accent-500/40 hover:shadow-[0_24px_70px_-24px_rgba(139,92,246,0.5)]"
            >
              <div
                aria-hidden="true"
                className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br from-accent-500/15 to-fuchsia-500/15 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
              />
              <step.icon className="h-6 w-6 text-accent-400" aria-hidden="true" />
              <h3 className="mt-4 text-lg font-black">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{step.text}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-2xs font-bold text-accent-300">
                {step.cta}
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 rtl-flip group-hover:translate-x-1 rtl:group-hover:-translate-x-1" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED TOOLS */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex items-end justify-between gap-4">
          <div data-reveal>
            <p className="eyebrow-line text-2xs font-bold uppercase tracking-widest text-emerald-400">
              {t('featuredEyebrow')}
            </p>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">{t('featuredTitle')}</h2>
            <p className="mt-2 text-sm text-zinc-400">{t('featuredSub')}</p>
          </div>
          <Link
            data-reveal
            href="/tools?sort=price-low"
            className="hidden text-sm font-semibold text-accent-300 transition-colors hover:text-accent-200 sm:block"
          >
            {t('exploreCatalog')}
          </Link>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {localizedTools.map((tool, index) => (
            <div key={tool.slug} data-reveal data-reveal-delay={String((index % 3) * 100)}>
              <ToolCard tool={tool} index={index} priority={index < 3} />
            </div>
          ))}
        </div>
      </section>

      {/* TESTING QUEUE */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div data-reveal>
          <TestingQueueWidget />
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="mx-auto max-w-4xl px-4 py-20">
        <div data-reveal className="border-flow relative overflow-hidden p-[1.5px]">
          <div className="relative rounded-[calc(1.5rem-1.5px)] bg-surface-1/90 px-6 py-14 text-center backdrop-blur-xl sm:px-12">
            <div
              aria-hidden="true"
              className="absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-accent-400/70 to-transparent"
            />
            <p className="text-2xs font-bold uppercase tracking-[0.25em] text-accent-300">{t('newsletterEyebrow')}</p>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">{t('newsletterTitle')}</h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-zinc-400">
              {t('newsletterText')}
            </p>
            <div className="mt-8">
              <NewsletterForm source="homepage" />
            </div>
          </div>
        </div>
      </section>

      </main>

      <Footer />

      {/* GSAP choreography for the whole page (client-side, no visual impact if JS is off) */}
      <HomeAnimations />
    </div>
  );
}
