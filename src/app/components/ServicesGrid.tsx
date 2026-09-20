import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';

/* ─── What we cover ────────────────────────────────────────────────────────
 * The three disciplines as one designed grid, not a stack. Same Swiss grid
 * as section 2's poster: twelve columns, hairline rules, small-caps labels,
 * flush-left type. The first card is the anchor: seven columns wide and the
 * full height, its film filling the cell. The other two share the remaining
 * five columns, one above the other, film on top. Rules divide the cells;
 * nothing is boxed. On a phone the three stack in one column, each with its
 * film first.
 *
 * Self-contained on purpose: it carries its own data and heading row so it
 * can be lifted onto the Studio page unchanged (brief S2).
 * ────────────────────────────────────────────────────────────────────────── */

const INK = '#0A0A0A';
const RULE = 'rgba(10,10,10,0.14)';
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

/** A film that only plays while on screen, so three decoders never run
 *  for cells the viewer has scrolled past. */
function Film({ src, style }: { src: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) v.play().catch(() => {});
        else v.pause();
      },
      { threshold: 0.2 }
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);
  return (
    <video
      ref={ref}
      src={src}
      muted
      loop
      playsInline
      preload="metadata"
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

function Copy({ s, big }: { s: (typeof services)[number]; big?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={label}>{s.eyebrow}</span>
        <span style={{ ...label, opacity: 0.45 }}>{s.number}</span>
      </div>
      <h3
        style={{
          margin: 0,
          fontSize: big ? 'clamp(30px, 3.6vw, 56px)' : 'clamp(24px, 2.2vw, 34px)',
          fontWeight: 800,
          letterSpacing: '-0.04em',
          lineHeight: 1.0,
          color: INK,
        }}
      >
        {s.title}
      </h3>
      <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, opacity: 0.6, maxWidth: big ? '34ch' : '40ch', color: INK }}>{s.description}</p>
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
 *  renders the settled state with no entrance motion, for a copy that is
 *  being carried by something else's motion (the Studio arrival). */
export function ServicesGrid({ heading = true, still = false }: { heading?: boolean; still?: boolean }) {
  const wide = useWide();
  const [a, b, c] = services;
  const pad = 'clamp(1.5rem, 4vw, 5rem)';

  return (
    <div style={{ padding: `0 ${pad}`, color: INK }}>
      {/* Heading row: label right, rule beneath, the same as the poster. */}
      <div style={{ display: heading ? 'grid' : 'none', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', alignItems: 'end', paddingBottom: 18, borderBottom: `1px solid ${INK}` }}>
        <h2 style={{ gridColumn: '1 / span 8', margin: 0, fontSize: 'clamp(40px, 6.4vw, 112px)', fontWeight: 800, letterSpacing: '-0.05em', lineHeight: 0.96 }}>
          What we cover
        </h2>
        <span style={{ ...label, gridColumn: wide ? '10 / span 3' : '1 / span 12', textAlign: wide ? 'right' : 'left', marginTop: wide ? 0 : 18 }}>
          Three disciplines. One team.
        </span>
      </div>

      {wide ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gridTemplateRows: 'auto auto' }}>
          {/* 01: the anchor cell, seven columns, both rows. */}
          <motion.div
            {...rise(0, still)}
            style={{ gridColumn: '1 / span 7', gridRow: '1 / span 2', display: 'flex', flexDirection: 'column', borderRight: `1px solid ${RULE}` }}
          >
            <div style={{ aspectRatio: '16 / 10', overflow: 'hidden' }}>
              <Film src={a.video} />
            </div>
            <div style={{ padding: '28px 36px 40px 0' }}>
              <Copy s={a} big />
            </div>
          </motion.div>

          {/* 02 and 03 share the five right columns, film on top of each. */}
          {[b, c].map((s, i) => (
            <motion.div
              key={s.number}
              {...rise(i + 1, still)}
              style={{
                gridColumn: '8 / span 5',
                gridRow: i + 1,
                display: 'grid',
                gridTemplateColumns: '2fr 3fr',
                gap: 24,
                padding: '24px 0 32px 32px',
                borderBottom: i === 0 ? `1px solid ${RULE}` : 'none',
              }}
            >
              <div style={{ aspectRatio: '4 / 5', overflow: 'hidden' }}>
                <Film src={s.video} />
              </div>
              <Copy s={s} />
            </motion.div>
          ))}
        </div>
      ) : (
        <div>
          {services.map((s, i) => (
            <motion.div key={s.number} {...rise(i, still)} style={{ padding: '24px 0 32px', borderBottom: i < 2 ? `1px solid ${RULE}` : 'none' }}>
              <div style={{ aspectRatio: '16 / 10', overflow: 'hidden', marginBottom: 20 }}>
                <Film src={s.video} />
              </div>
              <Copy s={s} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
