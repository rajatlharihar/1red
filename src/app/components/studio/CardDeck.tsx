import { useEffect, useRef, type CSSProperties } from 'react';

/* ─── The deck on the table ────────────────────────────────────────────────
 * Rajat's reference (2026-10-04): a table strewn with face-down playing
 * cards, red patterned backs, every one the same, and one card face up that
 * is not like the others. Here the face-down cards are everyone else; ours
 * is the wild card (TeamTable's UNO card) lying on top.
 *
 * Drawn once as SVG, three depth layers, each one static picture; the only
 * per-frame work is a transform on each layer (TeamTable writes it), so the
 * deck costs three composited layers whatever the card count. The grain is
 * a canvas noise tile rendered once, never an SVG filter (perf rule: no
 * filters on anything that moves).
 * ────────────────────────────────────────────────────────────────────────── */

const RED = '#EB3F43';
const PAPER = '#FFFFFF';
const BACK_INK = '#0A0A0A';
export const FELT = '#FFFFFF';

function rng(seed: number) {
  let n = seed * 9301 + 49297;
  return () => ((n = (n * 9301 + 49297) % 233280) / 233280);
}

/** Card size in deck units (the deck's viewBox is 1600 x 1000). */
const CW = 170;
const CH = 238;

type Card = { x: number; y: number; a: number };
/** Lay the cards: a jittered grid over the whole deck so a phone's centre
 *  crop is as full as a wide frame, then shuffled into three layers. */
function layout(): Card[][] {
  const r = rng(41);
  const cards: Card[] = [];
  for (let gy = -1; gy < 6; gy++) {
    for (let gx = -1; gx < 11; gx++) {
      cards.push({
        x: gx * 158 + (gy % 2 ? 70 : 0) + (r() - 0.5) * 90,
        y: gy * 190 + (r() - 0.5) * 80,
        a: (r() - 0.5) * 70,
      });
    }
  }
  const layers: Card[][] = [[], [], []];
  cards.forEach((c, i) => layers[Math.floor(r() * 3 + (i % 3)) % 3].push(c));
  return layers;
}
const LAYERS = layout();

/** One card back as an SVG image, once per depth shade: the browser
 *  rasterises it once and every card on the table reuses the bitmap. Paper
 *  with rounded corners, a red rule inset and the classic lattice (a
 *  diagonal grid with a small four-petal cross in each diamond); the far
 *  layers sit a little back in a white haze. The viewBox leaves room for
 *  the card's own soft shadow. */
const PAD = 14;
function cardUrl(shade: number) {
  const inset = 11;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-PAD} ${-PAD} ${CW + 2 * PAD} ${CH + 2 * PAD}">` +
    `<rect x="3" y="6" width="${CW}" height="${CH}" rx="12" fill="#000" opacity="0.08"/>` +
    backArt(CW, CH, inset) +
    (shade ? `<rect width="${CW}" height="${CH}" rx="12" fill="#FFFFFF" opacity="${shade}"/>` : '') +
    `</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
/** The back's artwork in a w x h card: paper, ruled inset, lattice. Black
 *  ink (Rajat 2026-10-10: every card back on the table is black patterned). */
function backArt(w: number, h: number, inset: number) {
  return (
    `<defs><pattern id="l" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">` +
    `<rect width="14" height="14" fill="${PAPER}"/><path d="M0 0H14M0 0V14" stroke="${BACK_INK}" stroke-width="1.3"/>` +
    `<path d="M7 4.2L8 7L7 9.8L6 7Z M4.2 7L7 6L9.8 7L7 8Z" fill="${BACK_INK}"/></pattern></defs>` +
    `<rect width="${w}" height="${h}" rx="12" fill="${PAPER}" stroke="rgba(10,10,10,0.1)"/>` +
    `<rect x="${inset}" y="${inset}" width="${w - 2 * inset}" height="${h - 2 * inset}" rx="5" fill="url(#l)" stroke="${BACK_INK}" stroke-width="2.2"/>` +
    `<rect x="${inset + 7}" y="${inset + 7}" width="${w - 2 * inset - 14}" height="${h - 2 * inset - 14}" rx="3" fill="none" stroke="${BACK_INK}" stroke-width="1.2"/>`
  );
}
const CARD_URLS = [0.32, 0.14, 0].map(cardUrl);
/* ─── Faces: the cards that turn over (2026-10-04, final) ───────────────────
 * Rajat: "everyone else is a normal deck of playing cards; we are the UNO
 * card, we experiment and write our own rules." So the table is ordinary:
 * the cards that turn over show classic faces (K, Q, J, 10, 7, A), black and
 * red suits, serif indices. Only ours (TeamTable's wild card) breaks the rules.
 * Each face is one SVG picture, rasterised once, like the backs. */
const INK = '#0A0A0A';
type Suit = 'spade' | 'heart' | 'diamond' | 'club';
const SUIT_PATH: Record<Suit, string> = {
  // All drawn in a 100 x 100 box, centred on (50, 50).
  heart: 'M50 88 C 18 64, 4 46, 10 28 C 16 10, 40 8, 50 28 C 60 8, 84 10, 90 28 C 96 46, 82 64, 50 88 Z',
  diamond: 'M50 6 L84 50 L50 94 L16 50 Z',
  spade: 'M50 6 C 34 30, 8 44, 12 64 C 15 80, 36 84, 46 72 C 44 84, 40 90, 32 94 L68 94 C 60 90, 56 84, 54 72 C 64 84, 85 80, 88 64 C 92 44, 66 30, 50 6 Z',
  club: 'M50 8 C 36 8, 30 22, 36 34 C 24 28, 8 34, 10 50 C 12 66, 32 70, 44 58 C 44 74, 40 86, 32 94 L68 94 C 60 86, 56 74, 56 58 C 68 70, 88 66, 90 50 C 92 34, 76 28, 64 34 C 70 22, 64 8, 50 8 Z',
};
const suitColor = (s: Suit) => (s === 'heart' || s === 'diamond' ? RED : INK);
function suitSvg(s: Suit, cx: number, cy: number, size: number) {
  const k = size / 100;
  return `<path transform="translate(${cx - 50 * k} ${cy - 50 * k}) scale(${k})" d="${SUIT_PATH[s]}" fill="${suitColor(s)}"/>`;
}
function faceUrl(rank: string, suit: Suit) {
  const cx = CW / 2;
  const cy = CH / 2;
  const col = suitColor(suit);
  const serif = `font-family="Georgia, 'Times New Roman', serif" font-weight="700"`;
  const corner = (x: number, y: number) =>
    `<text x="${x}" y="${y}" ${serif} font-size="30" text-anchor="middle" fill="${col}">${rank}</text>` + suitSvg(suit, x, y + 18, 22);
  const court = rank === 'K' || rank === 'Q' || rank === 'J';
  const centre = court
    ? `<rect x="34" y="46" width="${CW - 68}" height="${CH - 92}" rx="4" fill="none" stroke="${col}" stroke-width="2"/>` +
      `<text x="${cx}" y="${cy + 24}" ${serif} font-size="78" text-anchor="middle" fill="${col}">${rank}</text>` +
      suitSvg(suit, cx, cy - 44, 30) +
      `<g transform="rotate(180 ${cx} ${cy})">${suitSvg(suit, cx, cy - 44, 30)}</g>`
    : rank === 'A'
      ? suitSvg(suit, cx, cy, 92)
      : // 10 and 7: pips in two columns and a middle line.
        Array.from({ length: rank === '10' ? 10 : 7 }, (_, i) => {
          const pos10 = [[0, 0], [1, 0], [0.5, 0.17], [0, 0.33], [1, 0.33], [0, 0.67], [1, 0.67], [0.5, 0.83], [0, 1], [1, 1]];
          const pos7 = [[0, 0], [1, 0], [0.5, 0.25], [0, 0.5], [1, 0.5], [0, 1], [1, 1]];
          const [u, v] = (rank === '10' ? pos10 : pos7)[i];
          return suitSvg(suit, 52 + u * (CW - 104), 50 + v * (CH - 100), 30);
        }).join('');
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-PAD} ${-PAD} ${CW + 2 * PAD} ${CH + 2 * PAD}">` +
    `<rect x="3" y="6" width="${CW}" height="${CH}" rx="12" fill="#000" opacity="0.1"/>` +
    `<rect width="${CW}" height="${CH}" rx="12" fill="${PAPER}" stroke="rgba(10,10,10,0.12)"/>` +
    corner(20, 34) +
    `<g transform="rotate(180 ${cx} ${cy})">${corner(20, 34)}</g>` +
    centre +
    `</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** The ordinary hands that turn over along the pan, left to right. */
export const PLAYS: Array<{ rank: string; suit: Suit }> = [
  { rank: 'K', suit: 'spade' },
  { rank: '7', suit: 'heart' },
  { rank: 'Q', suit: 'diamond' },
  { rank: '10', suit: 'club' },
  { rank: 'J', suit: 'heart' },
  { rank: 'A', suit: 'spade' },
  { rank: 'K', suit: 'diamond' },
  { rank: '10', suit: 'spade' },
  { rank: 'Q', suit: 'club' },
  { rank: 'A', suit: 'heart' },
];
const FACE_CACHE = new Map<string, string>();
export function playFaceUrl(i: number) {
  const pl = PLAYS[i];
  const key = `${pl.rank}${pl.suit}`;
  if (!FACE_CACHE.has(key)) FACE_CACHE.set(key, faceUrl(pl.rank, pl.suit));
  return FACE_CACHE.get(key)!;
}

/** A card that can turn over: the flipper, its face image, and its place. */
export type Flipper = { el: HTMLDivElement; face: HTMLImageElement; wrap: HTMLDivElement; c: Card };

/** The front-layer cards a viewer can actually see round the wild card at
 *  this frame size, best first, at most PLAYS.length, returned in screen
 *  order left to right (so the turns travel with the pan). Mirrors the CSS
 *  of the deck box and of TeamTable's card. */
export function pickFlippers(all: Flipper[], vw: number, vh: number): Flipper[] {
  const boxW = Math.max(1.08 * vw, 1.08 * vh * (VW / VH));
  const boxH = (boxW * VH) / VW;
  const uw = Math.min(0.84 * vw, 1300, 1.08 * vh);
  const uh = uw / 1.45;
  const uno = { x0: (vw - uw) / 2, x1: (vw + uw) / 2, y0: (vh - uh) / 2, y1: (vh + uh) / 2 };
  const cw = (CW / VW) * boxW;
  const ch = (CH / VH) * boxH;
  const ov = (a0: number, a1: number, b0: number, b1: number) => Math.max(0, Math.min(a1, b1) - Math.max(a0, b0));
  const scored = all.map((f) => {
    const sx = vw / 2 + ((f.c.x + CW / 2 - VX) / VW - 0.5) * boxW;
    const sy = vh / 2 + ((f.c.y + CH / 2 - VY) / VH - 0.5) * boxH;
    const x0 = sx - cw / 2, x1 = sx + cw / 2, y0 = sy - ch / 2, y1 = sy + ch / 2;
    // Keep clear of the nav band at the top.
    const inView = ov(x0, x1, 0, vw) * ov(y0, y1, 90, vh);
    const underUno = ov(x0, x1, Math.max(0, uno.x0), Math.min(vw, uno.x1)) * ov(y0, y1, Math.max(90, uno.y0), Math.min(vh, uno.y1));
    return { f, sx, vis: (inView - underUno) / (cw * ch) };
  });
  const picked = scored.filter((s) => s.vis > 0.5).sort((a, b) => b.vis - a.vis).slice(0, PLAYS.length);
  return picked.sort((a, b) => a.sx - b.sx).map((s) => s.f);
}

/** Turns a card: `f` 0 face down to 1 face up. It lifts off the table on
 *  the way over (a real card is picked up to be turned) and lays back down. */
export function turnCard(fl: Flipper, f: number) {
  const lift = Math.sin(Math.PI * f);
  fl.el.style.transform = `perspective(900px) translateZ(${(lift * 70).toFixed(1)}px) rotateY(${(180 * f).toFixed(2)}deg)`;
}

/* The deck's frame, in deck units: everything is laid out in this box and
 * the box is scaled to cover the viewport. */
const VX = -120, VY = -120, VW = 1840, VH = 1240;

/** A pile card's height on screen at this frame size (mirrors the deck box). */
export function pileCardHeight(vw: number, vh: number) {
  const boxW = Math.max(1.08 * vw, 1.08 * vh * (VW / VH));
  return (CH / VH) * ((boxW * VH) / VW);
}

/* How the pile arrives (2026-10-04, Rajat: "the cards should not be cut,
 * the cards should come as they are"). No rectangle wipes in any more: every
 * card is whole and travels up on its own, bottom rows first, each easing
 * out of a small extra turn as it lands, so the leading edge is the ragged
 * outline of the cards themselves. A white felt follows underneath, always
 * at least a card's height below the landed rows, so its straight edge is
 * never seen; it only fills the gaps between cards once they are down. */
type Flight = { el: HTMLDivElement; c: Card; start: number; spin: number };
const STAGGER = 0.55;
const FLY = 0.35;
const flightOf = (() => {
  const r = rng(77);
  return (c: Card) => {
    const row = (c.y - VY) / VH; // 0 top .. 1 bottom
    return { start: (1 - row) * STAGGER + r() * 0.1, spin: (r() - 0.5) * 36 };
  };
})();

/** Drives the pile: `q` 0 (all below the frame) to 1 (all down, felt full). */
export function driveDeck(flights: Flight[], felt: HTMLDivElement | null, q: number, frameH: number) {
  const d = Math.min(1, q / 0.85);
  for (const f of flights) {
    const t = Math.max(0, Math.min(1, (d - f.start) / FLY));
    const e = 1 - Math.pow(1 - t, 3);
    const u = 1 - e;
    // Each card starts just below the frame: lower rows have less to travel.
    const row = (f.c.y - VY) / VH;
    f.el.style.transform = `translate3d(0, ${(u * frameH * (1.35 - row)).toFixed(1)}px, 0) rotate(${(f.c.a + f.spin * u).toFixed(2)}deg)`;
  }
  if (felt) {
    // Landed rows reach up to 1 - (d - 0.65) / 0.55 (worst-case jitter);
    // the felt's edge stays 0.22 of the deck below them, then closes up
    // once every card is down.
    let top = 1 - (d - (STAGGER + 0.1)) / STAGGER + 0.22;
    if (q > 0.85) top = Math.min(top, 0.4 * (1 - (q - 0.85) / 0.15));
    top = Math.max(0, Math.min(1.3, top));
    felt.style.transform = `translate3d(0, ${(top * 100).toFixed(2)}%, 0)`;
  }
}
export type { Flight };

/** A tile of film grain, rendered once per page load. */
let grainUrl: string | null = null;
export function grainTile() {
  if (grainUrl || typeof document === 'undefined') return grainUrl;
  const c = document.createElement('canvas');
  c.width = c.height = 160;
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(160, 160);
  const r = rng(5);
  for (let k = 0; k < img.data.length; k += 4) {
    const v = r() * 255;
    img.data[k] = img.data[k + 1] = img.data[k + 2] = v;
    img.data[k + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  grainUrl = c.toDataURL('image/png');
  return grainUrl;
}

/** A static grain overlay; `opacity` sets how much shows. */
export function Grain({ opacity, style }: { opacity: number; style?: CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const url = grainTile();
    if (ref.current && url) ref.current.style.backgroundImage = `url(${url})`;
  }, []);
  return (
    <div
      ref={ref}
      aria-hidden
      style={{ position: 'absolute', inset: 0, opacity, backgroundSize: '160px 160px', pointerEvents: 'none', ...style }}
    />
  );
}

/** A front-layer card: back and face on a flipper. The face picture is
 *  set only when TeamTable deals this card a play. */
function FlipCard({ c, flippersRef }: { c: Card; flippersRef?: React.MutableRefObject<Flipper[]> }) {
  const elRef = useRef<HTMLDivElement | null>(null);
  const faceRef = useRef<HTMLImageElement | null>(null);
  const side: CSSProperties = { position: 'absolute', inset: 0, width: '100%', height: '100%', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' };
  return (
    <div
      ref={(wrap) => {
        if (wrap && flippersRef && elRef.current && faceRef.current && !flippersRef.current.some((f) => f.wrap === wrap))
          flippersRef.current.push({ el: elRef.current, face: faceRef.current, wrap, c });
      }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <div ref={elRef} style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d' }}>
        <img src={CARD_URLS[2]} alt="" draggable={false} style={side} />
        <img ref={faceRef} alt="" draggable={false} style={{ ...side, transform: 'rotateY(180deg)', visibility: 'hidden' }} />
      </div>
    </div>
  );
}

/** The deck: felt, three layers of whole cards (layer refs for
 *  TeamTable's parallax, flight refs for the arrival), and grain over all of
 *  it. `settled` draws it already landed (reduced motion). */
export function CardDeck({
  layerRefs,
  flightsRef,
  feltRef,
  flippersRef,
  settled = false,
}: {
  layerRefs: React.MutableRefObject<Array<HTMLDivElement | null>>;
  /** Every front-layer card, ready to be turned (TeamTable picks which). */
  flippersRef?: React.MutableRefObject<Flipper[]>;
  flightsRef?: React.MutableRefObject<Flight[]>;
  feltRef?: React.MutableRefObject<HTMLDivElement | null>;
  settled?: boolean;
}) {
  if (flightsRef) flightsRef.current = [];
  if (flippersRef) flippersRef.current = [];
  // The deck box covers the frame whatever its aspect.
  const box: CSSProperties = {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: `max(108vw, calc(108vh * ${VW / VH}))`,
    aspectRatio: `${VW} / ${VH}`,
    transform: 'translate(-50%, -50%)',
  };
  return (
    <>
      <div
        ref={(el) => {
          if (feltRef) feltRef.current = el;
        }}
        style={{ position: 'absolute', inset: 0, background: FELT, transform: settled ? 'none' : 'translate3d(0, 130%, 0)', willChange: 'transform' }}
      />
      {LAYERS.map((cards, i) => (
        <div
          key={i}
          ref={(el) => {
            layerRefs.current[i] = el;
          }}
          style={{ position: 'absolute', inset: 0, willChange: 'transform' }}
        >
          <div style={box}>
            {cards.map((c, k) => {
              const f = flightOf(c);
              return (
                <div
                  key={k}
                  ref={(el) => {
                    if (el && flightsRef) flightsRef.current.push({ el, c, ...f });
                  }}
                  style={{
                    position: 'absolute',
                    left: `${((c.x - PAD - VX) / VW) * 100}%`,
                    top: `${((c.y - PAD - VY) / VH) * 100}%`,
                    width: `${((CW + 2 * PAD) / VW) * 100}%`,
                    aspectRatio: `${CW + 2 * PAD} / ${CH + 2 * PAD}`,
                    transformOrigin: `${((PAD + CW / 2) / (CW + 2 * PAD)) * 100}% ${((PAD + CH / 2) / (CH + 2 * PAD)) * 100}%`,
                    transform: settled ? `rotate(${c.a}deg)` : 'translate3d(0, 200vh, 0)',
                    willChange: settled ? undefined : 'transform',
                  }}
                >
                  {i === 2 ? (
                    <FlipCard c={c} flippersRef={flippersRef} />
                  ) : (
                    <img src={CARD_URLS[i]} alt="" draggable={false} style={{ display: 'block', width: '100%', height: '100%' }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
      <Grain opacity={0.07} />
    </>
  );
}
