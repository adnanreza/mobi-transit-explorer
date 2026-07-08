# Feature 007 - Station Detail Panel

Branch: `feature/station-detail-panel`

## Goal

Create the station profile panel that explains why a selected station matters.

## Scope

Build `src/components/StationDetailPanel.tsx`.

## Required Content

- Station name
- Area
- Nearby transit node
- Transit connector score
- Monthly trips
- Percent trips near transit
- E-bike share
- Top destinations
- Station label

## Labels

Use one of: Strong connector, E-bike opportunity, Underused near transit, Expansion opportunity, Recreation-heavy.

## shadcn/ui Components

Use `Card`, `Badge`, `Progress`, `Separator`, and `Table` or a structured list.

## States

- Selected station
- No station selected
- Mobile layout if needed

## Tests

- Empty state renders.
- Selected station details render.
- Top destinations render.
- Score/progress renders.
- Label badge renders.

## Acceptance Criteria

- Station panel makes the map meaningful.
- Selected state is clear.
- Data is not hardcoded inside the component.
- Component looks polished and portfolio-ready.
