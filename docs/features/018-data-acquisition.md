# Feature 018 - Multi-Year Data Acquisition

Branch: `feature/data-acquisition`

## Goal

Acquire every external dataset the product needs - all published Mobi trip files (2017 to present), the Mobi GBFS station feed, and City of Vancouver reference geodata - through scripted, idempotent, verifiable downloads. This spec establishes the `pipeline/` workspace that specs 019 and 020 build on.

## Why Python

The pipeline is written in Python 3.11+ with DuckDB. This is a deliberate portfolio decision: the target Data Engineer role names Python and SQL explicitly, and Python + DuckDB is the lingua franca of modern lightweight data engineering. The app itself remains React/TypeScript and fully static.

## Scope

- Create the `pipeline/` workspace: `requirements.txt` (requests, duckdb, openpyxl, pytest), `README.md` explaining how to run each stage.
- Build a committed source manifest and a refresh script that regenerates it from the Mobi system-data page.
- Build an idempotent downloader for all trip files plus the GBFS and CoV reference datasets.
- Verify and inventory every downloaded file; fail loudly on anything unexpected.
- Do not parse or transform trip data yet - that is spec 019.

## Files

- `pipeline/README.md`
- `pipeline/requirements.txt`
- `pipeline/manifest.json`
- `pipeline/scrape_manifest.py`
- `pipeline/download.py`
- `pipeline/inventory.py`
- `pipeline/tests/test_manifest.py`
- `pipeline/tests/test_download.py` (unit-testable pieces: URL building, format detection, checksum logic - no network in tests)
- `.gitignore` (add `data-raw/`, `pipeline/__pycache__/`, `.pytest_cache/`)

## Sources (verified July 2026)

- **Trip files:** `https://www.mobibikes.ca/en/system-data` lists 103 Google Drive links: one `ALL of 2017` file plus monthly files January 2018 onward. Direct download works via `https://drive.usercontent.google.com/download?id=<ID>&export=download&confirm=t`.
- **Station feed:** Mobi GBFS 2.2 at `https://gbfs.kappa.fifteen.eu/gbfs/2.2/mobi/en/gbfs.json`; `station_information.json` has 265 stations with `station_id`, `name`, `lat`, `lon`, `capacity`.
- **CoV open data** (`https://opendata.vancouver.ca`, Explore API v2.1): `rapid-transit-stations` (22 stations with point geometry) and `shoreline-2002` (shoreline geometry). Export as GeoJSON.

## Manifest Rules

- `manifest.json` maps each period (`2017`, `2018-01`, ... latest month) to its Drive file ID, expected format, and, once downloaded, its SHA-256 and byte size.
- `scrape_manifest.py` fetches the system-data page, extracts month labels and Drive IDs, and merges into the manifest without clobbering recorded checksums. New months appear as new entries; changed IDs for existing months are reported, not silently overwritten.
- The manifest is committed. It is the reproducibility contract: anyone can re-download the exact archive.

## Downloader Rules

- `download.py` reads the manifest and downloads into `data-raw/trips/`, `data-raw/gbfs/`, and `data-raw/geo/`.
- Idempotent: files whose checksum matches the manifest are skipped. `--force` re-downloads.
- Detect real content type after download (magic bytes, not file extension): known eras are XLSX (2017), CSV (most months), and Google Sheets exports (at least Oct 2022 and Feb 2024 - export via the Sheets CSV export URL when the Drive download returns a Sheets document). An HTML response means a failed/interstitial download and must be an error, never saved as data.
- Retries with backoff; a per-file failure does not abort the run, but the run exits non-zero if any file failed.
- GBFS and CoV downloads are snapshotted with a fetch date recorded in the manifest.

## Inventory Rules

- `inventory.py` writes `data-raw/inventory.md`: per file - period, format detected, byte size, SHA-256, and row count (cheap line count for CSV; sheet dimension for XLSX).
- Sanity checks that fail the run: missing periods in the continuous 2018-present monthly range, any file under 100 KB, any format outside {csv, xlsx}, duplicate checksums across different periods.

## Tests

Run:

```bash
python -m pytest pipeline/tests
npm run test
npm run typecheck
npm run build
```

Pipeline tests cover: manifest merge behavior (new month, changed ID, preserved checksums), Drive/Sheets URL construction, content-type detection from magic bytes, and inventory sanity checks - all with local fixtures, no network.

## Acceptance Criteria

- One command (`python pipeline/download.py`) fetches the full archive into `data-raw/` on a clean machine.
- Re-running it downloads nothing and exits clean.
- `manifest.json` is committed with checksums for every trip file, GBFS snapshot, and CoV dataset.
- `data-raw/inventory.md` exists locally and reports all periods 2017 through the latest published month with no gaps.
- No raw data files are committed; `.gitignore` covers all download targets.
- pytest, Vitest, typecheck, and build all pass; the app is unchanged.
