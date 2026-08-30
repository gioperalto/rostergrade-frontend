# Player Entity Pages Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Restore the scan-first rankings board and add canonical player/D/ST entity pages with reusable card presentations.

**Architecture:** Keep rankings dense and non-collapsible. Add a shared entity-card/data model so rankings, mock draft, team contexts, and detail pages refer to the same stable player identity. Add client-side entity routes first, using the existing rankings payload; expose missing projection fields as unavailable rather than inventing data. Use a position-specific D/ST profile section while sharing the page shell.

**Tech Stack:** React, TypeScript, Vite, lucide-react, existing frontend API contracts and CSS.

---

### Task 1: Restore the non-collapsible rankings board

- Remove native `<details>` interaction from player ranking rows.
- Preserve all currently visible desktop comparison fields and the compact mobile row without hidden secondary content.
- Make the entire row/card an accessible link target to the canonical player route.
- Add a reusable shared player card component or render helper without changing ranking data semantics.
- Add/adjust focused source-level regression coverage if compatible with the existing test setup.

### Task 2: Add canonical entity routing and player detail pages

- Add routes for `/player/:id` and a rankings fallback.
- Resolve the selected player from the complete ranking dataset, not the current filtered subset where possible.
- Build the player hero, projection summary, per-game/season toggle, grade factors, role/opportunity context, team context, and provenance display.
- Use explicit unavailable states for stats absent from the API; do not fabricate per-game stat categories.
- Ensure back navigation and direct deep links work under the existing Nginx SPA fallback.

### Task 3: Add a D/ST-specific entity page

- Route D/ST entities through the same canonical entity page shell.
- Replace offensive sections with defensive event projection breakdown where `defensive_event_evidence` supports it.
- Display sacks, interceptions, fumble recoveries, defensive touchdowns, safeties, and blocked kicks as available/provenance-backed components.
- Keep fantasy projection separate from defensive strength/signal and clearly label unavailable evidence.

### Task 4: Integrate shared entity links and validate

- Link player references from mock draft and team views to canonical entity pages where stable IDs are available.
- Preserve filtering, sorting, scoring-format selection, canonical slot labels, and existing team record behavior.
- Run TypeScript compilation, regression tests, whitespace checks, and inspect the final diff.
- Commit each coherent task and verify the branch is pushed and synchronized with `origin/main`.
