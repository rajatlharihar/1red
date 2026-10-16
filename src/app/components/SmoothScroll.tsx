import { useEffect } from 'react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { glideFromLenis } from './scrollGlide';
import { onTune, tune } from './scrollTune';

/* ─── Smooth scroll for the whole page (Rajat, 2026-10-07) ─────────────────
 * Native wheel scroll moved the page in rigid ticks, and a fast flick threw
 * the pinned scenes past in a frame or two. Lenis turns every wheel tick into
 * one eased glide with inertia, so a fast scroll still plays the scenes
 * through instead of jumping them. It drives the real window scroll, so
 * sticky sections, scroll-linked motion and the shared 3D glide keep reading
 * window.scrollY as before. Touch keeps the phone's own native momentum.
 * Off for reduced motion.
 * ────────────────────────────────────────────────────────────────────────── */

let lenis: Lenis | null = null;

/** Smooth-scrolls to `top` (px); falls back to native when Lenis is off. */
export function smoothScrollTo(top: number, immediate = false) {
  if (lenis) lenis.scrollTo(top, { immediate, duration: immediate ? 0 : 1.4 });
  else window.scrollTo({ top, behavior: immediate ? 'auto' : 'smooth' });
}

/** The live Lenis instance, or null when smooth scroll is off (reduced motion). */
export function getLenis() {
  return lenis;
}

/* Resting points for the hero's guided glide beyond the mark (the settled
   box). Each returns a scroll position in px, or null when not laid out. */
const glideStops = new Set<() => number | null>();
export function registerGlideStop(fn: () => number | null) {
  glideStops.add(fn);
  return () => {
    glideStops.delete(fn);
  };
}
export function extraGlideStops() {
  return [...glideStops].map((f) => f()).filter((v): v is number => v != null);
}

/* Is the page moving? Hover effects check this, so a cursor resting over the
   red flags or the deal rows doesn't flip and wipe them as they scroll past
   underneath it: that was the stutter there (2026-10-17 audit: up to 316 ms
   frames with the cursor parked over the board). */
let lastMove = 0;
export function pageScrolling() {
  return performance.now() - lastMove < 160;
}

/* ─── Soft landings (Rajat, 2026-10-17: "sticky on the main areas") ────────
 * Below the box, a few anchors (the red flags board, the deal, the closing
 * CTA) ease the page onto them, but only once the reader has stopped
 * (still for SOFT_IDLE_MS) within SOFT_RADIUS of one. Never during a
 * gesture, never locked: any new input takes over at once. */
const softStops = new Set<() => number | null>();
const SOFT_IDLE_MS = 120;
const SOFT_RADIUS = 0.3; // of the viewport height
export function registerSoftStop(fn: () => number | null) {
  softStops.add(fn);
  return () => {
    softStops.delete(fn);
  };
}

/* Wheel and trackpad events can be swallowed for a moment: the hero's
   guided glide uses this so a trackpad's momentum tail, still arriving after
   the glide lands, does not carry the page on past the mark. Each swallowed
   event extends the window a little, up to a cap, so the whole tail goes. */
let swallowUntil = 0;
let swallowCap = 0;
export function swallowWheel(ms: number, capMs = 1200) {
  const now = performance.now();
  swallowUntil = now + ms;
  swallowCap = now + capMs;
}

/** Pause page scrolling (e.g. while a lightbox is open). */
export function lockScroll(locked: boolean) {
  if (!lenis) return;
  if (locked) lenis.stop();
  else lenis.start();
}

export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    lenis = new Lenis({
      // 2026-10-07 round 2 (Rajat: smoother, ease in and out, fast scrolls
      // still fast but every cube beat visible): a softer catch-up, and each
      // wheel step capped so a hard flick runs the scenes quickly instead of
      // skipping them. The shared glide (scrollGlide.ts) eases on top of
      // this, which gives the start of a move its ease-in.
      // 2026-10-16 ("glide like a pushed disc"): each push adds to where the
      // page is heading and it coasts there with exponential friction.
      lerp: tune.lerp,
      wheelMultiplier: tune.wheelMultiplier,
      touchMultiplier: 1,
      virtualScroll: (d) => {
        const now = performance.now();
        if (now < swallowUntil) {
          swallowUntil = Math.min(swallowCap, now + 140);
          return false;
        }
        const cap = 70;
        d.deltaY = Math.max(-cap, Math.min(cap, d.deltaY));
        return true;
      },
      smoothWheel: true,
      syncTouch: false,
      allowNestedScroll: true,
    });
    const l = lenis;
    const offTune = onTune(() => {
      l.options.lerp = tune.lerp;
      l.options.wheelMultiplier = tune.wheelMultiplier;
    });
    // Every scroll-driven scene reads Lenis's value, in Lenis's frame.
    let settle = 0;
    let landing = false;
    const trySettle = () => {
      if (l.isLocked || Math.abs(l.velocity) > 0.3) return;
      const y = l.animatedScroll;
      const r = window.innerHeight * SOFT_RADIUS;
      let best: number | null = null;
      for (const f of softStops) {
        const v = f();
        if (v == null) continue;
        const d = Math.abs(v - y);
        if (d > 2 && d < r && (best == null || d < Math.abs(best - y))) best = v;
      }
      if (best == null) return;
      landing = true;
      l.scrollTo(best, { duration: 0.7, easing: (t) => 1 - Math.pow(1 - t, 3), onComplete: () => (landing = false) });
    };
    l.on('scroll', () => {
      glideFromLenis(l.animatedScroll);
      lastMove = performance.now();
      window.clearTimeout(settle);
      if (!landing) settle = window.setTimeout(trySettle, SOFT_IDLE_MS);
    });
    // Any new input ends a landing and is the reader's again.
    const takeOver = () => {
      landing = false;
      window.clearTimeout(settle);
    };
    window.addEventListener('wheel', takeOver, { passive: true });
    window.addEventListener('touchstart', takeOver, { passive: true });
    window.addEventListener('keydown', takeOver);

    let raf = requestAnimationFrame(function frame(t) {
      l.raf(t);
      raf = requestAnimationFrame(frame);
    });
    return () => {
      window.clearTimeout(settle);
      window.removeEventListener('wheel', takeOver);
      window.removeEventListener('touchstart', takeOver);
      window.removeEventListener('keydown', takeOver);
      offTune();
      cancelAnimationFrame(raf);
      lenis?.destroy();
      lenis = null;
    };
  }, []);
  return null;
}
