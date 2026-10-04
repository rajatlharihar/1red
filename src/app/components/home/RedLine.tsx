import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';
import { RED, INK, smooth } from '../about/shared';
import { glide, subscribeGlide } from '../scrollGlide';
import { grainTile } from './Grain';

/* ─── WHO — the one paragraph that says what 1Red is ───────────────────────
 * The hero and the cube are all feeling; until here a visitor still could
 * not say what we do. The paragraph is on screen from the first frame in
 * grey, and the scroll inks it word by word (nothing appears, it only
 * darkens). Underneath, a red box topples its way to the far edge of the
 * frame as you read: the reading position, as an object.
 *
 * 2026-10-04: the poster's box falls out of the bottom of
 * the poster (cube/ProblemCube DROP_VH) and drops in here through the seam
 * as this section rises: gravity in scroll space (the drop grows with the
 * square of the approach), two shrinking bounces as the section pins, then
 * the roll below carries it off the right edge of the page. Big, grainy,
 * with a contact shadow that tightens and darkens as it nears the floor.
 *
 * The box is simulated, not keyframed (Rajat: "real physics"). It is a
 * rigid cube pivoting on an edge: gravity's torque about the pivot holds it
 * on its face until the centre of mass passes over the edge (45 degrees),
 * then pulls it over; on landing it keeps a quarter of its angular speed
 * (the textbook result for a cube rolling onto its next face, from angular
 * momentum about the new edge). The scroll does the pushing: a torque
 * proportional to how far the box is behind the reading position. Scroll
 * back and it topples back the same way.
 * ────────────────────────────────────────────────────────────────────────── */

const SECTION_VH = 300;
/** Pin progress by which the box has finished bouncing and may roll. */
const LAND_P = 0.13;
/** Pin progress by which the drop from the top of the frame reaches the floor. */
const FALL_P = 0.07;
const BEIGE = '#C9BDA4';
const HALF_PI = Math.PI / 2;
/** Gravity term 3g / (2 sqrt2 S), in rad/s^2 for the box's size on screen. */
const G = 70;
/** The scroll's push per unit of lag (in faces), and angular damping. */
const PUSH = 230;
const PUSH_MAX = 260;
const DAMP = 5;
/** A landing keeps this much of the angular speed (cube onto its next face). */
const LANDING = 0.25;

type Word = { t: string; tone?: 'red' | 'beige' };
const COPY: Word[] = [
  ...'1Red is a creative collective from India. Strategists, designers, animators, developers and editors at one table.'.split(' ').map((t) => ({ t })),
  ...'Most brands play it'.split(' ').map((t) => ({ t })),
  { t: 'beige:', tone: 'beige' },
  ...'safe, polite, forgotten by Tuesday. We make yours'.split(' ').map((t) => ({ t })),
  { t: 'the', tone: 'red' },
  { t: 'red', tone: 'red' },
  { t: 'one.', tone: 'red' },
  ...'The logo, the website and the campaign, made by the same people, so they finally sound like the same brand.'.split(' ').map((t) => ({ t })),
];

/** One face of the box: a grain gradient, lit from the top left. */
function face(transform: string, from: string, to: string): React.CSSProperties {
  return {
    position: 'absolute',
    inset: 0,
    transform,
    backgroundImage: `url(${grainTile()}), linear-gradient(150deg, ${from}, ${to})`,
    backgroundSize: '192px 192px, 100% 100%',
    backgroundBlendMode: 'soft-light, normal',
    backfaceVisibility: 'hidden',
  };
}

export function RedLine() {
  const reduceMotion = !!useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const moverRef = useRef<HTMLDivElement>(null);
  const cubeRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const sizeRef = useRef(200);
  const geo = useRef({ x0: 0, floor: 0, vw: 1440, vh: 900 });
  const fallRef = useRef({ a: 0, p: 0 }); // approach 0..1, pin progress 0..1
  const targetRef = useRef(0); // roll target, 0..1 of the way off the page
  const sim = useRef({ k: 0, th: 0, w: 0 });

  // Approach + pin progress straight from the glide (usePinned clamps the
  // approach away, and the fall needs it).
  useEffect(() => {
    return subscribeGlide(() => {
      const el = wrapRef.current;
      if (!el) return;
      const vh = window.innerHeight;
      const top = el.getBoundingClientRect().top + glide.raw;
      const rel = glide.y - top; // px scrolled into the section
      const scrollable = (SECTION_VH / 100 - 1) * vh;
      const a = Math.max(0, Math.min(1, 1 + rel / vh));
      const p = Math.max(0, Math.min(1, rel / scrollable));
      fallRef.current = { a, p };
      const read = smooth(0.04, 0.8, p);
      const r = read * (COPY.length + 2);
      wordRefs.current.forEach((w, i) => {
        if (!w) return;
        const k = Math.max(0, Math.min(1, r - i));
        w.style.opacity = reduceMotion ? '1' : (0.16 + 0.84 * k).toFixed(3);
      });
      targetRef.current = smooth(LAND_P + 0.02, 0.92, p);
    });
  }, [reduceMotion]);

  useEffect(() => {
    const layout = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const s = Math.round(Math.max(56, Math.min(vw * 0.065, 104)));
      sizeRef.current = s;
      // Starts near the left edge so it has the whole width to roll across.
      geo.current = { x0: Math.round(vw * (vw < 768 ? 0.08 : 0.06)), floor: Math.round(vh * 0.86 - s), vw, vh };
      const c = cubeRef.current;
      if (c) {
        c.style.width = c.style.height = `${s}px`;
        c.querySelectorAll<HTMLDivElement>('[data-face]').forEach((f) => {
          f.style.transform = f.dataset.face!.replace(/H/g, `${s / 2}px`);
        });
      }
      if (shadowRef.current) {
        shadowRef.current.style.width = `${s * 1.3}px`;
        shadowRef.current.style.top = `${vh * 0.86 - s * 0.12}px`;
      }
    };
    layout();
    window.addEventListener('resize', layout);

    /** Faces to roll until the box has fully left the page on the right. */
    const faces = () => Math.ceil((geo.current.vw - geo.current.x0) / sizeRef.current) + 1;

    const draw = () => {
      const { k, th } = sim.current;
      const s = sizeRef.current;
      const { x0, floor } = geo.current;
      const { a, p } = fallRef.current;
      // Fall: from just above the seam (clipped by the section's top edge)
      // to the floor, accelerating; then two bounces as it pins.
      let y: number;
      // Hidden above the frame until the section has pinned (so no edge but
      // the screen's own ever crosses it), then a gravity drop from the top
      // of the frame, two shrinking bounces, and rest.
      void a;
      const top0 = -s - 24;
      if (reduceMotion) y = floor;
      else if (p <= 0) y = top0;
      else if (p < FALL_P) {
        const t = p / FALL_P;
        y = top0 + (floor - top0) * t * t;
      } else if (p < LAND_P) {
        const t = (p - FALL_P) / (LAND_P - FALL_P);
        const hop = t < 0.64 ? 0.42 * Math.sin((t / 0.64) * Math.PI) : 0.12 * Math.sin(((t - 0.64) / 0.36) * Math.PI);
        y = floor - hop * s;
      } else y = floor;
      const lift = floor - y; // px above the floor
      if (moverRef.current) moverRef.current.style.transform = `translate3d(${x0 + k * s}px,${y}px,0)`;
      if (cubeRef.current) {
        cubeRef.current.style.transformOrigin = th >= 0 ? `100% 100% 0` : `0% 100% 0`;
        cubeRef.current.style.transform = `rotateZ(${th}rad)`;
      }
      if (shadowRef.current) {
        // Under the centre of mass; tighter and darker the nearer the box is.
        const pivot = x0 + k * s + (th >= 0 ? s : 0);
        const cx = pivot + (th >= 0 ? -1 : 1) * (s / Math.SQRT2) * Math.cos(Math.PI / 4 + Math.abs(th));
        const near = Math.max(0, 1 - lift / (geo.current.vh * 0.6));
        shadowRef.current.style.opacity = (near * near).toFixed(3);
        shadowRef.current.style.transform = `translate3d(${(cx - s * 0.65).toFixed(1)}px,0,0) scale(${(0.55 + 0.45 * near).toFixed(3)})`;
      }
    };

    if (reduceMotion) {
      sim.current = { k: 0, th: 0, w: 0 };
      draw();
      return () => window.removeEventListener('resize', layout);
    }

    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      const st = sim.current;
      const n = faces();
      if (st.k > n) st.k = n;
      const landed = fallRef.current.p >= LAND_P;
      for (let i = 0; i < 4; i++) {
        const h = dt / 4;
        const pos = st.k + st.th / HALF_PI;
        const err = (landed ? targetRef.current * n : 0) - pos;
        const push = Math.max(-PUSH_MAX, Math.min(PUSH_MAX, err * PUSH));
        const grav = st.th >= 0 ? G * Math.sin(st.th - Math.PI / 4) : G * Math.sin(st.th + Math.PI / 4);
        const atRest = st.th === 0 && Math.abs(push) < G * Math.SQRT1_2;
        const acc = atRest ? 0 : grav + push - DAMP * st.w;
        st.w = atRest ? 0 : st.w + acc * h;
        st.th += st.w * h;
        if (st.th >= HALF_PI) {
          st.k += 1; st.th -= HALF_PI; st.w *= LANDING;
        } else if (st.th <= -HALF_PI) {
          st.k -= 1; st.th += HALF_PI; st.w *= LANDING;
        }
        if ((st.th < 0 && st.th - st.w * h > 0) || (st.th > 0 && st.th - st.w * h < 0)) {
          if (Math.abs(st.w) < 6) { st.th = 0; st.w = 0; }
        }
        if (st.k <= 0 && st.th < 0) { st.k = 0; st.th = 0; st.w = 0; }
        if (st.k >= n && st.th > 0) { st.k = n; st.th = 0; st.w = 0; }
      }
      draw();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', layout);
    };
  }, [reduceMotion]);

  // Lit from the top left, matched to the poster's red metal: the front
  // mid, the top light, the side dark. Grain in every face.
  const FACES: Array<[string, string, string]> = [
    ['translateZ(H)', '#E8483F', '#A8161C'],
    ['rotateY(180deg) translateZ(H)', '#C92A30', '#8E151B'],
    ['rotateY(90deg) translateZ(H)', '#A51C22', '#6E0D12'],
    ['rotateY(-90deg) translateZ(H)', '#E23A3E', '#A51C22'],
    ['rotateX(90deg) translateZ(H)', '#FF8C80', '#E8483F'],
    ['rotateX(-90deg) translateZ(H)', '#7E1218', '#5E0B10'],
  ];

  return (
    <section ref={wrapRef} aria-label="Who we are" style={{ height: reduceMotion ? 'auto' : `${SECTION_VH}vh`, background: '#FFFFFF', position: 'relative' }}>
      <div style={{ position: reduceMotion ? 'relative' : 'sticky', top: 0, height: reduceMotion ? 'auto' : '100vh', minHeight: reduceMotion ? '100vh' : undefined, overflow: 'hidden' }}>
        <div
          style={{
            position: 'relative',
            padding: 'clamp(6rem, 13vh, 9rem) clamp(1rem, 4vw, 5rem) 0',
            maxWidth: 1400,
            margin: '0 auto',
            boxSizing: 'border-box',
            color: INK,
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'clamp(24px, min(3.4vw, 5.4vh), 60px)',
              fontWeight: 500,
              letterSpacing: '-0.03em',
              lineHeight: 1.12,
              margin: 0,
              maxWidth: '22em',
            }}
          >
            {COPY.map((w, i) => (
              <span key={i}>
                <span
                  ref={(el) => {
                    wordRefs.current[i] = el;
                  }}
                  style={{
                    opacity: reduceMotion ? 1 : 0.16,
                    color: w.tone === 'red' ? RED : w.tone === 'beige' ? BEIGE : INK,
                    textDecoration: w.tone === 'beige' ? 'line-through' : 'none',
                    textDecorationThickness: '0.06em',
                  }}
                >
                  {w.t}
                </span>{' '}
              </span>
            ))}
          </p>
        </div>

        {/* The box and its shadow, in the frame's own pixels. */}
        <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <div ref={shadowRef} style={{ position: 'absolute', left: 0, height: 26, width: 260, borderRadius: '50%', opacity: 0, background: 'radial-gradient(closest-side, rgba(10,10,10,0.3), rgba(10,10,10,0))', transformOrigin: '50% 50%' }} />
          <div style={{ position: 'absolute', inset: 0, perspective: 1600, perspectiveOrigin: '50% 30%' }}>
            <div ref={moverRef} style={{ position: 'absolute', left: 0, top: 0, transformStyle: 'preserve-3d', willChange: 'transform' }}>
              <div style={{ transformStyle: 'preserve-3d', transform: 'rotateX(-12deg) rotateY(-16deg)', transformOrigin: '50% 100% 0' }}>
                <div ref={cubeRef} style={{ position: 'relative', width: 200, height: 200, transformStyle: 'preserve-3d', willChange: 'transform' }}>
                  {FACES.map(([t, a, b]) => (
                    <div key={t} data-face={t} style={face(t.replace(/H/g, '100px'), a, b)} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
