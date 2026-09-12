import { Suspense, useEffect, useMemo, useRef } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import logoSrc from '@/imports/Screenshot_2026-07-03_at_1.17.51_PM.png';
import { createPosterTexture, type PosterSpec } from './posterTextures';
import { StudioEnvironment } from './StudioEnvironment';
import {
  sampleSequence,
  RESTING_STATE,
  BACKDROP_Z,
  DOORWAY_H,
  DOORWAY_W,
  FACADE_H,
  FACADE_W,
  FACADE_Z,
  LOGO_PLANE_W,
  LOGO_PLANE_H,
  LOGO_OFFSET_X,
  LOGO_OFFSET_Y,
  LOGO_Y,
  LOGO_Z,
} from './studioSequence';

/* ─── The entrance to Studio.glb ───────────────────────────────────────────
 * The supplied model IS the studio. Everything built here is only what the
 * threshold needs in order to exist: a facade with a doorway cut into it,
 * two door panels, and ground under the approach — because the model's own
 * floor stops at z = 6.59 and the camera starts at z = 9.
 *
 * The procedural room that used to live here (floor, ceiling, back wall,
 * side walls, plus a mock camera rig / desk / key lights) has been removed
 * outright. Keeping it would have meant a second, fake studio sitting
 * inside the real one.
 * ────────────────────────────────────────────────────────────────────────── */

const RED = '#EA3323';
const FACADE_COL = '#FFFFFF';   // exterior walls — white, as requested
const VOID_COL = '#F1EEE9';     // sky/void behind, so the white wall still reads as an edge
const GROUND_COL = '#DAD4CC';
const CHARCOAL = '#2A2724';
const FACADE_T = 0.25;
const DOOR_T = 0.09;

/* The mark, reconstructed exactly as Logo.tsx does it.
 *
 * Logo.tsx renders the raster brand asset through an SVG feColorMatrix that
 * derives alpha from "redness": A = 3R − 3G − 3B, isolating the red
 * letterforms and dropping the cream background. This shader performs the
 * identical operation on the identical source file, so the mark is never
 * redrawn, traced or approximated — it is the same pixels, masked the same
 * way, at its true 1.66:1 proportion. */
const LOGO_VERT = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const LOGO_FRAG = `
  uniform sampler2D uMap;
  uniform vec3 uColor;
  uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    vec4 t = texture2D(uMap, vUv);
    float a = clamp(3.0 * t.r - 3.0 * t.g - 3.0 * t.b, 0.0, 1.0);
    if (a < 0.02) discard;
    gl_FragColor = vec4(uColor, a * uOpacity);
  }
`;

export function StudioScene({
  progressRef,
  reduceMotion,
  simplified,
  onReady,
}: {
  progressRef: React.MutableRefObject<number>;
  reduceMotion: boolean;
  simplified: boolean;
  onReady?: () => void;
}) {
  const camera = useThree((s) => s.camera);

  const leftDoor = useRef<THREE.Mesh>(null);
  const rightDoor = useRef<THREE.Mesh>(null);
  const keyLight = useRef<THREE.PointLight>(null);
  const fillLight = useRef<THREE.PointLight>(null);
  const logoLight = useRef<THREE.SpotLight>(null);
  const logoMesh = useRef<THREE.Mesh>(null);

  const logoTexture = useLoader(THREE.TextureLoader, logoSrc);

  const logoMaterial = useMemo(() => {
    // No colour-space decode — the feColorMatrix maths assumes the stored
    // sRGB values, so the texture must pass through untouched.
    logoTexture.colorSpace = THREE.LinearSRGBColorSpace;
    logoTexture.minFilter = THREE.LinearFilter;
    logoTexture.magFilter = THREE.LinearFilter;
    logoTexture.generateMipmaps = false;
    return new THREE.ShaderMaterial({
      uniforms: {
        uMap: { value: logoTexture },
        uColor: { value: new THREE.Color(RED).convertSRGBToLinear() },
        uOpacity: { value: 0 },
      },
      vertexShader: LOGO_VERT,
      fragmentShader: LOGO_FRAG,
      transparent: true,
      depthWrite: false,
    });
  }, [logoTexture]);

  const mats = useMemo(
    () => ({
      /* Setting the colour to white alone was not enough: R3F applies ACES
         filmic tone mapping by default, which rolls a lit white surface off
         to roughly mid-grey — which is exactly what was rendering. Raising
         the scene lights would fix the wall but would also wash out
         Studio.glb, whose supplied look should not change. So the facade
         carries its own emissive instead: only this surface is lifted, and
         it reads as genuinely white while keeping a little shading. */
      facade: new THREE.MeshStandardMaterial({
        color: FACADE_COL,
        roughness: 0.95,
        metalness: 0,
        emissive: new THREE.Color('#FFFFFF'),
        emissiveIntensity: 0.85,
      }),
      ground: new THREE.MeshStandardMaterial({ color: GROUND_COL, roughness: 0.9, metalness: 0 }),
      door: new THREE.MeshStandardMaterial({ color: CHARCOAL, roughness: 0.65, metalness: 0.12 }),
      frame: new THREE.MeshStandardMaterial({ color: '#CFC8BE', roughness: 0.9, metalness: 0 }),
    }),
    []
  );

  /* Facade posters, sized as real sheets (~0.62 × 0.86 m) now that the scene
     is metric. Placement is bounded by what the OPENING shot can see: at
     camera z = 9 the facade sits 5 m away, giving ±2.76 of visible width on
     a 4:3 window — the narrowest realistic desktop — so nothing here exceeds
     that, and everything clears the 2.2 m doorway. */
  const posters = useMemo(() => {
    const layout: Array<{ spec: PosterSpec; x: number; y: number; w: number; h: number; portrait: boolean }> = [
      { spec: { design: 'clarity' }, x: -1.55, y: 1.5, w: 0.62, h: 0.86, portrait: true },
      { spec: { design: 'strategy' }, x: -2.3, y: 1.5, w: 0.62, h: 0.86, portrait: true },
      { spec: { design: 'details' }, x: 1.55, y: 1.5, w: 0.62, h: 0.86, portrait: true },
      { spec: { design: 'longevity' }, x: 2.3, y: 1.5, w: 0.62, h: 0.86, portrait: true },
      { spec: { design: 'process' }, x: -1.15, y: 2.72, w: 1.5, h: 0.42, portrait: false },
      { spec: { design: 'services' }, x: 1.15, y: 2.72, w: 1.5, h: 0.42, portrait: false },
    ];
    return layout.map((l) => ({ ...l, texture: createPosterTexture(l.spec, l.portrait) }));
  }, []);

  useEffect(() => {
    return () => posters.forEach((p) => p.texture.dispose());
  }, [posters]);

  useFrame(() => {
    const s = reduceMotion ? RESTING_STATE : sampleSequence(progressRef.current);

    camera.position.set(0, s.camY, s.camZ);
    camera.lookAt(0, s.lookY, BACKDROP_Z);

    if (leftDoor.current) leftDoor.current.position.x = -DOORWAY_W / 4 - s.doorOffset;
    if (rightDoor.current) rightDoor.current.position.x = DOORWAY_W / 4 + s.doorOffset;

    // Light builds inside the room as the doors part, so the interior is
    // revealed by illumination as much as by geometry.
    if (keyLight.current) keyLight.current.intensity = 1.5 + s.interior * 14;
    if (fillLight.current) fillLight.current.intensity = 0.6 + s.interior * 5;
    if (logoLight.current) logoLight.current.intensity = s.logo * 9;

    logoMaterial.uniforms.uOpacity.value = s.logo;
    if (logoMesh.current) logoMesh.current.position.z = LOGO_Z + s.logoZ;
  });

  const sideW = FACADE_W / 2 - DOORWAY_W / 2;

  return (
    <>
      {/* Background and fog match the facade so an ultrawide viewport never
          reveals a black void past the building edge. */}
      <color attach="background" args={[VOID_COL]} />
      <fog attach="fog" args={[VOID_COL, 14, 46]} />

      {/* ── Light ────────────────────────────────────────────────────────
          Studio.glb ships no lights of its own (confirmed: no cameras, no
          lights, no animations in the file), so the room is lit here.
          Deliberately unequal — the exterior stays flat and cool while the
          brightness lives inside, pulling the eye through the doorway. */}
      <ambientLight intensity={reduceMotion ? 0.55 : 0.4} />
      <directionalLight position={[6, 9, 14]} intensity={0.5} color="#FFF6EC" />
      <pointLight ref={keyLight} position={[0, 2.6, -0.2]} color="#FFF4E8" intensity={1.5} distance={14} decay={1.5} />
      {/* Fill is dropped on low-power devices — one less light evaluated per
          fragment across a 536k-triangle model is a real saving there. */}
      {!simplified && (
        <pointLight ref={fillLight} position={[2.2, 2.2, 1.4]} color="#F2F4FF" intensity={0.6} distance={10} decay={1.6} />
      )}
      {/* A practical aimed at the backdrop — the mark reads as lit, not glowing */}
      <spotLight
        ref={logoLight}
        position={[0, 2.85, 0.9]}
        target-position={[0, LOGO_Y, BACKDROP_Z]}
        angle={0.55}
        penumbra={0.85}
        color="#FFFFFF"
        intensity={0}
        distance={9}
        decay={1.5}
      />

      {/* ── Studio.glb: the real interior ────────────────────────────────*/}
      <Suspense fallback={null}>
        <StudioEnvironment onReady={onReady} />
      </Suspense>

      {/* ── Approach ground. The model's own floor ends at z = 6.59 and the
             camera starts at z = 9, so without this the opening shot looks
             out over nothing. ─────────────────────────────────────────── */}
      <mesh position={[0, -0.005, 9]} rotation={[-Math.PI / 2, 0, 0]} material={mats.ground}>
        <planeGeometry args={[46, 26]} />
      </mesh>

      {/* ── Facade with a doorway cut into it ────────────────────────────*/}
      <mesh position={[-DOORWAY_W / 2 - sideW / 2, FACADE_H / 2, FACADE_Z]} material={mats.facade}>
        <boxGeometry args={[sideW, FACADE_H, FACADE_T]} />
      </mesh>
      <mesh position={[DOORWAY_W / 2 + sideW / 2, FACADE_H / 2, FACADE_Z]} material={mats.facade}>
        <boxGeometry args={[sideW, FACADE_H, FACADE_T]} />
      </mesh>
      <mesh position={[0, DOORWAY_H + (FACADE_H - DOORWAY_H) / 2, FACADE_Z]} material={mats.facade}>
        <boxGeometry args={[DOORWAY_W, FACADE_H - DOORWAY_H, FACADE_T]} />
      </mesh>

      {/* ── Studio work, mounted beside the door ─────────────────────────*/}
      {posters.map((p, i) => (
        <group key={i} position={[p.x, p.y, FACADE_Z + FACADE_T / 2]}>
          <mesh position={[0, 0, 0.005]} material={mats.frame}>
            <boxGeometry args={[p.w + 0.05, p.h + 0.05, 0.02]} />
          </mesh>
          <mesh position={[0, 0, 0.018]}>
            <planeGeometry args={[p.w, p.h]} />
            <meshStandardMaterial
              map={p.texture}
              emissiveMap={p.texture}
              emissive="#ffffff"
              emissiveIntensity={0.4}
              roughness={0.85}
              metalness={0}
            />
          </mesh>
        </group>
      ))}

      {/* ── Doors: two panels parting from the centre, finishing their
             travel before the camera reaches the threshold ────────────── */}
      <mesh ref={leftDoor} position={[-DOORWAY_W / 4, DOORWAY_H / 2, FACADE_Z - 0.08]} material={mats.door}>
        <boxGeometry args={[DOORWAY_W / 2, DOORWAY_H, DOOR_T]} />
      </mesh>
      <mesh ref={rightDoor} position={[DOORWAY_W / 4, DOORWAY_H / 2, FACADE_Z - 0.08]} material={mats.door}>
        <boxGeometry args={[DOORWAY_W / 2, DOORWAY_H, DOOR_T]} />
      </mesh>

      {/* ── The mark, on the studio's own backdrop ───────────────────────
             Not floated in mid-air: the cyclorama at z = −1.40 is the
             surface this room exists to put things in front of, so that is
             where it hangs. Kept inside the backdrop's 3.8 m width at a
             restrained 1.2 m. ──────────────────────────────────────────*/}
      <mesh
        ref={logoMesh}
        position={[LOGO_OFFSET_X, LOGO_Y + LOGO_OFFSET_Y, LOGO_Z]}
        material={logoMaterial}
      >
        <planeGeometry args={[LOGO_PLANE_W, LOGO_PLANE_H]} />
      </mesh>

    </>
  );
}
