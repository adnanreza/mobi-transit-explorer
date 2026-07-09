# Feature 021 - Real Vancouver Map

Branch: `feature/real-vancouver-map`

## Goal

Replace the mock geography with the real city. The map is the emotional center of the product for a Vancouver audience - anyone from Mobi or the City will look for their neighborhood first. It must be recognizably Vancouver: the downtown peninsula, Stanley Park, False Creek, Kitsilano, the Burrard Inlet shoreline.

## Scope

- Stay with a custom SVG map - no Leaflet/MapLibre, no tiles. Minimal, monochrome, Apple-style cartography built from real geometry.
- Pipeline step that converts CoV shoreline geometry + GBFS stations + rapid-transit stations into simplified, projected GeoJSON committed to the app.
- Rebuild `MobilityMap` on real coordinates: all ~265 active stations, 22 rapid-transit stations, real land/water shapes.
- Remove every "mock geography" label and apology from the UI.

## Files

- `pipeline/geo_publish.py` (simplify + project + export)
- `src/data/generated/geo/shoreline.json`, `src/data/generated/geo/transit.json` (committed)
- `src/components/MobilityMap.tsx` (rebuilt)
- `src/lib/projection.ts` (lat/lon → viewBox)
- `src/components/__tests__/MobilityMap.test.tsx`

## Geometry Rules

- Projection: equirectangular scaled by cos(mean latitude) - flat, deterministic, adequate at city scale; implemented once in `projection.ts` and shared by every layer so stations, transit, and shoreline can never drift apart.
- Bounds: fit the Mobi service area from actual station extent plus padding (roughly UBC-adjacent west edge to Commercial Drive east, Burrard Inlet to 41st Ave); Stanley Park and both shorelines must be visible for recognizability.
- Simplification: Douglas-Peucker in `geo_publish.py`; combined geo JSON under 150 KB raw. Water is the background, land is drawn - visually calm and cheap.
- Stations render from `stations.json` coordinates (spec 020); this spec adds no new station data.

## Visual Rules (anticipating spec 022)

- Land: near-white; water: very pale blue-gray; no borders, no grid lines, no compass, no fake roads.
- Rapid-transit stations: small dark markers with hairline connecting lines along the two corridors (Expo/Millennium roughly east-west, Canada Line north-south); labels only for termini and interchange stations at default view.
- Mobi stations: dots sized by annual trips (sqrt scale), filled by connector score on a single blue ramp. Selected station: ring highlight + connecting lines to its top 5 destination stations.
- Hover: station name tooltip. Click: selects for the detail panel (state contract with `Explorer` unchanged where possible).
- Keyboard access: stations reachable/selectable via keyboard as today; `aria-label` per station with name and trip count.

## Out of Scope

- Pan/zoom, street detail, bike-route overlays, animation between filter states. Note them in the methodology's future section instead of half-shipping them.

## Tests

Run:

```bash
python -m pytest pipeline/tests
npm run test && npm run typecheck && npm run build
```

- Unit: projection round-trips known landmarks to expected relative positions (Waterfront NE of Kits Beach, Science World east of Yaletown); geo JSON under size budget; every station's projected point lands inside the viewBox.
- Component: renders all stations, selection fires, aria labels present.

Browser review: the map reads as Vancouver at a glance; False Creek and Stanley Park identifiable; no console errors; acceptable render performance with 265 nodes (static SVG, no per-frame work).

## Acceptance Criteria

- Every station renders at its true location; transit stations and shoreline are real CoV geometry.
- "Mock/generated geography" language is gone from UI and copy.
- A Vancouverite can find their local station within seconds.
- Interactions (select, detail panel, filters) still work against real data.
- pytest, Vitest, typecheck, and build pass.
