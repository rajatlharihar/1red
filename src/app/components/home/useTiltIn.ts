import { useEffect, type RefObject } from 'react';
import { glide, subscribeGlide } from '../scrollGlide';

/** The stacked cards arrive the way yuiii.vercel.app's menu cards do: tilted
 *  a few degrees about the bottom-left of the first screen, flattening as
 *  the card's top travels up to the frame's top (Rajat, 2026-10-06). */
export function useTiltIn(ref: RefObject<HTMLElement | null>, off = false, deg = 3.5) {
  useEffect(() => {
    const el = ref.current;
    if (!el || off) return;
    el.style.transformOrigin = '0 100vh';
    const unsub = subscribeGlide(() => {
      const vh = window.innerHeight;
      // The card's top on screen at the glided scroll, not the raw one.
      const top = el.getBoundingClientRect().top + glide.raw - glide.y;
      const p = Math.max(0, Math.min(1, 1 - top / (vh * 0.9)));
      const e = 1 - Math.pow(1 - p, 2);
      el.style.transform = p >= 1 ? 'none' : `rotate(${(deg * (1 - e)).toFixed(3)}deg) translateY(${(12 * (1 - e)).toFixed(1)}px)`;
    });
    // Never leave a card stuck mid-tilt when the effect turns off (e.g. a
    // layout switch to the phone version).
    return () => {
      unsub();
      el.style.transform = '';
    };
  }, [ref, off, deg]);
}
