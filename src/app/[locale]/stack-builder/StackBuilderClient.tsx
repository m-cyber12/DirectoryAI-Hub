'use client';

/**
 * Stack Builder v2 — critique §4 ("a static quiz, not a real tool") and
 * §11-13 (interactive workflow builder).
 *
 * What changed vs the old 12-combination quiz:
 *   - 6 creator goals × 3 budgets, but every recommendation is now a SLOT
 *     (role in the workflow) with swappable alternatives — hundreds of real
 *     combinations instead of twelve canned answers.
 *   - Costs are computed live from catalog pricing data, never hardcoded.
 *   - The stack persists in localStorage AND encodes into the URL, so it can
 *     be shared or bookmarked (?goal=…&budget=…&pick=slug,slug,…).
 *   - Copy-to-clipboard export of the full stack summary.
 *
 * Honesty rules: recommendations are labelled editorial picks, not test
 * results; verification badges come from the catalog; nothing claims a score.
 */

import React, { useEffect, useMemo, useState } from 'react';
import Link from '@/i18n/navigation';
import {
  Sparkles,
  Layers,
  ExternalLink,
  RotateCcw,
  Share2,
  Copy,
  Check,
  Wallet,
  FlaskConical,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SmartImage } from '@/components/SmartImage';
import { VerificationBadge } from '@/components/VerificationBadge';
import { ALL_TOOLS, type Tool } from '@/data/tools';

type GoalKey = 'faceless' | 'shorts' | 'podcast' | 'thumbnails' | 'dubbing' | 'avatars';
type BudgetKey = 'free' | 'budget' | 'pro';

interface Slot {
  role: string;
  hint: string;
  /** Candidate tool slugs in editorial order (first = flagship pick). */
  candidates: string[];
}

const GOALS: Record<GoalKey, { label: string; blurb: string; slots: Slot[] }> = {
  faceless: {
    label: 'Faceless channel',
    blurb: 'Script → voice → video → packaging, without appearing on camera.',
    slots: [
      { role: 'Scripting & research', hint: 'Ideas, outlines and full scripts', candidates: ['chatgpt', 'claude', 'jasper', 'notebooklm'] },
      { role: 'Voiceover', hint: 'Narration that carries the video', candidates: ['elevenlabs', 'murf-ai', 'lovo-ai', 'speechify'] },
      { role: 'Video assembly', hint: 'Script + voice + visuals into a finished video', candidates: ['invideo', 'pictory', 'fliki', 'autoshorts'] },
      { role: 'SEO & packaging', hint: 'Titles, keywords and thumbnail research', candidates: ['vidiq', 'tubebuddy', '1of10', 'nexlev'] },
    ],
  },
  shorts: {
    label: 'Shorts & clips',
    blurb: 'Turn long recordings into vertical clips people actually finish.',
    slots: [
      { role: 'Clip extraction', hint: 'Find and cut the best moments', candidates: ['opusclip', 'klap', 'munch', 'vizard'] },
      { role: 'Captions & styling', hint: 'Animated captions, zooms, B-roll', candidates: ['submagic', 'captions', 'capcut', 'zeemo'] },
      { role: 'Fine-tune editing', hint: 'Manual polish when the AI gets it 90% right', candidates: ['capcut', 'veed', 'descript'] },
    ],
  },
  podcast: {
    label: 'Podcast pipeline',
    blurb: 'Record clean, edit by transcript, ship clips and show notes.',
    slots: [
      { role: 'Recording', hint: 'Remote interviews with local-quality audio', candidates: ['riverside', 'podcastle', 'streamyard'] },
      { role: 'Editing & cleanup', hint: 'Cut by text, remove fillers, level audio', candidates: ['descript', 'auphonic', 'cleanvoice'] },
      { role: 'Clip distribution', hint: 'Audiograms and vertical clips per episode', candidates: ['headliner', 'opusclip', 'chopcast', 'repurpose-io'] },
    ],
  },
  thumbnails: {
    label: 'Thumbnails & CTR',
    blurb: 'Generate the image, add the typography, test the package.',
    slots: [
      { role: 'Image generation', hint: 'Backgrounds, characters and key art', candidates: ['midjourney', 'leonardo-ai', 'ideogram', 'adobe-firefly'] },
      { role: 'Design & typography', hint: 'Layout, text and platform-sized exports', candidates: ['canva', 'adobe-express', 'photoroom'] },
      { role: 'Testing & research', hint: 'Outlier research before you commit', candidates: ['1of10', 'thumbnailtest', 'tubebuddy'] },
    ],
  },
  dubbing: {
    label: 'International dubbing',
    blurb: 'Unlock new audiences by taking existing videos into other languages.',
    slots: [
      { role: 'Translation & dubbing', hint: 'Full-video localization with cloned voices', candidates: ['rask-ai', 'heygen', 'dubverse', 'papercup'] },
      { role: 'Voice quality', hint: 'When you need narration-level TTS separately', candidates: ['elevenlabs', 'wellsaid-labs', 'cartesia'] },
      { role: 'Subtitles & QC', hint: 'Readable subtitles and human review passes', candidates: ['happy-scribe', 'checksub', 'zeemo'] },
    ],
  },
  avatars: {
    label: 'Avatar presenter',
    blurb: 'A synthetic presenter delivers your script on camera.',
    slots: [
      { role: 'Avatar & delivery', hint: 'The presenter that reads your script', candidates: ['heygen', 'synthesia', 'deepbrain-ai', 'colossyan'] },
      { role: 'Scripting', hint: 'Tight scripts read better by avatars', candidates: ['chatgpt', 'claude', 'copy-ai'] },
      { role: 'Editing & polish', hint: 'Cut, caption and resize the output', candidates: ['veed', 'capcut', 'descript'] },
    ],
  },
};

const BUDGETS: Record<BudgetKey, { label: string; blurb: string }> = {
  free: { label: '$0 — Free', blurb: 'Only tools with a genuinely free way in.' },
  budget: { label: 'Budget', blurb: 'The cheapest paid entry per role.' },
  pro: { label: 'Pro', blurb: 'The flagship pick per role, price aside.' },
};

const STORAGE_KEY = 'creatorai-stack-v2';

function parsePrice(priceStr: string | undefined): number {
  if (!priceStr) return 0;
  const match = priceStr.replace(',', '.').match(/\$?([0-9]+(?:\.[0-9]+)?)/);
  return match ? parseFloat(match[1]) : 0;
}

function pickForBudget(slot: Slot, budget: BudgetKey): string | undefined {
  const tools = slot.candidates
    .map((slug) => ALL_TOOLS.find((t) => t.slug === slug))
    .filter((t): t is Tool => Boolean(t));
  if (tools.length === 0) return undefined;

  if (budget === 'free') {
    const freeish = tools.filter((t) => t.pricing === 'Free' || t.pricing === 'Freemium');
    return (freeish[0] ?? tools[0]).slug;
  }
  if (budget === 'budget') {
    const paid = tools.filter((t) => t.pricing !== 'Free');
    const pool = paid.length > 0 ? paid : tools;
    return [...pool].sort((a, b) => parsePrice(a.startingPrice) - parsePrice(b.startingPrice))[0].slug;
  }
  return tools[0].slug; // pro: editorial flagship order
}

interface StackState {
  goal: GoalKey;
  budget: BudgetKey;
  /** Slot index → chosen slug. */
  picks: Record<number, string>;
}

function readUrlState(): Partial<StackState> {
  if (typeof window === 'undefined') return {};
  const sp = new URLSearchParams(window.location.search);
  const goal = sp.get('goal') as GoalKey | null;
  const budget = sp.get('budget') as BudgetKey | null;
  const picks: Record<number, string> = {};
  (sp.get('pick') || '')
    .split(',')
    .forEach((slug, i) => {
      if (slug) picks[i] = slug;
    });
  return {
    goal: goal && GOALS[goal] ? goal : undefined,
    budget: budget && BUDGETS[budget] ? budget : undefined,
    picks: Object.keys(picks).length > 0 ? picks : undefined,
  };
}

export default function StackBuilderClient() {
  const [goal, setGoal] = useState<GoalKey>('faceless');
  const [budget, setBudget] = useState<BudgetKey>('budget');
  const [picks, setPicks] = useState<Record<number, string>>({});
  const [copied, setCopied] = useState(false);
  const [shareMsg, setShareMsg] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate once: URL params win over localStorage.
  useEffect(() => {
    const fromUrl = readUrlState();
    let stored: Partial<StackState> = {};
    try {
      stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch {
      /* corrupted storage — ignore */
    }
    const g = fromUrl.goal ?? (stored.goal && GOALS[stored.goal as GoalKey] ? (stored.goal as GoalKey) : 'faceless');
    const b = fromUrl.budget ?? (stored.budget && BUDGETS[stored.budget as BudgetKey] ? (stored.budget as BudgetKey) : 'budget');
    setGoal(g);
    setBudget(b);
    setPicks(fromUrl.picks ?? stored.picks ?? {});
    setHydrated(true);
  }, []);

  // Persist + reflect in URL whenever state changes.
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ goal, budget, picks } satisfies StackState));
    } catch {
      /* private mode — fine */
    }
    const sp = new URLSearchParams();
    sp.set('goal', goal);
    sp.set('budget', budget);
    const slots = GOALS[goal].slots;
    const pickArr = slots.map((s, i) => picks[i] ?? pickForBudget(s, budget) ?? '');
    if (pickArr.some(Boolean)) sp.set('pick', pickArr.join(','));
    window.history.replaceState(null, '', `?${sp.toString()}`);
  }, [goal, budget, picks, hydrated]);

  // Reset picks when goal/budget changes so the new defaults apply.
  const changeGoal = (g: GoalKey) => {
    setGoal(g);
    setPicks({});
  };
  const changeBudget = (b: BudgetKey) => {
    setBudget(b);
    setPicks({});
  };

  const slots = GOALS[goal].slots;
  const chosen: (Tool | undefined)[] = slots.map(
    (slot, i) => ALL_TOOLS.find((t) => t.slug === (picks[i] ?? pickForBudget(slot, budget)))
  );

  const total = chosen.reduce((sum, t) => sum + (budget === 'free' ? 0 : parsePrice(t?.startingPrice)), 0);

  const copySummary = async () => {
    const lines = [
      `My ${BUDGETS[budget].label} stack for: ${GOALS[goal].label} — via CreatorAI Hub`,
      ...slots.map((slot, i) => {
        const t = chosen[i];
        return `• ${slot.role}: ${t ? `${t.name} (${t.startingPrice ?? t.pricing})` : '—'}`;
      }),
      budget === 'free' ? '' : `Estimated total: $${total.toFixed(2)}/mo from listed entry prices`,
      'Plan yours: /stack-builder',
    ].filter(Boolean);
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked */
    }
  };

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareMsg(true);
      setTimeout(() => setShareMsg(false), 2000);
    } catch {
      /* clipboard blocked */
    }
  };

  const toolRows = useMemo(
    () =>
      slots.map((slot, i) => ({
        slot,
        tool: chosen[i],
        pick: picks[i] ?? pickForBudget(slot, budget) ?? '',
      })),
    [slots, chosen, picks, budget]
  );

  return (
    <div className="min-h-screen bg-surface-0 text-white">
      <Header />
      <main id="main" className="mx-auto max-w-5xl px-4 py-12">
        <span className="inline-flex items-center gap-2 rounded-full border border-accent-500/20 bg-accent-500/10 px-4 py-1.5 text-2xs font-semibold text-accent-300">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Interactive workflow planner
        </span>
        <h1 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">Build your creator stack</h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400">
          Pick the outcome and the budget — you get a role-by-role stack with swappable tools,
          prices computed live from the catalog, and a link you can share. These are editorial
          picks, not test results: verification labels on each tool tell you exactly how far we can
          vouch for it.
        </p>

        {/* Goal picker */}
        <section className="mt-8">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-zinc-500">
            <Layers className="h-4 w-4" aria-hidden="true" /> 1 · What are you building?
          </h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {(Object.keys(GOALS) as GoalKey[]).map((g) => (
              <button
                key={g}
                onClick={() => changeGoal(g)}
                aria-pressed={goal === g}
                className={`rounded-2xl border p-4 text-left transition-colors ${
                  goal === g
                    ? 'border-accent-500/60 bg-accent-500/10'
                    : 'border-white/10 bg-surface-1 hover:border-accent-500/30'
                }`}
              >
                <span className="block text-sm font-bold">{GOALS[g].label}</span>
                <span className="mt-1 block text-2xs leading-relaxed text-zinc-400">{GOALS[g].blurb}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Budget picker */}
        <section className="mt-8">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-zinc-500">
            <Wallet className="h-4 w-4" aria-hidden="true" /> 2 · What&apos;s the budget?
          </h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {(Object.keys(BUDGETS) as BudgetKey[]).map((b) => (
              <button
                key={b}
                onClick={() => changeBudget(b)}
                aria-pressed={budget === b}
                className={`rounded-2xl border p-4 text-left transition-colors ${
                  budget === b
                    ? 'border-emerald-500/60 bg-emerald-500/10'
                    : 'border-white/10 bg-surface-1 hover:border-emerald-500/30'
                }`}
              >
                <span className="block text-sm font-bold">{BUDGETS[b].label}</span>
                <span className="mt-1 block text-2xs text-zinc-400">{BUDGETS[b].blurb}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Stack result */}
        <section className="mt-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold">
              Your {BUDGETS[budget].label} stack for “{GOALS[goal].label}”
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={share}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-surface-1 px-3 py-2 text-2xs font-bold text-zinc-300 hover:border-accent-500/40"
              >
                <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
                {shareMsg ? 'Link copied!' : 'Share link'}
              </button>
              <button
                onClick={copySummary}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-surface-1 px-3 py-2 text-2xs font-bold text-zinc-300 hover:border-accent-500/40"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
                {copied ? 'Copied!' : 'Copy summary'}
              </button>
              <button
                onClick={() => setPicks({})}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-surface-1 px-3 py-2 text-2xs font-bold text-zinc-300 hover:border-rose-500/40"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Reset
              </button>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {toolRows.map(({ slot, tool, pick }, i) => (
              <div key={slot.role} className="rounded-2xl border border-white/10 bg-surface-1 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-2xs font-bold uppercase tracking-wider text-zinc-500">
                      Role {i + 1} · {slot.role}
                    </p>
                    <p className="mt-0.5 text-2xs text-zinc-500">{slot.hint}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="sr-only" htmlFor={`slot-${i}`}>
                      Choose a tool for {slot.role}
                    </label>
                    <select
                      id={`slot-${i}`}
                      value={pick}
                      onChange={(e) => setPicks({ ...picks, [i]: e.target.value })}
                      className="rounded-xl border border-white/10 bg-surface-2 px-3 py-2 text-2xs font-semibold text-white focus:border-accent-500 focus:outline-none"
                    >
                      {slot.candidates.map((slug) => {
                        const c = ALL_TOOLS.find((t) => t.slug === slug);
                        if (!c) return null;
                        return (
                          <option key={slug} value={slug}>
                            {c.name} · {c.startingPrice ?? c.pricing}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                {tool && (
                  <div className="mt-4 flex flex-col gap-4 border-t border-white/5 pt-4 sm:flex-row sm:items-center">
                    <SmartImage
                      src={tool.logo}
                      alt=""
                      width={44}
                      height={44}
                      className="h-11 w-11 rounded-xl border border-white/10 object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/tool/${tool.slug}`} className="text-sm font-bold hover:text-accent-300">
                          {tool.name}
                        </Link>
                        <VerificationBadge level={tool.verificationLevel} />
                      </div>
                      <p className="mt-0.5 truncate text-2xs text-zinc-400">{tool.tagline}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm font-bold tabular-nums text-emerald-400">
                        {tool.startingPrice ?? tool.pricing}
                      </p>
                      <a
                        href={`/go/${tool.slug}`}
                        target="_blank"
                        rel={
                          tool.affiliateProgram
                            ? 'noopener noreferrer nofollow sponsored'
                            : 'noopener noreferrer nofollow'
                        }
                        className="mt-1 inline-flex items-center gap-1 text-2xs font-bold text-accent-400 hover:text-accent-300"
                      >
                        Visit <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-accent-500/30 bg-gradient-to-r from-accent-500/10 via-surface-1 to-surface-2 p-6">
            <div>
              <p className="text-2xs font-bold uppercase tracking-wider text-zinc-500">
                Estimated monthly total
              </p>
              <p className="font-mono text-3xl font-black tabular-nums text-accent-300">
                {budget === 'free' ? '$0' : `$${total.toFixed(2)}`}
                <span className="text-sm text-zinc-500"> /mo</span>
              </p>
              <p className="mt-1 max-w-md text-2xs leading-relaxed text-zinc-500">
                Summed from listed entry prices in the catalog{budget !== 'free' ? ' — real spend depends on the plans and credits you actually use' : ' — free tiers may limit commercial use, check each tool'}.
              </p>
            </div>
            <Link
              href="/deals"
              className="inline-flex items-center gap-2 rounded-xl bg-accent-500 px-5 py-3 text-sm font-bold text-black hover:opacity-90"
            >
              Check free plans & deals
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <p className="mt-4 flex items-start gap-2 text-2xs leading-relaxed text-zinc-500">
            <FlaskConical className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-600" aria-hidden="true" />
            Editorial picks based on catalog data and workflow fit — not hands-on test results. Your
            stack is saved in this browser and the URL updates as you change it, so you can share
            the exact combination.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
