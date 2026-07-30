"""Fetch BC ENV hourly PM2.5 for the smoke-day analysis (spec 045).

Two stations of record, chosen empirically from the archive itself (the
station metadata sheet's opened dates are wrong; coverage is derived from
the data files, never the metadata):

  - Vancouver Clark Drive: the only station inside Mobi's service area with
    full hourly coverage across the whole trip window. It sits beside a truck
    route, so alone it would overstate local traffic pollution.
  - Burnaby Kensington Park: the regional corroborator. Wildfire smoke is
    regional and elevates both stations at once; truck traffic cannot.

Verified annual files cover 2017-2024; the Year_to_Date file carries
2025-01-01 to the most recent day (unverified, refreshed daily upstream).
Source files are ~100 MB with every BC station; only the two stations' rows
are kept, normalized to obs_date,station_name,raw_value,verified and written
to data-raw/airquality/. The two source schemas differ (annual files carry
DATE and TIME columns; the year-to-date file only DATE_PST), which is why
normalization happens here and not in SQL.

Contains information licensed under the Open Government Licence - British
Columbia. https://catalogue.data.gov.bc.ca/dataset/77eeadf4-0c19-48bf-a47a-fa9eef01f409

Usage: python pipeline/airquality_fetch.py [--start 2017] [--force]
"""

from __future__ import annotations

import argparse
import csv
import sys
import tempfile
import urllib.request
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

import common

AIRQUALITY_DIR = common.DATA_RAW / "airquality"
ANNUAL_URL = "ftp://ftp.env.gov.bc.ca/pub/outgoing/AIR/AnnualSummary/{year}/PM25.csv"
YTD_URL = "ftp://ftp.env.gov.bc.ca/pub/outgoing/AIR/Hourly_Raw_Air_Data/Year_to_Date/PM25.csv"
SOURCE_URL = "https://catalogue.data.gov.bc.ca/dataset/77eeadf4-0c19-48bf-a47a-fa9eef01f409"

PRIMARY_STATION = "Vancouver Clark Drive"
CORROBORATING_STATION = "Burnaby Kensington Park"
STATIONS = (PRIMARY_STATION, CORROBORATING_STATION)

# Carried through the manifest into airquality.json so the app can render
# attribution from the artifact, exactly as crashcontext.json does for ICBC.
LICENCE = {
    "name": "Open Government Licence - British Columbia",
    "version": "2.0",
    "url": "https://www2.gov.bc.ca/gov/content/data/policy-standards/open-data/open-government-licence-bc",
    # Verbatim from the licence text; the dash is U+2013, not ASCII.
    "attribution": "Contains information licensed under the Open Government Licence – British Columbia.",
}

# Last year present under AnnualSummary/ (the verified archive). Everything
# after comes from the unverified year-to-date file and is flagged as such.
VERIFIED_THROUGH = 2024

# A day needs most of its hours at BOTH stations to yield an honest 24h mean.
MIN_HOURS_PER_DAY = 18


def download(url: str) -> Path:
    """Stream a source file to a temp path (they are ~100 MB; never in RAM)."""
    handle = tempfile.NamedTemporaryFile(
        dir=AIRQUALITY_DIR, prefix=".download-", suffix=".csv", delete=False
    )
    try:
        with urllib.request.urlopen(url, timeout=300) as response:
            while chunk := response.read(1 << 20):
                handle.write(chunk)
    except BaseException:
        # The temp file exists before the request starts; a failed download
        # must not leave .download-*.csv debris for the caller's finally.
        handle.close()
        Path(handle.name).unlink(missing_ok=True)
        raise
    handle.close()
    return Path(handle.name)


def normalize(source: Path) -> list[tuple[str, str, float]]:
    """Filter to the two stations; return (obs_date, station_name, raw_value).

    Annual files carry DATE (the observation date) and TIME columns; the
    year-to-date file carries only DATE_PST ("2025-01-01 01:00"). Hours are
    hour-ending 01:00..24:00, and in both layouts the date field already
    names the day the hour belongs to, so no timestamp arithmetic is needed.
    """
    rows: list[tuple[str, str, float]] = []
    with source.open(encoding="utf-8-sig", newline="") as handle:
        for row in csv.DictReader(handle):
            station = row.get("STATION_NAME")
            if station not in STATIONS:
                continue
            raw = row.get("RAW_VALUE")
            if not raw or raw == "NA":
                continue
            obs_date = (row.get("DATE") or row.get("DATE_PST", ""))[:10]
            if len(obs_date) != 10:
                continue
            try:
                value = float(raw)
            except ValueError:
                continue
            rows.append((obs_date, station, value))
    return rows


def usable_days(rows: list[tuple[str, str, float]]) -> int:
    """Days where BOTH stations report at least MIN_HOURS_PER_DAY hours."""
    hours: dict[tuple[str, str], int] = defaultdict(int)
    for obs_date, station, _ in rows:
        hours[(obs_date, station)] += 1
    days = defaultdict(int)
    for (obs_date, station), n in hours.items():
        if n >= MIN_HOURS_PER_DAY:
            days[obs_date] += 1
    return sum(1 for count in days.values() if count == len(STATIONS))


def write_filtered(rows: list[tuple[str, str, float]], dest: Path, verified: bool) -> None:
    with dest.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(["obs_date", "station_name", "raw_value", "verified"])
        for obs_date, station, value in sorted(rows):
            writer.writerow([obs_date, station, value, str(verified).lower()])


def fetch_one(url: str, dest: Path, verified: bool) -> int:
    temp = download(url)
    try:
        rows = normalize(temp)
        if not rows:
            raise RuntimeError(f"no rows for {STATIONS} in {url}")
        write_filtered(rows, dest, verified)
        return usable_days(rows)
    finally:
        temp.unlink(missing_ok=True)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--start", type=int, default=2017)
    parser.add_argument("--force", action="store_true", help="re-download verified years")
    args = parser.parse_args()

    AIRQUALITY_DIR.mkdir(parents=True, exist_ok=True)
    manifest = common.load_manifest()
    meta = manifest.setdefault("reference", {}).setdefault("bc_env_airquality", {})
    # Descriptive fields refresh on every run so a constant edited here (the
    # licence block, a station rename) reaches the manifest without --force.
    meta.update(
        {
            "source": SOURCE_URL,
            "licence": LICENCE,
            "primary_station": PRIMARY_STATION,
            "corroborating_station": CORROBORATING_STATION,
        }
    )
    meta.setdefault("years", {})

    jobs: list[tuple[str, str, bool]] = [
        (str(year), ANNUAL_URL.format(year=year), True)
        for year in range(args.start, VERIFIED_THROUGH + 1)
    ]
    jobs.append(("ytd", YTD_URL, False))

    failures = 0
    for key, url, verified in jobs:
        dest = AIRQUALITY_DIR / f"pm25-{key}.csv"
        existing = meta["years"].get(key, {})
        # Verified annual files are immutable upstream; skip when the stored
        # filtered file still matches its manifest checksum. The year-to-date
        # file changes daily and is always refetched.
        if (
            verified
            and not args.force
            and dest.exists()
            and existing.get("sha256") == common.sha256_file(dest)
        ):
            print(f"{key}: unchanged, skipped")
            continue
        try:
            usable = fetch_one(url, dest, verified)
            meta["years"][key] = {
                "file": f"airquality/{dest.name}",
                "usable_days": usable,
                "verified": verified,
                "sha256": common.sha256_file(dest),
                "fetched_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            }
            print(f"{key}: {usable} usable days")
            if verified and usable < 350:
                print(f"warning: {key} has only {usable} usable days", file=sys.stderr)
        except Exception as exc:  # noqa: BLE001 - report and continue, exit nonzero
            failures += 1
            print(f"FAILED {key}: {exc}", file=sys.stderr)
    common.save_manifest(manifest)
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
