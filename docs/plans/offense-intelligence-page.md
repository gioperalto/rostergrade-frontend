# Offense Intelligence Page Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Make the Team Offenses page a holistic, transparent offense intelligence board powered by persisted player projections/grades and nuanced team scheme profiles.

**Architecture:** Keep player and team identity data sourced from the Go API. Derive team-level quantitative signals in the frontend from the loaded player records, while storing qualitative coaching/scheme context in a typed 32-team research snapshot. Present both layers separately so users can distinguish measured API-backed output from synthesized football context.

**Tech Stack:** React, TypeScript, Vite, existing Lucide icons, existing CSS.

---

### Task 1: Add typed team offense intelligence profiles

**Objective:** Extend the existing team offense catalog with scheme, coaching, pace, personnel, passing, QB, red-zone, and uncertainty fields for all 32 teams.

**Files:**
- Modify: `src/App.tsx`

**Requirements:**
- Preserve the existing 32 abbreviations and current strategy notes.
- Add fields for scheme family, playcaller/coaching identity, pace/tempo description, personnel tendency, pass/run identity, motion/formation tendency, QB usage, red-zone identity, and context flags.
- Use qualitative strings and bounded categorical values rather than invented exact percentages.
- Keep source season and source URL fields.
- Make the type support `confidence` or `changeRisk` so unsettled teams can be marked clearly.

**Verification:** `npx tsc -b`

### Task 2: Derive transparent holistic offense metrics

**Objective:** Calculate team-level quantitative indicators from currently loaded player records.

**Files:**
- Modify: `src/App.tsx`

**Requirements:**
- Derive per-team metrics from players with modeled projections only.
- Include at least: offense score, projected points sum, projected points per game sum, average roster grade, number of modeled players, QB/RB/WR/TE modeled counts, top player grade, and depth/role coverage.
- Do not treat unavailable or zero-grade records as competitive evidence.
- Keep score bounded and explain that it is a team-context index, not an expert projection.
- Use player slot/role information to surface lead-back, committee, WR1/WR2/WR3, and QB1/TE1 context.
- Make calculations robust to missing, null, or malformed API values.

**Verification:** `npx tsc -b`

### Task 3: Replace the basic offense cards with an intelligence board

**Objective:** Give users a useful overview and deep per-team cards containing both measured output and football context.

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/index.css`

**Requirements:**
- Add a summary section explaining the measured-vs-research layers.
- Add sortable/filterable controls for holistic offense score, strategy, and uncertainty if compatible with existing UI patterns.
- Display team rank, offense score, modeled player count, projected points, top player, QB/RB/WR/TE coverage, and backfield shape.
- Display scheme family, playcaller identity, pace, personnel, pass/run identity, motion/formation, QB usage, red-zone identity, beneficiaries, and risks.
- Show a compact “why this ranks here” explanation based on the derived metrics and qualitative profile.
- Preserve all 32 teams and mobile usability.
- Avoid tables that do not work on mobile; use cards/grid and responsive controls.

**Verification:** `npx tsc -b`; inspect the rendered page in the browser when deployed or with the local dev server.

### Task 4: Independent spec and quality review

**Objective:** Review the completed offense intelligence implementation for requirements coverage, correctness, accessibility, and scope discipline.

**Files:**
- Review only: `src/App.tsx`, `src/index.css`

**Verification:** `npx tsc -b`; `git diff --check`; report PASS/FAIL and concrete findings.

### Task 5: Final validation and commit

**Objective:** Run frontend validation, inspect the diff, and commit the completed feature.

**Verification:**
- `npx tsc -b`
- `git diff --check`
- `git status --short --branch`
- Commit message: `feat: build holistic offense intelligence board`
