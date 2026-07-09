"""Quality-report generation against a fixture warehouse."""

import quality_report
from test_conform import MODERN_HEADER, env, modern_row, run_pipeline  # noqa: F401


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
