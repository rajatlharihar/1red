import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { Digit, RED, INK, smooth } from '../about/shared';
import { glide, subscribeGlide } from '../scrollGlide';
import { FillLink } from './FillLink';
import { useTiltIn } from './useTiltIn';

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
  { n: [0], unit: 'years of bad habits', body: 'We’re new. Nothing here runs on autopilot, and nobody has said “we’ve always done it this way”. Yet.' },
  { n: [1], unit: 'table', body: 'Strategy, design, motion, code and edit sit together. You get a chair too. Bring snacks.' },
  { n: [2, 4], unit: 'hours to reply, max', body: 'Our client list is short. So is our inbox. You talk to the people making the thing.' },
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
  // The tilt plays on phones too; only the pin is wide-only.
  useTiltIn(wrapRef, reduce);
  const digitRefs = useRef<Array<HTMLDivElement | null>>([]);

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

  const rise = (from: string): React.CSSProperties => ({ display: 'block', transform: reduceMotion ? 'none' : from, willChange: 'transform' });
  let digitIndex = 0;

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
        // The next card in the stack: slides over the red flags.
        borderRadius: '6px 6px 0 0',
        boxShadow: '0 -30px 80px rgba(0,0,0,0.35)',
        // The shadow falls on the card below only, never on the next section.
        clipPath: 'inset(-160px -160px 0 -160px)',
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
          padding: narrow ? '4.5rem 1.25rem 3rem' : 'clamp(5rem, 11vh, 8rem) clamp(1rem, 4vw, 5rem) clamp(2.5rem, 6vh, 4rem)',
          maxWidth: 1400,
          margin: '0 auto',
          boxSizing: 'border-box',
        }}
      >
        <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: narrow ? '34px' : 'clamp(38px, 6vw, 104px)', fontWeight: 500, letterSpacing: '-0.045em', lineHeight: 0.95, margin: 0 }}>
          <span style={{ display: 'block' }}>No 75-year legacy.</span>
          <span style={{ display: 'block', color: 'rgba(10,10,10,0.35)' }}>No 75-step approval chain.</span>
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', columnGap: 'clamp(24px, 4vw, 72px)', rowGap: narrow ? 36 : 48 }}>
          {DEALS.map((d, i) => (
            <div key={i}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'clamp(8px, 1vw, 14px)', height: narrow ? 96 : 'clamp(130px, 24vh, 250px)' }}>
                {d.n.map((n) => {
                  const k = digitIndex++;
                  return (
                    <div key={k} style={{ overflow: 'hidden' }}>
                      <div ref={(el) => { digitRefs.current[k] = el; }} style={rise('translateY(104%)')}>
                        <Digit n={n} height={narrow ? '96px' : 'clamp(130px, 24vh, 250px)'} fill={RED} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div>
                <p style={{ fontFamily: 'var(--font-hand)', fontSize: narrow ? 24 : 'clamp(26px, 2.2vw, 36px)', fontWeight: 700, color: RED, margin: narrow ? '12px 0 4px' : '18px 0 6px', transform: 'rotate(-2deg)', transformOrigin: 'left' }}>{d.unit}</p>
                <p style={{ margin: 0, fontSize: narrow ? 16 : 'clamp(17px, 1.35vw, 22px)', lineHeight: 1.45, opacity: 0.72, maxWidth: 360 }}>{d.body}</p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <p style={{ margin: 0, fontFamily: 'var(--font-hand)', fontSize: narrow ? 26 : 'clamp(28px, 2.6vw, 44px)', fontWeight: 700, color: INK, transform: 'rotate(-1.5deg)', transformOrigin: 'left' }}>Everyone starts somewhere. We started at the deep end, on purpose.</p>
          <FillLink to="/about" outline icon={<ArrowUpRight size={15} strokeWidth={2} />}>Meet the box</FillLink>
        </div>
      </div>
    </section>
  );
}
