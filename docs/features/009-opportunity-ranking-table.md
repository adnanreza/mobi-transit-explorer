# Feature 009 - Opportunity Ranking Table

Branch: `feature/opportunity-ranking-table`

## Goal

Create the ranked list of Mobi/transit improvement opportunities.

## Scope

Build `src/components/OpportunityTable.tsx`.

## Required Columns

- Rank
- Area/station
- Opportunity type
- Reason
- Priority level

## Opportunity Types

Examples include Add station nearby, Increase dock capacity, Promote as transit connector, Prioritize e-bikes, Monitor demand, and Already well served.

## Priority Badges

Use High, Medium, and Low.

## shadcn/ui Components

Use `Table`, `Badge`, `Card`, and `Separator`.

## Tests

- Table renders.
- Opportunity rows render.
- Priority badges render.
- Empty state works if data is empty.

## Acceptance Criteria

- Table is clear and decision-oriented.
- It feels like a product/ops insight, not raw data.
- Data comes from `src/data/opportunities.ts`.
