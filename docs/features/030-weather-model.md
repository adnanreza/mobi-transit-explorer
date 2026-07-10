# Feature 030 - Weather and Ridership Model

Branch: `feature/weather-model`

## Goal

Quantify what weather does to riding and let visitors play with it: a daily
ridership model over calendar + Environment Canada weather, evaluated
honestly, published as a tiny precomputed grid behind a "what moves
ridership" widget in the story section.

## Decisions

- **External weather is required, not optional**: the trip files carry no
  precipitation at all, and their temperatures become 0-sentinels after
  mid-2025. Environment Canada daily data for VANCOUVER HARBOUR CS
  (station 888 — downtown, where the riding is) under the Open Government
  Licence – Canada.
- **Strict time split**, no leakage: train 2017–2024, test 2025→. Reported
  against a seasonal-naive baseline (train mean by month × weekend-ness).
  Result: test MAE 543 trips/day vs baseline 878, R² 0.757.
- **Monotonic constraint**: more rain can never predict more trips
  (`monotonic_cst` on precipitation) — a domain prior that also makes the
  widget's behaviour trustworthy.
- **No ML runtime in the browser**: the model exports a 5 KB prediction grid
  (month × day type × 9 temp bands × 4 rain levels) plus a model card; the
  widget is a lookup.
- Known gaps stated: station outage leaves 2020 with ~249 usable days; no
  events/holiday-crowd data beyond the static BC holiday flag; predictions
  are associations at the latest year level, not causal claims.

## Files

- `pipeline/weather_fetch.py` (new) — EC yearly CSVs into `data-raw/weather/`,
  recorded in the manifest with checksums
- `pipeline/train_model.py` (new) — features, constrained
  HistGradientBoosting, time-split evaluation, `forecast.json`
- `pipeline/requirements.txt` (+ scikit-learn)
- `pipeline/tests/test_weather.py` — BC-holiday rules, featurization, and
  committed-artifact checks (grid shape, rain monotonicity, card fields)
- `src/data/contracts.ts`, `src/data/index.ts`, `src/data/generated.test.ts`
- `src/components/story/WeatherModelBlock.tsx` (+ test) — the widget
- `src/App.tsx` (block appended to #story), `src/components/Methodology.tsx`
  ("The model" subsection), README (EC credit, commands)

## Verification

pytest + Vitest + typecheck + build; browser: widget predicts sensibly (dry
July Saturday ≫ rainy November weekday; increasing rain never increases the
number); reduced scope honesty in copy; lifecycle COMPLETE + deploy.
