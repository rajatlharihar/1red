import { useEffect, useRef } from 'react';
import { services } from '../ServicesGrid';
import { glide, subscribeGlide } from '../scrollGlide';
import { Digit, RED, INK, clamp01, easeInOutSine, smooth, label } from './shared';

/* ─── About, option C: the manifesto (Rajat's idea, 2026-09-30) ────────────
 * "We are simple and we are explosive, with the boxes circling around; we
 * understand your brand with its personality and we make sure to show it."
 *
 * Simple: the headline alone in the middle, red boxes circling it calmly
 * (the only thing that moves on its own here, slow and even).
 * Explosive: on scroll the ring bursts. Every box leaves its orbit along
 * its own outward line and comes back in to its place in a new
 * arrangement, a loose frame round the frame's edges, all on one shared
 * eased curve: a fast expansion that settles, nothing appears or vanishes,
 * and scrolling back runs it in reverse into the orbit.
 * Then the line about personality rises inside the frame the boxes made.
 * Copy is placeholder until Rajat picks the words.
 * ────────────────────────────────────────────────────────────────────────── */

const SECTION_VH = 340;
const HEAD_A = ['Simple on the surface.', 'Explosive underneath.'];
const LINE_B = ['Every brand has a personality.', 'We find it, then make it impossible to ignore.'];

/** Section progress: the burst runs over BURST, headline A leaves over
 *  A_OUT, line B arrives over B_IN. */
const BURST: [number, number] = [0.2, 0.62];
const A_OUT: [number, number] = [0.2, 0.34];
const B_IN: [number, number] = [0.5, 0.68];
/** How far past its settle point a box flies at the height of the burst,
 *  as a share of the frame's half-diagonal. */
const BURST_REACH = 0.3;
/** Calm: one turn of the orbit takes this long (s). */
const ORBIT_PERIOD = 42;

type Box = { s: number; a0: number; r: number; tilt: number; spin: number; sx: number; sy: number };
function rng(seed: number) {
  let n = seed * 9301 + 49297;
  return () => ((n = (n * 9301 + 49297) % 233280) / 233280);
}
/** Sixteen boxes on a ring, sizes varied; each with a settle point on a
 *  loose rectangle round the frame's edges, in the order of its angle, so
 *  no two paths cross on the way out. */
const BOXES: Box[] = (() => {
  const r = rng(7);
  const n = 16;
  return Array.from({ length: n }, (_, i) => {
    const a0 = (i / n) * Math.PI * 2 + (r() - 0.5) * 0.25;
    // Settle: the ray at this angle, meeting a rectangle of half-size 0.43 x 0.36.
    const cx = Math.cos(a0), cy = Math.sin(a0);
    const k = Math.min(0.43 / Math.abs(cx || 1e-6), 0.36 / Math.abs(cy || 1e-6));
    return {
      s: [0.034, 0.05, 0.07, 0.042, 0.092, 0.038, 0.06, 0.046][i % 8],
      a0,
      r: 0.92 + (r() - 0.5) * 0.28,
      tilt: (r() - 0.5) * 40,
      spin: (r() < 0.5 ? -1 : 1) * (200 + r() * 260),
      sx: cx * k + (r() - 0.5) * 0.05,
      sy: cy * k + (r() - 0.5) * 0.05,
    };
  });
})();

export function Manifesto({ reduceMotion }: { reduceMotion: boolean }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const boxRefs = useRef<Array<HTMLDivElement | null>>([]);
  const aRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const bRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const pRef = useRef(reduceMotion ? 1 : 0);

  // Progress from the shared glide.
  useEffect(() => {
    if (reduceMotion) return;
    return subscribeGlide(() => {
      const el = wrapRef.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top + glide.raw;
      const scrollable = (SECTION_VH / 100 - 1) * window.innerHeight;
      pRef.current = clamp01((glide.y - top) / scrollable);
    });
  }, [reduceMotion]);

  // One frame loop while on screen: the calm orbit is time, the burst is
  // scroll. Both feed the same positions.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    let raf = 0;
    let running = false;
    const t0 = performance.now();
    const frame = (now: number) => {
      const vw = window.innerWidth, vh = window.innerHeight;
      const p = pRef.current;
      const e = easeInOutSine(clamp01((p - BURST[0]) / (BURST[1] - BURST[0])));
      const burst = Math.sin(Math.PI * e);
      const turn = reduceMotion ? 0 : ((now - t0) / 1000 / ORBIT_PERIOD) * Math.PI * 2;
      // The orbit's ring: an ellipse round the headline.
      const rx = Math.min(vw * 0.43, vh * 0.8), ry = Math.min(vh * 0.36, vw * 0.24);
      const halfDiag = Math.hypot(vw, vh) / 2;
      BOXES.forEach((b, i) => {
        const node = boxRefs.current[i];
        if (!node) return;
        // The orbit keeps turning only while it is still an orbit.
        const a = b.a0 + turn * (1 - e);
        const ox = Math.cos(a) * rx * b.r, oy = Math.sin(a) * ry * b.r;
        const sx = b.sx * vw, sy = b.sy * vh;
        const dir = Math.atan2(sy, sx);
        const x = ox + (sx - ox) * e + Math.cos(dir) * halfDiag * BURST_REACH * burst;
        const y = oy + (sy - oy) * e + Math.sin(dir) * halfDiag * BURST_REACH * burst;
        // Boxes are drawn at a 100px unit and scaled, so their faces never
        // need re-measuring.
        const k = (b.s * Math.min(vw, vh * 1.6)) / 100;
        node.style.transform = `translate3d(${(x - 50).toFixed(1)}px, ${(y - 50).toFixed(1)}px, 0) scale3d(${k.toFixed(3)}, ${k.toFixed(3)}, ${k.toFixed(3)}) rotateX(${(-24 + b.tilt * (1 - e)).toFixed(1)}deg) rotateY(${(32 + b.spin * e + turn * 30 * (1 - e)).toFixed(1)}deg)`;
      });
      const ta = smooth(A_OUT[0], A_OUT[1], p);
      aRefs.current.forEach((n, i) => n && (n.style.transform = `translateY(${(-ta * 110 - i * ta * 10).toFixed(2)}%)`));
      bRefs.current.forEach((n, i) => {
        if (!n) return;
        const tb = smooth(B_IN[0] + i * 0.04, B_IN[1] + i * 0.04, p);
        n.style.transform = `translateY(${((1 - tb) * 110).toFixed(2)}%)`;
      });
      if (running) raf = requestAnimationFrame(frame);
    };
    const io = new IntersectionObserver(([en]) => {
      if (en.isIntersecting && !running) {
        running = true;
        raf = requestAnimationFrame(frame);
      } else if (!en.isIntersecting) {
        running = false;
        cancelAnimationFrame(raf);
      }
    });
    io.observe(el);
    frame(performance.now());
    return () => {
      io.disconnect();
      running = false;
      cancelAnimationFrame(raf);
    };
  }, [reduceMotion]);

  const face = (tf: string, bg: string): React.CSSProperties => ({ position: 'absolute', inset: 0, background: bg, transform: tf, backfaceVisibility: 'hidden' });
  return (
    <section style={{ background: '#fff', color: INK }}>
      <div ref={wrapRef} style={{ height: reduceMotion ? '100vh' : `${SECTION_VH}vh`, position: 'relative' }}>
        <div style={{ position: reduceMotion ? 'relative' : 'sticky', top: 0, height: '100vh', overflow: 'hidden', perspective: '1400px' }}>
          <div style={{ position: 'absolute', left: '50%', top: '50%', width: 0, height: 0, transformStyle: 'preserve-3d' }}>
            {BOXES.map((b, i) => (
              <div
                key={i}
                ref={(el) => {
                  boxRefs.current[i] = el;
                }}
                style={{ position: 'absolute', left: 0, top: 0, width: 100, height: 100, transformStyle: 'preserve-3d', willChange: 'transform' }}
              >
                {/* A box: front, sides and top, the sides and top a shade apart. */}
                <div style={face('translateZ(50px)', RED)} />
                <div style={face('rotateY(90deg) translateZ(50px)', '#B8251A')} />
                <div style={face('rotateY(-90deg) translateZ(50px)', '#B8251A')} />
                <div style={face('rotateX(90deg) translateZ(50px)', '#F2604F')} />
                <div style={face('rotateX(-90deg) translateZ(50px)', '#9E1F16')} />
                <div style={face('rotateY(180deg) translateZ(50px)', '#C42A1E')} />
              </div>
            ))}
          </div>
          {/* Headline A: simple, in the middle of the ring. */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', pointerEvents: 'none', padding: '0 6vw', zIndex: 2 }}>
            {HEAD_A.map((l, i) => (
              <span key={l} style={{ display: 'block', overflow: 'hidden', paddingBottom: '0.06em' }}>
                <span
                  ref={(el) => {
                    aRefs.current[i] = el;
                  }}
                  style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: 'clamp(38px, 6.4vw, 118px)', fontWeight: 600, letterSpacing: '-0.045em', lineHeight: 1, color: i ? RED : INK }}
                >
                  {l}
                </span>
              </span>
            ))}
          </div>
          {/* Line B: inside the frame the boxes settle into. */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', padding: '0 clamp(1.5rem, 14vw, 16rem)', pointerEvents: 'none', zIndex: 2 }}>
            <span style={{ ...label, display: 'block', overflow: 'hidden', marginBottom: 18 }}>
              <span ref={(el) => (bRefs.current[0] = el)} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, transform: 'translateY(110%)' }}>
                <span style={{ width: 6, height: 6, background: RED, display: 'inline-block' }} />
                What we do with it
              </span>
            </span>
            {LINE_B.map((l, i) => (
              <span key={l} style={{ display: 'block', overflow: 'hidden', paddingBottom: '0.06em' }}>
                <span
                  ref={(el) => {
                    bRefs.current[i + 1] = el;
                  }}
                  style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: i ? 'clamp(26px, 3.4vw, 60px)' : 'clamp(38px, 5.4vw, 100px)', fontWeight: i ? 500 : 700, letterSpacing: '-0.045em', lineHeight: 1.02, color: i ? RED : INK, transform: reduceMotion ? 'none' : 'translateY(110%)' }}
                >
                  {l}
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/** The plain facts under the manifesto: the three disciplines, one line
 *  each, Rajat's numerals. */
export function FactsStrip() {
  return (
    <section style={{ maxWidth: 1400, margin: '0 auto', padding: 'clamp(3rem, 8vh, 5rem) clamp(1rem, 4vw, 5rem)', color: INK }}>
      <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 'clamp(20px, 3vw, 40px)', borderTop: `1px solid ${INK}`, paddingTop: 'clamp(24px, 4vh, 40px)' }}>
        {services.map((s, i) => (
          <div key={s.number} style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
            <div style={{ height: 52, flexShrink: 0 }}>
              <Digit n={i + 1} height="100%" fill={RED} />
            </div>
            <div>
              <span style={{ ...label, opacity: 0.5 }}>{s.eyebrow}</span>
              <h3 style={{ margin: '8px 0 0', fontFamily: 'var(--font-sans)', fontSize: 'clamp(20px, 1.7vw, 26px)', fontWeight: 700, letterSpacing: '-0.03em' }}>{s.title}</h3>
              <p style={{ margin: '8px 0 0', fontSize: 15, lineHeight: 1.5, opacity: 0.6 }}>{s.description.split('. ')[0]}.</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
