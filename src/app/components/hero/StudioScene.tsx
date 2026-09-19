import { Suspense, useEffect, useMemo, useRef } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { createHatchTexture } from './surfaceTextures';
import { StudioEnvironment, type RoomMaterials } from './StudioEnvironment';
import { INK, FILL_OFFSET, createInkLineMaterial, inkEdges } from './inkLines';
import { buildLogoGeometry } from './logoGeometry';
import {
  sampleSequence,
  lerp,
  RESTING_STATE,
  DOOR_APEX_Y,
  DOOR_BASE_W,
  DOOR_HEADER_Y,
  DOOR_SECTION_FOOT,
  DOOR_SECTION_TOPS,
  FACADE_H,
  FACADE_W,
  FACADE_Z,
  LOGO_DEPTH,
  LOGO_PIVOT,
  LOGO_SVG_URL,
  LOGO_Y,
  LOGO_Z,
  PANEL_SIDE,
  PANEL_SCALE0,
  PANEL_SCALE,
  PANEL_TILT0,
  PANEL_TILT,
} from './studioSequence';

/* ─── The entrance to Studio.glb ───────────────────────────────────────────
 * The supplied model IS the studio. Everything built here is only what the
 * threshold needs in order to exist: a facade with a doorway cut into it,
 * the door in that doorway, and ground under the approach — because the
 * model's own floor stops at z = 6.59 and the camera starts well beyond it.
 * ────────────────────────────────────────────────────────────────────────── */

const RED = '#FF0000'; // full-intensity red; room and mark skip tone mapping

/* ── Cream and line art ───────────────────────────────────────────────────
 * Flat paper-coloured planes; ink edges where two surfaces meet do the
 * describing. The lines are the edges of the real geometry, so they move,
 * foreshorten and cross correctly as the camera travels. */
const CREAM = '#E7E1CE';
const CREAM_DOOR = '#E2DCC7';

const FACADE_COL = CREAM;
const VOID_COL = '#EDE8D9';

/* The room behind the door. Pitch dark until the lights slam on, then the
   cream goes all the way to white; ink stays ink. */
const ROOM_LIT = '#FFFFFF';
/* Every black that sits on the floor plane or frames the door is the SAME
   brand ink, un-tone-mapped: tone mapping crushed some surfaces to pure black
   and left others a warm charcoal, so blacks meeting at a seam never matched. */
const ROOM_DARK = { paper: '#161513', floor: INK, backing: '#0E0D0C' };
const LOGO_SIDE = '#C40000';
const LOGO_DARK = '#140504';
const SKETCH_DARK = '#CFC7B0';


const FACADE_T = 1.8;

const REVEAL_FRONT = '#0A0A0A';
const REVEAL_BACK = '#0A0A0A';

const WALL_TAPER_BOTTOM = 0.7;
const WALL_TAPER_TOP = 1.55;


/** The ground plane sits this far above y = 0 (see the ground mesh), so the
 *  wall/floor seam line is drawn just above it rather than buried under it. */
const GROUND_Y = 0.006;
const SEAM_Y = 0.014;

/* ── The door, in door-local depth (0 = centre of the wall) ──────────────
 * Back to front, all inside the wall's own thickness (≥ 0.63 either side):
 *   sections  −0.15 … 0.15   roll back into the room, so never come forward
 *   transom    0.25 … 0.45   fixed, above the header; sections pass behind it
 *   frame      0.23 … 0.47   jambs, sill, header — ink, never moves  */
const SECTION_T = 0.3;
const TRANSOM_Z = 0.33;
const TRANSOM_T = 0.16;
const FRAME_Z = 0.36;
const FRAME_D = 0.16;
const JAMB_W = 0.12; // half of it shows inside the opening
const HEADER_H = 0.14;
const SILL_H = 0.12;
const RAIL_H = 0.12;
/** Panels and transom run this far past the opening's edge on each side, so
 *  their ends are always buried in the wall. */
const OVERSIZE = 0.34;

/** World-space clip at the header beam's lower edge: door panels (and their
 *  rails and outlines) vanish as they rise past it. The door group sits at
 *  y = 0, so door-local heights are world heights. */
const HEADER_CLIP = new THREE.Plane(new THREE.Vector3(0, -1, 0), DOOR_HEADER_Y - HEADER_H / 2);

/** Half-width of the opening at height y. */
function openingHalfW(y: number) {
  return (DOOR_BASE_W / 2) * (1 - y / DOOR_APEX_Y);
}

const SECTIONS = DOOR_SECTION_TOPS.map((top, i) => {
  const bottom = i === 0 ? DOOR_SECTION_FOOT : DOOR_SECTION_TOPS[i - 1];
  return { bottom, top, h: top - bottom };
});



function trapezoid(yb: number, yt: number, hwb: number, hwt: number, depth: number, z: number) {
  const s = new THREE.Shape();
  s.moveTo(-hwb, yb);
  s.lineTo(hwb, yb);
  s.lineTo(hwt, yt);
  s.lineTo(-hwt, yt);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false });
  g.translate(0, 0, z - depth / 2);
  return g;
}


export function StudioScene({
  progressRef,
  invalidateRef,
  reduceMotion,
  simplified,
  onReady,
}: {
  progressRef: React.MutableRefObject<number>;
  invalidateRef: React.MutableRefObject<(() => void) | null>;
  reduceMotion: boolean;
  simplified: boolean;
  onReady?: () => void;
}) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    gl.localClippingEnabled = true;
  }, [gl]);
  useEffect(() => {
    invalidateRef.current = invalidate;
    return () => {
      invalidateRef.current = null;
    };
  }, [invalidate, invalidateRef]);

  const sectionRefs = useRef<Array<THREE.Group | null>>([]);
  const logoZoom = useRef<THREE.Group>(null);
  const panelRef = useRef<THREE.Group>(null);
  const logoSpin = useRef<THREE.Group>(null);

  const hatch = useMemo(() => {
    const t = createHatchTexture();
    t.repeat.set(1 / 2.4, 1 / 2.4);
    return t;
  }, []);
  // The backdrop's UVs span 0–1 across the whole cyclorama, not metres, so
  // it needs its own tiling to land at the same stroke size as the wall.
  const roomHatch = useMemo(() => {
    const t = createHatchTexture();
    t.repeat.set(2.2, 2.2);
    return t;
  }, []);
  useEffect(
    () => () => {
      hatch.dispose();
      roomHatch.dispose();
    },
    [hatch, roomHatch]
  );

  const mats = useMemo(
    () => ({
      facade: new THREE.MeshBasicMaterial({ color: FACADE_COL, map: hatch, ...FILL_OFFSET }),
      reveal: new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false, ...FILL_OFFSET }),
      // Same black as the dark room floor, so outside and inside read as one
      // surface. No polygonOffset: it must win over the model's floor beneath it.
      ground: new THREE.MeshBasicMaterial({ color: ROOM_DARK.floor, toneMapped: false }),
      transom: new THREE.MeshBasicMaterial({ color: CREAM_DOOR, ...FILL_OFFSET }),
      sections: SECTIONS.map(
        () => new THREE.MeshBasicMaterial({ color: CREAM_DOOR, clippingPlanes: [HEADER_CLIP], ...FILL_OFFSET })
      ),
      // The door panels' own rails and outlines, clipped at the header like the panels.
      railInk: new THREE.MeshBasicMaterial({ color: INK, toneMapped: false, clippingPlanes: [HEADER_CLIP] }),
      sectionLine: (() => {
        const m = createInkLineMaterial();
        m.clippingPlanes = [HEADER_CLIP];
        return m;
      })(),
      ink: new THREE.MeshBasicMaterial({ color: INK, toneMapped: false }),
      // Room and mark skip tone mapping: lit white must be true white, and the
      // mark true brand red, not the renderer's filmic roll-off of them.
      roomPaper: new THREE.MeshBasicMaterial({ color: ROOM_DARK.paper, map: roomHatch, toneMapped: false }),
      roomFloor: new THREE.MeshBasicMaterial({ color: ROOM_DARK.floor, toneMapped: false }),
      roomBacking: new THREE.MeshBasicMaterial({ color: ROOM_DARK.backing, toneMapped: false }),
      logoFace: new THREE.MeshBasicMaterial({ color: LOGO_DARK, toneMapped: false }),
      logoSide: new THREE.MeshBasicMaterial({ color: LOGO_DARK, toneMapped: false }),
      line: createInkLineMaterial(),
      // The rhombus that booms out behind the mark, and its ink edge. Both
      // skip the depth test so they cover whatever stands in front of the
      // cyclorama; the mark is drawn after them (`renderOrder`).
      panel: new THREE.MeshBasicMaterial({ color: ROOM_LIT, toneMapped: false, depthTest: false, depthWrite: false }),
      panelLine: (() => {
        const m = createInkLineMaterial(RED, 0.7);
        m.depthTest = false;
        m.depthWrite = false;
        m.transparent = true;
        return m;
      })(),
      // Pencil outlines on the lamps: cream strokes in the dark room, ink once lit.
      sketch: createInkLineMaterial(SKETCH_DARK, 0.9),
      // The lamps' emitting faces: full white from the start, dark room or lit.
      glow: new THREE.MeshBasicMaterial({ color: '#FFFFFF', toneMapped: false }),
    }),
    [hatch, roomHatch]
  );
  const roomMats = useMemo<RoomMaterials>(
    () => ({ paper: mats.roomPaper, floor: mats.roomFloor, ink: mats.ink, glow: mats.glow, sketch: mats.sketch }),
    [mats]
  );
  const palette = useMemo(
    () => ({
      lit: new THREE.Color(ROOM_LIT),
      paper: new THREE.Color(ROOM_DARK.paper),
      floor: new THREE.Color(ROOM_DARK.floor),
      backing: new THREE.Color(ROOM_DARK.backing),
      logoDark: new THREE.Color(LOGO_DARK),
      logoFace: new THREE.Color(RED),
      logoSide: new THREE.Color(LOGO_SIDE),
      sketchDark: new THREE.Color(SKETCH_DARK),
      ink: new THREE.Color(INK),
    }),
    []
  );

  const svg = useLoader(SVGLoader, LOGO_SVG_URL);
  const logo = useMemo(() => {
    const geo = buildLogoGeometry(svg);
    return { geo, lines: inkEdges(geo, mats.line) };
  }, [svg, mats]);
  useEffect(() => {
    mats.line.resolution.set(size.width, size.height);
    mats.panelLine.resolution.set(size.width, size.height);
    mats.sketch.resolution.set(size.width, size.height);
    mats.sectionLine.resolution.set(size.width, size.height);
  }, [mats, size]);

  /* The facade: one traced outline with the triangular notch, extruded, then
     shaded by depth (reveal gradient) and tapered by height — colours are
     read before the taper so the gradient isn't squeezed with it. */
  const facadeGeo = useMemo(() => {
    const hw = FACADE_W / 2;
    const hb = DOOR_BASE_W / 2;
    const s = new THREE.Shape();
    s.moveTo(-hw, 0);
    s.lineTo(-hb, 0);
    s.lineTo(0, DOOR_APEX_Y);
    s.lineTo(hb, 0);
    s.lineTo(hw, 0);
    s.lineTo(hw, FACADE_H);
    s.lineTo(-hw, FACADE_H);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: FACADE_T, bevelEnabled: false });
    g.translate(0, 0, -FACADE_T / 2);

    const pos = g.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const back = new THREE.Color(REVEAL_BACK);
    const front = new THREE.Color(REVEAL_FRONT);
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const d = (pos.getZ(i) + FACADE_T / 2) / FACADE_T;
      c.copy(back).lerp(front, d < 0 ? 0 : d > 1 ? 1 : d);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      const h0 = pos.getY(i) / FACADE_H;
      const h = h0 < 0 ? 0 : h0 > 1 ? 1 : h0;
      pos.setZ(i, pos.getZ(i) * (WALL_TAPER_BOTTOM + (WALL_TAPER_TOP - WALL_TAPER_BOTTOM) * h));
    }
    pos.needsUpdate = true;
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return g;
  }, []);
  const facadeLines = useMemo(() => inkEdges(facadeGeo, mats.line, SEAM_Y), [facadeGeo, mats]);

  /* Each section is cut to the opening's width at its own closed height (plus
     the buried overlap), built with its hinge — its bottom edge — at the
     local origin so the track can place and tip it. */
  const sectionParts = useMemo(
    () =>
      SECTIONS.map(({ bottom, top, h }) => {
        const geo = trapezoid(
          0,
          h,
          openingHalfW(bottom) + OVERSIZE,
          openingHalfW(top) + OVERSIZE,
          SECTION_T,
          0
        );
        return { geo, lines: inkEdges(geo, mats.sectionLine), railW: openingHalfW(top) * 2 + 0.2 };
      }),
    [mats]
  );

  const transomGeo = useMemo(() => {
    const yb = DOOR_HEADER_Y - HEADER_H / 2;
    const s = new THREE.Shape();
    s.moveTo(-(openingHalfW(yb) + OVERSIZE), yb);
    s.lineTo(openingHalfW(yb) + OVERSIZE, yb);
    s.lineTo(0, DOOR_APEX_Y + OVERSIZE * 2);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: TRANSOM_T, bevelEnabled: false });
    g.translate(0, 0, TRANSOM_Z - TRANSOM_T / 2);
    return g;
  }, []);
  const transomLines = useMemo(() => inkEdges(transomGeo, mats.line), [transomGeo, mats]);

  const panelGeo = useMemo(() => new THREE.PlaneGeometry(PANEL_SIDE, PANEL_SIDE), []);
  const panelLines = useMemo(() => inkEdges(panelGeo, mats.panelLine), [panelGeo, mats]);
  useEffect(
    () => () => {
      panelGeo.dispose();
      panelLines.geometry.dispose();
    },
    [panelGeo, panelLines]
  );

  /* The jambs run along each slope of the opening, centred on its edge so
     half their width shows inside the hole and half is buried in the wall. */
  const jamb = useMemo(() => {
    const hwFoot = openingHalfW(DOOR_SECTION_FOOT);
    const rise = DOOR_APEX_Y - DOOR_SECTION_FOOT;
    return {
      len: Math.hypot(hwFoot, rise),
      angle: Math.atan2(hwFoot, rise),
      x: hwFoot / 2,
      y: (DOOR_APEX_Y + DOOR_SECTION_FOOT) / 2,
    };
  }, []);

  useEffect(() => {
    return () => {
      facadeGeo.dispose();
      transomGeo.dispose();
      facadeLines.geometry.dispose();
      transomLines.geometry.dispose();
      sectionParts.forEach((p) => {
        p.geo.dispose();
        p.lines.geometry.dispose();
      });
      logo.geo.dispose();
      logo.lines.geometry.dispose();
    };
  }, [facadeGeo, transomGeo, facadeLines, transomLines, sectionParts, logo]);


  const lampTurn = useRef(0);
  const lightsLevel = useRef(0);
  const aim = useMemo(
    () => ({ mark: new THREE.Vector3(0, LOGO_Y, LOGO_Z) }),
    []
  );

  useFrame(() => {
    // Progress is already glided (scrollGlide), which also requests each frame.
    const s = reduceMotion ? RESTING_STATE : sampleSequence(progressRef.current);

    camera.position.set(s.camX, s.camY, s.camZ);
    camera.lookAt(s.lookX, s.lookY, s.lookZ);
    camera.rotateZ(s.camRoll);

    // The garage door: all panels rise together and vanish into the header.
    for (let i = 0; i < SECTIONS.length; i++) {
      const g = sectionRefs.current[i];
      if (g) g.position.y = SECTIONS[i].bottom + s.doorOffset;
    }

    lampTurn.current = s.lampTurn;
    lightsLevel.current = s.lights;
    const L = s.lights;
    mats.roomPaper.color.copy(palette.paper).lerp(palette.lit, L);
    mats.roomFloor.color.copy(palette.floor).lerp(palette.lit, L);
    mats.roomBacking.color.copy(palette.backing).lerp(palette.lit, L);
    mats.logoFace.color.copy(palette.logoDark).lerp(palette.logoFace, L);
    mats.logoSide.color.copy(palette.logoDark).lerp(palette.logoSide, L);
    mats.sketch.color.copy(palette.sketchDark).lerp(palette.ink, L);

    /* The boom: a small white rhombus behind the mark scales up as it turns
       until nothing of the studio is left. Drawn without depth so it passes
       over the floor, stands and lamps in front of it; the mark is drawn
       after it, so it stays on top. */
    if (panelRef.current) {
      const g = s.panel;
      panelRef.current.visible = g > 0;
      const k = lerp(PANEL_SCALE0, PANEL_SCALE, g);
      panelRef.current.scale.set(k, k, 1);
      panelRef.current.rotation.z = lerp(PANEL_TILT0, PANEL_TILT, g);
      mats.panelLine.opacity = Math.min(1, g * 4);
    }

    /* One turn, then scale through the counter of the "r". The zoom group's
       origin IS that hole on the mark's front face, so the face never moves
       toward the camera — the hole just opens around the lens. Depth grows
       far slower than width: enough to read as a short red tunnel. */
    if (logoSpin.current) logoSpin.current.rotation.y = s.logoSpin;
    if (logoZoom.current) {
      const z = s.logoZoom;
      logoZoom.current.scale.set(z, z, 1 + (z - 1) * 0.01);
    }

  });

  return (
    <>
      <color attach="background" args={[VOID_COL]} />
      <fog attach="fog" args={[VOID_COL, 26, 95]} />

      <Suspense fallback={null}>
        <StudioEnvironment mats={roomMats} aim={aim} turnRef={lampTurn} lightsRef={lightsLevel} onReady={onReady} />
      </Suspense>

      {/* Depth behind the room, so the space above the studio's ceiling
          reads as depth rather than as a hole. */}
      <mesh position={[0, 10, -6]} material={mats.roomBacking}>
        <planeGeometry args={[80, 40]} />
      </mesh>

      {/* Approach ground. The 6 mm clearance above the model's floor must not
          be shaved: closer, the two overlapping floors z-fight and cost ~20
          dropped frames per 3 s of scrolling. */}
      <mesh position={[0, GROUND_Y, FACADE_Z + 60]} rotation={[-Math.PI / 2, 0, 0]} material={mats.ground}>
        <planeGeometry args={[200, 120]} />
      </mesh>

      <group position={[0, 0, FACADE_Z]}>
        <mesh geometry={facadeGeo} material={[mats.facade, mats.reveal]} />
        <primitive object={facadeLines} />
      </group>

      <group position={[0, 0, FACADE_Z]}>
        {sectionParts.map((part, i) => (
          <group
            key={i}
            ref={(el) => {
              sectionRefs.current[i] = el;
            }}
          >
            <mesh geometry={part.geo} material={mats.sections[i]} />
            <primitive object={part.lines} />
            {i < SECTIONS.length - 1 && (
              <mesh position={[0, SECTIONS[i].h - RAIL_H / 2, 0]} material={mats.railInk}>
                <boxGeometry args={[part.railW, RAIL_H, SECTION_T + 0.04]} />
              </mesh>
            )}
          </group>
        ))}

        <mesh geometry={transomGeo} material={mats.transom} />
        <primitive object={transomLines} />

        {/* The frame: jambs, sill and header. Static, so the opening stays
            drawn while the door rolls away behind it. */}
        <mesh position={[-jamb.x, jamb.y, FRAME_Z]} rotation={[0, 0, -jamb.angle]} material={mats.ink}>
          <boxGeometry args={[JAMB_W, jamb.len, FRAME_D]} />
        </mesh>
        <mesh position={[jamb.x, jamb.y, FRAME_Z]} rotation={[0, 0, jamb.angle]} material={mats.ink}>
          <boxGeometry args={[JAMB_W, jamb.len, FRAME_D]} />
        </mesh>
        <mesh position={[0, SILL_H / 2, FRAME_Z]} material={mats.ink}>
          <boxGeometry args={[openingHalfW(0) * 2 + 0.2, SILL_H, FRAME_D]} />
        </mesh>
        <mesh position={[0, DOOR_HEADER_Y, FRAME_Z]} material={mats.ink}>
          <boxGeometry args={[openingHalfW(DOOR_HEADER_Y) * 2 + 0.2, HEADER_H, FRAME_D]} />
        </mesh>
      </group>

      <group ref={panelRef} position={[0, LOGO_Y, LOGO_Z - 0.05]} visible={false}>
        <mesh geometry={panelGeo} material={mats.panel} renderOrder={1} />
        <primitive object={panelLines} renderOrder={1} />
      </group>

      <group ref={logoZoom} position={[LOGO_PIVOT.x, LOGO_Y + LOGO_PIVOT.y, LOGO_Z + LOGO_DEPTH / 2]}>
        <group position={[-LOGO_PIVOT.x, -LOGO_PIVOT.y, -LOGO_DEPTH / 2]}>
          <group ref={logoSpin}>
            <mesh geometry={logo.geo} material={[mats.logoFace, mats.logoSide]} renderOrder={2} />
            <primitive object={logo.lines} renderOrder={2} />
          </group>
        </group>
      </group>
    </>
  );
}
