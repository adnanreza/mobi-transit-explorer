# Data Methodology

The app uses every trip file Mobi by Rogers has published — one 2017 workbook plus monthly files from January 2018 onward (102 files, 8.96M raw rows) — together with Mobi's GBFS station feed and City of Vancouver Open Data (rapid-transit stations, shoreline).

The authoritative, always-current description lives in two generated places:

- **The methodology section of the app** (`src/components/Methodology.tsx`) — sources, pipeline stages, drift handling, score definitions, limitations, with figures surfaced from `src/data/generated/meta.json`.
- **[`docs/data-quality-report.md`](data-quality-report.md)** — the full generated accounting: per-stage row funnel, drop reasons, quality-flag counts, membership mapping, trips per month.

## Pipeline summary

`pipeline/` (Python 3.11 + DuckDB; transforms in `pipeline/sql/`):

1. **acquire** — manifest-verified downloads (`download.py`), checksummed in `pipeline/manifest.json`; inventory checks (`inventory.py`).
2. **extract** — every file lands as VARCHAR with headers unified by `pipeline/mappings/column_eras.json`; unknown headers abort the run.
3. **clean** — typing, five timestamp formats, hard drops (blank stations, unparseable timestamps, exact duplicates from cross-file spillover).
4. **conform** — station IDs from name prefixes, canonical departure month, quality flags (flag, don't delete).
5. **model** — Kimball star schema: `fact_trips`, `dim_station` (GBFS coordinates + haversine distance to rapid transit), `dim_date`, `dim_membership` (all 85 raw labels explicitly mapped).
6. **publish** — `publish.py` and `geo_publish.py` emit ~80 KB (gzip) of typed JSON to `src/data/generated/`, enforced by a size budget; no per-trip data ships to the browser.

Raw data and the warehouse are never committed; the manifest and aggregates are. Commands: see `pipeline/README.md`.
