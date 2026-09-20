import { useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import projectsData from '../data/projects.json';
import workImages from '../data/workImages.json';

/* ─── A project's own page ─────────────────────────────────────────────────
 * Presented the way Rajat presents it on Behance (R28): the title, its
 * category and year and one line at the top, then the presentation images
 * stacked at full content width one after another, and "View on Behance"
 * at the end. The images are his own project modules, fetched from his
 * Behance projects into public/work/<slug>/ (1400 wide webp, in order,
 * listed in data/workImages.json). Each image eases up into place as it
 * comes into view; nothing pops. Below the fold they load lazily.
 * ────────────────────────────────────────────────────────────────────────── */

const RED = '#EA3323';
const INK = 'rgb(10,10,10)';
const EASE = [0.22, 1, 0.36, 1] as const;

type Project = (typeof projectsData)[0] & { hidden?: boolean };
const IMAGES = workImages as Record<string, string[]>;

/** The projects that are shown: the hidden ones stay in the data. */
const shown = (projectsData as Project[]).filter((p) => !p.hidden);

const label: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
};

function Plate({ src, alt, i, reduceMotion }: { src: string; alt: string; i: number; reduceMotion: boolean }) {
  return (
    <motion.figure
      initial={reduceMotion ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-8% 0px' }}
      transition={{ duration: 0.9, ease: EASE }}
      style={{ margin: 0 }}
    >
      <img
        src={src}
        alt={alt}
        loading={i < 2 ? 'eager' : 'lazy'}
        decoding="async"
        style={{ display: 'block', width: '100%', height: 'auto', background: '#F2EFE8' }}
      />
    </motion.figure>
  );
}

export function WorkDetailPage() {
  const { slug } = useParams();
  const project = (projectsData as Project[]).find((p) => p.id === slug);
  const reduceMotion = useReducedMotion() ?? false;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  // Unknown slug → home, rather than a broken shell.
  if (!project) return <Navigate to="/" replace />;

  const images = IMAGES[project.id] ?? [];
  const index = shown.findIndex((p) => p.id === project.id);
  const next = shown[(index + 1) % shown.length];
  const behance = project.behanceId ? `https://www.behance.net/gallery/${project.behanceId}` : null;

  return (
    <main style={{ minHeight: '100vh', background: '#fff', paddingBottom: 'clamp(5rem, 10vh, 8rem)', color: INK }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(7rem, 14vh, 10rem) clamp(1.5rem, 4vw, 5rem) 0' }}>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}>
          <Link
            to="/#work"
            className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#EA3323]"
            style={{ ...label, display: 'inline-flex', alignItems: 'center', gap: 8, letterSpacing: '0.14em', textDecoration: 'none', color: INK, opacity: 0.5, marginBottom: 'clamp(2rem, 5vh, 3.5rem)' }}
          >
            <ArrowLeft size={13} strokeWidth={2} /> Selected work
          </Link>
        </motion.div>

        {/* ── Identity: number, category, year, title, one line ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.04 }}
          style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}
        >
          <span style={{ ...label, color: RED, fontVariantNumeric: 'tabular-nums' }}>{project.number}</span>
          <span aria-hidden style={{ width: 6, height: 6, background: RED }} />
          <span style={{ ...label, opacity: 0.55 }}>
            {project.category} — {project.year}
          </span>
        </motion.div>
        <div style={{ overflow: 'hidden' }}>
          <motion.h1
            initial={{ y: '110%' }}
            animate={{ y: 0 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.08 }}
            style={{ fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: 'clamp(48px, 9vw, 118px)', lineHeight: 0.98, letterSpacing: '-0.04em', margin: 0 }}
          >
            {project.title}
          </motion.h1>
        </div>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.18 }}
          style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(16px, 1.4vw, 20px)', lineHeight: 1.55, maxWidth: '56ch', margin: 'clamp(1.25rem, 3vh, 2rem) 0 0', opacity: 0.65 }}
        >
          {project.overview}
        </motion.p>
      </div>

      {/* ── The presentation, plate after plate ── */}
      <div style={{ maxWidth: 1100, margin: 'clamp(2.5rem, 6vh, 4rem) auto 0', padding: '0 clamp(1.5rem, 4vw, 5rem)', display: 'flex', flexDirection: 'column', gap: 'clamp(10px, 1.2vw, 18px)' }}>
        {images.map((src, i) => (
          <Plate key={src} src={src} alt={`${project.title}, ${i + 1} of ${images.length}`} i={i} reduceMotion={reduceMotion} />
        ))}
        {images.length === 0 && project.video && (
          <video src={project.video} muted loop autoPlay playsInline preload="metadata" style={{ width: '100%', display: 'block', aspectRatio: '16 / 9', objectFit: 'cover' }} />
        )}
      </div>

      {/* ── Out to Behance, and on to the next ── */}
      <div style={{ maxWidth: 1100, margin: 'clamp(3rem, 7vh, 5rem) auto 0', padding: '0 clamp(1.5rem, 4vw, 5rem)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 24, borderTop: '1px solid rgba(10,10,10,0.12)', paddingTop: 'clamp(2rem, 4vh, 3rem)' }}>
        {behance ? (
          <a
            href={behance}
            target="_blank"
            rel="noreferrer"
            className="btn-corners"
            style={{ ...label, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 24px', background: RED, color: 'white', fontSize: 12, letterSpacing: '0.16em', textDecoration: 'none' }}
          >
            View on Behance <ArrowUpRight size={14} strokeWidth={2} />
          </a>
        ) : (
          <span />
        )}
        {next && next.id !== project.id && (
          <Link
            to={`/work/${next.id}`}
            className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#EA3323]"
            style={{ display: 'inline-flex', alignItems: 'baseline', gap: 12, textDecoration: 'none', color: INK }}
          >
            <span style={{ ...label, opacity: 0.5 }}>Next</span>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(22px, 2.4vw, 34px)', fontWeight: 800, letterSpacing: '-0.03em' }}>
              {next.title}
            </span>
            <ArrowRight size={18} strokeWidth={2} color={RED} />
          </Link>
        )}
      </div>
    </main>
  );
}
