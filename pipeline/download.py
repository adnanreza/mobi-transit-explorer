"""Download every dataset in the manifest into data-raw/.

Idempotent: files whose checksum matches the manifest are skipped. Trip files
come from Google Drive; the two Sheets-hosted months are fetched through the
Sheets CSV export when Drive returns an HTML document instead of data.

Usage: python pipeline/download.py [--force] [--only PERIOD] [--skip-reference]
"""

from __future__ import annotations

import argparse
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import requests

import common

HEAD_BYTES = 8192
ATTEMPTS = 3
CHUNK = 1 << 20


def needs_download(entry: dict, force: bool) -> bool:
    """A trip file is current when its recorded checksum matches the file on disk."""
    if force:
        return True
    fmt, sha = entry.get("format"), entry.get("sha256")
    if not fmt or not sha:
        return True
    path = common.trip_file_path(entry["period"], fmt)
    return not (path.exists() and common.sha256_file(path) == sha)


def fetch_to_file(url: str, dest: Path) -> str:
    """Stream url to dest; return the detected format of the content."""
    with requests.get(
        url, stream=True, timeout=300, headers={"User-Agent": "mobi-transit-explorer-pipeline"}
    ) as response:
        response.raise_for_status()
        head = b""
        with dest.open("wb") as out:
            for chunk in response.iter_content(CHUNK):
                if len(head) < HEAD_BYTES:
                    head += chunk[: HEAD_BYTES - len(head)]
                out.write(chunk)
    return common.detect_format(head)


def download_trip(period: str, entry: dict) -> dict:
    """Download one trip file. Native Google Sheets months (e.g. Oct 2022)
    make Drive's download endpoint fail outright, so the Sheets CSV export is
    always the second URL tried. Returns the updated manifest entry; raises
    when no URL yields usable content."""
    tmp = common.TRIPS_DIR / f".{period}.tmp"
    urls = (
        common.drive_download_url(entry["drive_id"]),
        common.sheets_export_url(entry["drive_id"]),
    )
    last_error = "no url attempted"
    for url in urls:
        for attempt in range(1, ATTEMPTS + 1):
            try:
                fmt = fetch_to_file(url, tmp)
            except requests.RequestException as exc:
                last_error = str(exc)
                time.sleep(2**attempt)
                continue
            if fmt in ("csv", "xlsx"):
                sha = common.sha256_file(tmp)
                expected = entry.get("sha256")
                if expected and sha != expected and not entry.get("accept_changes"):
                    tmp.unlink(missing_ok=True)
                    raise RuntimeError(
                        f"{period}: source content changed (checksum {sha[:12]} != "
                        f"manifest {expected[:12]}); the manifest is the reproducibility "
                        "contract — rerun with --accept-changes to accept the new content"
                    )
                final = common.trip_file_path(period, fmt)
                tmp.replace(final)
                return {
                    **entry,
                    "format": fmt,
                    "sha256": sha,
                    "bytes": final.stat().st_size,
                    "downloaded_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
                }
            last_error = f"unusable content (detected {fmt})"
            break  # wrong content will not improve on retry; try the next url
    tmp.unlink(missing_ok=True)
    raise RuntimeError(f"{period}: {last_error}")


def download_reference(manifest: dict) -> list[str]:
    """Snapshot GBFS and CoV reference datasets; returns failure messages."""
    failures = []
    for key, source in common.REFERENCE_SOURCES.items():
        dest = common.DATA_RAW / source["dir"] / source["filename"]
        dest.parent.mkdir(parents=True, exist_ok=True)
        try:
            fmt = fetch_to_file(source["url"], dest)
            if fmt == "html":
                raise RuntimeError("got an HTML page, not data")
            manifest["reference"][key] = {
                "url": source["url"],
                "file": f"{source['dir']}/{source['filename']}",
                "sha256": common.sha256_file(dest),
                "bytes": dest.stat().st_size,
                "fetched_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            }
            print(f"reference {key}: {dest.stat().st_size:,} bytes")
        except (requests.RequestException, RuntimeError) as exc:
            failures.append(f"reference {key}: {exc}")
    return failures


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--only", help="download a single period, e.g. 2019-07")
    parser.add_argument("--skip-reference", action="store_true")
    parser.add_argument(
        "--accept-changes",
        action="store_true",
        help="accept source content whose checksum differs from the manifest",
    )
    args = parser.parse_args()

    manifest = common.load_manifest()
    if not manifest["trips"]:
        print("manifest has no trip entries; run scrape_manifest.py first", file=sys.stderr)
        return 1
    common.TRIPS_DIR.mkdir(parents=True, exist_ok=True)

    failures: list[str] = []
    skipped = fetched = 0
    for period, entry in sorted(manifest["trips"].items()):
        if args.only and period != args.only:
            continue
        entry = {**entry, "period": period, "accept_changes": args.accept_changes}
        if not needs_download(entry, args.force):
            skipped += 1
            continue
        try:
            updated = download_trip(period, entry)
            updated.pop("period", None)
            updated.pop("accept_changes", None)
            manifest["trips"][period] = updated
            fetched += 1
            print(f"{period}: {updated['format']} {updated['bytes']:,} bytes")
        except RuntimeError as exc:
            failures.append(str(exc))
            print(f"FAILED {exc}", file=sys.stderr)
        time.sleep(0.5)

    if not args.only and not args.skip_reference:
        failures += download_reference(manifest)

    common.save_manifest(manifest)
    print(f"done: {fetched} fetched, {skipped} up to date, {len(failures)} failed")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
