'use client';

/**
 * InfinityGauntlet — v2.3 hero centerpiece.
 *
 * Scroll choreography is now driven by a PLAIN passive scroll listener +
 * CSS classes (no GSAP ScrollTrigger): it works identically under Lenis
 * smooth scroll, native scroll, touch, dev/prod and any hydration order —
 * the previous ScrollTrigger setup could read as "scrolling does nothing"
 * when triggers went stale.
 *
 * The show, every visit:
 *  1. Closed vertical fist (fingers up, knuckles to the user) descends from
 *     above as it enters the viewport.
 *  2. Scrolling scrubs the hand open (fist ⇄ open crossfade).
 *  3. Past 45% open, 4 random tool "stones" pop out of the palm — each a
 *     link to its tool page; visited ones carry a ✓.
 *  4. Visit all + return → EXPLOSION (shake, flash, shockwave rings,
 *     particle burst, radial yellow→red blast) flipping the site theme.
 *  5. Click the gauntlet → amber twin explosion, fresh stones.
 *
 * Art: WebP with true alpha (no background box). Copy: English.
 * Reduced motion: everything shown immediately, instant theme flips.
 */

import React, { useEffect, useRef, useState } from 'react';
import Link from '@/i18n/navigation';
import { Check, Sparkles } from 'lucide-react';
import { ALL_TOOLS, type Tool } from '@/data/tools';
import { SmartImage } from '@/components/SmartImage';
import { setSnapTheme } from '@/lib/snapTheme';
import { StarkPoll } from '@/components/StarkPoll';

const KEYS = {
  picks: 'gauntlet-picks',
  clicked: 'gauntlet-clicked',
  snapped: 'gauntlet-snapped',
} as const;

const PICK_COUNT = 4;

/** Wide arc over the open palm — stones get room to breathe. */
const SLOTS = [
  { x: 4, y: 20 },
  { x: 35, y: 3 },
  { x: 65, y: 3 },
  { x: 96, y: 20 },
];

/** Infinity-stone + ember palette for the particle burst. */
const BURST_COLORS = ['#a855f7', '#3b82f6', '#ef4444', '#f97316', '#22c55e', '#eab308', '#f7c948'];

function read<T>(storage: Storage, key: string, fallback: T): T {
  try {
    const raw = storage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(storage: Storage, key: string, value: unknown) {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode */
  }
}

export function InfinityGauntlet() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const descendRef = useRef<HTMLButtonElement | null>(null);
  const fistRef = useRef<HTMLImageElement | null>(null);
  const openRef = useRef<HTMLImageElement | null>(null);
  const stonesWrapRef = useRef<HTMLDivElement | null>(null);
  const flashRef = useRef<HTMLDivElement | null>(null);
  const fxRef = useRef<HTMLDivElement | null>(null);

  const [picks, setPicks] = useState<Tool[]>([]);
  const [clicked, setClicked] = useState<string[]>([]);
  const [snapped, setSnapped] = useState(false);
  const [openNow, setOpenNow] = useState(false);

  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Session state + random stone draw ──────────────────────────────── */
  useEffect(() => {
    // v2.4: a refresh always begins a fresh YELLOW round — if a previous
    // round already snapped, clear it (the theme itself never persists).
    if (read<boolean>(sessionStorage, KEYS.snapped, false)) {
      try {
        sessionStorage.removeItem(KEYS.snapped);
        sessionStorage.removeItem(KEYS.clicked);
        sessionStorage.removeItem(KEYS.picks);
      } catch {
        /* noop */
      }
    }

    const pool = ALL_TOOLS.filter(
      (t) => t.isFeatured || t.verificationLevel !== 'listed-only'
    );
    let slugs = read<string[]>(sessionStorage, KEYS.picks, []);
    const valid = slugs.filter((s) => pool.some((t) => t.slug === s));
    if (valid.length !== PICK_COUNT) {
      const arr = [...pool];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      slugs = arr.slice(0, PICK_COUNT).map((t) => t.slug);
      write(sessionStorage, KEYS.picks, slugs);
    }
    setPicks(slugs.map((s) => pool.find((t) => t.slug === s)!).filter(Boolean));
    setClicked(read<string[]>(sessionStorage, KEYS.clicked, []));
    setSnapped(read<boolean>(sessionStorage, KEYS.snapped, false));
    if (reduced) setOpenNow(true);
  }, [reduced]);

  /* ── Scroll choreography: descent + open scrub + stone pop ──────────── */
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || picks.length === 0) return;

    if (reduced) {
      descendRef.current?.classList.add('g-descended');
      stonesWrapRef.current?.classList.add('stones-popped');
      return;
    }

    const descend = descendRef.current;
    const fist = fistRef.current;
    const open = openRef.current;
    const wrap = stonesWrapRef.current;

    // Prepare the hidden "above the sky" state before observing.
    descend?.classList.remove('g-descended');
    descend?.classList.add('g-pre');
    wrap?.classList.remove('stones-popped');

    let popped = false;
    const onScroll = () => {
      const r = section.getBoundingClientRect();
      const vh = window.innerHeight;
      if (r.top < vh * 0.85) descend?.classList.add('g-descended');
      const p = Math.min(1, Math.max(0, (vh * 0.9 - r.top) / (vh * 0.6)));
      // Fist → open hand, scrubbed by the scroll. v2.7: no more scale zoom —
      // a gentle vertical drift reads as a natural hand opening.
      if (fist) {
        fist.style.opacity = String(1 - p);
        fist.style.transform = `translateY(${(-16 * p).toFixed(1)}px)`;
      }
      if (open) {
        open.style.opacity = String(p);
        open.style.transform = `translateY(${(28 * (1 - p)).toFixed(1)}px)`;
      }
      if (!popped && p > 0.45) {
        popped = true;
        wrap?.classList.add('stones-popped');
      }
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [reduced, picks.length]);

  const markClicked = (slug: string) => {
    const next = clicked.includes(slug) ? clicked : [...clicked, slug];
    setClicked(next);
    write(sessionStorage, KEYS.clicked, next);
  };

  /* ── Draw a fresh set of random tool stones ─────────────────────────── */
  const drawFreshPicks = () => {
    const pool = ALL_TOOLS.filter(
      (t) => t.isFeatured || t.verificationLevel !== 'listed-only'
    );
    const arr = [...pool];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    const slugs = arr.slice(0, PICK_COUNT).map((t) => t.slug);
    write(sessionStorage, KEYS.picks, slugs);
    setPicks(slugs.map((s) => pool.find((t) => t.slug === s)!).filter(Boolean));
  };

  /* ── THE EXPLOSION ───────────────────────────────────────────────────── */
  const explode = (mode: 'snap' | 'unsnap', onCover: () => void, onDone: () => void) => {
    const fx = fxRef.current;
    const stage = stageRef.current;
    if (!fx || !stage || reduced) {
      onCover();
      onDone();
      return;
    }
    const r = stage.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;

    document.body.classList.remove('snap-shake');
    void document.body.offsetWidth;
    document.body.classList.add('snap-shake');
    setTimeout(() => document.body.classList.remove('snap-shake'), 600);

    flashRef.current?.animate(
      [{ opacity: 0 }, { opacity: 0.9, offset: 0.2 }, { opacity: 0 }],
      { duration: 600, easing: 'ease-out' }
    );

    for (let i = 0; i < 2; i++) {
      const ring = document.createElement('div');
      ring.style.cssText = `position:fixed;left:${cx}px;top:${cy}px;width:24px;height:24px;
        margin:-12px 0 0 -12px;border-radius:9999px;pointer-events:none;z-index:997;
        border:3px solid ${i === 0 ? 'rgba(255,255,255,.9)' : 'rgba(247,201,72,.8)'};
        box-shadow:0 0 40px ${i === 0 ? 'rgba(255,255,255,.6)' : 'rgba(247,201,72,.6)'};`;
      fx.appendChild(ring);
      ring
        .animate(
          [
            { transform: 'scale(0)', opacity: 1 },
            { transform: `scale(${38 + i * 14})`, opacity: 0 },
          ],
          { duration: 900 + i * 250, easing: 'cubic-bezier(.1,.7,.3,1)', delay: i * 120 }
        )
        .addEventListener('finish', () => ring.remove());
    }

    for (let i = 0; i < 26; i++) {
      const shard = document.createElement('div');
      const size = 6 + Math.random() * 9;
      const color = BURST_COLORS[i % BURST_COLORS.length];
      shard.style.cssText = `position:fixed;left:${cx}px;top:${cy}px;width:${size}px;height:${size}px;
        margin:${-size / 2}px 0 0 ${-size / 2}px;background:${color};pointer-events:none;z-index:997;
        border-radius:${Math.random() > 0.5 ? '9999px' : '2px'};
        box-shadow:0 0 12px ${color};`;
      fx.appendChild(shard);
      const angle = (Math.PI * 2 * i) / 26 + Math.random() * 0.5;
      const dist = 140 + Math.random() * 380;
      shard
        .animate(
          [
            { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
            {
              transform: `translate(${Math.cos(angle) * dist}px, ${
                Math.sin(angle) * dist + 60
              }px) rotate(${(Math.random() > 0.5 ? 1 : -1) * 540}deg)`,
              opacity: 0,
            },
          ],
          { duration: 800 + Math.random() * 500, easing: 'cubic-bezier(.1,.8,.3,1)' }
        )
        .addEventListener('finish', () => shard.remove());
    }

    const blast = document.createElement('div');
    const hot = mode === 'snap';
    blast.style.cssText = `position:fixed;inset:0;pointer-events:none;z-index:998;opacity:1;
      background:radial-gradient(circle at ${cx}px ${cy}px, #fff 0%, ${
      hot ? '#f7c948 14%, #ef4444 48%, #7f1d1d 100%' : '#fde68a 14%, #f59e0b 48%, #78350f 100%'
    });
      clip-path:circle(0% at ${cx}px ${cy}px);`;
    fx.appendChild(blast);
    const wave = blast.animate(
      [
        { clipPath: `circle(0% at ${cx}px ${cy}px)` },
        { clipPath: `circle(145% at ${cx}px ${cy}px)` },
      ],
      { duration: 950, easing: 'cubic-bezier(.6,.05,.3,1)', fill: 'forwards', delay: 220 }
    );
    let covered = false;
    const coverTimer = setTimeout(() => {
      covered = true;
      onCover();
    }, 700);
    wave.onfinish = () => {
      if (!covered) onCover();
      clearTimeout(coverTimer);
      const fade = blast.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 500,
        easing: 'ease-in',
        fill: 'forwards',
      });
      fade.onfinish = () => {
        blast.remove();
        onDone();
      };
    };
  };

  /* ── Snap trigger: all stones visited ────────────────────────────────────
     v2.7 cinema: the EXPLOSION runs first while the gauntlet is still on
     screen; only once the blast fully covers the viewport do we swap to the
     Iron Man + flip the theme — so he is revealed by the fading blast, not
     standing there a second before the boom (owner feedback). */
  const allVisited =
    picks.length === PICK_COUNT && picks.every((p) => clicked.includes(p.slug));

  useEffect(() => {
    if (!allVisited || snapped) return;
    const timer = setTimeout(() => {
      explode('snap', () => {
        setSnapTheme(true);
        setSnapped(true);
        write(sessionStorage, KEYS.snapped, true);
      }, () => {});
    }, 700);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allVisited, snapped, picks.length]);

  /* ── Un-snap: tap Iron Man → amber twin explosion, gauntlet + tools return ── */
  const onGauntletClick = () => {
    if (!snapped) return;
    explode('unsnap', () => {
      // swap while the screen is covered, so the gauntlet is revealed clean
      setSnapTheme(false);
      setSnapped(false);
      write(sessionStorage, KEYS.snapped, false);
      write(sessionStorage, KEYS.clicked, []);
      setClicked([]);
      // v2.12 fix — after the snap, tapping Iron Man should bring the
      // gauntlet back WITH a fresh set of tool stones. Previously we cleared
      // the picks entirely, so the hand came back empty until a full refresh.
      drawFreshPicks();
    }, () => {});
  };

  const visitedCount = picks.filter((p) => clicked.includes(p.slug)).length;

  return (
    <section
      ref={sectionRef}
      aria-label="Infinity Gauntlet — tool stones easter egg"
      className="relative mx-auto w-full max-w-4xl px-4 pb-14 pt-2"
    >
      <div
        ref={stageRef}
        className="dark-island relative mx-auto h-[440px] w-[300px] sm:h-[580px] sm:w-[400px]"
      >
        {snapped ? (
          /* v2.4 finale — after the snap, Iron Man holds the stones
             (Endgame style). Tapping him brings the gauntlet back. */
          <button
            type="button"
            onClick={onGauntletClick}
            aria-label="Iron Man holds the stones — tap to bring the gauntlet back"
            className="ironman-enter absolute inset-0 z-10 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-500"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- one-off finale art, scrubbed/animated directly */}
            <img
              src="/ironman-stones.webp"
              alt=""
              width={400}
              height={580}
              className="ironman-glow absolute inset-0 h-full w-full object-contain"
            />
          </button>
        ) : (
          <>
            {/* The gauntlet (clickable after the snap = un-snap) */}
            <button
              ref={descendRef}
              type="button"
              onClick={onGauntletClick}
              aria-label={
                snapped
                  ? 'Snapped! Click the gauntlet to bring the gold theme back'
                  : 'Infinity Gauntlet — scroll to open the hand'
              }
              className="absolute inset-0 z-10 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-500"
            >
          <span className="gauntlet-float absolute inset-0 block">
            {/* eslint-disable-next-line @next/next/no-img-element -- raw img required: the scroll handler scrubs opacity/scale on the exact node */}
            <img
              ref={fistRef}
              src="/gauntlet-fist.webp"
              alt=""
              width={400}
              height={580}
              fetchPriority="high"
              className="stone-flicker absolute inset-0 h-full w-full object-contain"
            />
            {/* eslint-disable-next-line @next/next/no-img-element -- same reason as above */}
            <img
              ref={openRef}
              src="/gauntlet-open.webp"
              alt=""
              width={400}
              height={580}
              loading="eager"
              className={`absolute inset-0 h-full w-full object-contain ${
                openNow ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </span>
        </button>

        {/* Released tool stones */}
        <div ref={stonesWrapRef} className="pointer-events-none absolute inset-0 z-20">
          {picks.map((tool, i) => {
            const visited = clicked.includes(tool.slug);
            const slot = SLOTS[i % SLOTS.length];
            return (
              <Link
                key={tool.slug}
                href={`/tool/${tool.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => markClicked(tool.slug)}
                className="g-stone group pointer-events-auto absolute block"
                style={{ left: `${slot.x}%`, top: `${slot.y}%`, opacity: openNow ? 1 : undefined }}
                aria-label={`Tool stone: ${tool.name}`}
              >
                <span
                  className="stone-bob relative flex flex-col items-center"
                  style={{ animationDelay: `${i * 0.45}s` }}
                >
                  <span
                    className={`relative block rounded-xl border p-1.5 shadow-[0_0_22px_rgba(139,92,246,0.45)] backdrop-blur-md transition-transform duration-200 group-hover:scale-110 ${
                      visited
                        ? 'border-emerald-400/60 bg-emerald-500/15'
                        : 'border-accent-500/50 bg-black/50'
                    }`}
                  >
                    <SmartImage
                      src={tool.logo}
                      alt=""
                      width={44}
                      height={44}
                      className="h-11 w-11 rounded-lg bg-surface-2 object-cover"
                    />
                    {visited && (
                      <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-black">
                        <Check className="h-3 w-3" aria-hidden="true" />
                      </span>
                    )}
                  </span>
                  <span className="mt-1.5 max-w-24 truncate rounded-full border border-white/10 bg-black/60 px-2 py-0.5 text-center text-2xs font-bold text-zinc-200 backdrop-blur-md">
                    {tool.name}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
          </>
        )}
      </div>

      {/* Teaser copy — “tap them, there is a surprise” (English site) */}
      <div className="mt-2 text-center" data-reveal>
        {!snapped ? (
          <>
            <p className="mx-auto max-w-md text-sm leading-relaxed text-zinc-300">
              <Sparkles className="mr-1 inline h-4 w-4 text-accent-400" aria-hidden="true" />
              Each stone is a tool that escaped the gauntlet —{' '}
              <span className="font-bold text-accent-300">tap them (they open in a new tab)!</span>{' '}
              Free all {PICK_COUNT} and the gauntlet snaps, with a colorful surprise…
            </p>
            <p className="mt-2 font-mono text-2xs font-bold tabular-nums text-zinc-500">
              {visitedCount} / {PICK_COUNT} stones freed
            </p>
          </>
        ) : (
          <>
            <p className="mx-auto max-w-md text-sm leading-relaxed text-zinc-300">
              💥 <span className="font-bold text-accent-300">SNAPPED!</span> “I am Iron Man.” —
              tap him to bring the gauntlet and the gold back.
            </p>
            <StarkPoll />
          </>
        )}
      </div>

      {/* Snap FX layers */}
      <div ref={flashRef} className="snap-flash" aria-hidden="true" />
      <div ref={fxRef} aria-hidden="true" />
    </section>
  );
}
