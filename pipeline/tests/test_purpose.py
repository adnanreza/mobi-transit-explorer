"""E-bike comparison and trip-purpose heuristic tests on fixtures.

The fixture GBFS stations sit ~950 m apart (0001 at 49.2828,-123.1189 and
0002 at 49.2745,-123.1216), so detour factors are checkable by hand."""

import etl
from test_conform import MODERN_HEADER, env, modern_row, run_pipeline  # noqa: F401
from test_publish import run_publish_views


def test_detour_factor_from_real_coordinates(env):  # noqa: F811
    con, data_raw, _ = env
    # odometer 2500 m over ~950 m straight-line -> detour ~2.6
    may = data_raw / "trips" / "2026-05.csv"
    may.write_text(MODERN_HEADER + "\n" + modern_row(dist="2500") + "\n", encoding="utf-8")
    run_pipeline(con, data_raw, {"2026-05": (may, "csv")})
    run_publish_views(con)

    straight, detour = con.execute(
        "SELECT straight_m, detour_factor FROM v_trip_geometry"
    ).fetchone()
    assert 900 < straight < 1000
    assert 2.5 < detour < 2.8


def test_ebike_medians_split_by_flag(env):  # noqa: F811
    con, data_raw, _ = env
    rows = [
        modern_row(ebike="False", dist="2000", dur="720"),
        modern_row(dep="2026-05-02 09:00:00", ret="2026-05-02 09:10:00",
                   ebike="True", dist="3000", dur="600"),
    ]
    may = data_raw / "trips" / "2026-05.csv"
    may.write_text(MODERN_HEADER + "\n" + "\n".join(rows) + "\n", encoding="utf-8")
    run_pipeline(con, data_raw, {"2026-05": (may, "csv")})
    run_publish_views(con)

    medians = {
        r[0]: (r[1], r[2])
        for r in con.execute(
            "SELECT is_ebike, median_distance_km, median_speed_kmh FROM v_ebike_compare"
        ).fetchall()
    }
    assert medians[False] == (2.0, 10.0)  # 2 km in 12 min
    assert medians[True] == (3.0, 18.0)  # 3 km in 10 min


def test_leisure_heuristic_separates_obvious_cases(env):  # noqa: F811
    con, data_raw, _ = env
    rows = [
        # utility: weekday 08:00, A -> B, direct-ish, 8 minutes -> score 0
        modern_row(dep="2026-05-01 08:00:00", ret="2026-05-01 08:08:00",
                   dist="1100", dur="480"),
        # leisure: same-station round trip (+3), 50 min (+2) -> score >= 5
        modern_row(dep="2026-05-01 09:00:00", ret="2026-05-01 09:50:00",
                   ret_st="0001 Alpha & First", dist="9000", dur="3000"),
    ]
    may = data_raw / "trips" / "2026-05.csv"
    may.write_text(MODERN_HEADER + "\n" + "\n".join(rows) + "\n", encoding="utf-8")
    run_pipeline(con, data_raw, {"2026-05": (may, "csv")})
    run_publish_views(con)

    scores = dict(
        con.execute(
            "SELECT duration_s, leisure_score FROM v_trip_purpose"
        ).fetchall()
    )
    assert scores[480] < 4
    assert scores[3000] >= 4

    share = con.execute(
        "SELECT leisure_share_pct FROM v_station_leisure WHERE station_id = '0001'"
    ).fetchone()[0]
    assert share == 50.0
