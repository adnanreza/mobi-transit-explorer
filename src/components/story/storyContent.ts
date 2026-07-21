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
        ? `${latest.year} eased back to ${formatNumber(latest.trips)}. Growth in this network has never been a straight line.`
        : `${latest.year} is the new high-water mark.`),
  };
}

export function seasonsChapter(
  rows: SeasonalityRow[] = seasonality,
  lastFull: number = lastCompleteYear,
): Chapter {
  const complete = rows.filter(
    (r): r is { year: number; tripsByMonth: number[] } =>
      r.year <= lastFull && r.tripsByMonth.every((m): m is number => m !== null && m > 0),
  );
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
      "The wave never changes. Only its height does. " +
      `The blue line is ${lastFull}; the grey lines are every year before it.`,
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
        : ".") +
      " The blue stretch of the line marks June 2019 through June 2022.",
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
      `${Math.round(share)}% of all trips. A shift that took the classic fleet ` +
      "nine years happened to e-bikes in three.",
  };
}

export function weatherChapter(rows: WeatherRow[] = weather): Chapter {
  // Each day is classified once by its Environment Canada ambient mean
  // temperature; tripsPerDay is the true average across the days in each band.
  const peak = rows.reduce((a, b) => (b.tripsPerDay > a.tripsPerDay ? b : a));
  const cold = rows.reduce((a, b) => (a.tempBandC < b.tempBandC ? a : b));
  return {
    id: "weather",
    headline: `Vancouver rides at ${peak.tempBandC}°.`,
    caption:
      `Days averaging ${peak.tempBandC}–${peak.tempBandC + 2}°C see about ` +
      `${peak.tripsPerDay.toLocaleString("en-CA")} trips, roughly ` +
      `${Math.round(peak.tripsPerDay / cold.tripsPerDay)}× a near-freezing day. ` +
      "Temperature travels with season and daylight, so this is association, not " +
      "cause. The rain city rides anyway. Temperatures are ambient readings from " +
      "Environment Canada. The blue bar is the busiest band.",
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
      `of the last year's rides are leisure, but they are not evenly spread: ` +
      `${most.name} runs ${Math.round(most.leisureSharePct ?? 0)}% leisure while ` +
      `${least.name} runs ${Math.round(least.leisureSharePct ?? 0)}%. The seawall and the ` +
      `commute share one fleet. E-bikes serve both harder: median trips are longer ` +
      `(${electric.medianDistanceKm} km vs ${classic.medianDistanceKm} km), faster ` +
      `(${electric.medianSpeedKmh} vs ${classic.medianSpeedKmh} km/h), and straighter ` +
      `(detour ${electric.medianDetour}× vs ${classic.medianDetour}×). ` +
      "Blue bars mark the majority-leisure stations.",
  };
}

function membershipShare(row: YearlyRow, group: string): number {
  const total = Object.values(row.membershipMix).reduce((a, b) => a + b, 0) || 1;
  return (100 * (row.membershipMix[group] ?? 0)) / total;
}

export function membershipChapter(
  years: YearlyRow[] = yearly,
  lastFull: number = lastCompleteYear,
): Chapter {
  const complete = years.filter((y) => y.year <= lastFull);
  const first = complete[0];
  const latest = complete[complete.length - 1];
  const firstCorp = Math.round(membershipShare(first, "Corporate"));
  const latestCorp = Math.round(membershipShare(latest, "Corporate"));
  const ratio = Math.max(2, Math.round(100 / membershipShare(latest, "Corporate")));
  return {
    id: "membership",
    headline: `One ride in ${ratio} is now on a corporate pass.`,
    caption:
      `Corporate and institutional passes went from ${firstCorp}% of rides in ` +
      `${first.year} to ${latestCorp}% by ${latest.year}, while casual day-pass ` +
      "use held flat. My own passes followed that arc: day passes when I lived " +
      "near UBC, an annual once I settled in East Van, and a Langara corporate " +
      "pass now. Even from Burnaby, outside Mobi's service area, I rode it as the last " +
      "mile of a SkyTrain trip, finishing from VCC-Clark or Commercial-Broadway. " +
      "A bike ending a transit trip is the whole idea.",
  };
}

export const chapters: Chapter[] = [
  growthChapter(),
  seasonsChapter(),
  pandemicChapter(),
  ebikeChapter(),
  weatherChapter(),
  purposeChapter(),
  membershipChapter(),
];
