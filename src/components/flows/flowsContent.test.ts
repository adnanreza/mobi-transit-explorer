import {
  eveningExporters,
  morningImporters,
  stationDayProfile,
} from "@/components/flows/flowsContent";
import { flows } from "@/data";
import type { FlowsArtifact, StationFlows } from "@/data/contracts";

function station(id: string, overrides: Partial<StationFlows> = {}): StationFlows {
  const zeros = () => ({ dep: Array(24).fill(0), ret: Array(24).fill(0) });
  return {
    id,
    avgDailyNet: 0,
    avgAbsDailyNet: 0,
    avgPeakSwing: 0,
    weekday: zeros(),
    weekend: zeros(),
    ...overrides,
  };
}

function fixtureArtifact(): FlowsArtifact {
  const office = station("0001");
  office.weekday.ret[8] = 200; // 200 arrivals at 8am over 100 weekdays
  office.weekday.dep[17] = 150; // 150 departures at 5pm
  const home = station("0002");
  home.weekday.dep[8] = 120;
  home.weekday.ret[18] = 90;
  return {
    networkDailyRebalancing: 42,
    weekdayCount: 100,
    weekendCount: 40,
    stations: [office, home],
  };
}

describe("flowsContent", () => {
  it("ranks morning importers by per-weekday net gain", () => {
    const [top] = morningImporters(fixtureArtifact(), 1);
    expect(top.id).toBe("0001");
    expect(top.bikesPerDay).toBe(2); // +200 over 100 weekdays
  });

  it("ranks evening exporters by per-weekday net loss", () => {
    const [top] = eveningExporters(fixtureArtifact(), 1);
    expect(top.id).toBe("0001");
    expect(top.bikesPerDay).toBe(1.5); // -150 at 17:00 over 100 weekdays
  });

  it("returns per-day averaged profiles", () => {
    const profile = stationDayProfile("0001", "weekday", fixtureArtifact());
    expect(profile?.ret[8]).toBe(2);
    expect(profile?.dep[17]).toBe(1.5);
    expect(stationDayProfile("missing", "weekday", fixtureArtifact())).toBeNull();
  });

  it("real artifact produces plausible rankings", () => {
    const importers = morningImporters(flows);
    expect(importers).toHaveLength(5);
    expect(importers[0].bikesPerDay).toBeGreaterThan(1);
    for (const row of importers) {
      expect(row.name.length).toBeGreaterThan(2);
    }
  });
});
