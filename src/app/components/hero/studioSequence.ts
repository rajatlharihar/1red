/* ─── ENTER 1RED — the sequence's single source of truth ───────────────────
 * Every element of the entrance (camera dolly, door panels, interior light,
 * logo reveal, hand-off veil) derives from ONE normalized scroll value.
 * Pure functions of `p`, no animation state — which is exactly why
 * scrubbing backwards is free: reversing is just evaluating the same
 * functions at a smaller number.
 *
 * SCALE IS METRIC. Studio.glb is a real-world-scale asset — a 10 × 10 m room
 * with a 3.01 m ceiling — so the entrance is built at 1 unit = 1 metre
 * around it. The earlier procedural set was roughly 7× larger; rather than
 * inflate the supplied model to fit that, the door and camera were rebuilt
 * to the model's own scale. A 2.4 m door and a 1.6 m eye height are what
 * make the space read as somewhere a person could actually walk.
 * ────────────────────────────────────────────────────────────────────────── */

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const track = (p: number, from: number, to: number) => clamp01((p - from) / (to - from));

export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeInOutQuad = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
export const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

/* ── Studio.glb, measured ────────────────────────────────────────────────
 * Bounds parsed straight from the file, then rotated −90° about Y so the
 * model's open side (its +X) faces the camera down −Z.
 *   before:  X −3.42…6.59   Y −0.02…3.01   Z −5.02…5.02
 *   after:   X −5.02…5.02   Y −0.02…3.01   Z −3.42…6.59
 * The curtain enclosure ends at z = 1.7 — that is the real threshold — and
 * the cyclorama backdrop hangs beyond it (exact face measured below). */
export const MODEL_ROT_Y = -Math.PI / 2;
export const MODEL_FLOOR_LIFT = 0.02; // floor sits at y = −0.02; nudge it onto y = 0
export const THRESHOLD_Z = 1.7;

/* Measured from the backdrop's actual vertices, not from its bounding box.
 * The cyclorama curves, so its front face moves with height:
 *   y 1.1 → z −1.23   y 1.4 → z −1.26   y 1.7 → z −1.28
 * The mark therefore sits at z = −1.18, clear in front of the frontmost
 * point of the fabric across the whole height it occupies. Placing it on
 * the group's bbox centre (−1.34) buried it 8 cm INSIDE the fabric, which
 * is why it never appeared. */
export const BACKDROP_Z = -1.26;
export const LOGO_Z = -1.18;

/* ── The entrance, built to that scale ───────────────────────────────────*/
export const DOORWAY_W = 2.2;
export const DOORWAY_H = 2.4;
export const FACADE_Z = 5.5; // stands on the model's own floor, ahead of the curtain line
export const FACADE_W = 20;
export const FACADE_H = 8;
export const DOOR_TRAVEL = 1.15; // slides each panel fully behind the facade

/* ── The mark, measured from the brand PNG's actual pixels ───────────────
 * The source (564 × 316) does NOT have the mark centred in it, and its
 * frame is not the mark's own proportion. Decoding it with the same
 * redness rule the shader uses (A = 3R − 3G − 3B) gives:
 *
 *   mark bbox      x 52…462   y 20…269   → 411 × 250, aspect 1.644
 *   image centre   (282, 158)
 *   mark  centre   (257.5, 145)  → 4.34% left and 4.11% high
 *
 * Two consequences, both previously wrong here:
 *  1. A plane centred at x = 0 renders the mark left of centre. The plane
 *     is offset to compensate so the MARK lands where intended.
 *  2. The plane must carry the IMAGE's 1.785 aspect, not the 1.66 used by
 *     Logo.tsx. Logo.tsx can use 1.66 because its <image> letterboxes with
 *     preserveAspectRatio; a UV-mapped plane has no such fitting, so 1.66
 *     was stretching the mark ~7.5% vertically — a distortion of the logo,
 *     which this project forbids outright. */
const LOGO_IMG_W = 564;
const LOGO_IMG_H = 316;
const LOGO_MARK = { x0: 52, x1: 462, y0: 20, y1: 269 };

/** Desired on-wall width of the visible mark itself. */
export const LOGO_MARK_W = 1.2;

const markFracW = (LOGO_MARK.x1 - LOGO_MARK.x0 + 1) / LOGO_IMG_W;
export const LOGO_PLANE_W = LOGO_MARK_W / markFracW;
export const LOGO_PLANE_H = LOGO_PLANE_W / (LOGO_IMG_W / LOGO_IMG_H);

/** Shift the plane so the MARK, not the image, is centred on the backdrop. */
export const LOGO_OFFSET_X =
  -((LOGO_MARK.x0 + LOGO_MARK.x1 + 1) / 2 - LOGO_IMG_W / 2) / LOGO_IMG_W * LOGO_PLANE_W;
export const LOGO_OFFSET_Y =
  ((LOGO_MARK.y0 + LOGO_MARK.y1 + 1) / 2 - LOGO_IMG_H / 2) / LOGO_IMG_H * LOGO_PLANE_H;

export const LOGO_Y = 1.45;

/* The camera settles at z = 2.6, not 1.3. At 1.3 it stood only 2.56 m from
 * the backdrop — close enough that the 3.77 m-wide cyclorama exactly filled
 * the frame edge to edge, so the studio around it was invisible. From 2.6 m
 * the backdrop occupies about two thirds of the width and the curtains,
 * spots and stands frame it. */
const CAM_START_Z = 10.5;
const CAM_END_Z = 2.6;

export interface SequenceState {
  camZ: number;
  camY: number;
  lookY: number;
  doorOffset: number;
  interior: number;
  logo: number;
  logoZ: number;
  veil: number;
  copy: number;
}

/* Sub-animations are keyed off RAW p, never off the eased camera journey —
 * compounding two curves once crushed the whole door travel into ~10% of the
 * scroll. Their ranges are then tuned against where the camera actually is:
 * it crosses the facade at p ≈ 0.58, so the doors finish at 0.50 with real
 * margin and the camera never passes through a moving panel. */
export function sampleSequence(p: number): SequenceState {
  const t = clamp01(p);
  const j = easeInOutQuad(t);

  const camZ = lerp(CAM_START_Z, CAM_END_Z, j);
  const camY = lerp(1.7, 1.6, j);
  const lookY = lerp(1.52, 1.45, easeInOutCubic(track(t, 0.35, 0.95)));

  const doorOffset = easeOutQuart(track(t, 0.18, 0.5)) * DOOR_TRAVEL;

  // Light builds in the room as the gap widens, so the interior is
  // discovered progressively rather than switched on.
  const interior = easeInOutCubic(track(t, 0.22, 0.7));

  // The mark resolves only once the camera is genuinely through the door.
  const logo = easeInOutCubic(track(t, 0.55, 0.88));
  const logoZ = lerp(0, 0.04, logo); // added to LOGO_Z — never moves behind the fabric

  const veil = easeInOutCubic(track(t, 0.92, 1));
  const copy = 1 - clamp01(track(t, 0.02, 0.14));

  return { camZ, camY, lookY, doorOffset, interior, logo, logoZ, veil, copy };
}

/** Composed resting shot for prefers-reduced-motion: inside, doors open,
 *  mark legible — the story's conclusion, held still. */
export const RESTING_STATE: SequenceState = sampleSequence(0.91);
