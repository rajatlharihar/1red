import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  useSpring,
  useReducedMotion,
  type MotionValue,
} from 'motion/react';
import { ArrowUpRight } from 'lucide-react';

/* ─── OneRed services — full-screen scroll takeover ───────────────────────
 * ServicesSection (default export, named ServicesStack for import-site
 * stability) → ServicesScrollStage (the pinned 100dvh stage) → ServiceCard
 * × 6. Each card is the SAME full-stage panel; the incoming card slides up
 * from fully off-screen to fully in place as the user scrolls through its
 * own segment, so at rest it exactly and completely covers whatever was
 * there before — occlusion is guaranteed by geometry, not opacity tricks.
 * White → OneRed red → (next card white →) is the same per-card journey:
 * a card is white while entering, and settles to red once fully in place.
 *
 * No spring on the scroll → position mapping — the brief was explicit that
 * the movement must never lag the user's scroll. The rAF-throttled scroll
 * listener (the project's own established pattern) writes directly into a
 * plain motion value every frame; the only "easing" is a pure, instantaneous
 * cubic remap applied inside useTransform, not a time-based spring, so the
 * card's position is always a function of scroll position *right now*.
 * ────────────────────────────────────────────────────────────────────────── */

const RED = '#EA3323';
const INK = '#0a0a0a';
const WHITE = '#ffffff';
const EASE = [0.22, 1, 0.36, 1] as const;

type Service = {
  number: string;
  title: string;
  description: string;
  tags: string[];
  video?: string;
};

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/* Scroll-space budget, in vh, all direct/instantaneous (no springs):
 * a dwell at the very start and end so the first and last card each get
 * real reading time before/after their transition, plus one segment per
 * takeover (N-1 transitions for N cards). ~5.5 "screens" of scroll for six
 * services feels proportional, not "an absurd amount of empty scroll." */
const DWELL_VH = 55;
const SEGMENT_VH = 82;

/* ─── Card content ───────────────────────────────────────────────────────── */

/* ─── Right-side video trailer — its own hover-scale/reveal, both derived
 * from the SAME `lift` spring the card's own hover-tilt already uses, never
 * a second pointer listener or a competing animation source. Border reads
 * `var(--tag-border)` so it adapts white/red for free, off the exact motion
 * value already driving every other border on the card. Only mounts the
 * <video> element while its card is active — at most one video is ever
 * decoding/playing at a time across all six cards. */
function ServiceVideoPanel({
  src,
  isActive,
  lift,
  reduceMotion,
}: {
  src: string;
  isActive: boolean;
  lift: MotionValue<number>;
  reduceMotion: boolean;
}) {
  const scale = useTransform(lift, [0, -6], [1, 1.035]);
  const revealOpacity = useTransform(lift, [0, -6], [0, 1]);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Explicit, retry-safe play trigger instead of relying solely on the
  // `autoPlay` attribute — matches the established pattern in
  // ThreeEnvironment.tsx's useVideoTexture. Guards against the browser not
  // reliably honoring `autoPlay` on an element that mounts mid-animation.
  useEffect(() => {
    const v = videoRef.current;
    if (!isActive || !v) return;
    const attempt = () => v.play().catch(() => {});
    if (v.readyState >= 2) attempt();
    else v.addEventListener('canplay', attempt, { once: true });
  }, [isActive, src]);

  return (
    <motion.div
      className="w-full lg:w-[clamp(200px,25vw,340px)]"
      style={{
        position: 'relative',
        flexShrink: 0,
        height: 'clamp(150px, 30vh, 400px)',
        borderRadius: 6,
        border: '1px solid var(--tag-border)',
        overflow: 'hidden',
        background: 'rgba(10,10,10,0.04)',
        scale: reduceMotion ? 1 : scale,
      }}
    >
      {isActive && (
        <video
          ref={videoRef}
          key={src}
          src={src}
          muted
          loop
          autoPlay
          playsInline
          preload="auto"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      )}

      {/* Restrained VIEW reveal — opacity only, no zoom/rotation, driven off
          the same lift value as the panel's own hover-scale above. */}
      {!reduceMotion && (
        <motion.div
          aria-hidden
          style={{
            position: 'absolute',
            bottom: 10,
            right: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 8px',
            borderRadius: 3,
            background: 'rgba(0,0,0,0.5)',
            color: '#fff',
            opacity: revealOpacity,
          }}
        >
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase' }}>View</span>
          <ArrowUpRight size={11} strokeWidth={2} />
        </motion.div>
      )}
    </motion.div>
  );
}

function CardContent({
  service,
  arrowX,
  arrowY,
  isActive,
  lift,
  reduceMotion,
}: {
  service: Service;
  arrowX: MotionValue<number>;
  arrowY: MotionValue<number>;
  isActive: boolean;
  lift: MotionValue<number>;
  reduceMotion: boolean;
}) {
  return (
    <div
      style={{
        position: 'relative',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: 'clamp(28px, 4.5vw, 68px)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'clamp(12px, 1vw, 14px)',
            letterSpacing: '0.2em',
            fontVariantNumeric: 'tabular-nums',
            color: 'var(--fg)',
            opacity: 0.55,
          } as React.CSSProperties}
        >
          {service.number}
        </span>
        {/* Magnetic — nudged toward the cursor via the SAME pointer motion
            values the card's own tilt uses (see ServiceCard), never a
            separate whileHover animation fighting anything. */}
        <motion.span style={{ color: 'var(--fg)', flexShrink: 0, x: arrowX, y: arrowY }}>
          <ArrowUpRight size={24} strokeWidth={1.5} />
        </motion.span>
      </div>

      {/* Title + description (left) sit beside the trailer (right) on
          desktop; the trailer drops below the copy on narrow viewports so
          it never squeezes into a cramped two-column layout.
          `justify-content: space-between` matters here — the text column
          is capped at maxWidth:780, so on wide cards flex-grow alone leaves
          it short of the video panel with a stretch of unclaimed space
          between them. This pushes that leftover space to the outsides
          instead, so the video sits flush against the card's own right
          edge rather than floating wherever flex-grow happened to stop. */}
      <div className="flex flex-col lg:flex-row lg:items-center" style={{ flex: 1, justifyContent: 'space-between', gap: 'clamp(20px, 3vw, 48px)', minHeight: 0 }}>
        <div style={{ flex: 1, minWidth: 0, maxWidth: 780, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h2
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'clamp(36px, 6vw, 92px)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1.02,
              margin: 0,
              color: 'var(--fg)',
            }}
          >
            {service.title}
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'clamp(14px, 1.35vw, 19px)',
              lineHeight: 1.62,
              maxWidth: 560,
              marginTop: 'clamp(18px, 2.4vw, 30px)',
              marginBottom: 0,
              color: 'var(--fg)',
              opacity: 0.72,
            }}
          >
            {service.description}
          </p>
        </div>

        {service.video && (
          <ServiceVideoPanel
            src={service.video}
            isActive={isActive}
            lift={lift}
            reduceMotion={reduceMotion}
          />
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(8px, 0.9vw, 12px)' }}>
        {service.tags.map((tag) => (
          <span
            key={tag}
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'clamp(10px, 0.8vw, 12px)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              padding: 'clamp(7px, 0.7vw, 10px) clamp(12px, 1.2vw, 18px)',
              border: '1px solid var(--tag-border)',
              borderRadius: 3,
              color: 'var(--fg)',
              opacity: 0.85,
              whiteSpace: 'nowrap',
            }}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Per-card technical detail layer ─────────────────────────────────────
 * The logo's own block/pixel construction, echoed at card scale: a thin
 * coordinate line, a small corner marker, and — only on the currently
 * active card — a couple of barely-perceptible drifting blocks, so the
 * active card reads as "alive" without the user consciously clocking why.
 * Colour inverts with the card (red accent on white cards, white accent on
 * red cards). Lives in the empty right-hand two-thirds of the card, well
 * clear of the text column (capped at maxWidth: 900 in CardContent), so it
 * can never cross or compete with copy. Pure CSS/opacity/transform — no
 * scroll coupling, so it can never be a source of the lag this file was
 * fixed for.
 * ────────────────────────────────────────────────────────────────────────── */

function CardTechDetails({
  isRedTarget,
  isActive,
  reduceMotion,
}: {
  isRedTarget: boolean;
  isActive: boolean;
  reduceMotion: boolean;
}) {
  const accent = isRedTarget ? 'rgba(255,255,255,0.55)' : 'rgba(234,51,35,0.5)';
  const line = isRedTarget ? 'rgba(255,255,255,0.12)' : 'rgba(10,10,10,0.08)';

  return (
    <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
      <div style={{ position: 'absolute', top: '9%', right: '7%', width: 1, height: '38%', background: line }} />
      <div style={{ position: 'absolute', top: '9%', right: '7%', width: 'clamp(28px, 5vw, 64px)', height: 1, background: line }} />
      {!reduceMotion && isActive && (
        <>
          <motion.span
            animate={{ y: [0, -16, 0], opacity: [0.12, 0.3, 0.12] }}
            transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
            style={{ position: 'absolute', top: '32%', right: '16%', width: 4, height: 4, background: accent }}
          />
          <motion.span
            animate={{ y: [0, 13, 0], opacity: [0.1, 0.22, 0.1] }}
            transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 1.6 }}
            style={{ position: 'absolute', top: '58%', right: '22%', width: 3, height: 3, background: accent }}
          />
        </>
      )}
    </div>
  );
}

/* ─── A single takeover card ─────────────────────────────────────────────── */

function ServiceCard({
  service,
  index,
  progress,
  segment,
  activeIndex,
  prevStillVisible,
  reduceMotion,
}: {
  service: Service;
  index: number;
  progress: MotionValue<number>;
  segment: { start: number; size: number } | null; // null for card 0 — it never "enters"
  activeIndex: number;
  /** True while the incoming (activeIndex) card is still mid-slide, meaning
   *  it hasn't fully covered the card behind it yet. Lets that outgoing
   *  card's video stay mounted until it's actually off-screen, instead of
   *  vanishing the instant the next card starts entering — see
   *  ServicesScrollStage for where this is computed. */
  prevStillVisible: boolean;
  reduceMotion: boolean;
}) {
  // Alternating identity, built directly into the data: even index (01, 03,
  // 05) is a white card, odd index (02, 04, 06) is a red card. A card's
  // colour is never "all red" or "all white" globally — it's a property of
  // that specific card.
  const isRedTarget = index % 2 === 1;
  const targetBg = isRedTarget ? RED : WHITE;
  const targetFg = isRedTarget ? WHITE : INK;
  const targetBorder = isRedTarget ? 'rgba(255,255,255,0.35)' : 'rgba(10,10,10,0.14)';

  // localT is the ONLY thing that drives this card's takeover — position,
  // scale, background, text colour and border all derive from it via
  // useTransform below, so none of them can ever arrive a frame apart from
  // the others (the exact bug found in review: a separate whileHover
  // animation was fighting the scroll-driven `y`, so movement and colour
  // visibly decoupled the moment you touched a card).
  const localT = useTransform(progress, (p) => {
    if (!segment) return 1; // card 0 has no entry — always resting in place
    const raw = Math.max(0, Math.min(1, (p - segment.start) / segment.size));
    return easeInOutCubic(raw);
  });

  const scrollY = useTransform(localT, (t) => (segment ? (1 - t) * 100 : 0)); // percent, numeric
  const scale = useTransform(localT, [0, 1], [0.985, 1]);
  const bg = useTransform(localT, [0, 1], [WHITE, targetBg]);
  const fg = useTransform(localT, [0, 1], [INK, targetFg]);
  const tagBorder = useTransform(localT, [0, 1], ['rgba(10,10,10,0.14)', targetBorder]);

  // Pointer interaction — its own independent motion values, driving
  // DIFFERENT properties (tilt, a small additive lift, the magnetic arrow)
  // than the scroll pipeline above. Because these never share a property
  // with `scrollY`, they can spring freely without ever re-introducing the
  // lag the whileHover version caused.
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  // Spring-wrapped like lift/arrow below — raw px/py update once per
  // pointermove sample, so feeding them straight into rotateX/rotateY made
  // the card's own tilt snap on every sample instead of gliding, the one
  // hover value in this file that wasn't as smooth as the rest.
  const tiltX = useSpring(useTransform(py, [0, 1], [2, -2]), { stiffness: 300, damping: 30, mass: 0.6 });
  const tiltY = useSpring(useTransform(px, [0, 1], [-2, 2]), { stiffness: 300, damping: 30, mass: 0.6 });
  const liftTarget = useMotionValue(0);
  const lift = useSpring(liftTarget, { stiffness: 320, damping: 28, mass: 0.6 });
  const arrowX = useSpring(useTransform(px, [0, 1], [-5, 5]), { stiffness: 300, damping: 24 });
  const arrowY = useSpring(useTransform(py, [0, 1], [-5, 5]), { stiffness: 300, damping: 24 });

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (reduceMotion) return;
      const r = e.currentTarget.getBoundingClientRect();
      px.set((e.clientX - r.left) / r.width);
      py.set((e.clientY - r.top) / r.height);
    },
    [px, py, reduceMotion]
  );
  const handlePointerEnter = useCallback(() => {
    if (!reduceMotion) liftTarget.set(-6);
  }, [liftTarget, reduceMotion]);
  const handlePointerLeave = useCallback(() => {
    liftTarget.set(0);
    px.set(0.5);
    py.set(0.5);
  }, [liftTarget, px, py]);

  // The single `y` the element actually renders — scroll position and hover
  // lift summed inside one motion value, rather than two props competing
  // for the same underlying transform.
  const y = useTransform([scrollY, lift], ([s, l]) => `calc(${s as number}% + ${l as number}px)`);

  const isActive = index === activeIndex;
  // The outgoing card keeps its video mounted until the incoming card has
  // actually finished sliding over it, not just started — otherwise the
  // video vanishes while the card is still partly visible on screen,
  // reading as "the video disappears."
  const videoVisible = isActive || (index === activeIndex - 1 && prevStillVisible);

  return (
    <motion.div
      role="group"
      aria-roledescription="slide"
      aria-label={`${service.title} — service ${index + 1} of 6`}
      aria-hidden={isActive ? undefined : true}
      onPointerMove={handlePointerMove}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      style={{
        position: 'absolute',
        // Bottom inset removed — every card sat with a small margin above
        // the stage's true bottom edge, leaving a persistent gap that
        // revealed the background underneath at the very bottom of every
        // card, on every card, not just a transition artifact. Flush to 0
        // so a "fully settled" card actually, completely covers the stage
        // with no seam. Top/side insets stay — top clears the fixed nav,
        // sides keep the intentional floating-panel framing.
        inset: 'clamp(64px, 10vh, 104px) clamp(20px, 4vw, 72px) 0',
        zIndex: index + 1,
        borderRadius: 8,
        border: '1px solid var(--tag-border)',
        overflow: 'hidden',
        boxShadow: '0 30px 70px rgba(0,0,0,0.12), 0 6px 20px rgba(0,0,0,0.06)',
        background: reduceMotion ? targetBg : bg,
        y: reduceMotion ? 0 : y,
        scale: reduceMotion ? 1 : scale,
        rotateX: reduceMotion ? 0 : tiltX,
        rotateY: reduceMotion ? 0 : tiltY,
        transformPerspective: 1400,
        // Custom properties, not per-element motion.spans — every child
        // reads `var(--fg)` / `var(--tag-border)` for its own colour, so a
        // single interpolated value drives the whole card's text/border
        // state without wiring a transform onto each individual node.
        ['--fg' as string]: reduceMotion ? targetFg : fg,
        ['--tag-border' as string]: reduceMotion ? targetBorder : tagBorder,
      }}
    >
      <CardTechDetails isRedTarget={isRedTarget} isActive={isActive} reduceMotion={reduceMotion} />
      <CardContent
        service={service}
        arrowX={arrowX}
        arrowY={arrowY}
        isActive={videoVisible}
        lift={lift}
        reduceMotion={reduceMotion}
      />
    </motion.div>
  );
}


/* ─── Ambient wireframe + particles — behind every card, never competing ── */

function StageEnvironment() {
  return (
    <div aria-hidden style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(10,10,10,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(10,10,10,0.04) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: 'radial-gradient(65% 65% at 50% 45%, black, transparent)',
          WebkitMaskImage: 'radial-gradient(65% 65% at 50% 45%, black, transparent)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '12%',
          right: '8%',
          width: 'clamp(160px, 20vw, 320px)',
          height: 'clamp(160px, 20vw, 320px)',
          border: '1px solid rgba(234,51,35,0.14)',
          borderRadius: 12,
          transform: 'rotate(8deg)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '10%',
          left: '6%',
          width: 'clamp(120px, 14vw, 220px)',
          height: 'clamp(120px, 14vw, 220px)',
          border: '1px solid rgba(10,10,10,0.08)',
          borderRadius: 12,
          transform: 'rotate(-6deg)',
        }}
      />
    </div>
  );
}

/* ─── Pinned scroll stage — the sticky 100dvh viewport ───────────────────── */

function ServicesScrollStage({ services }: { services: Service[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const rawProgress = useMotionValue(0);
  const reduceMotion = useReducedMotion() ?? false;
  const [activeIndex, setActiveIndex] = useState(0);
  const lastIndexRef = useRef(0);
  // True while the current activeIndex card is still mid-slide (hasn't
  // finished covering the card behind it). Lets that previous card's video
  // stay mounted until it's actually off-screen — see ServiceCard's
  // videoVisible and the "video disappears" fix this powers.
  const [prevStillVisible, setPrevStillVisible] = useState(false);
  const lastPrevVisibleRef = useRef(false);

  const transitions = services.length - 1;
  const totalVh = DWELL_VH * 2 + SEGMENT_VH * transitions;

  const segments = useMemo(() => {
    const dwellFrac = DWELL_VH / totalVh;
    const segFrac = SEGMENT_VH / totalVh;
    return services.map((_, i) =>
      i === 0 ? null : { start: dwellFrac + (i - 1) * segFrac, size: segFrac }
    );
  }, [services, totalVh]);

  useEffect(() => {
    return rawProgress.on('change', (p) => {
      // Discrete active index: the last card whose segment has fully
      // completed (or 0 before anything has). Only writes state when the
      // value actually changes — the project's established guard against
      // re-rendering on every scroll pixel.
      let idx = 0;
      for (let i = 1; i < segments.length; i++) {
        const seg = segments[i];
        if (seg && p >= seg.start) idx = i;
      }
      if (idx !== lastIndexRef.current) {
        lastIndexRef.current = idx;
        setActiveIndex(idx);
      }

      // The active card's own segment (null for card 0, which has no entry
      // and is instantly "done"). While p hasn't reached the end of that
      // segment yet, the active card is still sliding up and hasn't fully
      // covered whatever's behind it.
      const activeSeg = segments[idx];
      const stillEntering = !!activeSeg && p < activeSeg.start + activeSeg.size;
      if (stillEntering !== lastPrevVisibleRef.current) {
        lastPrevVisibleRef.current = stillEntering;
        setPrevStillVisible(stillEntering);
      }
    });
  }, [rawProgress, segments]);

  useEffect(() => {
    if (reduceMotion) {
      rawProgress.set(1);
      return;
    }
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
  }, [rawProgress, reduceMotion]);

  return (
    <div ref={wrapRef} style={{ height: reduceMotion ? '100dvh' : `${totalVh}vh`, position: reduceMotion ? 'static' : 'relative' }}>
      <div
        style={{
          position: reduceMotion ? 'relative' : 'sticky',
          top: 0,
          height: '100dvh',
          overflow: 'hidden',
        }}
      >
        <StageEnvironment />
        {services.map((service, i) => (
          <ServiceCard
            key={service.number}
            service={service}
            index={i}
            progress={rawProgress}
            segment={segments[i]}
            activeIndex={activeIndex}
            prevStillVisible={prevStillVisible}
            reduceMotion={reduceMotion}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Reduced-motion fallback — plain, fully accessible, no pin ─────────── */

function SimpleServiceList({ services }: { services: Service[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  return (
    <div style={{ padding: '0 clamp(1.5rem, 4vw, 3rem)', maxWidth: 760, margin: '0 auto' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {services.map((service, i) => {
          const active = openIndex === i;
          return (
            <div
              key={service.number}
              style={{
                border: `1px solid ${active ? 'rgba(234,51,35,0.35)' : 'rgba(10,10,10,0.1)'}`,
                borderRadius: 6,
                background: active ? RED : '#fefefe',
                overflow: 'hidden',
                transition: 'background 0.3s ease, border-color 0.3s ease',
              }}
            >
              <button
                onClick={() => setOpenIndex((cur) => (cur === i ? null : i))}
                aria-expanded={active}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '18px 18px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  color: active ? WHITE : INK,
                }}
              >
                <span style={{ fontSize: 11, letterSpacing: '0.12em', opacity: 0.55, flexShrink: 0, width: 22 }}>{service.number}</span>
                <h3 style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', margin: 0, flex: 1 }}>{service.title}</h3>
                <ArrowUpRight size={16} strokeWidth={1.8} style={{ transform: active ? 'rotate(45deg)' : 'none', transition: 'transform 0.3s ease' }} />
              </button>
              <AnimatePresence>
                {active && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.28 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{ padding: '0 18px 20px 54px' }}>
                      <p style={{ fontSize: 13, opacity: 0.82, lineHeight: 1.66, margin: '0 0 14px', color: WHITE }}>{service.description}</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {service.tags.map((tag) => (
                          <span
                            key={tag}
                            style={{
                              fontSize: 9.5,
                              textTransform: 'uppercase',
                              letterSpacing: '0.1em',
                              padding: '5px 10px',
                              border: '1px solid rgba(255,255,255,0.35)',
                              borderRadius: 3,
                              opacity: 0.85,
                              color: WHITE,
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Top-level export ───────────────────────────────────────────────────── */

export function ServicesStack({ services }: { services: Service[] }) {
  const reduceMotion = useReducedMotion() ?? false;
  return reduceMotion ? <SimpleServiceList services={services} /> : <ServicesScrollStage services={services} />;
}
