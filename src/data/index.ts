// The single import path for app data. Canonical data is the pipeline-
// generated JSON in ./generated; the Mobi* adapters below derive the legacy
// component shapes (percent map positions, labels, buckets) from it until
// specs 021-024 rebuild those components on the generated types directly.

import type {
  FlowsArtifact,
  ForecastArtifact,
  GeneratedOpportunity,
  GeneratedStation,
  HourlyRow,
  Meta,
  MonthlyRow,
  SeasonalityRow,
  StationsArtifact,
  WeatherRow,
  YearlyRow,
} from "@/data/contracts";
import type {
  MobiStation,
  Opportunity,
  OpportunityType,
  OverviewMetric,
  PriorityLevel,
  StationLabel,
  TransitNode,
} from "@/types";
import metaJson from "@/data/generated/meta.json";
import yearlyJson from "@/data/generated/yearly.json";
import monthlyJson from "@/data/generated/monthly.json";
import seasonalityJson from "@/data/generated/seasonality.json";
import hourlyJson from "@/data/generated/hourly.json";
import weatherJson from "@/data/generated/weather.json";
import stationsJson from "@/data/generated/stations.json";
import opportunitiesJson from "@/data/generated/opportunities.json";
import flowsJson from "@/data/generated/flows.json";
import forecastJson from "@/data/generated/forecast.json";

export const meta = metaJson as Meta;
export const yearly = yearlyJson as YearlyRow[];
export const monthly = monthlyJson as MonthlyRow[];
export const seasonality = seasonalityJson as SeasonalityRow[];
export const hourly = hourlyJson as HourlyRow[];
export const weather = weatherJson as WeatherRow[];
export const stationsArtifact = stationsJson as StationsArtifact;
export const generatedOpportunities =
  opportunitiesJson as unknown as GeneratedOpportunity[];
export const flows = flowsJson as FlowsArtifact;
export const forecast = forecastJson as ForecastArtifact;

export const lastCompleteYear = Math.max(
  ...yearly.filter((y) => `${y.year}` !== meta.sourceWindow.lastMonth.slice(0, 4)).map((y) => y.year),
);

// Station x/y use the shared real-geometry projection (viewBox units) so
// every map layer stays geographically consistent.
import { project } from "@/lib/projection";

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// --- transit nodes

export const transitNodes: TransitNode[] = stationsArtifact.transit.map((t) => ({
  id: slug(t.name),
  name: t.name,
  mode: t.line === "Canada Line" ? "Canada Line" : "SkyTrain",
  area: t.area ?? "",
  ...project(t.lat, t.lon),
  dailyBoardings: 0, // no public per-station boarding feed; not displayed
}));

// --- station adapter

function stationLabel(s: GeneratedStation): StationLabel {
  const ebike = s.trailing12.ebikeSharePct ?? 0;
  if (s.connector.score >= 80) return "Strong connector";
  if (s.nearestTransit.distanceM <= 300 && s.connector.score < 70)
    return "Underused near transit";
  if (s.trailing12.commuteSharePct >= 30 && ebike <= 30) return "E-bike opportunity";
  if (s.trailing12.weekendSharePct >= 50) return "Recreation-heavy";
  return "Expansion opportunity";
}

function completeYearTrend(s: GeneratedStation): number[] {
  return Object.entries(s.tripsByYear)
    .filter(([year]) => Number(year) <= lastCompleteYear)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([, trips]) => trips);
}

const tripCounts = stationsArtifact.stations
  .map((s) => s.trailing12.trips)
  .sort((a, b) => a - b);
const tercile = (q: number) => tripCounts[Math.floor(q * (tripCounts.length - 1))];
const [volumeT1, volumeT2] = [tercile(1 / 3), tercile(2 / 3)];

function toMobiStation(s: GeneratedStation): MobiStation {
  const ebikeShare = Math.round(s.trailing12.ebikeSharePct ?? 0);
  return {
    id: s.id,
    name: s.name,
    sourceStationName: s.fullName,
    area: `${s.nearestTransit.distanceM.toLocaleString("en-CA")} m to ${s.nearestTransit.name}`,
    ...project(s.lat, s.lon),
    nearbyTransitNode: slug(s.nearestTransit.name),
    connectorScore: s.connector.score,
    monthlyTrips: Math.round(s.trailing12.trips / 12),
    // proximity index from real distance (0-100); panel copy is revised in 022
    tripsNearTransitPercentage: s.connector.components.transitProximity,
    ebikeShare,
    label: stationLabel(s),
    topDestinations: s.trailing12.topDestinations.slice(0, 3).map((d) => d.name),
    tripVolume:
      s.trailing12.trips >= volumeT2 ? "High" : s.trailing12.trips >= volumeT1 ? "Medium" : "Low",
    commuteStrength:
      s.trailing12.commuteSharePct >= 35
        ? "High"
        : s.trailing12.commuteSharePct >= 22
          ? "Medium"
          : "Low",
    bikeTypeSplit: { classic: 100 - ebikeShare, ebike: ebikeShare },
    trend: completeYearTrend(s),
    connectorScoreComponents: {
      transitProximity: s.connector.components.transitProximity,
      tripVolume: s.connector.components.tripVolume,
      commutePattern: s.connector.components.commutePattern,
      ebikeShare: s.connector.components.ebikeShare,
      stationConnectivity: s.connector.components.destinationDiversity,
    },
  };
}

export const stationsAll: MobiStation[] = stationsArtifact.stations.map(toMobiStation);

// Convenience slice of the busiest stations (kept for chart-style consumers).
export const stations: MobiStation[] = stationsAll.slice(0, 40);

// --- opportunities adapter

const stationById = new Map(stationsAll.map((s) => [s.id, s]));

function opportunityReason(o: GeneratedOpportunity): string {
  const e = o.evidence;
  switch (o.rule) {
    case "dock-capacity-pressure":
      return `${e.tripsPerDockDay} departures per dock per day over the last 12 months vs a network median of ${e.networkMedian} — ${Number(e.trips).toLocaleString("en-CA")} trips across ${e.capacity} docks.`;
    case "ebike-gap":
      return `Commute share of ${e.commuteSharePct}% is in the network's top quartile, but e-bike share is only ${e.ebikeSharePct}% (bottom quartile is ${e.ebikeP25}%).`;
    case "transit-connector-gap":
      return `${e.nearestTransitM} m from ${e.nearestTransit} with ${Number(e.trips).toLocaleString("en-CA")} trips in 12 months, yet a connector score of ${e.connectorScore}.`;
    case "seasonal-underuse":
      return `${e.weekendSharePct}% of ${Number(e.trips).toLocaleString("en-CA")} trips happen on weekends — leisure-pattern demand worth monitoring for seasonality.`;
  }
}

export const opportunities: Opportunity[] = generatedOpportunities.map((o) => ({
  rank: o.rank,
  stationId: o.stationId,
  area: stationById.get(o.stationId)?.area ?? o.stationName,
  type: o.type as OpportunityType,
  reason: opportunityReason(o),
  priority: o.priority as PriorityLevel,
}));

// --- overview metrics

export const overviewMetrics: OverviewMetric[] = [
  {
    id: "trips-analyzed",
    label: "Trips analyzed",
    value: meta.totals.trips.toLocaleString("en-CA"),
    caption: "Rider trips kept after cleaning, deduplication, and flag rules.",
    context: `2017 – ${meta.sourceWindow.lastMonth}`,
  },
  {
    id: "distance-ridden",
    label: "Distance ridden",
    value: `${(meta.totals.distanceKm / 1e6).toFixed(1)}M km`,
    caption: "Total covered distance recorded across all rider trips.",
    context: `${meta.totals.years} years`,
  },
  {
    id: "active-stations",
    label: "Active stations",
    value: String(meta.totals.activeStations),
    caption: "Stations with trips in the last six months and GBFS coordinates.",
    context: "GBFS-matched",
  },
  {
    id: "ebike-share",
    label: "E-bike share",
    value:
      meta.totals.ebikeSharePctLatestYear !== null
        ? `${Math.round(meta.totals.ebikeSharePctLatestYear)}%`
        : "—",
    caption: "Share of trips on electric bikes in the current year to date.",
    context: meta.sourceWindow.lastMonth.slice(0, 4),
  },
];
