import React from 'react';
import { SmartImage } from '@/components/SmartImage';

/**
 * CoverArt — deterministic brand cover that replaces ALL stock imagery.
 *
 * Why: the old covers were random Unsplash photos. The critique flagged them
 * as trust-destroying ("a camera photo on the OpusClip page?"), and by 2026-08
 * many of those photo IDs were deleted upstream — CI logs filled with 404s
 * and cards fell back to placeholders anyway. Now every cover is generated
 * locally: a hashed aurora palette + the entry's initials + its real logo.
 * Zero network requests, zero 404s, zero misleading imagery.
 */

const PALETTES = [
  'radial-gradient(120% 120% at 12% 0%, rgba(124,58,237,.34), transparent 55%), radial-gradient(120% 130% at 92% 110%, rgba(247,201,72,.26), transparent 55%)',
  'radial-gradient(120% 120% at 12% 0%, rgba(34,211,238,.30), transparent 55%), radial-gradient(120% 130% at 92% 110%, rgba(244,63,94,.24), transparent 55%)',
  'radial-gradient(120% 120% at 12% 0%, rgba(52,211,153,.28), transparent 55%), radial-gradient(120% 130% at 92% 110%, rgba(247,201,72,.24), transparent 55%)',
  'radial-gradient(120% 120% at 12% 0%, rgba(232,121,249,.30), transparent 55%), radial-gradient(120% 130% at 92% 110%, rgba(34,211,238,.22), transparent 55%)',
  'radial-gradient(120% 120% at 12% 0%, rgba(239,68,68,.28), transparent 55%), radial-gradient(120% 130% at 92% 110%, rgba(251,191,36,.24), transparent 55%)',
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** First letters of the first two words, e.g. "OpusClip" → "OC" style. */
function initials(title: string): string {
  const words = title.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export function CoverArt({
  slug,
  title,
  logo,
  className = '',
  logoSize = 48,
}: {
  slug: string;
  title: string;
  logo?: string;
  className?: string;
  logoSize?: number;
}) {
  const palette = PALETTES[hash(slug) % PALETTES.length];
  return (
    // NOTE: no positioning class here — callers pass `absolute inset-0`
    // (a `relative` base would fight it and collapse the box to 0 height).
    <div className={`overflow-hidden bg-surface-2 ${className}`} aria-hidden="true">
      {/* hashed aurora */}
      <div className="absolute inset-0" style={{ background: palette }} />
      {/* faint grid, same language as the hero */}
      <div className="bg-grid absolute inset-0 opacity-60" />
      {/* giant ghost initials */}
      <span className="absolute -bottom-6 -right-2 select-none font-mono text-[7rem] font-black leading-none tracking-tighter text-white/[0.07]">
        {initials(title)}
      </span>
      {/* the real brand mark, centred */}
      {logo && (
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-black/40 p-3 shadow-2xl backdrop-blur-sm">
          <SmartImage
            src={logo}
            alt=""
            width={logoSize}
            height={logoSize}
            loading="lazy"
            label={title}
            className="rounded-xl bg-surface-2 object-cover"
          />
        </span>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-surface-1 via-surface-1/20 to-transparent" />
    </div>
  );
}
