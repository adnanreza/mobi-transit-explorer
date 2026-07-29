# Spec 046 — Cyclist crash context from ICBC, per station

## Context

Owner idea from the spec 045 batch: ICBC publishes reported crash data, so the site should be able to say something about the cycling environment around Mobi stations. This spec follows the house sequence: licence read first, then a feasibility pass against the actual data extract, then this document. Every number below was verified by querying the real extract (1,453,136 rows profiled 2026-07-29), not read from documentation. Scope is Vancouver proper, because Mobi operates only in the city proper.

The framing rule that shapes every decision here: this data describes reported car and bike conflict near a location, for all cyclists. It is not a Mobi crash rate, and it is not a per-station risk ranking. Revision 2 of this spec follows an external review whose four findings were verified and adopted; the adjudication is recorded at the end.

## Licence (read 2026-07-29, verified character by character)

"Open Data Licence for ICBC Information", v1.0 (updated 2020-07-22), at `https://www.icbc.com/policies/open-data-licence` (the catalogue's `/policies/Pages/open-data-licence.aspx` link redirects here). Grant: worldwide, royalty-free, perpetual, non-exclusive; copy, modify, publish, adapt, distribute for any lawful purpose including commercial. Prohibited: personal information, information not accessible under FIPPA, third-party rights ICBC cannot license, and ICBC names, crests, logos and official marks. Rights terminate on breach. Users are bound by the version current at access date, so the manifest pins version and access date.

Two texts are required, and both must be reproduced exactly. The apostrophe in the first is **U+2019**, not an ASCII quote (confirmed by byte inspection of the licence page):

1. `Contains information licensed under ICBC’s Open Data Licence.`
2. `All analysis, inferences, opinions, and conclusions drawn in this analysis are those of the authors, and do not reflect the opinions, position or policies of ICBC.`

The second is published with a fill-in blank (`in this [_________________]`). This project resolves the blank to **"analysis"** deliberately; the resolution is recorded here so it is a documented choice rather than an edit.

## Data feasibility (verified 2026-07-29)

- **Source**: the "ICBC Reported Crashes" workbook on Tableau Public, the resource linked from the BC Data Catalogue record `icbc-reported-crashes`. Fetched as a packaged workbook from `https://public.tableau.com/workbooks/ICBCReportedCrashes.twb` (24 MB .twbx zip containing `Data/ICBC Reported Crashes.twb Files/2021-2025 public data set.hyper`, 45 MB, read with the Tableau Hyper API).
- **Vintage is a rolling five-year window**, 2021 through 2025 complete years, refreshed annually around June. It cannot join the full 2017-2026 trip archive; it is a trailing context layer whose years derive from the artifact. ICBC also revises counts as late reports and corrections arrive, so a given year's number is not frozen.
- **Schema** (25 columns): `DATE_OF_LOSS_YEAR`, `MONTH_OF_YEAR` (month name), `DAY_OF_WEEK`, `TIME_CATEGORY` (eight 3-hour bands), `CRASH_SEVERITY` (`CASUALTY CRASH` | `PROPERTY DAMAGE ONLY`), `CYCLIST_FLAG` (**`Y` / `N`**, not Yes/No; a first probe matched zero rows on the wrong literal), pedestrian/motorcycle/heavy-vehicle/animal/parked flags, `MUNICIPALITY_NAME` (upper case: `VANCOUVER`, distinct from `NORTH VANCOUVER` and `WEST VANCOUVER`), `STREET_FULL_NAME`, `CROSS_STREET_FULL_NAME` (null on mid-block rows), `INTERSECTION_CRASH`, `MID_BLOCK_CRASH`, `LATITUDE`/`LONGITUDE` doubles, `TOTAL_CRASHES`, `TOTAL_VICTIMS`.
- **Rows are weighted, not unit records.** `TOTAL_CRASHES` is 1 on 1,441,897 rows but runs 2 to 8 on 11,239 others (province-wide: 1,453,136 rows carrying 1,465,435 crashes). Every count in this spec and in the artifact is therefore a **sum of `TOTAL_CRASHES`**, with row counts reported separately. This was the external review's sharpest probe and it changed the accounting design.
- **Vancouver proper, cyclist-involved, 2021-2025**: **4,445 rows carrying 4,455 crashes** (837, 854, 878, 953, 933 by year, gently rising). Coordinates present on 4,115 rows / 4,124 crashes (92.6%); absent on 330 rows / 331 crashes, which are reported in the accounting and never silently dropped. Severity skews serious: 2,992 casualty crashes (67%) against 1,463 property-damage-only.
- **Rejected source**: the "Lower Mainland Crashes" map workbook. Its `CrashType` has no cyclist breakout, counts are pre-aggregated with a visible suppression floor of 3, and locations are multi-way strings carrying HTML entities. One source, one licence.
- **Known floor**: ICBC records crashes reported to it, which involve insured vehicles. Bike-only falls, dooring, and no-contact incidents are invisible, so every count is a lower bound and is described as car and bike conflict.

## Changes (to implement on owner go)

**1. Fetch** — `pipeline/icbc_fetch.py`: download the .twbx (skip when the manifest sha256 matches; `--force` to refetch the mutable workbook), unzip to a temp dir, read the hyper extract, filter to `UPPER(MUNICIPALITY_NAME) = 'VANCOUVER' AND CYCLIST_FLAG = 'Y'`, and write one normalized CSV to `data-raw/icbc/` (~4.4k rows: year, month, day_of_week, time_band, severity, intersection_flag, street, cross_street, lat, lon, **crash_weight** from `TOTAL_CRASHES`). Manifest gains `reference.icbc_crashes`: workbook url, licence name + version + url + access date, twbx sha256, filtered-file sha256, vintage years, row count, crash count, rows-with-coordinates. `tableauhyperapi` joins `pipeline/requirements.txt` (pipeline only; nothing ships to the browser).

Reproducibility limit, stated plainly: the upstream workbook is mutable and the window rolls, so a superseded vintage cannot be refetched. The committed artifact plus the manifest checksums are the record of what was used. The licence permits redistribution, so archiving a filtered vintage is possible if that ever matters; `data-raw/` stays gitignored for now, consistent with every other source here.

**2. Join, one to many, with honest accounting** — crashes within 250 m of each active station by haversine (the same math as `transitCoverage` in `src/data/index.ts`, computed pipeline-side). Catchments overlap heavily: **720 of 33,930 station pairs sit under 500 m apart** (verified), so a single crash is frequently within 250 m of several stations. The join stays one-to-many because that is the honest description of a shared street environment, and the accounting is explicit rather than implied:

- `crashesWithCoordinates = matchedUniqueCrashes + nearNoStationCrashes` (the invariant that must close)
- `stationAssignments = sum(byStation[].crashes)`, which **exceeds** `matchedUniqueCrashes` by design
- `crashesMatchingMultipleStations` published so the overlap is visible, not inferred

**3. No per-trip rate. This is the product decision the review asked for.** Dividing all-cyclist crashes by Mobi departures does not correct exposure bias; it manufactures an ecological fallacy, because the numerator counts a population the denominator does not measure. A reader would inevitably read the quotient as per-ride risk, which the data cannot support. Two further defects confirm it: current station coordinates would be applied to crashes predating a dock's existence, and **Callister Park - Fan Fest** (opened 2026) has zero 2021-2025 departures, the only such active station, so the quotient is undefined there.

The insight that resolves it: reported crashes near a corner are a property of the **location**, over a stated window and radius. Exposure bias only enters when that count is read as risk per ride, which is a framing problem, not an arithmetic one. So the artifact publishes `mobiDeparturesSameWindow` beside `crashes` as separate context, never their ratio, and the methodology explains why no rate is published. The contract test asserts no rate field exists, which makes the decision structural instead of a matter of care.

**4. Artifact** — new `crashcontext.json`, separate from `stations.json` so licence provenance stays clean: `source`, `licence` (name, version, url, accessedAt, attribution, disclaimer), `vintage` (from, to, revisable note), `radiusM`, `city` (rows, crashes, casualtyCrashes, propertyDamageOnlyCrashes, crashesWithCoordinates, crashesWithoutCoordinates, withCoordinatesPct), `accounting` (the four fields above), and `byStation` keyed by station id with `{crashes, casualtyCrashes, mobiDeparturesSameWindow}` where departures may be **null** for a station that did not operate in the window.

**5. UI** — one fact block in `src/components/StationDetailPanel.tsx`, for every station including zeros:

- with crashes: "Cyclist-involved crashes reported within 250 m, 2021 to 2025: N (M casualty crashes)."
- with none: "No cyclist-involved crashes reported within 250 m, 2021 to 2025." A zero state, because omitting the block would make "none reported" indistinguishable from "not measured".
- one line under both: "Reported by ICBC for all cyclists, not Mobi riders. Counts describe the streets around a dock and are not comparable between stations."

All values and years derive from the artifact. **Passed on deliberately: a crash map mode and any ranked list.** Either would invite the station-to-station comparison the framing forbids; if a map view is ever wanted it needs a defensible denominator, which this data does not provide, so it would be a different spec with a different source.

**6. Methodology and provenance** — new "Crash context" section carrying both licence texts verbatim, the insured-vehicle floor, the all-cyclist framing, the rolling and revisable window, the coordinate accounting, the 250 m radius with its sensitivity table, the overlap accounting, and why no per-trip rate is published. Footer gains the ICBC source link, and the endorsement disclaimer sits with the existing independence paragraph. `LICENSE` gains an ICBC clause beside the Mobi and ECCC ones; `README.md` gains the source in its data notes and licensing section. Copy rules as house: plain sentences, no em dashes, every number derived.

## Verification (when implemented)

- **Pipeline units**: the `Y`/`N` filter and municipality match; the haversine join against fixture stations straddling 250 m; weighted counting (a fixture row with `TOTAL_CRASHES = 3` must contribute 3, not 1).
- **Committed-artifact invariants**: `crashesWithCoordinates = matchedUniqueCrashes + nearNoStationCrashes`; `stationAssignments >= matchedUniqueCrashes`; `byStation` ids are a subset of active station ids; vintage equals the manifest's five years; no rate field on any `byStation` entry; `mobiDeparturesSameWindow` is null or positive, never zero-with-a-quotient.
- **Feasibility anchors** (hold until the next vintage lands, then move with it): 4,445 rows / 4,455 crashes, 92.6% with coordinates, 67% casualty, and 720 station pairs under 500 m.
- **Schema assertions at fetch time**: expected columns present, `CYCLIST_FLAG` in {Y, N}, `CRASH_SEVERITY` in the two known values, coordinates inside the Vancouver bounding box already used by the station contract test, `TOTAL_CRASHES >= 1`. Anything unexpected stops the fetch, matching the era-map discipline.
- **Radius sensitivity**: 100 / 250 / 500 m table recorded in the implementation notes so the choice is shown, not assumed.
- `make check-artifacts` passes; payload budget holds (the artifact is a few KB against 400 KB raw).
- **Frontend**: contract test; panel renders the populated block and the zero state; the non-comparability sentence present; a grep proving "Mobi crash" and "crash rate" appear nowhere in copy; 100+ Vitest, typecheck, build.
- **Independent review before complete**, per the 045 pattern: data integrity (join and weight accounting), analysis honesty (framing, absent denominator), frontend and house rules.

## External review, adjudicated (2026-07-29)

An external model reviewed revision 1. All four findings were verified against the data before acting, per the house corollary, and all four are adopted.

1. **Spatial double counting: confirmed and fixed.** Its 720-pairs-under-500 m figure reproduced exactly. Revision 1's invariant would not have closed. The four accounting fields above replace it.
2. **The per-100k metric: confirmed, and taken further than proposed.** The review suggested renaming the field, allowing null, and documenting the limitation. Verification supported the diagnosis and the Callister Park divide-by-zero, and the metric is **removed** rather than relabelled, because a published quotient invites the misreading no label reliably prevents. The denominator ships beside the count instead.
3. **UI contradicting the rationale: confirmed and fixed.** Zero state added, "M casualty crashes" wording corrected, non-comparability stated on screen rather than only in methodology.
4. **Provenance: confirmed, and one item was a latent error in my own numbers.** Its probe asking whether `TOTAL_CRASHES` is always 1 found that it is not, which makes every count a weighted sum and the weight a required column; revision 1 would have undercounted. Schema assertions, force-refresh, the reproducibility limit, README and LICENSE updates, and the U+2019 apostrophe are all adopted, the last verified by byte inspection.

Noted and not adopted as changes: the review could not reproduce the 4,455 anchor because the extract is not in the workspace, which is expected (it lives in gitignored `data-raw/`); the anchors are now written here with row and crash counts separated so any future reviewer can check them.

## Lifecycle

Revision 2, pre-implementation, feasibility verified against the real extract and the external review adjudicated. On owner go: branch `feat/046-icbc-crash-context`, implement in the order above, independent review, then stop before complete for owner confirmation.
