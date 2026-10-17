import type { CSSProperties, ReactNode } from 'react';
import { motion } from 'motion/react';

/* ─── Paper: the drawn-table language, shared by the inner pages ──────────
 * Rajat, 2026-10-17: /work, /case-studies and /about follow the home page's
 * red flags table. Cream paper, black ink strokes, red type; dividers are
 * the table's tile joints drawn in red; images sit in ink-bordered cards a
 * little turned, like the flag cards; the paper is tiled faintly like the
 * table top. Nothing here uses a blend mode or a filter (perf rules).
 * ────────────────────────────────────────────────────────────────────────── */

export const CREAM = '#EFE8DA';
export const CARD = '#F8F4EC';
export const INK = '#0A0A0A';
export const RED = '#EB3F43';
const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Card tilts, reused round the grid so neighbours never match. */
export const TILTS = [-1.4, 1.1, -0.7, 1.5, -1.1, 0.8, -1.6, 0.6, 1.3];

/** The table's tiles: double ink joints, faint, as a repeating background. */
const TILE_SVG = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="270" viewBox="0 0 320 270"><g fill="none" stroke="#0A0A0A" stroke-linecap="round" opacity="0.1"><path d="M0 1.2 Q80 0.4 160 1.4 T320 1" stroke-width="1.4"/><path d="M0 5.4 Q90 6.2 170 5 T320 5.6" stroke-width="1.1"/><path d="M1.2 0 Q0.4 70 1.4 135 T1 270" stroke-width="1.4"/><path d="M5.4 0 Q6.2 80 5 140 T5.6 270" stroke-width="1.1"/></g></svg>`
);
export const paperTiles: CSSProperties = {
  background: CREAM,
  backgroundImage: `url("data:image/svg+xml,${TILE_SVG}")`,
  backgroundSize: '320px 270px',
};

function inkPath(seed: number, y: number) {
  let r = seed;
  const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280;
  let d = `M0 ${y.toFixed(2)}`;
  for (let x = 25; x <= 1000; x += 25) d += ` L${x} ${(y + (rnd() - 0.5) * 1.1).toFixed(2)}`;
  return d;
}

/** The tile joint in red: two wobbly strokes with a dotted pen texture.
 *  `bleed` runs it edge to edge of the screen (its parent must not clip
 *  sideways); otherwise it spans its parent. Drawn left to right on entry. */
export function InkRule({ seed = 7, delay = 0, bleed = false, color = RED, style }: { seed?: number; delay?: number; bleed?: boolean; color?: string; style?: CSSProperties }) {
  const a = inkPath(seed, 3.2);
  const b = inkPath(seed + 7, 7.4);
  return (
    <div aria-hidden style={{ position: 'relative', height: 10, ...style }}>
      <motion.svg
        viewBox="0 0 1000 10"
        preserveAspectRatio="none"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.9, ease: EASE_OUT, delay }}
        style={{ position: 'absolute', top: 0, height: 10, transformOrigin: 'left', overflow: 'visible', pointerEvents: 'none', ...(bleed ? { left: 'calc(50% - 50vw)', width: '100vw' } : { left: 0, width: '100%' }) }}
      >
        <g fill="none" stroke={color} strokeLinecap="round">
          <path d={a} strokeWidth={1.8} vectorEffect="non-scaling-stroke" />
          <path d={b} strokeWidth={1.4} vectorEffect="non-scaling-stroke" />
          <path d={a} strokeWidth={2.6} strokeDasharray="1 5" opacity={0.6} vectorEffect="non-scaling-stroke" />
          <path d={b} strokeWidth={2.2} strokeDasharray="1 7" opacity={0.5} vectorEffect="non-scaling-stroke" />
        </g>
      </motion.svg>
    </div>
  );
}

/** An ink-bordered card, a little turned, lifting off the table on hover. */
export function InkCard({ children, tilt = 0, lift = false, pad = 10, style }: { children: ReactNode; tilt?: number; lift?: boolean; pad?: number; style?: CSSProperties }) {
  return (
    <motion.div
      animate={{ rotate: lift ? 0 : tilt, y: lift ? -8 : 0, scale: lift ? 1.025 : 1 }}
      transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
      style={{
        background: CARD,
        border: `1.6px solid ${INK}`,
        padding: pad,
        boxShadow: lift ? '10px 16px 0 rgba(10,10,10,0.14)' : '3px 4px 0 rgba(10,10,10,0.1)',
        transition: 'box-shadow 0.4s ease',
        ...style,
      }}
    >
      {children}
    </motion.div>
  );
}

/** A red rubber-stamp tag in the typewriter face. */
export function Stamp({ children, on = false, style }: { children: ReactNode; on?: boolean; style?: CSSProperties }) {
  return (
    <span
      style={{
        display: 'inline-block',
        fontFamily: 'var(--font-hand)',
        fontSize: 15,
        fontWeight: 700,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        color: on ? '#FFFFFF' : RED,
        background: on ? RED : 'transparent',
        border: `2px solid ${RED}`,
        borderRadius: 3,
        padding: '5px 10px 4px',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {children}
    </span>
  );
}

/** A red hand note in the typewriter face, slightly turned. */
export function HandNote({ children, size = 26, style }: { children: ReactNode; size?: number; style?: CSSProperties }) {
  return (
    <span style={{ display: 'inline-block', fontFamily: 'var(--font-hand)', fontSize: size, fontWeight: 700, color: RED, transform: 'rotate(-3deg)', transformOrigin: 'left', ...style }}>
      {children}
    </span>
  );
}

/** A drawn prop (ink + grey wash, transparent PNG), placed absolutely. */
export function Prop({ src, style }: { src: string; style: CSSProperties }) {
  return <img src={src} alt="" aria-hidden draggable={false} style={{ position: 'absolute', pointerEvents: 'none', userSelect: 'none', ...style }} />;
}
