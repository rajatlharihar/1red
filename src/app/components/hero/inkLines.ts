import * as THREE from 'three';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';

/* ─── Ink edges, shared by the hero and section 2 ──────────────────────────
 * Screen-space quads with a constant pixel width (WebGL ignores `linewidth`
 * on plain lines). They sit EXACTLY on the geometry's corners; fills are
 * pushed back in depth with polygonOffset instead of the lines being nudged
 * off their corners in world space.
 * ────────────────────────────────────────────────────────────────────────── */

export const INK = '#0A0A0A'; // brand ink (design-system.md)
export const LINE_PX = 1.2;
export const FILL_OFFSET = { polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 4 } as const;

/* A line on a corner shares depth with the faces meeting there and breaks
   into dashes where one of them is seen edge-on. Pulling each endpoint 0.4%
   of its distance toward the camera — along its own view ray, so its screen
   position is unchanged — wins that tie at every range without ever
   bringing a genuinely hidden edge through a surface. */
export function createInkLineMaterial(color = INK, width = LINE_PX) {
  const m = new LineMaterial({ color: new THREE.Color(color).getHex(), linewidth: width });
  m.toneMapped = false;
  m.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace(
      'vec4 end = modelViewMatrix * vec4( instanceEnd, 1.0 );',
      'vec4 end = modelViewMatrix * vec4( instanceEnd, 1.0 );\n\t\t\tstart.xyz *= 0.996;\n\t\t\tend.xyz *= 0.996;'
    );
  };
  return m;
}

export function inkEdges(geo: THREE.BufferGeometry, mat: LineMaterial, liftFloorTo?: number) {
  const edges = new THREE.EdgesGeometry(geo, 25);
  if (liftFloorTo !== undefined) {
    const pos = edges.attributes.position;
    for (let i = 0; i < pos.count; i++) if (Math.abs(pos.getY(i)) < 1e-4) pos.setY(i, liftFloorTo);
  }
  const lines = new LineSegments2(new LineSegmentsGeometry().fromEdgesGeometry(edges), mat);
  edges.dispose();
  return lines;
}
