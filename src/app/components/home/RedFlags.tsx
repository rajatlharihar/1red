import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { FillLink } from './FillLink';
import { Digit, RED, INK, EASE, label, focusRing } from '../about/shared';
import { BoxFace, type Mood } from './BoxFace';
import { grainTile } from './Grain';
import { useTiltIn } from './useTiltIn';

/* ─── RED FLAGS ───────────────────────────────────────────────────────────
 * With almost no famous work to show, we prove we understand the visitor's
 * problems instead. Six red panels, each a red flag every growing brand
 * recognises, each with a little box who has clearly seen it happen.
 * Hover (or tap) turns a panel over: what the rulebook says (struck out,
 * because everyone does that) and what we do past it. The panels share the
 * rough, wandering edge of the site's other red panels. A tally counts the
 * flags the visitor admits to; at three it offers the brief, sarcastically.
 *
 * 2026-10-06 (Rajat): the section arrives as a card sliding up over the cube
 * section, and borrows /studio's "Our process" look without its pins and
 * thread: black grainy board, paper cards a little turned with deep shadows,
 * red hand-written notes. The panel's back, our fix, is the red.
 * ────────────────────────────────────────────────────────────────────────── */

const PAPER = '#FBFBFB';
const BOARD = '#0E0E0E';
/** The scribble in the margin of each flag, in the hand. */
const NOTES = ['ouch.', 'yawn.', 'seen it.', 'who?', 'oof.', 'every week.'];
/** Each card sits a little turned on the board, like the process exhibits. */
const TILT = [-1.6, 1.2, -0.8, 1.5, -1.2, 0.9];
const grainLayer = (o: number, blend: React.CSSProperties['mixBlendMode'] = 'multiply'): React.CSSProperties => ({
  position: 'absolute',
  inset: 0,
  backgroundImage: `url(${grainTile()})`,
  backgroundSize: '192px 192px',
  mixBlendMode: blend,
  opacity: o,
  pointerEvents: 'none',
});

const FLAGS: Array<{ flag: string; rule: string; us: string; who: string; mood: Mood }> = [
  { flag: 'Your logo only works on a white background.', rule: 'Make a dark mode version.', us: 'Make a logo that works on a tiny app icon, a crumpled tote and a cricket jersey.', who: 'Brand identity', mood: 'nervous' },
  { flag: 'Your website opens with \u201cwelcome to our website\u201d.', rule: 'Fix your hero section.', us: 'Make every scroll worth it. Gain attention, then keep it.', who: 'Websites & UI/UX', mood: 'tired' },
  { flag: 'Your ads look like every other TV ad.', rule: 'Follow the best practices.', us: 'The best practices are why they all look the same. We make the weird ones land.', who: 'Ads & campaigns', mood: 'confused' },
  { flag: 'Three agencies. Three fonts. One team would\u2019ve done it better.', rule: 'Write brand guidelines.', us: 'Guidelines aren\u2019t what keep a brand consistent. The team behind it does.', who: 'The whole box', mood: 'wtf' },
  { flag: 'Your social media gets nine views. Four of them are from your mom.', rule: 'Post more consistently.', us: 'More of the same is just the same old grey. We give you something worth the watch.', who: 'Motion & video', mood: 'crying' },
  { flag: '\u201cMake the logo bigger.\u201d Translation: we have no brand strategy.', rule: 'Make the logo bigger.', us: 'Make the idea itself bigger. The logo can stay where it is.', who: 'Strategy', mood: 'irritated' },
];

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
      initial={reduceMotion ? { rotate: TILT[i] } : { opacity: 0, y: 40, rotate: TILT[i] * 3 }}
      whileInView={{ opacity: 1, y: 0, rotate: TILT[i] }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.8, ease: EASE, delay: (i % 3) * 0.08 }}
      style={{ position: 'relative', aspectRatio: '6 / 5', perspective: 1200, background: 'none', border: 0, padding: 0, cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-sans)' }}
    >
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={reduceMotion ? { duration: 0 } : { type: 'spring', bounce: 0, duration: 0.7 }}
        style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d' }}
      >
        <div style={{ ...face, background: PAPER, boxShadow: '0 18px 40px rgba(0,0,0,0.55)' }}>
          <div style={grainLayer(0.06)} />
          <div style={{ ...inner, color: INK }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <Digit n={i + 1} height="clamp(34px, 4vw, 56px)" fill={INK} />
                <span style={{ ...label, fontSize: 'clamp(11px, 0.85vw, 13px)', opacity: 0.8, display: 'block', marginTop: 10 }}>Red flag</span>
              </div>
              <BoxFace mood={f.mood} variant="white" size={faceSize} delay={i} reduceMotion={reduceMotion} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-hand)', fontSize: 'clamp(24px, 2.2vw, 34px)', fontWeight: 700, color: RED, transform: 'rotate(-3deg)', transformOrigin: 'left', marginBottom: 6 }}>{NOTES[i]}</div>
              <p style={{ margin: 0, fontSize: 'clamp(20px, 1.9vw, 30px)', fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.08 }}>{f.flag}</p>
            </div>
          </div>
        </div>
        <div style={{ ...face, transform: 'rotateY(180deg)', background: RED, boxShadow: '0 18px 40px rgba(0,0,0,0.55)' }}>
          <div style={grainLayer(0.12)} />
          <div style={{ ...inner, color: '#FFFFFF' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div>
                <span style={{ ...label, fontSize: 'clamp(11px, 0.85vw, 13px)', opacity: 0.85 }}>The rulebook says</span>
                <p style={{ margin: '6px 0 0', fontSize: 'clamp(15px, 1.15vw, 18px)', opacity: 0.85, textDecoration: 'line-through', textDecorationColor: INK, textDecorationThickness: 2 }}>{f.rule}</p>
              </div>
              <BoxFace mood="triumph" variant="white" size={faceSize} delay={i + 3} reduceMotion={reduceMotion} />
            </div>
            <div>
              <span style={{ fontFamily: 'var(--font-hand)', fontSize: 'clamp(24px, 2.2vw, 34px)', fontWeight: 700, color: INK, display: 'inline-block', transform: 'rotate(-3deg)' }}>we say:</span>
              <p style={{ margin: '6px 0 12px', fontSize: 'clamp(17px, 1.5vw, 23px)', fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1.15 }}>{f.us}</p>
              {/* 2026-10-07 (Rajat): the service names read clearly now, no square. */}
              <span style={{ ...label, fontSize: 'clamp(13px, 1.05vw, 16px)', fontWeight: 600 }}>{f.who}</span>
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
  /* Holds once its bottom reaches the frame's bottom, so the next card (The
     Deal) slides up over it: sticky with a negative top of its own height
     less the frame. */
  const sectionRef = useRef<HTMLElement>(null);
  useTiltIn(sectionRef, reduceMotion);
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || reduceMotion) return;
    const fit = () => (el.style.top = `${Math.min(0, window.innerHeight - el.offsetHeight)}px`);
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    window.addEventListener('resize', fit);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', fit);
    };
  }, [reduceMotion]);
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
          : 'All six. We definitely need to talk.';

  return (
    <section
      ref={sectionRef}
      aria-label="Red flags we fix"
      style={{
        position: reduceMotion ? 'relative' : 'sticky',
        zIndex: 2,
        // Slides up over the cube section's last pinned frame, like a card.
        marginTop: reduceMotion ? 0 : '-100vh',
        background: BOARD,
        color: '#FFFFFF',
        borderRadius: '6px 6px 0 0', // 2026-10-06: Rajat, sharper corners
        boxShadow: '0 -30px 80px rgba(0,0,0,0.28)',
        overflow: 'hidden',
        padding: 'clamp(5rem, 14vh, 10rem) clamp(1rem, 4vw, 5rem)',
      }}
    >
      <div style={grainLayer(0.5, 'overlay')} />
      <div style={{ maxWidth: 1400, margin: '0 auto', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24, flexWrap: 'wrap', marginBottom: 'clamp(2rem, 6vh, 4rem)' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(40px, 6.4vw, 112px)', fontWeight: 500, letterSpacing: '-0.045em', lineHeight: 0.92, margin: 0 }}>
              <span style={{ color: '#9A9A9A' }}>Grey areas</span>
              <br />
              we <span style={{ color: RED }}>love</span> to fix.
            </h2>
            <div style={{ fontFamily: 'var(--font-hand)', fontSize: 'clamp(30px, 3vw, 52px)', fontWeight: 700, color: RED, marginTop: 18, transform: 'rotate(-4deg)', transformOrigin: 'left' }}>turn one over &rarr;</div>
          </div>
          <div style={{ maxWidth: 360 }}>
            <p style={{ margin: 0, fontSize: 'clamp(14px, 1.1vw, 17px)', lineHeight: 1.6, opacity: 0.7 }}>
              Everyone can follow a rulebook. We read it, then go above and beyond. Turn a panel over to see what we bring to the table.
            </p>
            <p aria-live="polite" style={{ ...label, marginTop: 18, color: count >= 3 ? RED : '#FFFFFF', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ display: 'inline-flex', gap: 3 }}>
                {FLAGS.map((_, i) => (
                  <span key={i} style={{ width: 8, height: 8, background: i < count ? RED : 'rgba(255,255,255,0.18)', transition: 'background 0.3s' }} />
                ))}
              </span>
              {verdict}
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))', gap: 'clamp(18px, 2.2vw, 34px)' }}>
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
          animate={{ height: 'auto', opacity: 1 }}
          transition={{ type: 'spring', bounce: 0, duration: 0.6 }}
          style={{ overflow: 'hidden' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, flexWrap: 'wrap', marginTop: 'clamp(2rem, 5vh, 3rem)' }}>
            <p style={{ margin: 0, fontSize: 'clamp(22px, 2.4vw, 38px)', fontWeight: 500, letterSpacing: '-0.03em' }}>
              Tell us what you need. We&rsquo;ll handle the rest.
            </p>
            <FillLink to="/contact" icon={<ArrowUpRight size={15} strokeWidth={2} />}>Let&rsquo;s talk</FillLink>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
