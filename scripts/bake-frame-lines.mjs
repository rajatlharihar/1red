// Bakes the hero frame's engraving as clean lines (run once, offline):
//   node scripts/bake-frame-lines.mjs "$PWD"
// Writes three Float32 segment lists (model metres) to public/models/frame/, one per
// line weight: frame_lines_sight.bin (sight edge, heavy), frame_lines_moulding.bin
// (four evenly spaced moulding lines), frame_lines_carving.bin (smoothed height
// contours of the carved ornament, fine). Tunables via env: BLUR, LEVELS, MINLEN.
import fs from 'node:fs';
import path from 'node:path';
const root = process.argv[2];
const dir = path.join(root, 'public/models/frame');
const gltf = JSON.parse(fs.readFileSync(path.join(dir, 'frame.gltf')));
const bin = fs.readFileSync(path.join(dir, 'fancy_picture_frame_02.bin'));
const acc = (i) => { const a = gltf.accessors[i], v = gltf.bufferViews[a.bufferView];
  const off = (v.byteOffset || 0) + (a.byteOffset || 0); const n = a.count * ({ VEC3: 3, VEC2: 2, SCALAR: 1 })[a.type];
  const C = a.componentType === 5126 ? Float32Array : a.componentType === 5123 ? Uint16Array : Uint32Array;
  return new C(bin.buffer.slice(bin.byteOffset + off, bin.byteOffset + off + n * C.BYTES_PER_ELEMENT)); };
const prim = gltf.meshes[0].primitives[0];
const P = acc(prim.attributes.POSITION), I = acc(prim.indices);
// 1) height map (max z) by rasterising every triangle seen from the front
const X0 = -0.335, Y0 = -0.395, CELL = 0.0012;
const W = Math.ceil(0.67 / CELL), H = Math.ceil(0.78 / CELL);
const Z = new Float32Array(W * H).fill(-1);
for (let t = 0; t < I.length; t += 3) {
  const v = [I[t], I[t + 1], I[t + 2]].map((k) => [(P[k * 3] - X0) / CELL, (P[k * 3 + 1] - Y0) / CELL, P[k * 3 + 2]]);
  const minx = Math.max(0, Math.floor(Math.min(v[0][0], v[1][0], v[2][0]))), maxx = Math.min(W - 1, Math.ceil(Math.max(v[0][0], v[1][0], v[2][0])));
  const miny = Math.max(0, Math.floor(Math.min(v[0][1], v[1][1], v[2][1]))), maxy = Math.min(H - 1, Math.ceil(Math.max(v[0][1], v[1][1], v[2][1])));
  const d = (v[1][1] - v[2][1]) * (v[0][0] - v[2][0]) + (v[2][0] - v[1][0]) * (v[0][1] - v[2][1]);
  if (Math.abs(d) < 1e-9) continue;
  for (let y = miny; y <= maxy; y++) for (let x = minx; x <= maxx; x++) {
    const a = ((v[1][1] - v[2][1]) * (x - v[2][0]) + (v[2][0] - v[1][0]) * (y - v[2][1])) / d;
    const b = ((v[2][1] - v[0][1]) * (x - v[2][0]) + (v[0][0] - v[2][0]) * (y - v[2][1])) / d;
    const c = 1 - a - b; if (a < -1e-4 || b < -1e-4 || c < -1e-4) continue;
    const z = a * v[0][2] + b * v[1][2] + c * v[2][2]; const i = y * W + x; if (z > Z[i]) Z[i] = z;
  }
}
// smooth (separable box blur x2, ignoring empty cells)
const blur = (src, r) => { const out = new Float32Array(src); for (const dirn of [1, W]) { const tmp = new Float32Array(out);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; if (tmp[i] < 0) continue; let s = 0, n = 0;
    for (let k = -r; k <= r; k++) { const xx = dirn === 1 ? x + k : x, yy = dirn === 1 ? y : y + k; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue; const v = tmp[yy * W + xx]; if (v < 0) continue; s += v; n++; }
    out[i] = s / n; } } return out; };
const Zs = blur(blur(Z, Number(process.env.BLUR || 2)), Number(process.env.BLUR || 2));
const S = { x0: -0.196, x1: 0.19605, y0: -0.2539, y1: 0.2456 };
const buckets = { sight: [], moulding: [], carving: [] };
let segs = buckets.sight;
// Surface height under a point, taken as the highest of the nearby cells so a
// line laid on a steep slope never dips under the carving (it showed dashed).
const zAt = (x, y) => { const gx = Math.round((x - X0) / CELL), gy = Math.round((y - Y0) / CELL); let z = -1;
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const xx = gx + dx, yy = gy + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue; z = Math.max(z, Z[yy * W + xx]); }
  return z; };
// 2) moulding rings laid on the surface
const RINGS = [['sight', 0.002], ['moulding', 0.013], ['moulding', 0.023], ['moulding', 0.033], ['moulding', 0.043]];
for (const [bucket, o] of RINGS) {
  segs = buckets[bucket];
  const x0 = S.x0 - o, x1 = S.x1 + o, y0 = S.y0 - o, y1 = S.y1 + o; const pts = [];
  const edge = (ax, ay, bx, by) => { const n = Math.ceil(Math.hypot(bx - ax, by - ay) / 0.004); for (let i = 0; i < n; i++) { const t = i / n; pts.push([ax + (bx - ax) * t, ay + (by - ay) * t]); } };
  edge(x0, y0, x1, y0); edge(x1, y0, x1, y1); edge(x1, y1, x0, y1); edge(x0, y1, x0, y0);
  for (let i = 0; i < pts.length; i++) { const j = (i + 1) % pts.length; const za = zAt(...pts[i]), zb = zAt(...pts[j]); if (za < 0 || zb < 0) continue;
    segs.push(pts[i][0], pts[i][1], za + 0.0016, pts[j][0], pts[j][1], zb + 0.0016); }
}
const ringSegs = (buckets.sight.length + buckets.moulding.length) / 6;
segs = buckets.carving;
// 3) height contours of the carving, outside the moulding (marching squares)
const LEVELS = (process.env.LEVELS || '0.05,0.062,0.074,0.084').split(',').map(Number);
const inner = (x, y) => x > S.x0 - 0.062 && x < S.x1 + 0.062 && y > S.y0 - 0.062 && y < S.y1 + 0.062;
const cs = [];
for (const L of LEVELS) for (let y = 0; y < H - 1; y++) for (let x = 0; x < W - 1; x++) {
  const i = y * W + x; const q = [Zs[i], Zs[i + 1], Zs[i + 1 + W], Zs[i + W]]; if (q.some((v) => v < 0)) continue;
  const c = [[0, 0], [1, 0], [1, 1], [0, 1]]; const pts = [];
  for (let e = 0; e < 4; e++) { const a = q[e], b = q[(e + 1) % 4]; if ((a < L) !== (b < L)) { const t = (L - a) / (b - a); const pa = c[e], pb = c[(e + 1) % 4];
    pts.push([X0 + (x + pa[0] + (pb[0] - pa[0]) * t) * CELL, Y0 + (y + pa[1] + (pb[1] - pa[1]) * t) * CELL]); } }
  if (pts.length >= 2) for (let k = 0; k + 1 < pts.length; k += 2) { const [a, b] = [pts[k], pts[k + 1]]; if (inner((a[0] + b[0]) / 2, (a[1] + b[1]) / 2)) continue; cs.push([a, b, L]); }
}
// chain into polylines, drop short ones, resample and lay on the surface
const key = (p) => `${Math.round(p[0] / 1e-5)},${Math.round(p[1] / 1e-5)}`;
const adj = new Map(); cs.forEach((s, i) => { for (const p of [s[0], s[1]]) { const k = key(p); if (!adj.has(k)) adj.set(k, []); adj.get(k).push(i); } });
const used = new Uint8Array(cs.length); let kept = 0, dropped = 0;
const MIN_LEN = Number(process.env.MINLEN || 0.03);
for (let i = 0; i < cs.length; i++) { if (used[i]) continue; used[i] = 1; const line = [cs[i][0], cs[i][1]];
  for (const end of [1, 0]) { let cur = end ? line[line.length - 1] : line[0];
    for (;;) { const nb = (adj.get(key(cur)) || []).find((j) => !used[j]); if (nb == null) break; used[nb] = 1; const s = cs[nb]; const nxt = key(s[0]) === key(cur) ? s[1] : s[0];
      if (end) line.push(nxt); else line.unshift(nxt); cur = nxt; } }
  let len = 0; for (let k = 1; k < line.length; k++) len += Math.hypot(line[k][0] - line[k - 1][0], line[k][1] - line[k - 1][1]);
  if (len < MIN_LEN) { dropped++; continue; }
  // Resample to even steps, then Chaikin-smooth twice: no kinks, and the
  // small hooks at the ends are rounded off with the rest.
  const closed = Math.hypot(line[0][0] - line[line.length - 1][0], line[0][1] - line[line.length - 1][1]) < CELL * 1.5;
  const STEP = 0.005;
  let rs = [line[0]]; let acc = 0;
  for (let k = 1; k < line.length; k++) { const a = line[k - 1], b = line[k]; const d = Math.hypot(b[0] - a[0], b[1] - a[1]); acc += d;
    if (acc >= STEP) { rs.push(b); acc = 0; } }
  if (rs[rs.length - 1] !== line[line.length - 1]) rs.push(line[line.length - 1]);
  // trim a hooked spur: drop end points where the line doubles back sharply
  const turn = (a, b, c) => { const u = [b[0] - a[0], b[1] - a[1]], v = [c[0] - b[0], c[1] - b[1]]; const d = Math.hypot(...u) * Math.hypot(...v) || 1; return (u[0] * v[0] + u[1] * v[1]) / d; };
  if (!closed) { while (rs.length > 4 && turn(rs[0], rs[1], rs[2]) < -0.2) rs.shift(); while (rs.length > 4 && turn(rs[rs.length - 3], rs[rs.length - 2], rs[rs.length - 1]) < -0.2) rs.pop(); }
  for (let it = 0; it < 2; it++) { const out = closed ? [] : [rs[0]];
    for (let k = 0; k < rs.length - 1; k++) { const a = rs[k], b = rs[k + 1]; out.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]); }
    if (closed) out.push(out[0]); else out.push(rs[rs.length - 1]); rs = out; }
  const sm = rs;
  for (let k = 1; k < sm.length; k++) { const a = sm[k - 1], b = sm[k]; const za = zAt(...a), zb = zAt(...b); if (za < 0 || zb < 0) continue;
    segs.push(a[0], a[1], za + 0.0016, b[0], b[1], zb + 0.0016); }
  kept++;
}
for (const [name, arr] of Object.entries(buckets)) fs.writeFileSync(path.join(dir, `frame_lines_${name}.bin`), Buffer.from(new Float32Array(arr).buffer));
console.error({ grid: [W, H], ringSegs, contours: kept, dropped, carvingSegs: buckets.carving.length / 6 });
