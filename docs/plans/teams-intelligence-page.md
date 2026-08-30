# Teams Intelligence Page

## Architecture

The sidebar and mobile navigation expose one **Teams** view. It renders all 32 team cards from the typed catalog, merges `/api/teams` identity data when present, and uses catalog names as fallback. Each team remains a native accessible `details/summary` accordion with separate offense, defense, and end-of-season record sections.

The page includes 32 team cards. API-backed quantitative offense requires positive projected points and roster grade; the measured offense index is computed only from those records. The catalog's scheme, playcaller, pace, personnel, pass/run, motion, quarterback, red-zone, beneficiaries, and risks are explicitly presented as a **2025 research snapshot**, separate from API support. Teams without modeled player data show an explicit no-modeled-data state and retain the catalog only as qualitative context.

Defense reads D/ST records and optional defensive fields (`defensive_grade`, `defensive_signal`, and `defensive_event_evidence`). A D/ST row or fantasy projection alone is not treated as a real-world defensive model: defensive data is usable for records only when it has a finite defensive grade or signal. Multiple defensive signals are aggregated deterministically; first-array order is never used. Missing fields and unusable row-only data are rendered as **Unavailable**. Fantasy D/ST points are explicitly labeled as a fantasy signal and are never treated as total real-world defensive strength.

## Record methodology and limits

The record display uses a bounded 17-game scenario only when measured offense data and a valid defensive grade or signal exist. Formula: `8.5 + (measuredScore - 50) / 11 + (defensive grade or aggregated signal - 50) / 14`, rounded and bounded to 0–17. The offense input is **measuredScore only**; the context score is excluded. A fantasy D/ST points projection alone is insufficient for estimating a real-world record. The UI exposes this baseline, formula, inputs, and limitations. Otherwise it displays **Projection pending**.

The primary rankings and teams request checks HTTP errors, cancels stale requests with `AbortController`, and displays a visible data error without replacing the existing rankings, Teams, or mock-draft UI. Malformed team records are filtered and valid API identity records are merged into the complete 32-team catalog. Offense projection totals are labeled as summed fantasy projected points to distinguish them from real-world team scoring forecasts. This is a scenario estimate, not a guarantee or licensed expert forecast.

## Validation

Validate with `npx tsc -b` and `git diff --check`. Confirm that player rankings and mock draft remain available, that the Teams page renders all 32 cards when `/api/teams` is incomplete, and that accordions, unavailable labels, source links, and the 17-game methodology remain readable at mobile widths.