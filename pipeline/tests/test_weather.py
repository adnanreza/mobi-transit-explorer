"""Weather model tests: holiday rules, featurization, and invariants of the
committed forecast artifact."""

import json
from datetime import date

import common
import train_model


def test_bc_holidays_known_dates():
    days = train_model.bc_holidays(2026)
    assert date(2026, 1, 1) in days
    assert date(2026, 2, 16) in days  # Family Day: 3rd Monday of Feb 2026
    assert date(2026, 4, 3) in days  # Good Friday 2026
    assert date(2026, 5, 18) in days  # Victoria Day: Monday before May 25
    assert date(2026, 9, 7) in days  # Labour Day
    assert date(2026, 9, 30) in days  # Truth and Reconciliation (2021+)
    assert date(2020, 9, 30) not in train_model.bc_holidays(2020)


def test_featurize_shape_and_values():
    holidays = {date(2026, 7, 1)}
    features = train_model.featurize(date(2026, 7, 1), 22.0, 0.0, holidays)
    assert len(features) == len(train_model.FEATURES)
    assert features[train_model.FEATURES.index("temp")] == 22.0
    assert features[train_model.FEATURES.index("is_holiday")] == 1.0
    weekend = train_model.featurize(date(2026, 7, 4), 22.0, 0.0, holidays)  # Saturday
    assert weekend[train_model.FEATURES.index("is_weekend")] == 1.0


def test_committed_forecast_artifact_invariants():
    payload = json.loads(
        (common.REPO_ROOT / "src" / "data" / "generated" / "forecast.json").read_text()
    )
    card = payload["modelCard"]
    for field in ("testMae", "baselineMae", "testR2", "nTrain", "nTest", "constraint"):
        assert field in card
    assert card["testMae"] < card["baselineMae"], "model must beat the naive baseline"

    # droppedDays breakdown must be present and internally consistent.
    dd = card["droppedDays"]
    assert dd["total"] == dd["trainingWindow"] + dd["holdoutWindow"], (
        "droppedDays total must equal trainingWindow + holdoutWindow"
    )
    assert sum(dd["perYear"].values()) == dd["total"], (
        "droppedDays perYear counts must sum to total"
    )
    # Training-window split (before 2025-01-01 = TEST_SPLIT)
    training_years = {yr for yr in dd["perYear"] if int(yr) < 2025}
    holdout_years = {yr for yr in dd["perYear"] if int(yr) >= 2025}
    assert sum(dd["perYear"][yr] for yr in training_years) == dd["trainingWindow"]
    assert sum(dd["perYear"][yr] for yr in holdout_years) == dd["holdoutWindow"]

    grid = payload["grid"]
    assert len(grid) == 12
    n_temp = len(payload["tempBandsC"])
    n_rain = len(payload["rainLevelsMm"])
    for month_block in grid:
        assert len(month_block) == 2
        for day_block in month_block:
            assert len(day_block) == n_temp
            for temp_row in day_block:
                assert len(temp_row) == n_rain
                # monotonic constraint holds in the published grid:
                # more rain never predicts more trips
                for a, b in zip(temp_row, temp_row[1:]):
                    assert b <= a
                for v in temp_row:
                    assert v >= 0

    # sanity: a dry warm July weekend beats a pouring cold November weekday
    july_weekend_dry = grid[6][1][payload["tempBandsC"].index(22)][0]
    nov_weekday_pour = grid[10][0][payload["tempBandsC"].index(6)][-1]
    assert july_weekend_dry > nov_weekday_pour
