# Feature 002 - Design System and Layout Foundation

Branch: `feature/design-system-layout`

## Goal

Create the visual foundation of the app so every later feature feels consistent and polished.

## Scope

- Define app-wide layout.
- Refine typography, spacing, cards, buttons, badges, and color usage.
- Establish a Mobi-inspired blue accent.
- Create reusable layout wrappers.
- Ensure the app looks like a professional data product.

## Components

Create or refine:

- `src/components/AppShell.tsx`
- `src/components/PageSection.tsx`
- `src/components/SectionHeader.tsx`
- `src/components/FeatureStatusBadge.tsx`

## Design Direction

- Clean, modern, Apple-like.
- White and very light gray background.
- Mobi blue accent.
- Rounded cards.
- Subtle borders.
- Minimal shadow.
- Good spacing.
- Desktop-first, responsive enough for mobile.

## Tests

- App shell renders children.
- Section headings render correctly.
- Feature status badges render correct labels.

## Browser Review

Use Playwright MCP when available to verify:

- Layout feels polished on desktop.
- Header and sections align correctly.
- Mobile viewport is usable.
- No console errors.

## Acceptance Criteria

- Visual foundation is consistent.
- No random one-off styling patterns.
- Tailwind is used for styling.
- shadcn/ui remains the base component system.
- App feels portfolio-ready before feature content is added.
