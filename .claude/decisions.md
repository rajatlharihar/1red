# Decision Log

Chronological, most recent last. Each entry: date (where known — this project has no git history, so most dates come from conversation context and file modification timestamps, not commits), decision, reason, and any explicit "do not" that follows from it.

---

**DECISION:** No git repository will be initialized unless the project owner explicitly asks.
**REASON:** Confirmed via direct check that none exists. Not something to "fix" proactively.
**DO NOT:** Run `git init` or any git command without being asked.

---

**DECISION:** `motion/react` is the sole animation library for the entire project.
**REASON:** Established from the start; multiple later requests said "if GSAP is already used, use it" — verified GSAP is not a dependency, so the correct interpretation was always "keep using the existing `motion/react`-based pattern."
**DO NOT:** Introduce GSAP, Lenis, or any competing animation/scroll library, even if a future prompt assumes one exists.

---

**DECISION:** The OneRed logo geometry is never redesigned, redrawn, or approximated with fonts/shapes.
**REASON:** Core brand identity. Reinforced after a specific incident (see next entry).
**DO NOT:** Touch `Logo.tsx`'s rendering approach or the logo's proportions/color without an explicit request.

---

**DECISION:** The Hero section's scroll-driven "logo constructs block by block" feature was fully reverted back to a plain static logo with a simple fade-in.
**REASON:** The implementation extracted the logo's real SVG path data (`public/favicon.svg`) and split it into animatable units, but incorrectly separated the "R," its counter-hole, and the "E" into different `<path>` elements — since they originally shared one `<path>` and relied on shared fill-rule winding to render the negative space correctly, splitting them produced a visibly wrong, "generic blocky typography" result. After a first attempted fix, the project owner asked for a full revert rather than further patching.
**DO NOT:** Rebuild logo-construction animation without explicit request — and if asked again, treat any SVG `<path>` with multiple subpaths as a single indivisible unit unless very carefully verified to be safe to split (test the exact rendered result against the original, don't assume).

---

**DECISION:** The homepage 3D environment's center cube is the only 3D object in that scene — no peripheral decorative boxes, no moving "signal" marker.
**REASON:** Both were built, then explicitly requested to be removed ("get rid of every other cube... even the small red floating cube").
**DO NOT:** Reintroduce ambient/peripheral 3D decoration in `ThreeEnvironment.tsx` without being asked.

---

**DECISION:** Project video textures mapped onto square/uniform 3D surfaces must use explicit "cover" UV cropping based on each video's real native aspect ratio, not a naive 1:1 stretch.
**REASON:** The 4 real project videos have very different native aspect ratios (portrait, square, and widescreen); without correction, most of them appeared visibly stretched on the cube's square faces.
**DO NOT:** Assume a video texture will "just work" on any non-matching-aspect-ratio surface — always check `videoWidth`/`videoHeight` and correct.

---

**DECISION:** Glass card surfaces must never have a color gradient painted directly onto the card's own background — only a flat, neutral translucent fill, with color coming from the page's background gradient showing through the blur.
**REASON:** A tinted-gradient glass background was tried on the homepage "Work That Moves Brands Forward" grid and explicitly rejected: "I don't want gradient on the cards it should be the background and the cards should be only glass."
**DO NOT:** Paint gradients onto any glass card's own `background` property. Gradients belong on the section background, not the card.

---

**DECISION:** The `/services` 3D environment keeps plain wireframe box modules only — no red particle field, no "pedestal leg" support geometry, no floor footprint markers.
**REASON:** A polish pass added all three (particles for atmosphere, legs + footprint to make each card look architecturally "grounded"). The project owner's explicit reaction: "remove the red particles and the wireframe lines that look like a stand for the boxes it looks terrible fix it now." Fully reverted; the earlier, separate label-spacing/glass-surface improvements from the same polish pass were kept since they weren't part of the complaint.
**DO NOT:** Reintroduce particle systems or "stand"/pedestal-style support geometry in this environment without explicit request. If ambient motion is requested again, get sign-off on a small, restrained prototype before building the full system.

---

**DECISION:** Reduced-motion fallbacks for any pinned-scroll section must set the inner sticky wrapper to `position: relative`, never `position: static`, when collapsing out of `position: sticky`.
**REASON:** `position: static` doesn't provide a positioning context for `position: absolute` children (like the HTML label overlay in `ServicesEnvironment.tsx`) — they escape to the document root instead, causing real visual bugs (a card label rendered overlapping the page's own heading, far from where the 3D environment actually was). Found and fixed during a "how we build great work" QA pass.
**DO NOT:** Copy the pattern `position: reduceMotion ? 'static' : 'sticky'` into new code — always use `'relative'` instead of `'static'`.

---

**DECISION:** Every section redesign in this project is scoped strictly to the named section; unrelated sections are never touched, refactored, or "improved" as a side effect.
**REASON:** Stated as an explicit, hard requirement across nearly every large redesign request in this project's history, almost always with an enumerated list of sections that must NOT change.
**DO NOT:** Treat "while I'm in here" cleanup of adjacent code as in-scope, even if it looks like an obvious improvement. Ask first, or leave it alone.

---

**DECISION:** This memory vault system (`CLAUDE.md` + `.claude/*.md`) was created as a persistence layer for future Claude Code sessions on this project.
**REASON:** The project has been developed across one very long conversation with many specific decisions not otherwise recorded anywhere (no git history). The project owner wants any new session to be able to continue accurately without re-explaining context.
**DO NOT:** Let this vault go stale — update `current-state.md` and this file whenever the project owner says "SAVE MEMORY," and always verify actual code over documentation if they disagree.

---

**DECISION (2026-09-16):** Hero ink lines are `LineSegments2`/`LineMaterial` fat lines on real geometry edges, with a 0.4% view-ray depth bias patched into the line shader. Fills use polygonOffset.
**REASON:** Shifting 1px lines in world space to beat z-fighting put every line visibly off its corner ("the lines are a bit off").
**DO NOT:** Offset line geometry in world space to fix stipple.

---

**DECISION (2026-09-16):** The hero door is a sectional garage door on a HIGH-LIFT track (vertical → bend below header → steep incline), with a static frame (jambs/sill/header) and fixed transom.
**REASON:** Rajat asked for real garage-door physics and a "story"; the rims previously lifted with the door and the sides went bare. A level track stored the panels across the room ceiling, in frame during the push.
**DO NOT:** Attach the jambs/rims to the moving door, or store the door on a level track.

---

**DECISION (2026-09-16):** Track housings behind the jambs were tried and removed (read as black steps/blocks). The pale wedges at the tipping panel were solved by making the whole reveal solid brand ink — chosen by Rajat over a cream-to-black gradient via a side-by-side render.
**DO NOT:** Reintroduce housing blocks; don't bring the cream reveal gradient back.

---

**DECISION (2026-09-16):** Studio.glb materials are all replaced with the pencil palette (Rajat explicitly lifted the earlier "floor material only" rule). Room is unlit; darkness/brightness is done by recolouring materials (`toneMapped: false` so lit = true white and the mark = true brand red).
**REASON:** "extremely dark, then suddenly bright as f— where even the cream is white".

---

**DECISION (2026-09-16):** The 3D mark is `SVGLoader.createShapes` per SVG path → `ExtrudeGeometry` from `public/1red-logo.svg` (superseded same day: first built from favicon.svg, which turned out to be an outdated "1RED" drawing, not the logo). Zoom pivots on the plus-shaped gap between the "e" blocks at the front face (face never moves toward camera; depth scales 1% as fast as width).
**DO NOT:** Split SVG paths into subpaths manually (fill-rule bug history), or use the raster logo plane for the hero again.

---

**DECISION (2026-09-16):** Scroll-driven camera motion uses one shared easeInOutSine curve per beat plus exponential damping of scroll input in `useFrame` (k = 5).
**REASON:** Rajat's explicit, emphatic approval ("too smooth, beautiful").

---

**DECISION (2026-09-16):** The real logo is `public/1red-logo.svg` (Rajat's vector). The favicon is only the "1" glyph, red, white in dark mode.
**REASON:** favicon.svg had been documented as the verified logo but held a different "1RED" mark. A sub-pixel trace of the raster (IoU 0.9996) was used as a stopgap for minutes before Rajat supplied the vector. The trace was deleted.
**DO NOT:** Use favicon.svg as the logo; trace rasters when a vector can be requested.

---

**DECISION (2026-09-16):** Studio.glb was rebuilt from `Studio.glb.orig-backup` with @gltf-transform. Each tripod and lamp head ("Handle_n") is its own mesh, pivoted at its mount. Textures were dropped and materials collapsed to three roles named `paper`/`floor`/`ink`, matched by name at runtime. 39 meshes, meshopt, ~2.8 MB.
**REASON:** Rajat wanted the lamps to face the viewer and then turn to the mark, which needs individual control. The previous optimize had merged everything into 7 meshes.
**HOW:** The yaw per head is the angle from facing the settled camera to facing the mark, applied in world space through the FBX parent frame, driven by `lampTurn` (p 0.66–0.82). The rebuild script lived in the session scratchpad; the recipe is in StudioEnvironment.tsx's header.

---

**DECISION (2026-09-16):** The whole floor is black: the approach ground uses the dark room floor colour, with no polygonOffset so it wins over the model floor underneath. The room glows up to 38% from p 0.56 before the lights switch fully on at p 0.706.
**REASON:** A lighter ground next to the model's dark floor looked patchy, and Rajat wanted the room already brightening as the camera arrives.

---

**DECISION (2026-09-16):** No white flash at lights-on (Rajat: not needed). The switch ramps over p 0.706 to 0.726.

---

**DECISION (2026-09-16):** Hero blacks are ONE value: brand ink `#0A0A0A` with `toneMapped: false` on ink meshes, the reveal, the ground/dark floor and all LineMaterials.
**REASON:** Tone mapping rendered the tone-mapped ink as pure black next to the un-tone-mapped floor's charcoal, so the seams showed. Rajat flagged it twice.
**DO NOT:** Add a black surface to the hero without `toneMapped: false`.

---

**DECISION (2026-09-16):** Lamps and stands get pencil edge outlines (`EdgesGeometry` at 40° to `LineSegments2`, parented per mesh so they rotate with the heads), cream `#CFC7B0` in the dark and ink once lit. Rajat loved this look ("tooooo cool").

---

**DECISION (2026-09-16):** In `public/1red-logo.svg` the two touching shapes forming the bottom-right block of the "e" are merged into one path (identical outline).
**REASON:** Rajat: "they are supposed to be one box." Two shapes meant an ink seam across the block.

---

**NOTE (2026-09-16):** Perf runs are noisy on the iMac when other GPU work is running: identical builds measured 301/0 and 7/4 back to back. Repeat runs before attributing a regression.

---

**DECISION (2026-09-16):** Lamp sketch = EdgesGeometry lines (28°) PLUS a silhouette hull (BackSide ShaderMaterial, vertices pushed out by `uWidth` px in view space), both coloured like the sketch line material. The glb has a 4th role, `glow` (original Mtl_2 softbox diffusers, Mtl_11 spot emitters, Mtl_16 lens glass), rendered `#FFFFFF` unlit at all times.
**REASON:** Rajat: umbrella lights were "not understood" because only hard edges got outlined, and "where they give out light from can be completely bright light".
**NOTE:** Roles are assigned per primitive from the ORIGINAL material name in the rebuild, not per node, since one lamp head mixes body and emitter.

---

**DECISION (2026-09-16):** Lamp aim is a full look-at, not a yaw. forward = pivot to the centre of the head's `glow` surfaces, or to the centre of its body if it has none. Before the turn the target is the LIVE camera; `lampTurn` (p 0.47 to 0.72) slerps to the mark. Heads with pivot y < 0.4 (the fallen stand) are skipped.
**REASON:** Rajat wanted the lamps "tilted more towards me, opposite of the screen" from the door-open frame, then looking at the mark as the camera zooms in.

---

**DECISION (2026-09-16):** The lamp EdgesGeometry threshold stays at 60°. Do not lower it.
**REASON:** A/B measured: edges only gave 22 slow frames; hull only gave 0; both at 28° gave an 11 s load freeze and a 30 s stall. At 60° the result is 1.5 s load and 0 slow. The silhouette shell covers the outline the lower threshold used to add.

---

**DECISION (2026-09-16):** Lamp beams live in their own file (`lampBeams.ts`) behind `LAMP_BEAMS`. All integration lines in StudioEnvironment.tsx are marked `// beams`. Rajat explicitly asked for an undo option for the beams only.
**TUNING:** strength spot 0.28 / softbox 0.09; rim falloff pow 2.6 (lower showed a ring at the cone mouth); fade `(1 - lights)^3` so no haze over the mark; 24 radial segments.

---

**DECISION (2026-09-16):** Before the turn, lamps rest at slerp(camera-aim, mark-aim, 0.3), i.e. `REST_BIAS`.
**REASON:** Rajat: full camera-aim was "facing too much towards me, just a little towards inside".

---

**NOTE (2026-09-16):** Perf measured during this step was unreliable: a stuck `npm exec ccstatusline-usage` process at ~107% CPU, Spotlight indexing, and a Brave renderer. With beams OFF it was equally slow (91 frames / 86 slow), so the beams were not the cause. Re-measure on a quiet machine.

---

**DECISION (2026-09-16):** Lamp beams switched OFF (`LAMP_BEAMS = false`) after Rajat reviewed them: "nah undo it". The code is kept dormant. Don't turn them back on unless he asks.

---

**DECISION (2026-09-16):** Stroke widths: `LINE_PX` 1.2 (facade, door, mark), lamp sketch 0.9, hull `uWidth` 0.9. Rajat asked for all strokes thinner. Checked: still continuous with no dashes.

---

**DECISION (2026-09-16):** No separate aim beat before the zoom. The gap's screen offset = (1 - aim) x zoom x pivot offset. `gapDrift` = 1 - sine(zoomT over 0 to 0.3) and aim = 1 - gapDrift / zoom, so the gap glides to centre inside the zoom.
**REASON:** Rajat wanted the slide from the mark's centre to the "e" gap to happen only while zooming, seamlessly.

---

**DECISION (2026-09-16):** Hero performance baseline for Rajat's iMac (Retina 5K, AMD Radeon R9 M390, 2 GB VRAM):
- Canvas DPR = min(device DPR, max, sqrt(3.2M / window pixels)), floor 0.75.
- `frameloop="demand"`: StudioEntrance's scroll handler invalidates; StudioScene keeps invalidating while |progress - eased| > 1e-5.
- Studio.glb meshopt-simplified (ratio 0.2, error 0.002).
**REASON:** "tooooo laggy". Render resolution alone did not fix it and A/B runs were noisy (Rajat's Brave tab shares the GPU). The combination was verified consistently at the real screen size.
**DO NOT:** Go back to `frameloop="always"` or an uncapped 2x DPR. Measure perf at 2560x1340 deviceScaleFactor 2, not 1600x800 @1x, which hid the problem.

---

**DECISION (2026-09-16):** Door panels rise straight up and are clipped at y = DOOR_HEADER_Y - HEADER_H/2 (`HEADER_CLIP`; `gl.localClippingEnabled = true`). They use their own clipped materials (`sections`, `railInk`, `sectionLine`), so the jambs, header and sill are not clipped.
**REASON:** Rajat wanted the panels to "disappear once they cross that line" instead of showing a black tipping slab under the beam.
**SUPERSEDES:** the high-lift track and tip-back shading decisions above. `trackPoint`/`TRACK_*` were deleted.

---

**DECISION (2026-09-17):** Section 2 is a many-cubes-into-one-box assembly, not the 8-block cube beside a problem/response text column.
**REASON:** Rajat's direction: after the zoom through the "e", lots of cubes appear across the section, and by the end of the scroll they rotate at the centre and form one bigger box. He asked for the layout to change entirely and for the text to be placed later.
**DO NOT:** Re-add the old left-column text overlay or the state ticks on your own. The copy stays in `problemStates.ts` until Rajat decides where the text goes.

---

**DECISION (2026-09-17):** The fallen stand (`Studio_Setup_Tripod_6`) is removed from the hero studio.
**REASON:** Rajat didn't want the knocked-over tripod in the shot (it also picked up the floor's lit colour).
**DO NOT:** Bring it back when rebuilding Studio.glb; if the glb is rebuilt, keep the runtime removal or drop the node in the rebuild script.

---

**DECISION (2026-09-17):** "Selected Work" heading lives inside FlashWork's pinned viewport again, above the list and visual.
**REASON:** Rajat asked for it: the separately scrolling heading left too much white space before the list. Later the same day he asked for the visual to run from the headline down to the last project, so the heading now sits in the left column with the list, and the visual stretches to that column: its top lines up with the headline (below the eyebrow, `HEADLINE_OFFSET`) and its bottom with the last row's underline (`ROW_PAD_Y`). Heading and row sizes scale with viewport height so it fits 100vh.
**DO NOT:** Give the visual a fixed height or aspect ratio, or move the heading out of the left column, without Rajat asking.

---

**DECISION (2026-09-17):** Scroll-scrubbed scenes that hand off to each other read progress from the shared `scrollGlide` (one eased scrollY), not from their own clamped progress.
**REASON:** Two scenes easing separately drift apart on fast scrolls (cubes appeared over the "e" before the zoom passed it).
**DO NOT:** Add per-scene easing on top of `scrollGlide`, or feed raw scroll to a scene that overlaps another.

---

**DECISION (2026-09-17):** The favicon file is `public/1red-favicon.svg`, not `favicon.svg`.
**REASON:** Browsers cached the old icon under `/favicon.svg` even after the new glyph deployed. It stays the logo-red "1", white under `prefers-color-scheme: dark`.
**DO NOT:** When the icon changes again, overwrite it in place; give it a new file name so browsers refetch it.

---

**DECISION (2026-09-17, later):** The hand-off out of the hero's zoom is a flythrough of a tunnel of cubes, four to a ring, one block in each corner of the frame, centred exactly on the gap in the "e".
**REASON:** Rajat, twice. First, the cubes scaling up out of the centre read as another zoom and not as travel. Then, when it was built as two rows flanking the path at ground level, "it looks like a caterpillar randomly hovering on screen": rows at the camera's own height are not behind the "e" and do not continue anything the hero was doing. Blocks in all four corners do, because the zoom breaks through a cross-shaped gap with red in all four quadrants, and the tunnel's mouth can open on exactly that cross.
**DO NOT:**
- Move the tunnel's axis off the camera axis. The hero's zoom drives `aim` to 1 well before `HANDOFF_P` (see `studioSequence.ts`), which puts the gap exactly on the camera axis, so a tunnel centred on (0, 0) is a tunnel exactly behind the "e". Any x/y offset breaks that for free.
- Give every block the same off-axis tilt. They then all lean the same way and the tunnel measures about 3% off centre even though the positions are symmetric. Tilts mirror per corner (`piece.tilt`), and the radius jitter belongs to the ring, not the cube.
- Draw anything before the section pins. Its sticky canvas is not aligned with the viewport until then, so the tunnel sits low of the gap over the closing door. Hence the `rawRef` gate, which needs the unclamped progress, not the clamped one.
- Let the tunnel run before the mouth is open (`AV_HOLD`), or start the mouth wide (`AV_AP0`). Until the backdrop is opaque the whole tunnel has to fit inside the white cross.
- Freeze the run and then start the turn. The tunnel visibly halts and waits. The run eases to a stop (`1 - (1 - t) ^ 2.2`) while the turn is already underway, and `AV_TRAVEL` is chosen so no ring is inside its fade band when the run stops.
- Size the tunnel blocks off `unit` alone. A block of a given height covers far more of a narrow frame's width, so on a phone the corner blocks swallow the tunnel they frame. `avSizeFor(aspect)` trims them; the box being built still uses `unit`.

---

**DECISION (2026-09-17, later):** The tunnel's first ring arrives at the on-screen size of the "e" blocks, wearing the mark's own flat red, and turns into red metal afterwards.
**REASON:** Rajat, on the version whose mouth opened from a point: "let those boxes start almost the same size of the e boxes like as if we are continuing". A tunnel that grows into the frame reads as a new thing starting, however well centred it is. The blocks have to enter at the scale, and in the colour, of the blocks the zoom just parted.
**DO NOT:**
- Reintroduce a mouth that opens from small (`AV_AP0`). Full width from the first frame is the point. `AV_PHASE0` is what puts the nearest ring on the corner-crossing depth at the hand-off, and `AV_HOLD` waits out the fade-in so that ring is actually seen instead of having already swept past.
- Set `AV_R` and `AV_SIZE` independently. `AV_SIZE * 0.85 / 2 / AV_R` is the fraction of the frame's height a block covers as its ring crosses the corners, which is the whole game: 30% reads as specks next to the mark, 50% reads as the same blocks.
- Chase `#FF0000` with a brighter emissive. This canvas tone-maps (ACES), and three.js's pass mixes channels through an input and an output matrix, so a stronger red goes cream: 0.89 lands on `#F40013`, 1.5 is already `#FF3F2A`, 18 is nearly white. 0.89 is the solved optimum. The mark itself only gets `#FF0000` because its material sets `toneMapped: false`, which this material cannot do without changing the metal the box ends as.
- Flatten the blocks with metalness 0. A dielectric still has specular, which lifts the whole block to `#F4342E`. Metalness 1 with a black base has neither diffuse nor specular (a metal's reflectance is its base colour), so the emissive is all that shows.
- Trust a colour check whose filter could exclude the answer. An emissive of 18 was measured as a match by a red-dominance filter that the cream blocks failed, and the blocks were rendering nearly white. Measure by hiding the hero's canvas and reading the tunnel's own pixels.

---

**DECISION (2026-09-17, later):** Section 2 clips itself to the gap in the "e" while the mark is on screen, so the tunnel is behind the mark and revealed by the gap opening.
**REASON:** Rajat: "its overlaping e it should not over lap it it should be behind e only also the way how they will appear should be smoother". Section 2 sits on top of the hero in the stacking order, so cubes at the corners painted straight over the mark's blocks, whatever their size and colour. One mechanism fixes both halves of the note: clipped to the gap, the mark occludes the tunnel, and the reveal is a wipe driven by the hero's own zoom rather than an appearance of its own.
**DO NOT:**
- Reintroduce a visibility gate at the pin. The reveal has to be continuous from before it, which is what the `camera.setViewOffset` shift and the clip's viewport-centred cross are for. A gate makes the tunnel switch on.
- Clip the backdrop along with the canvas. Only the 3D layer is clipped; the white backdrop still has to cover the whole frame once the hero goes white.
- Take `gapHalfFraction` as the whole gap. It measures the square hole at the centre of the mark, and the slots running out of it are about 5% wider, which is what the clip has to follow. `GAP_SCALE` carries that, verified against the rendered hero rather than assumed: the cubes now stop 2px from the red at two separate points in the hand-off.
- Let the clip lift on a different schedule from the mark leaving the frame. It lifts when the cross covers the frame, which is the same moment the mark's blocks clear it. Lift earlier and cubes cross onto the red; lift later and the cubes show straight cut edges against white.

