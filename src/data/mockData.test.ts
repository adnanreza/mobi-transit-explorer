import { opportunities } from "@/data/opportunities";
import { overviewMetrics } from "@/data/metrics";
import { stations } from "@/data/stations";
import { transitNodes } from "@/data/transitNodes";

const requiredTransitNodes = [
  "Waterfront",
  "Commercial-Broadway",
  "Olympic Village",
  "VCC-Clark",
  "Main Street-Science World",
  "Yaletown-Roundhouse",
  "Broadway-City Hall",
];

describe("mock data layer", () => {
  it("has stations and transit nodes", () => {
    expect(stations).not.toHaveLength(0);
    expect(transitNodes).not.toHaveLength(0);
    expect(stations.length).toBeGreaterThanOrEqual(10);
    expect(stations.length).toBeLessThanOrEqual(15);
  });

  it("includes the required transit nodes", () => {
    const names = transitNodes.map((node) => node.name);

    for (const nodeName of requiredTransitNodes) {
      expect(names).toContain(nodeName);
    }
  });

  it("defines required station fields", () => {
    for (const station of stations) {
      expect(station.id).toBeTruthy();
      expect(station.name).toBeTruthy();
      expect(station.area).toBeTruthy();
      expect(station.x).toEqual(expect.any(Number));
      expect(station.y).toEqual(expect.any(Number));
      expect(station.nearbyTransitNode).toBeTruthy();
      expect(station.connectorScore).toEqual(expect.any(Number));
      expect(station.monthlyTrips).toBeGreaterThan(0);
      expect(station.tripsNearTransitPercentage).toEqual(expect.any(Number));
      expect(station.ebikeShare).toEqual(expect.any(Number));
      expect(station.label).toBeTruthy();
      expect(station.topDestinations.length).toBeGreaterThan(0);
      expect(station.tripVolume).toBeTruthy();
      expect(station.commuteStrength).toBeTruthy();
      expect(Array.isArray(station.trend)).toBe(true);
      expect(station.trend).toHaveLength(7);
    }
  });

  it("keeps connector and percentage values within expected ranges", () => {
    for (const station of stations) {
      expect(station.connectorScore).toBeGreaterThanOrEqual(0);
      expect(station.connectorScore).toBeLessThanOrEqual(100);
      expect(station.tripsNearTransitPercentage).toBeGreaterThanOrEqual(0);
      expect(station.tripsNearTransitPercentage).toBeLessThanOrEqual(100);
      expect(station.ebikeShare).toBeGreaterThanOrEqual(0);
      expect(station.ebikeShare).toBeLessThanOrEqual(100);
      expect(station.bikeTypeSplit.classic + station.bikeTypeSplit.ebike).toBe(100);
    }
  });

  it("defines ranked opportunity data", () => {
    expect(opportunities).not.toHaveLength(0);

    for (const opportunity of opportunities) {
      expect(opportunity.rank).toBeGreaterThan(0);
      expect(opportunity.type).toBeTruthy();
      expect(opportunity.reason).toBeTruthy();
      expect(opportunity.priority).toMatch(/High|Medium|Low/);
    }
  });

  it("defines overview metrics from station data", () => {
    expect(overviewMetrics).toHaveLength(4);

    for (const metric of overviewMetrics) {
      expect(metric.label).toBeTruthy();
      expect(metric.value).toBeTruthy();
      expect(metric.caption).toBeTruthy();
    }
  });
});
