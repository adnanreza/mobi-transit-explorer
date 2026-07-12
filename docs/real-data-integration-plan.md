> **Historical planning document — superseded.**
> This file describes an early two-month MVP approach (April + May 2026 only) that
> predates the shipped pipeline. The `npm run data:process` command described
> here does not exist. The live project uses a Python + DuckDB pipeline covering
> all Mobi data from 2017 to date; see `pipeline/` and `README.md`.

# Real Mobi Data Integration

## Status

Implemented for the current MVP using April and May 2026 public Mobi by Rogers CSV files from `https://www.mobibikes.ca/en/system-data`.

The app remains fully client-side. Raw CSV files are processed locally before deployment, and the browser imports generated TypeScript datasets.

## Source

- Source page: `https://www.mobibikes.ca/en/system-data`
- April 2026 CSV: `public-trips-3.0-2026-04.csv`
- May 2026 CSV: `public-trips-3.0-2026-05.csv`
- License: Mobi system-data license linked from the source page.

The source page notes that times are rounded to the nearest hour, accounts are anonymized, operations trips are removed, and stopovers indicate cable-lock use away from a station.

## Raw Data Storage

Raw CSVs are not committed.

```text
data-raw/
  public-trips-3.0-2026-04.csv
  public-trips-3.0-2026-05.csv
```

`data-raw/` is ignored in `.gitignore`.

## Processing Command

```bash
npm run data:process -- --april /path/to/public-trips-3.0-2026-04.csv --may /path/to/public-trips-3.0-2026-05.csv
```

The script also looks for matching files in `data-raw/` and falls back to `/tmp/mobi-2026-04.csv` and `/tmp/mobi-2026-05.csv` for local agent runs.

## Current Outputs

```text
src/data/stations.ts
src/data/opportunities.ts
src/data/realMobi.ts
```

The generated data includes:

- month-keyed station metrics
- real monthly trip counts
- e-bike share
- classic/e-bike split
- hourly departure charts
- top station charts
- generated opportunity rankings
- connector score components

## Current Limitations

- The public trip CSVs do not include station coordinates.
- Map positions are generated front-end coordinates, not surveyed station locations.
- Transit proximity is estimated from station names and known transit landmarks.
- Exact route paths are unknown.
- Source timestamps are rounded to the nearest hour.

## Next Upgrade

1. Add official station coordinates from a station feed or maintained station reference.
2. Replace generated map positions with actual lat/lng.
3. Expand processing to a rolling 12-month source window.
4. Add optional station-pair flow charts from origin/destination counts.
5. Consider code-splitting Chart.js if chart scope continues to grow.
