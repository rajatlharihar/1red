import { useState, useRef, useEffect } from 'react';
import {
  motion,
  AnimatePresence,
  useInView,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
  type MotionValue,
} from 'motion/react';
import { GLASS, GlassAmbient } from './GlassLayers';

const EASE = [0.22, 1, 0.36, 1] as const;
const RED = '#EA3323';

const process = [
  {
    number: '01',
    title: 'Discovery',
    description: 'Understanding goals, audience, competitors, and the hidden opportunities that make great work possible.',
  },
  {
    number: '02',
    title: 'Strategy',
    description: 'Building positioning, content direction, and a creative roadmap that aligns teams and focuses effort.',
  },
  {
    number: '03',
    title: 'Design',
    description: 'Creating visual systems, interfaces, and brand assets that communicate clearly and feel premium.',
  },
  {
    number: '04',
    title: 'Production',
    description: 'Developing websites, animations, and digital experiences built for performance and longevity.',
  },
  {
    number: '05',
    title: 'Launch & Growth',
    description: 'Optimisation, analytics review, and continuous iteration so results compound over time.',
  },
];

const PROCESS_ENTRY_END = 0.06;
const PROCESS_EXIT_START = 0.94;

function processStepProgress(p: number): number {
  if (p < PROCESS_ENTRY_END) return 0;
  if (p > PROCESS_EXIT_START) return 1;
  return (p - PROCESS_ENTRY_END) / (PROCESS_EXIT_START - PROCESS_ENTRY_END);
}

/* ─── Mobile/Tablet process card ────────────────────────────────────────── */

function ProcessCard({ step, index }: { step: (typeof process)[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  const isLast = index === process.length - 1;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.68, ease: EASE, delay: index * 0.08 }}
        style={{
          background: 'rgba(255,255,255,0.8)',
          border: '1px solid rgba(0,0,0,0.07)',
          borderRadius: 20,
          padding: 'clamp(24px, 3vw, 36px)',
          backdropFilter: 'blur(12px)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
          <span
            style={{
              fontSize: 10,
              letterSpacing: '0.2em',
              opacity: 0.28,
              flexShrink: 0,
              marginTop: 4,
              fontVariantNumeric: 'tabular-nums',
            } as React.CSSProperties}
          >
            {step.number}
          </span>
          <div>
            <h4
              style={{
                fontSize: 'clamp(18px, 2vw, 26px)',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                margin: '0 0 10px',
              }}
            >
              {step.title}
            </h4>
            <p style={{ fontSize: 14, opacity: 0.48, lineHeight: 1.7, margin: 0 }}>
              {step.description}
            </p>
          </div>
        </div>
      </motion.div>

      {!isLast && (
        <motion.div
          initial={{ scaleY: 0 }}
          animate={inView ? { scaleY: 1 } : {}}
          transition={{ duration: 0.5, ease: EASE, delay: index * 0.08 + 0.3 }}
          style={{
            position: 'absolute',
            left: 'clamp(24px, 3vw, 36px)',
            bottom: -28,
            width: 1,
            height: 28,
            background: 'rgba(0,0,0,0.12)',
            transformOrigin: 'top',
            zIndex: 0,
          }}
        />
      )}
    </div>
  );
}

/* ─── Process rail — anchored left-side progress indicator ──────────────── */

function ProcessRail({ activeIndex, progress }: { activeIndex: number; progress: MotionValue<number> }) {
  const fillHeight = useTransform(progress, [0, 1], ['0%', '100%']);

  return (
    <div style={{ position: 'relative', paddingLeft: 28 }}>
      <div style={{ position: 'absolute', left: 5, top: 6, bottom: 6, width: 1, background: 'rgba(0,0,0,0.1)' }} />
      <motion.div
        style={{
          position: 'absolute',
          left: 5,
          top: 6,
          width: 1,
          height: fillHeight,
          background: RED,
          transformOrigin: 'top',
        }}
      />
      {process.map((step, i) => {
        const isActive = i === activeIndex;
        const isPast = i < activeIndex;
        const lit = isActive || isPast;
        return (
          <div key={step.number} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '11px 0', position: 'relative' }}>
            <span
              style={{
                position: 'absolute',
                left: -28 + 1.5,
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: lit ? RED : '#fff',
                border: `1px solid ${lit ? RED : 'rgba(0,0,0,0.22)'}`,
                transition: 'background 280ms ease-out, border-color 280ms ease-out',
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                letterSpacing: '-0.01em',
                opacity: isActive ? 1 : 0.4,
                transition: 'opacity 280ms ease-out',
                fontVariantNumeric: 'tabular-nums',
              } as React.CSSProperties}
            >
              {step.number} — {step.title}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Process story card ────────────────────────────────────────────────── */

function ProcessStoryCard({ step, activeIndex, total }: { step: (typeof process)[0]; activeIndex: number; total: number }) {
  return (
    <div style={{ position: 'relative', minHeight: 380 }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={step.number}
          initial={{ opacity: 0, y: 22, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -14, filter: 'blur(4px)' }}
          transition={{ duration: 0.5, ease: EASE }}
          style={{
            position: 'relative',
            overflow: 'hidden',
            background: GLASS.surface.idle,
            backdropFilter: GLASS.blur,
            WebkitBackdropFilter: GLASS.blur,
            border: `1px solid ${GLASS.border.idle}`,
            borderRadius: 22,
            padding: 'clamp(32px, 4vw, 56px)',
            boxShadow: GLASS.shadow.idle,
          }}
        >
          <GlassAmbient hovered={false} />

          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <span style={{ fontSize: 12, letterSpacing: '0.14em', opacity: 0.4, fontVariantNumeric: 'tabular-nums' } as React.CSSProperties}>
                {String(activeIndex + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
              </span>
            </div>

            <div
              aria-hidden
              style={{
                fontSize: 'clamp(90px, 11vw, 160px)',
                fontWeight: 800,
                lineHeight: 1,
                letterSpacing: '-0.04em',
                color: 'rgba(234,51,35,0.08)',
                marginBottom: -18,
              }}
            >
              {step.number}
            </div>

            <h3 style={{ fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.05, margin: '0 0 16px' }}>
              {step.title}
            </h3>
            <p style={{ fontSize: 16, opacity: 0.5, lineHeight: 1.7, maxWidth: 440, margin: 0 }}>
              {step.description}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ─── Top-level OurProcess component ────────────────────────────────────── */

export function OurProcess() {
  const processRef = useRef<HTMLDivElement>(null);
  const processInView = useInView(processRef, { once: true, margin: '-60px' });
  const reduceMotion = useReducedMotion() ?? false;

  const processPinRef = useRef<HTMLDivElement>(null);
  const processRawProgress = useMotionValue(0);
  const processSmoothProgress = useSpring(processRawProgress, { stiffness: 90, damping: 24, mass: 0.9 });
  const [processActiveIndex, setProcessActiveIndex] = useState(0);
  const processLastIndexRef = useRef(0);

  useEffect(() => {
    if (reduceMotion) return;
    let rafId: number;
    const update = () => {
      const el = processPinRef.current;
      if (!el) return;
      const scrollable = el.offsetHeight - window.innerHeight;
      if (scrollable <= 0) {
        processRawProgress.set(1);
        return;
      }
      const top = el.getBoundingClientRect().top;
      const p = Math.max(0, Math.min(1, -top / scrollable));
      processRawProgress.set(p);
      const sp = processStepProgress(p);
      const idx = Math.min(Math.floor(sp * process.length), process.length - 1);
      if (idx !== processLastIndexRef.current) {
        processLastIndexRef.current = idx;
        setProcessActiveIndex(idx);
      }
    };
    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(update);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafId);
    };
  }, [reduceMotion, processRawProgress]);

  return (
    <section style={{ background: '#fff', paddingTop: '4rem', paddingBottom: '8rem' }}>
      <div
        style={{
          maxWidth: 1400,
          margin: '0 auto',
          paddingLeft: 'clamp(1.5rem, 4vw, 5rem)',
          paddingRight: 'clamp(1.5rem, 4vw, 5rem)',
        }}
      >
        <div ref={processRef}>
          {/* Desktop: pinned scroll-driven story */}
          {!reduceMotion && (
            <div
              ref={processPinRef}
              className="hidden lg:block"
              style={{ height: `${process.length * 60 + 100}vh`, position: 'relative', marginBottom: 'clamp(4rem, 8vh, 6rem)' }}
            >
              <div style={{ position: 'sticky', top: 0, height: '100vh', display: 'flex', alignItems: 'center' }}>
                <div
                  className="grid"
                  style={{ gridTemplateColumns: '1fr 1fr', gap: '5rem', width: '100%', alignItems: 'center' }}
                >
                  {/* Left: anchored heading + progress rail */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                      <span style={{ fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', opacity: 0.35 }}>
                        Our Process
                      </span>
                    </div>

                    <h2
                      style={{
                        fontSize: 'clamp(32px, 4vw, 60px)',
                        fontWeight: 700,
                        letterSpacing: '-0.03em',
                        lineHeight: 1.06,
                        margin: '0 0 20px',
                      }}
                    >
                      How We Build
                      <br />
                      Great Work
                    </h2>

                    <p style={{ fontSize: 14, opacity: 0.44, lineHeight: 1.74, maxWidth: 360, margin: '0 0 40px' }}>
                      Every engagement follows a proven framework that balances creative
                      ambition with strategic discipline — ensuring the work delivers
                      results beyond aesthetics.
                    </p>

                    <ProcessRail activeIndex={processActiveIndex} progress={processSmoothProgress} />
                  </div>

                  {/* Right: the active stage */}
                  <ProcessStoryCard step={process[processActiveIndex]} activeIndex={processActiveIndex} total={process.length} />
                </div>
              </div>
            </div>
          )}

          {/* Mobile/tablet + reduced-motion: simple stacked reveal */}
          <div className={reduceMotion ? 'grid gap-16' : 'lg:hidden grid gap-16'}>
            <div>
              <div style={{ overflow: 'hidden', marginBottom: 12 }}>
                <motion.p
                  initial={{ y: '110%' }}
                  animate={processInView ? { y: 0 } : {}}
                  transition={{ duration: 0.6, ease: EASE }}
                  style={{ fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', opacity: 0.35, margin: 0 }}
                >
                  Our Process
                </motion.p>
              </div>

              <div style={{ overflow: 'hidden', marginBottom: 24 }}>
                <motion.h2
                  initial={{ y: '110%' }}
                  animate={processInView ? { y: 0 } : {}}
                  transition={{ duration: 0.78, ease: EASE, delay: 0.06 }}
                  style={{
                    fontSize: 'clamp(32px, 4vw, 60px)',
                    fontWeight: 700,
                    letterSpacing: '-0.03em',
                    lineHeight: 1.06,
                    margin: 0,
                    marginBottom: 20,
                  }}
                >
                  How We Build
                  <br />
                  Great Work
                </motion.h2>
              </div>

              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={processInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.62, delay: 0.14, ease: EASE }}
                style={{ fontSize: 14, opacity: 0.44, lineHeight: 1.74, maxWidth: 360, margin: 0 }}
              >
                Every engagement follows a proven framework that balances creative
                ambition with strategic discipline — ensuring the work delivers
                results beyond aesthetics.
              </motion.p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {process.map((step, i) => (
                <ProcessCard key={step.number} step={step} index={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
