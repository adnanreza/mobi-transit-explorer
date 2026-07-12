-- Stage 30: conform to the unified trip grain. Station IDs come from the
-- leading 4-digit prefix of station names ("0154 Kitsilano Beach Park" ->
-- "0154"); for the mid-2025 files where Mobi removed the prefix entirely,
-- a crosswalk resolves bare names ("Kitsilano Beach Park") to IDs using the
-- prefixed months (modal ID per name) plus the GBFS feed. A trip's canonical
-- month is its departure month. Suspect measurements are flagged, never
-- silently removed; the publish stage decides per-measure which flags
-- invalidate which aggregates.

CREATE OR REPLACE TABLE station_name_xwalk AS
WITH from_trips AS (
  SELECT
    trim(regexp_replace(name, '^\d{4} ', '')) AS station_name,
    regexp_extract(name, '^(\d{4}) ', 1)      AS station_id,
    count(*) AS observations
  FROM (
    SELECT departure_station_name AS name FROM clean_trips
    UNION ALL
    SELECT return_station_name FROM clean_trips
  )
  WHERE name IS NOT NULL AND regexp_matches(name, '^\d{4} ')
  GROUP BY 1, 2
),
modal AS (
  SELECT station_name, station_id
  FROM (
    SELECT *, row_number() OVER (
      PARTITION BY station_name ORDER BY observations DESC, station_id
    ) AS rn
    FROM from_trips
  )
  WHERE rn = 1
),
gbfs AS (
  SELECT trim(s.name) AS station_name, s.station_id
  FROM (
    SELECT unnest(data.stations) AS s
    FROM read_json_auto(getvariable('data_raw') || '/gbfs/station_information.json')
  )
)
SELECT station_name, station_id FROM modal
UNION ALL
SELECT g.station_name, g.station_id
FROM gbfs g
WHERE g.station_name NOT IN (SELECT station_name FROM modal);

CREATE OR REPLACE TABLE conformed_trips AS
WITH prefixed AS (
  SELECT
    c.*,
    nullif(regexp_extract(departure_station_name, '^(\d{4}) ', 1), '') AS dep_prefix,
    nullif(regexp_extract(return_station_name, '^(\d{4}) ', 1), '')    AS ret_prefix
  FROM clean_trips c
),
resolved AS (
  SELECT
    p.* EXCLUDE (dep_prefix, ret_prefix),
    coalesce(p.dep_prefix, dx.station_id) AS departure_station_id,
    coalesce(p.ret_prefix, rx.station_id) AS return_station_id
  FROM prefixed p
  LEFT JOIN station_name_xwalk dx
    ON p.dep_prefix IS NULL AND trim(p.departure_station_name) = dx.station_name
  LEFT JOIN station_name_xwalk rx
    ON p.ret_prefix IS NULL AND trim(p.return_station_name) = rx.station_name
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
    -- integer wraparound artifacts near -4,294,000 m in the source
    CASE WHEN distance_m < 0 THEN 'negative_distance' END,
    CASE WHEN departure_station_name = return_station_name
          AND duration_s < 120 THEN 'round_trip_false_start' END,
    CASE WHEN departure_station_id IS NULL OR return_station_id IS NULL
         THEN 'missing_station_id' END,
    CASE WHEN least(departure_temp_c, return_temp_c) < -30
           OR greatest(departure_temp_c, return_temp_c) > 45
         THEN 'temp_out_of_range' END,
    -- from mid-2025 the source writes 0 instead of null for missing
    -- temperatures (~850k trips); real both-ends-0.0 readings are a few
    -- hundred per year, acceptable collateral for excluding the sentinel
    CASE WHEN departure_temp_c = 0 AND return_temp_c = 0
         THEN 'temp_suspect_zero' END,
    -- Trips whose departure month is more than one calendar month away from
    -- their source file's period; the 2017 annual workbook is exempt (its
    -- source_period is '2017', not a month, so the check is skipped).
    -- A Sept-2025 file carrying rows dated 2018/2020/2024 is the archetype.
    CASE WHEN source_period <> '2017'
          AND abs(date_diff('month',
                make_date(CAST(left(source_period, 4) AS INTEGER),
                          CAST(right(source_period, 2) AS INTEGER), 1),
                date_trunc('month', departure_ts))) > 1
         THEN 'misdated_source' END
  ], x -> x IS NOT NULL) AS quality_flags
FROM resolved;