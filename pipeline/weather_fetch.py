"""Fetch Environment Canada daily weather for the ridership model.

Station: VANCOUVER HARBOUR CS (stationID 888, climate ID 1108446) — downtown,
matching where most Mobi riding happens. One CSV per year via the documented
bulk endpoint; Open Government Licence - Canada. This external source exists
because the trip files carry no precipitation at all and their temperatures
turn into 0-sentinels after mid-2025.

Usage: python pipeline/weather_fetch.py [--start 2017]
"""

from __future__ import annotations

import argparse
import csv
import sys
from datetime import datetime, timezone

import requests

import common

STATION_ID = 888
STATION_NAME = "VANCOUVER HARBOUR CS"
WEATHER_DIR = common.DATA_RAW / "weather"

BULK_URL = (
    "https://climate.weather.gc.ca/climate_data/bulk_data_e.html"
    "?format=csv&stationID={station}&Year={year}&Month=1&Day=1&timeframe=2"
    "&submit=Download+Data"
)


def fetch_year(year: int) -> tuple[str, int]:
    """Download one year; returns (relative path, usable-day count)."""
    WEATHER_DIR.mkdir(parents=True, exist_ok=True)
    dest = WEATHER_DIR / f"ec-{STATION_ID}-{year}.csv"
    response = requests.get(
        BULK_URL.format(station=STATION_ID, year=year),
        timeout=120,
        headers={"User-Agent": "mobi-transit-explorer-pipeline"},
    )
    response.raise_for_status()
    dest.write_bytes(response.content)
    rows = list(csv.DictReader(dest.open(encoding="utf-8-sig")))
    usable = sum(
        1 for r in rows if r.get("Mean Temp (°C)") and r.get("Total Precip (mm)")
    )
    return f"weather/{dest.name}", usable


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--start", type=int, default=2017)
    args = parser.parse_args()

    manifest = common.load_manifest()
    weather_meta = manifest.setdefault("reference", {}).setdefault(
        "ec_weather",
        {"station_id": STATION_ID, "station_name": STATION_NAME, "years": {}},
    )
    current_year = datetime.now(timezone.utc).year
    failures = 0
    for year in range(args.start, current_year + 1):
        try:
            rel, usable = fetch_year(year)
            path = common.DATA_RAW / rel
            weather_meta["years"][str(year)] = {
                "file": rel,
                "usable_days": usable,
                "sha256": common.sha256_file(path),
                "fetched_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            }
            print(f"{year}: {usable} usable days")
            # full years should be nearly complete; the current year is partial
            if year < current_year and usable < 350:
                print(f"warning: {year} has only {usable} usable days", file=sys.stderr)
        except requests.RequestException as exc:
            failures += 1
            print(f"FAILED {year}: {exc}", file=sys.stderr)
    common.save_manifest(manifest)
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
