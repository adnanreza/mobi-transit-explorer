"""Publish real Vancouver land geometry for the app's SVG map.

The CoV shoreline-2002 dataset is two open LineStrings that together trace
the city's entire waterfront: the long line runs from Boundary Road at
Burrard Inlet counter-clockwise around Stanley Park, English Bay, False
Creek, Point Grey and back along the Fraser River; the short line continues
along the Fraser to Boundary Road. Concatenated and closed along the eastern
city boundary they form one land polygon - including Stanley Park, which the
local-area-boundary dataset omits. Douglas-Peucker simplification keeps the
committed JSON small while False Creek stays recognizable.

Usage: python pipeline/geo_publish.py
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import common

OUT = common.REPO_ROOT / "src" / "data" / "generated" / "geo" / "land.json"
TOLERANCE_DEG = 0.00035  # ~30 m: keeps seawall curves without map-scale noise
BUDGET_BYTES = 150_000


def perpendicular_distance(pt, a, b) -> float:
    (px, py), (ax, ay), (bx, by) = pt, a, b
    dx, dy = bx - ax, by - ay
    if dx == dy == 0:
        return ((px - ax) ** 2 + (py - ay) ** 2) ** 0.5
    t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)
    t = max(0.0, min(1.0, t))
    cx, cy = ax + t * dx, ay + t * dy
    return ((px - cx) ** 2 + (py - cy) ** 2) ** 0.5


def douglas_peucker(points: list, tolerance: float) -> list:
    """Iterative Douglas-Peucker (the seawall line is 29k points deep)."""
    keep = [False] * len(points)
    keep[0] = keep[-1] = True
    stack = [(0, len(points) - 1)]
    while stack:
        start, end = stack.pop()
        if end - start < 2:
            continue
        max_dist, index = 0.0, start
        for i in range(start + 1, end):
            dist = perpendicular_distance(points[i], points[start], points[end])
            if dist > max_dist:
                max_dist, index = dist, i
        if max_dist > tolerance:
            keep[index] = True
            stack.append((start, index))
            stack.append((index, end))
    return [p for p, k in zip(points, keep) if k]


def build_land_ring() -> list:
    data = json.loads(
        (common.DATA_RAW / "geo" / "shoreline-2002.geojson").read_text(encoding="utf-8")
    )
    lines = sorted(
        (f["geometry"]["coordinates"] for f in data["features"]),
        key=len,
        reverse=True,
    )
    if len(lines) != 2:
        raise SystemExit(f"expected 2 shoreline lines, got {len(lines)}")
    big, small = lines
    if big[-1] != small[0]:
        raise SystemExit("shoreline lines no longer share an endpoint; source changed")
    ring = big + small[1:]
    ring = douglas_peucker(ring, TOLERANCE_DEG)
    # close the polygon back to the start along Boundary Road (the straight
    # eastern city limit); SVG fill closes the path implicitly, so just make
    # first/last explicit for GeoJSON-style consumers
    ring.append(ring[0])
    return [[round(lon, 5), round(lat, 5)] for lon, lat in ring]


def main() -> int:
    ring = build_land_ring()
    lons = [p[0] for p in ring]
    lats = [p[1] for p in ring]
    payload = {
        "source": "City of Vancouver Open Data, shoreline-2002 (Open Government Licence - Vancouver)",
        "bounds": {
            "lonMin": min(lons), "lonMax": max(lons),
            "latMin": min(lats), "latMax": max(lats),
        },
        "landRing": ring,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    blob = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    OUT.write_bytes(blob + b"\n")
    print(f"{OUT.name}: {len(ring)} points, {len(blob) / 1e3:.1f} KB")
    if len(blob) > BUDGET_BYTES:
        print(f"error: over the {BUDGET_BYTES / 1e3:.0f} KB geo budget", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
