import type { CSSProperties } from 'react';

/* ─── Grain: the 1Red loop's film grain, for the web ───────────────────────
 * One 192px tile of random grey noise, drawn once to a canvas and reused as
 * a background image. The moving version only shifts the layer's transform
 * in steps (compositor work, no filter, no repaint), about 10 times a
 * second, which is what reads as live film grain. */
let tile: string | null = null;
export function grainTile(): string {
  if (tile) return tile;
  if (typeof document === 'undefined') return '';
  const n = 192;
  const c = document.createElement('canvas');
  c.width = c.height = n;
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(n, n);
  for (let i = 0; i < n * n; i++) {
    const v = Math.random() * 255;
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  tile = c.toDataURL('image/png');
  return tile;
}

export function Grain({ opacity = 0.09, moving = true, blend = 'overlay', style }: { opacity?: number; moving?: boolean; blend?: CSSProperties['mixBlendMode']; style?: CSSProperties }) {
  return (
    <div aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', ...style }}>
      <div
        className={moving ? 'grain-move' : undefined}
        style={{
          position: 'absolute',
          inset: '-50%',
          backgroundImage: `url(${grainTile()})`,
          backgroundSize: '192px 192px',
          opacity,
          mixBlendMode: blend,
        }}
      />
    </div>
  );
}
