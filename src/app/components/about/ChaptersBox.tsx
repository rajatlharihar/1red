import { useRef } from 'react';
import { services } from '../ServicesGrid';
import { Digit, RED, INK, SKY, clamp01, easeInOutSine, label, usePinned, WHO, WHAT, WHY } from './shared';

/* ─── About, option B: the box turns ───────────────────────────────────────
 * The home page's line, "Collab with the whole box", taken literally: one
 * red box, set as the cube poster has it (words left, box right), turns a
 * face per scroll. Front: who we are. Then round the sides, one discipline
 * a face. Then it tips forward to show its top: why we do it. The chapter
 * copy on the left changes with it on the same eased curve, sliding out of
 * its mask as the face comes round, so the words and the box move as one.
 * Each turn lifts the box a little as it goes, so it reads as a solid.
 * ────────────────────────────────────────────────────────────────────────── */

const SECTION_VH = 540;
/** Box orientation at each stop: [rotateX, rotateY] in degrees. */
const OPEN: [number, number] = [-22, 34];
const STOPS: Array<[number, number]> = [
  [0, 0],
  [0, -90],
  [0, -180],
  [0, -270],
  [-90, -270],
];
const MOVES: Array<[number, number]> = [
  [0.0, 0.1],
  [0.2, 0.34],
  [0.42, 0.56],
  [0.64, 0.78],
  [0.84, 0.98],
];
const LIFT = 14;

function orient(p: number) {
  const all = [OPEN, ...STOPS];
  let i = 0;
  while (i < MOVES.length && p >= MOVES[i][1]) i++;
  if (i === MOVES.length) return { rx: STOPS[4][0], ry: STOPS[4][1], u: STOPS.length - 1 };
  const [a, b] = MOVES[i];
  const raw = clamp01((p - a) / (b - a));
  const t = easeInOutSine(raw);
  const lift = i > 0 ? -LIFT * Math.sin(Math.PI * raw) : 0;
  return {
    rx: all[i][0] + (all[i + 1][0] - all[i][0]) * t + lift,
    ry: all[i][1] + (all[i + 1][1] - all[i][1]) * t,
    // Continuous chapter position: i - 1 + t (stop 0 is the first face).
    u: Math.max(0, i - 1 + t),
  };
}

type Face = { n: number; eyebrow: string; title: string };
const FACES: Face[] = [
  { n: 1, eyebrow: WHO.eyebrow, title: 'Who' },
  ...services.map((s, i) => ({ n: i + 2, eyebrow: s.eyebrow, title: s.title })),
  { n: 5, eyebrow: WHY.eyebrow, title: 'Why' },
];
/** The words beside the box, one block per face. */
const COPY = [
  { eyebrow: WHO.eyebrow, line: WHO.line, body: WHO.body },
  ...services.map((s) => ({ eyebrow: WHAT.eyebrow, line: s.title, body: s.description })),
  { eyebrow: WHY.eyebrow, line: WHY.line, body: WHY.body },
];
/** Where each face sits on the box. The top face's content is turned to
 *  read upright once the box has come round to it. */
const FACE_TF = ['rotateY(0deg)', 'rotateY(90deg)', 'rotateY(180deg)', 'rotateY(-90deg)', 'rotateX(90deg) rotateZ(90deg)'];

export function ChaptersBox() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const cubeRef = useRef<HTMLDivElement>(null);
  const copyRefs = useRef<Array<HTMLDivElement | null>>([]);
  usePinned(wrapRef, SECTION_VH, (p) => {
    const o = orient(p);
    if (cubeRef.current) cubeRef.current.style.transform = `rotateX(${o.rx.toFixed(2)}deg) rotateY(${o.ry.toFixed(2)}deg)`;
    copyRefs.current.forEach((el, k) => {
      if (!el) return;
      const d = o.u - k;
      const vis = clamp01(1 - Math.abs(d) * 2.2);
      el.style.opacity = vis.toFixed(3);
      el.style.transform = `translate3d(0, ${(-d * 48).toFixed(1)}px, 0)`;
      el.style.visibility = vis > 0 ? 'visible' : 'hidden';
    });
  });

  const S = 'min(56vh, 40vw)';
  const half = 'calc(min(56vh, 40vw) / 2)';
  return (
    <section style={{ background: '#fff', color: INK }}>
      <div ref={wrapRef} style={{ height: `${SECTION_VH}vh`, position: 'relative' }}>
        <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden' }}>
          {/* The hairline across the upper third, as on the cube poster. */}
          <div style={{ position: 'absolute', left: 'clamp(1rem, 4vw, 5rem)', right: 'clamp(1rem, 4vw, 5rem)', top: '22vh', height: 1, background: 'rgba(10,10,10,0.14)' }} />
          {/* Words, left. */}
          <div style={{ position: 'absolute', left: 'clamp(1rem, 4vw, 5rem)', top: '30vh', width: 'min(40vw, 620px)' }}>
            {COPY.map((c, k) => (
              <div
                key={k}
                ref={(el) => {
                  copyRefs.current[k] = el;
                }}
                style={{ position: 'absolute', left: 0, top: 0, width: '100%', opacity: k === 0 ? 1 : 0, willChange: 'transform, opacity' }}
              >
                <span style={{ ...label, display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 6, height: 6, background: RED, display: 'inline-block' }} />
                  {c.eyebrow}
                </span>
                <h2 style={{ margin: '18px 0 0', fontFamily: 'var(--font-sans)', fontSize: 'clamp(34px, 4.2vw, 72px)', fontWeight: 500, letterSpacing: '-0.035em', lineHeight: 1.0 }}>{c.line}</h2>
                <p style={{ margin: '20px 0 0', fontSize: 'clamp(15px, 1.2vw, 19px)', lineHeight: 1.55, opacity: 0.6, maxWidth: 520 }}>{c.body}</p>
              </div>
            ))}
          </div>
          {/* The box, right. */}
          <div style={{ position: 'absolute', left: '70%', top: '54%', width: S, height: S, transform: 'translate(-50%, -50%)', perspective: '1600px' }}>
            <div style={{ position: 'absolute', left: '-10%', right: '-10%', bottom: '-16%', height: '14%', background: 'radial-gradient(closest-side, rgba(10,10,10,0.18), rgba(10,10,10,0))' }} />
            <div ref={cubeRef} style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transform: `rotateX(${OPEN[0]}deg) rotateY(${OPEN[1]}deg)`, willChange: 'transform' }}>
              {FACES.map((f, i) => (
                <div
                  key={f.n}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    transform: `${FACE_TF[i]} translateZ(${half})`,
                    background: RED,
                    border: `1px solid rgba(10,10,10,0.35)`,
                    backfaceVisibility: 'hidden',
                    containerType: 'inline-size',
                    color: SKY,
                  }}
                >
                  <div style={{ position: 'absolute', inset: '9%', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ height: '22cqw' }}>
                      <Digit n={f.n} height="100%" fill={SKY} />
                    </div>
                    <span style={{ ...label, fontSize: '3cqw', marginTop: 'auto', opacity: 0.85 }}>{f.eyebrow}</span>
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: f.title.length > 12 ? '8.5cqw' : '13cqw', fontWeight: 700, letterSpacing: '-0.045em', lineHeight: 0.98, marginTop: '2cqw' }}>{f.title}</span>
                  </div>
                </div>
              ))}
              {/* The bottom, so the box is closed when it tips. */}
              <div style={{ position: 'absolute', inset: 0, transform: `rotateX(-90deg) translateZ(${half})`, background: '#C9261A' }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
