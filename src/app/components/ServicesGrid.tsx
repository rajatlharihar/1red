import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';

/* ─── What we cover ────────────────────────────────────────────────────────
 * The three disciplines as one poster. Same Swiss row as section 2's
 * end state up top (headline flush-left, label right, one rule), then three
 * tall red panels on a twelve-column grid, echoing the process scene's
 * panels: each holds its film in a window low on the red, and its name,
 * line and tags in ink beneath. Nothing is boxed. One column on a phone.
 *
 * Self-contained on purpose: it carries its own data and heading row so it
 * mounts on the Studio page unchanged (brief S2).
 * ────────────────────────────────────────────────────────────────────────── */

const INK = '#0A0A0A';
const RULE = 'rgba(10,10,10,0.14)';
const RED = '#EA3323';
const RED_SOFT = '#FF5A4A';
const EASE = [0.22, 1, 0.36, 1] as const;

/* Websites and UI/UX are one thing here: the product and the site are
   designed by the same hands. Content and motion are not their own cards:
   content is the feed the campaigns run on, and motion, 2D and 3D, is the
   medium every film here already shows, so all of it lives on the third
   card (Rajat, 2026-09-20). */
export const services = [
  {
    number: '01',
    eyebrow: 'Web & product',
    title: 'Websites & UI/UX',
    description:
      'The site and the product, designed as one. Research, flows and prototypes through to a build that is fast, responsive and made to convert.',
    tags: ['Web Design', 'UI/UX', 'Prototyping', 'Design Systems', 'Webflow', 'E-commerce'],
    video: '/videos/app-showcase.mp4',
  },
  {
    number: '02',
    eyebrow: 'Identity',
    title: 'Brand Identity',
    description:
      'A mark, a voice and a visual language that hold together everywhere they appear. Logo systems, typography, guidelines: the whole kit.',
    tags: ['Logo Design', 'Visual Identity', 'Brand Strategy', 'Typography', 'Art Direction'],
    video: '/videos/apptile-logomotion.mp4',
  },
  {
    number: '03',
    eyebrow: 'Performance & motion',
    title: 'Ads, Campaigns & Motion',
    description:
      'Creatives built to be measured, and the motion that carries them. 2D and 3D animation, logo and brand motion, static and video ad sets, the feed and reels around them, landing pages to match, and the iteration loop that keeps them earning.',
    tags: ['Ad Creatives', '2D Animation', '3D Animation', 'Motion Design', 'Social Content', 'Reels', 'Landing Pages', 'Meta & Google'],
    video: '/videos/terrabarn-socials.mp4',
  },
];

function useWide() {
  const [wide, setWide] = useState(() => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const apply = () => setWide(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);
  return wide;
}

/** A film that only plays while on screen AND visible, so decoders never
 *  run for cells the viewer has scrolled past, nor for the hidden copy of
 *  the grid that the Studio arrival keeps (`inert`: never plays, shows its
 *  first frame, which is what the playing copy starts on at the swap). */
function Film({ src, style, inert = false }: { src: string; style?: React.CSSProperties; inert?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v || inert) return;
    let onScreen = false;
    const sync = () => {
      const shown = onScreen && v.checkVisibility?.({ visibilityProperty: true }) !== false;
      if (shown) v.play().catch(() => {});
      else v.pause();
    };
    const io = new IntersectionObserver(
      ([e]) => {
        onScreen = e.isIntersecting;
        sync();
      },
      { threshold: 0.2 }
    );
    io.observe(v);
    // Visibility can change without a scroll (the Studio hand-off), so
    // re-check on a slow tick while on screen.
    const tick = window.setInterval(() => onScreen && sync(), 250);
    return () => {
      io.disconnect();
      window.clearInterval(tick);
    };
  }, [inert]);
  return (
    <video
      ref={ref}
      src={src}
      muted
      loop
      playsInline
      preload="auto"
      style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover', background: '#EDE8D9', ...style }}
    />
  );
}

const label: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.24em',
  textTransform: 'uppercase',
  lineHeight: 1.6,
  color: INK,
};

function Copy({ s }: { s: (typeof services)[number] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 22 }}>
      <span style={label}>{s.eyebrow}</span>
      <h3 style={{ margin: 0, fontSize: 'clamp(24px, 2.3vw, 38px)', fontWeight: 800, letterSpacing: '-0.045em', lineHeight: 1.0, color: INK }}>{s.title}</h3>
      <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, opacity: 0.6, maxWidth: '38ch', color: INK }}>{s.description}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px', marginTop: 4 }}>
        {s.tags.map((t) => (
          <span key={t} style={{ ...label, letterSpacing: '0.14em', opacity: 0.5 }}>
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

/** A tall red panel in the process scene's language, the film in a window
 *  low on it, nothing over the red but the film. */
function RedPanel({ s, i, inert }: { s: (typeof services)[number]; i: number; inert: boolean }) {
  return (
    <div style={{ position: 'relative', aspectRatio: '1 / 1.35' }}>
      <svg viewBox="0 0 100 135" preserveAspectRatio="none" style={{ position: 'absolute', inset: '-2% -4%', width: '108%', height: '104%', overflow: 'visible' }}>
        <defs>
          <filter id={`sg-rough-${i}`} x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" seed={11 + i} result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="1.8" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
        <rect x={4.5} y={3.5} width={92} height={128} fill={RED_SOFT} opacity={0.5} filter={`url(#sg-rough-${i})`} transform={`rotate(${i % 2 ? 0.5 : -0.5} 50 67)`} />
        <rect x={4} y={3} width={92} height={128} fill={RED} filter={`url(#sg-rough-${i})`} transform={`rotate(${i % 2 ? -0.35 : 0.4} 50 67)`} />
      </svg>
      <div style={{ position: 'absolute', left: '11%', right: '11%', bottom: '8%', height: '58%', overflow: 'hidden', border: `1px solid ${INK}`, zIndex: 1 }}>
        <Film src={s.video} inert={inert} />
      </div>
    </div>
  );
}

const rise = (i: number, still: boolean) =>
  still
    ? {}
    : {
        initial: { opacity: 0, y: 22 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: '-80px' },
        transition: { duration: 0.8, delay: 0.08 * i, ease: EASE },
      };

/** `heading` off where the page already introduces the block (the
 *  Services page); on for a standalone mount (the Studio page). `still`
 *  renders the settled state with no entrance motion and films that never
 *  play, for the copy the Studio arrival carries in the stage. */
export function ServicesGrid({ heading = true, still = false }: { heading?: boolean; still?: boolean }) {
  const wide = useWide();
  const [a, b, c] = services;
  const pad = 'clamp(1.5rem, 4vw, 5rem)';

  return (
    <div style={{ padding: `0 ${pad}`, color: INK }}>
      {/* Heading row: label right, rule beneath, the same as the poster. */}
      <div style={{ display: heading ? 'grid' : 'none', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', alignItems: 'end', paddingBottom: 18, borderBottom: `1px solid ${INK}` }}>
        <h2 style={{ gridColumn: '1 / span 12', margin: 0, fontSize: 'clamp(40px, 6.4vw, 112px)', fontWeight: 800, letterSpacing: '-0.05em', lineHeight: 0.96 }}>
          What we cover
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: wide ? 'repeat(12, minmax(0, 1fr))' : '1fr', columnGap: 0 }}>
        {services.map((s, i) => (
          <motion.div
            key={s.number}
            {...rise(i, still)}
            style={{
              gridColumn: wide ? `${i * 4 + 1} / span 4` : '1',
              padding: wide ? `clamp(28px, 3vw, 48px) ${i === 2 ? 0 : 'clamp(20px, 2vw, 36px)'} clamp(36px, 4vw, 64px) ${i === 0 ? 0 : 'clamp(20px, 2vw, 36px)'}` : '28px 0 36px',
              borderBottom: !wide && i < 2 ? `1px solid ${RULE}` : 'none',
            }}
          >
            <RedPanel s={s} i={i} inert={still} />
            <Copy s={s} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
