'use client';

import React, { useEffect, useState } from 'react';
import { LineChart } from 'lucide-react';

/**
 * Price history — critique §11-7. Reads recorded price points from
 * /api/v1/tools/:slug/price-history and draws an inline SVG sparkline.
 *
 * Honesty rules:
 *   - No points recorded yet → a short note saying tracking just started,
 *     never a fake chart.
 *   - Fetch fails or tracking is unconfigured → render nothing at all.
 */

interface PricePoint {
  starting_price: string | null;
  source_url: string | null;
  noticed_at: string;
}

interface HistoryResponse {
  slug: string;
  configured: boolean;
  points: PricePoint[];
  current?: {
    startingPrice: string | null;
    sourceUrl: string | null;
    checkedAt: string | null;
  };
}

function priceValue(s: string | null): number | null {
  if (!s) return null;
  const m = s.match(/[\d.]+/);
  return m ? parseFloat(m[0]) : null;
}

export function PriceHistorySection({
  slug,
  currentPrice,
  checkedAt,
}: {
  slug: string;
  currentPrice?: string;
  checkedAt?: string;
}) {
  const [state, setState] = useState<'loading' | 'hidden' | 'note' | 'chart'>('loading');
  const [points, setPoints] = useState<PricePoint[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/v1/tools/${encodeURIComponent(slug)}/price-history`)
      .then((r) => (r.ok ? (r.json() as Promise<HistoryResponse>) : Promise.reject(new Error('bad status'))))
      .then((data) => {
        if (cancelled) return;
        if (!data.configured || data.points.length === 0) {
          setState('note');
          return;
        }
        setPoints(data.points);
        setState(data.points.length >= 2 ? 'chart' : 'note');
      })
      .catch(() => {
        if (!cancelled) setState('hidden');
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (state === 'loading') {
    return (
      <section className="mt-6 rounded-2xl border border-white/10 bg-surface-1 p-5">
        <h2 className="flex items-center gap-2 text-sm font-bold text-zinc-200">
          <LineChart className="h-4 w-4 text-accent-400" aria-hidden="true" /> Price history
        </h2>
        <p className="mt-2 text-2xs text-zinc-500">Loading recorded price points…</p>
      </section>
    );
  }

  if (state === 'hidden') return null;

  if (state === 'note') {
    return (
      <section className="mt-6 rounded-2xl border border-white/10 bg-surface-1 p-5">
        <h2 className="flex items-center gap-2 text-sm font-bold text-zinc-200">
          <LineChart className="h-4 w-4 text-accent-400" aria-hidden="true" /> Price history
        </h2>
        <p className="mt-2 text-2xs leading-relaxed text-zinc-400">
          Tracking is new for this tool{checkedAt ? ` — the baseline is the ${checkedAt} source-checked price` : ''}.
          Every future price change we verify is recorded here, so you can see moves instead of
          discovering them at checkout.
        </p>
      </section>
    );
  }

  // Chart with ≥2 points.
  const values = points.map((p) => priceValue(p.starting_price)).filter((v): v is number => v !== null);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const W = 320;
  const H = 64;
  const coords = values.map((v, i) => {
    const x = values.length === 1 ? W / 2 : (i / (values.length - 1)) * (W - 8) + 4;
    const y = H - 8 - ((v - min) / range) * (H - 16);
    return [x, y] as const;
  });
  const path = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const last = points[points.length - 1];
  const first = points[0];
  const delta = (priceValue(last.starting_price) ?? 0) - (priceValue(first.starting_price) ?? 0);

  return (
    <section className="mt-6 rounded-2xl border border-white/10 bg-surface-1 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-bold text-zinc-200">
          <LineChart className="h-4 w-4 text-accent-400" aria-hidden="true" /> Price history
        </h2>
        {delta !== 0 && (
          <span
            className={`font-mono text-2xs font-bold tabular-nums ${delta > 0 ? 'text-rose-400' : 'text-emerald-400'}`}
          >
            {delta > 0 ? '▲' : '▼'} ${Math.abs(delta).toFixed(2)} since {first.noticed_at.slice(0, 10)}
          </span>
        )}
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Recorded entry price from ${first.starting_price ?? 'unknown'} to ${last.starting_price ?? 'unknown'}`}
        className="mt-3 w-full"
      >
        <path d={path} fill="none" stroke="#F7C948" strokeWidth="2" strokeLinecap="round" />
        {coords.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="2.5" fill="#F7C948" />
        ))}
      </svg>

      <ul className="mt-3 space-y-1.5">
        {points.map((p) => (
          <li key={p.noticed_at} className="flex items-center justify-between gap-3 text-2xs text-zinc-400">
            <span className="font-mono tabular-nums">{p.noticed_at.slice(0, 10)}</span>
            <span className="font-mono font-bold text-zinc-200">{p.starting_price ?? '—'}</span>
            {p.source_url && (
              <a
                href={p.source_url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="text-accent-400 underline hover:text-accent-300"
              >
                source
              </a>
            )}
          </li>
        ))}
      </ul>
      {currentPrice && (
        <p className="mt-2 text-2xs text-zinc-500">Current listed entry price: {currentPrice}.</p>
      )}
    </section>
  );
}
