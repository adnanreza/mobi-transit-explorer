import common
import inventory


def make_csv(tmp_path, period, content=None):
    if content is None:
        content = b"a,b\n" + f"{period},1\n".encode() * 50_000
    path = tmp_path / f"{period}.csv"
    path.write_bytes(content)
    return path, common.sha256_file(path)


def test_count_csv_rows(tmp_path):
    path = tmp_path / "x.csv"
    path.write_bytes(b"h1,h2\nr,1\nr,2\nr,3\n")
    assert inventory.count_csv_rows(path) == 3


def test_count_csv_rows_cr_only(tmp_path):
    path = tmp_path / "cr.csv"
    path.write_bytes(b"\xef\xbb\xbfh1,h2\rr,1\rr,2\r")
    assert inventory.count_csv_rows(path) == 2


def test_collect_passes_on_healthy_archive(tmp_path, monkeypatch):
    monkeypatch.setattr(common, "TRIPS_DIR", tmp_path)
    trips = {}
    for period in ("2017", "2018-01"):
        _, sha = make_csv(tmp_path, period)
        trips[period] = {"drive_id": "X", "format": "csv", "sha256": sha}
    records, issues = inventory.collect({"trips": trips, "reference": {}})
    assert issues == []
    assert [r["period"] for r in records] == ["2017", "2018-01"]
    assert records[0]["rows"] == 50_000


def test_collect_flags_gaps_small_files_and_mismatches(tmp_path, monkeypatch):
    monkeypatch.setattr(common, "TRIPS_DIR", tmp_path)
    _, sha_jan = make_csv(tmp_path, "2018-01")
    small_path, small_sha = make_csv(tmp_path, "2018-03", content=b"a,b\n1,2\n")
    trips = {
        "2018-01": {"drive_id": "X", "format": "csv", "sha256": sha_jan},
        "2018-03": {"drive_id": "Y", "format": "csv", "sha256": small_sha.replace(small_sha[0], "f", 1)},
        "2018-04": {"drive_id": "Z"},
    }
    _, issues = inventory.collect({"trips": trips, "reference": {}})
    text = "\n".join(issues)
    assert "missing period: 2017" in text
    assert "missing period: 2018-02" in text
    assert "2018-03: suspiciously small" in text
    assert "2018-03: checksum mismatch" in text
    assert "2018-04: never downloaded" in text


def test_collect_flags_duplicate_content(tmp_path, monkeypatch):
    monkeypatch.setattr(common, "TRIPS_DIR", tmp_path)
    body = b"a,b\n" + b"9,9\n" * 500 * 100
    _, sha1 = make_csv(tmp_path, "2017", content=body)
    _, sha2 = make_csv(tmp_path, "2018-01", content=body)
    trips = {
        "2017": {"drive_id": "X", "format": "csv", "sha256": sha1},
        "2018-01": {"drive_id": "Y", "format": "csv", "sha256": sha2},
    }
    _, issues = inventory.collect({"trips": trips, "reference": {}})
    assert any("duplicate content of 2017" in issue for issue in issues)
