import { Fragment } from 'react';
import { useParams, Link, Navigate } from 'react-router';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import projectsData from '../data/projects.json';
import { CASE_STORIES } from '../data/caseStories';
import { EditRow } from '../components/case/EditGrid';
import { LiveLaptop } from '../components/case/LiveLaptop';

/* ─── A case study (rebuilt 2026-10-04) ────────────────────────────────────
 * Told as the brand's story, not a plate dump: the Swiss row up top (title,
 * grey tagline, one hairline), a meta row, then three short chapters
 * (the struggle, the idea, how it stands out) on a 12-col grid, then a
 * short edit of the Behance presentation in justified rows, with the live
 * site running inside a laptop where there is one (Yui). The full
 * presentation is one click away on Behance. Copy: data/caseStories.ts.
 * ────────────────────────────────────────────────────────────────────────── */

const RED = '#EB3F43';
const INK = 'rgb(10,10,10)';
const EASE = [0.22, 1, 0.36, 1] as const;
const focus = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#EB3F43]';

type Project = (typeof projectsData)[0] & { hidden?: boolean; page?: boolean };
const withPages = (projectsData as Project[]).filter((p) => !p.hidden && p.page);

const label: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
};
const wrap: React.CSSProperties = { maxWidth: 1240, margin: '0 auto', padding: '0 clamp(1rem, 4vw, 5rem)' };

export function WorkDetailPage() {
  const { slug } = useParams();
  const project = (projectsData as Project[]).find((p) => p.id === slug);
  const reduce = useReducedMotion() ?? false;

  if (!project) return <Navigate to="/" replace />;
  const story = CASE_STORIES[project.id];
  const index = withPages.findIndex((p) => p.id === project.id);
  const next = withPages[(index + 1) % withPages.length];
  const behance = project.behanceId ? `https://www.behance.net/gallery/${project.behanceId}` : null;
  const rise = (delay = 0) => ({
    initial: reduce ? false : { y: '110%' },
    animate: { y: 0 },
    transition: { duration: 0.8, ease: EASE, delay },
  });

  return (
    <main style={{ minHeight: '100vh', background: '#FFFFFF', paddingBottom: 'clamp(5rem, 10vh, 8rem)', color: INK }}>
      <style>{`
        @media (max-width: 640px) { .case-row { flex-direction: column; } .case-tile { flex: none !important; width: 100%; } }
        .case-chapters { display: grid; grid-template-columns: repeat(12, 1fr); gap: clamp(16px, 2vw, 32px); }
        .case-chapter { grid-column: span 4; }
        @media (max-width: 900px) { .case-chapter { grid-column: span 12; } }
      `}</style>

      {/* ── The Swiss row ── */}
      <div style={{ ...wrap, paddingTop: 'clamp(7rem, 14vh, 10rem)' }}>
        <Link to="/case-studies" className={focus} style={{ ...label, display: 'inline-flex', alignItems: 'center', gap: 8, letterSpacing: '0.14em', textDecoration: 'none', color: INK, opacity: 0.5, marginBottom: 'clamp(1.5rem, 4vh, 3rem)' }}>
          <ArrowLeft size={13} strokeWidth={2} /> Case studies
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
          <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(44px, 7.4vw, 128px)', fontWeight: 500, letterSpacing: '-0.045em', lineHeight: 0.94, margin: 0 }}>
            <span style={{ display: 'block', overflow: 'hidden' }}>
              <motion.span style={{ display: 'block' }} {...rise()}>
                {project.title}.
              </motion.span>
            </span>
            {story && (
              <span style={{ display: 'block', overflow: 'hidden', paddingBottom: '0.08em' }}>
                <motion.span style={{ display: 'block', opacity: 0.4, maxWidth: '14em' }} {...rise(0.08)}>
                  {story.tagline}
                </motion.span>
              </span>
            )}
          </h1>
          <span style={{ ...label, paddingTop: '0.8em', fontVariantNumeric: 'tabular-nums' }}>
            {project.number} / {project.year}
          </span>
        </div>
        <motion.div
          initial={reduce ? false : { scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.9, ease: EASE, delay: 0.2 }}
          style={{ height: 1, background: INK, transformOrigin: 'left center', margin: 'clamp(1.25rem, 3vh, 2rem) 0 0' }}
        />
        {story && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 28px', marginTop: 16 }}>
            {story.scope.map((s) => (
              <span key={s} style={{ ...label, fontSize: 10, opacity: 0.6 }}>
                {s}
              </span>
            ))}
          </div>
        )}
        {story?.note && <p style={{ margin: '12px 0 0', fontSize: 13, fontStyle: 'italic', opacity: 0.5 }}>{story.note}</p>}
      </div>

      {story ? (
        <>
          {/* ── The story, three chapters ── */}
          <div style={{ ...wrap, marginTop: 'clamp(3rem, 8vh, 5.5rem)' }}>
            <div className="case-chapters">
              {story.chapters.map((c, i) => (
                <motion.div
                  key={c.title}
                  className="case-chapter"
                  initial={reduce ? false : { opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-8% 0px' }}
                  transition={{ duration: 0.8, ease: EASE, delay: i * 0.08 }}
                  style={{ borderTop: '1px solid rgba(10,10,10,0.14)', paddingTop: 18 }}
                >
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 14 }}>
                    <span style={{ ...label, color: RED, fontVariantNumeric: 'tabular-nums' }}>0{i + 1}</span>
                    <h2 style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: 'clamp(22px, 2vw, 30px)', fontWeight: 500, letterSpacing: '-0.03em' }}>{c.title}</h2>
                  </div>
                  <p style={{ margin: 0, fontSize: 'clamp(15px, 1.15vw, 18px)', lineHeight: 1.6, opacity: 0.72 }}>{c.body}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* ── The edit, with the laptop dropped in ── */}
          <div style={{ ...wrap, marginTop: 'clamp(3.5rem, 9vh, 6rem)', display: 'flex', flexDirection: 'column', gap: 'clamp(8px, 1vw, 14px)' }}>
            {story.rows.map((row, i) => (
              <Fragment key={i}>
                <EditRow tiles={row} first={i === 0} />
                {story.site && story.laptopAfter === i + 1 && (
                  <div style={{ margin: '0 calc(-1 * clamp(1rem, 4vw, 5rem))' }}>
                    <LiveLaptop {...story.site} />
                  </div>
                )}
              </Fragment>
            ))}
          </div>

          <div style={{ ...wrap, marginTop: 'clamp(3rem, 8vh, 5rem)' }}>
            <p style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: 'clamp(26px, 3.2vw, 52px)', fontWeight: 500, letterSpacing: '-0.035em', lineHeight: 1.05, maxWidth: '18em' }}>
              {story.closer}
            </p>
          </div>
        </>
      ) : (
        <div style={{ ...wrap, marginTop: '2rem' }}>
          <p style={{ fontSize: 'clamp(16px, 1.4vw, 20px)', lineHeight: 1.55, maxWidth: '56ch', opacity: 0.65 }}>{project.overview}</p>
        </div>
      )}

      {/* ── Out to Behance, and on to the next ── */}
      <div style={{ ...wrap, marginTop: 'clamp(3rem, 7vh, 5rem)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 24, borderTop: '1px solid rgba(10,10,10,0.12)', paddingTop: 'clamp(2rem, 4vh, 3rem)' }}>
          {behance ? (
            <a href={behance} target="_blank" rel="noreferrer" className={`fill-btn btn-corners fill-btn--red-outline ${focus}`} style={{ textDecoration: 'none' }}>
              <span className="fill-btn__fill" aria-hidden />
              <span className="fill-btn__label">
                <span>The full presentation</span>
                <span aria-hidden>The full presentation</span>
              </span>
              <span className="fill-btn__icon">
                <ArrowUpRight size={15} strokeWidth={2} />
              </span>
            </a>
          ) : (
            <span />
          )}
          {next && next.id !== project.id && (
            <Link to={`/case-studies/${next.id}`} className={focus} style={{ display: 'inline-flex', alignItems: 'baseline', gap: 12, textDecoration: 'none', color: INK }}>
              <span style={{ ...label, opacity: 0.5 }}>Next story</span>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(24px, 2.6vw, 40px)', fontWeight: 500, letterSpacing: '-0.035em' }}>{next.title}.</span>
              <ArrowRight size={18} strokeWidth={2} color={RED} />
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
