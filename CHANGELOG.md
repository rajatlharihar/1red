# Changelog

All notable changes to the OneRed Studio website, in reverse-chronological order.

**Provenance note:** this project has no git repository, so there is no commit history to generate this from. Entries below are reconstructed from the project's own conversation history and cross-checked against real file-modification timestamps on disk. Where multiple features landed on the same calendar day, they're listed together under that date without a reliable finer-grained order — filesystem timestamps only capture the *last* edit to a file, not every intermediate change made to it. Nothing below is invented; anything not verifiable was left out rather than guessed. See `.claude/decisions.md` for the reasoning behind specific decisions, not just what changed.

---

## 2026-09-17 (later)

- **The hero hands into section 2 through a tunnel, not a scale-up**: the cubes no longer start clustered deep at the centre of the frame and swell towards the camera. They are laid out four to a ring, one block in each corner of the frame, ring behind ring, converging on the exact point the hero's zoom breaks through the "e". The mouth of the tunnel opens as the gap opens (`AV_AP0`), so the hand-off is one continuous move: the parting red of the logo gives way to blocks streaming out of the same four corners. Ranks cycle (`AV_CYCLE`, wrapping off frame at `AV_Z_EXIT`), so 27 cubes read as a tunnel with no end. The array then turns (`AV_SWING`/`AV_TILT`), loses its depth (`AV_SQUASH`) and draws its mouth back in (`AV_AP_TURN`), which is what breaks the rings into the jumble the 3x3x3 box is built from. All in `cube/CubeAssembly.tsx`; section 2 grew to 490vh to give the run its own scroll.
- Each block carries a mirrored off-axis tilt and each ring shares one radius jitter, so the tunnel is symmetric about the gap. With a single shared tilt the blocks all leaned the same way and the tunnel's centre of mass measured 3% off centre.
- Nothing is drawn until the section actually pins (its canvas is not aligned with the viewport before that, so cubes appeared low of the gap over the closing door).
- **The first ring arrives at the size of the "e" blocks.** Rajat: the blocks have to start at the scale of the blocks the zoom just parted, "as if we are continuing". The tunnel is now at full width from its first frame (no mouth opening), and `AV_PHASE0` places the nearest ring exactly on the depth where its blocks straddle the corners of the frame, which is their biggest on-screen moment. `AV_R` is tight against `AV_SIZE`, since that ratio is what sets how much of the frame a block covers as it crosses the corners: it is now half the frame's height, against 30% before.
- **The first rings wear the mark's own skin.** They arrived in red metal against the mark's flat `#FF0000` and the brightness step read as a new object rather than the same blocks carrying on. Blocks now start as flat logo red and turn into red metal by p 0.12. Exact `#FF0000` is not reachable through this canvas's ACES tone mapping (a stronger red goes cream, not redder, because the pass mixes channels), and the mark's own material skips tone mapping while this one cannot without changing the metal the box ends as, so the blocks land on `#F40013`. Measured, not guessed: the end state still renders `#A0000C`, exactly as before.
- An earlier pass this session built this as two rows flanking the camera's path, ground level, like a lined walk. Rajat: it read as a caterpillar hovering in the frame, because rows at the camera's own height do not sit behind the "e" and do not continue the four parting quadrants of the logo. Replaced by the four-corner tunnel above.

## 2026-09-17

- **Fallen stand removed** from the studio: `Studio_Setup_Tripod_6` (the tripod lying on the floor, bottom right) is cut from the scene at load in `StudioEnvironment.tsx`.
- **Section 2 redesigned (no text yet)**: `ProblemCube` is now a pinned 320vh cube assembly. 27 red metal cubes appear scattered across the viewport, drift in core-first, square up before landing and lock into one 3×3×3 box while it turns, settling at a three-face angle. One InstancedMesh (`cube/CubeAssembly.tsx`); the old 8-block `CubeObject.tsx`, the problem/response text overlay and its scroll maths were removed. The copy is kept in `problemStates.ts` for when the text layout is decided.
- **Hero into section 2 is continuous**: no more white hand-off screen. `ProblemCube` is pulled up over the end of the hero (`marginTop: -(100vh + overlap)`, overlap from `HANDOFF_P = 0.945` in `StudioEntrance.tsx`) and pins while the zoom through the "e" is still running; its backdrop is see-through until the hero has gone white. Cubes rush out of the centre of the gap, then spread. Section 2 is now 360vh.
- **Hero and cubes glide in lockstep**: new `components/scrollGlide.ts` eases `window.scrollY` once (same rate-5 exponential the hero camera used) and both the hero and section 2 derive progress from it. Before, the hero eased its own progress and the cubes used raw scroll, so a fast scroll put cubes over the "e" before the zoom got there. Hero wrapper gains a 100vh pinned tail (`TAIL_VH`) and section 2's backdrop forces opaque once the hero really unpins, so a flick never shows the hero sliding away.
- **Favicon cache-busted**: `public/favicon.svg` renamed to `public/1red-favicon.svg` (index.html updated). Vercel was already serving the new "1" glyph, but browsers kept the old icon cached under the old URL. Still red (logo red `#FF0000`) in a light browser and white under `prefers-color-scheme: dark`, verified in Brave.
- **Selected Work visual spans the whole left column**: heading moved into the left column with the list; the project visual now runs from the headline's top to the last row's underline and fills its column's width (Rajat). Measured exact at 1440x900 and 1280x720.
- **Selected Work heading moved into the pinned viewport**: heading, list and visual share one sticky screen (Rajat: too much white space between the heading and the list). The list + visual row takes the height left under the heading (`flex: 1`, max 600px); heading, row titles and row padding also scale with viewport height, so it fits at 1280x720 without clipping.
- **Cubes never collide**: the box builds centre, faces, edges, corners; each cube flies to a staging point outside the box on its slot's axis, squares up and slides straight in. Flying cubes separate from each other and stay outside the staging sphere. Verified with an OBB overlap test on all 27 cubes across 201 scroll positions at 1440x900 and 390x844: zero overlaps (a 5%-inflated control run does flag the touching cubes, so the test is live).
- **Buttons use the nav pill's corner**: new `.btn-corners` class (smooth `corner-shape: superellipse(1.4)` at 14px, 10px fallback) on the nav indicator, mobile menu trigger and items, Contact option pills and submit, every Start a Project / Let's Talk / Visit Project CTA, the Privacy mail CTA and the footer service chips. Inline 3px/10px/12px radii removed from those.
- **Yui video replaced**: `public/videos/reservation.mp4` is now Rajat's `yuireservation-f_v1 (1080p).mp4` (1080p, 28.8 s, audio stripped, faststart; was a 4K 44 s cut). Same path, so the home work section, `/work`, the Yui case study and the UI/UX Design service card all pick it up.
- **Illusdoodle thumbnail**: new `public/images/illusdoodle-cover.jpg` (Rajat's logo artwork), set as `image` on the project in `projects.json` and `Work.tsx`. Projects with no video now show their `image` in FlashWork, `/work` and the case-study page; the red title block remains the fallback when neither exists.

## 2026-09-16

- **Hero line art** — edge lines rebuilt as constant-pixel-width ink lines sitting exactly on the geometry's corners (depth-biased along the view ray instead of being offset in world space, which had left every line visibly off its corner).
- **Hero door** — now a 3-section garage door on a high-lift track: panels roll up, tip back ~60° under the header (shading to brand ink as they turn) and stow above the studio. Jambs, sill, header and a fixed transom above stay put, so the opening is always drawn.
- **Hero camera** — starts closer, holds ~4 m off the door while it rolls, glides on one sine curve with damped scroll input; hero lengthened to 600vh.
- **Wall thickness** (door reveal) is solid brand ink `#0a0a0a`; all scene ink switched to the brand ink.
- **Frames removed** from the facade (the empty wall is being ideated separately).
- **Studio interior** restyled to the pencil palette (curtains/stands/lamps in ink, backdrop with hatch, floor), scaled 1.15×; all scene lights removed (everything is unlit).
- **Lights-on moment** — the room is pitch dark through the door and on entry, then snaps to pure white with a white flash at p = 0.715.
- **Door panels vanish at the header line**: panels now rise straight up and are clipped (a world clipping plane on the panel, rail and outline materials) at the lower edge of the header beam. The high-lift track and tip-back shading were removed, since that motion is never seen now.
- **Lag fix for the 5K iMac** (Radeon R9 M390, 2 GB): the canvas now uses a pixel budget (~3.2M px) instead of up to 2x DPR, renders on demand (frameloop `demand`, invalidated on scroll and while the glide catches up), and Studio.glb is simplified from 536k to 140k triangles (2.8 MB to 1.2 MB). Measured at 2560x1340 @2x, 3 runs: 301/0, 301/0, 298/2 slow frames; load long tasks under 0.3 s (was 1.3 to 11 s). Rebuild recipe committed as `scripts/rebuild-studio-glb.mjs`.
- **Zoom is one move**: the camera no longer squares up on the "e" gap before zooming. The gap glides to centre during the first part of the zoom, via `aim = 1 - gapDrift / zoom`, so its on-screen offset shrinks smoothly while the mark grows.
- **Thinner strokes everywhere**: ink lines 2 to 1.2 px, lamp sketch lines 1.4 to 0.9 px, lamp silhouette shell 1.6 to 0.9 px.
- **Lamp beams turned OFF** at Rajat's request (`LAMP_BEAMS = false`; code kept so they can be switched back on).
- **Lamp beams** (`src/app/components/hero/lampBeams.ts`): soft additive light cones from each lamp's emitting face, parented to the head so they swing with it. Spot beams are stronger and softbox beams faint; all fade out with `(1 - lights)^3`. **Undo switch:** `LAMP_BEAMS = false`.
- **Lamp rest aim** is now 30% of the way from the camera toward the mark ("a little towards inside") before the turn.
- **Lamps aim at the viewer, then the mark**: each head has a real forward vector (mount to emitting face). Through the door the heads track the live camera (full aim, not just yaw), then slerp onto the mark while the camera pushes in (p 0.47 to 0.72).
- **Lag fix**: the lamp edge-line threshold was raised from 28° to 60°. Measured before: 11 s load freeze and a 30 s scroll stall. After: 1.5 s load task and 302 frames with 0 slow. The silhouette shell was already cheap; the low-threshold edge lines on the ~300k-triangle lamp kit were the cost.
- **Lamps fully outlined + glowing**: a constant-pixel silhouette shell (back-face hull pushed along normals) now outlines round parts like poles, umbrellas and barrels, which edge lines alone missed. Edge threshold lowered to 28°. The emitting faces (softbox diffusers, spot emitters, lens glass) are a new `glow` role rendered pure white. Studio.glb rebuilt again with per-surface roles.
- **Lights-on flash removed**; the switch is now a quick ramp with no hard click (p 0.706 to 0.726).
- **Lamps sketched in pencil**: every tripod and lamp head carries its own edge outline (cream in the dark room, ink once lit) and swings with the head.
- **Logo red at full intensity** (`#FF0000` face, `#C40000` sides). The bottom-right block of the "e" is one shape (two touching shapes in the supplied SVG, merged in `public/1red-logo.svg`, so no seam line).
- **All blacks identical**: floor, ground, reveal, jambs, rails and ink lines are the same un-tone-mapped `#0A0A0A` (verified by sampling rendered pixels).
- **Real logo + favicon** — the 3D mark now uses Rajat's vector `public/1red-logo.svg` and zooms through the gap in the "e". The favicon is the "1" glyph, white in dark browsers. favicon.svg had never been the logo; docs corrected.
- **Floor all black**; room glows before the lights snap on (p 0.56 → 0.706).
- **Lamp heads turn** from the viewer to the mark (p 0.66–0.82). Studio.glb rebuilt so each tripod and lamp head is individually controllable.
- *(superseded same day)* **3D mark** — extruded from `public/favicon.svg` (verified against the SVG render), red with ink edges; turns once, then scales through the counter of the "r" (red tunnel) into white, handing off to the next section. Replaces the flat raster logo plane.

## 2026-08-31

- **`/services` 3D environment** — reverted a red particle field and "pedestal leg" wireframe support geometry that had been added to the floating service-card modules; both were explicitly rejected as looking bad. The environment now shows plain wireframe box modules only (the earlier label-spacing and glass-surface polish was kept).
- **Fixed a reduced-motion positioning bug** in the same environment: the inner pinned wrapper switched to `position: static` under `prefers-reduced-motion`, which broke containment for its absolutely-positioned label overlay (labels rendered escaped to the top of the document, overlapping the page heading). Fixed by using `position: relative` instead.
- **Created the project memory vault** — `CLAUDE.md` plus `.claude/project-memory.md`, `design-system.md`, `architecture.md`, `current-state.md`, and `decisions.md` — so future Claude Code sessions can continue this project without needing the full prior conversation.
- This `CHANGELOG.md`.

## 2026-08-30

- **`/work` — "How We Build Great Work"** redesigned from a static two-column layout (heading left, stacked cards right — leaving the left column visually dead once scrolled past the description) into a pinned, scroll-driven story on desktop: an anchored left column (heading + a vertical progress rail with a red fill line and per-stage dots) alongside a single fixed-size card slot on the right that materializes each process stage as the user scrolls. All 5 existing stages kept (Discovery, Strategy, Design, Production, Launch & Growth). Mobile/tablet and reduced-motion keep the original simple stacked-card list.

## 2026-08-26

A large cluster of feature work and redesign passes landed this day, across many iterative requests:

- **Local dev environment** brought up from the original Figma Make export (no prior working setup).
- **Homepage "Work That Moves Brands Forward"** — box-system redesign, later evolved through several rounds into individually-floating glass cards with a light atmospheric background gradient; corrected a card material bug where a color gradient had been painted directly onto the glass itself (moved to the background instead, letting it show through the blur).
- **Sitewide "boxy" UI pass** — replaced rounded pill-shaped buttons/tags with the sharp `borderRadius: 3` box language.
- **Homepage 3D environment** (`ThreeEnvironment.tsx`) introduced — a scroll-driven 3D scene, later evolved into a single-cube showcase stepping through all 5 projects (real video textures + canvas-drawn poster faces), with peripheral decorative geometry and a moving marker built and then explicitly removed so the cube is the sole 3D object.
- **`/services` 3D environment** (`ServicesEnvironment.tsx`) introduced — floating wireframe service-card modules with a screen-space-first layout system and dynamic label-collision avoidance.
- **Floating Navigation** (`Navigation.tsx`) redesigned from a conventional top navbar into two independent floating glass islands with a magnetic sliding hover indicator and scroll-aware compact/expand behavior.
- **Hero logo animation** — a scroll-driven "logo constructs from its own SVG geometry" feature was built, found to have a real fill-rule bug that visibly distorted the mark, and was fully reverted back to the original static logo with a simple fade-in.
- **Provided 3D cube asset** (`public/models/OneRed_3DCube.glb`) integrated, then later superseded by a plain `BoxGeometry` once the showcase needed 6 independently-texturable faces (the GLB only defines 2 material groups).
- **Apple-design glassmorphism reference** (`ab6c7e15-...` archive) added to the repo and used to establish the site's standard glass-surface recipe (`backdrop-filter: blur(20px) saturate(180%)`, red-tinted border, bright inset top highlight).

## 2026-08-17

- **Initial repository state** — Figma Make export, no local dev setup, no version control. `package.json`, `public/favicon.svg`, and the bulk of the inherited `src/app/components/ui/` primitive library date from this point.
