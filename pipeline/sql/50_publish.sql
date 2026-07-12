-- Stage 50: publish views. Each v_* view backs one JSON artifact exported by
-- publish.py. Millions of rows in, well under a megabyte out.
--
-- Analytic basis ("countable" trips):
--   * membership group 'Operations' excluded (staff/maintenance riding)
--   * round_trip_false_start, zero_duration, negative_duration, misdated_source
--     excluded from ridership counts (false starts / misdated rows are events,
--     not valid trips for headline metrics)
--   * trips after the last complete source month excluded (spillover tail)
-- Duration/distance measures additionally exclude their own invalidating flags.

CREATE OR REPLACE VIEW v_window AS
SELECT
  '2017-01' AS first_month,
  (SELECT max(source_period) FROM fact_trips WHERE source_period <> '2017') AS last_month;

-- Real ambient weather from Environment Canada (Vancouver Harbour CS), one row
-- per day. The trip files carry a bike-MOUNTED temperature sensor that reads
-- several degrees high in sun, emits 0-degree sentinels, and produces values
-- Vancouver has never reached (up to 45C vs an EC record max of 26.0C), so it
-- is NOT used for any published weather measure. EC daily means are the honest
-- ambient signal, already downloaded by weather_fetch.py for the model.
CREATE OR REPLACE VIEW v_ec_weather AS
SELECT
  CAST("Date/Time" AS DATE)               AS date_key,
  CAST("Mean Temp (°C)" AS DOUBLE)        AS mean_temp_c,
  TRY_CAST("Total Precip (mm)" AS DOUBLE) AS precip_mm
FROM read_csv(getvariable('data_raw') || '/weather/ec-*.csv',
              header = true, all_varchar = true, union_by_name = true,
              filename = false)
WHERE nullif("Mean Temp (°C)", '') IS NOT NULL;

-- LEFT JOIN is load-bearing: trips with a blank membership label (91k in
-- May 2025 alone) are real rides and count as 'Unknown'. Only staff
-- 'Operations' riding is excluded from ridership.
CREATE OR REPLACE VIEW countable_trips AS
SELECT f.*, coalesce(m.membership_group, 'Unknown') AS membership_group
FROM fact_trips f
LEFT JOIN dim_membership m USING (membership_raw)
WHERE coalesce(m.membership_group, 'Unknown') <> 'Operations'
  AND f.trip_month BETWEEN (SELECT first_month FROM v_window)
                       AND (SELECT last_month FROM v_window)
  AND NOT list_has_any(f.quality_flags,
        ['round_trip_false_start', 'zero_duration', 'negative_duration',
         'misdated_source']);

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
  CAST(round(sum(CASE WHEN NOT list_has_any(quality_flags, ['excessive_distance', 'negative_distance'])
                      THEN coalesce(distance_m, 0) END) / 1e3) AS BIGINT) AS distance_km,
  CAST(round(median(CASE WHEN NOT list_contains(quality_flags, 'excessive_duration')
                         THEN duration_s END) / 60.0, 1) AS DOUBLE) AS median_duration_min,
  CASE WHEN count(is_ebike) > 0
       THEN round(100.0 * sum(CASE WHEN is_ebike THEN 1 ELSE 0 END) / count(is_ebike), 1)
  END AS ebike_share_pct,  -- NULL before the Electric bike column exists
  count(DISTINCT departure_station_id) AS active_stations,
  -- ambient temperature averaged over the year's ride-days (EC, not the
  -- unreliable bike sensor)
  (SELECT round(avg(w.mean_temp_c), 1)
   FROM (SELECT DISTINCT date_key FROM countable_trips c2 WHERE c2.trip_year = c.trip_year) d
   JOIN v_ec_weather w USING (date_key)) AS avg_temp_c
FROM countable_trips c
GROUP BY trip_year ORDER BY trip_year;

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

-- Weather vs ridership at the DAILY grain: classify each day once by its EC
-- ambient mean temperature, then average total trips across the days in each
-- 2-degree band. "Days near N degrees average M trips" is then literally true.
CREATE OR REPLACE VIEW v_weather AS
WITH daily AS (
  SELECT date_key, count(*) AS trips
  FROM countable_trips
  GROUP BY date_key
)
SELECT
  CAST(floor(w.mean_temp_c / 2) * 2 AS INTEGER)   AS temp_band_c,
  CAST(round(avg(d.trips)) AS BIGINT)             AS trips_per_day,
  count(*)                                        AS days_observed
FROM daily d
JOIN v_ec_weather w USING (date_key)
GROUP BY 1 HAVING count(*) >= 15 ORDER BY 1;

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

-- Station flows: departures and returns per station x day type x hour over
-- the trailing 12 months. Day type comes from each end's own timestamp — a
-- late ride can depart on a Friday and return on a Saturday.
CREATE OR REPLACE VIEW v_flow_day_counts AS
SELECT
  sum(CASE WHEN isodow(d) < 6 THEN 1 ELSE 0 END) AS weekday_count,
  sum(CASE WHEN isodow(d) >= 6 THEN 1 ELSE 0 END) AS weekend_count
FROM (
  SELECT DISTINCT date_key AS d FROM countable_trips
  WHERE trip_month IN (SELECT trip_month FROM v_t12_months)
);

CREATE OR REPLACE VIEW v_station_flows AS
WITH events AS (
  SELECT departure_station_id AS station_id,
         CASE WHEN isodow(departure_ts) >= 6 THEN 'weekend' ELSE 'weekday' END AS day_type,
         CAST(hour(departure_ts) AS INTEGER) AS hour,
         1 AS departures, 0 AS returns
  FROM countable_trips
  WHERE departure_station_id IS NOT NULL
    AND trip_month IN (SELECT trip_month FROM v_t12_months)
  UNION ALL
  SELECT return_station_id,
         CASE WHEN isodow(return_ts) >= 6 THEN 'weekend' ELSE 'weekday' END,
         CAST(hour(return_ts) AS INTEGER),
         0, 1
  FROM countable_trips
  WHERE return_station_id IS NOT NULL
    AND trip_month IN (SELECT trip_month FROM v_t12_months)
)
SELECT station_id, day_type, hour,
       sum(departures) AS departures, sum(returns) AS returns
FROM events
GROUP BY 1, 2, 3;

-- Daily net flow per station (returns - departures): the imbalance riders
-- create, which crews must undo. Mobi excludes its own rebalancing trips
-- from the published data, so this is inference — and labelled as such.
CREATE OR REPLACE VIEW v_station_daily_net AS
WITH events AS (
  SELECT departure_station_id AS station_id, departure_ts::DATE AS day, -1 AS net
  FROM countable_trips
  WHERE departure_station_id IS NOT NULL
    AND trip_month IN (SELECT trip_month FROM v_t12_months)
  UNION ALL
  SELECT return_station_id, return_ts::DATE, 1
  FROM countable_trips
  WHERE return_station_id IS NOT NULL
    AND trip_month IN (SELECT trip_month FROM v_t12_months)
)
SELECT station_id, day, sum(net) AS net
FROM events GROUP BY 1, 2;

CREATE OR REPLACE VIEW v_station_balance AS
WITH hourly AS (
  SELECT station_id, day, h, sum(net) AS net FROM (
    SELECT departure_station_id AS station_id, departure_ts::DATE AS day,
           hour(departure_ts) AS h, -1 AS net
    FROM countable_trips
    WHERE departure_station_id IS NOT NULL
      AND trip_month IN (SELECT trip_month FROM v_t12_months)
    UNION ALL
    SELECT return_station_id, return_ts::DATE, hour(return_ts), 1
    FROM countable_trips
    WHERE return_station_id IS NOT NULL
      AND trip_month IN (SELECT trip_month FROM v_t12_months)
  ) GROUP BY 1, 2, 3
),
cumulative AS (
  SELECT station_id, day,
         sum(net) OVER (PARTITION BY station_id, day ORDER BY h) AS running
  FROM hourly
),
swings AS (
  -- measured against the day's zero starting point, so a station that only
  -- drains still shows its full drift
  SELECT station_id, day,
         greatest(max(running), 0) - least(min(running), 0) AS swing
  FROM cumulative GROUP BY 1, 2
)
SELECT
  n.station_id,
  round(avg(n.net), 2)      AS avg_daily_net,
  round(avg(abs(n.net)), 2) AS avg_abs_daily_net,
  round(avg(s.swing), 1)    AS avg_peak_swing
FROM v_station_daily_net n
JOIN swings s USING (station_id, day)
GROUP BY 1;

CREATE OR REPLACE VIEW v_network_rebalancing AS
SELECT CAST(round(avg(moved)) AS INTEGER) AS bikes_per_day
FROM (
  SELECT day, sum(abs(net)) / 2.0 AS moved
  FROM v_station_daily_net GROUP BY day
);

-- E-bike vs classic comparison, from the month the flag first appears.
-- Detour factor = odometer distance / straight-line distance between the two
-- stations' real coordinates: a proxy for how indirect the ride was.
CREATE OR REPLACE MACRO hav_m(lat1, lon1, lat2, lon2) AS (
  2 * 6371000 * asin(sqrt(
    pow(sin(radians(lat2 - lat1) / 2), 2)
    + cos(radians(lat1)) * cos(radians(lat2))
      * pow(sin(radians(lon2 - lon1) / 2), 2)
  ))
);

CREATE OR REPLACE VIEW v_trip_geometry AS
SELECT
  c.*,
  hav_m(sd.lat, sd.lon, sr.lat, sr.lon) AS straight_m,
  CASE
    WHEN hav_m(sd.lat, sd.lon, sr.lat, sr.lon) >= 300
     AND c.distance_m / hav_m(sd.lat, sd.lon, sr.lat, sr.lon) BETWEEN 1 AND 5
    THEN c.distance_m / hav_m(sd.lat, sd.lon, sr.lat, sr.lon)
  END AS detour_factor
FROM countable_trips c
JOIN dim_station sd ON c.departure_station_id = sd.station_id AND sd.lat IS NOT NULL
JOIN dim_station sr ON c.return_station_id = sr.station_id AND sr.lat IS NOT NULL;

CREATE OR REPLACE VIEW v_ebike_compare AS
SELECT
  is_ebike,
  count(*) AS trips,
  round(median(duration_s) / 60.0, 1) AS median_duration_min,
  round(median(distance_m) / 1000.0, 2) AS median_distance_km,
  round(median(distance_m * 3.6 / duration_s), 1) AS median_speed_kmh,
  round(median(detour_factor), 2) AS median_detour
FROM v_trip_geometry
WHERE trip_month >= '2022-08'
  AND is_ebike IS NOT NULL
  AND duration_s >= 180
  AND NOT list_has_any(quality_flags,
        ['excessive_duration', 'excessive_distance', 'negative_distance'])
GROUP BY 1;

-- E-bike share by real ambient temperature (EC), banded by each trip's day.
CREATE OR REPLACE VIEW v_ebike_share_by_temp AS
SELECT
  CAST(floor(w.mean_temp_c / 4) * 4 AS INTEGER) AS temp_band_c,
  round(100.0 * sum(CASE WHEN c.is_ebike THEN 1 ELSE 0 END) / count(*), 1) AS ebike_share_pct,
  count(*) AS trips
FROM countable_trips c
JOIN v_ec_weather w USING (date_key)
WHERE c.trip_month >= '2022-08' AND c.is_ebike IS NOT NULL
GROUP BY 1 HAVING count(*) >= 500 ORDER BY 1;

-- Trip purpose: a documented heuristic, not ground truth. Points for the
-- signatures of a leisure ride; >= 4 points classifies as leisure.
CREATE OR REPLACE VIEW v_trip_purpose AS
SELECT
  g.*,
  (CASE WHEN departure_station_name = return_station_name THEN 3 ELSE 0 END
   + CASE WHEN isodow(departure_ts) >= 6 THEN 1 ELSE 0 END
   + CASE WHEN hour(departure_ts) BETWEEN 10 AND 15 THEN 1 ELSE 0 END
   + CASE WHEN duration_s > 2400 THEN 2 WHEN duration_s > 1200 THEN 1 ELSE 0 END
   + CASE WHEN detour_factor > 1.8 THEN 1 ELSE 0 END
   + CASE WHEN regexp_matches(departure_station_name || ' ' || return_station_name,
       'Stanley Park|Seawall|Beach|English Bay|Vanier Park|Aquatic Centre')
     THEN 2 ELSE 0 END) AS leisure_score
FROM v_trip_geometry g
WHERE trip_month IN (SELECT trip_month FROM v_t12_months);

CREATE OR REPLACE VIEW v_station_leisure AS
SELECT
  departure_station_id AS station_id,
  round(100.0 * sum(CASE WHEN leisure_score >= 4 THEN 1 ELSE 0 END) / count(*), 1)
    AS leisure_share_pct,
  count(*) AS trips
FROM v_trip_purpose
GROUP BY 1;

CREATE OR REPLACE VIEW v_network_purpose AS
SELECT
  round(100.0 * sum(CASE WHEN leisure_score >= 4 THEN 1 ELSE 0 END) / count(*), 1)
    AS leisure_share_pct,
  count(*) AS trips
FROM v_trip_purpose;

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
