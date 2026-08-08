'use client';

/**
 * StarkPoll — the post-snap easter-egg question (owner request):
 * “Which Tony Stark is better?” — Iron Man vs Doctor Doom, with live counts.
 *
 * Counting: uses the real `stark_poll` table via /api/poll when Supabase is
 * configured (migration 0007). Without a database it gracefully falls back
 * to a per-browser localStorage tally and LABELS it as local — no fake
 * global numbers, ever. One vote per browser.
 */

import React, { useEffect, useState } from 'react';
import { Flame, VenetianMask } from 'lucide-react';

type OptionKey = 'ironman' | 'doom';

const VOTE_KEY = 'stark-vote';
const LOCAL_KEY = 'stark-poll-local';

function readLocal(): Record<OptionKey, number> {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (raw) return { ironman: 0, doom: 0, ...JSON.parse(raw) };
  } catch {
    /* noop */
  }
  return { ironman: 0, doom: 0 };
}

export function StarkPoll() {
  const [counts, setCounts] = useState<Record<OptionKey, number>>({ ironman: 0, doom: 0 });
  const [configured, setConfigured] = useState(true);
  const [voted, setVoted] = useState<OptionKey | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem(VOTE_KEY);
      if (v === 'ironman' || v === 'doom') setVoted(v);
    } catch {
      /* noop */
    }
    let cancelled = false;
    fetch('/api/poll')
      .then((r) => r.json())
      .then((d: { configured: boolean; counts: Record<OptionKey, number> }) => {
        if (cancelled) return;
        if (d.configured) {
          setConfigured(true);
          setCounts({ ironman: d.counts.ironman || 0, doom: d.counts.doom || 0 });
        } else {
          setConfigured(false);
          setCounts(readLocal());
        }
      })
      .catch(() => {
        if (!cancelled) {
          setConfigured(false);
          setCounts(readLocal());
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const vote = async (choice: OptionKey) => {
    if (voted || busy) return;
    setBusy(true);
    let next: Record<OptionKey, number> | null = null;
    try {
      const res = await fetch('/api/poll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ choice }),
      });
      if (res.ok) {
        const d = await res.json();
        if (d.configured) next = { ironman: d.counts.ironman || 0, doom: d.counts.doom || 0 };
      }
    } catch {
      /* fall through to local */
    }
    if (!next) {
      const local = readLocal();
      next = { ...local, [choice]: local[choice] + 1 };
      try {
        localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
      } catch {
        /* noop */
      }
      setConfigured(false);
    }
    try {
      localStorage.setItem(VOTE_KEY, choice);
    } catch {
      /* noop */
    }
    setCounts(next);
    setVoted(choice);
    setBusy(false);
  };

  const total = counts.ironman + counts.doom;
  const pct = (n: number) => (total === 0 ? 50 : Math.round((n / total) * 100));

  const OptionButton = ({ k, label, icon, tint }: { k: OptionKey; label: string; icon: React.ReactNode; tint: string }) => {
    const mine = voted === k;
    return (
      <button
        type="button"
        onClick={() => vote(k)}
        disabled={!!voted || busy}
        aria-pressed={mine}
        className={`group relative flex-1 overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300 ${
          mine
            ? 'border-accent-500/70 bg-accent-500/10'
            : voted
              ? 'border-white/10 bg-surface-1 opacity-80'
              : `border-white/10 bg-surface-1 hover:-translate-y-0.5 hover:border-accent-500/50 ${tint}`
        } disabled:cursor-default`}
      >
        {/* result bar */}
        {voted && (
          <span
            aria-hidden="true"
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-accent-500/25 to-transparent transition-all duration-700"
            style={{ width: `${pct(counts[k])}%` }}
          />
        )}
        <span className="relative flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-sm font-bold text-zinc-100">
            {icon}
            {label}
            {mine && <span className="rounded-full bg-accent-500 px-2 py-0.5 text-2xs font-black text-black">you</span>}
          </span>
          <span className="font-mono text-sm font-black tabular-nums text-accent-300">
            {voted ? `${pct(counts[k])}% · ` : ''}
            {counts[k]}
          </span>
        </span>
      </button>
    );
  };

  return (
    <div className="mx-auto mt-6 w-full max-w-md rounded-3xl border border-white/10 bg-surface-1/80 p-5 backdrop-blur-md">
      <p className="text-center text-sm font-bold text-zinc-100">
        One last question… <span className="text-accent-300">which Tony Stark is better?</span>
      </p>
      <div className="mt-4 flex gap-3">
        <OptionButton
          k="ironman"
          label="Iron Man"
          icon={<Flame className="h-4 w-4 text-rose-400" aria-hidden="true" />}
          tint="hover:shadow-[0_10px_30px_-12px_rgba(244,63,94,0.5)]"
        />
        <OptionButton
          k="doom"
          label="Doctor Doom"
          icon={<VenetianMask className="h-4 w-4 text-emerald-400" aria-hidden="true" />}
          tint="hover:shadow-[0_10px_30px_-12px_rgba(52,211,153,0.5)]"
        />
      </div>
      <p className="mt-3 text-center font-mono text-2xs tabular-nums text-zinc-500">
        {total} vote{total === 1 ? '' : 's'}
        {!configured && ' · local tally (cloud DB not configured)'}
        {!voted && ' · tap to vote'}
      </p>
    </div>
  );
}
