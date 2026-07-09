# Data Methodology

## Current Data Approach

The MVP now uses real public Mobi by Rogers system-data CSVs for April and May 2026. Raw CSV files are processed locally into small static TypeScript datasets that are committed with the app. The browser receives generated station metrics, opportunity rankings, and chart data; it does not parse raw CSVs at runtime.

## Source Files

- Source page: `https://www.mobibikes.ca/en/system-data`
- April 2026: `public-trips-3.0-2026-04.csv`
- May 2026: `public-trips-3.0-2026-05.csv`
- Data license: linked from the Mobi system-data page.

Raw source files belong in `data-raw/`, which is ignored by git. For this implementation, the processor was run against downloaded CSVs in `/tmp`.

## Processing

Run:

```bash
npm run data:process -- --april /path/to/public-trips-3.0-2026-04.csv --may /path/to/public-trips-3.0-2026-05.csv
```

The script reads the public CSV schema:

- `Departure`
- `Return`
- `Bike`
- `Electric bike`
- `Departure station`
- `Return station`
- `Formula`
- `Covered distance (m)`
- `Duration (sec.)`
- `Lock duration (sec.)`
- `Number of bike locks`
- temperature fields

It generates:

- `src/data/stations.ts`
- `src/data/opportunities.ts`
- `src/data/realMobi.ts`

Rows with blank departure or return station names are skipped because they cannot be mapped to station-level metrics.

## Derived Metrics

- Monthly trips: count of trips departing from a station.
- E-bike share: share of station departures where `Electric bike` is `True`.
- Top destinations: most common return stations for each departure station.
- Commute strength: share of departures during AM and PM commute windows.
- Hourly departures: departure counts by rounded public timestamp hour.
- Bike type split: classic versus e-bike trip counts.
- Opportunity ranking: generated from connector score, e-bike share, trip volume, and transit context.

## Transit Context

The public trip CSVs include station names but not station coordinates. The current implementation estimates nearby transit context from station names and known transit landmarks. That means real trip counts are used, while map placement and transit proximity remain derived front-end estimates until official station coordinates are added.

Connector score combines:

- transit proximity estimate
- trip volume
- commute pattern
- e-bike share
- station connectivity

## Source Limitations

The Mobi system-data page states that:

- departure and return times are rounded to the nearest hour
- accounts are anonymized
- operations trips for rebalancing and maintenance are removed
- stopovers represent cable-lock use away from a station

The app should not claim exact routes, exact rider behavior, or surveyed station-to-transit distances from these CSVs alone.

## Future Upgrade

The next real-data upgrade should add official station coordinates from a station feed or maintained reference, then replace generated map positions with geographic coordinates. A later version can expand processing to a rolling 12-month source window.
