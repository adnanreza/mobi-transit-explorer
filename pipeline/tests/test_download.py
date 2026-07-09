import common
import download


def test_download_urls():
    assert (
        common.drive_download_url("XYZ")
        == "https://drive.usercontent.google.com/download?id=XYZ&export=download&confirm=t"
    )
    assert (
        common.sheets_export_url("XYZ")
        == "https://docs.google.com/spreadsheets/d/XYZ/export?format=csv"
    )


def test_detect_format():
    assert common.detect_format(b"PK\x03\x04rest-of-zip") == "xlsx"
    assert common.detect_format(b"Departure,Return,Bike\n2026-05-01,...") == "csv"
    assert common.detect_format(b"<!DOCTYPE html><html>...") == "html"
    assert common.detect_format(b"\n  <html lang='en'>") == "html"
    assert common.detect_format(b"\x89PNG\r\n") == "unknown"
    assert common.detect_format(b"just words without structure") == "unknown"
    # 2020-era exports: UTF-8 BOM + bare-\r line endings
    assert common.detect_format(b"\xef\xbb\xbfDeparture,Return\r2020-02-01,x\r") == "csv"


def test_needs_download_checksum_logic(tmp_path, monkeypatch):
    monkeypatch.setattr(common, "TRIPS_DIR", tmp_path)
    path = tmp_path / "2026-05.csv"
    path.write_bytes(b"a,b\n1,2\n")
    sha = common.sha256_file(path)

    current = {"period": "2026-05", "drive_id": "X", "format": "csv", "sha256": sha}
    assert download.needs_download(current, force=False) is False
    assert download.needs_download(current, force=True) is True

    stale = {**current, "sha256": "0" * 64}
    assert download.needs_download(stale, force=False) is True

    never_fetched = {"period": "2026-04", "drive_id": "Y"}
    assert download.needs_download(never_fetched, force=False) is True

    missing_file = {**current, "period": "2026-03"}
    assert download.needs_download(missing_file, force=False) is True
