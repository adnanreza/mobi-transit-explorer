import {
  chapters,
  ebikeChapter,
  growthChapter,
  pandemicChapter,
  seasonsChapter,
  weatherChapter,
} from "@/components/story/storyContent";
import type { MonthlyRow, SeasonalityRow, WeatherRow, YearlyRow } from "@/data/contracts";

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

  it("real artifacts produce six plausible chapters", () => {
    expect(chapters).toHaveLength(6);
    for (const chapter of chapters) {
      expect(chapter.headline.length).toBeGreaterThan(10);
      expect(chapter.caption.length).toBeGreaterThan(40);
      expect(chapter.caption).not.toContain("NaN");
      expect(chapter.caption).not.toContain("undefined");
    }
  });
});
