# Mobi Transit Explorer

Mobi Transit Explorer is a portfolio front-end data product by Adnan Reza. It explores how Vancouver's Mobi bike share network can extend and complement transit access through a focused, browser-only React experience.

Future live URL: `https://mobi-transit-explorer.adnanreza.com`

## Product Framing

The project is built to demonstrate front-end product thinking, data-product UI craft, and an interest in urban mobility. The MVP uses mock data intentionally: it lets the interface, state flow, visual hierarchy, and methodology become clear before real public Mobi CSV processing is introduced.

In under 30 seconds, the app should communicate:

- Where bike share connects strongly with transit.
- Which stations look like useful transit connectors.
- Which areas may need more capacity, e-bikes, promotion, or monitoring.
- How the current mock-data MVP can become a real-data product.

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

## Current MVP Features

- Polished app shell and portfolio framing.
- Design-system layout foundation with reusable sections and status badges.
- Typed mock data for Mobi stations, transit nodes, metrics, and opportunities.
- Overview metric cards.
- Interactive filter panel.
- Custom map-style mobility explorer without Leaflet or MapLibre.
- Station detail panel.
- Main explorer composition with filter, map, and station profile state.
- Opportunity ranking table.
- Methodology section.
- Section navigation and accessibility polish.

## Screens and Sections

- `Overview`: high-level sample metrics for trips, transit adjacency, connectors, and opportunities.
- `Map`: filter controls, custom station/transit map, and selected station details.
- `Opportunities`: ranked operational opportunities with priority badges.
- `Methodology`: mock-data disclosure, connector score explanation, limitations, and future data path.

## Data Methodology

The MVP uses realistic mock data. It does not claim to represent live Mobi performance.

Future real-data work can replace mock data with public Mobi monthly trip CSVs. That phase should document source files, schema, cleaning rules, station matching, transit proximity, connector-score calculation, and known limitations.

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

- Replace mock station and opportunity data with processed public Mobi CSV outputs.
- Add a documented data-processing script.
- Expand the custom map or graduate to a real map engine after the MVP is proven.
- Add production preview checks before each deployment.
- Publish the portfolio case study at the future subdomain.
