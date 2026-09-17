import { useCallback, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useReducedMotion } from 'motion/react';
import { CubeAssembly, CubeLighting, CAM_Z, FOV } from './CubeAssembly';
import { SCROLL_VH as HERO_VH, HANDOFF_P, TAIL_VH } from '../hero/StudioEntrance';
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

export function ProblemCube() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
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
      return;
    }
    return subscribeGlide(() => {
      const el = wrapRef.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top + glide.raw;
      const scrollable = el.offsetHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const p = Math.max(0, Math.min(1, (glide.y - top) / scrollable));
      progressRef.current = p;
      if (backdropRef.current) {
        const fade = (p - BACKDROP_FROM) / (BACKDROP_TO - BACKDROP_FROM);
        // Once the hero has really started scrolling away, never let it show.
        const heroMoving = (glide.raw - top) / scrollable >= HERO_UNPIN;
        backdropRef.current.style.opacity = String(heroMoving ? 1 : Math.max(0, Math.min(1, fade)));
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
          <Canvas
            frameloop={inView ? 'always' : 'never'}
            dpr={[1, 1.75]}
            gl={{ antialias: true, powerPreference: 'high-performance' }}
            camera={{ position: [0, 0, CAM_Z], fov: FOV }}
          >
            <CubeLighting />
            <CubeAssembly progressRef={progressRef} pointerRef={pointerRef} />
          </Canvas>
        </div>
      </div>
    </section>
  );
}
