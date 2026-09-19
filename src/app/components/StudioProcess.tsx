import { useRef, useState, useCallback } from 'react';
import { motion, useInView, useReducedMotion } from 'motion/react';
import { Link } from 'react-router';
import { ArrowUpRight } from 'lucide-react';
import { process } from '../data/process';

/* ─── /studio — the process as a print ───────────────────────────────────
 * The studio page is one composition (Rajat, 2026-09-20: "no more
 * yapology"): a 3 × 3 grid of red blocks on a cream sheet with a horizon,
 * after a collage reference he supplied. Nine blocks are printed with
 * rough, misregistered edges; five of them carry a stage of the process,
 * marked by a black numeral and a small scene (a balcony, a huddle, a
 * ladder, a wire). The copy for a stage shows only in the caption strip
 * when its block is hovered or tapped.
 *
 * Everything is one SVG in a 500 × 700 sheet so the grain, the rough
 * edges and the tiny figures scale together. Each block is a <button>
 * inside a <foreignObject>-free SVG: the <g> takes the role, and the
 * caption is live-region HTML under it.
 * ────────────────────────────────────────────────────────────────────────── */

const RED = '#EA3323';
const INK = '#0a0a0a';
const EASE = [0.22, 1, 0.36, 1] as const;

const HORIZON = 245;
/* The part of the sheet that is shown: cropped to the composition. */
const VIEW = { x: 40, y: 130, w: 420, h: 500 };

/* The nine blocks, from the reference: three narrow columns, three rows,
   each one nudged and tilted a little so the grid reads as pasted, not
   set. `stage` is the index into `process`, or none for a plain block. */
type Block = { x: number; y: number; w: number; h: number; rot: number; stage?: number };
const BLOCKS: Block[] = [
  { x: 150, y: 168, w: 58, h: 98, rot: -0.6, stage: 0 },
  { x: 228, y: 166, w: 54, h: 100, rot: 0.4 },
  { x: 302, y: 170, w: 56, h: 96, rot: -0.3 },
  { x: 152, y: 300, w: 56, h: 100, rot: 0.5, stage: 2 },
  { x: 229, y: 298, w: 55, h: 102, rot: -0.4, stage: 3 },
  { x: 303, y: 302, w: 55, h: 98, rot: 0.6, stage: 1 },
  { x: 154, y: 432, w: 56, h: 98, rot: -0.5 },
  { x: 230, y: 430, w: 54, h: 100, rot: 0.3 },
  { x: 304, y: 434, w: 56, h: 96, rot: -0.7, stage: 4 },
];

/* A standing silhouette, 20 units tall, feet at the origin. */
const FIGURE_STAND = 'M-2.3-16.5h4.6v8.2h-1.3V0h-1.4v-7.4h-0.4V0h-1.4v-8.3h-0.1z';
/* A walking silhouette, legs apart. */
const FIGURE_WALK = 'M-2.3-16.5h4.6v8.2l1.6 8.3h-1.5l-1.7-6.4L-0.6 0h-1.5l0.7-8.3h-0.9z';

function Figure({ x, y, walk = false, scale = 1, flip = false, shadow = true }: { x: number; y: number; walk?: boolean; scale?: number; flip?: boolean; shadow?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})`}>
      {shadow && <ellipse cx={-6} cy={0.6} rx={7.5} ry={1.4} fill={INK} opacity={0.32} transform="skewX(-38)" />}
      <circle cx={0} cy={-19.5} r={2.3} fill={INK} />
      <path d={walk ? FIGURE_WALK : FIGURE_STAND} fill={INK} />
    </g>
  );
}

export function StudioProcess() {
  const reduceMotion = useReducedMotion() ?? false;
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const [active, setActive] = useState(0);

  const pick = useCallback((stage: number | undefined) => {
    if (stage !== undefined) setActive(stage);
  }, []);

  const stamp = (i: number) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, scale: 1.05 },
          animate: inView ? { opacity: 1, scale: 1 } : {},
          transition: { type: 'spring' as const, bounce: 0, duration: 0.6, delay: 0.15 + i * 0.06 },
        };

  const fade = (delay: number) =>
    reduceMotion ? {} : { initial: { opacity: 0 }, animate: inView ? { opacity: 1 } : {}, transition: { duration: 0.8, delay, ease: EASE } };

  const current = process[active];

  return (
    <main
      ref={ref}
      style={{
        background: '#F2EFE8',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        color: INK,
      }}
    >
      {/* Paper grain over the whole page. A CSS overlay: SVG blend modes on
          a filtered rect were unreliable across browsers. */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='g'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' seed='11'/><feColorMatrix type='saturate' values='0'/></filter><rect width='220' height='220' filter='url(%23g)'/></svg>\")",
          opacity: 0.07,
          mixBlendMode: 'multiply',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Eyebrow row */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 'clamp(6rem, 12vh, 8rem) clamp(1.5rem, 4vw, 5rem) 0',
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          opacity: 0.45,
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span aria-hidden style={{ width: 6, height: 6, background: RED, borderRadius: 1 }} />
          Our process
        </span>
        <span>{String(process.length).padStart(2, '0')} stages</span>
      </div>

      {/* The sheet */}
      <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
        <svg
          viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`}
          role="group"
          aria-label="Our process, laid out as nine printed blocks"
          style={{ height: 'min(66vh, 760px)', maxWidth: '100%', display: 'block', overflow: 'visible' }}
        >
          {/* The horizon: the sheet's lower band is a shade darker, and runs
              off both edges of the page (the SVG overflows; main clips). */}
          <rect x={-6000} y={HORIZON} width={12000} height={6000} fill="#E9E6DE" />

          <defs>
            {/* Rough, printed edge: the block's outline is displaced by noise. */}
            <filter id="sp-rough" x="-10%" y="-10%" width="120%" height="120%">
              <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" seed="7" result="n" />
              <feDisplacementMap in="SourceGraphic" in2="n" scale="2.6" xChannelSelector="R" yChannelSelector="G" />
            </filter>
            <filter id="sp-rough2" x="-10%" y="-10%" width="120%" height="120%">
              <feTurbulence type="fractalNoise" baseFrequency="0.07" numOctaves="2" seed="3" result="n" />
              <feDisplacementMap in="SourceGraphic" in2="n" scale="2" xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </defs>

          {/* Blocks */}
          {BLOCKS.map((b, i) => {
            const isStage = b.stage !== undefined;
            const isActive = isStage && b.stage === active;
            const cx = b.x + b.w / 2;
            const cy = b.y + b.h / 2;
            return (
              <motion.g
                key={i}
                {...stamp(i)}
                style={{ transformOrigin: `${cx}px ${cy}px`, transformBox: 'view-box' } as React.CSSProperties}
              >
                <motion.g
                  role={isStage ? 'button' : undefined}
                  tabIndex={isStage ? 0 : undefined}
                  aria-label={isStage ? `${process[b.stage!].number} ${process[b.stage!].title}` : undefined}
                  aria-pressed={isStage ? isActive : undefined}
                  onPointerEnter={() => pick(b.stage)}
                  onFocus={() => pick(b.stage)}
                  onClick={() => pick(b.stage)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      pick(b.stage);
                    }
                  }}
                  animate={{ y: isActive ? -5 : 0 }}
                  transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
                  style={{ cursor: isStage ? 'pointer' : 'default', outline: 'none' }}
                  className={isStage ? 'focus-visible:[&>rect:first-child]:stroke-[#0a0a0a]' : undefined}
                >
                  {/* misregistered second pass: a lighter red printed a hair off */}
                  <rect
                    x={b.x + 1.6}
                    y={b.y - 1.2}
                    width={b.w}
                    height={b.h}
                    fill="#FF5A4A"
                    opacity={0.55}
                    filter="url(#sp-rough2)"
                    transform={`rotate(${b.rot} ${cx} ${cy})`}
                  />
                  <rect
                    x={b.x}
                    y={b.y}
                    width={b.w}
                    height={b.h}
                    fill={RED}
                    filter="url(#sp-rough)"
                    transform={`rotate(${b.rot} ${cx} ${cy})`}
                    stroke="transparent"
                    strokeWidth={1}
                  />
                  {isStage && (
                    <text
                      x={b.x - 4}
                      y={b.y + 30}
                      fill={INK}
                      fontFamily="var(--font-sans)"
                      fontWeight={800}
                      fontSize={30}
                      letterSpacing="-0.05em"
                      style={{ userSelect: 'none' }}
                    >
                      {b.stage! + 1}
                    </text>
                  )}
                </motion.g>
              </motion.g>
            );
          })}

          {/* Scenes: black ink over the print */}
          <motion.g {...fade(0.7)}>
            {/* 01 Discover: a balcony off the top-left block, someone looking out */}
            <g>
              <rect x={140} y={236} width={62} height={27} fill={INK} opacity={0.92} />
              <line x1={140} y1={216} x2={202} y2={216} stroke={INK} strokeWidth={1.3} />
              {[144, 154, 164, 174, 184, 194].map((x) => (
                <line key={x} x1={x} y1={216} x2={x} y2={236} stroke={INK} strokeWidth={1} />
              ))}
              <Figure x={188} y={216} scale={0.85} shadow={false} />
            </g>
            {/* a lone figure on the middle-top block */}
            <Figure x={318} y={262} scale={1} />
            <Figure x={253} y={228} scale={0.7} shadow={false} />

            {/* 02 Define: the huddle at the right edge */}
            <Figure x={344} y={344} scale={1.05} />
            <Figure x={356} y={336} scale={1.05} walk flip />
            <Figure x={366} y={348} scale={1.0} />

            {/* 03 Design: someone off to the left, taking it in */}
            <Figure x={68} y={432} scale={1.2} walk />

            {/* 04 Deliver: the ladder up the centre block */}
            <g stroke={INK} strokeWidth={1.1} fill="none">
              <line x1={222} y1={362} x2={222} y2={468} />
              <line x1={238} y1={360} x2={238} y2={466} />
              <line x1={254} y1={364} x2={254} y2={470} />
              <line x1={268} y1={362} x2={268} y2={468} />
              {[372, 386, 400, 414, 428, 442, 456].map((y) => (
                <line key={y} x1={218} y1={y} x2={272} y2={y + 1} />
              ))}
            </g>

            {/* 05 Refine: the figure on the bottom-right block, and the wire */}
            <Figure x={330} y={530} scale={1.2} walk flip />
            <g fill={INK}>
              {[[112, 500], [130, 470], [182, 470], [208, 462], [290, 578], [96, 604]].map(([x, y]) => (
                <circle key={`${x}-${y}`} cx={x} cy={y} r={1.6} />
              ))}
            </g>
          </motion.g>

          {/* The wire draws itself in. */}
          <motion.path
            d="M100 542 C 150 538, 180 548, 210 540 S 245 530, 262 522 C 268 518, 270 526, 262 528 S 250 524, 256 519 C 275 512, 300 528, 318 520 C 340 512, 362 526, 384 516 S 410 508, 424 512"
            fill="none"
            stroke={INK}
            strokeWidth={1.4}
            strokeLinecap="round"
            initial={reduceMotion ? { pathLength: 1 } : { pathLength: 0 }}
            animate={inView ? { pathLength: 1 } : {}}
            transition={{ duration: 1.6, delay: 0.9, ease: EASE }}
          />
          <rect x={258} y={527} width={8} height={4} fill={INK} transform="rotate(-20 262 529)" />
        </svg>
      </div>

      {/* Caption strip: the only copy on the page */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: '1.25rem 3rem',
          padding: '0 clamp(1.5rem, 4vw, 5rem) clamp(2.5rem, 5vh, 4rem)',
        }}
      >
        <div aria-live="polite" style={{ maxWidth: 520, minHeight: 84 }}>
          <div style={{ overflow: 'hidden' }}>
            <motion.h1
              key={current.number}
              initial={reduceMotion ? false : { y: '110%' }}
              animate={{ y: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
              style={{ display: 'flex', alignItems: 'baseline', gap: 14, fontSize: 'clamp(26px, 3vw, 40px)', fontWeight: 800, letterSpacing: '-0.035em', lineHeight: 1.05, margin: '0 0 8px' }}
            >
              <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.16em', opacity: 0.45, fontVariantNumeric: 'tabular-nums' } as React.CSSProperties}>
                {current.number}
              </span>
              {current.title}
            </motion.h1>
          </div>
          <motion.p
            key={`d-${current.number}`}
            initial={reduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 0.6, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08, ease: EASE }}
            style={{ fontSize: 14, lineHeight: 1.7, margin: 0, maxWidth: 420 }}
          >
            {current.description}
          </motion.p>
        </div>

        <Link
          to="/contact"
          className="group flex items-center gap-3 text-sm tracking-widest uppercase border border-black/20 btn-corners px-6 py-3 hover:border-black/60 transition-all duration-500"
          style={{ opacity: 0.7 }}
        >
          <span>Start a project</span>
          <ArrowUpRight size={14} strokeWidth={1.5} />
        </Link>
      </div>
    </main>
  );
}
