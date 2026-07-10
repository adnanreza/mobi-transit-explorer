# Roadmap v2 - Nine Years of Mobi

Version 2 turns the two-month MVP into a multi-year data product with a distinctive, Apple-inspired visual identity. It is built for two audiences:

1. **Mobi by Rogers** - demonstrate genuine love for the system and operational insight.
2. **City of Vancouver, Computer Programmer III (Data Engineer)** - demonstrate real ETL/ELT, SQL, dimensional modeling, and data-quality craft on messy multi-year public data.

## Direction

- **Data:** all published Mobi trip data (ALL of 2017 + monthly files Jan 2018 to present, ~6-8M trips) processed through a staged Python + DuckDB pipeline with a Kimball-style star schema and a published data-quality report. The app stays fully static: the pipeline runs offline and publishes small JSON aggregates.
- **Geography:** real coordinates everywhere. Mobi GBFS station feed + City of Vancouver open data (rapid transit stations, shoreline) replace all mock geography.
- **Design:** clean, minimal, Apple-product-page aesthetic. No pill badges, no gradient cards, no icon tiles, no self-referential product copy. Big editorial typography, hairline rules, near-monochrome palette with one Mobi blue accent, unified chart theme.
- **Narrative:** the app tells the story of nine years of bike share in Vancouver - growth, seasons, the pandemic, e-bikes, weather - in a personal, car-free voice.

## Clarification to the feature lifecycle

The offline data pipeline (`pipeline/`) is build-time tooling, like the existing `scripts/process-mobi-data.mjs`. It is not backend code: the shipped app remains browser-only static files. Pipeline code is Python and is tested with pytest; app code remains React/TypeScript tested with Vitest.

## Spec sequence

| Spec | Branch | Delivers |
| --- | --- | --- |
| 018 | `feature/data-acquisition` | Scripted download + verification of all trip files, GBFS stations, CoV open data |
| 019 | `feature/etl-warehouse` | Staged ETL, unified trip schema across eras, DuckDB star schema, data-quality report |
| 020 | `feature/published-aggregates` | SQL-published JSON aggregates + typed data contracts consumed by the app |
| 021 | `feature/real-vancouver-map` | Real-geography SVG map: shoreline, 265 stations, rapid transit stations |
| 022 | `feature/visual-redesign` | Apple-esque design system: typography, palette, components, chart theme |
| 023 | `feature/yearly-story` | Year-over-year narrative section: growth, seasonality, COVID, e-bikes, weather |
| 024 | `feature/explorer-refresh` | Explorer rebuilt on multi-year data: filters, station profiles, opportunities |
| 025 | `feature/methodology-case-study` | Methodology rewritten as a data-engineering case study; README and copy pass |
| 026 | `feature/interactive-map` | Zoomable MapLibre GL map on the OpenFreeMap basemap (supersedes 021's static SVG at the owner's request) |
| 027 | `feature/motion-polish` | Subtle Apple-style motion: staggered reveals, count-up numerals, charts that draw on arrival, scrollspy nav |
| 028 | `feature/data-integrity-fixes` | External-review response: membership retention, station crosswalk, negative distances, cross-file-only dedup, license posture |

## v3 sequence (improve the flagship)

| Spec | Branch | Delivers |
| --- | --- | --- |
| 029 | `feature/station-flows` | Station flows by hour + implied rebalancing (~416 bikes/day moved by hand) |
| 030 | `feature/weather-model` | Environment Canada weather ETL + constrained GBM ridership model + forecast widget |
| 031 | `feature/ebike-purpose` | E-bike vs classic contrasts (detour factor) + leisure/utility heuristic, story chapter 6, map colour mode |

Specs 018-020 are the foundation and should land first, in order. 021 depends on 020. 022 can start in parallel with 021. 023-025 depend on 020 and 022.

## Deployment

Cloudflare Pages, serving the static `dist/` build at `mobi-transit-explorer.adnanreza.com` (domain DNS is on Cloudflare). The host runs `npm run build` only; the Python pipeline runs locally and its JSON outputs are committed, so no server-side runtime is ever required.

## Data license

Mobi system data is used under the Mobi Data License Agreement (https://www.mobibikes.ca/en/system-data). Raw files are never committed. City of Vancouver datasets are used under the Open Government Licence - Vancouver. Both sources are credited in the app's methodology section.
