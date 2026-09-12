import { useCallback, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Link } from 'react-router';
import { ArrowUpRight } from 'lucide-react';
import { CubeObject, CubeLighting } from './CubeObject';
import {
  PROBLEM_STATES,
  RESOLUTION,
  STATE_COUNT,
  CUBE_TOTAL_VH,
  stateValue,
  progressForState,
} from './problemStates';

/* ─── "We know what usually goes wrong." ───────────────────────────────────
 * Replaces the old cube-as-portfolio section entirely. That version textured
 * the cube's faces with project videos and paired it with a project detail
 * card — work which now belongs solely to the proof section further down the
 * page, so the two no longer duplicate each other's job.
 *
 * Chapter role: the entrance says "come inside", this says "here is how we
 * think", and the work section that follows says "here is the proof".
 *
 * Scroll pattern is the one used throughout this codebase: a tall wrapper, a
 * sticky viewport, one rAF-throttled listener writing to a ref (read inside
 * useFrame, zero re-renders) plus a small state index that only changes when
 * the active state actually changes.
 * ────────────────────────────────────────────────────────────────────────── */

const RED = '#EA3323';
const EASE = [0.22, 1, 0.36, 1] as const;
const BG = '#F3F0EB'; // carries on from the studio entrance's warm white

export function ProblemCube() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef(0);
  const pointerRef = useRef({ x: 0, y: 0 });
  const lastIndex = useRef(0);

  const reduceMotion = useReducedMotion() ?? false;
  const [index, setIndex] = useState(0);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver((e) => setInView(e[0].isIntersecting), { rootMargin: '160px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    let raf = 0;
    const update = () => {
      const el = wrapRef.current;
      if (!el) return;
      const scrollable = el.offsetHeight - window.innerHeight;
      const p = scrollable <= 0 ? 0 : Math.max(0, Math.min(1, -el.getBoundingClientRect().top / scrollable));
      const v = stateValue(p);
      stateRef.current = v;
      const i = Math.round(v);
      if (i !== lastIndex.current) {
        lastIndex.current = i;
        setIndex(i);
      }
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [reduceMotion]);

  // Cursor parallax only — never carries information, so touch loses nothing.
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

  const jump = useCallback((i: number) => {
    const el = wrapRef.current;
    if (!el) return;
    const scrollable = el.offsetHeight - window.innerHeight;
    if (scrollable <= 0) return;
    const top = window.scrollY + el.getBoundingClientRect().top;
    window.scrollTo({ top: top + progressForState(i) * scrollable, behavior: 'smooth' });
  }, []);

  const isResolution = index >= PROBLEM_STATES.length;
  const active = PROBLEM_STATES[Math.min(index, PROBLEM_STATES.length - 1)];

  const heading = (
    <div style={{ marginBottom: 'clamp(1.5rem, 3vh, 2.4rem)' }}>
      <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.28em', textTransform: 'uppercase', opacity: 0.4, margin: '0 0 12px' }}>
        How we think
      </p>
      <h2
        style={{
          fontSize: 'clamp(28px, 3.4vw, 46px)',
          fontWeight: 700,
          letterSpacing: '-0.03em',
          lineHeight: 1.05,
          margin: 0,
          color: 'rgb(10,10,10)',
        }}
      >
        We know what usually
        <br />
        goes wrong.
      </h2>
    </div>
  );

  /* Reduced motion / no-pin fallback: the whole argument as a readable list,
     no scroll capture, no dependence on animation to make the point. */
  if (reduceMotion) {
    return (
      <section style={{ background: BG, padding: 'clamp(5rem, 10vh, 8rem) clamp(1.5rem, 4vw, 5rem)' }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          {heading}
          {PROBLEM_STATES.map((s) => (
            <div key={s.n} style={{ padding: '26px 0', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
              <span style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.45 }}>
                {s.n} — {s.category}
              </span>
              <h3 style={{ fontSize: 'clamp(20px, 2.4vw, 28px)', fontWeight: 700, letterSpacing: '-0.02em', margin: '10px 0 8px' }}>
                {s.problem}
              </h3>
              <p style={{ fontSize: 14, lineHeight: 1.7, opacity: 0.55, margin: '0 0 12px' }}>{s.context}</p>
              <p style={{ fontSize: 15, lineHeight: 1.6, color: RED, fontWeight: 600, margin: 0 }}>{s.response}</p>
            </div>
          ))}
          <div style={{ paddingTop: 32 }}>
            <h3 style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 12px', whiteSpace: 'pre-line' }}>
              {RESOLUTION.headline}
            </h3>
            <p style={{ fontSize: 15, lineHeight: 1.7, opacity: 0.6, margin: '0 0 24px' }}>{RESOLUTION.body}</p>
            <Link to="/contact" style={ctaStyle}>
              {RESOLUTION.cta} <ArrowUpRight size={15} strokeWidth={2} />
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section style={{ background: BG, position: 'relative' }}>
      <div ref={wrapRef} style={{ height: `${CUBE_TOTAL_VH}vh`, position: 'relative' }}>
        <div
          onMouseMove={onPointerMove}
          style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden', display: 'flex', alignItems: 'center' }}
        >
          <div
            className="grid grid-cols-1 lg:grid-cols-2"
            style={{
              width: '100%',
              maxWidth: 1400,
              margin: '0 auto',
              padding: '0 clamp(1.5rem, 4vw, 5rem)',
              gap: 'clamp(2rem, 4vw, 4rem)',
              height: 'min(70vh, 640px)',
              minHeight: 0,
              alignItems: 'center',
            }}
          >
            {/* ── The argument ─────────────────────────────────────────── */}
            <div style={{ minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              {heading}

              <AnimatePresence mode="wait">
                {isResolution ? (
                  <motion.div
                    key="resolution"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.45, ease: EASE }}
                  >
                    <span style={eyebrowStyle}>{RESOLUTION.eyebrow}</span>
                    <h3
                      style={{
                        fontSize: 'clamp(30px, 4vw, 54px)',
                        fontWeight: 800,
                        letterSpacing: '-0.035em',
                        lineHeight: 1.02,
                        margin: '14px 0 16px',
                        whiteSpace: 'pre-line',
                      }}
                    >
                      {RESOLUTION.headline}
                    </h3>
                    <p style={{ fontSize: 15, lineHeight: 1.7, opacity: 0.6, margin: '0 0 26px', maxWidth: 420 }}>
                      {RESOLUTION.body}
                    </p>
                    <Link to="/contact" style={ctaStyle}>
                      {RESOLUTION.cta} <ArrowUpRight size={15} strokeWidth={2} />
                    </Link>
                  </motion.div>
                ) : (
                  <motion.div
                    key={active.n}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.45, ease: EASE }}
                  >
                    <span style={eyebrowStyle}>
                      {active.n} — {active.category}
                    </span>
                    <h3
                      style={{
                        fontSize: 'clamp(24px, 3.1vw, 42px)',
                        fontWeight: 800,
                        letterSpacing: '-0.03em',
                        lineHeight: 1.06,
                        margin: '14px 0 14px',
                        maxWidth: 480,
                      }}
                    >
                      {active.problem}
                    </h3>
                    <p style={{ fontSize: 14.5, lineHeight: 1.7, opacity: 0.55, margin: '0 0 22px', maxWidth: 420 }}>
                      {active.context}
                    </p>
                    <div style={{ borderTop: '1px solid rgba(0,0,0,0.12)', paddingTop: 18, maxWidth: 420 }}>
                      <span style={{ ...eyebrowStyle, color: RED, opacity: 1 }}>What we do</span>
                      <p style={{ fontSize: 15.5, lineHeight: 1.6, fontWeight: 500, margin: '10px 0 0' }}>{active.response}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Progress — also the only navigation, so the sequence is
                  never a trap. */}
              <div style={{ display: 'flex', gap: 8, marginTop: 'clamp(1.5rem, 3vh, 2.4rem)' }}>
                {Array.from({ length: STATE_COUNT }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => jump(i)}
                    aria-label={`Go to state ${i + 1} of ${STATE_COUNT}`}
                    aria-current={i === index}
                    className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#EA3323]"
                    style={{
                      width: i === index ? 26 : 12,
                      height: 3,
                      border: 'none',
                      padding: 0,
                      borderRadius: 2,
                      cursor: 'pointer',
                      background: i === index ? RED : 'rgba(0,0,0,0.18)',
                      transition: 'width 320ms ease-out, background 320ms ease-out',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* ── The device ───────────────────────────────────────────── */}
            <div style={{ position: 'relative', height: '100%', minHeight: 0 }}>
              <Canvas
                frameloop={inView ? 'always' : 'never'}
                dpr={[1, 1.75]}
                gl={{ antialias: true, powerPreference: 'high-performance' }}
                camera={{ position: [0, 0.4, 5.6], fov: 42 }}
                style={{ position: 'absolute', inset: 0 }}
              >
                <CubeLighting />
                <CubeObject stateRef={stateRef} pointerRef={pointerRef} reduceMotion={false} />
              </Canvas>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const eyebrowStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  opacity: 0.45,
};

const ctaStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 9,
  padding: '15px 30px',
  borderRadius: 3,
  background: RED,
  color: 'white',
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  textDecoration: 'none',
};
