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
/** The card rises from below the frame, lying back a little, and settles
 *  flat and centred over this share of the section on one ease-out curve:
 *  a glide, no bounce. */
const ARRIVE_P = 0.2;
const RISE = { y: 1.1, tiltX: -14 };
/** The section starts this far before the team film's section ends, so
 *  the card comes up through the film as the camera passes into it, with
 *  no dead scroll between the two (Rajat). Its frame is transparent and
 *  sits above the film's. */
const OVERLAP_VH = 180;
/** The pan runs over this window; the rest is the end hold. */
const PAN_FROM = 0.3;
const PAN_TO = 0.94;

/* The picture, in its own units. The window onto it is VIEW_W wide. */
const VIEW_W = 1000;
const VIEW_H = 560;
const PIC_W = 4000;
const TABLE = { x: 260, y: 200, w: 3080, h: 170, r: 60 };

/* The words sit in the card's own lower margin, thin italic, on the
   card's inner column edges (left or right), one per stretch of the table;
   each swap a quick eased cut, and the last one persists, so a fast scroll
   still lands on the closing line. */
const CAPTIONS: Array<{ at: number; text: string; side: 'left' | 'right'; red?: boolean }> = [
  { at: 0, text: 'Everyone you need, at one table.', side: 'left' },
  { at: 0.14, text: 'Web and UI/UX at this end.', side: 'left' },
  { at: 0.34, text: 'Brand, two seats down.', side: 'right' },
  { at: 0.52, text: '2D and 3D, mid-table.', side: 'left' },
  { at: 0.68, text: 'Motion, right here.', side: 'right' },
  { at: 0.84, text: 'Ads, at the far end.', side: 'right' },
  { at: 0.97, text: "Don't worry. The whole table's on it.", side: 'left', red: true },
];
/** The corner rank runs like a flipbook while the page scrolls and
 *  settles back to the card's own rank when it stops. */
const RANKS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '◆', '♠', '♥', '♣'];
const RANK_STEP_PX = 36;

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
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/* ── Hand-drawn, not iconed ──────────────────────────────────────────────
 * The reference is a pen sketch: nothing on it is a clean shape. So every
 * line here is a wobbly path from a seeded PRNG (the same on every render),
 * fills are rough blobs, the table is hand-ruled and a little bowed, and a
 * turbulence displacement over the sketch group roughens the ink further.
 * Type stays outside the filter and stays crisp. */
function rng(seed: number) {
  let n = seed * 9301 + 49297;
  return () => ((n = (n * 9301 + 49297) % 233280) / 233280);
}

/** A closed or open path through `pts`, each point nudged by up to `j`,
 *  with a mid-point kink on every segment so long lines never read ruled. */
function wobbly(pts: Array<[number, number]>, j: number, r: () => number, close = true) {
  const q = pts.map(([x, y]) => [x + (r() - 0.5) * j, y + (r() - 0.5) * j] as [number, number]);
  const n = close ? q.length : q.length - 1;
  let d = `M${q[0][0].toFixed(1)} ${q[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const A = q[i];
    const B = q[(i + 1) % q.length];
    const mx = (A[0] + B[0]) / 2 + (r() - 0.5) * j * 1.6;
    const my = (A[1] + B[1]) / 2 + (r() - 0.5) * j * 1.6;
    d += ` Q${mx.toFixed(1)} ${my.toFixed(1)} ${B[0].toFixed(1)} ${B[1].toFixed(1)}`;
  }
  return close ? d + ' Z' : d;
}

/** A rough blob: an ellipse traced in 10 jittered points. */
function blob(cx: number, cy: number, rx: number, ry: number, r: () => number, j = 8) {
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
  }
  return wobbly(pts, j, r);
}

/** A figure at a seat, seen from above: chair, shoulders, head toward the
 *  table. Each one sits a little differently. */
function Figure({ x, side, seed }: { x: number; side: 'top' | 'bottom'; seed: number }) {
  const r = rng(seed);
  const dir = side === 'top' ? -1 : 1;
  const edge = side === 'top' ? TABLE.y : TABLE.y + TABLE.h;
  const size = 0.85 + r() * 0.35;
  const lean = (r() - 0.5) * 22;
  const cy = edge + dir * (56 + r() * 16);
  const sw = 40 * size;
  const sh = 22 * size;
  const chairW = 62 * size;
  const chairH = 56 * size;
  const cx = x + lean;
  const chairY = cy + dir * 22;
  return (
    <g>
      <path
        d={wobbly(
          [
            [cx - chairW / 2, chairY - chairH / 2],
            [cx + chairW / 2, chairY - chairH / 2],
            [cx + chairW / 2, chairY + chairH / 2],
            [cx - chairW / 2, chairY + chairH / 2],
          ],
          7,
          r
        )}
        fill="none"
        stroke={INK}
        strokeWidth={3.5 + r() * 2}
        strokeLinejoin="round"
      />
      {/* Shoulders: two passes of rough fill, so the ink looks worked. */}
      <path d={blob(cx, cy, sw, sh, r, 10)} fill={INK} />
      <path d={blob(cx + (r() - 0.5) * 8, cy + (r() - 0.5) * 6, sw * 0.9, sh * 0.85, r, 9)} fill={INK} opacity={0.85} />
      {/* One arm on the table, sometimes. */}
      {r() > 0.45 && (
        <path
          d={wobbly([[cx + (r() - 0.5) * 30, cy], [cx + (r() - 0.5) * 40, edge - dir * (10 + r() * 18)]], 5, r, false)}
          fill="none"
          stroke={INK}
          strokeWidth={9 + r() * 5}
          strokeLinecap="round"
        />
      )}
      <path d={blob(cx + (r() - 0.5) * 10, cy - dir * (24 + r() * 6), 16 * size, 17 * size, r, 6)} fill={INK} />
    </g>
  );
}

/** The table: hand-ruled, ends rounded by hand, long edges a little bowed. */
function tablePath(r: () => number) {
  const { x, y, w, h } = TABLE;
  const cap = 70;
  const pts: Array<[number, number]> = [];
  // Top edge, bowed up in the middle by a few units.
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    pts.push([x + cap + (w - 2 * cap) * t, y - Math.sin(t * Math.PI) * 6]);
  }
  for (let i = 1; i < 6; i++) {
    const a = -Math.PI / 2 + (i / 6) * Math.PI;
    pts.push([x + w - cap + Math.cos(a) * cap, y + h / 2 + Math.sin(a) * (h / 2)]);
  }
  for (let i = 12; i >= 0; i--) {
    const t = i / 12;
    pts.push([x + cap + (w - 2 * cap) * t, y + h + Math.sin(t * Math.PI) * 5]);
  }
  for (let i = 1; i < 6; i++) {
    const a = Math.PI / 2 + (i / 6) * Math.PI;
    pts.push([x + cap + Math.cos(a) * cap, y + h / 2 + Math.sin(a) * (h / 2)]);
  }
  return wobbly(pts, 5, r);
}

function Picture() {
  const label = { fontFamily: 'var(--font-sans)', fontSize: 22, fontWeight: 600, letterSpacing: '0.24em', fill: INK } as const;
  const r = rng(7);
  const table = tablePath(r);
  const table2 = tablePath(rng(11));
  return (
    <svg viewBox={`0 0 ${PIC_W} ${VIEW_H}`} width="100%" height="100%" preserveAspectRatio="xMinYMid meet" style={{ display: 'block' }}>
      <defs>
        {/* Pen on paper: a fine displacement breaks every edge, and a
            touch of blur under it lets the ink bleed. */}
        <filter id="team-ink" x="-2%" y="-10%" width="104%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="3" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="7" xChannelSelector="R" yChannelSelector="G" result="rough" />
          <feGaussianBlur in="rough" stdDeviation="0.6" result="bleed" />
          <feComponentTransfer in="bleed">
            <feFuncA type="gamma" amplitude="1" exponent="0.55" />
          </feComponentTransfer>
        </filter>
      </defs>
      <g filter="url(#team-ink)">
        {/* The outline, drawn twice: a pen going round again. */}
        <path d={table} fill="none" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        <path d={table2} fill="none" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" opacity={0.7} />
        {PAPERS.map(([x, y, a], i) => {
          const pr = rng(100 + i);
          const w = 50 + pr() * 12;
          const h = 36 + pr() * 10;
          return (
            <path
              key={i}
              d={wobbly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], 6, pr)}
              fill="none"
              stroke={INK}
              strokeWidth={3 + pr() * 1.5}
              transform={`rotate(${a} ${x + w / 2} ${y + h / 2})`}
            />
          );
        })}
        {SEATS.map((s, i) => (
          <Figure key={s.x} x={s.x} side={s.side} seed={20 + i * 7} />
        ))}
      </g>
      {SEATS.filter((s) => s.label).map((s) => (
        <text key={s.x} x={s.x} y={s.side === 'top' ? TABLE.y - 128 : TABLE.y + TABLE.h + 150} textAnchor="middle" style={label}>
          {s.label!.toUpperCase()}
        </text>
      ))}
    </svg>
  );
}

/** The red index, as on the reference: the rank and a diamond, mirrored
 *  in the opposite corner. The rank is 1, for the one collective. */
function Index({ flip, rankRef }: { flip?: boolean; rankRef: (el: HTMLSpanElement | null) => void }) {
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
      <span ref={rankRef} style={{ minWidth: '1.2em', textAlign: 'center' }}>1</span>
      <span style={{ fontSize: '0.8em' }}>◆</span>
    </div>
  );
}

export function TeamTable() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const picRef = useRef<HTMLDivElement>(null);
  const captionRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const rankRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const rank = useRef({ lastY: 0, acc: 0, i: 0, timer: 0 });
  const reduceMotion = useReducedMotion() ?? false;

  const setRank = (text: string) => rankRefs.current.forEach((el) => el && (el.textContent = text));

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
        const t = easeOutCubic(clamp01(p / ARRIVE_P));
        const u = 1 - t;
        cardRef.current.style.transform =
          `translate(-50%, -50%) translate3d(0, ${(RISE.y * u * window.innerHeight).toFixed(1)}px, 0) rotateX(${(RISE.tiltX * u).toFixed(2)}deg)`;
      }
      let panT = 0;
      if (windowRef.current && picRef.current) {
        const run = picRef.current.scrollWidth - windowRef.current.clientWidth;
        panT = easeInOutSine(smooth(PAN_FROM, PAN_TO, p));
        picRef.current.style.transform = `translate3d(${(-run * panT).toFixed(1)}px, 0, 0)`;
      }
      // The caption for this stretch of the table; the rest are hidden.
      let live = 0;
      CAPTIONS.forEach((c, i) => {
        if (panT >= c.at) live = i;
      });
      captionRefs.current.forEach((el, i) => {
        if (!el) return;
        const on = i === live;
        el.style.opacity = on ? '1' : '0';
        el.style.transform = on ? 'translateY(0)' : 'translateY(0.35em)';
      });
      // The rank flips with the scroll and settles when it stops.
      const r = rank.current;
      const dy = Math.abs(glide.y - r.lastY);
      r.lastY = glide.y;
      if (dy > 0.5) {
        r.acc += dy;
        if (r.acc >= RANK_STEP_PX) {
          r.acc = 0;
          r.i = (r.i + 1) % RANKS.length;
          setRank(RANKS[r.i]);
        }
        window.clearTimeout(r.timer);
        r.timer = window.setTimeout(() => {
          r.i = 0;
          setRank(RANKS[0]);
        }, 160);
      }
    });
  }, [reduceMotion]);


  const captions = CAPTIONS.map((c, i) => (
    <span
      key={c.text}
      ref={(el) => {
        captionRefs.current[i] = el;
      }}
      style={{
        position: 'absolute',
        bottom: '5.5%',
        ...(c.side === 'left' ? { left: '9%', textAlign: 'left' } : { right: '15%', textAlign: 'right' }),
        maxWidth: '82%',
        fontFamily: 'var(--font-sans)',
        fontStyle: 'italic',
        fontSize: 'clamp(16px, 2.1vw, 34px)',
        fontWeight: 300,
        letterSpacing: '-0.01em',
        lineHeight: 1.1,
        color: c.red ? RED : INK,
        opacity: i === 0 ? 1 : 0,
        transition: 'opacity 0.22s ease, transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
        pointerEvents: 'none',
      }}
    >
      {c.text}
    </span>
  ));

  const card = (
    <div
      ref={cardRef}
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: 'min(84vw, 1300px, 118vh)',
        aspectRatio: '1.45 / 1',
        background: CARD,
        border: `1px solid ${INK}`,
        boxShadow: '0 30px 70px rgba(0,0,0,0.10), 0 6px 20px rgba(0,0,0,0.05)',
        transform: reduceMotion
          ? 'translate(-50%, -50%)'
          : `translate(-50%, -50%) translate3d(0, ${RISE.y * 100}vh, 0) rotateX(${RISE.tiltX}deg)`,
        transformOrigin: '50% 50%',
        backfaceVisibility: 'hidden',
        willChange: 'transform',
        overflow: 'hidden',
      }}
    >
      <Index rankRef={(el) => (rankRefs.current[0] = el)} />
      <Index flip rankRef={(el) => (rankRefs.current[1] = el)} />
      {/* The window onto the picture: the picture is wider than the card
          and pans behind it. */}
      {captions}
      {/* The window onto the picture: the picture is wider than the card
          and pans behind it. */}
      <div ref={windowRef} style={{ position: 'absolute', left: '9%', right: '9%', top: '9%', bottom: '19%', overflow: 'hidden' }}>
        <div ref={picRef} style={{ height: '100%', width: `${(PIC_W / VIEW_W) * 100}%`, willChange: 'transform' }}>
          <Picture />
        </div>
      </div>
    </div>
  );

  if (reduceMotion) {
    return (
      <section style={{ position: 'relative', height: '100vh', background: BG, overflow: 'hidden' }}>
        {card}
      </section>
    );
  }

  return (
    <section data-chapter="team-table" style={{ position: 'relative', zIndex: 2, marginTop: `-${OVERLAP_VH}vh`, background: 'transparent' }}>
      <div ref={wrapRef} style={{ height: `${SECTION_VH}vh`, position: 'relative' }}>
        <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden', perspective: `${P}px`, perspectiveOrigin: '50% 50%' }}>
          {card}
        </div>
      </div>
    </section>
  );
}
