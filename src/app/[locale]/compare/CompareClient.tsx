"use client";

import React, { useMemo, useState } from 'react';
import { SmartImage } from '@/components/SmartImage';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CustomSelect } from '@/components/CustomSelect';
import { ALL_TOOLS, Tool, hasVerifiedScore, computeOverall } from '@/data/tools';
import { byRankDesc } from '@/lib/ranking';
import { VerificationBadge } from '@/components/VerificationBadge';
import { Sparkles, Star, ExternalLink, Trophy, Plus, X, Flame } from 'lucide-react';
import Link from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

const ACCENTS = ['text-amber-400', 'text-amber-200', 'text-amber-300'];
const BTN = ['bg-accent-500 hover:bg-accent-400 text-black', 'bg-zinc-800 hover:bg-zinc-700 text-white', 'bg-zinc-800 hover:bg-zinc-700 text-white'];

export function CompareClient({ initialTools }: { initialTools: Tool[] }) {
  const tr = useTranslations('compare');
  const tc = useTranslations('categories');
  const tcommon = useTranslations('common');
  const pricingLabel = (pr: string) => (pr === 'Free Trial' ? tcommon('freeTrial') : tcommon(pr.toLowerCase() as never));
  // Audit fix 2.1 — initial selection is resolved server-side and passed in as
  // a prop, so the table renders in the SSR HTML (crawlable). No useSearchParams.
  const [selected, setSelected] = useState<Tool[]>(initialTools.slice(0, 3));

  const options = useMemo(
    () => [...ALL_TOOLS].sort((a, b) => a.name.localeCompare(b.name)).map((t) => ({ value: t.slug, label: t.name, category: t.category })),
    []
  );

  const setTool = (index: number, slug: string) => {
    const found = ALL_TOOLS.find((t) => t.slug === slug);
    if (!found) return;
    setSelected((prev) => prev.map((t, i) => (i === index ? found : t)));
  };

  const addColumn = () => {
    if (selected.length >= 3) return;
    const next = ALL_TOOLS.find((t) => !selected.some((s) => s.slug === t.slug));
    if (next) setSelected([...selected, next]);
  };

  const removeColumn = (index: number) => {
    if (selected.length <= 2) return;
    setSelected(selected.filter((_, i) => i !== index));
  };

  const bestScoreTool = useMemo(() => {
    const tested = selected.filter(hasVerifiedScore);
    if (tested.length === 0) return null;
    return tested.sort((a, b) => computeOverall(b.scores!) - computeOverall(a.scores!))[0];
  }, [selected]);

  // Honest "most verified" badge (audit fix 2.4). The old code ranked by
  // reviewsCount — a fabricated seed value. Now it is whichever of the
  // selected tools we have verified furthest.
  const mostPopularTool = useMemo(() => {
    return selected.slice().sort(byRankDesc)[0];
  }, [selected]);

  const cols = selected.length;
  const gridCols = cols === 3 ? 'grid-cols-4' : 'grid-cols-3';

  return (
    <div className="min-h-screen bg-surface-0 text-white flex flex-col justify-between">
      <div>
        <Header />

        <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-20 border-b border-white/10 text-center">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent-500/30 bg-accent-500/10 px-4 py-1.5 text-xs font-bold text-accent-400">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{tr('badge')}</span>
            </div>
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
              {tr('heading')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">{tr('headingAccent')}</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm text-zinc-400 sm:text-lg">
              {tr('subtitle2')}
            </p>

            <div className={`mt-10 mx-auto max-w-4xl grid grid-cols-1 gap-4 sm:grid-cols-${cols}`}>
              {selected.map((tool, i) => (
                <div key={i} className="relative rounded-2xl border border-white/10 bg-zinc-900/60 p-5 backdrop-blur-xl">
                  {selected.length > 2 && (
                    <button
                      onClick={() => removeColumn(i)}
                      className="absolute -top-2 -right-2 rounded-full bg-zinc-800 border border-white/10 p-1 text-zinc-400 hover:text-white"
                      aria-label={tr('removeTool')}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <CustomSelect
                    label={tr('toolLetter', { letter: String.fromCharCode(65 + i) })}
                    options={options}
                    value={tool.slug}
                    onChange={(val) => setTool(i, val)}
                    iconColor={ACCENTS[i]}
                  />
                </div>
              ))}
              {selected.length < 3 && (
                <button
                  onClick={addColumn}
                  className="flex min-h-[90px] items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 text-xs font-bold text-zinc-500 hover:text-accent-300 hover:border-accent-500/40 transition-colors"
                >
                  <Plus className="h-4 w-4" /> {tr('addThird')}
                </button>
              )}
            </div>
          </div>
        </section>

        <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-white/10 bg-zinc-900 overflow-hidden shadow-2xl overflow-x-auto">
            <div className={`grid ${gridCols} min-w-[640px] border-b border-white/10 bg-zinc-950/60 p-6 text-center text-xs sm:text-sm font-extrabold`}>
              <div className="text-left text-zinc-400">{tr('featureSpec')}</div>
              {selected.map((t, i) => (
                <div key={t.slug} className={`flex flex-col items-center gap-2 ${ACCENTS[i]}`}>
                  <SmartImage src={t.logo} alt="" width={40} height={40} className="h-10 w-10 rounded-xl border border-white/10 object-cover" />
                  <Link href={`/tool/${t.slug}`} className="hover:underline">{t.name}</Link>
                  {hasVerifiedScore(t) && bestScoreTool?.slug === t.slug ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-2xs font-bold text-emerald-300">
                      <Trophy className="h-2.5 w-2.5" /> {tr('verifiedLeader')}
                    </span>
                  ) : mostPopularTool?.slug === t.slug ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-2xs font-bold text-amber-300">
                      <Flame className="h-2.5 w-2.5" /> {tr('mostVerified')}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="divide-y divide-white/5 text-xs sm:text-sm min-w-[640px]">
              <Row label={tr('rowCategory')} cells={selected.map((x) => (tc.has(x.category) ? tc(x.category) : x.category))} gridCols={gridCols} />
              <Row label={tr('rowPricing')} cells={selected.map((x) => `${pricingLabel(x.pricing)}${x.startingPrice ? ` (${x.startingPrice})` : ''}`)} gridCols={gridCols} accent="text-emerald-400" />
              <div className={`grid ${gridCols} p-5 items-center`}>
                <span className="font-bold text-zinc-400">{tr('editorialScore')}</span>
                {selected.map((t) => (
                  <div key={t.slug} className="flex items-center justify-center gap-1">
                    {hasVerifiedScore(t) && t.scores ? (
                      <>
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span className="font-extrabold text-emerald-400">
                          {computeOverall(t.scores)}/10 ({tr('verifiedTest')})
                        </span>
                      </>
                    ) : (
                      <VerificationBadge level={t.verificationLevel} />
                    )}
                  </div>
                ))}
              </div>
              <Row label={tr('rowMetric')} cells={selected.map((x) => x.metrics || '—')} gridCols={gridCols} accent="text-accent-300" />
              {/*
                Bug fix — the previous "Last Reviewed" column showed
                `cataloguedAt` for every tool, but almost all tools are not
                hands-on tested, so that label overstated the verification
                level. Now it reflects what is actually true per tool.
              */}
              <Row label={tr('rowTested')} cells={selected.map((x) => x.testedAt || x.cataloguedAt || '—')} gridCols={gridCols} />
              <div className={`grid ${gridCols} p-5 items-start`}>
                <span className="font-bold text-zinc-400">{tr('rowBestFor')}</span>
                {selected.map((t) => (
                  <p key={t.slug} className="text-center text-xs text-zinc-400 px-2">{t.description}</p>
                ))}
              </div>
              <div className={`grid ${gridCols} p-5 items-start`}>
                <span className="font-bold text-zinc-400">{tr('rowTags')}</span>
                {selected.map((t) => (
                  <div key={t.slug} className="flex flex-wrap justify-center gap-1 px-2">
                    {t.tags.slice(0, 4).map((tag) => (
                      <span key={tag} className="rounded-md bg-zinc-800 px-2 py-0.5 text-2xs text-zinc-400 border border-zinc-700/50">#{tag}</span>
                    ))}
                  </div>
                ))}
              </div>
              <div className={`grid ${gridCols} p-6 items-center bg-zinc-950/40`}>
                <span className="font-extrabold text-white">{tr('rowLink')}</span>
                {selected.map((t, i) => (
                  <div key={t.slug} className="text-center">
                    <a
                      href={`/go/${t.slug}`}
                      target="_blank"
                      rel="noopener noreferrer nofollow sponsored"
                      className={`inline-flex items-center gap-1.5 rounded-xl ${BTN[i]} px-4 py-2.5 text-xs font-bold shadow-lg transition-colors`}
                    >
                      <span>{tr('tryTool', { name: t.name })}</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <p className="mt-4 text-center text-2xs text-zinc-500">
            {tr('footerNote')}{' '}
            <Link href="/disclosure" className="underline hover:text-zinc-300">{tr('readDisclosure')}</Link>.
          </p>
        </main>
      </div>

      <Footer />
    </div>
  );
}

function Row({ label, cells, gridCols, accent = 'text-white' }: { label: string; cells: string[]; gridCols: string; accent?: string }) {
  return (
    <div className={`grid ${gridCols} p-5 items-center`}>
      <span className="font-bold text-zinc-400">{label}</span>
      {cells.map((cell, idx) => (
        <span key={idx} className={`text-center font-medium ${accent}`}>{cell}</span>
      ))}
    </div>
  );
}
