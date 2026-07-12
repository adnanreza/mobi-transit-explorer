"""Quality-report generation against a fixture warehouse."""

import etl
import quality_report
from test_conform import MODERN_HEADER, env, modern_row, run_pipeline  # noqa: F401


def run_publish_views(con):
    con.execute((etl.SQL_DIR / "50_publish.sql").read_text(encoding="utf-8"))


def test_report_numbers_are_generated_and_unmapped_surfaces(env):  # noqa: F811
    con, data_raw, _ = env
    rows = [
        modern_row(),
        modern_row(dep="2026-05-02 11:00:00", ret="2026-05-02 11:40:00",
                   membership="Mystery Pass"),
        modern_row(dep="2026-05-03 12:00:00", ret="2026-05-03 12:10:00", dur="0"),
    ]
    may = data_raw / "trips" / "2026-05.csv"
    may.write_text(MODERN_HEADER + "\n" + "\n".join(rows) + "\n", encoding="utf-8")
    run_pipeline(con, data_raw, {"2026-05": (may, "csv")})

    report = quality_report.build(con)
    assert "| Landed (extract) | 3 |" in report
    assert "`zero_duration` | 1" in report
    assert "Unmapped labels needing a mapping decision:" in report
    assert "`Mystery Pass`" in report


def test_report_countable_matches_publish_view(env):  # noqa: F811
    """The quality-report's countable-trips count must equal the countable_trips
    view count from 50_publish.sql. If these diverge, the SQL exclusion logic in
    the report and the view have drifted — this test makes that impossible to
    reintroduce silently."""
    con, data_raw, _ = env
    rows = [
        modern_row(),                          # clean countable trip
        modern_row(dep="2026-05-02 08:00:00", dur="0"),       # zero_duration — excluded
        modern_row(dep="2026-05-03 09:00:00", dur="-10"),     # negative_duration — excluded
        modern_row(dep="2026-05-04 10:00:00", ret_st="0001 Alpha & First", dur="60"),  # false_start — excluded
        # misdated_source: source_period is 2026-05 but trip departs 2018-01-15
        # (more than 1 month away -> misdated_source flag, excluded from countable)
        modern_row(dep="2018-01-15 10:00:00", ret="2018-01-15 10:30:00"),
    ]
    may = data_raw / "trips" / "2026-05.csv"
    may.write_text(MODERN_HEADER + "\n" + "\n".join(rows) + "\n", encoding="utf-8")
    run_pipeline(con, data_raw, {"2026-05": (may, "csv")})
    run_publish_views(con)

    # Count from the publish view
    view_count = con.execute("SELECT count(*) FROM countable_trips").fetchone()[0]

    # Extract the number from the quality report text
    report = quality_report.build(con)
    import re
    match = re.search(r"\*\*Dashboard countable trips: ([\d,]+)\*\*", report)
    assert match, "Could not find 'Dashboard countable trips' count in report"
    report_count = int(match.group(1).replace(",", ""))

    assert report_count == view_count, (
        f"quality_report countable ({report_count}) != countable_trips view ({view_count}); "
        "the report's SQL exclusion list has drifted from 50_publish.sql"
    )


def test_rerunning_stages_does_not_duplicate_metrics(env):  # noqa: F811
    con, data_raw, _ = env
    may = data_raw / "trips" / "2026-05.csv"
    may.write_text(MODERN_HEADER + "\n" + modern_row() + "\n", encoding="utf-8")
    run_pipeline(con, data_raw, {"2026-05": (may, "csv")})
    import etl
    etl.run_clean(con)  # re-run a stage on its own
    counts = con.execute(
        """SELECT count(*) FROM etl_metrics
           WHERE stage = 'clean' AND metric = 'rows_kept'"""
    ).fetchone()[0]
    assert counts == 1
