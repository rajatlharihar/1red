import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';
import { glide, subscribeGlide } from '../scrollGlide';

/* ─── Into the team ────────────────────────────────────────────────────────
 * The forward move continues: the studio's line-art team film starts as a
 * small framed tile standing in the same depth stage as the process cards,
 * grows as the camera closes on it until it is the whole frame, and holds
 * there for a beat with "our team" set over it. One continuous move: the
 * tile's size and the frame's size are the same thing, scaled by depth.
 * ────────────────────────────────────────────────────────────────────────── */

const INK = '#0A0A0A';
const BG = '#FFFFFF';
const CLIP = '/videos/Fg-01_3.mp4';
const POSTER = '/images/team-poster.jpg';

const SECTION_VH = 280;
/** The lens, as in ProcessSpace. */
const P = 1200;
/** Tile size at the start, as a share of the frame; full-bleed is 1. */
const START_SCALE = 0.3;
const START_DEPTH = P / START_SCALE - P;
/** Section progress at which the tile fills the frame; the rest is the hold. */
const ARRIVE_P = 0.68;
/** The words rise on this window of progress. */
const TEXT_FROM = 0.5;
const TEXT_TO = 0.72;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;

export function TeamZoom() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const tileRef = useRef<HTMLDivElement>(null);
  const wordsRef = useRef<HTMLSpanElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const reduceMotion = useReducedMotion() ?? false;

  // The clip runs only while the section is on screen.
  useEffect(() => {
    const v = videoRef.current;
    if (!v || reduceMotion) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) v.play().catch(() => {});
        else v.pause();
      },
      { threshold: 0.1 }
    );
    io.observe(v);
    return () => io.disconnect();
  }, [reduceMotion]);

  useEffect(() => {
    if (reduceMotion) return;
    return subscribeGlide(() => {
      const el = wrapRef.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top + glide.raw;
      const scrollable = (SECTION_VH / 100 - 1) * window.innerHeight;
      if (scrollable <= 0) return;
      const p = clamp01((glide.y - top) / scrollable);
      const depth = START_DEPTH * (1 - easeInOutSine(clamp01(p / ARRIVE_P)));
      if (tileRef.current) {
        tileRef.current.style.transform = `translate3d(0, 0, ${(-depth).toFixed(1)}px)`;
        // The hairline frame belongs to the tile; it goes as the tile
        // becomes the frame itself.
        tileRef.current.style.borderColor = `rgba(10,10,10,${(1 - smooth(0.85, 1, p / ARRIVE_P)).toFixed(3)})`;
      }
      if (wordsRef.current) {
        const t = smooth(TEXT_FROM, TEXT_TO, p);
        wordsRef.current.style.transform = `translateY(${((1 - t) * 110).toFixed(2)}%)`;
      }
    });
  }, [reduceMotion]);

  const words = (
    <div
      style={{
        position: 'absolute',
        left: 'clamp(1.5rem, 6vw, 8rem)',
        top: '50%',
        transform: 'translateY(-50%)',
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 2,
      }}
    >
      <span
        ref={wordsRef}
        style={{
          display: 'block',
          fontFamily: 'var(--font-sans)',
          fontStyle: 'italic',
          fontSize: 'clamp(56px, 11vw, 200px)',
          fontWeight: 700,
          letterSpacing: '-0.05em',
          lineHeight: 1,
          color: INK,
          paddingRight: '0.1em',
          transform: reduceMotion ? 'none' : 'translateY(110%)',
        }}
      >
        our team
      </span>
    </div>
  );

  if (reduceMotion) {
    return (
      <section style={{ position: 'relative', height: '100vh', background: BG, overflow: 'hidden' }}>
        <img src={POSTER} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        {words}
      </section>
    );
  }

  return (
    <section style={{ position: 'relative', background: BG }}>
      <div ref={wrapRef} style={{ height: `${SECTION_VH}vh`, position: 'relative' }}>
        <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden', perspective: `${P}px`, perspectiveOrigin: '50% 50%' }}>
          <div
            ref={tileRef}
            style={{
              position: 'absolute',
              inset: 0,
              boxSizing: 'border-box',
              border: `1px solid ${INK}`,
              background: BG,
              overflow: 'hidden',
              willChange: 'transform',
              transform: `translate3d(0, 0, ${-START_DEPTH}px)`,
            }}
          >
            <video
              ref={videoRef}
              src={CLIP}
              poster={POSTER}
              muted
              loop
              playsInline
              preload="metadata"
              style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          {words}
        </div>
      </div>
    </section>
  );
}
