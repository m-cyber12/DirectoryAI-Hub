import type { Metadata } from 'next';
import Link from '@/i18n/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Compass, ArrowRight, Sparkles } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ALL_TOOLS } from '@/data/tools';
import { ToolCard } from '@/components/ToolCard';
import { localizeTools } from '@/lib/i18n/content';

type LocaleParams = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'trending' });
  return {
    title: t('title'),
    description: t('description'),
    alternates: { canonical: '/trending' },
    openGraph: { title: t('title'), description: t('description'), type: 'website' },
  };
}

export default async function CreatorPicksPage({ params }: { params: LocaleParams }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'trending' });
  const priceChecked = await localizeTools(
    ALL_TOOLS.filter((tool) => tool.verificationLevel === 'pricing-verified').slice(0, 6),
    locale
  );
  const newlyCatalogued = await localizeTools([...ALL_TOOLS].filter((tool) => tool.isNew).slice(0, 6), locale);
  return (
    <div className="min-h-screen bg-surface-0 text-white">
      <Header />
      <main id="main" className="mx-auto max-w-6xl px-4 py-14">
        <span className="inline-flex items-center gap-2 rounded-full border border-accent-500/30 bg-accent-500/10 px-4 py-1.5 text-xs font-bold text-accent-300"><Compass className="h-3.5 w-3.5" /> {t('badge')}</span>
        <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl">{t('heading')}</h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400">{t('intro')}</p>

        <section className="mt-12"><div className="flex items-end justify-between gap-4"><div><p className="text-2xs font-bold uppercase tracking-widest text-emerald-400">{t('priceCheckedEyebrow')}</p><h2 className="mt-2 text-2xl font-black">{t('researchThese')}</h2></div><Link href="/tools?sort=price-low" className="text-sm font-semibold text-accent-300 hover:underline">{t('browseCatalog')} <ArrowRight className="inline h-4 w-4 rtl-flip" /></Link></div><div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{priceChecked.map((tool, index) => <ToolCard key={tool.slug} tool={tool} index={index} />)}</div></section>

        <section className="mt-14 border-t border-white/10 pt-12"><div><p className="text-2xs font-bold uppercase tracking-widest text-amber-300">{t('recentlyCatalogued')}</p><h2 className="mt-2 text-2xl font-black">{t('newTools')}</h2><p className="mt-2 text-sm text-zinc-400">{t('newToolsSub')}</p></div><div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{newlyCatalogued.map((tool, index) => <ToolCard key={tool.slug} tool={tool} index={index} />)}</div></section>

        <aside className="mt-14 rounded-2xl border border-white/10 bg-surface-1 p-6"><Sparkles className="h-5 w-5 text-accent-300" /><h2 className="mt-3 text-lg font-bold">{t('realRankingTitle')}</h2><p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">{t('realRankingText')}</p><Link href="/compare" className="mt-4 inline-block text-sm font-bold text-accent-300 hover:underline">{t('compareCta')} →</Link></aside>
      </main>
      <Footer />
    </div>
  );
}
