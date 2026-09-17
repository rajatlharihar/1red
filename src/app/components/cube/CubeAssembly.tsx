import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/* ─── Many cubes → one cube ─────────────────────────────────────────────────
 * The hero's zoom through the "e" carries straight on: 27 cubes rush out of
 * the centre of the frame, spread across the viewport tumbling, then build a
 * 3×3×3 box while it turns.
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
const EMERGE_END = 0.2;
const GATHER_START = 0.22;
const GATHER_END = 0.86;
const SETTLE_START = 0.74;
const SETTLE_END = 0.96;

/** Where emerging cubes start: deep in the frame, near its centre. */
const EMERGE_Z = -36;
const EMERGE_SPREAD = 0.12;

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
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
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
  emergeDelay: number;
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
      emergeDelay: hash(i, 11),
    };
  });
}

const _q = new THREE.Quaternion();
const _qGroup = new THREE.Quaternion();
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

    const emerge = clamp01(p / EMERGE_END);
    const gather = clamp01((p - GATHER_START) / (GATHER_END - GATHER_START));
    const stageR = STAGE_R * unit;
    // The no-fly sphere opens as the build begins, not during the scatter.
    const exclusion = stageR * smoothstep(0, 0.08, gather);

    pieces.forEach((piece, i) => {
      const w = work[i];
      const local = clamp01((gather - piece.start) / piece.len);

      // Scatter: out of the frame's centre, deep, towards its spot.
      const e = clamp01((emerge - piece.emergeDelay * 0.35) / 0.65);
      const halfH = (CAM_Z - piece.z) * tanHalf;
      _a.set(piece.nx * halfH * aspect * 0.86, piece.ny * halfH * 0.8, piece.z);
      const farH = (CAM_Z - EMERGE_Z) * tanHalf;
      _b.set(piece.nx * farH * aspect * EMERGE_SPREAD, piece.ny * farH * EMERGE_SPREAD, EMERGE_Z);
      _b.lerp(_a, easeOutCubic(e));
      const appear = clamp01(e * 4);

      const tumble = _q.setFromAxisAngle(piece.axis, piece.angle + time * piece.speed + p * 3);

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
      w.quat.copy(tumble).slerp(_qGroup, square);
      const grow = easeInOutSine(clamp01(local / (piece.tier === 0 ? 0.6 : FLIGHT - 0.1)));
      w.scale = appear * lerp(piece.size, 1, grow) * unit;
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
