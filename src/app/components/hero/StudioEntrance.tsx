import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { motion, useMotionValue, useTransform, useReducedMotion } from 'motion/react';
import { Logo } from '../Logo';
import { StudioScene } from './StudioScene';
import { glide, subscribeGlide } from '../scrollGlide';
import { HERO_FOV, RESTING_P } from './studioSequence';
import { extraGlideStops, getLenis, swallowWheel } from '../SmoothScroll';
import { EASINGS, tune } from '../scrollTune';

/* ─── ENTER 1RED — the studio's front door ─────────────────────────────────
 * Replaces the previous opening (a static logo with an idle bob and a
 * "Scroll" button wired to an element id that did not exist anywhere in the
 * document, so it did nothing when clicked).
 *
 * Structure follows the scroll-pin pattern already established across this
 * codebase (Studio.tsx's Process/Principles, FlashWork's proof section): a
 * tall wrapper, a sticky viewport inside it, and progress derived from the
 * wrapper's own position via one rAF-throttled passive listener.
 *
 * That progress is written to two places from a single handler:
 *   • a plain ref  → read inside useFrame, so the 3D scene never re-renders
 *   • a motion value → drives the DOM overlay, also without re-rendering
 * There is exactly one scroll listener and one source of truth.
 * ────────────────────────────────────────────────────────────────────────── */

const RED = '#EB3F43';
import { SCROLL_VH } from './heroLength';
export { SCROLL_VH };
/** Hero progress where section 2 takes over the screen: the "e" gap has
 *  swallowed most of the frame and the red is splitting past the edges. */
export const HANDOFF_P = 0.945;
/* Extra pinned scroll after the sequence ends. Section 2 sits on top by
   then; this keeps the hero from visibly sliding away under it when a fast
   scroll gets ahead of the glide. */
export const TAIL_VH = 100;

/* A pixel budget for the canvas rather than a fixed pixel ratio. On a 5K
   Retina iMac a full-window canvas at 2x is ~14.7M pixels per frame (plus
   MSAA buffers), which overwhelms a 2 GB laptop-class GPU and caused
   multi-second stalls. ~3.2M pixels keeps lines crisp at normal sizes and
   drops to ~1x only on very large windows. */
const PIXEL_BUDGET = 3.2e6;
export function budgetDpr(max: number) {
  // Phones: a small screen held close hides the difference between 1.3x and
  // 1.75x, and their GPUs feel it (2026-10-07 device pass).
  if (window.matchMedia('(pointer: coarse) and (max-width: 767px)').matches) max = Math.min(max, 1.3);
  const px = window.innerWidth * window.innerHeight;
  return Math.max(0.75, Math.min(max, window.devicePixelRatio || 1, Math.sqrt(PIXEL_BUDGET / px)));
}

function detectWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
  } catch {
    return false;
  }
}

/* Composed still for devices without WebGL. Keeps the story — a threshold,
   light beyond it, the mark inside — rather than showing a dead canvas. */
function EntranceFallback() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, #FFFFFF 0%, #FFFFFF 66%, #121110 66%, #121110 100%)',
        overflow: 'hidden',
      }}
    >
      {/* The triangular doorway, proportioned like the real one — wide at the
          floor, tapering to a point well above head height — with the mark
          visible inside it. */}
      <div
        style={{
          position: 'relative',
          width: 'min(46vw, 300px)',
          height: '66%',
          clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
          background: RED,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            clipPath: 'polygon(50% 7%, 93% 96%, 7% 96%)',
            background: '#F2EEE8',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            paddingBottom: '9%',
          }}
        >
          <Logo width={96} />
        </div>
      </div>
    </div>
  );
}

export function StudioEntrance() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  // Filled by the scene: requests a frame. The canvas only draws on demand.
  const invalidateRef = useRef<(() => void) | null>(null);
  const mv = useMotionValue(0);

  const reduceMotion = useReducedMotion() ?? false;
  const [webgl] = useState(detectWebGL);
  const [simplified, setSimplified] = useState(false);
  const [inView, setInView] = useState(true);
  const [dpr, setDpr] = useState(() => budgetDpr(2));
  useEffect(() => {
    const onResize = () => setDpr(budgetDpr(simplified ? 1.5 : 2));
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [simplified]);
  // The model streams in behind the closed doors, so the wait is hidden —
  // but the invitation to scroll is held back until the room is actually
  // there to walk into.
  const [, setReady] = useState(false);
  const handleReady = useCallback(() => setReady(true), []);

  // Mobile/low-power gets the same story with less to render, rather than
  // the desktop scene forced onto a phone.
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    const lowCore = (navigator.hardwareConcurrency ?? 8) <= 4;
    const apply = () => setSimplified(mq.matches || lowCore);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  // Suspend the render loop entirely once the entrance leaves the viewport —
  // otherwise it would keep drawing for the whole length of the homepage.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => setInView(entries[0].isIntersecting), { rootMargin: '120px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      progressRef.current = 1;
      mv.set(1);
      return;
    }
    return subscribeGlide(() => {
      const el = wrapRef.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top + glide.raw;
      const scrollable = (SCROLL_VH / 100 - 1) * window.innerHeight;
      const p = scrollable <= 0 ? 0 : Math.max(0, Math.min(1, (glide.y - top) / scrollable));
      progressRef.current = p;
      mv.set(p);
      invalidateRef.current?.();
    });
  }, [mv, reduceMotion]);

  /* One gesture per leg, both ways (Rajat, 2026-10-16/17: "one smooth
     scroll", "like a pushed disc"). The page has three landings: the top,
     the 1red mark (RESTING_P, before the zoom through the "e") and the
     settled box (registered by ProblemCube). Between the top and the box, a
     downward wheel, key or swipe glides ONE tween to the next landing below,
     an upward one to the previous. Gentle start and settle (scrollTune.ts),
     input locked while it runs, the trackpad's momentum tail swallowed after
     it lands so it never overshoots. Every scene reads Lenis's animated value
     in Lenis's frame (scrollGlide), so the tween is the only motion. A hard
     reverse push mid-glide eases the page to a stop. Past the box, scrolling
     is ordinary. */
  useEffect(() => {
    if (reduceMotion) return;
    let running: 1 | -1 | 0 = 0;
    const markY = () => {
      const el = wrapRef.current;
      if (!el) return null;
      const top = el.getBoundingClientRect().top + window.scrollY;
      return top + RESTING_P * (SCROLL_VH / 100 - 1) * window.innerHeight;
    };
    const flick = (t: number) => 1 - Math.pow(1 - t, 3);
    const go = (dir: 1 | -1, strength = 0) => {
      const lenis = getLenis();
      const mark = markY();
      if (!lenis || mark == null) return false;
      if (running) {
        // A hard push the other way: ease to a stop where the page is heading.
        if (dir !== running && strength > 40) {
          running = 0;
          const y = lenis.animatedScroll;
          lenis.scrollTo(y + lenis.velocity * 10, { duration: 0.7, easing: flick, force: true });
          swallowWheel(300);
        }
        return true;
      }
      const stops = [0, mark, ...extraGlideStops()].sort((a, b) => a - b);
      const y = lenis.animatedScroll;
      if (y > stops[stops.length - 1] + 8) return false; // past the box: ordinary scrolling
      const target = dir > 0 ? stops.find((v) => v > y + 4) : [...stops].reverse().find((v) => v < y - 4);
      if (target == null) return false;
      running = dir;
      lenis.scrollTo(target, {
        // The top-to-mark leg takes glideS; other legs scale with distance.
        duration: Math.min(tune.glideS, Math.max(1.2, tune.glideS * Math.sqrt(Math.abs(target - y) / mark))),
        easing: EASINGS[tune.glideEasing],
        lock: true,
        force: true,
        onComplete: () => {
          running = 0;
          swallowWheel(300);
        },
      });
      return true;
    };
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > 1) go(e.deltaY > 0 ? 1 : -1, Math.abs(e.deltaY));
    };
    const onKey = (e: KeyboardEvent) => {
      const down = ['ArrowDown', 'PageDown', ' ', 'Spacebar'].includes(e.key);
      const up = ['ArrowUp', 'PageUp', 'Home'].includes(e.key);
      if ((down || up) && go(down ? 1 : -1)) e.preventDefault();
    };
    let touchY: number | null = null;
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0]?.clientY ?? null;
    };
    // Touch scrolling is native (Lenis leaves it alone), so the swipe is taken
    // over by hand and native scrolling is held off until the glide lands.
    const onTouchMove = (e: TouchEvent) => {
      if (running) {
        e.preventDefault();
        return;
      }
      const y = e.touches[0]?.clientY;
      if (touchY == null || y == null || Math.abs(touchY - y) < 6) return;
      if (go(touchY > y ? 1 : -1)) e.preventDefault();
    };
    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('keydown', onKey);
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
    };
  }, [reduceMotion]);

  // Light floods the frame as the threshold is crossed, carrying straight
  // into the page background so the hand-off has no visible seam.
  const veilOpacity = useTransform(mv, [0.965, 1], [0, 1]);


  return (
    <div ref={wrapRef} style={{ height: reduceMotion ? '100vh' : `${SCROLL_VH + TAIL_VH}vh`, position: 'relative' }}>
      <div
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflow: 'hidden',
          background: '#E4DFD8',
        }}
      >
        {webgl ? (
          <Canvas
            // Draw only when something moves: on scroll, and while the camera
            // is still gliding to catch up. Idle, the GPU does nothing.
            frameloop={inView ? 'demand' : 'never'}
            dpr={dpr}
            gl={{ antialias: !simplified, powerPreference: 'high-performance' }}
            // Metric, matching Studio.glb's real scale: 1.7 m eye height,
            // 9 m back from the facade. `far` only needs to clear the model's
            // 10 m depth plus the approach.
            camera={{ position: [0, 1.7, 9], fov: HERO_FOV, near: 0.05, far: 60 }}
            style={{ position: 'absolute', inset: 0 }}
          >
            <Suspense fallback={null}>
              <StudioScene
                progressRef={progressRef}
                invalidateRef={invalidateRef}
                reduceMotion={reduceMotion}
                simplified={simplified}
                onReady={handleReady}
              />
            </Suspense>
          </Canvas>
        ) : (
          <EntranceFallback />
        )}

        {/* No corner label. The scene carries the message on its own, and
            the facade's own posters now say who this is — a caption on top
            of that was redundant chrome. Only the scroll affordance remains,
            and it retreats as soon as the journey begins. */}
        {/* The scroll cue is page-wide now: components/ScrollCue.tsx. */}

        <motion.div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background: '#FFFFFF',
            opacity: veilOpacity,
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  );
}
