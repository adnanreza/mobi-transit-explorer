import {
  chapters,
  ebikeChapter,
  growthChapter,
  pandemicChapter,
  seasonsChapter,
  smokeChapter,
  weatherChapter,
} from "@/components/story/storyContent";
import type {
  AirQualityArtifact,
  MonthlyRow,
  SeasonalityRow,
  WeatherRow,
  YearlyRow,
} from "@/data/contracts";

const year = (y: number, trips: number, ebike: number | null = null): YearlyRow => ({
  year: y,
  trips,
  distanceKm: trips * 3,
  medianDurationMin: 12,
  ebikeSharePct: ebike,
  activeStations: 200,
  avgTempC: 12,
  membershipMix: {},
});

describe("storyContent derives every number from data", () => {
  it("growth uses first, peak, and latest complete years", () => {
    const rows = [year(2017, 100_000), year(2018, 300_000), year(2019, 200_000)];
    const chapter = growthChapter(rows, 2019);
    expect(chapter.headline).toBe("From 100,000 trips to 300,000.");
    expect(chapter.caption).toContain("2018 peaked at 300,000");
    expect(chapter.caption).toContain("2019 eased back to 200,000");
  });

  it("seasons computes the july:december ratio across complete years", () => {
    const rows: SeasonalityRow[] = [
      { year: 2018, tripsByMonth: [10, 10, 10, 10, 10, 10, 40, 10, 10, 10, 10, 10] },
      { year: 2019, tripsByMonth: [10, 10, 10, 10, 10, 10, 40, 10, 10, 10, 10, 10] },
    ];
    const chapter = seasonsChapter(rows, 2019);
    expect(chapter.caption).toContain("July carries 4× the trips of December");
  });

  it("pandemic reports the 2020 drop and recovery year", () => {
    const rows = [year(2019, 1_000_000), year(2020, 600_000), year(2021, 900_000), year(2022, 1_100_000)];
    const chapter = pandemicChapter(rows);
    expect(chapter.caption).toContain("fell 40%");
    expect(chapter.caption).toContain("passed the old peak in 2022");
  });

  it("ebikes finds the first month the flag appears", () => {
    const months: MonthlyRow[] = [
      { month: "2022-07", trips: 1000, ebikeTrips: null },
      { month: "2022-08", trips: 1000, ebikeTrips: 150 },
    ];
    const chapter = ebikeChapter(months, [year(2025, 800_000, 41.8)], 2025);
    expect(chapter.caption).toContain("August 2022");
    expect(chapter.caption).toContain("42% of all trips");
  });

  it("weather names the peak per-day temperature band", () => {
    const rows: WeatherRow[] = [
      { tempBandC: 0, tripsPerDay: 500, daysObserved: 30 },
      { tempBandC: 10, tripsPerDay: 1500, daysObserved: 60 },
      { tempBandC: 20, tripsPerDay: 4000, daysObserved: 40 },
    ];
    const chapter = weatherChapter(rows);
    expect(chapter.headline).toBe("Vancouver rides at 20°.");
    expect(chapter.caption).toContain("4,000 trips");
    expect(chapter.caption).toContain("8×"); // 4000 / 500 near-freezing
  });

  it("smoke chapter derives the rule, the exception, and the encoding", () => {
    const aq: AirQualityArtifact = {
      primaryStation: "Vancouver Clark Drive",
      corroboratingStation: "Burnaby Kensington Park",
      source: { catalogueRecord: "https://catalogue.data.gov.bc.ca/dataset/x" },
      licence: { name: "OGL-BC", version: "2.0", url: "https://example.test", attribution: "Contains information licensed under the Open Government Licence – British Columbia." },
      smokeThresholdUgM3: 25,
      verifiedThrough: "2024-12-31",
      coverage: { firstDay: "2017-01-04", lastDay: "2026-06-30", days: 3000 },
      smokeDayCount: 35,
      avgSmokeDayDropPct: 0.4,
      medianSmokeDayDropPct: -5.8,
      worstDay: { date: "2020-09-14", pm25: 161, trips: 1261, dropPct: 42.1 },
      events: [
        { year: 2017, days: 12, avgDropPct: -6.2 },
        { year: 2020, days: 8, avgDropPct: 18.4 },
      ],
      sept2020: [
        { date: "2020-09-13", trips: 2000, pm25: 120, smoke: true },
        { date: "2020-09-20", trips: 5000, pm25: 5, smoke: false },
      ],
    };
    const chapter = smokeChapter(aq);
    expect(chapter.headline).toBe("Even wildfire smoke barely stops the bikes.");
    expect(chapter.caption).toContain("35 days have met the smoke rule");
    expect(chapter.caption).toContain("the median smoke day ran 5.8% above its month's clear days");
    expect(chapter.caption).toContain("the mean about even with them");
    expect(chapter.caption).toContain("both Vancouver Clark Drive and Burnaby Kensington Park");
    expect(chapter.caption).toContain("September 2020's 8 smoke days ran 18.4% below");
    expect(chapter.caption).toContain("September 14, 2020 at 161 ug/m3");
    expect(chapter.caption).toContain("Blue bars are smoke days");
    expect(chapter.caption).toContain("association within season, not cause");
  });

  it("smoke chapter headline switches when the drop is real", () => {
    const aq: AirQualityArtifact = {
      primaryStation: "A",
      corroboratingStation: "B",
      source: { catalogueRecord: "https://catalogue.data.gov.bc.ca/dataset/x" },
      licence: { name: "OGL-BC", version: "2.0", url: "https://example.test", attribution: "Contains information licensed under the Open Government Licence – British Columbia." },
      smokeThresholdUgM3: 25,
      verifiedThrough: "2024-12-31",
      coverage: { firstDay: "2017-01-04", lastDay: "2026-06-30", days: 3000 },
      smokeDayCount: 10,
      avgSmokeDayDropPct: 17.5,
      medianSmokeDayDropPct: 16.0,
      worstDay: null,
      events: [],
      sept2020: [],
    };
    expect(smokeChapter(aq).headline).toBe(
      "When the sky turns to smoke, riding falls 18%.",
    );
    expect(smokeChapter(aq).caption).toContain("17.5% below");
  });

  it("real artifacts produce eight plausible chapters", () => {
    expect(chapters).toHaveLength(8);
    for (const chapter of chapters) {
      expect(chapter.headline.length).toBeGreaterThan(10);
      expect(chapter.caption.length).toBeGreaterThan(40);
      expect(chapter.caption).not.toContain("NaN");
      expect(chapter.caption).not.toContain("undefined");
    }
  });
});
