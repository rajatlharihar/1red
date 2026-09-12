import { useState, useRef, useEffect, useCallback } from 'react';
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
// Imported, not redeclared — /studio renders this same array, so the two
// pages can no longer describe different processes. See data/process.ts.
import { process } from '../data/process';

const EASE = [0.22, 1, 0.36, 1] as const;
const RED = '#EA3323';

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

/* Rail rebuilt as a real control: each stage is a button you can hover and
   click to jump to. No dots and no small red squares — the active stage is
   marked by one shared sliding bar (Motion's layoutId, the same technique
   the site's navigation uses), which reads as a single object moving rather
   than five things switching colour. */
function ProcessRail({
  activeIndex,
  onJump,
}: {
  activeIndex: number;
  onJump: (i: number) => void;
}) {
  const [hover, setHover] = useState<number | null>(null);

  return (
    <div
      style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 0 }}
      onMouseLeave={() => setHover(null)}
    >
      {process.map((step, i) => {
        const isActive = i === activeIndex;
        const isHover = hover === i;
        return (
          <button
            key={step.number}
            type="button"
            onClick={() => onJump(i)}
            onMouseEnter={() => setHover(i)}
            aria-current={isActive}
            className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#EA3323]"
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'baseline',
              gap: 18,
              padding: '14px 0 14px 26px',
              background: 'none',
              border: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              width: '100%',
            }}
          >
            {isActive && (
              <motion.span
                layoutId="process-rail-marker"
                transition={{ type: 'spring', stiffness: 420, damping: 34, mass: 0.6 }}
                style={{ position: 'absolute', left: 0, top: 12, bottom: 12, width: 3, background: RED, borderRadius: 2 }}
              />
            )}
            <motion.span
              animate={{ x: isHover && !isActive ? 5 : 0, opacity: isActive ? 0.5 : isHover ? 0.4 : 0.22 }}
              transition={{ duration: 0.3, ease: EASE }}
              style={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums', flexShrink: 0 } as React.CSSProperties}
            >
              {step.number}
            </motion.span>
            <motion.span
              animate={{
                x: isHover && !isActive ? 5 : 0,
                opacity: isActive ? 1 : isHover ? 0.72 : 0.3,
                fontSize: isActive ? 30 : 22,
              }}
              transition={{ duration: 0.35, ease: EASE }}
              style={{ fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1, color: 'rgb(10,10,10)' }}
            >
              {step.title}
            </motion.span>
          </button>
        );
      })}
    </div>
  );
}

/* ─── Process story card ────────────────────────────────────────────────── */

/* The stage, as an open typographic composition rather than a glass card.
 *
 * The card version had chrome (border, blur, shadow) wrapped around one
 * title and one sentence, which is what made it read as a template with a
 * lot of nothing in it. This drops the box and builds depth instead: three
 * layers that travel at genuinely different rates as the section scrolls,
 * so the number sits behind the type in real space rather than being a flat
 * watermark printed on a panel. */
function ProcessStage({
  step,
  activeIndex,
  total,
  progress,
}: {
  step: (typeof process)[0];
  activeIndex: number;
  total: number;
  progress: MotionValue<number>;
}) {
  // Parallax: each layer covers a different distance across the same pin.
  // Back moves least, front moves most — the standard depth cue.
  const yNumber = useTransform(progress, [0, 1], [70, -70]);
  const yTitle = useTransform(progress, [0, 1], [26, -26]);
  const yBody = useTransform(progress, [0, 1], [-6, 6]);
  const numberScale = useTransform(progress, [0, 1], [1.06, 0.96]);

  return (
    <div style={{ position: 'relative', height: '100%', minHeight: 0, display: 'flex', alignItems: 'center' }}>
      {/* ── back layer: the stage number, oversized and bleeding ── */}
      <motion.div
        aria-hidden
        style={{
          position: 'absolute',
          right: '-8%',
          top: '50%',
          y: yNumber,
          scale: numberScale,
          translateY: '-50%',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={step.number}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.6, ease: EASE }}
            style={{
              display: 'block',
              fontSize: 'clamp(260px, 30vw, 460px)',
              fontWeight: 800,
              lineHeight: 0.78,
              letterSpacing: '-0.07em',
              color: 'rgba(234,51,35,0.085)',
            }}
          >
            {step.number}
          </motion.span>
        </AnimatePresence>
      </motion.div>

      {/* ── mid + front layers ── */}
      <div style={{ position: 'relative', width: '100%' }}>
        <motion.div style={{ y: yTitle }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 26 }}>
            <span style={{ fontSize: 12, letterSpacing: '0.16em', opacity: 0.35, fontVariantNumeric: 'tabular-nums' } as React.CSSProperties}>
              {String(activeIndex + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
            </span>
            {/* A single line that grows with progress — no dashes, no boxes. */}
            <motion.span
              aria-hidden
              animate={{ scaleX: (activeIndex + 1) / total }}
              transition={{ duration: 0.55, ease: EASE }}
              style={{ flex: 1, maxWidth: 190, height: 1, background: RED, transformOrigin: 'left', opacity: 0.75 }}
            />
          </div>

          {/* Mask reveal — the site's established heading treatment. */}
          <div style={{ overflow: 'hidden', marginBottom: 22 }}>
            <AnimatePresence mode="wait">
              <motion.h3
                key={step.number}
                initial={{ y: '112%' }}
                animate={{ y: 0 }}
                exit={{ y: '-112%' }}
                transition={{ duration: 0.62, ease: EASE }}
                style={{
                  fontSize: 'clamp(52px, 7vw, 108px)',
                  fontWeight: 800,
                  letterSpacing: '-0.045em',
                  lineHeight: 0.94,
                  margin: 0,
                }}
              >
                {step.title}
              </motion.h3>
            </AnimatePresence>
          </div>
        </motion.div>

        <motion.div style={{ y: yBody }}>
          <AnimatePresence mode="wait">
            <motion.p
              key={step.number}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 0.58, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.5, ease: EASE, delay: 0.06 }}
              style={{ fontSize: 'clamp(16px, 1.4vw, 20px)', lineHeight: 1.68, maxWidth: 460, margin: 0 }}
            >
              {step.description}
            </motion.p>
          </AnimatePresence>
        </motion.div>
      </div>
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

  // Background parallax — the slowest layers in the stack.
  const bgY = useTransform(processSmoothProgress, [0, 1], [90, -90]);
  const bgScale = useTransform(processSmoothProgress, [0, 1], [0.92, 1.08]);
  const gridY = useTransform(processSmoothProgress, [0, 1], [40, -40]);

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

  // Clicking a stage in the rail scrolls the page to it, so the pinned
  // sequence is navigable rather than something you can only wait through.
  const jumpToStage = useCallback((i: number) => {
    const el = processPinRef.current;
    if (!el) return;
    const scrollable = el.offsetHeight - window.innerHeight;
    if (scrollable <= 0) return;
    const span = PROCESS_EXIT_START - PROCESS_ENTRY_END;
    const target = PROCESS_ENTRY_END + ((i + 0.5) / process.length) * span;
    const top = window.scrollY + el.getBoundingClientRect().top;
    window.scrollTo({ top: top + target * scrollable, behavior: 'smooth' });
  }, []);

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
              <div style={{ position: 'sticky', top: 0, height: '100vh', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
                {/* Atmosphere: a soft red field behind the card and a faint
                    boxy grid. The section was reading as a flat white page
                    with two things floating on it. Both layers are
                    decorative, behind everything, and never intercept a
                    pointer. */}
                {/* Deepest layer — drifts least, and warms as the sequence
                    advances so the section is not one flat white the whole
                    way through. */}
                <motion.div
                  aria-hidden
                  style={{
                    position: 'absolute',
                    right: '-10%',
                    top: '50%',
                    translateY: '-50%',
                    y: bgY,
                    scale: bgScale,
                    width: 'min(66vw, 900px)',
                    height: 'min(66vw, 900px)',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(234,51,35,0.13), transparent 64%)',
                    filter: 'blur(30px)',
                    pointerEvents: 'none',
                  }}
                />
                <motion.div
                  aria-hidden
                  style={{
                    position: 'absolute',
                    inset: '-10% 0',
                    y: gridY,
                    backgroundImage:
                      'linear-gradient(rgba(10,10,10,0.032) 1px, transparent 1px), linear-gradient(90deg, rgba(10,10,10,0.032) 1px, transparent 1px)',
                    backgroundSize: '90px 90px',
                    maskImage: 'radial-gradient(ellipse 78% 60% at 50% 50%, black 18%, transparent 76%)',
                    WebkitMaskImage: 'radial-gradient(ellipse 78% 60% at 50% 50%, black 18%, transparent 76%)',
                    pointerEvents: 'none',
                  }}
                />

                {/* One explicit row height, and BOTH columns stretch to fill
                    it (minHeight:0 stops a grid item's automatic minimum
                    from overriding the cap). This is what removes the dead
                    space above and below the card. */}
                <div
                  className="grid"
                  style={{
                    position: 'relative',
                    gridTemplateColumns: '0.82fr 1.18fr',
                    gap: 'clamp(3rem, 5vw, 5.5rem)',
                    width: '100%',
                    height: 'min(74vh, 700px)',
                    minHeight: 0,
                  }}
                >
                  {/* Left: heading anchored top, rail expanding to fill */}
                  <div style={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                    <span style={{ display: 'block', fontSize: 10, fontWeight: 600, letterSpacing: '0.3em', textTransform: 'uppercase', opacity: 0.38, marginBottom: 18 }}>
                      Our Process
                    </span>

                    <h2
                      style={{
                        fontSize: 'clamp(38px, 4.8vw, 72px)',
                        fontWeight: 700,
                        letterSpacing: '-0.035em',
                        lineHeight: 1.0,
                        margin: '0 0 22px',
                      }}
                    >
                      How We Build
                      <br />
                      Great Work
                    </h2>

                    <p style={{ fontSize: 15, opacity: 0.48, lineHeight: 1.74, maxWidth: 380, margin: '0 0 clamp(1.8rem, 4vh, 3rem)' }}>
                      Every engagement follows a proven framework that balances creative
                      ambition with strategic discipline — ensuring the work delivers
                      results beyond aesthetics.
                    </p>

                    <ProcessRail activeIndex={processActiveIndex} onJump={jumpToStage} />
                  </div>

                  {/* Right: the active stage */}
                  <ProcessStage
                    step={process[processActiveIndex]}
                    activeIndex={processActiveIndex}
                    total={process.length}
                    progress={processSmoothProgress}
                  />
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
