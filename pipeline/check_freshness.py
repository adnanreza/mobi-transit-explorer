"""Artifact-freshness gate: detect drift between committed JSON and the warehouse.

Regenerates the publish JSON from the warehouse into a temporary directory and
compares byte-for-byte against the committed src/data/generated/*.json files.
Exits non-zero if any artifact differs or is missing.

This is a deliberate RELEASE / CI check, NOT a routine pytest — it requires the
DuckDB warehouse and data-raw/ to be present, and it takes O(seconds) to run.
Do NOT invoke it from the normal test suite.

Usage:
    .venv/bin/python pipeline/check_freshness.py
    .venv/bin/python pipeline/check_freshness.py --db path/to/mobi.duckdb

Expected on a clean rebuild: exits 0.
Expected after SQL changes without a rebuild: exits 1 and lists the drifted files.
"""

from __future__ import annotations

import argparse
import shutil
import sys
import tempfile
from pathlib import Path

import duckdb

import common
import publish

COMMITTED_DIR = common.REPO_ROOT / "src" / "data" / "generated"
WAREHOUSE_DEFAULT = common.REPO_ROOT / "data-warehouse" / "mobi.duckdb"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--db", type=Path, default=WAREHOUSE_DEFAULT,
        help="DuckDB warehouse path (default: data-warehouse/mobi.duckdb)",
    )
    args = parser.parse_args()

    if not args.db.exists():
        print(
            f"error: warehouse not found at {args.db}\n"
            "Run the full pipeline first: python pipeline/etl.py --stage all",
            file=sys.stderr,
        )
        return 2

    print(f"Regenerating artifacts from {args.db} into a temp dir …")
    con = duckdb.connect(str(args.db))
    con.execute("SET VARIABLE data_raw = ?", [str(common.DATA_RAW)])
    con.execute((common.PIPELINE_DIR / "sql" / "50_publish.sql").read_text(encoding="utf-8"))
    artifacts = publish.build_artifacts(con)
    con.close()

    with tempfile.TemporaryDirectory() as tmp:
        tmp_dir = Path(tmp)
        publish.write_artifacts(artifacts, tmp_dir)

        # forecast.json is produced by train_model.py (a model fit), not by
        # publish, so it is not regenerated here; its freshness is ensured by
        # re-running train_model.py. Exclude it from the publish-freshness gate.
        non_publish = {"forecast.json"}
        drifted: list[str] = []
        committed_names = {f.name for f in COMMITTED_DIR.glob("*.json")} - non_publish
        generated_names = {f.name for f in tmp_dir.glob("*.json")} - non_publish

        for name in sorted(committed_names | generated_names):
            committed = COMMITTED_DIR / name
            generated = tmp_dir / name
            if not committed.exists():
                print(f"  MISSING in committed:  {name}")
                drifted.append(name)
            elif not generated.exists():
                print(f"  MISSING in generated:  {name}")
                drifted.append(name)
            elif committed.read_bytes() != generated.read_bytes():
                print(f"  DRIFT:                 {name}")
                drifted.append(name)
            else:
                print(f"  ok                     {name}")

    if drifted:
        print(
            f"\nFAIL: {len(drifted)} artifact(s) differ from the warehouse output.\n"
            "Re-run the publish step to regenerate:\n"
            "  python pipeline/publish.py\n"
            "  python pipeline/quality_report.py\n"
            "Then commit the updated artifacts.",
            file=sys.stderr,
        )
        return 1

    print("\nPASS: all committed artifacts match the warehouse.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
