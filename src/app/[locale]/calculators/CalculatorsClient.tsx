'use client';

import React, { useState } from 'react';
import { Calculator, Clock, ShieldCheck, DollarSign, ArrowRight, AlertCircle, CheckCircle2, Sliders, ExternalLink as ExternalLinkIcon } from 'lucide-react';
import { ALL_TOOLS } from '@/data/tools';
import { SmartImage } from '@/components/SmartImage';
import Link from '@/i18n/navigation';

// Refactor (2026-08-06): the old Copyright Checker labelled every entry
// "Monetization Safe" — a definitive claim the site could not back up.
// Copyright depends on the tool, the plan, the asset, the country, the
// music, and the input content, and vendor terms change. Each rule now
// records a status (Allowed / Restricted / Unclear), the date it was checked,
// and a source link to the exact terms. No "100% safe" wording.
interface CopyrightRule {
  slug: string;
  toolName: string;
  category: string;
  freeCommercial: string;
  paidCommercial: string;
  /** Allowed | Restricted | Unclear — never an absolute guarantee. */
  status: 'Allowed' | 'Restricted' | 'Unclear';
  sourceUrl: string;
  checkedAt: string;
  notes: string;
}

const COPYRIGHT_RULES: CopyrightRule[] = [
  {
    slug: 'midjourney',
    toolName: 'Midjourney',
    category: 'Video Generation',
    freeCommercial: 'No free tier',
    paidCommercial: 'Full commercial rights on paid plans ($10/mo+)',
    status: 'Allowed',
    sourceUrl: 'https://docs.midjourney.com/docs/terms-of-service',
    checkedAt: '2026-08-04',
    notes: 'Images made under a paid plan can be used commercially per Midjourney terms, including YouTube monetization.',
  },
  {
    slug: 'suno',
    toolName: 'Suno AI Music',
    category: 'Voice & Audio',
    freeCommercial: 'Non-commercial only',
    paidCommercial: 'Commercial use on paid plans',
    status: 'Allowed',
    sourceUrl: 'https://suno.com/terms',
    checkedAt: '2026-08-04',
    notes: 'Free-plan output is non-commercial; a paid subscription grants commercial rights. Licensing can vary by asset and jurisdiction.',
  },
  {
    slug: 'elevenlabs',
    toolName: 'ElevenLabs',
    category: 'Voice & Audio',
    freeCommercial: 'Attribution required',
    paidCommercial: 'Commercial use without attribution on paid plans',
    status: 'Allowed',
    sourceUrl: 'https://elevenlabs.io/terms',
    checkedAt: '2026-08-04',
    notes: 'Free tier requires credit in the video description; paid tiers remove attribution. Check current terms.',
  },
  {
    slug: 'runway',
    toolName: 'Runway Gen-3',
    category: 'Video Generation',
    freeCommercial: 'Non-commercial only',
    paidCommercial: 'Commercial use on Standard and above',
    status: 'Allowed',
    sourceUrl: 'https://runway.com/terms',
    checkedAt: '2026-08-04',
    notes: 'Outputs on paid tiers are generally usable commercially, but confirm per-version terms before broadcasting.',
  },
  {
    slug: 'opusclip',
    toolName: 'OpusClip',
    category: 'Video Repurposing',
    freeCommercial: 'Watermarked, non-commercial',
    paidCommercial: 'Commercial use on paid plans',
    status: 'Allowed',
    sourceUrl: 'https://www.opus.pro/terms',
    checkedAt: '2026-08-04',
    notes: 'Paid tiers export unwatermarked clips; check OpusClip terms for monetization specifics.',
  },
  {
    slug: 'capcut',
    toolName: 'CapCut',
    category: 'Video Repurposing',
    freeCommercial: 'Personal use only for stock/audio library',
    paidCommercial: 'Commercial license for included Pro assets',
    status: 'Unclear',
    sourceUrl: 'https://www.capcut.com/terms',
    checkedAt: '2026-08-04',
    notes: 'Licensing flags on individual stock/music tracks vary; verify each asset before monetizing.',
  },
];

export function CalculatorsClient() {
  const [activeTab, setActiveTab] = useState<'stack' | 'time' | 'copyright'>('stack');

  // --- Calculator 1: Stack Cost ---
  const [selectedTools, setSelectedTools] = useState<string[]>(['opusclip', 'elevenlabs', 'descript']);
  const toggleTool = (slug: string) => {
    setSelectedTools((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
  };
  const stackTools = ALL_TOOLS.filter((t) => selectedTools.includes(t.slug));
  const parsePrice = (priceStr: string | undefined): number => {
    if (!priceStr) return 0;
    const match = priceStr.replace(',', '.').match(/\$?([0-9]+(?:\.[0-9]+)?)/);
    return match ? parseFloat(match[1]) : 0;
  };
  const totalMonthly = stackTools.reduce((acc, t) => acc + parsePrice(t.startingPrice), 0);

  // --- Calculator 1b: honest ROI scenario ---
  // Refactor (2026-08-06): the old calculator claimed a hardcoded
  // "Equivalent Freelance Editor: $2,200/mo" and an exact "$25,980/year
  // savings" figure. That was fabricated — no editor rate was ever asked and
  // no real time was measured. It is replaced with a clearly-labelled
  // scenario estimate based on YOUR hourly value and an assumed range of
  // hours saved per month (low / base / high). It is an estimate, not a
  // measured result, and never a "savings" claim.
  const [hourlyRate, setHourlyRate] = useState(50);
  const [hoursSavedLow, setHoursSavedLow] = useState(15);
  const [hoursSavedBase, setHoursSavedBase] = useState(30);
  const [hoursSavedHigh, setHoursSavedHigh] = useState(50);
  const scenarioLow = Math.round(hoursSavedLow * 4 * hourlyRate);
  const scenarioBase = Math.round(hoursSavedBase * 4 * hourlyRate);
  const scenarioHigh = Math.round(hoursSavedHigh * 4 * hourlyRate);

  // --- Calculator 2: Time Saved ---
  const [rawHours, setRawHours] = useState(6);
  const [videosPerWeek, setVideosPerWeek] = useState(5);
  const hoursSavedPerWeek = Math.round(rawHours * 0.75 + videosPerWeek * 1.5);
  const monthlyDollarsSaved = Math.round(hoursSavedPerWeek * 4 * hourlyRate);

  // --- Calculator 3: Copyright Search ---
  const [searchQuery, setSearchQuery] = useState('');
  const filteredCopyright = COPYRIGHT_RULES.filter(
    (c) =>
      c.toolName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      {/* Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2 border-b border-white/10 pb-6">
        {[
          { id: 'stack', label: 'AI Stack Cost Calculator', icon: DollarSign },
          { id: 'time', label: 'Video Time Saved Calculator', icon: Clock },
          { id: 'copyright', label: 'Commercial Copyright Checker', icon: ShieldCheck },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-xs font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-accent-500 text-black shadow-lg'
                : 'bg-surface-1 border border-white/10 text-zinc-400 hover:text-white'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab 1: Stack Cost Calculator */}
      {activeTab === 'stack' && (
        <div className="mt-8 grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7 space-y-4">
            <h2 className="text-lg font-extrabold text-white">Select Tools for Your Stack</h2>
            <p className="text-xs text-zinc-400">
              Click any tool below to include or remove it from your monthly creator budget calculation.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[480px] overflow-y-auto pr-2">
              {ALL_TOOLS.slice(0, 24).map((tool) => {
                const isSelected = selectedTools.includes(tool.slug);
                return (
                  <button
                    key={tool.slug}
                    onClick={() => toggleTool(tool.slug)}
                    className={`flex items-center gap-3 rounded-2xl p-3 text-left border transition-all ${
                      isSelected
                        ? 'border-accent-500 bg-accent-500/15 text-white'
                        : 'border-white/10 bg-surface-1 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <SmartImage
                      src={tool.logo}
                      alt=""
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded-lg object-cover bg-surface-2 border border-white/10"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold truncate">{tool.name}</div>
                      <div className="text-2xs text-emerald-400 font-mono">
                        {tool.startingPrice || 'Free'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-3xl border border-accent-500/30 bg-gradient-to-br from-accent-500/10 via-surface-1 to-surface-2 p-6 sm:p-8 space-y-6 sticky top-24">
              <div>
                <span className="text-2xs font-bold uppercase tracking-wider text-accent-300">
                  Monthly Budget Breakdown
                </span>
                <h3 className="mt-1 text-3xl font-black text-white">${totalMonthly.toFixed(2)} / mo</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Total of listed entry prices for {stackTools.length} selected tools. Where a price is
                  source-checked it links to the official page; otherwise it is the vendor&apos;s listed entry price.
                </p>
              </div>

              <div className="space-y-4 pt-4 border-t border-white/10 text-xs">
                <div className="flex justify-between text-zinc-300">
                  <span>Your AI stack cost:</span>
                  <span className="font-bold text-white">${totalMonthly.toFixed(2)} / mo</span>
                </div>

                {/* Honest ROI scenario (refactor) */}
                <div className="rounded-2xl bg-black/50 border border-white/10 p-4 space-y-3">
                  <div className="flex items-center gap-1.5 text-2xs font-bold uppercase tracking-wider text-accent-300">
                    <Sliders className="h-3 w-3" aria-hidden="true" /> Time-value scenario
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-2">
                      <label htmlFor="roi-hourly" className="text-zinc-300">Your time value</label>
                      <span className="text-emerald-400 font-mono">${hourlyRate}/hr</span>
                    </div>
                    <input
                      id="roi-hourly"
                      type="range"
                      min="20"
                      max="200"
                      step="10"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(Number(e.target.value))}
                      className="w-full accent-accent-500 cursor-pointer"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'low' as const, label: 'Low hrs', v: hoursSavedLow, set: setHoursSavedLow },
                      { key: 'base' as const, label: 'Base hrs', v: hoursSavedBase, set: setHoursSavedBase },
                      { key: 'high' as const, label: 'High hrs', v: hoursSavedHigh, set: setHoursSavedHigh },
                    ].map((s) => (
                      <div key={s.key}>
                        <div className="flex justify-between text-2xs font-bold mb-1">
                          <label htmlFor={`roi-hrs-${s.key}`} className="text-zinc-400">{s.label}</label>
                          <span className="text-zinc-300 font-mono">{s.v}</span>
                        </div>
                        <input
                          id={`roi-hrs-${s.key}`}
                          type="range"
                          min="0"
                          max="120"
                          step="5"
                          value={s.v}
                          onChange={(e) => s.set(Number(e.target.value))}
                          className="w-full accent-accent-500 cursor-pointer"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {[
                      { label: 'Low', v: scenarioLow },
                      { label: 'Base', v: scenarioBase },
                      { label: 'High', v: scenarioHigh },
                    ].map((s) => (
                      <div key={s.label} className="rounded-lg bg-white/5 p-2">
                        <div className="text-2xs text-zinc-500">{s.label}</div>
                        <div className="font-mono text-sm font-black text-emerald-400">${s.v.toLocaleString()}/mo</div>
                      </div>
                    ))}
                  </div>
                  <p className="text-2xs leading-relaxed text-zinc-500">
                    Scenario estimate of the time value AI tools could free up at your entered hourly rate.
                    This is an assumption, not a measured result — no real workflow time was benchmarked.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href={`/compare?tools=${selectedTools.slice(0, 3).join(',')}`}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent-500 py-3 text-xs font-bold text-black hover:bg-accent-400 transition-colors"
                >
                  <span>Compare Selected Tools ({Math.min(selectedTools.length, 3)}) &rarr;</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Time Saved Calculator */}
      {activeTab === 'time' && (
        <div className="mt-8 grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7 rounded-3xl border border-white/10 bg-surface-1 p-6 sm:p-8 space-y-6">
            <h2 className="text-lg font-extrabold text-white">Input Your Weekly Video Output</h2>

            <div className="space-y-5">
              <div>
                <div className="flex justify-between text-xs font-bold mb-2">
                  <label htmlFor="raw-hours" className="text-zinc-300">Raw footage recorded per week:</label>
                  <span className="text-accent-400 font-mono">{rawHours} hours</span>
                </div>
                <input
                  id="raw-hours"
                  type="range"
                  min="1"
                  max="20"
                  value={rawHours}
                  onChange={(e) => setRawHours(Number(e.target.value))}
                  className="w-full accent-accent-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-2">
                  <label htmlFor="videos-week" className="text-zinc-300">Shorts / Videos published per week:</label>
                  <span className="text-accent-400 font-mono">{videosPerWeek} videos</span>
                </div>
                <input
                  id="videos-week"
                  type="range"
                  min="1"
                  max="14"
                  value={videosPerWeek}
                  onChange={(e) => setVideosPerWeek(Number(e.target.value))}
                  className="w-full accent-accent-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-2">
                  <label htmlFor="hourly-rate" className="text-zinc-300">Your time value ($ per hour):</label>
                  <span className="text-emerald-400 font-mono">${hourlyRate} / hr</span>
                </div>
                <input
                  id="hourly-rate"
                  type="range"
                  min="20"
                  max="200"
                  step="10"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(Number(e.target.value))}
                  className="w-full accent-accent-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-3xl border border-accent-500/30 bg-gradient-to-br from-accent-500/10 via-surface-1 to-surface-2 p-6 sm:p-8 space-y-6">
              <div>
                <span className="text-2xs font-bold uppercase tracking-wider text-accent-300">
                  Estimated time saved (scenario)
                </span>
                <h3 className="mt-1 text-3xl font-black text-white">{hoursSavedPerWeek} Hours / week</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Rough estimate based on the minutes you enter — not a measured workflow result.
                </p>
              </div>

              <div className="rounded-2xl bg-black/60 border border-white/10 p-5 text-center">
                <div className="text-2xs font-bold text-zinc-500 uppercase tracking-wider">
                  Monthly Time Dollar Value
                </div>
                <div className="mt-1 text-3xl font-black text-emerald-400">
                  +${monthlyDollarsSaved.toLocaleString()} / mo
                </div>
                <div className="text-2xs text-zinc-400 mt-1">
                  Estimated at your ${hourlyRate}/hr time value. A planning figure, not a measured saving.
                </div>
              </div>

              <Link
                href="/tools"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent-500 py-3 text-xs font-bold text-black hover:bg-accent-400 transition-colors"
              >
                <span>Browse Recommended Tools &rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Copyright Checker */}
      {activeTab === 'copyright' && (
        <div className="mt-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold text-white">Commercial Rights &amp; YouTube Monetization</h2>
              <p className="text-xs text-zinc-400">
                Check whether outputs from your AI video tools can be monetized on YouTube or used in client work.
              </p>
            </div>

            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tool name (e.g. Midjourney, Suno)..."
              className="w-full sm:w-72 rounded-xl border border-white/10 bg-surface-1 px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-accent-500 focus:outline-none"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCopyright.map((rule) => (
              <div
                key={rule.slug}
                className="rounded-3xl border border-white/10 bg-surface-1 p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-extrabold text-white">{rule.toolName}</span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-2xs font-bold ${
                        rule.status === 'Allowed'
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                          : rule.status === 'Restricted'
                            ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                            : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                      }`}
                    >
                      {rule.status === 'Allowed'
                        ? 'Commercial use allowed'
                        : rule.status === 'Restricted'
                          ? 'Restricted'
                          : 'Unclear — verify'}
                    </span>
                  </div>

                  <div className="space-y-2 mt-4 text-xs">
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-zinc-500">Free Plan:</span>
                      <span className="font-semibold text-zinc-300">{rule.freeCommercial}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-zinc-500">Paid Plan:</span>
                      <span className="font-semibold text-emerald-400">{rule.paidCommercial}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-zinc-500">Terms checked:</span>
                      <span className="font-mono tabular-nums text-zinc-400">{rule.checkedAt}</span>
                    </div>
                  </div>

                  <p className="mt-4 text-2xs text-zinc-400 leading-relaxed">{rule.notes}</p>
                </div>

                <div className="mt-5 pt-3 border-t border-white/10 space-y-1.5">
                  <a
                    href={rule.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="text-2xs font-bold text-accent-400 hover:underline flex items-center justify-between"
                  >
                    <span>Official terms &amp; source</span>
                    <ExternalLinkIcon className="h-3 w-3" />
                  </a>
                  <Link
                    href={`/tool/${rule.slug}`}
                    className="text-2xs font-bold text-accent-400 hover:underline flex items-center justify-between"
                  >
                    <span>Read tool page</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
          {/* Legal Disclaimer */}
          <div className="mt-8 rounded-2xl border border-amber-500/20 bg-amber-950/10 p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <p className="text-sm text-amber-200/70 font-semibold">Not legal advice</p>
                <p className="text-2xs text-amber-200/50 mt-1">
                  These summaries are based on publicly available terms of service as of the stated check date. 
                  Always verify current terms before monetizing content. We are not lawyers.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
