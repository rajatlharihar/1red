/* ─── Pins and red thread, shared ──────────────────────────────────────────
 * The evidence board's (EvidenceBoard.tsx, /the-box) pin heads and string,
 * also used to pin the red-flag panels on the home page. SVG strokes and
 * circles only: no filters (they halved the frame rate on moving layers). */

export type Pin = { x: number; y: number };

/** The board's thread colour. */
export const THREAD_RED = '#C8161D';

/** A soft sag between two pins, like string under its own weight. */
export function sag(a: Pin, b: Pin, k = 0.12) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2 + Math.hypot(b.x - a.x, b.y - a.y) * k;
  return `M${a.x} ${a.y} Q${mx} ${my} ${b.x} ${b.y}`;
}

export function PinHead({ p, r = 13 }: { p: Pin; r?: number }) {
  return (
    <g>
      <circle cx={p.x + 3} cy={p.y + 4} r={r} fill="rgba(0,0,0,0.35)" />
      <circle cx={p.x} cy={p.y} r={r} fill="#1a1a1a" />
      <circle cx={p.x - r * 0.35} cy={p.y - r * 0.35} r={r * 0.32} fill="rgba(255,255,255,0.55)" />
    </g>
  );
}
