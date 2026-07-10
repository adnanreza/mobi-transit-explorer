# Feature 028 - Data Integrity Fixes (external review response)

Branch: `feature/data-integrity-fixes`

## Goal

Fix the material transformation defects surfaced by an external model review
and verified against the warehouse, so the dashboard is authoritative again:

1. **Blank memberships dropped trips.** `countable_trips` inner-joined
   `dim_membership`, silently excluding 97,813 NULL-membership trips
   (91,136 in May 2025 alone — published 38,717 of 133,579 rows).
2. **Station IDs vanished mid-2025.** Mobi removed the 4-digit name prefix in
   May–June 2025 (99.98% of May departures unresolvable) with a tail through
   September; station artifacts silently omitted ~14% of the trailing year.
3. **Negative distance wraparounds.** 223 trips near −4,294,122 m (uint32/mm
   wrap) were unflagged and subtracted ~956,000 km from distance totals.
4. **Over-eager dedup.** Identical rows *within one file* can be distinct
   rides under hour-rounding; only cross-file spillover repeats are safe to
   collapse.
5. **License posture.** The Mobi DLA allows non-commercial published analyses
   but prohibits non-interface access and website data mining; the repo needs
   a data-license carve-out from MIT and an honest note on acquisition.
6. **Report/dashboard reconciliation** and **checksum immutability** gaps.
7. **Overclaims**: weekday/weekend totals compared across unequal day counts;
   weather ranked by raw trips instead of per-day rate; dock-capacity wording.

## Fixes

- `50_publish.sql`: LEFT JOIN membership; NULL → `Unknown`; only `Operations`
  excluded. Distance sums exclude the new `negative_distance` flag.
- `30_conform.sql`: `station_name_xwalk` built from prefixed names (modal ID)
  plus the GBFS feed; prefixless names resolve through it. New
  `negative_distance` flag.
- `20_clean.sql`: dedup keeps every row from the first file containing a key
  (same-file duplicates survive); the key gains `distance_m`/`is_ebike`.
- `publish.py`: fails if T12 station-ID coverage < 95%; meta gains
  `stationIdCoveragePctT12` and `unknownMembershipTrips`.
- `quality_report.py`: monthly table capped at the last source month;
  explicit "analytic bases" section reconciling fact rows vs countable trips.
- `download.py`: a re-download whose checksum differs from the manifest is a
  hard error unless `--accept-changes`.
- App: hourly chart becomes per-day averages; weather chapter ranks bands by
  trips per observed day; methodology adds the dock-capacity caveat and the
  2025 prefix/membership drift; README/pipeline docs get the license
  carve-out and manual-download guidance.
- pytest: null-membership retention, crosswalk resolution, negative-distance
  flag + exclusion, same-file-duplicates kept / cross-file dropped, and
  warehouse→publish reconciliation (sum of v_monthly == countable count).

## Verification

Full pipeline re-run (clean → model → publish → quality report), pytest +
Vitest + typecheck + build, browser spot-check that 2025 no longer collapses,
lifecycle COMPLETE + deploy.
