import { useEffect, useRef, type ReactNode, type RefObject } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { glide, subscribeGlide } from '../scrollGlide';
import { CUSTOM_DIGITS } from '../studio/customDigits';
import projectsData from '../../data/projects.json';

/* ─── About: the pieces both chapter layouts share ─────────────────────────
 * Everything here runs on the site's one glide (scrollGlide), like the home
 * and The Box scenes: progress is a pure function of the eased scroll
 * position, written straight to styles, no React re-renders per frame.
 * ────────────────────────────────────────────────────────────────────────── */

export const RED = '#EA3323';
export const RED_SOFT = '#FF5A4A';
export const INK = '#0A0A0A';
export const SKY = '#F2EFE8';
export const FLOOR = '#E9E6DE';
export const CARD = '#F4F1EB';
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
export const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#EA3323]';

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
export const INTRO = '1Red is a creative collective. Strategists, designers, animators, developers and editors who take a brief on together, from the first idea to the last frame.';
export const WHO = {
  eyebrow: 'Who we are',
  line: 'Not a chain of hand‑offs.', // non-breaking hyphen: never splits
  body: 'The person who names your brand sits next to the one who animates it and the one who builds your site, so nothing gets lost between them. Small enough to talk to. Wide enough to do all of it.',
};
export const WHAT = { eyebrow: 'What we do', line: 'Every skill, one box.' };
export const WHY = {
  eyebrow: 'Why we do it',
  line: 'The best ideas need every skill in the room from day one.',
  body: 'A mark, a site and a campaign should feel like one voice. With us, they do.',
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

/* ── On the table lately: a strip of names that the scroll carries ──────
 * Two copies of the row, moved sideways by the glide as the section
 * crosses the frame, so the names drift one way while the page goes the
 * other. Solid and outlined alternate; a red square between them. */
type Project = (typeof projectsData)[0] & { hidden?: boolean; page?: boolean };
const BRANDS = (projectsData as Project[]).filter((p) => !p.hidden);

export function BrandsStrip({ reduceMotion }: { reduceMotion: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (reduceMotion) return;
    return subscribeGlide(() => {
      const el = ref.current;
      const track = trackRef.current;
      if (!el || !track) return;
      const r = el.getBoundingClientRect();
      // Screen position from the glide, not the raw scroll, so it eases.
      const top = r.top + glide.raw - glide.y;
      const t = (window.innerHeight - top) / (window.innerHeight + r.height);
      track.style.transform = `translate3d(${(-clamp01(t) * 50).toFixed(3)}%, 0, 0)`;
    });
  }, [reduceMotion]);
  const row = (copy: number) =>
    BRANDS.map((b, i) => {
      const outline = (i + copy) % 2 === 1;
      const name = (
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'clamp(72px, 11vw, 200px)',
            fontWeight: 800,
            letterSpacing: '-0.05em',
            lineHeight: 1,
            color: outline ? 'transparent' : INK,
            WebkitTextStroke: outline ? `2px ${INK}` : undefined,
            whiteSpace: 'nowrap',
          }}
        >
          {b.title}
        </span>
      );
      return (
        <span key={`${copy}-${b.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 'clamp(24px, 3vw, 56px)', paddingRight: 'clamp(24px, 3vw, 56px)' }}>
          {b.page ? (
            <Link to={`/case-studies/${b.id}`} className={focusRing} tabIndex={copy ? -1 : 0} style={{ textDecoration: 'none' }}>
              {name}
            </Link>
          ) : (
            name
          )}
          <span style={{ width: 'clamp(14px, 1.4vw, 24px)', height: 'clamp(14px, 1.4vw, 24px)', background: RED, flexShrink: 0 }} />
        </span>
      );
    });
  return (
    <section ref={ref} style={{ padding: 'clamp(3rem, 10vh, 7rem) 0', overflow: 'hidden', background: '#fff' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto clamp(20px, 4vh, 40px)', padding: '0 clamp(1rem, 4vw, 5rem)', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ ...label, display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 6, height: 6, background: RED, display: 'inline-block' }} />
          On the table lately
        </span>
        <Link to="/case-studies" className={focusRing} style={{ ...label, display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: INK }}>
          Case studies <ArrowRight size={13} strokeWidth={2} color={RED} />
        </Link>
      </div>
      <div ref={trackRef} style={{ display: 'flex', width: 'max-content', willChange: 'transform' }}>
        {row(0)}
        {row(1)}
      </div>
    </section>
  );
}

/* ── The people: the team card rising onto the table ─────────────────────
 * As on The Box's table: a cream playing card with the red index in its
 * corners, rising from below lying back, settling flat on one ease-out.
 * The picture on it is the team, drawn. */
const PEOPLE_VH = 200;
export function PeopleCard({ reduceMotion }: { reduceMotion: boolean }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const capRef = useRef<HTMLDivElement>(null);
  usePinned(
    wrapRef,
    PEOPLE_VH,
    (p, _vw, vh) => {
      const t = easeOutCubic(clamp01(p / 0.55));
      const u = 1 - t;
      if (cardRef.current) cardRef.current.style.transform = `translate(-50%, -50%) translate3d(0, ${(1.05 * u * vh).toFixed(1)}px, 0) rotateX(${(-14 * u).toFixed(2)}deg)`;
      if (capRef.current) {
        const c = smooth(0.45, 0.7, p);
        capRef.current.style.opacity = c.toFixed(3);
        capRef.current.style.transform = `translateY(${((1 - c) * 0.4).toFixed(3)}em)`;
      }
    },
    reduceMotion
  );
  const index = (flip?: boolean) => (
    <div
      style={{
        position: 'absolute',
        ...(flip ? { right: '3%', bottom: '4%', transform: 'rotate(180deg)' } : { left: '3%', top: '4%' }),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.1em',
        color: RED,
        fontFamily: 'var(--font-sans)',
        fontWeight: 700,
        fontSize: 'clamp(22px, 3vw, 52px)',
        lineHeight: 1,
      }}
    >
      <span>1</span>
      <span style={{ fontSize: '0.8em' }}>◆</span>
    </div>
  );
  const card = (
    <div
      ref={cardRef}
      style={{
        position: reduceMotion ? 'relative' : 'absolute',
        left: '50%',
        top: '50%',
        width: 'min(84vw, 1200px, 112vh)',
        aspectRatio: '1.45 / 1',
        background: CARD,
        border: `1px solid ${INK}`,
        boxShadow: '0 30px 70px rgba(0,0,0,0.10), 0 6px 20px rgba(0,0,0,0.05)',
        transform: reduceMotion ? 'translate(-50%, 0)' : 'translate(-50%, -50%) translate3d(0, 105vh, 0) rotateX(-14deg)',
        willChange: 'transform',
        overflow: 'hidden',
      }}
    >
      {index()}
      {index(true)}
      <div style={{ position: 'absolute', left: '9%', right: '9%', top: '8%', bottom: '20%', overflow: 'hidden' }}>
        <img src="/images/team-poster.jpg" alt="The 1Red team, drawn in line" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', mixBlendMode: 'multiply' }} />
      </div>
      <div ref={capRef} style={{ position: 'absolute', left: '9%', right: '15%', bottom: '6%', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16, opacity: reduceMotion ? 1 : 0 }}>
        <span style={{ fontFamily: 'var(--font-sans)', fontStyle: 'italic', fontWeight: 300, fontSize: 'clamp(16px, 2.1vw, 34px)', color: INK }}>Everyone you need, at one table.</span>
        <Link to="/the-box" className={focusRing} style={{ ...label, display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: INK, whiteSpace: 'nowrap' }}>
          Meet the table <ArrowRight size={13} strokeWidth={2} color={RED} />
        </Link>
      </div>
    </div>
  );
  if (reduceMotion) return <section style={{ padding: '4rem 0', background: '#fff' }}>{card}</section>;
  return (
    <section style={{ background: '#fff' }}>
      <div ref={wrapRef} style={{ height: `${PEOPLE_VH}vh`, position: 'relative' }}>
        <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden', perspective: '1200px' }}>
          <div style={{ position: 'absolute', left: 'clamp(1rem, 4vw, 5rem)', top: 'clamp(6rem, 12vh, 8rem)', ...label, display: 'inline-flex', alignItems: 'center', gap: 10, color: INK }}>
            <span style={{ width: 6, height: 6, background: RED, display: 'inline-block' }} />
            The people
          </div>
          {card}
        </div>
      </div>
    </section>
  );
}

/* ── The close: the wall's question and the one call to action ─────────── */
export function AboutCTA() {
  return (
    <section style={{ maxWidth: 1400, margin: '0 auto', padding: 'clamp(4rem, 12vh, 8rem) clamp(1rem, 4vw, 5rem) clamp(5rem, 12vh, 8rem)', color: INK }}>
      <div style={{ borderTop: `1px solid ${INK}`, paddingTop: 'clamp(40px, 8vh, 88px)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 32, flexWrap: 'wrap' }}>
        <motion.p
          initial={{ opacity: 0, y: 24, filter: 'blur(6px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true, margin: '-10% 0px' }}
          transition={{ duration: 0.8, ease: EASE }}
          style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: 'clamp(40px, 6vw, 104px)', fontWeight: 500, letterSpacing: '-0.045em', lineHeight: 0.96 }}
        >
          Got an idea that
          <br />
          needs every skill?
        </motion.p>
        <Link
          to="/contact"
          className={`${focusRing} btn-corners`}
          style={{ ...label, fontSize: 12, letterSpacing: '0.16em', display: 'inline-flex', alignItems: 'center', gap: 10, padding: '18px 28px', background: RED, color: 'white', textDecoration: 'none' }}
        >
          Start a project <ArrowUpRight size={15} strokeWidth={2} />
        </Link>
      </div>
    </section>
  );
}
