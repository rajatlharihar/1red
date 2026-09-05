# Current State

## Last Updated
2026-08-31

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

- `public/favicon.svg` — verified pixel-perfect vector logo source (see `design-system.md`).
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
