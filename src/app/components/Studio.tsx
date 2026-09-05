import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, useInView, useScroll, useTransform, useMotionValue, useReducedMotion, AnimatePresence, type MotionValue } from 'motion/react';
import { ArrowUpRight, ArrowRight } from 'lucide-react';
import { Logo } from './Logo';

const EASE = [0.22, 1, 0.36, 1] as const;
const RED = '#EA3323';

/* ─── Data ───────────────────────────────────────────────────────────────── */

const team = [
  {
    name: 'Rajat',
    role: 'Creative Director & Brand Strategist',
    expertise: ['Brand Strategy', 'Creative Direction', 'Visual Identity', 'Creative Leadership'],
    color: 'hsl(24, 14%, 90%)',
  },
  {
    name: 'Gagan',
    role: 'Social Media & Growth Lead',
    expertise: ['Social Media Strategy', 'Content Marketing', 'Growth Campaigns', 'Audience Engagement'],
    color: 'hsl(210, 14%, 90%)',
  },
  {
    name: 'Nethaniah',
    role: 'UI/UX Designer & Web Developer',
    expertise: ['UI/UX Design', 'Web Development', 'User Experience', 'Digital Products'],
    color: 'hsl(140, 10%, 90%)',
  },
  {
    name: 'Shrikar',
    role: 'Motion Graphics & Visual Designer',
    expertise: ['Motion Graphics', 'Video Editing', 'Visual Storytelling', 'Creative Production'],
    color: 'hsl(270, 10%, 90%)',
  },
];

const principles = [
  {
    number: '01',
    title: 'Clarity Over Complexity',
    description: 'The best design removes confusion. We strip away the unnecessary until only what matters remains.',
  },
  {
    number: '02',
    title: 'Strategy Before Style',
    description: 'Aesthetics without intent is decoration. Every creative decision is grounded in a reason.',
  },
  {
    number: '03',
    title: 'Details Matter',
    description: 'The difference between good and exceptional lives in the details most people never consciously notice.',
  },
  {
    number: '04',
    title: 'Build For Longevity',
    description: 'We don\'t chase trends. We build systems that stay relevant long after launch.',
  },
];

const process = [
  { number: '01', title: 'Discover', detail: 'Deep-dive into goals, audience, and competitive landscape.' },
  { number: '02', title: 'Define', detail: 'Crystallise strategy, positioning, and the creative direction.' },
  { number: '03', title: 'Design', detail: 'Bring the vision to life across every touchpoint and format.' },
  { number: '04', title: 'Deliver', detail: 'Launch with precision and ensure everything performs at scale.' },
  { number: '05', title: 'Refine', detail: 'Measure, learn, and iterate so results compound over time.' },
];

/* ─── Utility: Reveal wrapper ────────────────────────────────────────────── */

function Reveal({
  children,
  delay = 0,
  y = 32,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.72, ease: EASE, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Momentum video ─────────────────────────────────────────────────────────
 * Ambient looping footage for "Minds Behind The Momentum" — native 16:9
 * source, so `aspect-video` + `object-fit: cover` requires no real cropping.
 * Lazy-mounted on `useInView` (once) so decode/network cost is deferred
 * until the section is actually reached, then autoplays immediately as it
 * enters — the same moment the entrance reveal fires. Hover treatment
 * mirrors this file's own established interactive-card pattern (see
 * TeamCard below): lift + deepen shadow + a red-tinted border, no gradient
 * painted onto the element itself.
 * ────────────────────────────────────────────────────────────────────────── */

function MomentumVideo() {
  const [hovered, setHovered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32, scale: 0.98 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <motion.div
        className="aspect-video"
        animate={{
          y: hovered ? -6 : 0,
          scale: hovered ? 1.01 : 1,
          borderColor: hovered ? 'rgba(234,51,35,0.28)' : 'rgba(0,0,0,0.07)',
          boxShadow: hovered
            ? '0 32px 72px rgba(234,51,35,0.12), 0 8px 24px rgba(0,0,0,0.07)'
            : '0 4px 20px rgba(0,0,0,0.04)',
        }}
        transition={{ duration: 0.45, ease: EASE }}
        style={{
          position: 'relative',
          width: '100%',
          borderRadius: 24,
          overflow: 'hidden',
          border: '1px solid rgba(0,0,0,0.07)',
          background: 'rgb(238,238,238)',
        }}
      >
        {inView && (
          <video
            src="/videos/Fg-01_3.mp4"
            muted
            loop
            autoPlay
            playsInline
            preload="auto"
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }}
          />
        )}
      </motion.div>
    </motion.div>
  );
}

/* ─── Team card ──────────────────────────────────────────────────────────── */

function TeamCard({ member, index }: { member: (typeof team)[0]; index: number }) {
  const [hovered, setHovered] = useState(false);
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCursor({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  // Magnetic tilt: subtle 3D rotation following cursor
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const handleCardMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    setTilt({
      x: ((e.clientY - rect.top - cy) / cy) * -4,
      y: ((e.clientX - rect.left - cx) / cx) * 4,
    });
    handleMouseMove(e);
  }, [handleMouseMove]);

  const handleLeave = useCallback(() => {
    setHovered(false);
    setTilt({ x: 0, y: 0 });
  }, []);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 44 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.74, ease: EASE, delay: index * 0.11 }}
    >
      <motion.div
        ref={cardRef}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={handleLeave}
        onMouseMove={handleCardMouseMove}
        animate={{
          rotateX: tilt.x,
          rotateY: tilt.y,
          y: hovered ? -10 : 0,
          boxShadow: hovered
            ? '0 32px 72px rgba(0,0,0,0.13), 0 8px 24px rgba(0,0,0,0.07)'
            : '0 2px 16px rgba(0,0,0,0.05)',
        }}
        transition={{ duration: 0.45, ease: EASE }}
        style={{
          cursor: 'pointer',
          transformStyle: 'preserve-3d',
          perspective: 800,
          borderRadius: 20,
          overflow: 'hidden',
          border: `1px solid ${hovered ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.07)'}`,
          transition: 'border-color 0.36s ease',
        }}
      >
        {/* Portrait area */}
        <div
          style={{
            aspectRatio: '3/4',
            position: 'relative',
            overflow: 'hidden',
            background: member.color,
          }}
        >
          {/* Cursor-follow glow */}
          <motion.div
            animate={{ opacity: hovered ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'absolute',
              width: 200,
              height: 200,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.22) 0%, transparent 70%)',
              left: cursor.x - 100,
              top: cursor.y - 100,
              pointerEvents: 'none',
              zIndex: 3,
            }}
          />

          {/* Abstract placeholder art — scales on hover */}
          <motion.div
            animate={{ scale: hovered ? 1.07 : 1 }}
            transition={{ duration: 0.7, ease: EASE }}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
            }}
          >
            {/* Initials monogram */}
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                border: '1px solid rgba(0,0,0,0.14)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255,255,255,0.5)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.03em', opacity: 0.55 }}>
                {member.name[0]}
              </span>
            </div>
            <div style={{ width: 72, height: 1.5, background: 'rgba(0,0,0,0.1)', borderRadius: 1 }} />
            <div style={{ width: 48, height: 1.5, background: 'rgba(0,0,0,0.06)', borderRadius: 1 }} />
          </motion.div>

          {/* Expertise tags — reveal from bottom on hover */}
          <motion.div
            animate={{
              opacity: hovered ? 1 : 0,
              y: hovered ? 0 : 16,
              filter: hovered ? 'blur(0px)' : 'blur(4px)',
            }}
            transition={{ duration: 0.44, ease: EASE }}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '40px 16px 16px',
              background: 'linear-gradient(to top, rgba(0,0,0,0.52) 0%, transparent 100%)',
              zIndex: 2,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 6,
            }}
          >
            {member.expertise.map((tag, i) => (
              <motion.span
                key={tag}
                initial={false}
                animate={{ opacity: hovered ? 1 : 0, y: hovered ? 0 : 8 }}
                transition={{ duration: 0.38, ease: EASE, delay: hovered ? i * 0.05 : 0 }}
                style={{
                  fontSize: 9,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'white',
                  padding: '4px 10px',
                  borderRadius: 3,
                  background: 'rgba(255,255,255,0.16)',
                  backdropFilter: 'blur(6px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                }}
              >
                {tag}
              </motion.span>
            ))}
          </motion.div>
        </div>

        {/* Info below portrait */}
        <div
          style={{
            padding: '18px 20px 20px',
            background: 'white',
          }}
        >
          <motion.h4
            animate={{ y: hovered ? -2 : 0 }}
            transition={{ duration: 0.38, ease: EASE }}
            style={{
              fontSize: 'clamp(17px, 1.7vw, 21px)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              margin: '0 0 5px',
            }}
          >
            {member.name}
          </motion.h4>
          <p style={{
            fontSize: 10,
            letterSpacing: '0.11em',
            textTransform: 'uppercase',
            opacity: 0.36,
            margin: 0,
            lineHeight: 1.5,
          }}>
            {member.role}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Our Principles — scroll-pinned progression ───────────────────────────
 * A tall wrapper + sticky inner viewport — the same pinned-scroll pattern
 * used by ThreeEnvironment/ServicesStack/FlashWork elsewhere in this project
 * (rAF-throttled passive scroll listener writing straight into a plain
 * motion value, never React state per-frame) — drives one continuous
 * "active value" from 0 to 3. Every visual property — which principle reads
 * as dominant, the rolling circle's position, each card's
 * scale/weight/colour — derives from that single number via useTransform,
 * so the whole interaction is a pure function of scroll position: same
 * scroll = same frame, always, reverses instantly, no timers, no
 * independent animation loop that could drift out of sync with the
 * scrollbar.
 *
 * ONE circle, not four — it sits behind the card row (z-index below the
 * cards), so whichever card is currently "under" it fully covers its solid
 * core; only its soft glow bleeds out, visible in the open gaps between
 * cards as it travels. That's the z-order the brief asked for
 * (environment → circle → card surface → text) without ever risking text
 * legibility, since the ball's solid body is never actually on top of copy.
 * ────────────────────────────────────────────────────────────────────────── */

const PRINCIPLE_COUNT = principles.length;
const PRINCIPLES_DWELL_VH = 42; // real reading time on the first/last principle before/after it travels
const PRINCIPLES_SEGMENT_VH = 66; // scroll distance per transition between two principles
const PRINCIPLES_TOTAL_VH = PRINCIPLES_DWELL_VH * 2 + PRINCIPLES_SEGMENT_VH * (PRINCIPLE_COUNT - 1);
// Fraction of the whole pinned scroll distance the opening dwell occupies —
// shared by principlesActiveValue (holds position 0 through it) and the
// card/marker entrance below (which plays out entirely within it, so
// everything has settled by the time the marker's first real hop begins).
const DWELL_FRAC = PRINCIPLES_DWELL_VH / PRINCIPLES_TOTAL_VH;

// Single source of truth for the card's own bottom padding and its
// reserved text-block height — CrosshairGuides' wave line needs both to
// sit exactly flush above the title no matter the viewport width, so it
// reads off these instead of a hand-tuned percentage that would drift out
// of sync the moment either card constant changes.
const CARD_PAD = 'clamp(22px, 2.4vw, 32px)';
const TEXT_ZONE = 'clamp(118px, 13vw, 150px)';

// Raw 0–1 progress through the pinned wrapper → a continuous 0..(N-1) value
// (e.g. 1.4 = 40% of the way from principle 02 into principle 03). A pure
// function of its input — the determinism the brief asked for.
function principlesActiveValue(p: number): number {
  const segFrac = PRINCIPLES_SEGMENT_VH / PRINCIPLES_TOTAL_VH;
  if (p <= DWELL_FRAC) return 0;
  return Math.min((p - DWELL_FRAC) / segFrac, PRINCIPLE_COUNT - 1);
}

// A scalloped wave strip, tiled from a tiny inline SVG (same technique as
// FlashWork's film-grain texture elsewhere in this project — a static
// background-image, not a live filter). A slow, independent background-
// position drift gives it a bit of life; it's purely decorative texture
// with no informational role, so an ambient loop here can't become a "lag"
// source — same reasoning already applied to the drifting particles in
// ServicesStack's CardTechDetails.
const WAVE_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='20'%3E%3Cpath d='M0,10 Q10,0 20,10 T40,10' stroke='%23ffffff' stroke-opacity='0.5' stroke-width='1.4' fill='none'/%3E%3C/svg%3E";

// The dashed guide line and wavy strip are now rendered PER-CARD (inside
// PrincipleCard itself, clipped by that card's own overflow:hidden) rather
// than as one continuous strip spanning the whole row. With real spacing
// between cards, a single full-width line used to visibly cross the empty
// gap — a stray dashed segment floating in blank space. Confining each
// line to its own card's bounds means it simply stops at the card edge,
// with nothing bridging the gap.
//
// Only the travelling marker itself stays as a single shared overlay above
// the whole row — an outline that MORPHS from a near-square into a perfect
// circle across the whole scroll journey (progress 0 at principle 01 → 1
// at the last principle), not per-hop. It's fine for the marker to pass
// over a gap mid-travel (it's a single continuous object, not a line), so
// it doesn't need the same per-card confinement.
//
// It also shouldn't just be sitting there, fully visible, before the user
// has scrolled at all. `entranceValue` (0→1 across the opening dwell, see
// DWELL_FRAC) drives a second, independent slide-in: the marker starts
// hidden and offset outside card 01, then fades and slides into its resting
// spot as the user scrolls — split into an OUTER element (pure centring —
// left/top/-50% never touched by the entrance) and an INNER one (the actual
// visual box, carrying both the entrance offset and the existing
// morph/scale/rotate), so the two transforms compose instead of one
// clobbering the other.
function CrosshairGuides({
  activeValue,
  isDesktop,
  entranceValue,
}: {
  activeValue: MotionValue<number>;
  isDesktop: boolean;
  entranceValue: MotionValue<number>;
}) {
  const posPercent = useTransform(activeValue, (v) => `${((v + 0.5) / PRINCIPLE_COUNT) * 100}%`);
  // Distance from the nearest whole stop, 0 at rest → 0.5 exactly mid-hop —
  // a small pulse of scale while it's actually in transit, so it reads as
  // travelling rather than just sliding.
  const scale = useTransform(activeValue, (v) => 1 + Math.min(Math.abs(v - Math.round(v)), 0.5) * 0.3);
  // Progress across the WHOLE journey (0 at principle 01, 1 at the last
  // principle) — square at the start, a perfect circle by the time it
  // reaches the end, morphing continuously as the user scrolls through.
  const journey = useTransform(activeValue, (v) => v / (PRINCIPLE_COUNT - 1));
  const borderRadius = useTransform(journey, [0, 1], ['4px', '50%']);
  const rotate = useTransform(journey, [0, 1], [0, 90]);

  // Plays out in the back half of the dwell, after card 01 has mostly
  // finished rising in — so the marker reads as arriving "into" a card
  // that's already there, not racing it.
  const markerIn = useTransform(entranceValue, [0.35, 0.75], [0, 1], { clamp: true });
  const entranceOffset = useTransform(markerIn, [0, 1], isDesktop ? [-160, 0] : [0, 0]);
  const entranceOffsetY = useTransform(markerIn, [0, 1], isDesktop ? [0, 0] : [-160, 0]);
  const entranceOpacity = markerIn;

  return (
    <>
      <motion.div
        aria-hidden
        style={{
          position: 'absolute',
          zIndex: 2,
          left: isDesktop ? posPercent : '30%',
          top: isDesktop ? '30%' : posPercent,
          x: '-50%',
          y: '-50%',
          pointerEvents: 'none',
        }}
      >
        <motion.div
          style={{
            position: 'relative',
            width: 150,
            height: 150,
            border: '1.5px solid rgba(255,255,255,0.9)',
            borderRadius,
            rotate,
            scale,
            x: entranceOffset,
            y: entranceOffsetY,
            opacity: entranceOpacity,
          }}
        >
          <span style={{ position: 'absolute', top: '50%', left: '50%', width: 8, height: 8, marginLeft: -4, marginTop: -4, borderRadius: '50%', background: '#ffffff' }} />
        </motion.div>
      </motion.div>
    </>
  );
}

function PrincipleCard({
  p,
  index,
  activeValue,
  activeIndex,
  reduceMotion,
  entranceValue,
}: {
  p: (typeof principles)[0];
  index: number;
  activeValue: MotionValue<number>;
  activeIndex: number;
  reduceMotion: boolean;
  entranceValue: MotionValue<number>;
}) {
  const isActive = index === activeIndex;

  // Closeness to active: 1 exactly on this card, falling to 0 a full card
  // away — continuous, so a transition shows two neighbouring cards both
  // partially emphasised rather than one flipping off and the other on.
  // Colour is the only thing this drives now — text stays fully legible on
  // every card, matching the reference (all four always readable, never
  // dimmed to the point of competing for attention via legibility loss).
  const closeness = useTransform(activeValue, (v) => Math.max(0, 1 - Math.abs(v - index)));
  const background = useTransform(closeness, [0, 1], ['#ad2419', RED]);

  // Cards build up bottom-to-top, one after another, entirely within the
  // opening dwell (see DWELL_FRAC) — each card gets its own slice of that
  // 0→1 window, with a little overlap between neighbours so the sequence
  // reads as one continuous cascade rather than four separate pops. A
  // clip-path reveal (not height/scale) is what makes the card seem to grow
  // upward out of its own footprint without ever changing its actual box
  // size — the layout, and every other card's position, stays fixed the
  // entire time.
  // Windows are spaced so the LAST card's window ends at exactly 1 — with
  // the previous (index/COUNT)*0.85 formula, card 04's window ran to 1.0375,
  // past entranceValue's own ceiling of 1, so it could never fully clear its
  // clip-path and stayed permanently cropped at the top. Solving for an even
  // spread where start_last + WINDOW = 1 gives every card room to fully
  // resolve by the time scrolling finishes the dwell.
  const ENTRANCE_WINDOW = 0.4;
  const cardStart = (index / (PRINCIPLE_COUNT - 1)) * (1 - ENTRANCE_WINDOW);
  const cardEnd = cardStart + ENTRANCE_WINDOW;
  const cardIn = useTransform(entranceValue, [cardStart, cardEnd], [0, 1], { clamp: true });
  const clipPath = useTransform(cardIn, (t) => `inset(${(1 - t) * 100}% 0% 0% 0%)`);

  return (
    <motion.div
      className="lg:flex-1"
      style={{
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 'clamp(480px, 68vh, 660px)',
        padding: CARD_PAD,
        borderRadius: 20,
        overflow: 'hidden',
        cursor: 'default',
        background: reduceMotion ? RED : background,
        clipPath: reduceMotion ? 'inset(0% 0% 0% 0%)' : clipPath,
      }}
    >
      {/* Guide line + wavy strip, confined to this card's own bounds (and
          clipped by its overflow:hidden) so they never bridge the gap to
          the next card — see the note above CrosshairGuides. The card's
          own layout is always a top-to-bottom column (number → blank zone
          → text) regardless of whether the outer system is a desktop row
          or a mobile stack, so these read the same way on both. The wave
          sits flush above the reserved text zone (TEXT_ZONE/CARD_PAD, the
          same values the text block below is sized and padded with) so it
          always lands directly on top of the title, never floating in the
          blank zone above it. */}
      <div aria-hidden style={{ position: 'absolute', left: 0, right: 0, top: '30%', height: 0, borderTop: '1px dashed rgba(255,255,255,0.4)', pointerEvents: 'none' }} />
      <motion.div
        aria-hidden
        animate={{ backgroundPositionX: [0, 40] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: `calc(${CARD_PAD} + ${TEXT_ZONE} + 14px)`,
          height: 20,
          backgroundImage: `url("${WAVE_SVG}")`,
          backgroundRepeat: 'repeat-x',
          backgroundSize: '40px 20px',
          pointerEvents: 'none',
        }}
      />

      <span
        style={{
          fontSize: 'clamp(11px, 1vw, 13px)',
          letterSpacing: '0.16em',
          fontVariantNumeric: 'tabular-nums',
          color: 'rgba(255,255,255,0.85)',
        }}
      >
        {p.number}
      </span>

      {/* Deliberately blank — this is the zone the guide lines above sit
          in, and where CrosshairGuides' travelling marker passes through
          as a sibling layer above the whole row. */}
      <div style={{ flex: 1 }} />

      {/* A fixed height here — not just content-sized — is what keeps the
          heading landing at the same y-position on every card. Descriptions
          run 2 or 3 lines depending on the principle; without a reserved
          height, the shorter ones would pull their whole text block (and so
          the heading above it) further down, reading as misaligned across
          the row. Sized for the longest description (3 lines) so nothing
          is ever clipped. */}
      <div style={{ minHeight: TEXT_ZONE }}>
        <h4
          style={{
            fontSize: 'clamp(22px, 2.1vw, 28px)',
            fontWeight: 800,
            letterSpacing: '-0.025em',
            lineHeight: 1.08,
            margin: '0 0 12px',
            color: '#ffffff',
          }}
        >
          {p.title}
        </h4>
        <p
          style={{
            fontSize: 13.5,
            lineHeight: 1.66,
            margin: 0,
            color: 'rgba(255,255,255,0.86)',
          }}
        >
          {p.description}
        </p>
      </div>
    </motion.div>
  );
}

function PrinciplesStage() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion() ?? false;
  const rawProgress = useMotionValue(0);
  const activeValue = useTransform(rawProgress, principlesActiveValue);
  // Drives the cards'/marker's entrance. Deliberately NOT derived from
  // rawProgress: rawProgress (and its DWELL_FRAC hold) only starts moving
  // once the wrapper's top reaches the very top of the viewport — the point
  // where sticky pinning kicks in. But the card row is already sitting on
  // screen, in normal flow, well before that (right under the "Our
  // Principles" heading), so gating the entrance on rawProgress left it
  // stuck fully clipped/invisible for a whole extra scroll's worth even
  // though the row was plainly visible. This is set directly in the scroll
  // handler below off the wrapper scrolling up from the BOTTOM of the
  // viewport, so the build-up plays out while the section is scrolling into
  // view and finishes shortly before pinning/hopping begins.
  const entranceValue = useMotionValue(0);
  // Reduced-motion cards use this instead — pinned at 1, so every card
  // renders fully revealed with no clip/slide, matching that branch's
  // "everything readable, nothing animated" contract.
  const staticEntrance = useMotionValue(1);
  const [activeIndex, setActiveIndex] = useState(0);
  const lastIndexRef = useRef(0);

  // Desktop = horizontal row (the marker travels along `left`); below that,
  // a vertical stack (the marker travels along `top`) — matches Tailwind's
  // own `lg` breakpoint, the same one the row/column className below uses,
  // so the JS-tracked axis and the CSS layout never disagree.
  const [isDesktop, setIsDesktop] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const apply = () => setIsDesktop(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

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
    if (reduceMotion) return;
    let rafId: number;
    const update = () => {
      const el = wrapRef.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top;
      const scrollable = el.offsetHeight - window.innerHeight;
      rawProgress.set(scrollable <= 0 ? 1 : Math.max(0, Math.min(1, -top / scrollable)));

      // 0 while the wrapper's top is still at/below the bottom of the
      // viewport (row not on screen yet) → 1 once it's scrolled up 65% of
      // a viewport height (comfortably visible, and comfortably before the
      // sticky top offset where rawProgress itself starts moving).
      const vh = window.innerHeight;
      entranceValue.set(Math.max(0, Math.min(1, (vh - top) / (vh * 0.65))));
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
  }, [rawProgress, entranceValue, reduceMotion]);

  // Reduced motion: no pin, no travel, no marker — a plain readable row/stack
  // with every principle fully legible, matching the brief's "retain active
  // states, keep all content readable."
  if (reduceMotion) {
    return (
      <div className="flex-col lg:flex-row" style={{ position: 'relative', display: 'flex', gap: 'clamp(16px, 2vw, 28px)' }}>
        {principles.map((p, i) => (
          <PrincipleCard key={p.number} p={p} index={i} activeValue={rawProgress} activeIndex={0} reduceMotion entranceValue={staticEntrance} />
        ))}
      </div>
    );
  }

  return (
    <div ref={wrapRef} style={{ height: `${PRINCIPLES_TOTAL_VH}vh`, position: 'relative' }}>
      {/* No forced 100dvh + centering here on purpose — that was the source
          of the large empty bands above/below the row. The sticky element
          now sizes to its own content (the card row's natural height), so
          there's no dead space to center it within. */}
      <div style={{ position: 'sticky', top: 'clamp(90px, 12vh, 140px)', overflow: 'hidden' }}>
        <div style={{ position: 'relative', width: '100%' }}>
          <CrosshairGuides activeValue={activeValue} isDesktop={isDesktop} entranceValue={entranceValue} />
          <div
            className="flex-col lg:flex-row"
            style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 'clamp(16px, 2vw, 28px)' }}
          >
            {principles.map((p, i) => (
              <PrincipleCard
                key={p.number}
                p={p}
                index={i}
                activeValue={activeValue}
                activeIndex={activeIndex}
                reduceMotion={false}
                entranceValue={entranceValue}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Process timeline ───────────────────────────────────────────────────── */

// The single ball's own resting position is owned by the parent (Studio),
// not by each step — a step can only know about itself, but "bounce from
// wherever the ball actually was" requires one shared position. isCurrent
// (red) and isPending (black, mid-flight toward here) both come down as
// props; the only state a step still owns locally is its own hover (for the
// scale + detail-text reveal, which should feel instant regardless of
// whether the ball needs to travel).
const HOP_DURATION = 0.42; // seconds — shared with BounceMarker's own transition below

function ProcessStep({
  step,
  index,
  isCurrent,
  isPending,
  onHoverStart,
}: {
  step: (typeof process)[0];
  index: number;
  isCurrent: boolean;
  isPending: boolean;
  onHoverStart: (index: number) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.62, ease: EASE, delay: index * 0.09 }}
      onMouseEnter={() => {
        setHovered(true);
        onHoverStart(index);
      }}
      onMouseLeave={() => setHovered(false)}
      style={{ flex: 1, minWidth: 0, position: 'relative' }}
    >
      {/* Connector line (not on last) */}
      {index < process.length - 1 && (
        <motion.div
          initial={{ scaleX: 0 }}
          animate={inView ? { scaleX: 1 } : {}}
          transition={{ duration: 0.7, ease: EASE, delay: index * 0.09 + 0.3 }}
          style={{
            position: 'absolute',
            top: 20,
            left: '50%',
            right: '-50%',
            height: 1,
            background: 'rgba(0,0,0,0.12)',
            transformOrigin: 'left',
            zIndex: 0,
          }}
        />
      )}

      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '0 8px' }}>
        {/* Dot — red only once truly landed (isCurrent), black while the
            ball is either hovered-but-not-yet-arrived or actively mid-flight
            toward it (isPending covers the case where the mouse has already
            moved on but the hop hasn't finished). A quick, uniform 0.15s
            crossfade either way — fast enough that landing reads as
            immediate, never a hard, jarring snap. */}
        <motion.div
          animate={{
            scale: hovered ? 1.3 : 1,
            background: isCurrent ? RED : (hovered || isPending) ? 'rgb(10,10,10)' : 'rgba(0,0,0,0.15)',
          }}
          transition={{
            scale: { duration: 0.3, ease: EASE },
            background: { duration: 0.15, ease: EASE },
          }}
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            margin: '0 auto 16px',
          }}
        />

        <span style={{ fontSize: 9, letterSpacing: '0.18em', opacity: 0.32, display: 'block', marginBottom: 6 }}>
          {step.number}
        </span>

        <h5
          style={{
            fontSize: 'clamp(14px, 1.4vw, 18px)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            margin: '0 0 8px',
          }}
        >
          {step.title}
        </h5>

        <AnimatePresence>
          {hovered && (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.3, ease: EASE }}
              style={{ fontSize: 11, opacity: 0.48, lineHeight: 1.6 }}
            >
              {step.detail}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ─── Process rail bounce marker ─────────────────────────────────────────────
 * The single ball, travelling from wherever it actually was (`from`) to
 * whichever step was just hovered (`to`) — never a fixed neighbour-based
 * hop. One continuous eased glide horizontally, with a parabolic arc
 * layered on top via `y`, so it genuinely reads as bouncing across the
 * rail rather than snapping between fixed points. `onAnimationComplete` is
 * the real fix for the reported lag: the step's dot turns red at the exact
 * moment Framer says the flight is actually done, not after a hardcoded
 * timer that could drift out of sync with what's on screen.
 * ────────────────────────────────────────────────────────────────────────── */

const STEP_COUNT = process.length;
const stepX = (i: number) => ((i + 0.5) / STEP_COUNT) * 100;

function BounceMarker({
  from,
  to,
  onComplete,
}: {
  from: number;
  to: number;
  onComplete: () => void;
}) {
  const fromX = stepX(from);
  const toX = stepX(to);

  return (
    <motion.div
      aria-hidden
      className="hidden lg:block"
      initial={{ left: `${fromX}%`, top: 20, y: 0, opacity: 1 }}
      animate={{
        left: `${toX}%`,
        y: [0, -34, 0],
        opacity: [1, 1, 0],
      }}
      transition={{
        left: { duration: HOP_DURATION, ease: 'easeInOut' },
        y: { duration: HOP_DURATION, times: [0, 0.5, 1], ease: ['easeOut', 'easeIn'] },
        opacity: { duration: HOP_DURATION, times: [0, 0.85, 1], ease: 'easeInOut' },
      }}
      onAnimationComplete={onComplete}
      style={{
        position: 'absolute',
        width: 10,
        height: 10,
        marginLeft: -5,
        borderRadius: '50%',
        background: RED,
        boxShadow: '0 0 0 4px rgba(234,51,35,0.15)',
        pointerEvents: 'none',
        zIndex: 2,
      }}
    />
  );
}

/* ─── Magnetic CTA button ────────────────────────────────────────────────── */

function MagneticCTA({ children, primary }: { children: React.ReactNode; primary?: boolean }) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);

  const onMove = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setPos({ x: (e.clientX - (r.left + r.width / 2)) * 0.28, y: (e.clientY - (r.top + r.height / 2)) * 0.28 });
  }, []);

  return (
    <motion.button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPos({ x: 0, y: 0 }); }}
      onMouseMove={onMove}
      animate={{ x: pos.x, y: pos.y, scale: hovered ? 1.04 : 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 10,
        padding: '18px 36px', borderRadius: 3, cursor: 'pointer',
        fontSize: 12, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase',
        border: primary ? 'none' : '1px solid rgba(0,0,0,0.2)',
        background: primary ? (hovered ? '#f0f0f0' : '#ffffff') : (hovered ? '#0a0a0a' : 'transparent'),
        color: primary ? '#0a0a0a' : (hovered ? 'white' : 'rgb(10,10,10)'),
        transition: 'background 0.28s ease, color 0.28s ease',
      }}
    >
      {children}
    </motion.button>
  );
}

/* ─── Watermark logo — the real mark, never redrawn as text ─────────────────
 * `Logo` takes a plain px width (SVG attribute, not a CSS unit), so it can't
 * use a native `clamp()` the way the old text watermark did. This tracks
 * viewport width instead and recomputes a comparable size on resize —
 * genuine responsiveness rather than a fixed size that just gets clipped
 * on narrow screens.
 * ────────────────────────────────────────────────────────────────────────── */

function WatermarkLogo() {
  const [width, setWidth] = useState(700);

  useEffect(() => {
    const update = () => setWidth(Math.min(1000, Math.max(320, window.innerWidth * 0.55)));
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        overflow: 'hidden',
        opacity: 0.15,
      }}
    >
      <Logo width={width} />
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

export function Studio() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const heroParallax = useTransform(scrollY, [0, 600], [0, -60]);

  const section1Ref = useRef<HTMLDivElement>(null);
  const s1InView = useInView(section1Ref, { once: true, margin: '-60px' });

  const beliefsRef = useRef<HTMLDivElement>(null);
  const beliefsInView = useInView(beliefsRef, { once: true, margin: '-60px' });

  const reduceMotion = useReducedMotion() ?? false;

  // The single ball's real, persistent position — Discover (0) is the
  // implicit starting point, matching the rail's own reading order. Stays
  // wherever it last landed even after the mouse leaves the rail entirely,
  // so the *next* hop always has a genuine "from" to bounce out of.
  const [landedIndex, setLandedIndex] = useState(0);
  const [travel, setTravel] = useState<{ key: number; from: number; to: number } | null>(null);

  const handleStepHoverStart = useCallback((index: number) => {
    if (reduceMotion || index === landedIndex) {
      // Already resting here (or motion is disabled) — nothing to travel,
      // land instantly instead of forcing a hop across zero distance.
      setTravel(null);
      setLandedIndex(index);
      return;
    }
    setTravel((t) => ({ key: t === null ? 0 : t.key + 1, from: landedIndex, to: index }));
  }, [landedIndex, reduceMotion]);

  const handleHopComplete = useCallback((index: number) => {
    setLandedIndex(index);
    setTravel(null);
  }, []);

  return (
    <main style={{ background: 'white', minHeight: '100vh' }}>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 1 — Hero editorial
      ══════════════════════════════════════════════════════════════ */}
      <section
        style={{
          paddingTop: 'clamp(8rem, 16vh, 13rem)',
          paddingBottom: 'clamp(5rem, 10vh, 8rem)',
          paddingLeft: 'clamp(1.5rem, 4vw, 5rem)',
          paddingRight: 'clamp(1.5rem, 4vw, 5rem)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background watermark */}
        <motion.div
          style={{ y: heroParallax }}
          aria-hidden
          className="pointer-events-none select-none"
          style2={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            overflow: 'hidden',
            zIndex: 0,
          }}
        >
          <span style={{
            fontSize: 'clamp(120px, 22vw, 340px)',
            fontWeight: 900,
            letterSpacing: '-0.06em',
            color: 'rgba(0,0,0,0.025)',
            userSelect: 'none',
            lineHeight: 1,
            whiteSpace: 'nowrap',
            position: 'absolute',
            right: '-2%',
          }}>
            Studio
          </span>
        </motion.div>

        <div
          ref={heroRef}
          style={{
            maxWidth: 1400,
            margin: '0 auto',
            display: 'grid',
            gap: 'clamp(3rem, 6vw, 8rem)',
            position: 'relative',
            zIndex: 1,
          }}
          className="lg:grid-cols-[1fr_1fr]"
        >
          {/* Left: headline */}
          <div ref={section1Ref}>
            <div style={{ overflow: 'hidden', marginBottom: 12 }}>
              <motion.p
                initial={{ y: '110%' }}
                animate={s1InView ? { y: 0 } : {}}
                transition={{ duration: 0.6, ease: EASE }}
                style={{ fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', opacity: 0.35, margin: 0 }}
              >
                The Studio
              </motion.p>
            </div>

            {['Small Studio.', 'Bold Ideas.', 'Meaningful Impact.'].map((line, i) => (
              <div key={line} style={{ overflow: 'hidden' }}>
                <motion.h1
                  initial={{ y: '110%' }}
                  animate={s1InView ? { y: 0 } : {}}
                  transition={{ duration: 0.84, ease: EASE, delay: 0.05 + i * 0.1 }}
                  style={{
                    fontSize: 'clamp(40px, 5.5vw, 80px)',
                    fontWeight: 700,
                    letterSpacing: '-0.035em',
                    lineHeight: 1.05,
                    margin: 0,
                  }}
                >
                  {line}
                </motion.h1>
              </div>
            ))}
          </div>

          {/* Right: philosophy blocks */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 36 }}>
            {[
              {
                label: 'Our Perspective',
                body: 'Design is more than visuals. It shapes perception, creates emotion, and builds lasting relationships between brands and people.',
              },
              {
                label: 'Our Process',
                body: 'We combine strategy, storytelling, and execution to create work that feels timeless rather than trendy.',
              },
              {
                label: 'Our Ambition',
                body: 'Every project is an opportunity to challenge assumptions and create something people remember long after launch.',
              },
            ].map((block, i) => (
              <Reveal key={block.label} delay={0.18 + i * 0.1}>
                <div style={{ paddingTop: 24, borderTop: '1px solid rgba(0,0,0,0.07)' }}>
                  <p style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', opacity: 0.32, marginBottom: 10 }}>
                    {block.label}
                  </p>
                  <p style={{ fontSize: 'clamp(14px, 1.3vw, 17px)', lineHeight: 1.74, opacity: 0.55, margin: 0 }}>
                    {block.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 2 — What Drives Us
      ══════════════════════════════════════════════════════════════ */}
      <section
        style={{
          // Same deliberately darker shade as the Final CTA section below
          // (not the shared brand RED, which stays as-is everywhere else —
          // the bounce marker, buttons, accents).
          background: '#C72B1E',
          color: 'white',
          padding: 'clamp(5rem, 10vh, 9rem) clamp(1.5rem, 4vw, 5rem)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div ref={beliefsRef} style={{ maxWidth: 1400, margin: '0 auto', display: 'grid', gap: '4rem' }} className="lg:grid-cols-[1fr_1fr]">

          {/* Left: big statement */}
          <div>
            <div style={{ overflow: 'hidden', marginBottom: 12 }}>
              <motion.p
                initial={{ y: '110%' }}
                animate={beliefsInView ? { y: 0 } : {}}
                transition={{ duration: 0.6, ease: EASE }}
                style={{ fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', opacity: 0.75, margin: 0, color: 'white' }}
              >
                What Drives Us
              </motion.p>
            </div>

            {[
              'We believe great work',
              'happens at the intersection',
              'of curiosity and craft.',
            ].map((line, i) => (
              <div key={i} style={{ overflow: 'hidden' }}>
                <motion.h2
                  initial={{ y: '110%' }}
                  animate={beliefsInView ? { y: 0 } : {}}
                  transition={{ duration: 0.82, ease: EASE, delay: 0.06 + i * 0.09 }}
                  style={{
                    fontSize: 'clamp(28px, 3.6vw, 52px)',
                    fontWeight: 700,
                    letterSpacing: '-0.03em',
                    lineHeight: 1.12,
                    margin: 0,
                    color: 'white',
                  }}
                >
                  {line}
                </motion.h2>
              </div>
            ))}
          </div>

          {/* Right: philosophy lines */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 28 }}>
            {[
              "We don't chase trends. We build thoughtful experiences that stay relevant long after launch.",
              "Our goal isn't to create noise. It's to create work people remember.",
              "Every decision is intentional. Every detail has a reason. Every project is an opportunity.",
            ].map((text, i) => (
              <Reveal key={i} delay={0.24 + i * 0.1} y={20}>
                <p style={{ fontSize: 'clamp(14px, 1.3vw, 17px)', lineHeight: 1.76, opacity: 0.85, color: 'white', margin: 0 }}>
                  {text}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 3 — Team
      ══════════════════════════════════════════════════════════════ */}
      <section style={{ padding: 'clamp(5rem, 10vh, 9rem) clamp(1.5rem, 4vw, 5rem)', background: 'rgb(248,248,248)' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <Reveal y={24} className="mb-14">
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <p style={{ fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', opacity: 0.35, marginBottom: 10 }}>Our People</p>
                <h2 style={{ fontSize: 'clamp(32px, 4.5vw, 64px)', fontWeight: 700, letterSpacing: '-0.03em', margin: 0 }}>
                  Minds Behind<br />The Momentum
                </h2>
              </div>
              <p style={{ fontSize: 14, opacity: 0.4, maxWidth: 320, lineHeight: 1.72 }}>
                A small team of specialists who care deeply about the work and the clients we work with.
              </p>
            </div>
          </Reveal>

          <MomentumVideo />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 5 — Our Principles
      ══════════════════════════════════════════════════════════════ */}
      <section style={{ padding: 'clamp(5rem, 10vh, 9rem) clamp(1.5rem, 4vw, 5rem)', background: 'rgb(248,248,248)' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <Reveal y={24} className="mb-14">
            <p style={{ fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', opacity: 0.35, marginBottom: 10 }}>How We Think</p>
            <h2 style={{ fontSize: 'clamp(32px, 4.5vw, 64px)', fontWeight: 700, letterSpacing: '-0.03em', margin: 0 }}>
              Our Principles
            </h2>
          </Reveal>

          <PrinciplesStage />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 6 — How We Work (process)
      ══════════════════════════════════════════════════════════════ */}
      <section style={{ padding: 'clamp(5rem, 10vh, 9rem) clamp(1.5rem, 4vw, 5rem)', background: 'white', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <Reveal y={24} className="mb-16">
            <p style={{ fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', opacity: 0.35, marginBottom: 10 }}>How We Work</p>
            <h2 style={{ fontSize: 'clamp(32px, 4.5vw, 64px)', fontWeight: 700, letterSpacing: '-0.03em', margin: 0 }}>
              The Process
            </h2>
          </Reveal>

          <div style={{ display: 'flex', gap: 0, alignItems: 'flex-start', position: 'relative' }} className="flex-col lg:flex-row">
            {process.map((step, i) => (
              <ProcessStep
                key={step.number}
                step={step}
                index={i}
                isCurrent={travel === null && landedIndex === i}
                isPending={travel !== null && travel.to === i}
                onHoverStart={handleStepHoverStart}
              />
            ))}
            <AnimatePresence>
              {travel !== null && (
                <BounceMarker
                  key={travel.key}
                  from={travel.from}
                  to={travel.to}
                  onComplete={() => handleHopComplete(travel.to)}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 7 — Final CTA
      ══════════════════════════════════════════════════════════════ */}
      <section
        style={{
          padding: 'clamp(6rem, 12vh, 10rem) clamp(1.5rem, 4vw, 5rem)',
          // A deliberately darker shade than the shared brand RED for this
          // one section specifically (not RED itself, which stays untouched
          // everywhere else it's used — the bounce marker, "What Drives Us").
          background: '#C72B1E',
          color: 'white',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Watermark — the real logo mark (see Logo.tsx), never redrawn as
            text. Low opacity so it stays a background texture, not a
            second competing red shape on top of the section's own red. */}
        <WatermarkLogo />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 720, margin: '0 auto' }}>
          <Reveal y={30}>
            <p style={{ fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', opacity: 0.75, color: 'white', marginBottom: 24 }}>
              Start Something
            </p>
            <h2 style={{ fontSize: 'clamp(40px, 6vw, 88px)', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1.04, color: 'white', margin: '0 0 24px' }}>
              Have An Idea<br />Worth Building?
            </h2>
            <p style={{ fontSize: 15, opacity: 0.85, lineHeight: 1.72, maxWidth: 440, margin: '0 auto 48px', color: 'white' }}>
              We partner with ambitious founders and brands to build things that matter. Let's talk about what's next.
            </p>

            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <MagneticCTA primary>
                Start a Project <ArrowUpRight size={14} strokeWidth={2} />
              </MagneticCTA>
              <motion.button
                whileHover={{ scale: 1.04 }}
                transition={{ duration: 0.25 }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 10,
                  padding: '18px 36px', borderRadius: 3, cursor: 'pointer',
                  fontSize: 12, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase',
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'transparent', color: 'white',
                  transition: 'background 0.28s ease, border-color 0.28s ease',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                Let's Talk <ArrowRight size={14} strokeWidth={1.8} />
              </motion.button>
            </div>
          </Reveal>
        </div>
      </section>

    </main>
  );
}
