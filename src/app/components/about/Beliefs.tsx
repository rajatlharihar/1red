import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RED, INK, EASE, label } from './shared';

/* ─── About: what we believe ───────────────────────────────────────────────
 * Replaces the drifting names strip. The home page's "Receipts." row as a
 * manifesto: big black headline, grey second line, one rule, then numbered
 * opinions as big rows with a small caps label on the right. Hover (or tap)
 * a row and its one-line reason opens under it; the title goes from pale
 * red to full red, the way Selected Work marks its active row.
 * ────────────────────────────────────────────────────────────────────────── */

const BELIEFS = [
  { title: 'Grey is a choice.', tag: 'On taste', why: 'Safe looks cheap the second everyone picks it. We pick on purpose.' },
  { title: 'One table beats three agencies.', tag: 'On process', why: 'Whoever names your brand sits next to whoever animates it. Nothing dies in a forwarded email.' },
  { title: 'The rulebook is the starting line.', tag: 'On craft', why: 'Best practice is why every ad looks the same. We follow it, then do the bit after.' },
  { title: 'Pretty is the minimum.', tag: 'On design', why: 'Clear is the actual job. Gorgeous and confusing is just expensive wallpaper.' },
  { title: 'Small is a feature.', tag: 'On size', why: 'You talk to the people making the thing. Replies inside a day, no account manager relay race.' },
  { title: 'Receipts over adjectives.', tag: 'On proof', why: 'Three brands built start to finish so far. We would rather show you those than call ourselves award-winning.' },
];

export function Beliefs() {
  const [active, setActive] = useState<number | null>(null);
  return (
    <section style={{ maxWidth: 1400, margin: '0 auto', padding: 'clamp(5rem, 14vh, 9rem) clamp(1rem, 4vw, 5rem) clamp(2rem, 6vh, 4rem)', color: INK, background: '#fff' }}>
      <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(40px, 6vw, 104px)', fontWeight: 500, letterSpacing: '-0.045em', lineHeight: 0.96, margin: 0 }}>
        What we believe.
        <br />
        <span style={{ opacity: 0.4 }}>Mostly unpopular in meetings.</span>
      </h2>
      <div style={{ height: 1, background: INK, margin: 'clamp(24px, 4vh, 40px) 0 clamp(8px, 2vh, 20px)' }} />
      <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {BELIEFS.map((b, i) => {
          const on = active === i;
          return (
            <li key={i} style={{ borderBottom: '1px solid rgba(10,10,10,0.1)' }}>
              <button
                type="button"
                aria-expanded={on}
                onMouseEnter={() => window.matchMedia('(hover: hover)').matches && setActive(i)}
                onMouseLeave={() => window.matchMedia('(hover: hover)').matches && setActive(null)}
                onClick={() => setActive(on ? null : i)}
                style={{ all: 'unset', boxSizing: 'border-box', width: '100%', cursor: 'pointer', display: 'block', padding: 'clamp(14px, 2.4vh, 26px) 0' }}
              >
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 'clamp(12px, 1.6vw, 24px)' }}>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(12px, 1vw, 16px)', fontWeight: 600, opacity: 0.45, minWidth: '2.2em' }}>{String(i + 1).padStart(2, '0')}.</span>
                  <span
                    style={{
                      flex: 1,
                      fontFamily: 'var(--font-sans)',
                      fontSize: 'clamp(26px, 4.2vw, 72px)',
                      fontWeight: 700,
                      letterSpacing: '-0.04em',
                      lineHeight: 1,
                      color: on ? RED : 'rgba(235,63,67,0.32)',
                      transition: 'color 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
                    }}
                  >
                    {b.title}
                  </span>
                  <span className="hidden sm:inline" style={{ ...label, opacity: on ? 1 : 0.5, whiteSpace: 'nowrap', transition: 'opacity 0.3s' }}>
                    {b.tag}
                  </span>
                </div>
                <AnimatePresence initial={false}>
                  {on && (
                    <motion.p
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.45, ease: EASE }}
                      style={{ overflow: 'hidden', margin: 0, paddingLeft: 'calc(2.2em + clamp(12px, 1.6vw, 24px))', fontFamily: 'var(--font-sans)', fontSize: 'clamp(15px, 1.4vw, 22px)', lineHeight: 1.45, maxWidth: 820 }}
                    >
                      <span style={{ display: 'block', paddingTop: 'clamp(8px, 1.4vh, 14px)' }}>{b.why}</span>
                    </motion.p>
                  )}
                </AnimatePresence>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
