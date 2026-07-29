"""ICBC crash context tests (spec 046): the haversine join, weighted rows,
overlap accounting, and invariants of the committed artifact."""

import csv
import json
from pathlib import Path

import pytest

import common
import icbc_context
import icbc_fetch


def write_csv(path: Path, header: list[str], rows: list[list[str]]) -> None:
    with path.open("w", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(header)
        writer.writerows(rows)


def crash(lat, lon, weight=1, severity="CASUALTY CRASH", year=2023):
    return {"year": year, "severity": severity, "lat": lat, "lon": lon, "weight": weight}


# Two docks 300 m apart on the same latitude, so a point between them is
# within 250 m of both and a point beyond one is within range of only that one.
STATION_A = {"id": "A", "lat": 49.2800, "lon": -123.1000}
STATION_B = {"id": "B", "lat": 49.2800, "lon": -123.0959}  # ~300 m east
STATIONS = [STATION_A, STATION_B]

REFERENCE = {
    "workbook_url": "https://example.invalid/workbook",
    "catalogue_record": "https://example.invalid/record",
    "accessed_at": "2026-07-29T00:00:00+00:00",
    "licence": {"name": "L", "version": "1.0", "url": "u", "attribution": "a", "disclaimer": "d"},
    "vintage": {"from": 2021, "to": 2025},
}


def build(crashes, stations=None):
    stations = STATIONS if stations is None else stations
    return icbc_context.build_context(crashes, stations, REFERENCE)


def test_haversine_matches_known_distance():
    # 0.001 degrees of latitude is about 111 m
    d = icbc_context.haversine_m(49.28, -123.10, 49.281, -123.10)
    assert 110 < d < 112
    assert icbc_context.haversine_m(49.28, -123.10, 49.28, -123.10) == 0


def test_join_is_one_to_many_and_accounting_closes():
    between = crash(49.2800, -123.09795)  # ~150 m from each dock
    only_b = crash(49.2800, -123.0950)  # past B, out of range of A
    far = crash(49.2600, -123.1500)  # near neither
    context = build([between, only_b, far])

    assert context["byStation"]["A"]["crashes"] == 1
    assert context["byStation"]["B"]["crashes"] == 2
    # the shared crash is counted by both docks, so assignments exceed uniques
    assert context["accounting"]["matchedUniqueCrashes"] == 2
    assert context["accounting"]["stationAssignments"] == 3
    assert context["accounting"]["crashesMatchingMultipleStations"] == 1
    assert context["accounting"]["nearNoStationCrashes"] == 1
    # the invariant the artifact must satisfy
    assert context["city"]["crashesWithCoordinates"] == (
        context["accounting"]["matchedUniqueCrashes"]
        + context["accounting"]["nearNoStationCrashes"]
    )
    assert sum(v["crashes"] for v in context["byStation"].values()) == (
        context["accounting"]["stationAssignments"]
    )


def test_weighted_rows_count_their_weight():
    # a single row carrying three crashes contributes three, not one
    context = build([crash(49.2800, -123.1000, weight=3)])
    assert context["city"]["rows"] == 1
    assert context["city"]["crashes"] == 3
    assert context["byStation"]["A"]["crashes"] == 3
    assert context["accounting"]["matchedUniqueCrashes"] == 3


def test_rows_without_coordinates_are_counted_but_never_joined():
    context = build([crash(None, None, weight=2), crash(49.2800, -123.1000)])
    assert context["city"]["crashesWithoutCoordinates"] == 2
    assert context["city"]["crashesWithCoordinates"] == 1
    assert context["city"]["withCoordinatesPct"] == 33.3
    assert context["accounting"]["stationAssignments"] == 1


def test_severity_split_and_zero_stations_are_explicit():
    context = build([
        crash(49.2800, -123.1000, severity="PROPERTY DAMAGE ONLY"),
        crash(49.2800, -123.1000, severity="CASUALTY CRASH"),
    ])
    assert context["city"]["casualtyCrashes"] == 1
    assert context["city"]["propertyDamageOnlyCrashes"] == 1
    assert context["byStation"]["A"]["casualtyCrashes"] == 1
    # B has no nearby crashes and must still appear, so a zero cannot be
    # mistaken for a station that was never measured
    assert context["byStation"]["B"] == {"crashes": 0, "casualtyCrashes": 0}


def test_no_rate_and_no_departure_figure_is_published():
    context = build([crash(49.2800, -123.1000)])
    for entry in context["byStation"].values():
        assert set(entry) == {"crashes", "casualtyCrashes"}
    blob = json.dumps(context)
    # neither the rate nor its operands: handing over both is the same act one
    # step removed
    for forbidden in ("per100k", "crashRate", "ratePer", "departure", "Departures"):
        assert forbidden not in blob
    # the anchor that replaces them is the typical dock, not a denominator
    assert context["city"]["medianStationCrashes"] == 1  # stations read 0 and 1


def test_unknown_severity_raises_instead_of_becoming_property_damage():
    with pytest.raises(ValueError, match="unknown CRASH_SEVERITY"):
        build([crash(49.2800, -123.1000, severity="FATAL CRASH")])


def test_radius_sensitivity_reports_the_alternatives():
    context = build([crash(49.2800, -123.09795)])  # ~150 m from both docks
    radii = [row["radiusM"] for row in context["radiusSensitivity"]]
    assert radii == list(icbc_context.SENSITIVITY_RADII)
    at_100 = next(r for r in context["radiusSensitivity"] if r["radiusM"] == 100)
    at_250 = next(r for r in context["radiusSensitivity"] if r["radiusM"] == 250)
    # the crash is out of range at 100 m and in range of both docks at 250 m
    assert at_100["matchedUniqueCrashes"] == 0 and at_100["stationsWithNone"] == 2
    assert at_250["matchedUniqueCrashes"] == 1 and at_250["stationsWithNone"] == 0


def test_bad_coordinates_raise_on_load(tmp_path):
    path = tmp_path / "crashes.csv"
    write_csv(
        path,
        icbc_fetch.FIELDS,
        [["2023", "MAY", "MONDAY", "09:00-11:59", "CASUALTY CRASH", "Y",
          "MAIN ST", "", "0", "0", "1", "VANCOUVER"]],
    )
    # a literal 0/0 must not publish as "located, far from every dock"
    with pytest.raises(ValueError, match="outside the service area"):
        icbc_context.load_crashes(path)


def test_half_coordinates_raise_on_load(tmp_path):
    path = tmp_path / "crashes.csv"
    write_csv(
        path,
        icbc_fetch.FIELDS,
        [["2023", "MAY", "MONDAY", "09:00-11:59", "CASUALTY CRASH", "Y",
          "MAIN ST", "", "49.28", "", "1", "VANCOUVER"]],
    )
    with pytest.raises(ValueError, match="one coordinate only"):
        icbc_context.load_crashes(path)


def test_committed_artifact_invariants():
    artifact = json.loads(
        (common.REPO_ROOT / "src" / "data" / "generated" / "crashcontext.json").read_text()
    )
    city, accounting = artifact["city"], artifact["accounting"]
    assert city["crashesWithCoordinates"] == (
        accounting["matchedUniqueCrashes"] + accounting["nearNoStationCrashes"]
    )
    assert accounting["stationAssignments"] >= accounting["matchedUniqueCrashes"]
    assert city["rows"] <= city["crashes"]  # weighted rows
    assert city["casualtyCrashes"] + city["propertyDamageOnlyCrashes"] == city["crashes"]
    assert sum(v["crashes"] for v in artifact["byStation"].values()) == (
        accounting["stationAssignments"]
    )
    # spec 046 feasibility anchors, valid until the next vintage lands
    assert artifact["vintage"] == {"from": 2021, "to": 2025, "revisable": True}
    assert city["rows"] == 4526 and city["crashes"] == 4536
    assert city["withCoordinatesPct"] == 92.6
    assert city["crashesWithCoordinates"] + city["crashesWithoutCoordinates"] == city["crashes"]
    assert artifact["radiusM"] == 250
    # the required attribution, with the typographic apostrophe
    assert artifact["licence"]["attribution"] == (
        "Contains information licensed under ICBC’s Open Data Licence."
    )
    assert "are those of the authors" in artifact["licence"]["disclaimer"]
    # every station id resolves to a published station
    station_ids = {
        s["id"]
        for s in json.loads(
            (common.REPO_ROOT / "src" / "data" / "generated" / "stations.json").read_text()
        )["stations"]
    }
    # set equality both ways: a dropped station would otherwise blank its panel
    # block while every other invariant still closed
    assert set(artifact["byStation"]) == station_ids
