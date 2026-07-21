# Spec 042 — Encoding legibility: say what the marks mean

## Context

Owner review of the new Coverage view: "shouldn't the legend say these are missing — the big blue circles alone are not clear enough?" Correct — the legend used abstract text glyphs (●/◌) that didn't resemble the map marks and never used the word that carries the meaning. That prompted an audit of the whole project for the same class of gap: visual encodings whose meaning is implied but never stated.

## Findings and fixes

**Map (src/components/InteractiveMap.tsx):**
- Coverage legend now uses true glyph shapes that mirror the marks — a filled ink dot and a blue ring — with explicit wording: "SkyTrain / Canada Line stop with a Mobi dock" / "**Missing** — no Mobi dock within 1 km". The ringed stations' name labels also render in the accent color so ring + label read as one mark.
- Score/leisure legends never explained the small dark dots (rapid-transit stations) — added, with the aria legend label extended to match.
- The selection ring + destination lines were never explained anywhere on the map — a conditional legend line ("Ring + lines — selected station and its top destinations") now appears while a station is selected.

**Story charts (src/components/story/storyContent.ts)** — captions described the data but not the color convention. Four now decode it:
- Seasons: "The blue line is 2025; the grey lines are every year before it."
- Pandemic: "The blue stretch of the line marks June 2019 through June 2022."
- Weather: "The blue bar is the busiest band."
- Purpose: "Blue bars mark the majority-leisure stations."
Because captions double as the charts' aria-labels, the fix serves screen-reader users too.

**Audited and left alone (already labelled):** hourly + flows charts (real Chart.js legends), membership chart (legend), top-stations bar (every bar named on its axis), flows ranked bars (value adjacent), priority dots in Signals (text label beside the dot), connector-score progress bar (number beside it), growth/e-bike single-series charts (nothing to disambiguate).

## Verification

- 95 Vitest + typecheck + build green (caption tests use `toContain`, unaffected by the appended sentences).
- Visual check against the production build: Coverage legend reads with real glyphs and "Missing" wording, ringed-station labels render in accent; score-mode legend shows the transit-dot line; selection line is conditional on a selected station.

## Lifecycle

Review follow-up on `feat/041-transit-coverage`'s theme → commit on `fix/042-encoding-legibility` → merge → push → deploy.
