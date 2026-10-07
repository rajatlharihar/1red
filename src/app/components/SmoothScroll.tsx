import { useEffect } from 'react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

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
      lerp: 0.06,
      wheelMultiplier: 0.9,
      virtualScroll: (d) => {
        const cap = 70;
        d.deltaY = Math.max(-cap, Math.min(cap, d.deltaY));
        return true;
      },
      smoothWheel: true,
      syncTouch: false,
      allowNestedScroll: true,
    });
    let raf = requestAnimationFrame(function frame(t) {
      lenis?.raf(t);
      raf = requestAnimationFrame(frame);
    });
    return () => {
      cancelAnimationFrame(raf);
      lenis?.destroy();
      lenis = null;
    };
  }, []);
  return null;
}
