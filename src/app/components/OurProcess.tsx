import { useRef, useEffect, useState, useCallback, useLayoutEffect } from 'react';
import {
  motion,
  animate,
  useInView,
  useMotionValue,
  useTransform,
  useMotionValueEvent,
  useReducedMotion,
  type AnimationPlaybackControls,
} from 'motion/react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
// Imported, not redeclared — /studio renders this same array, so the two
// pages can no longer describe different processes. See data/process.ts.
import { process } from '../data/process';

/* ─── Our Process — a flick carousel ─────────────────────────────────────
 * Rebuilt 2026-09-20 on the apple-design rules (Designing Fluid Interfaces):
 * the five stages are wide glass cards side by side, and the track is a
 * thing you hold, not a thing you watch.
 *
 *   response        card presses on pointer-down, the track moves 1:1 with
 *                   the pointer from the first frame past hysteresis
 *   interruptible   a moving track can be grabbed mid-flight; the grab
 *                   reads the live value, so there is never a jump
 *   velocity        the release velocity is handed to the spring, so the
 *                   throw and the settle are one motion
 *   projection      the snap target is chosen from where the throw WOULD
 *                   land (exponential decay, rate 0.998), not from where
 *                   the finger let go
 *   rubber-band     past either end the track follows less and less
 *   bounce          only after a real flick; a button press or a tap
 *                   settles critically damped
 *
 * The track position lives in a motion value, never React state; the only
 * state is the active index, written when it changes. `touch-action:
 * pan-y` leaves vertical page scrolling to the browser on phones.
 * ────────────────────────────────────────────────────────────────────────── */

const RED = '#EA3323';
const INK = '#0a0a0a';
const EASE = [0.22, 1, 0.36, 1] as const;

/** Px of travel before a press becomes a drag (tap hysteresis). */
const DRAG_THRESHOLD = 8;
/** Release speed (px/s) above which the settle is allowed a little bounce. */
const FLICK_SPEED = 320;
/** Apple's deceleration rate for a normal scroll feel. */
const DECELERATION = 0.998;

/** Where a throw at `velocity` px/s would come to rest, relative to now. */
function project(velocity: number, rate = DECELERATION): number {
  return ((velocity / 1000) * rate) / (1 - rate);
}

/** Progressive resistance past a bound: the further out, the less it follows. */
function rubberband(overshoot: number, dimension: number, constant = 0.55): number {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

type Sample = { x: number; t: number };

/* ─── One stage card ─────────────────────────────────────────────────────── */

function ProcessCard({
  step,
  index,
  total,
  active,
  width,
  inView,
  reduceMotion,
  onTap,
}: {
  step: (typeof process)[0];
  index: number;
  total: number;
  active: boolean;
  width: number;
  inView: boolean;
  reduceMotion: boolean;
  onTap: (i: number) => void;
}) {
  // Materialise on arrival: blur and position together, staggered per card.
  const entrance = reduceMotion
    ? { initial: { opacity: 0 }, animate: inView ? { opacity: 1 } : {} }
    : {
        initial: { opacity: 0, y: 28, filter: 'blur(8px)' },
        animate: inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {},
      };

  return (
    <motion.article
      {...entrance}
      transition={{ duration: 0.7, ease: EASE, delay: 0.08 + index * 0.07 }}
      whileTap={reduceMotion ? undefined : { scale: 0.985 }}
      onClick={() => onTap(index)}
      aria-current={active ? 'true' : undefined}
      aria-label={`${step.number} ${step.title}`}
      style={{
        position: 'relative',
        flexShrink: 0,
        width,
        height: 'clamp(380px, 56vh, 540px)',
        borderRadius: 22,
        overflow: 'hidden',
        padding: 'clamp(26px, 3vw, 44px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        // Glass recipe: flat translucent warm white; the colour comes from
        // the field behind it, never from the card's own paint.
        background: 'rgba(255,253,251,0.72)',
        backdropFilter: 'blur(20px) saturate(170%)',
        WebkitBackdropFilter: 'blur(20px) saturate(170%)',
        border: '1px solid rgba(234,51,35,0.16)',
        boxShadow:
          '0 22px 48px rgba(234,51,35,0.09), 0 3px 12px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.8)',
        color: INK,
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      {/* back layer: the stage number, oversized and bleeding off the card */}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          right: '-3%',
          top: '-6%',
          fontSize: 'clamp(200px, 24vw, 360px)',
          fontWeight: 800,
          lineHeight: 0.8,
          letterSpacing: '-0.07em',
          color: 'rgba(234,51,35,0.085)',
          pointerEvents: 'none',
        }}
      >
        {step.number}
      </span>

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 14 }}>
        <span
          style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.16em', opacity: 0.45, fontVariantNumeric: 'tabular-nums' } as React.CSSProperties}
        >
          {step.number} / {String(total).padStart(2, '0')}
        </span>
        <span aria-hidden style={{ width: 6, height: 6, background: RED, borderRadius: 1, opacity: active ? 1 : 0.35, transition: 'opacity 300ms' }} />
      </div>

      <div style={{ position: 'relative' }}>
        <h3
          style={{
            fontSize: 'clamp(40px, 5vw, 72px)',
            fontWeight: 800,
            letterSpacing: '-0.04em',
            lineHeight: 0.96,
            margin: '0 0 18px',
          }}
        >
          {step.title}
        </h3>
        <p style={{ fontSize: 'clamp(15px, 1.25vw, 18px)', lineHeight: 1.65, opacity: 0.58, maxWidth: 440, margin: 0 }}>
          {step.description}
        </p>
      </div>
    </motion.article>
  );
}

/* ─── Top-level OurProcess component ────────────────────────────────────── */

export function OurProcess() {
  const reduceMotion = useReducedMotion() ?? false;
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: '-80px' });

  const viewportRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const [active, setActive] = useState(0);
  const [cardWidth, setCardWidth] = useState(640);
  const GAP = 20;
  const step = cardWidth + GAP;
  const minX = -(process.length - 1) * step;

  // Card width follows the viewport: roughly two-thirds of the track on
  // desktop, nearly full width on phones, so the next card always peeks.
  useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      setCardWidth(w < 640 ? Math.round(w * 0.86) : Math.round(clamp(w * 0.58, 480, 760)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Keep the current card in place when the card width changes: which card
  // is read against the OLD step, before the derived index has a chance to
  // misread the old position against the new width.
  const activeRef = useRef(0);
  const prevStep = useRef(step);
  useEffect(() => {
    const i = clamp(Math.round(-x.get() / prevStep.current), 0, process.length - 1);
    prevStep.current = step;
    x.set(-i * step);
  }, [step, x]);

  // Active index is derived from the track position, not the other way round.
  const activeMV = useTransform(x, (v) => clamp(Math.round(-v / step), 0, process.length - 1));
  useMotionValueEvent(activeMV, 'change', (i) => {
    if (i !== activeRef.current) {
      activeRef.current = i;
      setActive(i);
    }
  });

  const controls = useRef<AnimationPlaybackControls | null>(null);

  /** Spring the track to a card. Bounce only when a flick carried it there. */
  const settle = useCallback(
    (index: number, velocity = 0) => {
      const target = -clamp(index, 0, process.length - 1) * step;
      controls.current?.stop();
      if (reduceMotion) {
        x.set(target);
        return;
      }
      const flick = Math.abs(velocity) > FLICK_SPEED;
      controls.current = animate(x, target, {
        type: 'spring',
        bounce: flick ? 0.18 : 0,
        duration: flick ? 0.55 : 0.45,
        velocity,
      });
    },
    [x, step, reduceMotion],
  );

  /* ── Pointer: hold, drag 1:1, throw ── */
  const drag = useRef<{
    pointerId: number;
    startPointer: number;
    startX: number;
    dragging: boolean;
    samples: Sample[];
  } | null>(null);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      // Grab the live value: if the track is mid-flight this is where it IS.
      controls.current?.stop();
      suppressClick.current = false;
      drag.current = {
        pointerId: e.pointerId,
        startPointer: e.clientX,
        startX: x.get(),
        dragging: false,
        samples: [{ x: e.clientX, t: performance.now() }],
      };
    },
    [x],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const d = drag.current;
      if (!d || d.pointerId !== e.pointerId) return;
      const dx = e.clientX - d.startPointer;
      if (!d.dragging) {
        if (Math.abs(dx) < DRAG_THRESHOLD) return;
        d.dragging = true;
        e.currentTarget.setPointerCapture(e.pointerId);
      }
      d.samples.push({ x: e.clientX, t: performance.now() });
      if (d.samples.length > 6) d.samples.shift();

      let next = d.startX + dx;
      if (next > 0) next = rubberband(next, cardWidth);
      else if (next < minX) next = minX + rubberband(next - minX, cardWidth);
      x.set(next);
    },
    [x, cardWidth, minX],
  );

  const endDrag = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const d = drag.current;
      if (!d || d.pointerId !== e.pointerId) return;
      drag.current = null;
      if (!d.dragging) return; // a tap; the card's onClick handles it
      if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);

      // Velocity over the last ~80ms of movement, px/s.
      const now = performance.now();
      const recent = d.samples.filter((s) => now - s.t <= 80);
      const first = recent[0] ?? d.samples[0];
      const last = d.samples[d.samples.length - 1];
      const dt = last.t - first.t;
      const velocity = dt > 0 ? ((last.x - first.x) / dt) * 1000 : 0;

      // Snap to the card nearest where the throw would land.
      const projected = x.get() + project(velocity);
      settle(Math.round(-projected / step), velocity);
    },
    [x, step, settle],
  );

  // A drag that ended in a tap must not also fire the card's click.
  const suppressClick = useRef(false);
  const onPointerUpCapture = useCallback(() => {
    if (drag.current?.dragging) suppressClick.current = true;
  }, []);
  const onClickCapture = useCallback((e: React.MouseEvent) => {
    if (suppressClick.current) {
      suppressClick.current = false;
      e.stopPropagation();
      e.preventDefault();
    }
  }, []);

  /* ── Trackpad: horizontal wheel moves the track 1:1, then settles ── */
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    let timer = 0;
    let lastDelta = 0;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      const cur = x.get();
      const atEnd = (e.deltaX > 0 && cur <= minX) || (e.deltaX < 0 && cur >= 0);
      if (atEnd) return; // let the page have it
      e.preventDefault();
      controls.current?.stop();
      x.set(clamp(cur - e.deltaX, minX, 0));
      lastDelta = -e.deltaX;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const velocity = lastDelta * 60; // one frame's delta as px/s
        const projected = x.get() + project(velocity, 0.99);
        settle(Math.round(-projected / step), Math.abs(velocity) > FLICK_SPEED ? velocity : 0);
      }, 90);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
      window.clearTimeout(timer);
    };
  }, [x, minX, step, settle]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        settle(activeRef.current + 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        settle(activeRef.current - 1);
      }
    },
    [settle],
  );

  // The red field behind the glass drifts with the track at a slower rate,
  // so the cards read as moving over something rather than on a flat page.
  const fieldX = useTransform(x, (v) => v * 0.25);

  const btnStyle: React.CSSProperties = {
    width: 46,
    height: 46,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255,255,255,0.6)',
    border: '1px solid rgba(0,0,0,0.14)',
    color: INK,
    cursor: 'pointer',
  };

  return (
    <section ref={sectionRef} style={{ background: '#fff', padding: 'clamp(4rem, 8vh, 7rem) 0 clamp(6rem, 10vh, 9rem)', overflow: 'hidden' }}>
      <div
        style={{
          maxWidth: 1400,
          margin: '0 auto',
          paddingLeft: 'clamp(1.5rem, 4vw, 5rem)',
          paddingRight: 'clamp(1.5rem, 4vw, 5rem)',
        }}
      >
        {/* Heading row: copy on the left, the counter and controls on the right */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: '2rem 3rem',
            marginBottom: 'clamp(2rem, 4vh, 3.5rem)',
          }}
        >
          <div style={{ maxWidth: 620 }}>
            <div style={{ overflow: 'hidden', marginBottom: 14 }}>
              <motion.p
                initial={{ y: '110%' }}
                animate={inView ? { y: 0 } : {}}
                transition={{ duration: 0.6, ease: EASE }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 10, fontWeight: 600, letterSpacing: '0.3em', textTransform: 'uppercase', opacity: 0.38, margin: 0 }}
              >
                <span aria-hidden style={{ width: 6, height: 6, background: RED, borderRadius: 1 }} />
                Our Process
              </motion.p>
            </div>
            <div style={{ overflow: 'hidden', marginBottom: 18 }}>
              <motion.h2
                initial={{ y: '110%' }}
                animate={inView ? { y: 0 } : {}}
                transition={{ duration: 0.78, ease: EASE, delay: 0.06 }}
                style={{ fontSize: 'clamp(38px, 4.8vw, 72px)', fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 1.0, margin: 0 }}
              >
                How We Build
                <br />
                Great Work
              </motion.h2>
            </div>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.62, delay: 0.14, ease: EASE }}
              style={{ fontSize: 15, opacity: 0.48, lineHeight: 1.74, maxWidth: 380, margin: 0 }}
            >
              Every engagement follows a proven framework that balances creative
              ambition with strategic discipline, so the work delivers results
              beyond aesthetics.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            style={{ display: 'flex', alignItems: 'center', gap: 22 }}
          >
            {/* Stage marks: the site's small red square motif. The active
                one stretches; one object moving, not five switching. */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} aria-hidden>
              {process.map((s, i) => (
                <motion.span
                  key={s.number}
                  animate={{ width: i === active ? 26 : 6, background: i === active ? RED : 'rgba(10,10,10,0.18)' }}
                  transition={reduceMotion ? { duration: 0 } : { type: 'spring', bounce: 0, duration: 0.4 }}
                  style={{ display: 'block', height: 6, borderRadius: 1 }}
                />
              ))}
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.16em', opacity: 0.45, fontVariantNumeric: 'tabular-nums' } as React.CSSProperties}>
              {String(active + 1).padStart(2, '0')} / {String(process.length).padStart(2, '0')}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <motion.button
                type="button"
                aria-label="Previous stage"
                className="btn-corners"
                disabled={active === 0}
                onClick={() => settle(activeRef.current - 1)}
                whileTap={{ scale: 0.94 }}
                transition={{ type: 'spring', bounce: 0, duration: 0.25 }}
                style={{ ...btnStyle, opacity: active === 0 ? 0.35 : 1, cursor: active === 0 ? 'default' : 'pointer' }}
              >
                <ArrowLeft size={16} strokeWidth={1.6} />
              </motion.button>
              <motion.button
                type="button"
                aria-label="Next stage"
                className="btn-corners"
                disabled={active === process.length - 1}
                onClick={() => settle(activeRef.current + 1)}
                whileTap={{ scale: 0.94 }}
                transition={{ type: 'spring', bounce: 0, duration: 0.25 }}
                style={{ ...btnStyle, opacity: active === process.length - 1 ? 0.35 : 1, cursor: active === process.length - 1 ? 'default' : 'pointer' }}
              >
                <ArrowRight size={16} strokeWidth={1.6} />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* The track. Starts on the container's left edge and runs off the
          right edge of the viewport, so the next card always peeks in. */}
      <div style={{ position: 'relative' }}>
        {/* Atmosphere behind the glass: the soft red field and faint boxy
            grid the section already had, now drifting with the track. */}
        <motion.div
          aria-hidden
          style={{
            position: 'absolute',
            left: '38%',
            top: '50%',
            translateY: '-50%',
            x: fieldX,
            width: 'min(70vw, 960px)',
            height: 'min(70vw, 960px)',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(234,51,35,0.14), transparent 64%)',
            filter: 'blur(30px)',
            pointerEvents: 'none',
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: '-10% 0',
            backgroundImage:
              'linear-gradient(rgba(10,10,10,0.032) 1px, transparent 1px), linear-gradient(90deg, rgba(10,10,10,0.032) 1px, transparent 1px)',
            backgroundSize: '90px 90px',
            maskImage: 'radial-gradient(ellipse 70% 60% at 55% 50%, black 18%, transparent 76%)',
            WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 55% 50%, black 18%, transparent 76%)',
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            maxWidth: 1400,
            margin: '0 auto',
            paddingLeft: 'clamp(1.5rem, 4vw, 5rem)',
          }}
        >
          <div
            ref={viewportRef}
            role="region"
            aria-roledescription="carousel"
            aria-label="Our process"
            tabIndex={0}
            onKeyDown={onKeyDown}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onPointerUpCapture={onPointerUpCapture}
            onClickCapture={onClickCapture}
            className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-[#EA3323]"
            style={{
              position: 'relative',
              touchAction: 'pan-y',
              cursor: 'grab',
              // Room for the shadow and the press-scale without clipping.
              padding: '24px 0 40px',
              margin: '-24px 0 -40px',
            }}
          >
            <motion.div
              style={{ display: 'flex', gap: GAP, x, willChange: 'transform' }}
            >
              {process.map((s, i) => (
                <ProcessCard
                  key={s.number}
                  step={s}
                  index={i}
                  total={process.length}
                  active={i === active}
                  width={cardWidth}
                  inView={inView}
                  reduceMotion={reduceMotion}
                  onTap={(idx) => settle(idx)}
                />
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
