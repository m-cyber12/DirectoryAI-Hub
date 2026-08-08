import { BadgeDollarSign, ExternalLink } from 'lucide-react';
import type { Tool } from '@/data/tools';

/**
 * PricingPlansSection — renders the parsed official pricing plans for a
 * price-checked tool, plus the source link and the check date. Only shown when
 * the tool actually carries a pricing source (price-checked).
 */
export function PricingPlansSection({ tool }: { tool: Tool }) {
  if (tool.verificationLevel === 'listed-only') return null;

  const hasPlans = !!tool.pricingPlans && tool.pricingPlans.length > 0;
  const statusLabel =
    tool.priceCheckStatus === 'manual'
      ? 'Manual check'
      : tool.priceCheckStatus === 'complete'
        ? 'Fully checked'
        : tool.priceCheckStatus === 'partial'
          ? 'Partially checked'
          : 'Source captured';

  return (
    <section className="mt-6 rounded-2xl border border-white/10 bg-surface-1 p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-base font-bold text-zinc-200">
          <BadgeDollarSign className="h-4 w-4 text-accent-400" aria-hidden="true" />
          Pricing plans
          {statusLabel && (
            <span className="rounded-full border border-accent-500/30 bg-accent-500/10 px-2 py-0.5 text-2xs font-semibold text-accent-300">
              {statusLabel}
            </span>
          )}
        </h2>
        {tool.pricingSourceUrl && (
          <a
            href={tool.pricingSourceUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="inline-flex items-center gap-1 text-2xs font-semibold text-accent-400 underline underline-offset-2 hover:text-accent-300"
          >
            Official source <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        )}
      </div>

      {tool.priceCheckNote && (
        <p className="mt-2 text-2xs leading-relaxed text-zinc-400">{tool.priceCheckNote}</p>
      )}

      {hasPlans ? (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left">
            <thead>
              <tr className="border-b border-white/10 text-2xs uppercase tracking-wide text-zinc-500">
                <th className="py-2 pr-3 font-bold">Plan</th>
                <th className="py-2 pr-3 font-bold">Price</th>
                <th className="py-2 pr-3 font-bold">Billing</th>
                <th className="py-2 font-bold">What you get</th>
              </tr>
            </thead>
            <tbody>
              {tool.pricingPlans!.map((p) => (
                <tr key={p.name} className="border-b border-white/5 align-top">
                  <td className="py-2.5 pr-3 text-sm font-bold text-white">{p.name}</td>
                  <td className="py-2.5 pr-3 font-mono text-sm tabular-nums text-emerald-400">
                    {p.priceDisplay}
                  </td>
                  <td className="py-2.5 pr-3 text-xs text-zinc-400">{p.billing}</td>
                  <td className="py-2.5 text-xs leading-relaxed text-zinc-400">
                    {p.features?.length ? (
                      <ul className="list-disc pl-4">
                        {p.features.map((f) => (
                          <li key={f}>{f}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-zinc-600">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-3 text-2xs text-zinc-500">
          {tool.pricingSourceUrl ? (
            <>
              Full plan breakdown is on the{' '}
              <a
                href={tool.pricingSourceUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="text-accent-400 underline underline-offset-2"
              >
                official pricing page
              </a>
              .
            </>
          ) : (
            'Plan details are listed on the official pricing page.'
          )}
        </p>
      )}
    </section>
  );
}
