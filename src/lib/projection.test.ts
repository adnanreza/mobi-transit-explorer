import { isInsideView, project, VIEW_H, VIEW_W } from "@/lib/projection";

// Real Vancouver landmarks: the projection must preserve their relative
// geography or the map is lying.
const WATERFRONT = { lat: 49.2859, lon: -123.1125 };
const KITS_BEACH = { lat: 49.2727, lon: -123.1524 };
const SCIENCE_WORLD = { lat: 49.2732, lon: -123.1006 };
const YALETOWN = { lat: 49.2744, lon: -123.1219 };
const STANLEY_PARK_NORTH = { lat: 49.31, lon: -123.14 };

describe("projection", () => {
  it("has a sane landscape viewBox", () => {
    expect(VIEW_W).toBe(100);
    expect(VIEW_H).toBeGreaterThan(20);
    expect(VIEW_H).toBeLessThan(100);
  });

  it("preserves relative geography between landmarks", () => {
    const waterfront = project(WATERFRONT.lat, WATERFRONT.lon);
    const kits = project(KITS_BEACH.lat, KITS_BEACH.lon);
    const scienceWorld = project(SCIENCE_WORLD.lat, SCIENCE_WORLD.lon);
    const yaletown = project(YALETOWN.lat, YALETOWN.lon);

    // Waterfront is northeast of Kits Beach
    expect(waterfront.x).toBeGreaterThan(kits.x);
    expect(waterfront.y).toBeLessThan(kits.y);
    // Science World is east of Yaletown
    expect(scienceWorld.x).toBeGreaterThan(yaletown.x);
  });

  it("keeps the whole Stanley Park peninsula in view", () => {
    expect(isInsideView(STANLEY_PARK_NORTH.lat, STANLEY_PARK_NORTH.lon)).toBe(true);
    const p = project(STANLEY_PARK_NORTH.lat, STANLEY_PARK_NORTH.lon);
    expect(p.y).toBeGreaterThanOrEqual(0);
  });

  it("projects all landmarks inside the viewBox", () => {
    for (const landmark of [WATERFRONT, KITS_BEACH, SCIENCE_WORLD, YALETOWN]) {
      const p = project(landmark.lat, landmark.lon);
      expect(p.x).toBeGreaterThan(0);
      expect(p.x).toBeLessThan(VIEW_W);
      expect(p.y).toBeGreaterThan(0);
      expect(p.y).toBeLessThan(VIEW_H);
    }
  });
});
