"""End-to-end ETL tests on synthetic era fixtures, running the real SQL."""

import json

import pytest
from openpyxl import Workbook

import etl

MODERN_HEADER = (
    "Departure,Return,Bike,Electric bike,Departure station,Return station,Formula,"
    "Covered distance (m),Duration (sec.),Lock duration (sec.),Number of bike locks,"
    "Departure temperature (°C),Return temperature (°C)"
)


def modern_row(
    dep="2026-05-01 10:00:00", ret="2026-05-01 10:30:00", bike="101", ebike="False",
    dep_st="0001 Alpha & First", ret_st="0002 Beta & Second", membership="Pay Per Ride",
    dist="2500", dur="1800", temp="15",
):
    return f"{dep},{ret},{bike},{ebike},{dep_st},{ret_st},{membership},{dist},{dur},0,0,{temp},{temp}"


@pytest.fixture
def env(tmp_path):
    data_raw = tmp_path / "data-raw"
    (data_raw / "trips").mkdir(parents=True)
    (data_raw / "gbfs").mkdir()
    (data_raw / "geo").mkdir()
    (data_raw / "gbfs" / "station_information.json").write_text(json.dumps({
        "data": {"stations": [
            {"station_id": "0001", "name": "Alpha & First", "lat": 49.2828, "lon": -123.1189,
             "capacity": 16, "is_virtual_station": False},
            {"station_id": "0002", "name": "Beta & Second", "lat": 49.2745, "lon": -123.1216,
             "capacity": 20, "is_virtual_station": False},
        ]}}), encoding="utf-8")
    (data_raw / "geo" / "rapid-transit-stations.geojson").write_text(json.dumps({
        "type": "FeatureCollection",
        "features": [{"type": "Feature", "properties": {"station": "Waterfront"},
                      "geometry": {"type": "Point", "coordinates": [-123.1119, 49.2860]}}],
    }), encoding="utf-8")
    mappings = tmp_path / "mappings"
    mappings.mkdir()
    real_map = json.loads(
        (etl.MAPPINGS_DIR / "column_eras.json").read_text(encoding="utf-8")
    )
    (mappings / "column_eras.json").write_text(json.dumps(real_map), encoding="utf-8")
    (mappings / "membership_groups.csv").write_text(
        "membership_raw,membership_group\nPay Per Ride,Casual\n365 Standard,365 Annual\n",
        encoding="utf-8",
    )
    con = etl.connect(tmp_path / "wh.duckdb", data_raw, mappings)
    return con, data_raw, mappings


def write_2017_xlsx(path):
    wb = Workbook()
    ws = wb.active
    ws.append([
        "Departure", "Return", "Account", "Bike", "Departure station", "Return station",
        "Membership type", "Covered distance (m)", "Duration (sec.)",
        "Departure battery voltage (mV)", "Return battery voltage (mV)",
        "Departure temperature (°C)", "Return temperature (°C)",
        "Stopover duration (sec.)", "Number of stopovers",
    ])
    # 42917.5 is the Excel serial for 2017-07-01 12:00
    ws.append([42917.5, 42917.520833, "ID001", 55, "0001 Alpha & First",
               "0002 Beta & Second", "365 Standard", 3000, 1800, 4000, 3900, 22, 23, 0, 0])
    wb.save(path)


def run_pipeline(con, data_raw, trips):
    colmap = etl.load_column_map(etl.MAPPINGS_DIR)
    etl.run_extract(con, trips, colmap)
    etl.run_clean(con)
    etl.run_conform(con)
    etl.run_model(con)


def test_unknown_header_fails_loudly():
    with pytest.raises(etl.UnknownColumns, match="Wingspan"):
        etl.plan_columns(["Departure", "Wingspan"], {"Departure": "departure"}, "x.csv")


def test_duplicate_unified_target_fails():
    colmap = {"Membership type": "membership", "Formula": "membership"}
    with pytest.raises(etl.UnknownColumns, match="same unified column"):
        etl.plan_columns(["Membership type", "Formula"], colmap, "x.csv")


def test_eras_conform_and_excel_serials_convert(env):
    con, data_raw, _ = env
    may = data_raw / "trips" / "2026-05.csv"
    may.write_text(MODERN_HEADER + "\n" + modern_row() + "\n", encoding="utf-8")
    xlsx = data_raw / "trips" / "2017.xlsx"
    write_2017_xlsx(xlsx)
    run_pipeline(con, data_raw, {"2026-05": (may, "csv"), "2017": (xlsx, "xlsx")})

    assert con.execute("SELECT count(*) FROM fact_trips").fetchone()[0] == 2
    serial = con.execute(
        "SELECT departure_ts, is_ebike, membership_raw FROM fact_trips WHERE trip_year = 2017"
    ).fetchone()
    assert str(serial[0]) == "2017-07-01 12:00:00"
    assert serial[1] is None  # e-bike column predates the flag: NULL, not False-by-guess
    assert serial[2] == "365 Standard"
    station = con.execute(
        "SELECT station_name, lat, nearest_transit_station FROM dim_station WHERE station_id = '0001'"
    ).fetchone()
    assert station[0] == "0001 Alpha & First"
    assert station[1] == pytest.approx(49.2828)
    assert station[2] == "Waterfront"


def test_spillover_duplicates_collapse_to_departure_month(env):
    con, data_raw, _ = env
    shared = modern_row()
    may = data_raw / "trips" / "2026-05.csv"
    may.write_text(MODERN_HEADER + "\n" + shared + "\n", encoding="utf-8")
    june = data_raw / "trips" / "2026-06.csv"
    june.write_text(
        MODERN_HEADER + "\n" + shared + "\n"
        + modern_row(dep="2026-06-02 09:00:00", ret="2026-06-02 09:20:00") + "\n",
        encoding="utf-8",
    )
    run_pipeline(con, data_raw, {"2026-05": (may, "csv"), "2026-06": (june, "csv")})

    assert con.execute("SELECT count(*) FROM fact_trips").fetchone()[0] == 2
    months = dict(con.execute("SELECT trip_month, count(*) FROM fact_trips GROUP BY 1").fetchall())
    assert months == {"2026-05": 1, "2026-06": 1}
    dupes = con.execute(
        "SELECT value FROM etl_metrics WHERE stage='clean' AND metric='rows_dropped_duplicates'"
    ).fetchone()[0]
    assert dupes == 1


def test_every_flag_rule_fires(env):
    con, data_raw, _ = env
    # distinct departure times: rows differing only in a measure like distance
    # would otherwise collapse under the dedupe key (a real property of the rule)
    rows = [
        modern_row(),  # clean
        modern_row(dep="2026-05-02 08:00:00", dur="0"),
        modern_row(dep="2026-05-03 08:00:00", dur="-5"),
        modern_row(dep="2026-05-04 08:00:00", dur="90000"),
        modern_row(dep="2026-05-05 08:00:00", dist="61000"),
        modern_row(dep="2026-05-06 08:00:00", ret_st="0001 Alpha & First", dur="60"),
        modern_row(dep="2026-05-07 08:00:00", dep_st="Temporary Event Station"),
        modern_row(dep="2026-05-08 08:00:00", temp="99"),
    ]
    may = data_raw / "trips" / "2026-05.csv"
    may.write_text(MODERN_HEADER + "\n" + "\n".join(rows) + "\n", encoding="utf-8")
    run_pipeline(con, data_raw, {"2026-05": (may, "csv")})

    flags = {
        f for (f,) in con.execute(
            "SELECT DISTINCT unnest(quality_flags) FROM fact_trips"
        ).fetchall()
    }
    assert flags == {
        "zero_duration", "negative_duration", "excessive_duration", "excessive_distance",
        "round_trip_false_start", "missing_station_id", "temp_out_of_range",
    }
    clean_count = con.execute(
        "SELECT count(*) FROM fact_trips WHERE NOT has_quality_issue"
    ).fetchone()[0]
    assert clean_count == 1


def test_prepare_csv_transcodes_invalid_utf8(tmp_path):
    good = tmp_path / "good.csv"
    good.write_bytes(b"a,b\n1,2\n")
    assert etl.prepare_csv(good) == good

    bad = tmp_path / "bad.csv"
    bad.write_bytes(b"a,b\n0099 ax\xb7\x9b\x13Square,2\n")
    sidecar = etl.prepare_csv(bad)
    assert sidecar != bad
    sidecar.read_bytes().decode("utf-8")  # must now be valid utf-8
