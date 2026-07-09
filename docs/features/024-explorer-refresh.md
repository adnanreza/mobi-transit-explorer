# Feature 024 - Explorer Refresh on Multi-Year Data

Branch: `feature/explorer-refresh`

## Goal

Rebuild the interactive explorer (filters + map + station profile) and the opportunities section around the multi-year dataset and the new design system, so the analytical half of the product matches the storytelling half in both substance and style.

## Scope

- Filters redesigned for the multi-year window and restyled per spec 022.
- Station detail panel rebuilt as a compact multi-year profile.
- Opportunity section rebuilt on the rule-based `opportunities.json` with evidence shown.
- All explorer state remains client-side over published aggregates; no per-trip data in the browser.

## Filters v2

- **Year** (2017-present, default: latest full 12 months), **Day type** (all/weekday/weekend), **Time of day** (buckets; label notes hour-rounding), **Bike type** (all/classic/e-bike; e-bike option disabled with explanation for years before introduction), **Transit distance** (all/≤300 m/≤600 m of a rapid-transit station - now real distances).
- Filters drive the map's station metrics and the detail panel. Aggregate slices come from `stations.json` per-year metrics; combinations not present in published artifacts are removed from the UI rather than faked - every filter shown must be honest.
- Restyle: hairline-separated row of quiet selects (Radix base), no card chrome, no filter-chip pills; one "Reset" text button.

## Station Profile v2

Selecting a station shows: name + neighborhood line; connector score with its real component breakdown (transit distance now geometric, from spec 020); trips-per-year mini bar (2017-present, revealing when the station came online); top 5 destinations as named links that select that station on the map; e-bike share vs network; capacity and nearest rapid-transit station with walking distance. One quiet panel, typography-led, no icon tiles.

## Opportunities v2

- Table becomes a ranked list of finding rows: station, plain-language finding, and the evidence numbers cited inline ("18.4 trips/dock/day vs network median 9.1"), rule tag, priority.
- Priority badges restyled to text-weight + accent, not colored pills.
- A one-line footer links each rule to its definition in the methodology section.

## Files

- `src/components/Explorer.tsx`, `FilterPanel.tsx`, `StationDetailPanel.tsx`, `OpportunityTable.tsx` (rebuilt)
- `src/lib/explorerSelectors.ts` (pure functions: filter state → station metrics; unit-test target)
- `src/components/__tests__/` updates for all four

## Behavior Rules

- Filter changes update map + detail without layout shift; selection survives filter changes when the station remains visible, else clears with the panel's empty state.
- Empty states are designed (quiet sentence, not a bare card): no station selected; filter combination with no qualifying stations.
- Keyboard: full filter and station traversal; panel is a labeled region announced on selection.
- URL hash preserves selected station and year so a specific view is shareable.

## Tests

Run:

```bash
npm run test && npm run typecheck && npm run build
```

Unit: `explorerSelectors` covers each filter dimension and combinations against fixtures, including pre-e-bike years and the no-results path; opportunity rows render cited evidence from fixture data; hash round-trip restores state. Browser review: filter-map-panel loop feels immediate; restyle consistent with 022; mobile usable; no console errors.

## Acceptance Criteria

- Every filter reflects real published data honestly (no faked slices, no dead options).
- Station profiles show believable multi-year histories including first-seen year.
- Opportunities cite their evidence numbers inline and trace to documented rules.
- Shareable URL state works for station + year.
- Vitest, typecheck, and build pass.
