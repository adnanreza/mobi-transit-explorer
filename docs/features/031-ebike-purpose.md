# Feature 031 - E-bike Contrasts and Trip Purpose

Branch: `feature/ebike-purpose`

## Goal

Answer two questions the warehouse can now support: what do e-bikes actually
change about how people ride, and how much of this network is leisure vs
utility — and make both visible (story chapter + map colour mode).

## Findings baked into the data (verified)

- E-bikes (since 2022-08, 1.24M trips vs 2.73M classic): median trips are
  longer (2.5 vs 2.19 km), faster (13.3 vs 11.1 km/h), and straighter
  (detour 1.37× vs 1.41×).
- ~17% of trailing-year trips classify as leisure under the documented
  heuristic — concentrated absurdly: Stanley Park stations run 84–96%
  leisure; hospital-adjacent Heather & 10th runs 2.2%.

## Decisions

- **Detour factor** = odometer ÷ haversine between the stations' real
  coordinates; computed only when both ends resolve, ends ≥300 m apart, and
  the ratio lies in [1, 5].
- **Leisure heuristic is published, crude on purpose**: same-station round
  trip +3, seawall-adjacent endpoint +2 (name regex), >40 min +2 / >20 min
  +1, weekend +1, midday depart +1, detour >1.8× +1; leisure at ≥4 points.
  The definition string ships inside `ebike.json`; methodology explains it.
- Story chapter 6 "Two networks in one": chart is every classified station's
  leisure share sorted descending — the cliff between the seawall and the
  rest *is* the visual. E-bike contrasts carry the caption.
- Map gains a colour-mode toggle (Transit score ↔ Leisure share) via a paint
  expression swap on the existing layer; popups always show leisure share.

## Files

- `pipeline/sql/50_publish.sql` — `v_trip_geometry`, `v_ebike_compare`,
  `v_ebike_share_by_temp`, `v_trip_purpose`, `v_station_leisure`,
  `v_network_purpose`
- `pipeline/publish.py` — `ebike.json`; `leisureSharePct` joined into
  `stations.json`
- `pipeline/tests/test_purpose.py` — detour math, heuristic classifications,
  e-bike medians on fixtures
- `src/data/contracts.ts` / `index.ts` / `generated.test.ts`
- `src/components/story/storyContent.ts` (+ tests) — `purposeChapter`
- `src/components/story/StorySection.tsx` — chapter 6 chart
- `src/components/InteractiveMap.tsx`, `src/components/Explorer.tsx` — colour
  mode
- `src/components/Methodology.tsx` — heuristic + detour documentation

## Verification

pytest + Vitest + typecheck + build; browser: chapter renders with the cliff
chart, map toggle recolours (Stanley Park lights up in leisure mode), popup
shows leisure share; lifecycle COMPLETE + deploy.
