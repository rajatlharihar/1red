# Current State

## Last Updated
2026-09-20

## Session Log: 2026-09-20

- Night (scrollytelling brief, task H1, hub imac-74): hero statement on the wall, see CHANGELOG 2026-09-20 (night). Verified headless Brave 1440x900 and 390x844 at p 0 / 0.05 / 0.10 / 0.16 / 0.24, no page errors, `vite build` clean. Awaiting hub/Rajat review; next task is H2 (cube line), handed out by the hub.

- Later: services roster cut to three; Our Process on /services is a flick carousel (`OurProcess.tsx`); /studio is the process-as-a-print composition (`StudioProcess.tsx`, `Studio.tsx` deleted); Navigation footer observer gets a -1px bottom margin. See CHANGELOG 2026-09-20 (later) and decisions.md. Verified headless in Brave at 1440x900 and 390x844: flick lands on the next card, prev/next and arrow keys work, resize keeps the current card, studio hover swaps the caption, no page errors, `vite build` clean. Waiting on Rajat's review of the studio composition (figure placement, block sizes) and of the carousel's feel on the real trackpad.

- **Deployed:** `main` pushed to GitHub at `ecb4a16` (25 commits since `76c1e5d`); https://1red.vercel.app serves the new bundle. Pending Rajat's live check of the bottom-of-page lag after the video-pause and composited-drift fixes.

- Evening: placeholder lines behind the finished box (Rajat to supply copy), "Let's create" CTAs red with fill hover, footer email/watermark/nav-logo/overscroll changes. See CHANGELOG 2026-09-20 (evening). The custom letters are now in use for the footer watermark only (`StudioWord.tsx`); the sheet lacks H and I.
- Rajat said the cube gather is "perfect ... just a little slowed"; unclear whether he wants it slower or finds it slow. Ask before touching the timing.

- "Let's create" (`WhatsNext.tsx`) rebuilt as the pencil sheet: grid overlapping Selected Work, scroll-drawn continuous line with a line-figure, three parallax layers with idle drift. See CHANGELOG 2026-09-20. Waiting on Rajat's review of the drawing's composition and the figure. Tags/waveform/watermark removed on his "plenty" note; easy to restore from git if wanted.

## Session Log: 2026-09-19

- Rajat's two notes on the hand-off: the zoom-to-tunnel was "not seamless" with "a glitch that keeps happening", and the array's turn into an angled jumble should go; the box should form out of the head-on tunnel view. Both done, see CHANGELOG 2026-09-19 and decisions.md.
- Glitch causes found and fixed: black studio walls through the gap (backdrop now clipped with the canvas), black tripod/floor behind the mark's rounded corners (studio ink washes to white inside the zoom), and hitching from an unbudgeted dpr 1.75 canvas on top of the hero's (now `budgetDpr`).
- `CubeAssembly.tsx` timeline now: run `0.006 to 0.5` (eased stop), gather `0.46 to 0.9` (centre, faces, edges, corners), settle `0.82 to 0.99`. No swing/squash constants remain.
- Verified with headless Brave (playwright-core in the scratchpad, not committed) at 1440x900 and 390x844; no page errors; `vite build` clean. Committed locally, **not pushed**.
- Later the same day, on Rajat's five-screenshot review: the zoom is now the paper panel growing and tilting over the studio (see CHANGELOG 2026-09-19 later); the wash is gone; tunnel cubes carry the mark's ink edges and lose them over section p 0.1 to 0.44. `hero/inkLines.ts` is the shared home of the ink line helpers.
- Night: on Rajat's next review (four crops): the boom rhombus replaces the cyc-face panel; rings are square/tight/untilted at the hand-off and flare out; the CSS clip is replaced by `cube/MarkOccluder.tsx` (depth-only mark at the hero's projection) with the white backdrop now a plane in the canvas. Shared geometry in `hero/logoGeometry.ts`.
- Late night, after five review rounds on the hand-off (see CHANGELOG 2026-09-19 night passes): boom rhombus slow and red-edged; rings 5 apart, no birth animation, run 28 units with the arrays spreading to `AV_R_EXIT` 5.2; gather as looping, tumbling flights with slots by quadrant; cubes off tone mapping (box now `#B3271C`). Rajat's standing note for this section: smoothness and finesse above all, nothing may pop.
- Still open, unchanged: section 2's text placement; the custom letters; Illusdoodle naming; the facade wall; the pencil hatch.

## Resume here (end of the 2026-09-17 night session)

Rajat stopped for the night and will pick this up next session. Nothing is mid-flight: the hand-off out of the hero is finished and verified.

- (Superseded 2026-09-20: pushed.) Push with `git -c http.postBuffer=524288000 push` once he approves the hand-off. Never commit `pnpm-lock.yaml`, the placeholder `pnpm-workspace.yaml` edit or `Studio.glb.orig-backup`.
- **First thing to do:** have him scroll the hand-off and say whether it is approved, then push.
- **Open, in the order he has raised them:** where section 2's text goes (copy is parked and unrendered in `cube/problemStates.ts`, he decides the layout); his custom letters as the site's display type (`../Assets/1red-custom-letters.svg`, parked, do not build with them unprompted); Illusdoodle vs "Illusdoodles"; the empty facade wall right of the hero door (he is ideating with friends, do not build unprompted); the pencil hatch texture and plane, still undecided.
- Read the tunnel session log below plus decisions.md before touching the hand-off again: four versions of it were rejected and the reasons are all recorded.

## Session Log: 2026-09-17 (tunnel)

- **Section 2's opening is a flythrough of a tunnel, not a scale-up.** 27 cubes sit four to a ring, one per corner of the frame, centred on the camera axis, which is exactly where the hero's zoom breaks through the "e". Ranks cycle, so the tunnel has no visible end. Timeline over the pinned scroll: full width from the first frame with the nearest ring on the corner-crossing depth (`AV_PHASE0`), so its blocks enter at the size of the "e" blocks; skin goes from flat logo red to red metal `0.02 to 0.12`; run `0.006 to 0.42` (fast at once, eased to a stop); turn `0.26 to 0.56` (yaw `AV_SWING`, tilt `AV_TILT`, depth to `AV_SQUASH`, mouth in to `AV_AP_TURN`, cubes start tumbling); build `0.56 to 0.90`; settle `0.82 to 0.99`. All `AV_*` constants live in `cube/CubeAssembly.tsx`.
- **Behind the mark, not over it.** While the mark is on screen the 3D layer is clipped to a cross the size of the gap between its blocks (`gapHalfFraction(HERO_FOV, the mark's 2.031-unit hole)` in `studioSequence.ts`, scaled by `GAP_SCALE` 1.03 because the slots are wider than the hole, and applied as a `clip-path` on a wrapper around the Canvas only). The clip lifts by itself at p 0.017, which is when the cross covers the frame and the mark's blocks have left it. The reveal begins before the section pins: the canvas is not viewport-aligned until then, so the frame is shifted up by `camera.setViewOffset` and the cross is centred on the viewport rather than on the element.
- Section 2 is 490vh (was 360vh). Tilts mirror per corner and radius jitter is per ring, so the tunnel is symmetric about the gap; measured centre of mass is within 0.5% of the frame centre at the hand-off.
- Verified with Playwright and Brave: 12 scroll positions at 1440x900, 9 at 390x844, plus sweeps across the hand-off itself with the glide settled at each stop. No console errors, `vite build` clean. Frame times at 2560x1340 with dpr 2: 60fps median through the hand-off, the tunnel, the turn and the build, p95 33ms. The first run after any code change is not a measurement: shader compile and the env-map PMREM on a cold canvas read as 15fps and cleared completely on a re-run.
- Colours at the hand-off, measured with the hero's canvas hidden so only the tunnel's pixels are read: blocks `#F40013` against the mark's `#FF0000` faces and `#C40000` sides. End state `#A0000C`, unchanged.
- A `vite build` passing says nothing about whether the page runs. A derived constant declared above its input (`AV_CORNER_Z` above `AV_R`) built clean and crashed the page blank on a temporal-dead-zone error. Probe the live page for `pageerror` after touching module-level constants.
- An earlier pass built this as two ground-level rows flanking the path; rejected by Rajat as "a caterpillar randomly hovering on screen". See decisions.md.
- **Open:** still section 2's text placement (copy parked in `problemStates.ts`), the custom letters, the Illusdoodle naming. Not pushed to Vercel: local commits only.

## Session Log: 2026-09-17 (later)

- Hero and section 2 now read one eased scroll position (`src/app/components/scrollGlide.ts`); hero has a 100vh pinned tail (`TAIL_VH`). Section 2 overlaps the hero from `HANDOFF_P` 0.945, so cubes come out of the "e" with no white screen. Cube build is collision-free (OBB sweep: zero overlaps).
- Every button/CTA uses `.btn-corners` (nav pill corner, smooth superellipse).
- Selected Work: heading in the left column with the list; visual spans headline top to last-row underline.
- Yui video replaced; Illusdoodle cover image added; favicon renamed to `public/1red-favicon.svg` (red light / white dark).
- **Deployed:** pushed to `main` (latest `ce5cc8d`), live at https://1red.vercel.app. Push with `git -c http.postBuffer=524288000 push` (plain push gets HTTP 400). Never commit `pnpm-lock.yaml`, the placeholder `pnpm-workspace.yaml` edit or `Studio.glb.orig-backup`.
- **Open:** section 2 text placement (copy parked in `problemStates.ts`); Rajat's custom letters (`../Assets/1red-custom-letters.svg`) to become the site's display type later; the Illusdoodle vs Illusdoodles name question.
- Verification now uses Playwright driving Brave (`/Applications/Brave Browser.app/...`), not Google Chrome, per Rajat.

## Session Log: 2026-09-17 (morning)

- Fallen stand (`Studio_Setup_Tripod_6`) removed from the hero studio at load.
- Section 2 (`src/app/components/cube/`) rebuilt as a text-free cube assembly: `ProblemCube.tsx` pins 320vh and feeds scroll progress to `CubeAssembly.tsx` (27 instanced cubes). Timeline: appear 0 to 0.1, gather 0.1 to 0.8 (centre cube first, corners last), group spin settles to the rest angle over 0.66 to 0.94. Reduced motion shows the finished box unpinned.
- **Open:** where the section's text goes. The copy (`PROBLEM_STATES`, `RESOLUTION`) is still in `problemStates.ts`, currently unrendered. Rajat will decide the text layout next.
- Verified with Playwright + system Chrome at 1440x900 and 390x844 across the scroll; no console errors; `vite build` clean.
- Dev server is currently run with `--host` (LAN URL `http://192.168.0.185:5173/`) because the only claude-in-chrome browser connected is a Windows machine on the LAN.

## End of session: 2026-09-16 (night)

Hero state at shutdown, in scroll order:
1. Angled establishing shot.
2. Sectional door: panels rise and vanish at the header line.
3. Dark studio with pencil-outlined lamps aimed a little into the room; emitters glow white.
4. Push in; lamps swing to the mark; room glows, then the lights ramp on to white.
5. The 3D "1red" mark (public/1red-logo.svg) turns once.
6. Seamless zoom through the "e" gap into white, then ProblemCube.

Perf fixed for the 5K iMac (pixel budget, on-demand rendering, simplified glb). Beams exist but are OFF (`LAMP_BEAMS`). Build clean. Nothing committed to git this session.

**Resume tomorrow morning.** Open items:
- What fills the empty facade wall right of the door: Rajat is ideating with friends.
- Keep or remove the pencil hatch texture and plane: Rajat is undecided.
- Nothing mid-flight.

## Session Log — 2026-09-16

- The ONLY working copy is this folder; `../1Red-Website` and `../1Red-Website-New` were deleted (~2026-09-14, confirmed by Rajat). The open question below about porting the door-video hero is moot.
- Hero (`src/app/components/hero/`) is now: cream hatched facade + triangular doorway with solid-ink reveal → sectional garage door (high-lift) → camera pushes into a pitch-dark pencil-styled Studio.glb → lights snap on at p 0.706 (white flash) → 3D mark (from 1red-logo.svg) turns once (0.73–0.86) → squares up (0.85–0.89) → scales through the "r" counter into white (0.89–0.995) → white veil hands off to ProblemCube. `SCROLL_VH = 600`. All timings live in `studioSequence.ts`.
- Verified via Playwright + system Chrome screenshots at each beat; full-hero scroll 301 frames / 0 slow; `npm run build` clean.
- Later 2026-09-16 (after a power cut): 3D mark switched to Rajat's real vector `public/1red-logo.svg` (zoom through the "e" gap). Favicon replaced with the "1" glyph (dark-mode white). Whole floor black. Room glows from p 0.56, full lights at 0.706. Studio.glb rebuilt with per-rig control; lamp heads turn from the viewer to the mark over p 0.66–0.82. Build clean; full-hero scroll 301/0 slow.
- Frames removed from the facade. **Open:** what fills the empty wall to the right of the door — Rajat is ideating with friends; don't build anything there unprompted.

## Session Log — 2026-09-14

- This folder (`1Red-Website-Live`) is a **fresh clone** of `origin/main` (commit `9429398`, "Rebuild homepage narrative: studio entrance, problem cube, proof section"), made because the previously-used local copy (`../1Red-Website-New/`) had diverged: it holds an unpushed commit (`15aac5f`, the scroll-scrubbed door-sequence hero rebuild, see that folder's own `.claude/decisions.md`) that never reached GitHub, while GitHub moved on with different homepage work in the meantime. `1Red-Website-New` was left untouched — nothing deleted. **Open question for Rajat: does the door-sequence hero need porting into this version, or is GitHub's current homepage the new source of truth?**
- Everything below this point in the file (pre-2026-08-31 notes) describes an **older commit** than what's actually checked out here (that snapshot predates the homepage narrative rebuild) — treat the code itself as authoritative over this doc until it's re-audited.
- Confirmed running locally: `npm install` + `npm run dev` → Vite on `http://localhost:5173/` (HTTP 200 verified).
- Security pass: `npm audit` found 1 high-severity vuln (react-router — vendored turbo-stream RCE + several XSS/DoS advisories). Fixed via `npm audit fix --force` (react-router → 7.18.3, vite → 6.4.3, outside stated ranges but no route/behavior regressions observed on reload). `npm audit` now clean (0 vulnerabilities). No secrets/API keys/tokens found in source; no `.env` files present; `.gitignore` already correctly excludes `.env*` and business-sensitive `project-files/`.

## Completed

- **Local dev setup** — repo runs via `npm run dev` (Vite). No git repository exists in this project.
- **Hero** (`Hero.tsx`) — plain, static `Logo` component with a simple fade-in/idle-bob entrance. A scroll-driven "logo constructs itself block by block" animation was built, found to have a real fill-rule geometry bug (see `decisions.md`), and then **fully reverted** on request — do not assume any block-construction logic still exists here.
- **Homepage 3D cube environment** (`ThreeEnvironment.tsx`) — scroll-driven single-cube showcase stepping through all 5 projects in `data/projects.json`, one face per project (4 real video textures + 2 canvas-drawn poster faces), draggable, clickable-per-face (navigates to `/work/:slug`), paired with `ProjectHUD.tsx` for the bottom-left detail card + progress ticks. All peripheral decorative geometry (floating boxes, a moving "red signal" marker) was built, then explicitly removed — the cube is now the sole 3D object in this scene.
- **Homepage "Work That Moves Brands Forward"** (`FlashWork.tsx`) — went through several redesign passes; current state is a flush-then-gapped-then-flush... **final state: individually floating glass cards with real gaps** (not edge-to-edge), rounded ~22px corners, flat/neutral translucent glass (explicitly NOT tinted with a painted-on gradient — the color you see is the page's own background gradient showing through), grain texture overlay, atmospheric red/coral background gradient that fades to white at both the top and bottom section edges.
- **Floating Navigation** (`Navigation.tsx`) — redesigned from a conventional top navbar into two independent floating glass islands (logo top-left, segmented nav top-right), with a magnetic sliding indicator (Framer Motion `layoutId` shared-element) that follows hover and falls back to the active route, scroll-direction-aware compact/expand behavior, and a mobile compact-trigger + expandable-panel pattern. No red corner-square decoration (was tried, then removed per request).
- **`/work` — "Ideas Built Into Experiences"** — a pinned box-assembly grid (5 projects) using the site's established scroll-pin pattern.
- **`/work` — "How We Build Great Work"** (inside `Work.tsx`) — redesigned from a static two-column (heading left / stacked cards right) layout into a pinned, scroll-driven story on desktop: an anchored left column (heading + a vertical progress rail with a red fill line and per-stage dots) alongside a single fixed-size right-side card slot that materializes each process stage (Discovery → Strategy → Design → Production → Launch & Growth — all 5 existing stages kept) as the user scrolls. Mobile/tablet and `prefers-reduced-motion` fall back to the original simple stacked-card list (no pin).
- **`/services` 3D environment** (`ServicesEnvironment.tsx`) — floating wireframe service-card modules with an HTML label overlay and dynamic collision-avoidance (label repulsion). Went through a polish pass (wider/better-spaced labels, upgraded glass surface on the labels) plus an attempted enhancement (red particle field + architectural "pedestal leg" wireframe geometry under each card) that was **explicitly reverted** after the project owner said it looked terrible — current state is plain box + edges wireframes only, improved label spacing/glass retained. A real reduced-motion positioning bug (`position: static` breaking absolutely-positioned children) was found and fixed here; the fix pattern (`position: relative` instead) is now documented in `architecture.md` for reuse elsewhere.
- **Behance case-study embed** — integrated into `Work.tsx`'s `CaseStudyDrawer` for the Yui project specifically (`behanceId: '254011223'`).
- **This memory vault system** — `CLAUDE.md` + `.claude/{project-memory,design-system,architecture,current-state,decisions}.md`, created this session.

## Currently Working

Nothing mid-flight as of this writing.

## Next Tasks

None queued as of this writing — awaiting further direction from the project owner.

## Known Bugs

None currently known/open. (One reduced-motion positioning bug was found and fixed in `ServicesEnvironment.tsx` this project — see `decisions.md`. Always re-verify reduced-motion behavior on any section using the shared pinned-scroll pattern, since the same `position: static` mistake could exist elsewhere and hasn't been exhaustively audited across every section.)

## Known UX Issues

None currently flagged as open.

## Known Animation Issues

None currently flagged as open.

## Files Recently Modified (most recent session)

- `src/app/components/ServicesEnvironment.tsx` — reverted the red-particle system and wireframe "pedestal leg"/floor-footprint geometry back out (kept the earlier label-spacing/glass polish).
- `CLAUDE.md`, `.claude/project-memory.md`, `.claude/design-system.md`, `.claude/architecture.md`, `.claude/current-state.md`, `.claude/decisions.md` — created.

## Important Assets

- `public/1red-logo.svg` — real vector logo (Rajat, 2026-09-16). `public/favicon.svg` — "1" glyph browser icon only.
- `Studio.glb.orig-backup` — the unoptimized source model; Studio.glb is rebuilt from it (see decisions.md).
- `src/imports/Screenshot_2026-07-03_at_1.17.51_PM.png` — the raster source `Logo.tsx` actually renders (via a `feColorMatrix` alpha-extraction filter). This is the **actively used** logo asset, not the SVG.
- `src/app/data/projects.json` — 5 projects, used by the homepage cube + `ProjectHUD` only.
- `public/videos/*.mp4` — real project preview footage, non-uniform aspect ratios (see `project-memory.md`).
- `public/models/OneRed_3DCube.glb` — provided but currently unused (see `project-memory.md` for why).
- Root `ab6c7e15-d42e-4a80-a077-6614c63a4198` — the apple-design glassmorphism reference archive (see `project-memory.md`).

## Do Not Touch

- Any section not named in the current task.
- The OneRed logo's geometry/color.
- The established scroll-progress pattern (reuse it; don't build a second one).
- `Guidelines.md` in `/guidelines/` — still the default unfilled template; leave it unless the project owner asks to fill it in.
