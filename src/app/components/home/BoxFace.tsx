import { useEffect, useRef } from 'react';

/* ─── BoxFace: the little box who has seen your brand ──────────────────────
 * Cartoon expressions drawn straight onto the card in the style of Rajat's expression sheet. Motion
 * is deliberately small: a slow bob, a blink now and then, and pupils that
 * drift toward the cursor. One shared pointer listener and one shared rAF
 * drive every face on the page; layout is read only after the pointer moves.
 * The red variant is shaded with a gradient and a pre-rendered grain tile
 * (no SVG filters, nothing re-rasterised per frame).
 * ────────────────────────────────────────────────────────────────────────── */

export type Mood = 'nervous' | 'tired' | 'confused' | 'wtf' | 'crying' | 'irritated' | 'triumph';

const INK = '#0A0A0A';
const TEAR = '#6E8BFF';

/* Shared pointer + frame loop */
const pointer = { x: -1, y: -1, moved: 0 };
const subs = new Set<(t: number) => void>();
let raf = 0;
let listening = false;
function tick(t: number) {
  subs.forEach((f) => f(t));
  raf = subs.size ? requestAnimationFrame(tick) : 0;
}
function subscribe(f: (t: number) => void) {
  if (!listening && typeof window !== 'undefined') {
    listening = true;
    window.addEventListener(
      'pointermove',
      (e) => {
        pointer.x = e.clientX;
        pointer.y = e.clientY;
        pointer.moved++;
      },
      { passive: true },
    );
  }
  subs.add(f);
  if (!raf) raf = requestAnimationFrame(tick);
  return () => {
    subs.delete(f);
  };
}

/* Face geometry: the front square is 0..80 in its own space. */
const EYE_L = { x: 25, y: 33 };
const EYE_R = { x: 55, y: 33 };
const EYE_R0 = 12;
const openEyed: Record<Mood, boolean> = { nervous: true, tired: true, confused: true, wtf: true, crying: true, irritated: true, triumph: false };

function Eyes({ mood, pupils }: { mood: Mood; pupils: React.RefObject<SVGGElement | null> }) {
  const sw = 2.4;
  if (mood === 'triumph') {
    // Closed, pleased arcs and a cocked brow.
    return (
      <g fill="none" stroke={INK} strokeWidth={sw} strokeLinecap="round">
        <path d="M14 38 Q25 22 36 38" />
        <path d="M44 38 Q55 22 66 38" />
        <path d="M58 16 Q66 12 72 20" />
      </g>
    );
  }
  const pupil = (e: { x: number; y: number }, s = 1) => <ellipse cx={e.x} cy={e.y + 1} rx={3.6 * s} ry={5.6 * s} fill={INK} />;
  return (
    <g>
      {[EYE_L, EYE_R].map((e, i) => (
        <circle key={i} cx={e.x} cy={e.y} r={EYE_R0} fill="#fff" stroke={INK} strokeWidth={sw} />
      ))}
      <g ref={pupils}>
        {mood === 'wtf' ? (
          <>
            <circle cx={EYE_L.x} cy={EYE_L.y} r={1.6} fill={INK} />
            <circle cx={EYE_R.x} cy={EYE_R.y} r={1.6} fill={INK} />
          </>
        ) : (
          <>
            {pupil(EYE_L, mood === 'nervous' ? 0.8 : 1)}
            {pupil(EYE_R, mood === 'nervous' ? 0.8 : 1)}
          </>
        )}
      </g>
      {mood === 'tired' && (
        // Heavy lids over the top half.
        <g fill="#fff" stroke={INK} strokeWidth={sw} strokeLinejoin="round">
          <path d={`M${EYE_L.x - EYE_R0 - 1} ${EYE_L.y} A${EYE_R0} ${EYE_R0} 0 0 1 ${EYE_L.x + EYE_R0 + 1} ${EYE_L.y} Z`} />
          <path d={`M${EYE_R.x - EYE_R0 - 1} ${EYE_R.y} A${EYE_R0} ${EYE_R0} 0 0 1 ${EYE_R.x + EYE_R0 + 1} ${EYE_R.y} Z`} />
        </g>
      )}
      {mood === 'irritated' && (
        <g fill="#fff" stroke={INK} strokeWidth={sw} strokeLinejoin="round">
          <path d={`M${EYE_L.x - EYE_R0 - 1} ${EYE_L.y - 4} L${EYE_L.x + EYE_R0 + 1} ${EYE_L.y - 4} L${EYE_L.x + EYE_R0 + 1} ${EYE_L.y - EYE_R0 - 2} L${EYE_L.x - EYE_R0 - 1} ${EYE_L.y - EYE_R0 - 2} Z`} stroke="none" />
          <path d={`M${EYE_R.x - EYE_R0 - 1} ${EYE_R.y - 4} L${EYE_R.x + EYE_R0 + 1} ${EYE_R.y - 4} L${EYE_R.x + EYE_R0 + 1} ${EYE_R.y - EYE_R0 - 2} L${EYE_R.x - EYE_R0 - 1} ${EYE_R.y - EYE_R0 - 2} Z`} stroke="none" />
          <path d={`M${EYE_L.x - EYE_R0} ${EYE_L.y - 4} L${EYE_L.x + EYE_R0} ${EYE_L.y - 4}`} fill="none" />
          <path d={`M${EYE_R.x - EYE_R0} ${EYE_R.y - 4} L${EYE_R.x + EYE_R0} ${EYE_R.y - 4}`} fill="none" />
        </g>
      )}
    </g>
  );
}

function Extras({ mood }: { mood: Mood }) {
  const s = { fill: 'none', stroke: INK, strokeWidth: 2.4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (mood) {
    case 'nervous':
      return (
        <g>
          <path d="M30 62 Q34 57 38 61 Q42 65 46 60 Q49 57 52 61" {...s} />
          <path d="M8 46 Q6 52 10 54" {...s} />
          <path d="M68 8 q3 6 0 9 q-3 -3 0 -9 Z" fill="#fff" stroke={INK} strokeWidth={1.8} />
        </g>
      );
    case 'tired':
      return (
        <g>
          <path d="M37 63 L43 63" {...s} />
          <path d="M14 15 L20 17 M62 17 L68 15" {...s} />
        </g>
      );
    case 'confused':
      return (
        <g>
          <path d="M12 16 Q16 6 26 9" {...s} />
          <ellipse cx="42" cy="62" rx="5" ry="6.5" fill={INK} />
          <ellipse cx="42" cy="65" rx="3.2" ry="2.4" fill="#fff" />
        </g>
      );
    case 'wtf':
      return (
        <g>
          <circle cx={EYE_L.x} cy={EYE_L.y} r={EYE_R0 + 2.5} {...s} strokeWidth={1.4} />
          <circle cx={EYE_R.x} cy={EYE_R.y} r={EYE_R0 + 2.5} {...s} strokeWidth={1.4} />
          <path d="M36 55 L50 54 L48 74 L33 72 Z" fill="#fff" stroke={INK} strokeWidth={2.4} strokeLinejoin="round" />
          <path d="M14 46 L14 54 M18 46 L18 54 M22 46 L22 53" {...s} strokeWidth={1.6} />
        </g>
      );
    case 'crying':
      return (
        <g>
          <path d="M32 64 Q40 58 48 64" {...s} />
          <path d="M14 38 Q12 52 15 72" fill="none" stroke={TEAR} strokeWidth={3.2} strokeLinecap="round" />
          <path d="M66 38 Q68 52 65 72" fill="none" stroke={TEAR} strokeWidth={3.2} strokeLinecap="round" />
        </g>
      );
    case 'irritated':
      return (
        <g>
          <path d="M30 62 Q38 58 46 61 Q50 62 52 64" {...s} />
          <path d="M11 14 L35 18 M45 18 L69 14" {...s} />
        </g>
      );
    case 'triumph':
      return (
        <g>
          <path d="M26 56 Q44 54 60 50 Q58 68 42 68 Q30 66 26 56 Z" fill={INK} />
          <path d="M30 57 Q44 56 56 53 L55 57 Q44 60 31 60 Z" fill="#fff" />
        </g>
      );
  }
}

export function BoxFace({ mood, variant, size, delay = 0, reduceMotion }: { mood: Mood; variant: 'white' | 'red'; size: string; delay?: number; reduceMotion: boolean }) {
    const rootRef = useRef<SVGSVGElement>(null);
  const pupilsRef = useRef<SVGGElement>(null);
  const eyesRef = useRef<SVGGElement>(null);
  const bobRef = useRef<SVGGElement>(null);

  useEffect(() => {
    if (reduceMotion) return;
    const off = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };
    let seen = -1;
    let nextBlink = performance.now() + 1500 + Math.random() * 3500;
    const phase = delay * 1.7;
    const unsub = subscribe((t) => {
      const el = rootRef.current;
      if (!el) return;
      if (pointer.moved !== seen) {
        seen = pointer.moved;
        const r = el.getBoundingClientRect();
        const dx = pointer.x - (r.left + r.width / 2);
        const dy = pointer.y - (r.top + r.height / 2);
        const d = Math.hypot(dx, dy) || 1;
        const k = Math.min(1, d / 400);
        target.x = (dx / d) * 3.2 * k;
        target.y = (dy / d) * 3.2 * k;
      }
      off.x += (target.x - off.x) * 0.08;
      off.y += (target.y - off.y) * 0.08;
      pupilsRef.current?.setAttribute('transform', `translate(${off.x.toFixed(2)} ${off.y.toFixed(2)})`);
      bobRef.current?.setAttribute('transform', `translate(0 ${(Math.sin(t / 900 + phase) * 1.6).toFixed(2)})`);
      if (eyesRef.current && openEyed[mood]) {
        if (t > nextBlink) {
          const k = (t - nextBlink) / 140;
          const s = k < 1 ? 1 - 0.9 * Math.sin(k * Math.PI) : 1;
          eyesRef.current.setAttribute('transform', `translate(0 ${EYE_L.y * (1 - s)}) scale(1 ${s.toFixed(3)})`);
          if (k >= 1) nextBlink = t + 2500 + Math.random() * 4000;
        }
      }
    });
    return unsub;
  }, [mood, delay, reduceMotion]);

  // 2026-10-04 (Rajat): "don't put them in a box, just the expressions".
  // The face is drawn straight onto the card, no extruded square behind it.
  void variant;
  return (
    <svg ref={rootRef} viewBox="0 0 80 80" style={{ width: size, height: size, display: 'block', overflow: 'visible' }} aria-hidden>
      <g ref={bobRef}>
        <g ref={eyesRef}>
          <Eyes mood={mood} pupils={pupilsRef} />
        </g>
        <Extras mood={mood} />
      </g>
    </svg>
  );
}
