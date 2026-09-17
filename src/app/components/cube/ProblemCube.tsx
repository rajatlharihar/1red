import { useCallback, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useReducedMotion } from 'motion/react';
import { CubeAssembly, CubeLighting, CAM_Z, FOV } from './CubeAssembly';
import { SCROLL_VH as HERO_VH, HANDOFF_P, TAIL_VH } from '../hero/StudioEntrance';
import { gapHalfFraction } from '../hero/studioSequence';
import { glide, subscribeGlide } from '../scrollGlide';

/* ─── Section 2: down an avenue, then many cubes become one ────────────────
 * No hand-off screen. The section is pulled up over the end of the hero so
 * it pins while the zoom through the "e" is still running: the avenue's
 * vanishing point sits in the gap over the splitting red, the hero goes
 * white underneath while the corridor of cubes slides past, and then the
 * rows turn, break up, gather and lock into one box. Progress comes from the same
 * glided scroll position as the hero, so the two stay in step at any scroll
 * speed, with no React re-renders.
 * ────────────────────────────────────────────────────────────────────────── */

/* Longer than the build alone needs: the avenue gets its own run of scroll
   before the rows turn. */
const SECTION_VH = 490;
const BG = '#FFFFFF';
/** How much of the hero's animated scroll this section sits on top of. */
const OVERLAP_VH = (1 - HANDOFF_P) * (HERO_VH - 100);
/** Section progress (from real scroll) where the hero's pin ends. */
const HERO_UNPIN = (OVERLAP_VH + TAIL_VH) / (SECTION_VH - 100);
/* See-through while the hero's red is still on screen, opaque white by the
   time the hero is fully white and starts to scroll away underneath. */
const BACKDROP_FROM = OVERLAP_VH * 0.3 / (SECTION_VH - 100);
const BACKDROP_TO = OVERLAP_VH * 0.9 / (SECTION_VH - 100);
/** Section progress per unit of the hero's own progress, for reading the
 *  hero's state at the hand-off. The hero animates over `HERO_VH - 100`. */
const HERO_PER_SECTION = (SECTION_VH - 100) / (HERO_VH - 100);
/* `gapHalfFraction` measures the square hole at the centre of the "e", but
   the slots running out of it are about 5% wider than that hole, which is
   what the clip actually has to follow (measured off the rendered hero at
   two points in the hand-off: 185px against 177px, then 251px against
   239px). A touch under that ratio, so the cubes never cross onto the red
   even if the model drifts. */
const GAP_SCALE = 1.03;

export function ProblemCube() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const clipRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const rawRef = useRef(0);
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
      rawRef.current = 1;
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
      rawRef.current = raw;
      progressRef.current = p;
      const domOffset = Math.max(0, top - glide.raw);
      offsetRef.current = domOffset;
      if (backdropRef.current) {
        const fade = (p - BACKDROP_FROM) / (BACKDROP_TO - BACKDROP_FROM);
        // Once the hero has really started scrolling away, never let it show.
        const heroMoving = (glide.raw - top) / scrollable >= HERO_UNPIN;
        backdropRef.current.style.opacity = String(heroMoving ? 1 : Math.max(0, Math.min(1, fade)));
      }
      /* Behind the "e", not over it: while the mark is still on screen the
         cubes are clipped to the gap between its blocks, so the mark occludes
         them and the widening gap reveals them. The gap outgrows the frame
         well before the mark does, so the clip lifts on its own and there is
         never a straight edge visible against white. */
      if (clipRef.current) {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const arm = gapHalfFraction(HANDOFF_P + raw * HERO_PER_SECTION) * (h / 2) * GAP_SCALE;
        if (arm >= Math.max(w, h) / 2 + domOffset) {
          clipRef.current.style.clipPath = '';
        } else {
          // The cross is centred on the viewport, which is `domOffset` above
          // this element's own top until the section pins.
          const cy = h / 2 - domOffset;
          const x0 = (w / 2 - arm).toFixed(1);
          const x1 = (w / 2 + arm).toFixed(1);
          const y0 = (cy - arm).toFixed(1);
          const y1 = (cy + arm).toFixed(1);
          clipRef.current.style.clipPath =
            `polygon(${x0}px 0, ${x1}px 0, ${x1}px ${y0}px, ${w}px ${y0}px, ${w}px ${y1}px, ` +
            `${x1}px ${y1}px, ${x1}px ${h}px, ${x0}px ${h}px, ${x0}px ${y1}px, 0 ${y1}px, ` +
            `0 ${y0}px, ${x0}px ${y0}px)`;
        }
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
          <div
            ref={backdropRef}
            style={{ position: 'absolute', inset: 0, background: BG, opacity: reduceMotion ? 1 : 0 }}
          />
          {/* Only the 3D layer is clipped to the gap. The backdrop above has
              to cover the whole frame once the hero goes white. */}
          <div ref={clipRef} style={{ position: 'absolute', inset: 0 }}>
            <Canvas
              frameloop={inView ? 'always' : 'never'}
              dpr={[1, 1.75]}
              gl={{ antialias: true, powerPreference: 'high-performance' }}
              camera={{ position: [0, 0, CAM_Z], fov: FOV }}
            >
              <CubeLighting />
              <CubeAssembly progressRef={progressRef} offsetRef={offsetRef} pointerRef={pointerRef} />
            </Canvas>
          </div>
        </div>
      </div>
    </section>
  );
}
