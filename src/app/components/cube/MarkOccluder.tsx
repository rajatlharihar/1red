import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { buildLogoGeometry } from '../hero/logoGeometry';
import { createInkLineMaterial, inkEdges } from '../hero/inkLines';
import {
  sampleSequence,
  HERO_FOV,
  LOGO_DEPTH,
  LOGO_PIVOT,
  LOGO_SVG_URL,
  LOGO_Y,
  LOGO_Z,
  PANEL_TO,
} from '../hero/studioSequence';
import { FOV } from './CubeAssembly';

/* ─── The mark, as a hole in section 2 ─────────────────────────────────────
 * Section 2 is drawn on top of the hero. While the mark is still on screen
 * its blocks have to hide the tunnel, with their real outline: rounded
 * corners, every slot between the blocks, and the sides the zoom brings into
 * view. So this canvas draws the same extruded mark, at exactly the hero's
 * projection of it, writing depth only: the tunnel behind it is hidden, and
 * the hero's own red shows through the transparent pixels. Its ink edges
 * are redrawn here too, since the hero's lie half under this canvas.
 *
 * The hero's camera view of the mark is rebuilt from `sampleSequence`, then
 * placed in front of this canvas's camera. Both cameras look down −z, so a
 * point's image is the same in both when only its lateral coordinates are
 * scaled by the ratio of the two lenses' half-angle tangents; depth is kept,
 * so the sides project the same way too.
 * ─────────────────────────────────────────────────────────────────────────── */

const LENS = Math.tan((FOV / 2) * (Math.PI / 180)) / Math.tan((HERO_FOV / 2) * (Math.PI / 180));

// A camera, so lookAt aims −z the way the hero's camera does.
const _heroCam = new THREE.PerspectiveCamera();
const _view = new THREE.Matrix4();
const _mark = new THREE.Matrix4();
const _tmp = new THREE.Matrix4();
const _pivot = new THREE.Vector3();
const _lens = new THREE.Matrix4().makeScale(LENS, LENS, 1);

export function MarkOccluder({ heroPRef }: { heroPRef: React.MutableRefObject<number> }) {
  const group = useRef<THREE.Group>(null);
  const size = useThree((s) => s.size);
  const svg = useLoader(SVGLoader, LOGO_SVG_URL);
  const geo = useMemo(() => buildLogoGeometry(svg), [svg]);
  const depthOnly = useMemo(() => new THREE.MeshBasicMaterial({ colorWrite: false }), []);
  const lineMat = useMemo(() => createInkLineMaterial(), []);
  const lines = useMemo(() => inkEdges(geo, lineMat), [geo, lineMat]);
  useEffect(() => {
    lineMat.resolution.set(size.width, size.height);
  }, [lineMat, size]);
  useEffect(
    () => () => {
      geo.dispose();
      depthOnly.dispose();
      lineMat.dispose();
      lines.geometry.dispose();
    },
    [geo, depthOnly, lineMat, lines]
  );

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const p = heroPRef.current;
    // With the rest of the section: from the frame going white behind the
    // mark until the zoom has passed the frame through the gap.
    g.visible = p >= PANEL_TO && p < 0.995;
    if (!g.visible) return;
    const s = sampleSequence(p);

    _heroCam.position.set(s.camX, s.camY, s.camZ);
    _heroCam.lookAt(s.lookX, s.lookY, s.lookZ);
    _heroCam.rotateZ(s.camRoll);
    _heroCam.updateMatrixWorld(true);
    _view.copy(_heroCam.matrixWorld).invert();

    /* The mark's own transform, as the hero builds it: scaled about the gap
       in the "e" on its front face, depth growing at 1% of the width. */
    _pivot.set(LOGO_PIVOT.x, LOGO_Y + LOGO_PIVOT.y, LOGO_Z + LOGO_DEPTH / 2);
    const z = s.logoZoom;
    _mark.makeTranslation(_pivot.x, _pivot.y, _pivot.z);
    _mark.multiply(_tmp.makeScale(z, z, 1 + (z - 1) * 0.01));
    _mark.multiply(_tmp.makeTranslation(-LOGO_PIVOT.x, -LOGO_PIVOT.y, -LOGO_DEPTH / 2));
    _mark.multiply(_tmp.makeRotationY(s.logoSpin));

    const cam = state.camera;
    g.matrix
      .makeTranslation(cam.position.x, cam.position.y, cam.position.z)
      .multiply(_lens)
      .multiply(_view)
      .multiply(_mark);
    g.matrixWorldNeedsUpdate = true;
  });

  return (
    <group ref={group} matrixAutoUpdate={false}>
      <mesh geometry={geo} material={depthOnly} renderOrder={-10} frustumCulled={false} />
      <primitive object={lines} renderOrder={-9} frustumCulled={false} />
    </group>
  );
}
