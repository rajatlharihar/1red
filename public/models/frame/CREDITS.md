# Frame model credits

`frame.gltf` + `fancy_picture_frame_02.bin`: "Fancy Picture Frame 02" from Poly Haven,
https://polyhaven.com/a/fancy_picture_frame_02, licensed CC0 (public domain).

`frame_lines_*.bin` are derived from the model by scripts/bake-frame-lines.mjs (Float32 line segment
pairs, model metres): the sight edge and four evenly spaced moulding lines laid on the moulding's
surface, and smoothed height contours of the carved ornament. The glTF's own material textures were
stripped; GildedFrame.tsx draws an unlit ink body, these lines in white at three weights, and a
silhouette shell.
