import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import type { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import studioUrl from '../../../../Studio.glb?url';
import { MODEL_ROT_Y, MODEL_FLOOR_LIFT, MODEL_SCALE } from './studioSequence';
import { LAMP_BEAMS, BEAM_STRENGTH, createBeam, createBeamMaterial } from './lampBeams'; // beams

/* ─── Studio.glb — the 1Red studio interior ────────────────────────────────
 * Rebuilt from Studio.glb.orig-backup with @gltf-transform: every part's
 * geometry is baked into its nearest controllable rig — each tripod, and
 * each lamp head ("Handle") on the tripods and ceiling rails — then joined
 * within that rig, so a lamp head is one mesh with its pivot at its mount.
 * Textures are dropped and the supplied PBR materials collapsed to three
 * roles, named `paper` (backdrop), `floor`, `glow` (the emitters: softbox
 * diffusers, spot emitters, lens glass) and `ink` (everything else);
 * the scene swaps those for its own pencil materials by name.
 * Simplified with meshopt (ratio 0.2, error 0.002: 536k to 140k triangles) and
 * meshopt-compressed (needs the decoder below). Recipe: scripts/rebuild-studio-glb.mjs.
 * ────────────────────────────────────────────────────────────────────────── */

export interface RoomMaterials {
  paper: THREE.Material;
  floor: THREE.Material;
  ink: THREE.Material;
  /** Where the lamps give out light. */
  glow: THREE.Material;
  /** Pencil outline drawn on every lamp and stand, so they read in the dark. */
  sketch: LineMaterial;
}

/** Where the lamps end up aimed: the mark, in world space. Before that they
 *  track the live camera. */
export interface AimTargets {
  mark: THREE.Vector3;
}

const LAMP_HEAD = /Handle_\d+$/;

/* Silhouette outline: a back-face shell pushed out along the normals by a
   constant number of screen pixels. Edge lines only catch hard corners, so
   round things (poles, umbrellas, lamp barrels) had no outline at all; the
   shell draws every silhouette, from any angle, as the lamps turn. */
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
const RIG = /(Tripod|Handle)_\d+$/;

interface Lamp {
  obj: THREE.Object3D;
  rest: THREE.Quaternion;
  parentWorld: THREE.Quaternion;
  parentWorldInv: THREE.Quaternion;
  pivot: THREE.Vector3;
  /** World direction the head points in its supplied pose. */
  forward: THREE.Vector3;
  /** Rotation that aims `forward` at the mark. */
  toMark: THREE.Quaternion;
}

/** How far from "at the camera" toward "at the mark" the lamps rest before
 *  they turn: aimed mostly at you, a little into the room. */
const REST_BIAS = 0.3;

const _qCam = new THREE.Quaternion();
const _q = new THREE.Quaternion();
const _dir = new THREE.Vector3();
const _box = new THREE.Box3();
const _v = new THREE.Vector3();

export function StudioEnvironment({
  mats,
  aim,
  turnRef,
  lightsRef,
  onReady,
}: {
  mats: RoomMaterials;
  aim: AimTargets;
  /** 0 = heads aim at the camera, 1 = heads aim at the mark. */
  turnRef: React.MutableRefObject<number>;
  /** 0 = dark room, 1 = lights on. */
  lightsRef: React.MutableRefObject<number>;
  onReady?: () => void;
}) {
  const size = useThree((s) => s.size);
  const camera = useThree((s) => s.camera);
  const hull = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uColor: { value: new THREE.Color() }, uWidth: { value: 0.9 }, uResY: { value: 800 } },
        vertexShader: HULL_VERT,
        fragmentShader: HULL_FRAG,
        side: THREE.BackSide,
      }),
    []
  );
  useEffect(() => {
    hull.uniforms.uResY.value = size.height;
  }, [hull, size]);
  useEffect(() => () => hull.dispose(), [hull]);
  const beamMat = useMemo(() => (LAMP_BEAMS ? createBeamMaterial() : null), []); // beams
  const beamMatSoft = useMemo(() => (LAMP_BEAMS ? createBeamMaterial() : null), []); // beams
  useEffect(() => () => {
    beamMat?.dispose();
    beamMatSoft?.dispose();
  }, [beamMat, beamMatSoft]); // beams

  const gltf = useLoader(GLTFLoader, studioUrl, (loader) => {
    loader.setMeshoptDecoder(MeshoptDecoder);
  });

  useEffect(() => {
    onReady?.();
  }, [onReady]);

  const scene = useMemo(() => {
    const s = gltf.scene;
    /* Cut the fallen stand (Tripod_6): a light lying knocked over on the
       floor, not part of the shot Rajat wants. */
    const fallen = s.getObjectByName('Studio_Setup_Tripod_6');
    fallen?.parent?.remove(fallen);
    s.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      const name = (m.material as THREE.Material).name;
      (m.material as THREE.Material).dispose();
      m.material =
        name === 'paper' ? mats.paper : name === 'floor' ? mats.floor : name === 'glow' ? mats.glow : mats.ink;
    });
    /* Sketch the lamps and stands: their real edges as pencil lines, parented
       to each mesh so they swing with the heads. Collected first — adding
       children mid-traverse would walk the new lines too. */
    const kit: THREE.Mesh[] = [];
    s.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      let p: THREE.Object3D | null = m;
      while (p && !RIG.test(p.name)) p = p.parent;
      if (p) kit.push(m);
    });
    for (const m of kit) {
      // Only strong creases: the silhouette shell below draws every outline, and
      // a low threshold on this ~300k-triangle kit produced so many line
      // segments that loading froze for ~11 s and scrolling stalled.
      const edges = new THREE.EdgesGeometry(m.geometry, 60);
      const lines = new LineSegments2(new LineSegmentsGeometry().fromEdgesGeometry(edges), mats.sketch);
      edges.dispose();
      m.add(lines);
      if (!m.geometry.attributes.normal) m.geometry.computeVertexNormals();
      const shell = new THREE.Mesh(m.geometry, hull);
      shell.userData.shell = true;
      m.add(shell);
    }
    return s;
  }, [gltf, mats, hull]);

  const root = useRef<THREE.Group>(null);
  const lamps = useRef<Lamp[] | null>(null);

  useFrame(() => {
    if (!root.current) return;
    if (!lamps.current) {
      /* Resolved once the model is placed, so world positions are real. A
         head's forward is the way from its mount to its emitting face (the
         `glow` surfaces); heads with no emitter use the centre of their own
         body, which for a spot on a yoke is the barrel. Heads lying on the
         floor (the fallen stand) are left alone. */
      root.current.updateMatrixWorld(true);
      const list: Lamp[] = [];
      scene.traverse((o) => {
        if (!LAMP_HEAD.test(o.name) || !o.parent) return;
        const pivot = o.getWorldPosition(new THREE.Vector3());
        if (pivot.y < 0.4) return;
        const glowBox = new THREE.Box3();
        const bodyBox = new THREE.Box3();
        o.traverse((k) => {
          const m = k as THREE.Mesh;
          if (!m.isMesh || m.userData.shell) return;
          m.geometry.computeBoundingBox();
          _box.copy(m.geometry.boundingBox!).applyMatrix4(m.matrixWorld);
          (m.material === mats.glow ? glowBox : bodyBox).union(_box);
        });
        const faceBox = glowBox.isEmpty() ? bodyBox : glowBox;
        const face = faceBox.getCenter(new THREE.Vector3());
        const forward = face.clone().sub(pivot);
        if (forward.lengthSq() < 1e-6) return;
        forward.normalize();
        // beams: a softbox's diffuser is its face; a bare spot's face is the
        // front of its barrel, ahead of the body centre.
        if (beamMat && beamMatSoft) {
          const ext = faceBox.getSize(new THREE.Vector3());
          const radius = glowBox.isEmpty() ? 0.07 : Math.max(0.05, Math.max(ext.x, ext.y, ext.z) / 2);
          if (glowBox.isEmpty()) face.addScaledVector(forward, Math.max(ext.x, ext.y, ext.z) * 0.35);
          o.add(createBeam(o, face, forward, radius, glowBox.isEmpty() ? beamMat : beamMatSoft));
        }
        const toMark = new THREE.Quaternion().setFromUnitVectors(forward, _dir.copy(aim.mark).sub(pivot).normalize());
        const parentWorld = o.parent.getWorldQuaternion(new THREE.Quaternion());
        list.push({ obj: o, rest: o.quaternion.clone(), parentWorld, parentWorldInv: parentWorld.clone().invert(), pivot, forward, toMark });
      });
      lamps.current = list;
    }
    hull.uniforms.uColor.value.copy(mats.sketch.color);
    if (beamMat && beamMatSoft) {
      // beams: gone well before the room is white, so they never haze the mark.
      const fade = Math.pow(1 - lightsRef.current, 3);
      beamMat.uniforms.uStrength.value = BEAM_STRENGTH.spot * fade;
      beamMatSoft.uniforms.uStrength.value = BEAM_STRENGTH.softbox * fade;
    }
    const turn = turnRef.current;
    for (const l of lamps.current) {
      // Aimed at the camera wherever it is, then swung round onto the mark.
      _qCam.setFromUnitVectors(l.forward, _v.copy(camera.position).sub(l.pivot).normalize());
      _q.slerpQuaternions(_qCam, l.toMark, REST_BIAS + (1 - REST_BIAS) * turn);
      // A world-space rotation, carried into the head's own (Z-up, FBX) frame.
      l.obj.quaternion.copy(l.parentWorldInv).multiply(_q).multiply(l.parentWorld).multiply(l.rest);
    }
  });

  useEffect(() => {
    return () => {
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if ((m.isMesh && !o.userData.shell) || (o as LineSegments2).isLineSegments2 || o.userData.beam) m.geometry?.dispose();
      });
    };
  }, [scene]);

  return (
    <group ref={root}>
      <primitive
        object={scene}
        rotation={[0, MODEL_ROT_Y, 0]}
        position={[0, MODEL_FLOOR_LIFT, 0]}
        scale={MODEL_SCALE}
      />
    </group>
  );
}
