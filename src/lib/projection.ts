// The single lat/lon -> viewBox projection shared by every map layer, so
// stations, transit markers, and land geometry can never drift apart.
// Equirectangular with the longitude axis scaled by cos(mean latitude) -
// deterministic and accurate to well under a station-dot at city scale.

import stationsJson from "@/data/generated/stations.json";

const stationPoints = (stationsJson as { stations: Array<{ lat: number; lon: number }> })
  .stations;

const PAD_DEG = 0.006;
// Always include the whole Stanley Park peninsula: the seawall shape is the
// most recognizable part of the map even where no station sits on it.
const STANLEY_PARK_NORTH = 49.315;

const latMin = Math.min(...stationPoints.map((p) => p.lat)) - PAD_DEG;
const latMax = Math.max(
  Math.max(...stationPoints.map((p) => p.lat)) + PAD_DEG,
  STANLEY_PARK_NORTH,
);
const lonMin = Math.min(...stationPoints.map((p) => p.lon)) - PAD_DEG;
const lonMax = Math.max(...stationPoints.map((p) => p.lon)) + PAD_DEG;

const meanLatRad = ((latMin + latMax) / 2) * (Math.PI / 180);
const lonScale = Math.cos(meanLatRad);

export const VIEW_W = 100;
export const VIEW_H =
  Math.round(((latMax - latMin) / ((lonMax - lonMin) * lonScale)) * VIEW_W * 10) / 10;

export function project(lat: number, lon: number): { x: number; y: number } {
  const x = ((lon - lonMin) / (lonMax - lonMin)) * VIEW_W;
  const y = ((latMax - lat) / (latMax - latMin)) * VIEW_H;
  return { x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 };
}

export function isInsideView(lat: number, lon: number): boolean {
  return lat >= latMin && lat <= latMax && lon >= lonMin && lon <= lonMax;
}
