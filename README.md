# Mobi Transit Explorer

**Live: [mobi-transit-explorer.adnanreza.com](https://mobi-transit-explorer.adnanreza.com)**

Nine years of Vancouver bike share — 8+ million Mobi trips — cleaned, modeled, and told as an interactive data story.

I've lived in Vancouver since 2015 and have never owned a car here — Mobi, walking, and TransLink are how I actually move through this city, zero regrets. This project turns every monthly trip file Mobi has published (2017 to date) into a case study of both the network and the craft of handling messy public data. Built by [Adnan Reza](https://adnanreza.com) ([LinkedIn](https://www.linkedin.com/in/adnanreza/)).

## What it shows

- **Nine years of change** — growth from 547k to 1.23M annual trips, the seasonal wave, the 2020 dip and recovery, e-bikes reaching a third of trips in three years, and how temperature moves ridership.
- **A zoomable map of the real network** — 262 GBFS-geocoded active stations on a MapLibre basemap, sized by any year's volume (2017 shows the original downtown-only network), scored by transit connection, with shareable URL state.
- **Operational findings that cite their evidence** — dock-capacity pressure, e-bike gaps, and underperforming transit connectors, each derived from an explicit rule.

## How it's built

**Two halves, deliberately separated:**

```
 Mobi trip files (102, 2017→today)     Mobi GBFS · CoV Open Data
        │                                      │
        ▼                                      ▼
 ┌─────────────────────────────────────────────────────┐
 │ pipeline/  (Python + DuckDB, runs locally)          │
 │ acquire → extract → clean → conform → model → publish│
 │ star schema: fact_trips + dim_station/date/membership│
 └──────────────────────┬──────────────────────────────┘
                        ▼  ~40 KB gzipped JSON (committed)
 ┌─────────────────────────────────────────────────────┐
 │ src/  (React + TypeScript + Vite, fully static)     │
 │ story charts · MapLibre map · explorer · methodology │
 └─────────────────────────────────────────────────────┘
```

- **Pipeline:** Python 3.11 + DuckDB. Transforms are plain SQL (`pipeline/sql/`). 8,961,723 raw rows in; 8,717,352 trips kept; every drop and flag accounted for in the generated [data-quality report](docs/data-quality-report.md).
- **App:** React 19, TypeScript, Vite, Tailwind, Chart.js, MapLibre GL (lazy-loaded). No backend, no API keys, no env vars — the host serves static files.
- **The hard part, on purpose:** nine years of format drift — 31 column layouts, five timestamp formats, three file containers, broken Unicode in a Squamish-language station name — each handled by an explicit, tested rule. The trip files' bike-sensor temperature is unreliable (0° sentinels, impossible highs), so weather uses Environment Canada ambient data instead. Unknown drift stops the pipeline; nothing is guessed silently.

## Reproduce it

```bash
# App only (uses committed aggregates)
npm install && npm run dev

# Full pipeline (downloads ~1 GB of public trip files)
python3 -m venv .venv && .venv/bin/pip install -r pipeline/requirements.txt
.venv/bin/python pipeline/download.py        # manifest-verified acquisition
.venv/bin/python pipeline/etl.py --stage all # DuckDB star schema
.venv/bin/python pipeline/weather_fetch.py   # Environment Canada daily weather (publish needs it)
.venv/bin/python pipeline/publish.py         # JSON aggregates -> src/data/generated/
.venv/bin/python pipeline/geo_publish.py     # simplified shoreline geometry
.venv/bin/python pipeline/quality_report.py  # regenerate docs/data-quality-report.md
.venv/bin/python pipeline/train_model.py     # ridership model -> forecast.json
```

Committed: the source manifest (with checksums for all 102 files) and the small generated aggregates. Never committed: raw trip data or the warehouse.

## Tests

```bash
npm run test        # Vitest: components + data contracts
npm run typecheck
npm run build
.venv/bin/python -m pytest pipeline/tests   # pipeline: era mapping, flags, dedupe
```

## Data notes (the honest part)

- Timestamps are hour-rounded at source for rider privacy; April 2019 alone has minutes.
- Monthly files repeat neighbouring months' trips — deduplicated; a trip's month is its departure month.
- The trip files' temperature is a bike-mounted sensor (0° sentinels, values Vancouver has never reached); weather analysis uses Environment Canada ambient data instead.
- Retired stations keep their trips but have no public coordinates.
- Full accounting: [docs/data-quality-report.md](docs/data-quality-report.md).

## Feature lifecycle

Every feature follows `LOAD → START → TEST → REVIEW → COMPLETE` on its own branch (`docs/feature-lifecycle.md`), specced in `docs/features/`. The v2 roadmap is `docs/roadmap-v2.md`.

## Stack

React · TypeScript · Vite · Tailwind CSS · shadcn/ui patterns · Chart.js · MapLibre GL · Python · DuckDB · pytest · Vitest · Playwright

## Deployment

Cloudflare Pages serving `dist/` at [mobi-transit-explorer.adnanreza.com](https://mobi-transit-explorer.adnanreza.com). Build: `npm run build`, output `dist`, Node 18+. No server-side configuration.

## License and credits

**Code** is MIT-licensed (see `LICENSE`). **The MIT license does not extend to data**: the generated files under `src/data/generated/` and `docs/data-quality-report.md` are analysis outputs derived from Vancouver Bike Share Inc. (Mobi) system data, published here solely as source material for this independent, non-commercial analysis under the [Mobi Data License Agreement](https://www.mobibikes.ca/en/system-data); they may not be redistributed for commercial purposes or treated as MIT-licensed. Raw trip data is never committed.

On acquisition: `pipeline/download.py` mirrors the same publicly linked trip files that appear on VBS's system-data page — the same files a person clicks to download manually. Manually downloading files into `data-raw/` is an equally supported path (the checksum manifest verifies either). Questions about the agreement go to info@mobibikes.ca.

**Disclaimer:** This is an independent, non-commercial project. It is not affiliated with, endorsed by, or approved by Mobi by Rogers, Vancouver Bike Share Inc., or the City of Vancouver. "Mobi" and "Mobi by Rogers" are trademarks of Vancouver Bike Share Inc., used here descriptively to identify the public dataset being analyzed.

Geometry and transit locations from [City of Vancouver Open Data](https://opendata.vancouver.ca) (Open Government Licence – Vancouver). Weather based on [Environment and Climate Change Canada](https://climate.weather.gc.ca) data. Basemap © [OpenFreeMap](https://openfreemap.org) / OpenStreetMap contributors.
