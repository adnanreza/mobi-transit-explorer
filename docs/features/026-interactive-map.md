# Feature 026 - Interactive Map with Real Basemap

Branch: `feature/interactive-map`

## Goal

Upgrade the map from a static SVG to a zoomable, pannable MapLibre GL map on
a real basemap, so viewers can zoom from the whole network down to a single
intersection and trust what they see. Supersedes spec 021's no-map-library
decision at the product owner's request; the SVG map proved the data, this
makes it explorable.

## Decisions

- **MapLibre GL JS** (open source, no vendor lock-in) with the **OpenFreeMap
  Positron** vector style: free, keyless, production-permitted, and quietly
  monochrome - the app's single blue accent stays the loudest thing on screen.
- The map component **lazy-loads** (React.lazy) so MapLibre's bundle weight
  never blocks first paint of the hero and overview.
- `cooperativeGestures` on: page scrolling is never hijacked; ctrl/cmd+scroll zooms.
- Keyboard and screen-reader access moves to a dedicated **station finder
  select** beside the filters - fitter for 262 stations than tab-cycling dots,
  and it doubles as search for everyone.
- OSM/OpenFreeMap attribution stays visible (license requirement).
- `src/lib/projection.ts` and `geo/land.json` remain (adapter coordinates and
  potential static/OG rendering); the SVG `MobilityMap` component is removed.

## Layers

- **Stations**: GeoJSON circle layer from `stations.json` - radius scales with
  trailing-12-month trips and zoom; fill opacity scales with connector score
  on the Mobi blue; white hairline stroke. Click selects; hover shows a quiet
  popup (name, trips/month, score).
- **Selected station**: highlight ring + line layer to its top 5 destinations.
- **Rapid transit**: dark dot layer with text labels appearing past zoom ~12.

## Files

- `src/components/InteractiveMap.tsx` (new; renders a placeholder in test mode
  like the chart components - jsdom has no WebGL)
- `src/components/StationFinder.tsx` (accessible station select)
- `src/components/Explorer.tsx` (lazy map + finder wiring)
- Delete `src/components/MobilityMap.tsx` + test
- `src/index.css` (popup + attribution styling)
- `package.json` (+ maplibre-gl)
- README stack/claims updated ("no map library" is no longer true)

## Tests

Run: `npm run test && npm run typecheck && npm run build` plus pytest.

- Explorer: selecting a station through the finder updates the detail panel;
  filters and reset still work.
- InteractiveMap: test-mode placeholder renders with an accessible label.
- Contract tests unchanged (map consumes the same generated artifacts).

Browser review: zoom from network view to street level; tiles legible; station
selection syncs finder, map highlight, and detail panel; no console errors;
mobile pinch-zoom works with cooperative gestures.

## Acceptance Criteria

- Users can zoom/pan on a real basemap and identify individual intersections.
- Stations render from generated data only; selection round-trips between
  finder, map, and detail panel.
- Initial page load does not fetch MapLibre until the map scrolls near view
  (lazy chunk), and the total added initial JS is ~0.
- Attribution visible; no API keys or paid services introduced.
- Vitest, typecheck, build, and pytest all pass.
