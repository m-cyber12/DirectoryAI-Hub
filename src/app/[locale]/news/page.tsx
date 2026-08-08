import type { Metadata } from 'next';
import Link from '@/i18n/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { getNews } from '@/lib/news';
import { NewsControls } from './NewsControls';
import { localizeNews } from '@/lib/i18n/content';
import {
  applyNewsFilters,
  monthBuckets,
  monthKey,
  parseNewsQuery,
} from '@/lib/newsQuery';
import type { NewsItem } from '@/data/news';
import { Radio, ExternalLink, Clock, Calendar } from 'lucide-react';

type LocaleParams = Promise<{ locale: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'news' });
  return {
    title: t('title'),
    description: t('description'),
    alternates: { canonical: '/news' },
  };
}

// ISR: revalidate the archive hourly; params make each month shareable.
export const revalidate = 3600;

/** Locale-aware month label for a "YYYY-MM" bucket key. */
function monthName(locale: string, key: string): string {
  const [y, m] = key.split('-').map(Number);
  if (!y || !m) return key;
  try {
    return new Date(y, m - 1, 1).toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  } catch {
    return key;
  }
}

function NewsCard({
  item,
  latest,
  t,
  locale,
}: {
  item: NewsItem;
  latest?: boolean;
  t: (key: string, values?: Record<string, string | number | Date>) => string;
  locale: string;
}) {
  return (
    <article
      className={`group flex flex-col rounded-2xl border bg-surface-1 p-5 transition-colors hover:border-accent-500/30 ${
        latest ? 'border-accent-500/30' : 'border-white/10'
      }`}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-accent-500/15 px-2.5 py-0.5 text-2xs font-bold uppercase tracking-wide text-accent-300">
          {item.category}
        </span>
        <span className="text-2xs font-semibold uppercase tracking-wide text-zinc-500">{item.source}</span>
      </div>

      <h3 className="text-base font-bold leading-snug text-white transition-colors group-hover:text-accent-300">
        <Link href={`/news/${item.slug}`}>{item.title}</Link>
      </h3>

      <p className="mt-2 flex-1 text-xs leading-relaxed text-zinc-400 line-clamp-4">{item.excerpt}</p>

      <div className="mt-4 flex items-center gap-3 border-t border-white/5 pt-3 text-2xs text-zinc-500">
        <span className="inline-flex items-center gap-1">
          <Calendar className="h-3 w-3" aria-hidden="true" />
          {new Date(item.publishedAt).toLocaleDateString(locale, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>

        <a
          href={item.sourceUrl}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="ms-auto inline-flex items-center gap-1 text-accent-400 hover:text-accent-300"
        >
          {t('sourceLabel')} <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </a>
      </div>
    </article>
  );
}

export default async function NewsPage({
  params,
  searchParams,
}: {
  params: LocaleParams;
  searchParams: SearchParams;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'news' });

  const sp = await searchParams;
  const { items, mode } = await getNews();
  const localized = new Map((await localizeNews(items, locale)).map((i) => [i.slug, i]));
  const show = (i: NewsItem) => localized.get(i.slug) ?? i;

  const buckets = monthBuckets(items);
  const query = parseNewsQuery(sp, buckets);
  const monthFiltered =
    query.month === 'all' ? items : items.filter((i) => monthKey(i.isoDate) === query.month);
  const categoryCounts = new Map<string, number>();
  for (const i of monthFiltered) categoryCounts.set(i.category, (categoryCounts.get(i.category) || 0) + 1);
  const categories = [...categoryCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([name, count]) => ({ name, count }));
  const filtered = applyNewsFilters(items, query);

  const isDefaultView = !query.q && !query.category && query.month === (buckets[0]?.key ?? '');
  const [latest, ...rest] = filtered;

  const byMonth = new Map<string, NewsItem[]>();
  for (const i of filtered) {
    const k = monthKey(i.isoDate);
    const list = byMonth.get(k) ?? [];
    list.push(i);
    byMonth.set(k, list);
  }

  const modeLabel =
    mode === 'supabase' ? t('modeSupabase') : mode === 'live' ? t('modeLive') : t('modeEmpty');

  return (
    <div className="min-h-screen bg-surface-0 text-white">
      <Header />
      <main id="main" className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent-500/20 bg-accent-500/10 px-4 py-1.5 text-2xs font-semibold text-accent-300">
            <Radio className="h-3.5 w-3.5" aria-hidden="true" /> {t('briefingBadge')}
          </span>
          <h1 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">{t('heading')}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
            {t('intro')}
          </p>
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-surface-1 px-3 py-1 text-2xs text-zinc-500">
            <Clock className="h-3 w-3" aria-hidden="true" />
            {modeLabel}
          </p>
        </div>

        <NewsControls
          query={query}
          buckets={buckets}
          categories={categories}
          resultCount={filtered.length}
        />

        {filtered.length === 0 ? (
          <p className="mt-10 rounded-2xl border border-white/10 bg-surface-1 p-8 text-center text-sm text-zinc-400">
            {t('empty')}
          </p>
        ) : (
          <>
            {isDefaultView && latest && (
              <section className="mt-10 mb-10">
                <h2 className="mb-3 text-2xs font-bold uppercase tracking-wider text-zinc-500">
                  {t('latest')}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <NewsCard item={show(latest)} latest t={t} locale={locale} />
                  {rest.slice(0, 1).map((it) => (
                    <NewsCard key={it.slug} item={show(it)} t={t} locale={locale} />
                  ))}
                </div>
              </section>
            )}

            {[...byMonth.entries()].map(([month, group]) => {
              const display =
                isDefaultView && month === (buckets[0]?.key ?? '')
                  ? group.filter((i) => i.slug !== latest?.slug)
                  : group;
              if (display.length === 0) return null;
              return (
                <section key={month} className="mt-10">
                  <h2 className="mb-4 border-b border-white/5 pb-2 text-lg font-bold text-accent-400">
                    {monthName(locale, month)}
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {display.map((it) => (
                      <NewsCard key={it.slug} item={show(it)} t={t} locale={locale} />
                    ))}
                  </div>
                </section>
              );
            })}
          </>
        )}

        <p className="mt-12 rounded-2xl border border-white/10 bg-surface-1 p-5 text-xs leading-relaxed text-zinc-500">
          <strong className="text-zinc-300">{t('howFeedWorksTitle')}</strong>{' '}
          {t('howFeedWorksBody1')}{' '}
          <code className="text-accent-300">{t('howFeedWorksCode')}</code>{' '}
          {t('howFeedWorksBody2')}{' '}
          <code className="text-accent-300">{t('howFeedWorksAdmin')}</code>{' '}
          {t('howFeedWorksBody3')}
        </p>
      </main>
      <Footer />
    </div>
  );
}
