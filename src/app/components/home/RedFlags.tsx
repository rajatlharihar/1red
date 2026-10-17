import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { FillLink } from './FillLink';
import { Digit, RED, INK, EASE, label, focusRing } from '../about/shared';
import { BoxFace, type Mood } from './BoxFace';
import { grainAlphaTile } from './Grain';
import { useTiltIn } from './useTiltIn';
import { PinHead, type Pin } from '../studio/boardString';
import { glide, subscribeGlide } from '../scrollGlide';
import { pageScrolling, registerSoftStop } from '../SmoothScroll';

/* ─── RED FLAGS ───────────────────────────────────────────────────────────
 * With almost no famous work to show, we prove we understand the visitor's
 * problems instead. Six red panels, each a red flag every growing brand
 * recognises, each with a little box who has clearly seen it happen.
 * Hover (or tap) turns a panel over: what the rulebook says (struck out,
 * because everyone does that) and what we do past it. The panels share the
 * rough, wandering edge of the site's other red panels. A tally counts the
 * flags the visitor admits to; at three it offers the brief, sarcastically.
 *
 * 2026-10-06 (Rajat): the section arrives as a card sliding up over the cube
 * section, and borrows /studio's "Our process" look without its pins and
 * thread: black grainy board, paper cards a little turned with deep shadows,
 * red hand-written notes. The panel's back, our fix, is the red.
 * ────────────────────────────────────────────────────────────────────────── */

const PAPER = '#FBFBFB';
const BOARD = '#0E0E0E';
/** The scribble in the margin of each flag, in the hand. */
const NOTES = ['ouch.', 'yawn.', 'seen it.', 'who?', 'oof.', 'every week.'];
/** Each card sits a little turned on the board, like the process exhibits. */
const TILT = [-1.6, 1.2, -0.8, 1.5, -1.2, 0.9];
// Grain without a blend mode: blends over the big board and the moving
// cards were the lag (2026-10-17, up to 250 ms frames at 2560x1340@2).
const grainLayer = (o: number, blend: React.CSSProperties['mixBlendMode'] = 'multiply'): React.CSSProperties => ({
  position: 'absolute',
  inset: 0,
  backgroundImage: `url(${grainAlphaTile(blend === 'multiply' ? 'dark' : 'both')})`,
  backgroundSize: '192px 192px',
  opacity: o * 0.6,
  pointerEvents: 'none',
});

const FLAGS: Array<{ flag: string; rule: string; us: string; who: string; mood: Mood }> = [
  { flag: 'Your logo only works on a white background.', rule: 'Make a dark mode version.', us: 'Make a logo that works on a tiny app icon, a crumpled tote and a cricket jersey.', who: 'Brand identity', mood: 'nervous' },
  { flag: 'Your website opens with \u201cwelcome to our website\u201d.', rule: 'Fix your hero section.', us: 'Make every scroll worth it. Gain attention, then keep it.', who: 'Websites & UI/UX', mood: 'tired' },
  { flag: 'Your ads look like every other TV ad.', rule: 'Follow the best practices.', us: 'The best practices are why they all look the same. We make the weird ones land.', who: 'Ads & campaigns', mood: 'confused' },
  { flag: 'Three agencies. Three fonts. One team would\u2019ve done it better.', rule: 'Write brand guidelines.', us: 'Guidelines aren\u2019t what keep a brand consistent. The team behind it does.', who: 'The whole box', mood: 'wtf' },
  { flag: 'Your social media gets nine views. Four of them are from your mom.', rule: 'Post more consistently.', us: 'More of the same is just the same old grey. We give you something worth the watch.', who: 'Motion & video', mood: 'crying' },
  { flag: '\u201cMake the logo bigger.\u201d Translation: we have no brand strategy.', rule: 'Make the logo bigger.', us: 'Make the idea itself bigger. The logo can stay where it is.', who: 'Strategy', mood: 'irritated' },
];

function Panel({ i, flipped, onFlip, onHover, reduceMotion, tilt = TILT[i], drift = { x: 0, y: 40 } }: { i: number; flipped: boolean; onFlip: () => void; onHover: (on: boolean) => void; reduceMotion: boolean; tilt?: number; drift?: { x: number; y: number } }) {
  const f = FLAGS[i];
  const face: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
  };
  const inner: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    padding: 'clamp(18px, 2vw, 30px)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  };
  const faceSize = 'clamp(84px, 9vw, 140px)';
  return (
    <motion.button
      type="button"
      onClick={onFlip}
      onHoverStart={() => window.matchMedia('(hover: hover)').matches && !pageScrolling() && onHover(true)}
      onHoverEnd={() => window.matchMedia('(hover: hover)').matches && onHover(false)}
      aria-pressed={flipped}
      aria-label={`${f.flag} ${flipped ? 'The rulebook says: ' + f.rule + ' We say: ' + f.us : 'Turn over for the fix'}`}
      className={focusRing}
      initial={reduceMotion ? { rotate: tilt } : { opacity: 0, x: drift.x, y: drift.y, rotate: tilt * 3 }}
      whileInView={{ opacity: 1, x: 0, y: 0, rotate: tilt }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.9, ease: EASE, delay: i * 0.09 }}
      style={{ position: 'relative', display: 'block', width: '100%', aspectRatio: '6 / 5', perspective: 1200, background: 'none', border: 0, padding: 0, cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-sans)' }}
    >
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={reduceMotion ? { duration: 0 } : { type: 'spring', bounce: 0, duration: 0.7 }}
        style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d' }}
      >
        <div style={{ ...face, background: PAPER, boxShadow: '0 18px 40px rgba(0,0,0,0.55)' }}>
          <div style={grainLayer(0.06)} />
          <div style={{ ...inner, color: INK }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <Digit n={i + 1} height="clamp(34px, 4vw, 56px)" fill={INK} />
                <span style={{ ...label, fontSize: 'clamp(11px, 0.85vw, 13px)', opacity: 0.8, display: 'block', marginTop: 10 }}>Red flag</span>
              </div>
              <BoxFace mood={f.mood} variant="white" size={faceSize} delay={i} reduceMotion={reduceMotion} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-hand)', fontSize: 'clamp(24px, 2.2vw, 34px)', fontWeight: 700, color: RED, transform: 'rotate(-3deg)', transformOrigin: 'left', marginBottom: 6 }}>{NOTES[i]}</div>
              <p style={{ margin: 0, fontSize: 'clamp(20px, 1.9vw, 30px)', fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.08 }}>{f.flag}</p>
            </div>
          </div>
        </div>
        <div style={{ ...face, transform: 'rotateY(180deg)', background: RED, boxShadow: '0 18px 40px rgba(0,0,0,0.55)' }}>
          <div style={grainLayer(0.12)} />
          <div style={{ ...inner, color: '#FFFFFF' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div>
                <span style={{ ...label, fontSize: 'clamp(11px, 0.85vw, 13px)', opacity: 0.85 }}>The rulebook says</span>
                <p style={{ margin: '6px 0 0', fontSize: 'clamp(15px, 1.15vw, 18px)', opacity: 0.85, textDecoration: 'line-through', textDecorationColor: INK, textDecorationThickness: 2 }}>{f.rule}</p>
              </div>
              <BoxFace mood="triumph" variant="white" size={faceSize} delay={i + 3} reduceMotion={reduceMotion} />
            </div>
            <div>
              <span style={{ fontFamily: 'var(--font-hand)', fontSize: 'clamp(24px, 2.2vw, 34px)', fontWeight: 700, color: INK, display: 'inline-block', transform: 'rotate(-3deg)' }}>we say:</span>
              <p style={{ margin: '6px 0 12px', fontSize: 'clamp(17px, 1.5vw, 23px)', fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1.15 }}>{f.us}</p>
              {/* 2026-10-07 (Rajat): the service names read clearly now, no square. 2026-10-17: black so they read apart from the white copy. */}
              <span style={{ ...label, fontSize: 'clamp(13px, 1.05vw, 16px)', fontWeight: 600, color: INK }}>{f.who}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.button>
  );
}

/* Pins and red thread from the evidence board (/the-box), holding the
   panels to this board like a conspiracy wall (Rajat, 2026-10-17: not a
   clothesline). Each panel's pin sits somewhere different (seeded, so it
   is the same on every load): mostly in its top third, the odd one lower
   or near a side. Separate strands join panels across rows as well as
   along them, each at its own tension with a slight wobble, and one ends
   in a loose tail. Drawn in, strand by strand, as the section scrolls up.
   An overlay over the grid that never takes the pointer, so the panels
   flip and hover as before; positions come from layout offsets, so nothing
   shifts. Phones (one panel per row) get the pins only. */
const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
/** Which pins each strand joins, by panel index; and which pin trails a tail. */
const STRANDS: Array<[number, number]> = [
  [0, 4],
  [1, 3],
  [2, 5],
  [3, 5],
  [0, 1],
  [4, 2],
];
const TAIL_FROM = 1;

function strandPath(a: Pin, b: Pin, seed: number) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const sagK = 0.015 + rand(seed) * 0.09; // some taut, some slack
  const wob = (rand(seed + 1) - 0.5) * Math.min(26, len * 0.04);
  const c1 = { x: a.x + dx / 3 + nx * wob, y: a.y + dy / 3 + ny * wob + len * sagK };
  const c2 = { x: a.x + (2 * dx) / 3 - nx * wob * 0.6, y: a.y + (2 * dy) / 3 - ny * wob * 0.6 + len * sagK };
  return `M${a.x} ${a.y} C${c1.x} ${c1.y} ${c2.x} ${c2.y} ${b.x} ${b.y}`;
}

function BoardString({ gridRef, reduceMotion }: { gridRef: React.RefObject<HTMLDivElement>; reduceMotion: boolean }) {
  const [pins, setPins] = useState<Pin[]>([]);
  const [single, setSingle] = useState(false);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const segs = useRef<(SVGPathElement | null)[]>([]);
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const measure = () => {
      const els = Array.from(grid.children) as HTMLElement[];
      setSingle(new Set(els.map((e) => e.offsetLeft)).size === 1);
      setPins(
        els.map((el, i) => {
          const w = el.offsetWidth;
          const h = el.offsetHeight;
          // On the panel's edge, never over its copy: mostly along the top
          // edge at a varied x, sometimes a top corner, now and then the
          // upper part of a side edge.
          const r = rand(i + 7);
          const side = r > 0.8;
          const corner = !side && r > 0.6;
          const left = rand(i + 3) > 0.5;
          const x = side ? (left ? 0.02 : 0.98) : corner ? (left ? 0.05 : 0.95) : 0.3 + rand(i + 11) * 0.4;
          const y = side ? 0.12 + rand(i + 5) * 0.12 : 0.03 + rand(i + 5) * 0.02;
          return { x: el.offsetLeft + w * x, y: el.offsetTop + h * y };
        })
      );
      setSize({ w: grid.offsetWidth, h: grid.offsetHeight });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(grid);
    return () => ro.disconnect();
  }, [gridRef]);
  const paths = single || pins.length < 6 ? [] : [...STRANDS.map(([a, b], k) => strandPath(pins[a], pins[b], k * 5 + 2)),
    // A loose end: a short tail hanging off one pin.
    `M${pins[TAIL_FROM].x} ${pins[TAIL_FROM].y} q -30 -6 -46 -34`];
  // The thread draws itself, strand after strand, as the board comes up.
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const draw = () => {
      const r = grid.getBoundingClientRect();
      const t = reduceMotion ? 1 : Math.max(0, Math.min(1, (window.innerHeight * 0.95 - r.top) / (r.height * 0.9)));
      const n = segs.current.length;
      segs.current.forEach((el, i) => {
        if (!el) return;
        const local = Math.max(0, Math.min(1, t * n - i));
        el.style.strokeDashoffset = String(1 - local);
      });
    };
    draw();
    return subscribeGlide(draw);
  }, [gridRef, pins, reduceMotion]);
  segs.current.length = paths.length;
  const layer = (z: number): React.CSSProperties => ({ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none', zIndex: z });
  /* The strands run BEHIND the panels (Rajat: "not readable" when they
     crossed the copy), so they only show in the gaps between them; the pins
     sit on top, at the panels' edges, holding each strand where it dives
     under a panel. */
  return (
    <>
    <svg width={size.w} height={size.h} aria-hidden style={layer(0)}>
      {paths.map((d, i) => (
        <path
          key={i}
          ref={(el) => {
            segs.current[i] = el;
          }}
          d={d}
          pathLength={1}
          strokeDasharray="1 1"
          strokeDashoffset={1}
          fill="none"
          // Brand red and a touch heavier, so it reads in the gaps.
          stroke={RED}
          strokeWidth={i === paths.length - 1 ? 4 : 4.5}
          strokeLinecap="round"
        />
      ))}
    </svg>
    <svg width={size.w} height={size.h} aria-hidden style={layer(2)}>
      {pins.map((p, i) => (
        <PinHead key={i} p={p} r={11} />
      ))}
    </svg>
    </>
  );
}

const GREY_TEXT = '#9A9A9A';

function Headline({ size = 1 }: { size?: number }) {
  return (
    <h2 style={{ margin: 0 }}>
      <span
        style={{
          display: 'block',
          fontFamily: 'var(--font-hand)',
          // A touch bigger than the line beneath: the typewriter face is
          // size-adjusted to 78%, so this holds its weight against it.
          fontSize: `calc(${size} * clamp(42px, 6.9vw, 122px))`,
          fontWeight: 400,
          lineHeight: 1,
          color: GREY_TEXT,
        }}
      >
        Grey areas
      </span>
      <span
        style={{
          display: 'block',
          fontFamily: 'var(--font-sans)',
          fontSize: `calc(${size} * clamp(40px, 6.4vw, 112px))`,
          fontWeight: 500,
          letterSpacing: '-0.045em',
          lineHeight: 0.92,
        }}
      >
        we <span style={{ color: RED }}>love</span> to fix.
      </span>
    </h2>
  );
}

const COPY = 'Everyone can follow a rulebook. We read it, then go above and beyond. Turn a panel over to see what we bring to the table.';

function Cue({ style }: { style?: React.CSSProperties }) {
  return (
    <div
      style={{
        fontFamily: 'var(--font-hand)',
        fontSize: 'clamp(28px, 2.6vw, 46px)',
        fontWeight: 700,
        color: RED,
        transform: 'rotate(-4deg)',
        transformOrigin: 'left',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      turn one over &rarr;
    </div>
  );
}

/** The tally as a level gauge: six segments that fill red as panels are
 *  turned, like a danger meter (Rajat, 2026-10-17). `stamp` sets it as the
 *  rubber-stamp impression: typewriter, red, one line where it fits. */
function Tally({ count, verdict, stamp, style }: { count: number; verdict: string; stamp?: boolean; style?: React.CSSProperties }) {
  const on = stamp ? RED : count >= 3 ? RED : '#FFFFFF';
  return (
    <p
      aria-live="polite"
      style={{
        ...(stamp ? {} : label),
        margin: 0,
        color: on,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        ...(stamp
          ? { fontFamily: 'var(--font-hand)', fontSize: 'clamp(19px, 1.55vw, 25px)', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' as const, whiteSpace: 'nowrap' as const }
          : {}),
        ...style,
      }}
    >
      <span aria-hidden style={{ display: 'inline-flex', alignItems: 'stretch', gap: 2, padding: 2, border: `1.5px solid ${on}`, height: stamp ? 20 : 14, flex: 'none' }}>
        {FLAGS.map((_, i) => (
          <span
            key={i}
            style={{
              width: stamp ? 13 : 9,
              background: i < count ? RED : 'transparent',
              opacity: i < count ? 0.55 + (0.45 * (i + 1)) / FLAGS.length : 1,
              borderRight: i < FLAGS.length - 1 && i >= count ? `1px solid ${on}` : 'none',
              transition: 'background 0.3s, opacity 0.3s',
            }}
          />
        ))}
      </span>
      {verdict}
    </p>
  );
}

/* A: one compact editorial block on the left; the cards carry the right.
   B (default): the evidence board. The paragraph is a typed note pinned
   to the board beside the headline, the tally a red rubber stamp by it,
   and the cue the red handwritten aside under the headline. */
function FlagsHeader({ wide, count, verdict }: { wide: boolean; count: number; verdict: string }) {
  const variant = typeof location !== 'undefined' && new URLSearchParams(location.search).get('flags') === 'a' ? 'a' : 'b';
  const wrap: React.CSSProperties = {
    paddingBottom: 'clamp(1.5rem, 4vh, 2.5rem)',
    marginBottom: 'clamp(2rem, 5vh, 3.5rem)',
    borderBottom: '1px solid rgba(255,255,255,0.16)',
  };
  if (variant === 'a') {
    return (
      <div style={wrap}>
        <Headline />
        <div style={{ maxWidth: '44ch', marginTop: 'clamp(28px, 4.5vh, 56px)' }}>
          <p style={{ margin: 0, fontSize: 'clamp(15px, 1.15vw, 18px)', lineHeight: 1.6, opacity: 0.7 }}>{COPY}</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginTop: 'clamp(18px, 3vh, 28px)' }}>
            <Cue style={{ fontSize: 'clamp(24px, 2vw, 34px)' }} />
            <Tally count={count} verdict={verdict} />
          </div>
        </div>
      </div>
    );
  }
  const note = (
    // Right-aligned, out of the nav's centre lane (its 1red logo).
    <div style={{ position: 'relative', alignSelf: 'flex-start', marginLeft: wide ? 'auto' : 0, width: 'min(100%, 500px)', marginTop: wide ? 'clamp(6px, 1.5vh, 18px)' : 0 }}>
      <div
        style={{
          position: 'relative',
          background: '#F4EFE4',
          color: INK,
          padding: 'clamp(26px, 2.4vw, 34px) clamp(20px, 2vw, 28px) clamp(20px, 2vw, 26px)',
          fontFamily: 'var(--font-hand)',
          fontSize: 'clamp(19px, 1.6vw, 25px)',
          lineHeight: 1.55,
          transform: 'rotate(1.6deg)',
          boxShadow: '0 14px 30px rgba(0,0,0,0.5)',
        }}
      >
        <div style={grainLayer(0.08)} />
        <span style={{ position: 'relative' }}>{COPY}</span>
        <svg width="40" height="40" aria-hidden style={{ position: 'absolute', left: '50%', top: -6, marginLeft: -20, overflow: 'visible' }}>
          <PinHead p={{ x: 20, y: 12 }} r={10} />
        </svg>
      </div>
      {/* The tally as a red rubber stamp, slapped on by the note. */}
      <div
        style={{
          display: 'inline-block',
          marginTop: 18,
          marginLeft: wide ? 24 : 4,
          padding: '10px 16px',
          border: `2.5px solid ${RED}`,
          borderRadius: 4,
          transform: 'rotate(-5deg)',
          opacity: 0.92,
        }}
      >
        <Tally count={count} verdict={verdict} stamp />
      </div>
    </div>
  );
  return (
    <div style={{ ...wrap, display: 'flex', flexDirection: wide ? 'row' : 'column', alignItems: 'flex-start', gap: wide ? 'clamp(40px, 6vw, 120px)' : 22 }}>
      <div>
        <Headline />
        <Cue style={{ marginTop: 'clamp(14px, 2vh, 24px)' }} />
      </div>
      {note}
    </div>
  );
}

/* ─── The board as a collage (Rajat, 2026-10-17: "something NEW") ─────────
 * After the creative-brief collage ref: the headline is set big on the board
 * itself, the pinned note and the stamp sit among the cards, and the six
 * flags are scattered in mixed sizes (1 and 4 the big ones), each at its own
 * tilt, overlapping only at their corners so no card covers another's copy,
 * read 1 to 6 top-left to bottom-right. They drift into their spots as the
 * board comes up. Places are in % of the board's width (x, y and w), so the
 * collage scales as one piece; each card is drawn at a fixed design width
 * and scaled to its slot, so its type scales with it. Wide screens only;
 * phones keep the single column. */
const CARD_W = 440; // design width of a card, px
const SPOTS = [
  { x: 68, y: 1, w: 27, tilt: -3.2, drift: { x: 60, y: -30 } },
  { x: 4, y: 24, w: 24, tilt: 2.4, drift: { x: -60, y: 20 } },
  { x: 34, y: 26, w: 24, tilt: -1.6, drift: { x: 0, y: 50 } },
  { x: 66, y: 36, w: 30, tilt: 1.8, drift: { x: 50, y: 40 } },
  { x: 8, y: 48, w: 25, tilt: -2.4, drift: { x: -50, y: 60 } },
  { x: 38, y: 50, w: 24, tilt: 2.9, drift: { x: 20, y: 70 } },
];
const FIELD_H = 72; // board height, % of its width

function Collage({
  gridRef,
  count,
  verdict,
  open,
  reduceMotion,
  set,
}: {
  gridRef: React.RefObject<HTMLDivElement>;
  count: number;
  verdict: string;
  open: boolean[];
  reduceMotion: boolean;
  set: (i: number, v: boolean) => void;
}) {
  const fieldRef = useRef<HTMLDivElement>(null);
  const [fw, setFw] = useState(1200);
  useEffect(() => {
    const el = fieldRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setFw(el.offsetWidth));
    ro.observe(el);
    setFw(el.offsetWidth);
    return () => ro.disconnect();
  }, []);
  const pct = (v: number) => `${(v * fw) / 100}px`;
  return (
    <div ref={fieldRef} style={{ position: 'relative', width: '100%', height: pct(FIELD_H) }}>
      {/* Headline, on the board. */}
      <div style={{ position: 'absolute', left: pct(2), top: pct(0), zIndex: 1 }}>
        <Headline size={Math.min(1, fw / 1400) * 1.05} />
        <Cue style={{ marginTop: 'clamp(10px, 1.4vh, 18px)', fontSize: 'clamp(24px, 2.2vw, 38px)' }} />
      </div>
      {/* Pinned note and stamp, between the headline and card 1. */}
      <div style={{ position: 'absolute', left: pct(47), top: pct(1.5), width: pct(21), zIndex: 1 }}>
        <div
          style={{
            position: 'relative',
            background: '#F4EFE4',
            color: INK,
            padding: '26px 20px 20px',
            fontFamily: 'var(--font-hand)',
            fontSize: 'clamp(13px, 1vw, 17px)',
            lineHeight: 1.5,
            transform: 'rotate(1.8deg)',
            boxShadow: '0 14px 30px rgba(0,0,0,0.5)',
          }}
        >
          <div style={grainLayer(0.08)} />
          <span style={{ position: 'relative' }}>{COPY}</span>
          <svg width="40" height="40" aria-hidden style={{ position: 'absolute', left: '50%', top: -6, marginLeft: -20, overflow: 'visible' }}>
            <PinHead p={{ x: 20, y: 12 }} r={10} />
          </svg>
        </div>
        <div style={{ display: 'inline-block', marginTop: 16, marginLeft: 10, padding: '7px 11px', border: `2px solid ${RED}`, borderRadius: 4, transform: 'rotate(-5deg)', opacity: 0.92 }}>
          <Tally count={count} verdict={verdict} stamp style={{ fontSize: 'clamp(12px, 0.95vw, 16px)' }} />
        </div>
      </div>

      <BoardString gridRef={gridRef} reduceMotion={reduceMotion} />
      <div ref={gridRef} style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
        {SPOTS.map((sp, i) => {
          const k = ((sp.w / 100) * fw) / CARD_W;
          return (
            <div
              key={i}
              style={{ position: 'absolute', left: pct(sp.x), top: pct(sp.y), width: pct(sp.w), height: `${((sp.w / 100) * fw * 5) / 6}px` }}
            >
              <div style={{ width: CARD_W, transform: `scale(${k})`, transformOrigin: '0 0' }}>
                <Panel
                  i={i}
                  flipped={open[i]}
                  reduceMotion={reduceMotion}
                  tilt={sp.tilt}
                  drift={sp.drift}
                  onHover={(on) => set(i, on)}
                  onFlip={() => !window.matchMedia('(hover: hover)').matches && set(i, !open[i])}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── C: the deck slide (Rajat, 2026-10-17; ?flags=c, for reference) ────────────────────
 * After the ALOHA creative-brief deck (29.png) and the overlapping type and
 * card of 30.png. Pinned on a flat near-black field (no grain here). Left
 * ~45%: "Grey areas / we love to fix.", a big running counter 01-06 in his
 * numerals, then deck hairline rows with tiny red caps labels (FLAG:,
 * SYMPTOM:, WE SAY:) holding the current flag, and the level-bar stamp.
 * Right ~55%: the current flag as a big sharp-cornered slide, ~80% of the
 * frame's height. Each ~70vh of scroll throws the slide off (tilt and slide
 * out) as the next comes up from beneath, and the rows change in step, each
 * rising out of its mask. Scroll-driven and reversible, one clock. On a phone
 * the slide sits on top at full width, the rows below, the counter in a
 * corner. */
const PER_CARD_VH = 70;
const DECK_VH = PER_CARD_VH * 6 + 40; // six slides, then a short hold
const DECK_TILT = [-1.4, 1.1, -0.8, 1.3, -1.0, 0.7];
const FIELD = '#0A0A0A';

function scrollProgress(el: HTMLElement) {
  const vh = window.innerHeight;
  const top = el.getBoundingClientRect().top + glide.raw - glide.y;
  const run = el.offsetHeight - vh;
  return run <= 0 ? 0 : Math.max(0, Math.min(1, -top / run));
}

function Slide({ i, wide }: { i: number; wide: boolean }) {
  const f = FLAGS[i];
  return (
    <div style={{ position: 'absolute', inset: 0, background: PAPER, color: INK, padding: 'clamp(22px, 2.8vw, 48px)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      {/* Small caps label top-right, as on the deal's red card. */}
      <span style={{ ...DECK_CAPS, position: 'absolute', right: 'clamp(16px, 1.6vw, 26px)', top: 'clamp(14px, 1.4vw, 22px)', fontSize: 11, color: RED }}>
        Red flag {String(i + 1).padStart(2, '0')}
      </span>
      {/* Clear of the headline line that crosses onto the slide. */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: wide ? 'clamp(40px, 12vh, 150px)' : 14 }}>
        <Digit n={i + 1} height="clamp(44px, 6.5vh, 84px)" fill={INK} />
        <BoxFace mood={f.mood} variant="white" size="clamp(110px, 19vh, 220px)" delay={i} reduceMotion />
      </div>
      <div>
        <div style={{ fontFamily: 'var(--font-hand)', fontSize: 'clamp(26px, 3.4vh, 44px)', fontWeight: 700, color: RED, transform: 'rotate(-3deg)', transformOrigin: 'left', marginBottom: 10 }}>{NOTES[i]}</div>
        <p style={{ margin: 0, fontSize: 'clamp(24px, 4vh, 54px)', fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 1.04 }}>{f.flag}</p>
      </div>
    </div>
  );
}

const DECK_CAPS: React.CSSProperties = { fontFamily: 'var(--font-sans)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em' };

/** A deck row as in The Deal: full-width red hairline, tiny red caps label
 *  at its left end, a bold caps title and small right-aligned red caps body,
 *  rising out of its mask when the card changes. */
function DeckRow({ tag, title, body, k, narrow, hand }: { tag: string; title: React.ReactNode; body?: string; k: number; narrow: boolean; hand?: boolean }) {
  return (
    <div style={{ position: 'relative', borderTop: `1px solid ${RED}`, padding: narrow ? '18px 0 10px' : 'clamp(18px, 2.2vh, 24px) 0 clamp(8px, 1.2vh, 14px)', overflow: 'hidden' }}>
      <span style={{ ...DECK_CAPS, position: 'absolute', left: 0, top: 6, fontSize: 10, color: RED }}>{tag}</span>
      <motion.div
        key={k}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        style={{ display: 'grid', gridTemplateColumns: body && !narrow ? 'minmax(0, 1.3fr) minmax(0, 1fr)' : '1fr', alignItems: 'center', gap: 16 }}
      >
        <span
          style={
            hand
              ? { fontFamily: 'var(--font-hand)', fontWeight: 700, fontSize: narrow ? 22 : 'clamp(22px, 2vw, 36px)', color: RED, lineHeight: 1.1 }
              : { ...DECK_CAPS, fontSize: narrow ? 16 : 'clamp(16px, 1.45vw, 26px)', letterSpacing: '-0.01em', lineHeight: 1.05, color: '#FFFFFF' }
          }
        >
          {title}
        </span>
        {body && (
          <p style={{ ...DECK_CAPS, margin: 0, fontSize: narrow ? 10 : 'clamp(10px, 0.72vw, 12px)', lineHeight: 1.5, color: RED, textAlign: narrow ? 'left' : 'right', justifySelf: narrow ? 'start' : 'end', maxWidth: 300 }}>{body}</p>
        )}
      </motion.div>
    </div>
  );
}

function FlagsDeck({ wide, reduceMotion }: { wide: boolean; reduceMotion: boolean }) {
  const pinRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [cur, setCur] = useState(0);
  const curRef = useRef(0);
  useEffect(() => {
    const pin = pinRef.current;
    if (!pin) return;
    const draw = () => {
      const t = reduceMotion ? 0 : scrollProgress(pin);
      const x = t * (DECK_VH / PER_CARD_VH); // cards thrown, fractional
      const c = Math.max(0, Math.min(5, Math.floor(x + 0.5)));
      if (c !== curRef.current) {
        curRef.current = c;
        setCur(c);
      }
      cardRefs.current.forEach((el, i) => {
        if (!el) return;
        // Thrown off over 0.25..0.75 of its own step; the last stays.
        const f = i === 5 ? 0 : Math.max(0, Math.min(1, (x - i - 0.25) / 0.5));
        const e = f * f * (3 - 2 * f);
        const tx = e * 125; // % of its width, off to the right, away from the type
        const rot = DECK_TILT[i] + e * 16;
        // Waiting slides sit a touch lower and smaller, coming up from beneath.
        const wait = Math.max(0, Math.min(1, i - x + 0.75));
        const sc = 1 - 0.06 * wait;
        const ty = 4 * wait;
        el.style.transform = `translate(${tx.toFixed(2)}%, ${ty.toFixed(2)}%) rotate(${rot.toFixed(2)}deg) scale(${sc.toFixed(3)})`;
        el.style.opacity = f > 0.98 ? '0' : '1';
      });
    };
    draw();
    return subscribeGlide(draw);
  }, [wide, reduceMotion]);

  const f = FLAGS[cur];
  const count = cur + 1;
  const verdict = count < 3 ? `${count} spotted. Could be a phase.` : count < 6 ? `${count} spotted. Okay, we should talk.` : 'All six. We definitely need to talk.';
  const counter = (
    <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
      <Digit n={0} height={wide ? 'clamp(40px, 6.2vh, 72px)' : '40px'} fill={RED} />
      <div style={{ overflow: 'hidden' }}>
        <motion.div key={cur} initial={{ y: '100%' }} animate={{ y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
          <Digit n={cur + 1} height={wide ? 'clamp(40px, 6.2vh, 72px)' : '40px'} fill={RED} />
        </motion.div>
      </div>
    </div>
  );
  const rows = (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <DeckRow tag="Flag:" k={cur} narrow={!wide} title={f.flag} />
      <DeckRow tag="Symptom:" k={cur} narrow={!wide} title={NOTES[cur]} hand />
      <DeckRow tag="We say:" k={cur} narrow={!wide} title={f.who} body={f.us} />
      <div style={{ borderTop: `1px solid ${RED}` }} />
    </div>
  );
  const stamp = (
    <div style={{ display: 'inline-block', padding: '8px 12px', border: `2px solid ${RED}`, borderRadius: 4, transform: 'rotate(-4deg)', alignSelf: 'flex-start' }}>
      <Tally count={count} verdict={verdict} stamp style={wide ? undefined : { whiteSpace: 'normal' }} />
    </div>
  );
  const stack = (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {FLAGS.map((_, i) => (
        <div
          key={i}
          ref={(el) => {
            cardRefs.current[i] = el;
          }}
          style={{ position: 'absolute', inset: 0, zIndex: 10 - i, willChange: 'transform', boxShadow: '0 30px 60px rgba(0,0,0,0.5)' }}
        >
          <Slide i={i} wide={wide} />
        </div>
      ))}
    </div>
  );

  if (!wide) {
    return (
      <div ref={pinRef} style={{ position: 'relative', height: `${DECK_VH}vh`, background: FIELD }}>
        <div style={{ position: 'sticky', top: 0, height: '100vh', padding: '5rem 0 1rem', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <Headline size={0.72} />
            {counter}
          </div>
          <div style={{ position: 'relative', width: '100%', aspectRatio: '6 / 5' }}>{stack}</div>
          {rows}
          {stamp}
        </div>
      </div>
    );
  }
  return (
    <div ref={pinRef} style={{ position: 'relative', height: `${DECK_VH}vh`, background: FIELD }}>
      <div
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          display: 'grid',
          gridTemplateColumns: '45fr 55fr',
          gridTemplateRows: 'auto 1fr',
          columnGap: 'clamp(24px, 3vw, 56px)',
          padding: 'clamp(5.5rem, 10vh, 6.5rem) 0 clamp(1.25rem, 3vh, 2.25rem)',
          boxSizing: 'border-box',
        }}
      >
        {/* Huge, tight, interlocking, like the deal's "Putting / the red /
            in credible.": the last line runs over the slide's left edge. */}
        <h2 style={{ gridColumn: '1 / 3', gridRow: 1, position: 'relative', zIndex: 20, margin: 0, lineHeight: 0.9, pointerEvents: 'none' }}>
          <span style={{ display: 'block', fontFamily: 'var(--font-hand)', fontSize: 'clamp(44px, min(6.4vw, 10vh), 124px)', color: '#9A9A9A', lineHeight: 1 }}>Grey areas</span>
          <span style={{ display: 'block', fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 'clamp(48px, min(7vw, 11vh), 136px)', letterSpacing: '-0.05em', color: '#FFFFFF' }}>
            we love
          </span>
          {/* The line that crosses onto the white slide is red, so it reads
              on both the ink field and the card. */}
          <span style={{ display: 'block', paddingLeft: '30%', fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 'clamp(48px, min(7vw, 11vh), 136px)', letterSpacing: '-0.05em', color: RED }}>
            to fix.
          </span>
        </h2>
        <div style={{ gridColumn: 1, gridRow: 2, alignSelf: 'end', display: 'flex', flexDirection: 'column', gap: 'clamp(10px, 1.6vh, 18px)', position: 'relative', zIndex: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            {counter}
            {stamp}
          </div>
          {rows}
        </div>
        <div style={{ gridColumn: 2, gridRow: '1 / 3', alignSelf: 'center', justifySelf: 'end', position: 'relative', height: 'min(74vh, calc(100vh - 9rem))', aspectRatio: '6 / 5', maxWidth: '100%', transform: 'rotate(-1.2deg)' }}>
          {stack}
        </div>
      </div>
    </div>
  );
}

/* ─── D: the board pans (the /the-box EvidenceBoard camera, 2026-10-17) ─────
 * Pinned. The headline stays top-left while the board slides past right to
 * left: the typed note first, then the six flags pinned along ONE red thread
 * that draws itself just ahead of the camera, then the stamp. Cards sit a
 * little high and low of the thread in turn, apart from each other, so no
 * copy is ever covered. Phones get the same order as a vertical thread down
 * the left edge. */
const PAN_VH = 380;

function FlagsPan({ wide, open, set, count, verdict, reduceMotion }: { wide: boolean; open: boolean[]; set: (i: number, v: boolean) => void; count: number; verdict: string; reduceMotion: boolean }) {
  const pinRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const threadRef = useRef<SVGPathElement>(null);
  const [vw, setVw] = useState(() => window.innerWidth);
  useEffect(() => {
    const on = () => setVw(window.innerWidth);
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  const cw = Math.min(420, vw * 0.27);
  const gap = cw * 0.42;
  const noteW = Math.min(340, vw * 0.22);
  const startX = vw * 0.5; // the board starts half a screen in, under the headline's right
  const xs = FLAGS.map((_, i) => startX + noteW + gap + i * (cw + gap));
  const stampX = xs[5] + cw + gap;
  const trackW = stampX + 420 + vw * 0.1;
  const threadY = 0.5; // fraction of the track height
  useEffect(() => {
    if (!wide) return;
    const pin = pinRef.current;
    const track = trackRef.current;
    if (!pin || !track) return;
    const draw = () => {
      const t = reduceMotion ? 1 : scrollProgress(pin);
      const span = trackW - vw;
      track.style.transform = `translate3d(${(-span * t).toFixed(1)}px,0,0)`;
      // The thread draws a little ahead of the camera.
      if (threadRef.current) threadRef.current.style.strokeDashoffset = String(1 - Math.min(1, t * 1.08 + 0.08));
    };
    draw();
    return subscribeGlide(draw);
  }, [wide, trackW, vw, reduceMotion]);

  if (!wide) {
    // Phone: a vertical thread down the left edge, flags beside it.
    return (
      <div style={{ paddingTop: '5.5rem' }}>
        <Headline size={0.85} />
        <Cue style={{ fontSize: 24, marginTop: 10 }} />
        <p style={{ margin: '18px 0 0', fontSize: 15, lineHeight: 1.6, opacity: 0.7 }}>{COPY}</p>
        <div style={{ position: 'relative', marginTop: 26, paddingLeft: 26 }}>
          <div aria-hidden style={{ position: 'absolute', left: 8, top: 10, bottom: 10, width: 3, background: RED }} />
          {FLAGS.map((_, i) => (
            <div key={i} style={{ position: 'relative', marginBottom: 22 }}>
              <svg width="24" height="24" aria-hidden style={{ position: 'absolute', left: -30, top: 18, overflow: 'visible' }}>
                <PinHead p={{ x: 12, y: 12 }} r={9} />
              </svg>
              <Panel i={i} flipped={open[i]} reduceMotion={reduceMotion} onHover={(on) => set(i, on)} onFlip={() => set(i, !open[i])} />
            </div>
          ))}
          <div style={{ display: 'inline-block', padding: '8px 12px', border: `2px solid ${RED}`, borderRadius: 4, transform: 'rotate(-4deg)' }}>
            <Tally count={count} verdict={verdict} stamp style={{ whiteSpace: 'normal' }} />
          </div>
        </div>
      </div>
    );
  }
  const H = 1000; // thread drawn in a 0..H box mapped to the track height
  const pins = xs.map((x, i) => ({ x: x + cw / 2, y: i % 2 ? 0.58 : 0.42 }));
  const pts = [{ x: startX + noteW / 2, y: 0.4 }, ...pins, { x: stampX + 60, y: 0.5 }];
  let d = `M${pts[0].x} ${pts[0].y * H}`;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    d += ` Q${(a.x + b.x) / 2} ${((a.y + b.y) / 2) * H + 60} ${b.x} ${b.y * H}`;
  }
  return (
    <div ref={pinRef} style={{ position: 'relative', height: `${PAN_VH}vh` }}>
      <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden', marginLeft: 'calc(-1 * clamp(1rem, 4vw, 5rem))', marginRight: 'calc(-1 * clamp(1rem, 4vw, 5rem))' }}>
        <div style={{ position: 'absolute', left: 'clamp(1rem, 4vw, 5rem)', top: 'clamp(6rem, 13vh, 9rem)', zIndex: 3, pointerEvents: 'none' }}>
          <Headline size={0.9} />
          <Cue style={{ marginTop: 12, fontSize: 'clamp(24px, 2.2vw, 38px)' }} />
        </div>
        <div ref={trackRef} style={{ position: 'absolute', left: 0, top: '22vh', height: '72vh', width: trackW, willChange: 'transform' }}>
          <svg width={trackW} height="100%" viewBox={`0 0 ${trackW} ${H}`} preserveAspectRatio="none" aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'visible', zIndex: 0 }}>
            <path ref={threadRef} d={d} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1} fill="none" stroke={RED} strokeWidth={4} vectorEffect="non-scaling-stroke" strokeLinecap="round" />
          </svg>
          {/* The typed note opens the board. */}
          <div style={{ position: 'absolute', left: startX, top: '28%', width: noteW, transform: 'rotate(-1.8deg)', background: '#F4EFE4', color: INK, padding: '26px 20px 20px', fontFamily: 'var(--font-hand)', fontSize: 'clamp(14px, 1.05vw, 17px)', lineHeight: 1.5, boxShadow: '0 14px 30px rgba(0,0,0,0.5)', zIndex: 1 }}>
            <div style={grainLayer(0.08)} />
            <span style={{ position: 'relative' }}>{COPY}</span>
            <svg width="40" height="40" aria-hidden style={{ position: 'absolute', left: '50%', top: -6, marginLeft: -20, overflow: 'visible' }}>
              <PinHead p={{ x: 20, y: 12 }} r={10} />
            </svg>
          </div>
          {FLAGS.map((_, i) => (
            <div key={i} style={{ position: 'absolute', left: xs[i], top: `calc(${pins[i].y * 100}% - ${(cw * 5) / 6 * 0.12}px)`, width: cw, zIndex: 1 }}>
              <div style={{ width: CARD_W, transform: `scale(${cw / CARD_W})`, transformOrigin: '0 0' }}>
                <Panel i={i} flipped={open[i]} reduceMotion={reduceMotion} tilt={DECK_TILT[i]} drift={{ x: 0, y: 0 }} onHover={(on) => set(i, on)} onFlip={() => set(i, !open[i])} />
              </div>
              <svg width="30" height="30" aria-hidden style={{ position: 'absolute', left: '50%', top: -8, marginLeft: -15, overflow: 'visible', zIndex: 2 }}>
                <PinHead p={{ x: 15, y: 15 }} r={11} />
              </svg>
            </div>
          ))}
          <div style={{ position: 'absolute', left: stampX, top: '44%', padding: '10px 14px', border: `2px solid ${RED}`, borderRadius: 4, transform: 'rotate(-6deg)', zIndex: 1 }}>
            <Tally count={count} verdict={verdict} stamp />
          </div>
        </div>
      </div>
    </div>
  );
}


/* ─── The table (Rajat, 2026-10-17, the default) ──────────────────────────
 * The flags are cards dealt on a tiled table, seen from above, drawn like an
 * ink sketch with a grey marker wash (CC0 Poly Haven props rendered as ink
 * lines in Blender: see public/images/flags/CREDITS.md). Everything sits in
 * one screen: the headline, note, tally and CTA in red in the left tiles,
 * the six cards on the right 3x2 tiles. Hover lifts a card off the table
 * and turns it over. The stage is the drawing's own 1440x900 frame, scaled
 * to cover the screen, so the cards always sit on their tiles. */
const STAGE_W = 1440;
const STAGE_H = 900;
const CREAM = '#EFE8DA';
const TILE = { x0: 440, y0: 170, w: 320, h: 270 };
const CARD = { w: 292, h: 242 };
/** The drawing is 2400x1300 with the 1440x900 core in its middle. */
const CANVAS = { w: 2400, h: 1300 };
/** Scroll the table holds still before the hand-off to the deal. */
const TABLE_HOLD_VH = 90;
const TABLE_COPY = 'Everyone follows the rulebook. We read it, then go past it. Hover a card.';

function TableCard({ i, flipped, onHover, onFlip, reduceMotion }: { i: number; flipped: boolean; onHover: (on: boolean) => void; onFlip: () => void; reduceMotion: boolean }) {
  const f = FLAGS[i];
  const tilt = TILT[i];
  const x = TILE.x0 + (i % 3) * TILE.w + (TILE.w - CARD.w) / 2;
  const y = TILE.y0 + Math.floor(i / 3) * TILE.h + (TILE.h - CARD.h) / 2;
  const face: React.CSSProperties = { position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', border: `1.6px solid ${INK}`, boxSizing: 'border-box' };
  const inner: React.CSSProperties = { position: 'absolute', inset: 0, padding: '18px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' };
  return (
    <motion.button
      type="button"
      onClick={onFlip}
      onHoverStart={() => window.matchMedia('(hover: hover)').matches && !pageScrolling() && onHover(true)}
      onHoverEnd={() => window.matchMedia('(hover: hover)').matches && onHover(false)}
      aria-pressed={flipped}
      aria-label={`${f.flag} ${flipped ? 'The rulebook says: ' + f.rule + ' We say: ' + f.us : 'Turn over for the fix'}`}
      className={focusRing}
      initial={false}
      animate={{ rotate: flipped ? -1 : tilt, scale: flipped ? 1.07 : 1, y: flipped ? -12 : 0 }}
      transition={reduceMotion ? { duration: 0 } : { type: 'spring', bounce: 0.2, duration: 0.5 }}
      style={{ position: 'absolute', left: x, top: y, width: CARD.w, height: CARD.h, zIndex: flipped ? 3 : 1, perspective: 1200, background: 'none', border: 0, padding: 0, cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-sans)' }}
    >
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={reduceMotion ? { duration: 0 } : { type: 'spring', bounce: 0, duration: 0.7 }}
        style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d' }}
      >
        <div style={{ ...face, background: '#F8F4EC', boxShadow: flipped ? '10px 18px 0 rgba(10,10,10,0.16)' : '3px 4px 0 rgba(10,10,10,0.12)' }}>
          <div style={{ ...inner, color: INK }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <Digit n={i + 1} height={38} fill={INK} />
                <span style={{ ...label, fontSize: 11, opacity: 0.8, display: 'block', marginTop: 8 }}>Red flag</span>
              </div>
              <BoxFace mood={f.mood} variant="white" size="78px" delay={i} reduceMotion={reduceMotion} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-hand)', fontSize: 25, fontWeight: 700, color: RED, transform: 'rotate(-3deg)', transformOrigin: 'left', marginBottom: 4 }}>{NOTES[i]}</div>
              <p style={{ margin: 0, fontSize: 19, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{f.flag}</p>
            </div>
          </div>
        </div>
        <div style={{ ...face, transform: 'rotateY(180deg)', background: RED, boxShadow: '10px 18px 0 rgba(10,10,10,0.16)' }}>
          <div style={{ ...inner, color: '#FFFFFF' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
              <div>
                <span style={{ ...label, fontSize: 11, opacity: 0.9 }}>The rulebook says</span>
                <p style={{ margin: '4px 0 0', fontSize: 14, opacity: 0.9, textDecoration: 'line-through', textDecorationColor: INK, textDecorationThickness: 2 }}>{f.rule}</p>
              </div>
              <BoxFace mood="triumph" variant="white" size="64px" delay={i + 3} reduceMotion={reduceMotion} />
            </div>
            <div>
              <span style={{ fontFamily: 'var(--font-hand)', fontSize: 24, fontWeight: 700, color: INK, display: 'inline-block', transform: 'rotate(-3deg)' }}>we say:</span>
              <p style={{ margin: '4px 0 8px', fontSize: 16, fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1.15 }}>{f.us}</p>
              <span style={{ ...label, fontSize: 13, fontWeight: 600, color: INK }}>{f.who}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.button>
  );
}

function FlagsTable({ open, set, count, verdict, reduceMotion }: { open: boolean[]; set: (i: number, v: boolean) => void; count: number; verdict: string; reduceMotion: boolean }) {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    // Contain the 1440x900 core; the drawing runs on past it to fill any screen.
    const fit = () => setScale(Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H));
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);
  const red: React.CSSProperties = { position: 'absolute', color: RED, margin: 0 };
  return (
    // Pinned while the section scrolls TABLE_HOLD_VH past it, so the table
    // rests before the blocks to the deal begin (Rajat, 2026-10-17).
    <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden', background: CREAM }}>
      <div style={{ position: 'absolute', left: '50%', top: '50%', width: CANVAS.w, height: CANVAS.h, transform: `translate(-50%, -50%) scale(${scale})`, backgroundImage: 'url(/images/flags/table.jpg)', backgroundSize: '100% 100%' }}>
      <div style={{ position: 'absolute', left: (CANVAS.w - STAGE_W) / 2, top: (CANVAS.h - STAGE_H) / 2, width: STAGE_W, height: STAGE_H }}>
        <h2 style={{ ...red, left: 140, top: 186, width: 290 }}>
          <span style={{ display: 'block', fontFamily: 'var(--font-hand)', fontSize: 64, fontWeight: 400, lineHeight: 1 }}>Grey areas</span>
          <span style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: 58, fontWeight: 500, letterSpacing: '-0.045em', lineHeight: 0.92 }}>we love to fix.</span>
        </h2>
        {/* The note, the tally and the CTA share one tile (Rajat, 2026-10-17). */}
        <div style={{ position: 'absolute', left: 140, top: 458, width: 284, height: 236, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: RED }}>
          <p style={{ margin: 0, fontFamily: 'var(--font-hand)', fontSize: 18, lineHeight: 1.35 }}>{TABLE_COPY}</p>
          <div style={{ alignSelf: 'flex-start', padding: '6px 10px', border: `2.5px solid ${RED}`, borderRadius: 4, transform: 'rotate(-4deg)', transformOrigin: 'left' }}>
            <Tally count={count} verdict={verdict} stamp style={{ fontSize: 11, gap: 8 }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, whiteSpace: 'nowrap' }}>
            <p style={{ margin: 0, fontSize: 21, fontWeight: 500, letterSpacing: '-0.03em', lineHeight: 1.05 }}>
              Tell us what
              <br />
              you need.
            </p>
            <FillLink to="/contact" icon={<ArrowUpRight size={15} strokeWidth={2} />}>Let&rsquo;s talk</FillLink>
          </div>
        </div>
        {FLAGS.map((_, i) => (
          <TableCard
            key={i}
            i={i}
            flipped={open[i]}
            reduceMotion={reduceMotion}
            onHover={(on) => set(i, on)}
            onFlip={() => !window.matchMedia('(hover: hover)').matches && set(i, !open[i])}
          />
        ))}
      </div>
      </div>
    </div>
  );
}

export function RedFlags() {
  const reduceMotion = !!useReducedMotion();
  // `open`: which panels show their fix now. `seen`: which ever have; the tally counts those.
  const [open, setOpen] = useState<boolean[]>(() => FLAGS.map(() => false));
  const [seen, setSeen] = useState<boolean[]>(() => FLAGS.map(() => false));
  const count = seen.filter(Boolean).length;
  /* Layouts for Rajat to compare (2026-10-17): b (default) the pinned grid
     board, a its editorial header, c the deck, d the pan, collage the
     scattered board. */
  const flagsVariant = (() => {
    const v = new URLSearchParams(location.search).get('flags');
    // Default: the pinned 3x2 board (Rajat, 2026-10-17: "get it to what it
    // initially was, with all those pins"). c, d and collage stay for reference.
    // 2026-10-17 later (Rajat): the drawn table is the default; b = the old
    // pinned black board.
    return v === 'a' || v === 'b' || v === 'c' || v === 'd' || v === 'collage' ? v : 'table';
  })();
  const [wide, setWide] = useState(() => window.matchMedia('(min-width: 900px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 900px)');
    const on = () => setWide(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  /* Holds once its bottom reaches the frame's bottom, so the next card (The
     Deal) slides up over it: sticky with a negative top of its own height
     less the frame. */
  const sectionRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  // Soft landing: the board whole on screen (its grid centred, or the
  // section's pin point, whichever comes first).
  useEffect(() => {
    if (reduceMotion) return;
    return registerSoftStop(() => {
      const el = sectionRef.current;
      const g = gridRef.current;
      if (!el) return null;
      let top = 0;
      for (let n: HTMLElement | null = el; n; n = n.offsetParent as HTMLElement | null) top += n.offsetTop;
      // The deck and the pan: land where their pin starts.
      if (!g) return top;
      const vh = window.innerHeight;
      const centred = top + g.offsetTop + g.offsetHeight / 2 - vh / 2;
      return Math.min(centred, top + el.offsetHeight - vh);
    });
  }, [reduceMotion]);
  // Rises as a card over who-we-are, tilting in (Rajat: card, sharp corners).
  useTiltIn(sectionRef, reduceMotion);
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || reduceMotion) return;
    const fit = () => (el.style.top = `${Math.min(0, window.innerHeight - el.offsetHeight)}px`);
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    window.addEventListener('resize', fit);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', fit);
    };
  }, [reduceMotion]);
  const set = (i: number, v: boolean) => {
    setOpen((a) => a.map((x, j) => (j === i ? v : x)));
    if (v) setSeen((a) => a.map((x, j) => (j === i ? true : x)));
  };
  const verdict =
    count === 0
      ? 'Be honest. Hover the ones that hurt.'
      : count < 3
        ? `${count} spotted. Could be a phase.`
        : count < 6
          ? `${count} spotted. Okay, we should talk.`
          : 'All six. We definitely need to talk.';

  // The table needs a landscape screen; phones and tall screens get the board.
  const table = flagsVariant === 'table' && wide && window.innerWidth / window.innerHeight > 1.3;

  return (
    <section
      ref={sectionRef}
      aria-label="Red flags we fix"
      style={{
        position: reduceMotion ? 'relative' : 'sticky',
        zIndex: 2,
        // Slides up over the cube section's last pinned frame, like a card.
        // 205vh, not 100 (Rajat, 2026-10-17: "the card should already start
        // picking up here"): it starts rising while the who-we-are paragraph is
        // about 65% typed, so the screen is never half empty dots, and is still
        // below the paragraph when the typing finishes.
        marginTop: reduceMotion ? 0 : '-205vh',
        background: table ? '#EFE8DA' : '#0A0A0A',
        color: '#FFFFFF',
        borderRadius: 0, // 2026-10-17: Rajat, sharp corners
        boxShadow: '0 -30px 80px rgba(0,0,0,0.28)',
        // clip, not hidden: hidden makes this the scroll container and the
        // deck's and pan's sticky frames would never pin.
        overflow: 'clip',
        // Top clear of the fixed nav and its centred logo.
        height: table ? `calc(100vh + ${TABLE_HOLD_VH}vh)` : undefined,
        padding: table ? 0 : `${flagsVariant === 'c' || flagsVariant === 'd' ? '0' : 'clamp(7rem, 18vh, 12rem)'} clamp(1rem, 4vw, 5rem) clamp(5rem, 14vh, 10rem)`,
      }}
    >
      {table ? (
        <FlagsTable open={open} set={set} count={count} verdict={verdict} reduceMotion={reduceMotion} />
      ) : (
      /* Flat black field, no grain (Rajat, 2026-10-17). */
      <div style={{ maxWidth: 1400, margin: '0 auto', position: 'relative' }}>
        {flagsVariant === 'c' ? (
          <FlagsDeck wide={wide} reduceMotion={reduceMotion} />
        ) : flagsVariant === 'd' ? (
          <FlagsPan wide={wide} open={open} set={set} count={count} verdict={verdict} reduceMotion={reduceMotion} />
        ) : wide && flagsVariant === 'collage' ? (
          <Collage
            gridRef={gridRef}
            count={count}
            verdict={verdict}
            open={open}
            reduceMotion={reduceMotion}
            set={set}
          />
        ) : (
        <>
        <FlagsHeader wide={wide} count={count} verdict={verdict} />

        <div style={{ position: 'relative' }}>
        <BoardString gridRef={gridRef} reduceMotion={reduceMotion} />
        <div ref={gridRef} style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))', gap: 'clamp(18px, 2.2vw, 34px)' }}>
          {FLAGS.map((_, i) => (
            <Panel
              key={i}
              i={i}
              flipped={open[i]}
              reduceMotion={reduceMotion}
              onHover={(on) => set(i, on)}
              onFlip={() => !window.matchMedia('(hover: hover)').matches && set(i, !open[i])}
            />
          ))}
        </div>
        </div>
        </>
        )}

        <motion.div
          initial={false}
          animate={{ height: 'auto', opacity: 1 }}
          transition={{ type: 'spring', bounce: 0, duration: 0.6 }}
          style={{ overflow: 'hidden' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, flexWrap: 'wrap', marginTop: 'clamp(2rem, 5vh, 3rem)', paddingTop: 'clamp(1.25rem, 3vh, 2rem)', borderTop: '1px solid rgba(255,255,255,0.16)' }}>
            <p style={{ margin: 0, fontSize: 'clamp(22px, 2.4vw, 38px)', fontWeight: 500, letterSpacing: '-0.03em' }}>
              Tell us what you need.{' '}
              <span style={{ fontFamily: 'var(--font-hand)', fontWeight: 700, letterSpacing: 0, color: RED, whiteSpace: 'nowrap' }}>We&rsquo;ll handle the rest.</span>
            </p>
            <FillLink to="/contact" icon={<ArrowUpRight size={15} strokeWidth={2} />}>Let&rsquo;s talk</FillLink>
          </div>
        </motion.div>
      </div>
      )}
    </section>
  );
}
