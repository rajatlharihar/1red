import { useRef } from 'react';
import { services } from '../ServicesGrid';
import { Digit, RedPanel, SKY, FLOOR, INK, clamp01, easeInOutSine, label, usePinned, WHO, WHAT, WHY } from './shared';

/* ─── About, option A: three red panels in depth ───────────────────────────
 * The process print's red panels, three of them, standing in the pale room
 * at increasing depth and offset left, right, centre. Who, What, Why: the
 * camera eases onto each in turn (pan and dolly on one shared curve, the
 * way The Box's process camera stops on each number), holds it framed and
 * readable, then glides on to the next; the panel it leaves swings past
 * the lens and fades. One chapter per scroll. After the third it lets go.
 * CSS 3D, not a canvas: the panels carry type, which stays crisp.
 * ────────────────────────────────────────────────────────────────────────── */

const P = 1200;
const D = 1700;
const SECTION_VH = 430;
/** Panel height at its stop, as a share of the frame. w:h = 1:ASPECT. */
const FRAME_H = 0.8;
const ASPECT = 1.25;
/** Where each panel stands: x as a share of the frame width at its own
 *  plane, depth by order. */
const SLOTS = [
  { x: -0.2, z: 0 },
  { x: 0.2, z: D },
  { x: -0.04, z: 2 * D },
];
const START = { z: -1.45 * P, x: 0 };
/** [start, arrive] of each move, in section progress; then a hold. */
const MOVES: Array<[number, number]> = [
  [0.02, 0.22],
  [0.36, 0.58],
  [0.72, 0.94],
];
const FADE_FROM = -0.25 * P;
const FADE_TO = -0.6 * P;

function camera(p: number, vw: number) {
  const stops = [START, ...SLOTS.map((s) => ({ z: s.z, x: s.x * vw }))];
  let i = 0;
  while (i < MOVES.length && p >= MOVES[i][1]) i++;
  if (i === MOVES.length) return stops[stops.length - 1];
  const [a, b] = MOVES[i];
  const t = easeInOutSine(clamp01((p - a) / (b - a)));
  return { z: stops[i].z + (stops[i + 1].z - stops[i].z) * t, x: stops[i].x + (stops[i + 1].x - stops[i].x) * t };
}

const CHAPTERS = [
  { n: 1, eyebrow: WHO.eyebrow, line: WHO.line, body: WHO.body },
  { n: 2, eyebrow: WHAT.eyebrow, line: WHAT.line, list: services.map((s) => ({ title: s.title, line: s.description.split('. ')[0] + '.' })) },
  { n: 3, eyebrow: WHY.eyebrow, line: WHY.line, body: WHY.body },
];

export function ChaptersPanels() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const groupRefs = useRef<Array<HTMLDivElement | null>>([]);
  usePinned(wrapRef, SECTION_VH, (p, vw) => {
    const cam = camera(p, vw);
    groupRefs.current.forEach((g, i) => {
      if (!g) return;
      const s = SLOTS[i];
      const depth = Math.max(s.z - cam.z, FADE_TO);
      g.style.transform = `translate(-50%, -50%) translate3d(${(s.x * vw - cam.x).toFixed(1)}px, 0, ${(-depth).toFixed(1)}px)`;
      g.style.opacity = (1 - clamp01((depth - FADE_FROM) / (FADE_TO - FADE_FROM))).toFixed(3);
    });
  });

  const w = `min(${((FRAME_H / ASPECT) * 100).toFixed(1)}vh, 80vw)`;
  return (
    <section style={{ background: SKY }}>
      <div ref={wrapRef} style={{ height: `${SECTION_VH}vh`, position: 'relative' }}>
        <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden', perspective: `${P}px`, background: SKY }}>
          <div style={{ position: 'absolute', left: '50%', top: '84%', width: '600vw', height: 24000, background: FLOOR, transform: 'translate(-50%, -50%) rotateX(90deg)' }} />
          {CHAPTERS.map((c, i) => (
            <div
              key={c.n}
              ref={(el) => {
                groupRefs.current[i] = el;
              }}
              style={{ position: 'absolute', left: '50%', top: '50%', width: w, zIndex: 10 - i, willChange: 'transform, opacity', opacity: 0 }}
            >
              <RedPanel seed={11 + i * 7} aspect={ASPECT} style={{ containerType: 'inline-size' }}>
                <div style={{ position: 'absolute', inset: '8% 9%', display: 'flex', flexDirection: 'column', color: SKY }}>
                  <div style={{ height: '17cqw' }}>
                    <Digit n={c.n} height="100%" fill={SKY} />
                  </div>
                  <span style={{ ...label, fontSize: '2.1cqw', marginTop: '6cqw', opacity: 0.85 }}>{c.eyebrow}</span>
                  <h2 style={{ margin: '2.4cqw 0 0', fontFamily: 'var(--font-sans)', fontSize: '8.6cqw', fontWeight: 700, letterSpacing: '-0.045em', lineHeight: 0.98 }}>{c.line}</h2>
                  {c.body && <p style={{ margin: 'auto 0 0', fontSize: '3.3cqw', lineHeight: 1.42, opacity: 0.92 }}>{c.body}</p>}
                  {c.list && (
                    <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '2.6cqw' }}>
                      {c.list.map((d) => (
                        <div key={d.title} style={{ borderTop: `1px solid rgba(242,239,232,0.45)`, paddingTop: '1.8cqw' }}>
                          <div style={{ fontSize: '3.9cqw', fontWeight: 700, letterSpacing: '-0.02em' }}>{d.title}</div>
                          <div style={{ fontSize: '2.8cqw', lineHeight: 1.4, opacity: 0.85, marginTop: '0.6cqw' }}>{d.line}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </RedPanel>
              {/* The panel stands on the floor: a soft ink shadow at its foot. */}
              <div style={{ position: 'absolute', left: '8%', right: '-14%', bottom: '-3%', height: '5%', background: INK, opacity: 0.14, borderRadius: '50%', transform: 'skewX(-40deg)', zIndex: -1 }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
