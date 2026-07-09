import type { OverviewMetric } from "@/types";
import { realMobiDataSummary } from "@/data/realMobi";
import { stations } from "@/data/stations";

const totalTrips = stations.reduce((sum, station) => sum + station.monthlyTrips, 0);
const weightedTransitTrips = stations.reduce(
  (sum, station) =>
    sum + station.monthlyTrips * (station.tripsNearTransitPercentage / 100),
  0,
);
const strongConnectorCount = stations.filter(
  (station) => station.connectorScore >= 70,
).length;
const expansionOpportunityCount = stations.filter(
  (station) =>
    station.label === "Expansion opportunity" ||
    station.label === "E-bike opportunity" ||
    station.label === "Underused near transit",
).length;
const latestMonth = realMobiDataSummary.months[realMobiDataSummary.months.length - 1];
const analyzedTrips = latestMonth?.trips ?? totalTrips;

export const overviewMetrics: OverviewMetric[] = [
  {
    id: "trips-analyzed",
    label: "Trips analyzed",
    value: analyzedTrips.toLocaleString("en-CA"),
    caption: "Real trips processed from the latest Mobi public CSV.",
    context: latestMonth?.label ?? "Real CSV",
  },
  {
    id: "trips-near-transit",
    label: "Trips near transit",
    value: `${Math.round((weightedTransitTrips / totalTrips) * 100)}%`,
    caption: "Weighted share of generated station trips estimated near transit.",
    context: "Name-estimated",
  },
  {
    id: "strong-connectors",
    label: "Strong connector stations",
    value: String(strongConnectorCount),
    caption: "Real Mobi stations with connector scores of 70 or higher.",
    context: "Generated",
  },
  {
    id: "expansion-opportunities",
    label: "Expansion opportunities",
    value: String(expansionOpportunityCount),
    caption: "Stations flagged from real volume, e-bike share, and commute mix.",
    context: "Real CSV",
  },
];
