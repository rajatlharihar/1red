# OneRed Studio — Design System

## Color tokens (verified: not centralized — copy-pasted per component)

There is **no shared token file**. Every component that needs these colors redeclares them as local `const`s. When editing, match the existing values exactly rather than introducing a new shade:

| Token | Value | Where it's used | Notes |
|---|---|---|---|
| `RED` | `#EA3323` | UI accents everywhere — buttons, active states, borders, hover indicators | The site's "brand red" for interface chrome |
| Logo red | `#ff0000` (literal `red` in SVG) | Only the actual "1red" logo mark (`Logo.tsx`, `public/1red-logo.svg`, favicon) | Verified via pixel-sampling to be a **different, more saturated red** than `RED` — this is intentional, not a bug. Never "fix" this by matching them. |
| `INK` | `#0a0a0a` | Primary text, wireframe lines, dark UI elements | |
| `LINE` | `rgba(0,0,0,0.1)` | Hairline borders/dividers | |
| Cream/warm-white tints | e.g. `#F5F2EC`, `rgba(255,253,251,0.74)` | Glass surfaces, atmospheric gradients | Introduced later in the project specifically to keep glass "warm" rather than clinically neutral white |

**No dark backgrounds anywhere.** This has been stated as an explicit, repeated hard rule for every glassmorphism-related task: no black, no charcoal, no dark navy, no dark purple, no dark grey backgrounds. The site is light-dominant by identity.

## Typography

- **Sans (primary, used everywhere):** `Outfit` (weights 300–700), loaded via Google Fonts in `src/styles/fonts.css`, referenced as `var(--font-sans)`.
- **Display:** `Abril Fatface`, declared as `var(--font-display)` in `fonts.css` — **verified NOT currently referenced anywhere in `src/app` components.** It's loaded but unused. Do not assume any heading is using it; check before touching typography that "looks like" a display face.
- Headings: bold weight (600–800), tight/negative letter-spacing (roughly `-0.02em` to `-0.04em` depending on size), often revealed with a `y: '110%' → 0` mask-reveal inside an `overflow:hidden` wrapper.
- Body/supporting text: lower opacity (typically `0.4–0.6`) rather than a lighter color value — this is the established way to create secondary-text hierarchy in this codebase (opacity, not `color`).

## Boxy / geometric identity

The base convention across the original build is **`borderRadius: 3`** — sharp, "engineered" corners, explicitly established as the site's core "1Red box" identity early in the project (superseding an earlier, rejected pill/rounded-button look).

**This has since evolved, intentionally, for glass-card treatments.** Later redesigns (the homepage "Work That Moves Brands Forward" grid, the floating Navigation islands, the `/work` process story cards, the `/services` labels) use a noticeably larger radius — typically **14–22px** — because a literal 3px radius read as "flat rectangle," not "floating glass object/panel," once translucency and depth were introduced. **Both conventions currently coexist on purpose**: sharp `3px` for flush/edge-to-edge structural grids, larger radii for individually-floating glass surfaces. When starting new work, check which pattern the specific section already uses rather than assuming one universal radius.

**Buttons and CTAs (2026-09-17, Rajat):** every button, CTA and clickable chip uses the nav's active-pill corner via the shared `.btn-corners` class (`src/styles/theme.css`): a smooth iOS-style curve, `border-radius: 14px; corner-shape: superellipse(1.4)` where `corner-shape` is supported, plain `10px` elsewhere. Never set an inline `borderRadius` on a button (inline wins over the class). This replaces the old 3px CTA corner; cards, tags and structural grids keep their own radii.

Do not introduce fully rounded/pill shapes (`border-radius: 9999px` or similar) except where explicitly requested — pill shapes have been explicitly rejected multiple times as "too generic SaaS."

## Glassmorphism recipe (the "apple-design" reference recipe)

Derived from `skills-main/skills/apple-design/SKILL.md` inside the root-level `ab6c7e15-...` archive (see `project-memory.md`), and now the de facto standard glass treatment reused across the site:

```css
background: rgba(255,255,255,0.5–0.75);   /* varies by idle/hover state and how warm the tint should read */
backdrop-filter: blur(18–20px) saturate(165–180%);
border: 1px solid rgba(234,51,35,0.14–0.5);  /* red-tinted, not neutral grey — this is the "1Red accent as border" pattern */
box-shadow: 0 16-28px 40-56px rgba(234,51,35,0.06-0.16), 0 2-4px 8-16px rgba(0,0,0,0.03-0.07),
            inset 0 1px 0 rgba(255,255,255,0.55-0.85);  /* bright inset top edge = "light catching the material" */
```

Key rules learned from real mistakes made and corrected in this project:
- **Never paint an actual color gradient onto the glass itself** (e.g. `linear-gradient(135deg, white, red)` as the card's own background). This was tried once on the homepage grid and explicitly rejected — "the gradient shouldn't come on the cards." The correct approach: keep the card's own fill perfectly neutral/flat translucent white, and let the *page's* background gradient show through the blur. Any color variation across a card should come from what's behind it, never from the card's own paint.
- Glass card entrances should "materialize" (animate `filter: blur(6px) → 0` alongside opacity/position), not just cross-fade — this reads as "arriving material" rather than a flat opacity tween, per the apple-design reference's own explicit guidance.
- Hover/interaction transitions on glass elements should generally use spring physics (`{ type: 'spring', bounce: 0, duration: 0.4 }` in `motion/react`), not fixed-duration CSS-style eases — this was a deliberate, explicit upgrade made to the floating Navigation for "smoothest possible" motion.

## The OneRed logo — hard rule, not a suggestion

**The logo must never be redesigned, redrawn, distorted, or approximated with fonts/CSS shapes.** This has been stated as an absolute rule multiple times across this project's history, including after a specific incident where a scroll-driven "logo construction" animation accidentally introduced a real geometry bug (splitting a single SVG `<path>` that combined the "R," its counter-hole, and the "E" into one fill-rule-dependent unit — splitting it broke the negative space and made the mark look like unrelated blocky typography, not the actual logo). The eventual fix was reverted entirely per a later request; **the Hero section currently uses the plain, non-animated `Logo` component with a simple fade-in** — there is no scroll-driven logo construction in the codebase as of this writing.

Two logo-related assets exist and must not be confused:
- **`Logo.tsx`** (used in `Navigation.tsx` and `Footer.tsx`) — a raster PNG screenshot (`src/imports/Screenshot_2026-07-03_at_1.17.51_PM.png`) run through an SVG `feColorMatrix` filter that extracts "redness" as alpha, producing a transparent-background logo image. This is the actively-used, correct component. Takes a `width` prop (plain px number, not responsive via CSS).
- **`public/1red-logo.svg`** — the real vector of the full "1red" mark (18 blocks, 285 × 174), supplied by Rajat 2026-09-16; used by the hero's 3D mark. **`public/favicon.svg`** is only the "1" glyph (red; white under `prefers-color-scheme: dark`). The old claim that favicon.svg held the verified full mark was wrong — it contained a different, outdated "1RED" drawing. This is the asset to reach for if a future task genuinely needs to split/animate the logo's actual geometry — but per the hard rule above, only attempt this again if explicitly asked, and reuse the SVG's own subpath grouping (don't split subpaths that share a `<path>` element for fill-rule reasons — see the incident above).

## Interaction & motion conventions

- **Established scroll-progress pattern** (reused everywhere a pinned scroll sequence exists): a tall wrapper `<div style={{ height: 'N vh' }}>` containing an inner `<div style={{ position: 'sticky', top: 0, height: '100vh' }}>`, with progress computed via a passive `scroll` listener throttled through `requestAnimationFrame`, `progress = clamp(-rect.top / (wrapperHeight - viewportHeight), 0, 1)`. Progress is stored in a `useMotionValue`/plain ref — **never React state** — to avoid re-renders on every scroll tick. When a discrete "which stage is active" index is needed (not just a continuous 0–1 value), it's computed from the same progress and only written to React state when the index actually changes (typically a handful of times per scroll sequence, not 60×/second).
- `useReducedMotion()` gates all of the above. The convention: collapse the tall wrapper to `height: auto` or `100vh`, switch `position: sticky` to `position: relative` (not `static` — see the "known bug pattern" below), and set progress to a fixed resting value so content is fully visible immediately with no animation.
- **Known bug pattern, now fixed once, watch for it elsewhere:** switching a positioning-context parent to `position: static` under reduced motion breaks `position: absolute` children (they escape to the document root instead of staying contained). The fix is always `position: relative`, which keeps normal document flow *and* still contains absolutely-positioned children. This exact bug was found and fixed in `ServicesEnvironment.tsx`; check for the same pattern before assuming any other reduced-motion fallback is correct.
- Small red square/dot markers (`<span style={{width:6,height:6,background:RED}}/>` or similar) are a recurring, intentional brand-signature motif used next to section eyebrow labels across multiple sections (FlashWork, WhatsNext, the process section). This is a deliberate, reusable pattern — not an accident to "clean up."
- 3D particle/decorative-geometry systems are a **rejected direction** for the `/services` environment specifically: a red-particle field plus wireframe "support leg" geometry (making each floating card look like it sat on an architectural stand/pedestal) was built, then explicitly reverted after the project owner said it "looks terrible." Do not reintroduce either without being asked — the `/services` 3D environment should stay as plain floating wireframe boxes (box + edges only, no legs, no floor footprint markers, no particles) unless a future request says otherwise.
