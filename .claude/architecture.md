# OneRed Studio — Architecture

## Stack (verified via `package.json`, `vite.config.ts`, `vercel.json`)

- Vite 6.3.5, no `tsconfig.json` (esbuild transpiles without full type-checking — TS shape errors will not fail the build).
- React 18.3.1 + `react-dom` 18.3.1.
- `react-router` 7.13.0, imported from the bare `react-router` package (not `react-router-dom`).
- `motion` 12.23.24, imported as `motion/react` — the **only** animation library. No GSAP, no Lenis.
- `three` ^0.185.1 + `@react-three/fiber` ^8.18.0 — pinned to fiber v8 specifically for React 18 compatibility (v9 needs React 19).
- Tailwind CSS 4.1.12 via `@tailwindcss/vite`, mixed with heavy inline `style={{}}` usage.
- Deployed on Vercel; build command `npm run build` → `dist/`.

## Routing

```
/               → HomePage
/work           → WorkPage
/work/:slug     → WorkDetailPage
/services       → ServicesPage
/studio         → StudioPage
/privacy        → PrivacyPage
```

All routes render inside `Layout` (`src/app/components/Layout.tsx`): `ScrollToTop` + `CustomCursor` + `Navigation` + `<Outlet/>` + `Footer`. `Navigation` and `Footer` are therefore present on every page — never duplicate them inside a page-level component.

## Folder layout

```
src/
  app/
    App.tsx              — RouterProvider wrapper
    routes.tsx            — route table
    components/           — flat list of section/feature components
      ui/                  — inherited shadcn/ui-style primitives (extent of actual use: unverified)
      figma/               — ImageWithFallback.tsx, inherited from Figma Make export
    pages/                 — one thin wrapper per route
    data/
      projects.json        — data source for the homepage 3D cube + its HUD only
  styles/                  — fonts.css, globals.css, index.css, tailwind.css, theme.css
  imports/                 — raw exported assets from the original Figma Make export (raster logo screenshot, etc.)
public/
  favicon.svg              — vector logo source (see design-system.md)
  models/OneRed_3DCube.glb — provided cube asset, currently unused in code
  videos/                  — real project preview videos, varying native aspect ratios
```

Component files are not organized into subfolders by feature — everything under `src/app/components/` is flat. When looking for "the component that renders X," search by the visible text/heading first (e.g. `grep -rl "How We Build"`), not by guessing a filename — several sections' code names don't match their displayed heading (e.g. the "How We Build Great Work" process section lives inside `Work.tsx`, not a separate file).

## The established scroll-progress pattern (reuse this, don't reinvent it)

This exact shape appears in `Hero.tsx` (historically), `ThreeEnvironment.tsx`, `ServicesEnvironment.tsx`, `FlashWork.tsx`, and `Work.tsx` (twice — once for the idea-box grid, once for the process story):

```tsx
const wrapRef = useRef<HTMLDivElement>(null);
const rawProgress = useMotionValue(0);
const smoothProgress = useSpring(rawProgress, { stiffness: ..., damping: ..., mass: ... });
const reduceMotion = useReducedMotion() ?? false;

useEffect(() => {
  if (reduceMotion) { rawProgress.set(1 /* or a fixed resting value */); return; }
  let rafId: number;
  const update = () => {
    const el = wrapRef.current;
    if (!el) return;
    const scrollable = el.offsetHeight - window.innerHeight;
    if (scrollable <= 0) { rawProgress.set(1); return; }
    const top = el.getBoundingClientRect().top;
    rawProgress.set(Math.max(0, Math.min(1, -top / scrollable)));
  };
  const onScroll = () => { cancelAnimationFrame(rafId); rafId = requestAnimationFrame(update); };
  window.addEventListener('scroll', onScroll, { passive: true });
  update();
  return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(rafId); };
}, [reduceMotion, rawProgress]);
```

Markup shape:

```tsx
<div ref={wrapRef} style={{ height: reduceMotion ? '100vh' : 'Nvh', position: reduceMotion ? 'relative' : 'relative' }}>
  <div style={{ position: reduceMotion ? 'relative' : 'sticky', top: 0, height: '100vh', overflow: 'hidden' }}>
    {/* pinned content, driven by smoothProgress */}
  </div>
</div>
```

**Use `position: relative` under reduced motion for the inner sticky element, not `static`** — a `static` parent breaks `position: absolute` children (they escape to the document root). This was a real bug, found and fixed once in `ServicesEnvironment.tsx`; the pattern above already has the fix baked in.

When a discrete "active stage index" is needed on top of the continuous progress (e.g. which process step, which project cube face), compute it from the **raw** (not spring-smoothed) progress inside the same scroll handler, and only call `setState` when the computed index actually changes (guard with a `lastIndexRef`). This keeps state updates to a handful per scroll journey instead of 60/second.

## 3D scenes (React Three Fiber)

Two independent 3D scenes exist, each with its own isolated `<Canvas>` — they never share R3F context:

1. **Homepage cube environment** (`ThreeEnvironment.tsx`) — a scroll-driven showcase that steps a single large cube through 5 projects (from `data/projects.json`), one face per project, with real video textures on 4 faces and canvas-drawn poster textures on the other 2 (one project has no video asset; the 6th face is a "1Red — All Projects" brand face). Draggable, clickable per-face (navigates to `/work/:slug`). No peripheral decorative geometry — an earlier version had floating peripheral boxes and a moving "red signal" marker; both were explicitly removed on request ("get rid of every other cube").
2. **Services 3D environment** (`ServicesEnvironment.tsx`) — floating wireframe box modules (one per service) positioned via a screen-fraction-to-world-space conversion (`screenToWorld()`) so the composition holds across viewports, with an HTML overlay label layer synced to each box's projected screen position every frame. Includes a dynamic label-repulsion system (minimum-translation-vector collision avoidance) so an expanded/active label never overlaps a neighbor. **Desktop/tablet only** — mobile never mounts the `<Canvas>` at all (a `matchMedia` JS check, not CSS `hidden`, decides which branch renders, so the WebGL context is never even created on mobile). As of this writing, the wireframe modules are plain box + edges geometry only — a particle system and "pedestal leg" geometry were tried and explicitly reverted (see `decisions.md`).

Video textures for both scenes use `THREE.LinearFilter` (no mipmaps) for sharpness, and where videos have non-square native aspect ratios, explicit "cover"-style UV cropping (`texture.repeat`/`texture.offset` computed from the video's real `videoWidth`/`videoHeight` once metadata loads) to avoid visible stretching.

## Testing/verification methodology used throughout this project

No automated test suite exists. Verification has consistently been done via ad-hoc Playwright scripts run from a scratchpad directory (never committed to the repo), taking real screenshots and checking `console` for errors before considering a task done. Known Playwright gotchas specific to this codebase, worth remembering if writing verification scripts again:

- `page.goto()` does a full reload, resetting any module-level JS caches (e.g. video texture caching) — use real link clicks for SPA navigation tests instead.
- Continuously-transformed (motion-value-driven) elements can fail Playwright's actionability checks on `locator.click()` — use `page.mouse.click(x, y)` with pre-computed coordinates instead.
- Desktop/mobile duplicate DOM nodes (one hidden via `display:none` at the current breakpoint, matching Tailwind's `hidden lg:block` pattern) can cause `getByText(...).first()` to match the *wrong*, zero-size element. Filter by `getBoundingClientRect().width > 0` or target the specific visible one directly.
