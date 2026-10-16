import { useEffect, useMemo } from 'react';
import { useLoader, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { layoutWallFrame, visibleWall, wallToScreenX, type WallFrameLayout } from './wallStatement';
import { doorRimX, facadeFrontZ, FACADE_Z, heroFov, sampleSequence } from './studioSequence';
import { createInkLineMaterial } from './inkLines';

/* ─── The framed poster on the facade ──────────────────────────────────────
 * "Done blending in?" hangs on the wall right of the door as a poster in a
 * carved frame (Rajat, 2026-10-16). The picture is an original painting of
 * old masters round a laptop by candlelight, with the line set over its dark
 * top-left (see public/images/hero/CREDITS.md). Swap the picture by replacing
 * POSTER_URL's file (same 1606x2048 portrait; the canvas is 0.784 wide/high).
 *
 * The frame is Poly Haven's "Fancy Picture Frame 02" (CC0, see
 * public/models/frame/CREDITS.md), drawn the way the studio's lamps are: a
 * solid ink body with cream line art. Its silhouette is the lamps' back-face
 * shell; the moulding's steps and the carving's major forms are clean lines
 * baked offline (frame_lines.bin: rectangles laid on the moulding's surface,
 * plus crease edges of a simplified copy of the ornament), drawn with the
 * lamps' own sketch material. Unlit, like the rest of the hero.
 * ────────────────────────────────────────────────────────────────────────── */

export const POSTER_URL = '/images/hero/blending-poster-v2.jpg';
const FRAME_URL = '/models/frame/frame.gltf';
/** Baked line art (scripts/bake-frame-lines.mjs), one file per engraver's weight. */
const LINE_SETS = [
  { url: '/models/frame/frame_lines_sight.bin', px: 1.2 },
  { url: '/models/frame/frame_lines_moulding.bin', px: 0.9 },
  { url: '/models/frame/frame_lines_carving.bin', px: 0.6 },
];

/** The model's own bounds, in metres (from the glTF accessors). */
const BOX = { x0: -0.3322, x1: 0.3283, y0: -0.391, y1: 0.38 };
const BOX_W = BOX.x1 - BOX.x0;
const BOX_H = BOX.y1 - BOX.y0;
const BOX_CX = (BOX.x0 + BOX.x1) / 2;
const BOX_CY = (BOX.y0 + BOX.y1) / 2;
const BOX_D = 0.0904;

/** Set into the facade by 10% of its depth (Rajat, 2026-10-16). */
const RECESS = 0.1;
/** Depth pressed to 45%: at this size the model's full depth read as a box
 *  standing off the wall. */
const DEPTH_K = 0.45;

/** The painted canvas inside the frame, in the model's metres. Drawn as our
 *  own plane: the asset's canvas UVs crop its texture. */
const CANVAS = { x0: -0.196, x1: 0.19605, y0: -0.2539, y1: 0.2456, z: 0.0094 };

/** White strokes on the ink body (Rajat, 2026-10-16), the lamps' line width. */
const SKETCH = '#FFFFFF';
/** The silhouette carries the heaviest weight. */
const SKETCH_PX = 1.2;
const INK = '#0A0A0A';

/** Where the frame hangs for this viewport shape (wall metres). */
export function frameLayout(aspect: number): WallFrameLayout | null {
  const fit = layoutWallFrame(aspect, BOX_W / BOX_H);
  if (!fit || aspect < 1) return fit; // phones: fully visible
  const big = massive(aspect, fit);
  if (!big) return fit;
  // Rajat, 2026-10-16: "it can come a little more down": LOWER of the
  // screen's height, in wall metres at the wall's distance.
  const s = sampleSequence(0);
  const viewH = 2 * Math.abs(s.camZ - FACADE_Z) * Math.tan(((heroFov(aspect, 0) / 2) * Math.PI) / 180);
  return { ...big, cy: big.cy - LOWER * viewH };
}
const LOWER = 0.05;

/* Desktop (Rajat, 2026-10-16: "MASSIVELY scaled in", then "move it down and a
   lot to the right"): the frame dominates the opening shot. Its left carved
   edge keeps DOOR_GAP of the screen's width clear of the door, its bottom
   may come down towards the scroll cue (which inverts over it), and it may
   run off the top and right edges. It is as big as it can be, as high as it
   can sit, while the poster's headline and laptop stay wholly on screen. */
const GROW_MAX = 1.8;
const DOOR_GAP = 0.1;
const Y_LOWEST = 0.35;
/** Regions of the poster that must stay in view, as canvas fractions
 *  (u from the left, v from the top): the headline and the laptop. */
const KEEP = [
  { u0: 0.04, u1: 0.7, v0: 0.04, v1: 0.27 },
  { u0: 0.28, u1: 0.68, v0: 0.6, v1: 0.78 },
];

function massive(aspect: number, fit: WallFrameLayout): WallFrameLayout | null {
  const span = visibleWall(aspect);
  if (!span) return null;
  const onScreen = (x: number, y: number) => {
    const sp = span(y);
    return !!sp && x > sp[0] + 0.15 && x < sp[1] - 0.15; // comfortably in view
  };
  /** Wall x whose screen position is `target` at height y (screen x grows with wall x here). */
  const xAtScreen = (target: number, y: number) => {
    let lo = -2;
    let hi = 9;
    for (let i = 0; i < 32; i++) {
      const mid = (lo + hi) / 2;
      if (wallToScreenX(aspect, mid, y) < target) lo = mid;
      else hi = mid;
    }
    return lo;
  };
  const keeps = (x0: number, y0: number, k: number) => {
    const at = (u: number, v: number): [number, number] => [
      x0 + (CANVAS.x0 + (CANVAS.x1 - CANVAS.x0) * u - BOX.x0) * k,
      y0 + (CANVAS.y1 - (CANVAS.y1 - CANVAS.y0) * v - BOX.y0) * k,
    ];
    return KEEP.every((r) =>
      [at(r.u0, r.v0), at(r.u1, r.v0), at(r.u1, r.v1), at(r.u0, r.v1)].every(([x, y]) => onScreen(x, y))
    );
  };
  // The size Rajat approved ("the size is perfect"): the biggest that keeps
  // the headline and laptop in view grown from the fitted frame's corner.
  const fx0 = fit.cx - fit.w / 2;
  const fy0 = fit.cy - fit.h / 2;
  let g = GROW_MAX;
  while (g > 1 && !keeps(fx0, fy0, (fit.w * g) / BOX_W)) g -= 0.02;
  if (g <= 1) return null;
  const w = fit.w * g;
  const h = fit.h * g;
  const k = w / BOX_W;
  // Then moved: down, and right to a clear gap from the door, as high as it
  // can sit with the headline and laptop still in view.
  for (let y0 = fy0; y0 >= Y_LOWEST; y0 -= 0.05) {
    const rimX = doorRimX(y0);
    const x0 = Math.max(rimX + 0.35, xAtScreen(wallToScreenX(aspect, rimX, y0) + DOOR_GAP, y0));
    if (keeps(x0, y0, k)) return { cx: x0 + w / 2, cy: y0 + h / 2, w, h };
  }
  return { cx: fx0 + w / 2, cy: fy0 + h / 2, w, h };
}

/* The lamps' silhouette shell (StudioEnvironment): back faces pushed out
   along the normals by a constant number of screen pixels. */
const HULL_VERT = `
  uniform float uWidth;
  uniform float uResY;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vec3 n = normalize(normalMatrix * normal);
    mv.xyz += n * (uWidth * -mv.z * 2.0 / (uResY * projectionMatrix[1][1]));
    gl_Position = projectionMatrix * mv;
  }
`;
const HULL_FRAG = `
  uniform vec3 uColor;
  void main() { gl_FragColor = vec4(uColor, 1.0); }
`;

/** Soft inset where the frame enters the wall. */
function shadowTexture() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 144;
  const g = c.getContext('2d')!;
  g.filter = 'blur(5px)';
  g.fillStyle = 'rgba(10,10,10,0.55)';
  g.fillRect(10, 10, 108, 124);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function GildedFrame({ aspect, wallLean }: { aspect: number; wallLean: number }) {
  const gltf = useLoader(GLTFLoader, FRAME_URL);
  const poster = useLoader(THREE.TextureLoader, POSTER_URL);
  const lineData = useLoader(
    THREE.FileLoader,
    LINE_SETS.map((l) => l.url),
    (l) => l.setResponseType('arraybuffer')
  ) as unknown as ArrayBuffer[];
  const size = useThree((s) => s.size);
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);
  const lineMats = useMemo(
    () =>
      LINE_SETS.map((l) => {
        const m = createInkLineMaterial(SKETCH, l.px);
        // Coverage-based edges: thin strokes stay smooth instead of crawling
        // as the opening sweep moves the camera.
        m.alphaToCoverage = true;
        // Pulled towards the camera in depth: at this size the moulding lines
        // tied with the moulding's own surface and broke into dashes.
        m.polygonOffset = true;
        m.polygonOffsetFactor = -6;
        m.polygonOffsetUnits = -12;
        return m;
      }),
    []
  );
  useEffect(() => () => lineMats.forEach((m) => m.dispose()), [lineMats]);
  useEffect(() => {
    lineMats.forEach((m) => m.resolution.set(size.width, size.height));
  }, [lineMats, size]);

  const layout = useMemo(() => frameLayout(aspect), [aspect]);

  const built = useMemo(() => {
    poster.colorSpace = THREE.SRGBColorSpace;
    poster.anisotropy = 16;
    poster.needsUpdate = true;
    const body = new THREE.MeshBasicMaterial({ color: INK, toneMapped: false, polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 4 });
    const posterMat = new THREE.MeshBasicMaterial({ map: poster, toneMapped: false });
    const hull = new THREE.ShaderMaterial({
      uniforms: { uColor: { value: new THREE.Color(SKETCH) }, uWidth: { value: SKETCH_PX }, uResY: { value: 800 } },
      vertexShader: HULL_VERT,
      fragmentShader: HULL_FRAG,
      side: THREE.BackSide,
    });

    // One copy per mount: never restyle the cached glTF scene in place (the
    // studio learned that the hard way, see StudioEnvironment).
    const scene = gltf.scene.clone(true);
    const frames: THREE.Mesh[] = [];
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      if (m.name.includes('canvas') || o.parent?.name.includes('canvas')) m.visible = false;
      else frames.push(m);
    });
    for (const m of frames) {
      m.material = body;
      m.add(new THREE.Mesh(m.geometry, hull));
    }
    const lines = lineData.map((buf, i) => new LineSegments2(new LineSegmentsGeometry().setPositions(new Float32Array(buf)), lineMats[i]));
    lines.forEach((l) => scene.add(l));

    const shadowMap = shadowTexture();
    const shadow = new THREE.MeshBasicMaterial({ map: shadowMap, transparent: true, depthWrite: false, toneMapped: false });
    return { scene, body, posterMat, hull, lines, shadow, shadowMap };
  }, [gltf, poster, lineData, lineMats]);

  useEffect(() => {
    built.hull.uniforms.uResY.value = size.height;
  }, [built, size]);
  /* Compile the frame's shaders and upload its textures now, not on the
     first frame that draws them (a ~80 ms program link and the poster upload
     otherwise land in the middle of the first scroll). */
  useEffect(() => {
    gl.initTexture(poster);
    gl.compile(built.scene, camera);
  }, [gl, camera, built, poster]);

  useEffect(
    () => () => {
      built.body.dispose();
      built.posterMat.dispose();
      built.hull.dispose();
      built.lines.forEach((l) => l.geometry.dispose());
      built.shadow.dispose();
      built.shadowMap.dispose();
    },
    [built]
  );

  if (!layout) return null;
  const k = layout.h / BOX_H;
  const kz = k * DEPTH_K;
  const recess = RECESS * BOX_D * kz; // metres into the wall
  /** Local z of the wall's face, inside the pressed group. */
  const wallZ = recess / kz;
  return (
    <group position={[layout.cx, layout.cy, facadeFrontZ(layout.cy) + 0.012 - recess]} rotation={[wallLean, 0, 0]}>
      <group scale={[k, k, kz]} position={[-BOX_CX * k, -BOX_CY * k, 0]}>
        {/* Dark inset where the frame enters the wall, on the wall's face,
            hugging the frame (a wide soft shadow read as a see-through
            panel on the wall). */}
        <mesh position={[BOX_CX, BOX_CY, wallZ + 0.002 / kz]} material={built.shadow}>
          <planeGeometry args={[BOX_W * 1.04, BOX_H * 1.035]} />
        </mesh>
        <primitive object={built.scene} />
        <mesh
          position={[(CANVAS.x0 + CANVAS.x1) / 2, (CANVAS.y0 + CANVAS.y1) / 2, Math.max(CANVAS.z + 0.0004, wallZ + 0.006 / kz)]}
          material={built.posterMat}
        >
          <planeGeometry args={[CANVAS.x1 - CANVAS.x0, CANVAS.y1 - CANVAS.y0]} />
        </mesh>
      </group>
    </group>
  );
}

useLoader.preload(GLTFLoader, FRAME_URL);
useLoader.preload(THREE.TextureLoader, POSTER_URL);
