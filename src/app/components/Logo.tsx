// Uses an SVG feColorMatrix filter to isolate only the red letterforms.
// The alpha channel is derived from "redness": A' = 3R − 3G − 3B
//   Red pixel  (~0.85, 0.22, 0.19) → A = 2.55−0.66−0.57 = 1.32 → 1 (opaque)  ✓
//   Cream bg   (~1.00, 0.98, 0.94) → A = 3.00−2.94−2.82 = −0.76 → 0 (transparent) ✓
// Result: pure transparent logo — no background shape, no box, no card.
import logoSrc from '@/imports/Screenshot_2026-07-03_at_1.17.51_PM.png';

// Stable filter ID — unique enough to avoid collisions with other SVG filters on the page.
const FILTER_ID = 'logo-alpha-extract';

interface LogoProps {
  /** Display width in px. Height auto-derived from the 1.66:1 aspect ratio. */
  width?: number;
  className?: string;
}

export function Logo({ width = 140, className }: LogoProps) {
  const height = Math.round(width / 1.66);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', flexShrink: 0, overflow: 'visible' }}
      className={className}
    >
      <defs>
        <filter
          id={FILTER_ID}
          colorInterpolationFilters="sRGB"
          x="0" y="0" width="1" height="1"
        >
          {/*
            RGB channels pass through unchanged (red stays red).
            Alpha is computed from redness: high R relative to G+B = opaque;
            neutral/light colours = transparent.
          */}
          <feColorMatrix
            type="matrix"
            values="1  0  0  0  0
                    0  1  0  0  0
                    0  0  1  0  0
                    3 -3 -3  0  0"
          />
        </filter>
      </defs>
      <image
        href={logoSrc}
        x="0"
        y="0"
        width={width}
        height={height}
        preserveAspectRatio="xMidYMid meet"
        filter={`url(#${FILTER_ID})`}
      />
    </svg>
  );
}
