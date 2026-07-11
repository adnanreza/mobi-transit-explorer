"""Publish the warehouse into the small JSON artifacts the app ships.

Reads the DuckDB star schema, runs pipeline/sql/50_publish.sql, and writes
src/data/generated/*.json. Enforces the size budget (400 KB raw / 120 KB
gzipped total) so per-trip data can never leak into the bundle.

Usage: python pipeline/publish.py [--db PATH]
"""

from __future__ import annotations

import argparse
import gzip
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import duckdb

import common

OUT_DIR = common.REPO_ROOT / "src" / "data" / "generated"
BUDGET_RAW = 400_000
BUDGET_GZIP = 120_000

# The CoV rapid-transit dataset has no line attribute; Canada Line stations
# within the city are enumerated here, everything else is Expo/Millennium.
# Names match the dataset's own spellings ("Center", "- 41st Avenue").
CANADA_LINE = {
    "Waterfront", "Vancouver City Center", "Yaletown - Roundhouse",
    "Olympic Village", "Broadway - City Hall", "King Edward",
    "Oakridge - 41st Avenue", "Langara - 49th Avenue", "Marine Drive",
}


def rows(con, sql: str) -> list[dict]:
    cur = con.execute(sql)
    cols = [d[0] for d in cur.description]
    return [dict(zip(cols, r)) for r in cur.fetchall()]


def one(con, sql: str):
    return con.execute(sql).fetchone()[0]


def build_artifacts(con) -> dict[str, object]:
    window = rows(con, "SELECT * FROM v_window")[0]
    generated_at = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    yearly_membership: dict[int, dict[str, int]] = {}
    for r in rows(con, "SELECT * FROM v_yearly_membership"):
        yearly_membership.setdefault(r["year"], {})[r["membership_group"]] = r["trips"]
    yearly = [
        {
            "year": r["year"],
            "trips": r["trips"],
            "distanceKm": r["distance_km"],
            "medianDurationMin": r["median_duration_min"],
            "ebikeSharePct": r["ebike_share_pct"],
            "activeStations": r["active_stations"],
            "avgTempC": r["avg_temp_c"],
            "membershipMix": yearly_membership.get(r["year"], {}),
        }
        for r in rows(con, "SELECT * FROM v_yearly")
    ]

    monthly = [
        {
            "month": r["month"],
            "trips": r["trips"],
            "ebikeTrips": r["ebike_trips"] if r["trips_with_ebike_flag"] else None,
        }
        for r in rows(con, "SELECT * FROM v_monthly")
    ]

    # months outside the published window are null (no data), not zero trips
    seasonality: dict[int, list[int | None]] = {}
    for r in monthly:
        year, month = int(r["month"][:4]), int(r["month"][5:])
        seasonality.setdefault(year, [None] * 12)[month - 1] = r["trips"]

    hourly: dict[int, dict[str, list[int]]] = {}
    for r in rows(con, "SELECT * FROM v_hourly"):
        hourly.setdefault(r["year"], {"weekday": [0] * 24, "weekend": [0] * 24})[
            r["day_type"]
        ][r["hour"]] = r["trips"]

    weather = [
        {
            "tempBandC": r["temp_band_c"],
            "tripsPerDay": r["trips_per_day"],
            "daysObserved": r["days_observed"],
        }
        for r in rows(con, "SELECT * FROM v_weather")
    ]

    station_years: dict[str, dict[str, int]] = {}
    for r in rows(con, "SELECT * FROM v_station_year"):
        station_years.setdefault(r["station_id"], {})[str(r["year"])] = r["trips"]

    name_by_id = {
        r["station_id"]: r["station_name"]
        for r in rows(con, "SELECT station_id, station_name FROM dim_station")
    }

    def display_name(full: str | None) -> str:
        if not full:
            return "Unknown station"
        return full.split(" ", 1)[1] if full[:4].isdigit() and " " in full else full

    leisure_by_station = {
        r["station_id"]: r["leisure_share_pct"]
        for r in rows(con, "SELECT * FROM v_station_leisure")
    }

    stations = []
    for r in rows(con, """
        SELECT t.*, s.station_name, s.lat, s.lon, s.capacity, s.first_seen,
               s.nearest_transit_station, s.nearest_transit_m,
               c.connector_score, c.comp_transit_proximity, c.comp_trip_volume,
               c.comp_commute_pattern, c.comp_ebike_share, c.comp_destination_diversity
        FROM v_station_t12 t
        JOIN dim_station s USING (station_id)
        JOIN v_connector c USING (station_id)
        WHERE s.lat IS NOT NULL AND s.is_active
        ORDER BY t.trips DESC"""):
        stations.append({
            "id": r["station_id"],
            "name": display_name(r["station_name"]),
            "fullName": r["station_name"],
            "lat": r["lat"],
            "lon": r["lon"],
            "capacity": r["capacity"],
            "firstSeen": str(r["first_seen"])[:7],
            "leisureSharePct": leisure_by_station.get(r["station_id"]),
            "tripsByYear": station_years.get(r["station_id"], {}),
            "trailing12": {
                "trips": r["trips"],
                "ebikeSharePct": r["ebike_share_pct"],
                "commuteSharePct": r["commute_share_pct"],
                "weekendSharePct": r["weekend_share_pct"],
                "distinctDestinations": r["distinct_destinations"],
                "topDestinations": [
                    {
                        "id": d["stationId"],
                        "name": display_name(name_by_id.get(d["stationId"])),
                        "trips": d["trips"],
                    }
                    for d in (r["top_destinations"] or [])
                ],
            },
            "nearestTransit": {
                "name": r["nearest_transit_station"],
                "distanceM": r["nearest_transit_m"],
            },
            "connector": {
                "score": r["connector_score"],
                "components": {
                    "transitProximity": r["comp_transit_proximity"],
                    "tripVolume": r["comp_trip_volume"],
                    "commutePattern": r["comp_commute_pattern"],
                    "ebikeShare": r["comp_ebike_share"],
                    "destinationDiversity": r["comp_destination_diversity"],
                },
            },
        })

    transit = [
        {
            "name": r["name"],
            "line": "Canada Line" if r["name"] in CANADA_LINE else "SkyTrain",
            "area": r["area"],
            "lat": r["lat"],
            "lon": r["lon"],
        }
        for r in rows(con, f"""
            -- multi-line stations (Waterfront, Commercial-Broadway) appear once
            -- per platform in the CoV dataset; collapse to one point per name
            SELECT name, min(area) AS area, avg(lat) AS lat, avg(lon) AS lon
            FROM (
              SELECT f.properties.station AS name, f.properties.geo_local_area AS area,
                     CAST(f.geometry.coordinates[2] AS DOUBLE) AS lat,
                     CAST(f.geometry.coordinates[1] AS DOUBLE) AS lon
              FROM (SELECT unnest(features) AS f
                    FROM read_json_auto(getvariable('data_raw') || '/geo/rapid-transit-stations.geojson'))
            )
            GROUP BY name ORDER BY name""")
    ]

    # Flows: hourly departure/return profiles + balance stats, limited to the
    # station set the app already renders (active with coordinates).
    station_ids = {s["id"] for s in stations}
    flow_profiles: dict[str, dict] = {
        sid: {
            "weekday": {"dep": [0] * 24, "ret": [0] * 24},
            "weekend": {"dep": [0] * 24, "ret": [0] * 24},
        }
        for sid in station_ids
    }
    for r in rows(con, "SELECT * FROM v_station_flows"):
        profile = flow_profiles.get(r["station_id"])
        if profile is None:
            continue
        profile[r["day_type"]]["dep"][r["hour"]] = r["departures"]
        profile[r["day_type"]]["ret"][r["hour"]] = r["returns"]
    balance = {
        r["station_id"]: r
        for r in rows(con, "SELECT * FROM v_station_balance")
    }
    day_counts = rows(con, "SELECT * FROM v_flow_day_counts")[0]
    flows = {
        "networkDailyRebalancing": one(con, "SELECT bikes_per_day FROM v_network_rebalancing"),
        "weekdayCount": day_counts["weekday_count"],
        "weekendCount": day_counts["weekend_count"],
        "stations": [
            {
                "id": s["id"],
                "avgDailyNet": balance.get(s["id"], {}).get("avg_daily_net", 0),
                "avgAbsDailyNet": balance.get(s["id"], {}).get("avg_abs_daily_net", 0),
                "avgPeakSwing": balance.get(s["id"], {}).get("avg_peak_swing", 0),
                **flow_profiles[s["id"]],
            }
            for s in stations
        ],
    }

    # E-bike vs classic + trip-purpose heuristic outputs.
    compare = {
        ("ebike" if r["is_ebike"] else "classic"): {
            "trips": r["trips"],
            "medianDurationMin": r["median_duration_min"],
            "medianDistanceKm": r["median_distance_km"],
            "medianSpeedKmh": r["median_speed_kmh"],
            "medianDetour": r["median_detour"],
        }
        for r in rows(con, "SELECT * FROM v_ebike_compare")
    }
    purpose = rows(con, "SELECT * FROM v_network_purpose")[0]
    ebike = {
        "since": "2022-08",
        "compare": compare,
        "shareByTempBand": [
            {"tempBandC": r["temp_band_c"], "ebikeSharePct": r["ebike_share_pct"]}
            for r in rows(con, "SELECT * FROM v_ebike_share_by_temp")
        ],
        "purpose": {
            "leisureSharePct": purpose["leisure_share_pct"],
            "classifiedTrips": purpose["trips"],
            "definition": "leisure when score >= 4: same-station round trip +3, "
            "weekend +1, midday depart +1, >20min +1 / >40min +2, detour >1.8x +1, "
            "seawall-adjacent endpoint +2",
        },
    }

    rule_labels = {
        "dock-capacity-pressure": "Increase dock capacity",
        "ebike-gap": "Prioritize e-bikes",
        "transit-connector-gap": "Promote as transit connector",
        "seasonal-underuse": "Monitor demand",
    }
    opportunities = [
        {
            "rank": r["rank"],
            "stationId": r["station_id"],
            "stationName": display_name(r["station_name"]),
            "rule": r["rule"],
            "type": rule_labels[r["rule"]],
            "priority": r["priority"],
            # the SQL UNION widens evidence structs across rules; drop the null keys
            "evidence": {k: v for k, v in r["evidence"].items() if v is not None},
        }
        for r in rows(con, "SELECT * FROM v_opportunities")
    ]

    metrics = {
        (s, m): v
        for s, m, v in con.execute("SELECT stage, metric, value FROM etl_metrics").fetchall()
    }

    # Station analytics silently losing trips is exactly the failure mode the
    # mid-2025 prefixless files caused; gate on trailing-12-month coverage.
    station_coverage = one(con, """
        SELECT 100.0 * sum(CASE WHEN departure_station_id IS NOT NULL THEN 1 ELSE 0 END)
               / count(*)
        FROM countable_trips
        WHERE trip_month IN (SELECT trip_month FROM v_t12_months)""")
    if station_coverage < 95:
        raise SystemExit(
            f"station-ID coverage over the trailing 12 months is {station_coverage:.1f}% "
            "(minimum 95%); fix the crosswalk before publishing"
        )
    unknown_membership = one(
        con, "SELECT count(*) FROM countable_trips WHERE membership_raw IS NULL"
    )
    meta = {
        "generatedAt": generated_at,
        "sourceWindow": {"firstMonth": window["first_month"], "lastMonth": window["last_month"]},
        "totals": {
            "trips": sum(y["trips"] for y in yearly),
            "distanceKm": sum(y["distanceKm"] for y in yearly),
            "years": len(yearly),
            "activeStations": len(stations),
            "ebikeSharePctLatestYear": yearly[-1]["ebikeSharePct"] if yearly else None,
        },
        "quality": {
            "rowsLanded": metrics[("extract", "rows_landed")],
            "filesProcessed": metrics[("extract", "files_landed")],
            "rowsKept": metrics[("clean", "rows_kept")],
            "droppedBlankStations": metrics[("clean", "rows_dropped_blank_stations")],
            "droppedBadTimestamp": metrics[("clean", "rows_dropped_bad_timestamp")],
            "droppedDuplicates": metrics[("clean", "rows_dropped_duplicates")],
            "rowsFlagged": metrics[("conform", "rows_flagged")],
            "stationIdCoveragePctT12": round(station_coverage, 1),
            "unknownMembershipTrips": unknown_membership,
        },
        "sources": {
            "trips": "https://www.mobibikes.ca/en/system-data",
            "gbfs": common.REFERENCE_SOURCES["gbfs_station_information"]["url"],
            "cityOfVancouver": "https://opendata.vancouver.ca",
        },
    }

    return {
        "meta.json": meta,
        "yearly.json": yearly,
        "monthly.json": monthly,
        "seasonality.json": [
            {"year": year, "tripsByMonth": months} for year, months in sorted(seasonality.items())
        ],
        "hourly.json": [
            {"year": year, **profiles} for year, profiles in sorted(hourly.items())
        ],
        "weather.json": weather,
        "stations.json": {"stations": stations, "transit": transit},
        "opportunities.json": opportunities,
        "flows.json": flows,
        "ebike.json": ebike,
    }


def write_artifacts(artifacts: dict[str, object], out_dir: Path) -> int:
    out_dir.mkdir(parents=True, exist_ok=True)
    total_raw = total_gzip = 0
    for name, payload in artifacts.items():
        blob = json.dumps(payload, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
        (out_dir / name).write_bytes(blob + b"\n")
        gz = len(gzip.compress(blob))
        total_raw += len(blob)
        total_gzip += gz
        print(f"{name}: {len(blob) / 1e3:.1f} KB raw / {gz / 1e3:.1f} KB gzip")
    print(f"TOTAL: {total_raw / 1e3:.1f} KB raw / {total_gzip / 1e3:.1f} KB gzip")
    if total_raw > BUDGET_RAW or total_gzip > BUDGET_GZIP:
        print(
            f"error: over budget ({BUDGET_RAW / 1e3:.0f} KB raw / {BUDGET_GZIP / 1e3:.0f} KB gzip)",
            file=sys.stderr,
        )
        return 1
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--db", type=Path, default=common.REPO_ROOT / "data-warehouse" / "mobi.duckdb"
    )
    args = parser.parse_args()
    con = duckdb.connect(str(args.db))  # read-write: publish views live in the warehouse
    con.execute("SET VARIABLE data_raw = ?", [str(common.DATA_RAW)])
    con.execute((common.PIPELINE_DIR / "sql" / "50_publish.sql").read_text(encoding="utf-8"))
    return write_artifacts(build_artifacts(con), OUT_DIR)


if __name__ == "__main__":
    sys.exit(main())
