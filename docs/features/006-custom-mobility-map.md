# Feature 006 - Custom Mobility Map

Branch: `feature/custom-mobility-map`

## Goal

Create the main visual feature: a polished map-like explorer showing Mobi stations and transit nodes.

## Scope

Build `src/components/MobilityMap.tsx` using Tailwind, divs, and/or SVG. Do not use Leaflet or MapLibre yet.

## Map Requirements

- Mobi station dots.
- Transit nodes.
- Station hover states.
- Selected station state.
- Connector score legend.
- Trip volume visual sizing.
- Mock Vancouver geography feel.

## Behavior

- Dot size reflects trip volume.
- Dot emphasis reflects connector score.
- Clicking a station updates selected station state.
- Hovering shows station name and score.
- Transit nodes have a distinct style and labels or tooltips.

## Tests

- Map renders stations.
- Map renders transit nodes.
- Clicking a station calls selection handler.
- Selected station receives selected state.

## Acceptance Criteria

- Map is polished enough for portfolio use.
- It communicates the transit and bike-share relationship clearly.
- No real map dependency yet.
- Data comes from typed mock data.
- Selected station state connects to the rest of the app.
