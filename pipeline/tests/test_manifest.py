import common
import scrape_manifest


def test_parse_period_labels():
    assert common.parse_period_label("May 2026") == "2026-05"
    assert common.parse_period_label("  January   2018 ") == "2018-01"
    assert common.parse_period_label("ALL of 2017") == "2017"
    assert common.parse_period_label("all of 2017") == "2017"
    # the page's real typo for November 2021
    assert common.parse_period_label("Novemeber 2021") == "2021-11"
    assert common.parse_period_label("Data License Agreement") is None
    assert common.parse_period_label("Smarch 2020") is None
    assert common.parse_period_label("") is None


PAGE = """
<a href="https://drive.google.com/file/d/AAA111/view?usp=sharing"><span>May 2026</span></a>
<a href="https://drive.google.com/file/d/BBB222/view?usp=sharing">ALL of 2017</a>
<a href="https://drive.google.com/file/d/CCC333/view">License &amp; Terms</a>
<a href="https://example.com/other">Elsewhere</a>
"""


def test_extract_links_parses_labels_and_reports_unrecognized():
    periods, unrecognized = scrape_manifest.extract_links(PAGE)
    assert periods == {"2026-05": "AAA111", "2017": "BBB222"}
    assert len(unrecognized) == 1
    assert "License & Terms" in unrecognized[0]


def test_merge_adds_new_and_preserves_checksums():
    manifest = {"trips": {"2026-05": {"drive_id": "AAA111", "sha256": "abc", "bytes": 5}}}
    report = scrape_manifest.merge(manifest, {"2026-05": "AAA111", "2026-06": "DDD444"}, False)
    assert report["new"] == ["2026-06"]
    assert report["unchanged"] == ["2026-05"]
    assert manifest["trips"]["2026-05"]["sha256"] == "abc"
    assert manifest["trips"]["2026-06"] == {"drive_id": "DDD444"}


def test_merge_reports_changed_id_without_clobbering():
    manifest = {"trips": {"2026-05": {"drive_id": "OLD", "sha256": "abc"}}}
    report = scrape_manifest.merge(manifest, {"2026-05": "NEW"}, accept_changes=False)
    assert report["changed"] == ["2026-05: OLD -> NEW"]
    assert manifest["trips"]["2026-05"]["drive_id"] == "OLD"

    scrape_manifest.merge(manifest, {"2026-05": "NEW"}, accept_changes=True)
    assert manifest["trips"]["2026-05"]["drive_id"] == "NEW"


def test_expected_periods_spans_2017_through_latest():
    trips = {"2017": {}, "2018-01": {}, "2018-03": {}}
    assert common.expected_periods(trips) == ["2017", "2018-01", "2018-02", "2018-03"]


def test_expected_periods_crosses_year_boundary():
    trips = {"2017": {}, "2019-02": {}}
    periods = common.expected_periods(trips)
    assert periods[0] == "2017"
    assert periods[1] == "2018-01"
    assert periods[-1] == "2019-02"
    assert "2018-12" in periods and len(periods) == 1 + 12 + 2
