import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from '@/i18n/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SmartImage } from '@/components/SmartImage';
import { VerificationBadge } from '@/components/VerificationBadge';
import { ALL_TOOLS, hasVerifiedScore, computeOverall, type Tool, type ToolCategory } from '@/data/tools';
import { REAL_CATEGORIES, categorySlug, getCategoryTools } from '@/lib/categories';
import { byRankDesc } from '@/lib/ranking';
import { SITE_URL } from '@/config/site';
import { ExternalLink, Trophy, Star, ArrowRight } from 'lucide-react';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'bestOf' });
  return {
    title: t('title'),
    description: t('description'),
    alternates: { canonical: '/best-of' },
    openGraph: { title: t('title'), description: t('description'), url: '/best-of', type: 'website' },
  };
}

function rankCategory(category: ToolCategory): Tool[] {
  // Honest ranking (audit fix 2.4): verification level + editorial flags,
  // never fabricated rating/reviewsCount/isTrending.
  return [...getCategoryTools(category)].sort(byRankDesc);
}

export default async function BestOfPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'bestOf' });

  /** Critique §7 — ItemList schema so Google can render the ranked picks as a rich result. */
  const topPicks = REAL_CATEGORIES.map((category) => {
    const ranked = rankCategory(category);
    return { category, best: ranked[0] };
  }).filter((x) => x.best);

  const itemListLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Best AI Tools for Video Creators 2026',
    numberOfItems: topPicks.length,
    itemListElement: topPicks.map((x, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: `${x.category}: ${x.best.name}`,
      url: `${SITE_URL}/tool/${x.best.slug}`,
    })),
  };

  return (
    <div className="min-h-screen bg-surface-0 text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }}
      />
      <Header />
      <main id="main" className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-12 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent-500/20 bg-accent-500/10 px-4 py-1.5 text-2xs font-semibold text-accent-300">
            <Trophy className="h-3.5 w-3.5" aria-hidden="true" /> Curated Rankings
          </span>
          <h1 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">
            AI Tool Shortlist for Creators <span className="text-accent-400">2026</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400">
            A research shortlist for every category, ordered by how far we have actually verified
            each tool. Prices and verification levels are stated on each card — a number only
            appears where we have tested a tool hands-on. Until a tool is hands-on tested, it is a
            shortlist pick, not a proven winner. No vendor pays for placement.
          </p>
        </div>

        <div className="grid gap-10">
          {REAL_CATEGORIES.map((category) => {
            const ranked = rankCategory(category).slice(0, 5);
            if (ranked.length === 0) return null;
            const best = ranked[0];
            const bestScore = hasVerifiedScore(best) && best.scores ? computeOverall(best.scores) : null;
            return (
              <section key={category} className="rounded-3xl border border-white/10 bg-surface-1 p-6 sm:p-8">
                <div className="mb-6 flex flex-col gap-1 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-black text-white">{category}</h2>
                    <p className="mt-1 text-xs text-zinc-500">
                      Ranked by editorial prominence across {getCategoryTools(category).length} catalogued tools.
                    </p>
                  </div>
                  <Link
                    href={`/category/${categorySlug(category)}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-accent-400 hover:text-accent-300"
                  >
                    All {category} tools <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </div>

                <div className="flex flex-col gap-5 lg:flex-row">
                  {/* #1 pick — feature card */}
                  <div className="flex-1 rounded-2xl border border-accent-500/30 bg-gradient-to-br from-accent-500/10 via-surface-2 to-surface-2 p-5">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-500 px-2.5 py-0.5 text-2xs font-black uppercase tracking-wide text-black">
                      <Star className="h-3 w-3" aria-hidden="true" /> Top catalog pick
                    </span>
                    <div className="mt-4 flex items-center gap-3">
                      <SmartImage
                        src={best.logo}
                        alt=""
                        width={52}
                        height={52}
                        className="h-13 w-13 rounded-xl bg-surface-2 object-cover ring-1 ring-white/10"
                      />
                      <div className="min-w-0">
                        <h3 className="truncate text-lg font-bold">
                          <Link href={`/tool/${best.slug}`} className="hover:text-accent-300">{best.name}</Link>
                        </h3>
                        <p className="truncate text-2xs text-zinc-400">{best.tagline}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <span className="font-mono text-sm tabular-nums text-emerald-400">
                        {best.startingPrice ?? best.pricing}
                      </span>
                      {bestScore !== null ? (
                        <span className="font-mono text-sm font-black tabular-nums text-emerald-400">
                          {bestScore.toFixed(1)}/10
                        </span>
                      ) : (
                        <VerificationBadge level={best.verificationLevel} />
                      )}
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-zinc-300">{best.description.slice(0, 180)}…</p>
                    {/* Critique §9 fix — explain WHY this is #1 instead of an unexplained ranking. */}
                    <p className="mt-3 rounded-xl border border-white/10 bg-surface-1/70 px-3 py-2 text-2xs leading-relaxed text-zinc-400">
                      <strong className="text-zinc-200">Why this pick:</strong>{' '}
                      {best.verificationLevel === 'hands-on-tested'
                        ? 'the only entry here we have tested hands-on with published evidence.'
                        : best.verificationLevel === 'pricing-verified'
                          ? 'its pricing is source-checked by a human, and it is the most prominent catalogued option in this category.'
                          : 'the most prominent catalogued option in this category — featured status and catalog signals, not a paid placement.'}{' '}
                      No vendor pays for placement.
                    </p>
                    <div className="mt-4 flex gap-2">
                      <a
                        href={`/go/${best.slug}`}
                        target="_blank"
                        rel={best.affiliateProgram ? 'noopener noreferrer nofollow sponsored' : 'noopener noreferrer nofollow'}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-accent-500 px-4 py-2.5 text-2xs font-bold text-black transition-opacity hover:opacity-90"
                      >
                        Visit {best.name} <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      </a>
                      <Link
                        href={`/tool/${best.slug}`}
                        className="inline-flex items-center justify-center rounded-xl border border-white/10 px-4 py-2.5 text-2xs font-bold text-zinc-300 transition-colors hover:border-accent-500/40"
                      >
                        Review
                      </Link>
                    </div>
                  </div>

                  {/* #2–#5 list */}
                  <div className="flex-1 space-y-2">
                    {ranked.slice(1).map((tool, i) => {
                      const score = hasVerifiedScore(tool) && tool.scores ? computeOverall(tool.scores) : null;
                      return (
                        <div
                          key={tool.slug}
                          className="flex items-center gap-3 rounded-xl border border-white/10 bg-surface-2 px-3 py-2.5 transition-colors hover:border-accent-500/30"
                        >
                          <span className="w-5 shrink-0 text-center font-mono text-2xs font-black tabular-nums text-zinc-500">
                            #{i + 2}
                          </span>
                          <SmartImage
                            src={tool.logo}
                            alt=""
                            width={34}
                            height={34}
                            className="h-9 w-9 shrink-0 rounded-lg bg-surface-2 object-cover ring-1 ring-white/10"
                          />
                          <div className="min-w-0 flex-1">
                            <Link href={`/tool/${tool.slug}`} className="block truncate text-sm font-bold hover:text-accent-300">
                              {tool.name}
                            </Link>
                            <p className="truncate text-2xs text-zinc-500">{tool.startingPrice ?? tool.pricing}</p>
                          </div>
                          {score !== null ? (
                            <span className="font-mono text-xs font-black tabular-nums text-emerald-400">{score.toFixed(1)}</span>
                          ) : (
                            <VerificationBadge level={tool.verificationLevel} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            );
          })}
        </div>

        <p className="mt-10 rounded-2xl border border-white/10 bg-surface-1 p-5 text-xs leading-relaxed text-zinc-500">
          <strong className="text-zinc-300">Methodology:</strong> rankings use a prominence score derived from
          our catalogue (rating, featured/editor/trailing flags, and a verified hands-on bonus). A numeric score is
          shown only for tools we tested hands-on; everything else shows an honest verification badge.{' '}
          Some links are affiliate links — commissions never affect rankings.{' '}
          <Link href="/about" className="underline hover:text-zinc-300">Our methodology</Link> ·{' '}
          <Link href="/disclosure" className="underline hover:text-zinc-300">Disclosure</Link>
        </p>
      </main>
      <Footer />
    </div>
  );
}
