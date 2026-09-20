import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useReducedMotion } from 'motion/react';
import { process } from '../../data/process';
import { glide, subscribeGlide } from '../scrollGlide';

/* ─── The process, in depth ────────────────────────────────────────────────
 * Five flat cards stand one behind the other along the camera axis. Scroll
 * drives the camera forward on the shared glide: a card comes toward the
 * screen until it spans about 70% of the frame, then the camera passes
 * THROUGH it (it only fades in the last few percent before it crosses the
 * near plane) and the next one is already on its way. After the fifth the
 * camera keeps going into open space; that run-out is the hand-off to the
 * next chapter (S2), see `EXIT_P`.
 *
 * Built in CSS 3D rather than a canvas: the cards are type, and type stays
 * crisp under a transform where a texture would not. A `perspective`
 * container is the lens; each card is placed at its own depth and the
 * browser does the projection (scale = P / (P + depth)). A card's lateral
 * offset alternates left/right so the next one shows past the current, and
 * eases to zero as the card approaches, which is the camera steering onto
 * it: one continuous move, nothing snaps.
 * ────────────────────────────────────────────────────────────────────────── */

const INK = '#0A0A0A';
const RED = '#EA3323';
const BG = '#FFFFFF';
const RULE = 'rgba(10,10,10,0.18)';

/** Scroll per step, plus the pinned viewport. */
const STEP_VH = 120;
const SECTION_VH = STEP_VH * process.length + 100;

/** The lens: CSS perspective distance in px. */
const P = 1200;
/** Depth between one card and the next, px. */
const D = 1200;
/** Lateral offset of a waiting card, as a share of the viewport width, in
 *  WORLD units at its own depth: one card back it projects to 0.4 of the
 *  frame, which is what it takes to show past a card that spans 0.7 of it.
 *  Alternates left/right; eases to zero as the card becomes the current one. */
const SIDE = 0.8;
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

/** A card fades between these depths (negative: past the screen plane,
 *  toward the lens at -P) and is dropped just before the lens. */
const FADE_FROM = -0.86 * P;
const FADE_TO = -0.97 * P;
/** The card's white fill clears earlier, once the viewer is inside its
 *  rectangle and its type has left the frame, so the next card is seen
 *  through it rather than a blank white stretch; its edge and type still
 *  go only at the very end. */
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
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
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
      /* A card covers the whole frame from this depth on (its projected
         size exceeds the viewport both ways). Its fill may only clear from
         behind that point, so what it uncovers is never a switch. */
      const first = cardRefs.current[0];
      const coverDepth = first
        ? P / Math.max(vw / first.offsetWidth, window.innerHeight / first.offsetHeight) - P
        : FILL_FROM;
      const fillFrom = Math.min(FILL_FROM, coverDepth - 0.05 * P);
      if (stageArrivalRef.current && flowArrivalRef.current) {
        const depth = (TRAVEL + START_Z - camZ) * ARRIVAL_K;
        const landed = p >= 1;
        // Only there once the last card has the frame covered: it is what
        // the card's clearing fill reveals.
        const lastDepth = (process.length - 1) * D - camZ;
        stageArrivalRef.current.style.transform = `translate3d(0, 0, ${(-depth).toFixed(1)}px)`;
        stageArrivalRef.current.style.visibility = !landed && lastDepth <= coverDepth ? 'visible' : 'hidden';
        flowArrivalRef.current.style.visibility = landed ? 'visible' : 'hidden';
      }
      cardRefs.current.forEach((card, i) => {
        if (!card) return;
        const depth = i * D - camZ;
        if (depth < FADE_TO) {
          card.style.visibility = 'hidden';
          return;
        }
        card.style.visibility = 'visible';
        // Full offset while the card is still one step away, none once it
        // is the one in front: the camera steers onto each card in turn.
        const side = (i % 2 === 0 ? -1 : 1) * SIDE * vw * smooth(0.15 * D, 1.0 * D, depth);
        card.style.transform = `translate(-50%, -50%) translate3d(${side.toFixed(1)}px, 0, ${(-depth).toFixed(1)}px)`;
        card.style.opacity = (1 - smooth(FADE_FROM, FADE_TO, depth)).toFixed(3);
        card.style.backgroundColor = `rgba(255,255,255,${(1 - smooth(fillFrom, Math.min(FILL_TO, fillFrom - 0.3 * P), depth)).toFixed(3)})`;
        // Depth cue: a card in the queue is drawn lighter, hairline and ink
        // both, and comes up to full strength as it arrives.
        const near = 1 - smooth(0.3 * D, 2 * D, depth);
        card.style.borderColor = `rgba(10,10,10,${(0.3 + 0.7 * near).toFixed(3)})`;
        (card.firstElementChild as HTMLElement | null)?.style.setProperty('opacity', (0.6 + 0.4 * near).toFixed(3));
      });
    });
  }, [reduceMotion]);

  if (reduceMotion) {
    return (
      <section style={{ background: BG, color: INK, padding: 'clamp(4rem, 10vh, 8rem) clamp(1.5rem, 4vw, 5rem)' }}>
        {process.map((s) => (
          <div key={s.number} style={{ padding: '28px 0', borderTop: `1px solid ${RULE}` }}>
            <Card step={s} />
          </div>
        ))}
        {arrival && <div style={{ marginTop: '6rem' }}>{arrival}</div>}
      </section>
    );
  }

  return (
    <section style={{ position: 'relative', background: BG, color: INK }}>
      <div ref={wrapRef} style={{ height: `${SECTION_VH}vh`, position: 'relative' }}>
        <div
          style={{
            position: 'sticky',
            top: 0,
            height: '100vh',
            overflow: 'hidden',
            perspective: `${P}px`,
            perspectiveOrigin: '50% 50%',
          }}
        >
          {process.map((s, i) => (
            <div
              key={s.number}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: wide ? 'min(70vw, 1100px)' : '84vw',
                aspectRatio: wide ? '16 / 10' : '4 / 5',
                boxSizing: 'border-box',
                padding: 'clamp(18px, 2.6vw, 40px)',
                background: BG,
                border: `1px solid ${INK}`,
                // Nearer cards paint over farther ones. The camera always
                // passes them in order, so DOM stacking can do the sorting
                // (a preserve-3d stage cannot: overflow: hidden flattens it).
                zIndex: process.length - i,
                backfaceVisibility: 'hidden',
                willChange: 'transform, opacity',
                visibility: 'hidden',
              }}
            >
              <Card step={s} />
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
                // Behind every card: the last one passes over it, and its
                // clearing fill is what first shows it.
                zIndex: 0,
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

/** The number is the graphic: an outlined red numeral at display scale in
 *  the card's empty upper area; title and one line sit bottom-left. Sizes
 *  in vw so the type keeps its proportion to the card at every depth. */
function Card({ step }: { step: (typeof process)[number] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
      <span
        aria-hidden
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 'clamp(96px, 17vw, 300px)',
          fontWeight: 800,
          letterSpacing: '-0.06em',
          lineHeight: 0.8,
          marginLeft: '-0.04em',
          color: 'transparent',
          WebkitTextStroke: `clamp(1px, 0.12vw, 2px) ${RED}`,
        }}
      >
        {step.number}
      </span>
      <div>
        <span
          style={{
            display: 'block',
            fontFamily: 'var(--font-sans)',
            fontSize: 'clamp(11px, 1.1vw, 16px)',
            fontWeight: 600,
            letterSpacing: '0.24em',
            color: RED,
            marginBottom: 'clamp(8px, 1vw, 16px)',
          }}
        >
          Step {step.number}
        </span>
        <h3
          style={{
            margin: 0,
            fontSize: 'clamp(40px, 5.6vw, 92px)',
            fontWeight: 800,
            letterSpacing: '-0.05em',
            lineHeight: 0.96,
          }}
        >
          {step.title}
        </h3>
        <p
          style={{
            margin: 'clamp(10px, 1.4vw, 22px) 0 0',
            fontSize: 'clamp(14px, 1.25vw, 19px)',
            lineHeight: 1.5,
            opacity: 0.6,
            maxWidth: '46ch',
          }}
        >
          {step.description}
        </p>
      </div>
    </div>
  );
}
