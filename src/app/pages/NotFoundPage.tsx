import { useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { RED, INK, label } from '../components/about/shared';
import { FillLink } from '../components/home/FillLink';

/* ─── 404: red-acted ───────────────────────────────────────────────────────
 * The missing page is "classified": the key words sit under red bars that
 * lift on hover or tap. Twelve red blocks in a 3x4 grid shy away from the
 * cursor on springs (no bounce), the site's box motif made skittish.
 * ────────────────────────────────────────────────────────────────────────── */

function Redacted({ children }: { children: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={() => setOpen((o) => !o)}
      style={{ position: 'relative', display: 'inline-block', cursor: 'pointer' }}
    >
      {children}
      <motion.span
        aria-hidden
        animate={{ scaleX: open ? 0 : 1 }}
        transition={{ type: 'spring', bounce: 0, duration: 0.45 }}
        style={{ position: 'absolute', left: '-0.06em', right: '-0.06em', top: '0.12em', bottom: '0.06em', background: RED, transformOrigin: 'right center' }}
      />
    </span>
  );
}

export function NotFoundPage() {
  const reduce = !!useReducedMotion();
  const gridRef = useRef<HTMLDivElement>(null);
  const [m, setM] = useState<{ x: number; y: number } | null>(null);
  const cells = Array.from({ length: 12 }, (_, i) => i);

  return (
    <section
      onMouseMove={(e) => {
        const r = gridRef.current?.getBoundingClientRect();
        if (r) setM({ x: e.clientX - r.left, y: e.clientY - r.top });
      }}
      onMouseLeave={() => setM(null)}
      style={{ minHeight: '100vh', background: '#FFFFFF', color: INK, padding: 'clamp(7rem, 16vh, 10rem) clamp(1rem, 4vw, 5rem) 4rem', boxSizing: 'border-box' }}
    >
      <div style={{ maxWidth: 1400, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))', gap: 'clamp(2rem, 6vw, 6rem)', alignItems: 'center' }}>
        <div>
          <span style={{ ...label, display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <span style={{ width: 6, height: 6, background: RED, display: 'inline-block' }} />
            Error 404
          </span>
          <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(44px, 6.6vw, 116px)', fontWeight: 500, letterSpacing: '-0.045em', lineHeight: 0.95, margin: 0 }}>
            This page has
            <br />
            been <span style={{ color: RED }}>red</span>‑acted.
          </h1>
          <p style={{ fontSize: 'clamp(16px, 1.4vw, 22px)', lineHeight: 1.5, marginTop: 28, maxWidth: 520 }}>
            Either it <Redacted>never existed</Redacted>, or it was so <Redacted>grey</Redacted> we had to take it down. Hover the bars if you must know.
          </p>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 36 }}>
            <FillLink to="/" icon={<ArrowUpRight size={15} strokeWidth={2} />}>Take me home</FillLink>
            <FillLink to="/work" outline>See the work instead</FillLink>
          </div>
        </div>
        <div ref={gridRef} aria-hidden style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'clamp(8px, 1.2vw, 16px)', maxWidth: 520, width: '100%', justifySelf: 'center' }}>
          {cells.map((i) => {
            const size = 520 / 4;
            const cx = (i % 4) * size + size / 2;
            const cy = Math.floor(i / 4) * size + size / 2;
            let dx = 0, dy = 0, rot = 0;
            if (m && !reduce) {
              const vx = cx - m.x, vy = cy - m.y;
              const d = Math.hypot(vx, vy) || 1;
              const push = Math.max(0, 1 - d / 260) * 70;
              dx = (vx / d) * push;
              dy = (vy / d) * push;
              rot = (vx / d) * push * 0.4;
            }
            return (
              <motion.div
                key={i}
                animate={{ x: dx, y: dy, rotate: rot }}
                transition={{ type: 'spring', bounce: 0, duration: 0.6 }}
                style={{ aspectRatio: '1', background: i === 5 ? 'transparent' : RED, border: i === 5 ? `2px dashed ${RED}` : 'none', borderRadius: i % 3 === 0 ? '3px 3px 3px 38%' : 3 }}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
