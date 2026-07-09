"""Shared helpers for the Mobi data acquisition pipeline."""

from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path

PIPELINE_DIR = Path(__file__).resolve().parent
REPO_ROOT = PIPELINE_DIR.parent
MANIFEST_PATH = PIPELINE_DIR / "manifest.json"
DATA_RAW = REPO_ROOT / "data-raw"
TRIPS_DIR = DATA_RAW / "trips"
GBFS_DIR = DATA_RAW / "gbfs"
GEO_DIR = DATA_RAW / "geo"

SOURCE_PAGE = "https://www.mobibikes.ca/en/system-data"

# Reference datasets snapshotted alongside trip files. GBFS feed verified on
# the Fifteen platform July 2026; CoV datasets via the Explore API v2.1.
REFERENCE_SOURCES = {
    "gbfs_station_information": {
        "url": "https://gbfs.kappa.fifteen.eu/gbfs/2.2/mobi/en/station_information.json",
        "dir": "gbfs",
        "filename": "station_information.json",
    },
    "cov_rapid_transit_stations": {
        "url": "https://opendata.vancouver.ca/api/explore/v2.1/catalog/datasets/rapid-transit-stations/exports/geojson",
        "dir": "geo",
        "filename": "rapid-transit-stations.geojson",
    },
    "cov_shoreline": {
        "url": "https://opendata.vancouver.ca/api/explore/v2.1/catalog/datasets/shoreline-2002/exports/geojson",
        "dir": "geo",
        "filename": "shoreline-2002.geojson",
    },
}

MONTH_NAMES = {
    "january": 1, "february": 2, "march": 3, "april": 4,
    "may": 5, "june": 6, "july": 7, "august": 8,
    "september": 9, "october": 10, "november": 11, "december": 12,
    # The system-data page misspells November 2021's label; accommodate the
    # exact observed typo rather than fuzzy-matching month names.
    "novemeber": 11,
}

DRIVE_FILE_RE = re.compile(r"https://(?:drive|docs)\.google\.com/(?:file/d|spreadsheets/d)/([\w-]+)")


def parse_period_label(label: str) -> str | None:
    """Map a link label from the system-data page to a period key.

    "May 2026" -> "2026-05"; "ALL of 2017" -> "2017"; anything else -> None.
    """
    text = re.sub(r"\s+", " ", label).strip().lower()
    if re.fullmatch(r"all of 2017", text):
        return "2017"
    match = re.fullmatch(r"([a-z]+) (\d{4})", text)
    if match and match.group(1) in MONTH_NAMES:
        return f"{match.group(2)}-{MONTH_NAMES[match.group(1)]:02d}"
    return None


def drive_download_url(file_id: str) -> str:
    return f"https://drive.usercontent.google.com/download?id={file_id}&export=download&confirm=t"


def sheets_export_url(file_id: str) -> str:
    return f"https://docs.google.com/spreadsheets/d/{file_id}/export?format=csv"


def detect_format(head: bytes) -> str:
    """Classify downloaded content from its first bytes: xlsx, csv, or html."""
    if head.startswith(b"PK\x03\x04"):
        return "xlsx"
    sample = head[:4096].lstrip()
    lowered = sample[:512].lower()
    if lowered.startswith(b"<!doctype") or lowered.startswith(b"<html") or b"<html" in lowered:
        return "html"
    try:
        text = sample.decode("utf-8")
    except UnicodeDecodeError:
        return "unknown"
    # Some 2020 exports use bare-\r (classic Mac) line endings.
    if "," in text and ("\n" in text or "\r" in text):
        return "csv"
    return "unknown"


def extension_for(fmt: str) -> str:
    return {"xlsx": ".xlsx", "csv": ".csv"}[fmt]


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()


def load_manifest() -> dict:
    if MANIFEST_PATH.exists():
        return json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    return {"source_page": SOURCE_PAGE, "trips": {}, "reference": {}}


def save_manifest(manifest: dict) -> None:
    manifest["trips"] = dict(sorted(manifest["trips"].items()))
    MANIFEST_PATH.write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )


def trip_file_path(period: str, fmt: str) -> Path:
    return TRIPS_DIR / f"{period}{extension_for(fmt)}"


def expected_periods(trips: dict) -> list[str]:
    """The continuous run of months the archive should contain: 2017 (single
    file) plus every month from 2018-01 through the latest month present."""
    months = sorted(key for key in trips if key != "2017")
    if not months:
        return ["2017"]
    last_year, last_month = map(int, months[-1].split("-"))
    periods = ["2017"]
    year, month = 2018, 1
    while (year, month) <= (last_year, last_month):
        periods.append(f"{year}-{month:02d}")
        month += 1
        if month == 13:
            month, year = 1, year + 1
    return periods
