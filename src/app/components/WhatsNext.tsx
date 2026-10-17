import { useRef, useState, useEffect } from 'react';
import { motion, useInView, useScroll, useTransform, useReducedMotion, type MotionValue } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { FillLink } from './home/FillLink';
import { Grain } from './home/Grain';
import { CONTACT_EMAIL } from './Footer';
import { registerSoftStop } from './SmoothScroll';

/* ─── INVITE — "Let's create" ──────────────────────────────────────────────
 * A sheet of paper. Behind the words, a pencil grid that scrolls slower
 * than the page and reaches a little way up over the previous section. On the
 * paper, one continuous pencil line, drawn as the section comes into view,
 * that turns into triangles and a zigzag around the headline, a small
 * figure holding the pen where it starts (in the language of the reference
 * Rajat gave: a person drawing the shapes they stand in). The drawings sit
 * on three depth layers, each with its own parallax rate and a slow drift
 * of its own, so the sheet reads as space rather than a print.
 * ────────────────────────────────────────────────────────────────────────── */

const EASE = [0.22, 1, 0.36, 1] as const;
const INK = '#0A0A0A';
const PAPER = '#FFFFFF';
const STROKE = 2.4;

/* Parallax: how far (px) a layer drifts for the section moving one viewport
   height through the frame. Negative lags the page, positive leads it. */
function useParallax(ref: React.RefObject<HTMLElement | null>, px: number, off = false): MotionValue<number> {
  const { scrollY } = useScroll();
  return useTransform(scrollY, () => {
    const el = ref.current;
    if (!el || off) return 0;
    const r = el.getBoundingClientRect();
    const centre = r.top + r.height / 2;
    return (centre / window.innerHeight - 0.5) * px;
  });
}

/* ─── Pencil ─────────────────────────────────────────────────────────────
 * The wobble is baked into the geometry: every segment is walked in small
 * steps and each point nudged by a little smooth noise, so no line is ruled
 * and nothing is filtered at draw time (an SVG filter under a parallax
 * re-rasterises every frame and stalled the page). */
const CELL = 96;
/** The sheet: 15 cells wide. It starts `SHEET_ABOVE` above the section, so
 *  the grid reaches a little way up over the end of the previous section. */
const SHEET_W = 1440;
const SHEET_ABOVE = 128;
const SHEET_H = 1100;
const VIEW = `0 -${SHEET_ABOVE} ${SHEET_W} ${SHEET_H}`;

function noise(t: number, seed: number) {
  return (
    Math.sin(t * 0.031 + seed) * 0.5 +
    Math.sin(t * 0.083 + seed * 1.7) * 0.3 +
    Math.sin(t * 0.21 + seed * 2.3) * 0.2
  );
}

/** Polyline through grid points, wobbled. `pts` are [col, row] pairs. */
function pencil(pts: Array<[number, number]>, amp: number, seed: number, close = false, step = 14): string {
  const P = close ? [...pts, pts[0]] : pts;
  let d = '';
  let t = 0;
  for (let i = 0; i < P.length - 1; i++) {
    const [ax, ay] = [P[i][0] * CELL, P[i][1] * CELL];
    const [bx, by] = [P[i + 1][0] * CELL, P[i + 1][1] * CELL];
    const len = Math.hypot(bx - ax, by - ay);
    const n = Math.max(1, Math.round(len / step));
    const nx = -(by - ay) / len;
    const ny = (bx - ax) / len;
    for (let k = i === 0 ? 0 : 1; k <= n; k++) {
      const u = k / n;
      const w = noise(t + u * len, seed) * amp;
      const x = ax + (bx - ax) * u + nx * w;
      const y = ay + (by - ay) * u + ny * w;
      d += (d ? ' L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
    }
    t += len;
  }
  return d;
}

/** A circle as a wobbled polygon, centre in grid units, radius in px. */
function pencilCircle(cx: number, cy: number, r: number, seed: number): string {
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2;
    pts.push([cx + (Math.cos(a) * r) / CELL, cy + (Math.sin(a) * r) / CELL]);
  }
  return pencil(pts, 1.2, seed, true, 6);
}

/* ─── The drawing, on the grid ──────────────────────────────────────────
 * Everything sits on the grid's intersections and half-cells. The figure
 * stands right of the words with the pen up; the line leaves the pen, makes
 * the triangle in the top-right corner, comes back down behind the figure
 * into a zigzag, runs under the buttons and ends in the left margin's
 * triangle. A loose triangle and a diamond sit on their own layers. */
const GRID = (() => {
  const out: string[] = [];
  for (let c = 0; c <= 15; c++) out.push(pencil([[c, -SHEET_ABOVE / CELL], [c, (SHEET_H - SHEET_ABOVE) / CELL]], 1.4, c * 3.1, false, 24));
  for (let r = -1; r <= 11; r++) out.push(pencil([[0, r], [15, r]], 1.4, 50 + r * 2.7, false, 24));
  return out.join(' ');
})();

const FIG_CX = 13;
const FIG_TOP = 4.85;
const FIGURE_FILLED = [
  pencilCircle(FIG_CX, FIG_TOP, 15, 3),
  // shirt with short sleeves
  pencil(
    [
      [FIG_CX - 0.22, FIG_TOP + 0.4], [FIG_CX + 0.22, FIG_TOP + 0.4], [FIG_CX + 0.38, FIG_TOP + 0.48],
      [FIG_CX + 0.43, FIG_TOP + 0.69], [FIG_CX + 0.3, FIG_TOP + 0.72], [FIG_CX + 0.32, FIG_TOP + 1.25],
      [FIG_CX - 0.32, FIG_TOP + 1.25], [FIG_CX - 0.3, FIG_TOP + 0.72], [FIG_CX - 0.43, FIG_TOP + 0.69],
      [FIG_CX - 0.38, FIG_TOP + 0.48],
    ],
    1.2, 5, true, 8
  ),
  // trousers, feet on the grid line at row 7
  pencil([[FIG_CX - 0.29, FIG_TOP + 1.25], [FIG_CX - 0.04, FIG_TOP + 1.25], [FIG_CX - 0.07, 7], [FIG_CX - 0.25, 7]], 1.2, 6, true, 8),
  pencil([[FIG_CX + 0.04, FIG_TOP + 1.25], [FIG_CX + 0.29, FIG_TOP + 1.25], [FIG_CX + 0.25, 7], [FIG_CX + 0.07, 7]], 1.2, 7, true, 8),
];
const FIGURE_LINES = [
  pencil([[FIG_CX, FIG_TOP + 0.16], [FIG_CX, FIG_TOP + 0.4]], 1, 8, false, 6),
  pencil([[FIG_CX - 0.37, FIG_TOP + 0.52], [FIG_CX - 0.46, FIG_TOP + 1.08], [FIG_CX - 0.37, FIG_TOP + 1.12]], 1.2, 9, false, 8),
  pencil([[FIG_CX + 0.35, FIG_TOP + 0.48], [FIG_CX + 0.4, FIG_TOP - 0.44], [FIG_CX + 0.48, FIG_TOP - 0.52]], 1.2, 10, false, 8),
  pencil([[FIG_CX + 0.4, FIG_TOP - 0.52], [FIG_CX + 0.5, FIG_TOP - 0.85]], 1, 11, false, 6),
];

const LINE = pencil(
  [
    // From his pencil tip, up and away to the left: never across him
    // (Rajat, 2026-10-06: it used to run through his head and legs).
    [13.5, 4], [14, 2.6], [13.2, 1.1], [11.4, 1.3], [10.2, 2.8], [10.6, 4.8], [9.6, 6.8], [7.5, 7.6],
    [4.5, 7.5], [2.5, 5.5], [1, 4.5], [2.5, 3], [1.5, 2],
  ],
  2.2, 21
);
const SHAPE_LEFT = pencil([[3.5, 0.5], [5, 0.25], [4.25, 1.5]], 2, 31, true);
const SHAPE_RIGHT = pencil([[1.5, 7.5], [2.5, 6.5], [3.5, 7.5], [2.5, 8.5]], 2, 41, true);

function Sheet({
  drawn,
  reduce,
  narrow,
  parallaxMid,
  parallaxNear,
  parallaxFar,
}: {
  drawn: MotionValue<number>;
  reduce: boolean;
  /** Phone: the sheet's crop would be a stray line through the buttons, so
   *  only the grid is drawn. */
  narrow: boolean;
  parallaxMid: MotionValue<number>;
  parallaxNear: MotionValue<number>;
  parallaxFar: MotionValue<number>;
}) {
  const stroke = { fill: 'none', stroke: INK, strokeWidth: STROKE, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  /* Each layer is a div carrying the parallax (a CSS transform) around an
     svg carrying the drift (also a CSS transform, on the svg element itself,
     never on a group inside it): both stay on the compositor, so the
     drawing is rasterised once and only moved. */
  // overflow visible: the props run past the svg's own box, and the parallax
  // used to show that cut edge as a hard line mid-section (2026-10-17).
  const layer = { position: 'absolute' as const, inset: 0, width: '100%', height: '100%', willChange: 'transform', overflow: 'visible' as const };
  const drift = (dur: number, dx: number, dy: number) =>
    reduce ? {} : { animate: { x: [0, dx, 0, -dx * 0.6, 0], y: [0, dy, -dy * 0.5, dy * 0.3, 0] }, transition: { duration: dur, repeat: Infinity, ease: 'easeInOut' as const } };
  const gridDrift = drift(17, -10, 8);

  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: `calc(-${SHEET_ABOVE} / ${SHEET_W} * 100vw)`,
        bottom: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        WebkitMaskImage: 'linear-gradient(180deg, transparent 0%, #000 30%)',
        maskImage: 'linear-gradient(180deg, transparent 0%, #000 30%)',
      }}
    >
      {/* far: red sticky notes */}
      {!narrow && (
        <motion.div style={{ ...layer, y: parallaxFar }}>
          <motion.svg viewBox={VIEW} preserveAspectRatio="xMidYMin slice" style={layer} {...drift(13, 8, -12)}>
            <motion.image href="/images/cta/notes.png" x={170} y={190} width={200} height={142} style={{ opacity: drawn }} />
          </motion.svg>
        </motion.div>
      )}

      {/* mid: the grid, and the figure with the line it draws, on the same
          parallax and drift so they never separate. The grid is its own svg,
          so the line drawing itself does not re-rasterise the grid. */}
      <motion.div style={{ ...layer, y: parallaxMid }}>
        <motion.svg viewBox={VIEW} preserveAspectRatio="xMidYMin slice" style={layer} {...gridDrift}>
          <path d={GRID} fill="none" stroke={INK} strokeWidth={1} strokeOpacity={0.09} strokeLinecap="round" />
        </motion.svg>
        {!narrow && (
          <motion.svg viewBox={VIEW} preserveAspectRatio="xMidYMin slice" style={layer} {...gridDrift}>
            {/* 2026-10-17 (Rajat): the stick figure became a megaphone drawn
                like the red flags table (ink lines, grey wash; CC0 Poly
                Haven model, see public/images/cta/CREDITS.md). */}
            <motion.image href="/images/cta/megaphone.png" x={1150} y={540} width={260} height={227} style={{ opacity: drawn }} />
          </motion.svg>
        )}
      </motion.div>

      {/* near: the box */}
      {!narrow && (
        <motion.div style={{ ...layer, y: parallaxNear }}>
          <motion.svg viewBox={VIEW} preserveAspectRatio="xMidYMin slice" style={layer} {...drift(9, 10, 8)}>
            <motion.image href="/images/cta/box.png" x={100} y={560} width={310} height={235} style={{ opacity: drawn }} />
          </motion.svg>
        </motion.div>
      )}
    </div>
  );
}

/* ─── Fill CTA (styles in theme.css) ────────────────────────────────────── */

/* ─── Main section ───────────────────────────────────────────────────────── */

export function WhatsNext() {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const inView = useInView(contentRef, { once: true, margin: '-80px' });
  const reduce = useReducedMotion() ?? false;
  // Soft landing: the closing CTA, whole on screen.
  useEffect(() => {
    if (reduce) return;
    return registerSoftStop(() => {
      const el = sectionRef.current;
      if (!el) return null;
      let top = 0;
      for (let n: HTMLElement | null = el; n; n = n.offsetParent as HTMLElement | null) top += n.offsetTop;
      return top + el.offsetHeight / 2 - window.innerHeight / 2;
    });
  }, [reduce]);
  // The sheet is composed for a wide frame; on a phone its crop is a stray
  // line through the buttons, so only the paper and grid remain there.
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const apply = () => setNarrow(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  // The line draws itself as the section rises into the frame.
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start end', 'center center'] });
  const drawn = useTransform(scrollYProgress, (v) => (reduce ? 1 : Math.min(1, v * 1.15)));

  const farY = useParallax(sectionRef, -30, reduce);
  const midY = useParallax(sectionRef, -70, reduce);
  const nearY = useParallax(sectionRef, 60, reduce);

  return (
    <section
      id="contact"
      ref={sectionRef}
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        zIndex: 2,
        paddingTop: 'clamp(4rem, 9vh, 7rem)',
        paddingBottom: 'clamp(6rem, 14vh, 10rem)',
        paddingLeft: 'clamp(1.5rem, 4vw, 5rem)',
        paddingRight: 'clamp(1.5rem, 4vw, 5rem)',
        background: `radial-gradient(70% 55% at 50% 100%, rgba(235,63,67,0.16), rgba(235,63,67,0) 70%), linear-gradient(180deg, #FFFFFF 0%, ${PAPER} 38%, ${PAPER} 100%)`,
        overflow: 'hidden',
      }}
    >
      <Grain opacity={0.22} blend="soft-light" />
      <Sheet drawn={drawn} reduce={reduce} narrow={narrow} parallaxFar={farY} parallaxMid={midY} parallaxNear={nearY} />
      {/* Merges into the deal above (Rajat, 2026-10-17: "it should merge
          here"): the grain and the grid fade in from the deal's white over
          the top 35vh, so there is no edge at the seam. */}
      <div aria-hidden style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '35vh', background: 'linear-gradient(#FFFFFF, rgba(255,255,255,0))', pointerEvents: 'none' }} />

      {/* ── Content ── */}
      <div
        ref={contentRef}
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          maxWidth: 1100,
          width: '100%',
        }}
      >
        {/* Setup in grey typewriter, payoff as the hero (Rajat, 2026-10-17:
            the site's grey-line pattern, like "Grey areas"). */}
        <div style={{ overflow: 'hidden' }}>
          <motion.p
            initial={{ y: '110%' }}
            animate={inView ? { y: 0 } : {}}
            transition={{ duration: 0.8, ease: EASE, delay: 0.04 }}
            style={{
              fontFamily: 'var(--font-hand)',
              fontSize: 'clamp(26px, 3.2vw, 54px)',
              lineHeight: 1.1,
              margin: 0,
              color: '#9A9A9A',
            }}
          >
            Grey&rsquo;s had its chance&hellip;
          </motion.p>
        </div>
        <div style={{ overflow: 'hidden', marginTop: 'clamp(10px, 1.6vh, 20px)' }}>
          <motion.h2
            initial={{ y: '110%' }}
            animate={inView ? { y: 0 } : {}}
            transition={{ duration: 0.9, ease: EASE, delay: 0.12 }}
            style={{
              fontSize: 'clamp(46px, 7vw, 132px)',
              fontWeight: 700,
              letterSpacing: '-0.05em',
              lineHeight: 0.95,
              margin: 0,
              color: INK,
            }}
          >
            <span style={{ color: '#EB3F43' }}>Red</span> does a <span style={{ whiteSpace: 'nowrap' }}>better job.</span>
          </motion.h2>
        </div>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.68, ease: EASE, delay: 0.24 }}
          style={{
            fontSize: 'clamp(14px, 1.2vw, 17px)',
            lineHeight: 1.72,
            opacity: 0.6,
            maxWidth: '48ch',
            marginTop: 'clamp(18px, 3vh, 28px)',
            marginBottom: 0,
            color: INK,
          }}
        >
          We&rsquo;re a creative agency for brands too ambitious to play it safe. Bring us the idea. We&rsquo;ll bring the whole team.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.68, ease: EASE, delay: 0.36 }}
          style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center', marginTop: 'clamp(22px, 3.4vh, 32px)' }}
        >
          <FillLink to="/contact" icon={<ArrowUpRight size={15} strokeWidth={2} />}>Start a project</FillLink>
          <FillLink to={`mailto:${CONTACT_EMAIL}?subject=Let%27s%20talk`} outline>Book a call</FillLink>
        </motion.div>
      </div>

      <motion.div
        initial={{ scaleX: 0 }}
        animate={inView ? { scaleX: 1 } : {}}
        transition={{ duration: 1, ease: EASE, delay: 0.6 }}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 'clamp(1.5rem, 4vw, 5rem)',
          right: 'clamp(1.5rem, 4vw, 5rem)',
          height: 1,
          background: 'rgba(10,10,10,0.1)',
          transformOrigin: 'left',
        }}
      />
    </section>
  );
}
