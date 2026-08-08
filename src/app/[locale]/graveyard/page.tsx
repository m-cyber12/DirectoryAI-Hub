import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from '@/i18n/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { GRAVEYARD } from '@/data/graveyard';
import { ALL_TOOLS } from '@/data/tools';
import { SITE_URL } from '@/config/site';
import { Skull, ArrowRight, FileWarning, CalendarX } from 'lucide-react';

/**
 * Audit fixes 3.3 + 7.3.
 *
 * The old page hardcoded three entries (two of which were questionable: a
 * "legacy version" of a tool that is very much alive is not a dead tool), was
 * linked from nowhere in the header or footer, and had a "Try {alternative}"
 * button that linked to "/" for every single entry.
 *
 * It now renders from src/data/graveyard.ts — the same source that removes
 * dead tools from the live catalog — so the two can never drift apart. Each
 * entry carries a cause, a data-migration path, verifiable evidence and real
 * links to replacements that exist in the catalog.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'graveyard' });
  return {
    title: t('title'),
    description: t('description'),
    alternates: { canonical: '/graveyard' },
    openGraph: { title: t('title'), description: t('description'), url: '/graveyard', type: 'website' },
  };
}

export default async function GraveyardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'graveyard' });

  const byDate = [...GRAVEYARD].sort((a, b) => b.diedAt.localeCompare(a.diedAt));

  const itemListLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Discontinued AI video tools',
    numberOfItems: byDate.length,
    itemListElement: byDate.map((d, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: d.name,
    })),
  };

  return (
    <div className="min-h-screen bg-surface-0 text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }}
      />
      <Header />

      <main id="main" className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="mb-10">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/10 px-4 py-1.5 text-2xs font-bold text-rose-400">
            <Skull className="h-3.5 w-3.5" aria-hidden="true" /> The Graveyard
          </span>
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">{t('heading')}</h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-300">
            Every directory on the internet is quietly full of links to tools that died. We check
            all {ALL_TOOLS.length} outbound links weekly, and when a tool stops answering we remove
            it from the catalog and record it here — with what happened, whether you can still get
            your data out, and what to use instead.
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-500">
            These {byDate.length} tools have been removed from our live catalog, so you will never
            be recommended one of them.
          </p>
        </div>

        <ol className="space-y-6">
          {byDate.map((dead) => {
            const replacements = dead.replacements
              .map((slug) => ALL_TOOLS.find((t) => t.slug === slug))
              .filter(Boolean);

            return (
              <li
                key={dead.slug}
                className="rounded-2xl border border-rose-500/20 bg-rose-950/10 p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="flex items-center gap-2 text-xl font-extrabold text-white">
                      <Skull className="h-5 w-5 shrink-0 text-rose-400" aria-hidden="true" />
                      {dead.name}
                    </h2>
                    <p className="mt-1 text-2xs text-zinc-500">{dead.category}</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-surface-0 px-2.5 py-1 font-mono text-2xs tabular-nums text-zinc-400">
                    <CalendarX className="h-3 w-3" aria-hidden="true" />
                    {dead.diedAt}
                  </span>
                </div>

                <p className="mt-3 text-sm font-semibold text-rose-200">{dead.cause}</p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-300">{dead.detail}</p>

                <div className="mt-4 rounded-xl border border-white/10 bg-surface-0 p-4">
                  <h3 className="flex items-center gap-1.5 text-2xs font-bold uppercase tracking-wider text-accent-400">
                    <FileWarning className="h-3 w-3" aria-hidden="true" /> Getting your data out
                  </h3>
                  <p className="mt-1.5 text-sm text-zinc-300">{dead.dataMigration}</p>
                </div>

                {replacements.length > 0 && (
                  <div className="mt-4">
                    <h3 className="mb-2 text-2xs font-bold uppercase tracking-wider text-emerald-400">
                      What to use instead
                    </h3>
                    <ul className="flex flex-wrap gap-2">
                      {replacements.map((r) => (
                        <li key={r!.slug}>
                          <Link
                            href={`/tool/${r!.slug}`}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-2xs font-bold text-emerald-300 hover:bg-emerald-500/20"
                          >
                            {r!.name}
                            <ArrowRight className="h-3 w-3" aria-hidden="true" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <p className="mt-4 border-t border-white/5 pt-3 text-2xs text-zinc-600">
                  How we know: {dead.evidence} · Last checked{' '}
                  <span className="font-mono tabular-nums">{dead.lastChecked}</span>
                </p>
              </li>
            );
          })}
        </ol>

        <section className="mt-12 rounded-2xl border border-white/10 bg-surface-1 p-6">
          <h2 className="text-lg font-bold">How we keep this current</h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            A scheduled job checks every outbound link in the catalog once a week. When a tool fails
            three consecutive checks it is flagged for review, and once we confirm the shutdown it
            moves here and disappears from the directory. Found one we have missed?{' '}
            <Link href="/contact" className="text-accent-400 underline hover:text-accent-300">
              Let us know
            </Link>
            .
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
