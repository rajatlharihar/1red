import * as THREE from 'three';

/* ─── Drawn surfaces for the entrance ──────────────────────────────────────
 * Generated at runtime, so nothing extra has to be fetched.
 * ────────────────────────────────────────────────────────────────────────── */

const INK = '20, 18, 16';

/** Deterministic PRNG, so a surface is pixel-identical on every repaint. */
function rng(seed: number) {
  let n = seed * 9301 + 49297;
  return () => ((n = (n * 9301 + 49297) % 233280) / 233280);
}

/* ── The facade: pencil hatching ──────────────────────────────────────────
 * Tiles seamlessly. Diagonal strokes do not wrap on their own, so every
 * stroke is drawn nine times — once in place and once for each neighbouring
 * tile position — and whatever falls outside the canvas is simply clipped.
 * A stroke leaving the right edge therefore re-enters on the left at exactly
 * the height it left, and the repeat has no visible seam. */
function strokeWrapped(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  size: number
) {
  for (let ox = -1; ox <= 1; ox++) {
    for (let oy = -1; oy <= 1; oy++) {
      ctx.beginPath();
      ctx.moveTo(x0 + ox * size, y0 + oy * size);
      ctx.lineTo(x1 + ox * size, y1 + oy * size);
      ctx.stroke();
    }
  }
}

export function createHatchTexture(): THREE.CanvasTexture {
  const S = 512;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(c);

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, S, S);

  const rand = rng(17);
  ctx.lineCap = 'round';

  /* Primary pass — the dominant hand direction, as if one person shaded the
     whole wall in one sitting: consistent angle, inconsistent pressure. */
  for (let i = 0; i < 210; i++) {
    const x = rand() * S;
    const y = rand() * S;
    const len = S * (0.09 + rand() * 0.16);
    const angle = -Math.PI / 4 + (rand() - 0.5) * 0.16;
    ctx.strokeStyle = `rgba(${INK}, ${0.05 + rand() * 0.07})`;
    ctx.lineWidth = 0.7 + rand() * 0.9;
    strokeWrapped(ctx, x, y, x + Math.cos(angle) * len, y + Math.sin(angle) * len, S);
  }

  /* Cross pass — lighter and sparser. Enough to read as shading rather than
     as a printed diagonal pattern. */
  for (let i = 0; i < 110; i++) {
    const x = rand() * S;
    const y = rand() * S;
    const len = S * (0.07 + rand() * 0.12);
    const angle = Math.PI / 4 + (rand() - 0.5) * 0.2;
    ctx.strokeStyle = `rgba(${INK}, ${0.03 + rand() * 0.05})`;
    ctx.lineWidth = 0.6 + rand() * 0.7;
    strokeWrapped(ctx, x, y, x + Math.cos(angle) * len, y + Math.sin(angle) * len, S);
  }

  // Tooth of the paper.
  for (let i = 0; i < 2600; i++) {
    ctx.fillStyle = `rgba(${INK}, ${0.02 + rand() * 0.05})`;
    ctx.fillRect(rand() * S, rand() * S, 1.2, 1.2);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}
