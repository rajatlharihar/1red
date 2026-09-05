# Changelog

All notable changes to the OneRed Studio website, in reverse-chronological order.

**Provenance note:** this project has no git repository, so there is no commit history to generate this from. Entries below are reconstructed from the project's own conversation history and cross-checked against real file-modification timestamps on disk. Where multiple features landed on the same calendar day, they're listed together under that date without a reliable finer-grained order — filesystem timestamps only capture the *last* edit to a file, not every intermediate change made to it. Nothing below is invented; anything not verifiable was left out rather than guessed. See `.claude/decisions.md` for the reasoning behind specific decisions, not just what changed.

---

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
