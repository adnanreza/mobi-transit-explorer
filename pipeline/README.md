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

# Tests (no network)
.venv/bin/python -m pytest pipeline/tests
```

## What is committed vs. not

- **Committed:** `pipeline/manifest.json` (period -> Drive ID + SHA-256 + size;
  the reproducibility contract for the whole archive).
- **Not committed:** everything under `data-raw/` (~2 GB of raw trip files and
  reference snapshots). Anyone can rebuild it with the two commands above.

## Sources

- Trip files: https://www.mobibikes.ca/en/system-data (Mobi Data License
  Agreement applies). One `ALL of 2017` file, then one file per month from
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

When Mobi publishes a new month: run the three commands above, then the
process/publish stages (specs 019-020), commit the regenerated artifacts, and
push - Cloudflare Pages redeploys from the static build.
