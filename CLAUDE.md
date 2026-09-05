# CLAUDE.md — OneRed Studio

This file is the entry point for any Claude Code session working in this repository.

## Before making any changes to the OneRed Studio website, read the project memory files inside `.claude/` — in this order:

1. `.claude/project-memory.md` — what this project is, its identity, structure, and hard rules.
2. `.claude/design-system.md` — the visual/interaction language: colors, type, spacing, glass, boxy identity, logo rules.
3. `.claude/architecture.md` — tech stack, folder layout, routing, the established scroll/animation pattern.
4. `.claude/current-state.md` — what's actually implemented right now, known issues, what's mid-flight.
5. `.claude/decisions.md` — a dated log of specific design/technical calls and the reasoning behind them.
6. `CHANGELOG.md` (root) — the dated history of what shipped and when. Skim this for chronological context; it's a record of *what happened*, while `decisions.md` is a record of *why*.

**Do not start changing code before reading these.** They exist because this project has been built across a very long iterative conversation with many specific, hard-won decisions (bug fixes, rejected design directions, explicit "do not do X" rules). Skipping them means repeating mistakes that have already been made and corrected once.

## Session start protocol

1. Read the six files above.
2. Inspect the actual current repository state (the real component files, not just this documentation) for whatever section you're about to touch.
3. If the documentation and the actual code disagree, **trust the code** — then fix the documentation to match. This memory vault is a snapshot, not a guarantee; it can go stale the moment someone edits a file without updating it.
4. Only then start making changes.

## Saving memory

When the user says **"SAVE MEMORY"**:

1. Review what changed in the current session (which files, what visual/behavioral outcome).
2. Identify anything that's a *permanent* decision (not just "I fixed a bug") — add it to `.claude/decisions.md` with date, decision, and reason.
3. Update `.claude/current-state.md`: move finished work from "Currently Working" to "Completed", update "Files Recently Modified", note any new known issues.
4. Add a dated entry to `CHANGELOG.md` (top of the file, newest first) summarizing what shipped — one or two lines per change, matching the existing entries' style.
5. Update `.claude/design-system.md` only if a new *reusable* visual/interaction rule was established (not a one-off tweak).
6. Update `.claude/project-memory.md` only if the overall project direction or structure changed (rare).
7. Do not save trivial back-and-forth — only information a future session actually needs to continue correctly.

## The two hardest rules in this project

- **The OneRed logo geometry is never redesigned, redrawn, or approximated.** If a task touches the logo, use the real vector source (`public/favicon.svg` — verified pixel-identical to the raster logo used elsewhere) or the existing `Logo.tsx` component. See `.claude/design-system.md` for the full story.
- **Every past redesign in this project explicitly preserved unrelated sections.** When asked to redesign one section, do not touch, "improve," or refactor anything else unless the user asks. This has been a hard requirement in essentially every design task on this project.
