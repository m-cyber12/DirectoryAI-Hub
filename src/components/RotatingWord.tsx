'use client';

import { useEffect, useState } from 'react';

/**
 * RotatingWord — cycles through job words in the hero subheadline.
 * All words are stacked in the same grid cell so the layout never jumps.
 *
 * BUGFIX (v2.4): the gradient used to live on the PARENT with
 * `background-clip: text` — the parent then painted its gradient through the
 * glyphs of EVERY stacked child, including the opacity-0 ones, so in most
 * browsers all five words rendered on top of each other. The gradient now
 * lives on each word cell, so `opacity` truly hides inactive words.
 */
const INTERVAL_MS = 2400;

export function RotatingWord({ words = [] }: { words?: string[] }) {
  const list = words.length > 0 ? words : ['clips', 'captions', 'dubbing', 'editing', 'thumbnails'];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setIndex((v) => (v + 1) % list.length), INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [list.length]);

  return (
    <span
      className="relative inline-grid align-baseline"
      style={{ gridTemplateAreas: '"word"', verticalAlign: 'bottom' }}
    >
      {list.map((word, i) => (
        <span
          key={word}
          aria-hidden={i !== index}
          className={`word-cell text-gradient ${i === index ? 'word-in' : 'word-out'}`}
          style={{ gridArea: 'word' }}
        >
          {word}
        </span>
      ))}
    </span>
  );
}
