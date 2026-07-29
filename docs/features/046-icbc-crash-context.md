# Spec 046 — Cyclist crash context from ICBC, per station

## Context

Owner idea from the spec 045 batch: ICBC publishes reported crash data, so the site should be able to say something about the cycling environment around Mobi stations. This spec follows the house sequence: licence read first, then a feasibility pass against the actual data extract, then this document. Every number below was verified by querying the real extract (1,453,136 rows profiled 2026-07-29), not read from documentation. Scope is the two municipalities Mobi serves: the City of Vancouver and the UBC campus, which ICBC publishes as a separate municipality. Revision 2 of this spec asserted "Mobi operates only in the city proper"; the station list refutes that, and the correction is recorded below.

The framing rule that shapes every decision here: this data describes reported car and bike conflict near a location, for all cyclists. It is not a Mobi crash rate, and it is not a per-station risk ranking. This is revision 3: revision 2 answered an external review of the plan, and revision 3 answers three independent reviews of the implementation. Both adjudications are recorded at the end.

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
- **Service area (Vancouver and UBC), cyclist-involved, 2021-2025**: **4,526 rows carrying 4,536 crashes**. Coordinates present on 4,199 crashes (92.6%); absent on 337, which are reported in the accounting and never silently dropped. Severity skews serious: 3,055 casualty crashes (67%) against 1,481 property-damage-only. Vancouver alone accounts for 4,455 and UBC for 81; the by-year shape rises gently (837, 854, 878, 953, 933 in Vancouver).
- **Rejected source**: the "Lower Mainland Crashes" map workbook. Its `CrashType` has no cyclist breakout, counts are pre-aggregated with a visible suppression floor of 3, and locations are multi-way strings carrying HTML entities. One source, one licence.
- **Known floor**: ICBC records crashes reported to it, which involve insured vehicles. Bike-only falls, dooring, and no-contact incidents are invisible, so every count is a lower bound and is described as car and bike conflict.

## Changes (as implemented)

**1. Fetch** — `pipeline/icbc_fetch.py`: download the .twbx (skip when the manifest sha256 matches; `--force` to refetch the mutable workbook), unzip to a temp dir, read the hyper extract, filter to `UPPER(MUNICIPALITY_NAME) IN ('VANCOUVER', 'UBC') AND CYCLIST_FLAG = 'Y'`, and write one normalized CSV to `data-raw/icbc/vancouver-ubc-cyclist-crashes.csv` (~4.5k rows: year, month, day_of_week, time_band, severity, intersection_flag, street, cross_street, lat, lon, **crash_weight** from `TOTAL_CRASHES`). Manifest gains `reference.icbc_crashes`: workbook url, licence name + version + url + access date, twbx sha256, filtered-file sha256, vintage years, row count, crash count, rows-with-coordinates. `tableauhyperapi` joins `pipeline/requirements.txt` (pipeline only; nothing ships to the browser).

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

## Verification (planned)

- **Pipeline units**: the `Y`/`N` filter and municipality match; the haversine join against fixture stations straddling 250 m; weighted counting (a fixture row with `TOTAL_CRASHES = 3` must contribute 3, not 1).
- **Committed-artifact invariants**: `crashesWithCoordinates = matchedUniqueCrashes + nearNoStationCrashes`; `stationAssignments >= matchedUniqueCrashes`; `byStation` ids are a subset of active station ids; vintage equals the manifest's five years; no rate field on any `byStation` entry; `mobiDeparturesSameWindow` is null or positive, never zero-with-a-quotient.
- **Feasibility anchors** (hold until the next vintage lands, then move with it): 4,445 rows / 4,455 crashes, 92.6% with coordinates, 67% casualty, and 720 station pairs under 500 m.
- **Schema assertions at fetch time**: expected columns present, `CYCLIST_FLAG` in {Y, N}, `CRASH_SEVERITY` in the two known values, coordinates inside the Vancouver bounding box already used by the station contract test, `TOTAL_CRASHES >= 1`. Anything unexpected stops the fetch, matching the era-map discipline.
- **Radius sensitivity**: 100 / 250 / 500 m table recorded in the implementation notes so the choice is shown, not assumed.
- `make check-artifacts` passes; payload budget holds (the artifact is a few KB against 400 KB raw).
- **Frontend**: contract test; panel renders the populated block and the zero state; the non-comparability sentence present; a grep proving "Mobi crash" and "crash rate" appear nowhere in copy; 100+ Vitest, typecheck, build.
- **Independent review before complete**, per the 045 pattern: data integrity (join and weight accounting), analysis honesty (framing, absent denominator), frontend and house rules.

## Review 1: external review of the plan, adjudicated (2026-07-29)

An external model reviewed revision 1. All four findings were verified against the data before acting, per the house corollary, and all four are adopted.

1. **Spatial double counting: confirmed and fixed.** Its 720-pairs-under-500 m figure reproduced exactly. Revision 1's invariant would not have closed. The four accounting fields above replace it.
2. **The per-100k metric: confirmed, and taken further than proposed.** The review suggested renaming the field, allowing null, and documenting the limitation. Verification supported the diagnosis and the Callister Park divide-by-zero, and the metric is **removed** rather than relabelled, because a published quotient invites the misreading no label reliably prevents. The denominator ships beside the count instead.
3. **UI contradicting the rationale: confirmed and fixed.** Zero state added, "M casualty crashes" wording corrected, non-comparability stated on screen rather than only in methodology.
4. **Provenance: confirmed, and one item was a latent error in my own numbers.** Its probe asking whether `TOTAL_CRASHES` is always 1 found that it is not, which makes every count a weighted sum and the weight a required column; revision 1 would have undercounted. Schema assertions, force-refresh, the reproducibility limit, README and LICENSE updates, and the U+2019 apostrophe are all adopted, the last verified by byte inspection.

Noted and not adopted as changes: the review could not reproduce the 4,455 anchor because the extract is not in the workspace, which is expected (it lives in gitignored `data-raw/`); the anchors are now written here with row and crash counts separated so any future reviewer can check them.

## Review 2: three independent reviews of the implementation, adjudicated (2026-07-29)

Three independent Opus reviewers, one per dimension, each told nothing about the others or about any suspicion of mine. All findings were verified before acting.

**The severity 1, and a better fix than the one proposed.** The honesty reviewer found that 17 docks rendered "No cyclist-involved crashes reported within 250 m" for territory the query never covered: UBC and the University Endowment Lands are not the City of Vancouver, so the municipality filter excluded them, and the crash distribution shows a hard cliff at Blanca Street (0, 0, 0, 1, 19, 36 crashes per 0.01 degree of longitude moving east). All 17 were structurally zero at any radius, with the nearest crash 675 m away. That is exactly the failure this spec claimed to design against, caused by the premise above.

Its proposed fix was to mark those docks unmeasured. Checking the source first found a better one: **ICBC publishes UBC as its own municipality**, with 81 cyclist-involved crashes over the window. The filter is now `MUNICIPALITY_NAME IN ('VANCOUVER', 'UBC')` and the bounding box extends west to -123.27. Result: 4,455 crashes became 4,536, structurally-zero docks fell from 19 to 9, and every remaining zero is a genuine measured zero with a crash 254 to 422 m away. The strongest check on this is the 500 m sensitivity row: at that radius **no** dock reads zero, which no station in unqueried territory could manage.

**The rate question, settled by removing an operand rather than a label.** Revision 2 published a citywide Mobi departure figure so the undivided denominator would be visible. Two reviewers independently showed that backfires: handing a reader both operands one sentence apart is arithmetically the same as publishing the rate, and the data reviewer proved the figure was also wrong, summing only currently-active stations and so understating departures by 3.3 to 3.7% against the site's own yearly totals. Both the field and the sentence are gone. The methodology now states that no rate is published, why, and that any ratio built from numbers elsewhere on the page would be wrong because the panel's trip figure is a trailing twelve months rather than these five years.

**Adopted from the reviews, with the evidence that earned it:**
- Radius sensitivity now ships in the artifact and renders in the methodology (100 m matches 1,102 crashes and leaves 53 docks with none; 250 m matches 2,725 and leaves 9; 500 m matches 3,118 and leaves none). Both reviewers noted the promised table was missing while the on-screen number moves 2.5x with the radius.
- An unknown `CRASH_SEVERITY` now raises instead of falling into the property-damage branch, where it would have shifted the split while every published invariant still closed.
- `publish.py` cross-checks the CSV against the manifest checksum, row count, crash count, and vintage years. A truncated CSV previously published silently with the manifest's vintage stamped on it.
- The vintage guard asserts the exact year set, not just its endpoints: a missing middle year passed before. A crash total swinging more than 25% against the last fetch now warns.
- Coordinates are validated independently per axis and re-validated on load, because a literal `0` is truthy as text and a 0/0 sentinel would have published as "located, far from every dock".
- Non-integral weights raise rather than truncating.
- The footer interpolates the licence attribution and catalogue URL from the artifact instead of duplicating them; a licence-version bump can no longer leave a legally required string stale.
- Tests were the weakest part of the first pass. The panel test asserted a prefix regex, so a wrong casualty number, a hardcoded year, or a dropped vintage all stayed green; it now asserts the whole sentence. Nothing asserted either required licence text reaches the DOM, so the entire methodology section could have been deleted with a green suite; both texts are now asserted in the rendered output. `byStation` was checked as a subset of station ids, so a regenerated artifact that dropped stations would silently blank their panel block; it is now set equality in both suites. The `crashesWithCoordinates + crashesWithoutCoordinates` invariant was missing.
- A dock absent from the artifact now renders "Crash data is not available for this dock" rather than nothing, so the third state is visible rather than collapsing into the zero state.
- The panel copy said "Reported by ICBC", inverting the direction, and omitted the most important caveat: crashes are reported **to** ICBC, which is why the count is a floor. It now says so where the number is read, along with the reason non-comparability holds (busier streets carry both more cyclists and more crashes) and the typical dock's count as an anchor.
- The block's label matches its sibling labels in the same card instead of borrowing the eyebrow treatment used for the station badge.
- The window length, "five years", is now derived from the vintage.
- The payload gate counted only what `publish.py` writes, missing `forecast.json` and `geo/land.json`, which understated the real bundle by 12.6 KB. It now counts every artifact that ships. The raw ceiling moved 400 KB to 420 KB **because the measurement got stricter, not because the feature outgrew it**: keeping 400 would have silently tightened the real limit by the newly counted bytes. Current payload is 387.7 KB raw and 83.9 KB gzip.
- README reproduces both required licence texts verbatim on their own lines; the earlier version altered their capitalisation and punctuation.

**Noted, not adopted:**
- One reviewer called publish's hard failure without the raw CSV a new single point of failure, "the only publish-time raw-file dependency". It is not: `v_ec_weather` and `v_pm25_daily` glob `data-raw` CSVs at publish time too, so the whole publish step has always required `data-raw`. The strict behaviour is consistent with the rest of the pipeline and is kept.
- The spec's own grep gate ("prove 'crash rate' appears nowhere") is unmeetable as written, since the copy legitimately contains "No crash rate per trip is published". The gate is reworded to forbid unnegated forms only.

**Rode along, disclosed rather than hidden:** the suite-wide vitest timeout raise in `vite.config.ts` (5s to 30s) and the LICENSE and README lines for spec 045's air quality source. Both reviewers flagged the timeout change as out of scope and its comment as citing a decision that did not exist. The decision is recorded here: the machine ran at a load average near 90 during this feature, several test files mount the whole generated-data layer or lazy-load MapLibre, and a cold worker exceeded 17 seconds, so the 5s default produced failures that moved between runs. A genuine hang still fails, just later. The per-test timeouts added in spec 045 were removed in favour of the one setting.

## Verification (final)

- Pipeline: 51 pytest, including new units for weighted counting, the one-to-many join, unknown severity, bad and half coordinates, and the sensitivity table. `make check-artifacts` PASS.
- Frontend: 107 Vitest, typecheck, production build. Payload 387.7 KB raw / 83.9 KB gzip against 420 / 120.
- Rendered checks against the production build: the panel sentence, floor caveat, median anchor and non-comparability line; the methodology scope, casualty definition, derived window length, sensitivity figures, both licence texts verbatim with U+2019, and the absence of any departure figure; zero state on a measured-zero dock; zero em dashes in rendered text; dark mode.
- Independently reproduced by review: every city total, all four accounting numbers, all per-station counts, the manifest checksum, and the 720-of-33,930 station-pair figure.

## Lifecycle

Revision 3: implemented on `feat/046-icbc-crash-context`, reviewed by three independent Opus agents (data integrity, analysis honesty, frontend and house rules), findings verified and adjudicated above. Not merged and not deployed, awaiting the owner's second external review and confirmation.
