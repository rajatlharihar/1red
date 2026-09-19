import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { createInkLineMaterial } from '../hero/inkLines';
import { PANEL_TO } from '../hero/studioSequence';

/* ─── Through the tunnel, then into one cube ────────────────────────────
 * The hero's zoom does not stop at the "e". Directly behind the gap is a
 * tunnel of cubes: four blocks per ring, one in each corner of the frame,
 * ring after ring converging on the exact point the zoom breaks through, so
 * the parting red of the logo hands straight over to blocks streaming out of
 * the same four corners. The rings run at the camera and out past the
 * corners; the ranks cycle, so 27 cubes make a tunnel with no end in sight.
 * Then the run eases to a stop and, still seen head-on, the tunnel gathers:
 * its blocks leave their rings one by one, shrink, square up and lock into
 * one box at the centre of the frame. The camera never turns; the tunnel
 * itself becomes the box.
 *
 * NO COLLISIONS. The box builds from the inside out (centre, faces, edges,
 * corners). Each cube flies to a staging point outside the forming box on
 * its slot's own outward axis, squares up, then slides straight in along
 * that axis. A slide only ever moves a cube further out along the axes its
 * slot is already offset on, so sliding cubes stay in their own region of
 * the grid and can never overlap each other or the placed stack. While
 * flying, cubes are pushed apart from one another and kept outside the
 * staging sphere, so nothing passes through the box on its way round it.
 * Positions are a pure function of scroll, so scrubbing back is identical.
 * ─────────────────────────────────────────────────────────────────────────── */

const RED = '#EA3323';
/** The mark's own face colour (`StudioScene`), which the first rings have to
 *  match: the blocks the zoom parts are flat, unlit logo red, not metal. */
const LOGO_RED = '#FF0000';
/** Emissive red that lands as close to the mark's #FF0000 as this canvas can
 *  reach. The mark's own material skips tone mapping; this one cannot, or the
 *  metal the box ends as would change too, and three.js's ACES pass mixes
 *  channels, so brighter reds do not get redder, they go cream (solved
 *  numerically: 0.89 lands on #F40018, 1.5 is already #FF3F2A). The hero's
 *  own extruded sides are #C40000, so the frame carries a range of reds
 *  anyway and this sits inside it. */
const LOGO_EMISSIVE = 1;
/** Reflection strength of the red metal. Tumbling cubes show their tops to
 *  the room's bright ceiling; above this they go cream mid-flight. */
const ENV = 0.5;
/** The skin changes over from logo red to red metal across this stretch of
 *  the section: flat through the hand-off, metal by the time the white has
 *  taken the hero away. Set `SKIN_TO` to 0 to keep metal throughout. */
const SKIN_FROM = 0.02;
const SKIN_TO = 0.12;
/** The mark's blocks carry ink edges, and so do the tunnel's blocks as they
 *  take over from them. The lines go slowly as the blocks go metal, gone
 *  before the gather begins. */
const OUTLINE_FROM = 0.1;
const OUTLINE_TO = 0.44;
export const CAM_Z = 9.4;
export const FOV = 42;

const N = 3;
const COUNT = N * N * N;

/** Half the vertical frame at unit depth: the frame's own half-height at a
 *  depth d is `d * TAN_HALF`, which is how the tunnel is placed by apparent
 *  size rather than by guessing depths. */
const TAN_HALF = Math.tan((FOV / 2) * (Math.PI / 180));

/* Timeline, as fractions of the pinned scroll. The gather starts while the
   run is still easing out, so the tunnel never sits waiting; the centre cube
   is the only one moving in that overlap, and the run is all but stopped by
   the time the first face starts its flight. */
const APPROACH_END = 0.5;
const GATHER_START = 0.46;
const GATHER_END = 0.9;
const SETTLE_START = 0.82;
const SETTLE_END = 0.99;

/* ─── The tunnel ────────────────────────────────────────────────────
 * Four cubes per ring, one per corner of the frame, centred on the frame's
 * centre: that is where the hero's zoom comes through, and a ring in all
 * four corners is the only arrangement that continues the four parting
 * quadrants of the logo instead of hovering somewhere in the frame.
 *
 * Ranks cycle. `AV_CYCLE` is the depth a ring covers before it wraps back to
 * the far end, and it wraps at `AV_Z_EXIT`, which is past the corners and off
 * frame, so the wrap is never seen. 27 cubes therefore read as an endless
 * tunnel instead of a short caterpillar of blocks.
 * ─────────────────────────────────────────────────────────────────────────── */
/** Rings in the cycle: four cubes each, 28 slots for 27 cubes. */
const AV_RANKS = 7;
/** Depth between rings. Tight, so from the "e" blocks the rings step back
 *  by perspective in even, small steps rather than the next ring sitting far
 *  behind as a separate small cluster. */
const AV_SPACING = 5;
const AV_CYCLE = AV_RANKS * AV_SPACING;
/** Where a ring wraps back to the far end. It has to be past the depth where
 *  a block's inner edge clears the frame, or a ring would vanish while still
 *  half on screen. */
const AV_Z_EXIT = 7.4;
/** A ring is square, whatever the frame's shape: the four blocks' inner
 *  edges sit this far from the axis, on both axes, so at the hand-off they
 *  land on the edges of the gap in the "e" (its half-width is 0.29 of the
 *  frame's half-height at `HANDOFF_P`; 0.45 at the nearest ring's near face,
 *  `AV_HANDOFF_Z` deep, is 0.27). The blocks then read as the "e" blocks
 *  carrying on: same edges, same flat red, same ink lines. */
const AV_INNER = 0.45;
/** Depth of the nearest ring at the hand-off. */
const AV_HANDOFF_Z = 3.67;
/** Rings flare out as they come at the camera, from `AV_HANDOFF_Z` to the
 *  exit: tight behind the "e", then spacing out as they pass. Also what lets
 *  a ring wrap unseen: at this radius a block's inner side face has left the
 *  frame before its ring reaches `AV_Z_EXIT`, even with its full tilt and
 *  the depth jitter. */
const AV_R_EXIT = 5.2;
/** Phase offset that puts the nearest ring exactly on `AV_HANDOFF_Z` at the
 *  hand-off, so the first blocks the eye meets are the "e" blocks the zoom
 *  just parted, carrying on, rather than a new, smaller thing starting. */
const AV_PHASE0 = AV_Z_EXIT - AV_HANDOFF_Z;
/** The blocks arrive square to the camera, like the flat "e" blocks, and
 *  take on their off-axis tilt over this stretch of the section as they
 *  travel, which is what turns them into boxes. */
const AV_TILT_FROM = 0.04;
const AV_TILT_TO = 0.34;
/** Depth covered during the approach: six tenths of a cycle, so rings pass
 *  the lens rarely and the divergence carries the motion; chosen so no ring
 *  is in its fade band when the run stops and the gather begins. The run is
 *  already moving at the hand-off (no hold): the "e" blocks are rushing
 *  outwards then, and the ring behind them has to be doing the same. */
const AV_TRAVEL = 28;
/** How the run eases: near-linear at the start, so the first ring keeps
 *  pace with the "e" blocks it continues, easing to a stop. */
const AV_RUN_POW = 1.6;
/** The four arrays diverge with the scroll: the gap between them, tight on
 *  the "e" at the hand-off, opens out to `AV_R_EXIT` over this stretch. */
const AV_SPREAD_FROM = 0.1;
const AV_SPREAD_TO = 0.46;
/** The rings behind the first come in from the sides as the "e" parts: each
 *  starts `AV_SLIDE_R` further out along its corner's diagonal, the deeper
 *  rings further still, and eases into the stack. Keyed to the hero's own
 *  progress and starting as soon as the section draws, so they are already
 *  on the move where the "e" blocks' rounded corners uncover them early,
 *  and far enough out to be behind the blocks until then. */
const AV_SLIDE_R = 8;
const AV_SLIDE_FROM_HERO = PANEL_TO;
const AV_SLIDE_TO_HERO = 1.015;
/** The "e"'s lower-left block is the small rounded one, so the first ring's
 *  block under it has nothing to hide behind and would simply be there when
 *  the section starts drawing. It rises into place from below the frame
 *  instead, over the first part of the hand-off. */
const AV_LOW_RISE = 3.2;
const AV_LOW_RISE_TO_HERO = 0.97;
/** Blocks in the tunnel are far chunkier than the cubes in the finished box.
 *  They shrink to size on their flight to the box. */
const AV_SIZE = 2.6;
/** A block of a given height covers far more of a narrow frame's width than
 *  of a wide one's, so on a phone the corner blocks would swallow the tunnel
 *  they are supposed to frame. This trims them back by the aspect. Only the
 *  tunnel is trimmed: the box that gets built still fits the frame on `unit`. */
const avSizeFor = (aspect: number) => AV_SIZE * clamp01((aspect / 1.6 - 0.45) / 0.55) * 0.55 + AV_SIZE * 0.45;

/** Staging radius in cube units: the box's bounding radius (√3 × 1.5) plus a
 *  cube's own, so a cube waiting there never touches the box. */
const STAGE_R = 3.3;
/** Share of a cube's gather window spent flying; the rest is the slide. */
const FLIGHT = 0.75;
/** The flight is an orbit of the frame, not a line: each cube sweeps
 *  clockwise about the axis from where the tunnel left it to the angle of
 *  its staging point, at least half a turn (`ORBIT_MIN_TURN`), some a full
 *  turn more (`extraTurn`), swinging out to `ORBIT_SWING` box units (its own
 *  `orbit`) at mid-flight so the sweep covers the whole screen, with some
 *  lift toward or away from the lens. The cube tumbles on the way (its own
 *  axis, `ORBIT_TUMBLE` radians at most) and is square again as it lands. */
const ORBIT_SWING = 2.2;
const ORBIT_MIN_TURN = Math.PI;
const ORBIT_LIFT = 1.6;
const ORBIT_TUMBLE = Math.PI * 0.8;
const TAU = Math.PI * 2;
/** Share of the gather window over which a tunnel block shrinks to a box
 *  cube: the whole flight, so the change hides inside the motion. */
const SHRINK = 0.75;
/** Bounding radius of a unit cube, used for flight separation. */
const CUBE_R = 0.87;

/** The white behind everything, this far in front of the camera: past the
 *  deepest ring, within the camera's far plane. */
const BACKDROP_DIST = 120;

const REST_ROT_Y = -0.55;
const REST_ROT_X = 0.42;
/** Slow turn onto the resting angle over the section, radians per unit p. */
const DRIFT_Y = 0.35;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** Deterministic 0–1 noise, so the scatter is the same on every load. */
const hash = (i: number, salt: number) => {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

interface Piece {
  slot: THREE.Vector3;
  /** Unit direction from the box centre to the slot (zero for the centre). */
  dir: THREE.Vector3;
  tier: number;
  /** Gather window, as fractions of the gather phase. */
  start: number;
  len: number;
  /** Tunnel: which corner of the frame, and which ring. */
  cx: number;
  cy: number;
  rank: number;
  /** Small offsets, so the rings are not perfectly stamped. The radius
   *  jitter belongs to the ring, not the cube, so a ring stays a square and
   *  the tunnel stays centred on the gap. */
  jr: number;
  jz: number;
  /** Mirrored per corner, so the four blocks of a ring are mirror images and
   *  their shapes cancel out around the centre instead of all leaning the
   *  same way. */
  tilt: THREE.Quaternion;
  /** The cube's own orbit on its flight to the box. */
  orbit: number;
  extraTurn: boolean;
  lift: number;
  tumbleAxis: THREE.Vector3;
  tumble: number;
}

/* Build order: centre, then faces, edges, corners, each tier overlapping the
   last. The centre is home before any face starts its slide. */
const TIER_WINDOWS = [
  { from: 0, to: 0, len: 0.66 },
  { from: 0.03, to: 0.14, len: 0.72 },
  { from: 0.08, to: 0.22, len: 0.72 },
  { from: 0.16, to: 0.28, len: 0.72 },
];

/** Which of the four arrays each slot belongs to, and in which ring. Each
 *  array folds into its own quarter of the box: a slot goes to the array
 *  on the side of the screen it sits on once the box is at its resting
 *  angle, with the deepest ring's cube becoming the centre and the nearest
 *  ring's cubes the box's outer corners. Flights are then short and all
 *  four streams converge at once, instead of cubes crossing the frame to
 *  reach a slot on the far side. */
function layout(): Piece[] {
  const slots: THREE.Vector3[] = [];
  for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++) slots.push(new THREE.Vector3(x, y, z));
  const tierOf = (s: THREE.Vector3) => Math.abs(s.x) + Math.abs(s.y) + Math.abs(s.z);
  const qRest = new THREE.Quaternion().setFromEuler(new THREE.Euler(REST_ROT_X, REST_ROT_Y, 0));
  const corners = [
    { cx: 1, cy: 1 },
    { cx: -1, cy: 1 },
    { cx: -1, cy: -1 },
    { cx: 1, cy: -1 },
  ];
  // 27 cubes over 4 arrays of 7: the last array has one ring fewer.
  const room = [7, 7, 7, 6];
  const owner = new Array<number>(slots.length).fill(-1);
  const scored: Array<{ slot: number; corner: number; score: number }> = [];
  slots.forEach((slot, i) => {
    const v = slot.clone().applyQuaternion(qRest);
    corners.forEach((c, j) => scored.push({ slot: i, corner: j, score: v.x * c.cx + v.y * c.cy + hash(i, 13) * 0.01 }));
  });
  scored.sort((a, b) => b.score - a.score);
  for (const e of scored) {
    if (owner[e.slot] >= 0 || room[e.corner] === 0) continue;
    owner[e.slot] = e.corner;
    room[e.corner]--;
  }

  const tierSeen = [0, 0, 0, 0];
  const tierSize = [1, 6, 12, 8];
  const pieces: Piece[] = [];
  corners.forEach((c, j) => {
    const mine = slots
      .map((slot, i) => ({ slot, i }))
      .filter((e) => owner[e.i] === j)
      .sort((a, b) => tierOf(b.slot) - tierOf(a.slot) || hash(a.i, 17) - hash(b.i, 17));
    // Nearest ring first, so rank 0 is the outermost tier.
    mine.forEach(({ slot }, rank) => {
      const tier = tierOf(slot);
      const w = TIER_WINDOWS[tier];
      const k = tierSize[tier] > 1 ? tierSeen[tier] / (tierSize[tier] - 1) : 0;
      tierSeen[tier]++;
      pieces.push({
        slot,
        dir: tier === 0 ? new THREE.Vector3() : slot.clone().normalize(),
        tier,
        start: lerp(w.from, w.to, k),
        len: w.len,
        cx: c.cx,
        cy: c.cy,
        rank,
        jr: (hash(rank, 21) - 0.5) * 0.24,
        jz: (hash(rank, 23) - 0.5) * 0.8,
        tilt: new THREE.Quaternion().setFromEuler(new THREE.Euler(0.26 * c.cy, 0.38 * c.cx, 0)),
        orbit: 0.6 + hash(pieces.length, 31) * 0.8,
        extraTurn: hash(pieces.length, 32) < 0.3,
        lift: (hash(pieces.length, 34) - 0.5) * 2,
        tumbleAxis: new THREE.Vector3(hash(pieces.length, 35) - 0.5, hash(pieces.length, 36) - 0.5, hash(pieces.length, 37) - 0.5).normalize(),
        tumble: (0.4 + hash(pieces.length, 38) * 0.6) * ORBIT_TUMBLE,
      });
    });
  });
  return pieces;
}

/** The 12 edges of a unit cube, as corner index pairs into `CORNERS`. */
const CORNERS = [-0.5, 0.5].flatMap((x) => [-0.5, 0.5].flatMap((y) => [-0.5, 0.5].map((z) => new THREE.Vector3(x, y, z))));
const EDGES = [
  [0, 1], [2, 3], [4, 5], [6, 7],
  [0, 2], [1, 3], [4, 6], [5, 7],
  [0, 4], [1, 5], [2, 6], [3, 7],
];

const _qGroup = new THREE.Quaternion();
const _qTilt = new THREE.Quaternion();
const _qFlat = new THREE.Quaternion();
const _c = new THREE.Vector3();
/* Each piece carries its own off-axis tilt (`piece.tilt`), which turns a
   block into a box rather than a flat red rectangle. It rotates the cube and
   never the array: the tunnel itself stays square to the camera, or its
   vanishing point drifts off the gap the hero zooms through. */
const _euler = new THREE.Euler();
const _av = new THREE.Vector3();
const _d = new THREE.Vector3();
const _qTumble = new THREE.Quaternion();
const _scale = new THREE.Vector3();
const _m = new THREE.Matrix4();

export function CubeAssembly({
  progressRef,
  heroPRef,
  offsetRef,
  pointerRef,
}: {
  progressRef: React.MutableRefObject<number>;
  /** The hero's progress, unclamped: nothing is drawn until the frame
   *  behind the mark has gone white (`PANEL_TO`). */
  heroPRef: React.MutableRefObject<number>;
  /** Pixels this canvas still sits below the top of the viewport, before the
   *  section pins. The frame is shifted up by it, so the tunnel stays on the
   *  gap in the "e" even while the canvas is only partly in view and the
   *  reveal can begin before the pin rather than switching on at it. */
  offsetRef: React.MutableRefObject<number>;
  pointerRef: React.MutableRefObject<{ x: number; y: number }>;
}) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const backdrop = useRef<THREE.Mesh>(null);
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);

  /* Metal reflects, so it needs something to reflect: a procedural room,
     no asset to fetch. Without it the red renders near black. */
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = env.texture;
    return () => {
      scene.environment = null;
      env.texture.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);

  const geo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: RED,
        roughness: 0.38,
        metalness: 0.92,
        envMapIntensity: ENV,
        // Clipped, not tone mapped: an overexposed red face stays red instead
        // of going cream, and the hand-off emissive is the mark's exact red.
        toneMapped: false,
      }),
    []
  );
  /* Ink edges on every cube: one fat-line geometry holding all 27 cubes'
     edges, its endpoints rewritten each frame from the instance matrices. */
  const lineMat = useMemo(() => {
    const m = createInkLineMaterial();
    m.transparent = true;
    return m;
  }, []);
  const lines = useMemo(() => {
    const g = new LineSegmentsGeometry();
    g.setPositions(new Float32Array(COUNT * EDGES.length * 6));
    const l = new LineSegments2(g, lineMat);
    l.frustumCulled = false;
    return l;
  }, [lineMat]);
  const size = useThree((s) => s.size);
  useEffect(() => {
    lineMat.resolution.set(size.width, size.height);
  }, [lineMat, size]);
  const skinCols = useMemo(
    () => ({ logo: new THREE.Color(LOGO_RED), cube: new THREE.Color(RED), black: new THREE.Color('#000000') }),
    []
  );
  useEffect(
    () => () => {
      geo.dispose();
      mat.dispose();
      lines.geometry.dispose();
      lineMat.dispose();
    },
    [geo, mat, lines, lineMat]
  );

  const pieces = useMemo(layout, []);

  // Per-frame working state, one entry per cube.
  const work = useMemo(
    () =>
      Array.from({ length: COUNT }, () => ({
        pos: new THREE.Vector3(),
        quat: new THREE.Quaternion(),
        scale: 0,
        radius: 0,
        mobility: 0,
        exclude: false,
      })),
    []
  );

  useFrame((state) => {
    const m = mesh.current;
    if (!m) return;
    const on = heroPRef.current >= PANEL_TO;
    m.visible = on;
    lines.visible = on;
    if (backdrop.current) backdrop.current.visible = on;
    if (!on) return;
    const p = progressRef.current;
    const cam = state.camera as THREE.PerspectiveCamera;
    const aspect = state.size.width / state.size.height;
    const tanHalf = Math.tan(THREE.MathUtils.degToRad(FOV / 2));

    const frameW = 2 * CAM_Z * tanHalf * aspect;
    const unit = Math.min(0.85, frameW / 7.5);
    const settle = easeInOutCubic(clamp01((p - SETTLE_START) / (SETTLE_END - SETTLE_START)));
    /* The box sits near its resting angle throughout, drifting the last
       few degrees onto it: the four arrays fold into the quarters of the
       box they face, which a spinning box would scramble. */
    _euler.set(
      REST_ROT_X + (1 - settle) * (Math.sin(p * 4) * 0.06 - 0.06) + pointerRef.current.y * 0.1,
      REST_ROT_Y + (1 - settle) * (p - 1) * DRIFT_Y + pointerRef.current.x * 0.14,
      0
    );
    _qGroup.setFromEuler(_euler);

    /* The tunnel is laid out in one reference frame and then scaled about the
       camera by `av`, so a phone sees the same tunnel as the iMac, smaller. */
    const av = unit / 0.85;
    /* Moving from the first frame, eased to a stop rather than cut off: the
       gather is already underway by then, so the tunnel never visibly halts
       and waits. */
    const run = clamp01(p / APPROACH_END);
    const travel = (1 - Math.pow(1 - run, AV_RUN_POW)) * AV_TRAVEL;
    const spread = smoothstep(AV_SPREAD_FROM, AV_SPREAD_TO, p);
    const heroP = heroPRef.current;
    const slideIn = 1 - easeOutCubic(clamp01((heroP - AV_SLIDE_FROM_HERO) / (AV_SLIDE_TO_HERO - AV_SLIDE_FROM_HERO)));
    const lowRise = 1 - easeOutCubic(clamp01((heroP - AV_SLIDE_FROM_HERO) / (AV_LOW_RISE_TO_HERO - AV_SLIDE_FROM_HERO)));
    const avSize = avSizeFor(aspect);
    /* Shift the whole frame up by however far the canvas sits below the
       viewport. Same full-frame size, so nothing is rescaled. */
    const off = offsetRef.current;
    if (off > 0.5) cam.setViewOffset(state.size.width, state.size.height, 0, off, state.size.width, state.size.height);
    else if (cam.view?.enabled) cam.clearViewOffset();

    /* Hand-off skin: the rings arrive as the mark's own flat red and turn
       into red metal once the hero is gone. Emissive does the flattening, so
       no material recompile and no change to the metal the box ends as. */
    const skin = SKIN_TO > 0 ? smoothstep(SKIN_FROM, SKIN_TO, p) : 1;
    /* Flat while it is the mark: the base colour goes to black so only the
       emissive shows and every face reads the same, the way an unlit
       material does. Then the emissive drops out and the metal comes up. */
    mat.color.lerpColors(skinCols.black, skinCols.cube, skin);
    mat.emissive.copy(skinCols.logo);
    mat.emissiveIntensity = LOGO_EMISSIVE * (1 - skin);
    /* Metal with a black base has no diffuse and no specular (a metal's
       reflectance IS its base colour), so while it is flat the emissive is
       all there is. At metalness 0 the dielectric specular lifts the whole
       block to #F4342E instead of #F40018. */
    mat.metalness = lerp(1, 0.92, skin);
    mat.roughness = lerp(1, 0.38, skin);
    mat.envMapIntensity = ENV * skin;

    const tiltT = smoothstep(AV_TILT_FROM, AV_TILT_TO, p);
    const gather = clamp01((p - GATHER_START) / (GATHER_END - GATHER_START));
    const stageR = STAGE_R * unit;
    // The no-fly sphere opens as the build begins, not during the scatter.
    const exclusion = stageR * smoothstep(0, 0.08, gather);

    pieces.forEach((piece, i) => {
      const w = work[i];
      const local = clamp01((gather - piece.start) / piece.len);

      /* Its ring's place in the cycle. `phase` is depth behind the exit, so
         it counts down as the tunnel runs and wraps a ring that has gone
         past the corners back out to the far end. */
      const phase = (((piece.rank * AV_SPACING + AV_PHASE0 - travel) % AV_CYCLE) + AV_CYCLE) % AV_CYCLE;
      const z = AV_Z_EXIT - phase + piece.jz;
      const rTight = AV_INNER + avSize / 2;
      // Opened by the scroll, and by nearness to the lens, whichever is more.
      const flare = smoothstep(AV_HANDOFF_Z, AV_Z_EXIT, z);
      const fromSide = piece.rank === 0 ? 0 : AV_SLIDE_R * slideIn * (0.5 + piece.rank / 12);
      const r = lerp(rTight, AV_R_EXIT, 1 - (1 - spread) * (1 - flare)) + piece.jr + fromSide;
      _av.set(piece.cx * r, piece.cy * r, z);
      if (piece.rank === 0 && piece.cx < 0 && piece.cy < 0) _av.y -= AV_LOW_RISE * lowRise;
      // Scale the whole tunnel about the camera, never about the origin.
      _av.set(_av.x * av, _av.y * av, CAM_Z + (_av.z - CAM_Z) * av);

      /* A ring only fades in over the deepest part of the cycle, where it is
         far too small to see the fade, so a wrap never pops. A cube on its
         way to the box is always shown. */
      const appear = Math.max(smoothstep(1, 0.9, phase / AV_CYCLE), smoothstep(0, 0.3, local));

      if (piece.tier === 0) {
        const f = easeInOutSine(local);
        w.pos.copy(_av).lerp(_d.set(0, 0, 0), f);
        w.mobility = 1 - smoothstep(0.2, 0.5, local);
        w.exclude = false;
      } else if (local < FLIGHT) {
        const f = easeInOutSine(local / FLIGHT);
        _d.copy(piece.dir).multiplyScalar(stageR).applyQuaternion(_qGroup);
        /* Orbit: clockwise about the axis from where it is to the angle of
           its staging point, swinging wide at mid-flight. */
        const th0 = Math.atan2(_av.y, _av.x);
        const r0 = Math.hypot(_av.x, _av.y);
        const r1 = Math.hypot(_d.x, _d.y);
        const th1 = r1 > 1e-6 ? Math.atan2(_d.y, _d.x) : th0;
        let turn = (((th1 - th0) % TAU) + TAU) % TAU - TAU; // (−2π, 0]: clockwise
        if (turn > -ORBIT_MIN_TURN) turn -= TAU;
        if (piece.extraTurn) turn -= TAU;
        const th = th0 + turn * f;
        const swing = Math.sin(Math.PI * f);
        const rr = lerp(r0, r1, f) + ORBIT_SWING * piece.orbit * unit * swing;
        w.pos.set(rr * Math.cos(th), rr * Math.sin(th), lerp(_av.z, _d.z, f) + ORBIT_LIFT * piece.lift * unit * swing);
        w.mobility = 1 - smoothstep(FLIGHT - 0.2, FLIGHT, local);
        w.exclude = true;
      } else {
        const s = easeInOutCubic((local - FLIGHT) / (1 - FLIGHT));
        const r = lerp(STAGE_R, piece.slot.length(), s) * unit;
        w.pos.copy(piece.dir).multiplyScalar(r).applyQuaternion(_qGroup);
        w.mobility = 0;
        w.exclude = false;
      }

      /* Square in the ring, then turned to the box's own orientation over the
         flight. The shrink to a box cube is quicker: the nearest ring's blocks
         are huge and right by the lens, and would cross the frame as giant
         slabs if they kept their size for long. */
      const square = easeInOutCubic(clamp01(local / (piece.tier === 0 ? 0.6 : FLIGHT - 0.1)));
      _qTilt.copy(_qFlat).slerp(piece.tilt, tiltT);
      w.quat.copy(_qTilt).slerp(_qGroup, square);
      /* Tumbling on the way, back to square as it lands: a full swing that
         rises and returns over the flight. */
      const fl = clamp01(local / FLIGHT);
      _qTumble.setFromAxisAngle(piece.tumbleAxis, Math.sin(Math.PI * fl) * piece.tumble);
      w.quat.premultiply(_qTumble);
      w.scale = appear * lerp(avSize, 1, easeInOutSine(clamp01(local / SHRINK))) * unit;
      w.radius = CUBE_R * w.scale;
    });

    // Flying cubes give way: to each other, and around the forming box.
    for (let iter = 0; iter < 4; iter++) {
      for (let i = 0; i < COUNT; i++) {
        const wi = work[i];
        for (let j = i + 1; j < COUNT; j++) {
          const wj = work[j];
          const mob = wi.mobility + wj.mobility;
          if (mob <= 0) continue;
          _d.subVectors(wi.pos, wj.pos);
          const dist = _d.length();
          const overlap = wi.radius + wj.radius - dist;
          if (overlap <= 0 || dist < 1e-6) continue;
          _d.multiplyScalar(overlap / dist / mob);
          wi.pos.addScaledVector(_d, wi.mobility);
          wj.pos.addScaledVector(_d, -wj.mobility);
        }
      }
      if (exclusion > 0) {
        for (const w of work) {
          if (!w.exclude) continue;
          const r = w.pos.length();
          if (r < exclusion && r > 1e-6) w.pos.multiplyScalar(exclusion / r);
        }
      }
    }

    const edgeBuf = lines.geometry.attributes.instanceStart.data as THREE.InstancedInterleavedBuffer;
    const edges = edgeBuf.array as Float32Array;
    for (let i = 0; i < COUNT; i++) {
      const w = work[i];
      _scale.setScalar(w.scale);
      m.setMatrixAt(i, _m.compose(w.pos, w.quat, _scale));
      for (let e = 0; e < EDGES.length; e++) {
        const o = (i * EDGES.length + e) * 6;
        _c.copy(CORNERS[EDGES[e][0]]).applyMatrix4(_m);
        edges[o] = _c.x;
        edges[o + 1] = _c.y;
        edges[o + 2] = _c.z;
        _c.copy(CORNERS[EDGES[e][1]]).applyMatrix4(_m);
        edges[o + 3] = _c.x;
        edges[o + 4] = _c.y;
        edges[o + 5] = _c.z;
      }
    }
    m.instanceMatrix.needsUpdate = true;
    edgeBuf.needsUpdate = true;
    lineMat.opacity = 1 - smoothstep(OUTLINE_FROM, OUTLINE_TO, p);
    lines.visible = lineMat.opacity > 0;
    /* The backdrop rides with the camera, always filling the frame, so
       the mark's occluder can hide it along with the cubes. */
    if (backdrop.current) backdrop.current.position.z = cam.position.z - BACKDROP_DIST;

    cam.position.z = lerp(CAM_Z, CAM_Z - 0.7, settle);
  });

  return (
    <>
      <mesh ref={backdrop} position={[0, 0, CAM_Z - BACKDROP_DIST]} renderOrder={-5} frustumCulled={false}>
        <planeGeometry args={[BACKDROP_DIST * TAN_HALF * 2 * 6, BACKDROP_DIST * TAN_HALF * 2 * 1.2]} />
        <meshBasicMaterial color="#FFFFFF" toneMapped={false} />
      </mesh>
      <instancedMesh ref={mesh} args={[geo, mat, COUNT]} frustumCulled={false} />
      <primitive object={lines} />
    </>
  );
}

/** Highlights only: the environment map supplies the fill, and an ambient
 *  light on top would wash the metal flat. */
export function CubeLighting() {
  return (
    <>
      {/* Kept low: a tumbling metal face turned straight at a strong key
          overexposes, and the tone mapping takes the red to cream. */}
      <directionalLight position={[4, 6, 7]} intensity={1.0} color="#FFF6EC" />
      <directionalLight position={[-5, 2, -3]} intensity={0.5} color="#E8EEFA" />
    </>
  );
}
