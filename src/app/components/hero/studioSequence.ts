/* ─── ENTER 1RED — the sequence's single source of truth ───────────────────
 * Every element of the entrance (camera, door, room lights, the mark, the
 * hand-off) derives from ONE normalized scroll value. Pure functions of `p`,
 * no animation state — scrubbing backwards is just evaluating the same
 * functions at a smaller number.
 *
 * SCALE IS METRIC: 1 unit = 1 metre, built around Studio.glb's real size.
 * ────────────────────────────────────────────────────────────────────────── */

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const track = (p: number, from: number, to: number) => clamp01((p - from) / (to - from));

export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;

/* ── Studio.glb, measured ────────────────────────────────────────────────
 * Rotated −90° about Y so the model's open side faces the camera, then
 * scaled up so the room and its kit sit bigger and closer in frame.
 *   native (after rotation):  X −5.02…5.02   Y −0.02…3.01   Z −3.42…6.59 */
export const MODEL_ROT_Y = -Math.PI / 2;
export const MODEL_SCALE = 1.15;
export const MODEL_FLOOR_LIFT = 0.02 * MODEL_SCALE; // floor sits at y = −0.02; nudge it onto y = 0

/** Front face of the cyclorama at mid-height (native z −1.26), scaled. */
export const BACKDROP_Z = -1.26 * MODEL_SCALE;

/* ── The entrance ────────────────────────────────────────────────────────
 * A triangular doorway in a wall far bigger than anything the camera can
 * frame, so no edge of it ever shows. */
export const DOOR_BASE_W = 4.6;
export const DOOR_APEX_Y = 15;
export const FACADE_Z = 5.5;
export const FACADE_W = 120;
export const FACADE_H = 26;

/* ── The door is a SECTIONAL garage door ─────────────────────────────────
 * Three panels rising together. Each one vanishes as it passes the lower
 * edge of the header beam (clipped in StudioScene), so the gap opens at the
 * floor and the panels slide up into the beam one after another. An earlier
 * version tipped them back over a high-lift track; Rajat wanted them gone at
 * that line instead, so no tip-back is ever seen.
 * Tops are listed bottom-up; the last one IS the header. */
export const DOOR_SECTION_FOOT = -0.4; // below the floor line, so no daylight at the threshold
export const DOOR_SECTION_TOPS = [1.2, 2.4, 3.6];
export const DOOR_HEADER_Y = DOOR_SECTION_TOPS[2];

/** Fully open = the lowest panel's bottom edge is past the header. */
const DOOR_TRAVEL = DOOR_HEADER_Y - DOOR_SECTION_FOOT + 0.3;

/** The approach ground outside. */
export const FLOOR_COL = '#DFD8C3';

/* ── The mark, in 3D ─────────────────────────────────────────────────────
 * Extruded from public/1red-logo.svg — the real "1red" vector, supplied by
 * Rajat (285 × 174 viewBox; 18 blocks with ~2 px gaps). Never redrawn.
 * Bounds: x 0 … 284.956, y 0 … 173.344.
 * The zoom pivots on the plus-shaped gap between the four blocks of the "e"
 * (x 172.578–174.609, y 103.251–105.282): the red splits outward and the
 * white cross opens until it fills the frame. */
export const LOGO_SVG_URL = '/1red-logo.svg';
export const LOGO_SVG_BOX = { x0: 0, x1: 284.956, y0: 0, y1: 173.344 };
const LOGO_HOLE_SVG = { x: (172.578 + 174.609) / 2, y: (103.251 + 105.282) / 2 };
/** Width of that gap in the mark's own units. The gap is square. */
const LOGO_HOLE_W = 174.609 - 172.578;
export const LOGO_MARK_W = 1.3;
export const LOGO_K = LOGO_MARK_W / (LOGO_SVG_BOX.x1 - LOGO_SVG_BOX.x0);
export const LOGO_DEPTH = 0.16;
export const LOGO_Y = 1.6;
export const LOGO_Z = -0.7; // clear of the backdrop through a full turn
/** The pivot's offset from the mark's centre, in metres (y up). */
export const LOGO_PIVOT = {
  x: (LOGO_HOLE_SVG.x - (LOGO_SVG_BOX.x0 + LOGO_SVG_BOX.x1) / 2) * LOGO_K,
  y: -(LOGO_HOLE_SVG.y - (LOGO_SVG_BOX.y0 + LOGO_SVG_BOX.y1) / 2) * LOGO_K,
};
const LOGO_ZOOM_MAX = 1400; // the gap is ~2 units of a 285-unit mark, so it needs a lot of scale to open

/* ── Timeline (p) ────────────────────────────────────────────────────────
 *   0.00–0.24  establishing sweep onto the door
 *   0.26–0.50  door rolls up
 *   0.50–0.70  push through into the dark room, which starts to glow
 *   0.706      lights slam on
 *   0.73–0.86  the mark turns once
 *   0.89–1.00  scale through the "e" gap into the next section, gliding
 *              onto the gap as the zoom begins (one move, not two) */
const ANGLE_END = 0.24;
const DOOR_OPEN_FROM = 0.264;
const DOOR_OPEN_TO = 0.496;
const PUSH_FROM = 0.504;
const PUSH_TO = 0.704;
export const LIGHTS_ON = 0.706;
/** The hero camera's vertical field of view. Exported because the hand-off
 *  has to work out how big the gap in the "e" is on screen. */
export const HERO_FOV = 45;
const GLOW_FROM = 0.56;
const GLOW_LEVEL = 0.38;

const CAM_START_Z = 12.5;
const CAM_HOLD_Z = 10.4;
const CAM_CREEP_Z = 9.7;
const CAM_END_Z = 2.3;

/* Establishing shot: an elevated, dutch-tilted orbit that swings along a real
 * arc onto the centre axis before the door moves. */
const ORBIT_THETA_START = 0.68;
const ORBIT_ROLL_START = -0.24;
const ANGLE_Y_LIFT = 1.25;
const ANGLE_LOOK_Y_DROP = 0.9;

export interface SequenceState {
  camX: number;
  camY: number;
  camZ: number;
  camRoll: number;
  lookX: number;
  lookY: number;
  lookZ: number;
  doorOffset: number;
  /** 0 = pitch dark room, 1 = lights on. */
  lights: number;
  logoSpin: number;
  logoZoom: number;
  /** 0 = lamp heads face the viewer, 1 = they face the mark. */
  lampTurn: number;
}

export function sampleSequence(p: number): SequenceState {
  const t = clamp01(p);

  const sweep = easeInOutSine(track(t, 0, ANGLE_END));
  const angleAmt = 1 - sweep;

  const push = easeInOutCubic(track(t, PUSH_FROM, PUSH_TO));
  const dist =
    t < ANGLE_END
      ? lerp(CAM_START_Z, CAM_HOLD_Z, sweep)
      : t < PUSH_FROM
        ? lerp(CAM_HOLD_Z, CAM_CREEP_Z, easeInOutSine(track(t, ANGLE_END, PUSH_FROM)))
        : lerp(CAM_CREEP_Z, CAM_END_Z, push);

  // Tip up to follow the door over the header, then level onto the mark.
  const watchUp = easeInOutSine(track(t, 0.08, 0.272)) * (1 - push);
  const baseLookY = lerp(lerp(1.52, 2.75, watchUp), LOGO_Y, easeInOutCubic(track(t, 0.48, 0.72)));

  const radius = dist - BACKDROP_Z;
  const theta = ORBIT_THETA_START * angleAmt;

  const zoomT = easeInOutSine(track(t, 0.89, 0.995));
  const zoom = Math.pow(LOGO_ZOOM_MAX, zoomT);
  /* The camera slides onto the "e" gap WHILE the mark grows, not before it.
     The mark scales about the gap, so the gap's on-screen offset from centre
     is (1 − aim) × zoom × its offset in the mark. Driving that product
     smoothly from 1 to 0 over the first part of the zoom makes the gap glide
     to centre in one continuous motion as the mark swells, with no settle
     beforehand and no sideways lurch once the scale is large. */
  const gapDrift = 1 - easeInOutSine(track(zoomT, 0, 0.3));
  const aim = 1 - gapDrift / zoom;

  const camX = radius * Math.sin(theta) + LOGO_PIVOT.x * aim;
  // Push in with the zoom, so once the gap swallows the frame what fills it
  // is the lit backdrop (white), handing straight to the next section.
  const camZ = lerp(BACKDROP_Z + radius * Math.cos(theta), LOGO_Z + 0.9, zoomT);
  const camY = lerp(lerp(1.75, LOGO_Y, push) + ANGLE_Y_LIFT * angleAmt, LOGO_Y + LOGO_PIVOT.y, aim);
  const camRoll = ORBIT_ROLL_START * angleAmt;
  const lookX = LOGO_PIVOT.x * aim;
  const lookY = lerp(baseLookY - ANGLE_LOOK_Y_DROP * angleAmt, LOGO_Y + LOGO_PIVOT.y, aim);
  const lookZ = lerp(BACKDROP_Z, LOGO_Z, aim);

  const doorOffset = easeInOutSine(track(t, DOOR_OPEN_FROM, DOOR_OPEN_TO)) * DOOR_TRAVEL;

  // The room is already warming up as the camera arrives, then the switch
  // throws: the rest of the way to full white, fast but with no hard click.
  const glow = GLOW_LEVEL * easeInOutSine(track(t, GLOW_FROM, LIGHTS_ON));
  const lights = lerp(glow, 1, easeInOutSine(track(t, LIGHTS_ON, LIGHTS_ON + 0.02)));

  const logoSpin = easeInOutSine(track(t, 0.73, 0.86)) * Math.PI * 2;
  // Exponential, so the growth reads as a constant rush rather than a stall
  // that suddenly explodes at the end.
  const logoZoom = zoom;

  // Through the door the lamps are aimed at you, following the camera; as it
  // pushes in they swing round and settle on the mark.
  const lampTurn = easeInOutSine(track(t, 0.47, 0.72));

  return { camX, camY, camZ, camRoll, lookX, lookY, lookZ, doorOffset, lights, logoSpin, logoZoom, lampTurn };
}

/** Half-thickness of the white cross in the "e", as a fraction of the
 *  viewport's half-height, at hero progress `p`.
 *
 * Section 2 sits on top of the hero at the hand-off, so without this its
 * cubes paint over the mark instead of sitting behind it. The section clips
 * itself to this cross, which puts the tunnel behind the "e": the mark
 * occludes it, the gap reveals it, and it opens out as the blocks part. The
 * reveal is then driven by the hero's own zoom rather than by a fade of its
 * own, which is what makes the two read as one move.
 *
 * The gap is square and the projection is uniform, so the same fraction of
 * the half-height gives both arms' half-thickness in pixels. Verified
 * against the rendered hero at the hand-off: 0.29 here, 0.27 measured off
 * the frame, the remainder being the blocks' own shaded edges.
 */
export function gapHalfFraction(p: number): number {
  const { camZ, logoZoom } = sampleSequence(p);
  const halfWorld = (LOGO_HOLE_W / 2) * LOGO_K * logoZoom;
  const frameHalf = (camZ - LOGO_Z) * Math.tan((HERO_FOV / 2) * (Math.PI / 180));
  return halfWorld / frameHalf;
}

/** Composed resting shot for prefers-reduced-motion: inside, lights on, the
 *  mark facing the camera. */
export const RESTING_STATE: SequenceState = sampleSequence(0.87);
