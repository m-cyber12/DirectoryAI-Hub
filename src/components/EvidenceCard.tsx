'use client';

import React from 'react';
import { ExternalLink, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from '@/i18n/navigation';
import type { Tool } from '@/data/tools';

export function EvidenceCard({ tool }: { tool: Tool }) {
  if (tool.verificationLevel !== 'hands-on-tested') {
    return (
      <div className="rounded-2xl border border-amber-500/20 bg-amber-950/10 p-5">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-400" aria-hidden="true" />
          <div>
            <h4 className="text-sm font-bold text-amber-300">Not Independently Tested</h4>
            <p className="mt-1 text-2xs leading-relaxed text-amber-200/70">
              This listing is compiled from public information. We have not yet run it through our standard benchmark brief.
              {tool.pricingSourceUrl && (
                <> Pricing was last checked on {tool.pricingCheckedAt || 'a recent date'}.</>
              )}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/10 p-5">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" aria-hidden="true" />
        <div className="flex-1">
          <h4 className="text-sm font-bold text-emerald-300">Hands-On Tested</h4>
          <p className="mt-1 text-2xs leading-relaxed text-emerald-200/70">
            Tested on {tool.testedAt} using {tool.planTested || 'vendor plan'}. 
            Scored across 5 dimensions. Raw outputs and methodology below.
          </p>
          
          {tool.evidenceUrls && tool.evidenceUrls.length > 0 && (
            <div className="mt-3 space-y-1">
              {tool.evidenceUrls.map((url, i) => {
                const isVendorLink = url.includes('pricing') || url.includes('features') || url.includes('blog');
                return (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1.5 text-2xs font-semibold ${isVendorLink ? 'text-zinc-500 hover:text-zinc-400' : 'text-emerald-400 hover:text-emerald-300'} ${isVendorLink ? '' : 'underline'}`}
                  >
                    <ExternalLink className="h-3 w-3" />
                    {isVendorLink ? 'Vendor documentation (reference only)' : `Test evidence #${i + 1}`}
                  </a>
                );
              })}
            </div>
          )}

          <div className="mt-3 rounded-xl border border-white/10 bg-surface-2 p-3">
            <p className="text-2xs font-semibold text-zinc-400 mb-1">Test Protocol</p>
            <p className="text-2xs text-zinc-500">
              Run ID: <span className="font-mono text-zinc-400">{tool.slug.toUpperCase()}-{tool.testedAt?.replace(/-/g, '')}</span>
              <br />
              Plan: {tool.planTested || 'N/A'}
              <br />
              Dimensions: Output Quality, Speed, Value, Ease of Use, Export Freedom
            </p>
            <Link 
              href="/methodology" 
              className="mt-2 inline-flex items-center gap-1 text-2xs text-accent-400 hover:text-accent-300 underline"
            >
              <FileText className="h-3 w-3" /> Full methodology
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
