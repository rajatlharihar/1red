import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { subscribeGlide, glide } from '../scrollGlide';

/* ─── Section changes as huge blocks reforming (Rajat, 2026-10-17) ─────────
 * "Instead of a card appearing, can it be more of huge blocks reforming,
 * pixel-type, so there are always transitions." The viewport is a coarse
 * grid of big square blocks on a fixed overlay. As the next section rises
 * over the last RANGE_VH of scroll before it reaches the top of the frame:
 *   1. its colour eats the outgoing screen block by block, each block
 *      popping in at its own random moment anywhere on the grid;
 *   2. then the blocks over the incoming section drop away, again in a
 *      random order, until it stands whole as it pins.
 * Purely a function of the shared scroll glide (one clock, reversible),
 * drawn on ONE canvas (no DOM blocks, no per-frame style work): each block
 * eases its scale 0 to 1 so it pops rather than snaps. The canvas is
 * hidden and idle outside a transition.
 * ────────────────────────────────────────────────────────────────────────── */

export interface BlockStep {
  /** The incoming section. */
  el: () => HTMLElement | null;
  /** Colour the blocks fill with. */
  color: string;
  /** Keep the incoming section out of sight until the frame is covered
   *  (for cards that slide over the last section): blocks it has reached
   *  stay filled until the clear wave. Default true. */
  hold?: boolean;
  /** Clip the incoming section out of sight until the frame is covered, so
   *  it never shows sliding up (a clip-path toggle: no repaint). */
  clip?: boolean;
  /** Scroll the transition spans, in vh (default RANGE_VH). */
  rangeVh?: number;
}

/** Scroll the transition spans, ending as the incoming section's top meets
 *  the frame's top. */
const RANGE_VH = 70;
/** Progress by which the blocks cover the whole frame. */
const FULL = 0.48;

const hash = (n: number) => {
  const x = Math.sin(n * 91.345 + 47.853) * 43758.5453;
  return x - Math.floor(x);
};

export function BlockTransitions({ steps, off }: { steps: BlockStep[]; off: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv || off) return;
    const ctx = cv.getContext('2d', { alpha: true })!;
    let cols = 0;
    let rows = 0;
    let size = 0;
    let dpr = 1;
    // Per block: target (0/1) and the drawn scale, eased toward it so a
    // block pops rather than snaps. One canvas, redrawn only while
    // something is moving: no DOM nodes, no style recalcs per frame.
    let target = new Float32Array(0);
    let shown = new Float32Array(0);
    let color = '';
    let visible = false;
    let raf = 0;
    let last = 0;
    const build = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      cols = Math.max(5, Math.min(10, Math.round((8 * (w / h)) / 1.78)));
      size = Math.ceil(w / cols);
      rows = Math.ceil(h / size);
      target = new Float32Array(cols * rows);
      shown = new Float32Array(cols * rows);
    };
    build();

    const draw = (now: number) => {
      raf = 0;
      const dt = Math.min(0.05, (now - (last || now)) / 1000);
      last = now;
      const k = 1 - Math.exp(-dt / 0.05); // ~160 ms to settle
      let moving = false;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = color;
      for (let i = 0; i < shown.length; i++) {
        let v = shown[i] + (target[i] - shown[i]) * k;
        if (Math.abs(target[i] - v) < 0.01) v = target[i];
        else moving = true;
        shown[i] = v;
        if (v <= 0) continue;
        const c = i % cols;
        const r = (i / cols) | 0;
        const s2 = (size + 1) * v;
        const x = c * size + (size - s2) / 2;
        const y = r * size + (size - s2) / 2;
        ctx.fillRect(x, y, s2, s2);
      }
      if (moving) raf = requestAnimationFrame(draw);
      else last = 0;
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(draw);
    };

    const frame = () => {
      const vh = window.innerHeight;
      let active: { p: number; top: number; color: string; hold: boolean } | null = null;
      for (const s of steps) {
        const el = s.el();
        if (!el) continue;
        // The incoming section's top on screen, at the glided scroll.
        const top = el.getBoundingClientRect().top + glide.raw - glide.y;
        const range = ((s.rangeVh ?? RANGE_VH) / 100) * vh;
        // Active from the moment the section enters the frame; progress runs
        // over the last RANGE_VH before it reaches the top.
        const p = Math.max(0, 1 - top / range);
        if (top > 0 && top < vh) active = { p, top, color: s.color, hold: s.hold !== false };
        if (s.clip) {
          const c = top > 0 && top < vh * 1.02 && p < FULL ? 'inset(0 0 100% 0)' : '';
          if (el.style.clipPath !== c) el.style.clipPath = c;
        }
      }
      if (!active) {
        if (visible) {
          visible = false;
          cv.style.visibility = 'hidden';
          target.fill(0);
          shown.fill(0);
        }
        return;
      }
      if (!visible) {
        visible = true;
        cv.style.visibility = 'visible';
      }
      color = active.color;
      const { p, top, hold } = active;
      let changed = false;
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c;
          // Scattered, not a wave (Rajat: "the last few pixels are
          // beautiful", have that throughout): each block pops in at its own
          // seeded random moment across the whole grid, all in by FULL, then
          // clears in a fresh random order over the incoming section.
          const tIn = 0.02 + hash(i) * (FULL - 0.04);
          const under = r * size >= top - 1;
          const tOut = FULL + 0.02 + hash(i + 999) * (0.96 - FULL - 0.02);
          // A card sliding over the last section never shows itself: any
          // block it has reached stays filled until its clear wave.
          const on = (p > tIn || (hold && under)) && !(under && p > tOut) ? 1 : 0;
          if (target[i] !== on) {
            target[i] = on;
            changed = true;
          }
        }
      if (changed) kick();
    };
    frame();
    const unsub = subscribeGlide(frame);
    const onResize = () => {
      build();
      frame();
      kick();
    };
    window.addEventListener('resize', onResize);
    return () => {
      unsub();
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, [steps, off]);

  return createPortal(
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', zIndex: 40, pointerEvents: 'none', visibility: 'hidden' }}
    />,
    document.body
  );
}
