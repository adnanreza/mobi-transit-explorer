"""Join ICBC cyclist crashes to Mobi stations and build the context artifact.

Pure functions over plain dicts so the join is unit-testable without a
warehouse. publish.py supplies the stations; the fetch step supplies crashes.

Two design rules from spec 046 live here rather than in prose:

  - The join is ONE TO MANY and the double counting is published, not hidden.
    720 of 33,930 station pairs sit under 500 m apart, so one crash is often
    within 250 m of several docks. sum(byStation.crashes) therefore exceeds
    the unique crash count by design, and the accounting block states both
    so nobody has to infer it.
  - There is NO per-trip rate, and no Mobi departure figure either. Dividing
    all-cyclist crashes by Mobi departures would not correct exposure bias, it
    would invent a rate for a population the denominator never measures.
    Publishing the denominator next to the numerator, which earlier revisions
    did, is the same thing one step removed.
"""

from __future__ import annotations

import csv
import math
import statistics
from pathlib import Path

# Same box the fetch enforces; re-checked here because the CSV is the input
# publish trusts, and a literal "0" reads as truthy in text.
LAT_RANGE = (49.19, 49.33)
LON_RANGE = (-123.27, -123.01)

RADIUS_M = 250
CASUALTY = "CASUALTY CRASH"
PROPERTY_DAMAGE = "PROPERTY DAMAGE ONLY"
# Radii reported beside the chosen one so the site can defend 250 m with
# numbers instead of an assertion.
SENSITIVITY_RADII = (100, 250, 500)


def haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle metres. Mirrors transitCoverage in src/data/index.ts."""
    radius = 6371000
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * radius * math.asin(math.sqrt(a))


def load_crashes(path: Path) -> list[dict]:
    """Read the filtered CSV written by icbc_fetch.py."""
    rows: list[dict] = []
    with path.open(encoding="utf-8", newline="") as handle:
        for row in csv.DictReader(handle):
            has_lat, has_lon = row["lat"] != "", row["lon"] != ""
            if has_lat != has_lon:
                raise ValueError(f"row has one coordinate only: {row}")
            has_coords = has_lat and has_lon
            if has_coords and not (
                LAT_RANGE[0] <= float(row["lat"]) <= LAT_RANGE[1]
                and LON_RANGE[0] <= float(row["lon"]) <= LON_RANGE[1]
            ):
                # a 0/0 sentinel would otherwise publish as "located, far from
                # every dock" rather than as a bad coordinate
                raise ValueError(f"coordinate outside the service area: {row}")
            rows.append({
                "year": int(row["year"]),
                "severity": row["severity"],
                "lat": float(row["lat"]) if has_coords else None,
                "lon": float(row["lon"]) if has_coords else None,
                "weight": int(row["crash_weight"]),
            })
    return rows


def count_near(crashes: list[dict], stations: list[dict], radius_m: int) -> tuple[int, int]:
    """(unique crashes within radius of any station, stations reading zero)."""
    matched = 0
    hit: set[str] = set()
    for crash in crashes:
        if crash["lat"] is None:
            continue
        near = [
            s["id"] for s in stations
            if haversine_m(crash["lat"], crash["lon"], s["lat"], s["lon"]) <= radius_m
        ]
        if near:
            matched += crash["weight"]
            hit.update(near)
    return matched, len(stations) - len(hit)


def build_context(
    crashes: list[dict],
    stations: list[dict],
    reference: dict,
    radius_m: int = RADIUS_M,
) -> dict:
    """Build crashcontext.json.

    stations: [{"id", "lat", "lon"}] for every active station, so a station
    with no nearby crashes publishes an explicit zero rather than going
    missing (missing and zero must not look alike).

    No Mobi departure figure is published at any level. Spec 046 rev 2 called
    for a per-station denominator, then a citywide one; review showed both
    defeat their own purpose. Handing a reader the numerator and denominator
    one sentence apart is arithmetically identical to publishing the rate the
    feature refuses to publish, and the citywide figure was also wrong by
    3.3% because it could only sum stations that are still active. Departures
    are already on the site in stations.json and yearly.json; the methodology
    now says plainly that no rate should be built from them.
    """
    by_station = {
        s["id"]: {"crashes": 0, "casualtyCrashes": 0} for s in stations
    }

    rows = len(crashes)
    total = casualty = pdo = with_coords = without_coords = 0
    matched_unique = near_no_station = multi_station = assignments = 0

    for crash in crashes:
        weight = crash["weight"]
        total += weight
        if crash["severity"] == CASUALTY:
            casualty += weight
        elif crash["severity"] == PROPERTY_DAMAGE:
            pdo += weight
        else:
            # An unrecognised severity must not be quietly filed as property
            # damage: every published invariant would still close while the
            # split silently lied.
            raise ValueError(f"unknown CRASH_SEVERITY: {crash['severity']!r}")

        if crash["lat"] is None or crash["lon"] is None:
            without_coords += weight
            continue
        with_coords += weight

        near = [
            s["id"] for s in stations
            if haversine_m(crash["lat"], crash["lon"], s["lat"], s["lon"]) <= radius_m
        ]
        if not near:
            near_no_station += weight
            continue
        matched_unique += weight
        if len(near) > 1:
            multi_station += weight
        for station_id in near:
            entry = by_station[station_id]
            entry["crashes"] += weight
            if crash["severity"] == CASUALTY:
                entry["casualtyCrashes"] += weight
            assignments += weight

    vintage = reference["vintage"]
    return {
        "source": {
            "workbook": reference["workbook_url"],
            "catalogueRecord": reference["catalogue_record"],
            "accessedAt": reference["accessed_at"],
        },
        "licence": reference["licence"],
        # The public window rolls and ICBC revises counts as late reports and
        # corrections arrive, so a year's number is not frozen.
        "vintage": {**vintage, "revisable": True},
        "radiusM": radius_m,
        "city": {
            "rows": rows,
            "crashes": total,
            "casualtyCrashes": casualty,
            "propertyDamageOnlyCrashes": pdo,
            "crashesWithCoordinates": with_coords,
            "crashesWithoutCoordinates": without_coords,
            "withCoordinatesPct": round(100 * with_coords / total, 1) if total else None,
            # The typical dock, so a reader has an anchor for the number in
            # front of them without ranking stations against each other.
            # statistics.median, not the upper-middle element: with an even
            # number of docks the latter biases the "typical dock" anchor
            # upward, and the active-station count changes with every release.
            "medianStationCrashes": (
                statistics.median(v["crashes"] for v in by_station.values())
                if by_station
                else None
            ),
        },
        # crashesWithCoordinates = matchedUniqueCrashes + nearNoStationCrashes
        # is the invariant that must close. stationAssignments exceeds
        # matchedUniqueCrashes because catchments overlap.
        "accounting": {
            "matchedUniqueCrashes": matched_unique,
            "nearNoStationCrashes": near_no_station,
            "stationAssignments": assignments,
            "crashesMatchingMultipleStations": multi_station,
        },
        # The radius is a judgement, so the alternatives ship with it.
        "radiusSensitivity": [
            {
                "radiusM": r,
                "matchedUniqueCrashes": matched,
                "stationsWithNone": zeros,
            }
            for r, (matched, zeros) in (
                (r, count_near(crashes, stations, r)) for r in SENSITIVITY_RADII
            )
        ],
        "byStation": dict(sorted(by_station.items())),
    }
