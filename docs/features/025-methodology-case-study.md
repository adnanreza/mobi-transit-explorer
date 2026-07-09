# Feature 025 - Methodology as a Data-Engineering Case Study

Branch: `feature/methodology-case-study`

## Goal

Rewrite the methodology section and README as a first-person data-engineering case study, and give all product copy one voice pass. This spec is written directly against the two audiences: a Mobi reader should feel the author knows and loves the system; a City of Vancouver Data Engineer hiring panel should see ETL/ELT, dimensional modeling, SQL, and data-quality discipline demonstrated, not claimed.

## Methodology Section v2

Replace the four generic cards with a narrative page (typography-led, per spec 022):

1. **The data** - what Mobi publishes (103 files, 2017-present, license, privacy rounding, excluded rebalancing trips) and what was added: GBFS station feed, CoV rapid-transit stations and shoreline. Credit both licenses.
2. **The pipeline** - a designed SVG diagram of the stages (acquire → extract → clean → conform → model → publish) with honest scale numbers per stage (files in, rows in, rows flagged/dropped, kilobytes out). Numbers generated from the quality report, not typed in.
3. **Nine years of drift** - the era table (XLSX→CSV, renamed and added/dropped columns, Excel serial dates, spillover trips) and how each is handled. This is deliberately the centerpiece: messy inputs handled well is the skill on display.
4. **Data quality** - flag rules with their real counts, the dedupe story, station join coverage; link to the full committed `docs/data-quality-report.md` on GitHub.
5. **Scores and rules** - connector score v2 formula with weights, opportunity rule definitions (linked from spec 024's footer).
6. **Limitations and next** - hour-rounded timestamps, no rider demographics, retired stations without coordinates, temperature/season confounding; future: rolling refresh automation, route-level analysis.

## README v2

Rewrite top-down for a reader deciding whether to interview the author:

- Open with the product in one sentence and the personal stake in the next: car-free in Vancouver, Mobi + walking + transit as the daily system.
- "How it's built" split into **App** (React/Vite/TS, static, custom SVG cartography) and **Pipeline** (Python + DuckDB, star schema, staged ETL, quality report) with an architecture sketch.
- Reproducibility block: the four commands from download to build, and what is/isn't committed (manifest and aggregates in; raw data and warehouse out).
- Honest "Data notes" section carried over from the quality report headlines.
- Keep the feature-lifecycle section; update the stack list (add Python/DuckDB/pytest; remove the retired Node processor).

## Voice Pass (whole app)

- First person where it earns it (hero, methodology intro, README) - "I don't own a car; this is the network I actually ride" energy, without oversharing.
- Subject is always Vancouver, riding, and the data - never the app's own architecture (banned per spec 022) except in the methodology, where architecture *is* the subject.
- Every chart caption, empty state, and footer read once for tone: plain words, no "leverage/robust/seamless", no exclamation marks.
- Footer: name, GitHub/LinkedIn links, data license credits, "Not affiliated with Mobi by Rogers or the City of Vancouver" line.

## Files

- `src/components/Methodology.tsx` (rebuilt), `src/components/PipelineDiagram.tsx` (new)
- `src/data/generated/meta.json` (extended by `publish.py` with per-stage quality headline numbers if not already present)
- `README.md` (rewritten), `docs/data-methodology.md` (updated to match reality), `docs/product-spec.md` (v2 framing)
- Copy touch-ups across hero/story/explorer components
- `src/components/__tests__/Methodology.test.tsx`

## Tests

Run:

```bash
npm run test && npm run typecheck && npm run build
```

Unit: methodology renders every subsection; pipeline diagram numbers come from generated meta (fixture-driven); footer credits present. Browser review: methodology reads as a case study, not feature cards; README renders well on GitHub (check heading levels, code blocks, diagram image/ASCII); no stale claims anywhere (grep for "April and May 2026", "mock", "estimated position").

## Acceptance Criteria

- Methodology tells the full pipeline story with generated numbers and credits both data licenses.
- README passes the test: a hiring manager skimming for 60 seconds understands what was built, how, and why this person.
- No copy anywhere still describes the two-month MVP, mock geography, or build-status narration.
- Disclaimer and license credits present.
- Vitest, typecheck, and build pass.
