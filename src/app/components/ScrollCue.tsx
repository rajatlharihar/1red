import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { getLenis } from './SmoothScroll';

/* ─── "scroll", whenever the reader stops (Rajat, 2026-10-16) ───────────────
 * One cue for the whole home page: typewriter "scroll" and a bobbing chevron,
 * fixed in the empty wall on the right on desktop (bottom centre on phones). White with mix-blend-mode: difference, so it
 * inverts over white, red, black and photos alike. Portalled to <body> so
 * no section's stacking context isolates the blend.
 *
 * It fades out while the page moves and back in after the reader has been
 * still for a moment. Hidden at the foot of the page and while the hero's
 * guided glide runs (Lenis is locked then).
 * ────────────────────────────────────────────────────────────────────────── */

const IDLE_MS = 900;
const FADE_MS = 200;
const WIDE = '(min-width: 768px) and (min-aspect-ratio: 1/1)';

export function ScrollCue() {
  const reduceMotion = useReducedMotion() ?? false;
  const [shown, setShown] = useState(false);
  // Desktop: in the empty wall right of the frame, word and chevron on one
  // line (Rajat, 2026-10-16). Phones have no free wall there: bottom centre.
  const [wideScreen, setWide] = useState(() => window.matchMedia(WIDE).matches);
  useEffect(() => {
    const mq = window.matchMedia(WIDE);
    const on = () => setWide(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  // The right-wall spot is only for the hero's opening screen; everywhere
  // else the cue sits at the bottom centre (Rajat, 2026-10-17).
  const [opening, setOpening] = useState(() => window.scrollY < window.innerHeight * 0.5);
  useEffect(() => {
    const on = () => setOpening(window.scrollY < window.innerHeight * 0.5);
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  const wide = wideScreen && opening;

  useEffect(() => {
    let timer = window.setTimeout(check, IDLE_MS);
    function atBottom() {
      const doc = document.documentElement;
      return window.scrollY + window.innerHeight >= doc.scrollHeight - 40;
    }
    function check() {
      if (getLenis()?.isLocked) {
        timer = window.setTimeout(check, 250);
        return;
      }
      setShown(!atBottom());
    }
    // Lenis eases out with a long tail of sub-pixel steps; those count as
    // stopped, or the cue would wait seconds after the reader has.
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const dy = Math.abs(y - lastY);
      lastY = y;
      if (dy >= 1.5) onMove();
    };
    const onMove = () => {
      setShown(false);
      window.clearTimeout(timer);
      timer = window.setTimeout(check, IDLE_MS);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('wheel', onMove, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('wheel', onMove);
      window.removeEventListener('touchmove', onMove);
    };
  }, []);

  return createPortal(
    <div
      aria-hidden
      style={{
        position: 'fixed',
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        ...(wide
          ? { left: '89%', top: '57%', transform: 'translate(-50%, -50%)', flexDirection: 'row', gap: 8 }
          : { left: '50%', bottom: 'clamp(18px, 4vh, 40px)', transform: 'translateX(-50%)', flexDirection: 'column', gap: 4 }),
        color: '#FFFFFF',
        mixBlendMode: 'difference',
        pointerEvents: 'none',
        opacity: shown ? 1 : 0,
        transition: `opacity ${FADE_MS}ms ease`,
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-hand)',
          fontSize: 24, // ~19px effective: the face is size-adjusted to 78%
          letterSpacing: '0.04em',
          lineHeight: 1,
        }}
      >
        scroll
      </span>
      <motion.span
        animate={reduceMotion ? undefined : { y: [0, 6, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        style={{ display: 'flex' }}
      >
        <ChevronDown size={22} strokeWidth={2} />
      </motion.span>
    </div>,
    document.body
  );
}
