import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';
import { glide, subscribeGlide } from '../scrollGlide';

/* ─── The table ────────────────────────────────────────────────────────────
 * The last chapter. Out of the team film one card arrives from depth and
 * settles flat: a landscape playing card in the site's line-art language,
 * after the 10-of-diamonds reference in .claude/refs (a long table seen
 * from above, the crew around it, a red index in the corners). Drawn here
 * as SVG, not the photo. Then the card's own picture takes the scroll: the
 * table pans left as if you were walking its length, the line is written
 * along the tabletop between the papers, a few seats carry what that seat
 * does, and it ends on the closing word.
 *
 * Line chosen from five (report has the others): "Don't worry. The whole
 * table's on it." It answers the home page's "whole box" in kind.
 * ────────────────────────────────────────────────────────────────────────── */

const INK = '#0A0A0A';
const RED = '#EA3323';
const CARD = '#F4F1EB';
const BG = '#FFFFFF';

const SECTION_VH = 400;
const P = 1200;
/** The card starts this deep (about half size) and settles flat by ARRIVE_P. */
const START_DEPTH = P;
const ARRIVE_P = 0.26;
/** The pan runs over this window; the rest is the end hold. */
const PAN_FROM = 0.3;
const PAN_TO = 0.94;

/* The picture, in its own units. The window onto it is VIEW_W wide. */
const VIEW_W = 1000;
const VIEW_H = 560;
const PIC_W = 4000;
const TABLE = { x: 260, y: 200, w: 3080, h: 170, r: 60 };

const LINE_A = "Don't worry.";
const LINE_B = "The whole table's on it.";
const LINE_END = 'Handled.';

/** Seats along the table; `label` is what that seat does (from the
 *  disciplines in ServicesGrid). Top seats face down, bottom seats face up. */
const SEATS: Array<{ x: number; side: 'top' | 'bottom'; label?: string }> = [
  { x: 420, side: 'top', label: 'Web & UI/UX' },
  { x: 700, side: 'bottom' },
  { x: 980, side: 'top' },
  { x: 1260, side: 'bottom', label: 'Brand' },
  { x: 1540, side: 'top' },
  { x: 1820, side: 'bottom', label: '2D & 3D' },
  { x: 2100, side: 'top', label: 'Motion' },
  { x: 2380, side: 'bottom' },
  { x: 2660, side: 'top', label: 'Ads' },
  { x: 2940, side: 'bottom' },
];

/** Papers on the table: a few sheets, each a little turned, in the gaps
 *  between the words. */
const PAPERS = [
  [1060, 250, -8],
  [1200, 300, 12],
  [1380, 240, 5],
  [2800, 300, -14],
  [2960, 250, 9],
  [3140, 290, -6],
];

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;

/** A figure at a seat, seen from above: chair, shoulders, head toward the
 *  table. Solid ink, as in the reference. */
function Figure({ x, side }: { x: number; side: 'top' | 'bottom' }) {
  const dir = side === 'top' ? -1 : 1;
  const edge = side === 'top' ? TABLE.y : TABLE.y + TABLE.h;
  const cy = edge + dir * 62;
  return (
    <g>
      <rect x={x - 34} y={cy + dir * 26 - 30} width={68} height={60} rx={8} fill="none" stroke={INK} strokeWidth={5} />
      <ellipse cx={x} cy={cy} rx={44} ry={24} fill={INK} />
      <circle cx={x} cy={cy - dir * 26} r={18} fill={INK} />
    </g>
  );
}

function Picture() {
  const label = { fontFamily: 'var(--font-sans)', fontSize: 22, fontWeight: 600, letterSpacing: '0.24em', fill: INK } as const;
  return (
    <svg viewBox={`0 0 ${PIC_W} ${VIEW_H}`} width="100%" height="100%" preserveAspectRatio="xMinYMid meet" style={{ display: 'block' }}>
      <rect x={TABLE.x} y={TABLE.y} width={TABLE.w} height={TABLE.h} rx={TABLE.r} fill="none" stroke={INK} strokeWidth={6} />
      {PAPERS.map(([x, y, a], i) => (
        <rect key={i} x={x} y={y} width={54} height={40} fill="none" stroke={INK} strokeWidth={4} transform={`rotate(${a} ${x + 27} ${y + 20})`} />
      ))}
      {SEATS.map((s) => (
        <Figure key={s.x} x={s.x} side={s.side} />
      ))}
      {SEATS.filter((s) => s.label).map((s) => (
        <text key={s.x} x={s.x} y={s.side === 'top' ? TABLE.y - 128 : TABLE.y + TABLE.h + 150} textAnchor="middle" style={label}>
          {s.label!.toUpperCase()}
        </text>
      ))}
      {/* The line, written along the tabletop. */}
      <text x={TABLE.x + 120} y={TABLE.y + TABLE.h * 0.68} style={{ fontFamily: 'var(--font-sans)', fontSize: 96, fontWeight: 800, letterSpacing: '-0.04em', fill: INK }}>
        {LINE_A}
      </text>
      <text x={1560} y={TABLE.y + TABLE.h * 0.68} style={{ fontFamily: 'var(--font-sans)', fontSize: 96, fontWeight: 800, letterSpacing: '-0.04em', fill: INK }}>
        {LINE_B}
      </text>
      <text x={TABLE.x + TABLE.w + 60} y={TABLE.y + TABLE.h * 0.68} style={{ fontFamily: 'var(--font-sans)', fontSize: 96, fontWeight: 800, letterSpacing: '-0.04em', fill: RED }}>
        {LINE_END}
      </text>
    </svg>
  );
}

/** The red index, as on the reference: the rank and a diamond, mirrored
 *  in the opposite corner. The rank is 1, for the one collective. */
function Index({ flip }: { flip?: boolean }) {
  return (
    <div
      style={{
        position: 'absolute',
        ...(flip ? { right: '3.2%', bottom: '5%' } : { left: '3.2%', top: '5%' }),
        transform: flip ? 'rotate(180deg)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.1em',
        color: RED,
        fontFamily: 'var(--font-sans)',
        fontWeight: 700,
        fontSize: 'clamp(22px, 3.2vw, 56px)',
        lineHeight: 1,
        letterSpacing: '-0.04em',
      }}
    >
      <span>1</span>
      <span style={{ fontSize: '0.8em' }}>◆</span>
    </div>
  );
}

export function TeamTable() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const picRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion() ?? false;

  useEffect(() => {
    if (reduceMotion) return;
    return subscribeGlide(() => {
      const el = wrapRef.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top + glide.raw;
      const scrollable = (SECTION_VH / 100 - 1) * window.innerHeight;
      if (scrollable <= 0) return;
      const p = clamp01((glide.y - top) / scrollable);
      if (cardRef.current) {
        const depth = START_DEPTH * (1 - easeInOutSine(clamp01(p / ARRIVE_P)));
        cardRef.current.style.transform = `translate(-50%, -50%) translate3d(0, 0, ${(-depth).toFixed(1)}px)`;
      }
      if (windowRef.current && picRef.current) {
        const run = picRef.current.scrollWidth - windowRef.current.clientWidth;
        const t = easeInOutSine(smooth(PAN_FROM, PAN_TO, p));
        picRef.current.style.transform = `translate3d(${(-run * t).toFixed(1)}px, 0, 0)`;
      }
    });
  }, [reduceMotion]);

  const card = (
    <div
      ref={cardRef}
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: 'min(84vw, 1240px, 140vh)',
        aspectRatio: '1.45 / 1',
        background: CARD,
        border: `1px solid ${INK}`,
        borderRadius: '3.2% / 4.6%',
        boxShadow: '0 30px 70px rgba(0,0,0,0.10), 0 6px 20px rgba(0,0,0,0.05)',
        transform: reduceMotion ? 'translate(-50%, -50%)' : `translate(-50%, -50%) translate3d(0, 0, ${-START_DEPTH}px)`,
        willChange: 'transform',
        overflow: 'hidden',
      }}
    >
      <Index />
      <Index flip />
      {/* The window onto the picture: the picture is wider than the card
          and pans behind it. */}
      <div ref={windowRef} style={{ position: 'absolute', left: '9%', right: '9%', top: '10%', bottom: '10%', overflow: 'hidden' }}>
        <div ref={picRef} style={{ height: '100%', width: `${(PIC_W / VIEW_W) * 100}%`, willChange: 'transform' }}>
          <Picture />
        </div>
      </div>
    </div>
  );

  if (reduceMotion) {
    return <section style={{ position: 'relative', height: '100vh', background: BG, overflow: 'hidden' }}>{card}</section>;
  }

  return (
    <section data-chapter="team-table" style={{ position: 'relative', background: BG }}>
      <div ref={wrapRef} style={{ height: `${SECTION_VH}vh`, position: 'relative' }}>
        <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden', perspective: `${P}px`, perspectiveOrigin: '50% 50%' }}>
          {card}
        </div>
      </div>
    </section>
  );
}
