import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import type { Feature, FeatureCollection } from "geojson";
import "maplibre-gl/dist/maplibre-gl.css";
import { MapSkeleton } from "@/components/Skeletons";
import { stationsArtifact } from "@/data";

type InteractiveMapProps = {
  selectedStationId?: string | null;
  onStationSelect?: (stationId: string) => void;
  year?: string; // "t12" or a four-digit year
  maxTransitM?: number | null;
  colorMode?: "score" | "leisure";
};

const OPACITY_EXPRESSIONS: Record<"score" | "leisure", unknown> = {
  score: ["+", 0.3, ["*", 0.007, ["get", "score"]]],
  leisure: ["+", 0.15, ["*", 0.0085, ["get", "leisure"]]],
};

const MOBI_BLUE = "#008fd3";
const INK = "#0f172a";

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
  const sliceMax = Math.max(1, ...slice.map((entry) => entry.trips));
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
        // base radius in px at zoom 11; zoom interpolation scales it
        r: 2 + 6 * Math.sqrt(trips / sliceMax),
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
      properties: { name: t.name, line: t.line },
    })),
  };
}

function selectionFeatures(stationId: string | null | undefined): FeatureCollection {
  const station = stationsArtifact.stations.find((s) => s.id === stationId);
  if (!station) return { type: "FeatureCollection", features: [] };
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

  const testMode = import.meta.env.MODE === "test";

  useEffect(() => {
    if (testMode || !containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://tiles.openfreemap.org/styles/positron",
      center: [-123.125, 49.269],
      zoom: 11.4,
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
        data: selectionFeatures(selectedStationId),
      });

      map.addLayer({
        id: "selection-lines",
        type: "line",
        source: "selection",
        filter: ["==", ["geometry-type"], "LineString"],
        paint: {
          "line-color": MOBI_BLUE,
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
          "circle-color": INK,
          "circle-stroke-color": "#ffffff",
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
          "text-color": "#475569",
          "text-halo-color": "#ffffff",
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
          "circle-color": MOBI_BLUE,
          "circle-opacity": ["+", 0.3, ["*", 0.007, ["get", "score"]]],
          "circle-stroke-color": "#ffffff",
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
          "circle-stroke-color": INK,
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
    // The map initializes exactly once; selection updates flow through the
    // effect below via the "selection" source.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testMode]);

  // Filter changes re-render the station slice without touching the camera.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded) return;
    const source = map.getSource("stations") as maplibregl.GeoJSONSource | undefined;
    source?.setData(stationFeatures(year, maxTransitM));
  }, [year, maxTransitM, loaded]);

  // Recolor without re-creating data: blue intensity = connector score or
  // leisure share, depending on the mode.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded) return;
    map.setPaintProperty(
      "stations",
      "circle-opacity",
      OPACITY_EXPRESSIONS[colorMode] as never,
    );
  }, [colorMode, loaded]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    const source = map.getSource("selection") as maplibregl.GeoJSONSource | undefined;
    source?.setData(selectionFeatures(selectedStationId));
    const station = stationsArtifact.stations.find((s) => s.id === selectedStationId);
    if (station) {
      map.easeTo({
        center: [station.lon, station.lat],
        zoom: Math.max(map.getZoom(), 13),
        duration: 600,
      });
    }
  }, [selectedStationId]);

  if (testMode) {
    return (
      <div
        role="img"
        aria-label="Interactive map of Mobi stations"
        className="flex h-[560px] items-center justify-center rounded-xl border border-border text-sm text-muted-foreground"
      >
        Interactive map of Mobi stations
      </div>
    );
  }

  return (
    <div className="relative h-[560px]">
      <div
        ref={containerRef}
        role="application"
        aria-label="Interactive map of Mobi stations and rapid transit in Vancouver"
        className="h-full overflow-hidden rounded-xl border border-border"
      />
      {/* Ghost map until MapLibre finishes its first paint, so a slow tile
          fetch shows the map's shape rather than an empty panel. */}
      {!loaded && (
        <div className="absolute inset-0 overflow-hidden rounded-xl border border-border">
          <MapSkeleton />
        </div>
      )}
    </div>
  );
}
