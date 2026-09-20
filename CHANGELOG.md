# Changelog

All notable changes to the OneRed Studio website, in reverse-chronological order.

**Provenance note:** this project has no git repository, so there is no commit history to generate this from. Entries below are reconstructed from the project's own conversation history and cross-checked against real file-modification timestamps on disk. Where multiple features landed on the same calendar day, they're listed together under that date without a reliable finer-grained order — filesystem timestamps only capture the *last* edit to a file, not every intermediate change made to it. Nothing below is invented; anything not verifiable was left out rather than guessed. See `.claude/decisions.md` for the reasoning behind specific decisions, not just what changed.

---

## 2026-09-21 — round 5, R15

- **Bigger settled box** (`CubeAssembly.tsx`, `ProblemCube.tsx`): the camera backs off less (CAM_Z + 2.6, was + 4.5), shift 0.3, label at 81%; the box fills the band between headline and label, R10's layout kept.

## 2026-09-21 — round 5, R14

- **Selected Work** (`FlashWork.tsx`, `data/projects.json`): headline one weight down (700); order is now Apptile, Yui, Illusdoodle, Ground, Terrabarn (renumbered); the three Behance cases are attached to their existing entries rather than duplicated (`behanceId` on Apptile 202820463, Yui 254011223, Illusdoodle 246821657): the desktop panel gets a "View on Behance" link beside "View case study", and the phone list embeds each case (`BehanceEmbed`, iframe mounted only within 400 px of the viewport, with the link beneath).

## 2026-09-21 — fast-scroll fixes (Rajat, direct)

- **The grid's copy is there the moment it arrives** (`studio/ProcessSpace.tsx`): on a fast scroll the raw scroll left the pin while the glide was still catching up, so the frame unpinned and slid away under the arriving grid, cutting the text under the panels until the swap. The section now has an 80vh pinned tail like the home hero, the landing also counts when the raw scroll has left the pin, the stage copy is 140vh tall (scaled down in depth it ended short of the frame), and both copies swap by opacity so they stay rasterised and the reveal and the swap cost nothing on their frame. `Film` treats opacity as hidden too.
- **The team film holds longer** (`studio/TeamZoom.tsx`): 420vh pinned; full-bleed from p 0.42, hold to 0.86, words in over 0.34 to 0.5; the clip is on screen for about 185vh of scroll instead of 56.

## 2026-09-21 — scroll-back smoothness (Rajat, direct)

- **Our process and What we cover are smooth in both directions** (`studio/ProcessSpace.tsx`, `ServicesGrid.tsx`). Two causes on the way back up: (1) a passed panel was `visibility: hidden` and re-showing it near the lens cost a full re-raster, a 130 to 150 ms hitch at about 70% of the section; passed panels are now held at the fade-out depth at opacity 0 instead, so the layer only ever changes transform and opacity. (2) At the hand-off going backwards the stage copy's still films took over from the playing ones on their first frame, a visible jump; on that frame each still is now seeked to the frame its film is on (the film pauses there, hidden, and resumes from it when the page lands again); stage films preload `auto` so the seek has data. Reverse profile (headless Brave 1440x900 @2x): hand-off 16.7 ms median / 16.8 max, process 16.7 / 16.8 (was max 150), forward unchanged at 16.7 throughout.

## 2026-09-21 — round 4, R13

- **The card rises from below** (`studio/TeamTable.tsx`): after the camera passes through the team film, the card comes up from below the frame lying back 14°, and settles flat and centred over the section's first 30% on one ease-out; no toss, no bounce. Captions are thin italic (300) in the card's own lower margin, on its inner column edges (left at 9%, right at 15% clear of the index), one per stretch of the pan, quick eased swaps, the red closing line persisting. Odometer rank and the pan unchanged.

## 2026-09-21 — round 4, R12

- **/studio at 60 fps end to end.** Profiled the whole scroll (headless Brave, 1440x900 @2x, 40 px per frame) by zone. Before: process 16.7 ms median, then 33.3 ms median / 33.4 p95 from the process-to-grid hand-off on through the grid, the zoom into the team film, the hold and the table. Cause: six film decoders at the hand-off (the grid's three films in the stage copy AND the flow copy, both playing while hidden, since IntersectionObserver ignores visibility) plus a 5334x3000 team clip. After: 16.7 ms median, 16.8 p95 in every zone, both transitions included.
- Fixes: `ServicesGrid`'s `still` copy is now inert (films never play, first frame only, which is the frame the flow copy starts on at the swap); `Film` plays only when on screen AND visible (`checkVisibility`, re-checked on a slow tick, since the hand-off changes visibility without a scroll), preloads `auto` only for the playing copy; `Fg-01_3.mp4` transcoded 5334x3000 12 MB to 1920x1080 0.9 MB, `app-showcase.mp4` 40 MB to 3 MB, `terrabarn-socials.mp4` 22 MB to 2 MB (h264, faststart, no audio; originals in the session scratchpad, not in the repo); the team poster is fetched ahead.
- Panel numerals are solid fills, not strokes (Rajat, mid-session).

## 2026-09-21 — round 4, R11

- **Process heading and readable steps** (`studio/ProcessSpace.tsx`): the heading is two stacked words, "Our" over "process", no label, no rule. Each step's label, title and one-liner are set small in the sky colour ON its panel, on a 10% inner margin under the numeral, sized to the panel so they scale with it; the ink captions at the feet are gone. Every step reads during its own arrival.

## 2026-09-21 — round 4, R10

- **Cube end state to Rajat's layout** (`cube/ProblemCube.tsx`, `CubeAssembly.tsx`, after `.claude/refs/cube-end-state-layout-rajat.png`): a hairline across the upper third (28vh, 11% margins), then one band at 62vh: "Or hire / the whole box." flush-left at 500 weight, the box centre-right and smaller (camera backs off to CAM_Z + 4.5, shift 0.28 of the half-width), and "EVERY SKILL. / ONE COLLECTIVE." in 300 weight, uppercase, two lines, right of the box and centred on it. R6's label-on-cap-line and the grid layout are undone. Phone: rule 16vh, headline 30vh, box centred, label at 80vh.

## 2026-09-21 — round 3, R9

- **The card is tossed in** (`studio/TeamTable.tsx`): from off the frame's top right and 700 px deep it comes in with 42° of spin and a decaying X/Y tumble, lands centred and settles with a damped bounce (a decaying 2.4 Hz sine on spin, depth and lift), all on one ease-out curve over the section's first 30%. The lid-flip is gone. Card up to 84vw / 118vh.
- **Captions outside the card**, italic display type, one per stretch of the pan, each in a different corner of the frame (top-left, bottom-right, top-right, bottom-left, ...), quick eased swaps, the closing line in red persisting. The odometer rank stays.

## 2026-09-21 — round 3, R8

- **"What we cover" pared back** (`ServicesGrid.tsx`): the "Three disciplines. One team." label, the outlined numerals on the panels and the hairline column lines are gone (we do far more than three). Heading row, the three red panels with their films, and the ink copy beneath stay.

## 2026-09-21 — round 3, R7

- **Process scene rebuilt as the 3 x 3 grid with depth by number** (`studio/ProcessSpace.tsx`): nine slots seen head-on at the opening shot (each panel's world size and offset scaled by its own opening depth, so their projections line up as the print's grid), numbered panels at the print's stage slots with 01 nearest and 05 in the centre slot furthest, four blank red panels at half-step depths between; the camera goes straight in on the glide, so they arrive and pass in order, and 05 covers the frame for the arrival reveal as before. Figures, ladder on 04, dots and scribbles kept. Captions are sized to their panel, so they scale with it.
- **"Our process" heading row** over the opening shot (Swiss row: display headline, "How we work, in five steps" label on column 9, rule), leaving upward over p 0.05 to 0.16 as the first panel comes.
- **Numerals in Rajat's letters** (`studio/customDigits.ts`): digits 0 to 9 lifted from `Assets/1red-custom-letters.svg` by bounding box on the sheet's bottom row (verified by render: 0 1 2 3 4 5 6 7 8 9, then the two glyphs of "10"), drawn outlined in the sky colour on the red. Not Outfit.
- **Performance:** no filters on anything that moves: the roughened edges are static wobbly paths from a seeded PRNG (two passes as on the print); figures are plain paths; per frame only transforms and opacities change; nine groups in the DOM. Headless Brave at 1440x900 @2x scrolling through the section: before, run 1 median 66.6 ms / p95 133 ms / max 200 ms; after, median 33.3 / p95 33.4 / max 33.5 (run 0 both 16.7 / 33.3).

## 2026-09-21 — round 3, R6

- **Cube poster finesse** (`cube/ProblemCube.tsx`, `CubeAssembly.tsx`): the label sits on column 9 of the twelve, left-aligned on the headline's cap line, instead of floating right; headline 46 to 138 px at 7.8vw, leading 0.94, tracking −0.045em; the row gap between headline and rule opened to 18 to 36 px; the box settles a touch lower (`BOX_DROP_WIDE` 1.1). Material untouched: Rajat had called the box perfect.

## 2026-09-21 — round 2, R5

- **The card flips up** (`studio/TeamTable.tsx`): after the team hold the film keeps growing past the frame and thins out (`TeamZoom` EXIT_P 0.82, depth to −0.4P, opacity gone by p 1), and the card comes up from edge-on (rotateX 88°, lying away from the lens, 14vh low) to face-up over the section's first 26%, ease-out, in the perspective stage. No arrival from depth any more.
- **Fixed caption instead of words along the table:** a caption band on the card under the picture, one line per stretch of the pan, each swap a quick eased cut (0.22s opacity, 0.3s lift), so a fast scroll still lands on the closing line. Opening "Everyone you need, at one table."; seats "Web and UI/UX at this end." / "Brand, two seats down." / "2D and 3D, mid-table." / "Motion, right here." / "Ads, at the far end."; closing, in red, "Don't worry. The whole table's on it." The tabletop text is gone; the seat role labels in the picture stay.
- **Flipbook rank:** both corner indexes cycle 1 to 10, J Q K A and the four suits, one step per 36 px of glide travel while the page moves, and settle back to 1 when it stops (160 ms).

## 2026-09-21 — round 2, R4

- **"What we cover" as three red panels** (`ServicesGrid.tsx`): under the Swiss heading row, three tall red panels (1:1.35, two roughened passes like the process scene's) on the twelve-column grid, four columns each with hairlines between; each holds its film in a hairline window low on the red with the big outlined numeral in the sky colour over the top, and eyebrow, name, line and tags in ink beneath. One column on a phone. The anchor-plus-two layout is gone.

## 2026-09-21 — round 2, R3

- **The process scene is the red-panel print, stood up in space** (`studio/ProcessSpace.tsx` rebuilt; the white cards are gone). Rajat asked where the design went: it was `StudioProcess.tsx`, the 3x3 print built on 2026-09-20 from the same reference, which S1 had unmounted. Now: a pale room (sky `#F2EFE8`, one floor plane laid flat through the screen plane at 80% height, so the horizon sits at the lens's own height), five tall red panels (1:2.4, two roughened passes as on the print) standing on the floor 1200 px apart, alternating left/right; the camera steers onto each and brushes past it beside the axis (the red clears just before the lens; queued panels are drawn a little paler). Each panel carries a big outlined numeral in the sky colour; step label, title and one-liner stand in ink beside its foot. The print's ink figures (some walking in place), a ladder on 04, dots and a scribble on the ground at every panel, all in the stage so they recede with it. The ServicesGrid arrival is unchanged. Reduced motion mounts the print itself.

## 2026-09-21 — round 2, R2

- **Selected Work's intro continues the story** (`FlashWork.tsx`, heading only; the grid is untouched): "Here's what / the box built." flush-left at display weight, "Selected work" label on the right, one hairline rule drawing beneath, the same Swiss row as the cube poster. The generic paragraph is gone.

## 2026-09-21 — round 2, R1

- **/services removed** on Rajat's review: route, nav item, `ServicesPage.tsx`, `Services.tsx`, `ServicesStack.tsx` and the `OurProcess` flick carousel are gone (git history keeps them). The footer's service-tag links now go to /studio, where `ServicesGrid` ("What we cover") lives.

## 2026-09-20 (night) — S4 the table

- **/studio ends on the team card** (`studio/TeamTable.tsx`): a landscape playing card (cream, rounded, hairline, red "1 ◆" index in opposite corners) drawn as SVG after the 10-of-diamonds reference, arriving from depth (half size) and settling flat and centred by p 0.26 of a 400vh pin. Then its picture pans: the long table seen from above with ten seated figures, papers in the gaps, five seats captioned with the disciplines (Web & UI/UX, Brand, 2D & 3D, Motion, Ads), and the line written along the tabletop, "Don't worry. / The whole table's on it.", ending past the table's end on "Handled." in red; pan over p 0.3 to 0.94 on an eased curve, then a hold. On Rajat's note the picture is a pen sketch, not icons: every line is a seeded wobbly path (table hand-ruled and bowed, drawn twice; figures each a different size and lean with rough double-pass fills, an arm on the table for some; papers as rough tilted quads), under an feTurbulence displacement + slight blur filter so the ink breaks and bleeds; the type stays outside the filter. Reduced motion: the card static with the picture's start. `STUDIO_AFTER_TEAM` slot removed, the page is complete. This closes the 2026-09-20 scrollytelling brief (H1 to H3, S1 to S4).

## 2026-09-20 (night) — S3 into the team

- **The forward move closes on the team film** (`studio/TeamZoom.tsx`, mounted after the grid on /studio): `public/videos/Fg-01_3.mp4` (line-art team, the mark glitching on a shirt; confirmed by frame) starts as a 30%-of-frame hairline tile in a perspective stage, grows to full-bleed by section p 0.68 on an eased depth curve (tile size and frame size are one quantity), the hairline going as it becomes the frame, then holds; 280vh pinned. "our team" in the heading face, italic, large, off-centre left, rises out of its mask over p 0.5 to 0.72. Clip plays muted, looped, only while on screen; `public/images/team-poster.jpg` is its poster and the reduced-motion still. `StudioPage` exports `STUDIO_AFTER_TEAM`, the slot for S4.

## 2026-09-20 (night) — S2 what we cover on /studio

- **The camera's run-out lands on "What we cover"** (`ProcessSpace` takes an `arrival` node; `StudioPage` passes `<ServicesGrid still />`). The grid is drawn in the perspective stage behind every card, a little short of the screen plane (its depth is the camera's remaining run × `ARRIVAL_K` 0.087, so about 92% size when the last card clears) and settles onto the plane as the section unpins; on that frame the same grid in normal flow (`margin-top: -100vh`) takes over, pixel for pixel. It only becomes visible once the last card's projected size covers the frame both ways (`coverDepth`, measured from the card's real size, so a phone's taller card is handled), and every card's fill may only clear from behind that depth: what the clearing fill uncovers is never a switch. `ServicesGrid` gained `still` (no entrance motion, for a copy carried by the arrival). Reduced motion renders the grid after the list.
- S1 design pass (earlier commit): the step number is the card's graphic, an outlined red numeral at display scale top-left, with a "Step 01" label over the title; queued cards draw with a lighter hairline and 60% ink, ramping to full as they arrive.
- `StudioPage` exports `STUDIO_AFTER_SERVICES`, the id of the slot after the grid where S3 (the zoom into the team film) mounts.

## 2026-09-20 (night) — S1 process in depth

- **/studio opens with the process in 3D** (`studio/ProcessSpace.tsx`, mounted by `StudioPage.tsx`; `StudioProcess.tsx` stays on disk, unmounted). Five cards from `data/process.ts` stand along the camera axis 1200 px apart in a CSS `perspective` (1200 px) stage: type stays crisp, no canvas. Scroll on the shared glide moves the camera forward (700vh pinned, ~120vh per step). A waiting card sits 0.8 vw to the side in world units (alternating), which projects to 0.4 of the frame one step back so it shows past the current card, and eases to centre as it approaches (the camera steers onto it). A card spans 70% of the frame at the screen plane, then the camera passes through it: its white fill clears over depth −0.3P..−0.65P so the next card is seen through it, its edge and type go at −0.86P..−0.97P, and it is hidden just before the lens. Nearer cards stack over farther ones by z-index (a preserve-3d stage is not possible under overflow: hidden). After the fifth the camera runs on 1200 px into open space: `EXIT_P` is exported as S2's cue. Phone: 84vw 4:5 cards. Reduced motion: a plain list with rules.

## 2026-09-20 (night) — H3 what we cover

- **Services as a designed grid** (`ServicesGrid.tsx`, new, self-contained with its own data and optional heading row so it can be mounted on the Studio page for S2): twelve-column Swiss grid matching section 2's poster. Card 01 is the anchor, seven columns and both rows with its film on top; 02 and 03 share the five right columns, film beside copy; hairline rules divide cells, nothing boxed; one column with film first on a phone. Films play only while on screen. `Services.tsx` now mounts it with `heading={false}` under its own "Our Services" heading; the small label reads "What we cover". `ServicesStack.tsx` is no longer imported (kept on disk, in git if wanted).
- Third card is **"Ads, Campaigns & Motion"** (eyebrow "Performance & motion"): copy and tags now cover 2D and 3D animation, logo and brand motion, alongside the ad sets.

## 2026-09-20 (night) — H2 cube line

- **Section 2's end state is a Swiss poster** (`cube/ProblemCube.tsx`): headline "Or hire / the whole box." flush-left on eight of twelve columns at display size, label "Every skill. One collective." top-right in the site's small-caps label style, one hairline rule across the page under the headline. Lines and label rise out of masks on the existing `LINE_REVEAL` curve; the rule draws left to right over 0.88 to 0.99. Phone: headline full width, label under the rule.
- **The box settles bottom-right on wide frames** (`cube/CubeAssembly.tsx`): during the existing settle window the camera also slides left by `BOX_SHIFT` of the frame's half-width, rises `BOX_DROP_WIDE` and backs off 1.0, so the box lands under the rule beside the headline. Portrait keeps the old centred, closer settle. Gather timing untouched.

## 2026-09-20 (night) — H1 hero statement

- **"Still hiring five agencies for one job?" lettered on the facade** (`hero/wallStatement.ts`, drawn by `StudioScene`): a transparent canvas texture on a plane flush with the wall right of the door, uppercase Outfit 700, red "?". Placement is fitted at mount from the p = 0 camera: the largest type whose lines sit inside the frame's (rolled, oblique) footprint on the wall, each line starting a fixed 0.9 m right of the door rim at its own height, so the block leans with the jamb. Line breaks chosen by the fitter per aspect (three lines at 1440x900, six on a phone). It rides the wall through the establishing sweep and is out of frame by p 0.24; nothing fades. Hero timing, camera, door and mark untouched.
- Phone (portrait) fix after review: four lines only ("STILL HIRING / FIVE / AGENCIES / FOR ONE JOB?"), block kept above 1.9 m so it sits in the upper half, fills the strip's width and clears the door edge as the sweep begins.
- Scroll cue text is now "The answer is inside" (same motion curve).
- `FACADE_T`, `WALL_TAPER_*`, `facadeFrontZ()` and `doorRimX()` moved to / added in `studioSequence.ts` so the text and the geometry share one definition of the wall face.

## 2026-09-20 (later)

- **Services roster cut to three** (`Services.tsx`): Websites & UI/UX, Brand Identity, Ads & Campaigns. Creative Content and Motion & Film dropped on Rajat's call; their tags (Social Content, Reels, Brand Motion) fold into Ads & Campaigns. `ServicesStack` derives everything from `services.length`, so no layout change was needed.
- **Our Process rebuilt as a flick carousel** (`OurProcess.tsx`, on the apple-design rules). Five glass cards side by side on a track you hold: press feedback on pointer-down, 1:1 drag past an 8px hysteresis, release velocity handed to the spring, snap target chosen by momentum projection (decay 0.998), rubber-band past the ends, grab-and-reverse mid-flight, bounce only after a real flick. Prev/next buttons, arrow keys, horizontal trackpad wheel, and tap-to-go. Card width follows the viewport; the current card survives a resize. The pinned rail-and-stage version is gone.
- **/studio is now one composition** (`StudioProcess.tsx`, replacing `Studio.tsx`, which is deleted): the process as a print, after a collage reference from Rajat. Nine red blocks in a 3 × 3 on a cream sheet with a horizon, rough misregistered edges (feTurbulence + feDisplacementMap on static rects), a black numeral on the five stage blocks, tiny ink figures, a balcony, a ladder, a wire that draws itself in, paper grain as a CSS overlay. Hover/tap/focus a stage block and its title and description show in the caption strip; that strip and one "Start a project" CTA are the only copy on the page. Hero editorial, beliefs, team, principles, rail, and the final CTA are gone (git history has them).
- **Navigation**: the footer observer gets a `-1px` bottom root margin, so a page that is exactly 100vh (the new /studio) no longer hides the logo island at the top.

## 2026-09-20 (late)

- **Services re-laid and re-rostered** (`Services.tsx`, `ServicesStack.tsx`). The takeover stack stays; each card is now a split: copy on the left 54% (number, arrow, eyebrow, title, blurb, tags), the film filling the right 46% edge to edge and top to bottom, playing the whole time the card is up (a band across the top on phones; a JS breakpoint, `useWide`, since the card is styled inline). Roster is five: Websites & UI/UX (web and product merged, on Rajat's call, carried by the BMTC app film `app-showcase.mp4`), Brand Identity, Ads & Campaigns, Creative Content, Motion & Film. Creative Strategy folded into the blurbs. Eyebrows added to the data (`eyebrow`).

## 2026-09-20 (night)

- **Bottom-of-page lag**: (1) Selected Work's looping video now pauses when it leaves the viewport (an `IntersectionObserver` in `VisualPanel`), instead of decoding all the way down the page. (2) The sheet's idle drift moved from an SVG `<g>` transform (which re-rasterised the whole drawing at retina every frame) onto the `<svg>` element itself, with the parallax on a wrapping div, so every layer is a composited transform of a raster drawn once; the grid is its own svg so the line drawing itself does not repaint it. Headless Brave can't reproduce the lag (60fps before and after at 2556x1174); it is the iMac's retina raster cost.
- Pushed to `main` for Vercel.

## 2026-09-20 (evening)

- **Placeholder copy behind the finished box** (`ProblemCube.tsx`): a white sheet behind the canvas carries two big lines ("Ideas take shape." / "Block by block.", placeholders for Rajat's words) that rise out of masks over section p 0.8 to 0.95 as the box locks; the canvas drops its own white plane once the mark has gone (`HERO_DONE`), so the box occludes the text.
- **"Let's create"**: eyebrow ("Available for projects", red square) removed; CTAs are red with the IRA-style fill (`.fill-btn` in `theme.css`: a fill slides up under the label on hover, the label swaps upward): primary red with an ink fill, secondary red outline with a red fill.
- **Footer**: email `hi@1red.in`; the "STUDIO" watermark is set in Rajat's block letters (`StudioWord.tsx`, glyphs lifted from `Assets/1red-custom-letters.svg` by bounding box; the sheet has no I or H yet, so the I is a bar) at 3% white; the nav's logo island fades out while the footer is on screen (one mark at a time); the canvas below the page is brand black (`html` background in `index.css`), so a rubber-band past the footer stays black while the top stays white.

## 2026-09-20 (later)

- **Sheet made cheap and locked to its grid.** The pencil wobble is now baked into the geometry (`pencil()`: segments walked in steps, points nudged by smooth noise), no SVG filters: the `feTurbulence`/`feDisplacementMap` version re-rasterised under the parallax every frame and Rajat found it "veryyyy laggy". The grid lives in the same layer as the figure and line, so they share one parallax and one continuous drift and never separate; every vertex of the drawing sits on a grid intersection or half-cell (`CELL` 96 on a 15-cell sheet). The sheet starts `SHEET_ABOVE` (128 sheet px) above the section, so the grid reaches a little way over the end of Selected Work but not up to its text. The far triangle and near diamond keep their own parallax rates and drifts. Phones: grid only.
- **Footer in brand black** (`#0A0A0A`, white type, white-alpha hairlines, glass CTA at 8% white), the mark red on black. Rajat's call; the design system's "no dark backgrounds" rule now has this one exception.

## 2026-09-20

- **"Let's create" rebuilt as a sheet of paper** (`WhatsNext.tsx`). Rajat's brief: the pencil line language of the hero, a reference illustration of a person drawing the shapes they stand in, "Let's create" big and bold with the rest falling under it, a parallax grid that overlaps the previous section, and layers that move in their own space. Built: cream paper (`#F7F4EE`, fading in from white at the top); a pencil grid (`feTurbulence` + `feDisplacementMap` wobble) on its own slower parallax that starts 38vh above the section so it slides over the end of Selected Work; one continuous pencil line drawn with the scroll (`pathLength` from `useScroll` over the section's entry) that runs from a small line-figure's pen into a triangle top right, behind the figure into a zigzag, under the buttons and into the left margin's triangle; a loose triangle (far layer) and a diamond (near layer) on their own parallax rates; every layer with a slow idle drift. The figure is an original drawing in the reference's language (head, loose shirt, trousers, arm straight up with the pen), body shapes filled with the paper colour so the line passes behind it. Headline `Let's create` at up to 200px / 800, `what's next.` under it at 400, the sentence and the two CTAs. Dropped: the client tags, the waveform and the logo watermark. Below 768px only the paper and grid render (the sheet's crop was a stray line through the buttons).

## 2026-09-19 (night, eighth pass)

- **The gather is an orbit of the frame.** Rajat: the top cubes randomised while the bottom ones sat still, and he wants each cube to "fly around the whole screen", e.g. the top-left cube going round by the top-right and bottom-right to dock at the bottom of the box, with no collisions. Each cube now sweeps clockwise about the axis from where the tunnel left it to the angle of its staging point, at least half a turn (`ORBIT_MIN_TURN`), 30% of them a full turn more (`extraTurn`), swinging out to `ORBIT_SWING` 2.2 box units (its own `orbit` factor) at mid-flight, with lift toward or away from the lens, tumbling, then the axis slide as before. Tier windows start within the first 28% of the gather and run 0.66 to 0.72 long with `FLIGHT` 0.75, so every cube is moving from early on and nothing is stagnant. Separation and the no-fly sphere are unchanged.

## 2026-09-19 (night, seventh pass)

- **The exposed lower-left block rises in**: the "e"'s lower-left block is the small rounded one, so the first ring's block under it had nothing to hide behind and was simply there when the section started drawing. It now starts `AV_LOW_RISE` (3.2) below its place and eases up over hero p `PANEL_TO` to 0.97. The other three first-ring blocks stay glued to their "e" blocks.

## 2026-09-19 (night, sixth pass)

- **Rings come in from the sides**: rings behind the first start `AV_SLIDE_R` (8) further out along their corner's diagonal, deeper rings further, and ease into the stack over hero p `PANEL_TO` to 1.015 (keyed to the hero so they are already moving where the "e" blocks' rounded corners uncover them early), so they emerge from behind the departing "e" blocks as four chains sliding inward rather than being found already in place. The spread now begins at 0.1 so the two moves do not fight. Rajat: "some movement that those boxes are coming from the side".

## 2026-09-19 (night, fifth pass)

- **Rings packed tight behind the "e"**: `AV_SPACING` 5 (was 10), `jz` jitter halved, `AV_TRAVEL` 28 (0.8 of the new cycle). From the "e" blocks the rings now step back by perspective in even steps and glide forward as one stack. The birth animation (rings rising out of the distance) is deleted: with the second ring ten units behind the first it read as a small separate cluster snapping in (Rajat: "a lot of gap ... it snaps and appears ... scale it according to camera proximity").

## 2026-09-19 (night, fourth pass)

- **Rings come up out of the distance** rather than scaling in place: ring k starts `AV_BIRTH_DEPTH` (9) deeper and glides to its place over `AV_BIRTH_STEP` 0.012 per ring, `AV_BIRTH_LEN` 0.14 (30 / 0.006 / 0.05 first: Rajat, "too far ... a pop rather than a glide"), so it grows the way anything approaching does (Rajat: "scaling as the proximity").
- **Looping flights**: the gather's flight is a cubic arc that swings further out from the axis first (`LOOP_OUT`), then comes round sideways onto the staging point (`LOOP_SWING`, each cube its own way round and amount, `loopOut`/`loopSwing`/`loopLift` per piece), with the cube tumbling on its own axis and square again as it lands (`LOOP_TUMBLE`). Flight is 0.7 of the window, shrink spread over the whole flight, tier windows 0.5 to 0.6 long. Rajat's drawn reference: a wide loop out to the frame's edge and back in, "moved in 3D space with rotations and positions with ease in and outs, more randomness".
- **Cubes are no longer tone mapped** (`toneMapped: false`, like the mark): a tumbling metal face reflecting the room's bright panels went cream under ACES; clipped it stays red. The hand-off emissive is now the mark's exact `#FF0000` (`LOGO_EMISSIVE` 1), the key light is 1.0 (was 2.1) and `ENV` 0.5. The finished box reads brighter than before (measured face #B3271C against the old #A0000C).

## 2026-09-19 (night, third pass)

- **Rings scale up into view** behind the first one (`AV_BIRTH_STEP` 0.005 per ring, `AV_BIRTH_LEN` 0.03), so the tunnel is seen appearing as the "e" blocks leave instead of already being there. The first ring is never scaled: it is the "e" carrying on.
- **Arrays spread to the whole screen**: `AV_R_EXIT` 5.2 (was 3.4), spread over section p 0 to 0.46.
- **Spiral flights**: the gather's flight is a quadratic arc whose control point is swung about the axis (`ARC_SWIRL` 0.7, all four streams the same way round) and brought toward the lens (`ARC_TOWARD` 1.6 box units), so the tunnel spirals into the box. Cube size is settled within the first 30% of each window; nothing scales in the last stretch.

## 2026-09-19 (night, second pass)

- **Boom slower and visible**: p 0.85 to 0.94, quadratic ease-out, starting as a diamond already peeking out behind the mark (`PANEL_SCALE0` 0.7) and ending at 7.5x so the studio's side walls are cleared on a 2.2:1 frame by about p 0.905. Its edge is logo red at 0.7px.
- **Tunnel moves with the "e" and diverges with the scroll**: no hold at the hand-off (the ring behind the parting blocks is already moving), the run covers 0.6 of a cycle (`AV_TRAVEL` 42, `AV_RUN_POW` 1.6) so rings pass the lens rarely, and the gap between the four arrays opens from tight-on-the-"e" to `AV_R_EXIT` over section p 0 to 0.42 (`AV_SPREAD_*`) as well as by nearness to the lens. Tilt eases in over 0.04 to 0.34.
- **Gather as four streams**: slots are assigned by quadrant in the box's resting frame (`layout`), so each array folds into its own quarter of the box, the deepest ring's cube becoming the centre and the nearest ring's cubes the outer corners. The box no longer spins 1.5 turns underneath; it drifts the last 20° onto its resting angle (`DRIFT_Y`). Staging radius 3.3, flight 0.6 of the window, tiers compressed (`TIER_WINDOWS`) so the streams fold in together and the box is built by section p 0.87.

## 2026-09-19 (night)

- **The boom.** Rajat: the white square should be "a small rhombus behind the one red logo that scales up as it rotates, like the boom effect", not the cyclorama face growing after the turn. The panel is now a 1 m square at the mark's centre that, from p 0.865 (right after the mark's turn) to `PANEL_TO` 0.935, scales from 0.05 to 5.6 and turns from 45° to −0.2 rad with a cubic ease-out (`panel` in `studioSequence.ts`). Pure white with an ink edge; drawn under the mark, over the studio.
- **The tunnel continues the "e".** Rajat: "the e wala cube and the immediate array should properly align to it showing the continuity ... even if the 4 arrays get too close it's fine, as we scroll they space out". Rings are now square whatever the frame's aspect (no more one-block-per-corner), with their inner edges `AV_INNER` from the axis so at the hand-off they land on the edges of the gap in the "e"; they flare out to `AV_R_EXIT` as they reach the camera (which is also what lets a ring wrap unseen); and they arrive square to the camera, the off-axis tilt easing in over section p 0.01 to 0.22 (`AV_TILT_*`). `AV_HANDOFF_Z` replaces the old corner-crossing depth.
- **The mark hides the tunnel with its true outline.** The cross-shaped `clip-path` is gone (it cut the cubes with a straight edge beside the blocks' rounded corners, Rajat's "random square blocking"). Section 2 now draws a depth-only copy of the mark (`cube/MarkOccluder.tsx`, geometry from the new shared `hero/logoGeometry.ts`) at exactly the hero's projection: the hero's camera view is rebuilt from `sampleSequence`, its lateral coordinates scaled by the ratio of the two lenses' tangents, and placed in front of section 2's camera. The mark's ink edges are redrawn there too. Section 2's white backdrop moved into the canvas (a plane 120 units in front of the camera) so the mark can hide it as well; the whole section draws from hero p `PANEL_TO`, once the frame behind the mark is white.
- Verified with the persistent headless Brave at 1440x900, 2556x1174 and 390x844; no page errors; `vite build` clean. Not pushed.

## 2026-09-19 (later)

- **The paper takes the frame.** Rajat's direction for the zoom: "one white square behind the red scales up while it's rotating, a little tilted like a rhombus". The cyclorama's front face (measured off the `paper` mesh: 3.27 x 2.62 m) is now a panel in `StudioScene.tsx` that, from the first frame of the zoom (`panel`, hero p 0.89 to 0.936 in `studioSequence.ts`), grows to `PANEL_SCALE` 3.2 and turns `PANEL_TILT` (−0.2 rad) behind the mark, drawn without depth (`renderOrder` 1) so it passes over the floor, stands and lamps; the mark draws after it (`renderOrder` 2). Its ink edge fades in with it. Nothing dark is ever behind the mark's blocks as they sweep out, and the cyclorama's hatch tint (the "grey thing") lerps to pure white as it grows. The studio-ink wash from earlier today was removed: it went grey on the way to white, which Rajat read as a flash.
- **The cubes carry the outlines.** Tunnel cubes get the same ink edges as the mark's blocks (`createInkLineMaterial`, now shared from `hero/inkLines.ts`): one `LineSegments2` holding all 27 cubes' 12 edges, endpoints rewritten each frame from the instance matrices. They fade over section p 0.1 to 0.44 (`OUTLINE_*`) as the blocks go metal, gone before the gather. No polygonOffset on the cube fills: it let the internal faces through as hairline seams on the finished box.
- Verified with one persistent headless Brave (playwright-core server in the scratchpad) at 1440x900, 2556x1174 and 390x844; no page errors; `vite build` clean. Not pushed.

## 2026-09-19

- **The tunnel becomes the box; no turn.** Rajat: the array swinging to an angle and breaking into a jumble (`AV_SWING`/`AV_TILT`/`AV_SQUASH`/`AV_AP_TURN`) was the wrong move. Those are gone from `cube/CubeAssembly.tsx`: the tunnel's run eases to a stop (`APPROACH_END` 0.5) and, still seen head-on, its blocks leave their rings one by one (gather 0.46 to 0.9, centre first), shrink to box size within the first 30% of their flight (`SHRINK`, or the nearest ring crosses the frame as giant slabs), square up and lock into the box. The jumble layout (`layout(cols, rows)`, per-cube sizes, tumble axes) was deleted with it.
- **Hand-off fixes.** (1) Section 2's white backdrop now lives inside the clipped layer and is opaque, so what shows through the gap in the "e" is white and cubes, never the studio's black walls at the ends of the cross; the layer paints nothing before hero p 0.93 (`CLIP_FROM_P`), the point from which the gap is centred. (2) The studio's ink (approach ground, stands, lamps, `mats.ground/ink/sketch`) washes to white over hero p 0.895 to 0.932 (`wash` in `studioSequence.ts`), so nothing dark flickers behind the mark's rounded corners as they sweep past the frame's edges. (3) Section 2's canvas uses the hero's pixel budget (`budgetDpr`, now exported), instead of a flat dpr 1.75 that put a 4473x2054 canvas on top of the hero's: hand-off frame times on the iMac went from 28.9ms median / 65ms p95 to 16.7 / 46.
- Verified with headless Brave via Playwright at 1440x900 and 390x844 across the hand-off and the build; no page errors; `vite build` clean. Not pushed.

## 2026-09-17 (later)

- **The hero hands into section 2 through a tunnel, not a scale-up**: the cubes no longer start clustered deep at the centre of the frame and swell towards the camera. They are laid out four to a ring, one block in each corner of the frame, ring behind ring, converging on the exact point the hero's zoom breaks through the "e". The mouth of the tunnel opens as the gap opens (`AV_AP0`), so the hand-off is one continuous move: the parting red of the logo gives way to blocks streaming out of the same four corners. Ranks cycle (`AV_CYCLE`, wrapping off frame at `AV_Z_EXIT`), so 27 cubes read as a tunnel with no end. The array then turns (`AV_SWING`/`AV_TILT`), loses its depth (`AV_SQUASH`) and draws its mouth back in (`AV_AP_TURN`), which is what breaks the rings into the jumble the 3x3x3 box is built from. All in `cube/CubeAssembly.tsx`; section 2 grew to 490vh to give the run its own scroll.
- Each block carries a mirrored off-axis tilt and each ring shares one radius jitter, so the tunnel is symmetric about the gap. With a single shared tilt the blocks all leaned the same way and the tunnel's centre of mass measured 3% off centre.
- Nothing is drawn until the section actually pins (its canvas is not aligned with the viewport before that, so cubes appeared low of the gap over the closing door).
- **The first ring arrives at the size of the "e" blocks.** Rajat: the blocks have to start at the scale of the blocks the zoom just parted, "as if we are continuing". The tunnel is now at full width from its first frame (no mouth opening), and `AV_PHASE0` places the nearest ring exactly on the depth where its blocks straddle the corners of the frame, which is their biggest on-screen moment. `AV_R` is tight against `AV_SIZE`, since that ratio is what sets how much of the frame a block covers as it crosses the corners: it is now half the frame's height, against 30% before.
- **The first rings wear the mark's own skin.** They arrived in red metal against the mark's flat `#FF0000` and the brightness step read as a new object rather than the same blocks carrying on. Blocks now start as flat logo red and turn into red metal by p 0.12. Exact `#FF0000` is not reachable through this canvas's ACES tone mapping (a stronger red goes cream, not redder, because the pass mixes channels), and the mark's own material skips tone mapping while this one cannot without changing the metal the box ends as, so the blocks land on `#F40013`. Measured, not guessed: the end state still renders `#A0000C`, exactly as before.
- **The tunnel sits behind the "e" instead of over it, and is revealed by the gap rather than switched on.** Section 2 is drawn on top of the hero, so its cubes were painting over the mark's blocks. The section now clips its 3D layer to the gap between those blocks (`gapHalfFraction` in `studioSequence.ts`, a cross-shaped `clip-path` in `ProblemCube`): the mark occludes the tunnel, the widening gap reveals it, and the clip lifts by itself at the same moment the mark's blocks leave the frame, so there is never a straight edge against white. Measured 2px off the rendered red edge at two points in the hand-off.
- The reveal starts before the section pins. Until then the section's canvas is not aligned with the viewport, so the frame is shifted up by the difference (`camera.setViewOffset`) and the clip's cross with it. That replaced a hard on/off at the pin: the tunnel now grows out of a 2px sliver in the gap while the mark is still turning.
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
