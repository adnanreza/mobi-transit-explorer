import { useMemo } from "react";
import { stations as defaultStations, stationsArtifact } from "@/data";
import landJson from "@/data/generated/geo/land.json";
import { isInsideView, project, VIEW_H, VIEW_W } from "@/lib/projection";
import type { MobiStation } from "@/types";
import { cn } from "@/lib/utils";

type MobilityMapProps = {
  stations?: MobiStation[];
  selectedStationId?: string | null;
  onStationSelect?: (station: MobiStation) => void;
};

const land = landJson as unknown as { landRing: Array<[number, number]> };

// Corridor orderings use the CoV dataset's own station spellings.
const CORRIDORS: string[][] = [
  // Expo Line
  ["Waterfront", "Burrard", "Granville", "Stadium - Chinatown",
   "Main Street - Science World", "Commercial - Broadway", "Nanaimo",
   "29th Avenue", "Joyce - Collingwood"],
  // Millennium Line
  ["VCC - Clark", "Commercial - Broadway", "Renfrew", "Rupert"],
  // Canada Line
  ["Waterfront", "Vancouver City Center", "Yaletown - Roundhouse",
   "Olympic Village", "Broadway - City Hall", "King Edward",
   "Oakridge - 41st Avenue", "Langara - 49th Avenue", "Marine Drive"],
];

const LABELED_TRANSIT = new Set(["Waterfront", "Commercial - Broadway", "VCC - Clark"]);

const WATER_LABELS = [
  { name: "Burrard Inlet", lat: 49.305, lon: -123.11 },
  { name: "English Bay", lat: 49.288, lon: -123.165 },
  { name: "False Creek", lat: 49.2695, lon: -123.128 },
];

export function MobilityMap({
  stations = defaultStations,
  selectedStationId,
  onStationSelect,
}: MobilityMapProps) {
  const landPath = useMemo(() => {
    return (
      land.landRing
        .map(([lon, lat], index) => {
          const { x, y } = project(lat, lon);
          return `${index === 0 ? "M" : "L"}${x},${y}`;
        })
        .join("") + "Z"
    );
  }, []);

  const transitByName = useMemo(
    () => new Map(stationsArtifact.transit.map((t) => [t.name, t])),
    [],
  );

  const maxTrips = useMemo(
    () => Math.max(...stations.map((s) => s.monthlyTrips)),
    [stations],
  );

  const selectedStation = stations.find((s) => s.id === selectedStationId);
  const selectedGenerated = selectedStation
    ? stationsArtifact.stations.find((s) => s.id === selectedStation.id)
    : undefined;
  const stationById = useMemo(
    () => new Map(stations.map((s) => [s.id, s])),
    [stations],
  );

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-lg font-medium tracking-tight text-foreground">
            Mobility map
          </h3>
          <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">
            Every active Mobi station at its true location. Dot size reflects
            trip volume; blue intensity reflects transit connector score.
          </p>
        </div>
        <Legend />
      </div>
      <div>
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          role="group"
          aria-label="Map of Mobi stations and rapid transit in Vancouver"
          className="w-full rounded-lg border bg-[#e3f0f9]"
        >
          {/* land */}
          <path d={landPath} fill="#fbfdfe" stroke="#d3e2ec" strokeWidth={0.12} />

          {/* water labels */}
          {WATER_LABELS.map((label) => {
            const { x, y } = project(label.lat, label.lon);
            return (
              <text
                key={label.name}
                x={x}
                y={y}
                fontSize={1.6}
                fontStyle="italic"
                fill="#7ba7c4"
                textAnchor="middle"
              >
                {label.name}
              </text>
            );
          })}

          {/* transit corridors */}
          {CORRIDORS.map((names, index) => {
            const pts = names
              .map((name) => transitByName.get(name))
              .filter((t) => t && isInsideView(t.lat, t.lon))
              .map((t) => project(t!.lat, t!.lon));
            if (pts.length < 2) return null;
            return (
              <polyline
                key={`corridor-${index}`}
                points={pts.map((p) => `${p.x},${p.y}`).join(" ")}
                fill="none"
                stroke="#94a3b8"
                strokeWidth={0.28}
                strokeDasharray="0.9 0.5"
              />
            );
          })}

          {/* transit stations */}
          {stationsArtifact.transit
            .filter((t) => isInsideView(t.lat, t.lon))
            .map((t) => {
              const { x, y } = project(t.lat, t.lon);
              return (
                <g key={t.name} aria-label={`${t.name} rapid transit station`} role="img">
                  <rect
                    x={x - 0.6}
                    y={y - 0.6}
                    width={1.2}
                    height={1.2}
                    rx={0.3}
                    fill="#0f172a"
                    stroke="#ffffff"
                    strokeWidth={0.18}
                  >
                    <title>{`${t.name} (${t.line})`}</title>
                  </rect>
                  {LABELED_TRANSIT.has(t.name) ? (
                    <text x={x + 1.1} y={y + 0.4} fontSize={1.4} fill="#475569">
                      {t.name}
                    </text>
                  ) : null}
                </g>
              );
            })}

          {/* destination links for the selected station */}
          {selectedStation && selectedGenerated
            ? selectedGenerated.trailing12.topDestinations.map((dest) => {
                const target = stationById.get(dest.id);
                if (!target) return null;
                return (
                  <line
                    key={dest.id}
                    x1={selectedStation.x}
                    y1={selectedStation.y}
                    x2={target.x}
                    y2={target.y}
                    stroke="#008fd3"
                    strokeWidth={0.18}
                    strokeOpacity={0.55}
                  />
                );
              })
            : null}

          {/* Mobi stations */}
          {stations.map((station) => {
            const selected = station.id === selectedStationId;
            const r =
              0.55 + 1.5 * Math.sqrt(station.monthlyTrips / Math.max(maxTrips, 1));
            return (
              <g key={station.id}>
                {selected ? (
                  <circle
                    cx={station.x}
                    cy={station.y}
                    r={r + 0.7}
                    fill="none"
                    stroke="#008fd3"
                    strokeWidth={0.25}
                  />
                ) : null}
                <circle
                  role="button"
                  tabIndex={0}
                  aria-label={`${station.name}, connector score ${station.connectorScore}`}
                  aria-pressed={selected}
                  data-selected={selected ? "true" : "false"}
                  cx={station.x}
                  cy={station.y}
                  r={r}
                  fill="#008fd3"
                  fillOpacity={0.3 + 0.7 * (station.connectorScore / 100)}
                  stroke="#ffffff"
                  strokeWidth={0.14}
                  className={cn(
                    "cursor-pointer outline-none transition-[r] focus-visible:stroke-slate-900",
                    selected && "stroke-slate-900",
                  )}
                  onClick={() => onStationSelect?.(station)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onStationSelect?.(station);
                    }
                  }}
                >
                  <title>{`${station.name}: ${station.monthlyTrips.toLocaleString(
                    "en-CA",
                  )} trips/month, connector score ${station.connectorScore}`}</title>
                </circle>
              </g>
            );
          })}
        </svg>
        <p className="mt-2 text-xs text-muted-foreground">
          Land geometry: City of Vancouver shoreline (Open Government Licence).
          Station positions: Mobi GBFS feed.
        </p>
      </div>
    </div>
  );
}

function Legend() {
  return (
    <div className="flex items-center gap-4 text-xs text-muted-foreground">
      <LegendItem className="bg-primary" label="85+" />
      <LegendItem className="bg-primary/60" label="70–84" />
      <LegendItem className="bg-primary/30" label="Below 70" />
    </div>
  );
}

function LegendItem({ className, label }: { className: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn("h-2.5 w-2.5 rounded-full", className)} />
      <span>{label}</span>
    </div>
  );
}
