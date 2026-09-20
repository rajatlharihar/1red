import * as THREE from 'three';
import { HERO_FOV, FACADE_Z, doorRimX, facadeFrontZ, sampleSequence } from './studioSequence';

/* ─── The statement on the wall ────────────────────────────────────────────
 * "Got an idea that needs every skill?" lettered on the facade to the
 * right of the door, as signage painted on the building rather than a
 * caption over the picture. It lives on the wall plane, so the opening sweep
 * carries it: it foreshortens with the wall and slides out of frame as the
 * camera glides onto the door. Nothing fades.
 *
 * PLACEMENT IS DERIVED, NOT TYPED IN. The establishing shot is rolled and
 * oblique, so the patch of wall the viewer actually sees at p = 0 is a
 * skewed quadrilateral that changes with the viewport's aspect (on a phone
 * the door is not even in frame yet). The block is fitted into that patch:
 * the largest type whose lines sit inside the frame, right of the door rim,
 * with the left edge running along the rim at a constant margin (each line
 * starts where the rim is at its own height, so the block leans with the
 * jamb). Lines are horizontal on the wall, as painted lettering would be.
 * ────────────────────────────────────────────────────────────────────────── */

export const STATEMENT = 'Got an idea that needs every skill?';

const INK = '#0A0A0A';
const RED = '#FF0000';
const FONT = "'Outfit', system-ui, -apple-system, sans-serif";
const WEIGHT = 700;
/** Cap-height-to-em and advance ratios are measured live; these are layout. */
const LINE_HEIGHT = 0.92; // of font size, uppercase set tight
const CAP = 0.72; // Outfit's cap height, of font size
const TRACKING = -0.02; // em
/** Margin from the door rim to the text's left edge, in metres. */
const RIM_MARGIN = 0.9;
/** Keep the block this far inside the frame's own edges, in metres. */
const FRAME_PAD = 0.25;
/** The wall band the text may occupy (metres above the approach ground). */
const Y_MIN = 0.9;
const Y_MIN_PORTRAIT = 1.9;
const Y_MAX = 5.2;

/** Candidate line breaks, longest-first lines are fine; the fitter picks the
 *  set that gives the biggest type for the patch of wall available. */
const BREAKS: string[][] = [
  ['GOT AN IDEA', 'THAT NEEDS', 'EVERY SKILL?'],
  ['GOT AN IDEA', 'THAT NEEDS', 'EVERY', 'SKILL?'],
  ['GOT AN', 'IDEA', 'THAT', 'NEEDS', 'EVERY', 'SKILL?'],
];

interface Line {
  text: string;
  /** Left edge in wall metres. */
  x: number;
  /** Baseline in wall metres. */
  y: number;
}

export interface WallStatementLayout {
  /** Font size in wall metres. */
  size: number;
  lines: Line[];
  /** Bounding box of the block in wall metres. */
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

/* ── Where the wall is on screen at p = 0 ─────────────────────────────── */

/** The visible wall region at the opening shot, as the x-interval of wall
 *  the frame covers at height `y`. Built by casting the frame's four corners
 *  onto the (leaning) facade face; the images of the frame's straight edges
 *  are straight on the plane, so the region is a convex quad. */
function visibleWall(aspect: number) {
  const cam = new THREE.PerspectiveCamera(HERO_FOV, aspect, 0.05, 60);
  const s = sampleSequence(0);
  cam.position.set(s.camX, s.camY, s.camZ);
  cam.lookAt(s.lookX, s.lookY, s.lookZ);
  cam.rotateZ(s.camRoll);
  cam.updateMatrixWorld();

  const rc = new THREE.Raycaster();
  const hit = new THREE.Vector3();
  const cast = (nx: number, ny: number) => {
    rc.setFromCamera(new THREE.Vector2(nx, ny), cam);
    // The face leans with height: iterate the plane depth to the hit height.
    let z = FACADE_Z + facadeFrontZ(1.5);
    for (let i = 0; i < 6; i++) {
      const pl = new THREE.Plane(new THREE.Vector3(0, 0, 1), -z);
      if (!rc.ray.intersectPlane(pl, hit)) return null;
      z = FACADE_Z + facadeFrontZ(hit.y);
    }
    return hit.clone();
  };
  const corners = [cast(-1, 1), cast(1, 1), cast(1, -1), cast(-1, -1)];
  if (corners.some((c) => !c)) return null;
  const quad = corners as THREE.Vector3[];

  /** x-interval of the quad at height y, or null when the line misses it. */
  return (y: number): [number, number] | null => {
    let lo = Infinity;
    let hi = -Infinity;
    for (let i = 0; i < 4; i++) {
      const a = quad[i];
      const b = quad[(i + 1) % 4];
      if ((y < a.y && y < b.y) || (y > a.y && y > b.y) || a.y === b.y) continue;
      const t = (y - a.y) / (b.y - a.y);
      const x = a.x + (b.x - a.x) * t;
      lo = Math.min(lo, x);
      hi = Math.max(hi, x);
    }
    return lo <= hi ? [lo, hi] : null;
  };
}

/* ── Fitting ─────────────────────────────────────────────────────────── */

function measure(ctx: CanvasRenderingContext2D, text: string, em: number) {
  ctx.font = `${WEIGHT} ${em}px ${FONT}`;
  let w = 0;
  for (const ch of text) w += ctx.measureText(ch).width + TRACKING * em;
  return w - TRACKING * em;
}

export function layoutWallStatement(ctx: CanvasRenderingContext2D, aspect: number): WallStatementLayout | null {
  const span = visibleWall(aspect);
  if (!span) return null;


  /* Each line starts a fixed margin right of the door rim, or a fixed pad
     inside the frame's left edge where that is further right (the phone,
     where the door is out of frame). Both edges are straight lines on the
     wall, so the block leans with whichever it hugs. A line is checked at
     its baseline AND its cap line: the frame is rolled, so its edges cross
     a line of lettering at an angle and the tighter of the two rows binds. */
  const leftAt = (y: number) => {
    const sp = span(y);
    return sp ? Math.max(doorRimX(y) + RIM_MARGIN, sp[0] + FRAME_PAD) : null;
  };
  const rightAt = (y: number) => {
    const sp = span(y);
    return sp ? sp[1] - FRAME_PAD : null;
  };
  const lineLeft = (baseline: number, size: number) => {
    const a = leftAt(baseline);
    const b = leftAt(baseline + size * CAP);
    return a == null || b == null ? null : Math.max(a, b);
  };
  const lineRight = (baseline: number, size: number) => {
    const a = rightAt(baseline);
    const b = rightAt(baseline + size * CAP);
    return a == null || b == null ? null : Math.min(a, b);
  };

  /** Lines for a band, at a size: baselines from the top of the band down. */
  const place = (lines: string[], y1: number, size: number): Line[] | null => {
    const out: Line[] = [];
    let top = y1;
    for (const text of lines) {
      const baseline = top - size * CAP; // caps sit on the baseline
      const x = lineLeft(baseline, size);
      if (x == null) return null;
      out.push({ text, x, y: baseline });
      top -= size * LINE_HEIGHT;
    }
    return out;
  };

  /* A phone sees a narrow, tall strip of wall. Six one-word lines fit it
     biggest, but read timid and sat low, where the door's edge cut through
     them as the sweep began (Rajat's review). So a portrait frame keeps to
     the four-line setting, which fills the strip's width, and the block
     stays out of the lower third, clear of the door's edge and the cue. */
  const portrait = aspect < 1;
  const candidates = portrait ? [BREAKS[1]] : BREAKS;
  const yMin = portrait ? Y_MIN_PORTRAIT : Y_MIN;
  const EM = 100;
  const widths = candidates.map((lines) => lines.map((l) => measure(ctx, l, EM) / EM));
  let best: WallStatementLayout | null = null;
  const STEPS = 36;
  for (let bi = 0; bi < candidates.length; bi++) {
    const lines = candidates[bi];
    const n = lines.length;
    for (let i = 0; i <= STEPS; i++) {
      const y0 = yMin + ((Y_MAX - yMin) * i) / STEPS;
      if (!span(y0)) continue;
      for (let j = i + 1; j <= STEPS; j++) {
        const y1 = yMin + ((Y_MAX - yMin) * j) / STEPS;
        if (!span(y1)) continue;
        // Height sets the first guess; then every line must also fit
        // between the wall's edges at its own height. The edges move with
        // the baselines, so settle it in a couple of passes.
        let size = (y1 - y0) / (n * LINE_HEIGHT);
        let out: Line[] | null = null;
        for (let pass = 0; pass < 3; pass++) {
          out = place(lines, y1, size);
          if (!out) break;
          let k = size;
          for (let li = 0; li < n; li++) {
            const r = lineRight(out[li].y, size);
            if (r == null) {
              k = 0;
              break;
            }
            k = Math.min(k, (r - out[li].x) / widths[bi][li]);
          }
          if (k <= 0) {
            out = null;
            break;
          }
          if (Math.abs(k - size) < 1e-4) break;
          size = k;
        }
        if (!out || !(size > 0)) continue;
        if (!best || size > best.size) {
          const ends = out.map((l, li) => l.x + widths[bi][li] * size);
          best = {
            size,
            lines: out,
            x0: Math.min(...out.map((l) => l.x)),
            x1: Math.max(...ends),
            y0: out[n - 1].y - size * (LINE_HEIGHT - CAP),
            y1,
          };
        }
      }
    }
  }
  return best;
}

/* ── Drawing ─────────────────────────────────────────────────────────── */

export interface WallStatement {
  texture: THREE.CanvasTexture;
  /** Plane size and centre in wall metres. */
  w: number;
  h: number;
  cx: number;
  cy: number;
  redraw: () => void;
}

/** Builds the lettering as a transparent canvas over the block's bounding
 *  box, so the wall's hatching shows through around the letters. */
export function createWallStatement(aspect: number, canvasPx: number): WallStatement | null {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const layout = layoutWallStatement(ctx, aspect);
  if (!layout) return null;

  const w = layout.x1 - layout.x0;
  const h = layout.y1 - layout.y0;
  const pxPerMetre = canvasPx / w;
  const cw = Math.round(w * pxPerMetre);
  const ch = Math.round(h * pxPerMetre);
  canvas.width = cw;
  canvas.height = ch;

  const draw = () => {
    ctx.clearRect(0, 0, cw, ch);
    ctx.textBaseline = 'alphabetic';
    const em = layout.size * pxPerMetre;
    ctx.font = `${WEIGHT} ${em}px ${FONT}`;
    for (const line of layout.lines) {
      let x = (line.x - layout.x0) * pxPerMetre;
      const y = (layout.y1 - line.y) * pxPerMetre;
      for (const chr of line.text) {
        ctx.fillStyle = chr === '?' ? RED : INK;
        ctx.fillText(chr, x, y);
        x += ctx.measureText(chr).width + TRACKING * em;
      }
    }
  };
  draw();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;

  return {
    texture,
    w,
    h,
    cx: (layout.x0 + layout.x1) / 2,
    cy: (layout.y0 + layout.y1) / 2,
    redraw: () => {
      draw();
      texture.needsUpdate = true;
    },
  };
}
