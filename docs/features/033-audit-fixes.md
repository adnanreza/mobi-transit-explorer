# Feature 033 - Adversarial Audit Fixes

Branch: `feature/audit-fixes`

## Goal

Fix the defects a multi-agent adversarial audit confirmed before the project
is shown to employers or to Mobi. All in the weather/forecast cluster plus
small copy/label drift; the pipeline core (row reconciliation, flows math,
model evaluation, story chapters) was audited and cleared.

## Root cause and fix

The trip files' temperature column is a **bike-mounted sensor**, not ambient
weather: it reads high in sun, emits 0° sentinels (112,368 single-ended zeros
leaked past the both-ends flag), and reports values Vancouver has never reached
(up to 45° vs an EC record 26°). Every weather measure now uses **Environment
Canada daily ambient temperature** (already fetched for the model) via a new
`v_ec_weather` view.

- **Weather grain error (HIGH):** old `v_weather` banded each *trip* and divided
  by "days that temperature ever occurred" — inflating the rate ~12× and
  picking a phantom 24° peak. Rebuilt at the daily grain (one EC temp per day,
  average that day's trips per band). Headline is now true: "22°, ~4,631
  trips/day." `weather.json` carries `tripsPerDay`.
- **Sentinel/impossible-band leak (HIGH):** eliminated — trip-sensor temps no
  longer feed `v_weather`, `v_yearly` (now `avgTempC` from EC), or
  `v_ebike_share_by_temp` (EC bands). README/Methodology/quality-report copy
  corrected to describe the bike-sensor reality.
- **Forecast frozen at 2024 (HIGH):** the grid was anchored beyond the trained
  year and over-predicted 2025-26 ~18%. Now a dual model — evaluation model
  (train ≤2024 / test 2025+, card metrics unchanged: MAE 543 vs 878, R² 0.757)
  and a grid model refit on all data, anchored at the last complete year (2025),
  disclosed in the card and UI ("at 2025 network size"). Dropped the phantom 30°
  band (byte-identical duplicate beyond EC range).
- **README stale trip count:** 8,705,184 → 8,717,352.
- **seasonality.json** emits `null` for out-of-window months, not 0.
- **Quality report** "UNMAPPED" row relabeled "Blank / Unknown (no label in
  source)" so it no longer contradicts "No unmapped labels."
- **E-bike speed** disclosed as odometer/total-rental-time in methodology.

## Verification

35 pytest + 72 Vitest + typecheck + build all pass; browser confirms the
corrected weather headline and forecast disclosure; deploy.
