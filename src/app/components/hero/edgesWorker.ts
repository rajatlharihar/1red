/* Builds THREE.EdgesGeometry off the main thread (perf pass 2026-10-17):
   on the ~300k-triangle studio kit it took ~0.6 s on the iMac and ~2.5 s on a
   slow phone CPU, freezing the entrance while the model came in. Positions
   and index arrive as plain arrays; the line segment positions go back. */
import { BufferAttribute, BufferGeometry, EdgesGeometry } from 'three';

self.onmessage = (e: MessageEvent<{ id: number; position: Float32Array; index: Uint32Array | null; threshold: number }>) => {
  const { id, position, index, threshold } = e.data;
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(position, 3));
  if (index) g.setIndex(new BufferAttribute(index, 1));
  const edges = new EdgesGeometry(g, threshold);
  const out = edges.attributes.position.array as Float32Array;
  (self as unknown as Worker).postMessage({ id, positions: out }, [out.buffer]);
};
