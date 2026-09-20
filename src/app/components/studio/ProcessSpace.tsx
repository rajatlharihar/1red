import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useReducedMotion } from 'motion/react';
import { process } from '../../data/process';
import { glide, subscribeGlide } from '../scrollGlide';
import { StudioProcess } from '../StudioProcess';
import { CUSTOM_DIGITS } from './customDigits';

/* ─── The process, in depth ────────────────────────────────────────────────
 * The scene is the studio's own print (StudioProcess.tsx, after the
 * reference in .claude/refs/process-3d-space-red-panels-ref.png): a 3 x 3
 * grid of tall red panels seen head-on in a pale room, small ink figures
 * about them, a ladder, scribbles on the ground. Here the grid has depth
 * by number: panel 01 stands nearest the lens, 02 a little further, and so
 * on to 05, with blank panels filling the other four slots. Scroll drives
 * the camera straight in on the shared glide, so the panels arrive and
 * pass in order, 01 first; 05 is the centre slot, and the camera passes
 * through it into the next chapter (`arrival`).
 *
 * Built in CSS 3D rather than a canvas: the panels carry type, and type
 * stays crisp under a transform where a texture would not. A `perspective`
 * container is the lens; each panel is placed at its own depth and the
 * browser does the projection (scale = P / (P + depth)). The grid reads as
 * a grid at the opening shot because every panel's world size and offset
 * are scaled by its own opening depth, so their projections line up.
 *
 * Performance: nothing that moves per frame carries a filter. The panels'
 * rough edges are static wobbly paths from a seeded PRNG; the figures are
 * plain paths; per frame only transforms and opacities change.
 * ────────────────────────────────────────────────────────────────────────── */

const INK = '#0A0A0A';
const RED = '#EA3323';
const RED_SOFT = '#FF5A4A';
const BG = '#FFFFFF';
const SKY = '#F2EFE8';
const FLOOR = '#E9E6DE';

/** Scroll per step, plus the pinned viewport. */
const STEP_VH = 120;
const SECTION_VH = STEP_VH * process.length + 100;

/** The lens: CSS perspective distance in px. */
const P = 1200;
/** Depth between one numbered panel and the next, px. */
const D = 1200;
/** Camera depth at the opening shot (panel 01 is this far ahead) and how
 *  far past the last panel's plane the camera runs on. */
const START_Z = -1.3 * D;
const RUN_OUT = 1.0 * D;
const TRAVEL = (process.length - 1) * D + P + RUN_OUT - START_Z;
/** Section progress at which the camera has crossed the last panel: S2's
 *  cue. From here to 1 the frame is open space. */
export const EXIT_P = ((process.length - 1) * D + P - START_Z) / TRAVEL;
/** The next chapter is drawn in the stage a little short of the screen
 *  plane (about 92% size) as the last panel clears, and settles onto it as
 *  the section unpins. */
const ARRIVAL_K = 0.087;

/** Where the floor meets the screen plane, as a share of the frame's
 *  height. The horizon is at 50%: the lens looks level. */
const FLOOR_Y = 0.8;

/** A panel fades between these depths (negative: past the screen plane,
 *  toward the lens at −P) and is dropped just before the lens. */
const FADE_FROM = -0.86 * P;
const FADE_TO = -0.97 * P;
/** The panel's red clears earlier, once it has grown past the frame, so
 *  what is beyond is seen through it rather than a red stretch. */
const FILL_FROM = -0.3 * P;
const FILL_TO = -0.65 * P;

/* ── The grid ───────────────────────────────────────────────────────────
 * Nine slots, columns −1/0/+1 and rows −1/0/+1, as they read at the
 * opening shot: `COL` and `ROW` are the slot pitch as shares of the frame's
 * width and height, `OPEN_W` a panel's projected width then. Numbered
 * panels take the print's stage slots, 05 at the centre so the camera
 * passes through it; blanks fill the rest at half-step depths. */
const COL = 0.115;
const ROW = 0.3;
const OPEN_W = 0.064;
const ASPECT = 2.4;
type Slot = { col: number; row: number; step?: number; z: number };
const SLOTS: Slot[] = [
  { col: -1, row: -1, step: 0, z: 0 },
  { col: 1, row: 0, step: 1, z: D },
  { col: -1, row: 0, step: 2, z: 2 * D },
  { col: 1, row: 1, step: 3, z: 3 * D },
  { col: 0, row: 0, step: 4, z: 4 * D },
  { col: 0, row: -1, z: 0.5 * D },
  { col: 1, row: -1, z: 1.5 * D },
  { col: -1, row: 1, z: 2.5 * D },
  { col: 0, row: 1, z: 3.5 * D },
];
/** Scale factor that makes a panel at opening depth `z − START_Z` project
 *  like one on the screen plane. */
const openK = (z: number) => 1 + (z - START_Z) / P;

/* The heading row leaves upward over this window of progress. */
const HEAD_FROM = 0.05;
const HEAD_TO = 0.16;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/* ── Drawing, all static ─────────────────────────────────────────────── */

function rng(seed: number) {
  let n = seed * 9301 + 49297;
  return () => ((n = (n * 9301 + 49297) % 233280) / 233280);
}

/** A panel's edge as the print has it: a rectangle whose sides wander a
 *  little, in a 100 x 240 box. Two of them, offset, make the double pass. */
function roughRect(seed: number, inset: number, j: number) {
  const r = rng(seed);
  const pts: Array<[number, number]> = [];
  const x0 = inset;
  const x1 = 100 - inset;
  const y0 = inset;
  const y1 = 240 - inset;
  const along = (a: [number, number], b: [number, number], n: number) => {
    for (let i = 0; i < n; i++) {
      const t = i / n;
      pts.push([a[0] + (b[0] - a[0]) * t + (r() - 0.5) * j, a[1] + (b[1] - a[1]) * t + (r() - 0.5) * j]);
    }
  };
  along([x0, y0], [x1, y0], 4);
  along([x1, y0], [x1, y1], 9);
  along([x1, y1], [x0, y1], 4);
  along([x0, y1], [x0, y0], 9);
  return 'M' + pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L') + 'Z';
}
const EDGES = SLOTS.map((_, i) => ({ a: roughRect(31 + i, 4, 2.4), b: roughRect(53 + i, 2, 3.2) }));

/* Ink silhouettes from the print: 20 units tall, feet at the origin. */
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

/* Who stands where, per slot, in a 200-wide frame whose x = 100 is the
   panel's centre and y = 100 its foot. */
const CROWDS: Array<Array<{ x: number; y: number; walk?: boolean; scale?: number; flip?: boolean }>> = [
  [{ x: 62, y: 104, walk: true, scale: 1.1 }, { x: 128, y: 98, scale: 0.9 }],
  [{ x: 148, y: 106, walk: true, flip: true, scale: 1.15 }, { x: 88, y: 96, scale: 0.85 }, { x: 104, y: 99, scale: 0.85 }],
  [{ x: 40, y: 108, walk: true, scale: 1.2 }, { x: 130, y: 100, scale: 0.9 }],
  [{ x: 70, y: 104, scale: 1 }, { x: 84, y: 105, walk: true, scale: 1 }, { x: 150, y: 97, scale: 0.8, flip: true }],
  [{ x: 120, y: 106, walk: true, flip: true, scale: 1.15 }, { x: 56, y: 98, scale: 0.9 }],
  [{ x: 110, y: 102, scale: 0.9 }],
  [],
  [{ x: 160, y: 104, walk: true, scale: 1 }],
  [{ x: 44, y: 100, scale: 0.85, flip: true }],
];
const SCRIBBLES = [
  'M20 112 q30 -8 60 2 t70 -4',
  'M120 116 q20 -10 50 -2 q10 4 30 -6',
  'M10 118 q40 6 80 -6 q30 -8 70 4 q10 2 30 -4',
  'M150 110 q-40 8 -90 0',
  'M30 114 q30 -12 60 0 t60 -2 q12 4 34 -8',
  '',
  'M60 114 q40 -6 80 2',
  '',
  'M20 110 q50 10 100 -4',
];

/** One of Rajat's numerals, from the sheet, at a given height: solid, as
 *  the letters are drawn (Rajat: a fill, not a stroke). */
function Digit({ n, height, fill }: { n: number; height: string; fill: string }) {
  const g = CUSTOM_DIGITS[n];
  return (
    <svg viewBox={`${g.x0} ${g.y0} ${g.w} ${g.h}`} style={{ height, width: 'auto', display: 'block', overflow: 'visible' }} fill={fill}>
      {g.paths.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}

function Panel({ slot, i, panelRef }: { slot: Slot; i: number; panelRef: (el: HTMLDivElement | null) => void }) {
  const step = slot.step != null ? process[slot.step] : null;
  const k = openK(slot.z);
  const w = `${(OPEN_W * k * 100).toFixed(2)}vw`;
  return (
    <div style={{ position: 'relative', width: w, aspectRatio: `1 / ${ASPECT}` }}>
      <div ref={panelRef} style={{ position: 'absolute', inset: 0, willChange: 'opacity' }}>
        <svg viewBox="0 0 100 240" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}>
          <path d={EDGES[i].b} fill={RED_SOFT} opacity={0.5} />
          <path d={EDGES[i].a} fill={RED} />
        </svg>
        {step && (
          <>
            <div style={{ position: 'absolute', left: '10%', top: '5%', height: '20%', display: 'flex', gap: '4%' }}>
              {step.number.split('').map((ch, j) => (
                <Digit key={j} n={Number(ch)} height="100%" fill={SKY} />
              ))}
            </div>
            {/* The step, set small on the red itself, on a 10% margin
                inside the panel, so it reads on every panel as it arrives
                rather than colliding at the feet. Sized to the panel, so
                it scales with it in depth. */}
            <div style={{ position: 'absolute', left: '10%', right: '10%', bottom: '8%', color: SKY, fontSize: `calc(${w} * 0.07)` }}>
              <span style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: '0.7em', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.85, marginBottom: '0.9em' }}>
                Step {step.number}
              </span>
              <h3 style={{ margin: 0, fontSize: '1.9em', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 0.98 }}>{step.title}</h3>
              <p style={{ margin: '0.8em 0 0', fontSize: '1em', lineHeight: 1.4, opacity: 0.9 }}>{step.description}</p>
            </div>
          </>
        )}
      </div>

      {/* The crowd, the ladder on 04, the scribble: on the ground at the
          panel's foot, spilling either side of it. */}
      <svg viewBox="0 0 200 130" style={{ position: 'absolute', left: '-50%', bottom: '-11%', width: '200%', height: 'auto', overflow: 'visible', pointerEvents: 'none' }}>
        {SCRIBBLES[i] && <path d={SCRIBBLES[i]} fill="none" stroke={INK} strokeWidth={0.9} strokeLinecap="round" />}
        {slot.step === 3 && (
          <g stroke={INK} strokeWidth={0.9} fill="none" transform="translate(74 10)">
            <line x1={0} y1={0} x2={-6} y2={92} />
            <line x1={14} y1={0} x2={8} y2={92} />
            {[10, 22, 34, 46, 58, 70, 82].map((y) => (
              <line key={y} x1={-y / 15} y1={y} x2={14 - y / 15} y2={y + 0.5} />
            ))}
          </g>
        )}
        {CROWDS[i].map((f, j) => (
          <Figure key={j} {...f} />
        ))}
      </svg>

    </div>
  );
}

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
  const headRef = useRef<HTMLDivElement>(null);
  const stageArrivalRef = useRef<HTMLDivElement>(null);
  const flowArrivalRef = useRef<HTMLDivElement>(null);
  const wide = useWide();
  const groupRefs = useRef<Array<HTMLDivElement | null>>([]);
  const panelRefs = useRef<Array<HTMLDivElement | null>>([]);
  const landedRef = useRef(false);
  const reduceMotion = useReducedMotion() ?? false;

  useEffect(() => {
    if (reduceMotion) return;
    return subscribeGlide(() => {
      const el = wrapRef.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top + glide.raw;
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      const scrollable = (SECTION_VH / 100 - 1) * vh;
      if (scrollable <= 0) return;
      const p = clamp01((glide.y - top) / scrollable);
      const camZ = START_Z + p * TRAVEL;

      if (headRef.current) {
        const t = smooth(HEAD_FROM, HEAD_TO, p);
        headRef.current.style.transform = `translate3d(0, ${(-t * 120).toFixed(2)}%, 0)`;
        headRef.current.style.opacity = (1 - t).toFixed(3);
      }

      /* The last panel (05, centre slot) covers the whole frame from this
         depth on. Its fill may only clear from behind that point, so what it
         uncovers is never a switch. */
      const last = panelRefs.current[4];
      const coverDepth = last ? P / Math.max(vw / last.offsetWidth, vh / last.offsetHeight) - P : FILL_FROM;
      const fillFrom = Math.min(FILL_FROM, coverDepth - 0.05 * P);
      if (stageArrivalRef.current && flowArrivalRef.current) {
        const depth = (TRAVEL + START_Z - camZ) * ARRIVAL_K;
        const landed = p >= 1;
        const lastDepth = SLOTS[4].z - camZ;
        stageArrivalRef.current.style.transform = `translate3d(0, 0, ${(-depth).toFixed(1)}px)`;
        stageArrivalRef.current.style.visibility = !landed && lastDepth <= coverDepth ? 'visible' : 'hidden';
        flowArrivalRef.current.style.visibility = landed ? 'visible' : 'hidden';
        /* Scrolling back: the flow copy's films have been playing, the
           stage copy's are stills. On the frame the stage takes over, seek
           each still to the frame its film is on, so nothing jumps; the
           film pauses where it is (it is hidden now) and resumes from that
           same frame when the page lands again. */
        if (landed !== landedRef.current) {
          landedRef.current = landed;
          if (!landed) {
            const stills = stageArrivalRef.current.querySelectorAll('video');
            const films = flowArrivalRef.current.querySelectorAll('video');
            films.forEach((film, i) => {
              const still = stills[i];
              if (still && Math.abs(still.currentTime - film.currentTime) > 0.02) still.currentTime = film.currentTime;
            });
          }
        }
      }

      groupRefs.current.forEach((group, i) => {
        const panel = panelRefs.current[i];
        if (!group || !panel) return;
        const slot = SLOTS[i];
        /* Past the lens a panel is held at the fade-out depth, invisible,
           rather than hidden: re-showing a hidden element this big costs a
           full re-raster (a 130 ms hitch on the way back up), while a
           layer that only changes opacity and transform stays cheap. */
        const depth = Math.max(slot.z - camZ, FADE_TO);
        const k = openK(slot.z);
        const x = slot.col * COL * vw * k;
        const y = slot.row * ROW * vh * k;
        group.style.transform = `translate(-50%, -50%) translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${(-depth).toFixed(1)}px)`;
        group.style.opacity = (1 - smooth(FADE_FROM, FADE_TO, depth)).toFixed(3);
        panel.style.opacity = (1 - smooth(fillFrom, Math.min(FILL_TO, fillFrom - 0.3 * P), depth)).toFixed(3);
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
        <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden', perspective: `${P}px`, perspectiveOrigin: '50% 50%', background: SKY }}>
          {/* The floor: one plane laid flat through the screen plane at
              FLOOR_Y, long enough both ways that neither edge ever shows. */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: `${FLOOR_Y * 100}%`,
              width: '600vw',
              height: 24000,
              background: FLOOR,
              transform: 'translate(-50%, -50%) rotateX(90deg)',
              zIndex: 0,
            }}
          />

          {SLOTS.map((slot, i) => (
            <div
              key={i}
              ref={(el) => {
                groupRefs.current[i] = el;
              }}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                // Nearer panels paint over farther ones; DOM stacking sorts
                // them, since overflow: hidden rules out a preserve-3d stage.
                zIndex: 20 - Math.round(slot.z / (D / 2)),
                willChange: 'transform, opacity',
                opacity: 0,
                pointerEvents: 'none',
              }}
            >
              <Panel
                slot={slot}
                i={i}
                panelRef={(el) => {
                  panelRefs.current[i] = el;
                }}
              />
            </div>
          ))}

          {/* The heading, two stacked words over the opening shot; it
              leaves upward as the first panel comes. */}
          <div
            ref={headRef}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 'clamp(6.5rem, 11vh, 9rem)',
              padding: '0 clamp(1.5rem, 4vw, 5rem)',
              display: 'grid',
              gridTemplateColumns: 'repeat(12, minmax(0, 1fr))',
              rowGap: 'clamp(14px, 2.4vh, 28px)',
              alignItems: 'start',
              zIndex: 30,
              pointerEvents: 'none',
              willChange: 'transform, opacity',
            }}
          >
            <h2 style={{ gridColumn: '1 / span 12', margin: 0, fontSize: 'clamp(40px, 6.4vw, 112px)', fontWeight: 800, letterSpacing: '-0.045em', lineHeight: 0.92 }}>
              Our
              <br />
              process
            </h2>
          </div>

          {arrival && (
            <div ref={stageArrivalRef} style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: BG, zIndex: 1, willChange: 'transform' }}>
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
