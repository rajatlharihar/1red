import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { Digit, RED, INK, label, usePinned, smooth } from '../about/shared';
import { FillLink } from './FillLink';

/* ─── THE DEAL — being new, said out loud ──────────────────────────────────
 * The big networks lead with heritage, office counts and award walls. We
 * can't, so we turn the gap into the pitch (the Avis move: "we're No. 2,
 * so we try harder"). Four numbers set in Rajat's own numerals, each a
 * plain promise rather than a made-up stat. The numerals sit on red
 * panels that slide up from behind the rule as one shared eased curve
 * while the section is pinned; nothing fades in, it rises from its mask.
 * ────────────────────────────────────────────────────────────────────────── */

const SECTION_VH = 220;

const DEALS = [
  { n: [0], unit: 'years of bad habits', body: 'We’re new. Nothing here runs on autopilot, and nobody has said “we’ve always done it this way”. Yet.' },
  { n: [1], unit: 'table', body: 'Strategy, design, motion, code and edit sit together. You get a chair too. Bring snacks.' },
  { n: [2, 4], unit: 'hours to reply, max', body: 'Our client list is short. So is our inbox. You talk to the people making the thing.' },
];

export function TheDeal() {
  const reduce = !!useReducedMotion();
  // Four stacked panels outgrow a phone's frame, so the pin is wide-only.
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const apply = () => setNarrow(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);
  const reduceMotion = reduce || narrow;
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRefs = useRef<Array<HTMLDivElement | null>>([]);
  const headRef = useRef<HTMLHeadingElement>(null);

  usePinned(
    wrapRef,
    SECTION_VH,
    (p) => {
      if (headRef.current) headRef.current.style.transform = `translateY(${((1 - smooth(0, 0.1, p)) * 110).toFixed(2)}%)`;
      panelRefs.current.forEach((el, i) => {
        if (!el) return;
        const t = smooth(0.04 + i * 0.12, 0.4 + i * 0.12, p);
        el.style.transform = `translateY(${((1 - t) * 104).toFixed(2)}%)`;
      });
    },
    reduceMotion,
  );

  return (
    <section ref={wrapRef} aria-label="The deal" style={{ height: reduceMotion ? 'auto' : `${SECTION_VH}vh`, background: '#FFFFFF', color: INK }}>
      <div
        style={{
          position: reduceMotion ? 'relative' : 'sticky',
          top: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 'clamp(5rem, 11vh, 8rem) clamp(1rem, 4vw, 5rem) clamp(2rem, 6vh, 4rem)',
          maxWidth: 1400,
          margin: '0 auto',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24, flexWrap: 'wrap' }}>
          <div className="overflow-hidden">
            <h2
              ref={headRef}
              style={{ transform: reduceMotion ? 'none' : 'translateY(110%)', fontFamily: 'var(--font-sans)', fontSize: 'clamp(34px, 5vw, 88px)', fontWeight: 500, letterSpacing: '-0.035em', lineHeight: 1, margin: 0 }}
            >
              No 75-year legacy.
              <br />
              <span style={{ opacity: 0.4 }}>No 75-step approval chain.</span>
            </h2>
          </div>
        </div>
        <div style={{ height: 1, background: INK, margin: 'clamp(1.25rem, 3vh, 2rem) 0 0' }} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: 'clamp(20px, 2.6vw, 40px)' }}>
          {DEALS.map((d, i) => (
            <div key={i} style={{ overflow: 'hidden', paddingTop: 'clamp(12px, 2vh, 20px)' }}>
              <div
                ref={(el) => {
                  panelRefs.current[i] = el;
                }}
                style={{ transform: reduceMotion ? 'none' : 'translateY(104%)', willChange: 'transform' }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'clamp(10px, 1.2vw, 18px)', height: 'clamp(120px, 21vh, 220px)' }}>
                  {d.n.map((n, k) => (
                    <Digit key={k} n={n} height="clamp(110px, 20vh, 210px)" fill={RED} />
                  ))}
                </div>
                <p style={{ ...label, fontSize: 12, margin: '22px 0 10px' }}>{d.unit}</p>
                <p style={{ margin: 0, fontSize: 'clamp(16px, 1.3vw, 21px)', lineHeight: 1.5, opacity: 0.7, maxWidth: 340 }}>{d.body}</p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginTop: 'clamp(1.5rem, 5vh, 3rem)' }}>
          <p style={{ margin: 0, fontSize: 'clamp(18px, 1.7vw, 26px)', fontStyle: 'italic', fontWeight: 300 }}>Everyone starts somewhere. We started at the deep end, on purpose.</p>
          <FillLink to="/about" outline icon={<ArrowUpRight size={15} strokeWidth={2} />}>Meet the box</FillLink>
        </div>
      </div>
    </section>
  );
}
