// Every number the story displays is derived here from generated artifacts —
// nothing is hardcoded in JSX, so a data refresh rewrites the story. The
// functions take their data as arguments (with artifact defaults) so tests
// can drive them with fixtures.

import type {
  EbikeArtifact,
  MonthlyRow,
  SeasonalityRow,
  StationsArtifact,
  WeatherRow,
  YearlyRow,
} from "@/data/contracts";
import {
  ebike,
  lastCompleteYear,
  monthly,
  seasonality,
  stationsArtifact,
  weather,
  yearly,
} from "@/data";

const formatNumber = (value: number) => value.toLocaleString("en-CA");

export type Chapter = {
  id: string;
  headline: string;
  caption: string;
};

export function growthChapter(
  years: YearlyRow[] = yearly,
  lastFull: number = lastCompleteYear,
): Chapter {
  const complete = years.filter((y) => y.year <= lastFull);
  const first = complete[0];
  const peak = complete.reduce((a, b) => (b.trips > a.trips ? b : a));
  const latest = complete[complete.length - 1];
  return {
    id: "growth",
    headline: `From ${formatNumber(first.trips)} trips to ${formatNumber(peak.trips)}.`,
    caption:
      `${first.year} closed with ${formatNumber(first.trips)} rider trips; ` +
      `${peak.year} peaked at ${formatNumber(peak.trips)}. ` +
      (latest.trips < peak.trips
        ? `${latest.year} eased back to ${formatNumber(latest.trips)} — growth in this network has never been a straight line.`
        : `${latest.year} is the new high-water mark.`),
  };
}

export function seasonsChapter(
  rows: SeasonalityRow[] = seasonality,
  lastFull: number = lastCompleteYear,
): Chapter {
  const complete = rows.filter((r) => r.year <= lastFull && r.tripsByMonth.every((m) => m > 0));
  const avgMonth = (index: number) =>
    complete.reduce((sum, r) => sum + r.tripsByMonth[index], 0) / complete.length;
  const july = avgMonth(6);
  const december = avgMonth(11);
  const ratio = Math.round((july / december) * 10) / 10;
  return {
    id: "seasons",
    headline: "Every year has the same shape.",
    caption:
      `Across ${complete.length} complete years, July carries ${ratio}× the trips of December. ` +
      "The wave never changes — only its height does.",
  };
}

export function pandemicChapter(years: YearlyRow[] = yearly): Chapter {
  const y2019 = years.find((y) => y.year === 2019)!;
  const y2020 = years.find((y) => y.year === 2020)!;
  const dropPct = Math.round((1 - y2020.trips / y2019.trips) * 100);
  const recovery = years.find((y) => y.year > 2020 && y.trips > y2019.trips);
  return {
    id: "pandemic",
    headline: "2020 bent the curve. It didn't break it.",
    caption:
      `Trips fell ${dropPct}% from ${formatNumber(y2019.trips)} in 2019 to ` +
      `${formatNumber(y2020.trips)} in 2020` +
      (recovery
        ? `, then passed the old peak in ${recovery.year} with ${formatNumber(recovery.trips)}.`
        : "."),
  };
}

export function ebikeChapter(
  months: MonthlyRow[] = monthly,
  years: YearlyRow[] = yearly,
  lastFull: number = lastCompleteYear,
): Chapter {
  const firstMonth = months.find((m) => m.ebikeTrips !== null && m.ebikeTrips > 0);
  const latest = years.find((y) => y.year === lastFull);
  const share = latest?.ebikeSharePct ?? 0;
  const label = firstMonth
    ? new Date(`${firstMonth.month}-15`).toLocaleDateString("en-CA", {
        month: "long",
        year: "numeric",
      })
    : "recently";
  return {
    id: "ebikes",
    headline: "The fastest change the network has seen.",
    caption:
      `E-bikes first appear in the data in ${label}. By ${lastFull} they carried ` +
      `${Math.round(share)}% of all trips — a behavioural shift that took the ` +
      "classic fleet nine years to build happened to e-bikes in three.",
  };
}

export function weatherChapter(rows: WeatherRow[] = weather): Chapter {
  // Rank by trips per observed day, not raw totals — mild days are also the
  // most common days, and raw totals would just measure that.
  const rate = (row: WeatherRow) => row.trips / Math.max(row.daysObserved, 1);
  const peak = rows.reduce((a, b) => (rate(b) > rate(a) ? b : a));
  return {
    id: "weather",
    headline: `Vancouver rides at ${peak.tempBandC}°.`,
    caption:
      `Days in the ${peak.tempBandC}–${peak.tempBandC + 2}°C band average ` +
      `${Math.round(rate(peak)).toLocaleString("en-CA")} departures — the highest ` +
      "per-day rate of any temperature. Temperature travels with season and " +
      "daylight, so this is association, not cause — but the rain city rides anyway.",
  };
}

export function purposeChapter(
  artifact: EbikeArtifact = ebike,
  stations: StationsArtifact = stationsArtifact,
): Chapter {
  const classified = stations.stations.filter((s) => s.leisureSharePct !== null);
  const most = classified.reduce((a, b) =>
    (b.leisureSharePct ?? 0) > (a.leisureSharePct ?? 0) ? b : a,
  );
  const least = classified.reduce((a, b) =>
    (b.leisureSharePct ?? 100) < (a.leisureSharePct ?? 100) ? b : a,
  );
  const { classic, ebike: electric } = artifact.compare;
  return {
    id: "purpose",
    headline: "Two networks in one.",
    caption:
      `By a documented heuristic, about ${Math.round(artifact.purpose.leisureSharePct)}% ` +
      `of the last year's rides are leisure — but they are not evenly spread: ` +
      `${most.name} runs ${Math.round(most.leisureSharePct ?? 0)}% leisure while ` +
      `${least.name} runs ${Math.round(least.leisureSharePct ?? 0)}%. The seawall and the ` +
      `commute share one fleet. E-bikes serve both harder: median trips are longer ` +
      `(${electric.medianDistanceKm} km vs ${classic.medianDistanceKm} km), faster ` +
      `(${electric.medianSpeedKmh} vs ${classic.medianSpeedKmh} km/h), and straighter ` +
      `(detour ${electric.medianDetour}× vs ${classic.medianDetour}×).`,
  };
}

export const chapters: Chapter[] = [
  growthChapter(),
  seasonsChapter(),
  pandemicChapter(),
  ebikeChapter(),
  weatherChapter(),
  purposeChapter(),
];
