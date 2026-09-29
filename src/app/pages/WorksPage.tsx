import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, ArrowRight, ArrowUpRight, X } from 'lucide-react';
import { WORKS, WORK_FILTERS, type WorkFilter, type WorkPiece } from '../data/works';

/* ─── /work — everything we make, filterable ───────────────────────────────
 * The showcase, as the agencies we studied run theirs (Pentagram,
 * Instrument, Ogilvy): one index of pieces filtered by discipline, where a
 * piece that belongs to a deeper story carries a "Case study" tag. Opening
 * a piece shows it large in a lightbox; arrows and the keyboard step
 * through the current filter.
 *
 * Motion: the heading row is the site's Swiss row (as on the home cube
 * poster and Selected work). Tiles materialise as they enter (opacity, a
 * short rise, a little blur) and glide to their new places when the filter
 * changes (layout animation); nothing appears or vanishes in one frame.
 * The filter is kept in the URL (?f=), so Back returns to the same view.
 * ────────────────────────────────────────────────────────────────────────── */

const RED = '#EA3323';
const INK = 'rgb(10,10,10)';
const PAPER = '#F2EFE8';
const EASE = [0.22, 1, 0.36, 1] as const;
const GLIDE = { type: 'spring', bounce: 0, duration: 0.6 } as const;

const label: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.24em',
  textTransform: 'uppercase',
};
const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#EA3323]';

const SLUG: Record<string, WorkFilter> = Object.fromEntries(WORK_FILTERS.map((f) => [f.toLowerCase().replace(/\s+/g, '-'), f]));
const slugOf = (f: WorkFilter) => f.toLowerCase().replace(/\s+/g, '-');

/** A piece's film, muted and looped, playing only while on screen. Before
 *  it plays it shows the frame at `still` (a media fragment), so the tile
 *  is never blank. */
function Film({ piece, fit, autoPlay = false }: { piece: Extract<WorkPiece, { kind: 'video' }>; fit: 'cover' | 'contain'; autoPlay?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause()), { threshold: 0.2 });
    io.observe(v);
    return () => io.disconnect();
  }, []);
  const t = piece.still != null ? `#t=${piece.still}` : '';
  return (
    <video
      ref={ref}
      muted
      loop
      playsInline
      autoPlay={autoPlay}
      preload="metadata"
      style={{ display: 'block', width: '100%', height: '100%', objectFit: fit, background: PAPER }}
    >
      {piece.webm && <source src={piece.webm + t} type="video/webm" />}
      <source src={piece.mp4 + t} type="video/mp4" />
    </video>
  );
}

function Media({ piece, fit, eager = false }: { piece: WorkPiece; fit: 'cover' | 'contain'; eager?: boolean }) {
  if (piece.kind === 'video') return <Film piece={piece} fit={fit} autoPlay={fit === 'contain'} />;
  return (
    <img
      src={piece.src}
      alt={`${piece.client}, ${piece.title}`}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      style={{ display: 'block', width: '100%', height: '100%', objectFit: fit, objectPosition: fit === 'cover' ? piece.focus ?? 'center' : 'center', background: PAPER }}
    />
  );
}

function CaseTag() {
  return (
    <span
      className="btn-corners"
      style={{ ...label, fontSize: 9, letterSpacing: '0.18em', padding: '5px 9px', background: 'rgba(255,253,251,0.86)', color: RED, border: '1px solid rgba(234,51,35,0.22)', whiteSpace: 'nowrap' }}
    >
      Case study
    </span>
  );
}

function Tile({ piece, index, onOpen, reduceMotion }: { piece: WorkPiece; index: number; onOpen: () => void; reduceMotion: boolean }) {
  const [hover, setHover] = useState(false);
  return (
    <motion.li
      layout={!reduceMotion}
      initial={reduceMotion ? false : { opacity: 0, y: 24, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, filter: 'blur(6px)', transition: { duration: 0.25 } }}
      transition={{ ...GLIDE, opacity: { duration: 0.5, ease: EASE, delay: Math.min(index, 8) * 0.04 }, filter: { duration: 0.5, ease: EASE } }}
      style={{ listStyle: 'none' }}
    >
      <button
        onClick={onOpen}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className={focusRing}
        aria-label={`Open ${piece.client}, ${piece.title}`}
        style={{ display: 'block', width: '100%', padding: 0, border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', color: INK }}
      >
        <div style={{ position: 'relative', aspectRatio: '4 / 3', overflow: 'hidden', background: PAPER }}>
          <motion.div animate={{ scale: hover && !reduceMotion ? 1.035 : 1 }} transition={{ duration: 0.7, ease: EASE }} style={{ position: 'absolute', inset: 0 }}>
            <Media piece={piece} fit="cover" eager={index < 6} />
          </motion.div>
          {piece.caseStudy && (
            <span style={{ position: 'absolute', top: 12, left: 12 }}>
              <CaseTag />
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, padding: '14px 0 0', borderTop: `1px solid ${hover ? RED : 'transparent'}`, transition: 'border-color 300ms ease-out', marginTop: 0 }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(16px, 1.3vw, 20px)', fontWeight: 600, letterSpacing: '-0.02em' }}>
            {piece.client} <span style={{ fontWeight: 400, opacity: 0.5 }}>{piece.title}</span>
          </span>
          <span style={{ ...label, fontSize: 9, opacity: 0.45, whiteSpace: 'nowrap' }}>{piece.category}</span>
        </div>
      </button>
    </motion.li>
  );
}

function Lightbox({ list, index, onClose, onStep }: { list: WorkPiece[]; index: number; onClose: () => void; onStep: (d: number) => void }) {
  const piece = list[index];
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onStep(1);
      if (e.key === 'ArrowLeft') onStep(-1);
    };
    window.addEventListener('keydown', onKey);
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      html.style.overflow = prev;
    };
  }, [onClose, onStep]);

  const arrow: React.CSSProperties = {
    width: 48,
    height: 48,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255,253,251,0.9)',
    border: '1px solid rgba(234,51,35,0.16)',
    cursor: 'pointer',
    color: INK,
  };
  const aspect = piece.kind === 'video' ? piece.aspect : undefined;

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`${piece.client}, ${piece.title}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: EASE }}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 90,
        background: 'rgba(247,244,238,0.94)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(64px, 9vh, 96px) clamp(16px, 6vw, 96px) clamp(24px, 4vh, 40px)',
        gap: 'clamp(14px, 2.4vh, 24px)',
      }}
    >
      <button onClick={onClose} aria-label="Close" className={`${focusRing} btn-corners`} style={{ ...arrow, position: 'absolute', top: 'clamp(14px, 2.6vw, 26px)', right: 'clamp(14px, 2.6vw, 26px)' }}>
        <X size={18} strokeWidth={1.75} />
      </button>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={piece.id}
          initial={{ opacity: 0, scale: 0.97, filter: 'blur(6px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, scale: 0.985, filter: 'blur(4px)' }}
          transition={{ duration: 0.4, ease: EASE }}
          onClick={(e) => e.stopPropagation()}
          style={{
            flex: '1 1 auto',
            minHeight: 0,
            width: '100%',
            maxWidth: 1400,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ height: '100%', maxWidth: '100%', aspectRatio: aspect, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 30px 70px rgba(0,0,0,0.10)' }}>
            {piece.kind === 'video' ? (
              <Film piece={piece} fit="contain" autoPlay />
            ) : (
              <img src={piece.src} alt={`${piece.client}, ${piece.title}`} style={{ display: 'block', maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', background: PAPER }} />
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 1400, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', color: INK }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(18px, 1.6vw, 24px)', fontWeight: 600, letterSpacing: '-0.02em' }}>
            {piece.client} <span style={{ fontWeight: 400, opacity: 0.5 }}>{piece.title}</span>
          </span>
          <span style={{ ...label, opacity: 0.45 }}>{piece.category}</span>
          <span style={{ ...label, opacity: 0.3 }}>
            {index + 1} / {list.length}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {piece.caseStudy && (
            <Link
              to={`/case-studies/${piece.caseStudy}`}
              className={`${focusRing} btn-corners`}
              style={{ ...label, fontSize: 11, letterSpacing: '0.16em', display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 20px', background: RED, color: 'white', textDecoration: 'none' }}
            >
              View case study <ArrowUpRight size={14} strokeWidth={2} />
            </Link>
          )}
          <button onClick={() => onStep(-1)} aria-label="Previous" className={`${focusRing} btn-corners`} style={arrow}>
            <ArrowLeft size={18} strokeWidth={1.75} />
          </button>
          <button onClick={() => onStep(1)} aria-label="Next" className={`${focusRing} btn-corners`} style={arrow}>
            <ArrowRight size={18} strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export function WorksPage() {
  const reduceMotion = useReducedMotion() ?? false;
  const [params, setParams] = useSearchParams();
  const active: WorkFilter | null = SLUG[params.get('f') ?? ''] ?? null;
  const list = useMemo(() => (active ? WORKS.filter((w) => w.category === active) : WORKS), [active]);
  const [open, setOpen] = useState<number | null>(null);
  const [hoverChip, setHoverChip] = useState<string | null>(null);

  const setFilter = (f: WorkFilter | null) => {
    setOpen(null);
    // Replace, not push: a filter is a view of this page, not a new page.
    setParams(f ? { f: slugOf(f) } : {}, { replace: true, preventScrollReset: true });
  };
  const close = useCallback(() => setOpen(null), []);
  const step = useCallback((d: number) => setOpen((i) => (i == null ? i : (i + d + list.length) % list.length)), [list.length]);

  const chips: Array<{ key: string; label: string; f: WorkFilter | null; n: number }> = [
    { key: 'all', label: 'All', f: null, n: WORKS.length },
    ...WORK_FILTERS.map((f) => ({ key: slugOf(f), label: f, f, n: WORKS.filter((w) => w.category === f).length })),
  ];
  const activeKey = active ? slugOf(active) : 'all';
  const shownKey = hoverChip ?? activeKey;

  return (
    <main style={{ minHeight: '100vh', background: '#fff', color: INK, padding: 'clamp(7rem, 15vh, 10rem) clamp(1rem, 4vw, 5rem) clamp(5rem, 10vh, 8rem)' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        {/* The Swiss row: headline flush-left, label right, one rule. */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24 }}>
          <div className="overflow-hidden">
            <motion.h1
              initial={reduceMotion ? false : { y: '110%' }}
              animate={{ y: 0 }}
              transition={{ duration: 0.8, ease: EASE }}
              style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(40px, 6vw, 104px)', fontWeight: 500, letterSpacing: '-0.035em', lineHeight: 0.98, margin: 0 }}
            >
              Everything
              <br />
              we make.
            </motion.h1>
          </div>
          <div className="overflow-hidden" style={{ flexShrink: 0, paddingTop: '0.6em' }}>
            <motion.p initial={reduceMotion ? false : { y: '110%' }} animate={{ y: 0 }} transition={{ duration: 0.6, ease: EASE, delay: 0.1 }} style={{ ...label, margin: 0, textAlign: 'right', lineHeight: 1.6 }}>
              Work
              <br />
              {WORKS.length} pieces
            </motion.p>
          </div>
        </div>
        <motion.div
          initial={reduceMotion ? false : { scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.9, delay: 0.2, ease: EASE }}
          style={{ height: 1, background: INK, transformOrigin: 'left center', margin: 'clamp(20px, 3vh, 32px) 0' }}
        />

        {/* Filters: one magnetic indicator slides between them, as in the nav. */}
        <div role="toolbar" aria-label="Filter work" onMouseLeave={() => setHoverChip(null)} style={{ display: 'flex', gap: 4, overflowX: 'auto', margin: '0 calc(-1 * clamp(1rem, 4vw, 5rem))', padding: '4px clamp(1rem, 4vw, 5rem)', scrollbarWidth: 'none' }}>
          {chips.map((c) => {
            const on = c.key === activeKey;
            return (
              <button
                key={c.key}
                onClick={() => setFilter(c.f)}
                onMouseEnter={() => setHoverChip(c.key)}
                aria-pressed={on}
                className={focusRing}
                style={{ position: 'relative', flexShrink: 0, border: 'none', background: 'none', padding: '11px 16px', cursor: 'pointer', color: INK }}
              >
                {shownKey === c.key && (
                  <motion.span
                    layoutId="work-filter"
                    className="btn-corners"
                    transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
                    style={{ position: 'absolute', inset: 0, background: on ? 'rgba(234,51,35,0.08)' : 'rgba(0,0,0,0.045)', border: on ? '1px solid rgba(234,51,35,0.2)' : '1px solid transparent' }}
                  />
                )}
                <span style={{ position: 'relative', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap', opacity: on ? 1 : 0.6, transition: 'opacity 200ms ease-out' }}>
                  {c.label} <sup style={{ fontSize: 9, color: on ? RED : 'inherit', opacity: on ? 1 : 0.6 }}>{c.n}</sup>
                </span>
              </button>
            );
          })}
        </div>

        <motion.ul
          layout={!reduceMotion}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))', gap: 'clamp(28px, 3.4vw, 48px) clamp(16px, 2vw, 28px)', padding: 0, margin: 'clamp(24px, 4vh, 44px) 0 0' }}
        >
          <AnimatePresence mode="popLayout" initial={true}>
            {list.map((piece, i) => (
              <Tile key={piece.id} piece={piece} index={i} onOpen={() => setOpen(i)} reduceMotion={reduceMotion} />
            ))}
          </AnimatePresence>
        </motion.ul>

        {/* On to the deeper stories. */}
        <div style={{ marginTop: 'clamp(4rem, 10vh, 7rem)', borderTop: '1px solid rgba(10,10,10,0.12)', paddingTop: 'clamp(2rem, 4vh, 3rem)', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 24, flexWrap: 'wrap' }}>
          <p style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: 'clamp(22px, 2.4vw, 36px)', fontWeight: 500, letterSpacing: '-0.03em' }}>Want the whole story behind a piece?</p>
          <Link to="/case-studies" className={focusRing} style={{ display: 'inline-flex', alignItems: 'baseline', gap: 12, textDecoration: 'none', color: INK }}>
            <span style={{ ...label, opacity: 0.5 }}>Read</span>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(22px, 2.4vw, 34px)', fontWeight: 800, letterSpacing: '-0.03em' }}>Case studies</span>
            <ArrowRight size={18} strokeWidth={2} color={RED} />
          </Link>
        </div>
      </div>

      <AnimatePresence>{open != null && list[open] && <Lightbox key="lightbox" list={list} index={open} onClose={close} onStep={step} />}</AnimatePresence>
    </main>
  );
}
