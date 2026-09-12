import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { motion, useMotionValue, useTransform, useReducedMotion } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { Logo } from '../Logo';
import { StudioScene } from './StudioScene';

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

const RED = '#EA3323';
const SCROLL_VH = 420;

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
        background: 'linear-gradient(180deg, #E4DFD8 0%, #F2EEE8 100%)',
        overflow: 'hidden',
      }}
    >
      {/* Doorway proportion matches the real one built in the scene (2.2 × 2.4 m) */}
      <div style={{ position: 'relative', width: 'min(46vw, 300px)', aspectRatio: '2.2 / 2.4', display: 'flex' }}>
        <div style={{ position: 'absolute', inset: 0, background: RED, boxShadow: `0 0 90px ${RED}55` }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Logo width={150} />
        </div>
        {/* Two panels, parted — the doorway, held open */}
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '30%', background: '#2A2724' }} />
        <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: '30%', background: '#2A2724' }} />
      </div>
    </div>
  );
}

export function StudioEntrance() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const mv = useMotionValue(0);

  const reduceMotion = useReducedMotion() ?? false;
  const [webgl] = useState(detectWebGL);
  const [simplified, setSimplified] = useState(false);
  const [inView, setInView] = useState(true);
  // Studio.glb is 18 MB. It streams in behind the closed doors, so the wait
  // is hidden — but the invitation to scroll is held back until the room is
  // actually there to walk into.
  const [ready, setReady] = useState(false);
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
    let rafId = 0;
    const update = () => {
      const el = wrapRef.current;
      if (!el) return;
      const scrollable = el.offsetHeight - window.innerHeight;
      const p = scrollable <= 0 ? 0 : Math.max(0, Math.min(1, -el.getBoundingClientRect().top / scrollable));
      progressRef.current = p;
      mv.set(p);
    };
    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(update);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(rafId);
    };
  }, [mv, reduceMotion]);

  const copyOpacity = useTransform(mv, [0.02, 0.16], [1, 0]);
  const copyY = useTransform(mv, [0.02, 0.16], [0, 14]);
  // Light floods the frame as the threshold is crossed, carrying straight
  // into the page background so the hand-off has no visible seam.
  const veilOpacity = useTransform(mv, [0.9, 1], [0, 1]);

  return (
    <div ref={wrapRef} style={{ height: reduceMotion ? '100vh' : `${SCROLL_VH}vh`, position: 'relative' }}>
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
            frameloop={inView ? 'always' : 'never'}
            dpr={[1, simplified ? 1.5 : 2]}
            gl={{ antialias: !simplified, powerPreference: 'high-performance' }}
            // Metric, matching Studio.glb's real scale: 1.7 m eye height,
            // 9 m back from the facade. `far` only needs to clear the model's
            // 10 m depth plus the approach.
            camera={{ position: [0, 1.7, 9], fov: 45, near: 0.05, far: 60 }}
            style={{ position: 'absolute', inset: 0 }}
          >
            <Suspense fallback={null}>
              <StudioScene
                progressRef={progressRef}
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
        {!reduceMotion && ready && (
          <motion.div
            style={{
              position: 'absolute',
              bottom: 'clamp(28px, 5vh, 54px)',
              left: 0,
              right: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              opacity: copyOpacity,
              y: copyY,
              pointerEvents: 'none',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                color: 'rgba(10,10,10,0.5)',
              }}
            >
              Scroll to enter
            </span>
            <motion.span
              animate={{ y: [0, 7, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              style={{ display: 'flex', color: 'rgba(10,10,10,0.4)' }}
            >
              <ChevronDown size={18} strokeWidth={1.6} />
            </motion.span>
          </motion.div>
        )}

        <motion.div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background: '#FDFBF8',
            opacity: veilOpacity,
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  );
}
