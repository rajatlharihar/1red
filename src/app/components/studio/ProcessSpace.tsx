import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useReducedMotion } from 'motion/react';
import { process } from '../../data/process';
import { glide, subscribeGlide } from '../scrollGlide';
import { StudioProcess } from '../StudioProcess';

/* ─── The process, in depth ────────────────────────────────────────────────
 * The scene is the studio's own print (StudioProcess.tsx, after the
 * reference in .claude/refs/process-3d-space-red-panels-ref.png): tall red
 * panels in a pale room, small ink figures walking about them, a ladder, a
 * scribble on the ground. Here it stands up in space: five panels, one per
 * step, along the camera axis; scroll drives the camera forward on the
 * shared glide, steering onto each panel and passing it, and the next is
 * already in view beyond. After the fifth the camera runs on into open
 * space, and the next chapter arrives (`arrival`, see below).
 *
 * Built in CSS 3D rather than a canvas: the panels carry type, and type
 * stays crisp under a transform where a texture would not. A `perspective`
 * container is the lens; each panel is placed at its own depth and the
 * browser does the projection (scale = P / (P + depth)). The floor is one
 * plane laid flat through the screen plane, so the horizon sits at the
 * lens's own height and everything standing on it recedes correctly.
 * ────────────────────────────────────────────────────────────────────────── */

const INK = '#0A0A0A';
const RED = '#EA3323';
const RED_SOFT = '#FF5A4A';
const BG = '#FFFFFF';
const SKY = '#F2EFE8';
const FLOOR = '#E9E6DE';
const RULE = 'rgba(10,10,10,0.18)';

/** Scroll per step, plus the pinned viewport. */
const STEP_VH = 120;
const SECTION_VH = STEP_VH * process.length + 100;

/** The lens: CSS perspective distance in px. */
const P = 1200;
/** Depth between one card and the next, px. */
const D = 1200;
/** Lateral offset of a panel in WORLD units (share of the viewport width)
 *  at its own depth, alternating left/right. `SIDE_NEAR` is where the
 *  camera leaves it as it passes: just beside the axis, so the panel
 *  brushes past the lens rather than being run through head-on. */
const SIDE = 0.55;
const SIDE_NEAR = 0.16;
/** Where the floor meets the screen plane, as a share of the frame's
 *  height. The horizon is at 50%: the lens looks level. */
const FLOOR_Y = 0.8;
/** Camera depth at which the first card is still approaching (start) and
 *  how far past the last card's plane the camera runs on (end). */
const START_Z = -1.3 * D;
const RUN_OUT = 1.0 * D;
const TRAVEL = (process.length - 1) * D + P + RUN_OUT - START_Z;
/** Section progress at which the camera has crossed the last card: S2's
 *  cue. From here to 1 the frame is open space. */
export const EXIT_P = ((process.length - 1) * D + P - START_Z) / TRAVEL;
/** The next chapter waits at the end of the run: it is drawn in the stage
 *  a little short of the screen plane (about 92% size) as the last card
 *  clears, and settles onto it as the section unpins. Its depth is the
 *  camera's remaining run scaled by this, so it eases in rather than
 *  rushing up from half size. */
const ARRIVAL_K = 0.087;

/** A panel fades between these depths (negative: past the screen plane,
 *  toward the lens at -P) and is dropped just before the lens. */
const FADE_FROM = -0.86 * P;
const FADE_TO = -0.97 * P;
/** The panel's red clears earlier, once it has grown past the frame, so
 *  what is beyond is seen through it rather than a red stretch; its type
 *  goes only at the very end. */
const FILL_FROM = -0.3 * P;
const FILL_TO = -0.65 * P;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** Landscape cards from 768px; a phone gets a taller, near-full-width card. */
function useWide() {
  const [wide, setWide] = useState(() => typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const apply = () => setWide(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);
  return wide;
}

/** `arrival`: the chapter that follows (S2, the services grid). It rides in
 *  at the end of the camera's run inside the stage, then the same element in
 *  normal flow takes over on the frame the section unpins, where the two
 *  coincide pixel for pixel. */
export function ProcessSpace({ arrival }: { arrival?: ReactNode }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const stageArrivalRef = useRef<HTMLDivElement>(null);
  const flowArrivalRef = useRef<HTMLDivElement>(null);
  const wide = useWide();
  const groupRefs = useRef<Array<HTMLDivElement | null>>([]);
  const panelRefs = useRef<Array<HTMLDivElement | null>>([]);
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
      const camZ = START_Z + p * TRAVEL;
      const vw = window.innerWidth;
      /* A panel covers the whole frame from this depth on (its projected
         size exceeds the viewport both ways). Its fill may only clear from
         behind that point, so what it uncovers is never a switch. */
      const first = panelRefs.current[0];
      const coverDepth = first
        ? P / Math.max(vw / first.offsetWidth, window.innerHeight / first.offsetHeight) - P
        : FILL_FROM;
      const fillFrom = Math.min(FILL_FROM, coverDepth - 0.05 * P);
      if (stageArrivalRef.current && flowArrivalRef.current) {
        const depth = (TRAVEL + START_Z - camZ) * ARRIVAL_K;
        const landed = p >= 1;
        // Only there once the last panel has the frame covered: it is what
        // the panel's clearing fill reveals.
        const lastDepth = (process.length - 1) * D - camZ;
        stageArrivalRef.current.style.transform = `translate3d(0, 0, ${(-depth).toFixed(1)}px)`;
        stageArrivalRef.current.style.visibility = !landed && lastDepth <= coverDepth ? 'visible' : 'hidden';
        flowArrivalRef.current.style.visibility = landed ? 'visible' : 'hidden';
      }
      groupRefs.current.forEach((group, i) => {
        const panel = panelRefs.current[i];
        if (!group || !panel) return;
        const depth = i * D - camZ;
        if (depth < FADE_TO) {
          group.style.visibility = 'hidden';
          return;
        }
        group.style.visibility = 'visible';
        // Out to the side while waiting, in beside the axis as it becomes
        // the one in front: the camera steers onto each panel in turn.
        const sign = i % 2 === 0 ? -1 : 1;
        const side = sign * vw * (SIDE_NEAR + (SIDE - SIDE_NEAR) * smooth(0.15 * D, 1.0 * D, depth));
        group.style.transform = `translate(-50%, -100%) translate3d(${side.toFixed(1)}px, 0, ${(-depth).toFixed(1)}px)`;
        group.style.opacity = (1 - smooth(FADE_FROM, FADE_TO, depth)).toFixed(3);
        const fill = 1 - smooth(fillFrom, Math.min(FILL_TO, fillFrom - 0.3 * P), depth);
        panel.style.opacity = fill.toFixed(3);
        // Depth cue: a panel in the queue is drawn a little lighter and
        // comes up to full red as it arrives.
        const near = 1 - smooth(0.3 * D, 2.2 * D, depth);
        panel.style.filter = `saturate(${(0.7 + 0.3 * near).toFixed(3)}) brightness(${(1.12 - 0.12 * near).toFixed(3)})`;
      });
    });
  }, [reduceMotion]);

  if (reduceMotion) {
    // The print is the still version of the same scene.
    return (
      <>
        <StudioProcess />
        {arrival && <div style={{ background: BG, paddingTop: '6rem' }}>{arrival}</div>}
      </>
    );
  }

  return (
    <section style={{ position: 'relative', background: SKY, color: INK }}>
      <div ref={wrapRef} style={{ height: `${SECTION_VH}vh`, position: 'relative' }}>
        <div
          style={{
            position: 'sticky',
            top: 0,
            height: '100vh',
            overflow: 'hidden',
            perspective: `${P}px`,
            perspectiveOrigin: '50% 50%',
            background: SKY,
          }}
        >
          {/* The floor: one plane laid flat through the screen plane at
              FLOOR_Y, long enough both ways that neither edge ever shows.
              Plain colour, so it needs no motion of its own: the things
              standing on it carry the travel. */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: `${FLOOR_Y * 100}%`,
              width: '600vw',
              height: 24000,
              background: FLOOR,
              transform: 'translate(-50%, -50%) rotateX(90deg)',
              transformOrigin: '50% 50%',
              zIndex: 0,
            }}
          />
          {process.map((s, i) => (
            <div
              key={s.number}
              ref={(el) => {
                groupRefs.current[i] = el;
              }}
              style={{
                position: 'absolute',
                left: '50%',
                top: `${FLOOR_Y * 100}%`,
                // Nearer panels paint over farther ones. The camera always
                // passes them in order, so DOM stacking can do the sorting
                // (a preserve-3d stage cannot: overflow: hidden flattens it).
                zIndex: process.length - i + 1,
                willChange: 'transform, opacity',
                visibility: 'hidden',
              }}
            >
              <Panel
                step={s}
                index={i}
                wide={wide}
                panelRef={(el) => {
                  panelRefs.current[i] = el;
                }}
              />
            </div>
          ))}
          {arrival && (
            <div
              ref={stageArrivalRef}
              style={{
                position: 'absolute',
                inset: 0,
                overflow: 'hidden',
                background: BG,
                // Behind every panel: the last one passes over it, and its
                // clearing fill is what first shows it.
                zIndex: 1,
                willChange: 'transform',
              }}
            >
              <ArrivalFrame>{arrival}</ArrivalFrame>
            </div>
          )}
        </div>
      </div>
      {arrival && (
        <div ref={flowArrivalRef} style={{ position: 'relative', zIndex: 2, marginTop: '-100vh', background: BG, visibility: 'hidden' }}>
          <ArrivalFrame>{arrival}</ArrivalFrame>
        </div>
      )}
    </section>
  );
}

/** Same top padding in the stage and in flow, so the swap is seamless. */
function ArrivalFrame({ children }: { children: ReactNode }) {
  return <div style={{ paddingTop: 'clamp(5.5rem, 12vh, 9rem)' }}>{children}</div>;
}

/* ── The panel and what stands about it ────────────────────────────────── */

/* Ink silhouettes from the print (StudioProcess.tsx): 20 units tall, feet
   at the origin. */
const FIGURE_STAND = 'M-2.3-16.5h4.6v8.2h-1.3V0h-1.4v-7.4h-0.4V0h-1.4v-8.3h-0.1z';
const FIGURE_WALK = 'M-2.3-16.5h4.6v8.2l1.6 8.3h-1.5l-1.7-6.4L-0.6 0h-1.5l0.7-8.3h-0.9z';

function Figure({ x, y, walk = false, scale = 1, flip = false }: { x: number; y: number; walk?: boolean; scale?: number; flip?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})`}>
      <ellipse cx={-6} cy={0.6} rx={7.5} ry={1.4} fill={INK} opacity={0.32} transform="skewX(-38)" />
      <circle cx={0} cy={-19.5} r={2.3} fill={INK} />
      <path d={walk ? FIGURE_WALK : FIGURE_STAND} fill={INK} />
    </g>
  );
}

/* Who stands where, per step, in a 200-wide frame whose x = 100 is the
   panel's centre and y = 100 its foot. Walkers step in place. */
const CROWDS: Array<Array<{ x: number; y: number; walk?: boolean; scale?: number; flip?: boolean }>> = [
  [{ x: 62, y: 104, walk: true, scale: 1.1 }, { x: 128, y: 98, scale: 0.9 }],
  [{ x: 148, y: 106, walk: true, flip: true, scale: 1.15 }, { x: 88, y: 96, scale: 0.85 }, { x: 104, y: 99, scale: 0.85 }],
  [{ x: 40, y: 108, walk: true, scale: 1.2 }, { x: 130, y: 100, scale: 0.9 }],
  [{ x: 70, y: 104, scale: 1 }, { x: 84, y: 105, walk: true, scale: 1 }, { x: 150, y: 97, scale: 0.8, flip: true }],
  [{ x: 120, y: 106, walk: true, flip: true, scale: 1.15 }, { x: 56, y: 98, scale: 0.9 }],
];

/* Scribbles on the ground by each panel, in the same frame. */
const SCRIBBLES = [
  'M20 112 q30 -8 60 2 t70 -4',
  'M120 116 q20 -10 50 -2 q10 4 30 -6',
  'M10 118 q40 6 80 -6 q30 -8 70 4 q10 2 30 -4',
  'M150 110 q-40 8 -90 0',
  'M30 114 q30 -12 60 0 t60 -2 q12 4 34 -8',
];

function Panel({
  step,
  index,
  wide,
  panelRef,
}: {
  step: (typeof process)[number];
  index: number;
  wide: boolean;
  panelRef: (el: HTMLDivElement | null) => void;
}) {
  const left = index % 2 === 0; // the panel stands left of the axis; its caption reads on the right
  const w = wide ? 'min(18vw, 31vh)' : '44vw';
  return (
    <div style={{ position: 'relative', width: w, aspectRatio: '1 / 2.4' }}>
      {/* The red: two passes with a roughened edge, as on the print. */}
      <div ref={panelRef} style={{ position: 'absolute', inset: 0, willChange: 'opacity' }}>
        <svg viewBox="0 0 100 240" preserveAspectRatio="none" style={{ position: 'absolute', inset: '-3% -6%', width: '112%', height: '106%', overflow: 'visible' }}>
          <defs>
            <filter id={`ps-rough-${index}`} x="-10%" y="-10%" width="120%" height="120%">
              <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" seed={7 + index} result="n" />
              <feDisplacementMap in="SourceGraphic" in2="n" scale="2.2" xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </defs>
          <rect x={6} y={8} width={100} height={228} fill={RED_SOFT} opacity={0.5} filter={`url(#ps-rough-${index})`} transform={`rotate(${index % 2 ? 0.5 : -0.6} 56 122)`} />
          <rect x={5} y={7} width={100} height={228} fill={RED} filter={`url(#ps-rough-${index})`} transform={`rotate(${index % 2 ? -0.4 : 0.5} 55 121)`} />
        </svg>
        <span
          aria-hidden
          style={{
            position: 'absolute',
            left: '8%',
            top: '4%',
            fontFamily: 'var(--font-sans)',
            fontSize: wide ? 'clamp(64px, 9vw, 180px)' : '22vw',
            fontWeight: 800,
            letterSpacing: '-0.06em',
            lineHeight: 0.8,
            color: 'transparent',
            WebkitTextStroke: `clamp(1px, 0.12vw, 2px) ${SKY}`,
          }}
        >
          {step.number}
        </span>
      </div>

      {/* The crowd, the ladder on 04, the scribble: on the ground at the
          panel's foot, spilling either side of it. */}
      <svg
        viewBox="0 0 200 130"
        style={{ position: 'absolute', left: '-50%', bottom: '-11%', width: '200%', height: 'auto', overflow: 'visible', pointerEvents: 'none' }}
      >
        <path d={SCRIBBLES[index]} fill="none" stroke={INK} strokeWidth={0.9} strokeLinecap="round" />
        {index === 3 && (
          <g stroke={INK} strokeWidth={0.9} fill="none" transform="translate(74 10)">
            <line x1={0} y1={0} x2={-6} y2={92} />
            <line x1={14} y1={0} x2={8} y2={92} />
            {[10, 22, 34, 46, 58, 70, 82].map((y) => (
              <line key={y} x1={-y / 15} y1={y} x2={14 - y / 15} y2={y + 0.5} />
            ))}
          </g>
        )}
        {[[36, 118], [170, 122], [12, 126]].map(([x, y], k) => (
          <circle key={k} cx={x + index * 3} cy={y} r={0.8} fill={INK} />
        ))}
        {CROWDS[index].map((f, k) => (
          <Figure key={k} x={f.x} y={f.y} walk={f.walk} scale={f.scale} flip={f.flip} />
        ))}
      </svg>

      {/* The step, in ink beside the panel's foot. */}
      <div
        style={{
          position: 'absolute',
          bottom: '6%',
          ...(left ? { left: '112%' } : { right: '112%', textAlign: 'right' }),
          width: wide ? 'clamp(220px, 26vw, 420px)' : '46vw',
          color: INK,
        }}
      >
        <span
          style={{
            display: 'block',
            fontFamily: 'var(--font-sans)',
            fontSize: wide ? 'clamp(10px, 0.8vw, 13px)' : 10,
            fontWeight: 600,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: RED,
            marginBottom: '0.8em',
          }}
        >
          Step {step.number}
        </span>
        <h3 style={{ margin: 0, fontSize: wide ? 'clamp(28px, 3.4vw, 64px)' : '9vw', fontWeight: 800, letterSpacing: '-0.05em', lineHeight: 0.96 }}>{step.title}</h3>
        <p style={{ margin: '0.7em 0 0', fontSize: wide ? 'clamp(13px, 1vw, 17px)' : 13, lineHeight: 1.5, opacity: 0.65 }}>{step.description}</p>
      </div>
    </div>
  );
}
