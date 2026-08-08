'use client';

import React, { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { CalendarRange, Search, X, Loader2 } from 'lucide-react';
import { buildNewsHref, type MonthBucket, type NewsQuery } from '@/lib/newsQuery';

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

/**
 * News archive controls (v2.8): smart search + date menu + category chips.
 * Everything round-trips through shareable URLs and renders server-side.
 */
export function NewsControls({
  query,
  buckets,
  categories,
  resultCount,
}: {
  query: NewsQuery;
  buckets: MonthBucket[];
  categories: { name: string; count: number }[];
  resultCount: number;
}) {
  const t = useTranslations('news');
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [input, setInput] = useState(query.q);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const firstRender = useRef(true);

  const go = (next: Partial<NewsQuery>) => {
    startTransition(() => router.push(buildNewsHref({ ...query, ...next }), { scroll: false }));
  };

  useEffect(() => setInput(query.q), [query.q]);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (input !== query.q) go({ q: input });
    }, 350);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input]);

  return (
    <div className="rounded-2xl border border-white/10 bg-surface-1 p-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* Smart search */}
        <div className="relative min-w-[220px] flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
            aria-hidden="true"
          />
          <input
            type="search"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('smartSearchPlaceholder')}
            aria-label={t('searchAria')}
            className="w-full rounded-xl border border-white/10 bg-surface-2 py-2.5 pl-9 pr-9 text-sm text-white placeholder-zinc-500 focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
          />
          {isPending ? (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-accent-400" aria-hidden="true" />
          ) : (
            input && (
              <button
                onClick={() => setInput('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded text-zinc-500 hover:text-white"
                aria-label={t('clearSearch')}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )
          )}
        </div>

        {/* Date menu */}
        <div className="flex items-center gap-2">
          <CalendarRange className="h-4 w-4 text-zinc-500" aria-hidden="true" />
          <label className="sr-only" htmlFor="news-month">
            {t('filterByMonth')}
          </label>
          <select
            id="news-month"
            value={query.month === 'all' ? 'all' : query.month}
            onChange={(e) => go({ month: e.target.value })}
            className="rounded-xl border border-white/10 bg-surface-2 px-3 py-2.5 text-sm text-white focus:border-accent-500 focus:outline-none"
          >
            {buckets.map((b) => (
              <option key={b.key} value={b.key}>
                {monthName(locale, b.key)} ({b.count})
              </option>
            ))}
            <option value="all">{t('allOfYear', { count: buckets.reduce((s2, b) => s2 + b.count, 0) })}</option>
          </select>
        </div>

        <span className="ml-auto font-mono text-2xs tabular-nums text-zinc-500">
          {t('items', { count: resultCount })}
        </span>
      </div>

      {/* Category chips */}
      {categories.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-white/5 pt-3">
          <button
            onClick={() => go({ category: '' })}
            aria-pressed={!query.category}
            className={`rounded-full border px-3 py-1.5 text-2xs font-semibold transition-colors ${
              !query.category
                ? 'border-accent-500 bg-accent-500/20 text-accent-200'
                : 'border-white/10 bg-surface-2 text-zinc-400 hover:border-accent-500/40'
            }`}
          >
            {t('allTopics')}
          </button>
          {categories.map((c) => {
            const active = query.category === c.name;
            return (
              <button
                key={c.name}
                onClick={() => go({ category: active ? '' : c.name })}
                aria-pressed={active}
                className={`rounded-full border px-3 py-1.5 text-2xs font-semibold transition-colors ${
                  active
                    ? 'border-accent-500 bg-accent-500/20 text-accent-200'
                    : 'border-white/10 bg-surface-2 text-zinc-400 hover:border-accent-500/40 hover:text-accent-300'
                }`}
              >
                {c.name} <span className="font-mono tabular-nums opacity-60">{c.count}</span>
              </button>
            );
          })}
        </div>
      )}

      {(query.q || query.category || query.month !== buckets[0]?.key) && (
        <div className="mt-3 border-t border-white/5 pt-3">
          <button onClick={() => go({ q: '', category: '', month: '' })} className="text-2xs font-semibold text-zinc-500 underline hover:text-zinc-300">
            {t('clearAllFilters')}
          </button>
        </div>
      )}
    </div>
  );
}
