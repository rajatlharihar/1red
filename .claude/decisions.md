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
