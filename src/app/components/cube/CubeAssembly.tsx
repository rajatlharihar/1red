import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/* ─── Down the avenue, then into one cube ───────────────────────────────────
 * The hero's zoom comes out of the "e" into an avenue: two rows of cubes
 * receding to a vanishing point at the centre of the frame, the way a lined
 * approach reads (the bush rows either side of the walk up to the Taj). The
 * rows slide past the camera, which is depth and parallax rather than a
 * scale-up, and then the whole array turns and loses its depth. That is what
 * breaks the order into the jumble the box is built from.
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
 * ────────────────────────────────────────────────────────────────────────── */

const RED = '#EA3323';
export const CAM_Z = 9.4;
export const FOV = 42;

const N = 3;
const COUNT = N * N * N;

/* Timeline, as fractions of the pinned scroll. */
const APPROACH_END = 0.34;
const SWING_START = 0.3;
const SWING_END = 0.54;
const GATHER_START = 0.54;
const GATHER_END = 0.9;
const SETTLE_START = 0.82;
const SETTLE_END = 0.99;

/* ─── The avenue ───────────────────────────────────────────────────────────
 * Cubes are paired left and right of the camera's path and ranked away from
 * it, so the section opens on a corridor whose vanishing point sits exactly
 * where the hero's zoom breaks through. It starts far enough away that the
 * whole corridor still fits inside the white gap while the hero's red is on
 * screen, then travels `AV_TRAVEL` so the near pairs sweep past the frame
 * edges. `AV_SWING`/`AV_TILT` turn the array and `AV_SQUASH` takes its depth
 * away, which is what turns two tidy rows into a jumble.
 * ────────────────────────────────────────────────────────────────────────── */
/** Corridor half-width: how far each row sits off the path. */
const AV_HALF_W = 3.0;
/** Rows sit well under the eye line. That is what makes the two lines
 *  converge diagonally up to the vanishing point instead of flattening into
 *  one horizontal row of cubes. They lift back to the middle as they turn. */
const AV_Y = -1.9;
const AV_Y_TURNED = -0.2;
/** Gap between consecutive pairs: close to a planted block's own width, so
 *  a row reads as a continuous hedge rather than scattered markers. */
const AV_SPACING = 4.4;
/** The nearest pair at scroll 0. Ranks run away from here (`-rank`), deep
 *  enough that the whole corridor still reads as one point at the centre. */
const AV_Z0 = -30;
/** How far the corridor slides past the camera during the approach: enough
 *  that the first pairs sweep out through the bottom corners of the frame. */
const AV_TRAVEL = 52;
/** The corridor holds still until the hero's red has given way to white.
 *  Until then it has to stay a point inside the gap. It then comes at the
 *  camera hardest immediately (the burst out of the "e") and eases off into
 *  the turn, rather than crawling for the first third of the section. */
const AV_HOLD = 0.04;
/** The array turns about this depth, roughly the middle of what's on screen. */
const AV_PIVOT_Z = -13;
const AV_SWING = 1.35;
const AV_TILT = 0.38;
/** Planted blocks are far chunkier than the cubes in the finished box: a
 *  block has to be comparable to the width of the path for the corridor to
 *  fill the frame at all. They shrink back as the rows break up. */
const AV_SIZE = 2.1;
/** Corridor depth left after the turn, so the rows collapse into a cloud. */
const AV_SQUASH = 0.17;
/** Ranks in the corridor: pairs either side, so 27 cubes make 14. */
const AV_RANKS = Math.ceil(COUNT / 2);

/** Staging radius in cube units: the box's bounding radius (√3 × 1.5) plus a
 *  cube's own, so a cube waiting there never touches the box. */
const STAGE_R = 3.6;
/** Share of a cube's gather window spent flying; the rest is the slide. */
const FLIGHT = 0.7;
/** Bounding radius of a unit cube, used for flight separation. */
const CUBE_R = 0.87;

const REST_ROT_Y = -0.55;
const REST_ROT_X = 0.42;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
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
  nx: number;
  ny: number;
  z: number;
  size: number;
  axis: THREE.Vector3;
  angle: number;
  speed: number;
  /** Avenue: which row (-1 left, +1 right) and how far down the corridor. */
  side: number;
  rank: number;
  /** Small offsets so the rows are planted, not stamped. */
  jx: number;
  jy: number;
  jz: number;
  /** Fade-in order: the far end of the corridor lights up first. */
  avDelay: number;
}

/* Build order: centre, then faces, edges, corners, each tier overlapping the
   last. The centre is home before any face starts its slide. */
const TIER_WINDOWS = [
  { from: 0, to: 0, len: 0.3 },
  { from: 0.08, to: 0.33, len: 0.4 },
  { from: 0.22, to: 0.5, len: 0.4 },
  { from: 0.4, to: 0.58, len: 0.4 },
];

/** Spreads the cubes over a jittered grid so they fill the frame evenly
 *  instead of clumping. */
function layout(cols: number, rows: number): Piece[] {
  const cells: Array<{ nx: number; ny: number }> = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      cells.push({
        nx: ((c + 0.2 + hash(i, 1) * 0.6) / cols) * 2 - 1,
        ny: ((r + 0.2 + hash(i, 2) * 0.6) / rows) * 2 - 1,
      });
    }
  }
  const picked = cells
    .map((cell, i) => ({ cell, k: hash(i, 3) }))
    .sort((a, b) => a.k - b.k)
    .slice(0, COUNT)
    .map((e) => e.cell);

  const slots: THREE.Vector3[] = [];
  for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++) slots.push(new THREE.Vector3(x, y, z));
  const tierOf = (s: THREE.Vector3) => Math.abs(s.x) + Math.abs(s.y) + Math.abs(s.z);
  const tierSeen = [0, 0, 0, 0];
  const tierSize = [1, 6, 12, 8];
  const ordered = slots
    .map((s, i) => ({ s, k: tierOf(s) + hash(i, 13) * 0.9 }))
    .sort((a, b) => a.k - b.k)
    .map((e) => e.s);

  return ordered.map((slot, i) => {
    const tier = tierOf(slot);
    const w = TIER_WINDOWS[tier];
    const k = tierSize[tier] > 1 ? tierSeen[tier] / (tierSize[tier] - 1) : 0;
    tierSeen[tier]++;
    const cell = picked[i];
    return {
      slot,
      dir: tier === 0 ? new THREE.Vector3() : slot.clone().normalize(),
      tier,
      start: lerp(w.from, w.to, k),
      len: w.len,
      nx: cell.nx,
      ny: cell.ny,
      z: -4 + hash(i, 4) * 5,
      size: 0.72 + hash(i, 5) * 0.4,
      axis: new THREE.Vector3(hash(i, 6) - 0.5, hash(i, 7) - 0.5, hash(i, 8) - 0.5).normalize(),
      angle: hash(i, 9) * Math.PI * 2,
      speed: 0.15 + hash(i, 10) * 0.25,
      side: i % 2 === 0 ? -1 : 1,
      rank: Math.floor(i / 2),
      jx: (hash(i, 21) - 0.5) * 0.5,
      jy: (hash(i, 22) - 0.5) * 0.44,
      jz: (hash(i, 23) - 0.5) * 1.3,
      avDelay: (AV_RANKS - 1 - Math.floor(i / 2)) / (AV_RANKS - 1),
    };
  });
}

const _q = new THREE.Quaternion();
const _qGroup = new THREE.Quaternion();
/** The avenue's own orientation, and each cube's before the box takes over. */
const _qAv = new THREE.Quaternion();
const _qTidy = new THREE.Quaternion();
const _qBase = new THREE.Quaternion();
const _av = new THREE.Vector3();
/** Planted cubes are turned off-axis by this much, so they read as boxes
 *  rather than flat red rectangles. It rotates the cube, never the array:
 *  the corridor itself has to stay square to the camera or its vanishing
 *  point drifts off the gap the hero zooms through. */
const _qTilt = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.26, 0.38, 0));
const _euler = new THREE.Euler();
const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _d = new THREE.Vector3();
const _scale = new THREE.Vector3();
const _m = new THREE.Matrix4();

export function CubeAssembly({
  progressRef,
  pointerRef,
}: {
  progressRef: React.MutableRefObject<number>;
  pointerRef: React.MutableRefObject<{ x: number; y: number }>;
}) {
  const mesh = useRef<THREE.InstancedMesh>(null);
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
    () => new THREE.MeshStandardMaterial({ color: RED, roughness: 0.31, metalness: 0.92, envMapIntensity: 0.8 }),
    []
  );
  useEffect(
    () => () => {
      geo.dispose();
      mat.dispose();
    },
    [geo, mat]
  );

  const landscape = useMemo(() => layout(7, 4), []);
  const portrait = useMemo(() => layout(4, 7), []);

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
    const p = progressRef.current;
    const time = state.clock.elapsedTime;
    const cam = state.camera as THREE.PerspectiveCamera;
    const aspect = state.size.width / state.size.height;
    const pieces = aspect >= 1 ? landscape : portrait;
    const tanHalf = Math.tan(THREE.MathUtils.degToRad(FOV / 2));

    const frameW = 2 * CAM_Z * tanHalf * aspect;
    const unit = Math.min(0.85, frameW / 7.5);
    const settle = easeInOutCubic(clamp01((p - SETTLE_START) / (SETTLE_END - SETTLE_START)));
    const spinY = REST_ROT_Y + p * Math.PI * 1.5;
    const turns = Math.round((spinY - REST_ROT_Y) / (Math.PI * 2));
    _euler.set(
      lerp(0.25 + Math.sin(p * 4) * 0.2, REST_ROT_X, settle) + pointerRef.current.y * 0.1,
      lerp(spinY, REST_ROT_Y + turns * Math.PI * 2, settle) + pointerRef.current.x * 0.14,
      0
    );
    _qGroup.setFromEuler(_euler);

    /* The corridor is laid out in cube units and scaled whole, so a phone
       sees the same composition as the iMac, just smaller. */
    const av = unit / 0.85;
    const travel = Math.pow(clamp01((p - AV_HOLD) / (APPROACH_END - AV_HOLD)), 0.75) * AV_TRAVEL * av;
    const swing = clamp01((p - SWING_START) / (SWING_END - SWING_START));
    /* The turn leads; the break-up into the jumble follows it. */
    const rotT = easeInOutCubic(clamp01(swing / 0.62));
    const cloudT = easeInOutCubic(smoothstep(0.32, 1, swing));
    const pivotZ = AV_PIVOT_Z * av;
    const depth = lerp(1, AV_SQUASH, rotT);
    const rowY = lerp(AV_Y, AV_Y_TURNED, rotT);
    _euler.set(AV_TILT * rotT, AV_SWING * rotT, 0);
    _qAv.setFromEuler(_euler);
    _qTidy.copy(_qAv).multiply(_qTilt);

    const gather = clamp01((p - GATHER_START) / (GATHER_END - GATHER_START));
    const stageR = STAGE_R * unit;
    // The no-fly sphere opens as the build begins, not during the scatter.
    const exclusion = stageR * smoothstep(0, 0.08, gather);

    pieces.forEach((piece, i) => {
      const w = work[i];
      const local = clamp01((gather - piece.start) / piece.len);

      /* Its place in the avenue: off to one side, ranked away down the
         corridor, the whole corridor sliding past and then flattening in
         towards the pivot as the array turns. */
      const railZ = (AV_Z0 - piece.rank * AV_SPACING + piece.jz) * av + travel;
      _av
        .set((piece.side * AV_HALF_W + piece.jx) * av, (rowY + piece.jy) * av, (railZ - pivotZ) * depth)
        .applyQuaternion(_qAv);
      _av.z += pivotZ;

      /* The jumble the build starts from: spread across the frame, mid-depth. */
      const halfH = (CAM_Z - piece.z) * tanHalf;
      _a.set(piece.nx * halfH * aspect * 0.86, piece.ny * halfH * 0.8, piece.z);
      _b.copy(_av).lerp(_a, cloudT);
      /* The far end of the corridor is already lit when the section opens,
         so the hero zooms into something rather than onto nothing. */
      const appear = clamp01((p + 0.025 - piece.avDelay * 0.03) / 0.045);

      /* Tidy while it is planted in the row; tumbling once the rows break up. */
      const tumble = _q.setFromAxisAngle(piece.axis, piece.angle + time * piece.speed + p * 3);
      _qBase.copy(_qTidy).slerp(tumble, cloudT);

      if (piece.tier === 0) {
        const f = easeInOutSine(local);
        w.pos.copy(_b).lerp(_d.set(0, 0, 0), f);
        w.mobility = 1 - smoothstep(0.2, 0.5, local);
        w.exclude = false;
      } else if (local < FLIGHT) {
        const f = easeInOutSine(local / FLIGHT);
        _d.copy(piece.dir).multiplyScalar(stageR).applyQuaternion(_qGroup);
        w.pos.copy(_b).lerp(_d, f);
        w.mobility = 1 - smoothstep(FLIGHT - 0.2, FLIGHT, local);
        w.exclude = true;
      } else {
        const s = easeInOutCubic((local - FLIGHT) / (1 - FLIGHT));
        const r = lerp(STAGE_R, piece.slot.length(), s) * unit;
        w.pos.copy(piece.dir).multiplyScalar(r).applyQuaternion(_qGroup);
        w.mobility = 0;
        w.exclude = false;
      }

      const square = easeInOutCubic(clamp01(local / (piece.tier === 0 ? 0.6 : FLIGHT - 0.1)));
      w.quat.copy(_qBase).slerp(_qGroup, square);
      const grow = easeInOutSine(clamp01(local / (piece.tier === 0 ? 0.6 : FLIGHT - 0.1)));
      /* One size while they are a planted row; their own sizes once they are
         a jumble; all equal again in the box. */
      w.scale = appear * lerp(AV_SIZE, lerp(piece.size, 1, grow), cloudT) * unit;
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

    for (let i = 0; i < COUNT; i++) {
      const w = work[i];
      _scale.setScalar(w.scale);
      m.setMatrixAt(i, _m.compose(w.pos, w.quat, _scale));
    }
    m.instanceMatrix.needsUpdate = true;

    cam.position.z = lerp(CAM_Z, CAM_Z - 0.7, settle);
  });

  return <instancedMesh ref={mesh} args={[geo, mat, COUNT]} frustumCulled={false} />;
}

/** Highlights only: the environment map supplies the fill, and an ambient
 *  light on top would wash the metal flat. */
export function CubeLighting() {
  return (
    <>
      <directionalLight position={[4, 6, 7]} intensity={2.1} color="#FFF6EC" />
      <directionalLight position={[-5, 2, -3]} intensity={0.7} color="#E8EEFA" />
    </>
  );
}
