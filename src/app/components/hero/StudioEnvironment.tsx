import { useEffect, useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import studioUrl from '../../../../Studio.glb?url';
import { MODEL_ROT_Y, MODEL_FLOOR_LIFT } from './studioSequence';

/* ─── Studio.glb — the actual 1Red studio interior ─────────────────────────
 * Loaded from the file at the project root exactly where it was imported.
 * It is referenced through Vite's `?url` asset import rather than being
 * copied into public/, so the original file is never moved or duplicated;
 * Vite emits it as a hashed asset at build time and serves it directly in
 * dev. At 18 MB it is fetched lazily behind Suspense — it must never block
 * first paint.
 *
 * WHAT THE FILE CONTAINS (parsed from the binary, not assumed):
 *   806 nodes · 458 meshes · ~536k triangles · 20 materials
 *   7 textures, all embedded — no external dependencies to resolve
 *   no cameras, no lights, no animations
 *
 * Because it ships no lights of its own, the scene lights it (see
 * StudioScene). Its materials are left completely untouched — the Blender
 * PBR setup is the look that was supplied, and replacing it would make the
 * asset unrecognisable.
 * ────────────────────────────────────────────────────────────────────────── */

export function StudioEnvironment({ onReady }: { onReady?: () => void }) {
  const gltf = useLoader(GLTFLoader, studioUrl);

  // Suspense resolves only once the whole 18 MB is parsed, so this fires
  // exactly when the room is genuinely on screen — used to hold back the
  // "scroll to enter" affordance rather than let someone open the doors
  // onto an empty space.
  useEffect(() => {
    onReady?.();
  }, [onReady]);

  const scene = useMemo(() => {
    const s = gltf.scene;
    s.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      // No shadow casting: 458 meshes through a shadow map would cost far
      // more than it returns here, and the room is lit softly anyway.
      m.castShadow = false;
      m.receiveShadow = false;
      // Frustum culling left ON (three's default) so the ~458 draw calls
      // drop sharply once the camera is inside facing one direction.
      m.frustumCulled = true;
    });
    return s;
  }, [gltf]);

  // Release GPU memory when the entrance unmounts — an 18 MB model's
  // geometries and textures are not reclaimed automatically on route change.
  useEffect(() => {
    return () => {
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (!m.isMesh) return;
        m.geometry?.dispose();
        const mat = m.material as THREE.Material | THREE.Material[];
        const list = Array.isArray(mat) ? mat : [mat];
        list.forEach((mm) => {
          if (!mm) return;
          Object.values(mm as unknown as Record<string, unknown>).forEach((v) => {
            if (v && (v as THREE.Texture).isTexture) (v as THREE.Texture).dispose();
          });
          mm.dispose();
        });
      });
    };
  }, [scene]);

  return <primitive object={scene} rotation={[0, MODEL_ROT_Y, 0]} position={[0, MODEL_FLOOR_LIFT, 0]} />;
}
