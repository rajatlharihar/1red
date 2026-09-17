/* ─── One glide for every scroll-scrubbed scene ────────────────────────────
 * An eased copy of window.scrollY, shared. The hero and the cube section
 * overlap at the hand-off; if each eased its own clamped progress they would
 * drift apart on a fast scroll (the cubes would arrive before the zoom had
 * passed the "e"). Easing the one scroll position they are both derived
 * from keeps them in lockstep at any speed.
 * ────────────────────────────────────────────────────────────────────────── */

/** Same feel the hero always had: exponential catch-up, frame-rate independent. */
const RATE = 5;

export const glide = { y: 0, raw: 0 };

const listeners = new Set<() => void>();
let raf = 0;
let last = 0;

function tick(now: number) {
  const dt = Math.min((now - last) / 1000, 0.1);
  last = now;
  glide.raw = window.scrollY;
  glide.y += (glide.raw - glide.y) * (1 - Math.exp(-dt * RATE));
  if (Math.abs(glide.raw - glide.y) < 0.5) glide.y = glide.raw;
  listeners.forEach((l) => l());
  raf = glide.y !== glide.raw ? requestAnimationFrame(tick) : 0;
}

function kick() {
  glide.raw = window.scrollY;
  if (raf) return;
  last = performance.now();
  raf = requestAnimationFrame(tick);
}

/** Calls `listener` every frame the glide moves, and once immediately. */
export function subscribeGlide(listener: () => void) {
  if (listeners.size === 0) {
    // Start settled wherever the page loaded, not gliding in from the top.
    glide.y = glide.raw = window.scrollY;
    window.addEventListener('scroll', kick, { passive: true });
    window.addEventListener('resize', kick, { passive: true });
  }
  listeners.add(listener);
  listener();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      window.removeEventListener('scroll', kick);
      window.removeEventListener('resize', kick);
      cancelAnimationFrame(raf);
      raf = 0;
    }
  };
}
