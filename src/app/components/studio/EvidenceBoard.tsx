import { useEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { glide, subscribeGlide } from '../scrollGlide';
import { Digit } from '../about/shared';
import { grainTile } from '../home/Grain';
import { process as STEPS } from '../../data/process';

/* ─── Our process, as an evidence board (Rajat, 2026-10-04) ────────────────
 * After his reference: a wall of black-and-white clippings, polaroids and
 * redacted notes, pinned and linked by red string. The five steps are the
 * exhibits. Scrolling is a horizontal camera move along the red thread:
 * the camera glides from pin to pin with a short dwell on each exhibit,
 * and the thread draws itself just ahead of the camera, so you are
 * literally following it. The thread ends on a polaroid of the team ("the
 * usual suspects"); the camera dives into the photo until it is the whole
 * frame, which is exactly where TeamZoom picks up with the film.
 *
 * The board lives in its own unit space (1u = 1px, then scaled to the
 * viewport), drawn once; only its transform changes per frame.
 * ────────────────────────────────────────────────────────────────────────── */

const SECTION_VH = 720;
const RED = '#C8161D';
const INK = '#0E0E0E';
const PAPER = '#FBFBFB';
const W = 6600;
const H = 1700;
/** Share of the section spent travelling the thread; the rest is the dive. */
const TRAVEL_END = 0.84;

/** Photos sourced for the board (public domain, see public/images/board/CREDITS.md). */
const PHOTOS = ['meeting-1', 'magnifier', 'typewriter', 'blueprint', 'press', 'camera', 'switchboard', 'street', 'sketching', 'billboard', 'fingerprint', 'meeting-2', 'typewriter-2', 'press-2', 'camera-2', 'switchboard-2', 'billboard-2'];

const NOTES = ['who? why? since when?', 'one line. ONE.', 'pretty is not done', 'test it on the cheap phone!!', 'again. and again.'];

function rng(seed: number) {
  let n = seed * 9301 + 49297;
  return () => ((n = (n * 9301 + 49297) % 233280) / 233280);
}

type Stop = { x: number; y: number }; // card centre the camera frames
type Pin = { x: number; y: number };

/* Layout in board units. Exhibits alternate high and low so the thread zigzags. */
const TITLE = { x: 780, y: 780, w: 760, h: 620, rot: -3 };
const CARDS = [0, 1, 2, 3, 4].map((i) => ({ x: 1820 + i * 900, y: i % 2 ? 900 : 700, w: 560, h: 640, rot: [2.5, -2, 3, -3.5, 2][i] }));
const POLAROID = { x: 6260, y: 820, ph: 470, rot: 0 };

function pinOf(c: { x: number; y: number; h: number }): Pin {
  return { x: c.x, y: c.y - c.h / 2 + 36 };
}

/** A soft sag between two pins, like string under its own weight. */
function sag(a: Pin, b: Pin, k = 0.12) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2 + Math.hypot(b.x - a.x, b.y - a.y) * k;
  return `M${a.x} ${a.y} Q${mx} ${my} ${b.x} ${b.y}`;
}

function PinHead({ p, r = 13 }: { p: Pin; r?: number }) {
  return (
    <g>
      <circle cx={p.x + 3} cy={p.y + 4} r={r} fill="rgba(0,0,0,0.35)" />
      <circle cx={p.x} cy={p.y} r={r} fill="#1a1a1a" />
      <circle cx={p.x - r * 0.35} cy={p.y - r * 0.35} r={r * 0.32} fill="rgba(255,255,255,0.55)" />
    </g>
  );
}

const grainStyle = (o = 0.22): React.CSSProperties => ({
  position: 'absolute',
  inset: 0,
  backgroundImage: `url(${grainTile()})`,
  backgroundSize: '192px 192px',
  mixBlendMode: 'multiply',
  opacity: o,
  pointerEvents: 'none',
});

/** A scribbled line of "handwriting": a wobbly squiggle, never real text. */
function scribble(r: () => number, w: number) {
  let d = 'M0 10';
  let x = 0;
  while (x < w) {
    const step = 8 + r() * 14;
    x += step;
    d += ` q${(step / 2).toFixed(1)} ${(-14 + r() * 28).toFixed(1)} ${step.toFixed(1)} ${(-4 + r() * 8).toFixed(1)}`;
  }
  return d;
}

function Decor({ photoOk }: { photoOk: Record<string, boolean> }) {
  // Clippings scattered over the whole board, seeded so it never reshuffles.
  const items = useMemo(() => {
    const r = rng(11);
    const out: Array<{ kind: 'photo' | 'text' | 'block' | 'note'; x: number; y: number; w: number; h: number; rot: number; photo?: string; seed: number }> = [];
    let pi = 0;
    for (let x = -200; x < W + 200; x += 260 + r() * 160) {
      for (const band of [0, 1, 2]) {
        const y = band === 0 ? -80 + r() * 260 : band === 1 ? 520 + r() * 520 : 1200 + r() * 420;
        const roll = r();
        const kind = roll < 0.42 ? 'photo' : roll < 0.7 ? 'text' : roll < 0.85 ? 'block' : 'note';
        const w = kind === 'block' ? 220 + r() * 260 : 240 + r() * 200;
        const h = kind === 'photo' ? w * (0.75 + r() * 0.5) : kind === 'block' ? 300 + r() * 360 : 200 + r() * 220;
        out.push({ kind, x, y, w, h, rot: (r() - 0.5) * 16, photo: kind === 'photo' ? PHOTOS[pi++ % PHOTOS.length] : undefined, seed: Math.floor(r() * 1e6) });
      }
    }
    return out;
  }, []);

  return (
    <>
      {items.map((it, i) => {
        const r = rng(it.seed);
        const base: React.CSSProperties = {
          position: 'absolute',
          left: it.x - it.w / 2,
          top: it.y - it.h / 2,
          width: it.w,
          height: it.h,
          transform: `rotate(${it.rot.toFixed(2)}deg)`,
          boxShadow: '0 10px 24px rgba(0,0,0,0.35)',
        };
        if (it.kind === 'block') return <div key={i} style={{ ...base, background: INK, boxShadow: 'none' }}><div style={grainStyle(0.5)} /></div>;
        if (it.kind === 'photo') {
          const ok = it.photo && photoOk[it.photo] !== false;
          return (
            <div key={i} style={{ ...base, background: PAPER, padding: 14, paddingBottom: 38, boxSizing: 'border-box' }}>
              <div style={{ width: '100%', height: '100%', background: INK, overflow: 'hidden', position: 'relative' }}>
                {ok && <img src={`/images/board/${it.photo}.webp`} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: 'grayscale(1) contrast(1.15)' }} />}
                {!ok && <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}><path d={`M10 ${60 + r() * 20} C 25 ${20 + r() * 20}, 45 ${30 + r() * 30}, 55 ${50 + r() * 20} S 85 ${30 + r() * 30}, 92 ${70 + r() * 20} L92 100 L10 100 Z`} fill={PAPER} /></svg>}
              </div>
              <div style={grainStyle(0.25)} />
            </div>
          );
        }
        // text clipping / sticky note: ruled squiggles, a redaction bar or two
        const lines = Math.floor(it.h / 34);
        return (
          <div key={i} style={{ ...base, background: it.kind === 'note' ? '#FFFFFF' : PAPER, overflow: 'hidden' }}>
            <svg width={it.w} height={it.h} style={{ position: 'absolute', inset: 0 }}>
              {Array.from({ length: lines }, (_, l) => {
                const y = 28 + l * 30;
                const redact = r() < 0.28;
                const len = it.w * (0.45 + r() * 0.42);
                return redact ? (
                  <rect key={l} x={22} y={y - 8} width={len} height={18} fill={INK} />
                ) : (
                  <path key={l} d={scribble(r, len)} transform={`translate(22 ${y - 10})`} fill="none" stroke="#3a3a3a" strokeWidth={1.6} strokeLinecap="round" />
                );
              })}
              {r() < 0.4 && <ellipse cx={it.w * (0.3 + r() * 0.4)} cy={it.h * (0.3 + r() * 0.4)} rx={50 + r() * 30} ry={26 + r() * 14} fill="none" stroke={INK} strokeWidth={2} transform={`rotate(${-12 + r() * 24})`} />}
            </svg>
            <div style={grainStyle(0.22)} />
          </div>
        );
      })}
    </>
  );
}

export function EvidenceBoard() {
  const reduceMotion = !!useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const segRefs = useRef<Array<SVGPathElement | null>>([]);
  const [vp, setVp] = useState({ w: 1440, h: 900 });
  const [photoOk, setPhotoOk] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const on = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    on();
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);

  // Which board photos actually exist (the set can grow without code changes).
  useEffect(() => {
    PHOTOS.forEach((n) => {
      const img = new Image();
      img.onload = () => setPhotoOk((o) => ({ ...o, [n]: true }));
      img.onerror = () => setPhotoOk((o) => ({ ...o, [n]: false }));
      img.src = `/images/board/${n}.webp`;
    });
  }, []);

  /* The polaroid's photo has the viewport's own shape, so diving into it
     ends on exactly the full-bleed frame TeamZoom opens on. */
  const photoH = POLAROID.ph;
  const photoW = photoH * (vp.w / vp.h);
  const polW = photoW + 60;
  const polH = photoH + 150;

  const stops: Stop[] = useMemo(() => [{ x: TITLE.x, y: TITLE.y }, ...CARDS.map((c) => ({ x: c.x, y: c.y })), { x: POLAROID.x, y: POLAROID.y }], []);
  const pins: Pin[] = useMemo(
    () => [pinOf(TITLE), ...CARDS.map(pinOf), { x: POLAROID.x, y: POLAROID.y - polH / 2 + 30 }],
    [polH],
  );

  useEffect(() => {
    if (reduceMotion) return;
    const lens = segRefs.current.map((p) => (p ? p.getTotalLength() : 0));
    segRefs.current.forEach((p, i) => {
      if (!p) return;
      p.style.strokeDasharray = `${lens[i]} ${lens[i]}`;
      p.style.strokeDashoffset = `${lens[i]}`;
    });
    return subscribeGlide(() => {
      const el = wrapRef.current;
      const board = boardRef.current;
      if (!el || !board) return;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const top = el.getBoundingClientRect().top + glide.raw;
      const scrollable = (SECTION_VH / 100 - 1) * vh;
      const p = Math.max(0, Math.min(1, (glide.y - top) / scrollable));
      const scale = Math.min(vh / 1000, vw / 860); // the title card (760u) fits a phone

      // Travel: stop to stop, each leg eased, with a dwell on every exhibit.
      const legs = stops.length - 1;
      const u = Math.min(1, p / TRAVEL_END) * legs;
      const leg = Math.min(legs - 1, Math.floor(u));
      const f = u - leg;
      const move = Math.min(1, f / 0.72);
      const e = -(Math.cos(Math.PI * move) - 1) / 2;
      const a = stops[leg];
      const b = stops[leg + 1];
      let cx = a.x + (b.x - a.x) * e;
      let cy = a.y + (b.y - a.y) * e;
      // A little drift so the move reads as a handheld camera, not a slide.
      let rot = Math.sin(u * 1.9) * 0.6 * (1 - Math.min(1, Math.max(0, (p - TRAVEL_END) / 0.05)));
      let z = 1;

      // The dive: from framing the polaroid to its photo filling the frame.
      const d = Math.max(0, (p - TRAVEL_END) / (1 - TRAVEL_END));
      if (d > 0) {
        const t = d < 1 ? -(Math.cos(Math.PI * d) - 1) / 2 : 1;
        const photoCy = POLAROID.y - polH / 2 + 30 + photoH / 2;
        const zFill = Math.max(vw / (photoW * scale), vh / (photoH * scale)) * 1.002;
        z = Math.exp(Math.log(zFill) * t);
        cy = POLAROID.y + (photoCy - POLAROID.y) * t;
        cx = POLAROID.x;
        rot = 0;
      }

      const s = scale * z;
      board.style.transform = `translate3d(${(vw / 2 - cx * s).toFixed(2)}px, ${(vh / 2 - cy * s).toFixed(2)}px, 0) rotate(${rot.toFixed(3)}deg) scale(${s.toFixed(4)})`;

      // The thread runs a little ahead of the camera.
      const ahead = Math.min(1, p / TRAVEL_END) * legs + 0.45;
      segRefs.current.forEach((path, i) => {
        if (!path) return;
        const k = Math.max(0, Math.min(1, ahead - i));
        path.style.strokeDashoffset = `${(lens[i] * (1 - k)).toFixed(1)}`;
      });
    });
  }, [reduceMotion, stops, polH, photoH, photoW]);

  // Static decorative strings between scattered clippings.
  const decoStrings = useMemo(() => {
    const r = rng(5);
    return Array.from({ length: 22 }, () => {
      const a = { x: r() * W, y: r() * H };
      const b = { x: a.x + (r() - 0.5) * 1400, y: r() * H };
      return { a, b };
    });
  }, []);

  if (reduceMotion) {
    return (
      <section aria-label="Our process" style={{ background: INK, padding: '8rem 1rem 4rem', color: INK }}>
        <h2 style={{ color: '#fff', fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 'clamp(40px, 7vw, 110px)', margin: '0 auto 2rem', maxWidth: 1100 }}>Our process</h2>
        <div style={{ display: 'grid', gap: 16, maxWidth: 1100, margin: '0 auto' }}>
          {STEPS.map((s, i) => (
            <div key={s.number} style={{ background: PAPER, padding: 24 }}>
              <Digit n={i + 1} height="48px" fill={INK} />
              <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: 32, margin: '12px 0 6px' }}>{s.title}</h3>
              <p style={{ margin: 0, fontSize: 18 }}>{s.description}</p>
            </div>
          ))}
        </div>
      </section>
    );
  }

  const cardText: React.CSSProperties = { fontFamily: 'var(--font-sans)', color: INK };

  return (
    <section aria-label="Our process" style={{ position: 'relative', background: INK }}>
      <div ref={wrapRef} style={{ height: `${SECTION_VH}vh`, position: 'relative' }}>
        <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden', background: INK }}>
          <div ref={boardRef} style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, transformOrigin: '0 0', willChange: 'transform' }}>
            {/* The cork: black, grainy. */}
            <div style={{ position: 'absolute', inset: -800, background: INK }}>
              <div style={grainStyle(0.6)} />
            </div>
            <Decor photoOk={photoOk} />

            {/* Scattered threads between clippings: under the exhibits and the
                polaroid, so only the thread we follow ever crosses them. */}
            <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none' }}>
              {decoStrings.map(({ a, b }, i) => (
                <g key={i}>
                  <path d={sag(a, b, 0.05)} fill="none" stroke="#7E0E12" strokeWidth={3} opacity={0.75} />
                  <PinHead p={a} r={8} />
                </g>
              ))}
            </svg>

            {/* Title card */}
            <div style={{ position: 'absolute', left: TITLE.x - TITLE.w / 2, top: TITLE.y - TITLE.h / 2, width: TITLE.w, height: TITLE.h, background: PAPER, transform: `rotate(${TITLE.rot}deg)`, boxShadow: '0 18px 40px rgba(0,0,0,0.5)', padding: 56, boxSizing: 'border-box' }}>
              <div style={{ ...cardText, fontSize: 18, fontWeight: 600, letterSpacing: '0.28em', textTransform: 'uppercase' }}>Case file 1RED/26</div>
              <div style={{ ...cardText, fontSize: 150, fontWeight: 600, letterSpacing: '-0.05em', lineHeight: 0.9, marginTop: 40 }}>
                Our
                <br />
                process
              </div>
              <div style={{ fontFamily: 'var(--font-hand)', fontSize: 58, fontWeight: 700, color: RED, marginTop: 34, transform: 'rotate(-4deg)' }}>follow the red thread &rarr;</div>
              <div style={grainStyle(0.2)} />
            </div>

            {/* The exhibits */}
            {CARDS.map((c, i) => {
              const s = STEPS[i];
              return (
                <div key={s.number} style={{ position: 'absolute', left: c.x - c.w / 2, top: c.y - c.h / 2, width: c.w, height: c.h, background: PAPER, transform: `rotate(${c.rot}deg)`, boxShadow: '0 18px 40px rgba(0,0,0,0.5)', padding: '70px 48px 40px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Digit n={i + 1} height="120px" fill={INK} />
                    <span style={{ ...cardText, fontSize: 15, fontWeight: 600, letterSpacing: '0.28em', textTransform: 'uppercase' }}>Exhibit {String.fromCharCode(65 + i)}</span>
                  </div>
                  <div style={{ ...cardText, fontSize: 72, fontWeight: 600, letterSpacing: '-0.04em', marginTop: 28, position: 'relative', alignSelf: 'flex-start' }}>
                    {s.title}
                    <svg viewBox="0 0 100 40" preserveAspectRatio="none" style={{ position: 'absolute', left: '-8%', top: '-10%', width: '116%', height: '125%', overflow: 'visible' }}>
                      <path d="M6 22 C 4 6, 60 -2, 92 12 C 104 20, 90 38, 50 38 C 18 38, 0 30, 10 14" fill="none" stroke={RED} strokeWidth={1.6} vectorEffect="non-scaling-stroke" />
                    </svg>
                  </div>
                  <p style={{ ...cardText, fontSize: 27, lineHeight: 1.35, margin: '20px 0 0', fontWeight: 500 }}>{s.description}</p>
                  <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ height: 18, width: 170, background: INK }} />
                    <div style={{ fontFamily: 'var(--font-hand)', fontSize: 40, fontWeight: 700, color: RED, transform: 'rotate(-3deg)' }}>{NOTES[i]}</div>
                  </div>
                  <div style={grainStyle(0.2)} />
                </div>
              );
            })}

            {/* The usual suspects */}
            <div style={{ position: 'absolute', left: POLAROID.x - polW / 2, top: POLAROID.y - polH / 2, width: polW, height: polH, background: PAPER, boxShadow: '0 22px 50px rgba(0,0,0,0.55)', padding: 30, paddingTop: 30, boxSizing: 'border-box' }}>
              <div style={{ width: photoW, height: photoH, overflow: 'hidden', background: '#fff' }}>
                <img src="/images/team-poster.jpg" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
              <div style={{ fontFamily: 'var(--font-hand)', fontSize: Math.min(64, polW / 6.2), fontWeight: 700, color: INK, marginTop: 18, textAlign: 'center', whiteSpace: 'nowrap' }}>
                the usual suspects <span style={{ color: RED }}>&#10003;</span>
              </div>
            </div>

            {/* String: scattered red threads, then the one we follow. */}
            <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none' }}>
              {pins.slice(0, -1).map((a, i) => (
                <path
                  key={i}
                  ref={(el) => {
                    segRefs.current[i] = el;
                  }}
                  d={sag(a, pins[i + 1])}
                  fill="none"
                  stroke={RED}
                  strokeWidth={6}
                  strokeLinecap="round"
                />
              ))}
              {pins.map((p, i) => (
                <PinHead key={i} p={p} r={16} />
              ))}
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
