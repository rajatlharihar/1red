import { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree, type RootState, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useReducedMotion } from 'motion/react';
import { useNavigate } from 'react-router';
import projectsData from '../data/projects.json';

/* ─── 1Red 3D environment — Scroll-Driven Project Showcase ────────────────
 * Inspired by activetheory.net/work. A "scroll jail" captures wheel/touch
 * while the section is pinned and steps the cube through each project face
 * one by one. When all 5 projects have been shown the jail unlocks and normal
 * page scrolling resumes.
 *
 * Key design decisions:
 *  • Zero React re-renders per frame — all animation runs inside useFrame
 *    via refs. Only the `activeIndex` state (fires once per project step,
 *    not 60× per second) is held as React state for the HUD overlay.
 *  • Spring/damp approach for rotation, scale, and camera — never jumps.
 *  • Videos play at native resolution with LinearFilter + no mipmaps to
 *    avoid any compression-introduced blur.
 *  • Scroll jail uses a passive `wheel` listener on the outer wrapper div
 *    (not document) so it can't break other page sections.
 * ────────────────────────────────────────────────────────────────────────── */

export type Project = (typeof projectsData)[0];
const PROJECTS = projectsData as Project[];
const NUM_PROJECTS = PROJECTS.length;

const RED = '#EA3323';
const INK = '#0a0a0a';

const FLOOR_Y = -3.6;
const FLOOR_Z = -10;
const CUBE_POSITION: [number, number, number] = [0, 0.5, -9];
const CUBE_SIZE_IDLE = 6.6;
const CUBE_SIZE_FOCUSED = 9.2;

// How far inside the scroll range each project occupies (0–1)
// Entry ramp = 0–0.1, projects fill 0.1–0.9, exit ramp = 0.9–1
const ENTRY_END = 0.08;
const EXIT_START = 0.92;

function projectProgress(p: number): number {
  if (p < ENTRY_END) return 0;
  if (p > EXIT_START) return 1;
  return (p - ENTRY_END) / (EXIT_START - ENTRY_END);
}

/* ─── Undulating wireframe floor ────────────────────────────────────────── */

function GridFloor({ segments, reduceMotion }: { segments: number; reduceMotion: boolean }) {
  const geometry = useMemo(() => {
    const size = 84;
    const half = size / 2;
    const step = size / segments;
    const positions: number[] = [];
    for (let i = 0; i <= segments; i++) {
      const z = -half + i * step;
      for (let j = 0; j < segments; j++) {
        const x0 = -half + j * step;
        const x1 = -half + (j + 1) * step;
        positions.push(x0, 0, z, x1, 0, z);
      }
    }
    for (let i = 0; i <= segments; i++) {
      const x = -half + i * step;
      for (let j = 0; j < segments; j++) {
        const z0 = -half + j * step;
        const z1 = -half + (j + 1) * step;
        positions.push(x, 0, z0, x, 0, z1);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return geo;
  }, [segments]);

  const cubeLocal = useMemo(
    () => new THREE.Vector2(CUBE_POSITION[0], CUBE_POSITION[2] - FLOOR_Z),
    []
  );

  // Grid tint carries a small amount of brand red rather than flat ink — a
  // quiet way to make the "technical" floor read as part of the same
  // red-accented environment as the cube, without adding any new geometry.
  const gridColor = useMemo(() => new THREE.Color(INK).lerp(new THREE.Color(RED), 0.14), []);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: gridColor },
          uOpacity: { value: 0.15 },
          uCubeLocal: { value: cubeLocal },
        },
        vertexShader: `
          uniform float uTime;
          uniform vec2 uCubeLocal;
          void main() {
            vec3 pos = position;
            float dist = distance(pos.xz, uCubeLocal);
            float fade = smoothstep(9.0, 14.0, dist);
            float wave =
              sin(pos.x * 0.32 + uTime * 0.3) * 0.85 +
              cos(pos.z * 0.27 + uTime * 0.22) * 0.65 +
              sin((pos.x + pos.z) * 0.55 + uTime * 0.4) * 0.3;
            pos.y += wave * fade;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 uColor;
          uniform float uOpacity;
          void main() {
            gl_FragColor = vec4(uColor, uOpacity);
          }
        `,
        transparent: true,
      }),
    [cubeLocal]
  );

  useEffect(() => () => { geometry.dispose(); material.dispose(); }, [geometry, material]);

  useFrame((state) => {
    if (reduceMotion) return;
    material.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return <lineSegments geometry={geometry} material={material} position={[0, FLOOR_Y, FLOOR_Z]} />;
}

/* ─── Video texture — highest-quality settings ─────────────────────────── */

function useVideoTexture(src: string): THREE.VideoTexture {
  const texRef = useRef<THREE.VideoTexture | null>(null);
  if (!texRef.current) {
    const video = document.createElement('video');
    video.src = src;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = 'auto';
    // Ensure maximum quality - no compression
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    const tex = new THREE.VideoTexture(video);
    tex.colorSpace = THREE.SRGBColorSpace;
    // LinearFilter on both prevents any blurring from texture sampling
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = false; // Mipmaps cause compression - disabled
    tex.format = THREE.RGBAFormat;
    tex.anisotropy = 16; // Maximum anisotropic filtering for sharpness
    texRef.current = tex;
  }

  useEffect(() => {
    const tex = texRef.current!;
    const video = tex.image as HTMLVideoElement;
    const attempt = () => video.play().catch(() => {});
    if (video.readyState >= 2) attempt();
    else video.addEventListener('canplay', attempt, { once: true });

    // Cube faces are square, but the source videos aren't (portrait, square,
    // 16:9 — all four differ). Mapping a non-square video onto a 1:1 UV
    // square with no correction stretches it. Crop to a centered square
    // (the texture equivalent of `object-fit: cover`) once real dimensions
    // are known, so every face shows an undistorted, filled frame.
    const applyCoverCrop = () => {
      const aspect = video.videoWidth / video.videoHeight;
      if (!aspect || Number.isNaN(aspect)) return;
      if (aspect > 1) {
        tex.repeat.set(1 / aspect, 1);
        tex.offset.set((1 - 1 / aspect) / 2, 0);
      } else {
        tex.repeat.set(1, aspect);
        tex.offset.set(0, (1 - aspect) / 2);
      }
    };
    if (video.readyState >= 1) applyCoverCrop();
    else video.addEventListener('loadedmetadata', applyCoverCrop, { once: true });
  }, []);

  useEffect(() => {
    const tex = texRef.current;
    return () => {
      if (!tex) return;
      const video = tex.image as HTMLVideoElement;
      video.pause();
      video.removeAttribute('src');
      video.load();
      tex.dispose();
    };
  }, []);

  return texRef.current!;
}

/* ─── Poster textures — canvas-drawn for video-less faces ─────────────── */

function createPosterTexture(draw: (ctx: CanvasRenderingContext2D, size: number) => void): THREE.CanvasTexture {
  const size = 2048; // Higher res for crisper text
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  draw(ctx, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.anisotropy = 16;
  if (typeof document !== 'undefined' && 'fonts' in document) {
    document.fonts.ready.then(() => {
      draw(ctx, size);
      texture.needsUpdate = true;
    });
  }
  return texture;
}

function drawIllusdoodlePoster(ctx: CanvasRenderingContext2D, size: number) {
  const margin = size * 0.09;
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = '#EDE8F2';
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = RED;
  ctx.fillRect(margin, margin, size * 0.022, size * 0.022);
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = 'rgba(10,10,10,0.45)';
  ctx.font = `600 ${size * 0.026}px Outfit, sans-serif`;
  ctx.fillText('05 — BRAND STRATEGY', margin + size * 0.045, margin + size * 0.02);
  ctx.fillStyle = INK;
  ctx.font = `700 ${size * 0.105}px Outfit, sans-serif`;
  ctx.fillText('Illusdoodle', margin, size * 0.52);
  ctx.fillStyle = 'rgba(10,10,10,0.55)';
  ctx.font = `500 ${size * 0.03}px Outfit, sans-serif`;
  ctx.fillText('Positioning & Creative Direction', margin, size * 0.58);
  ctx.fillStyle = RED;
  ctx.font = `700 ${size * 0.028}px Outfit, sans-serif`;
  const mark = '1RED';
  ctx.fillText(mark, size - margin - ctx.measureText(mark).width, size - margin);
}

function drawBrandPoster(ctx: CanvasRenderingContext2D, size: number) {
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = RED;
  ctx.fillRect(0, 0, size, size);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.font = `800 ${size * 0.16}px Outfit, sans-serif`;
  ctx.fillText('1RED', size / 2, size * 0.46);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = `500 ${size * 0.03}px Outfit, sans-serif`;
  ctx.fillText('ALL PROJECTS', size / 2, size * 0.58);
}

/* ─── Cube materials — six faces in BoxGeometry order [+x,-x,+y,-y,+z,-z] */

// Lit, not flat-shaded: MeshBasicMaterial ignores scene lights entirely,
// which is why the cube previously read as a flat decal rather than a
// physical object. MeshStandardMaterial responds to the ambient/key/rim
// lights added in CubeLighting below, giving real per-face brightness
// separation and a restrained specular sheen — while `map` (the video
// texture itself) is untouched, so footage stays exactly as sharp and
// undistorted as before. Roughness/metalness are kept high/low respectively
// so the sheen stays subtle ("product visualization," not "video game").
function useCubeMaterials() {
  // Load all four video textures
  const apptileTex  = useVideoTexture(PROJECTS[0].video!); // Apptile  → +z face
  const terrabarnTex = useVideoTexture(PROJECTS[1].video!); // Terrabarn → +x face
  const groundTex   = useVideoTexture(PROJECTS[2].video!); // Ground   → -z face
  const yuiTex      = useVideoTexture(PROJECTS[3].video!); // Yui      → -x face

  return useMemo(
    () => [
      new THREE.MeshStandardMaterial({ map: terrabarnTex, roughness: 0.58, metalness: 0.06 }), // +x — Terrabarn (project 02)
      new THREE.MeshStandardMaterial({ map: yuiTex, roughness: 0.58, metalness: 0.06 }),       // -x — Yui       (project 04)
      new THREE.MeshStandardMaterial({ map: createPosterTexture(drawIllusdoodlePoster), roughness: 0.58, metalness: 0.06 }), // +y — Illusdoodle (project 05)
      new THREE.MeshStandardMaterial({ map: createPosterTexture(drawBrandPoster), roughness: 0.5, metalness: 0.08 }),       // -y — 1Red brand
      new THREE.MeshStandardMaterial({ map: apptileTex, roughness: 0.58, metalness: 0.06 }),   // +z — Apptile   (project 01)
      new THREE.MeshStandardMaterial({ map: groundTex, roughness: 0.58, metalness: 0.06 }),    // -z — Ground    (project 03)
    ],
    [apptileTex, terrabarnTex, groundTex, yuiTex]
  );
}

/* ─── Cube lighting rig — ambient + key + red rim ───────────────────────
 * Ambient stays dominant so every face reads at near-full brightness (the
 * video must never look "dimmed" or "reduced quality"); the key light adds
 * a real per-face brightness gradient for depth/separation; the red point
 * light sits behind the cube, mostly grazing the faces turned away from
 * camera, for a warm rim bleed at the silhouette — "red ambient light" as
 * an actual light source, not a flat background fill. The key light drifts
 * a little with the pointer for the "gentle lighting shift" on interaction.
 * ────────────────────────────────────────────────────────────────────────── */

function CubeLighting({ reduceMotion }: { reduceMotion: boolean }) {
  const keyRef = useRef<THREE.DirectionalLight>(null);

  useFrame((state, delta) => {
    const key = keyRef.current;
    if (!key || reduceMotion) return;
    const targetX = 4.4 + state.pointer.x * 1.6;
    const targetY = 6.4 + state.pointer.y * 0.8;
    key.position.x = THREE.MathUtils.damp(key.position.x, targetX, 3.5, delta);
    key.position.y = THREE.MathUtils.damp(key.position.y, targetY, 3.5, delta);
  });

  return (
    <>
      <ambientLight intensity={0.88} color="#ffffff" />
      <directionalLight ref={keyRef} position={[4.4, 6.4, 6]} intensity={0.42} color="#fff3ec" />
      <pointLight
        position={[CUBE_POSITION[0], CUBE_POSITION[1] - 0.5, CUBE_POSITION[2] - 6.5]}
        intensity={16}
        distance={22}
        decay={2}
        color={RED}
      />
    </>
  );
}

/* ─── Red atmosphere — a single additive quad behind the cube ───────────
 * The "ambient red glow" as an actual soft light-halo sitting in 3D space
 * behind the cube, not a flat page background. Unlit and additive, so its
 * appearance is fully deterministic (no photometric guesswork) regardless
 * of how the physically-lit cube materials above resolve. Brightens subtly
 * once the section is focused, so "the environment becomes more visible"
 * as the user scrolls in, matching the scroll-driven camera dolly.
 * ────────────────────────────────────────────────────────────────────────── */

function CubeHalo({
  progressRef,
  reduceMotion,
}: {
  progressRef: React.MutableRefObject<number>;
  reduceMotion: boolean;
}) {
  const texture = useMemo(() => {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, 'rgba(234,51,35,0.95)');
    g.addColorStop(0.45, 'rgba(234,51,35,0.32)');
    g.addColorStop(1, 'rgba(234,51,35,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);

  useEffect(() => () => texture.dispose(), [texture]);

  useFrame((_state, delta) => {
    const mat = materialRef.current;
    if (!mat) return;
    const p = progressRef.current;
    const focused = p >= ENTRY_END && p <= EXIT_START;
    const target = focused ? 0.5 : 0.24;
    if (reduceMotion) {
      mat.opacity = target;
      return;
    }
    mat.opacity = THREE.MathUtils.damp(mat.opacity, target, 2.5, delta);
  });

  return (
    <mesh position={[CUBE_POSITION[0], CUBE_POSITION[1] + 0.6, CUBE_POSITION[2] - 5.5]}>
      <planeGeometry args={[15, 15]} />
      <meshBasicMaterial
        ref={materialRef}
        map={texture}
        transparent
        opacity={0.24}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </mesh>
  );
}

/* ─── Contact shadow — the cube's only grounding cue ─────────────────────
 * A single soft radial-gradient disc on the floor plane. Deliberately just
 * a shadow, not a platform/pedestal/particle field — an earlier attempt at
 * "support leg" geometry + a particle field under the /services cards was
 * built and explicitly reverted for looking cluttered; this stays minimal.
 * ────────────────────────────────────────────────────────────────────────── */

function ContactShadow() {
  const texture = useMemo(() => {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, 'rgba(10,10,10,0.5)');
    g.addColorStop(0.55, 'rgba(10,10,10,0.16)');
    g.addColorStop(1, 'rgba(10,10,10,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }, []);

  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <mesh position={[CUBE_POSITION[0], FLOOR_Y + 0.03, CUBE_POSITION[2]]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[9, 9]} />
      <meshBasicMaterial map={texture} transparent opacity={0.55} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

/* ─── Center 3D cube — scroll-driven face targeting + scale animation ──── */

// Pre-computed target rotations per project so the cube faces "forward" (+z toward camera).
// BoxGeometry face order: [+x,-x,+y,-y,+z,-z]. Camera sits at +z looking toward
// -z, so +z is naturally front with no rotation applied.
//
// These signs were verified directly against three.js's actual Euler/rotation
// behavior (not hand-derived) — a previous version had Terrabarn/Yui swapped
// and Illusdoodle pointing at the brand face instead of its own poster:
//   rotY = -π/2  →  +x front   |   rotY = +π/2  →  -x front
//   rotY =  π    →  -z front   |   rotX = +π/2  →  +y front
const TARGET_ROTATIONS: [number, number][] = [
  [0,          0],     // Project 01 — Apptile    → +z face front (rotY=0)
  [-1.5707963, 0],     // Project 02 — Terrabarn  → +x face front (rotY=-π/2)
  [3.1415926,  0],     // Project 03 — Ground     → -z face front (rotY=π)
  [1.5707963,  0],     // Project 04 — Yui        → -x face front (rotY=π/2)
  [0,          1.5707963], // Project 05 — Illusdoodle → +y face front (rotX=π/2)
];

function Center3DSlot({
  progressRef,
  onProjectChange,
  reduceMotion,
  cardHoverRef,
}: {
  progressRef: React.MutableRefObject<number>;
  onProjectChange: (idx: number | null) => void;
  reduceMotion: boolean;
  cardHoverRef: React.MutableRefObject<boolean>;
}) {
  const outerRef = useRef<THREE.Group>(null);
  const tiltRef  = useRef<THREE.Group>(null);
  const spinRef  = useRef<THREE.Group>(null);
  const scaleRef = useRef(CUBE_SIZE_IDLE);
  const lastIndexRef = useRef<number | null>(null);

  // Drag state
  const dragRef = useRef({ active: false, moved: false, lastX: 0, lastY: 0, extraY: 0, extraX: 0 });
  const navigate = useNavigate();
  const { gl } = useThree();

  const materials  = useCubeMaterials();
  const boxGeo     = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const edgesGeo   = useMemo(() => new THREE.EdgesGeometry(boxGeo), [boxGeo]);
  const edgeMat    = useMemo(() => new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.34 }), []);

  useEffect(() => () => { boxGeo.dispose(); edgesGeo.dispose(); edgeMat.dispose(); }, [boxGeo, edgesGeo, edgeMat]);
  useEffect(() => () => { materials.forEach(m => { (m as THREE.MeshStandardMaterial).map?.dispose(); m.dispose(); }); }, [materials]);
  useEffect(() => () => { gl.domElement.style.cursor = 'auto'; }, [gl]);

  useFrame((_state: RootState, delta: number) => {
    const spin  = spinRef.current;
    const outer = outerRef.current;
    if (!spin || !outer) return;

    const p = progressRef.current;
    const pp = projectProgress(p);

    // Derive active project index from normalized progress. Under reduced
    // motion, progressRef is pinned at a fixed 0.5 and never advances — left
    // ungated, that resolves to a permanent "middle project" index whose
    // fixed-position HUD card would then float over every section below for
    // the rest of the page. There's no scroll showcase to index into under
    // reduced motion, so it always stays null (HUD never shows) instead.
    let activeIdx: number | null = null;
    if (!reduceMotion && p >= ENTRY_END && p <= EXIT_START) {
      activeIdx = Math.min(Math.floor(pp * NUM_PROJECTS), NUM_PROJECTS - 1);
    }

    // Notify React (HUD) only on actual change — avoids constant re-renders
    if (activeIdx !== lastIndexRef.current) {
      lastIndexRef.current = activeIdx;
      onProjectChange(activeIdx);
    }

    // Target rotation
    let targetRotY = 0;
    let targetRotX = 0;
    if (activeIdx !== null) {
      [targetRotY, targetRotX] = TARGET_ROTATIONS[activeIdx];
    }

    // Smooth continuous-rotation approach — always rotate through the shortest arc
    // We track cumulative rotation so we never jump across 2π boundaries.
    const curY = spin.rotation.y - dragRef.current.extraY;
    const curX = spin.rotation.x - dragRef.current.extraX;

    // Wrap delta to [-π, π]
    let dY = ((targetRotY - curY) % (2 * Math.PI));
    if (dY > Math.PI) dY -= 2 * Math.PI;
    if (dY < -Math.PI) dY += 2 * Math.PI;
    let dX = ((targetRotX - curX) % (2 * Math.PI));
    if (dX > Math.PI) dX -= 2 * Math.PI;
    if (dX < -Math.PI) dX += 2 * Math.PI;

    const smoothY = THREE.MathUtils.damp(0, dY, 5.5, delta);
    const smoothX = THREE.MathUtils.damp(0, dX, 5.5, delta);

    spin.rotation.y += smoothY;
    spin.rotation.x += smoothX;

    // Scale: idle → focused
    const targetScale = activeIdx !== null ? CUBE_SIZE_FOCUSED : CUBE_SIZE_IDLE;
    scaleRef.current = THREE.MathUtils.damp(scaleRef.current, targetScale, 4.0, delta);
    spin.scale.setScalar(scaleRef.current);

    // Gentle floating
    if (!reduceMotion) {
      outer.position.y = CUBE_POSITION[1] + Math.sin(_state.clock.elapsedTime * 0.5) * 0.14;
      outer.position.x = CUBE_POSITION[0];
      outer.position.z = CUBE_POSITION[2];
    }

    // Ambient pointer "notices you" tilt — its own nested transform layer
    // (tiltRef, between outer and spin), so it composes with rather than
    // fights the scroll/drag rotation already owning spin.rotation above.
    // A hovered info card nudges the same target slightly, so the cube and
    // card read as one connected system rather than two unrelated objects.
    const tilt = tiltRef.current;
    if (tilt) {
      if (reduceMotion) {
        tilt.rotation.y = 0;
        tilt.rotation.x = 0;
      } else {
        const noticed = cardHoverRef.current ? 1 : 0;
        const targetTiltY = _state.pointer.x * 0.09 + noticed * 0.05;
        const targetTiltX = -_state.pointer.y * 0.05 - noticed * 0.02;
        tilt.rotation.y = THREE.MathUtils.damp(tilt.rotation.y, targetTiltY, 4.5, delta);
        tilt.rotation.x = THREE.MathUtils.damp(tilt.rotation.x, targetTiltX, 4.5, delta);
      }
    }
  });

  /* ── Drag interaction ─────────────────────────────────────────────────── */

  const handlePointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    dragRef.current.active = true;
    dragRef.current.moved = false;
    dragRef.current.lastX = e.clientX;
    dragRef.current.lastY = e.clientY;
    (e.target as Element & { setPointerCapture?: (id: number) => void }).setPointerCapture?.(e.pointerId);
    gl.domElement.style.cursor = 'grabbing';
  }, [gl]);

  const handlePointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (!dragRef.current.active) return;
    const dx = e.clientX - dragRef.current.lastX;
    const dy = e.clientY - dragRef.current.lastY;
    dragRef.current.lastX = e.clientX;
    dragRef.current.lastY = e.clientY;
    if (Math.abs(dx) + Math.abs(dy) > 2) dragRef.current.moved = true;
    dragRef.current.extraY += dx * 0.008;
    dragRef.current.extraX = THREE.MathUtils.clamp(dragRef.current.extraX - dy * 0.006, -0.5, 0.5);
    if (spinRef.current) {
      spinRef.current.rotation.y += dx * 0.008;
      spinRef.current.rotation.x -= dy * 0.006;
    }
  }, []);

  const endDrag = useCallback((_e: ThreeEvent<PointerEvent>) => {
    dragRef.current.active = false;
    gl.domElement.style.cursor = 'grab';
  }, [gl]);

  const handlePointerOver = useCallback(() => { gl.domElement.style.cursor = 'grab'; }, [gl]);
  const handlePointerOut  = useCallback(() => { if (!dragRef.current.active) gl.domElement.style.cursor = 'auto'; }, []);

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (dragRef.current.moved) { dragRef.current.moved = false; return; }
  }, []);

  return (
    <group ref={outerRef} position={CUBE_POSITION}>
      <group ref={tiltRef}>
        <group ref={spinRef}>
          <mesh
            geometry={boxGeo}
            material={materials}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={endDrag}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
            onClick={handleClick}
          />
          <lineSegments geometry={edgesGeo} material={edgeMat} />
        </group>
      </group>
    </group>
  );
}

/* ─── Camera rig — cinematic scroll-driven positioning ──────────────────── */

function CameraRig({
  progressRef,
  reduceMotion,
}: {
  progressRef: React.MutableRefObject<number>;
  reduceMotion: boolean;
}) {
  useFrame((state: RootState, delta: number) => {
    const p = projectProgress(progressRef.current);
    const cam = state.camera;
    if (!reduceMotion) {
      // Pull camera closer and lower as we enter project showcase
      const focused = progressRef.current >= ENTRY_END && progressRef.current <= EXIT_START;
      const targetY = focused ? 3.8 : 7.5;
      const targetZ = focused ? 9.2 : 21;
      const targetX = Math.sin(p * Math.PI * 0.5) * 0.6;
      cam.position.x = THREE.MathUtils.damp(cam.position.x, targetX, 3.0, delta);
      cam.position.y = THREE.MathUtils.damp(cam.position.y, targetY, 3.0, delta);
      cam.position.z = THREE.MathUtils.damp(cam.position.z, targetZ, 3.0, delta);
    }
    cam.lookAt(0, 0, -9);
  });
  return null;
}

/* ─── Scene ───────────────────────────────────────────────────────────── */

function EnvironmentScene({
  progressRef,
  segments,
  reduceMotion,
  onProjectChange,
  cardHoverRef,
}: {
  progressRef: React.MutableRefObject<number>;
  segments: number;
  reduceMotion: boolean;
  onProjectChange: (idx: number | null) => void;
  cardHoverRef: React.MutableRefObject<boolean>;
}) {
  return (
    <>
      <CameraRig progressRef={progressRef} reduceMotion={reduceMotion} />
      <CubeLighting reduceMotion={reduceMotion} />
      <GridFloor segments={segments} reduceMotion={reduceMotion} />
      <ContactShadow />
      <CubeHalo progressRef={progressRef} reduceMotion={reduceMotion} />
      <Center3DSlot
        progressRef={progressRef}
        onProjectChange={onProjectChange}
        reduceMotion={reduceMotion}
        cardHoverRef={cardHoverRef}
      />
    </>
  );
}

/* ─── Top-level export ───────────────────────────────────────────────────
 * Exposes `activeProject` so HomePage can mount the HUD next to the canvas.
 * The scroll jail lives here: wheel/touch events on the outer wrapper
 * accumulate scroll into `progressRef`. When progress reaches 1 (all 5
 * projects shown) we release the jail and normal page scroll resumes.
 * ────────────────────────────────────────────────────────────────────── */

export function ThreeEnvironment({
  onProjectChange,
  cardHoverRef: externalCardHoverRef,
}: {
  onProjectChange?: (idx: number | null) => void;
  /** Shared with ProjectHUD so hovering the info card makes the cube
   *  "notice" it — a ref (not state) so neither side ever re-renders on
   *  hover. Optional: if the caller doesn't share one, a local ref is used
   *  and the cube simply never receives the card-hover nudge. */
  cardHoverRef?: React.MutableRefObject<boolean>;
}) {
  const wrapRef     = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const reduceMotion = useReducedMotion() ?? false;
  const [density, setDensity] = useState<'high' | 'low'>('high');
  const internalCardHoverRef = useRef(false);
  const cardHoverRef = externalCardHoverRef ?? internalCardHoverRef;

  /* media query for grid density */
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 900px)');
    const apply = () => setDensity(mq.matches ? 'low' : 'high');
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  /* ── Scroll jail ──────────────────────────────────────────────────────
   * Uses the outer wrapper's scroll position rather than page scroll so
   * other sections are never affected. The wrapper is set to overflow:auto
   * and sized to (NUM_PROJECTS + 2) × 100vh so internal scrolling drives
   * progressRef from 0 to 1 across that range.
   *
   * On desktop: intercept wheel events on the section and convert them to
   * progress increments.  On mobile: use IntersectionObserver to watch if
   * we are pinned, then translate touch delta into the same progress ref.
   * ────────────────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (reduceMotion) {
      progressRef.current = 0.5;
      return;
    }

    const wrap = wrapRef.current;
    if (!wrap) return;

    // Track whether the section is "in the scroll jail" (sticky canvas is visible)
    let jailed = false;
    let rafId: number;

    const updateProgress = () => {
      if (!wrap) return;
      const rect = wrap.getBoundingClientRect();
      const total = wrap.offsetHeight - window.innerHeight;
      if (total <= 0) { progressRef.current = 1; return; }
      const scrolled = -rect.top;
      progressRef.current = Math.max(0, Math.min(1, scrolled / total));
      jailed = scrolled > 0 && scrolled < total;
    };

    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateProgress);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    updateProgress();

    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafId);
    };
  }, [reduceMotion]);

  /* Project change handler — stable callback so Scene children never re-render */
  const handleProjectChange = useCallback((idx: number | null) => {
    onProjectChange?.(idx);
  }, [onProjectChange]);

  const segments = density === 'high' ? 44 : 22;
  const dpr: [number, number] = density === 'high' ? [1, 2] : [1, 1];

  return (
    <div
      ref={wrapRef}
      style={{
        // 1 viewport for entry + 5 for projects + 1 for exit = 7 total
        height: reduceMotion ? '100vh' : `${(NUM_PROJECTS + 2) * 100}vh`,
        position: 'relative',
        // Light-dominant environment with red behaving as an atmosphere/light
        // source rather than a background fill — a soft radial glow roughly
        // centered on the cube, never a flat red panel. White stays the base.
        background:
          'radial-gradient(46% 42% at 50% 42%, rgba(234,51,35,0.09) 0%, rgba(234,51,35,0.03) 48%, transparent 74%),' +
          'radial-gradient(70% 55% at 50% 96%, rgba(234,51,35,0.05) 0%, transparent 62%),' +
          '#ffffff',
      }}
    >
      <div
        style={{
          position: reduceMotion ? 'relative' : 'sticky',
          top: 0,
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        <Canvas
          dpr={dpr}
          gl={{ alpha: true, antialias: true, toneMapping: THREE.NoToneMapping, powerPreference: 'high-performance' }}
          camera={{ position: [0, 7.5, 21], fov: 42, near: 0.1, far: 100 }}
        >
          <EnvironmentScene
            progressRef={progressRef}
            segments={segments}
            reduceMotion={reduceMotion}
            onProjectChange={handleProjectChange}
            cardHoverRef={cardHoverRef}
          />
        </Canvas>
      </div>
    </div>
  );
}
