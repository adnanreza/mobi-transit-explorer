import type { OverviewMetric } from "@/types";
import { stations } from "@/data/stations";

const totalTrips = stations.reduce((sum, station) => sum + station.monthlyTrips, 0);
const weightedTransitTrips = stations.reduce(
  (sum, station) =>
    sum + station.monthlyTrips * (station.tripsNearTransitPercentage / 100),
  0,
);
const strongConnectorCount = stations.filter(
  (station) => station.connectorScore >= 85,
).length;
const expansionOpportunityCount = stations.filter(
  (station) =>
    station.label === "Expansion opportunity" ||
    station.label === "E-bike opportunity" ||
    station.label === "Underused near transit",
).length;

export const overviewMetrics: OverviewMetric[] = [
  {
    id: "trips-analyzed",
    label: "Trips analyzed",
    value: totalTrips.toLocaleString("en-CA"),
    caption: "Sample monthly trips across the MVP station set.",
    context: "Mock MVP",
  },
  {
    id: "trips-near-transit",
    label: "Trips near transit",
    value: `${Math.round((weightedTransitTrips / totalTrips) * 100)}%`,
    caption: "Weighted share of sample trips connected to nearby transit.",
    context: "300m sample",
  },
  {
    id: "strong-connectors",
    label: "Strong connector stations",
    value: String(strongConnectorCount),
    caption: "Stations with connector scores of 85 or higher.",
    context: "High score",
  },
  {
    id: "expansion-opportunities",
    label: "Expansion opportunities",
    value: String(expansionOpportunityCount),
    caption: "Stations flagged for capacity, e-bike, or activation work.",
    context: "Ranked next",
  },
];
