# Current State

## Last Updated
2026-09-16

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
