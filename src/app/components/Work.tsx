import { useState, useRef, useCallback, useEffect } from 'react';
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
import { ArrowUpRight, X } from 'lucide-react';
import { GLASS, GlassAmbient, GlassReflectionSweep } from './GlassLayers';

const EASE = [0.22, 1, 0.36, 1] as const;
const RED = '#EA3323';
const LINE = 'rgba(0,0,0,0.1)';

/* ─── Data ───────────────────────────────────────────────────────────────── */

const projects = [
  {
    number: '01',
    title: 'Apptile',
    category: 'Branding',
    year: '2025',
    color: '#F0EDE8',
    video: '/videos/apptile-logomotion.mp4',
    behanceId: null,
    overview: 'A modular brand system built for scale. We unified identity, motion language, and digital presence across every surface — from app icons to investor decks.',
    deliverables: ['Logo System', 'Brand Guidelines', 'Typography Scale', 'Motion Identity', 'Digital Assets'],
    result: 'Brand recognition increased 3× in the first quarter post-launch.',
  },
  {
    number: '02',
    title: 'Terrabarn',
    category: 'Social Media',
    year: '2025',
    color: '#E8EDF2',
    video: '/videos/terrabarn-socials.mp4',
    behanceId: null,
    overview: 'Strategic content architecture and scroll-stopping creative that built a loyal community from zero — through relentless consistency and on-brand storytelling.',
    deliverables: ['Content Strategy', 'Ad Creatives', 'Feed Design', 'Monthly Reporting', 'Community Playbook'],
    result: 'Grew following by 18k in 6 months with a 9.4% average engagement rate.',
  },
  {
    number: '03',
    title: 'Ground',
    category: 'Motion Graphics',
    year: '2026',
    color: '#EBF0E8',
    video: '/videos/ground-logo.mp4',
    behanceId: null,
    overview: 'Cinematic motion identity — animated brand assets, transitions, and social reels that made the brand impossible to ignore across every screen.',
    deliverables: ['Brand Animation System', 'Social Reels', 'Lottie Animations', 'Intro/Outro Templates', 'Motion Guidelines'],
    result: 'Video content achieved 4× the reach of static posts within the first month.',
  },
  {
    number: '04',
    title: 'Yui',
    category: 'UI/UX Design',
    year: '2025',
    color: '#F0EBF0',
    video: '/videos/reservation.mp4',
    behanceId: '254011223',
    overview: 'Human-centred product design from discovery to high-fidelity. We reduced friction at every touchpoint and created an experience users actually wanted to return to.',
    deliverables: ['User Research', 'Wireframes', 'Prototype System', 'Design System', 'Handoff Documentation'],
    result: 'User session duration increased by 62% and churn dropped by 28%.',
  },
  {
    number: '05',
    title: 'Illusdoodle',
    category: 'Brand Strategy',
    year: '2025',
    color: '#EDE8F2',
    video: null,
    behanceId: null,
    overview: 'Positioning framework and creative direction that gave a fast-growing creative studio a voice worth listening to — and a brand worth remembering.',
    deliverables: ['Positioning Framework', 'Tone of Voice', 'Creative Direction', 'Brand Playbook', 'Campaign Strategy'],
    result: 'Secured two enterprise retainers within 90 days of brand relaunch.',
  },
];

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

// How far inside the process section's scroll range each stage occupies
// (0–1). Small entry/exit ramps so the first and last stage don't feel
// rushed right at the pin boundaries — same shape as the homepage cube
// showcase's projectProgress, reused here for consistency.
const PROCESS_ENTRY_END = 0.06;
const PROCESS_EXIT_START = 0.94;

function processStepProgress(p: number): number {
  if (p < PROCESS_ENTRY_END) return 0;
  if (p > PROCESS_EXIT_START) return 1;
  return (p - PROCESS_ENTRY_END) / (PROCESS_EXIT_START - PROCESS_ENTRY_END);
}

/* ─── 1Red idea-box system ───────────────────────────────────────────────────
 * "Ideas Built Into Experiences" — the boxes assemble from scattered, tilted
 * fragments into a fixed 3-over-2 grid as the user scrolls through a pinned
 * sequence, echoing the logo's own modular block construction (see
 * src/imports/Group54). Same box language as FlashWork's homepage grid
 * (hairline borders, red corner mark, radius:3) extended with a genuinely
 * new move: each box converges from its own scatter offset rather than a
 * simple slide-up, which is what makes this read as "assembling" rather
 * than "listing." Content still opens the existing CaseStudyDrawer.
 * ────────────────────────────────────────────────────────────────────────── */

const STAGGER = 0.11;
const FRAME_WINDOW = 0.4;
const CONTENT_DELAY = 0.06;

const GRID_SPAN: Record<number, string> = {
  0: 'lg:[grid-column:1/3] lg:[grid-row:1/2]',
  1: 'lg:[grid-column:3/5] lg:[grid-row:1/2]',
  2: 'lg:[grid-column:5/7] lg:[grid-row:1/2]',
  3: 'lg:[grid-column:1/4] lg:[grid-row:2/3]',
  4: 'lg:[grid-column:4/7] lg:[grid-row:2/3]',
};

const SCATTER: Record<number, { x: number; y: number; rotate: number }> = {
  0: { x: -70, y: -60, rotate: -7 },
  1: { x: 0, y: -90, rotate: 5 },
  2: { x: 70, y: -60, rotate: -5 },
  3: { x: -60, y: 70, rotate: 6 },
  4: { x: 60, y: 70, rotate: -6 },
};

/* ─── Cursor-following preview — video, mirroring FlashWork's reference implementation */

function CursorPreview({ active }: { active: number | null }) {
  const x = useMotionValue(-400);
  const y = useMotionValue(-400);
  const sx = useSpring(x, { stiffness: 380, damping: 32, mass: 0.5 });
  const sy = useSpring(y, { stiffness: 380, damping: 32, mass: 0.5 });

  useEffect(() => {
    const move = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, [x, y]);

  const project = active !== null ? projects[active] : null;

  return (
    <motion.div
      aria-hidden
      className="hidden lg:block"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        x: sx,
        y: sy,
        translateX: '24px',
        translateY: '-50%',
        width: 300,
        aspectRatio: '4 / 3',
        pointerEvents: 'none',
        zIndex: 60,
      }}
    >
      {/* mode="wait": the grid can swap active projects faster than a single
          exit transition (~340ms), so this guarantees the previous preview
          — video included — is fully unmounted before the next one mounts.
          Prevents overlapping videos when hovering quickly between boxes. */}
      <AnimatePresence mode="wait">
        {project && (
          <motion.div
            key={project.number}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.34, ease: EASE }}
            style={{
              position: 'absolute',
              inset: 0,
              overflow: 'hidden',
              border: `1px solid ${LINE}`,
              background: '#fff',
              boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
            }}
          >
            {project.video ? (
              <video
                src={project.video}
                muted
                loop
                autoPlay
                playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            ) : (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: project.color,
                  fontFamily: 'var(--font-sans)',
                  fontSize: 12,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  opacity: 0.4,
                }}
              >
                {project.title}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Assembly progress dots (same treatment as AboutSnapshot's stepper) ── */

function ProgressDot({ index, progress }: { index: number; progress: MotionValue<number> }) {
  const t0 = index * STAGGER;
  const width = useTransform(progress, [t0, t0 + 0.05], [6, 20]);
  const background = useTransform(progress, [t0, t0 + 0.05], ['rgba(0,0,0,0.14)', RED]);
  return <motion.div style={{ width, height: 6, borderRadius: 3, background }} />;
}

/* ─── Idea box — desktop, scroll-scrubbed assembly ───────────────────────── */

function IdeaBox({
  project,
  index,
  progress,
  active,
  onEnter,
  onLeave,
  onOpen,
  reduceMotion,
}: {
  project: (typeof projects)[0];
  index: number;
  progress: MotionValue<number>;
  active: number | null;
  onEnter: (i: number) => void;
  onLeave: () => void;
  onOpen: (p: (typeof projects)[0]) => void;
  reduceMotion: boolean;
}) {
  const isHovered = active === index;
  const scatter = SCATTER[index];
  const t0 = index * STAGGER;

  const frameOpacity = useTransform(progress, [t0, t0 + FRAME_WINDOW], [0, 1]);
  const frameScale = useTransform(progress, [t0, t0 + FRAME_WINDOW], [0.82, 1]);
  const frameX = useTransform(progress, [t0, t0 + FRAME_WINDOW], [scatter.x, 0]);
  const frameY = useTransform(progress, [t0, t0 + FRAME_WINDOW], [scatter.y, 0]);
  const frameRotate = useTransform(progress, [t0, t0 + FRAME_WINDOW], [scatter.rotate, 0]);
  const contentOpacity = useTransform(progress, [t0 + CONTENT_DELAY, t0 + CONTENT_DELAY + FRAME_WINDOW], [0, 1]);
  const contentY = useTransform(progress, [t0 + CONTENT_DELAY, t0 + CONTENT_DELAY + FRAME_WINDOW], [12, 0]);

  return (
    <motion.div
      onMouseEnter={() => onEnter(index)}
      onMouseLeave={onLeave}
      onClick={() => onOpen(project)}
      className={`group relative ${GRID_SPAN[index]}`}
      animate={{
        background: isHovered ? GLASS.surface.hover : GLASS.surface.idle,
        borderColor: isHovered ? GLASS.border.hover : GLASS.border.idle,
        boxShadow: isHovered ? GLASS.shadow.hover : GLASS.shadow.idle,
      }}
      transition={{ duration: 0.4, ease: EASE }}
      style={{
        borderWidth: 1,
        borderStyle: 'solid',
        borderRadius: 3,
        backdropFilter: GLASS.blur,
        WebkitBackdropFilter: GLASS.blur,
        cursor: 'pointer',
        overflow: 'hidden',
        opacity: reduceMotion ? 1 : frameOpacity,
        scale: reduceMotion ? 1 : frameScale,
        x: reduceMotion ? 0 : frameX,
        y: reduceMotion ? 0 : frameY,
        rotate: reduceMotion ? 0 : frameRotate,
      }}
    >
      <GlassAmbient hovered={isHovered} />
      <GlassReflectionSweep hovered={isHovered} reduceMotion={reduceMotion} />

      <motion.div
        style={{
          position: 'relative',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: 20,
          padding: 'clamp(24px, 2.6vw, 36px)',
          opacity: reduceMotion ? 1 : contentOpacity,
          y: reduceMotion ? 0 : contentY,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, letterSpacing: '0.12em', opacity: 0.4 }}>
            {project.number}
          </span>
          <motion.div
            animate={{ opacity: isHovered ? 1 : 0.25, rotate: isHovered ? 0 : -45, color: isHovered ? RED : '#000' }}
            transition={{ duration: 0.4, ease: EASE }}
          >
            <ArrowUpRight size={18} strokeWidth={1.5} />
          </motion.div>
        </div>

        <div>
          <motion.h3
            animate={{ x: isHovered ? 6 : 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'clamp(24px, 2.4vw, 34px)',
              fontWeight: 700,
              letterSpacing: '-0.03em',
              lineHeight: 1.06,
              margin: 0,
              marginBottom: 8,
            }}
          >
            {project.title}
          </motion.h3>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 11,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              opacity: 0.4,
              margin: 0,
            }}
          >
            {project.category} · {project.year}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Section heading — shared content, two independent reveal triggers ─── */

function HeadingContent({ inView }: { inView: boolean }) {
  return (
    <>
      <div style={{ overflow: 'hidden', marginBottom: 24 }}>
        <motion.div
          initial={{ y: '110%' }}
          animate={inView ? { y: 0 } : {}}
          transition={{ duration: 0.6, ease: EASE }}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, letterSpacing: '0.28em', textTransform: 'uppercase', opacity: 0.4 }}>
            Portfolio
          </span>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', opacity: 0.3 }}>
            {projects.length} Selected Works
          </span>
        </motion.div>
      </div>

      <div style={{ overflow: 'hidden', marginBottom: 24 }}>
        <motion.h1
          initial={{ y: '110%' }}
          animate={inView ? { y: 0 } : {}}
          transition={{ duration: 0.78, ease: EASE, delay: 0.05 }}
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'clamp(38px, 5.8vw, 84px)',
            fontWeight: 700,
            letterSpacing: '-0.035em',
            lineHeight: 1.02,
            margin: 0,
          }}
        >
          Ideas Built Into
          <br />
          Experiences
        </motion.h1>
      </div>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.62, delay: 0.16, ease: EASE }}
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 'clamp(13px, 1.2vw, 16px)',
          opacity: 0.44,
          lineHeight: 1.72,
          maxWidth: 520,
          margin: 0,
        }}
      >
        We create brands, websites, interfaces, motion graphics, and digital
        experiences that help ambitious companies stand out and scale.
      </motion.p>
    </>
  );
}

function DesktopHeading() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <div
      ref={ref}
      style={{
        borderTop: '1px solid rgba(0,0,0,0.12)',
        borderBottom: '1px solid rgba(0,0,0,0.12)',
        paddingTop: 28,
        paddingBottom: 36,
      }}
    >
      <HeadingContent inView={inView} />
    </div>
  );
}

function MobileHeading() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <div
      ref={ref}
      style={{
        marginBottom: 'clamp(2rem, 6vh, 3rem)',
        borderTop: '1px solid rgba(0,0,0,0.12)',
        borderBottom: '1px solid rgba(0,0,0,0.12)',
        paddingTop: 28,
        paddingBottom: 36,
      }}
    >
      <HeadingContent inView={inView} />
    </div>
  );
}

/* ─── Idea box — mobile/tablet, simple stacked reveal (no pin/scatter) ──── */

function MobileIdeaCard({
  project,
  onOpen,
}: {
  project: (typeof projects)[0];
  onOpen: (p: (typeof projects)[0]) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const [hovered, setHovered] = useState(false);
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={
        inView
          ? {
              opacity: 1,
              y: 0,
              background: hovered ? GLASS.surface.hover : GLASS.surface.idle,
              borderColor: hovered ? GLASS.border.hover : GLASS.border.idle,
              boxShadow: hovered ? GLASS.shadow.hover : GLASS.shadow.idle,
            }
          : {}
      }
      transition={{
        default: { duration: 0.6, ease: EASE },
        background: { duration: 0.4, ease: EASE },
        borderColor: { duration: 0.4, ease: EASE },
        boxShadow: { duration: 0.4, ease: EASE },
      }}
      onClick={() => onOpen(project)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderWidth: 1,
        borderStyle: 'solid',
        borderRadius: 3,
        backdropFilter: GLASS.blurLight,
        WebkitBackdropFilter: GLASS.blurLight,
        cursor: 'pointer',
      }}
    >
      <GlassAmbient hovered={hovered} />
      <GlassReflectionSweep hovered={hovered} reduceMotion={reduceMotion} />

      <div style={{ position: 'relative', padding: 'clamp(22px, 5vw, 30px)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, letterSpacing: '0.12em', opacity: 0.4 }}>
            {project.number}
          </span>
          <motion.div animate={{ opacity: hovered ? 1 : 0.3, rotate: hovered ? 0 : -45, color: hovered ? RED : '#000' }} transition={{ duration: 0.3, ease: EASE }}>
            <ArrowUpRight size={18} strokeWidth={1.5} />
          </motion.div>
        </div>
        <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(24px, 6vw, 32px)', fontWeight: 700, letterSpacing: '-0.03em', margin: '0 0 8px' }}>
          {project.title}
        </h3>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.4, margin: 0 }}>
          {project.category} · {project.year}
        </p>
      </div>
    </motion.div>
  );
}

/* ─── Case study drawer ──────────────────────────────────────────────────── */

function CaseStudyDrawer({
  project,
  onClose,
}: {
  project: (typeof projects)[0] | null;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {project && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.32)',
              zIndex: 200,
              backdropFilter: 'blur(4px)',
            }}
          />

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.52, ease: EASE }}
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              maxHeight: '85vh',
              background: 'white',
              borderRadius: '24px 24px 0 0',
              zIndex: 201,
              overflow: 'auto',
              padding: 'clamp(2rem, 5vw, 4rem)',
            }}
          >
            {/* Close */}
            <button
              onClick={onClose}
              style={{
                position: 'absolute',
                top: 24,
                right: 24,
                width: 40,
                height: 40,
                borderRadius: '50%',
                border: '1px solid rgba(0,0,0,0.1)',
                background: 'rgba(0,0,0,0.03)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={16} strokeWidth={1.5} />
            </button>

            {/* Preview */}
            <div
              style={{
                width: '100%',
                aspectRatio: '16/7',
                borderRadius: 16,
                backgroundColor: project.color,
                marginBottom: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 120, height: 2, background: 'rgba(0,0,0,0.15)', borderRadius: 1 }} />
                <div style={{ width: 80, height: 2, background: 'rgba(0,0,0,0.08)', borderRadius: 1 }} />
              </div>
              <div style={{ position: 'absolute', bottom: 16, right: 20, fontSize: 10, letterSpacing: '0.18em', opacity: 0.3, textTransform: 'uppercase' }}>
                {project.number} / 05
              </div>
            </div>

            {/* Content grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 32 }} className="lg:grid-cols-[1fr_1fr_1fr]">
              <div>
                <p style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.35, marginBottom: 8 }}>Project</p>
                <h2 style={{ fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.06, margin: 0 }}>
                  {project.title}
                </h2>
                <p style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.36, marginTop: 8 }}>
                  {project.category} · {project.year}
                </p>
              </div>

              <div>
                <p style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.35, marginBottom: 12 }}>Overview</p>
                <p style={{ fontSize: 14, lineHeight: 1.74, opacity: 0.55 }}>{project.overview}</p>
                <p style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.35, marginTop: 24, marginBottom: 12 }}>Result</p>
                <p style={{ fontSize: 14, lineHeight: 1.74, opacity: 0.55 }}>{project.result}</p>
              </div>

              <div>
                <p style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.35, marginBottom: 12 }}>Deliverables</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {project.deliverables.map((d) => (
                    <div
                      key={d}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        fontSize: 13,
                        opacity: 0.6,
                      }}
                    >
                      <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'currentColor', flexShrink: 0, opacity: 0.4 }} />
                      {d}
                    </div>
                  ))}
                </div>

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.25, ease: EASE }}
                  style={{
                    marginTop: 32,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '14px 28px',
                    borderRadius: 3,
                    border: '1px solid rgba(0,0,0,0.14)',
                    background: 'rgba(0,0,0,0.03)',
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                  }}
                >
                  Visit Project <ArrowUpRight size={14} strokeWidth={1.8} />
                </motion.button>
              </div>
            </div>

            {/* Behance case study — only rendered for projects that have one */}
            {project.behanceId && (
              <div style={{ marginTop: 40 }}>
                <p style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.35, marginBottom: 16 }}>
                  Case Study
                </p>
                <div
                  style={{
                    border: `1px solid rgba(0,0,0,0.1)`,
                    borderRadius: 3,
                    overflow: 'hidden',
                    maxWidth: 480,
                    width: '100%',
                  }}
                >
                  <iframe
                    src={`https://www.behance.net/embed/project/${project.behanceId}?ilo0=1`}
                    height="316"
                    width="404"
                    allowFullScreen
                    loading="lazy"
                    frameBorder="0"
                    allow="clipboard-write"
                    referrerPolicy="strict-origin-when-cross-origin"
                    style={{ display: 'block', width: '100%', height: 'auto', aspectRatio: '404 / 316', border: 'none' }}
                  />
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ─── Process card ───────────────────────────────────────────────────────── */

function ProcessCard({ step, index }: { step: (typeof process)[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  const isLast = index === process.length - 1;
  const [hovered, setHovered] = useState(false);
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={
          inView
            ? {
                opacity: 1,
                y: hovered && !reduceMotion ? -4 : 0,
                background: hovered ? GLASS.surface.hover : GLASS.surface.idle,
                borderColor: hovered ? GLASS.border.hover : GLASS.border.idle,
                boxShadow: hovered ? GLASS.shadow.hover : GLASS.shadow.idle,
              }
            : {}
        }
        transition={{
          default: { duration: 0.68, ease: EASE, delay: index * 0.08 },
          y: { duration: 0.4, ease: EASE },
          background: { duration: 0.4, ease: EASE },
          borderColor: { duration: 0.4, ease: EASE },
          boxShadow: { duration: 0.4, ease: EASE },
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderWidth: 1,
          borderStyle: 'solid',
          borderRadius: 20,
          padding: 'clamp(24px, 3vw, 36px)',
          backdropFilter: GLASS.blur,
          WebkitBackdropFilter: GLASS.blur,
          zIndex: 1,
        }}
      >
        <GlassAmbient hovered={hovered} />
        <GlassReflectionSweep hovered={hovered} reduceMotion={reduceMotion} />

        <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: 20 }}>
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

      {/* Connector line */}
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

/* ─── Process rail — anchored left-side progress indicator ───────────────────
 * One continuous line (not four separate connectors) whose red fill tracks
 * scroll progress directly, with a dot + label per stage. This is the same
 * element that also satisfies the brief's "subtle ambient motion" ask — it's
 * the one thing genuinely moving in the left column, so there's no need for
 * a second, purely decorative moving element competing for attention.
 * ────────────────────────────────────────────────────────────────────────── */

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

/* ─── Process story card — the active stage, materializing in place ─────────
 * One fixed slot the content flows through as the user scrolls, rather than
 * a growing list — this is what keeps the two columns balanced regardless
 * of how many stages exist, and what makes 01→02→03→04→05 read as a single
 * continuous choreography instead of unrelated cards appearing in sequence.
 * Same glass recipe as the rest of the site (apple-design §12): backdrop
 * blur(20px) saturate(180%), red-tinted border, bright inset top highlight.
 * ────────────────────────────────────────────────────────────────────────── */

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

/* ─── Page ───────────────────────────────────────────────────────────────── */

export function Work() {
  const [activeProject, setActiveProject] = useState<(typeof projects)[0] | null>(null);
  const [active, setActive] = useState<number | null>(null);
  const processRef = useRef<HTMLDivElement>(null);
  const processInView = useInView(processRef, { once: true, margin: '-60px' });
  const reduceMotion = useReducedMotion() ?? false;

  const onEnter = useCallback((i: number) => setActive(i), []);
  const onLeave = useCallback(() => setActive(null), []);

  /* ── Pinned scroll-choreography progress (desktop only) ────────────────────
   * Same technique as AboutSnapshot's pinned sequence: a tall scroll-space
   * wrapper + a `position: sticky` inner viewport, progress derived from the
   * wrapper's own position each frame (rAF-throttled, passive, single shared
   * motion value — no React state, no re-renders on scroll).
   */
  const pinWrapRef = useRef<HTMLDivElement>(null);
  const rawProgress = useMotionValue(0);
  const smoothProgress = useSpring(rawProgress, { stiffness: 80, damping: 22, mass: 1 });

  useEffect(() => {
    if (reduceMotion) {
      rawProgress.set(1);
      return;
    }
    let rafId: number;
    const update = () => {
      const el = pinWrapRef.current;
      if (!el) return;
      const scrollable = el.offsetHeight - window.innerHeight;
      if (scrollable <= 0) {
        rawProgress.set(1);
        return;
      }
      const top = el.getBoundingClientRect().top;
      const p = Math.max(0, Math.min(1, -top / scrollable));
      rawProgress.set(p);
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
  }, [rawProgress, reduceMotion]);

  /* ── Process story progress (desktop only) ──────────────────────────────────
   * Same tall-wrapper + sticky-viewport technique as the pin above, kept
   * entirely separate (own ref, own motion values) since it drives a
   * different pinned sequence further down the page. `processActiveIndex`
   * is real React state, but it's only ever written when the computed index
   * actually changes (guarded by `processLastIndexRef`) — five updates for
   * the whole scroll journey, not sixty a second — because the active
   * stage's title/description are real text content, which transform/
   * opacity alone can't animate between; everything else (the rail fill,
   * the card's entrance) rides the motion values directly.
   */
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
    <main
      style={{
        minHeight: '100vh',
        background: 'rgb(248,248,248)',
        paddingTop: 'clamp(6rem, 12vh, 10rem)',
        paddingBottom: '8rem',
      }}
    >
      <CursorPreview active={active} />

      <div
        style={{
          maxWidth: 1400,
          margin: '0 auto',
          paddingLeft: 'clamp(1.5rem, 4vw, 5rem)',
          paddingRight: 'clamp(1.5rem, 4vw, 5rem)',
        }}
      >

        {/* ══════════ DESKTOP: pinned box-assembly sequence ══════════ */}
        <div
          ref={pinWrapRef}
          className="hidden lg:block"
          style={{
            height: reduceMotion ? 'auto' : '300vh',
            position: reduceMotion ? 'static' : 'relative',
            marginBottom: 'clamp(4rem, 8vh, 6rem)',
          }}
        >
          <div
            style={{
              position: reduceMotion ? 'static' : 'sticky',
              top: 0,
              height: reduceMotion ? 'auto' : '100vh',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 'clamp(2rem, 4vh, 3rem)',
              paddingTop: reduceMotion ? '2rem' : 0,
              paddingBottom: reduceMotion ? '2rem' : 0,
            }}
          >
            {/* Heading — establishes once as the sequence opens */}
            <DesktopHeading />

            {/* Assembly progress — one dot per idea, fills as its box arrives */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {projects.map((_, i) => (
                <ProgressDot key={i} index={i} progress={smoothProgress} />
              ))}
            </div>

            {/* Idea-box grid */}
            <div
              className="grid grid-cols-1 lg:[grid-template-columns:repeat(6,1fr)] lg:[grid-template-rows:repeat(2,minmax(170px,1fr))]"
              style={{ gap: 0 }}
            >
              {projects.map((project, i) => (
                <IdeaBox
                  key={project.number}
                  project={project}
                  index={i}
                  progress={smoothProgress}
                  active={active}
                  onEnter={onEnter}
                  onLeave={onLeave}
                  onOpen={setActiveProject}
                  reduceMotion={reduceMotion}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ══════════ MOBILE / TABLET: simple stacked reveal, no pin ══════════ */}
        <div className="lg:hidden" style={{ marginBottom: 'clamp(3.5rem, 8vh, 6rem)' }}>
          <MobileHeading />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {projects.map((project) => (
              <MobileIdeaCard key={project.number} project={project} onOpen={setActiveProject} />
            ))}
          </div>
        </div>

        {/* Divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: EASE }}
          style={{ height: 1, background: 'rgba(0,0,0,0.08)', transformOrigin: 'left', marginBottom: 'clamp(4rem, 8vh, 6rem)' }}
        />

        {/* ── Process section ── */}
        <div ref={processRef}>

          {/* Desktop: pinned scroll-driven story — heading + rail stay
              anchored on the left while the active stage materializes in a
              single fixed slot on the right. Skipped entirely under reduced
              motion (falls through to the same simple stack mobile uses). */}
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

                  {/* Right: the active stage, one slot the content flows through */}
                  <ProcessStoryCard step={process[processActiveIndex]} activeIndex={processActiveIndex} total={process.length} />
                </div>
              </div>
            </div>
          )}

          {/* Mobile/tablet + reduced-motion: simple stacked reveal — no pin,
              no scroll-driven story, just the existing proven pattern. */}
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

      {/* ── Case study drawer ── */}
      <CaseStudyDrawer project={activeProject} onClose={() => setActiveProject(null)} />
    </main>
  );
}
