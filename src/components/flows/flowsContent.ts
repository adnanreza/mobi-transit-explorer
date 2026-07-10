// Pure derivations for the Flows section — everything the UI displays comes
// through these functions so tests can drive them with fixtures.

import type { FlowsArtifact, StationFlows } from "@/data/contracts";
import { flows as defaultFlows, stationsArtifact } from "@/data";

const nameById = new Map(stationsArtifact.stations.map((s) => [s.id, s.name]));

export type RankedStation = {
  id: string;
  name: string;
  bikesPerDay: number; // net gained (importers) or shed (exporters) per day
};

function windowNet(station: StationFlows, from: number, to: number): number {
  let net = 0;
  for (let hour = from; hour <= to; hour += 1) {
    net += station.weekday.ret[hour] - station.weekday.dep[hour];
  }
  return net;
}

// Stations that fill up on weekday mornings (7:00-10:59): commute sinks.
export function morningImporters(
  artifact: FlowsArtifact = defaultFlows,
  count = 5,
): RankedStation[] {
  return [...artifact.stations]
    .map((s) => ({
      id: s.id,
      name: nameById.get(s.id) ?? s.id,
      bikesPerDay:
        Math.round((windowNet(s, 7, 10) / Math.max(artifact.weekdayCount, 1)) * 10) / 10,
    }))
    .sort((a, b) => b.bikesPerDay - a.bikesPerDay)
    .slice(0, count);
}

// Stations that drain on weekday evenings (16:00-19:59): the ride home.
export function eveningExporters(
  artifact: FlowsArtifact = defaultFlows,
  count = 5,
): RankedStation[] {
  return [...artifact.stations]
    .map((s) => ({
      id: s.id,
      name: nameById.get(s.id) ?? s.id,
      bikesPerDay:
        Math.round((-windowNet(s, 16, 19) / Math.max(artifact.weekdayCount, 1)) * 10) / 10,
    }))
    .sort((a, b) => b.bikesPerDay - a.bikesPerDay)
    .slice(0, count);
}

export type DayType = "weekday" | "weekend";

// Per-day average departures/returns by hour for one station.
export function stationDayProfile(
  stationId: string,
  dayType: DayType,
  artifact: FlowsArtifact = defaultFlows,
): { dep: number[]; ret: number[] } | null {
  const station = artifact.stations.find((s) => s.id === stationId);
  if (!station) return null;
  const days = Math.max(
    dayType === "weekday" ? artifact.weekdayCount : artifact.weekendCount,
    1,
  );
  const profile = station[dayType];
  return {
    dep: profile.dep.map((v) => Math.round((v / days) * 10) / 10),
    ret: profile.ret.map((v) => Math.round((v / days) * 10) / 10),
  };
}

export function stationBalance(
  stationId: string,
  artifact: FlowsArtifact = defaultFlows,
): StationFlows | null {
  return artifact.stations.find((s) => s.id === stationId) ?? null;
}
