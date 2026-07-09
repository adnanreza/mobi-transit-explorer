-- Stage 20: type the landing zone and apply the only hard drops:
--   1. rows with both station names blank,
--   2. rows whose departure or return timestamp cannot be parsed,
--   3. exact duplicate trips (spillover: monthly files repeat trips from
--      neighbouring months; a trip's canonical month comes later, in conform).
-- Everything else survives to be *flagged*, not dropped, in stage 30.

-- Timestamps arrive in five shapes: Excel serial numbers (2017 workbook),
-- ISO 'YYYY-MM-DD HH:MM[:SS]', the 2020-era 'YYYY-MM-DD H:MM', April 2019's
-- US-style 'M/D/YY H:MM' (two-digit year, minute precision), and May 2025's
-- 'YYYY/MM/DD HH:MM:SS'. Each branch is guarded by shape so an ambiguous string
-- can never fall through to the wrong parser, and anything outside the
-- plausible service window is rejected as unparseable rather than kept as a
-- phantom year.
CREATE OR REPLACE MACRO parse_ts_raw(v) AS (
  CASE
    WHEN v IS NULL OR trim(v) = '' THEN NULL
    WHEN regexp_matches(trim(v), '^[0-9]+(\.[0-9]+)?$') THEN
      TIMESTAMP '1899-12-30 00:00:00'
        + to_seconds(CAST(round(CAST(trim(v) AS DOUBLE) * 86400) AS BIGINT))
    WHEN regexp_matches(trim(v), '^[0-9]{4}[-/]') THEN coalesce(
      TRY_CAST(trim(v) AS TIMESTAMP),  -- ISO, with or without seconds
      try_strptime(trim(v), '%Y-%m-%d %H:%M'),
      try_strptime(trim(v), '%Y/%m/%d %H:%M:%S'),  -- May 2025's slash-ISO
      try_strptime(trim(v), '%Y/%m/%d %H:%M'))
    WHEN regexp_matches(trim(v), '^[0-9]{1,2}/[0-9]{1,2}/[0-9]{4} ') THEN
      try_strptime(trim(v), '%m/%d/%Y %H:%M')
    WHEN regexp_matches(trim(v), '^[0-9]{1,2}/[0-9]{1,2}/[0-9]{2} ') THEN
      try_strptime(trim(v), '%m/%d/%y %H:%M')
    ELSE NULL
  END
);

CREATE OR REPLACE MACRO parse_ts(v) AS (
  CASE
    WHEN parse_ts_raw(v) BETWEEN TIMESTAMP '2016-01-01' AND TIMESTAMP '2035-01-01'
    THEN parse_ts_raw(v)
  END
);

CREATE OR REPLACE MACRO parse_bool(v) AS (
  CASE
    WHEN lower(trim(coalesce(v, ''))) IN ('true', 't', '1', 'yes', 'y') THEN TRUE
    WHEN lower(trim(coalesce(v, ''))) IN ('false', 'f', '0', 'no', 'n') THEN FALSE
    ELSE NULL
  END
);

CREATE OR REPLACE TABLE clean_trips AS
WITH typed AS (
  SELECT
    source_period,
    source_file,
    parse_ts(departure)                          AS departure_ts,
    parse_ts("return")                           AS return_ts,
    nullif(trim(bike), '')                       AS bike_id,
    parse_bool(electric_bike)                    AS is_ebike,
    nullif(trim(departure_station), '')          AS departure_station_name,
    nullif(trim(return_station), '')             AS return_station_name,
    nullif(trim(membership), '')                 AS membership_raw,
    TRY_CAST(TRY_CAST(distance_m AS DOUBLE) AS BIGINT)     AS distance_m,
    TRY_CAST(TRY_CAST(duration_s AS DOUBLE) AS BIGINT)     AS duration_s,
    TRY_CAST(TRY_CAST(stopover_s AS DOUBLE) AS BIGINT)     AS stopover_s,
    TRY_CAST(TRY_CAST(stopover_count AS DOUBLE) AS BIGINT) AS stopover_count,
    TRY_CAST(departure_temp AS DOUBLE)           AS departure_temp_c,
    TRY_CAST(return_temp AS DOUBLE)              AS return_temp_c
  FROM raw_trips
),
kept AS (
  SELECT * FROM typed
  WHERE (departure_station_name IS NOT NULL OR return_station_name IS NOT NULL)
    AND departure_ts IS NOT NULL
    AND return_ts IS NOT NULL
)
SELECT * EXCLUDE (dup_rank)
FROM (
  SELECT *,
    row_number() OVER (
      PARTITION BY departure_ts, return_ts, bike_id,
                   departure_station_name, return_station_name, duration_s
      ORDER BY source_period, source_file
    ) AS dup_rank
  FROM kept
)
WHERE dup_rank = 1;
