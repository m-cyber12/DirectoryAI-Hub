'use client';

/**
 * HomeAnimations — one client mount that drives all GSAP scroll choreography
 * on the homepage:
 *
 *  - Hero entrance timeline (badge → headline → sub → search → CTAs → chips),
 *    with a blur-to-sharp "emerging from depth" treatment.
 *  - `[data-reveal]` elements fade/slide in when they enter the viewport
 *    (once, staggered via data-reveal-delay).
 *  - `[data-count]` numbers count up when visible.
 *  - `[data-speed]` decorative layers drift at different speeds (parallax).
 *
 * Everything is progressive enhancement: initial states are only applied
 * inside GSAP `fromTo` tweens, so with reduced motion, no-JS, or SSR the
 * content is simply visible. Nothing is hidden in CSS.
 */

import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function HomeAnimations() {
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const ctx = gsap.context(() => {
      /* ── Hero entrance timeline ─────────────────────────────────────── */
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.fromTo('[data-hero-badge]', { y: 26, opacity: 0, filter: 'blur(8px)' }, { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.7 }, 0.1)
        .fromTo(
          '[data-hero-title]',
          { y: 44, opacity: 0, filter: 'blur(14px)' },
          { y: 0, opacity: 1, filter: 'blur(0px)', duration: 1 },
          '-=0.35'
        )
        .fromTo(
          '[data-hero-sub]',
          { y: 30, opacity: 0, filter: 'blur(10px)' },
          { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.8 },
          '-=0.5'
        )
        .fromTo('[data-hero-search]', { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 }, '-=0.35')
        .fromTo('[data-hero-cta]', { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.09 }, '-=0.4')
        .fromTo(
          '[data-hero-chips]',
          { y: 34, opacity: 0, scale: 0.92 },
          { y: 0, opacity: 1, scale: 1, duration: 0.7, stagger: 0.09 },
          '-=0.35'
        );

      /* ── Scroll reveals ─────────────────────────────────────────────── */
      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
        // set() + to() (rather than fromTo) so the initial hidden state is
        // explicit and reduced-motion/no-JS users never see it applied.
        gsap.set(el, { y: 42, opacity: 0 });
        gsap.to(el, {
          y: 0,
          opacity: 1,
          duration: 0.95,
          ease: 'power3.out',
          // data-reveal-delay is in MILLISECONDS; GSAP delay is in seconds.
          delay: parseFloat(el.dataset.revealDelay ?? '0') / 1000,
          scrollTrigger: { trigger: el, start: 'top 86%', once: true },
        });
      });

      /* ── Animated counters ──────────────────────────────────────────── */
      gsap.utils.toArray<HTMLElement>('[data-count]').forEach((el) => {
        const target = parseFloat(el.dataset.count ?? '0');
        if (!Number.isFinite(target)) return;
        const state = { v: 0 };
        gsap.to(state, {
          v: target,
          duration: 1.7,
          ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 90%', once: true },
          onUpdate: () => {
            el.textContent = String(Math.round(state.v));
          },
        });
      });

      /* ── Parallax drift layers ──────────────────────────────────────── */
      gsap.utils.toArray<HTMLElement>('[data-speed]').forEach((el) => {
        const amount = parseFloat(el.dataset.speed ?? '-18');
        gsap.fromTo(
          el,
          { y: 0 },
          {
            y: amount,
            ease: 'none',
            scrollTrigger: { trigger: el.parentElement ?? el, start: 'top bottom', end: 'bottom top', scrub: 0.6 },
          }
        );
      });
    });

    // Lenis + ScrollTrigger integration is wired in SmoothScroll; refresh
    // once after fonts/layout settle.
    const refresh = window.setTimeout(() => ScrollTrigger.refresh(), 350);

    return () => {
      window.clearTimeout(refresh);
      ctx.revert();
    };
  }, []);

  return null;
}
