import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useReducedMotion } from 'motion/react';
import { CubeAssembly, CubeLighting, CAM_Z, FOV, HERO_DONE } from './CubeAssembly';
import { MarkOccluder } from './MarkOccluder';
import { SCROLL_VH as HERO_VH, HANDOFF_P, TAIL_VH, budgetDpr } from '../hero/StudioEntrance';
import { glide, subscribeGlide } from '../scrollGlide';

/* ─── Section 2: down a tunnel, then many cubes become one ─────────────────
 * No hand-off screen. The section is pulled up over the end of the hero so
 * it pins while the zoom through the "e" is still running: the tunnel's
 * vanishing point sits in the gap over the splitting red, the hero goes
 * white underneath while the rings of cubes stream past, and then the
 * tunnel stops and its cubes gather and lock into one box. Progress comes
 * from the same glided scroll position as the hero, so the two stay in step
 * at any scroll speed, with no React re-renders.
 *
 * Behind the "e", not over it: this canvas draws a depth-only copy of the
 * mark at the hero's own projection (`MarkOccluder`), so the mark hides the
 * tunnel and its white backdrop with its true outline and every gap in it
 * reveals them. The hero's red shows through the transparent pixels.
 * ────────────────────────────────────────────────────────────────────────── */

/* Pinned scroll: two flicks at most (Shrikar, 2026-09-30; it was 390vh).
   The timeline below was tuned at 390vh, so the seam with the hero keeps
   that rate: `sectionP` starts at it and eases up to a faster, steady rate
   once the "e" blocks are gone, instead of scaling everything uniformly. */
const SECTION_VH = 250; // 2026-10-07: Rajat, smoother, show every step (160 was too harsh; 210, 280 before)
/** Pinned tail after the poster: the box falls out of the frame's bottom,
 *  into the next section (home/RedLine.tsx catches it). */
export const DROP_VH = 90;
/** The finished poster holds, pinned, before the box drops: the page scrolls
 *  on but the frame stays put (Rajat, 2026-10-06: "come and hold"). */
const HOLD_VH = 80;
/** The last frame holds while the red flags card slides up over it
 *  (RedFlags pulls itself up by 100vh). */
const COVER_VH = 100;
/** Then the reading stretch: "who we are" inks in while the same box rolls
 *  off the frame's right edge (this was home/RedLine.tsx, merged in so the
 *  box never leaves its own renderer). */
export const ROLL_VH = 240;
const GREY = '#9A9A9A';
type Word = { t: string; tone?: 'red' | 'grey' };
const WHO: Word[] = [
  ...'1Red is a creative agency from India. Strategists, designers, animators, developers, and editors, all at one table.'.split(' ').map((t) => ({ t })),
  ...'Most brands play it'.split(' ').map((t) => ({ t })),
  { t: 'grey:', tone: 'grey' },
  ...'safe, polite, and forgotten by Tuesday. We make yours'.split(' ').map((t) => ({ t })),
  ...'the one people notice first.'.split(' ').map((t) => ({ t, tone: 'red' as const })),
  ...'The logo, the website, and the campaign, made by the one team, so your brand speaks with the same voice.'.split(' ').map((t) => ({ t })),
];
/* Typed, not faded (Rajat, 2026-10-06: "like the typewriter got it"):
   every character strikes on its own as the reading runs, at a slightly
   uneven ink weight and a hair off the baseline, the way a typebar lands,
   and every character bleeds a little ink into the paper. Seeded, so the
   page types the same way every time. */
const STRIKES = (() => {
  let n = 7;
  const r = () => ((n = (n * 9301 + 49297) % 233280) / 233280);
  return WHO.map((w) => [...w.t].map(() => ({ ink: 0.8 + r() * 0.2, dy: (r() - 0.5) * 0.05 })));
})();
const CHARS = STRIKES.reduce((a, w) => a + w.length + 1, 0);
/** Pinned scroll (vh) the timeline was designed against. */
const DESIGN_VH = 390;
/** Timeline progress at `s` vh into the pinned scroll. Two Hermite pieces
 *  joined with a matching rate, so the speed never jumps: it starts at the
 *  hero's own rate (1/DESIGN_VH) for a seamless hand-off, runs the tunnel in
 *  the first TUNNEL_U of the scroll, then gives the gather the larger share
 *  and slows into the lock (Rajat, 2026-10-07: "too harsh and fast, show
 *  everything"). */
const TUNNEL_U = 0.36;
const TUNNEL_P = 0.46; // = GATHER_START in CubeAssembly
function hermite(t: number, p0: number, p1: number, m0: number, m1: number, h: number) {
  const t2 = t * t, t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * p0 + (t3 - 2 * t2 + t) * h * m0 + (-2 * t3 + 3 * t2) * p1 + (t3 - t2) * h * m1;
}
function sectionP(s: number) {
  const L = SECTION_VH - 100;
  const u = Math.max(0, Math.min(1, s / L));
  const m0 = L / DESIGN_VH;
  const mJoin = (1 - TUNNEL_P) / (1 - TUNNEL_U);
  if (u < TUNNEL_U) return hermite(u / TUNNEL_U, 0, TUNNEL_P, m0, mJoin, TUNNEL_U);
  return hermite((u - TUNNEL_U) / (1 - TUNNEL_U), TUNNEL_P, 1, mJoin, 0.45, 1 - TUNNEL_U);
}
const BG = '#FFFFFF';
const INK = '#0A0A0A';
/** The answer to the wall's question. Set as a Swiss poster: headline
 *  flush-left over two lines, a small label top-right, one hairline rule
 *  under the headline, and the box settling bottom-right off-centre. */
/* The answer to the wall ("Everyone says think outside the box."), set as
 * Rajat placed it before: flush-left in the band beside the box, which now
 * sits dead centre. Three ink lines, then a grey kicker. */
const LINES: Array<{ t: string; lead?: boolean }> = [
  { t: 'In a sea of grey,', lead: true },
  { t: 'be the' },
  { t: 'red one.' },
];
const LABEL = "Strategy. Brand. Web. Campaigns. Motion. We've got it all.";
/** Section progress over which each line rises out of its mask; the label
 *  rides with the first line, the rule draws after the second. */
const LINE_REVEAL: Array<[number, number]> = [
  [0.78, 0.9],
  [0.82, 0.94],
  [0.88, 0.98],
];
const smooth = (a: number, b: number, v: number) => {
  const t = Math.max(0, Math.min(1, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
/** How much of the hero's animated scroll this section sits on top of. */
const OVERLAP_VH = (1 - HANDOFF_P) * (HERO_VH - 100);
/** Anchor pixel ratio like the hero: same pixel budget, so the two canvases
 *  drawn on top of each other at the hand-off stay inside the GPU. */
const MAX_DPR = 1.75;
export function ProblemCube() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const labelRef = useRef<HTMLSpanElement>(null);
  // The grid: headline on eight of twelve columns beside the label on a
  // wide frame; on a phone the headline takes the full width and the label
  // sits under the rule, clear of the nav.
  const [wide, setWide] = useState(() => window.matchMedia('(min-width: 768px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const apply = () => setWide(mq.matches);
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);
  const progressRef = useRef(0);
  const dropRef = useRef(0);
  const rollRef = useRef(0);
  const whoRef = useRef<HTMLDivElement>(null);
  const charRefs = useRef<Array<Array<HTMLSpanElement | null>>>([]);
  const dotsRef = useRef<HTMLDivElement>(null);
  /** The hero's own progress at this scroll position, unclamped, so the
   *  canvas can place the mark where the hero has it and know when the
   *  frame behind the mark has gone white. */
  const heroPRef = useRef(0);
  /* How far the section's own canvas still sits below the viewport's top.
     Before the section pins it is not aligned with the viewport, so the
     tunnel would be drawn low of the gap; the camera and the clip are both
     shifted up by this, which lets the reveal start well before the pin
     instead of switching on at it. Driven by real scroll, not the glide,
     because it tracks where the DOM actually is. */
  const offsetRef = useRef(0);
  const pointerRef = useRef({ x: 0, y: 0 });
  const reduceMotion = useReducedMotion() ?? false;
  const [inView, setInView] = useState(false);
  const [dpr, setDpr] = useState(() => budgetDpr(MAX_DPR));
  useEffect(() => {
    const onResize = () => setDpr(budgetDpr(MAX_DPR));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver((e) => setInView(e[0].isIntersecting), { rootMargin: '160px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    // Reduced motion shows the finished box, no pin, no scrubbing.
    if (reduceMotion) {
      progressRef.current = 1;
      heroPRef.current = 2;
      offsetRef.current = 0;
      return;
    }
    return subscribeGlide(() => {
      const el = wrapRef.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top + glide.raw;
      const scrollable = el.offsetHeight - window.innerHeight;
      if (scrollable <= 0) return;
      // Scrolled into the pin, in vh. Negative before it pins.
      const s = ((glide.y - top) / window.innerHeight) * 100;
      const p = s <= 0 ? 0 : s >= SECTION_VH - 100 ? 1 : sectionP(s);
      progressRef.current = p;
      const drop = Math.max(0, Math.min(1, (s - (SECTION_VH - 100) - HOLD_VH) / DROP_VH));
      const roll = Math.max(0, Math.min(1, (s - (SECTION_VH - 100) - HOLD_VH - DROP_VH) / ROLL_VH));
      dropRef.current = drop;
      rollRef.current = smooth(0.06, 0.94, roll);
      // The poster leaves upward into its masks as the box starts to fall;
      // the paragraph arrives as it lands, then inks in word by word.
      const out = smooth(0, 0.28, drop);
      if (whoRef.current) {
        const a = smooth(0.45, 0.85, drop);
        whoRef.current.style.opacity = a.toFixed(3);
        whoRef.current.style.transform = `translateY(${((1 - a) * 24).toFixed(1)}px)`;
      }
      const read = smooth(0.02, 0.8, roll) * (CHARS + 2);
      if (dotsRef.current) dotsRef.current.style.opacity = smooth(0.2, 0.8, drop).toFixed(3);
      let at = 0;
      STRIKES.forEach((word, i) => {
        word.forEach((c, j) => {
          const el = charRefs.current[i]?.[j];
          const on = read > at;
          at += 1;
          if (!el || (el.dataset.on === '1') === on) return;
          el.dataset.on = on ? '1' : '0';
          el.style.opacity = on ? String(c.ink) : '0';
        });
        at += 1;
      });
      // The hero animates over `HERO_VH - 100`, at its own rate.
      heroPRef.current = HANDOFF_P + s / (HERO_VH - 100);
      offsetRef.current = Math.max(0, top - glide.raw);
      /* The sheet behind the canvas shows once the mark has gone (the canvas
         drops its own white plane at the same moment); the lines rise out
         of their masks as the box locks. */
      if (sheetRef.current) sheetRef.current.style.opacity = heroPRef.current >= HERO_DONE ? '1' : '0';
      lineRefs.current.forEach((el, i) => {
        if (!el) return;
        const t = smooth(LINE_REVEAL[i][0], LINE_REVEAL[i][1], p);
        el.style.transform = `translateY(${((1 - t) * 110 - out * 110).toFixed(2)}%)`;
      });
      if (labelRef.current) {
        const t = smooth(LINE_REVEAL[0][0], LINE_REVEAL[0][1], p);
        labelRef.current.style.transform = `translateY(${((1 - t) * 110 - out * 110).toFixed(2)}%)`;
      }
    });
  }, [reduceMotion]);

  // Cursor parallax only, so touch loses nothing.
  const onPointerMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (reduceMotion) return;
      const r = e.currentTarget.getBoundingClientRect();
      pointerRef.current = {
        x: ((e.clientX - r.left) / r.width - 0.5) * 2,
        y: ((e.clientY - r.top) / r.height - 0.5) * 2,
      };
    },
    [reduceMotion]
  );

  return (
    <section
      style={{
        position: 'relative',
        zIndex: 1,
        marginTop: reduceMotion ? 0 : `-${100 + OVERLAP_VH + TAIL_VH}vh`,
        background: reduceMotion ? BG : 'transparent',
      }}
    >
      <div ref={wrapRef} style={{ height: reduceMotion ? '100vh' : `${SECTION_VH + HOLD_VH + DROP_VH + ROLL_VH + COVER_VH}vh`, position: 'relative' }}>
        <div
          onMouseMove={onPointerMove}
          style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden' }}
        >
          {/* The sheet behind the canvas: white. Hidden until the mark has
              gone; until then the canvas paints its own white for the mark
              to cut. */}
          <div ref={sheetRef} style={{ position: 'absolute', inset: 0, background: BG, opacity: reduceMotion ? 1 : 0 }}>
            {/* Dot-grid notebook paper behind the reading, in as the box drops. */}
            <div
              ref={dotsRef}
              aria-hidden
              style={{
                position: 'absolute',
                inset: 0,
                opacity: reduceMotion ? 1 : 0,
                backgroundImage: 'radial-gradient(circle, rgba(10,10,10,0.22) 1.1px, transparent 1.6px)',
                backgroundSize: '26px 26px',
                backgroundPosition: 'center center',
              }}
            />
            {/* Who we are: arrives as the box lands, types in as it rolls away. */}
            <div
              ref={whoRef}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 'clamp(8rem, 25vh, 15rem)',
                padding: '0 clamp(1rem, 4vw, 5rem)',
                display: 'flex',
                justifyContent: 'center',
                opacity: reduceMotion ? 1 : 0,
                pointerEvents: 'none',
              }}
            >
              <p aria-label={WHO.map((w) => w.t).join(' ')} style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(24px, min(3.3vw, 5.2vh), 58px)', fontWeight: 500, letterSpacing: '-0.03em', lineHeight: 1.12, margin: 0, maxWidth: '21em', color: INK, textAlign: 'center',
                // Ink bleed: a tight halo of each character's own ink, as it
                // wicks into the paper. Text shadows, not an SVG filter: the
                // filter re-ran on every keystrike and halved the frame rate.
                textShadow: '0 0 0.6px currentColor, 0 0 1.4px currentColor, 0.4px 0.5px 2.4px rgba(10,10,10,0.18)' }}>
                {WHO.map((w, i) => (
                  <span key={i} aria-hidden>
                    <span
                      style={{
                        color: w.tone === 'red' ? '#EB3F43' : w.tone === 'grey' ? GREY : INK,
                        textDecoration: w.tone === 'grey' ? 'line-through' : 'none',
                        textDecorationThickness: '0.06em',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {[...w.t].map((ch, j) => (
                        <span
                          key={j}
                          data-on={reduceMotion ? '1' : '0'}
                          ref={(el) => {
                            (charRefs.current[i] ??= [])[j] = el;
                          }}
                          style={{ position: 'relative', top: `${STRIKES[i][j].dy}em`, opacity: reduceMotion ? STRIKES[i][j].ink : 0 }}
                        >
                          {ch}
                        </span>
                      ))}
                    </span>{' '}
                  </span>
                ))}
              </p>
            </div>
            {/* The end state, after Rajat's own layout (.claude/refs/
                cube-end-state-layout-rajat.png): one hairline across the
                upper third, then one horizontal band: the headline
                flush-left, the box centre-right, and the label in a light
                weight immediately right of the box, centred on it. Lines
                rise out of masks as the box locks; the rule draws. */}
            <div
              aria-hidden={!reduceMotion}
              style={{
                position: 'absolute',
                left: wide ? '6%' : '11%',
                top: wide ? '50vh' : '24vh',
                transform: 'translateY(-50%)',
                width: wide ? '29vw' : '80vw',
                pointerEvents: 'none',
                color: INK,
              }}
            >
              {LINES.map((line, i) => (
                <div key={line.t} style={{ overflow: 'hidden', marginBottom: line.lead ? '0.35em' : 0 }}>
                  <span
                    ref={(el) => {
                      lineRefs.current[i] = el;
                    }}
                    style={{
                      display: 'block',
                      fontSize: line.lead ? (wide ? 'clamp(24px, 2.4vw, 46px)' : 'clamp(22px, 6vw, 30px)') : wide ? 'clamp(54px, 6vw, 116px)' : 'clamp(48px, 15vw, 76px)',
                      lineHeight: line.lead ? 1.1 : 0.92,
                                            fontWeight: 500,
                      color: line.lead ? GREY : INK,
                      letterSpacing: '-0.04em',
                      transform: reduceMotion ? 'none' : 'translateY(110%)',
                    }}
                  >
                    {line.t === 'red one.' ? <span style={{ color: '#EB3F43' }}>{line.t}</span> : line.t}
                  </span>
                </div>
              ))}
            </div>
            <div
              style={{
                position: 'absolute',
                ...(wide ? { left: '72%', top: '50vh', transform: 'translateY(-50%)' } : { left: '11%', top: '84vh' }),
                overflow: 'hidden',
                pointerEvents: 'none',
              }}
            >
              <span
                ref={labelRef}
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 'clamp(13px, 1.3vw, 20px)',
                  fontWeight: 300,
                  letterSpacing: '0.02em',
                  textTransform: 'uppercase',
                  lineHeight: 1.3,
                  color: INK,
                  transform: reduceMotion ? 'none' : 'translateY(110%)',
                }}
              >
                Strategy. Brand. Web.
                <br />
                Campaigns. Motion.
                <br />
                <span style={{ color: '#EB3F43', fontWeight: 500 }}>We've got it all.</span>
              </span>
            </div>
          </div>
          <div style={{ position: 'absolute', inset: 0 }}>
            <Canvas
              frameloop={inView ? 'always' : 'never'}
              shadows="variance"
              dpr={dpr}
              gl={{ antialias: true, powerPreference: 'high-performance' }}
              camera={{ position: [0, 0, CAM_Z], fov: FOV }}
            >
              <CubeLighting />
              <CubeAssembly progressRef={progressRef} heroPRef={heroPRef} offsetRef={offsetRef} pointerRef={pointerRef} dropRef={dropRef} rollRef={rollRef} />
              {!reduceMotion && (
                <Suspense fallback={null}>
                  <MarkOccluder heroPRef={heroPRef} />
                </Suspense>
              )}
            </Canvas>
          </div>
        </div>
      </div>
    </section>
  );
}
