# Teams Intelligence Page

## Architecture

The sidebar and mobile navigation expose one **Teams** view. It renders all 32 abbreviations from the existing typed offense catalog, merging `/api/teams` identity data when present and using the complete catalog names as a fallback. Each team is a native accessible `details/summary` accordion with separate offense, defense, and end-of-season record sections.

Offense uses the existing all-rankings request and derives totals only from offensive players with positive projected points and roster grades. Research strategy, scheme, playcaller, pace, personnel, pass/run, motion, quarterback, red-zone, beneficiaries, and risks remain a labeled 2025 research snapshot with source links.

Defense reads only D/ST records and optional defensive fields (`defensive_grade`, `defensive_signal`, and `defensive_event_evidence`). Missing fields are rendered as unavailable/not modeled. Fantasy D/ST points are explicitly labeled as a fantasy signal and are never treated as total real-world defensive strength.

## Record methodology and limits

The record display uses a bounded 17-game scenario only when both a measured offensive index and a defensive grade/signal are available. It combines relative offense and defense inputs, labels the result as a transparent measured-input scenario, and does not imply a guarantee or licensed expert forecast. Otherwise it displays **Projection pending**. No context is copied between teams and no missing metrics are fabricated.

## Validation

Validate with `npx tsc -b` and `git diff --check`. Confirm that player rankings and mock draft remain available, that the Teams page renders all 32 cards when `/api/teams` is incomplete, and that accordions, unavailable labels, source links, and the 17-game methodology remain readable at mobile widths.