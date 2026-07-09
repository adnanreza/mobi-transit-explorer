# Feature 015 - Real Mobi Data Integration Plan

Branch: `feature/real-data-integration-plan`

Note: Feature 017 implements the first real-data version using April and May 2026 Mobi by Rogers system-data CSVs.

## Goal

Document the next phase: replacing mock data with real processed Mobi public data.

## Scope

Do not implement full CSV ingestion yet. Create or update `docs/real-data-integration-plan.md`.

## Plan Should Include

- Which Mobi monthly CSVs to use first.
- How to store raw data locally.
- How to avoid committing large raw files if needed.
- Data processing script plan.
- Output JSON shape.
- Station metrics to calculate.
- Transit proximity calculation.
- Connector score calculation.
- Limitations.
- Future map upgrade path.

## Future Data Pipeline

Proposed structure:

```text
/scripts
  process-mobi-data.ts

/data-raw
  mobi-csv-files-not-committed

/public/data
  station-metrics.json
  station-pairs.json
  opportunity-scores.json
```

## Acceptance Criteria

- Real-data path is clear.
- No raw data implementation is required yet.
- The project has a credible next phase.

## Status

<span style="color:green">**COMPLETE**</span>
