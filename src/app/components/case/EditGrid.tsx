import { useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { Tile } from '../../data/caseStories';

/* ─── The edit: justified rows ─────────────────────────────────────────────
 * Each row's tiles sit side by side at their own aspect: flex-grow is the
 * aspect ratio, so the row comes out one height with no crop. On a phone
 * every tile takes the full width. Films play only while on screen.
 * ────────────────────────────────────────────────────────────────────────── */

const EASE = [0.22, 1, 0.36, 1] as const;
const GREY = '#F3F3F3';

function Film({ base, alt }: { base: string; alt: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause()), { threshold: 0.15 });
    io.observe(v);
    return () => io.disconnect();
  }, []);
  return (
    <video ref={ref} muted loop playsInline preload="metadata" aria-label={alt} style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover', background: GREY }}>
      <source src={`${base}.webm`} type="video/webm" />
      <source src={`${base}.mp4`} type="video/mp4" />
    </video>
  );
}

export function EditRow({ tiles, first }: { tiles: Tile[]; first?: boolean }) {
  const reduce = !!useReducedMotion();
  return (
    <div className="case-row" style={{ display: 'flex', gap: 'clamp(8px, 1vw, 14px)' }}>
      {tiles.map((t, i) => {
        const ar = t.w / t.h;
        return (
          <motion.figure
            key={i}
            className="case-tile"
            initial={reduce ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-6% 0px' }}
            transition={{ duration: 0.8, ease: EASE, delay: i * 0.06 }}
            style={{ margin: 0, flex: `${ar} 1 0`, aspectRatio: `${t.w} / ${t.h}`, borderRadius: 6, overflow: 'hidden', background: GREY }}
          >
            {'img' in t ? (
              <img src={t.img} alt={t.alt} loading={first ? 'eager' : 'lazy'} decoding="async" style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <Film base={t.film} alt={t.alt} />
            )}
          </motion.figure>
        );
      })}
    </div>
  );
}
