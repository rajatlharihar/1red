import { useCallback, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useMotionTemplate, useSpring, useReducedMotion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router';
import projectsData from '../data/projects.json';

type Project = (typeof projectsData)[0];

const EASE = [0.22, 1, 0.36, 1] as const;
const RED = '#EA3323';

/* ─── Project detail card — bottom-left ─────────────────────────────────
 * An editorial/technical panel, not a generic glass card: boxy geometry
 * (borderRadius: 3, the site's structural standard — see design-system.md),
 * a thin border that reads red only on interaction, and the recurring
 * small red-square marker used elsewhere on the site as a section-eyebrow
 * signature. All hover states (border, corner marker, headline, arrow,
 * CTA) derive from one `hovered` boolean so nothing can drift out of sync.
 * The whole card is the click target — "View Case Study" is a quiet
 * technical marker in the corner, not a boxed button.
 * `cardHoverRef` is written on hover so the cube can "notice" the card —
 * see ThreeEnvironment's Center3DSlot tilt logic — without either side
 * ever re-rendering off the other.
 * ────────────────────────────────────────────────────────────────────── */

function ProjectCard({
  project,
  cardHoverRef,
}: {
  project: Project;
  cardHoverRef: React.MutableRefObject<boolean>;
}) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const reduceMotion = useReducedMotion() ?? false;

  // 3D tilt — rotation is a direct function of pointer position within the
  // card (not a per-frame loop), sprung so it settles smoothly rather than
  // snapping. Small tilt values only (±7deg): this is a reading surface
  // with real text on it, not a showcase object — anything more aggressive
  // would fight legibility.
  const rotateXRaw = useMotionValue(0);
  const rotateYRaw = useMotionValue(0);
  const rotateX = useSpring(rotateXRaw, { stiffness: 300, damping: 28, mass: 0.6 });
  const rotateY = useSpring(rotateYRaw, { stiffness: 300, damping: 28, mass: 0.6 });
  const glareX = useMotionValue(50);
  const glareY = useMotionValue(50);
  // A soft light sheen that tracks the same pointer position as the tilt —
  // "light catching the material" (this project's established glass
  // language, see GlassLayers.tsx) rather than a flat rotation with no
  // sense of a physical surface.
  const glareBackground = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.65), transparent 60%)`;

  const handleCTA = useCallback(() => {
    navigate('/services');
  }, [navigate]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleCTA();
      }
    },
    [handleCTA]
  );

  const handleEnter = useCallback(() => {
    setHovered(true);
    cardHoverRef.current = true;
  }, [cardHoverRef]);

  const handleLeave = useCallback(() => {
    setHovered(false);
    cardHoverRef.current = false;
    rotateXRaw.set(0);
    rotateYRaw.set(0);
  }, [cardHoverRef, rotateXRaw, rotateYRaw]);

  const handlePointerMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (reduceMotion) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      const MAX_TILT = 7;
      rotateYRaw.set((px - 0.5) * MAX_TILT * 2);
      rotateXRaw.set((0.5 - py) * MAX_TILT * 2);
      glareX.set(px * 100);
      glareY.set(py * 100);
    },
    [reduceMotion, rotateXRaw, rotateYRaw, glareX, glareY]
  );

  return (
    <motion.div
      key={project.id}
      initial={{ opacity: 0, y: 32, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -16, filter: 'blur(4px)' }}
      transition={{ duration: 0.55, ease: EASE }}
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        perspective: 1000,
      }}
    >
      <motion.div
        role="button"
        tabIndex={0}
        aria-label={`View case study — ${project.title}`}
        onClick={handleCTA}
        onKeyDown={handleKeyDown}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        onMouseMove={handlePointerMove}
        whileTap={reduceMotion ? undefined : { scale: 0.98 }}
        animate={{
          borderColor: hovered ? 'rgba(234,51,35,0.42)' : 'rgba(10,10,10,0.1)',
          boxShadow: hovered
            ? '0 30px 68px rgba(234,51,35,0.10), 0 6px 20px rgba(0,0,0,0.06)'
            : '0 22px 54px rgba(0,0,0,0.09), 0 4px 14px rgba(0,0,0,0.04)',
        }}
        transition={{ duration: 0.35, ease: EASE }}
        style={{
          rotateX: reduceMotion ? 0 : rotateX,
          rotateY: reduceMotion ? 0 : rotateY,
          transformStyle: 'preserve-3d',
          position: 'relative',
          overflow: 'hidden',
          background: 'rgba(253,251,248,0.97)',
          border: '1px solid rgba(10,10,10,0.1)',
          borderRadius: 3,
          padding: 'clamp(22px, 2.6vw, 34px)',
          cursor: 'pointer',
        }}
      >
        {/* Metadata row — number / category / year, plus the interaction arrow */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 'clamp(16px, 2vw, 22px)',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 10.5,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'rgba(10,10,10,0.42)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {project.number}/0{projectsData.length} — {project.category} — {project.year}
          </span>
          <motion.span
            animate={{ x: hovered ? 3 : 0, y: hovered ? -3 : 0, color: hovered ? RED : 'rgba(10,10,10,0.5)' }}
            transition={{ duration: 0.3, ease: EASE }}
            style={{ flexShrink: 0, display: 'flex' }}
          >
            <ArrowUpRight size={16} strokeWidth={1.8} />
          </motion.span>
        </div>

        {/* Headline — the visual anchor */}
        <motion.h2
          animate={{ x: hovered ? 2 : 0 }}
          transition={{ duration: 0.3, ease: EASE }}
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'clamp(30px, 3vw, 44px)',
            fontWeight: 800,
            letterSpacing: '-0.035em',
            lineHeight: 1.02,
            margin: '0 0 clamp(12px, 1.6vw, 18px)',
            color: '#0a0a0a',
          }}
        >
          {project.title}
        </motion.h2>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(10,10,10,0.08)', marginBottom: 'clamp(14px, 1.8vw, 18px)' }} />

        {/* Overview — truncated to 2 lines for compactness */}
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 13,
            lineHeight: 1.66,
            color: 'rgba(10,10,10,0.55)',
            margin: '0 0 clamp(16px, 2vw, 22px)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          } as React.CSSProperties}
        >
          {project.overview}
        </p>

        {/* Deliverables — plain uppercase technical labels, not pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'clamp(10px, 1.4vw, 16px)', marginBottom: 'clamp(14px, 1.8vw, 20px)' }}>
          {project.deliverables.slice(0, 3).map((d, i) => (
            <span key={d} style={{ display: 'flex', alignItems: 'center', gap: 'clamp(10px, 1.4vw, 16px)' }}>
              {i > 0 && <span aria-hidden style={{ width: 3, height: 3, background: 'rgba(10,10,10,0.25)', flexShrink: 0 }} />}
              <span
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 10,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'rgba(10,10,10,0.5)',
                }}
              >
                {d}
              </span>
            </span>
          ))}
        </div>

        {/* CTA — a quiet technical marker, not a boxed button */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 6,
            paddingTop: 'clamp(10px, 1.4vw, 14px)',
            borderTop: '1px solid rgba(10,10,10,0.06)',
          }}
        >
          <motion.span
            animate={{ opacity: hovered ? 1 : 0.5, color: hovered ? RED : 'rgba(10,10,10,0.5)' }}
            transition={{ duration: 0.3, ease: EASE }}
            style={{ fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase' }}
          >
            View Case Study
          </motion.span>
          <motion.span
            animate={{ x: hovered ? 3 : 0, color: hovered ? RED : 'rgba(10,10,10,0.5)' }}
            transition={{ duration: 0.3, ease: EASE }}
            style={{ display: 'flex' }}
          >
            <ArrowUpRight size={12} strokeWidth={2} />
          </motion.span>
        </div>

        {/* Light sheen — tracks the same pointer position as the tilt, above
            every content layer but never intercepting clicks. */}
        <motion.div
          aria-hidden
          animate={{ opacity: hovered && !reduceMotion ? 1 : 0 }}
          transition={{ duration: 0.25 }}
          style={{
            position: 'absolute',
            inset: 0,
            background: glareBackground,
            mixBlendMode: 'overlay',
            pointerEvents: 'none',
          }}
        />
      </motion.div>
    </motion.div>
  );
}

/* ─── Main HUD export ────────────────────────────────────────────────────
 * Renders:
 *  • Scroll hint (visible when no project is active yet)
 *  • Bottom-left project card (AnimatePresence swap per project)
 *  • Bottom-center progress ticks
 * All fixed-positioned so they float above the Three.js canvas.
 * ────────────────────────────────────────────────────────────────────── */

export function ProjectHUD({
  activeIndex,
  cardHoverRef,
}: {
  activeIndex: number | null;
  /** Shared with ThreeEnvironment so the cube can "notice" the card on
   *  hover — see Center3DSlot's tilt logic. A plain ref, never state. */
  cardHoverRef: React.MutableRefObject<boolean>;
}) {
  const activeProject = activeIndex !== null ? projectsData[activeIndex] : null;

  return (
    <>

      {/* Bottom-left panel */}
      <div
        style={{
          position: 'fixed',
          bottom: 'clamp(24px, 3vw, 52px)',
          left: 'clamp(20px, 3vw, 52px)',
          zIndex: 105,
          width: 'clamp(280px, 28vw, 400px)',
          pointerEvents: activeProject ? 'auto' : 'none',
        }}
      >
        <AnimatePresence mode="wait">
          {activeProject && <ProjectCard key={activeProject.id} project={activeProject as Project} cardHoverRef={cardHoverRef} />}
        </AnimatePresence>
      </div>
    </>
  );
}
