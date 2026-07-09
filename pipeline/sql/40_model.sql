-- Stage 40: Kimball-style star schema.
--   fact_trips       one row per trip, degenerate quality flags
--   dim_station      every station ever seen; GBFS coordinates; nearest
--                    rapid-transit station (haversine, CoV open data)
--   dim_date         calendar spanning the trip history
--   dim_membership   raw label -> reporting group (explicit mapping CSV)
-- Paths are injected by the runner: SET VARIABLE data_raw / mappings_dir.

CREATE OR REPLACE MACRO haversine_m(lat1, lon1, lat2, lon2) AS (
  2 * 6371000 * asin(sqrt(
    pow(sin(radians(lat2 - lat1) / 2), 2)
    + cos(radians(lat1)) * cos(radians(lat2))
      * pow(sin(radians(lon2 - lon1) / 2), 2)
  ))
);

-- dim_membership -------------------------------------------------------------
CREATE OR REPLACE TABLE dim_membership AS
WITH labels AS (
  SELECT DISTINCT membership_raw FROM conformed_trips WHERE membership_raw IS NOT NULL
),
mapping AS (
  SELECT * FROM read_csv(getvariable('mappings_dir') || '/membership_groups.csv',
                         header = true, all_varchar = true)
)
SELECT
  labels.membership_raw,
  mapping.membership_group  -- NULL means unmapped: surfaced in the quality report
FROM labels
LEFT JOIN mapping ON labels.membership_raw = mapping.membership_raw;

-- dim_date -------------------------------------------------------------------
CREATE OR REPLACE TABLE dim_date AS
SELECT
  d::DATE                                   AS date_key,
  CAST(year(d) AS INTEGER)                  AS year,
  CAST(month(d) AS INTEGER)                 AS month,
  strftime(d, '%Y-%m')                      AS year_month,
  CAST(isodow(d) AS INTEGER)                AS iso_weekday,
  isodow(d) >= 6                            AS is_weekend,
  CASE
    WHEN month(d) IN (12, 1, 2) THEN 'winter'
    WHEN month(d) IN (3, 4, 5)  THEN 'spring'
    WHEN month(d) IN (6, 7, 8)  THEN 'summer'
    ELSE 'fall'
  END                                       AS season
FROM unnest(generate_series(
  (SELECT min(departure_ts)::DATE FROM conformed_trips),
  (SELECT max(departure_ts)::DATE FROM conformed_trips),
  INTERVAL 1 DAY)) AS t(d);

-- dim_station ----------------------------------------------------------------
CREATE OR REPLACE TABLE dim_station AS
WITH usage AS (
  SELECT departure_station_id AS station_id, departure_station_name AS name,
         departure_ts AS ts
  FROM conformed_trips WHERE departure_station_id IS NOT NULL
  UNION ALL
  SELECT return_station_id, return_station_name, return_ts
  FROM conformed_trips WHERE return_station_id IS NOT NULL
),
trips_agg AS (
  SELECT
    station_id,
    arg_max(name, ts)                            AS station_name,
    list(DISTINCT name)                          AS historical_names,
    min(ts)::DATE                                AS first_seen,
    max(ts)::DATE                                AS last_seen,
    count(*)                                     AS lifetime_events
  FROM usage
  GROUP BY station_id
),
gbfs AS (
  SELECT
    s.station_id, s.lat, s.lon, s.capacity
  FROM (
    SELECT unnest(data.stations) AS s
    FROM read_json_auto(getvariable('data_raw') || '/gbfs/station_information.json')
  )
),
transit AS (
  SELECT
    f.properties.station                              AS transit_station,
    CAST(f.geometry.coordinates[2] AS DOUBLE)         AS lat,
    CAST(f.geometry.coordinates[1] AS DOUBLE)         AS lon
  FROM (
    SELECT unnest(features) AS f
    FROM read_json_auto(getvariable('data_raw') || '/geo/rapid-transit-stations.geojson')
  )
),
nearest AS (
  SELECT
    g.station_id,
    min_by(t.transit_station, haversine_m(g.lat, g.lon, t.lat, t.lon)) AS nearest_transit_station,
    CAST(round(min(haversine_m(g.lat, g.lon, t.lat, t.lon))) AS INTEGER) AS nearest_transit_m
  FROM gbfs g CROSS JOIN transit t
  GROUP BY g.station_id
)
SELECT
  a.station_id,
  a.station_name,
  a.historical_names,
  a.first_seen,
  a.last_seen,
  a.lifetime_events,
  a.last_seen >= (SELECT max(last_seen) - INTERVAL 6 MONTH FROM trips_agg) AS is_active,
  g.lat, g.lon, g.capacity,
  n.nearest_transit_station,
  n.nearest_transit_m
FROM trips_agg a
LEFT JOIN gbfs g USING (station_id)
LEFT JOIN nearest n USING (station_id);

-- fact_trips -----------------------------------------------------------------
CREATE OR REPLACE TABLE fact_trips AS
SELECT
  departure_ts::DATE       AS date_key,
  departure_ts, return_ts,
  trip_month, trip_year,
  bike_id, is_ebike,
  departure_station_id, return_station_id,
  departure_station_name, return_station_name,
  membership_raw,
  distance_m, duration_s, stopover_s, stopover_count,
  departure_temp_c, return_temp_c,
  quality_flags,
  len(quality_flags) > 0   AS has_quality_issue,
  source_period, source_file
FROM conformed_trips;
