'use client';

import Image, { type ImageProps } from 'next/image';
import { useState } from 'react';

/**
 * next/image wrapper with a graceful fallback.
 *
 * Audit fix 5.1 — the codebase used 15 raw <img> tags and zero next/image, so
 * there was no AVIF/WebP, no responsive srcset, no intrinsic width/height
 * (causing layout shift), and Unsplash covers were fetched at w=800 to fill a
 * 300px card. Favicon services also 404 regularly, which previously left
 * broken image icons on cards.
 */
type SmartImageProps = Omit<ImageProps, 'onError'> & {
  fallback?: React.ReactNode;
  /**
   * Cinematic v2 improvement (critique §5 images): when a cover fails to
   * load, show the brand initial on the aurora gradient instead of a generic
   * icon — the placeholder carries identity, not just a grey box.
   */
  label?: string;
};

export function SmartImage({ fallback, label, alt, className, ...props }: SmartImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <>
        {fallback ?? (
          <div
            className={`relative flex items-center justify-center overflow-hidden bg-surface-2 ${className ?? ''}`}
            aria-hidden="true"
          >
            {/* Cinematic gradient placeholder — broken covers degrade gracefully. */}
            <div className="absolute inset-0 bg-[radial-gradient(130%_130%_at_15%_0%,rgba(139,92,246,0.28),transparent_55%),radial-gradient(130%_130%_at_90%_110%,rgba(247,201,72,0.20),transparent_55%),radial-gradient(120%_120%_at_70%_20%,rgba(34,211,238,0.10),transparent_50%)]" />
            <div className="bg-noise absolute inset-0" />
            {label ? (
              <span className="relative select-none font-mono text-2xl font-black uppercase text-white/40">
                {label.charAt(0)}
              </span>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" className="relative h-1/3 w-1/3 max-h-8 max-w-8 text-zinc-500/80">
                <path
                  d="M4 16l4.5-6 3.5 4.5 2.5-3L20 16M4 5h16v14H4z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
        )}
      </>
    );
  }

  return (
    <Image
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
      {...props}
    />
  );
}
