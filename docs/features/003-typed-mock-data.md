# Feature 003 - Typed Mock Data Layer

Branch: `feature/typed-mock-data`

## Goal

Create the structured mock data layer that powers the MVP before real Mobi CSV integration.

## Scope

Create typed mock data files:

- `src/types/index.ts`
- `src/data/stations.ts`
- `src/data/transitNodes.ts`
- `src/data/opportunities.ts`
- `src/data/metrics.ts`

## Data Requirements

- 10-15 realistic Mobi stations.
- 5-7 transit nodes, including Waterfront, Commercial-Broadway, Olympic Village, VCC-Clark, Main Street-Science World, Yaletown-Roundhouse, and Broadway-City Hall.
- Overview metrics.
- Opportunity rankings.
- Station-level details.
- Top destinations.
- Bike type split.
- Transit connector score.

## Station Fields

Each station should include `id`, `name`, `area`, mock map `x` and `y` position, nearby transit node, connector score, monthly trips, trips near transit percentage, e-bike share, label, top destinations, trip volume, and commute strength.

## Tests

- Stations array is not empty.
- Transit nodes array is not empty.
- Each station has required fields.
- Connector scores are within expected range.
- Opportunity data has rank, type, reason, and priority.

## Acceptance Criteria

- Data is separated from components.
- Types are meaningful.
- Mock data feels realistic enough for a portfolio MVP.
- No component contains large hardcoded datasets.
