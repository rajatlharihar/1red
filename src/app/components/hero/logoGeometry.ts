import * as THREE from 'three';
import { SVGLoader, type SVGResult } from 'three/examples/jsm/loaders/SVGLoader.js';
import { LOGO_DEPTH, LOGO_K, LOGO_SVG_BOX } from './studioSequence';

/* The mark in 3D, extruded from the real brand vector (see studioSequence).
   Each SVG path is turned into shapes whole: createShapes resolves a path's
   own subpaths into outlines and holes together, so the counters stay holes
   and nothing is split apart. Flipped to y-up (with z, so the winding stays
   outward) and centred on the mark's own bounds. Shared by the hero, which
   draws it, and section 2, which uses the same geometry as a depth-only
   occluder so the mark hides the tunnel with its true outline. */
export function buildLogoGeometry(svg: SVGResult) {
  const shapes = svg.paths.flatMap((path) => SVGLoader.createShapes(path));
  const depth = LOGO_DEPTH / LOGO_K;
  const geo = new THREE.ExtrudeGeometry(shapes, { depth, bevelEnabled: false, curveSegments: 10 });
  geo.translate(-(LOGO_SVG_BOX.x0 + LOGO_SVG_BOX.x1) / 2, -(LOGO_SVG_BOX.y0 + LOGO_SVG_BOX.y1) / 2, -depth / 2);
  geo.scale(LOGO_K, -LOGO_K, -LOGO_K);
  return geo;
}
