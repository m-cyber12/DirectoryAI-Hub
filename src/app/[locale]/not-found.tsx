import Link from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ToolCard } from '@/components/ToolCard';
import { ALL_TOOLS, hasVerifiedScore } from '@/data/tools';
import { GRAVEYARD } from '@/data/graveyard';
import { REAL_CATEGORIES, categorySlug } from '@/lib/categories';
import { Search, Compass } from 'lucide-react';

/**
 * Audit fix 4.7 — there was no custom 404 page, so a mistyped or retired URL
 * hit the bare Next.js default and the visit ended there.
 *
 * This one recovers the visit: search, category links, and popular tools. It
 * also explains the most likely cause on this specific site — a tool that has
 * been removed because it shut down — and links to the graveyard, which is
 * exactly where those URLs used to point.
 */
export default function NotFound() {
  const t = useTranslations('notFound');
  const tc = useTranslations('categories');
  const popular = ALL_TOOLS.filter((x) => x.isFeatured).slice(0, 4);
  const testedCount = ALL_TOOLS.filter(hasVerifiedScore).length;

  return (
    <div className="flex min-h-screen flex-col bg-surface-0 text-foreground">
      <Header />

      <main id="main" className="flex-1 px-4 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-mono text-6xl font-black tabular-nums text-accent-500">404</p>
          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
            {t('title')}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-zinc-400">
            {t('text')}
          </p>

          <form
            action="/tools"
            method="get"
            role="search"
            className="mx-auto mt-8 flex max-w-md gap-2"
          >
            <label htmlFor="nf-search" className="sr-only">
              {t('searchBtn')}
            </label>
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
                aria-hidden="true"
              />
              <input
                id="nf-search"
                name="q"
                type="search"
                placeholder={t('searchPlaceholder')}
                className="w-full rounded-xl border border-white/10 bg-surface-1 py-3 pl-9 pr-4 text-sm text-white placeholder-zinc-500 focus:border-accent-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="shrink-0 rounded-xl bg-accent-500 px-5 py-3 text-2xs font-bold text-black hover:opacity-90"
            >
              {t('searchBtn')}
            </button>
          </form>

          <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm">
            <Link href="/tools" className="text-accent-400 underline hover:text-accent-300">
              {t('browseAll', { count: ALL_TOOLS.length })}
            </Link>
            <span className="text-zinc-700">·</span>
            <Link href="/graveyard" className="text-accent-400 underline hover:text-accent-300">
              {t('discontinued', { count: GRAVEYARD.length })}
            </Link>
            {testedCount > 0 && (
              <>
                <span className="text-zinc-700">·</span>
                <Link href="/tools?tested=1" className="text-accent-400 underline hover:text-accent-300">
                  {t('testedTools', { count: testedCount })}
                </Link>
              </>
            )}
          </div>
        </div>

        <section className="mx-auto mt-14 max-w-5xl">
          <h2 className="mb-4 flex items-center justify-center gap-2 text-lg font-bold">
            <Compass className="h-5 w-5 text-accent-400" aria-hidden="true" /> {t('browseByCategory')}
          </h2>
          <ul className="flex flex-wrap justify-center gap-2">
            {REAL_CATEGORIES.map((c) => (
              <li key={c}>
                <Link
                  href={`/category/${categorySlug(c)}`}
                  className="inline-block rounded-full border border-white/10 bg-surface-1 px-3 py-1.5 text-2xs font-semibold text-zinc-400 hover:border-accent-500/40 hover:text-accent-300"
                >
                  {tc.has(c) ? tc(c) : c}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {popular.length > 0 && (
          <section className="mx-auto mt-12 max-w-6xl">
            <h2 className="mb-5 text-center text-lg font-bold">{t('popularTools')}</h2>
            <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {popular.map((tool, i) => (
                <li key={tool.slug}>
                  <ToolCard tool={tool} index={i} />
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
