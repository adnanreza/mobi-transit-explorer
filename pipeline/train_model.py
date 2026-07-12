"""Train the daily-ridership weather model and publish forecast.json.

Daily countable trips ~ gradient-boosted trees over calendar + weather
features, with a monotonic constraint that more rain can never predict more
trips. Evaluated on a strict time split (train through 2024, test 2025→)
against a seasonal-naive baseline, and published as a precomputed prediction
grid so the browser needs no ML runtime.

Usage: python pipeline/train_model.py
"""

from __future__ import annotations

import csv
import json
import sys
from datetime import date, timedelta

import duckdb
import numpy as np
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, r2_score

import common

WEATHER_DIR = common.DATA_RAW / "weather"
OUT = common.REPO_ROOT / "src" / "data" / "generated" / "forecast.json"
TEST_SPLIT = date(2025, 1, 1)
# EC ambient means for Vancouver top out near 26C; a 30C band would be pure
# extrapolation (and produced a byte-identical duplicate of the 26C column).
TEMP_BANDS_C = [-2, 2, 6, 10, 14, 18, 22, 26]
RAIN_LEVELS_MM = [0, 2, 10, 25]
# feature order matters: monotonic_cst is positional
FEATURES = ["dow", "is_weekend", "month_sin", "month_cos", "temp", "precip", "year_index", "is_holiday"]
MONOTONIC = [0, 0, 0, 0, 0, -1, 0, 0]  # precip: never predicts more trips


def nth_weekday(year: int, month: int, weekday: int, n: int) -> date:
    d = date(year, month, 1)
    offset = (weekday - d.weekday()) % 7
    return d + timedelta(days=offset + 7 * (n - 1))


def bc_holidays(year: int) -> set[date]:
    """BC statutory holidays (fixed rules; Easter via computus)."""
    a, b, c = year % 19, year // 100, year % 100
    d_, e = b // 4, b % 4
    f = (b + 8) // 25
    g = (b - f + 1) // 3
    h = (19 * a + b - d_ - g + 15) % 30
    i, k = c // 4, c % 4
    l = (32 + 2 * e + 2 * i - h - k) % 7
    m = (a + 11 * h + 22 * l) // 451
    easter = date(year, (h + l - 7 * m + 114) // 31, ((h + l - 7 * m + 114) % 31) + 1)
    days = {
        date(year, 1, 1),
        nth_weekday(year, 2, 0, 3),  # Family Day: 3rd Monday of Feb
        easter - timedelta(days=2),  # Good Friday
        date(year, 7, 1),
        nth_weekday(year, 8, 0, 1),  # BC Day
        nth_weekday(year, 9, 0, 1),  # Labour Day
        nth_weekday(year, 10, 0, 2),  # Thanksgiving
        date(year, 11, 11),
        date(year, 12, 25),
        date(year, 12, 26),
    }
    # Victoria Day: Monday preceding May 25
    may24 = date(year, 5, 24)
    days.add(may24 - timedelta(days=(may24.weekday() or 7) - 0) if may24.weekday() != 0 else may24)
    if year >= 2021:
        days.add(date(year, 9, 30))  # Truth and Reconciliation
    return days


def load_weather() -> dict[date, tuple[float, float]]:
    out: dict[date, tuple[float, float]] = {}
    for path in sorted(WEATHER_DIR.glob("ec-*.csv")):
        for row in csv.DictReader(path.open(encoding="utf-8-sig")):
            temp, precip = row.get("Mean Temp (°C)"), row.get("Total Precip (mm)")
            if temp and precip:
                out[date.fromisoformat(row["Date/Time"])] = (float(temp), float(precip))
    return out


def load_daily_trips(con) -> dict[date, int]:
    last_month = con.execute(
        "SELECT max(source_period) FROM fact_trips WHERE source_period <> '2017'"
    ).fetchone()[0]
    rows = con.execute(
        f"""SELECT date_key, count(*) FROM fact_trips f
            LEFT JOIN dim_membership m USING (membership_raw)
            WHERE coalesce(m.membership_group, 'Unknown') <> 'Operations'
              AND trip_month <= '{last_month}'
              AND NOT list_has_any(quality_flags,
                    ['round_trip_false_start', 'zero_duration', 'negative_duration',
                     'misdated_source'])
            GROUP BY 1"""
    ).fetchall()
    return {r[0]: r[1] for r in rows}


def featurize(day: date, temp: float, precip: float, holidays: set[date]) -> list[float]:
    return [
        day.weekday(),
        1.0 if day.weekday() >= 5 else 0.0,
        np.sin(2 * np.pi * day.month / 12),
        np.cos(2 * np.pi * day.month / 12),
        temp,
        precip,
        day.year - 2017,
        1.0 if day in holidays else 0.0,
    ]


def main() -> int:
    con = duckdb.connect(str(common.REPO_ROOT / "data-warehouse" / "mobi.duckdb"), read_only=True)
    weather = load_weather()
    trips = load_daily_trips(con)
    holidays: set[date] = set()
    for year in range(2017, max(d.year for d in trips) + 1):
        holidays |= bc_holidays(year)

    days = sorted(d for d in trips if d in weather)

    # Log days dropped from training for missing weather coverage.
    trip_days = set(trips.keys())
    weather_days = set(weather.keys())
    no_weather = sorted(d for d in trip_days if d not in weather_days)
    missing_precip = sorted(
        d for d in trip_days if d in weather_days and weather[d][1] != weather[d][1]
    )  # NaN precip (shouldn't occur after load_weather filters, but surface if it does)
    dropped_total = len(no_weather) + len(missing_precip)
    if dropped_total:
        by_year: dict[int, int] = {}
        for d in no_weather + missing_precip:
            by_year[d.year] = by_year.get(d.year, 0) + 1
        year_breakdown = ", ".join(f"{yr}: {cnt}" for yr, cnt in sorted(by_year.items()))
        print(
            f"Weather model: dropped {dropped_total} training days "
            f"({len(no_weather)} no weather record, "
            f"{len(missing_precip)} missing precip). "
            f"Per year — {year_breakdown}.",
            file=sys.stderr,
        )

    X = np.array([featurize(d, *weather[d], holidays) for d in days])
    y = np.array([trips[d] for d in days])
    train_mask = np.array([d < TEST_SPLIT for d in days])

    model = HistGradientBoostingRegressor(
        monotonic_cst=MONOTONIC, random_state=42, max_iter=300
    )
    # Evaluation model: fit on 2017-2024, scored on unseen 2025+ days. These
    # are the honest generalization numbers reported in the card.
    eval_model = HistGradientBoostingRegressor(
        monotonic_cst=MONOTONIC, random_state=42, max_iter=300
    )
    eval_model.fit(X[train_mask], y[train_mask])

    # Seasonal-naive baseline: train-period mean by (month, weekend-ness).
    baseline_table: dict[tuple[int, bool], float] = {}
    for d, target in zip(np.array(days)[train_mask], y[train_mask]):
        key = (d.month, d.weekday() >= 5)
        baseline_table.setdefault(key, [])  # type: ignore[arg-type]
        baseline_table[key].append(target)  # type: ignore[union-attr]
    baseline_means = {k: float(np.mean(v)) for k, v in baseline_table.items()}

    test_days = np.array(days)[~train_mask]
    y_test = y[~train_mask]
    pred_test = eval_model.predict(X[~train_mask])
    baseline_test = np.array(
        [baseline_means[(d.month, d.weekday() >= 5)] for d in test_days]
    )

    # Grid model: refit on ALL available data so the widget reflects the most
    # recent demand level, not a frozen training-cutoff year. Anchored at the
    # last COMPLETE calendar year, stated in the card and the UI.
    grid_model = model
    grid_model.fit(X, y)
    last_full_year = max(d.year for d in days if date(d.year, 12, 31) <= days[-1])
    year_index = last_full_year - 2017

    card = {
        "station": "Vancouver Harbour CS — based on Environment and Climate Change Canada data",
        "features": FEATURES,
        "constraint": "precipitation is monotonic non-increasing",
        "trainRange": f"{days[0]} to {TEST_SPLIT - timedelta(days=1)}",
        "testRange": f"{TEST_SPLIT} to {days[-1]}",
        "nTrain": int(train_mask.sum()),
        "nTest": int((~train_mask).sum()),
        "testMae": round(float(mean_absolute_error(y_test, pred_test))),
        "baselineMae": round(float(mean_absolute_error(y_test, baseline_test))),
        "testR2": round(float(r2_score(y_test, pred_test)), 3),
        "gridReferenceYear": last_full_year,
        "gridFitRange": f"{days[0]} to {days[-1]}",
    }

    # Guardrails against confident out-of-distribution predictions:
    #  - the model never predicts fewer trips than the fewest ever observed on
    #    a single day (kills clamped "0 trips" cells at rare cold+downpour combos)
    #  - per-month observed EC temperature ranges let the UI flag impossible
    #    combinations (e.g. a 22C January day Vancouver has never seen)
    min_daily = int(np.min(y))
    month_temps: dict[int, list[float]] = {}
    for d in days:
        month_temps.setdefault(d.month, []).append(weather[d][0])
    month_temp_range = {
        str(m): [round(min(v), 1), round(max(v), 1)] for m, v in month_temps.items()
    }

    # Prediction grid: month x daytype x temp x rain, at the reference year.
    model = grid_model
    rep_dow = {"weekday": 2, "weekend": 5}
    grid: list[list[list[list[int]]]] = []
    for month in range(1, 13):
        month_block = []
        for day_type in ("weekday", "weekend"):
            dow = rep_dow[day_type]
            rows = [
                [
                    int(
                        max(
                            min_daily,
                            model.predict(
                                [[
                                    dow,
                                    1.0 if day_type == "weekend" else 0.0,
                                    np.sin(2 * np.pi * month / 12),
                                    np.cos(2 * np.pi * month / 12),
                                    temp,
                                    rain,
                                    year_index,
                                    0.0,
                                ]]
                            )[0],
                        )
                    )
                    for rain in RAIN_LEVELS_MM
                ]
                for temp in TEMP_BANDS_C
            ]
            month_block.append(rows)
        grid.append(month_block)

    payload = {
        "modelCard": card,
        "tempBandsC": TEMP_BANDS_C,
        "rainLevelsMm": RAIN_LEVELS_MM,
        "monthMeanTempRangeC": month_temp_range,  # "1".."12" -> [minMean, maxMean]
        "grid": grid,  # [month-1][0=weekday,1=weekend][tempIdx][rainIdx] -> trips
    }
    blob = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    OUT.write_bytes(blob + b"\n")
    print(json.dumps(card, indent=2))
    print(f"wrote {OUT.name}: {len(blob) / 1e3:.1f} KB")
    return 0


if __name__ == "__main__":
    sys.exit(main())
