import type { Metadata } from 'next';
import Link from '@/i18n/navigation';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { hasVerifiedScore } from '@/data/tools';
import { SITE_URL } from '@/config/site';
import { byRankDesc } from '@/lib/ranking';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ToolCard } from '@/components/ToolCard';
import { CompareBar } from '@/components/CompareBar';
import { localizeTools, getLocalizedField } from '@/lib/i18n/content';
import {
  REAL_CATEGORIES,
  categorySlug,
  categoryFromSlug,
  CATEGORY_CONTENT,
  getCategoryTools,
} from '@/lib/categories';

type Params = Promise<{ slug: string; locale: string }>;

export const dynamicParams = false;

export function generateStaticParams() {
  return REAL_CATEGORIES.map((c) => ({ slug: categorySlug(c) }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug, locale } = await params;
  const t = await getTranslations({ locale, namespace: 'category' });
  const category = categoryFromSlug(slug);
  if (!category) return { title: t('notFoundTitle') };

  const label = (await getLocalizedField('category', category, 'label', locale)) ?? category;
  const tools = getCategoryTools(category);
  const free = tools.filter((x) => x.pricing === 'Free' || x.pricing === 'Freemium').length;

  return {
    title: `${tools.length} ${t('metaTitleBest', { category: label })} (2026)`,
    description: t('metaDescription', { category: label, count: tools.length, free }),
    alternates: { canonical: `/category/${slug}` },
    openGraph: {
      title: `${tools.length} ${t('ogTitle', { category: label })} (2026)`,
      description: t('ogDescription', { free, count: tools.length }),
      url: `/category/${slug}`,
      type: 'article',
    },
  };
}

export default async function CategoryPage({ params }: { params: Params }) {
  const { slug, locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'category' });
  const tcommon = await getTranslations({ locale, namespace: 'common' });
  const tc = await getTranslations({ locale, namespace: 'categories' });

  const category = categoryFromSlug(slug);
  if (!category) notFound();

  const label = (await getLocalizedField('category', category, 'label', locale)) ?? category;
  const tools = getCategoryTools(category);
  const content = CATEGORY_CONTENT[category];
  const freeTools = tools.filter((x) => x.pricing === 'Free' || x.pricing === 'Freemium');
  const testedCount = tools.filter(hasVerifiedScore).length;
  const sorted = [...tools].sort(byRankDesc);
  const localizedTools = await localizeTools(sorted, locale);
  const localizedCategory = (c: string) => (tc.has(c) ? tc(c) : c);

  const itemListLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${category} AI tools`,
    numberOfItems: sorted.length,
    itemListElement: sorted.map((tool, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE_URL}/tool/${tool.slug}`,
      name: tool.name,
    })),
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'All Tools', item: `${SITE_URL}/tools` },
      { '@type': 'ListItem', position: 3, name: category, item: `${SITE_URL}/category/${slug}` },
    ],
  };

  const intro = (await getLocalizedField('category', category, 'intro', locale)) ?? content?.intro;
  const whatMattersRaw =
    (await getLocalizedField('category', category, 'whatMatters', locale)) ?? content?.whatMatters.join('\n');
  const reality = (await getLocalizedField('category', category, 'reality', locale)) ?? content?.reality;
  const whatMatters = whatMattersRaw ? whatMattersRaw.split('\n').filter(Boolean) : [];

  return (
    <div className="min-h-screen bg-surface-0 text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <Header />

      <main id="main" className="mx-auto max-w-6xl px-4 py-10">
        <nav aria-label={t('breadcrumbAria')} className="mb-4 text-2xs text-zinc-500">
          <Link href="/" className="hover:text-accent-400">{tcommon('home')}</Link>
          <span className="mx-1.5">/</span>
          <Link href="/tools" className="hover:text-accent-400">{t('backToAll')}</Link>
          <span className="mx-1.5">/</span>
          <span className="text-zinc-300">{label}</span>
        </nav>

        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
          {t('heading', { category: label })}
        </h1>

        <div className="mt-4 flex flex-wrap gap-4 text-sm text-zinc-400">
          <span>
            <strong className="font-mono tabular-nums text-white">{tools.length}</strong>{' '}
            {t('toolsInCategory', { count: tools.length })}
          </span>
          <span>
            <strong className="font-mono tabular-nums text-emerald-400">{freeTools.length}</strong>{' '}
            {t('withFreeTier')}
          </span>
          <span>
            <strong className="font-mono tabular-nums text-accent-400">{testedCount}</strong>{' '}
            {t('handsOnTested')}
          </span>
        </div>

        {intro && (
          <>
            <p className="mt-6 max-w-3xl text-base leading-relaxed text-zinc-300">
              {intro}
            </p>

            <section className="mt-8 rounded-2xl border border-white/10 bg-surface-1 p-6">
              <h2 className="text-lg font-bold">{t('whatMatters')}</h2>
              <ul className="mt-4 space-y-2.5">
                {whatMatters.map((point) => (
                  <li key={point} className="flex gap-2.5 text-sm leading-relaxed text-zinc-300">
                    <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-500" />
                    {point}
                  </li>
                ))}
              </ul>
              {reality && (
                <p className="mt-4 border-t border-white/5 pt-4 text-sm italic leading-relaxed text-zinc-400">
                  {reality}
                </p>
              )}
            </section>
          </>
        )}

        {freeTools.length > 0 && (
          <p className="mt-6 text-sm text-zinc-400">
            {t('freeOptionsPrompt')}{' '}
            <Link
              href={`/tools?category=${encodeURIComponent(category)}&pricing=Free`}
              className="text-accent-400 underline hover:text-accent-300"
            >
              {t('filterToFree', { category: label })}
            </Link>
            .
          </p>
        )}

        <section className="mt-10">
          <h2 className="mb-5 text-2xl font-bold">
            {t('allToolsTitle', { count: tools.length, category: label })}
          </h2>
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {localizedTools.map((tool, i) => (
              <li key={tool.slug}>
                <ToolCard tool={tool} index={i} priority={i < 4} />
              </li>
            ))}
          </ul>
        </section>

        {/* Internal linking to sibling categories */}
        <section className="mt-14 border-t border-white/5 pt-8">
          <h2 className="text-lg font-bold">{t('otherCategories')}</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {REAL_CATEGORIES.filter((c) => c !== category).map((c) => (
              <li key={c}>
                <Link
                  href={`/category/${categorySlug(c)}`}
                  className="inline-block rounded-full border border-white/10 bg-surface-1 px-3 py-1.5 text-2xs font-semibold text-zinc-400 hover:border-accent-500/40 hover:text-accent-300"
                >
                  {localizedCategory(c)}{' '}
                  <span className="font-mono tabular-nums opacity-60">
                    {getCategoryTools(c).length}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <CompareBar />
      <Footer />
    </div>
  );
}
