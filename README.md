# Mobi Transit Explorer

Mobi Transit Explorer is a portfolio front-end data product by Adnan Reza. It explores how Vancouver's Mobi bike share network can extend and complement transit access through a focused, browser-only React experience.

Future live URL: `https://mobi-transit-explorer.adnanreza.com`

## Product Framing

The project is built to demonstrate front-end product thinking, data-product UI craft, and an interest in urban mobility. The current MVP processes public Mobi by Rogers system-data CSVs into static front-end datasets so the app remains browser-only while using real trip records.

In under 30 seconds, the app should communicate:

- Where bike share connects strongly with transit.
- Which stations look like useful transit connectors.
- Which areas may need more capacity, e-bikes, promotion, or monitoring.
- How the current front-end product can mature into a fuller mobility case study.

## Stack

- React
- Vite
- TypeScript
- Tailwind CSS
- shadcn/ui component patterns
- lucide-react
- Vitest
- Testing Library
- Playwright MCP for browser review when available
- Chart.js and react-chartjs-2 for canvas-backed charts

## Current MVP Features

- Polished app shell and portfolio framing.
- Design-system layout foundation with reusable sections and status badges.
- Generated real-data station metrics, overview charts, and opportunities from public Mobi CSVs.
- Overview metric cards.
- Interactive filter panel.
- Custom map-style mobility explorer without Leaflet or MapLibre.
- Station detail panel.
- Main explorer composition with filter, map, and station profile state.
- Opportunity ranking table.
- Methodology section with source-data limitations.
- Section navigation and accessibility polish.
- Reproducible local data-processing script.

## Screens and Sections

- `Overview`: high-level real Mobi metrics and canvas-backed charts.
- `Map`: filter controls, generated station/transit map, and selected station details.
- `Opportunities`: ranked operational opportunities with priority badges.
- `Methodology`: source-data disclosure, connector score explanation, limitations, and future data path.

## Data Methodology

The app uses every published Mobi by Rogers trip file (2017 through today, 8M+ rider trips) from `https://www.mobibikes.ca/en/system-data`, plus the Mobi GBFS station feed and City of Vancouver open data.

Raw files are not committed. They are acquired and processed by the offline Python + DuckDB pipeline documented in `pipeline/README.md`:

```bash
python3 -m venv .venv && .venv/bin/pip install -r pipeline/requirements.txt
.venv/bin/python pipeline/download.py        # fetch the full archive (manifest-verified)
.venv/bin/python pipeline/etl.py --stage all # build the DuckDB star schema
.venv/bin/python pipeline/publish.py         # emit src/data/generated/*.json
```

The committed app data lives in `src/data/generated/` (about 40 KB gzipped); the data-quality accounting lives in `docs/data-quality-report.md`.

## Feature Lifecycle

Every feature follows the strict `LOAD -> START -> TEST -> REVIEW -> COMPLETE` workflow documented in `docs/feature-lifecycle.md`.

- Work from `main`.
- Pull latest from `origin`.
- Create one feature branch per feature.
- Add implementation and documentation together.
- Test with Vitest.
- Review locally in a browser with Playwright MCP when available.
- Complete by committing the feature branch, merging locally into `main`, pushing `main`, deleting the local feature branch, and cleaning temporary artifacts.

## Local Setup

```bash
npm install
npm run dev
```

## Testing Commands

```bash
npm run test
npm run typecheck
npm run build
.venv/bin/python -m pytest pipeline/tests
```

## Deployment

Deployment target: `https://mobi-transit-explorer.adnanreza.com`.

**Platform:** Deploy from the `main` branch via any static host such as Netlify, Vercel, or Cloudflare Pages.

**Build settings:**

- Build command: `npm run build`
- Output directory: `dist`
- Node version: 18+

No server-side configuration is needed. The app is fully client-side with no API routes, redirects, or environment variables required.

### Previewing the Production Build Locally

```bash
npm run build
npm run preview
```

## Future Improvements

- Add official station coordinates from a station feed or maintained reference.
- Expand processing to a rolling 12-month source window.
- Graduate the generated coordinate map to a real map engine after the data model is proven.
- Add production preview checks before each deployment.
- Publish the portfolio case study at the future subdomain.
