import { useEffect, useRef, type CSSProperties } from 'react';

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

/* Alpha grain, for drawing WITHOUT a blend mode (2026-10-17 perf pass:
   mix-blend layers over large or moving areas cost up to 250 ms frames at
   2560x1340@2). "dark" darkens only, standing in for multiply; "both"
   lightens and darkens, standing in for overlay and soft-light. Plain alpha
   compositing is free next to a blend, and looks the same at grain
   strengths. */
const alphaTiles: Record<string, string> = {};
export function grainAlphaTile(kind: 'dark' | 'both' = 'both'): string {
  if (alphaTiles[kind]) return alphaTiles[kind];
  if (typeof document === 'undefined') return '';
  const n = 192;
  const c = document.createElement('canvas');
  c.width = c.height = n;
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(n, n);
  for (let i = 0; i < n * n; i++) {
    const v = Math.random();
    let g = 0;
    let a = 0;
    if (kind === 'dark') {
      g = 0;
      a = 1 - v;
    } else {
      g = v > 0.5 ? 255 : 0;
      a = Math.abs(v - 0.5) * 2;
    }
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = g;
    img.data[i * 4 + 3] = Math.round(a * 255);
  }
  ctx.putImageData(img, 0, 0);
  alphaTiles[kind] = c.toDataURL('image/png');
  return alphaTiles[kind];
}

export function Grain({ opacity = 0.09, moving = true, blend = 'overlay', style }: { opacity?: number; moving?: boolean; blend?: CSSProperties['mixBlendMode']; style?: CSSProperties }) {
  // The steps only run while the grain is on screen (perf pass 2026-10-17:
  // off-screen grain kept stepping and cost frames all down the home page).
  const boxRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const box = boxRef.current;
    const layer = layerRef.current;
    if (!moving || !box || !layer) return;
    const io = new IntersectionObserver(([e]) => layer.classList.toggle('grain-move', e.isIntersecting));
    io.observe(box);
    return () => io.disconnect();
  }, [moving]);
  return (
    <div ref={boxRef} aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', ...style }}>
      <div
        ref={layerRef}
        style={{
          position: 'absolute',
          // One tile of overscan covers the steps (theme.css grain-move).
          inset: -96,
          backgroundImage: `url(${grainAlphaTile(blend === 'multiply' ? 'dark' : 'both')})`,
          backgroundSize: '192px 192px',
          // No blend mode (see grainAlphaTile); the strength reads a little
          // stronger than the blended version, hence the 0.6.
          opacity: opacity * 0.6,
        }}
      />
    </div>
  );
}
