# Feature 034 - Audit Follow-up Fixes

Branch: `feature/audit-followup-fixes`

## Goal

Fix the confirmed findings from the second (focused) adversarial audit — the
four dimensions the first run never reached (reproducibility, compliance, UX,
spec-033 review). Every published number was independently re-derived from the
warehouse and reconciled; the spec-033 weather rebuild was verified sound. The
remaining defects were docs, forecast guardrails, and attribution polish.

## Fixes

- **Reproducibility (HIGH):** the README "Reproduce it" order ran `publish.py`
  before `weather_fetch.py`, but `publish.py` now hard-requires the EC weather
  CSVs (`v_ec_weather` globs `data-raw/weather/`) — a clean checkout crashed at
  step 3. Reordered so weather_fetch precedes publish, in both README.md and
  pipeline/README.md (which also omitted weather_fetch and train_model).
- **Forecast guardrails (MEDIUM cluster):** the widget rendered "≈ 0 trips" and
  confident numbers for month/temperature combinations Vancouver has never seen
  (e.g. January at 22°C). `train_model.py` now emits `monthMeanTempRangeC` and
  floors every grid cell at the minimum single-day count ever observed; the
  widget shows "outside the observed range" for impossible combinations and the
  card discloses the range/floor caveat.
- **Terminology:** the "Trips analyzed" card caption said "kept" (which the
  report reserves for the 8.72M warehouse count) for the 8.17M countable figure
  — reworded to name the countable basis.
- **Attribution/licence:** EC relabeled from "OGL-Canada" to "based on
  Environment and Climate Change Canada data" (on-screen, README, docstrings);
  EC added to the in-app footer; footer non-affiliation disclaimer brought to
  README parity; a data carve-out preamble added to the LICENSE file itself.
- **Copy/UX polish:** README "all 262 active stations" → "262 GBFS-geocoded";
  "every trip file ever published" bounded to a date range; chart y-axes gained
  unit titles (trips/day, departures/day, bikes/hour); quality-report line
  corrected to match the app's EC-based weather copy; avgTempC comment fixed.

## Verification

35 pytest + 72 Vitest + typecheck + build pass; browser confirms the forecast
out-of-range guard and clean console; deploy.
