import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { INK, smooth } from '../about/shared';
import { glide, subscribeGlide } from '../scrollGlide';
import { DealA, DealB } from './DealLayouts';
import { registerSoftStop } from '../SmoothScroll';

/* ─── THE DEAL — being new, said out loud ──────────────────────────────────
 * The big networks lead with heritage, office counts and award walls. We
 * can't, so we turn the gap into the pitch (the Avis move: "we're No. 2,
 * so we try harder"). Four numbers set in Rajat's own numerals, each a
 * plain promise rather than a made-up stat. 2026-10-06 (Rajat): the next
 * card in the stack, sliding up over the red flags; no rule; everything
 * builds while the card travels (see the effect below).
 * ────────────────────────────────────────────────────────────────────────── */

const SECTION_VH = 150;

const DEALS = [
  { n: [0], unit: 'years of bad habits', body: 'We’re new. Nothing here runs on autopilot, and nobody has said “we’ve always done it this way”.' },
  { n: [1], unit: 'table', body: 'Strategy, design, socials, and user experience all sit together. You get a chair too. Bring snacks.' },
  { n: [1, 0, 0], unit: 'percent makers, no middlemen', body: 'Our client list is short. So is the chain of command. You talk to the people doing the work.' },
];

export function TheDeal() {
  const reduce = !!useReducedMotion();
  // Stacked panels outgrow a phone's frame, so the pin is wide-only.
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const apply = () => setNarrow(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);
  const reduceMotion = reduce || narrow;
  const wrapRef = useRef<HTMLElement>(null);
  // Arrives through the block transition (BlockTransitions), not a tilt-in.
  const digitRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [focus, setFocus] = useState(-1);
  // Soft landing: the deal pinned, whole on screen.
  useEffect(() => {
    if (reduceMotion) return;
    return registerSoftStop(() => {
      let top = 0;
      for (let n: HTMLElement | null = wrapRef.current; n; n = n.offsetParent as HTMLElement | null) top += n.offsetTop;
      return wrapRef.current ? top : null;
    });
  }, [reduceMotion]);
  const focusRef = useRef(-1);

  /* The card slides up over the red flags (which hold, see RedFlags),
     tilting in like Yui's menu cards (useTiltIn). `s` is the card's top in
     viewports above the frame's top: -1 as it enters at the bottom, 0 as
     it pins. */
  useEffect(() => {
    if (reduceMotion) return;
    return subscribeGlide(() => {
      const el = wrapRef.current;
      if (!el) return;
      const vh = window.innerHeight;
      const s = (glide.y - (el.getBoundingClientRect().top + glide.raw)) / vh;
      // Which row is in focus (its photo field opens), stepping as the card
      // settles and pins.
      const f = s < -0.35 ? -1 : Math.min(DEALS.length - 1, Math.floor((s + 0.35) / 0.2));
      if (f !== focusRef.current) {
        focusRef.current = f;
        setFocus(f);
      }
      // Only the numerals move: the card arrives with its words already
      // on it, and each numeral rises out of its slot as the card settles.
      let k = 0;
      DEALS.forEach((d, i) => {
        d.n.forEach(() => {
          const el = digitRefs.current[k];
          const a = -0.7 + i * 0.14 + (k - i) * 0.07;
          if (el) el.style.transform = `translateY(${((1 - smooth(a, a + 0.45, s)) * 104).toFixed(2)}%)`;
          k += 1;
        });
      });
    });
  }, [reduceMotion]);

  // Two takes for Rajat to pick (DealLayouts.tsx): ?deal=a (default) or ?deal=b.
  const variant = new URLSearchParams(location.search).get('deal') === 'b' ? 'b' : 'a';
  const digitRef = (k: number) => (el: HTMLDivElement | null) => {
    digitRefs.current[k] = el;
  };
  // Without the pin (phones, reduced motion) the numerals simply stand.
  useEffect(() => {
    if (reduceMotion) digitRefs.current.forEach((el) => el && (el.style.transform = 'none'));
  }, [reduceMotion, variant]);

  return (
    <section
      ref={wrapRef}
      aria-label="The deal"
      style={{
        position: 'relative',
        zIndex: 3,
        height: reduceMotion ? 'auto' : `${SECTION_VH}vh`,
        background: '#FFFFFF',
        color: INK,
        // Flat and full-bleed, no card (Rajat, 2026-10-17): it arrives only
        // through the block transition (BlockTransitions), which keeps it
        // clipped out of sight until the blocks have covered the frame.
      }}
    >
      <div
        style={{
          position: reduceMotion ? 'relative' : 'sticky',
          top: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: narrow ? '2rem' : 'clamp(2.5rem, 7vh, 5rem)',
          // Clear of the nav bar and the logo with real breathing room (Deeksha,
          // 2026-10-07: the headline sat right under the nav on a laptop).
          padding: narrow ? '6.5rem 1.25rem 3rem' : 'clamp(8.5rem, 16vh, 11rem) clamp(1rem, 4vw, 5rem) clamp(2.5rem, 6vh, 4rem)',
          maxWidth: 1400,
          margin: '0 auto',
          boxSizing: 'border-box',
        }}
      >
        {variant === 'b' ? (
          <DealB deals={DEALS} narrow={narrow} digitRef={digitRef} />
        ) : (
          <DealA deals={DEALS} narrow={narrow} digitRef={digitRef} focus={focus} />
        )}
      </div>
    </section>
  );
}
