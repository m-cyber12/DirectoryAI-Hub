'use client';

import React, { useState, useEffect, useRef, useTransition } from 'react';
import { useRouter } from '@/i18n/navigation';
import Link from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Search, X, SlidersHorizontal, Loader2, ShieldCheck, Tags } from 'lucide-react';
import { CATEGORIES, PRICING_OPTIONS, type Category, type PricingOption } from '@/data/tools';
import {
  buildToolsHref,
  type ToolQuery,
  type SortKey,
  type VerificationFilter,
} from '@/lib/toolFilters';

/**
 * Client island for /tools. Deliberately small: it only reads the current
 * query and navigates. All filtering happens on the server (see
 * lib/toolFilters.ts), so the results themselves are always in the HTML.
 *
 * Audit fix 4.4 — every option now carries a live count, so you know what
 * you'll get before clicking, plus a "tested only" toggle and removable
 * chips for active filters.
 */

interface Facets {
  category: Map<string, number>;
  pricing: Map<string, number>;
  tags: [string, number][];
  tested: number;
  priceChecked: number;
  listed: number;
  total: number;
}

export function ToolsFilterBar({
  query,
  facets,
  resultCount,
}: {
  query: ToolQuery;
  facets: Facets;
  resultCount?: number;
}) {
  const t = useTranslations('tools');
  const tc = useTranslations('categories');
  const tcommon = useTranslations('common');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchInput, setSearchInput] = useState(query.q);
  const [showAll, setShowAll] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const firstRender = useRef(true);

  const go = (next: Partial<ToolQuery>) => {
    startTransition(() => {
      // Any filter change resets to page 1.
      router.push(buildToolsHref({ ...query, ...next }, 1), { scroll: false });
    });
  };

  // Keep the input in sync when the user navigates back/forward.
  useEffect(() => {
    setSearchInput(query.q);
  }, [query.q]);

  /**
   * Log completed searches (audit fix 4.5). Fires once per settled query, not
   * per keystroke, and records only the query text and result count — no
   * identifiers, so it needs no consent banner.
   */
  useEffect(() => {
    if (!query.q || resultCount === undefined) return;
    const id = setTimeout(() => {
      void fetch('/api/search-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.q,
          results: resultCount,
          category: query.category !== 'All' ? query.category : null,
        }),
        keepalive: true,
      }).catch(() => undefined);
    }, 1200);
    return () => clearTimeout(id);
  }, [query.q, query.category, resultCount]);

  // Debounced search navigation.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (searchInput !== query.q) go({ q: searchInput });
    }, 350);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  /** Toggle one capability tag in the AND-combined tag filter. */
  const toggleTag = (tag: string) => {
    const has = query.tags.some((t) => t.toLowerCase() === tag.toLowerCase());
    const next = has ? query.tags.filter((t) => t.toLowerCase() !== tag.toLowerCase()) : [...query.tags, tag];
    go({ tags: next });
  };

  const pricingLabel = (p: string) =>
    p === 'Free'
      ? tcommon('free')
      : p === 'Freemium'
        ? tcommon('freemium')
        : p === 'Paid'
          ? tcommon('paid')
          : tcommon('freeTrial');

  const activeChips = [
    query.category !== 'All' && { label: tc.has(query.category) ? tc(query.category) : query.category, clear: { category: 'All' as Category } },
    query.pricing !== 'All' && { label: pricingLabel(query.pricing), clear: { pricing: 'All' as PricingOption } },
    query.testedOnly && { label: t('facetTested'), clear: { testedOnly: false } },
    query.verification !== 'any' &&
      !query.testedOnly && {
        label:
          query.verification === 'tested'
            ? t('facetTested')
            : query.verification === 'price-checked'
              ? t('facetPriceChecked')
              : t('facetListed'),
        clear: { verification: 'any' as VerificationFilter },
      },
    ...query.tags.map((tag) => ({
      label: `#${tag}`,
      clear: { tags: query.tags.filter((t) => t !== tag) },
    })),
    query.q && { label: `“${query.q}”`, clear: { q: '' } },
  ].filter(Boolean) as { label: string; clear: Partial<ToolQuery> }[];

  const visibleCategories = showAll ? CATEGORIES : CATEGORIES.slice(0, 8);

  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-surface-1 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={tcommon('searchPlaceholder')}
            aria-label={t('searchLabel')}
            className="w-full rounded-xl border border-white/10 bg-surface-2 py-2.5 pl-9 pr-9 text-sm text-white placeholder-zinc-500 focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
          />
          {isPending ? (
            <Loader2
              className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-accent-400"
              aria-hidden="true"
            />
          ) : (
            searchInput && (
              <button
                onClick={() => setSearchInput('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded text-zinc-500 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-500"
                aria-label={tcommon('clearSearch')}
              >
                <X className="h-4 w-4" />
              </button>
            )
          )}
        </div>

        <label className="sr-only" htmlFor="sort-select">
          {t('sortByLabel')}
        </label>
        <select
          id="sort-select"
          value={query.sort}
          onChange={(e) => go({ sort: e.target.value as SortKey })}
          className="rounded-xl border border-white/10 bg-surface-2 px-3 py-2.5 text-sm text-white focus:border-accent-500 focus:outline-none"
        >
          {(
            [
              { value: 'relevance', label: t('sortRelevance') },
              { value: 'rating', label: t('sortRating') },
              { value: 'newest', label: t('sortNewest') },
              { value: 'price-low', label: t('sortPriceLow') },
              { value: 'price-high', label: t('sortPriceHigh') },
              { value: 'name', label: t('sortName') },
            ] as { value: SortKey; label: string }[]
          ).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        {/*
          Verification facet (critique §4): category × price × capability ×
          verification can finally be combined. "Tested only" stays reachable
          for the zero-tools honest state.
        */}
        <div role="group" aria-label={t('filterVerification')} className="flex flex-wrap items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-zinc-500" aria-hidden="true" />
          {(
            [
              { value: 'any', label: t('facetAny') },
              { value: 'tested', label: `${t('facetTested')} (${facets.tested})` },
              { value: 'price-checked', label: `${t('facetPriceChecked')} (${facets.priceChecked})` },
              { value: 'listed', label: t('facetListed') },
            ] as { value: VerificationFilter; label: string }[]
          ).map((opt) => {
            const active = query.testedOnly
              ? opt.value === 'tested'
              : query.verification === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => go({ testedOnly: false, verification: opt.value })}
                aria-pressed={active}
                className={`rounded-lg border px-2.5 py-1.5 text-2xs font-semibold transition-colors ${
                  active
                    ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-300'
                    : 'border-white/10 bg-surface-2 text-zinc-400 hover:border-emerald-500/30'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Category pills with counts */}
      <div className="mt-4 flex flex-wrap gap-2">
        {visibleCategories.map((cat) => {
          const count = cat === 'All' ? facets.total : facets.category.get(cat) || 0;
          const active = query.category === cat;
          if (count === 0 && cat !== 'All') return null;
          return (
            <button
              key={cat}
              onClick={() => go({ category: cat as Category })}
              aria-pressed={active}
              className={`rounded-full border px-3 py-1.5 text-2xs font-semibold transition-colors ${
                active
                  ? 'border-accent-500 bg-accent-500/20 text-accent-200'
                  : 'border-white/10 bg-surface-2 text-zinc-400 hover:border-accent-500/40 hover:text-accent-300'
              }`}
            >
              {tc.has(cat) ? tc(cat) : cat}{' '}
              <span className="font-mono tabular-nums opacity-60">{count}</span>
            </button>
          );
        })}
        {!showAll && CATEGORIES.length > 8 && (
          <button
            onClick={() => setShowAll(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-surface-2 px-3 py-1.5 text-2xs font-semibold text-zinc-400 hover:border-accent-500/40 hover:text-accent-300"
          >
            <SlidersHorizontal className="h-3 w-3" aria-hidden="true" />
            {t('moreCategories')}
          </button>
        )}
      </div>

      {/* Pricing pills with counts */}
      <div className="mt-2 flex flex-wrap gap-2">
        {PRICING_OPTIONS.map((p) => {
          const count = p === 'All' ? facets.total : facets.pricing.get(p) || 0;
          const active = query.pricing === p;
          if (count === 0 && p !== 'All') return null;
          return (
            <button
              key={p}
              onClick={() => go({ pricing: p as PricingOption })}
              aria-pressed={active}
              className={`rounded-full border px-3 py-1.5 text-2xs font-semibold transition-colors ${
                active
                  ? 'border-emerald-500 bg-emerald-500/20 text-emerald-200'
                  : 'border-white/10 bg-surface-2 text-zinc-400 hover:border-emerald-500/40 hover:text-emerald-300'
              }`}
            >
              {p} <span className="font-mono tabular-nums opacity-60">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Capability tags — multi-select AND filter (critique §4/§5). */}
      {facets.tags.length > 0 && (
        <div className="mt-3 border-t border-white/5 pt-3">
          <p className="mb-2 flex items-center gap-1.5 text-2xs font-bold uppercase tracking-wider text-zinc-500">
            <Tags className="h-3 w-3" aria-hidden="true" />
            Capability filters — combine as many as you need
          </p>
          <div className="flex flex-wrap gap-1.5">
            {facets.tags.map(([tag, count]) => {
              const active = query.tags.some((t) => t.toLowerCase() === tag.toLowerCase());
              return (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  aria-pressed={active}
                  className={`rounded-md border px-2.5 py-1 text-2xs transition-colors ${
                    active
                      ? 'border-cyan-400/60 bg-cyan-400/15 font-bold text-cyan-200'
                      : 'border-white/10 bg-surface-2 text-zinc-400 hover:border-cyan-400/30 hover:text-cyan-300'
                  }`}
                >
                  #{tag} <span className="font-mono tabular-nums opacity-60">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Removable active-filter chips */}
      {activeChips.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/5 pt-3">
          <span className="text-2xs text-zinc-500">Active:</span>
          {activeChips.map((chip) => (
            <button
              key={chip.label}
              onClick={() => go(chip.clear)}
              className="inline-flex items-center gap-1.5 rounded-full border border-accent-500/30 bg-accent-500/10 px-2.5 py-1 text-2xs font-semibold text-accent-200 hover:bg-accent-500/20"
            >
              {chip.label}
              <X className="h-3 w-3" aria-hidden="true" />
            </button>
          ))}
          <Link
            href="/tools"
            className="ml-1 text-2xs font-semibold text-zinc-500 underline hover:text-zinc-300"
          >
            Clear all
          </Link>
        </div>
      )}
    </div>
  );
}
