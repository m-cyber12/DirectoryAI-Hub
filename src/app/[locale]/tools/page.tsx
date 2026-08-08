import type { Metadata } from 'next';
import Link from '@/i18n/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ToolCard } from '@/components/ToolCard';
import { CompareBar } from '@/components/CompareBar';
import { ToolsFilterBar } from './ToolsFilterBar';
import { Pagination } from '@/components/Pagination';
import { ALL_TOOLS } from '@/data/tools';
import { SITE_URL } from '@/config/site';
import { localizeTools } from '@/lib/i18n/content';
import {
  parseToolQuery,
  filterTools,
  paginate,
  facetCounts,
  buildToolsHref,
  PAGE_SIZE,
} from '@/lib/toolFilters';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type LocaleParams = Promise<{ locale: string }>;

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: LocaleParams;
  searchParams: SearchParams;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'tools' });
  const query = parseToolQuery(await searchParams);
  const filtered = filterTools(query);
  const { totalPages, page } = paginate(filtered, query.page);

  const scope =
    query.category !== 'All'
      ? t('titleCategory', { category: query.category })
      : t('title', { count: ALL_TOOLS.length });
  const pageSuffix = page > 1 ? ` — ${t('titlePage', { page })}` : '';

  const isDeepCombo = Boolean(query.q) || query.pricing !== 'All' || query.testedOnly;

  return {
    title: `${scope}${pageSuffix} (2026)`,
    description:
      query.category !== 'All'
        ? t('descriptionCategory', { category: query.category })
        : t('description', { count: ALL_TOOLS.length }),
    alternates: {
      canonical: isDeepCombo
        ? buildToolsHref({ category: query.category })
        : buildToolsHref({ category: query.category, pricing: query.pricing, sort: query.sort }, page),
    },
    robots: isDeepCombo ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      title: `${scope}${pageSuffix}`,
      description: t('ogDescription'),
      url: buildToolsHref({ category: query.category }, page),
    },
    other: {
      ...(page > 1 && { 'pagination-total': String(totalPages) }),
    },
  };
}

export default async function ToolsPage({
  params,
  searchParams,
}: {
  params: LocaleParams;
  searchParams: SearchParams;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'tools' });
  const tcommon = await getTranslations({ locale, namespace: 'common' });
  const tc = await getTranslations({ locale, namespace: 'categories' });

  const query = parseToolQuery(await searchParams);
  const filtered = filterTools(query);
  const { items, page, totalPages, total } = paginate(filtered, query.page, PAGE_SIZE);
  const facets = facetCounts();
  const localizedItems = await localizeTools(items, locale);
  const localizedCategory = (c: string) => (tc.has(c) ? tc(c) : c);

  // ItemList structured data describing what is actually on this page.
  const itemListLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: query.category !== 'All' ? `${query.category} AI Tools` : 'AI Tools for Video Creators',
    numberOfItems: total,
    itemListElement: items.map((tool, i) => ({
      '@type': 'ListItem',
      position: (page - 1) * PAGE_SIZE + i + 1,
      url: `${SITE_URL}/tool/${tool.slug}`,
      name: tool.name,
    })),
  };

  return (
    <div className="min-h-screen bg-surface-0 text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }}
      />
      <Header />

      <main id="main" className="px-4 pt-8 pb-20">
        <div className="mx-auto max-w-7xl">
          <nav aria-label={t('breadcrumbAria')} className="mb-4 text-2xs text-zinc-500">
            <Link href="/" className="hover:text-accent-400">
              {tcommon('home')}
            </Link>
            <span className="mx-1.5">/</span>
            <span className="text-zinc-300">
              {query.category !== 'All' ? localizedCategory(query.category) : t('breadcrumb')}
            </span>
          </nav>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {query.category !== 'All' ? t('titleCategory', { category: localizedCategory(query.category) }) : t('heading')}
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
            {tcommon('toolsCount', { count: total.toLocaleString() })} {t('forCreators')}{' '}
            {facets.tested > 0 ? (
              <>
                {t('testedIntro')}{' '}
                <Link href={buildToolsHref({ testedOnly: true })} className="text-accent-400 underline hover:text-accent-300">
                  {t('testedLink', { count: facets.tested })}
                </Link>
                {t('testedOutro')}
              </>
            ) : (
              t('labelledNote')
            )}
          </p>

          <ToolsFilterBar query={query} facets={facets} resultCount={total} />

          {items.length === 0 ? (
            <div className="mt-12 rounded-2xl border border-white/10 bg-surface-1 p-10 text-center">
              <p className="text-lg font-semibold text-zinc-200">{t('noResultsTitle')}</p>
              <p className="mt-2 text-sm text-zinc-400">
                {t('noResultsTry')}{' '}
                <Link href="/tools" className="text-accent-400 underline hover:text-accent-300">
                  {t('browseAllTools', { count: ALL_TOOLS.length })}
                </Link>
                .
              </p>
              <p className="mt-4 text-sm text-zinc-400">
                {t('suggestTitle')}{' '}
                <Link href="/submit" className="text-accent-400 underline hover:text-accent-300">
                  {t('suggestLink')}
                </Link>
                .
              </p>
            </div>
          ) : (
            <>
              <p className="mt-6 text-2xs text-zinc-500" aria-live="polite">
                {t('showingRange', {
                  from: (page - 1) * PAGE_SIZE + 1,
                  to: Math.min(page * PAGE_SIZE, total),
                  total: total.toLocaleString(),
                })}
              </p>

              {/* Server-rendered: these <li> elements exist in the raw HTML. */}
              <ul className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {localizedItems.map((tool, i) => (
                  <li key={tool.slug}>
                    <ToolCard tool={tool} index={i} priority={i < 4} />
                  </li>
                ))}
              </ul>

              <Pagination
                page={page}
                totalPages={totalPages}
                hrefFor={(p) => buildToolsHref(query, p)}
              />
            </>
          )}
        </div>
      </main>

      <CompareBar />
      <Footer />
    </div>
  );
}
