import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import type { Feature, FeatureCollection } from "geojson";
import "maplibre-gl/dist/maplibre-gl.css";
import { MapSkeleton } from "@/components/Skeletons";
import { useTheme, type Theme } from "@/lib/theme";
import { DOCKED_TRANSIT_RADIUS_M, stationsArtifact, transitCoverage } from "@/data";

type ColorMode = "score" | "leisure" | "coverage";

type InteractiveMapProps = {
  selectedStationId?: string | null;
  onStationSelect?: (stationId: string) => void;
  year?: string; // "t12" or a four-digit year
  maxTransitM?: number | null;
  colorMode?: ColorMode;
};

// In coverage mode the Mobi dots dim to context; the transit marks carry the
// story instead.
const OPACITY_EXPRESSIONS: Record<ColorMode, unknown> = {
  score: ["+", 0.3, ["*", 0.007, ["get", "score"]]],
  leisure: ["+", 0.15, ["*", 0.0085, ["get", "leisure"]]],
  coverage: 0.12,
};

const coveredByName = new Map(
  transitCoverage.map((t) => [t.name, t.nearestDockM <= DOCKED_TRANSIT_RADIUS_M ? 1 : 0]),
);

// Basemap and mark colors per theme (spec 038): OpenFreeMap serves a dark
// sibling of positron, and the marks use the portfolio accent/ink with a
// paper-toned halo so dots read against either basemap.
const MAP_STYLES: Record<Theme, string> = {
  light: "https://tiles.openfreemap.org/styles/positron",
  dark: "https://tiles.openfreemap.org/styles/dark",
};

const MAP_COLORS: Record<
  Theme,
  { accent: string; ink: string; halo: string; label: string }
> = {
  light: { accent: "#196ea9", ink: "#090e11", halo: "#f7f9fb", label: "#636a6f" },
  dark: { accent: "#5fa5de", ink: "#ededed", halo: "#0b0b0b", label: "#959595" },
};

const maxTrips = Math.max(
  ...stationsArtifact.stations.map((s) => s.trailing12.trips),
);

function stationFeatures(year = "t12", maxTransitM: number | null = null): FeatureCollection {
  const slice = stationsArtifact.stations
    .filter((s) => (maxTransitM ? s.nearestTransit.distanceM <= maxTransitM : true))
    .map((s) => ({
      station: s,
      trips: year === "t12" ? s.trailing12.trips : (s.tripsByYear[year] ?? 0),
    }))
    .filter((entry) => entry.trips > 0);
  // Normalize radii against the stable module-level maxTrips (trailing-12 max
  // across all stations) so bubble area is comparable when switching years.
  return {
    type: "FeatureCollection",
    features: slice.map(({ station: s, trips }) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [s.lon, s.lat] },
      properties: {
        id: s.id,
        name: s.name,
        label:
          year === "t12"
            ? `${Math.round(trips / 12).toLocaleString("en-CA")} trips/month`
            : `${trips.toLocaleString("en-CA")} trips in ${year}`,
        score: s.connector.score,
        leisure: s.leisureSharePct ?? 0,
        // base radius in px at zoom 11; zoom interpolation scales it.
        // Uses module-level maxTrips (not per-year max) so sizes are
        // comparable across year selections.
        r: 2 + 6 * Math.sqrt(trips / maxTrips),
      },
    })),
  };
}

function transitFeatures(): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: stationsArtifact.transit.map((t) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [t.lon, t.lat] },
      properties: {
        name: t.name,
        line: t.line,
        covered: coveredByName.get(t.name) ?? 0,
      },
    })),
  };
}

/** Returns the ring + destination-line features for a selected station,
 *  respecting the active filters. Returns empty when:
 *  - the station is unknown,
 *  - its nearest-transit distance exceeds maxTransitM (transit-distance filter),
 *  - it has 0 trips in the selected year (year filter). */
function selectionFeatures(
  stationId: string | null | undefined,
  year = "t12",
  maxTransitM: number | null = null,
): FeatureCollection {
  const empty: FeatureCollection = { type: "FeatureCollection", features: [] };
  const station = stationsArtifact.stations.find((s) => s.id === stationId);
  if (!station) return empty;

  // Suppress when the station falls outside the active transit-distance filter.
  if (maxTransitM !== null && station.nearestTransit.distanceM > maxTransitM) return empty;

  // Suppress when the station has no trips in the selected year.
  const trips = year === "t12" ? station.trailing12.trips : (station.tripsByYear[year] ?? 0);
  if (trips === 0) return empty;

  const byId = new Map(stationsArtifact.stations.map((s) => [s.id, s]));
  const lines: Feature[] = station.trailing12.topDestinations
    .map((d) => byId.get(d.id))
    .filter((d): d is NonNullable<typeof d> => Boolean(d))
    .map((d) => ({
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [station.lon, station.lat],
          [d.lon, d.lat],
        ],
      },
      properties: {},
    }));
  return {
    type: "FeatureCollection",
    features: [
      ...lines,
      {
        type: "Feature",
        geometry: { type: "Point", coordinates: [station.lon, station.lat] },
        properties: { r: 2 + 6 * Math.sqrt(station.trailing12.trips / maxTrips) },
      },
    ],
  };
}

export default function InteractiveMap({
  selectedStationId,
  onStationSelect,
  year = "t12",
  maxTransitM = null,
  colorMode = "score",
}: InteractiveMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const loadedRef = useRef(false);
  const [loaded, setLoaded] = useState(false);
  const onSelectRef = useRef(onStationSelect);
  onSelectRef.current = onStationSelect;
  const theme = useTheme();
  // A theme flip rebuilds the map with the other basemap; carry the camera
  // across so the viewer doesn't lose their place.
  const cameraRef = useRef<{ center: maplibregl.LngLatLike; zoom: number } | null>(null);

  const testMode = import.meta.env.MODE === "test";

  useEffect(() => {
    if (testMode || !containerRef.current) return;

    const colors = MAP_COLORS[theme];
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLES[theme],
      center: cameraRef.current?.center ?? [-123.125, 49.269],
      zoom: cameraRef.current?.zoom ?? 11.4,
      minZoom: 9.5,
      maxZoom: 17.5,
      maxBounds: [
        [-123.45, 49.1],
        [-122.85, 49.42],
      ],
      cooperativeGestures: true,
      attributionControl: { compact: true },
      // Cap the WebGL backing store at 2× on retina phones (dpr 3): a 3× map
      // canvas is the single largest surface on the page and needlessly
      // pressures iOS Safari's memory, which it answers by dropping canvases.
      pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
    });
    mapRef.current = map;
    map.on("moveend", () => {
      cameraRef.current = { center: map.getCenter(), zoom: map.getZoom() };
    });
    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "top-right",
    );

    const popup = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 12,
      className: "station-popup",
    });

    map.on("load", () => {
      map.addSource("stations", { type: "geojson", data: stationFeatures() });
      map.addSource("transit", { type: "geojson", data: transitFeatures() });
      map.addSource("selection", {
        type: "geojson",
        data: selectionFeatures(selectedStationId, year, maxTransitM),
      });

      map.addLayer({
        id: "selection-lines",
        type: "line",
        source: "selection",
        filter: ["==", ["geometry-type"], "LineString"],
        paint: {
          "line-color": colors.accent,
          "line-width": 1.5,
          "line-opacity": 0.55,
        },
      });

      map.addLayer({
        id: "transit-dots",
        type: "circle",
        source: "transit",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 3, 15, 6],
          "circle-color": colors.ink,
          "circle-stroke-color": colors.halo,
          "circle-stroke-width": 1.5,
        },
      });

      map.addLayer({
        id: "transit-labels",
        type: "symbol",
        source: "transit",
        minzoom: 12,
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["Noto Sans Regular"],
          "text-size": 11,
          "text-offset": [0, 1.1],
          "text-anchor": "top",
        },
        paint: {
          "text-color": colors.label,
          "text-halo-color": colors.halo,
          "text-halo-width": 1.2,
        },
      });

      map.addLayer({
        id: "stations",
        type: "circle",
        source: "stations",
        paint: {
          "circle-radius": [
            "interpolate", ["linear"], ["zoom"],
            10, ["*", 0.8, ["get", "r"]],
            13, ["*", 1.6, ["get", "r"]],
            16, ["*", 3.2, ["get", "r"]],
          ],
          "circle-color": colors.accent,
          "circle-opacity": ["+", 0.3, ["*", 0.007, ["get", "score"]]],
          "circle-stroke-color": colors.halo,
          "circle-stroke-width": 1,
        },
      });

      map.addLayer({
        id: "selection-ring",
        type: "circle",
        source: "selection",
        filter: ["==", ["geometry-type"], "Point"],
        paint: {
          "circle-radius": [
            "interpolate", ["linear"], ["zoom"],
            10, ["+", 4, ["*", 0.8, ["get", "r"]]],
            13, ["+", 5, ["*", 1.6, ["get", "r"]]],
            16, ["+", 6, ["*", 3.2, ["get", "r"]]],
          ],
          "circle-color": "transparent",
          "circle-stroke-color": colors.ink,
          "circle-stroke-width": 2,
        },
      });

      map.on("click", "stations", (event) => {
        const feature = event.features?.[0];
        if (feature?.properties?.id) {
          onSelectRef.current?.(String(feature.properties.id));
        }
      });
      map.on("mouseenter", "stations", (event) => {
        map.getCanvas().style.cursor = "pointer";
        const feature = event.features?.[0];
        if (!feature || feature.geometry.type !== "Point") return;
        const props = feature.properties as {
          name: string; label: string; score: number; leisure: number;
        };
        popup
          .setLngLat(feature.geometry.coordinates as [number, number])
          .setHTML(
            `<strong>${props.name}</strong><br/>${props.label} · score ${props.score}` +
              (props.leisure ? ` · ${Math.round(props.leisure)}% leisure` : ""),
          )
          .addTo(map);
      });
      map.on("mouseleave", "stations", () => {
        map.getCanvas().style.cursor = "";
        popup.remove();
      });

      loadedRef.current = true;
      setLoaded(true);
    });

    return () => {
      loadedRef.current = false;
      setLoaded(false);
      mapRef.current = null;
      map.remove();
    };
    // The map initializes once per theme (the basemap style is a constructor
    // concern); selection updates flow through the effect below via the
    // "selection" source, and the camera survives in cameraRef.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testMode, theme]);

  // Filter changes re-render the station slice without touching the camera.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded) return;
    const source = map.getSource("stations") as maplibregl.GeoJSONSource | undefined;
    source?.setData(stationFeatures(year, maxTransitM));
  }, [year, maxTransitM, loaded]);

  // Recolor without re-creating data. Score/leisure modulate the Mobi dots;
  // coverage dims them and re-marks the transit stops instead: filled when a
  // dock sits within walking range, accent-ringed when the nearest dock is
  // over a kilometre away (labels for those show at every zoom).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded) return;
    const colors = MAP_COLORS[theme];
    const coverage = colorMode === "coverage";
    const isCovered = ["==", ["get", "covered"], 1];
    map.setPaintProperty(
      "stations",
      "circle-opacity",
      OPACITY_EXPRESSIONS[colorMode] as never,
    );
    map.setPaintProperty(
      "transit-dots",
      "circle-color",
      (coverage ? ["case", isCovered, colors.ink, "transparent"] : colors.ink) as never,
    );
    map.setPaintProperty(
      "transit-dots",
      "circle-stroke-color",
      (coverage ? ["case", isCovered, colors.halo, colors.accent] : colors.halo) as never,
    );
    map.setPaintProperty(
      "transit-dots",
      "circle-stroke-width",
      (coverage ? ["case", isCovered, 1.5, 2.5] : 1.5) as never,
    );
    map.setPaintProperty(
      "transit-dots",
      "circle-radius",
      (coverage
        ? ["interpolate", ["linear"], ["zoom"],
            10, ["case", isCovered, 3, 6],
            15, ["case", isCovered, 6, 11]]
        : ["interpolate", ["linear"], ["zoom"], 10, 3, 15, 6]) as never,
    );
    map.setFilter("transit-labels", (coverage ? ["!", isCovered] : null) as never);
    map.setLayerZoomRange("transit-labels", coverage ? 0 : 12, 24);
  }, [colorMode, loaded, theme]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    const source = map.getSource("selection") as maplibregl.GeoJSONSource | undefined;
    source?.setData(selectionFeatures(selectedStationId, year, maxTransitM));
    // Only pan to the station when it is still visible in the active slice.
    const features = selectionFeatures(selectedStationId, year, maxTransitM);
    const inSlice = features.features.length > 0;
    if (inSlice) {
      const station = stationsArtifact.stations.find((s) => s.id === selectedStationId);
      if (station) {
        map.easeTo({
          center: [station.lon, station.lat],
          zoom: Math.max(map.getZoom(), 13),
          duration: 600,
        });
      }
    }
  }, [selectedStationId, year, maxTransitM]);

  if (testMode) {
    return (
      <div
        role="img"
        aria-label="Interactive map of Mobi stations"
        className="flex h-[560px] items-center justify-center rounded-lg border border-border text-sm text-muted-foreground"
      >
        Interactive map of Mobi stations
      </div>
    );
  }

  const legendLabel =
    colorMode === "score"
      ? "Blue intensity = transit-connector score (0–100)"
      : colorMode === "leisure"
        ? "Blue intensity = leisure share (%)"
        : "Transit stations: filled = Mobi dock within 500 m, blue ring = no dock within 1 km";

  return (
    <div className="relative h-[560px]">
      <div
        ref={containerRef}
        role="application"
        aria-label="Interactive map of Mobi stations and rapid transit in Vancouver. Pointer-primary — use the station search above to select a station with keyboard or assistive technology."
        className="h-full overflow-hidden rounded-lg border border-border"
      />
      {/* Ghost map until MapLibre finishes its first paint, so a slow tile
          fetch shows the map's shape rather than an empty panel. */}
      {!loaded && (
        <div className="absolute inset-0 overflow-hidden rounded-lg border border-border">
          <MapSkeleton />
        </div>
      )}
      {/* Compact corner legend: dot size = trip volume, blue intensity = active colour mode */}
      {loaded && (
        <div
          aria-label={`Map legend: dot size reflects trip volume. ${legendLabel}.`}
          className="pointer-events-none absolute bottom-8 left-3 rounded-lg border border-border bg-background/90 px-3 py-2 backdrop-blur-sm"
        >
          {colorMode === "coverage" ? (
            <>
              <p className="text-[10px] leading-relaxed text-muted-foreground">
                <span className="font-medium text-foreground">●</span> Station — dock within 500 m
              </p>
              <p className="text-[10px] leading-relaxed text-muted-foreground">
                <span className="font-medium text-primary">◌</span> Station — no dock within 1 km
              </p>
            </>
          ) : (
            <>
              <p className="text-[10px] leading-relaxed text-muted-foreground">
                <span className="font-medium text-foreground">●</span> Size — trip volume
              </p>
              <p className="text-[10px] leading-relaxed text-muted-foreground">
                <span className="font-medium text-foreground">◉</span> Blue — {colorMode === "score" ? "transit score (0–100)" : "leisure share (%)"}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
