import type * as THREE from 'three';

/* Edge lines for a geometry, computed in edgesWorker.ts. Results are cached
   per geometry, so coming back to the home page reuses them. */
let worker: Worker | null = null;
let nextId = 1;
const waiting = new Map<number, (p: Float32Array) => void>();
const cache = new Map<string, Promise<Float32Array>>();

function getWorker() {
  if (!worker) {
    worker = new Worker(new URL('./edgesWorker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent<{ id: number; positions: Float32Array }>) => {
      waiting.get(e.data.id)?.(e.data.positions);
      waiting.delete(e.data.id);
    };
  }
  return worker;
}

export function edgePositions(geo: THREE.BufferGeometry, threshold: number): Promise<Float32Array> {
  const key = `${geo.uuid}:${threshold}`;
  const hit = cache.get(key);
  if (hit) return hit;
  // Plain float copies (the glb's attributes may be quantized/interleaved).
  const src = geo.attributes.position;
  const position = new Float32Array(src.count * 3);
  for (let i = 0; i < src.count; i++) {
    position[i * 3] = src.getX(i);
    position[i * 3 + 1] = src.getY(i);
    position[i * 3 + 2] = src.getZ(i);
  }
  const index = geo.index ? Uint32Array.from(geo.index.array as ArrayLike<number>) : null;
  const id = nextId++;
  const p = new Promise<Float32Array>((resolve) => waiting.set(id, resolve));
  const transfer: Transferable[] = [position.buffer];
  if (index) transfer.push(index.buffer);
  getWorker().postMessage({ id, position, index, threshold }, transfer);
  cache.set(key, p);
  return p;
}
