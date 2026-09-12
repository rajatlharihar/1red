import * as THREE from 'three';

/* ─── Facade posters — designed, not filled ────────────────────────────────
 * Six studio posters mounted around the entrance, drawn to canvas at
 * runtime. Each has an actual graphic concept — Swiss modernist geometry,
 * riso-print halftone, technical blueprint, retro sunburst, a process
 * diagram, a marquee band — rather than type sitting on a flat colour.
 *
 * WORDS: every line of copy is the studio's own, lifted from the live site —
 * the four principles (Studio.tsx) and the five process steps
 * (data/process.ts). No invented awards, metrics, clients or slogans.
 *
 * The wordmark deliberately appears NOWHERE here. Setting "1RED" in a
 * typeface would be approximating the logo with a font, which this project
 * forbids outright — and the real mark is the payoff waiting inside.
 * ────────────────────────────────────────────────────────────────────────── */

const RED = '#EA3323';
const INK = '#141210';
const PAPER = '#F4F1EB';
const CREAM = '#EFE9DE';

const FONT = "'Outfit', system-ui, -apple-system, sans-serif";

export type PosterDesign = 'clarity' | 'strategy' | 'details' | 'longevity' | 'process' | 'services';
export interface PosterSpec {
  design: PosterDesign;
}

/* ── Drawing helpers ─────────────────────────────────────────────────────── */

/** Deterministic PRNG so a poster is pixel-identical on every repaint. */
function rng(seed: number) {
  let n = seed * 9301 + 49297;
  return () => ((n = (n * 9301 + 49297) % 233280) / 233280);
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxW: number, start: number, weight = 800) {
  let size = start;
  ctx.font = `${weight} ${size}px ${FONT}`;
  while (ctx.measureText(text).width > maxW && size > 8) {
    size -= 1;
    ctx.font = `${weight} ${size}px ${FONT}`;
  }
  return size;
}

function letterspace(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, sp: number) {
  let cx = x;
  for (const ch of text) {
    ctx.fillText(ch, cx, y);
    cx += ctx.measureText(ch).width + sp;
  }
}

function lsWidth(ctx: CanvasRenderingContext2D, text: string, sp: number) {
  let w = 0;
  for (const ch of text) w += ctx.measureText(ch).width + sp;
  return w - sp;
}

/** Stacked headline, fitted on BOTH axes.
 *  Width alone is not enough: a three-line block sized only to the widest
 *  line can still push its last baseline past the bottom of the sheet. This
 *  takes the smaller of the two constraints so the block always lands
 *  inside the poster, whichever typeface ends up resolving. */
function drawStack(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  x: number,
  firstBaseline: number,
  maxW: number,
  startSize: number,
  bottomLimit: number,
  color: string
) {
  let size = startSize;
  lines.forEach((l) => (size = Math.min(size, fitText(ctx, l, maxW, startSize))));
  if (lines.length > 1) {
    size = Math.min(size, (bottomLimit - firstBaseline) / (lines.length - 1));
  }
  ctx.font = `800 ${size}px ${FONT}`;
  ctx.fillStyle = color;
  ctx.textBaseline = 'alphabetic';
  lines.forEach((l, i) => ctx.fillText(l, x, firstBaseline + i * size));
  return size;
}

/** Riso-style halftone field, denser at one end. */
function halftone(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  spacing: number,
  maxR: number,
  invert = false
) {
  ctx.save();
  ctx.fillStyle = color;
  for (let py = y; py <= y + h; py += spacing) {
    for (let px = x; px <= x + w; px += spacing) {
      const t = (py - y) / h;
      const r = maxR * (invert ? t : 1 - t);
      if (r > 0.35) {
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.restore();
}

/** Fine print grain — keeps flat areas from looking like vector fills. */
function grain(ctx: CanvasRenderingContext2D, w: number, h: number, amount: number, seed: number) {
  const rand = rng(seed);
  ctx.save();
  for (let i = 0; i < amount; i++) {
    ctx.fillStyle = `rgba(0,0,0,${0.03 + rand() * 0.05})`;
    ctx.fillRect(rand() * w, rand() * h, 1.4, 1.4);
  }
  ctx.restore();
}

function keyline(ctx: CanvasRenderingContext2D, w: number, h: number, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1, w * 0.005);
  ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, w - ctx.lineWidth, h - ctx.lineWidth);
}

/* ── A · CLARITY OVER COMPLEXITY — Swiss modernist ────────────────────────
 * A red disc whose left half is broken into dense stripes and whose right
 * half is left whole: complexity resolving into clarity, stated in geometry
 * before it is stated in words. */
function drawClarity(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, w, h);

  const cx = w * 0.5;
  const cy = h * 0.37;
  const r = w * 0.33;

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = RED;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  // Left half fractured into bars that thin out toward the centre line.
  ctx.fillStyle = INK;
  let bx = cx - r;
  let bw = r * 0.2;
  while (bx < cx) {
    ctx.fillRect(bx, cy - r, bw, r * 2);
    bx += bw * 2.05;
    bw *= 0.72;
  }
  ctx.restore();

  ctx.strokeStyle = INK;
  ctx.lineWidth = w * 0.008;
  ctx.beginPath();
  ctx.moveTo(w * 0.1, h * 0.63);
  ctx.lineTo(w * 0.9, h * 0.63);
  ctx.stroke();

  drawStack(ctx, ['CLARITY', 'OVER', 'COMPLEXITY'], w * 0.1, h * 0.72, w * 0.8, w * 0.155, h * 0.93, INK);

  grain(ctx, w, h, 900, 3);
  keyline(ctx, w, h, 'rgba(20,18,16,0.18)');
}

/* ── B · STRATEGY BEFORE STYLE — riso print ───────────────────────────────
 * Two overlapping forms with a multiply overlap, halftone falloff, and the
 * slight misregistration of a screen print. */
function drawStrategy(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = RED;
  ctx.fillRect(0, 0, w, h);

  halftone(ctx, 0, h * 0.45, w, h * 0.55, 'rgba(244,241,235,0.5)', w * 0.032, w * 0.014, true);

  // Cream disc
  ctx.save();
  ctx.globalAlpha = 0.95;
  ctx.fillStyle = CREAM;
  ctx.beginPath();
  ctx.arc(w * 0.4, h * 0.3, w * 0.27, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Ink triangle overlapping it — multiply gives the printed-overlap darkness
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.moveTo(w * 0.62, h * 0.12);
  ctx.lineTo(w * 0.88, h * 0.44);
  ctx.lineTo(w * 0.36, h * 0.44);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  drawStack(ctx, ['STRATEGY', 'BEFORE', 'STYLE'], w * 0.1, h * 0.72, w * 0.8, w * 0.16, h * 0.93, CREAM);

  grain(ctx, w, h, 700, 7);
  keyline(ctx, w, h, 'rgba(244,241,235,0.3)');
}

/* ── C · DETAILS MATTER — technical blueprint, the futuristic one ─────────
 * Measurement grid, registration rings, edge ticks: the drawing under the
 * design. */
function drawDetails(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, w, h);

  // Grid
  ctx.strokeStyle = 'rgba(244,241,235,0.09)';
  ctx.lineWidth = 1;
  const g = w * 0.06;
  for (let x = 0; x <= w; x += g) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y <= h; y += g) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  const cx = w * 0.5;
  const cy = h * 0.37;

  // Registration rings
  [0.34, 0.25, 0.16, 0.07].forEach((f, i) => {
    ctx.strokeStyle = i === 1 ? RED : 'rgba(244,241,235,0.4)';
    ctx.lineWidth = i === 1 ? w * 0.012 : w * 0.004;
    ctx.beginPath();
    ctx.arc(cx, cy, w * f, 0, Math.PI * 2);
    ctx.stroke();
  });

  // Crosshair
  ctx.strokeStyle = RED;
  ctx.lineWidth = w * 0.006;
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.42, cy);
  ctx.lineTo(cx + w * 0.42, cy);
  ctx.moveTo(cx, cy - w * 0.42);
  ctx.lineTo(cx, cy + w * 0.42);
  ctx.stroke();

  ctx.fillStyle = RED;
  ctx.beginPath();
  ctx.arc(cx, cy, w * 0.018, 0, Math.PI * 2);
  ctx.fill();

  // Edge ticks
  ctx.strokeStyle = 'rgba(244,241,235,0.55)';
  ctx.lineWidth = 1.5;
  for (let x = w * 0.1; x <= w * 0.9; x += w * 0.03) {
    const tall = Math.round((x - w * 0.1) / (w * 0.03)) % 5 === 0;
    ctx.beginPath();
    ctx.moveTo(x, h * 0.63);
    ctx.lineTo(x, h * 0.63 - (tall ? w * 0.05 : w * 0.026));
    ctx.stroke();
  }

  drawStack(ctx, ['DETAILS', 'MATTER'], w * 0.1, h * 0.78, w * 0.8, w * 0.19, h * 0.93, PAPER);

  keyline(ctx, w, h, 'rgba(244,241,235,0.25)');
}

/* ── D · BUILD FOR LONGEVITY — retro sunburst ─────────────────────────────
 * Rays behind a stacked block tower: things built from modular units, still
 * standing. The stacking echoes how the mark itself is constructed. */
function drawLongevity(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = CREAM;
  ctx.fillRect(0, 0, w, h);

  const cx = w * 0.5;
  const cy = h * 0.62;

  ctx.save();
  ctx.fillStyle = RED;
  const rays = 18;
  for (let i = 0; i < rays; i++) {
    if (i % 2) continue;
    const a0 = Math.PI + (i / rays) * Math.PI;
    const a1 = Math.PI + ((i + 1) / rays) * Math.PI;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, w * 0.85, a0, a1);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Stacked tower — offset units, narrowing upward
  ctx.fillStyle = INK;
  const uw = w * 0.15;
  const uh = h * 0.052;
  const stack = [0, -0.5, 0.4, -0.2, 0.6, 0];
  stack.forEach((off, i) => {
    const bw = uw * (1 + (stack.length - i) * 0.12);
    ctx.fillRect(cx - bw / 2 + off * uw, cy - uh * (i + 1) - uh * 0.6, bw, uh * 0.86);
  });

  drawStack(ctx, ['BUILD FOR', 'LONGEVITY'], w * 0.1, h * 0.78, w * 0.8, w * 0.145, h * 0.93, INK);

  grain(ctx, w, h, 900, 13);
  keyline(ctx, w, h, 'rgba(20,18,16,0.18)');
}

/* ── E · Banner: the process ──────────────────────────────────────────────
 * The five real steps from data/process.ts, drawn as a measured diagram. */
function drawProcess(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, w, h);

  const steps = ['DISCOVER', 'DEFINE', 'DESIGN', 'DELIVER', 'REFINE'];
  const n = steps.length;
  const pad = w * 0.035;

  /* Measure BEFORE laying out. The previous version pinned the end nodes at
     8%/92% and centred each label on its node without checking the result:
     DISCOVER started at x=−45 and REFINE ran past the canvas edge, while the
     widest label (294px) overflowed its 269px slot and collided with its
     neighbour. Here the type shrinks until every label clears its slot AND
     the outer two sit fully inside the sheet — so it cannot clip regardless
     of which typeface actually resolves. */
  let size = h * 0.1;
  let sp = size * 0.15;
  let maxW = 0;
  let x0 = 0;
  let x1 = 0;
  for (;;) {
    ctx.font = `700 ${size}px ${FONT}`;
    sp = size * 0.15;
    maxW = Math.max(...steps.map((s) => lsWidth(ctx, s, sp)));
    x0 = Math.max(w * 0.07, maxW / 2 + pad);
    x1 = w - x0;
    const slot = (x1 - x0) / (n - 1);
    if ((x1 > x0 && slot >= maxW * 1.12) || size <= 9) break;
    size -= 1;
  }
  const slot = (x1 - x0) / (n - 1);
  const y = h * 0.5;

  // Measurement ticks behind the rule — the diagram reads as drawn, not typed.
  ctx.strokeStyle = 'rgba(20,18,16,0.16)';
  ctx.lineWidth = 1;
  for (let x = x0; x <= x1 + 0.5; x += slot / 6) {
    ctx.beginPath();
    ctx.moveTo(x, y - h * 0.035);
    ctx.lineTo(x, y + h * 0.035);
    ctx.stroke();
  }

  ctx.strokeStyle = INK;
  ctx.lineWidth = h * 0.011;
  ctx.beginPath();
  ctx.moveTo(x0, y);
  ctx.lineTo(x1, y);
  ctx.stroke();

  steps.forEach((s, i) => {
    const x = x0 + slot * i;

    ctx.fillStyle = RED;
    ctx.beginPath();
    ctx.arc(x, y, h * 0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PAPER;
    ctx.beginPath();
    ctx.arc(x, y, h * 0.021, 0, Math.PI * 2);
    ctx.fill();

    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = 'rgba(20,18,16,0.42)';
    ctx.font = `600 ${h * 0.068}px ${FONT}`;
    const num = `0${i + 1}`;
    ctx.fillText(num, x - ctx.measureText(num).width / 2, y - h * 0.115);

    ctx.fillStyle = INK;
    ctx.font = `700 ${size}px ${FONT}`;
    letterspace(ctx, s, x - lsWidth(ctx, s, sp) / 2, y + h * 0.235, sp);
  });

  grain(ctx, w, h, 500, 21);
  keyline(ctx, w, h, 'rgba(20,18,16,0.18)');
}

/* ── F · Banner: capability marquee ───────────────────────────────────────
 * The studio's real disciplines as one continuous printed band.
 *
 * This was originally six equal colour blocks with a word centred in each.
 * On a 1280px sheet that gives each word ~179px to live in, which forced
 * "WEB DESIGN" down to roughly 17px type — illegible once the banner is
 * mapped onto a 5.6-unit wall. A single fitted line uses the full width
 * instead, so the same words land about twice the size. */
function drawServices(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const items = ['BRANDING', 'WEB DESIGN', 'UI/UX', 'MOTION', 'STRATEGY', 'SOCIAL'];

  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, w, h);

  // Rules top and bottom — the band reads as printed signage.
  ctx.fillStyle = RED;
  ctx.fillRect(0, 0, w, h * 0.075);
  ctx.fillRect(0, h - h * 0.075, w, h * 0.075);

  const avail = w * 0.88;
  let size = h * 0.24;
  let sp = size * 0.1;
  let gap = size * 0.9;
  let total = 0;
  for (;;) {
    ctx.font = `700 ${size}px ${FONT}`;
    sp = size * 0.1;
    gap = size * 0.9;
    total = items.reduce((a, s) => a + lsWidth(ctx, s, sp), 0) + gap * (items.length - 1);
    if (total <= avail || size <= 9) break;
    size -= 1;
  }

  const baseline = h * 0.5 + size * 0.36;
  let x = (w - total) / 2;

  ctx.textBaseline = 'alphabetic';
  items.forEach((s, i) => {
    ctx.fillStyle = PAPER;
    ctx.font = `700 ${size}px ${FONT}`;
    letterspace(ctx, s, x, baseline, sp);
    x += lsWidth(ctx, s, sp);

    // Red square separator — the site's own eyebrow motif, used as punctuation.
    if (i < items.length - 1) {
      ctx.fillStyle = RED;
      const sq = size * 0.26;
      ctx.fillRect(x + gap / 2 - sq / 2, baseline - size * 0.36 - sq / 2 + size * 0.18, sq, sq);
      x += gap;
    }
  });

  keyline(ctx, w, h, 'rgba(244,241,235,0.22)');
}

const DRAW: Record<PosterDesign, (c: CanvasRenderingContext2D, w: number, h: number) => void> = {
  clarity: drawClarity,
  strategy: drawStrategy,
  details: drawDetails,
  longevity: drawLongevity,
  process: drawProcess,
  services: drawServices,
};

export function createPosterTexture(spec: PosterSpec, portrait: boolean): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = portrait ? 640 : 1280;
  c.height = portrait ? 886 : 436;
  const ctx = c.getContext('2d');

  const paint = () => {
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, c.width, c.height);
    DRAW[spec.design](ctx, c.width, c.height);
  };

  paint();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;

  // Outfit arrives over the network, so the first paint can land on a
  // fallback face — repaint once the real webfont resolves.
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    document.fonts.ready
      .then(() => {
        paint();
        tex.needsUpdate = true;
      })
      .catch(() => {});
  }

  return tex;
}
