import type { Metadata } from 'next';
import Link from '@/i18n/navigation';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { getNews } from '@/lib/news';
import { newsHref } from '@/data/news';
import { localizeNews } from '@/lib/i18n/content';
import { ArrowLeft, ExternalLink, Calendar, Clock } from 'lucide-react';

export const dynamicParams = true;
export const revalidate = 3600;

interface Params {
  params: Promise<{ slug: string; locale: string }>;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug, locale } = await params;
  const t = await getTranslations({ locale, namespace: 'news' });
  const { items } = await getNews();
  const item = (await localizeNews(items, locale)).find((n) => n.slug === slug);
  if (!item) return { title: t('notFound') };
  return {
    title: item.title,
    description: item.excerpt,
    alternates: { canonical: `/news/${item.slug}` },
    openGraph: { title: item.title, description: item.excerpt, type: 'article', url: `/news/${item.slug}` },
  };
}

export default async function NewsDetail({ params }: Params) {
  const { slug, locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'news' });
  const { items } = await getNews();
  const localized = await localizeNews(items, locale);
  const item = localized.find((n) => n.slug === slug);
  if (!item) notFound();

  const related = localized
    .filter((n) => n.category === item.category && n.slug !== item.slug)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-surface-0 text-white">
      <Header />
      <main id="main" className="mx-auto max-w-3xl px-4 py-12">
        <Link
          href="/news"
          className="inline-flex items-center gap-2 text-xs font-bold text-zinc-400 transition-colors hover:text-accent-400"
        >
          <ArrowLeft className="h-4 w-4 rtl-flip" aria-hidden="true" /> {t('backToFeed')}
        </Link>

        <article className="mt-8">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="rounded-full border border-accent-500/30 bg-accent-500/15 px-3 py-1 font-bold text-accent-300">
              {item.category}
            </span>
            <span className="flex items-center gap-1 text-zinc-500">
              <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
              {new Date(item.publishedAt).toLocaleDateString(locale, {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>

          <h1 className="mt-4 text-2xl font-extrabold leading-tight sm:text-4xl">{item.title}</h1>

          <div className="mt-6 space-y-5">
            {item.content.split('\n\n').map((para, idx) => (
              <p key={idx} className="text-[15px] leading-7 text-zinc-300 sm:text-base sm:leading-8">
                {para}
              </p>
            ))}
          </div>

          <a
            href={item.sourceUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-accent-500 px-5 py-2.5 text-xs font-bold text-black transition-opacity hover:opacity-90"
          >
            {t('readOriginal', { source: item.source })}{' '}
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>

          <p className="mt-8 flex items-center gap-1.5 rounded-xl border border-white/10 bg-surface-1 px-4 py-3 text-2xs text-zinc-500">
            <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />
            {t('pipelineNote')} {t('fullTextNote')}
          </p>
        </article>

        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-4 text-lg font-bold text-accent-400">
              {t('moreIn', { category: item.category })}
            </h2>
            <ul className="space-y-3">
              {related.map((r) => (
                <li key={r.slug}>
                  <Link
                    href={newsHref(r)}
                    className="block rounded-xl border border-white/10 bg-surface-1 p-4 transition-colors hover:border-accent-500/30"
                  >
                    <span className="text-2xs font-semibold uppercase tracking-wide text-zinc-500">{r.source}</span>
                    <h3 className="mt-1 text-sm font-bold leading-snug text-white group-hover:text-accent-300">
                      {r.title}
                    </h3>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
