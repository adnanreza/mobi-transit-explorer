# Real Mobi Data Integration Plan

## Goal

Replace the MVP's sample data with processed data from public Mobi bike share monthly CSV exports. The app remains fully client-side — all processing happens at build time via scripts that emit static JSON bundles.

## CSV Source

Use the public Mobi monthly trip CSVs published at `https://data.vancouver.ca`. Start with the most recent 12 months of data.

- **Source URL:** `https://data.vancouver.ca/datacatalogue/mobiBikeShareTripData.htm`
- **Primary file:** `mobi_bikeshare_tripdata_<year><month>.csv` per month
- **Update cadence:** Monthly, typically mid-month for the prior month

## Raw Data Storage

- Store raw CSVs in `/data-raw/` at the project root.
- Add `/data-raw/` to `.gitignore` to avoid committing large files.
- Document the download date and source URL for each batch.

## Processing Pipeline

A build-time TypeScript script in `/scripts/process-mobi-data.ts` will:

1. Read raw CSV files from `/data-raw/`.
2. Clean and validate rows (see Cleaning below).
3. Match stations to coordinate records.
4. Calculate derived metrics.
5. Write JSON bundles to `/public/data/`.

### Output JSON Shape

`/public/data/station-metrics.json` — one record per station per month:

```typescript
type StationMetric = {
  stationId: string;
  stationName: string;
  lat: number;
  lng: number;
  month: string;
  totalTrips: number;
  tripsNearTransit: number;
  tripsNearTransitPercentage: number;
  classicTrips: number;
  ebikeTrips: number;
  ebikeShare: number;
  topDestinations: { stationId: string; trips: number }[];
};
```

`/public/data/station-pairs.json` — trip volume between station pairs:

```typescript
type StationPair = {
  originId: string;
  destinationId: string;
  totalTrips: number;
  commuteFraction: number;
};
```

`/public/data/opportunity-scores.json` — ranked opportunities computed from metrics:

```typescript
type OpportunityScore = {
  stationId: string;
  connectorScore: number;
  expansionScore: number;
  ebikeOpportunityScore: number;
  rank: number;
};
```

### Station Metrics to Calculate

| Metric | Derivation |
|---|---|
| **Total trips** | Count of all trips originating at the station |
| **Trips near transit** | Count of trips whose destination station is within the configured transit distance of a transit node |
| **E-bike share** | `ebikeTrips / totalTrips` |
| **Top destinations** | Group by destination station, sort desc, take top N |
| **Connector score** | Weighted composite (see below) |
| **Commute strength** | Fraction of trips during AM/PM peak hours (7-9 AM, 4-6 PM weekdays) |

### Transit Proximity Calculation

- Define a curated set of transit nodes (SkyTrain, Canada Line, SeaBus, major bus exchanges) with their lat/lng coordinates.
- Use a fixed radius (configurable: 150m, 300m, 500m) via the Haversine formula.
- A station or trip is "near transit" if its distance to any transit node falls within the radius.
- Store transit node coordinates in a separate JSON file in `/public/data/transit-nodes.json`.

### Connector Score Calculation

The connector score is a weighted composite of:

| Factor | Weight | Source |
|---|---|---|
| Transit proximity | 0.35 | Fraction of trips near transit |
| Trip volume | 0.25 | Total trips (normalized) |
| Commute pattern | 0.20 | Fraction of trips during peak hours |
| E-bike share | 0.10 | E-bike trip fraction |
| Station connectivity | 0.10 | Number of unique destinations served |

Each factor is normalized to a 0-100 scale before weighting.

### Cleaning Rules

- Drop rows with missing `start_station_id`, `end_station_id`, or `duration_seconds`.
- Drop rows with `duration_seconds < 60` (likely maintenance or dock check).
- Drop rows with `duration_seconds > 86400` (24+ hours — likely abandoned or unreported return).
- Exclude trips where `start_station_id === end_station_id` (round trips) unless explicitly analyzing station loops.
- Parse `start_time` and `end_time` as ISO strings; infer timezone from Vancouver.
- Assign season/month/label from `start_time`.

### Station Matching

- Mobi CSV station IDs may differ from the names or IDs the public station list uses.
- Maintain a manual mapping file (`/data-raw/station-mapping.json`) to reconcile CSV station IDs to canonical station names and coordinates.
- Verify match coverage; log unmatched stations as warnings.

## Limitations

- Public trip data is anonymized — cannot identify individual riders or link trips to user profiles.
- Times may be rounded or bucketed depending on the source export version.
- Exact route paths between stations are unknown; straight-line distance is a proxy.
- Rebalancing and maintenance trips should be excluded where the source allows detection.
- CSV schema changes between months require version-aware parsing.
- Transit proximity uses curated transit node coordinates, not the full TransLink GTFS dataset.

## Future Map Upgrade Path

The current MVP uses percentage-based positioning (x%, y%) for the CSS mock map. Transitioning to a real map library will require:

1. Replacing the CSS map component with Leaflet or MapLibre.
2. Switching from percentage coordinates to actual lat/lng in the data files.
3. Replacing the mock water/land CSS shapes with a real basemap tile layer.
4. Porting the station dot sizing and coloring logic to the new map API.
5. Adding transit node markers with real lat/lng.

The output JSON (`/public/data/station-metrics.json`) already includes `lat`/`lng` fields for each station, so data will be ready when the map component is upgraded.

## Next Steps

1. Implement `scripts/process-mobi-data.ts`.
2. Add the file parsing and cleaning logic.
3. Write the Haversine transit proximity function.
4. Implement the connector score formula.
5. Generate the three output JSON files.
6. Replace MVP data imports in `src/data/` with dynamic fetches from `/public/data/`.
7. Upgrade the map to use real coordinates.