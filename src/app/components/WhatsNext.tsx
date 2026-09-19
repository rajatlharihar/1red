import { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { motion, useInView, useScroll, useTransform, useReducedMotion, type MotionValue } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';

/* ─── INVITE — "Let's create" ──────────────────────────────────────────────
 * A sheet of paper. Behind the words, a pencil grid that scrolls slower
 * than the page and reaches up over the tail of the cube section. On the
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

/* Pencil: every stroke is nudged by a little noise, so no line is ruled. */
function PencilFilter({ id, scale }: { id: string; scale: number }) {
  return (
    <filter id={id} x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves="3" seed="7" result="noise" />
      <feDisplacementMap in="SourceGraphic" in2="noise" scale={scale} xChannelSelector="R" yChannelSelector="G" />
    </filter>
  );
}

/* ─── The grid ─────────────────────────────────────────────────────────── */

function PencilGrid({ y }: { y: MotionValue<number> }) {
  const lines = useMemo(() => {
    const out: string[] = [];
    for (let x = 0; x <= 1440; x += 96) out.push(`M${x} 0 L${x} 1600`);
    for (let yy = 0; yy <= 1600; yy += 96) out.push(`M0 ${yy} L1440 ${yy}`);
    return out.join(' ');
  }, []);
  return (
    <motion.svg
      aria-hidden
      viewBox="0 0 1440 1600"
      preserveAspectRatio="xMidYMid slice"
      style={{ position: 'absolute', left: 0, right: 0, top: '-38vh', height: 'calc(100% + 38vh)', width: '100%', y }}
    >
      <defs>
        <PencilFilter id="pencil-grid" scale={2.2} />
        <linearGradient id="grid-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="white" stopOpacity="0" />
          <stop offset="0.28" stopColor="white" stopOpacity="1" />
          <stop offset="0.92" stopColor="white" stopOpacity="1" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <mask id="grid-mask">
          <rect width="1440" height="1600" fill="url(#grid-fade)" />
        </mask>
      </defs>
      <path
        d={lines}
        fill="none"
        stroke={INK}
        strokeWidth={1}
        strokeOpacity={0.085}
        strokeLinecap="round"
        filter="url(#pencil-grid)"
        mask="url(#grid-mask)"
      />
    </motion.svg>
  );
}

/* ─── The drawing ───────────────────────────────────────────────────────
 * One sheet, 1440 x 900. The figure stands right of centre, pen up; the
 * line leaves the pen, makes the big triangle top right, comes back through
 * the figure, makes the triangle on the left, then runs down into a zigzag
 * low right. Two loose shapes on their own layers frame the words. */

/* The figure: body shapes are filled with the paper colour and drawn after
   the line, so the line passes behind the person, as in the reference. */
const FIGURE_FILLED = [
  // head
  'M1250 462 a15 15 0 1 0 0.01 0',
  // shirt with short sleeves, hanging loose
  'M1229 500 L1271 500 L1287 508 L1292 528 L1279 531 L1281 582 L1219 582 L1221 531 L1208 528 L1213 508 Z',
  // trousers
  'M1222 582 L1246 582 L1243 690 L1226 690 Z',
  'M1254 582 L1278 582 L1274 690 L1257 690 Z',
];
const FIGURE_LINES = [
  // neck
  'M1250 477 L1250 500',
  // left arm hanging
  'M1214 512 L1206 566 L1214 570',
  // right arm straight up, hand, pen
  'M1284 508 L1288 420 L1296 412',
  'M1288 412 L1296 404 L1300 396',
  // feet
  'M1222 690 L1246 690',
  'M1254 690 L1278 690',
];

/* Out of the pen: a triangle in the top-right corner, back down behind the
   figure into a zigzag, then the long run under the buttons to the triangle
   in the left margin. */
const LINE =
  'M1300 396 L1206 120 L1420 72 L1382 300 L1262 476' +
  ' L1240 560 L1172 662 L1300 624 L1262 736 L1120 700' +
  ' L420 700 L250 520 L80 420 L250 300 L170 190';

const SHAPE_LEFT = 'M330 64 L472 40 L404 134 Z';
const SHAPE_RIGHT = 'M140 700 L222 640 L304 700 L222 762 Z';

function Sheet({
  drawn,
  reduce,
  parallaxMid,
  parallaxNear,
  parallaxFar,
}: {
  drawn: MotionValue<number>;
  reduce: boolean;
  parallaxMid: MotionValue<number>;
  parallaxNear: MotionValue<number>;
  parallaxFar: MotionValue<number>;
}) {
  const stroke = { fill: 'none', stroke: INK, strokeWidth: STROKE, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const drift = (dur: number, dx: number, dy: number) =>
    reduce ? {} : { animate: { x: [0, dx, 0], y: [0, dy, 0] }, transition: { duration: dur, repeat: Infinity, ease: 'easeInOut' as const } };

  return (
    <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {/* far: the loose triangle on the left */}
      <motion.svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', y: parallaxFar }}>
        <defs>
          <PencilFilter id="pencil-far" scale={2.6} />
        </defs>
        <motion.g filter="url(#pencil-far)" {...drift(11, 6, -10)}>
          <motion.path d={SHAPE_LEFT} {...stroke} style={{ pathLength: drawn }} />
        </motion.g>
      </motion.svg>

      {/* mid: the figure and the line it draws */}
      <motion.svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', y: parallaxMid }}>
        <defs>
          <PencilFilter id="pencil-mid" scale={2.2} />
        </defs>
        <motion.g filter="url(#pencil-mid)" {...drift(9, -4, 8)}>
          <motion.path d={LINE} {...stroke} style={{ pathLength: drawn }} />
          {FIGURE_FILLED.map((d) => (
            <path key={d} d={d} {...stroke} fill={PAPER} />
          ))}
          {FIGURE_LINES.map((d) => (
            <path key={d} d={d} {...stroke} />
          ))}
        </motion.g>
      </motion.svg>

      {/* near: the zigzag low right */}
      <motion.svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', y: parallaxNear }}>
        <defs>
          <PencilFilter id="pencil-near" scale={3} />
        </defs>
        <motion.g filter="url(#pencil-near)" {...drift(7, 8, 6)}>
          <motion.path d={SHAPE_RIGHT} {...stroke} style={{ pathLength: drawn }} />
        </motion.g>
      </motion.svg>
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

  const gridY = useParallax(sectionRef, -90, reduce);
  const farY = useParallax(sectionRef, -40, reduce);
  const midY = useParallax(sectionRef, 30, reduce);
  const nearY = useParallax(sectionRef, 90, reduce);

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
      <PencilGrid y={gridY} />
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {!narrow && <Sheet drawn={drawn} reduce={reduce} parallaxFar={farY} parallaxMid={midY} parallaxNear={nearY} />}
      </div>

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
