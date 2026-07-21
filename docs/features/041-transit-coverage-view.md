# Spec 041 — Transit Coverage map view + fourth personal request

## Context

The owner's "crazier" ask: a Mobi dock at every SkyTrain station in Vancouver proper, naming Nanaimo, Renfrew, Rupert, 29th Avenue, and Joyce–Collingwood as the ones without docks nearby. Verified against the artifacts, the claim is stronger than the ask: the split is perfectly binary. Twelve rapid-transit stations have a dock within ~210 m of the door; the other eight — the five named plus the Canada Line's whole southern leg (Marine Drive 3.9 km, Langara–49th 2.1 km, Oakridge–41st 1.3 km) — have none within a kilometre. There is no middle ground in the data. That earned both a fourth Personal Request and a third map view to draw it.

## Changes

**1. Shared derivation** — src/data/index.ts exports `transitCoverage` (nearest-dock distance per unique rapid-transit station, haversine over all 262 active docks) and `DOCKED_TRANSIT_RADIUS_M` (500 m walking threshold; uncontroversial given the binary split). Both the map and the request annotation consume it, so the two can never disagree.

**2. Coverage map view** — src/components/Explorer.tsx gains a third mode button ("Coverage") with full URL round-tripping (`?color=coverage`), and a mode-specific explainer whose counts derive from `transitCoverage`. src/components/InteractiveMap.tsx repaints in place (no re-created sources): Mobi dots dim to 0.12 opacity as context, transit stops render filled-ink when a dock sits within 500 m and as larger accent rings when the nearest dock is over a kilometre away, and the ringed stations' labels show at every zoom (`setFilter` + `setLayerZoomRange` on the existing label layer). The corner legend swaps to a filled/ringed key. All paints derive from the per-theme `MAP_COLORS`, so the view works in dark mode and survives theme remounts (the effect re-runs on `loaded`/`theme`).

**3. Fourth personal request** — "Meet the train everywhere" in src/components/PersonalRequests.tsx, pointing readers at the Coverage view; annotation derives live ("8 of 20 rapid-transit stations lack a dock within 1 km"). Section description moves to "four requests".

**4. Contract test for the claim** — src/data/generated.test.ts pins the binary split (every station ≤ 250 m or > 1 km, Joyce–Collingwood among the uncovered): if Mobi ever adds a dock in the middle ground, the test fails and the prose gets reviewed before it rots.

## Verification

- 95 Vitest tests pass (new: coverage URL round-trip + explainer swap in Explorer.test, the binary-split contract test, fourth-request assertions in PersonalRequests.test); typecheck + production build green.
- Visual check against the production build: Coverage view renders the eight ringed, always-labelled stations (Renfrew, Rupert, Nanaimo, 29th Avenue, Joyce–Collingwood across the east side; Oakridge, Langara, Marine Drive down the Canada Line) over a dimmed network — the gap reads at a glance. Toggling back to Transit score restores the original paints and legend, URL param clears, zero console errors.
- Derived values confirmed against a Python cross-check before implementation (nearest-dock distances per station, max covered 207 m, min uncovered 1,004 m).

## Lifecycle

Branch `feat/041-transit-coverage` → implement → verify → merge to main → push → deploy to CF Pages → owner flips the map to Coverage on the phone.
