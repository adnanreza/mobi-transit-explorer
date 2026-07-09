"""Staged ETL: raw archive -> DuckDB star schema.

Stages (each re-runnable):
  extract  land every raw file into raw_trips (all VARCHAR, unified headers)
  clean    type values; drop blank-station/unparseable-timestamp rows; dedupe
  conform  station IDs, canonical month, quality flags
  model    fact_trips + dim_station / dim_date / dim_membership

Usage: python pipeline/etl.py [--stage extract|clean|conform|model|all]
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import duckdb

import common

SQL_DIR = common.PIPELINE_DIR / "sql"
MAPPINGS_DIR = common.PIPELINE_DIR / "mappings"
WAREHOUSE = common.REPO_ROOT / "data-warehouse" / "mobi.duckdb"
STAGES = ("extract", "clean", "conform", "model")


class UnknownColumns(Exception):
    """A source file has headers the era map does not know about."""


def load_column_map(mappings_dir: Path = MAPPINGS_DIR) -> dict:
    raw = json.loads((mappings_dir / "column_eras.json").read_text(encoding="utf-8"))
    return {k: v for k, v in raw.items() if not k.startswith("_")}


def prepare_csv(path: Path) -> Path:
    """Return a UTF-8-safe path for a CSV. The summer 2023 files mangle the
    Squamish-language station name (0099 šxʷƛ̓ənəq Xwtl'e7énḵ Square) into
    bytes that are invalid UTF-8 (and rejected by DuckDB's latin-1 reader
    for containing control codes), so those files are transcoded once via
    Python's permissive latin-1 decode into a cached sidecar; the rows
    survive with a mojibake historical name."""
    data = path.read_bytes()
    try:
        data.decode("utf-8")
        return path
    except UnicodeDecodeError:
        sidecar = path.parent / ".transcoded" / path.name
        sidecar.parent.mkdir(exist_ok=True)
        if not sidecar.exists() or sidecar.stat().st_mtime < path.stat().st_mtime:
            sidecar.write_bytes(data.decode("latin-1").encode("utf-8"))
        return sidecar


def reader_expr(path: Path, fmt: str) -> str:
    if fmt == "xlsx":
        quoted = str(path).replace("'", "''")
        return f"read_xlsx('{quoted}', all_varchar = true)"
    quoted = str(prepare_csv(path)).replace("'", "''")
    return f"read_csv('{quoted}', header = true, all_varchar = true)"


def read_header(con: duckdb.DuckDBPyConnection, path: Path, fmt: str) -> list[str]:
    rows = con.execute(f"DESCRIBE SELECT * FROM {reader_expr(path, fmt)}").fetchall()
    return [row[0] for row in rows]


def plan_columns(header: list[str], column_map: dict, source: str) -> list[tuple[str, str]]:
    """Return (raw, unified) pairs for the columns to load; raise on any
    header the era map does not list or a doubled unified target."""
    unknown = [h for h in header if h.strip() not in column_map]
    if unknown:
        raise UnknownColumns(
            f"{source}: unmapped header(s) {unknown!r}; add them to column_eras.json"
        )
    pairs = [(h, column_map[h.strip()]) for h in header if column_map[h.strip()]]
    targets = [unified for _, unified in pairs]
    if len(targets) != len(set(targets)):
        raise UnknownColumns(f"{source}: two headers map to the same unified column: {targets}")
    return pairs


def run_extract(
    con: duckdb.DuckDBPyConnection,
    trips: dict[str, tuple[Path, str]],
    column_map: dict,
) -> None:
    run_sql_file(con, "10_extract.sql")
    for period, (path, fmt) in sorted(trips.items()):
        pairs = plan_columns(read_header(con, path, fmt), column_map, path.name)
        cols = ", ".join(f'"{unified}"' for _, unified in pairs)
        select = ", ".join(f'"{raw}"' for raw, _ in pairs)
        con.execute(
            f"INSERT INTO raw_trips (source_period, source_file, {cols}) "
            f"SELECT '{period}', '{path.name}', {select} FROM {reader_expr(path, fmt)}"
        )
    record(con, "extract", "rows_landed", "SELECT count(*) FROM raw_trips")
    record(con, "extract", "files_landed", "SELECT count(DISTINCT source_file) FROM raw_trips")


def reset_stage_metrics(con: duckdb.DuckDBPyConnection, stage: str) -> None:
    """Stages are re-runnable; their metrics must not accumulate across runs."""
    con.execute("DELETE FROM etl_metrics WHERE stage = ?", [stage])


def run_clean(con: duckdb.DuckDBPyConnection) -> None:
    reset_stage_metrics(con, "clean")
    run_sql_file(con, "20_clean.sql")
    record(
        con, "clean", "rows_dropped_blank_stations",
        """SELECT count(*) FROM raw_trips
           WHERE nullif(trim(departure_station), '') IS NULL
             AND nullif(trim(return_station), '') IS NULL""",
    )
    record(
        con, "clean", "rows_dropped_bad_timestamp",
        """SELECT count(*) FROM raw_trips
           WHERE (nullif(trim(departure_station), '') IS NOT NULL
                  OR nullif(trim(return_station), '') IS NOT NULL)
             AND (parse_ts(departure) IS NULL OR parse_ts("return") IS NULL)""",
    )
    record(con, "clean", "rows_kept", "SELECT count(*) FROM clean_trips")
    con.execute(
        """INSERT INTO etl_metrics
           SELECT 'clean', 'rows_dropped_duplicates',
                  (SELECT value FROM etl_metrics WHERE stage = 'extract' AND metric = 'rows_landed')
                  - (SELECT value FROM etl_metrics WHERE stage = 'clean' AND metric = 'rows_dropped_blank_stations')
                  - (SELECT value FROM etl_metrics WHERE stage = 'clean' AND metric = 'rows_dropped_bad_timestamp')
                  - (SELECT value FROM etl_metrics WHERE stage = 'clean' AND metric = 'rows_kept')"""
    )


def run_conform(con: duckdb.DuckDBPyConnection) -> None:
    reset_stage_metrics(con, "conform")
    run_sql_file(con, "30_conform.sql")
    record(con, "conform", "rows_conformed", "SELECT count(*) FROM conformed_trips")
    record(
        con, "conform", "rows_flagged",
        "SELECT count(*) FROM conformed_trips WHERE len(quality_flags) > 0",
    )


def run_model(con: duckdb.DuckDBPyConnection) -> None:
    reset_stage_metrics(con, "model")
    run_sql_file(con, "40_model.sql")
    record(con, "model", "fact_trips", "SELECT count(*) FROM fact_trips")
    record(con, "model", "dim_station", "SELECT count(*) FROM dim_station")
    record(con, "model", "dim_membership", "SELECT count(*) FROM dim_membership")


def run_sql_file(con: duckdb.DuckDBPyConnection, name: str) -> None:
    con.execute((SQL_DIR / name).read_text(encoding="utf-8"))


def record(con: duckdb.DuckDBPyConnection, stage: str, metric: str, query: str) -> None:
    value = con.execute(query).fetchone()[0]
    con.execute("INSERT INTO etl_metrics VALUES (?, ?, ?)", [stage, metric, value])
    print(f"{stage}.{metric} = {value:,}")


def connect(db_path: Path, data_raw: Path, mappings_dir: Path) -> duckdb.DuckDBPyConnection:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    con = duckdb.connect(str(db_path))
    con.execute("INSTALL excel; LOAD excel;")
    con.execute(
        "CREATE TABLE IF NOT EXISTS etl_metrics "
        "(stage VARCHAR NOT NULL, metric VARCHAR NOT NULL, value BIGINT NOT NULL)"
    )
    con.execute("SET VARIABLE data_raw = ?", [str(data_raw)])
    con.execute("SET VARIABLE mappings_dir = ?", [str(mappings_dir)])
    return con


def manifest_trip_files(data_raw: Path) -> dict[str, tuple[Path, str]]:
    manifest = common.load_manifest()
    trips = {}
    for period, entry in manifest["trips"].items():
        fmt = entry.get("format")
        if not fmt:
            raise SystemExit(f"{period}: not downloaded yet; run download.py first")
        trips[period] = (data_raw / "trips" / f"{period}{common.extension_for(fmt)}", fmt)
    return trips


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--stage", choices=STAGES + ("all",), default="all")
    parser.add_argument("--db", type=Path, default=WAREHOUSE)
    args = parser.parse_args()

    con = connect(args.db, common.DATA_RAW, MAPPINGS_DIR)
    stages = STAGES if args.stage == "all" else (args.stage,)
    for stage in stages:
        if stage == "extract":
            run_extract(con, manifest_trip_files(common.DATA_RAW), load_column_map())
        elif stage == "clean":
            run_clean(con)
        elif stage == "conform":
            run_conform(con)
        elif stage == "model":
            run_model(con)
    con.close()
    print(f"warehouse: {args.db}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
