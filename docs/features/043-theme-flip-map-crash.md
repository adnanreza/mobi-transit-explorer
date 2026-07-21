# Spec 043 — Theme flip crashed the page: map paint raced the style load

## Context

Owner report: switching themes blanks the whole page. Reproduced with Playwright against the production build: load the map, toggle the theme once — `#root` drops to zero children and the console shows MapLibre's "Error: Style is not done loading."

## Root cause

A spec-041 regression. The map's mode-paint effect gained `theme` in its dependencies (so Coverage colors follow the theme). But a theme flip also rebuilds the map (new basemap style), and React runs both effects in the same commit: the init effect replaces `mapRef.current` with a fresh, style-still-loading map, then the paint effect fires with a stale `loaded === true` from the previous render and calls `setPaintProperty`/`setFilter`/`setLayerZoomRange` against layers that don't exist yet. MapLibre throws, the exception escapes the effect, and with no error boundary React unmounts the entire tree.

It slipped through because the spec-041 verification toggled map modes but never toggled the theme after the map had loaded — the one interleaving that hits the race.

## The fix — gate on reality, and contain the blast radius

1. **Root cause** (src/components/InteractiveMap.tsx): the paint effect now bails unless the layers it touches actually exist (`map.getLayer(...)` for stations, transit-dots, transit-labels — `getLayer` returns undefined rather than throwing). The layers are only added by the new style's load handler, so their presence is the true readiness signal; the effect re-runs via `loaded` once the handler fires.
2. **Containment** (src/components/MapErrorBoundary.tsx, wrapped around the lazy map in src/components/Explorer.tsx): the WebGL map is the most crash-prone surface on the page; if it ever throws again, it degrades to a quiet bordered "The map hit an error — reload to restore it" panel instead of taking the site down with it.

## Verification

- 97 Vitest tests (2 new: the boundary renders children normally and contains a throwing child), typecheck, and build green.
- Playwright reproduction, before/after: old bundle — one toggle after map load → body text 18,570 → 10 chars, root emptied, "Style is not done loading" in console. Fixed bundle — a triple theme-flip deliberately timed inside the style-load window leaves body text identical (18,570 → 18,570), root intact, map canvas live, zero console errors; the error boundary was never triggered (root cause gated, boundary is insurance).
- Lesson added to the map verification checklist: theme-flip-after-map-load (and rapid double-flips) are part of any future map change's sweep.

## Lifecycle

Branch `fix/043-theme-flip-map-crash` → fix + boundary → verify → merge to main → push → deploy → owner re-tries the toggle that blanked it.
