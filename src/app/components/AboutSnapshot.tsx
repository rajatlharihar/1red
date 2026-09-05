import { useRef, useEffect, useState } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  AnimatePresence,
} from 'motion/react';

const stages = [
  {
    label: 'Website Design',
    sub: 'Pixel-perfect builds that convert.',
    lines: ['top', 'mid-wide', 'mid-narrow'],
    accent: '#F0EDE8',
  },
  {
    label: 'Branding',
    sub: 'Identities that command attention.',
    lines: ['circle', 'mid-wide', 'mid-narrow'],
    accent: '#E8EDF0',
  },
  {
    label: 'Social Media',
    sub: 'Content that builds community.',
    lines: ['top', 'mid-narrow', 'mid-wide'],
    accent: '#EBF0E8',
  },
  {
    label: 'UI/UX Design',
    sub: 'Frictionless human-centred flows.',
    lines: ['grid', 'mid-wide', 'mid-narrow'],
    accent: '#EDE8F0',
  },
  {
    label: 'Motion Graphics',
    sub: 'Cinematic brand animation.',
    lines: ['circle', 'top', 'mid-wide'],
    accent: '#F0EBE8',
  },
];

const TOTAL = stages.length;

/* ─── Abstract artwork per stage ─────────────────────────────────────────── */

function StageArtwork({ stage }: { stage: (typeof stages)[0] }) {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 400 480"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ position: 'absolute', inset: 0 }}
    >
      {stage.lines.includes('top') && (
        <rect x="60" y="80" width="280" height="3" rx="1.5" fill="rgba(0,0,0,0.12)" />
      )}
      {stage.lines.includes('mid-wide') && (
        <rect x="60" y="140" width="200" height="2" rx="1" fill="rgba(0,0,0,0.08)" />
      )}
      {stage.lines.includes('mid-narrow') && (
        <rect x="60" y="168" width="130" height="2" rx="1" fill="rgba(0,0,0,0.06)" />
      )}
      {stage.lines.includes('circle') && (
        <circle cx="200" cy="260" r="72" stroke="rgba(0,0,0,0.07)" strokeWidth="1.5" />
      )}
      {stage.lines.includes('grid') && (
        <>
          <rect x="60" y="220" width="80" height="80" rx="6" stroke="rgba(0,0,0,0.07)" strokeWidth="1.2" />
          <rect x="160" y="220" width="80" height="80" rx="6" stroke="rgba(0,0,0,0.07)" strokeWidth="1.2" />
          <rect x="260" y="220" width="80" height="80" rx="6" stroke="rgba(0,0,0,0.07)" strokeWidth="1.2" />
        </>
      )}
      {/* Always-present baseline */}
      <rect x="60" y="380" width="280" height="1" rx="0.5" fill="rgba(0,0,0,0.05)" />
      <text
        x="60"
        y="420"
        fontSize="10"
        letterSpacing="3"
        fill="rgba(0,0,0,0.18)"
        fontFamily="inherit"
        style={{ textTransform: 'uppercase' } as React.CSSProperties}
      >
        {stage.label.toUpperCase()}
      </text>
    </svg>
  );
}

/* ─── Media panel ────────────────────────────────────────────────────────── */

function MediaPanel({
  activeIndex,
  hovered,
  onEnter,
  onLeave,
}: {
  activeIndex: number;
  hovered: boolean;
  onEnter: () => void;
  onLeave: () => void;
}) {
  const stage = stages[Math.min(activeIndex, stages.length - 1)];

  return (
    <motion.div
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      animate={{
        scale: hovered ? 1.015 : 1,
        boxShadow: hovered
          ? '0 40px 100px rgba(0,0,0,0.14), 0 8px 28px rgba(0,0,0,0.07)'
          : '0 24px 64px rgba(0,0,0,0.09), 0 4px 16px rgba(0,0,0,0.05)',
        borderColor: hovered ? 'rgba(0,0,0,0.13)' : 'rgba(0,0,0,0.08)',
      }}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '4/5',
        borderRadius: 24,
        border: '1px solid rgba(0,0,0,0.08)',
        overflow: 'hidden',
        cursor: 'default',
        backgroundColor: stage.accent,
      }}
    >
      {/* Animated background color */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.55, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: stage.accent,
          }}
        />
      </AnimatePresence>

      {/* Artwork crossfade */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`art-${activeIndex}`}
          initial={{ opacity: 0, scale: 0.97, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 1.02, y: -8 }}
          transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
          style={{ position: 'absolute', inset: 0 }}
        >
          <StageArtwork stage={stage} />
        </motion.div>
      </AnimatePresence>

      {/* Stage counter badge */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          fontSize: 10,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          opacity: 0.3,
        }}
      >
        {String(activeIndex + 1).padStart(2, '0')} / {String(TOTAL).padStart(2, '0')}
      </div>

      {/* Glass edge highlight */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 24,
          background:
            'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 50%)',
          pointerEvents: 'none',
        }}
      />
    </motion.div>
  );
}

/* ─── Progress bar ───────────────────────────────────────────────────────── */

function ProgressBar({ progress }: { progress: number }) {
  return (
    <div
      style={{
        width: '100%',
        height: 2,
        background: 'rgba(0,0,0,0.08)',
        borderRadius: 1,
        overflow: 'hidden',
      }}
    >
      <motion.div
        style={{
          height: '100%',
          background: 'rgba(0,0,0,0.5)',
          borderRadius: 1,
          width: `${((progress + 1) / TOTAL) * 100}%`,
        }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}

/* ─── Main export ────────────────────────────────────────────────────────── */

export function AboutSnapshot() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [mediaHovered, setMediaHovered] = useState(false);

  /* Raw + smoothed scroll progress [0,1] across the pinned section */
  const rawProgress = useMotionValue(0);
  const smoothProgress = useSpring(rawProgress, { stiffness: 68, damping: 22, mass: 1.1 });

  /* Derived active stage index (0–5) */
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    let rafId: number;

    const update = () => {
      const el = sectionRef.current;
      if (!el) return;
      const scrollable = el.offsetHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const top = el.getBoundingClientRect().top;
      const p = Math.max(0, Math.min(1, -top / scrollable));
      rawProgress.set(p);
      setActiveIndex(Math.min(TOTAL - 1, Math.floor(p * TOTAL)));
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
  }, [rawProgress]);

  /* Parallax: left column drifts up slightly as section scrolls */
  const leftY = useTransform(smoothProgress, [0, 1], [0, -36]);
  /* Media parallax: subtle counter drift */
  const mediaY = useTransform(smoothProgress, [0, 1], [0, 20]);

  const stage = stages[Math.min(activeIndex, stages.length - 1)];

  return (
    /*
     * Tall container = scroll-space for the pinned experience.
     * Height: 100vh static panel + TOTAL steps of 70vh each.
     */
    <div
      ref={sectionRef}
      style={{ height: `${100 + TOTAL * 70}vh`, position: 'relative' }}
    >
      {/* Sticky viewport panel */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 1400,
            margin: '0 auto',
            padding: 'clamp(1.5rem, 4vw, 5rem)',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'clamp(2rem, 5vw, 6rem)',
            alignItems: 'center',
          }}
          className="max-lg:grid-cols-1"
        >
          {/* ── LEFT: Static headline + dynamic stage label ── */}
          <motion.div style={{ y: leftY }}>

            {/* Eyebrow */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              style={{
                fontSize: 10,
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                opacity: 0.35,
                marginBottom: 24,
              }}
            >
              Our Studio
            </motion.p>

            {/* Main headline — static, stays visible throughout */}
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
              style={{
                fontSize: 'clamp(36px, 4.6vw, 68px)',
                fontWeight: 700,
                letterSpacing: '-0.03em',
                lineHeight: 1.08,
                marginBottom: 36,
              }}
            >
              We create brands,<br />
              stories, and digital<br />
              systems for<br />
              modern businesses.
            </motion.h2>

            {/* Support copy */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: 0.14 }}
              style={{
                fontSize: 'clamp(13px, 1.2vw, 16px)',
                opacity: 0.45,
                lineHeight: 1.72,
                maxWidth: 400,
                marginBottom: 48,
              }}
            >
              Our studio bridges creative vision and strategic execution.
              Design that tells stories, builds connections, and creates
              lasting impact across every surface.
            </motion.p>

            {/* Dynamic service label — changes with scroll */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', opacity: 0.3, marginBottom: 10 }}>
                Currently exploring
              </p>
              <div style={{ height: 44, overflow: 'hidden', position: 'relative' }}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeIndex}
                    initial={{ y: 32, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -28, opacity: 0 }}
                    transition={{ duration: 0.46, ease: [0.22, 1, 0.36, 1] }}
                    style={{ position: 'absolute' }}
                  >
                    <span
                      style={{
                        fontSize: 'clamp(20px, 2.4vw, 30px)',
                        fontWeight: 700,
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {stage.label}
                    </span>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Stage sub-text */}
              <div style={{ height: 22, overflow: 'hidden', position: 'relative', marginTop: 6 }}>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={`sub-${activeIndex}`}
                    initial={{ y: 18, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -14, opacity: 0 }}
                    transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1], delay: 0.06 }}
                    style={{ position: 'absolute', fontSize: 13, opacity: 0.38, letterSpacing: '0.01em' }}
                  >
                    {stage.sub}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>

            {/* Progress bar */}
            <ProgressBar progress={activeIndex} />

            {/* Step dots */}
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              {stages.map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: i === activeIndex ? 20 : 6,
                    height: 6,
                    borderRadius: 3,
                    background: i === activeIndex ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.14)',
                    transition: 'width 0.36s cubic-bezier(0.22,1,0.36,1), background 0.36s ease',
                  }}
                />
              ))}
            </div>
          </motion.div>

          {/* ── RIGHT: Media panel ── */}
          <motion.div
            style={{ y: mediaY }}
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            className="hidden lg:block"
          >
            <MediaPanel
              activeIndex={activeIndex}
              hovered={mediaHovered}
              onEnter={() => setMediaHovered(true)}
              onLeave={() => setMediaHovered(false)}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
