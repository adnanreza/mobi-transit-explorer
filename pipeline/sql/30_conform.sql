-- Stage 30: conform to the unified trip grain. Station IDs are the leading
-- 4-digit prefix of station names ("0154 Kitsilano Beach Park" -> "0154").
-- A trip's canonical month is its departure month. Suspect measurements are
-- flagged, never silently removed; the publish stage decides per-measure
-- which flags invalidate which aggregates.

CREATE OR REPLACE TABLE conformed_trips AS
SELECT
  *,
  regexp_extract(departure_station_name, '^(\d{4}) ', 1) AS departure_station_id_raw,
  regexp_extract(return_station_name, '^(\d{4}) ', 1)    AS return_station_id_raw
FROM clean_trips;

CREATE OR REPLACE TABLE conformed_trips AS
WITH ids AS (
  SELECT
    * EXCLUDE (departure_station_id_raw, return_station_id_raw),
    nullif(departure_station_id_raw, '') AS departure_station_id,
    nullif(return_station_id_raw, '')    AS return_station_id
  FROM conformed_trips
)
SELECT
  *,
  strftime(departure_ts, '%Y-%m') AS trip_month,
  CAST(year(departure_ts) AS INTEGER) AS trip_year,
  list_filter([
    CASE WHEN duration_s = 0 THEN 'zero_duration' END,
    CASE WHEN duration_s < 0 THEN 'negative_duration' END,
    CASE WHEN duration_s > 86400 THEN 'excessive_duration' END,
    CASE WHEN distance_m > 60000 THEN 'excessive_distance' END,
    CASE WHEN departure_station_name = return_station_name
          AND duration_s < 120 THEN 'round_trip_false_start' END,
    CASE WHEN departure_station_id IS NULL OR return_station_id IS NULL
         THEN 'missing_station_id' END,
    CASE WHEN least(departure_temp_c, return_temp_c) < -30
           OR greatest(departure_temp_c, return_temp_c) > 45
         THEN 'temp_out_of_range' END
  ], x -> x IS NOT NULL) AS quality_flags
FROM ids;
