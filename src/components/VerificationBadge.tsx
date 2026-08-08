import Link from '@/i18n/navigation';
import { FlaskConical, BadgeDollarSign, ListChecks } from 'lucide-react';
import type { VerificationLevel } from '@/data/tools';

/**
 * Audit fix 1.1 — replaces the blanket "Independently tested" claim that used
 * to appear on every tool regardless of whether anything had been tested.
 *
 * Each state says exactly what we did and nothing more. "Listed" is not a
 * failure state to hide; being the directory that admits what it has not
 * tested is more trustworthy than one that claims to have tested everything.
 */

const CONFIG: Record<
  VerificationLevel,
  { label: string; short: string; icon: typeof FlaskConical; className: string; tooltip: string }
> = {
  'hands-on-tested': {
    label: 'Hands-on tested',
    short: 'Tested',
    icon: FlaskConical,
    className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    tooltip: 'We ran this tool ourselves on a standard brief and published the output.',
  },
  'pricing-verified': {
    label: 'Price checked',
    short: 'Price checked',
    icon: BadgeDollarSign,
    className: 'border-accent-500/30 bg-accent-500/10 text-accent-300',
    tooltip:
      'We confirmed the price against the vendor’s own pricing page. We have not run this tool end-to-end.',
  },
  'listed-only': {
    label: 'Listed — not yet tested',
    short: 'Listed',
    icon: ListChecks,
    className: 'border-white/10 bg-white/5 text-zinc-400',
    tooltip:
      'Catalogued from public information. We have not tested this tool hands-on, so we do not publish a score for it.',
  },
};

export function VerificationBadge({
  level,
  testedAt,
  compact = false,
  className = '',
}: {
  level: VerificationLevel;
  testedAt?: string;
  compact?: boolean;
  className?: string;
}) {
  const cfg = CONFIG[level];
  const Icon = cfg.icon;

  return (
    <span
      title={cfg.tooltip}
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-2xs font-semibold ${cfg.className} ${className}`}
    >
      <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />
      <span>{compact ? cfg.short : cfg.label}</span>
      {level === 'hands-on-tested' && testedAt && !compact && (
        <span className="font-mono tabular-nums opacity-70">{testedAt}</span>
      )}
    </span>
  );
}

/**
 * The full-width honesty statement shown on tool pages that we have NOT
 * tested. Replaces the fabricated Evidence Card on those pages.
 */
export function NotTestedNotice({ toolName }: { toolName: string }) {
  return (
    <section className="mt-6 rounded-2xl border border-white/10 bg-surface-1 p-6">
      <h2 className="flex items-center gap-2 text-base font-bold text-zinc-200">
        <ListChecks className="h-4 w-4 text-zinc-400" aria-hidden="true" />
        We have not hands-on tested {toolName} yet
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-zinc-400">
        This entry is catalogued from the vendor’s public documentation and pricing page. Because we
        have not run {toolName} against our standard brief, we deliberately do not publish an
        editorial score for it — a number we could not defend would be worth less than no number at
        all.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-zinc-400">
        Want this tool tested sooner?{' '}
        <Link href="/contact" className="text-accent-400 underline hover:text-accent-300">
          Tell us
        </Link>{' '}
        — we prioritise the queue by reader demand. See{' '}
        <Link href="/about" className="text-accent-400 underline hover:text-accent-300">
          our testing methodology
        </Link>
        .
      </p>
    </section>
  );
}
