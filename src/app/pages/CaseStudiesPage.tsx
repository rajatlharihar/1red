import { useState } from 'react';
import { Link } from 'react-router';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import projectsData from '../data/projects.json';
import { CASE_STORIES } from '../data/caseStories';
import { InkCard, InkRule, Stamp, HandNote, Prop, TILTS, paperTiles, CREAM } from '../components/paper/Paper';

/** One red hand note per story, like the flags' margin notes. */
const NOTES = ['read this one.', 'our favourite.', 'still proud.', 'long one.', 'worth it.'];

/* ─── /case-studies — the deep stories ─────────────────────────────────────
 * The projects with a page of their own (`page` in projects.json), one row
 * each: the cover plate large on one side, and on the other the number,
 * name, what it was, the one line and what we delivered. The row opens
 * /case-studies/<slug>, the brand's story (data/caseStories.ts). /work is the wide
 * showcase; this is where the whole story lives.
 * ────────────────────────────────────────────────────────────────────────── */

const RED = '#EB3F43';
const INK = 'rgb(10,10,10)';
const PAPER = CREAM;
const EASE = [0.22, 1, 0.36, 1] as const;

type Project = (typeof projectsData)[0] & { hidden?: boolean; page?: boolean; thumb?: string };
export const CASE_STUDIES = (projectsData as Project[]).filter((p) => !p.hidden && p.page);

const label: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.24em',
  textTransform: 'uppercase',
};
const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#EB3F43]';

function Row({ p, i, reduceMotion }: { p: Project; i: number; reduceMotion: boolean }) {
  const [hover, setHover] = useState(false);
  const story = CASE_STORIES[p.id];
  return (
    <motion.li
      initial={reduceMotion ? false : { opacity: 0, y: 32, filter: 'blur(6px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-10% 0px' }}
      transition={{ duration: 0.9, ease: EASE }}
      style={{ listStyle: 'none', overflowX: 'visible' }}
    >
      <InkRule bleed seed={31 + i * 7} />
      <Link
        to={`/case-studies/${p.id}`}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className={`${focusRing} grid grid-cols-1 lg:grid-cols-12`}
        style={{ gap: 'clamp(20px, 3vw, 48px)', padding: 'clamp(24px, 4vh, 44px) 0', textDecoration: 'none', color: INK }}
      >
        <div className="lg:col-span-7">
          <InkCard tilt={TILTS[i % TILTS.length]} lift={hover && !reduceMotion} pad={12}>
            <div style={{ position: 'relative', aspectRatio: '16 / 10', overflow: 'hidden', background: PAPER, border: `1.2px solid ${INK}` }}>
              <img src={p.thumb} alt={`${p.title} cover`} loading={i === 0 ? 'eager' : 'lazy'} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          </InkCard>
        </div>
        <div className="lg:col-span-5" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 24 }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
              <HandNote size={22}>{NOTES[i % NOTES.length]}</HandNote>
              <span style={{ ...label, opacity: 0.55 }}>
                {story?.note ? 'Concept' : p.category} . {p.year}
              </span>
            </div>
            <h2 style={{ margin: 'clamp(12px, 2vh, 20px) 0 0', fontFamily: 'var(--font-sans)', fontSize: 'clamp(44px, 5.4vw, 96px)', fontWeight: 500, letterSpacing: '-0.045em', lineHeight: 0.95, color: RED }}>
              <span style={{ fontFamily: 'var(--font-hand)', fontSize: '0.42em', letterSpacing: 0, color: INK, verticalAlign: 'top', marginRight: '0.3em' }}>{p.number}</span>
              {p.title}.
            </h2>
            {story && <p style={{ margin: '10px 0 0', fontFamily: 'var(--font-sans)', fontSize: 'clamp(22px, 2vw, 32px)', fontWeight: 500, letterSpacing: '-0.03em', lineHeight: 1.1, opacity: 0.75 }}>{story.tagline}</p>}
            <p style={{ margin: 'clamp(14px, 2.4vh, 24px) 0 0', fontSize: 'clamp(15px, 1.15vw, 18px)', lineHeight: 1.5, opacity: 0.6, maxWidth: 520 }}>{story ? story.chapters[0].body : p.overview}</p>
          </div>
          <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
              {(story?.scope ?? p.deliverables).slice(0, 4).map((d) => (
                <Stamp key={d} style={{ fontSize: 12 }}>{d}</Stamp>
              ))}
            </div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <span style={{ ...label, fontSize: 11, letterSpacing: '0.16em' }}>Read the story</span>
              <motion.span animate={{ x: hover && !reduceMotion ? 6 : 0 }} transition={{ type: 'spring', bounce: 0, duration: 0.4 }} style={{ display: 'inline-flex' }}>
                <ArrowRight size={16} strokeWidth={2} color={RED} />
              </motion.span>
            </span>
          </div>
        </div>
      </Link>
    </motion.li>
  );
}

export function CaseStudiesPage() {
  const reduceMotion = useReducedMotion() ?? false;
  return (
    <main className="paper-page" style={{ ...paperTiles, position: 'relative', overflowX: 'clip', minHeight: '100vh', color: INK, padding: 'clamp(7rem, 15vh, 10rem) clamp(1rem, 4vw, 5rem) clamp(5rem, 10vh, 8rem)' }}>
      <Prop src="/images/paper/magnifier.png" style={{ right: 'clamp(-40px, 1vw, 40px)', top: 'clamp(80px, 10vh, 120px)', width: 'clamp(200px, 22vw, 340px)', transform: 'rotate(-12deg)' }} />
      <div style={{ maxWidth: 1400, margin: '0 auto', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, marginBottom: 'clamp(28px, 5vh, 56px)' }}>
          <div className="overflow-hidden">
            <motion.h1
              initial={reduceMotion ? false : { y: '110%' }}
              animate={{ y: 0 }}
              transition={{ duration: 0.8, ease: EASE }}
              style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(40px, 6vw, 104px)', fontWeight: 500, letterSpacing: '-0.035em', lineHeight: 0.98, margin: 0 }}
            >
              The long versions.
              {/* The hand-written red aside, as on the red flags and the deal. */}
              <span style={{ display: 'block', fontFamily: 'var(--font-hand)', fontWeight: 700, fontSize: '0.62em', letterSpacing: 0, color: '#EB3F43', marginTop: '0.18em', transform: 'rotate(-3deg)', transformOrigin: 'left' }}>
                popcorn recommended.
              </span>
            </motion.h1>
          </div>
        </div>
        <ul style={{ padding: 0, margin: 0 }}>
          {CASE_STUDIES.map((p, i) => (
            <Row key={p.id} p={p} i={i} reduceMotion={reduceMotion} />
          ))}
        </ul>
        <InkRule bleed seed={97} />
        <div style={{ paddingTop: 'clamp(2rem, 4vh, 3rem)', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 24, flexWrap: 'wrap' }}>
          <p style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: 'clamp(22px, 2.4vw, 36px)', fontWeight: 500, letterSpacing: '-0.03em', color: RED }}>More pieces, every discipline.</p>
          <Link to="/work" className={focusRing} style={{ display: 'inline-flex', alignItems: 'baseline', gap: 12, textDecoration: 'none', color: INK }}>
            <span style={{ ...label, opacity: 0.5 }}>See</span>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(22px, 2.4vw, 34px)', fontWeight: 500, letterSpacing: '-0.03em' }}>All work</span>
            <ArrowRight size={18} strokeWidth={2} color={RED} />
          </Link>
        </div>
      </div>
    </main>
  );
}
