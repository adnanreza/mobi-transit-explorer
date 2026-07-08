# Feature 001 - Project Scaffold and Core Documentation

Branch: `feature/project-scaffold`

## Goal

Create the foundation for Mobi Transit Explorer: Vite, React, TypeScript, Tailwind CSS, shadcn/ui patterns, Vitest, base documentation, README, and the initial app shell.

## Scope

- Initialize a React, Vite, and TypeScript project.
- Configure Tailwind CSS.
- Configure shadcn/ui component patterns.
- Configure the `@/` path alias.
- Add Vitest and Testing Library.
- Add `lucide-react`.
- Create base docs.
- Create the initial landing/app shell.

## Required Docs

- `README.md`
- `docs/product-spec.md`
- `docs/feature-lifecycle.md`
- `docs/data-methodology.md`
- `docs/review-checklist.md`
- `docs/features/001-project-scaffold.md`

## UI Requirements

- App title: `Mobi Transit Explorer`
- Subtitle: `How bike share extends transit in Vancouver`
- Portfolio label: `A front-end data product by Adnan Reza`
- Nav items: Overview, Map, Opportunities, Methodology
- Placeholder sections for future features.

## shadcn/ui Components

Use at minimum:

- `Button`
- `Card`
- `Badge`
- `Separator`

## Tests

- App renders.
- App title appears.
- Nav items appear.

## Browser Review

Use Playwright MCP when available to verify:

- App loads locally.
- Header is visible.
- Nav is visible.
- Placeholder sections are visible.
- No console errors.

## Acceptance Criteria

- App runs with `npm install` and `npm run dev`.
- Tailwind works.
- shadcn/ui works.
- Vitest works.
- Documentation exists.
- README is portfolio-quality.
- No broken imports.
- No console errors.
