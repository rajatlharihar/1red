# 1Red scrollytelling brief (2026-09-20, from Rajat via hub session)

Worked ONE SECTION AT A TIME. The hub (imac-74) hands out each section as its own task, reviews, then hands out the next. Do not build ahead. Every section: build, verify in the browser (localhost:5173, 1440x900 and 390x844), report with screenshots/contact sheets, then wait.

Standing rules still apply: read `.claude/*.md` first, never touch the logo geometry, never touch sections outside the current task, glide never pop, checkpoint commits after every verified step.

## Role for copy work
Act as a professional creative director + content writer on every line. Copy must be catchy, confident, hits a mass audience (meme-adjacent is fine, cringe is not). Propose 3 to 5 options per line, pick a recommendation, the hub/Rajat picks final.

## HOME (`HomePage.tsx`: StudioEntrance -> ProblemCube -> FlashWork -> WhatsNext)

### H1. Hero statement (StudioEntrance, the wall + door)
One bold visual / question / statement on the wall-and-door hero that sets 1Red apart. It is the first thing read. Sits with the door, does not fight the mark. Copy options first, then placement.

### H2. Cube line (ProblemCube, where the tunnel cubes lock into one box)
Replace the placeholder `LINES = ['Ideas take shape.', 'Block by block.']`. New line = one confident statement in the tone "we are one collective for you, with many skills" (the cubes becoming one box IS the metaphor: many parts, one unit). Also give this end-state a proper grid layout: research grid/visual-design layouts on Pinterest for inspo (editorial, Swiss-grid, poster-like), propose 2 to 3 layout directions as quick mockups, hub picks. Keep the gather timing untouched (Rajat: "perfect, just a little slowed", ask before changing).

### H3. Services / "What we cover" (Services.tsx + ServicesStack.tsx)
- Rename the "3 Disciplines" label to "What we cover".
- The Ads & Campaigns card must also say we do 2D / 3D animation and motion (all of it), not just ads.
- Better card layout: rework the card grid so the three cards read as a designed grid, not a list. Same Pinterest-grid inspo pass.
- This block moves OFF the home flow and INTO the Studio page (see S2). "How We Build" / Our Process also lives on Studio, not as a separate services section.

## STUDIO PAGE (`StudioPage.tsx`, currently `StudioProcess.tsx`, the process-as-print)
Rebuild as one continuous 3D-space scroll. Same glide/no-pop rules as the home hero.

### S1. Process in 3D space
The process steps (Discover, Define, Design, Deliver, Refine from `data/process.ts`) are rectangles placed in depth. Scrolling moves a 3D camera forward: step 1 comes toward the screen, then step 2, one by one, and we pass THROUGH each rectangle to reach the next. After the last one the camera keeps moving to the next section.

### S2. Services block ("What we cover", from H3)
After the process rectangles, the camera arrives at the services block (the three cards). Assumption: this sits between process and team, since the team section's line answers it ("our team will handle it"). Flag if the hub says otherwise.

### S3. Zoom in -> "our team" video
Camera zooms further into the 1Red glitchy video (the existing 1Red glitch clip), with "our team" set in italics over/with it.

### S4. Team card -> long table
Zoom further and one card appears, like the menu section on https://yuiii.vercel.app (Rajat's YUI site, go look at it). The card is landscape/horizontal, styled like a playing card: see `.claude/refs/team-table-card-10-of-diamonds.png` (10 of diamonds, top-down long table with people around it, ink sketch). The card then turns into a horizontal scroll, as if you are moving along a long table. Text along it in the tone: "don't worry, our team will handle it" (write options).

## Order of tasks from the hub
H1 -> H2 -> H3 -> S1 -> S2 -> S3 -> S4. One at a time.
