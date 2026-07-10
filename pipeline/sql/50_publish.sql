-- Stage 50: publish views. Each v_* view backs one JSON artifact exported by
-- publish.py. Millions of rows in, well under a megabyte out.
--
-- Analytic basis ("countable" trips):
--   * membership group 'Operations' excluded (staff/maintenance riding)
--   * round_trip_false_start, zero_duration, negative_duration excluded from
--     ridership counts (aborted unlocks are events, not trips)
--   * trips after the last complete source month excluded (spillover tail)
-- Duration/distance measures additionally exclude their own invalidating flags.

CREATE OR REPLACE VIEW v_window AS
SELECT
  '2017-01' AS first_month,
  (SELECT max(source_period) FROM fact_trips WHERE source_period <> '2017') AS last_month;

CREATE OR REPLACE VIEW countable_trips AS
SELECT f.*, m.membership_group
FROM fact_trips f
JOIN dim_membership m USING (membership_raw)
WHERE m.membership_group <> 'Operations'
  AND f.trip_month BETWEEN (SELECT first_month FROM v_window)
                       AND (SELECT last_month FROM v_window)
  AND NOT list_has_any(f.quality_flags,
        ['round_trip_false_start', 'zero_duration', 'negative_duration']);

-- Trailing 12 complete months, the basis for current station profiles.
CREATE OR REPLACE VIEW v_t12_months AS
SELECT DISTINCT trip_month
FROM countable_trips
ORDER BY trip_month DESC
LIMIT 12;

CREATE OR REPLACE VIEW v_yearly AS
SELECT
  trip_year AS year,
  count(*) AS trips,
  CAST(round(sum(CASE WHEN NOT list_contains(quality_flags, 'excessive_distance')
                      THEN coalesce(distance_m, 0) END) / 1e3) AS BIGINT) AS distance_km,
  CAST(round(median(CASE WHEN NOT list_contains(quality_flags, 'excessive_duration')
                         THEN duration_s END) / 60.0, 1) AS DOUBLE) AS median_duration_min,
  CASE WHEN count(is_ebike) > 0
       THEN round(100.0 * sum(CASE WHEN is_ebike THEN 1 ELSE 0 END) / count(is_ebike), 1)
  END AS ebike_share_pct,  -- NULL before the Electric bike column exists
  count(DISTINCT departure_station_id) AS active_stations,
  round(avg(CASE WHEN NOT list_has_any(quality_flags, ['temp_out_of_range', 'temp_suspect_zero'])
                 THEN departure_temp_c END), 1) AS avg_departure_temp_c
FROM countable_trips
GROUP BY 1 ORDER BY 1;

CREATE OR REPLACE VIEW v_yearly_membership AS
SELECT trip_year AS year, membership_group, count(*) AS trips
FROM countable_trips
GROUP BY 1, 2 ORDER BY 1, 3 DESC;

CREATE OR REPLACE VIEW v_monthly AS
SELECT
  trip_month AS month,
  count(*) AS trips,
  sum(CASE WHEN is_ebike THEN 1 ELSE 0 END) AS ebike_trips,
  count(is_ebike) AS trips_with_ebike_flag
FROM countable_trips
GROUP BY 1 ORDER BY 1;

CREATE OR REPLACE VIEW v_hourly AS
SELECT
  trip_year AS year,
  CASE WHEN d.is_weekend THEN 'weekend' ELSE 'weekday' END AS day_type,
  CAST(hour(departure_ts) AS INTEGER) AS hour,
  count(*) AS trips
FROM countable_trips c
JOIN dim_date d ON c.date_key = d.date_key
GROUP BY 1, 2, 3 ORDER BY 1, 2, 3;

CREATE OR REPLACE VIEW v_weather AS
SELECT
  CAST(floor(departure_temp_c / 2) * 2 AS INTEGER) AS temp_band_c,
  count(*) AS trips,
  count(DISTINCT date_key) AS days_observed
FROM countable_trips
WHERE departure_temp_c IS NOT NULL
  AND NOT list_has_any(quality_flags, ['temp_out_of_range', 'temp_suspect_zero'])
GROUP BY 1 HAVING count(*) >= 100 ORDER BY 1;

CREATE OR REPLACE VIEW v_station_year AS
SELECT departure_station_id AS station_id, trip_year AS year, count(*) AS trips
FROM countable_trips
WHERE departure_station_id IS NOT NULL
GROUP BY 1, 2;

-- Station profile over the trailing 12 complete months.
CREATE OR REPLACE VIEW v_station_t12 AS
WITH t12 AS (
  SELECT c.*, d.is_weekend
  FROM countable_trips c
  JOIN dim_date d ON c.date_key = d.date_key
  WHERE c.trip_month IN (SELECT trip_month FROM v_t12_months)
    AND c.departure_station_id IS NOT NULL
),
dest_ranked AS (
  SELECT
    departure_station_id AS station_id,
    return_station_id,
    count(*) AS trips,
    row_number() OVER (PARTITION BY departure_station_id ORDER BY count(*) DESC) AS rnk
  FROM t12
  WHERE return_station_id IS NOT NULL
  GROUP BY 1, 2
),
dests AS (
  SELECT station_id,
         list({'stationId': return_station_id, 'trips': trips} ORDER BY trips DESC) AS top_destinations,
         count(*) AS sampled
  FROM dest_ranked WHERE rnk <= 5 GROUP BY 1
),
base AS (
  SELECT
    departure_station_id AS station_id,
    count(*) AS trips,
    round(100.0 * sum(CASE WHEN is_ebike THEN 1 ELSE 0 END)
      / nullif(count(is_ebike), 0), 1) AS ebike_share_pct,
    round(100.0 * sum(CASE WHEN NOT is_weekend
                            AND (hour(departure_ts) BETWEEN 6 AND 9
                                 OR hour(departure_ts) BETWEEN 16 AND 19)
                           THEN 1 ELSE 0 END) / count(*), 1) AS commute_share_pct,
    round(100.0 * sum(CASE WHEN is_weekend THEN 1 ELSE 0 END) / count(*), 1) AS weekend_share_pct,
    count(DISTINCT return_station_id) AS distinct_destinations
  FROM t12
  GROUP BY 1
)
SELECT base.*, dests.top_destinations
FROM base LEFT JOIN dests USING (station_id);

-- Connector score v2: real geometry, trailing-12-month behaviour.
-- Weights: transit proximity .30, volume .25, commute .20, e-bike .10,
-- destination diversity .15. Proximity decays linearly to 0 at 800 m.
CREATE OR REPLACE VIEW v_connector AS
WITH scored AS (
  SELECT
    t.station_id,
    greatest(0, 1 - s.nearest_transit_m / 800.0)                    AS c_transit,
    ln(1 + t.trips) / max(ln(1 + t.trips)) OVER ()                  AS c_volume,
    t.commute_share_pct / 100.0                                     AS c_commute,
    coalesce(t.ebike_share_pct, 0) / 100.0                          AS c_ebike,
    t.distinct_destinations * 1.0
      / max(t.distinct_destinations) OVER ()                        AS c_diversity
  FROM v_station_t12 t
  JOIN dim_station s USING (station_id)
  WHERE s.lat IS NOT NULL AND s.is_active
)
SELECT
  station_id,
  CAST(round(100 * (0.30 * c_transit + 0.25 * c_volume + 0.20 * c_commute
                    + 0.10 * c_ebike + 0.15 * c_diversity)) AS INTEGER) AS connector_score,
  CAST(round(100 * c_transit) AS INTEGER)   AS comp_transit_proximity,
  CAST(round(100 * c_volume) AS INTEGER)    AS comp_trip_volume,
  CAST(round(100 * c_commute) AS INTEGER)   AS comp_commute_pattern,
  CAST(round(100 * c_ebike) AS INTEGER)     AS comp_ebike_share,
  CAST(round(100 * c_diversity) AS INTEGER) AS comp_destination_diversity
FROM scored;

-- Rule-based operational opportunities, each citing its evidence numbers.
CREATE OR REPLACE VIEW v_opportunities AS
WITH profile AS (
  SELECT t.*, s.station_name, s.capacity, s.nearest_transit_station, s.nearest_transit_m,
         c.connector_score,
         t.trips / 365.0 / nullif(s.capacity, 0) AS trips_per_dock_day
  FROM v_station_t12 t
  JOIN dim_station s USING (station_id)
  JOIN v_connector c USING (station_id)
  WHERE s.lat IS NOT NULL AND s.is_active
),
net AS (
  SELECT
    median(trips_per_dock_day) AS med_tpd,
    median(trips) AS med_trips,
    quantile_cont(commute_share_pct, 0.75) AS p75_commute,
    quantile_cont(coalesce(ebike_share_pct, 0), 0.25) AS p25_ebike
  FROM profile
),
rules AS (
  SELECT p.station_id, p.station_name, 'dock-capacity-pressure' AS rule,
         CASE WHEN p.trips_per_dock_day > 3 * n.med_tpd THEN 'High' ELSE 'Medium' END AS priority,
         {'tripsPerDockDay': round(p.trips_per_dock_day, 1),
          'networkMedian': round(n.med_tpd, 1),
          'trips': p.trips, 'capacity': p.capacity} AS evidence,
         p.trips * 2 AS impact
  FROM profile p, net n
  WHERE p.trips_per_dock_day > 2 * n.med_tpd AND p.capacity >= 8
  UNION ALL
  SELECT p.station_id, p.station_name, 'ebike-gap',
         'Medium',
         {'commuteSharePct': p.commute_share_pct, 'ebikeSharePct': coalesce(p.ebike_share_pct, 0),
          'commuteP75': round(n.p75_commute, 1), 'ebikeP25': round(n.p25_ebike, 1)},
         p.trips
  FROM profile p, net n
  WHERE p.commute_share_pct >= n.p75_commute AND coalesce(p.ebike_share_pct, 0) <= n.p25_ebike
  UNION ALL
  SELECT p.station_id, p.station_name, 'transit-connector-gap',
         'High',
         {'nearestTransitM': p.nearest_transit_m, 'nearestTransit': p.nearest_transit_station,
          'connectorScore': p.connector_score, 'trips': p.trips},
         p.trips * 3
  FROM profile p, net n
  WHERE p.nearest_transit_m <= 300 AND p.trips >= n.med_trips AND p.connector_score < 70
  UNION ALL
  SELECT p.station_id, p.station_name, 'seasonal-underuse',
         'Low',
         {'weekendSharePct': p.weekend_share_pct, 'trips': p.trips},
         p.trips
  FROM profile p, net n
  WHERE p.weekend_share_pct >= 60 AND p.trips >= n.med_trips
)
SELECT row_number() OVER (ORDER BY impact DESC) AS rank, *
FROM (
  SELECT * EXCLUDE (rn) FROM (
    SELECT *, row_number() OVER (PARTITION BY station_id ORDER BY impact DESC) AS rn
    FROM rules
  ) WHERE rn = 1  -- one opportunity per station, strongest rule wins
)
ORDER BY impact DESC
LIMIT 8;
