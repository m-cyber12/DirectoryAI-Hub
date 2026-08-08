'use client';

import { useEffect } from 'react';
import { usePathname } from '@/i18n/navigation';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * SmoothScroll — Lenis + GSAP ScrollTrigger integration (cinematic v2).
 *
 * Lenis owns wheel smoothing on capable desktops; GSAP's ticker drives its
 * rAF loop so scroll-linked timelines (hero reveals, parallax, counters in
 * HomeAnimations) stay perfectly in sync.
 *
 * Deliberately disabled for reduced-motion and coarse-pointer devices:
 * native scrolling is more reliable for touch input and accessibility.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    /*
      Bug/performance fix — SmoothScroll is mounted in the root layout, so it
      ran for every page of the directory. That gave GSAP + Lenis a reason to
      be active (and a rAF loop to drive) on plain utility pages that have no
      scroll choreography — hurting performance on a data/utility site.

      Now the smooth-scroll layer only initializes on the homepage, where the
      cinematic scroll actually lives. All other pages keep native scrolling.
    */
    if (pathname !== '/') return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const touchDevice = window.matchMedia('(pointer: coarse)');
    if (reducedMotion.matches || touchDevice.matches) return;

    const lenis = new Lenis({
      duration: 1.05,
      lerp: 0.09,
      smoothWheel: true,
      syncTouch: false,
    });

    lenis.on('scroll', ScrollTrigger.update);

    const ticker = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(ticker);
    gsap.ticker.lagSmoothing(0);

    // Recalculate trigger positions once layout settles.
    const refresh = window.setTimeout(() => ScrollTrigger.refresh(), 300);

    return () => {
      window.clearTimeout(refresh);
      gsap.ticker.remove(ticker);
      lenis.destroy();
    };
  }, [pathname]);

  return <>{children}</>;
}
