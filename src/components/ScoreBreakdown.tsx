import { computeOverall, type ToolScores, type ToolVerdict } from '@/data/tools';

/**
 * Multi-dimensional score display (audit fix 2.1, 4.3).
 *
 * The old UI showed five stars for a rating where every tool scored 4.1–4.9
 * and none below 4.0 — five stars cannot resolve that range, so every card
 * looked identical and the score carried no information.
 *
 * Horizontal bars over a 0–10 scale with monospace tabular numerals make
 * differences legible at a glance, in the visual language of a measurement
 * tool rather than an app store.
 */

const DIMENSIONS: { key: keyof ToolScores; label: string; hint: string }[] = [
  { key: 'outputQuality', label: 'Output quality', hint: 'How good is the result you can actually publish?' },
  { key: 'speed', label: 'Speed', hint: 'Wall-clock time from input to usable output.' },
  { key: 'easeOfUse', label: 'Ease of use', hint: 'Time to a first good result without reading docs.' },
  { key: 'valueForMoney', label: 'Value for money', hint: 'Output quality per dollar at the entry paid tier.' },
  { key: 'exportFreedom', label: 'Export freedom', hint: 'Watermarks, resolution caps and commercial rights.' },
];

function barColor(v: number) {
  if (v >= 8) return 'bg-emerald-400';
  if (v >= 6) return 'bg-accent-400';
  if (v >= 4) return 'bg-orange-400';
  return 'bg-rose-400';
}

export function ScoreBreakdown({
  scores,
  verdict,
}: {
  scores: ToolScores;
  verdict?: ToolVerdict;
}) {
  const overall = computeOverall(scores);

  return (
    <section className="mt-6 rounded-3xl border border-white/10 bg-surface-1 p-6 sm:p-8">
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-lg font-bold">How it scored</h2>
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-3xl font-black tabular-nums text-white">
            {overall.toFixed(1)}
          </span>
          <span className="text-sm text-zinc-500">/ 10 overall</span>
        </div>
      </div>

      <dl className="space-y-3">
        {DIMENSIONS.map(({ key, label, hint }) => {
          const value = scores[key];
          return (
            <div key={key} className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3">
              <dt className="text-sm text-zinc-300" title={hint}>
                {label}
              </dt>
              <dd
                className="h-2 overflow-hidden rounded-full bg-surface-3"
                role="meter"
                aria-valuenow={value}
                aria-valuemin={0}
                aria-valuemax={10}
                aria-label={`${label}: ${value} out of 10`}
              >
                <div
                  className={`h-full rounded-full ${barColor(value)}`}
                  style={{ width: `${value * 10}%` }}
                />
              </dd>
              <span className="font-mono text-sm font-bold tabular-nums text-zinc-200">
                {value.toFixed(1)}
              </span>
            </div>
          );
        })}
      </dl>

      <p className="mt-4 text-2xs text-zinc-500">
        Overall is a weighted average — output quality 35%, ease of use 20%, value 20%, speed 15%,
        export freedom 10%. It is computed, never hand-adjusted.
      </p>

      {verdict && (
        <div className="mt-5 grid gap-3 border-t border-white/5 pt-5 sm:grid-cols-2">
          <div>
            <h3 className="text-2xs font-bold uppercase tracking-wider text-emerald-400">
              Best for
            </h3>
            <p className="mt-1 text-sm text-zinc-300">{verdict.bestFor}</p>
          </div>
          <div>
            <h3 className="text-2xs font-bold uppercase tracking-wider text-rose-400">Skip if</h3>
            <p className="mt-1 text-sm text-zinc-300">{verdict.skipIf}</p>
          </div>
        </div>
      )}
    </section>
  );
}
