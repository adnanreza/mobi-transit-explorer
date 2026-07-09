# Feature 017 - Real Mobi Data and Canvas Charts

Branch: `feature/real-mobi-data-charts`

## Goal

Replace the mock-data MVP with public Mobi by Rogers CSV-derived station metrics and real chart components.

## Scope

- Use April and May 2026 CSV files from `https://www.mobibikes.ca/en/system-data`.
- Keep raw CSVs out of git.
- Add a local data-processing script.
- Generate static TypeScript data for stations, opportunities, and charts.
- Add canvas-backed charts using Chart.js and `react-chartjs-2`.
- Remove SVG sparkline dependency.
- Update product copy and methodology from mock data to real data.

## Files

- `scripts/process-mobi-data.mjs`
- `src/data/realMobi.ts`
- `src/data/stations.ts`
- `src/data/opportunities.ts`
- `src/components/RealMobiCharts.tsx`
- `src/components/charts/MiniTrendChart.tsx`
- `src/components/charts/chartSetup.ts`

## Data Rules

- Raw files belong in `data-raw/` or can be passed with explicit CLI paths.
- Rows with blank departure or return station names are skipped.
- Real trip counts, e-bike share, hourly departures, and top destinations come from CSV rows.
- Transit proximity and map position are estimated because the public trip CSVs do not include station coordinates.

## Charts

Use actual chart components, not hand-drawn SVG:

- monthly trips stacked by classic/e-bike
- hourly departures
- bike type split
- top May stations
- mini station trend charts
- mini connector component charts

## Tests

Run:

```bash
npm run data:process
npm run test
npm run typecheck
npm run build
```

Use browser review to verify:

- overview charts render
- map still renders
- station selection still works
- opportunity table renders chart previews
- no console errors

## Acceptance Criteria

- The app uses real public Mobi CSV-derived data.
- No raw CSV files are committed.
- Chart.js canvas charts render in the app.
- Vitest passes.
- TypeScript passes.
- Production build passes.
- Docs explain source limitations honestly.
