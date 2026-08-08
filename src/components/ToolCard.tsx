'use client';

import React, { useRef, useState } from 'react';
import Link from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { ExternalLink, BadgeCheck, Plus, Check } from 'lucide-react';
import { hasVerifiedScore, computeOverall, type Tool } from '@/data/tools';
import { VerificationBadge } from '@/components/VerificationBadge';
import { SmartImage } from '@/components/SmartImage';
import { CoverArt } from '@/components/CoverArt';
import { useCompare } from '@/context/AppProviders';

interface ToolCardProps {
  tool: Tool;
  index?: number;
  /** LCP hint: pass true for the first few cards above the fold. */
  priority?: boolean;
}

function pricingClass(pricing: Tool['pricing']) {
  switch (pricing) {
    case 'Free':
      return 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300';
    case 'Freemium':
      return 'border-sky-500/30 bg-sky-500/15 text-sky-300';
    case 'Free Trial':
      return 'border-accent-500/30 bg-accent-500/15 text-accent-300';
    default:
      return 'border-zinc-500/30 bg-zinc-500/15 text-zinc-300';
  }
}

function scoreColor(v: number) {
  if (v >= 8) return 'text-emerald-400';
  if (v >= 6) return 'text-accent-400';
  if (v >= 4) return 'text-orange-400';
  return 'text-rose-400';
}

export function ToolCard({ tool, index = 0, priority = false }: ToolCardProps) {
  const t = useTranslations('common');
  const tc = useTranslations('categories');
  const pricingLabel = (p: string) =>
    p === 'Free Trial' ? t('freeTrial') : t(p.toLowerCase() as never);
  const tested = hasVerifiedScore(tool);
  const overall = tested && tool.scores ? computeOverall(tool.scores) : null;
  const { compareList, toggleCompare } = useCompare();
  const isCompared = compareList.includes(tool.slug);

  // Cinematic v2 — 3D tilt + cursor glare. Disabled for reduced motion.
  const wrapRef = useRef<HTMLDivElement>(null);
  const [tiltReady] = useState(
    () => typeof window !== 'undefined' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const wrap = wrapRef.current;
    if (!wrap || !tiltReady) return;
    const rect = wrap.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    wrap.style.transform = `perspective(1000px) rotateX(${(-py * 6).toFixed(2)}deg) rotateY(${(px * 8).toFixed(2)}deg) translateY(-6px)`;
    wrap.style.setProperty('--gx', `${((px + 0.5) * 100).toFixed(1)}%`);
    wrap.style.setProperty('--gy', `${((py + 0.5) * 100).toFixed(1)}%`);
  };

  const handleMouseLeave = () => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    wrap.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)';
  };

  return (
    <div
      ref={wrapRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="tilt-wrap group relative h-full rounded-2xl"
    >
      {/* Cursor-following light reflection */}
      <div className="tilt-glare z-20" aria-hidden="true" />

    <article
      className="card-enter relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-surface-1 transition-[border-color,box-shadow] duration-300 group-hover:border-accent-500/40 group-hover:shadow-[0_20px_60px_-16px_rgba(139,92,246,0.4),0_0_24px_-6px_rgba(247,201,72,0.25)]"
      data-delay={index % 6}
    >
      {/* Cover — v2.6: generated brand art instead of dead/misleading stock photos */}
      <Link
        href={`/tool/${tool.slug}`}
        className="relative block aspect-[16/9] overflow-hidden bg-surface-2"
        tabIndex={-1}
        aria-hidden="true"
      >
        <CoverArt
          slug={tool.slug}
          title={tool.name}
          logo={tool.logo}
          className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
        />

        <span
          className={`absolute bottom-3 right-3 inline-flex rounded-lg border px-2 py-0.5 text-2xs font-bold backdrop-blur-md ${pricingClass(
            tool.pricing
          )}`}
        >
          {pricingLabel(tool.pricing)}
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-start gap-3">
          <SmartImage
            src={tool.logo}
            alt=""
            width={40}
            height={40}
            loading="lazy"
            className="h-10 w-10 flex-shrink-0 rounded-xl bg-surface-2 object-cover ring-1 ring-white/10"
          />
          <div className="min-w-0 flex-1">
            <h3 className="flex items-center gap-1.5 truncate text-base font-bold text-white">
              <Link
                href={`/tool/${tool.slug}`}
                className="truncate transition-colors after:absolute after:inset-0 hover:text-accent-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
              >
                {tool.name}
              </Link>
              {tool.hasFounderBadge && (
                <BadgeCheck
                  className="h-3.5 w-3.5 flex-shrink-0 text-accent-400"
                  aria-label="Verified by the tool's founder"
                />
              )}
            </h3>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-2xs text-zinc-400">{tc.has(tool.category) ? tc(tool.category) : tool.category}</span>
              {tool.startingPrice && (
                <span className="font-mono text-2xs font-medium tabular-nums text-emerald-400">
                  {tool.startingPrice}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mb-2 flex items-center gap-2">
          {overall !== null ? (
            <>
              <span className={`font-mono text-lg font-black tabular-nums ${scoreColor(overall)}`}>
                {overall.toFixed(1)}
              </span>
              <span className="text-2xs text-zinc-500">/10 tested</span>
            </>
          ) : (
            <VerificationBadge level={tool.verificationLevel} compact />
          )}
        </div>

        <p className="mb-1 text-sm font-semibold text-zinc-100">{tool.tagline}</p>
        <p className="line-clamp-2 text-2xs leading-relaxed text-zinc-400">{tool.description}</p>

        <div className="mt-3 flex flex-wrap gap-1">
          {tool.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-md border border-white/10 bg-surface-2 px-2 py-0.5 text-2xs text-zinc-400"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* CTA row — relative z-10 keeps these clickable above the card overlay link. */}
        <div className="relative z-10 mt-4 flex items-center gap-1.5 pt-1">
          <a
            href={`/go/${tool.slug}`}
            target="_blank"
            rel={
              tool.affiliateProgram
                ? 'noopener noreferrer nofollow sponsored'
                : 'noopener noreferrer nofollow'
            }
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-accent-500 px-3 py-2 text-2xs font-bold text-black transition-opacity hover:opacity-90"
          >
            Visit site
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
            <span className="sr-only">{tool.name} (opens in a new tab)</span>
          </a>
          <Link
            href={`/tool/${tool.slug}`}
            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-surface-2 px-3 py-2 text-2xs font-semibold text-zinc-300 transition-colors hover:text-white"
          >
            Details
            <span className="sr-only"> about {tool.name}</span>
          </Link>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleCompare(tool.slug);
            }}
            aria-label={`Add ${tool.name} to comparison`}
            className={`inline-flex items-center justify-center rounded-xl border px-2.5 py-2 text-2xs font-bold transition-colors ${
              isCompared
                ? 'border-accent-500 bg-accent-500/20 text-accent-300'
                : 'border-white/10 bg-surface-2 text-zinc-400 hover:border-white/20 hover:text-white'
            }`}
          >
            {isCompared ? (
              <span className="flex items-center gap-1"><Check className="h-3 w-3" /> Compared</span>
            ) : (
              <span className="flex items-center gap-1"><Plus className="h-3 w-3" /> Compare</span>
            )}
          </button>
        </div>
      </div>
    </article>
    </div>
  );
}

export function ToolRow({ tool }: { tool: Tool }) {
  const tested = hasVerifiedScore(tool);
  const overall = tested && tool.scores ? computeOverall(tool.scores) : null;
  const { compareList, toggleCompare } = useCompare();
  const isCompared = compareList.includes(tool.slug);

  return (
    <article className="group relative flex items-center gap-4 border-b border-white/5 px-3 py-3 transition-colors hover:bg-surface-1">
      <SmartImage
        src={tool.logo}
        alt=""
        width={40}
        height={40}
        loading="lazy"
        className="h-10 w-10 flex-shrink-0 rounded-lg bg-surface-2 object-cover ring-1 ring-white/10"
      />

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-bold text-white">
          <Link
            href={`/tool/${tool.slug}`}
            className="after:absolute after:inset-0 hover:text-accent-300"
          >
            {tool.name}
          </Link>
        </h3>
        <p className="truncate text-2xs text-zinc-400">{tool.tagline}</p>
      </div>

      <span className="hidden w-40 shrink-0 truncate text-2xs text-zinc-500 md:block">
        {tool.category}
      </span>

      <span className="hidden w-24 shrink-0 font-mono text-2xs tabular-nums text-emerald-400 sm:block">
        {tool.startingPrice ?? tool.pricing}
      </span>

      <span className="w-20 shrink-0 text-right">
        {overall !== null ? (
          <span className={`font-mono text-sm font-bold tabular-nums ${scoreColor(overall)}`}>
            {overall.toFixed(1)}
          </span>
        ) : (
          <span className="text-2xs text-zinc-600">—</span>
        )}
      </span>

      <div className="relative z-10 shrink-0">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleCompare(tool.slug);
          }}
          className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-2xs font-bold transition-colors ${
            isCompared
              ? 'border-accent-500 bg-accent-500/20 text-accent-300'
              : 'border-white/10 bg-surface-2 text-zinc-400 hover:text-white'
          }`}
          aria-label={`Compare ${tool.name}`}
        >
          {isCompared ? '✓ Compared' : '+ Compare'}
        </button>
      </div>
    </article>
  );
}
