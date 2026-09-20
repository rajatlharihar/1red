import { useEffect, useRef } from 'react';
import { useParams, Link, Navigate } from 'react-router';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import projectsData from '../data/projects.json';
import workImages from '../data/workImages.json';

/* ─── A project's own page ─────────────────────────────────────────────────
 * Presented the way Rajat presents it on Behance (R28): the title, its
 * category and year and one line at the top, then the presentation images
 * stacked at full content width one after another, and "View on Behance"
 * at the end. The modules are his own, fetched from his Behance projects
 * into public/work/<slug>/ in the project's order (plates as the 1400-wide
 * webp Behance serves; films, which Behance hosts on Vimeo, pulled from
 * their streams and transcoded to 1080p mp4 + webm, muted), listed in
 * data/workImages.json, stacked edge to edge with no gap, each
 * fading in as it comes into view (a fade, not a lift, so no seam ever
 * opens between plates). Below the fold they load lazily.
 * ────────────────────────────────────────────────────────────────────────── */

const RED = '#EA3323';
const INK = 'rgb(10,10,10)';
const EASE = [0.22, 1, 0.36, 1] as const;

type Project = (typeof projectsData)[0] & { hidden?: boolean };
type Module =
  | { type: 'image'; src: string }
  | { type: 'video'; mp4: string; webm: string; aspect: string; title?: string }
  | { type: 'embed'; src: string };
/** Every module of the Behance project, in its order: plates and films. */
const MODULES = workImages as Record<string, Module[]>;

/** The projects that are shown: the hidden ones stay in the data. */
const shown = (projectsData as Project[]).filter((p) => !p.hidden);

const label: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
};

function Plate({ m, alt, i, reduceMotion }: { m: Module; alt: string; i: number; reduceMotion: boolean }) {
  return (
    <motion.figure
      // Fade only: a translate would open a seam between plates mid-scroll.
      initial={reduceMotion ? false : { opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-8% 0px' }}
      transition={{ duration: 0.9, ease: EASE }}
      style={{ margin: 0 }}
    >
      {m.type === 'image' && (
        <img src={m.src} alt={alt} loading={i < 2 ? 'eager' : 'lazy'} decoding="async" style={{ display: 'block', width: '100%', height: 'auto', background: '#F2EFE8' }} />
      )}
      {m.type === 'video' && <Film m={m} />}
      {m.type === 'embed' && (
        <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', background: '#F2EFE8' }}>
          <iframe src={m.src} title={alt} loading="lazy" allow="autoplay; fullscreen" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }} />
        </div>
      )}
    </motion.figure>
  );
}

/** One of the project's films, inline, muted and looped, playing only
 *  while on screen; a Behance video module as it sits in the sequence. */
function Film({ m }: { m: Extract<Module, { type: 'video' }> }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) v.play().catch(() => {});
        else v.pause();
      },
      { threshold: 0.15 }
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);
  return (
    <video ref={ref} muted loop playsInline preload="metadata" style={{ display: 'block', width: '100%', height: 'auto', aspectRatio: m.aspect, background: '#F2EFE8' }}>
      <source src={m.webm} type="video/webm" />
      <source src={m.mp4} type="video/mp4" />
    </video>
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

  const modules = MODULES[project.id] ?? [];
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
      <div style={{ maxWidth: 1100, margin: 'clamp(2.5rem, 6vh, 4rem) auto 0', padding: '0 clamp(1.5rem, 4vw, 5rem)', display: 'flex', flexDirection: 'column', gap: 0 }}>
        {modules.map((m, i) => (
          <Plate key={i} m={m} alt={`${project.title}, ${i + 1} of ${modules.length}`} i={i} reduceMotion={reduceMotion} />
        ))}
        {modules.length === 0 && project.video && (
          <video src={project.video} muted loop autoPlay playsInline preload="auto" style={{ display: 'block', width: '100%', aspectRatio: '16 / 9', objectFit: 'cover', background: '#F2EFE8' }} />
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
