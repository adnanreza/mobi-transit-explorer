# Data Pipeline

Offline tooling that acquires and (in later stages) processes the public Mobi
by Rogers trip archive. The shipped app never runs any of this: the pipeline
executes locally and publishes small static artifacts that are committed.

## Setup

```bash
python3 -m venv .venv
.venv/bin/pip install -r pipeline/requirements.txt
```

## Commands (in order)

```bash
# 1. Refresh the source manifest from mobibikes.ca/en/system-data.
#    New months are added; changed Drive IDs are reported, not applied,
#    unless you pass --accept-changes.
.venv/bin/python pipeline/scrape_manifest.py

# 2. Download everything in the manifest (trips + GBFS + CoV geodata).
#    Idempotent: re-runs skip files whose checksums already match.
.venv/bin/python pipeline/download.py

# 3. Verify the archive and write data-raw/inventory.md.
#    Exits non-zero on gaps, small files, or checksum mismatches.
.venv/bin/python pipeline/inventory.py

# 4. Build the warehouse: extract -> clean -> conform -> model.
#    Stages are individually re-runnable via --stage.
.venv/bin/python pipeline/etl.py --stage all

# 5. Fetch Environment Canada daily weather. publish.py and train_model.py
#    both read data-raw/weather/, so this must run before them.
.venv/bin/python pipeline/weather_fetch.py

# 6. Publish app artifacts: JSON aggregates + simplified land geometry.
.venv/bin/python pipeline/publish.py
.venv/bin/python pipeline/geo_publish.py

# 7. Regenerate the committed data-quality report from the warehouse.
.venv/bin/python pipeline/quality_report.py

# 8. Train the ridership model -> src/data/generated/forecast.json.
.venv/bin/python pipeline/train_model.py

# Tests (no network)
.venv/bin/python -m pytest pipeline/tests
```

## Warehouse

`data-warehouse/mobi.duckdb` (not committed) holds a Kimball-style star schema:
`fact_trips` (8.7M trips), `dim_station`, `dim_date`, `dim_membership`, plus
`etl_metrics` (per-stage row accounting) and the staging tables. Transform
logic lives in `pipeline/sql/` as plain SQL; `etl.py` only orchestrates.
Cleaning philosophy: flag suspect rows, drop only the unusable (blank
stations, unparseable timestamps, exact duplicates). The full accounting is
regenerated into `docs/data-quality-report.md`.

## What is committed vs. not

- **Committed:** `pipeline/manifest.json` (period -> Drive ID + SHA-256 + size;
  the reproducibility contract for the whole archive).
- **Not committed:** everything under `data-raw/` (~2 GB of raw trip files and
  reference snapshots). Anyone can rebuild it with the two commands above.

## Sources

- Trip files: https://www.mobibikes.ca/en/system-data (Mobi Data License
  Agreement applies — non-commercial analysis use; see the License section of
  the repo README). The downloader automates clicking the same public links
  the page provides; placing manually-downloaded files in `data-raw/trips/`
  named `<period>.<ext>` is an equally supported path, and the manifest
  verifies checksums either way. A re-download whose content differs from the
  manifest checksum fails unless `--accept-changes` is passed.
  One `ALL of 2017` file, then one file per month from
  January 2018. Formats drift across the years (XLSX, CSV, Google Sheets);
  the downloader detects real content by magic bytes, never by extension.
  Page quirks handled deliberately: the November 2021 label is misspelled
  "Novemeber 2021" (mapped explicitly in `common.py`), and an unlabeled link
  next to `ALL of 2017` is a duplicate 2017 export without the Account column
  (ignored; the scraper reports it as unrecognized on every run).
- Stations: Mobi GBFS 2.2 `station_information.json` (Fifteen platform).
- Geometry: City of Vancouver Open Data (`rapid-transit-stations`,
  `shoreline-2002`), Open Government Licence - Vancouver.

## Monthly refresh

When Mobi publishes a new month: rerun the commands above in order
(`scrape_manifest` → `download` → `inventory` → `etl` → `weather_fetch` →
`publish` → `geo_publish` → `quality_report` → `train_model`), commit the
regenerated artifacts, and push — Cloudflare Pages redeploys from the static
build.
