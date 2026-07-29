"""Fetch ICBC reported cyclist-involved crashes for Vancouver (spec 046).

ICBC publishes crash data as a Tableau Public workbook, not a CSV endpoint.
The packaged workbook (.twbx) is a zip holding a Hyper extract; this script
downloads it, reads the extract, keeps cyclist-involved rows for the
municipalities Mobi serves (Vancouver and UBC), and writes one small
normalized CSV to data-raw/icbc/.

Two facts about the source shape every decision here:

  - Rows are WEIGHTED, not unit records. TOTAL_CRASHES is 1 on most rows but
    runs 2 to 8 on others (province-wide: 1,453,136 rows carrying 1,465,435
    crashes). Every count downstream is a sum of that weight, carried through
    as crash_weight.
  - The public window ROLLS. The current workbook covers 2021-2025 and is
    refreshed annually, so a superseded vintage cannot be refetched. The
    manifest records what was used; the committed artifact is the record.

Schema drift stops the run, matching the trip-file era-map discipline: a
missing column, an unknown flag or severity value, a non-integral weight, a
missing vintage year, or an out-of-range coordinate all raise rather than
being guessed past. Extra columns are tolerated on purpose: a new dimension
splits rows further without changing the weighted totals this script sums.

Contains information licensed under ICBC's Open Data Licence
(https://www.icbc.com/policies/open-data-licence). The exact attribution
string, with its typographic apostrophe, lives in the manifest and ships in
the published artifact.

Usage: python pipeline/icbc_fetch.py [--force]
"""

from __future__ import annotations

import argparse
import csv
import re
import sys
import tempfile
import zipfile
from datetime import datetime, timezone
from pathlib import Path

import requests

import common

ICBC_DIR = common.DATA_RAW / "icbc"
FILTERED_NAME = "vancouver-ubc-cyclist-crashes.csv"
WORKBOOK_URL = "https://public.tableau.com/workbooks/ICBCReportedCrashes.twb"
LICENCE = {
    "name": "Open Data Licence for ICBC Information",
    "version": "1.0",
    "url": "https://www.icbc.com/policies/open-data-licence",
    # Verbatim from the licence page; the apostrophe is U+2019, not ASCII.
    "attribution": "Contains information licensed under ICBC’s Open Data Licence.",
    # The published text carries a fill-in blank; spec 046 resolves it to
    # "analysis" as a documented choice.
    "disclaimer": (
        "All analysis, inferences, opinions, and conclusions drawn in this analysis "
        "are those of the authors, and do not reflect the opinions, position or "
        "policies of ICBC."
    ),
}
CATALOGUE_RECORD = "https://catalogue.data.gov.bc.ca/dataset/icbc-reported-crashes"

# The extract member inside the .twbx, matched on the vintage pattern so an
# annual refresh (2021-2025 becoming 2022-2026) still lands while the
# workbook's other extracts, including "Caveats (Public data sets -
# Metadata)", cannot be mistaken for it. The captured years are cross-checked
# against the years actually present in the data.
EXTRACT_RE = re.compile(r"(\d{4})-(\d{4}) public data set\.hyper$", re.IGNORECASE)

REQUIRED_COLUMNS = {
    "DATE_OF_LOSS_YEAR", "MONTH_OF_YEAR", "DAY_OF_WEEK", "TIME_CATEGORY",
    "CRASH_SEVERITY", "CYCLIST_FLAG", "MUNICIPALITY_NAME", "STREET_FULL_NAME",
    "CROSS_STREET_FULL_NAME", "INTERSECTION_CRASH", "LATITUDE", "LONGITUDE",
    "TOTAL_CRASHES",
}
KNOWN_SEVERITIES = {"CASUALTY CRASH", "PROPERTY DAMAGE ONLY"}
# Mobi's service area is the City of Vancouver AND the UBC campus (17 docks
# from Place Vanier to Binning & Wesbrook). ICBC publishes UBC as its own
# municipality, so filtering on Vancouver alone left those docks reading a
# measured zero for territory the query never covered. Spec 046 rev 2 asserted
# "Mobi operates only in the city proper", which the station list refutes.
MUNICIPALITIES = ("VANCOUVER", "UBC")
KNOWN_FLAGS = {"Y", "N"}
# Generous box around Vancouver proper; a coordinate outside it means the
# municipality filter or the source geography changed.
LAT_RANGE = (49.19, 49.33)
# west to -123.27 to cover the UBC campus (Place Vanier sits at -123.2587)
LON_RANGE = (-123.27, -123.01)

FIELDS = [
    "year", "month", "day_of_week", "time_band", "severity", "intersection",
    "street", "cross_street", "lat", "lon", "crash_weight", "municipality",
]


def download(url: str, dest: Path) -> None:
    with requests.get(
        url, stream=True, timeout=600,
        headers={"User-Agent": "mobi-transit-explorer-pipeline"},
    ) as response:
        response.raise_for_status()
        with dest.open("wb") as out:
            for chunk in response.iter_content(1 << 20):
                out.write(chunk)


def extract_hyper(twbx: Path, work_dir: Path) -> tuple[Path, tuple[int, int]]:
    """Pull the public-data-set extract out of the packaged workbook.

    Returns the extracted path and the vintage claimed by its filename.
    """
    with zipfile.ZipFile(twbx) as archive:
        matches = [
            (name, match)
            for name in archive.namelist()
            if (match := EXTRACT_RE.search(name))
        ]
        if len(matches) != 1:
            hyper_members = [n for n in archive.namelist() if n.lower().endswith(".hyper")]
            raise RuntimeError(
                "expected exactly one 'YYYY-YYYY public data set.hyper' member, found "
                f"{[n for n, _ in matches]}; all .hyper members: {hyper_members}. "
                "The workbook layout changed and needs a look."
            )
        name, match = matches[0]
        target = work_dir / "extract.hyper"
        with archive.open(name) as src, target.open("wb") as out:
            while chunk := src.read(1 << 20):
                out.write(chunk)
    return target, (int(match.group(1)), int(match.group(2)))


def read_service_area_cyclist_rows(hyper_path: Path) -> list[dict]:
    """Filtered rows, with the schema asserted before anything is trusted."""
    from tableauhyperapi import Connection, HyperProcess, Telemetry

    with HyperProcess(telemetry=Telemetry.DO_NOT_SEND_USAGE_DATA_TO_TABLEAU) as hyper:
        with Connection(endpoint=hyper.endpoint, database=str(hyper_path)) as con:
            table = '"Extract"."Extract"'
            definition = con.catalog.get_table_definition(
                con.catalog.get_table_names("Extract")[0]
            )
            present = {c.name.unescaped for c in definition.columns}
            missing = REQUIRED_COLUMNS - present
            if missing:
                raise RuntimeError(f"extract is missing expected columns: {sorted(missing)}")

            flags = {r[0] for r in con.execute_list_query(
                f'SELECT DISTINCT "CYCLIST_FLAG" FROM {table}')}
            if not flags <= KNOWN_FLAGS:
                raise RuntimeError(f"unexpected CYCLIST_FLAG values: {sorted(flags)}")
            severities = {r[0] for r in con.execute_list_query(
                f'SELECT DISTINCT "CRASH_SEVERITY" FROM {table}')}
            if not severities <= KNOWN_SEVERITIES:
                raise RuntimeError(f"unexpected CRASH_SEVERITY values: {sorted(severities)}")
            bad_weights = con.execute_scalar_query(f"""
                SELECT count(*) FROM {table}
                WHERE "TOTAL_CRASHES" < 1
                   OR "TOTAL_CRASHES" <> cast("TOTAL_CRASHES" AS BIGINT)""")
            if bad_weights:
                raise RuntimeError(
                    f"{bad_weights} rows have a TOTAL_CRASHES below 1 or non-integral; "
                    "weighting cannot be trusted"
                )

            municipalities = ", ".join(f"'{m}'" for m in MUNICIPALITIES)
            rows = con.execute_list_query(f"""
                SELECT "DATE_OF_LOSS_YEAR", "MONTH_OF_YEAR", "DAY_OF_WEEK",
                       "TIME_CATEGORY", "CRASH_SEVERITY", "INTERSECTION_CRASH",
                       "STREET_FULL_NAME", "CROSS_STREET_FULL_NAME",
                       "LATITUDE", "LONGITUDE", "TOTAL_CRASHES",
                       upper("MUNICIPALITY_NAME") AS "MUNICIPALITY"
                FROM {table}
                WHERE upper("MUNICIPALITY_NAME") IN ({municipalities})
                  AND "CYCLIST_FLAG" = 'Y'
                ORDER BY "DATE_OF_LOSS_YEAR", "MONTH_OF_YEAR", "STREET_FULL_NAME",
                         "LATITUDE", "LONGITUDE", "TIME_CATEGORY", "CRASH_SEVERITY"
            """)

    out: list[dict] = []
    for r in rows:
        lat, lon = r[8], r[9]
        # Checked independently: a row with one coordinate present, or a 0/0
        # sentinel, must not slip through as a located crash.
        if (lat is None) != (lon is None):
            raise RuntimeError(f"row has one coordinate only: lat={lat}, lon={lon}")
        if lat is not None:
            if not LAT_RANGE[0] <= lat <= LAT_RANGE[1]:
                raise RuntimeError(f"latitude {lat} outside {LAT_RANGE}; check the source geography")
            if not LON_RANGE[0] <= lon <= LON_RANGE[1]:
                raise RuntimeError(f"longitude {lon} outside {LON_RANGE}; check the source geography")
        out.append({
            "year": int(r[0]),
            "month": (r[1] or "").strip(),
            "day_of_week": (r[2] or "").strip(),
            "time_band": (r[3] or "").strip(),
            "severity": r[4],
            "intersection": r[5],
            "street": (r[6] or "").strip(),
            "cross_street": (r[7] or "").strip(),
            "lat": lat,
            "lon": lon,
            "crash_weight": int(r[10]),
            "municipality": r[11],
        })
    if not out:
        raise RuntimeError(
            f"no cyclist rows matched {MUNICIPALITIES}; the filter or source changed"
        )
    # Every configured municipality must appear, not just one of them. UBC is
    # 1.8% of the total, so if ICBC renamed or dropped it the Vancouver rows
    # alone would sail past both this check's earlier form and the 25% volume
    # warning, and 17 campus docks would quietly revert to false measured
    # zeros. That is the exact regression this feature was fixed for.
    found = {r["municipality"] for r in out}
    missing_municipalities = set(MUNICIPALITIES) - found
    if missing_municipalities:
        raise RuntimeError(
            f"no cyclist rows for {sorted(missing_municipalities)}; the source may have "
            f"renamed or dropped them (found {sorted(found)}). Losing one municipality "
            "silently would put false zeros on its docks."
        )
    return out


def write_filtered(rows: list[dict], dest: Path) -> None:
    """Write the filtered rows in a fully determined order.

    The manifest pins this file's sha256 and publish.py refuses to run when it
    does not match, so the bytes have to be reproducible. Ordering in SQL was
    not enough: 15 groups of rows tie on the ordered columns while differing in
    fields the sort ignored (two crashes at the same corner in the same month
    on different weekdays), and the engine may return those either way round.
    Sorting on every emitted field here removes the ambiguity regardless of
    what the source returns.
    """
    ordered = sorted(rows, key=lambda r: tuple("" if r[f] is None else str(r[f]) for f in FIELDS))
    with dest.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=FIELDS)
        writer.writeheader()
        writer.writerows(ordered)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--force", action="store_true",
        help="refetch even when the stored file matches the manifest (the workbook is mutable)",
    )
    args = parser.parse_args()

    ICBC_DIR.mkdir(parents=True, exist_ok=True)
    dest = ICBC_DIR / FILTERED_NAME
    manifest = common.load_manifest()
    meta = manifest.setdefault("reference", {}).get("icbc_crashes", {})

    if (
        not args.force
        and dest.exists()
        and meta.get("filtered_sha256") == common.sha256_file(dest)
    ):
        print(f"{FILTERED_NAME}: unchanged, skipped (use --force to refetch)")
        return 0

    with tempfile.TemporaryDirectory() as work:
        work_dir = Path(work)
        twbx = work_dir / "workbook.twbx"
        print(f"downloading {WORKBOOK_URL} ...")
        download(WORKBOOK_URL, twbx)
        twbx_sha = common.sha256_file(twbx)
        hyper_path, claimed_vintage = extract_hyper(twbx, work_dir)
        rows = read_service_area_cyclist_rows(hyper_path)

    years = sorted({r["year"] for r in rows})
    expected = set(range(claimed_vintage[0], claimed_vintage[1] + 1))
    if set(years) != expected:
        raise RuntimeError(
            f"extract filename claims {claimed_vintage[0]}-{claimed_vintage[1]} but the rows "
            f"cover {years}; a missing year would silently change every count"
        )
    # A large swing against the last recorded fetch means the source moved in a
    # way worth a human look before it reaches the site.
    previous = meta.get("crashes")
    crash_total = sum(r["crash_weight"] for r in rows)
    if previous and abs(crash_total - previous) / previous > 0.25:
        print(
            f"warning: crash total moved from {previous:,} to {crash_total:,} "
            "(more than 25%); confirm the source before publishing",
            file=sys.stderr,
        )
    write_filtered(rows, dest)
    crashes = sum(r["crash_weight"] for r in rows)
    with_coords = sum(r["crash_weight"] for r in rows if r["lat"] is not None)
    manifest.setdefault("reference", {})["icbc_crashes"] = {
        "workbook_url": WORKBOOK_URL,
        "catalogue_record": CATALOGUE_RECORD,
        "licence": LICENCE,
        "accessed_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "twbx_sha256": twbx_sha,
        "file": f"icbc/{FILTERED_NAME}",
        "filtered_sha256": common.sha256_file(dest),
        "vintage": {"from": years[0], "to": years[-1]},
        "rows": len(rows),
        "crashes": crashes,
        "crashes_with_coordinates": with_coords,
    }
    common.save_manifest(manifest)
    print(
        f"{FILTERED_NAME}: {len(rows):,} rows carrying {crashes:,} crashes "
        f"({with_coords:,} with coordinates), vintage {years[0]}-{years[-1]}"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
