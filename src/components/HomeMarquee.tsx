'use client';

import Link from '@/i18n/navigation';
import { useMemo } from 'react';
import { Search, ArrowRight } from 'lucide-react';
import { ALL_TOOLS } from '@/data/tools';
import { REAL_CATEGORIES, categorySlug } from '@/lib/categories';

/**
 * HomeMarquee — compact single-pass discovery strip between hero and stats.
 *
 * Critique §4 fix: the old ticker rendered the same 48 tool names TWICE (a
 * duplicated track for the seamless loop) and the items were unclickable —
 * prime viewport space burned on decoration. This version keeps the visual
 * rhythm but makes every item a real, useful link: job-focused categories
 * plus the most common starter searches. Nothing is duplicated.
 */

const POPULAR_SEARCHES = [
  'free voice cloning',
  'caption generator for Shorts',
  'text to video',
  'podcast editing',
  'video translation dubbing',
  'faceless YouTube',
];

export function HomeMarquee() {
  const categories = useMemo(() => REAL_CATEGORIES.slice(0, 8), []);
  const popularTools = useMemo(
    () =>
      [...ALL_TOOLS]
        .filter((t) => t.verificationLevel === 'pricing-verified')
        .slice(0, 6),
    []
  );

  return (
    <nav
      aria-label="Quick starts"
      className="relative border-y border-white/5 bg-surface-1/60 py-4 backdrop-blur-sm"
    >
      {/* edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-surface-0 to-transparent" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-surface-0 to-transparent" aria-hidden="true" />

      <div>
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2 px-10">
          {categories.map((c) => (
            <Link
              key={c}
              href={`/category/${categorySlug(c)}`}
              className="whitespace-nowrap rounded-full border border-white/10 px-3 py-1.5 font-mono text-2xs font-semibold uppercase tracking-[0.14em] text-zinc-400 transition-colors hover:border-accent-500/50 hover:text-accent-300"
            >
              {c}
            </Link>
          ))}
          <span className="mx-2 text-2xs text-accent-500" aria-hidden="true">✦</span>
          {popularTools.map((t) => (
            <Link
              key={t.slug}
              href={`/tool/${t.slug}`}
              className="whitespace-nowrap rounded-full border border-white/10 px-3 py-1.5 text-2xs font-semibold text-zinc-300 transition-colors hover:border-emerald-400/50 hover:text-emerald-300"
            >
              {t.name}
            </Link>
          ))}
          <span className="mx-2 text-2xs text-accent-500" aria-hidden="true">✦</span>
          {POPULAR_SEARCHES.map((s) => (
            <Link
              key={s}
              href={`/tools?q=${encodeURIComponent(s)}`}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-white/10 px-3 py-1.5 text-2xs text-zinc-400 transition-colors hover:border-cyan-400/50 hover:text-cyan-300"
            >
              <Search className="h-3 w-3" aria-hidden="true" />
              {s}
            </Link>
          ))}
          <Link
            href="/tools"
            className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-accent-500/15 px-3 py-1.5 text-2xs font-bold text-accent-300 transition-colors hover:bg-accent-500/25"
          >
            All {ALL_TOOLS.length} tools <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </nav>
  );
}
