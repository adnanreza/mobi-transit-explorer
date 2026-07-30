// Contract tests: lock the pipeline-generated JSON to the app's expectations.
// If the pipeline changes shape or violates an invariant, this fails in CI
// before anything renders wrong.

import {
  airquality,
  crashContext,
  ebike,
  flows,
  forecast,
  generatedOpportunities,
  hourly,
  meta,
  monthly,
  opportunities,
  overviewMetrics,
  seasonality,
  spanPhrase,
  stations,
  stationsAll,
  stationsArtifact,
  transitCoverage,
  transitNodes,
  weather,
  yearly,
} from "@/data";
import { VIEW_H, VIEW_W } from "@/lib/projection";

describe("generated data contracts", () => {
  it("meta totals are sane", () => {
    expect(meta.totals.trips).toBeGreaterThan(5_000_000);
    expect(meta.totals.activeStations).toBeGreaterThan(200);
    expect(meta.sourceWindow.firstMonth).toBe("2017-01");
    expect(meta.sourceWindow.lastMonth >= "2026-06").toBe(true);
    expect(meta.quality.rowsKept).toBeLessThan(meta.quality.rowsLanded);
  });

  it("monthly series is continuous with no gaps", () => {
    for (let i = 1; i < monthly.length; i += 1) {
      const prev = monthly[i - 1].month;
      const [year, month] = prev.split("-").map(Number);
      const expected =
        month === 12
          ? `${year + 1}-01`
          : `${year}-${String(month + 1).padStart(2, "0")}`;
      expect(monthly[i].month).toBe(expected);
    }
    expect(monthly[0].month).toBe("2017-01");
  });

  it("yearly totals equal the sum of their months", () => {
    const byYear = new Map<number, number>();
    for (const row of monthly) {
      const year = Number(row.month.slice(0, 4));
      byYear.set(year, (byYear.get(year) ?? 0) + row.trips);
    }
    for (const row of yearly) {
      expect(byYear.get(row.year)).toBe(row.trips);
    }
  });

  it("seasonality rows have 12 month slots", () => {
    for (const row of seasonality) {
      expect(row.tripsByMonth).toHaveLength(12);
    }
  });

  it("every station has valid coordinates and a consistent connector score", () => {
    for (const s of stationsArtifact.stations) {
      expect(s.lat).toBeGreaterThan(49.1);
      expect(s.lat).toBeLessThan(49.4);
      expect(s.lon).toBeGreaterThan(-123.3);
      expect(s.lon).toBeLessThan(-123.0);
      expect(s.connector.score).toBeGreaterThanOrEqual(0);
      expect(s.connector.score).toBeLessThanOrEqual(100);
      const c = s.connector.components;
      const recomputed = Math.round(
        0.3 * c.transitProximity +
          0.25 * c.tripVolume +
          0.2 * c.commutePattern +
          0.1 * c.ebikeShare +
          0.15 * c.destinationDiversity,
      );
      expect(Math.abs(recomputed - s.connector.score)).toBeLessThanOrEqual(1);
    }
  });

  it("weather bands are ordered, ambient-plausible, and rise with temperature", () => {
    const bands = weather.map((w) => w.tempBandC);
    expect([...bands].sort((a, b) => a - b)).toEqual(bands);
    // EC ambient means for Vancouver, not bike-sensor fantasy values
    expect(Math.min(...bands)).toBeGreaterThanOrEqual(-15);
    expect(Math.max(...bands)).toBeLessThanOrEqual(28);
    for (const w of weather) expect(w.tripsPerDay).toBeGreaterThan(0);
    // warmest band should out-ride the coldest
    const byTemp = [...weather].sort((a, b) => a.tempBandC - b.tempBandC);
    expect(byTemp[byTemp.length - 1].tripsPerDay).toBeGreaterThan(byTemp[0].tripsPerDay);
  });

  it("opportunities cite evidence and resolve to stations", () => {
    expect(generatedOpportunities.length).toBeGreaterThan(0);
    expect(generatedOpportunities.length).toBeLessThanOrEqual(8);
    const ids = new Set(stationsArtifact.stations.map((s) => s.id));
    for (const o of generatedOpportunities) {
      expect(ids.has(o.stationId)).toBe(true);
      expect(Object.keys(o.evidence).length).toBeGreaterThan(0);
    }
    for (const o of opportunities) {
      expect(o.reason.length).toBeGreaterThan(20);
    }
  });

  it("air quality artifact holds the smoke-rule contract", () => {
    expect(airquality.smokeThresholdUgM3).toBe(25);
    expect(airquality.primaryStation).toBe("Vancouver Clark Drive");
    expect(airquality.corroboratingStation).toBe("Burnaby Kensington Park");
    // coverage spans the trip archive and the verified/unverified split is real
    expect(airquality.coverage.firstDay! <= "2017-01-31").toBe(true);
    expect(airquality.verifiedThrough >= "2024-12-31").toBe(true);
    // the known 2017 and 2020 events register; totals stay plausible
    const eventYears = airquality.events.map((e) => e.year);
    expect(eventYears).toContain(2017);
    expect(eventYears).toContain(2020);
    expect(airquality.smokeDayCount).toBeGreaterThanOrEqual(5);
    expect(airquality.smokeDayCount).toBeLessThanOrEqual(200);
    // the chapter's chart window: continuous dates, several smoke days
    const sept = airquality.sept2020;
    expect(sept.length).toBeGreaterThanOrEqual(30);
    expect(sept.filter((d) => d.smoke).length).toBeGreaterThanOrEqual(5);
    for (const day of sept) {
      expect(day.date >= "2020-08-24" && day.date <= "2020-10-04").toBe(true);
      expect(day.trips).toBeGreaterThan(0);
      expect(day.pm25).toBeGreaterThanOrEqual(0);
    }
    if (airquality.avgSmokeDayDropPct !== null) {
      expect(Math.abs(airquality.avgSmokeDayDropPct)).toBeLessThan(60);
    }
    if (airquality.medianSmokeDayDropPct !== null) {
      expect(Math.abs(airquality.medianSmokeDayDropPct)).toBeLessThan(60);
    }
    // licence pinned as a literal (the Methodology test is self-referential
    // by design, so the exact wording must be locked here): the dash is
    // U+2013 and the title's separator is a plain hyphen, both verbatim.
    expect(airquality.licence.attribution).toBe(
      "Contains information licensed under the Open Government Licence – British Columbia.",
    );
    expect(airquality.licence.name).toBe("Open Government Licence - British Columbia");
    expect(airquality.source.catalogueRecord).toMatch(/^https:\/\/catalogue\.data\.gov\.bc\.ca\//);
  });

  it("window span labels derive from the source window", () => {
    // fixed inputs, so this tests the words rather than mirroring the data
    expect(spanPhrase("2017-01", "2026-06")).toBe("nine and a half years");
    expect(spanPhrase("2017-01", "2026-12")).toBe("ten years");
    expect(spanPhrase("2017-01", "2027-03")).toBe("ten years");
    expect(spanPhrase("2017-01", "2027-06")).toBe("ten and a half years");
  });

  it("crash context accounting closes and publishes no rate", () => {
    const { city, accounting, byStation, vintage } = crashContext;
    // the invariant: located crashes are either near a dock or near none
    expect(city.crashesWithCoordinates).toBe(
      accounting.matchedUniqueCrashes + accounting.nearNoStationCrashes,
    );
    // catchments overlap, so assignments exceed unique crashes by design
    expect(accounting.stationAssignments).toBeGreaterThanOrEqual(
      accounting.matchedUniqueCrashes,
    );
    expect(
      Object.values(byStation).reduce((sum, s) => sum + s.crashes, 0),
    ).toBe(accounting.stationAssignments);
    // rows are weighted, so crashes >= rows
    expect(city.crashes).toBeGreaterThanOrEqual(city.rows);
    expect(city.casualtyCrashes + city.propertyDamageOnlyCrashes).toBe(city.crashes);
    expect(city.crashesWithCoordinates + city.crashesWithoutCoordinates).toBe(city.crashes);
    // every station in the artifact is a station the app renders, and zeros
    // are explicit rather than missing
    // set equality both ways: a regenerated artifact that drops stations must
    // fail here rather than silently blanking their panel block
    const ids = new Set(stationsArtifact.stations.map((s) => s.id));
    expect(new Set(Object.keys(byStation))).toEqual(ids);
    for (const entry of Object.values(byStation)) {
      expect(entry.crashes).toBeGreaterThanOrEqual(entry.casualtyCrashes);
    }
    expect(Object.values(byStation).some((s) => s.crashes === 0)).toBe(true);
    // the radius is defended with numbers, not an assertion
    expect(crashContext.radiusSensitivity.map((r) => r.radiusM)).toContain(
      crashContext.radiusM,
    );
    // no per-trip rate anywhere: scan the WHOLE artifact, mirroring the
    // pytest gate. The old check only scanned byStation, whose two fixed
    // keys meant it could never fail.
    expect(JSON.stringify(crashContext)).not.toMatch(
      /per100k|crashRate|ratePer|departure/i,
    );
    expect(city.medianStationCrashes).toBeGreaterThanOrEqual(0);
    expect(vintage.revisable).toBe(true);
    expect(crashContext.licence.attribution).toBe(
      "Contains information licensed under ICBC\u2019s Open Data Licence.",
    );
  });

  it("transit coverage split matches the copy that cites it", () => {
    // The Coverage view and Personal Requests claim a binary split: every
    // rapid-transit station either has a dock within ~250 m or none within
    // 1 km. If Mobi ever adds a dock in the middle ground, this fails and
    // the prose gets reviewed.
    expect(transitCoverage).toHaveLength(20);
    for (const t of transitCoverage) {
      expect(t.nearestDockM <= 250 || t.nearestDockM > 1000).toBe(true);
    }
    const uncovered = transitCoverage.filter((t) => t.nearestDockM > 1000);
    expect(uncovered.length).toBeGreaterThan(0);
    expect(uncovered.map((t) => t.name)).toContain("Joyce - Collingwood");
  });

  it("adapters produce the shapes the components render", () => {
    expect(stations).toHaveLength(40);
    expect(stationsAll.length).toBe(stationsArtifact.stations.length);
    for (const s of stationsAll) {
      expect(s.x).toBeGreaterThanOrEqual(0);
      expect(s.x).toBeLessThanOrEqual(VIEW_W);
      expect(s.y).toBeGreaterThanOrEqual(0);
      expect(s.y).toBeLessThanOrEqual(VIEW_H);
      expect(s.trend.length).toBeGreaterThan(0);
    }
    // 22 CoV platform rows collapse to 20 unique stations (Waterfront and
    // Commercial-Broadway appear once per line in the source)
    expect(transitNodes).toHaveLength(20);
    expect(overviewMetrics).toHaveLength(4);
  });

  it("ebike artifact and leisure shares are plausible", () => {
    expect(ebike.compare.ebike.trips).toBeGreaterThan(100_000);
    expect(ebike.compare.classic.trips).toBeGreaterThan(ebike.compare.ebike.trips / 10);
    expect(ebike.compare.ebike.medianSpeedKmh).toBeGreaterThan(
      ebike.compare.classic.medianSpeedKmh,
    );
    expect(ebike.purpose.leisureSharePct).toBeGreaterThan(3);
    expect(ebike.purpose.leisureSharePct).toBeLessThan(60);
    const classified = stationsArtifact.stations.filter(
      (s) => s.leisureSharePct !== null,
    );
    expect(classified.length).toBeGreaterThan(200);
    for (const s of classified) {
      expect(s.leisureSharePct).toBeGreaterThanOrEqual(0);
      expect(s.leisureSharePct).toBeLessThanOrEqual(100);
    }
  });

  it("flows artifact is consistent with the station set", () => {
    expect(flows.networkDailyRebalancing).toBeGreaterThan(50);
    expect(flows.weekdayCount).toBeGreaterThan(200);
    expect(flows.weekendCount).toBeGreaterThan(80);
    const ids = new Set(stationsArtifact.stations.map((s) => s.id));
    expect(flows.stations.length).toBe(stationsArtifact.stations.length);
    for (const s of flows.stations) {
      expect(ids.has(s.id)).toBe(true);
      for (const profile of [s.weekday, s.weekend]) {
        expect(profile.dep).toHaveLength(24);
        expect(profile.ret).toHaveLength(24);
      }
    }
    // network-wide, every departure eventually returns somewhere: totals
    // should be within a few percent (one-sided trips create the gap)
    const dep = flows.stations.reduce(
      (sum, s) => sum + s.weekday.dep.concat(s.weekend.dep).reduce((a, b) => a + b, 0),
      0,
    );
    const ret = flows.stations.reduce(
      (sum, s) => sum + s.weekday.ret.concat(s.weekend.ret).reduce((a, b) => a + b, 0),
      0,
    );
    expect(Math.abs(dep - ret) / dep).toBeLessThan(0.05);
  });

  it("forecast modelCard contains droppedDays breakdown with consistent counts", () => {
    const dd = forecast.modelCard.droppedDays;
    expect(dd.total).toBe(dd.trainingWindow + dd.holdoutWindow);
    const perYearSum = Object.values(dd.perYear).reduce((a, b) => a + b, 0);
    expect(perYearSum).toBe(dd.total);
    // Training window is the bulk (2017-2024 has 164 days)
    expect(dd.trainingWindow).toBeGreaterThan(dd.holdoutWindow);
    // Total should be roughly 178 ± 20 (stable within a pipeline run)
    expect(dd.total).toBeGreaterThan(100);
    expect(dd.total).toBeLessThan(300);
  });

  it("total generated payload stays inside the size budget", () => {
    // artifacts are written compact, so re-stringifying reproduces file size
    const artifacts: unknown[] = [
      meta, yearly, monthly, seasonality, hourly, weather,
      stationsArtifact, generatedOpportunities, flows, ebike, airquality, crashContext,
    ];
    const total = artifacts.reduce(
      (sum: number, artifact) => sum + JSON.stringify(artifact).length,
      0,
    );
    expect(total).toBeLessThan(400_000);
  });
});
