import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ALL_TOOLS, type Tool } from '@/data/tools';
import { localizeTools } from '@/lib/i18n/content';
import { CompareClient } from './CompareClient';

type LocaleParams = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'compare' });
  return {
    title: t('title'),
    description: t('description'),
    alternates: { canonical: '/compare' },
  };
}

/*
  Audit fix 2.1 — the /compare hub used to render its h1, intro and table only
  after hydration (it read `useSearchParams` in a client component), so the raw
  HTML was nearly empty and Google could not crawl the comparison table or the
  tool links. Now the initial tool selection is resolved server-side here and
  passed into CompareClient as a prop, so the table renders in the SSR HTML.
*/
export default async function ComparePage({
  params: localeParams,
  searchParams,
}: {
  params: LocaleParams;
  searchParams: Promise<{ tools?: string | string[] }>;
}) {
  const { locale } = await localeParams;
  setRequestLocale(locale);
  const params = await searchParams;
  const raw = typeof params.tools === 'string' ? params.tools : Array.isArray(params.tools) ? params.tools[0] : '';
  const initialTools: Tool[] = raw
    .split(',')
    .map((s) => ALL_TOOLS.find((t) => t.slug === s.trim()))
    .filter((t): t is Tool => Boolean(t))
    .slice(0, 3);

  if (initialTools.length < 2) {
    // Default comparison (server-rendered) so the page is never empty/crawl-less.
    initialTools.push(ALL_TOOLS[0], ALL_TOOLS[4]);
  }

  const localized = await localizeTools(initialTools.slice(0, 3), locale);

  return (
    <Suspense>
      <CompareClient initialTools={localized} />
    </Suspense>
  );
}
