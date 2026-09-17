// Rebuilds Studio.glb from Studio.glb.orig-backup: per-rig baking, role materials
// (paper/floor/ink/glow), meshopt simplify + compression. Needs @gltf-transform/core,
// extensions, functions and meshoptimizer; set N to their node_modules folder.
// Run from the repo root: node scripts/rebuild-studio-glb.mjs
const N = '/Users/imac/.npm/_npx/a6797f7ff67bb1f2/node_modules';
const { NodeIO } = await import(`${N}/@gltf-transform/core/dist/index.js`);
const { ALL_EXTENSIONS } = await import(`${N}/@gltf-transform/extensions/dist/index.js`);
const F = await import(`${N}/@gltf-transform/functions/dist/index.js`);
const { MeshoptEncoder, MeshoptDecoder, MeshoptSimplifier } = await import(`${N}/meshoptimizer/index.js`);
const mat4 = (await import(`${N}/gl-matrix/esm/index.js`).catch(() => null))?.mat4;
await MeshoptEncoder.ready; await MeshoptDecoder.ready; await MeshoptSimplifier.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder });
const LIVE = './';
const doc = await io.read(LIVE + 'Studio.glb.orig-backup');
const root = doc.getRoot();

// One material per role; the site replaces them by name at runtime.
const mk = (name, v) => doc.createMaterial(name).setBaseColorFactor([v, v, v, 1]);
const M = { paper: mk('paper', 1), floor: mk('floor', 0.5), ink: mk('ink', 0), glow: mk('glow', 0.75) };
// Emitters in the supplied model: softbox diffusers (Mtl_2), spot emitters (Mtl_11), lens glass (Mtl_16).
const GLOW = /Studio_Setup_Mtl_(2|11|16)\./;

const setup = root.listNodes().find((n) => n.getName() === 'Studio Setup');
const isControl = (n) => /_(Tripod|Handle)_\d+$/.test(n.getName());
const topOf = new Map();
for (const c of setup.listChildren()) {
  const visit = (n, anchor) => { const a = isControl(n) ? n : anchor; topOf.set(n, a); n.listChildren().forEach((k) => visit(k, a)); };
  visit(c, c);
}

// Matrix helpers without gl-matrix: gltf-transform nodes expose getWorldMatrix().
const inv = (m) => { const r = new Array(16); const [a00,a01,a02,a03,a10,a11,a12,a13,a20,a21,a22,a23,a30,a31,a32,a33] = m;
  const b00=a00*a11-a01*a10,b01=a00*a12-a02*a10,b02=a00*a13-a03*a10,b03=a01*a12-a02*a11,b04=a01*a13-a03*a11,b05=a02*a13-a03*a12,b06=a20*a31-a21*a30,b07=a20*a32-a22*a30,b08=a20*a33-a23*a30,b09=a21*a32-a22*a31,b10=a21*a33-a23*a31,b11=a22*a33-a23*a32;
  const det=1/(b00*b11-b01*b10+b02*b09+b03*b08-b04*b07+b05*b06);
  r[0]=(a11*b11-a12*b10+a13*b09)*det;r[1]=(a02*b10-a01*b11-a03*b09)*det;r[2]=(a31*b05-a32*b04+a33*b03)*det;r[3]=(a22*b04-a21*b05-a23*b03)*det;
  r[4]=(a12*b08-a10*b11-a13*b07)*det;r[5]=(a00*b11-a02*b08+a03*b07)*det;r[6]=(a32*b02-a30*b05-a33*b01)*det;r[7]=(a20*b05-a22*b02+a23*b01)*det;
  r[8]=(a10*b10-a11*b08+a13*b06)*det;r[9]=(a01*b08-a00*b10-a03*b06)*det;r[10]=(a30*b04-a31*b02+a33*b00)*det;r[11]=(a21*b02-a20*b04-a23*b00)*det;
  r[12]=(a11*b07-a10*b09-a12*b06)*det;r[13]=(a00*b09-a01*b07+a02*b06)*det;r[14]=(a31*b01-a30*b03-a32*b00)*det;r[15]=(a20*b03-a21*b01+a22*b00)*det; return r; };
const mul = (a, b) => { const r = new Array(16).fill(0); for (let c = 0; c < 4; c++) for (let rr = 0; rr < 4; rr++) for (let k = 0; k < 4; k++) r[c*4+rr] += a[k*4+rr] * b[c*4+k]; return r; };

let moved = 0;
for (const [n, anchor] of topOf) {
  const mesh = n.getMesh(); if (!mesh) continue;
  const nodeRole = /Backdrop_1(_Studio|$)/.test(n.getName()) ? 'paper' : /Floor/.test(n.getName()) ? 'floor' : 'ink';
  const rel = mul(inv(anchor.getWorldMatrix()), n.getWorldMatrix());
  const copy = mesh.clone();
  copy.listPrimitives().forEach((p) => {
    const orig = p.getMaterial()?.getName() ?? '';
    p.setMaterial(M[GLOW.test(orig) ? 'glow' : nodeRole]);
  });
  F.transformMesh(copy, rel);
  const holder = doc.createNode(n.getName() + '_geo').setMesh(copy);
  anchor.addChild(holder);
  n.setMesh(null);
  moved++;
}
console.log('baked meshes', moved);
for (const m of root.listMaterials()) if (!Object.values(M).includes(m)) m.dispose();
for (const t of root.listTextures()) t.dispose();
await doc.transform(
  F.prune({ keepLeaves: false }),
  F.dedup(),
  F.join({ keepNamed: false }),
  F.weld(),
  // Silhouette-driven look: black fills and outlines don't need the supplied
  // tessellation. ~0.2% of each mesh's extent as the error bound.
  F.simplify({ simplifier: MeshoptSimplifier, ratio: 0.2, error: 0.002 }),
  F.prune({ keepLeaves: false }),
  F.meshopt({ encoder: MeshoptEncoder, level: 'medium' }),
);
const controls = root.listNodes().filter(isControl).map((n) => n.getName());
console.log('controls', controls.join(', '));
console.log('meshes', root.listMeshes().length, 'prims', root.listMeshes().reduce((a, m) => a + m.listPrimitives().length, 0), 'materials', root.listMaterials().map((m) => m.getName()));
await io.write(LIVE + 'Studio.glb', doc);
