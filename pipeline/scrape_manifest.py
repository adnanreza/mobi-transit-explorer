"""Regenerate pipeline/manifest.json from the Mobi system-data page.

Merges into the existing manifest: new periods are added, unchanged periods
keep their recorded checksums, and a changed Drive ID for a known period is
reported but NOT overwritten unless --accept-changes is passed.

Usage: python pipeline/scrape_manifest.py [--accept-changes]
"""

from __future__ import annotations

import argparse
import re
import sys

import requests

import common


ANCHOR_RE = re.compile(r'<a[^>]+href="([^"]+)"[^>]*>(.*?)</a>', re.S)


def extract_links(html: str) -> tuple[dict[str, str], list[str]]:
    """Return {period: drive_id} plus a list of unrecognized google links."""
    periods: dict[str, str] = {}
    unrecognized: list[str] = []
    for href, inner in ANCHOR_RE.findall(html):
        id_match = common.DRIVE_FILE_RE.match(href)
        if not id_match:
            continue
        label = re.sub(r"<[^>]+>", " ", inner)
        label = label.replace("&amp;", "&").replace("&nbsp;", " ")
        period = common.parse_period_label(label)
        if period is None:
            unrecognized.append(f"{label.strip()!r} -> {href}")
        elif period in periods and periods[period] != id_match.group(1):
            unrecognized.append(f"duplicate period {period}: {href}")
        else:
            periods[period] = id_match.group(1)
    return periods, unrecognized


def merge(manifest: dict, scraped: dict[str, str], accept_changes: bool) -> dict:
    """Merge scraped {period: drive_id} into the manifest. Returns a report."""
    report = {"new": [], "unchanged": [], "changed": []}
    for period, drive_id in scraped.items():
        entry = manifest["trips"].get(period)
        if entry is None:
            manifest["trips"][period] = {"drive_id": drive_id}
            report["new"].append(period)
        elif entry["drive_id"] == drive_id:
            report["unchanged"].append(period)
        else:
            report["changed"].append(f"{period}: {entry['drive_id']} -> {drive_id}")
            if accept_changes:
                manifest["trips"][period] = {"drive_id": drive_id}
    return report


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--accept-changes", action="store_true")
    args = parser.parse_args()

    response = requests.get(
        common.SOURCE_PAGE, timeout=60, headers={"User-Agent": "mobi-transit-explorer-pipeline"}
    )
    response.raise_for_status()

    scraped, unrecognized = extract_links(response.text)
    manifest = common.load_manifest()
    report = merge(manifest, scraped, args.accept_changes)
    common.save_manifest(manifest)

    print(f"scraped {len(scraped)} period links from {common.SOURCE_PAGE}")
    print(f"new: {len(report['new'])} unchanged: {len(report['unchanged'])}")
    for line in report["changed"]:
        action = "updated" if args.accept_changes else "NOT applied (use --accept-changes)"
        print(f"changed drive id, {action}: {line}")
    for line in unrecognized:
        print(f"unrecognized google link: {line}")
    if not scraped:
        print("error: no period links found; page layout may have changed", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
