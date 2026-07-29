# Spec 045 — Air quality: smoke days and ridership

## Context

Owner idea: Vancouver has official air quality data the way it has official weather data, so the site should be able to ask whether the rain city that rides anyway also rides through wildfire smoke. An independent model review of the first plan draft refuted three of its factual claims, so this spec was preceded by a feasibility pass (2026-07-29) whose results are recorded below. Everything in Data feasibility is verified against the actual files, not documentation.

Wildfire smoke overlaps the whole trip archive: August 2017, August 2018, September 2020, and the 2021-2023 seasons. The 2017 file already shows the signal (Clark Drive peaks at 66.8 ug/m3 hourly that August, several times a clean summer day).

## Data feasibility (verified 2026-07-29)

- **Source**: BC ENV "Air Quality and Climate Monitoring, Verified Hourly Data", Open Government Licence - British Columbia. Bulk annual per-parameter CSVs at `ftp://ftp.env.gov.bc.ca/pub/outgoing/AIR/AnnualSummary/{YEAR}/PM25.csv` (~100 MB per year, all stations). Endpoint confirmed reachable and scriptable; per-year directories exist 1980 through 2024.
- **Schema** (read from the 2024 and 2017 files): `DATE_PST, DATE, TIME, STATION_NAME, STATION_NAME_FULL, EMS_ID, NAPS_ID, RAW_VALUE, ROUNDED_VALUE, UNIT (ug/m3), INSTRUMENT, PARAMETER, OWNER, REGION`. Hourly rows in PST. A station metadata file (`bc_air_monitoring_stations.csv`) ships in each year directory.
- **Coverage boundary**: verified data runs through end 2024. Unverified current data lives at `.../Hourly_Raw_Air_Data/Year_to_Date/PM25.csv`, updated daily (observed timestamps one day old). The warehouse will flag verified vs unverified rows and the methodology discloses the split at 2025-01-01.
- **Stations, empirically**: seven Metro stations report complete hourly PM2.5 in both 2017 and 2024 (Burnaby Kensington Park, Burnaby South, North Vancouver Mahon Park, North Vancouver Second Narrows, Richmond South, Vancouver Clark Drive, Vancouver International Airport #2). **Vancouver Clark Drive (EMS E249482 area, 49.2603, -123.0778) is the only one inside Mobi's service area** and has full 2017 coverage. Kitsilano and Robson Square do not appear in the PM2.5 files at all, and the metadata's opened date for Clark Drive (2018) contradicts its actual 2017 data. Lesson recorded: station coverage is derived from the data files, never from the metadata sheet.
- **Siting caveat, handled by design**: Clark Drive sits beside a truck route, so its baseline overstates traffic pollution. Regional smoke spikes at every station at once; local traffic does not. The smoke-day flag therefore requires corroboration (below).

## Changes (to implement on owner go)

1. **Fetch** — pipeline/airquality_fetch.py mirroring weather_fetch.py: annual PM25.csv per year 2017-2024 plus the year-to-date file, filtered to the two stations of record, written to data-raw/airquality/. Manifest gains `reference.bc_env_airquality` shaped like `ec_weather` ({station, years: {YEAR: {file, usable_days, sha256, fetched_at}}}); inventory.py already handles non-file reference entries generically (spec 039).
2. **Daily aggregation** — two series per day from hourly rows: mean PM2.5 (model candidate) and 24-hour mean for the smoke flag. **Smoke day** = 24h mean over 25 ug/m3 at Vancouver Clark Drive AND over 25 at Burnaby Kensington Park (the corroborating regional station). The dual-station rule separates regional smoke from local traffic and is stated in the methodology.
3. **Warehouse** — daily PM2.5 joined to the day spine like temperature and precipitation, with a verified/unverified flag per row.
4. **Story chapter** — smoke days against non-smoke days in the same months, never against annual averages, because smoke season is peak riding season and a naive comparison would launder seasonality into an air quality claim. If September 2020 shows no drop, that is the finding and the chapter says so. Blue encoding decoded in the caption per the spec 042 rule; station and siting disclosed.
5. **Model feature, explicit gate** — train_model.py has a fixed FEATURES list, so the gate is a comparison run: fit once with FEATURES plus daily-mean PM2.5, and ship the expanded model only if holdout testMae is at or below the current 553 and testR2 at or above 0.753. Otherwise FEATURES stays unchanged and PM2.5 remains a warehouse and chapter fact only. Model card gains PM2.5 missing-day accounting like the weather disclosure.
6. **Copy** — plain sentences, no em dashes; the confound stated outright: PM2.5 peaks in wildfire season, which is also peak riding season, so the chapter compares within season and claims association, not cause.

## Verification (when implemented)

- Pipeline: pytest suite extended for the fetch and aggregation; `make check-artifacts` passes with the new artifact.
- Frontend: contract tests extended (PM2.5 series continuous, smoke-day count plausible, payload budget holds); Vitest, typecheck, build green.
- Sanity anchors: August 2017 and September 2020 must register as smoke days under the dual-station rule; if they do not, the threshold is wrong and the spec revisits it before anything ships.
- Chapter reviewed against the encoding-legibility rule; both themes at 375 and 1440.

## Lifecycle

This spec is written pre-implementation, like spec 038 was. Feasibility artifacts stayed in /tmp; nothing lands in data-raw until implementation. On owner go: branch `feat/045-air-quality` and implement in the order above. ICBC crash data remains parked as the spec 046 candidate, first action there being a read of the "Open Data Licence for ICBC Information".
