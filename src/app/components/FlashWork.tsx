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
import { Link } from 'react-router';
import { ArrowUpRight } from 'lucide-react';
import { GLASS } from './GlassLayers';
import projectsData from '../data/projects.json';

/* ─── "Selected Work" — pinned scroll-through list + swapping visual ────────
 * Interaction reference: neutomni.com's own portfolio section (a pinned
 * two-column list-and-mockup layout, confirmed via their DevTools tree to
 * be a GSAP ScrollTrigger pin — `pin-spacer` is literally ScrollTrigger's
 * auto-generated wrapper class name). This project has a standing rule
 * that `motion/react` is the ONLY animation library — GSAP is explicitly
 * rejected, repeatedly — so this rebuilds the same INTERACTION (pin, a
 * scroll-driven active project, list rows that brighten/underline as they
 * become active, a swapping visual) using this codebase's own established
 * scroll-progress pattern (see Studio.tsx's Process/Principles sections —
 * same shape, reused rather than reinvented). Content, typography, and the
 * client names are entirely OneRed's own; only the interaction shape is
 * shared with the reference, per this project's long-standing "study how a
 * reference site feels, never copy how it looks" rule.
 * ────────────────────────────────────────────────────────────────────────── */

const EASE = [0.22, 1, 0.36, 1] as const;
const RED = '#EA3323';

/* Fine film-grain texture — a tiled SVG feTurbulence noise, not a raster
   asset — the same texture used across this project's other card surfaces. */
const NOISE_URL =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";
const grainOverlayStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  backgroundImage: `url("${NOISE_URL}")`,
  backgroundSize: '160px 160px',
  mixBlendMode: 'overlay',
  opacity: 0.08,
  pointerEvents: 'none',
};

/* Single source of truth. This section previously carried its own local
   array holding only title/category/year/video — which meant the site's
   PROOF section displayed less about each project than any other part of
   the site, while the real evidence (overview, deliverables, result) sat
   unused in projects.json. Reading from the shared file instead lets each
   project actually argue for itself, and gives every row a real case-study
   destination via its `id`. */
/* Only the projects Rajat is showing for now (R28: Apptile, Yui,
   Illusdoodle); the others stay in the data with `hidden`. */
const projects = projectsData.filter((p) => !(p as { hidden?: boolean }).hidden);
const WORK_COUNT = projects.length;

/* Shared by the list rows and the visual, which lines up with the headline
   (below the eyebrow) and the last row's underline (above its padding). */
const ROW_PAD_Y = 'clamp(8px, 1.4vh, 20px)';
const EYEBROW_LINE = 14;
const HEADING_GAP = 14;
const HEADLINE_OFFSET = EYEBROW_LINE + HEADING_GAP;

// Same pinned-scroll shape as Studio.tsx's Process/Principles sections: a
// tall wrapper, an opening/closing dwell to hold on the first/last project,
// and a fixed scroll distance per transition in between.
const WORK_DWELL_VH = 36;
const WORK_SEGMENT_VH = 58;
const WORK_TOTAL_VH = WORK_DWELL_VH * 2 + WORK_SEGMENT_VH * (WORK_COUNT - 1);
const WORK_DWELL_FRAC = WORK_DWELL_VH / WORK_TOTAL_VH;
const WORK_SEG_FRAC = WORK_SEGMENT_VH / WORK_TOTAL_VH;

function workActiveValue(p: number): number {
  if (p <= WORK_DWELL_FRAC) return 0;
  return Math.min((p - WORK_DWELL_FRAC) / WORK_SEG_FRAC, WORK_COUNT - 1);
}

// Inverse of the above — the raw 0–1 progress that lands exactly on
// project `i`, used to scroll the window there when a row is clicked.
function progressForIndex(i: number): number {
  if (i <= 0) return WORK_DWELL_FRAC * 0.5;
  return Math.min(1, WORK_DWELL_FRAC + i * WORK_SEG_FRAC);
}

/* ─── One list row — brightens from a pale red to full OneRed red and grows
 * its underline as the pinned scroll brings it into focus. Continuous
 * "closeness" interpolation (same technique as Studio.tsx's PrincipleCard),
 * not a hard on/off swap — so it's always mid-transition-accurate no matter
 * where scroll currently sits, and instantly reversible. Clicking a row
 * jumps the page's scroll straight to that project. */
function ProjectRow({
  project,
  index,
  activeValue,
  onJump,
}: {
  project: (typeof projects)[0];
  index: number;
  activeValue: MotionValue<number>;
  onJump: (i: number) => void;
}) {
  const closeness = useTransform(activeValue, (v) => Math.max(0, 1 - Math.abs(v - index)));
  const titleColor = useTransform(closeness, [0, 1], ['rgba(234,51,35,0.32)', RED]);
  const metaOpacity = useTransform(closeness, [0, 1], [0.28, 0.6]);
  const underlineScale = useTransform(closeness, [0, 1], [0.08, 1]);
  const underlineOpacity = useTransform(closeness, [0, 1], [0.14, 1]);

  // A row is a link to the project's own page (Rajat, R28); hovering it
  // brings its visual up in the panel, as the click used to.
  return (
    <Link
      to={`/work/${project.id}`}
      onMouseEnter={() => onJump(index)}
      onFocus={() => onJump(index)}
      className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#EA3323]"
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        background: 'none',
        border: 'none',
        padding: `${ROW_PAD_Y} 0`,
        cursor: 'pointer',
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, minWidth: 0 }}>
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 13,
              fontWeight: 600,
              opacity: 0.35,
              fontVariantNumeric: 'tabular-nums',
              flexShrink: 0,
            }}
          >
            {project.number}.
          </span>
          <motion.span
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'clamp(22px, min(3vw, 5vh), 42px)',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              color: titleColor,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {project.title}
          </motion.span>
        </div>
        <motion.span
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 11,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            opacity: metaOpacity,
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {project.category}
        </motion.span>
      </div>
      <motion.div
        style={{
          height: 2,
          background: RED,
          marginTop: 'clamp(6px, 1vh, 10px)',
          transformOrigin: 'left',
          scaleX: underlineScale,
          opacity: underlineOpacity,
        }}
      />
    </Link>
  );
}

/* ─── Rotating circular badge — the reference's own signature interaction
 * (spinning circular text + a fixed center CTA), a generic, widely-used
 * technique rebuilt from scratch in OneRed red rather than lifted from
 * their code. The red centre is a real link to the active project's own
 * page, as nknstudio.com's cards open (Rajat, R26).
 *
 * `x`/`y` are magnetic offsets computed by the parent panel from cursor
 * distance to the badge (same technique as Footer's MagneticCTA) — the
 * badge itself stays `pointer-events: none` since it isn't a real link;
 * the panel tracks the mouse and feeds the pull in. */
function ExploreBadge({ x, y, hovered, to }: { x: MotionValue<number>; y: MotionValue<number>; hovered: boolean; to: string }) {
  const label = 'EXPLORE MORE • ';
  const chars = label.repeat(3).split('');
  const radius = 54;

  return (
    <motion.div
      animate={{ scale: hovered ? 1.1 : 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      style={{
        position: 'absolute',
        bottom: 'clamp(16px, 3vw, 28px)',
        right: 'clamp(16px, 3vw, 28px)',
        width: 128,
        height: 128,
        x,
        y,
        // A real link now: the badge goes to the full gallery at /work.
        pointerEvents: 'auto',
      }}
    >
      {/* Backing plate — keeps the white circular text legible no matter
          what's playing behind it in the video/placeholder layer. */}
      <div
        style={{
          position: 'absolute',
          inset: 6,
          borderRadius: '50%',
          background: 'rgba(10,10,10,0.55)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
        }}
      />
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
        style={{ position: 'absolute', inset: 0 }}
      >
        {chars.map((ch, i) => (
          <span
            key={i}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: `translate(-50%, -50%) rotate(${(360 / chars.length) * i}deg) translateY(-${radius}px)`,
              fontFamily: 'var(--font-sans)',
              fontSize: 8.5,
              fontWeight: 700,
              letterSpacing: '0.02em',
              color: 'white',
              whiteSpace: 'pre',
            }}
          >
            {ch}
          </span>
        ))}
      </motion.div>
      <Link
        to={to}
        aria-label="Explore this project"
        style={{
          position: 'absolute',
          inset: 24,
          borderRadius: '50%',
          background: RED,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 14px 30px rgba(234,51,35,0.4)',
        }}
      >
        <ArrowUpRight color="white" size={22} strokeWidth={2.2} />
      </Link>
    </motion.div>
  );
}

/* Only the active project is ever mounted as a real <video> — AnimatePresence
   crossfades the outgoing/incoming layer, so at most two videos are briefly
   alive together during a transition, never all five at once. Projects with
   no video (Illusdoodle) get a proper cover treatment — the title itself,
   large and bold — instead of an empty flat-red block with nothing on it. */
function VisualPanel({ project }: { project: (typeof projects)[0] }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const attempt = () => v.play().catch(() => {});
    if (v.readyState >= 2) attempt();
    else v.addEventListener('canplay', attempt, { once: true });
    // Decoding a looping video off screen costs frames further down the
    // page, so it only plays while it is actually in view.
    const io = new IntersectionObserver((e) => {
      if (e[0].isIntersecting) attempt();
      else v.pause();
    });
    io.observe(v);
    return () => io.disconnect();
  }, [project.video]);

  return (
    <motion.div
      key={project.number}
      initial={{ opacity: 0, scale: 1.04 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.55, ease: EASE }}
      style={{ position: 'absolute', inset: 0 }}
    >
      {project.video ? (
        <video
          ref={videoRef}
          src={project.video}
          muted
          loop
          autoPlay
          playsInline
          preload="auto"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : project.image ? (
        <img
          src={project.image}
          alt={project.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: RED,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'clamp(24px, 4vw, 48px)',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'clamp(40px, 6vw, 80px)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1,
              color: 'rgba(255,255,255,0.94)',
              textAlign: 'center',
            }}
          >
            {project.title}
          </span>
        </div>
      )}
    </motion.div>
  );
}

/* ─── Static, non-pinned fallback — mobile/tablet and reduced-motion. Every
 * project fully visible and readable, no scroll-jacking, no video load. */
function StaticWorkList() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {projects.map((project) => (
        <div key={project.number} style={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
          <Link
          to={`/work/${project.id}`}
          className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#EA3323]"
          style={{ display: 'block', padding: '18px 0', textDecoration: 'none', color: 'rgb(10,10,10)' }}
        >
          {(project as { thumb?: string }).thumb && (
            <img
              src={(project as { thumb?: string }).thumb}
              alt=""
              loading="lazy"
              style={{ display: 'block', width: '100%', aspectRatio: '16 / 9', objectFit: 'cover', marginBottom: 14, background: '#F2EFE8' }}
            />
          )}
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, opacity: 0.4 }}>{project.number}.</span>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(22px, 5vw, 30px)', fontWeight: 800, letterSpacing: '-0.02em', color: RED }}>
                {project.title}
              </span>
            </div>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.5, whiteSpace: 'nowrap' }}>
              {project.category}
            </span>
          </div>
          {/* On mobile the visual panel doesn't render, so the overview is
              the only evidence available — show it rather than reducing
              the proof chapter to a bare list of names. */}
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, lineHeight: 1.6, opacity: 0.55, margin: '10px 0 0' }}>
            {project.overview}
          </p>
          </Link>
        </div>
      ))}
    </div>
  );
}

/* ─── Main export ────────────────────────────────────────────────────────── */

export function FlashWork() {
  const headingRef = useRef<HTMLDivElement>(null);
  const headingInView = useInView(headingRef, { once: true, margin: '-60px' });
  const reduceMotion = useReducedMotion() ?? false;

  // Desktop = the pinned two-column list/visual experience; mobile/tablet
  // gets the plain static list (see StaticWorkList) — matching the same
  // desktop-only-pin convention already established for Work.tsx's process
  // story and the /services 3D environment.
  const [isDesktop, setIsDesktop] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const apply = () => setIsDesktop(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  const wrapRef = useRef<HTMLDivElement>(null);
  const rawProgress = useMotionValue(0);
  const activeValue = useTransform(rawProgress, workActiveValue);
  const [activeIndex, setActiveIndex] = useState(0);
  const lastIndexRef = useRef(0);

  useEffect(() => {
    return activeValue.on('change', (v) => {
      const idx = Math.round(v);
      if (idx !== lastIndexRef.current) {
        lastIndexRef.current = idx;
        setActiveIndex(idx);
      }
    });
  }, [activeValue]);

  useEffect(() => {
    if (reduceMotion || !isDesktop) return;
    let rafId: number;
    const update = () => {
      const el = wrapRef.current;
      if (!el) return;
      const scrollable = el.offsetHeight - window.innerHeight;
      if (scrollable <= 0) {
        rawProgress.set(1);
        return;
      }
      const top = el.getBoundingClientRect().top;
      rawProgress.set(Math.max(0, Math.min(1, -top / scrollable)));
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
  }, [rawProgress, reduceMotion, isDesktop]);

  const jumpToIndex = useCallback(
    (i: number) => {
      const el = wrapRef.current;
      if (!el) return;
      const scrollable = el.offsetHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const wrapTop = window.scrollY + el.getBoundingClientRect().top;
      const targetY = wrapTop + progressForIndex(i) * scrollable;
      window.scrollTo({ top: targetY, behavior: reduceMotion ? 'auto' : 'smooth' });
    },
    [reduceMotion]
  );

  // Magnetic pull on the "Explore More" badge — tracked on the whole panel
  // (not the badge itself, which stays pointer-events:none) so the badge
  // visibly reacts as the cursor approaches, same technique as Footer's
  // MagneticCTA. Resting position is bottom-right, radius/offsets below
  // match ExploreBadge's own layout constants.
  const badgeXRaw = useMotionValue(0);
  const badgeYRaw = useMotionValue(0);
  const badgeX = useSpring(badgeXRaw, { stiffness: 200, damping: 20, mass: 0.6 });
  const badgeY = useSpring(badgeYRaw, { stiffness: 200, damping: 20, mass: 0.6 });
  const [badgeHovered, setBadgeHovered] = useState(false);

  const handlePanelMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (reduceMotion) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const badgeOffset = Math.max(16, Math.min(28, rect.width * 0.025)) + 64; // edge offset + half the 128px badge
      const badgeCenterX = rect.width - badgeOffset;
      const badgeCenterY = rect.height - badgeOffset;
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const dx = mx - badgeCenterX;
      const dy = my - badgeCenterY;
      const dist = Math.hypot(dx, dy);
      const RADIUS = 170;
      if (dist < RADIUS) {
        const pull = (1 - dist / RADIUS) * 22;
        const angle = Math.atan2(dy, dx);
        badgeXRaw.set(Math.cos(angle) * pull);
        badgeYRaw.set(Math.sin(angle) * pull);
        setBadgeHovered(true);
      } else {
        badgeXRaw.set(0);
        badgeYRaw.set(0);
        setBadgeHovered(false);
      }
    },
    [reduceMotion, badgeXRaw, badgeYRaw]
  );

  const handlePanelMouseLeave = useCallback(() => {
    badgeXRaw.set(0);
    badgeYRaw.set(0);
    setBadgeHovered(false);
  }, [badgeXRaw, badgeYRaw]);

  /* The intro carries the home page's story on from the cubes ("Or hire
     the whole box."): same Swiss row as that poster, headline flush-left
     over two lines, the label on the right, one hairline rule beneath. */
  const Heading = (
    <div ref={headingRef} style={{ display: 'flex', flexDirection: 'column', gap: HEADING_GAP, marginBottom: 'clamp(1.25rem, 3vh, 3.5rem)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24 }}>
        <div className="overflow-hidden">
          <motion.h2
            initial={{ y: '110%' }}
            animate={headingInView ? { y: 0 } : {}}
            transition={{ duration: 0.78, ease: EASE, delay: 0.05 }}
            // Identical to the cube poster's headline (ProblemCube): 500, -0.03em, leading 1.
            style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(32px, 4.1vw, 68px)', fontWeight: 500, letterSpacing: '-0.03em', lineHeight: 1.0, margin: 0, color: 'rgb(10,10,10)' }}
          >
            Here's what<br />we made together.
          </motion.h2>
        </div>
        <div className="overflow-hidden" style={{ flexShrink: 0, paddingTop: '0.5em' }}>
          <motion.p
            initial={{ y: '110%' }}
            animate={headingInView ? { y: 0 } : {}}
            transition={{ duration: 0.6, ease: EASE }}
            style={{ fontFamily: 'var(--font-sans)', fontSize: 10, lineHeight: `${EYEBROW_LINE}px`, fontWeight: 600, letterSpacing: '0.24em', textTransform: 'uppercase', margin: 0, textAlign: 'right', color: 'rgb(10,10,10)' }}
          >
            Selected work
          </motion.p>
        </div>
      </div>
      <motion.div
        initial={{ scaleX: 0 }}
        animate={headingInView ? { scaleX: 1 } : {}}
        transition={{ duration: 0.9, delay: 0.25, ease: EASE }}
        style={{ height: 1, background: 'rgb(10,10,10)', transformOrigin: 'left center' }}
      />
    </div>
  );

  if (!isDesktop || reduceMotion) {
    return (
      <section id="work" className="bg-white" style={{ padding: '7rem clamp(1.5rem, 4vw, 5rem)' }}>
        {Heading}
        <StaticWorkList />
      </section>
    );
  }

  return (
    <section id="work" className="bg-white" style={{ position: 'relative' }}>
      {/* Heading, list and visual share one pinned viewport (Rajat: the
          separate heading block left too much white space above the list).
          The left column is heading + list at their natural height (sizes
          scale with viewport height so it fits 100vh); the visual stretches
          to that same row, running from the headline to the last row's
          underline, per Rajat. */}
      <div ref={wrapRef} style={{ height: `${WORK_TOTAL_VH}vh`, position: 'relative' }}>
        <div
          style={{
            position: 'sticky',
            top: 0,
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            overflow: 'hidden',
            padding: 'clamp(80px, 11vh, 128px) 0 clamp(20px, 4vh, 64px)',
          }}
        >
          <div
            className="grid grid-cols-1 lg:grid-cols-2"
            style={{
              width: '100%',
              maxWidth: 1400,
              margin: '0 auto',
              padding: '0 clamp(1.5rem, 4vw, 5rem)',
              gap: 'clamp(2.5rem, 5vw, 5rem)',
              minHeight: 0,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              {Heading}
              {projects.map((project, i) => (
                <ProjectRow key={project.number} project={project} index={i} activeValue={activeValue} onJump={jumpToIndex} />
              ))}
            </div>

            {/* Right — the swapping visual, framed as one of this site's own
                floating glass objects (red-tinted border/shadow). Top aligns
                with the headline (below the eyebrow), bottom with the last
                row's underline (above that row's bottom padding). Tracks the
                cursor to pull the "Explore More" badge toward it. */}
            <div
              onMouseMove={handlePanelMouseMove}
              onMouseLeave={handlePanelMouseLeave}
              style={{
                position: 'relative',
                marginTop: HEADLINE_OFFSET,
                marginBottom: ROW_PAD_Y,
                minHeight: 0,
                borderRadius: 22,
                overflow: 'hidden',
                border: `1px solid ${GLASS.border.idle}`,
                boxShadow: '0 34px 68px rgba(234,51,35,0.14), 0 8px 24px rgba(0,0,0,0.09)',
                background: 'rgba(10,10,10,0.04)',
              }}
            >
              <AnimatePresence>
                <VisualPanel key={projects[activeIndex].number} project={projects[activeIndex]} />
              </AnimatePresence>
              <span aria-hidden style={grainOverlayStyle} />

              {/* Large translucent number watermark — reads as "which of 5
                  you're on" at a glance and gives the panel more depth than
                  a flat rectangle, without painting anything on top of the
                  video/title itself in a way that competes with it. */}
              <span
                aria-hidden
                style={{
                  position: 'absolute',
                  top: 'clamp(14px, 2vw, 24px)',
                  left: 'clamp(16px, 2.4vw, 26px)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 'clamp(28px, 4vw, 44px)',
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  color: 'rgba(255,255,255,0.55)',
                  textShadow: '0 2px 12px rgba(0,0,0,0.35)',
                  pointerEvents: 'none',
                }}
              >
                {projects[activeIndex].number}
              </span>

              {/* Progress dashes — one per project, the active one full
                  opacity/wider — a quiet confirmation that scrolling
                  further keeps moving through the set rather than leaving
                  the section. */}
              <div
                aria-hidden
                style={{ position: 'absolute', top: 'clamp(18px, 2.4vw, 28px)', right: 'clamp(16px, 2.4vw, 26px)', display: 'flex', gap: 6 }}
              >
                {projects.map((p, i) => (
                  <span
                    key={p.number}
                    style={{
                      width: i === activeIndex ? 20 : 10,
                      height: 3,
                      borderRadius: 2,
                      background: 'white',
                      opacity: i === activeIndex ? 0.95 : 0.35,
                      transition: 'width 300ms ease-out, opacity 300ms ease-out',
                    }}
                  />
                ))}
              </div>

              {/* Evidence — the reason this section can claim to be PROOF
                  rather than a gallery. Shows the thinking and what was
                  actually delivered, then hands off to the full case
                  study. Right padding clears the badge's footprint so the
                  two never collide. `result` metrics are intentionally
                  absent until verified — see WorkDetailPage. */}
              <motion.div
                key={`evidence-${projects[activeIndex].id}`}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: EASE, delay: 0.12 }}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  padding: 'clamp(18px, 2.4vw, 30px)',
                  paddingRight: 'clamp(150px, 16vw, 190px)',
                  background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.72) 62%)',
                  color: 'white',
                }}
              >
                <p
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 'clamp(13px, 1.15vw, 15px)',
                    lineHeight: 1.6,
                    margin: '0 0 14px',
                    color: 'rgba(255,255,255,0.92)',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  } as React.CSSProperties}
                >
                  {projects[activeIndex].overview}
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  {projects[activeIndex].deliverables.slice(0, 3).map((d) => (
                    <span
                      key={d}
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: 10,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: 'rgba(255,255,255,0.75)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        borderRadius: 3,
                        padding: '4px 9px',
                      }}
                    >
                      {d}
                    </span>
                  ))}
                </div>

                <Link
                  to={`/work/${projects[activeIndex].id}`}
                  className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                    fontFamily: 'var(--font-sans)',
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    textDecoration: 'none',
                    color: 'white',
                    borderBottom: '1px solid rgba(255,255,255,0.45)',
                    paddingBottom: 3,
                  }}
                >
                  View Case Study <ArrowUpRight size={13} strokeWidth={2} />
                </Link>
              </motion.div>

              <ExploreBadge x={badgeX} y={badgeY} hovered={badgeHovered} to={`/work/${projects[activeIndex].id}`} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
