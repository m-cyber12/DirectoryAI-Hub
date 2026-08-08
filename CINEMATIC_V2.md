# Cinematic v2 — Interactive 3D Homepage

A full cinematic redesign of the homepage, implementing the plan in
`directoryai_hub_3d_redesign_plan.md`: a spatial, scroll-driven experience
built on Lenis + GSAP ScrollTrigger + React Three Fiber.

## What changed

### 3D Neural Hero (`src/components/CinematicScene.tsx` — rewritten)
- **Neural mesh sphere**: a fibonacci-lattice of 120 nodes connected to their
  nearest neighbours, rendered as glowing points + line segments, with a
  pulsing emissive core, a rotating wireframe shell and an energy halo.
- **Orbiting light rings** (cyan / amber / violet torus) and two Sparkles
  fields (drei).
- **Bloom post-processing** (`@react-three/postprocessing`) for the neon glow.
- **Mouse parallax** — the sphere tilts and the camera drifts with the pointer.
- **Deep zoom-through scroll** — as you scroll past the hero, the camera dives
  from z=9 through the lattice into the core while the FOV widens.
- **Guardrails**: disabled for `prefers-reduced-motion`, screens < 640px, and
  missing WebGL; `dpr` capped at 1.75; an error boundary keeps the page alive
  if the driver crashes.

### Scroll choreography (`src/components/HomeAnimations.tsx` — new)
One client component drives the whole page with GSAP + ScrollTrigger:
- Hero entrance timeline: badge → headline → sub → search → CTAs → chips with
  a blur-to-sharp "emerging from depth" treatment.
- `[data-reveal]` sections fade/slide in once when they enter the viewport,
  staggered with `data-reveal-delay` (milliseconds).
- `[data-count]` numbers count up on view (197 tools, 37 price checks…).
- `[data-speed]` decorative layers get scrub-linked parallax.
- Initial hidden states are only ever applied inside GSAP, so reduced-motion,
  no-JS and SSR all render the content fully visible.

### Smooth scroll (`src/components/SmoothScroll.tsx` — updated)
Lenis is now driven by GSAP's ticker and feeds `ScrollTrigger.update()`, the
documented integration pattern, so wheel smoothing and scroll-linked
animations stay perfectly in sync. Still auto-disabled for touch/reduced
motion.

### Cards (`src/components/ToolCard.tsx` — updated)
- **3D tilt**: perspective rotateX/rotateY follows the cursor; the card lifts
  with a spring-like ease and settles back on leave (disabled for reduced
  motion).
- **Cursor glare**: a radial light reflection tracks the mouse across the card
  (`mix-blend-mode: screen`).
- Neon hover: amber/violet border + glow shadow.
- The whole grid now sits in `.tilt-wrap` wrappers — the change applies
  automatically on `/tools`, `/category/...` and every grid that uses
  `ToolCard`.

### Design system (`src/app/globals.css` — extended)
- Aurora background layers with drifting radial glows, a masked grid overlay,
  and a fine SVG noise grain.
- `.text-gradient` headline gradient, `.glass-panel` glassmorphism, animated
  gradient borders (`.border-flow`), shine sweeps, floating chips, marquee
  ticker, scroll-cue mouse animation, pulsing CTA glow, gradient scrollbar,
  footer glow hairline. All light-mode aware.

### Header (`src/components/Header.tsx` — updated)
- Scroll progress bar (amber → fuchsia → cyan) under the header.
- Header glass deepens + casts a soft shadow once you scroll.
- Logo glow + gradient wordmark.

### Homepage (`src/app/page.tsx` — rebuilt)
Hero (3D + rotating job words) → tool-name marquee ticker → animated stat
counters → glowing category chips → "Search → Compare → Build" steps →
featured tools grid (tilt cards) → animated-border newsletter panel.

### SmartImage fallback (`src/components/SmartImage.tsx` — updated)
Broken cover images now degrade to a cinematic violet/amber gradient
placeholder instead of a flat grey box with an icon.

## New dependencies

```
gsap                        — timeline + ScrollTrigger choreography
@react-three/drei           — Float, Sparkles
@react-three/postprocessing — Bloom
```

## How to tweak

| Want to change…                       | Edit                        |
| ------------------------------------- | --------------------------- |
| Sphere colour / node count            | `CinematicScene.tsx`        |
| Dive depth / camera speed             | `CameraRig` in `CinematicScene.tsx` |
| Reveal offset / stagger               | `HomeAnimations.tsx`        |
| Hero copy / rotating words            | `app/page.tsx`, `RotatingWord.tsx` |
| Aurora / glass / gradient tokens      | `globals.css`               |
| Card tilt intensity                   | `handleMouseMove` in `ToolCard.tsx` |

## Performance notes

- The 3D canvas is `next/dynamic` + `ssr: false` (lazy, client-only).
- Mobile and reduced-motion users get the aurora + grid fallback — zero WebGL
  cost.
- `dpr={[1, 1.75]}`, `antialias: false`, low-poly geometry, `multisampling: 0`
  on the composer.
