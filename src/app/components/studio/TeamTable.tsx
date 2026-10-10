import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';
import { glide, subscribeGlide } from '../scrollGlide';
import { CardDeck, FELT, grainTile, driveDeck, type Flight, type Flipper, PLAYS, playFaceUrl, pickFlippers, turnCard, pileCardHeight, WILD_BACK_URL } from './CardDeck';

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
 *
 * 2026-10-04 (Rajat): the film bled round the rising card (its loop kept
 * cycling line art / red / black in the margins). Now the card comes up
 * lying on the table itself: a sheet of face-down red-backed playing cards
 * (everyone else, CardDeck) rising with it, edge to edge, so the film is
 * covered by one moving surface rather than showing round the card. Ours
 * is the one face up and it is not a playing card: an UNO-style wild card,
 * red field, white border, the tilted oval as the window onto the table.
 *
 * 2026-10-04 (final, Rajat): the story is "everyone else is a normal deck,
 * we are the UNO card: we experiment and write our own rules". The cards
 * that turn over on the table are plain playing cards (K, Q, J, 10, 7, A).
 * Our card's corner index shows no numbers: it rolls through UNO powers
 * (WILD, +2, SKIP, REVERSE, +4). Every line of copy is a subtitle under the
 * card, one at a time, on a single track.
 *
 * 2026-10-10 (Rajat): the wild card is drawn from the pile. It comes up
 * with the deck as one more face-down card (same black back as the rest),
 * then is picked up: it lifts off the table, turns face up and grows to the
 * front, straightening as it comes.
 * ────────────────────────────────────────────────────────────────────────── */

const INK = '#0A0A0A';
const RED = '#EB3F43';
const CARD = '#FFFFFF';
const BG = '#FFFFFF';

const SECTION_VH = 400;
const P = 1200;
/** The deck lands over [0, DECK_P] of the section; the wild card lies in
 *  it face down, then is picked up over [PICK_FROM, PICK_TO]: lifted, turned
 *  face up and brought to the front on one eased curve, no bounce. */
const DECK_P = 0.15;
const PICK_FROM = 0.13;
const PICK_TO = 0.28;
/** How the wild card lies in the pile: turned near-portrait like the rest. */
const PILE_ANGLE = 83;
/** How high it is lifted mid-pick, in frame heights (toward the viewer). */
const PICK_LIFT = 0.28;
/** The section starts this far before the team film's section ends, so
 *  the card comes up through the film as the camera passes into it, with
 *  no dead scroll between the two (Rajat). Its frame is transparent and
 *  sits above the film's. */
const OVERLAP_VH = 160;
/** Per-layer parallax over the section (far, mid, near), in frame heights. */
const DECK_DRIFT = [0.03, 0.06, 0.1];
/** The pan runs over this window; the rest is the end hold. */
const PAN_FROM = 0.3;
const PAN_TO = 0.94;
/** The plays (cards behind the wild card turning over) are spaced along the
 *  pan, one every TURN_GAP of it, each taking TURN of the pan to go over,
 *  so at most one is ever mid-turn. */
const TURN_FROM = 0.04;
const TURN_GAP = 0.093;
const TURN = 0.07;

/* The picture, in its own units. The window onto it is VIEW_W wide. */
const VIEW_W = 1000;
const VIEW_H = 560;
const PIC_W = 4000;
const TABLE = { x: 260, y: 200, w: 3080, h: 170, r: 60 };

/* The subtitle track, one line per stretch of the table (`at` is the pan,
   0..1), each paired with the power our card shows in its corner. One track,
   so the old in-card captions and the power strip can never collide. */
type Power = 'wild' | 'plus2' | 'skip' | 'reverse' | 'plus4';
const SUBS: Array<{ at: number; power: Power; text: string; red?: boolean }> = [
  { at: 0, power: 'wild', text: 'Everyone else plays by the rules. We brought the wild card.' },
  { at: 0.12, power: 'plus2', text: 'Web and UI/UX at this end. Draw two: more designers, same invoice.' },
  { at: 0.3, power: 'skip', text: 'Brand, two seats down. Skip the hand-offs. All of them.' },
  { at: 0.48, power: 'reverse', text: '2D and 3D, mid-table. Reverse the brief until it makes sense.' },
  { at: 0.65, power: 'plus4', text: 'Motion, edit, sound and ads at the far end. Draw four.' },
  { at: 0.82, power: 'wild', text: 'Whoever the brief needs. Usually all of us.' },
  { at: 0.96, power: 'wild', text: "Don't worry. The whole table's on it.", red: true },
];
const RANK_ROLL = 'transform 0.9s cubic-bezier(0.37, 0, 0.63, 1)';

/** A power in UNO's own voice: chunky white, a thick black outline and a
 *  hard black extrusion down and to the right, like the printed card. Every
 *  glyph is drawn three times (extrusion, outline, fill) from one shape. */
const UNO_FONT = "'Lilita One', var(--font-sans)";
function UnoInk({ children, w = 32 }: { children: (layer: 'depth' | 'line' | 'fill') => React.ReactNode; w?: number }) {
  const depth = [1, 2, 3, 4];
  return (
    <svg viewBox={`-4 -4 ${w + 10} 42`} style={{ height: '1.2em', width: 'auto', overflow: 'visible' }} aria-hidden>
      {depth.map((d) => (
        <g key={d} transform={`translate(${d * 0.7} ${d * 0.7})`}>{children('depth')}</g>
      ))}
      {children('line')}
      {children('fill')}
    </svg>
  );
}
const inkStyle = (layer: 'depth' | 'line' | 'fill') =>
  layer === 'fill'
    ? { fill: '#FFFFFF', stroke: 'none' }
    : { fill: '#0A0A0A', stroke: '#0A0A0A', strokeWidth: 5.5, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

function PowerGlyph({ power }: { power: Power }) {
  if (power === 'plus2' || power === 'plus4')
    return (
      <UnoInk w={34}>
        {(l) => (
          <text x={17} y={30} textAnchor="middle" fontFamily={UNO_FONT} fontSize={34} letterSpacing={-1} {...inkStyle(l)}>
            {power === 'plus2' ? '+2' : '+4'}
          </text>
        )}
      </UnoInk>
    );
  if (power === 'skip')
    return (
      <UnoInk w={34}>
        {(l) => (
          <path
            fillRule="evenodd"
            d="M17 2a15 15 0 1 1 0 30a15 15 0 1 1 0-30ZM10.6 22.9 21.4 8.9a9 9 0 0 0-10.8 14ZM13 25.4 23.8 11.4a9 9 0 0 1-10.8 14Z"
            {...inkStyle(l)}
          />
        )}
      </UnoInk>
    );
  if (power === 'reverse')
    // UNO's reverse: two bent arrows chasing each other on the diagonal.
    return (
      <UnoInk w={34}>
        {(l) => (
          <g transform="translate(2 2) rotate(-45 15 15)" {...inkStyle(l)}>
            <path d="M20 2 L28.5 8.5 L20 15 L20 11 L11 11 L11 13.5 L5 13.5 L5 6 L20 6Z" />
            <path d="M10 28 L1.5 21.5 L10 15 L10 19 L19 19 L19 16.5 L25 16.5 L25 24 L10 24Z" />
          </g>
        )}
      </UnoInk>
    );
  // WILD: four blocks, one with the logo's rounded corner.
  return (
    <UnoInk w={32}>
      {(l) => (
        <g {...inkStyle(l)}>
          <path d="M9 2h6v13H2V9a7 7 0 0 1 7-7Z" />
          <rect x="18" y="2" width="13" height="13" />
          <rect x="2" y="18" width="13" height="13" />
          <rect x="18" y="18" width="13" height="13" />
        </g>
      )}
    </UnoInk>
  );
}

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
 *  in the opposite corner. The rank is a column of numbers in a one-line
 *  window; `rankRef` is the column, rolled by transform. */
function Index({ flip, rankRef }: { flip?: boolean; rankRef: (el: HTMLSpanElement | null) => void }) {
  return (
    <div
      style={{
        position: 'absolute',
        ...(flip ? { right: '4%', bottom: '5.5%' } : { left: '4%', top: '5.5%' }),
        transform: flip ? 'rotate(180deg)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.1em',
        color: '#FFFFFF',
        fontFamily: 'var(--font-sans)',
        fontWeight: 700,
        fontSize: 'clamp(30px, 4.4vw, 76px)',
        lineHeight: 1,
        letterSpacing: '-0.04em',
      }}
    >
      <span style={{ display: 'block', height: '1.3em', overflow: 'hidden', minWidth: '1.5em', textAlign: 'center', paddingTop: '0.05em', boxSizing: 'border-box' }}>
        <span ref={rankRef} style={{ display: 'flex', flexDirection: 'column', transition: RANK_ROLL, willChange: 'transform' }}>
          {SUBS.map((sub, i) => (
            <span key={i} style={{ display: 'flex', height: '1.3em', alignItems: 'center', justifyContent: 'center' }}>
              <PowerGlyph power={sub.power} />
            </span>
          ))}
        </span>
      </span>
    </div>
  );
}

/** The UNO face: red field over the whole window except a tilted oval, a
 *  white ring round the oval, a soft grain on the red. viewBox matches the
 *  field's aspect (about 1.45 : 1) so the oval keeps its shape. */
function UnoField({ blackRef }: { blackRef: React.RefObject<SVGPathElement | null> }) {
  const W = 145;
  const H = 100;
  // Oval: centred a touch high, tilted like the UNO oval (top to the right).
  const cx = W / 2;
  const cy = H * 0.46;
  const rx = W * 0.47;
  const ry = H * 0.36;
  const tilt = -11;
  const grain = grainTile();
  const t = (tilt * Math.PI) / 180;
  // The oval as a path (rotated ellipse, two arcs) for the even-odd cut.
  const ax = Math.cos(t) * rx, ay = Math.sin(t) * rx;
  const oval = `M${(cx - ax).toFixed(2)} ${(cy - ay).toFixed(2)} A${rx} ${ry} ${tilt} 1 0 ${(cx + ax).toFixed(2)} ${(cy + ay).toFixed(2)} A${rx} ${ry} ${tilt} 1 0 ${(cx - ax).toFixed(2)} ${(cy - ay).toFixed(2)}Z`;
  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} aria-hidden>
        <defs>
          <radialGradient id="uno-black" cx="35%" cy="30%" r="85%">
            <stop offset="0%" stopColor="#2A2A2A" />
            <stop offset="60%" stopColor="#111111" />
            <stop offset="100%" stopColor="#050505" />
          </radialGradient>
          <radialGradient id="uno-red" cx="35%" cy="30%" r="85%">
            <stop offset="0%" stopColor="#F2575A" />
            <stop offset="60%" stopColor={RED} />
            <stop offset="100%" stopColor="#C92F33" />
          </radialGradient>
          {grain && (
            <pattern id="uno-grain" width={14} height={14} patternUnits="userSpaceOnUse">
              <image href={grain} width={14} height={14} preserveAspectRatio="none" />
            </pattern>
          )}
        </defs>
        <path d={`M0 0H${W}V${H}H0Z ${oval}`} fill="url(#uno-red)" fillRule="evenodd" />
        {/* Wild and +4 are black cards in UNO: the field crossfades to
            black while one of them is in play, then back to red. */}
        <path ref={blackRef} d={`M0 0H${W}V${H}H0Z ${oval}`} fill="url(#uno-black)" fillRule="evenodd" style={{ opacity: 1, transition: 'opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1)' }} />
        {/* Grain on the red only, never on the oval's white. */}
        {grain && <path d={`M0 0H${W}V${H}H0Z ${oval}`} fill="url(#uno-grain)" fillRule="evenodd" opacity={0.16} style={{ mixBlendMode: 'multiply' }} />}
        <path d={oval} fill="none" stroke="#FFFFFF" strokeWidth={1.6} vectorEffect="non-scaling-stroke" style={{ strokeWidth: 'clamp(4px, 0.55vw, 9px)' } as React.CSSProperties} />
      </svg>
    </>
  );
}

export function TeamTable() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const picRef = useRef<HTMLDivElement>(null);
  const subRefs = useRef<Array<HTMLDivElement | null>>([]);
  const deckRef = useRef<HTMLDivElement>(null);
  const layerRefs = useRef<Array<HTMLDivElement | null>>([]);
  const flightsRef = useRef<Flight[]>([]);
  const feltRef = useRef<HTMLDivElement | null>(null);
  const rankRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const rankRef = useRef(0);
  const blackRef = useRef<SVGPathElement>(null);
  const flippersRef = useRef<Flipper[]>([]);
  /** The dealt cards, in play order. */
  const dealtRef = useRef<Flipper[]>([]);
  const reduceMotion = useReducedMotion() ?? false;

  /* Deal: pick the front-layer cards a viewer can see round the wild card
     at this frame size and give each its face, in play order. Re-dealt on
     resize; cards no longer dealt lie face down. */
  useEffect(() => {
    const deal = () => {
      flippersRef.current.forEach((f) => {
        turnCard(f, 0);
        f.face.style.visibility = 'hidden';
        if (f.wrap.parentElement) f.wrap.parentElement.style.zIndex = '';
      });
      const dealt = pickFlippers(flippersRef.current, window.innerWidth, window.innerHeight);
      const keep = PLAYS.map((_, i) => i);
      dealtRef.current = [];
      dealt.forEach((f, k) => {
        const play = keep[k];
        f.face.src = playFaceUrl(play);
        f.face.style.visibility = 'visible';
        f.face.dataset.play = String(play);
        if (f.wrap.parentElement) f.wrap.parentElement.style.zIndex = '2';
        dealtRef.current.push(f);
        if (reduceMotion) turnCard(f, 1);
      });
    };
    // After the deck has mounted and laid out.
    const id = requestAnimationFrame(deal);
    window.addEventListener('resize', deal);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener('resize', deal);
    };
  }, [reduceMotion]);

  const setRank = (i: number) => rankRefs.current.forEach((el) => el && (el.style.transform = `translateY(${-i * 1.3}em)`));

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
        const vw = window.innerWidth, vh = window.innerHeight;
        const uw = Math.min(0.84 * vw, 1300, 1.08 * vh);
        // In the pile: the card's long side matches a pile card's height.
        const s0 = pileCardHeight(vw, vh) / uw;
        const q = clamp01(p / DECK_P);
        // Rides up with the deck like a middle-row card.
        const rideT = clamp01((Math.min(1, q / 0.85) - 0.325) / 0.35);
        const y = (1 - easeOutCubic(rideT)) * vh * 0.85;
        const k = easeInOutSine(smooth(PICK_FROM, PICK_TO, p));
        const turn = easeInOutSine(clamp01((k - 0.1) / 0.7));
        cardRef.current.style.transform =
          `translate(-50%, -50%) translate3d(0, ${y.toFixed(1)}px, ${(Math.sin(Math.PI * k) * PICK_LIFT * vh).toFixed(1)}px) ` +
          `rotateZ(${(PILE_ANGLE * (1 - k)).toFixed(2)}deg) rotateY(${(180 * (1 - turn)).toFixed(2)}deg) scale(${(s0 + (1 - s0) * k).toFixed(4)})`;
        driveDeck(flightsRef.current, feltRef.current, q, vh);
        layerRefs.current.forEach((el, i) => {
          if (el) el.style.transform = `translate3d(0, ${((0.5 - p) * DECK_DRIFT[i] * vh).toFixed(1)}px, 0)`;
        });
      }
      let panT = 0;
      if (windowRef.current && picRef.current) {
        const run = picRef.current.scrollWidth - windowRef.current.clientWidth;
        panT = easeInOutSine(smooth(PAN_FROM, PAN_TO, p));
        picRef.current.style.transform = `translate3d(${(-run * panT).toFixed(1)}px, 0, 0)`;
      }
      // The subtitle for this stretch of the table; the rest are hidden.
      let live = 0;
      SUBS.forEach((c, i) => {
        if (panT >= c.at) live = i;
      });
      subRefs.current.forEach((el, i) => {
        if (!el) return;
        // No subtitle until the wild card is in hand.
        const on = i === live && p > PICK_TO - 0.02;
        el.style.opacity = on ? '1' : '0';
        el.style.transform = on ? 'translate(-50%, 0)' : 'translate(-50%, 0.5em)';
      });
      // The plain cards on the table turn over one by one along the pan.
      dealtRef.current.forEach((f, k) => {
        const at = TURN_FROM + k * (TURN_GAP * (PLAYS.length / Math.max(1, dealtRef.current.length)));
        turnCard(f, easeInOutSine(smooth(at, at + TURN, panT)));
      });
      // One power per stretch, rolled when the stretch changes.
      if (blackRef.current) {
        const pw = SUBS[live].power;
        blackRef.current.style.opacity = pw === 'wild' || pw === 'plus4' ? '1' : '0';
      }
      if (live !== rankRef.current) {
        rankRef.current = live;
        setRank(live);
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
        width: 'min(84vw, 1300px, 108vh)',
        aspectRatio: '1.45 / 1',
        transform: reduceMotion
          ? 'translate(-50%, -50%)'
          : `translate(-50%, -50%) translate3d(0, 100vh, 0) rotateZ(${PILE_ANGLE}deg) rotateY(180deg) scale(0.2)`,
        transformOrigin: '50% 50%',
        transformStyle: 'preserve-3d',
        willChange: 'transform',
      }}
    >
      {/* The back: the pile's black lattice, so face down it is one of them. */}
      <img
        src={WILD_BACK_URL}
        alt=""
        draggable={false}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          borderRadius: '4.2% / 6.1%',
          boxShadow: '0 6px 16px rgba(0,0,0,0.14)',
          transform: 'rotateY(180deg)',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: '#FFFFFF',
          borderRadius: '4.2% / 6.1%',
          boxShadow: '0 34px 70px rgba(0,0,0,0.20), 0 8px 22px rgba(0,0,0,0.10), 0 0 0 1px rgba(10,10,10,0.08)',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          overflow: 'hidden',
        }}
      >
      {/* The red field inside the white border: the window onto the table
          (the picture is wider than the card and pans behind it), then the
          field painted over it with the UNO oval cut out. */}
      <div style={{ position: 'absolute', left: '3.4%', right: '3.4%', top: '4.9%', bottom: '4.9%', borderRadius: '2.4% / 3.6%', overflow: 'hidden', background: CARD }}>
        <div ref={windowRef} style={{ position: 'absolute', left: '6%', right: '6%', top: '2%', bottom: '10%', overflow: 'hidden' }}>
          <div ref={picRef} style={{ height: '100%', width: `${(PIC_W / VIEW_W) * 100}%`, willChange: 'transform' }}>
            <Picture />
          </div>
        </div>
        <UnoField blackRef={blackRef} />
      </div>
      <Index rankRef={(el) => (rankRefs.current[0] = el)} />
      <Index flip rankRef={(el) => (rankRefs.current[1] = el)} />
      </div>
    </div>
  );

  /* Subtitles under the card, film style: centred, one line at a time, in
     the band between the card and the frame's bottom. */
  const subs = SUBS.map((c, i) => (
    <div
      key={i}
      ref={(el) => {
        subRefs.current[i] = el;
      }}
      className="btn-corners"
      style={{
        position: 'absolute',
        left: '50%',
        bottom: 'max(14px, calc((100vh - min(84vw, 1300px, 108vh) / 1.45) / 4 - 20px))',
        zIndex: 4,
        maxWidth: 'min(92vw, 980px)',
        width: 'max-content',
        textAlign: 'center',
        padding: '14px 26px',
        background: '#FFFFFF',
        // A soft rectangle with the site's superellipse corner (.btn-corners),
        // not a pill (Rajat 2026-10-04).
        boxShadow: '0 10px 30px rgba(0,0,0,0.12), 0 0 0 1px rgba(10,10,10,0.08)',
        fontFamily: 'var(--font-sans)',
        fontSize: 'clamp(14px, 1.45vw, 22px)',
        fontWeight: c.red ? 700 : 500,
        letterSpacing: '-0.01em',
        lineHeight: 1.25,
        color: c.red ? RED : INK,
        opacity: i === 0 ? 1 : 0,
        transform: i === 0 ? 'translate(-50%, 0)' : 'translate(-50%, 0.5em)',
        transition: 'opacity 0.28s ease, transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
        pointerEvents: 'none',
      }}
    >
      {c.text}
    </div>
  ));

  if (reduceMotion) {
    return (
      <section style={{ position: 'relative', height: '100vh', background: FELT, overflow: 'hidden' }}>
        <CardDeck layerRefs={layerRefs} flippersRef={flippersRef} settled />
        {card}
        {subs}
      </section>
    );
  }

  return (
    <section data-chapter="team-table" style={{ position: 'relative', zIndex: 2, marginTop: `-${OVERLAP_VH}vh`, background: 'transparent' }}>
      <div ref={wrapRef} style={{ height: `${SECTION_VH}vh`, position: 'relative' }}>
        <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden', perspective: `${P}px`, perspectiveOrigin: '50% 50%' }}>
          <div
            ref={deckRef}
            style={{
              position: 'absolute',
              inset: 0,
            }}
          >
            <CardDeck layerRefs={layerRefs} flightsRef={flightsRef} feltRef={feltRef} flippersRef={flippersRef} />
          </div>
          {card}
          {subs}
        </div>
      </div>
    </section>
  );
}
