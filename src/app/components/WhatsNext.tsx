import { useRef, useState, useCallback, useEffect } from 'react';
import { motion, useInView, useScroll, useTransform, useReducedMotion, type MotionValue } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';

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
const PAPER = '#F7F4EE';
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
    [13.5, 4], [13, 1], [14.5, 0.5], [14, 3], [13, 5], [12.5, 6], [12, 7], [13.5, 6.5], [13, 8], [11.5, 7.5],
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
  const layer = { position: 'absolute' as const, inset: 0, width: '100%', height: '100%' };
  const drift = (dur: number, dx: number, dy: number) =>
    reduce ? {} : { animate: { x: [0, dx, 0, -dx * 0.6, 0], y: [0, dy, -dy * 0.5, dy * 0.3, 0] }, transition: { duration: dur, repeat: Infinity, ease: 'easeInOut' as const } };

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
      }}
    >
      {/* far: a loose triangle */}
      {!narrow && (
        <motion.svg viewBox={VIEW} preserveAspectRatio="xMidYMin slice" style={{ ...layer, y: parallaxFar }}>
          <motion.g {...drift(13, 8, -12)}>
            <motion.path d={SHAPE_LEFT} {...stroke} style={{ pathLength: drawn }} />
          </motion.g>
        </motion.svg>
      )}

      {/* mid: the grid, the figure and the line it draws, locked together */}
      <motion.svg viewBox={VIEW} preserveAspectRatio="xMidYMin slice" style={{ ...layer, y: parallaxMid }}>
        <motion.g {...drift(17, -10, 8)}>
          <path d={GRID} fill="none" stroke={INK} strokeWidth={1} strokeOpacity={0.09} strokeLinecap="round" />
          {!narrow && (
            <>
              <motion.path d={LINE} {...stroke} style={{ pathLength: drawn }} />
              {FIGURE_FILLED.map((d) => (
                <path key={d} d={d} {...stroke} fill={PAPER} />
              ))}
              {FIGURE_LINES.map((d) => (
                <path key={d} d={d} {...stroke} />
              ))}
            </>
          )}
        </motion.g>
      </motion.svg>

      {/* near: a diamond */}
      {!narrow && (
        <motion.svg viewBox={VIEW} preserveAspectRatio="xMidYMin slice" style={{ ...layer, y: parallaxNear }}>
          <motion.g {...drift(9, 10, 8)}>
            <motion.path d={SHAPE_RIGHT} {...stroke} style={{ pathLength: drawn }} />
          </motion.g>
        </motion.svg>
      )}
    </div>
  );
}

/* ─── Magnetic button ────────────────────────────────────────────────────── */

function MagneticButton({ children, primary = false }: { children: React.ReactNode; primary?: boolean }) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPos({
      x: (e.clientX - (rect.left + rect.width / 2)) * 0.3,
      y: (e.clientY - (rect.top + rect.height / 2)) * 0.3,
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHovered(false);
    setPos({ x: 0, y: 0 });
  }, []);

  return (
    <motion.button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      animate={{ x: pos.x, y: pos.y, scale: hovered ? 1.04 : 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28, mass: 0.8 }}
      className="btn-corners"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        paddingLeft: 36,
        paddingRight: 36,
        paddingTop: 18,
        paddingBottom: 18,
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: '0.09em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        border: primary ? 'none' : `1px solid rgba(10,10,10,0.28)`,
        background: primary ? (hovered ? 'rgba(20,20,20,1)' : INK) : hovered ? INK : 'transparent',
        color: primary ? 'white' : hovered ? 'white' : INK,
        transition: 'background 0.28s ease, color 0.28s ease',
        willChange: 'transform',
      }}
    >
      {children}
    </motion.button>
  );
}

/* ─── Main section ───────────────────────────────────────────────────────── */

export function WhatsNext() {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const inView = useInView(contentRef, { once: true, margin: '-80px' });
  const reduce = useReducedMotion() ?? false;
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
        paddingTop: 'clamp(6rem, 14vh, 10rem)',
        paddingBottom: 'clamp(6rem, 14vh, 10rem)',
        paddingLeft: 'clamp(1.5rem, 4vw, 5rem)',
        paddingRight: 'clamp(1.5rem, 4vw, 5rem)',
        background: `linear-gradient(180deg, rgba(247,244,238,0) 0%, ${PAPER} 22%, ${PAPER} 100%)`,
      }}
    >
      <Sheet drawn={drawn} reduce={reduce} narrow={narrow} parallaxFar={farY} parallaxMid={midY} parallaxNear={nearY} />

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
        }}
      >
        <div style={{ overflow: 'hidden', marginBottom: 28 }}>
          <motion.div
            initial={{ y: '110%' }}
            animate={inView ? { y: 0 } : {}}
            transition={{ duration: 0.62, ease: EASE }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 11,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              opacity: 0.42,
            }}
          >
            <span style={{ width: 6, height: 6, background: '#EA3323', display: 'inline-block' }} />
            Available for projects in 2026
          </motion.div>
        </div>

        <div style={{ overflow: 'hidden' }}>
          <motion.h2
            initial={{ y: '110%' }}
            animate={inView ? { y: 0 } : {}}
            transition={{ duration: 0.9, ease: EASE, delay: 0.04 }}
            style={{
              fontSize: 'clamp(64px, 12.5vw, 200px)',
              fontWeight: 800,
              letterSpacing: '-0.05em',
              lineHeight: 0.92,
              margin: 0,
              color: INK,
            }}
          >
            Let&rsquo;s create
          </motion.h2>
        </div>
        <div style={{ overflow: 'hidden' }}>
          <motion.h3
            initial={{ y: '110%' }}
            animate={inView ? { y: 0 } : {}}
            transition={{ duration: 0.84, ease: EASE, delay: 0.12 }}
            style={{
              fontSize: 'clamp(26px, 4vw, 60px)',
              fontWeight: 400,
              letterSpacing: '-0.03em',
              lineHeight: 1.05,
              margin: '10px 0 0',
              color: INK,
              opacity: 0.7,
            }}
          >
            what&rsquo;s next.
          </motion.h3>
        </div>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.68, ease: EASE, delay: 0.24 }}
          style={{
            fontSize: 'clamp(14px, 1.2vw, 17px)',
            lineHeight: 1.72,
            opacity: 0.5,
            maxWidth: 460,
            marginTop: 30,
            marginBottom: 0,
            color: INK,
          }}
        >
          We partner with ambitious brands to create experiences that stand out, scale faster, and leave a lasting
          impression.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.68, ease: EASE, delay: 0.36 }}
          style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center', marginTop: 44 }}
        >
          <MagneticButton primary>
            Start a project
            <motion.span whileHover={{ x: 2, y: -2 }} transition={{ duration: 0.25 }}>
              <ArrowUpRight size={15} strokeWidth={2} />
            </motion.span>
          </MagneticButton>
          <MagneticButton>Book a call</MagneticButton>
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
