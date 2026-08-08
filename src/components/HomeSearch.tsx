'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from '@/i18n/navigation';
import { Search, ArrowRight, Sparkles, TrendingUp } from 'lucide-react';
import { ToolRecommenderModal } from '@/components/ToolRecommenderModal';
import { ALL_TOOLS, type Tool } from '@/data/tools';
import { VerificationBadge } from '@/components/VerificationBadge';
import { SmartImage } from '@/components/SmartImage';

/**
 * Audit fix 4.3 — enhanced search with auto-suggest.
 * The old search was a plain input that navigated on submit. Now it shows
 * a live dropdown with top matches and trending suggestions as the user types.
 */

const QUICK_CHIPS = [
  { label: '🔥 Caption Generator for Shorts', query: 'caption generator for Shorts' },
  { label: '🎙️ Free Voice Cloning', query: 'free voice cloning' },
  { label: '🎬 Faceless YouTube Automation', query: 'faceless' },
  { label: '✂️ Podcast to Shorts', query: 'podcast clipping' },
  { label: '🎥 Cinematic B-Roll', query: 'b-roll' },
];

const TRENDING_SEARCHES = [
  'AI video generator',
  'voice cloning free',
  'YouTube thumbnail maker',
  'auto captions TikTok',
  'faceless YouTube channel',
  'podcast editor AI',
];

function quickSearch(query: string, limit = 5): Tool[] {
  const q = query.toLowerCase().trim();
  if (q.length < 2) return [];
  return ALL_TOOLS.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.tagline.toLowerCase().includes(q) ||
      t.tags.some((tag) => tag.toLowerCase().includes(q))
  ).slice(0, limit);
}

export function HomeSearch() {
  const router = useRouter();
  const [value, setValue] = useState('');
  const [quizOpen, setQuizOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [results, setResults] = useState<Tool[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Live search as user types
  useEffect(() => {
    setActiveIndex(null);
    if (value.trim().length >= 2) {
      setResults(quickSearch(value));
      setShowSuggestions(true);
    } else {
      setResults([]);
      setShowSuggestions(value.trim().length === 0 && document.activeElement === inputRef.current);
    }
  }, [value]);

  // Close suggestions on outside click.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // Cmd+K shortcut.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setShowSuggestions(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const submit = useCallback(
    (q: string) => {
      const trimmed = q.trim();
      setShowSuggestions(false);
      router.push(trimmed ? `/tools?q=${encodeURIComponent(trimmed)}` : '/tools');
    },
    [router]
  );

  /*
    Accessibility fix — the suggestion dropdown previously exposed a
    `role=listbox` but had no keyboard navigation and no
    `aria-activedescendant`, so screen-reader/keyboard users could not move
    through the suggestions. This builds a flat, ordered list of selectable
    options and wires ArrowDown / ArrowUp / Enter / mouse hover to it.
  */
  const options = useMemo(() => {
    if (value.trim().length >= 2) {
      return [
        ...results.map((t) => ({ kind: 'tool' as const, slug: t.slug, name: t.name })),
        { kind: 'seeall' as const, query: value },
      ];
    }
    return TRENDING_SEARCHES.map((term) => ({ kind: 'trending' as const, term }));
  }, [value, results]);

  const activateOption = useCallback(
    (index: number) => {
      const opt = options[index];
      if (!opt) return;
      setActiveIndex(null);
      if (opt.kind === 'tool') {
        setShowSuggestions(false);
        router.push(`/tool/${opt.slug}`);
      } else if (opt.kind === 'seeall') {
        submit(opt.query);
      } else if (opt.kind === 'trending') {
        setValue(opt.term);
        submit(opt.term);
      }
    },
    [options, router, submit]
  );

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || options.length === 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setShowSuggestions(true);
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i === null ? 0 : (i + 1) % options.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i === null ? options.length - 1 : (i - 1 + options.length) % options.length));
    } else if (e.key === 'Enter' && activeIndex !== null) {
      e.preventDefault();
      activateOption(activeIndex);
    }
  };

  return (
    <div className="mx-auto max-w-2xl" ref={wrapperRef}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          submit(value);
        }}
        className="relative"
      >
        <label htmlFor="hero-search" className="sr-only">
          Search AI tools
        </label>
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500"
          aria-hidden="true"
        />
        <input
          id="hero-search"
          ref={inputRef}
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={onInputKeyDown}
          placeholder="Try &ldquo;free voice cloning&rdquo;, &ldquo;caption generator&rdquo; or &ldquo;faceless channel&rdquo;&hellip;"
          className="w-full rounded-2xl border border-white/10 bg-surface-1 py-4 pl-12 pr-28 text-sm text-white placeholder-zinc-500 focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
          aria-autocomplete="list"
          aria-controls="search-suggestions"
          aria-activedescendant={activeIndex !== null ? `search-option-${activeIndex}` : undefined}
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center gap-1.5 rounded-xl bg-accent-500 px-4 py-2 text-2xs font-bold text-black hover:bg-accent-400 transition-colors"
        >
          Search
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </button>

        {/* Auto-suggest dropdown */}
        {showSuggestions && (
          <div
            id="search-suggestions"
            role="listbox"
            className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-white/10 bg-surface-1 shadow-2xl"
          >
            {/* Live tool results */}
            {results.length > 0 && (
              <div className="p-2">
                <p className="px-3 py-1 text-2xs font-bold uppercase tracking-wider text-zinc-500">
                  Tools
                </p>
                {results.map((tool, idx) => (
                  <button
                    key={tool.slug}
                    id={`search-option-${idx}`}
                    role="option"
                    aria-selected={activeIndex === idx}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => activateOption(idx)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                      activeIndex === idx ? 'bg-white/10' : 'hover:bg-white/5'
                    }`}
                  >
                    <SmartImage
                      src={tool.logo}
                      alt=""
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded-lg bg-surface-2 object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-white">
                        {tool.name}
                      </span>
                      <span className="block truncate text-2xs text-zinc-400">
                        {tool.tagline}
                      </span>
                    </div>
                    {tool.startingPrice && (
                      <span className="shrink-0 font-mono text-2xs tabular-nums text-emerald-400">
                        {tool.startingPrice}
                      </span>
                    )}
                  </button>
                ))}
                <button
                  id={`search-option-${results.length}`}
                  role="option"
                  aria-selected={activeIndex === results.length}
                  onMouseEnter={() => setActiveIndex(results.length)}
                  onClick={() => activateOption(results.length)}
                  className={`mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-2xs font-semibold text-accent-400 hover:bg-white/5 ${
                    activeIndex === results.length ? 'bg-white/10' : ''
                  }`}
                >
                  <Search className="h-3 w-3" aria-hidden="true" />
                  See all results for &ldquo;{value}&rdquo;
                </button>
              </div>
            )}

            {/* Trending searches (shown when input is empty and focused) */}
            {value.trim().length === 0 && (
              <div className="p-2">
                <p className="flex items-center gap-1.5 px-3 py-1 text-2xs font-bold uppercase tracking-wider text-zinc-500">
                  <TrendingUp className="h-3 w-3" aria-hidden="true" />
                  Trending searches
                </p>
                {TRENDING_SEARCHES.map((term, idx) => (
                  <button
                    key={term}
                    id={`search-option-${idx}`}
                    role="option"
                    aria-selected={activeIndex === idx}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => activateOption(idx)}
                    className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-white/5 hover:text-white ${
                      activeIndex === idx ? 'bg-white/10 text-white' : ''
                    }`}
                  >
                    <Search className="h-3.5 w-3.5 text-zinc-500" aria-hidden="true" />
                    {term}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </form>

      {/* Quick search chips + Interactive Recommender trigger */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setQuizOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-full border border-accent-500/40 bg-accent-500/15 px-3.5 py-1.5 text-2xs font-extrabold text-accent-300 hover:bg-accent-500 hover:text-black transition-all shadow-md"
        >
          <Sparkles className="h-3 w-3" />
          <span>Find Me a Tool (60s Quiz)</span>
        </button>

        {QUICK_CHIPS.map((chip) => (
          <button
            key={chip.query}
            type="button"
            onClick={() => submit(chip.query)}
            className="rounded-full border border-white/5 bg-surface-1 px-3 py-1.5 text-2xs text-zinc-400 transition-colors hover:border-accent-500/30 hover:text-white"
          >
            {chip.label}
          </button>
        ))}
      </div>

      <ToolRecommenderModal open={quizOpen} onClose={() => setQuizOpen(false)} />
    </div>
  );
}
