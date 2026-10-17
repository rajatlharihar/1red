/* ─── Scroll feel, in one place (Rajat, 2026-10-16) ─────────────────────────
 * The defaults are what ships. On localhost, ?tune opens ScrollTunePanel,
 * which overrides these per browser (localStorage) so Rajat can dial the feel
 * on his own trackpad. The panel and its overrides are dev-only: strip the
 * panel before a push and copy the values he settles on into DEFAULTS. */

export type GlideEasing = 'inOutCubic' | 'inOutSine' | 'outCubic' | 'outQuart';

export interface ScrollTune {
  /** Top-to-mark glide, seconds (shorter hops scale down from it). */
  glideS: number;
  glideEasing: GlideEasing;
  /** Lenis catch-up per frame for ordinary scrolling (lower = softer). */
  lerp: number;
  wheelMultiplier: number;
}

// 2026-10-17: each wheel/trackpad flick covers more (0.7 -> 1), catch-up a
// touch quicker so it follows the hand, glide shorter.
export const DEFAULTS: ScrollTune = { glideS: 4.2, glideEasing: 'inOutCubic', lerp: 0.08, wheelMultiplier: 1 };

const KEY = '1red-scroll-tune';
const DEV = import.meta.env.DEV;

function load(): ScrollTune {
  if (!DEV) return { ...DEFAULTS };
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return { ...DEFAULTS };
  }
}

export const tune: ScrollTune = load();
const listeners = new Set<() => void>();

export function setTune(patch: Partial<ScrollTune>) {
  Object.assign(tune, patch);
  try {
    localStorage.setItem(KEY, JSON.stringify(tune));
  } catch {
    /* private mode: live only */
  }
  listeners.forEach((l) => l());
}

export function resetTune() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  setTune({ ...DEFAULTS });
}

export function onTune(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export const EASINGS: Record<GlideEasing, (t: number) => number> = {
  inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  outQuart: (t) => 1 - Math.pow(1 - t, 4),
};
