# Mobi Transit Explorer

Mobi Transit Explorer is a portfolio front-end data product by Adnan Reza. It explores how Vancouver's Mobi bike share system can extend and complement transit access.

Live site: `https://mobi-transit-explorer.adnanreza.com`

## Stack

- React
- Vite
- TypeScript
- Tailwind CSS
- shadcn/ui component patterns
- lucide-react
- Vitest
- Testing Library
- Playwright MCP for browser review

## Feature Lifecycle

Every feature follows the strict `LOAD -> START -> TEST -> REVIEW -> COMPLETE` workflow documented in `docs/feature-lifecycle.md`.

- Work from `main`.
- Pull latest from `origin`.
- Create one feature branch per feature.
- Add implementation and documentation together.
- Test with Vitest.
- Review locally in a browser with Playwright MCP.
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

The app is deployed to `https://mobi-transit-explorer.adnanreza.com`.

**Platform:** Deploy from the `main` branch via any static host (Netlify, Vercel, Cloudflare Pages).

**Build settings:**
- Build command: `npm run build`
- Output directory: `dist`
- Node version: 18+

**No server-side configuration needed.** The app is fully client-side with no API routes, redirects, or environment variables required.

### Previewing the production build locally

```bash
npm run build
npm run preview
```

## Future Data Plan

The MVP uses sample data first. A future feature can integrate real Mobi CSV data in the browser, with documented schema, cleaning assumptions, station matching, transit context, derived metrics, and known limitations.
