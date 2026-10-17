import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { Grain } from './Grain';
import { pageScrolling } from '../SmoothScroll';
import { Digit, RED, INK } from '../about/shared';
import { FillLink } from './FillLink';

/* ─── THE DEAL, two takes (Rajat, 2026-10-17) ──────────────────────────────
 * Same content, laid out after his references, for him to pick:
 *   A (?deal=a, default): the headline set huge and interlocking with a solid
 *     red card that carries the closing line, then the three promises as
 *     deck rows: red hairline, a small caps label at its left end, the
 *     number in parentheses in his numerals, the unit in big red caps and
 *     the body as small right-aligned red caps.
 *   B (?deal=b): the promises strung along a line that winds across the
 *     card, a big red circle at each turn holding its numeral, steps 01-03.
 * TheDeal keeps the card, the tilt-in and the numerals rising; each layout
 * hands it the numerals' refs in the same order.
 * ────────────────────────────────────────────────────────────────────────── */

export type DealItem = { n: number[]; unit: string; body: string };
type DigitRef = (k: number) => (el: HTMLDivElement | null) => void;

const CAPS: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  textTransform: 'uppercase',
  fontWeight: 700,
  letterSpacing: '0.06em',
};

/** His numerals, rising out of their slot (plain, no brackets: Rajat 2026-10-17). */
function Numeral({ d, h, digitRef, base, fill = RED }: { d: DealItem; h: string; digitRef: DigitRef; base: number; fill?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: `calc(${h} * 0.08)` }}>
      {d.n.map((n, j) => (
        <div key={j} style={{ overflow: 'hidden' }}>
          <div ref={digitRef(base + j)} style={{ display: 'block', willChange: 'transform' }}>
            <Digit n={n} height={h} fill={fill} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Closing({ narrow, onRed }: { narrow: boolean; onRed?: boolean }) {
  return (
    <>
      <p style={{ margin: 0, fontFamily: 'var(--font-hand)', fontSize: narrow ? 22 : 'clamp(20px, 1.7vw, 30px)', fontWeight: 700, color: onRed ? '#FFFFFF' : INK, lineHeight: 1.25 }}>
        We&rsquo;re new. We&rsquo;re sharp. We&rsquo;re distinct.
      </p>
      <FillLink to="/about" outline onRed={onRed} icon={<ArrowUpRight size={15} strokeWidth={2} />}>
        Meet the box
      </FillLink>
    </>
  );
}

/* ── A: interlocking headline + deck rows (Rajat's pick, 2026-10-17) ── */

/** Each row's visual field (29.png's split panels): a vintage B&W photo
 *  toned red, chosen for what the row says. 0 years of bad habits = hands at
 *  a typewriter on a blank sheet; 1 table = an editorial meeting around one
 *  table (both Nationaal Archief, CC0, images/deal/CREDITS.md); 100% makers =
 *  hands at the drawing board (public domain, images/board/CREDITS.md). */
const FIELDS = ['/images/deal/fresh-start-typewriter.jpg', '/images/deal/one-table-meeting.jpg', '/images/board/sketching.webp'];
const ROW_LABELS = ['Habits:', 'Seating:', 'Makers:'];
// Decoded ahead, so a field opening mid-scroll never stalls on a decode.
if (typeof window !== 'undefined')
  FIELDS.forEach((src) => {
    const im = new Image();
    im.src = src;
    im.decode?.().catch(() => {});
  });
const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];


/** The table's tile joint, in red, edge to edge (Rajat, 2026-10-17): two
 *  wobbly ink strokes with a dotted pen texture, like the drawn table. */
function inkPath(seed: number, y: number) {
  let r = seed;
  const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
  let d = `M0 ${y.toFixed(2)}`;
  for (let x = 25; x <= 1000; x += 25) d += ` L${x} ${(y + (rnd() - 0.5) * 1.1).toFixed(2)}`;
  return d;
}
function InkRule({ seed, delay }: { seed: number; delay: number }) {
  const a = inkPath(seed, 3.2);
  const b = inkPath(seed + 7, 7.4);
  return (
    <motion.svg
      aria-hidden
      viewBox="0 0 1000 10"
      preserveAspectRatio="none"
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ duration: 0.9, ease: EASE_OUT, delay }}
      style={{ position: 'absolute', left: 'calc(50% - 50vw)', width: '100vw', top: -4, height: 10, transformOrigin: 'left', overflow: 'visible', pointerEvents: 'none' }}
    >
      <g fill="none" stroke={RED} strokeLinecap="round" vectorEffect="non-scaling-stroke">
        <path d={a} strokeWidth={1.8} vectorEffect="non-scaling-stroke" />
        <path d={b} strokeWidth={1.4} vectorEffect="non-scaling-stroke" />
        <path d={a} strokeWidth={2.6} strokeDasharray="1 5" opacity={0.6} vectorEffect="non-scaling-stroke" />
        <path d={b} strokeWidth={2.2} strokeDasharray="1 7" opacity={0.5} vectorEffect="non-scaling-stroke" />
      </g>
    </motion.svg>
  );
}

function DealRow({ d, i, base, narrow, digitRef, focus }: { d: DealItem; i: number; base: number; narrow: boolean; digitRef: DigitRef; focus: boolean }) {
  const [hover, setHover] = useState(false);
  const on = hover; // red fill + white type
  const open = hover || focus; // the visual field
  const fg = on ? '#FFFFFF' : RED;
  const tr = 'color 0.35s ease, fill 0.35s ease';
  return (
    <div
      onMouseEnter={() => !pageScrolling() && setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: narrow ? 'auto minmax(0, 1fr)' : 'minmax(150px, 0.75fr) minmax(0, 1.25fr) minmax(0, 0.9fr) minmax(0, 1fr)',
        alignItems: 'center',
        columnGap: narrow ? 14 : 'clamp(16px, 2vw, 32px)',
        rowGap: 8,
        padding: narrow ? '26px 0 20px' : 'clamp(14px, 2.2vh, 28px) clamp(8px, 1vw, 16px)',
        // Visible sideways so the ink rule runs edge to edge; clipped top and
        // bottom like before.
        overflow: 'visible',
        clipPath: 'inset(-6px -100vw 0 -100vw)',
      }}
    >
      {/* Ink rule, drawn left to right as the row enters. */}
      <InkRule seed={i * 31 + 5} delay={i * 0.12} />
      {/* Hover: a red fill wipes across the row. */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          // Edge to edge across the screen (Rajat, 2026-10-17).
          top: 1,
          bottom: 0,
          left: 'calc(50% - 50vw)',
          width: '100vw',
          background: RED,
          transform: `scaleX(${on ? 1 : 0})`,
          transformOrigin: on ? 'left' : 'right',
          transition: 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
          zIndex: 0,
        }}
      >
        <Grain opacity={0.18} blend="multiply" />
      </div>
      {/* Row labels (Habits:, Seating:, Makers:) removed: the numeral says it (Rajat, 2026-10-17). */}

      <div style={{ position: 'relative', zIndex: 1 }}>
        <Numeral d={d} h={narrow ? '48px' : 'clamp(56px, 9vh, 104px)'} digitRef={digitRef} base={base} fill={fg} />
      </div>
      {/* Title slides up out of its mask line. */}
      <motion.div
        initial="hid"
        whileInView="shown"
        viewport={{ once: true, amount: 0.3 }}
        style={{ position: 'relative', zIndex: 1, overflow: 'hidden', paddingTop: narrow ? 14 : 0 }}
      >
        <motion.span
          variants={{ hid: { y: '105%' }, shown: { y: 0 } }}
          transition={{ duration: 0.8, ease: EASE_OUT, delay: 0.15 + i * 0.12 }}
          style={{ ...CAPS, display: 'block', fontSize: narrow ? 26 : 'clamp(30px, 3.2vw, 60px)', letterSpacing: '-0.02em', lineHeight: 0.95, color: fg, transition: tr }}
        >
          {d.unit}
        </motion.span>
      </motion.div>
      {!narrow && (
        /* The split-panel moment: a photo field that opens when the row is
           in focus or hovered, a thin red grain strip otherwise. */
        <div style={{ position: 'relative', zIndex: 1, height: 'clamp(80px, 12vh, 140px)', overflow: 'hidden' }}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              // Fully hidden until the row is in focus or hovered, then whole.
              clipPath: open ? 'inset(0 0 0 0)' : 'inset(0 100% 0 0)',
              transition: 'clip-path 0.7s cubic-bezier(0.22, 1, 0.36, 1)',
              background: RED, // the photo is multiplied onto red: toned
            }}
          >
            <img
              src={FIELDS[i]}
              alt=""
              decoding="async"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: 'grayscale(1) contrast(1.1) brightness(1.08)', mixBlendMode: 'multiply', transition: 'transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)', transform: open ? 'scale(1)' : 'scale(1.12)' }}
            />
          </div>
        </div>
      )}
      <p
        style={{
          ...CAPS,
          position: 'relative',
          zIndex: 1,
          gridColumn: narrow ? '1 / -1' : 'auto',
          margin: 0,
          fontSize: narrow ? 13 : 'clamp(13px, 1vw, 17px)',
          lineHeight: 1.5,
          color: fg,
          transition: tr,
          textAlign: narrow ? 'left' : 'right',
          justifySelf: narrow ? 'start' : 'end',
          maxWidth: 400,
        }}
      >
        {d.body}
      </p>
    </div>
  );
}

export function DealA({ deals, narrow, digitRef, focus = -1 }: { deals: DealItem[]; narrow: boolean; digitRef: DigitRef; focus?: number }) {
  let k = 0;
  const big = narrow ? '44px' : 'clamp(52px, min(7vw, 10.5vh), 136px)';
  const card = (
    <>
      <Grain opacity={0.22} blend="multiply" />
      <span style={{ ...CAPS, position: 'absolute', right: 'clamp(14px, 1.4vw, 22px)', top: 'clamp(12px, 1.2vw, 18px)', fontSize: 11, color: 'rgba(255,255,255,0.9)' }}>The deal</span>
      {/* The closing line rides the top of the card; the headline's last
          line runs across its lower half. */}
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 14, maxWidth: '74%' }}>
        <Closing narrow={narrow} onRed />
      </div>
    </>
  );
  return (
    <>
      {/* The headline and the red card interlock (30.png). The card tilts in
          on its own beat, a little behind the type, so the two read as
          separate layers. */}
      <div style={{ position: 'relative', paddingTop: narrow ? 0 : 'clamp(4px, 1vh, 12px)' }}>
        {!narrow && (
          <motion.div
            initial={{ rotate: -7, y: 40, opacity: 0 }}
            whileInView={{ rotate: -1.5, y: 0, opacity: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 1.1, ease: EASE_OUT, delay: 0.25 }}
            style={{
              position: 'absolute',
              left: '38%',
              top: '6%',
              width: 'min(34%, 440px)',
              aspectRatio: '4 / 3',
              background: RED,
              padding: 'clamp(16px, 1.6vw, 26px)',
              overflow: 'hidden',
              zIndex: 0,
              boxShadow: '0 24px 50px rgba(235,63,67,0.25)',
            }}
          >
            {card}
          </motion.div>
        )}
        <h2
          style={{
            position: 'relative',
            zIndex: 1,
            margin: 0,
            fontFamily: 'var(--font-sans)',
            fontSize: big,
            fontWeight: 600,
            letterSpacing: '-0.05em',
            lineHeight: 0.9,
            color: INK,
          }}
        >
          <span style={{ display: 'block' }}>Putting</span>
          <span style={{ display: 'block' }}>
            the <span style={{ color: RED }}>red</span>
          </span>
          <span style={{ display: 'block', paddingLeft: narrow ? 0 : '30%', color: narrow ? RED : INK }}>in credible.</span>
        </h2>
      </div>

      {/* Deck rows (29.png). */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {deals.map((d, i) => {
          const base = k;
          k += d.n.length;
          return <DealRow key={i} d={d} i={i} base={base} narrow={narrow} digitRef={digitRef} focus={focus === i} />;
        })}
        <div style={{ position: 'relative', height: 1 }}>
          <InkRule seed={113} delay={0.4} />
        </div>
      </div>

      {narrow && (
        <div style={{ position: 'relative', background: RED, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 14, overflow: 'hidden' }}>
          {card}
        </div>
      )}
    </>
  );
}

/* ── B: the winding path ─────────────────────────────────────────────── */
export function DealB({ deals, narrow, digitRef }: { deals: DealItem[]; narrow: boolean; digitRef: DigitRef }) {
  let k = 0;
  if (narrow) {
    // Phone: the path runs down the left edge, a circle at each step.
    return (
      <>
        <h2 style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: 38, fontWeight: 600, letterSpacing: '-0.05em', lineHeight: 0.92 }}>
          Putting the red <span style={{ color: RED }}>in credible.</span>
        </h2>
        <div style={{ position: 'relative', paddingLeft: 0 }}>
          <div style={{ position: 'absolute', left: 48, top: 0, bottom: 0, borderLeft: `1.5px solid ${INK}` }} />
          {deals.map((d, i) => {
            const base = k;
            k += d.n.length;
            return (
              <div key={i} style={{ position: 'relative', display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 26 }}>
                <div style={{ flex: 'none', width: 96, height: 96, borderRadius: '50%', background: RED, display: 'grid', placeItems: 'center' }}>
                  <Numeral d={d} h="34px" digitRef={digitRef} base={base} fill="#FFFFFF" />
                </div>
                <div>
                  <span style={{ ...CAPS, fontSize: 11, color: RED }}>{String(i + 1).padStart(2, '0')}</span>
                  <p style={{ margin: '4px 0', fontFamily: 'var(--font-hand)', fontSize: 22, fontWeight: 700, color: INK }}>{d.unit}</p>
                  <p style={{ margin: 0, fontSize: 15, lineHeight: 1.45, opacity: 0.72 }}>{d.body}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 14 }}>
          <Closing narrow />
        </div>
      </>
    );
  }
  // Desktop: a line winding left to right across the card in S-curves
  // (31.png), dipping and rising; a circle at each turn holds the numeral.
  const W = 1000;
  const H = 300;
  const turns = [
    { x: 170, y: 200 },
    { x: 500, y: 100 },
    { x: 830, y: 200 },
  ];
  const path = `M0 60 C 90 60, 90 200, ${turns[0].x} 200 S 380 100, ${turns[1].x} 100 S 720 200, ${turns[2].x} 200 S 960 60, ${W} 60`;
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24 }}>
        <h2 style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: 'clamp(44px, min(6vw, 9.5vh), 110px)', fontWeight: 600, letterSpacing: '-0.05em', lineHeight: 0.92 }}>
          <span style={{ display: 'block' }}>Putting the red</span>
          <span style={{ display: 'block', color: RED }}>in credible.</span>
        </h2>
        <span style={{ ...CAPS, fontSize: 11, color: RED, textAlign: 'right' }}>
          The deal
          <br />
          in three steps
        </span>
      </div>
      <div style={{ position: 'relative', width: '100%', aspectRatio: `${W} / ${H}` }}>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }} aria-hidden>
          <path d={path} fill="none" stroke={INK} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
        </svg>
        {deals.map((d, i) => {
          const base = k;
          k += d.n.length;
          const t = turns[i];
          const below = t.y > H / 2;
          return (
            <div key={i}>
              <div
                style={{
                  position: 'absolute',
                  left: `${(t.x / W) * 100}%`,
                  top: `${(t.y / H) * 100}%`,
                  transform: 'translate(-50%, -50%)',
                  width: 'clamp(110px, 11vw, 180px)',
                  aspectRatio: '1',
                  borderRadius: '50%',
                  background: RED,
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <Numeral d={d} h="clamp(30px, 3.4vw, 58px)" digitRef={digitRef} base={base} fill="#FFFFFF" />
              </div>
              <div
                style={{
                  position: 'absolute',
                  left: `calc(${(t.x / W) * 100}% + clamp(64px, 6.4vw, 104px))`,
                  // Beside the circle, on the side of it the line leaves free.
                  top: below ? `${((t.y - 20) / H) * 100}%` : `${((t.y - 118) / H) * 100}%`,
                  width: 'clamp(160px, 15vw, 250px)',
                }}
              >
                <span style={{ ...CAPS, fontSize: 11, color: RED }}>{String(i + 1).padStart(2, '0')}</span>
                <p style={{ margin: '4px 0 6px', fontFamily: 'var(--font-hand)', fontSize: 'clamp(18px, 1.5vw, 26px)', fontWeight: 700, color: INK, lineHeight: 1.15 }}>{d.unit}</p>
                <p style={{ margin: 0, fontSize: 'clamp(13px, 0.95vw, 15px)', lineHeight: 1.45, opacity: 0.72 }}>{d.body}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <Closing narrow={narrow} />
      </div>
    </>
  );
}
