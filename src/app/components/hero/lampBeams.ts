import * as THREE from 'three';

/* ─── Lamp beams ───────────────────────────────────────────────────────────
 * UNDO SWITCH: set LAMP_BEAMS to false to remove every beam. Nothing else
 * depends on them. To remove them for good, delete this file and the lines
 * marked `beams` in StudioEnvironment.tsx.
 *
 * Each beam is an open cone from the lamp's emitting face along its forward
 * direction, parented to the head so it swings as the lamp turns. Additive,
 * no depth write, fading along its length and toward its silhouette edges so
 * it reads as light in air rather than as a solid cone. Strongest in the dark
 * room; it fades out as the lights come up (it would vanish on white anyway).
 * ────────────────────────────────────────────────────────────────────────── */
export const LAMP_BEAMS = false;

const BEAM_VERT = `
  varying float vAlong;
  varying float vEdge;
  void main() {
    vAlong = uv.y;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vec3 n = normalize(normalMatrix * normal);
    vEdge = abs(dot(n, normalize(-mv.xyz)));
    gl_Position = projectionMatrix * mv;
  }
`;
const BEAM_FRAG = `
  uniform vec3 uColor;
  uniform float uStrength;
  varying float vAlong;
  varying float vEdge;
  void main() {
    // uv.y is 1 at the lamp, 0 at the far end.
    float along = pow(vAlong, 1.6);
    float edge = pow(vEdge, 2.6); // soft rim, so the cone's mouth never reads as a ring
    gl_FragColor = vec4(uColor * along * edge * uStrength, 1.0);
  }
`;

/** Peak beam strength for spots, and for the much larger softbox cones. */
export const BEAM_STRENGTH = { spot: 0.28, softbox: 0.09 };

export function createBeamMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color('#FFF6E6') }, uStrength: { value: BEAM_STRENGTH.spot } },
    vertexShader: BEAM_VERT,
    fragmentShader: BEAM_FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
}

const _dir = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _m = new THREE.Matrix4();
const DOWN = new THREE.Vector3(0, -1, 0);

/**
 * A beam for one lamp head, in world terms, returned already expressed in the
 * head's local space so it can simply be added as a child.
 * @param face    world position of the emitting face's centre
 * @param forward world direction the lamp points
 * @param faceRadius radius of the emitting face (m)
 */
export function createBeam(
  head: THREE.Object3D,
  face: THREE.Vector3,
  forward: THREE.Vector3,
  faceRadius: number,
  material: THREE.Material
) {
  const length = 3.2;
  const spread = Math.tan(THREE.MathUtils.degToRad(faceRadius > 0.2 ? 14 : 18));
  const geo = new THREE.CylinderGeometry(faceRadius, faceRadius + length * spread, length, 24, 1, true);
  // Top of the cylinder at the origin, extending down -Y.
  geo.translate(0, -length / 2, 0);
  const beam = new THREE.Mesh(geo, material);
  beam.frustumCulled = false;
  beam.renderOrder = 10;

  _q.setFromUnitVectors(DOWN, _dir.copy(forward).normalize());
  _m.compose(face, _q, new THREE.Vector3(1, 1, 1));
  head.updateWorldMatrix(true, false);
  _m.premultiply(new THREE.Matrix4().copy(head.matrixWorld).invert());
  _m.decompose(beam.position, beam.quaternion, beam.scale);
  beam.userData.beam = true;
  return beam;
}
