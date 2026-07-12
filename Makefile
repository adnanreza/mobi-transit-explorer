# Mobi Transit Explorer — release / CI quality gates.
# These targets require the DuckDB warehouse and data-raw/ to be present.
# They are NOT run by `npm test` or `pytest` — invoke deliberately before
# committing regenerated artifacts or cutting a release.

PYTHON := .venv/bin/python

# Check that committed src/data/generated/*.json matches a fresh publish run.
# Exits 0 if everything is in sync; exits 1 and lists drifted files otherwise.
# Run this after any SQL change to confirm artifacts have been regenerated.
check-artifacts:
	$(PYTHON) pipeline/check_freshness.py

.PHONY: check-artifacts
