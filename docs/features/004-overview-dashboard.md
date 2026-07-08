# Feature 004 - Overview Dashboard Cards

Branch: `feature/overview-dashboard`

## Goal

Build the top-level metrics section that explains the project in under 30 seconds.

## Scope

Create `src/components/OverviewCards.tsx` using typed metrics data.

## Required Cards

- Trips analyzed
- Trips near transit
- Strong connector stations
- Expansion opportunities

## UI Requirements

Each card should include a metric label, metric value, short explanatory caption, lucide-react icon, shadcn `Card`, and optional `Badge` for context.

## Tests

- All metric cards render.
- Metric values appear.
- Captions appear.
- Component handles missing or empty metric data gracefully if applicable.

## Acceptance Criteria

- Overview section communicates the project quickly.
- Data comes from `src/data/metrics.ts`.
- No hardcoded metric values inside the component.
- Visual hierarchy is strong.
