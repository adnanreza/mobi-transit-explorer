# Spec 046 — Cyclist crash context from ICBC, per station

## Context

Owner idea from the spec 045 batch: ICBC publishes reported crash data, so the site should be able to say something about the cycling environment around Mobi stations. This spec follows the house sequence: licence read first, then a feasibility pass against the actual data extract, then this document. Everything in Data feasibility below was verified by querying the real extract (1,453,136 rows profiled on 2026-07-29), not by reading documentation. Scope is Vancouver proper only, because Mobi operates only in the city proper.

The framing rule that shapes everything here: ICBC data measures car and bike conflict around a station, for all cyclists. It is not a Mobi crash rate, and the copy never presents it as one.

## Licence (read 2026-07-29)

"Open Data Licence for ICBC Information", v1.0 (updated July 22, 2020), at icbc.com/policies. Grant: worldwide, royalty-free, perpetual, non-exclusive; copy, modify, publish, adapt, distribute for any lawful purpose including commercial. Two required texts, verbatim:

1. Attribution: "Contains information licensed under ICBC's Open Data Licence."
2. Wherever analysis is drawn: "All analysis, inferences, opinions, and conclusions drawn in this [document] are those of the authors, and do not reflect the opinions, position or policies of ICBC."

Prohibited: personal information (the published extract is already de-identified upstream), ICBC logos and marks (the name is used descriptively only, same posture as the Mobi trademark note). Rights terminate on breach; users are bound by the licence version current at access date, so the manifest pins version and date.

## Data feasibility (verified 2026-07-29)

- **Source**: the "ICBC Reported Crashes" workbook on Tableau Public, linked as the official resource from the BC Data Catalogue record. Downloadable as a packaged workbook: `https://public.tableau.com/workbooks/ICBCReportedCrashes.twb` (24 MB .twbx zip containing `Data/ICBC Reported Crashes.twb Files/2021-2025 public data set.hyper`, 45 MB, read with the Tableau Hyper API).
- **Vintage is a rolling five-year window**: 2021 through 2025, complete years, refreshed annually around June. It can never join the full 2017-2026 trip archive; it is a trailing safety-context layer, and the copy derives its year range from the artifact.
- **Schema** (25 columns, unit-level rows): year, month name, day of week, 3-hour `TIME_CATEGORY` bands, `CRASH_SEVERITY` (CASUALTY CRASH or PROPERTY DAMAGE ONLY), `CYCLIST_FLAG` (values `Y`/`N`, not Yes/No; the probe initially matched zero rows on the wrong literal), pedestrian/motorcycle/heavy-vehicle flags, municipality, street and cross street, intersection vs mid-block, `LATITUDE`/`LONGITUDE` doubles, `TOTAL_CRASHES`, `TOTAL_VICTIMS`.
- **Vancouver proper, cyclist-involved, 2021-2025**: 4,455 crashes (837, 854, 878, 953, 933 by year, gently rising). 4,124 (92.6%) carry exact coordinates; the 331 without are reported in the accounting, never silently dropped. Severity skews serious: 2,992 casualty (67%) vs 1,463 property-damage-only.
- **Rejected source**: the "Lower Mainland Crashes" map workbook. Its `CrashType` has no cyclist breakout, counts are pre-aggregated with a visible suppression floor of 3, and locations are multi-way strings with HTML entities. The reported extract is strictly better; one source, one licence.
- **Known floor**: ICBC records crashes involving insured vehicles. Bike-only falls and no-contact incidents are invisible, so every count is a lower bound on cycling incidents and is described as car-bike conflict.

## Changes (to implement on owner go)

1. **Fetch** — pipeline/icbc_fetch.py: download the .twbx (skip when the manifest sha256 matches; the workbook changes roughly annually), unzip in a temp dir, read the hyper extract, filter to `UPPER(MUNICIPALITY_NAME) = 'VANCOUVER' AND CYCLIST_FLAG = 'Y'`, and write one small normalized CSV to data-raw/icbc/ (~4.5k rows: year, month, time band, severity, intersection flag, street, cross street, lat, lon). Manifest gains `reference.icbc_crashes` with workbook url, licence name + version + access date, twbx sha256, filtered-file sha256, vintage years, row count, and rows-with-coordinates count. `tableauhyperapi` joins pipeline/requirements.txt (pipeline-only; nothing ships to the browser).
2. **Join rule** — crashes within 250 m of each active station, haversine, the same math as `transitCoverage` in src/data/index.ts but computed pipeline-side. 250 m is block scale for a dock's walk-up area; verification includes a 100/250/500 sensitivity table in the spec's implementation notes so the choice is shown, not assumed.
3. **Normalization** — exposure-corrected alongside raw: each station's Mobi departures summed over the same 2021-2025 window from the already-published `tripsByYear`, giving crashes per 100k departures. Busy stations must not read as dangerous for being busy.
4. **Artifact** — new `crashcontext.json` (separate from stations.json to keep licence provenance clean): source, licence strings, vintage `{from: 2021, to: 2025}`, radiusM, city totals (crashes, casualty share, withCoordsPct), `byStation: {id: {crashes, casualty, per100kTrips}}`, and `nearNoStation` (crashes matching no station, so the accounting closes).
5. **UI** — one fact block in src/components/StationDetailPanel.tsx: "Cyclist-involved crashes reported within 250 m, 2021-2025: N (M casualty). Source: ICBC; all cyclists, not Mobi riders." Values and years derive from the artifact. **Passed on deliberately: a fourth map mode.** A crash map would visually reward exposure bias in exactly the way the normalization exists to prevent; if a map view is ever wanted, it must colour by per-trip rate, and that is a separate spec.
6. **Methodology** — new "Crash context" section: source and both verbatim licence texts, the insured-vehicle floor, the all-cyclists framing, the rolling window, the coordinate accounting, the join radius, and the exposure normalization. Footer gains the ICBC source link and the endorsement disclaimer sits with the existing independence paragraph.
7. **Copy rules** — plain sentences, no em dashes; every number in copy derives from the artifact; the two licence strings appear exactly as quoted above.

## Verification (when implemented)

- Pipeline: pytest units for the filter and the join (fixture stations at known distances straddling 250 m); committed-artifact invariants: vintage is exactly the five years in the manifest, byStation ids are a subset of active station ids, city totals reproduce the feasibility anchors (4,455 crashes, 92.6% with coordinates, 67% casualty) until the next vintage lands, per100kTrips finite and under a sanity ceiling, crashes with coordinates = matched + nearNoStation.
- `make check-artifacts` passes with the new artifact; payload budget holds (the artifact is a few KB).
- Frontend: contract test for the artifact; StationDetailPanel renders the block for a station with crashes and omits it cleanly for one with zero; 100+ Vitest, typecheck, build.
- Copy checks: no em dashes in added strings; both licence texts present verbatim; a grep proves "Mobi crash" appears nowhere (the framing rule made mechanical).
- Independent review before complete, per the 045 pattern: one agent on data integrity (join accounting), one on analysis honesty (normalization, framing), one on frontend and house rules.

## Lifecycle

Spec written pre-implementation with feasibility verified against the real extract. External review expected before go (the owner is running this spec past another model; findings land here as adjudicated notes, the 045 pattern). On go: branch `feat/046-icbc-crash-context`, implement in the order above, review, stop before complete for owner confirmation.
