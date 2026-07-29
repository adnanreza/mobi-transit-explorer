"""Air quality tests (spec 045): schema normalization across both source
layouts, the usable-day rule, and invariants of the committed artifact."""

import csv
import json
from pathlib import Path

import airquality_fetch
import common


def write_csv(path: Path, header: list[str], rows: list[list[str]]) -> None:
    with path.open("w", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(header)
        writer.writerows(rows)


def test_normalize_annual_layout(tmp_path):
    src = tmp_path / "annual.csv"
    write_csv(
        src,
        ["DATE_PST", "DATE", "TIME", "STATION_NAME", "EMS_ID", "RAW_VALUE", "UNIT"],
        [
            ["2024-01-01 01:00", "2024-01-01", "01:00", "Vancouver Clark Drive", "X", "7.2", "ug/m3"],
            ["2024-01-01 24:00", "2024-01-01", "24:00", "Vancouver Clark Drive", "X", "6.0", "ug/m3"],
            ["2024-01-01 01:00", "2024-01-01", "01:00", "Somewhere Else", "Y", "9.9", "ug/m3"],
            ["2024-01-01 02:00", "2024-01-01", "02:00", "Vancouver Clark Drive", "X", "NA", "ug/m3"],
        ],
    )
    rows = airquality_fetch.normalize(src, verified=True)
    # other stations and NA values drop; the DATE column names the day even
    # for the hour-ending-24 row
    assert rows == [
        ("2024-01-01", "Vancouver Clark Drive", 7.2),
        ("2024-01-01", "Vancouver Clark Drive", 6.0),
    ]


def test_normalize_ytd_layout(tmp_path):
    src = tmp_path / "ytd.csv"
    write_csv(
        src,
        ["DATE_PST", "STATION_NAME", "EMS_ID", "RAW_VALUE", "UNIT"],
        [
            ["2025-01-01 01:00", "Burnaby Kensington Park", "Z", "3.5", "ug/m3"],
            ["2025-01-01 24:00", "Burnaby Kensington Park", "Z", "4.5", "ug/m3"],
        ],
    )
    rows = airquality_fetch.normalize(src, verified=False)
    # no DATE column in this layout; the first ten characters of DATE_PST are
    # the observation date under the hour-ending convention
    assert rows == [
        ("2025-01-01", "Burnaby Kensington Park", 3.5),
        ("2025-01-01", "Burnaby Kensington Park", 4.5),
    ]


def test_usable_days_requires_both_stations():
    clark = [("2024-06-01", "Vancouver Clark Drive", 5.0)] * 20
    kensington = [("2024-06-01", "Burnaby Kensington Park", 4.0)] * 20
    sparse_kensington = [("2024-06-02", "Burnaby Kensington Park", 4.0)] * 20
    full_clark_2 = [("2024-06-02", "Vancouver Clark Drive", 5.0)] * 10  # under 18h
    assert airquality_fetch.usable_days(clark + kensington) == 1
    assert airquality_fetch.usable_days(clark) == 0  # one station alone never counts
    assert (
        airquality_fetch.usable_days(clark + kensington + sparse_kensington + full_clark_2)
        == 1
    )


def test_committed_airquality_artifact_invariants():
    aq = json.loads(
        (common.REPO_ROOT / "src" / "data" / "generated" / "airquality.json").read_text()
    )
    assert aq["smokeThresholdUgM3"] == 25
    assert aq["primaryStation"] == "Vancouver Clark Drive"
    # spec 045 sanity anchors: the known August 2017 and September 2020 events
    # must register, or the threshold is wrong
    event_years = {e["year"] for e in aq["events"]}
    assert {2017, 2020} <= event_years
    assert 5 <= aq["smokeDayCount"] <= 200
    assert aq["verifiedThrough"] >= "2024-12-31"
    sept = aq["sept2020"]
    assert len(sept) >= 30
    assert sum(1 for d in sept if d["smoke"]) >= 5
    assert all("2020-08-24" <= d["date"] <= "2020-10-04" for d in sept)
    worst = aq["worstDay"]
    assert worst is not None and worst["pm25"] > 100
