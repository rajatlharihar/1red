import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, ArrowRight, ArrowUpRight, X } from 'lucide-react';
import { lockScroll } from '../components/SmoothScroll';
import { WORKS, WORK_FILTERS, type WorkFilter, type WorkPiece } from '../data/works';
import { InkCard, InkRule, Stamp, HandNote, Prop, TILTS, paperTiles, CREAM } from '../components/paper/Paper';

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

const RED = '#EB3F43';
const INK = 'rgb(10,10,10)';
const PAPER = CREAM;
const EASE = [0.22, 1, 0.36, 1] as const;
const GLIDE = { type: 'spring', bounce: 0, duration: 0.6 } as const;

const label: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.24em',
  textTransform: 'uppercase',
};
const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#EB3F43]';

const SLUG: Record<string, WorkFilter> = Object.fromEntries(WORK_FILTERS.map((f) => [f.toLowerCase().replace(/\s+/g, '-'), f]));
const slugOf = (f: WorkFilter) => f.toLowerCase().replace(/\s+/g, '-');

/** Where a pointer can hover, grid films play on hover only: a screen of
 *  films all decoding at once halved the frame rate at 2560 wide. On touch
 *  they play while mostly in view. */
const canHover = typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches;

/** A piece's film, muted and looped. Before it plays it shows the frame at
 *  `still` (a media fragment), so the tile is never blank. `active`: the
 *  grid's hover; undefined in the lightbox, where it plays while shown. */
function Film({ piece, fit, autoPlay = false, active }: { piece: Extract<WorkPiece, { kind: 'video' }>; fit: 'cover' | 'contain'; autoPlay?: boolean; active?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const hoverMode = active !== undefined && canHover;
  useEffect(() => {
    const v = ref.current;
    if (!v || !hoverMode) return;
    if (active) v.play().catch(() => {});
    else v.pause();
  }, [active, hoverMode]);
  useEffect(() => {
    const v = ref.current;
    if (!v || hoverMode) return;
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause()), { threshold: active === undefined ? 0.2 : 0.7 });
    io.observe(v);
    return () => io.disconnect();
  }, [hoverMode, active]);
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

function Media({ piece, fit, eager = false, active }: { piece: WorkPiece; fit: 'cover' | 'contain'; eager?: boolean; active?: boolean }) {
  if (piece.kind === 'video') return <Film piece={piece} fit={fit} autoPlay={fit === 'contain'} active={active} />;
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
  return <Stamp on style={{ fontSize: 12, padding: '3px 8px 2px', transform: 'rotate(-4deg)' }}>Case study</Stamp>;
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
        {/* A card on the table (2026-10-17): ink border, a little turned,
            lifts off on hover like the red flag cards. */}
        <InkCard tilt={TILTS[index % TILTS.length]} lift={hover && !reduceMotion}>
          <div style={{ position: 'relative', aspectRatio: '4 / 3', overflow: 'hidden', background: PAPER, border: `1.2px solid ${INK}` }}>
            <Media piece={piece} fit="cover" eager={index < 6} active={hover} />
            {piece.caseStudy && (
              <span style={{ position: 'absolute', top: 10, left: 10 }}>
                <CaseTag />
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, padding: '12px 4px 2px' }}>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(16px, 1.3vw, 20px)', fontWeight: 600, letterSpacing: '-0.02em' }}>
              {piece.client} <span style={{ fontWeight: 400, opacity: 0.6 }}>{piece.title}</span>
            </span>
            <HandNote size={15} style={{ whiteSpace: 'nowrap' }}>{piece.category}</HandNote>
          </div>
        </InkCard>
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
    lockScroll(true);
    return () => {
      window.removeEventListener('keydown', onKey);
      html.style.overflow = prev;
      lockScroll(false);
    };
  }, [onClose, onStep]);

  const arrow: React.CSSProperties = {
    width: 48,
    height: 48,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255,255,255,0.9)',
    border: `1.6px solid ${INK}`,
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
        background: 'rgba(239,232,218,0.96)',
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
    <main style={{ ...paperTiles, position: 'relative', overflowX: 'clip', minHeight: '100vh', color: INK, padding: 'clamp(7rem, 15vh, 10rem) clamp(1rem, 4vw, 5rem) clamp(5rem, 10vh, 8rem)' }}>
      {/* Drawn props on the table, opening screen only. */}
      <Prop src="/images/paper/camera.png" style={{ right: 'clamp(-60px, -2vw, 0px)', top: 'clamp(150px, 17vh, 200px)', width: 'clamp(170px, 17vw, 280px)', transform: 'rotate(8deg)' }} />
      <Prop src="/images/cta/notes.png" style={{ right: 'clamp(220px, 26vw, 420px)', top: 'clamp(150px, 16vh, 190px)', width: 'clamp(90px, 8vw, 130px)', transform: 'rotate(-10deg)' }} />
      <div style={{ maxWidth: 1400, margin: '0 auto', position: 'relative' }}>
        {/* The Swiss row: headline flush-left, label right, one rule. */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24 }}>
          <div className="overflow-hidden">
            <motion.h1
              initial={reduceMotion ? false : { y: '110%' }}
              animate={{ y: 0 }}
              transition={{ duration: 0.8, ease: EASE }}
              style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(40px, 6vw, 104px)', fontWeight: 500, letterSpacing: '-0.035em', lineHeight: 0.98, margin: 0 }}
            >
              Everything,
              <br />
              <span style={{ color: RED }}>all at once.</span>
            </motion.h1>
          </div>
          <HandNote size={22} style={{ flexShrink: 0, marginTop: '0.8em' }}>{WORKS.length} pieces</HandNote>
        </div>
        <InkRule bleed seed={11} style={{ margin: 'clamp(20px, 3vh, 32px) 0' }} />

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
                style={{ flexShrink: 0, border: 'none', background: 'none', padding: '6px 4px', cursor: 'pointer' }}
              >
                <Stamp on={on} style={{ transform: `rotate(${shownKey === c.key ? -2 : 0}deg)`, transition: 'transform 0.25s ease, background 0.25s ease, color 0.25s ease' }}>
                  {c.label} <sup style={{ fontSize: 10 }}>{c.n}</sup>
                </Stamp>
              </button>
            );
          })}
        </div>

        <motion.ul
          layout={!reduceMotion}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))', gap: 'clamp(32px, 3.8vw, 56px) clamp(20px, 2.4vw, 36px)', padding: 0, margin: 'clamp(24px, 4vh, 44px) 0 0' }}
        >
          <AnimatePresence mode="popLayout" initial={true}>
            {list.map((piece, i) => (
              <Tile key={piece.id} piece={piece} index={i} onOpen={() => setOpen(i)} reduceMotion={reduceMotion} />
            ))}
          </AnimatePresence>
        </motion.ul>

        {/* On to the deeper stories. */}
        <InkRule bleed seed={23} style={{ marginTop: 'clamp(4rem, 10vh, 7rem)' }} />
        <div style={{ paddingTop: 'clamp(2rem, 4vh, 3rem)', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 24, flexWrap: 'wrap' }}>
          <p style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: 'clamp(22px, 2.4vw, 36px)', fontWeight: 500, letterSpacing: '-0.03em', color: RED }}>Want the whole story behind a piece?</p>
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
