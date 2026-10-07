import { useEffect, useRef, type ReactNode, type RefObject } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { glide, subscribeGlide } from '../scrollGlide';
import { CUSTOM_DIGITS } from '../studio/customDigits';
import { FillLink } from '../home/FillLink';

/* ─── About: the pieces both chapter layouts share ─────────────────────────
 * Everything here runs on the site's one glide (scrollGlide), like the home
 * and The Box scenes: progress is a pure function of the eased scroll
 * position, written straight to styles, no React re-renders per frame.
 * ────────────────────────────────────────────────────────────────────────── */

export const RED = '#EB3F43';
export const RED_SOFT = '#FF5A4A';
export const INK = '#0A0A0A';
export const SKY = '#FFFFFF'; // 2026-10-04: no beige anywhere (Rajat)
export const FLOOR = '#F3F3F3';
export const CARD = '#FFFFFF';
export const EASE = [0.22, 1, 0.36, 1] as const;

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const smooth = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export const label: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.24em',
  textTransform: 'uppercase',
};
export const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#EB3F43]';

/** Calls `onFrame(p, vw, vh)` on every glide frame with the pinned section's
 *  progress: 0 as it pins, 1 as it lets go. `sectionVh` is the wrapper's
 *  height in vh (the pinned viewport included). */
export function usePinned(ref: RefObject<HTMLElement | null>, sectionVh: number, onFrame: (p: number, vw: number, vh: number) => void, off = false) {
  const cb = useRef(onFrame);
  cb.current = onFrame;
  useEffect(() => {
    if (off) return;
    return subscribeGlide(() => {
      const el = ref.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top + glide.raw;
      const vh = window.innerHeight;
      const scrollable = (sectionVh / 100 - 1) * vh;
      if (scrollable <= 0) return;
      cb.current(clamp01((glide.y - top) / scrollable), window.innerWidth, vh);
    });
  }, [ref, sectionVh, off]);
}

/** One of Rajat's own numerals (studio/customDigits), solid. */
export function Digit({ n, height, fill }: { n: number; height: string; fill: string }) {
  const g = CUSTOM_DIGITS[n];
  return (
    <svg viewBox={`${g.x0} ${g.y0} ${g.w} ${g.h}`} style={{ height, width: 'auto', display: 'block', overflow: 'visible' }} fill={fill} aria-hidden>
      {g.paths.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}

function rng(seed: number) {
  let n = seed * 9301 + 49297;
  return () => ((n = (n * 9301 + 49297) % 233280) / 233280);
}
/** A panel's edge as the process print has it: a rectangle whose sides
 *  wander a little, in a 100 x `h` box. */
export function roughRect(seed: number, h: number, inset: number, j: number) {
  const r = rng(seed);
  const pts: Array<[number, number]> = [];
  const along = (a: [number, number], b: [number, number], n: number) => {
    for (let i = 0; i < n; i++) {
      const t = i / n;
      pts.push([a[0] + (b[0] - a[0]) * t + (r() - 0.5) * j, a[1] + (b[1] - a[1]) * t + (r() - 0.5) * j]);
    }
  };
  const x0 = inset, x1 = 100 - inset, y0 = inset, y1 = h - inset;
  along([x0, y0], [x1, y0], 5);
  along([x1, y0], [x1, y1], 7);
  along([x1, y1], [x0, y1], 5);
  along([x0, y1], [x0, y0], 7);
  return 'M' + pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L') + 'Z';
}

/** The red panel of the process print: a rough red sheet with a softer
 *  double pass behind it. Children sit on the red. */
export function RedPanel({ seed, aspect, children, style }: { seed: number; aspect: number; children?: ReactNode; style?: React.CSSProperties }) {
  const h = 100 * aspect;
  return (
    <div style={{ position: 'relative', aspectRatio: `1 / ${aspect}`, ...style }}>
      <svg viewBox={`0 0 100 ${h}`} preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }} aria-hidden>
        <path d={roughRect(seed + 20, h, 1, 2.6)} fill={RED_SOFT} opacity={0.5} />
        <path d={roughRect(seed, h, 2.5, 1.8)} fill={RED} />
      </svg>
      <div style={{ position: 'absolute', inset: 0 }}>{children}</div>
    </div>
  );
}

/* ── The copy (kept from the first About, 2026-09-30) ───────────────────── */
export const INTRO = '1Red is a creative collective from India. Strategists, designers, animators, developers and editors who take a brief on together, from the first napkin sketch to the last frame. We make brands the red one in a beige feed.';
export const WHO = {
  eyebrow: 'Who we are',
  line: 'New kids. Old‑school obsessive.', // non-breaking hyphen: never splits
  body: 'Strategists, designers, animators, developers and editors who would rather argue about one idea than politely ship three. Three brands built top to bottom so far, a pile of motion and socials besides, and a habit of doing the bit nobody asked for.',
};
export const WHAT = {
  eyebrow: 'What we do',
  line: 'Everything your brand says out loud.',
  list: [
    { title: 'Brand identity', line: 'The mark, the voice, the rules. Then the bit after the rules.' },
    { title: 'Websites & UI/UX', line: 'Says what you do in five seconds. Built, not just mocked up.' },
    { title: 'Ads, campaigns & motion', line: 'Made for the thumb, tested like it owes us money.' },
  ],
};
export const WHY = {
  eyebrow: 'Why we bother',
  line: 'Grey is expensive. It just hides the bill.',
  body: 'Every forgettable logo, polite website and copy‑paste ad costs a brand the one thing it paid for: being noticed. We would rather you were the red one. Cheaper in the long run, and frankly more fun.',
};

/* ── Hero: the Swiss row at the home poster's scale ─────────────────────── */
export function AboutHero({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <section style={{ padding: 'clamp(7rem, 15vh, 10rem) clamp(1rem, 4vw, 5rem) clamp(3rem, 8vh, 6rem)', maxWidth: 1400, margin: '0 auto', color: INK }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24 }}>
        <div className="overflow-hidden">
          <motion.h1
            initial={reduceMotion ? false : { y: '110%' }}
            animate={{ y: 0 }}
            transition={{ duration: 0.8, ease: EASE }}
            style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(56px, 9vw, 168px)', fontWeight: 500, letterSpacing: '-0.045em', lineHeight: 0.92, margin: 0 }}
          >
            Every skill.
            <br />
            One <span style={{ color: RED }}>box.</span>
          </motion.h1>
        </div>
        <div className="overflow-hidden" style={{ flexShrink: 0, paddingTop: '0.8em' }}>
          <motion.p initial={reduceMotion ? false : { y: '110%' }} animate={{ y: 0 }} transition={{ duration: 0.6, ease: EASE, delay: 0.1 }} style={{ ...label, margin: 0, textAlign: 'right', lineHeight: 1.6 }}>
            About
            <br />
            1Red
          </motion.p>
        </div>
      </div>
      <motion.div
        initial={reduceMotion ? false : { scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.9, delay: 0.2, ease: EASE }}
        style={{ height: 1, background: INK, transformOrigin: 'left center', margin: 'clamp(24px, 4vh, 40px) 0' }}
      />
      <motion.p
        initial={reduceMotion ? false : { opacity: 0, y: 20, filter: 'blur(6px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.8, delay: 0.35, ease: EASE }}
        style={{ margin: 0, maxWidth: 980, fontFamily: 'var(--font-sans)', fontSize: 'clamp(22px, 2.4vw, 38px)', fontWeight: 500, letterSpacing: '-0.03em', lineHeight: 1.15, opacity: 0.8 }}
      >
        {INTRO}
      </motion.p>
    </section>
  );
}

/* ── The close: one Swiss row, two doors (the table, the brief) ─────── */
export function AboutCTA() {
  return (
    <section style={{ maxWidth: 1400, margin: '0 auto', padding: 'clamp(2rem, 6vh, 4rem) clamp(1rem, 4vw, 5rem) clamp(5rem, 12vh, 8rem)', color: INK }}>
      <div style={{ borderTop: `1px solid ${INK}`, paddingTop: 'clamp(40px, 8vh, 88px)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 32, flexWrap: 'wrap' }}>
        <motion.p
          initial={{ opacity: 0, y: 24, filter: 'blur(6px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true, margin: '-10% 0px' }}
          transition={{ duration: 0.8, ease: EASE }}
          style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: 'clamp(40px, 6vw, 104px)', fontWeight: 500, letterSpacing: '-0.045em', lineHeight: 0.96 }}
        >
          Enough about us.
          <br />
          <span style={{ opacity: 0.4 }}>What are you making?</span>
        </motion.p>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <FillLink to="/contact" icon={<ArrowUpRight size={15} strokeWidth={2} />}>Start a project</FillLink>
          <FillLink to="/the-box" outline icon={<ArrowRight size={15} strokeWidth={2} />}>Meet the table</FillLink>
        </div>
      </div>
    </section>
  );
}
