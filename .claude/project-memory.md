# OneRed Studio — Project Memory

## What this is

**1Red Studio** ("OneRed") is a creative-agency marketing website — branding, web design, motion graphics, UI/UX, social media, creative strategy. This repo was originally exported from Figma Make (no working local dev setup, no version control) and has since been built into a fully functional Vite + React + TypeScript site through a long series of iterative feature/redesign requests.

**There is no git repository in this project.** Confirmed by direct check — `git status` fails with "not a git repository." Do not assume commit history exists anywhere. Do not rely on `git log`/`git blame` for context; this memory vault is the only persistent record.

## Purpose of the website

A portfolio + lead-generation site for a small creative studio. It needs to look premium, interactive, and "expensive" (the founder repeatedly emphasizes this) to compete visually with agencies far larger than the actual team, while staying honest about the (relatively small) team and real project roster.

## Brand identity, in one paragraph

1Red is red (`#EA3323` for UI accents; the literal logo mark itself renders at pure `#ff0000`, pixel-verified — these are two intentionally distinct reds), white/light-dominant, boxy/geometric/pixel-block in construction (the logo itself is built from stacked rectangular units), and typographically confident (bold, tight tracking, sans-serif). The studio's own description of its aesthetic across many requests: **"boxy, minimal, premium, creative, digital, engineered — never a generic SaaS site, never a literal Apple clone, never dark glassmorphism, never a Web3/gamer aesthetic."**

## Design philosophy (as repeatedly stated by the project owner across sessions)

- **Restraint over spectacle.** Nearly every large redesign request in this project's history ends with some version of "do not overdesign" / "the biggest priority is restraint." When two options exist, pick the more restrained one.
- **Content always wins.** Decorative elements (particles, wireframes, gradients) must never compromise text readability or interaction. This has been stated explicitly and repeatedly.
- **Take interaction/pacing inspiration from reference sites (Apple, Active Theory, ParaPixel) without copying their visual identity.** The instruction pattern is always: "study how this feels, never how it looks."
- **1Red's own identity must always remain dominant**, even when explicitly blending in an external influence (e.g. "1Red × Apple glass").

## Visual language (see `design-system.md` for full detail)

Boxy/geometric forms, mostly-sharp corners with a documented shift toward slightly-larger radii (14–22px) specifically for "premium glass panel" card treatments introduced later in the project — both conventions currently coexist intentionally (see `design-system.md`).

## Current website structure (verified against `src/app/routes.tsx`)

Routes, all rendered inside a shared `Layout` (`Navigation` + `<Outlet/>` + `Footer`):

| Path | Page component | Contains |
|---|---|---|
| `/` | `HomePage` | Hero → homepage 3D cube environment → project detail HUD → "Work That Moves Brands Forward" glass grid → closing CTA |
| `/work` | `WorkPage` → renders `Work` component | "Ideas Built Into Experiences" pinned box-assembly grid + "How We Build Great Work" process section |
| `/work/:slug` | `WorkDetailPage` | Individual case study page |
| `/services` | `ServicesPage` → renders `Services` component | Heading + 3D floating service-card environment (desktop) / plain list (mobile) |
| `/studio` | `StudioPage` → `StudioProcess` | One composition: the process as a 3 × 3 print of red blocks with a hover caption strip (2026-09-20). No editorial copy. |
| `/privacy` | `PrivacyPage` | UNKNOWN / NEEDS VERIFICATION — not inspected in depth this session |

**Homepage section order** (from `src/app/pages/HomePage.tsx`, verified): `Hero` → `ThreeEnvironment` (the homepage 3D cube showcase, shares `activeIndex` state with `ProjectHUD`) → `ProjectHUD` → `FlashWork` → `WhatsNext`.

## Interaction philosophy

- One scroll-progress pattern is reused everywhere a "pinned" scroll sequence exists (see `architecture.md` for the exact code shape). Do not invent a second pattern.
- `motion/react` (a Framer Motion fork/package) is the **only** animation library in this project. There is **no GSAP** anywhere in `package.json` — despite several user requests saying "if GSAP is already used, use it," it is not; those instructions were correctly interpreted as "keep using `motion/react`, don't introduce a second library."
- `useReducedMotion()` from `motion/react` gates essentially every scroll-driven or continuous animation. The established convention: collapse pinned wrapper height to `auto`/`100vh`, set progress to a fixed resting value, skip continuous per-frame animation, but keep content fully visible and functional.

## Animation philosophy

Smooth, intentional, physical, "premium" — never bouncy, never random, never delayed for its own sake. GPU-friendly properties (`transform`, `opacity`) preferred throughout. React state updates during animation are deliberately minimized — most of this codebase drives animation through `motion` values / refs read inside `requestAnimationFrame` or R3F's `useFrame`, not `setState`, specifically to avoid re-renders on every scroll/frame tick.

## UX principles

- Never let a floating/fixed element (nav, HUD, particles, wireframes) cover content.
- Every redesign task in this project's history has been scoped tightly to one section; "do not touch other sections" is treated as a hard constraint, not a suggestion.
- When a visual reference image is provided, it is usually a reference for **layout/material**, not literal content — verify current code before assuming a described "problem" still exists (several past requests referenced stale/cached screenshots).

## Technical stack (verified via `package.json`)

- **Build tool:** Vite 6.3.5. No `tsconfig.json` — esbuild transpiles without full type-checking, so TypeScript shape mismatches do not block the build.
- **Framework:** React 18.3.1 + React DOM 18.3.1 (peer deps).
- **Routing:** `react-router` 7.13.0 (`createBrowserRouter`, imported from the bare `react-router` package, not `react-router-dom`).
- **Animation:** `motion` 12.23.24 (imported as `motion/react` throughout).
- **3D:** `three` ^0.185.1 + `@react-three/fiber` ^8.18.0 (chosen specifically for React 18 compatibility — v9 of `@react-three/fiber` requires React 19).
- **Styling:** Tailwind CSS 4.1.12 (via `@tailwindcss/vite`) mixed heavily with inline `style={{}}` objects — this codebase does NOT centralize design tokens in CSS variables or a Tailwind theme; colors like `#EA3323` are redeclared as a local `const RED` in nearly every component file. This is a real, verified architectural characteristic, not an oversight to "fix" unprompted.
- **Icons:** `lucide-react`.
- **Deployment:** Vercel (`vercel.json` present: `npm run build` → `dist/`).
- Many other dependencies exist in `package.json` (Radix UI primitives, MUI, embla-carousel, etc.) that appear to be **leftover from the original Figma Make export** and are not confirmed to be in active use anywhere in `src/app`. Do not assume they're wired up; verify before relying on any of them.

## Important repository folders

- `src/app/components/` — all section/feature components (flat, not deeply nested).
- `src/app/components/ui/` — a large shadcn/ui-style primitive library, inherited from the Figma Make export. UNKNOWN / NEEDS VERIFICATION how much of this is actually used by `src/app/components/*` vs. dead weight.
- `src/app/pages/` — one file per route, mostly thin wrappers around the real section components.
- `src/app/data/projects.json` — shared project data source used by the homepage 3D cube (`ThreeEnvironment.tsx`) and its HUD (`ProjectHUD.tsx`). **Not** the same data as the `projects` array hardcoded inside `Work.tsx` or the `services`/`process` arrays inside `Services.tsx`/`Work.tsx` — those are separate, independently-maintained arrays with overlapping but not identical content. This duplication is real and current; do not assume a single source of truth for "project" data across the site.
- `public/videos/` — real project preview videos (`apptile-logomotion.mp4`, `terrabarn-socials.mp4`, `ground-logo.mp4`, `reservation.mp4`, `app-showcase.mp4`). These have **different native aspect ratios** (verified: 0.56, 0.8, 1.78, 1.0-ish) — any code mapping them onto square/uniform surfaces needs explicit "cover" UV cropping or they'll visibly stretch.
- `public/models/OneRed_3DCube.glb` — a provided 3D cube asset. **Currently unused in code.** It was integrated once, then replaced with a plain `THREE.BoxGeometry` when a later request needed per-face video textures — the GLB only defines 2 material groups internally (verified by parsing its binary), not 6, so it can't carry 6 independent videos. The file is left on disk but nothing imports it as of this writing. If a future task wants to reintroduce the literal GLB, this limitation must be solved first (re-export the model with 6 material slots, or accept fewer distinct textures).
- `public/1red-logo.svg` — the real vector of the "1red" logo mark, supplied by Rajat (2026-09-16). Use this for any task that constructs/animates the logo geometrically. `public/favicon.svg` is only the "1" glyph (browser icon); the earlier claim that it was the full verified mark was wrong.
- Root-level stray files worth knowing about:
  - `ab6c7e15-d42e-4a80-a077-6614c63a4198` — a ZIP archive (no file extension) containing a snapshot of Anthropic's public "skills" repository. It was provided as a reference for Apple-style glassmorphism; the relevant file inside is `skills-main/skills/apple-design/SKILL.md`, a distillation of Apple's WWDC design-motion principles (spring physics, materials/depth, typography). Several glass-surface implementations in this project (`backdrop-filter: blur(20px) saturate(180%)`, spring-based hover transitions) are directly derived from that file's own code samples. It is documentation, not a runnable asset.
  - `guidelines/Guidelines.md` — still the default, unfilled Figma Make template. Not yet customized by the project owner.
  - `skills/` (root-level, empty) — UNKNOWN / NEEDS VERIFICATION what this was for; empty at time of writing.

## Current implementation status

See `.claude/current-state.md` for the living, frequently-updated snapshot. As of this writing: Hero, homepage 3D cube environment, homepage "Work That Moves Brands Forward" grid, the floating Navigation, `/work`'s "Ideas Built Into Experiences" and "How We Build Great Work" sections, and `/services`'s 3D card environment have all been through at least one significant redesign pass this project. `/studio` and `/privacy` have not been touched or inspected in this session.

## Things Claude MUST NOT change without being explicitly asked

- The OneRed logo's geometry, proportions, or color (see `design-system.md`).
- Any section not named in the current task's instructions — this has been an explicit, repeated hard rule across nearly every redesign request in this project's history.
- The core scroll-progress architecture pattern (see `architecture.md`) — multiple past bugs came from inventing a second, competing pattern instead of reusing the established one.
- `motion/react` as the sole animation library — do not introduce GSAP, Lenis, or any other animation/scroll library.

## Things that were being worked on when this memory vault was created

Nothing is mid-flight as of this writing — the immediately preceding task (reverting a particle system and "stand"-style wireframe legs from the `/services` 3D environment after the project owner disliked the visual result) was completed and verified before this memory vault was built. See `current-state.md` for the exact state.
