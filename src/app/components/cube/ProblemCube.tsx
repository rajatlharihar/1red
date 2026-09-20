import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useReducedMotion } from 'motion/react';
import { CubeAssembly, CubeLighting, CAM_Z, FOV, HERO_DONE } from './CubeAssembly';
import { MarkOccluder } from './MarkOccluder';
import { SCROLL_VH as HERO_VH, HANDOFF_P, TAIL_VH, budgetDpr } from '../hero/StudioEntrance';
import { glide, subscribeGlide } from '../scrollGlide';

/* ─── Section 2: down a tunnel, then many cubes become one ─────────────────
 * No hand-off screen. The section is pulled up over the end of the hero so
 * it pins while the zoom through the "e" is still running: the tunnel's
 * vanishing point sits in the gap over the splitting red, the hero goes
 * white underneath while the rings of cubes stream past, and then the
 * tunnel stops and its cubes gather and lock into one box. Progress comes
 * from the same glided scroll position as the hero, so the two stay in step
 * at any scroll speed, with no React re-renders.
 *
 * Behind the "e", not over it: this canvas draws a depth-only copy of the
 * mark at the hero's own projection (`MarkOccluder`), so the mark hides the
 * tunnel and its white backdrop with its true outline and every gap in it
 * reveals them. The hero's red shows through the transparent pixels.
 * ────────────────────────────────────────────────────────────────────────── */

/* Longer than the build alone needs: the tunnel gets its own run of scroll
   before the cubes gather. */
const SECTION_VH = 490;
const BG = '#FFFFFF';
const INK = '#0A0A0A';
/** The answer to the wall's question. Set as a Swiss poster: headline
 *  flush-left over two lines, a small label top-right, one hairline rule
 *  under the headline, and the box settling bottom-right off-centre. */
const LINES = ['Or hire', 'the whole box.'];
const LABEL = 'Every skill. One collective.';
/** Section progress over which each line rises out of its mask; the label
 *  rides with the first line, the rule draws after the second. */
const LINE_REVEAL: Array<[number, number]> = [
  [0.8, 0.9],
  [0.85, 0.95],
];
const RULE_REVEAL: [number, number] = [0.88, 0.99];
const smooth = (a: number, b: number, v: number) => {
  const t = Math.max(0, Math.min(1, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
/** How much of the hero's animated scroll this section sits on top of. */
const OVERLAP_VH = (1 - HANDOFF_P) * (HERO_VH - 100);
/** Section progress per unit of the hero's own progress, for reading the
 *  hero's state at the hand-off. The hero animates over `HERO_VH - 100`. */
const HERO_PER_SECTION = (SECTION_VH - 100) / (HERO_VH - 100);
/** Anchor pixel ratio like the hero: same pixel budget, so the two canvases
 *  drawn on top of each other at the hand-off stay inside the GPU. */
const MAX_DPR = 1.75;
export function ProblemCube() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const labelRef = useRef<HTMLSpanElement>(null);
  const ruleRef = useRef<HTMLDivElement>(null);
  // The grid: headline on eight of twelve columns beside the label on a
  // wide frame; on a phone the headline takes the full width and the label
  // sits under the rule, clear of the nav.
  const [wide, setWide] = useState(() => window.matchMedia('(min-width: 768px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const apply = () => setWide(mq.matches);
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);
  const progressRef = useRef(0);
  /** The hero's own progress at this scroll position, unclamped, so the
   *  canvas can place the mark where the hero has it and know when the
   *  frame behind the mark has gone white. */
  const heroPRef = useRef(0);
  /* How far the section's own canvas still sits below the viewport's top.
     Before the section pins it is not aligned with the viewport, so the
     tunnel would be drawn low of the gap; the camera and the clip are both
     shifted up by this, which lets the reveal start well before the pin
     instead of switching on at it. Driven by real scroll, not the glide,
     because it tracks where the DOM actually is. */
  const offsetRef = useRef(0);
  const pointerRef = useRef({ x: 0, y: 0 });
  const reduceMotion = useReducedMotion() ?? false;
  const [inView, setInView] = useState(false);
  const [dpr, setDpr] = useState(() => budgetDpr(MAX_DPR));
  useEffect(() => {
    const onResize = () => setDpr(budgetDpr(MAX_DPR));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver((e) => setInView(e[0].isIntersecting), { rootMargin: '160px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    // Reduced motion shows the finished box, no pin, no scrubbing.
    if (reduceMotion) {
      progressRef.current = 1;
      heroPRef.current = 2;
      offsetRef.current = 0;
      return;
    }
    return subscribeGlide(() => {
      const el = wrapRef.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top + glide.raw;
      const scrollable = el.offsetHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const raw = (glide.y - top) / scrollable;
      const p = Math.max(0, Math.min(1, raw));
      progressRef.current = p;
      heroPRef.current = HANDOFF_P + raw * HERO_PER_SECTION;
      offsetRef.current = Math.max(0, top - glide.raw);
      /* The sheet behind the canvas shows once the mark has gone (the canvas
         drops its own white plane at the same moment); the lines rise out
         of their masks as the box locks. */
      if (sheetRef.current) sheetRef.current.style.opacity = heroPRef.current >= HERO_DONE ? '1' : '0';
      lineRefs.current.forEach((el, i) => {
        if (!el) return;
        const t = smooth(LINE_REVEAL[i][0], LINE_REVEAL[i][1], p);
        el.style.transform = `translateY(${((1 - t) * 110).toFixed(2)}%)`;
      });
      if (labelRef.current) {
        const t = smooth(LINE_REVEAL[0][0], LINE_REVEAL[0][1], p);
        labelRef.current.style.transform = `translateY(${((1 - t) * 110).toFixed(2)}%)`;
      }
      if (ruleRef.current) {
        ruleRef.current.style.transform = `scaleX(${smooth(RULE_REVEAL[0], RULE_REVEAL[1], p).toFixed(4)})`;
      }
    });
  }, [reduceMotion]);

  // Cursor parallax only, so touch loses nothing.
  const onPointerMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (reduceMotion) return;
      const r = e.currentTarget.getBoundingClientRect();
      pointerRef.current = {
        x: ((e.clientX - r.left) / r.width - 0.5) * 2,
        y: ((e.clientY - r.top) / r.height - 0.5) * 2,
      };
    },
    [reduceMotion]
  );

  return (
    <section
      style={{
        position: 'relative',
        zIndex: 1,
        marginTop: reduceMotion ? 0 : `-${100 + OVERLAP_VH + TAIL_VH}vh`,
        background: reduceMotion ? BG : 'transparent',
      }}
    >
      <div ref={wrapRef} style={{ height: reduceMotion ? '100vh' : `${SECTION_VH}vh`, position: 'relative' }}>
        <div
          onMouseMove={onPointerMove}
          style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden' }}
        >
          {/* The sheet behind the canvas: white. Hidden until the mark has
              gone; until then the canvas paints its own white for the mark
              to cut. */}
          <div ref={sheetRef} style={{ position: 'absolute', inset: 0, background: BG, opacity: reduceMotion ? 1 : 0 }}>
            {/* The end state, after Rajat's own layout (.claude/refs/
                cube-end-state-layout-rajat.png): one hairline across the
                upper third, then one horizontal band: the headline
                flush-left, the box centre-right, and the label in a light
                weight immediately right of the box, centred on it. Lines
                rise out of masks as the box locks; the rule draws. */}
            <div
              ref={ruleRef}
              style={{
                position: 'absolute',
                left: '11%',
                right: '11%',
                top: wide ? '28vh' : '16vh',
                height: 1,
                background: 'rgba(10,10,10,0.35)',
                transformOrigin: 'left center',
                transform: reduceMotion ? 'none' : 'scaleX(0)',
              }}
            />
            <div
              aria-hidden={!reduceMotion}
              style={{
                position: 'absolute',
                left: '11%',
                top: wide ? '62vh' : '30vh',
                transform: 'translateY(-50%)',
                width: wide ? '44vw' : '78vw',
                pointerEvents: 'none',
                color: INK,
              }}
            >
              {LINES.map((line, i) => (
                <div key={line} style={{ overflow: 'hidden' }}>
                  <span
                    ref={(el) => {
                      lineRefs.current[i] = el;
                    }}
                    style={{
                      display: 'block',
                      fontSize: 'clamp(38px, 5.6vw, 92px)',
                      fontWeight: 500,
                      letterSpacing: '-0.03em',
                      lineHeight: 1.0,
                      transform: reduceMotion ? 'none' : 'translateY(110%)',
                    }}
                  >
                    {line}
                  </span>
                </div>
              ))}
            </div>
            <div
              style={{
                position: 'absolute',
                ...(wide ? { left: '82%', top: '62vh', transform: 'translateY(-50%)' } : { left: '11%', top: '80vh' }),
                overflow: 'hidden',
                pointerEvents: 'none',
              }}
            >
              <span
                ref={labelRef}
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 'clamp(13px, 1.3vw, 20px)',
                  fontWeight: 300,
                  letterSpacing: '0.02em',
                  textTransform: 'uppercase',
                  lineHeight: 1.3,
                  color: INK,
                  transform: reduceMotion ? 'none' : 'translateY(110%)',
                }}
              >
                Every skill.
                <br />
                One collective.
              </span>
            </div>
          </div>
          <div style={{ position: 'absolute', inset: 0 }}>
            <Canvas
              frameloop={inView ? 'always' : 'never'}
              dpr={dpr}
              gl={{ antialias: true, powerPreference: 'high-performance' }}
              camera={{ position: [0, 0, CAM_Z], fov: FOV }}
            >
              <CubeLighting />
              <CubeAssembly progressRef={progressRef} heroPRef={heroPRef} offsetRef={offsetRef} pointerRef={pointerRef} />
              {!reduceMotion && (
                <Suspense fallback={null}>
                  <MarkOccluder heroPRef={heroPRef} />
                </Suspense>
              )}
            </Canvas>
          </div>
        </div>
      </div>
    </section>
  );
}
