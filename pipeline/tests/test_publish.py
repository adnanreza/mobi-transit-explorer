"""Publish-view tests: the exact defects an external review found — blank
memberships silently dropped, prefixless stations unresolved, negative
distances in totals, over-eager dedup — must stay fixed."""

import etl
from test_conform import MODERN_HEADER, env, modern_row, run_pipeline  # noqa: F401


def run_publish_views(con):
    con.execute((etl.SQL_DIR / "50_publish.sql").read_text(encoding="utf-8"))


def test_blank_membership_trips_are_counted(env):  # noqa: F811
    con, data_raw, _ = env
    rows = [
        modern_row(),
        modern_row(dep="2026-05-02 09:00:00", ret="2026-05-02 09:30:00", membership=""),
    ]
    may = data_raw / "trips" / "2026-05.csv"
    may.write_text(MODERN_HEADER + "\n" + "\n".join(rows) + "\n", encoding="utf-8")
    run_pipeline(con, data_raw, {"2026-05": (may, "csv")})
    run_publish_views(con)

    assert con.execute("SELECT count(*) FROM countable_trips").fetchone()[0] == 2
    groups = dict(
        con.execute(
            "SELECT membership_group, count(*) FROM countable_trips GROUP BY 1"
        ).fetchall()
    )
    assert groups.get("Unknown") == 1


def test_prefixless_station_names_resolve_via_crosswalk(env):  # noqa: F811
    con, data_raw, _ = env
    rows = [
        modern_row(),  # prefixed: teaches the crosswalk 0001/0002
        modern_row(
            dep="2026-05-03 10:00:00", ret="2026-05-03 10:30:00",
            dep_st="Alpha & First", ret_st="Beta & Second",  # mid-2025 style, no prefix
        ),
    ]
    may = data_raw / "trips" / "2026-05.csv"
    may.write_text(MODERN_HEADER + "\n" + "\n".join(rows) + "\n", encoding="utf-8")
    run_pipeline(con, data_raw, {"2026-05": (may, "csv")})

    resolved = con.execute(
        """SELECT departure_station_id, return_station_id FROM fact_trips
           WHERE departure_station_name = 'Alpha & First'"""
    ).fetchone()
    assert resolved == ("0001", "0002")
    flags = con.execute(
        """SELECT quality_flags FROM fact_trips
           WHERE departure_station_name = 'Alpha & First'"""
    ).fetchone()[0]
    assert "missing_station_id" not in flags


def test_negative_distances_flagged_and_excluded_from_totals(env):  # noqa: F811
    con, data_raw, _ = env
    rows = [
        modern_row(dist="2500"),
        modern_row(dep="2026-05-04 11:00:00", ret="2026-05-04 11:30:00", dist="-4294122"),
    ]
    may = data_raw / "trips" / "2026-05.csv"
    may.write_text(MODERN_HEADER + "\n" + "\n".join(rows) + "\n", encoding="utf-8")
    run_pipeline(con, data_raw, {"2026-05": (may, "csv")})
    run_publish_views(con)

    flagged = con.execute(
        "SELECT count(*) FROM fact_trips WHERE list_contains(quality_flags, 'negative_distance')"
    ).fetchone()[0]
    assert flagged == 1
    distance_km = con.execute("SELECT distance_km FROM v_yearly").fetchone()[0]
    assert distance_km == 3  # 2500 m rounds to 3 km; the wraparound is excluded


def test_same_file_duplicates_are_kept(env):  # noqa: F811
    con, data_raw, _ = env
    row = modern_row()
    may = data_raw / "trips" / "2026-05.csv"
    may.write_text(MODERN_HEADER + "\n" + row + "\n" + row + "\n", encoding="utf-8")
    run_pipeline(con, data_raw, {"2026-05": (may, "csv")})

    assert con.execute("SELECT count(*) FROM fact_trips").fetchone()[0] == 2
    dupes = con.execute(
        "SELECT value FROM etl_metrics WHERE metric = 'rows_dropped_duplicates'"
    ).fetchone()[0]
    assert dupes == 0


def test_flows_bucket_hours_and_reconcile(env):  # noqa: F811
    con, data_raw, _ = env
    rows = [
        # weekday (2026-05-01 is a Friday): departs 0001 at 10, returns 0002 at 10
        modern_row(),
        # weekend (2026-05-02 is a Saturday)
        modern_row(dep="2026-05-02 14:00:00", ret="2026-05-02 15:00:00"),
    ]
    may = data_raw / "trips" / "2026-05.csv"
    may.write_text(MODERN_HEADER + "\n" + "\n".join(rows) + "\n", encoding="utf-8")
    run_pipeline(con, data_raw, {"2026-05": (may, "csv")})
    run_publish_views(con)

    flows = {
        (r[0], r[1], r[2]): (r[3], r[4])
        for r in con.execute(
            "SELECT station_id, day_type, hour, departures, returns FROM v_station_flows"
        ).fetchall()
    }
    assert flows[("0001", "weekday", 10)] == (1, 0)
    assert flows[("0002", "weekday", 10)] == (0, 1)
    assert flows[("0001", "weekend", 14)] == (1, 0)
    assert flows[("0002", "weekend", 15)] == (0, 1)

    total_dep = con.execute("SELECT sum(departures) FROM v_station_flows").fetchone()[0]
    resolved = con.execute(
        "SELECT count(*) FROM countable_trips WHERE departure_station_id IS NOT NULL"
    ).fetchone()[0]
    assert total_dep == resolved

    day_counts = con.execute(
        "SELECT weekday_count, weekend_count FROM v_flow_day_counts"
    ).fetchone()
    assert day_counts == (1, 1)


def test_station_balance_and_network_rebalancing(env):  # noqa: F811
    con, data_raw, _ = env
    # One day: two bikes ride 0001 -> 0002 and never come back.
    rows = [
        modern_row(),
        modern_row(dep="2026-05-01 12:00:00", ret="2026-05-01 12:30:00"),
    ]
    may = data_raw / "trips" / "2026-05.csv"
    may.write_text(MODERN_HEADER + "\n" + "\n".join(rows) + "\n", encoding="utf-8")
    run_pipeline(con, data_raw, {"2026-05": (may, "csv")})
    run_publish_views(con)

    balance = {
        r[0]: (r[1], r[2])
        for r in con.execute(
            "SELECT station_id, avg_daily_net, avg_peak_swing FROM v_station_balance"
        ).fetchall()
    }
    assert balance["0001"] == (-2.0, 2.0)  # drained two bikes, swing 2
    assert balance["0002"] == (2.0, 2.0)   # gained two bikes
    network = con.execute("SELECT bikes_per_day FROM v_network_rebalancing").fetchone()[0]
    assert network == 2  # (|-2| + |2|) / 2


def test_monthly_view_reconciles_with_countable_trips(env):  # noqa: F811
    con, data_raw, _ = env
    rows = [
        modern_row(),
        modern_row(dep="2026-05-02 09:00:00", ret="2026-05-02 09:30:00", membership=""),
        modern_row(dep="2026-05-05 12:00:00", ret="2026-05-05 12:00:00",
                   ret_st="0001 Alpha & First", dur="60"),  # false start: excluded
    ]
    may = data_raw / "trips" / "2026-05.csv"
    may.write_text(MODERN_HEADER + "\n" + "\n".join(rows) + "\n", encoding="utf-8")
    run_pipeline(con, data_raw, {"2026-05": (may, "csv")})
    run_publish_views(con)

    countable = con.execute("SELECT count(*) FROM countable_trips").fetchone()[0]
    monthly_sum = con.execute("SELECT coalesce(sum(trips), 0) FROM v_monthly").fetchone()[0]
    assert countable == monthly_sum == 2
