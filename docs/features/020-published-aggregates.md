# Feature 020 - Published Aggregates and Data Contracts

Branch: `feature/published-aggregates`

## Goal

Publish the warehouse into small, typed, committed JSON artifacts that the static app consumes, and retire the old two-month Node processor. This is the bridge between the pipeline and the browser: millions of rows in, well under a megabyte out.

## Scope

- `publish` stage in the pipeline: SQL views over the star schema, exported to JSON.
- TypeScript data contracts and a validation test that locks generated JSON to the contracts.
- Recompute the connector score and opportunities from real distances (replacing name-keyword transit inference).
- Swap the app's imports to the new generated data with minimal visual change (the redesign comes later).
- Retire `scripts/process-mobi-data.mjs` and the old generated files.

## Files

- `pipeline/sql/50_publish_*.sql` (one view per artifact)
- `pipeline/publish.py` (runs views, writes JSON, enforces size budget)
- `src/data/generated/*.json` (committed)
- `src/data/contracts.ts` (types for every artifact)
- `src/data/index.ts` (typed accessors; the only import path the app uses)
- `src/data/__tests__/contracts.test.ts` (Vitest: every JSON file parses and satisfies its contract; key invariants hold)
- Delete: `scripts/process-mobi-data.mjs`, `src/data/stations.ts`, `src/data/opportunities.ts`, `src/data/realMobi.ts`

## Artifacts

All artifacts carry `generatedAt` and `sourceWindow` (first/last month included). Flagged rows are excluded per the rules in spec 019.

- `yearly.json` - per year: trips, distance km, median duration, e-bike share, active stations, membership-group mix, average departure temperature.
- `monthly.json` - per month 2017-01 to present: trips, e-bike share. The single continuous series behind the growth chart.
- `seasonality.json` - per year x month-of-year trips, normalized for overlay comparison.
- `hourly.json` - per year x hour-of-day x weekday/weekend departures (timestamps are hour-rounded at source; the artifact notes it).
- `stations.json` - per active station: id, name, lat/lon, capacity, trips per year, top 5 destinations, commute share, e-bike share, nearest rapid-transit station + distance m, connector score with component breakdown.
- `weather.json` - departures binned by temperature band (2° bins) with per-trip rate context.
- `opportunities.json` - ranked operational opportunities derived from real metrics (see below).
- `meta.json` - totals for hero copy (total trips, total km, years covered, station count) plus quality-report headline numbers.

## Connector Score v2

Replace keyword-based transit inference with real geometry: transit proximity from haversine distance to the nearest CoV rapid-transit station (decay curve, ~0 beyond 800 m), volume (log-normalized annual trips), commute pattern, e-bike share, destination diversity. Weights live in one SQL/constant block and are documented in the methodology. Scores are computed over the trailing 12 full months so they reflect the current network, not 2017.

## Opportunity Rules

Opportunities become explicit, explainable rules over real metrics (each row cites its numbers): dock capacity pressure (high trips per dock vs network median), e-bike gap (low e-bike share at high-commute stations), transit-connector gap (high volume, close to rapid transit, low connector score component), seasonal underuse (strong summer, weak winter vs network curve). Cap at the top 8, ranked by impact estimate.

## Size Budget

- Total `src/data/generated/` under **400 KB raw / 120 KB gzipped**. `publish.py` prints per-file sizes and fails the run over budget.
- No per-trip data ever ships to the browser.

## App Integration (mechanical, not visual)

- Point existing components at `src/data/index.ts` accessors: overview cards and charts read `yearly`/`monthly`/`meta`; the map keeps its current mock projection but reads real station metrics; the opportunity table reads `opportunities.json`; filters that referenced the two-month window switch to the trailing-12-month station metrics.
- It is acceptable for some existing charts to show the richer series in the old styling; visual redesign is specs 021-023.

## Tests

Run:

```bash
python -m pytest pipeline/tests
python pipeline/publish.py
npm run test && npm run typecheck && npm run build
```

Contract tests assert: schema conformance for every artifact; monthly series is continuous with no gaps; yearly totals equal the sum of their months; every station has valid coordinates; connector components sum to the published score; size budget respected (checked into the test, not just the publisher).

## Acceptance Criteria

- The app builds and runs from committed generated JSON alone - no pipeline needed for `npm run dev`.
- One command regenerates every artifact from the warehouse.
- The old Node processor and its outputs are gone; nothing imports them.
- Connector scores and opportunities are derived from real distances and cite real numbers.
- All artifacts satisfy their TypeScript contracts under Vitest.
- pytest, Vitest, typecheck, and build pass; the app renders with multi-year data.
