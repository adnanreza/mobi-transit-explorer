# Feature 010 - Methodology Section

Branch: `feature/methodology-section`

## Goal

Explain how the MVP works and how real Mobi data will be used later.

## Scope

Build `src/components/Methodology.tsx`.

## Required Content

- MVP uses sample data.
- Future version will use public Mobi monthly trip CSVs.
- Near transit means within the selected walking distance.
- Transit connector score combines transit proximity, trip volume, commute pattern, e-bike share, and station connectivity.
- Public data limitations include anonymized users, rounded times, no exact route path, and excluded rebalancing or maintenance trips if applicable.

## UI Requirements

Use cards or grouped sections for Data sources, Connector score, Limitations, and Future version.

## Tests

- Methodology section renders.
- Key methodology headings appear.
- Limitations appear.

## Acceptance Criteria

- Methodology builds trust.
- It does not overclaim.
- It clearly distinguishes mock MVP from the future real-data version.
