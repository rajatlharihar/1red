import { useEffect, useRef } from 'react';
import { useParams, Link, Navigate } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import projectsData from '../data/projects.json';

/* ─── Case study detail — /work/:slug ──────────────────────────────────────
 * Reads from `projects.json`, the single source of truth. This page
 * previously carried its OWN hardcoded copy of every project (a third
 * competing definition alongside projects.json and FlashWork's local
 * array), and linked back to `/work` — a route that redirects home, so the
 * only exit was a dead end.
 *
 * Narrative order matches the brief's proof structure:
 *   WHO/WHAT → THE THINKING (overview) → THE EXECUTION (deliverables) → RESULT
 *
 * RESULT is deliberately NOT rendered yet. `projects.json` carries a
 * `result` string per project containing specific performance claims
 * ("3× brand recognition", "+18k following, 9.4% engagement"), but those
 * have never been displayed anywhere in the live site and are unverified —
 * possibly leftover copy from the original Figma export. Publishing an
 * unverified metric as client proof is a materially bigger claim than
 * leaving it buried, so it stays off until each one is confirmed. See
 * ResultSlot below — enabling it is a one-line change per project.
 * ────────────────────────────────────────────────────────────────────────── */

const EASE = [0.22, 1, 0.36, 1] as const;
const RED = '#EA3323';

type Project = (typeof projectsData)[0];

/* Set a project's id to `true` here once its `result` metric in
   projects.json has been verified as a real, publishable client outcome. */
const VERIFIED_RESULTS: Record<string, boolean> = {
  apptile: false,
  terrabarn: false,
  ground: false,
  yui: false,
  illusdoodle: false,
};

function eyebrow(text: string) {
  return (
    <span
      style={{
        fontFamily: 'var(--font-sans)',
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.28em',
        textTransform: 'uppercase',
        opacity: 0.4,
      }}
    >
      {text}
    </span>
  );
}

export function WorkDetailPage() {
  const { slug } = useParams();
  const project = projectsData.find((p) => p.id === slug) as Project | undefined;
  const videoRef = useRef<HTMLVideoElement>(null);

  // Same retry-safe play trigger used for every other lazy video in this
  // codebase (ThreeEnvironment, ServicesStack, FlashWork).
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const attempt = () => v.play().catch(() => {});
    if (v.readyState >= 2) attempt();
    else v.addEventListener('canplay', attempt, { once: true });
  }, [project?.video]);

  // Unknown slug → home, rather than rendering a "details coming soon"
  // shell that reads as a broken page.
  if (!project) return <Navigate to="/" replace />;

  const index = projectsData.findIndex((p) => p.id === project.id);
  const next = projectsData[(index + 1) % projectsData.length];
  const showResult = VERIFIED_RESULTS[project.id] && project.result;

  return (
    <main style={{ minHeight: '100vh', background: '#fff', paddingBottom: 'clamp(5rem, 10vh, 8rem)' }}>
      <div
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: 'clamp(8rem, 16vh, 12rem) clamp(1.5rem, 4vw, 5rem) 0',
        }}
      >
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}>
          <Link
            to="/"
            className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#EA3323]"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontFamily: 'var(--font-sans)',
              fontSize: 11,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              color: 'rgb(10,10,10)',
              opacity: 0.5,
              marginBottom: 'clamp(2rem, 5vh, 3.5rem)',
            }}
          >
            <ArrowLeft size={13} strokeWidth={2} /> Back to OneRed
          </Link>
        </motion.div>

        {/* ── Identity ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.04 }}
          style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}
        >
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, letterSpacing: '0.2em', color: RED, fontVariantNumeric: 'tabular-nums' }}>
            {project.number}
          </span>
          <span aria-hidden style={{ width: 6, height: 6, background: RED }} />
          {eyebrow(`${project.category} — ${project.year}`)}
        </motion.div>

        <div style={{ overflow: 'hidden' }}>
          <motion.h1
            initial={{ y: '110%' }}
            animate={{ y: 0 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.08 }}
            style={{
              fontFamily: 'var(--font-sans)',
              fontWeight: 800,
              fontSize: 'clamp(48px, 9vw, 118px)',
              lineHeight: 0.98,
              letterSpacing: '-0.04em',
              margin: 0,
            }}
          >
            {project.title}
          </motion.h1>
        </div>
      </div>

      {/* ── The work itself ── */}
      {project.video && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.2 }}
          style={{
            maxWidth: 1100,
            margin: 'clamp(2.5rem, 6vh, 4rem) auto 0',
            padding: '0 clamp(1.5rem, 4vw, 5rem)',
          }}
        >
          <div
            style={{
              position: 'relative',
              aspectRatio: '16 / 9',
              borderRadius: 20,
              overflow: 'hidden',
              background: project.color || 'rgba(10,10,10,0.04)',
              boxShadow: '0 30px 64px rgba(234,51,35,0.12), 0 6px 20px rgba(0,0,0,0.07)',
            }}
          >
            <video
              ref={videoRef}
              src={project.video}
              muted
              loop
              autoPlay
              playsInline
              preload="metadata"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </div>
        </motion.div>
      )}

      {/* ── The thinking + the execution ── */}
      <div
        className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr]"
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: 'clamp(3rem, 7vh, 5rem) clamp(1.5rem, 4vw, 5rem) 0',
          gap: 'clamp(2.5rem, 5vw, 5rem)',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          {eyebrow('The Thinking')}
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'clamp(17px, 1.7vw, 23px)',
              fontWeight: 400,
              lineHeight: 1.62,
              letterSpacing: '-0.01em',
              margin: '18px 0 0',
              color: 'rgb(10,10,10)',
            }}
          >
            {project.overview}
          </p>

          {showResult && (
            <div style={{ marginTop: 'clamp(2rem, 4vh, 3rem)' }}>
              {eyebrow('The Result')}
              <p
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 'clamp(19px, 2vw, 27px)',
                  fontWeight: 700,
                  lineHeight: 1.4,
                  letterSpacing: '-0.02em',
                  margin: '18px 0 0',
                  color: RED,
                }}
              >
                {project.result}
              </p>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.08 }}
        >
          {eyebrow('What We Delivered')}
          <ul style={{ listStyle: 'none', padding: 0, margin: '18px 0 0' }}>
            {project.deliverables.map((d) => (
              <li
                key={d}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '13px 0',
                  borderBottom: '1px solid rgba(0,0,0,0.07)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 14,
                  color: 'rgb(10,10,10)',
                }}
              >
                <span aria-hidden style={{ width: 5, height: 5, background: RED, flexShrink: 0 }} />
                {d}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      {/* ── Next project — keeps the visitor inside the proof chapter ── */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.6, ease: EASE }}
        style={{
          maxWidth: 1100,
          margin: 'clamp(4rem, 9vh, 7rem) auto 0',
          padding: '0 clamp(1.5rem, 4vw, 5rem)',
        }}
      >
        <Link
          to={`/work/${next.id}`}
          className="group focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#EA3323]"
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: 20,
            paddingTop: 'clamp(1.5rem, 3vh, 2.2rem)',
            borderTop: '1px solid rgba(0,0,0,0.1)',
            textDecoration: 'none',
            color: 'rgb(10,10,10)',
          }}
        >
          <span style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {eyebrow('Next Project')}
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(28px, 4vw, 52px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1 }}>
              {next.title}
            </span>
          </span>
          <ArrowRight size={26} strokeWidth={1.8} color={RED} style={{ flexShrink: 0, alignSelf: 'center' }} />
        </Link>
      </motion.div>
    </main>
  );
}
