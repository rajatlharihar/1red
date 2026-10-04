import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { FillLink } from './FillLink';
import { Digit, RED, RED_SOFT, INK, EASE, label, focusRing, roughRect } from '../about/shared';
import { BoxFace, type Mood } from './BoxFace';

/* ─── RED FLAGS ───────────────────────────────────────────────────────────
 * With almost no famous work to show, we prove we understand the visitor's
 * problems instead. Six red panels, each a red flag every growing brand
 * recognises, each with a little box who has clearly seen it happen.
 * Hover (or tap) turns a panel over: what the rulebook says (struck out,
 * because everyone does that) and what we do past it. The panels share the
 * rough, wandering edge of the site's other red panels. A tally counts the
 * flags the visitor admits to; at three it offers the brief, sarcastically.
 * ────────────────────────────────────────────────────────────────────────── */

const FLAGS: Array<{ flag: string; rule: string; us: string; who: string; mood: Mood }> = [
  { flag: 'Your logo only works on a white background.', rule: 'Make a dark-mode version.', us: 'Build a mark that survives a 40px app icon, a crumpled tote and a cricket jersey. Dark mode is the easy bit.', who: 'Brand identity', mood: 'nervous' },
  { flag: 'Your homepage opens with \u201cWelcome to our website\u201d.', rule: 'Write a better headline.', us: 'Make the homepage do the selling: what you do in five seconds, why you in fifty.', who: 'Websites & UI/UX', mood: 'tired' },
  { flag: 'Your ads look like everyone else\u2019s ads.', rule: 'Follow platform best practices.', us: 'Best practices are why they all look the same. We test the weird one too.', who: 'Ads & campaigns', mood: 'confused' },
  { flag: 'Three agencies. Three fonts. One very confused customer.', rule: 'Write brand guidelines.', us: 'Guidelines nobody reads won\u2019t save you. One table that makes all of it will.', who: 'The whole box', mood: 'wtf' },
  { flag: 'Your reels have nine views. Four of them are your mum.', rule: 'Post more consistently.', us: 'More of the same is just louder beige. Hook in the first second, made for the thumb.', who: 'Motion & video', mood: 'crying' },
  { flag: 'Someone said \u201cmake the logo bigger\u201d this week.', rule: 'Make the logo bigger.', us: 'We make the idea bigger. The logo can stay where it is.', who: 'Strategy', mood: 'irritated' },
];

/** Panel geometry: 6 wide by 5 tall, in the 100-wide space roughRect draws in. */
const PANEL_H = (100 * 5) / 6;

/** A rough sheet: red with its soft double pass, or (no `soft`) white with a
 *  thin ink edge, the drawn outline of the same wandering rectangle. */
function RoughSheet({ seed, fill, soft }: { seed: number; fill: string; soft?: string }) {
  return (
    <svg viewBox={`0 0 100 ${PANEL_H}`} preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }} aria-hidden>
      {soft && <path d={roughRect(seed + 20, PANEL_H, 0.6, 1.6)} fill={soft} opacity={0.55} />}
      <path
        d={roughRect(seed, PANEL_H, 1.5, 1.1)}
        fill={fill}
        stroke={soft ? 'none' : 'rgba(10,10,10,0.45)'}
        strokeWidth={1.2}
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Panel({ i, flipped, onFlip, onHover, reduceMotion }: { i: number; flipped: boolean; onFlip: () => void; onHover: (on: boolean) => void; reduceMotion: boolean }) {
  const f = FLAGS[i];
  const face: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
  };
  const inner: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    padding: 'clamp(18px, 2vw, 30px)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  };
  const faceSize = 'clamp(84px, 9vw, 140px)';
  return (
    <motion.button
      type="button"
      onClick={onFlip}
      onHoverStart={() => window.matchMedia('(hover: hover)').matches && onHover(true)}
      onHoverEnd={() => window.matchMedia('(hover: hover)').matches && onHover(false)}
      aria-pressed={flipped}
      aria-label={`${f.flag} ${flipped ? 'The rulebook says: ' + f.rule + ' We say: ' + f.us : 'Turn over for the fix'}`}
      className={focusRing}
      initial={reduceMotion ? false : { opacity: 0, y: 40, rotate: (i % 2 ? 1 : -1) * 2 }}
      whileInView={{ opacity: 1, y: 0, rotate: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.8, ease: EASE, delay: (i % 3) * 0.08 }}
      style={{ position: 'relative', aspectRatio: '6 / 5', perspective: 1200, background: 'none', border: 0, padding: 0, cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-sans)' }}
    >
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={reduceMotion ? { duration: 0 } : { type: 'spring', bounce: 0, duration: 0.7 }}
        style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d' }}
      >
        <div style={face}>
          <RoughSheet seed={11 + i * 7} fill={RED} soft={RED_SOFT} />
          <div style={{ ...inner, color: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <Digit n={i + 1} height="clamp(34px, 4vw, 56px)" fill="#fff" />
                <span style={{ ...label, fontSize: 9, opacity: 0.85, display: 'block', marginTop: 10 }}>Red flag</span>
              </div>
              <BoxFace mood={f.mood} variant="white" size={faceSize} delay={i} reduceMotion={reduceMotion} />
            </div>
            <p style={{ margin: 0, fontSize: 'clamp(20px, 1.9vw, 30px)', fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.08 }}>{f.flag}</p>
          </div>
        </div>
        <div style={{ ...face, transform: 'rotateY(180deg)' }}>
          <RoughSheet seed={53 + i * 5} fill="#FFFFFF" />
          <div style={{ ...inner, color: INK }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div>
                <span style={{ ...label, fontSize: 9, opacity: 0.5 }}>The rulebook says</span>
                <p style={{ margin: '6px 0 0', fontSize: 'clamp(13px, 1vw, 15px)', opacity: 0.5, textDecoration: 'line-through', textDecorationColor: RED, textDecorationThickness: 2 }}>{f.rule}</p>
              </div>
              <BoxFace mood="triumph" variant="red" size={faceSize} delay={i + 3} reduceMotion={reduceMotion} />
            </div>
            <div>
              <span style={{ ...label, fontSize: 9, color: RED }}>We say</span>
              <p style={{ margin: '6px 0 12px', fontSize: 'clamp(17px, 1.5vw, 23px)', fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1.15 }}>{f.us}</p>
              <span style={{ ...label, fontSize: 9, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 6, height: 6, background: RED, display: 'inline-block' }} />
                {f.who}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.button>
  );
}

export function RedFlags() {
  const reduceMotion = !!useReducedMotion();
  // `open`: which panels show their fix now. `seen`: which ever have; the tally counts those.
  const [open, setOpen] = useState<boolean[]>(() => FLAGS.map(() => false));
  const [seen, setSeen] = useState<boolean[]>(() => FLAGS.map(() => false));
  const count = seen.filter(Boolean).length;
  const set = (i: number, v: boolean) => {
    setOpen((a) => a.map((x, j) => (j === i ? v : x)));
    if (v) setSeen((a) => a.map((x, j) => (j === i ? true : x)));
  };
  const verdict =
    count === 0
      ? 'Be honest. Hover the ones that hurt.'
      : count < 3
        ? `${count} spotted. Could be a phase.`
        : count < 6
          ? `${count} spotted. Okay, we should talk.`
          : 'All six. Bestie, we need to talk.';

  return (
    <section aria-label="Red flags we fix" style={{ background: '#FFFFFF', color: INK, padding: 'clamp(5rem, 14vh, 10rem) clamp(1rem, 4vw, 5rem)' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24, flexWrap: 'wrap', marginBottom: 'clamp(2rem, 6vh, 4rem)' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(40px, 6.4vw, 112px)', fontWeight: 500, letterSpacing: '-0.045em', lineHeight: 0.92, margin: 0 }}>
              Red flags
              <br />
              we <span style={{ color: RED }}>love</span> to fix.
            </h2>
          </div>
          <div style={{ maxWidth: 360 }}>
            <p style={{ margin: 0, fontSize: 'clamp(14px, 1.1vw, 17px)', lineHeight: 1.6, opacity: 0.6 }}>
              Anyone can follow the rulebook. We read it, then do the bit after. Turn a panel over to see the difference.
            </p>
            <p aria-live="polite" style={{ ...label, marginTop: 18, color: count >= 3 ? RED : INK, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ display: 'inline-flex', gap: 3 }}>
                {FLAGS.map((_, i) => (
                  <span key={i} style={{ width: 8, height: 8, background: i < count ? RED : 'rgba(10,10,10,0.12)', transition: 'background 0.3s' }} />
                ))}
              </span>
              {verdict}
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))', gap: 'clamp(12px, 1.4vw, 20px)' }}>
          {FLAGS.map((_, i) => (
            <Panel
              key={i}
              i={i}
              flipped={open[i]}
              reduceMotion={reduceMotion}
              onHover={(on) => set(i, on)}
              onFlip={() => !window.matchMedia('(hover: hover)').matches && set(i, !open[i])}
            />
          ))}
        </div>

        <motion.div
          initial={false}
          animate={{ height: count >= 3 ? 'auto' : 0, opacity: count >= 3 ? 1 : 0 }}
          transition={{ type: 'spring', bounce: 0, duration: 0.6 }}
          style={{ overflow: 'hidden' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, flexWrap: 'wrap', marginTop: 'clamp(2rem, 5vh, 3rem)', paddingTop: 24, borderTop: `1px solid ${INK}` }}>
            <p style={{ margin: 0, fontSize: 'clamp(22px, 2.4vw, 38px)', fontWeight: 500, letterSpacing: '-0.03em' }}>
              Three or more? Bold strategy. Let&rsquo;s see how it plays out.
            </p>
            <FillLink to="/contact" icon={<ArrowUpRight size={15} strokeWidth={2} />}>Or, you know, call us</FillLink>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
