import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { cubeVisual, lerp, STATE_COUNT } from './problemStates';

/* ─── The cube, built from eight blocks ────────────────────────────────────
 * Not a single box: a 2×2×2 stack of units, which is the same construction
 * logic the 1Red mark itself uses. That choice is what makes the metaphor
 * possible — a solid cube can only spin, but a stacked one can come apart
 * and close back up.
 *
 * Broken apart while the frictions are named; closed, square and carrying
 * the red mark-square once the argument resolves. All eight blocks are one
 * shared geometry and one shared material, animated by mutating transforms
 * inside useFrame — no React state per frame, 9 draw calls total.
 * ────────────────────────────────────────────────────────────────────────── */

const RED = '#EA3323';
const UNIT = 0.5; // half-size of each block
const GAP = 0.012; // hairline seam so the closed cube still reads as built

/** Unit-cube corners: the eight block positions, and the direction each
 *  travels when the object comes apart. */
const CORNERS: Array<[number, number, number]> = [
  [-1, -1, -1], [1, -1, -1], [-1, 1, -1], [1, 1, -1],
  [-1, -1, 1], [1, -1, 1], [-1, 1, 1], [1, 1, 1],
];

/** Deterministic per-block wobble — same every run, no Math.random. */
const WOBBLE = CORNERS.map((c, i) => ({
  spread: 0.55 + ((i * 37) % 11) / 22,
  spin: (((i * 53) % 17) / 17 - 0.5) * 0.9,
}));

export function CubeObject({
  stateRef,
  pointerRef,
  reduceMotion,
}: {
  stateRef: React.MutableRefObject<number>;
  pointerRef: React.MutableRefObject<{ x: number; y: number }>;
  reduceMotion: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const blocks = useRef<Array<THREE.Mesh | null>>([]);
  const mark = useRef<THREE.Mesh>(null);
  const camera = useThree((s) => s.camera);

  const geo = useMemo(() => new THREE.BoxGeometry(UNIT * 2 - GAP, UNIT * 2 - GAP, UNIT * 2 - GAP), []);
  const mat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#EFEAE3', roughness: 0.62, metalness: 0.05 }),
    []
  );
  const markMat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: RED, transparent: true, opacity: 0 }),
    []
  );

  useFrame(() => {
    // Reduced motion never mounts this canvas (the section returns a static
    // list instead), but if it ever did it should show the resolved object.
    const s = cubeVisual(reduceMotion ? STATE_COUNT - 1 : stateRef.current);
    const g = group.current;
    if (!g) return;

    // Cursor parallax: a small bias on the whole object, never enough to
    // make the leading face ambiguous.
    const px = reduceMotion ? 0 : pointerRef.current.x;
    const py = reduceMotion ? 0 : pointerRef.current.y;
    g.rotation.y = s.rotY + px * 0.16;
    g.rotation.x = s.rotX + py * 0.12;

    blocks.current.forEach((b, i) => {
      if (!b) return;
      const c = CORNERS[i];
      const w = WOBBLE[i];
      const out = s.fragment * w.spread;
      b.position.set(
        c[0] * UNIT + c[0] * out,
        c[1] * UNIT + c[1] * out * 0.8,
        c[2] * UNIT + c[2] * out
      );
      // Misalignment reads as "not put together" far more than distance does.
      const tilt = s.fragment * w.spin * 0.5;
      b.rotation.set(tilt, tilt * 0.7, -tilt * 0.5);
    });

    // The mark resolves on the closed front face.
    markMat.opacity = s.mark;
    if (mark.current) mark.current.visible = s.mark > 0.01;

    // A very small camera push as the argument lands — motion belongs to the
    // cube, not the camera.
    camera.position.z = lerp(5.6, 5.0, Math.min(1, s.mark));
  });

  return (
    <group ref={group}>
      {CORNERS.map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            blocks.current[i] = el;
          }}
          geometry={geo}
          material={mat}
          castShadow={false}
          receiveShadow={false}
        />
      ))}

      {/* The red square — this project's recurring brand marker — appears on
          the front face only once the object is whole. */}
      <mesh ref={mark} position={[0, 0, UNIT * 2 + 0.006]} material={markMat}>
        <planeGeometry args={[0.42, 0.42]} />
      </mesh>
    </group>
  );
}

/** Lighting kept close to the studio's own so this reads as the same world
 *  the entrance left the visitor standing in. */
export function CubeLighting() {
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 6, 7]} intensity={1.1} color="#FFF6EC" />
      <directionalLight position={[-5, 2, -3]} intensity={0.3} color="#E8EEFA" />
    </>
  );
}
