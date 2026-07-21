import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { defaultFilters, FilterPanel, type FilterState } from "@/components/FilterPanel";
import { MapErrorBoundary } from "@/components/MapErrorBoundary";
import { MapSkeleton } from "@/components/Skeletons";
import { StationDetailPanel } from "@/components/StationDetailPanel";
import { StationFinder } from "@/components/StationFinder";
import {
  DOCKED_TRANSIT_RADIUS_M,
  lastCompleteYear,
  meta,
  stationsArtifact,
  stationsAll as stations,
  transitCoverage,
} from "@/data";

// MapLibre is the heaviest dependency in the app; loading it lazily keeps
// the hero and overview paint-fast.
const InteractiveMap = lazy(() => import("@/components/InteractiveMap"));

// Earliest year present in the data (derived from the pipeline meta).
const firstDataYear = Number(meta.sourceWindow.firstMonth.slice(0, 4));

type ColorMode = "score" | "leisure" | "coverage";

const uncoveredTransit = transitCoverage.filter(
  (t) => t.nearestDockM > DOCKED_TRANSIT_RADIUS_M,
);

function readUrlState(): {
  filters: FilterState;
  stationId: string | null;
  colorMode: ColorMode;
} {
  const params = new URLSearchParams(window.location.search);
  const year = params.get("year");
  const numYear = year ? Number(year) : NaN;
  const validYear =
    year &&
    (year === "t12" ||
      (/^\d{4}$/.test(year) &&
        numYear >= firstDataYear &&
        numYear <= lastCompleteYear));
  const distance = params.get("transit");
  const validDistance = ["150", "300", "500"].includes(distance ?? "");
  const station = params.get("station");
  const color = params.get("color");
  const validColor: ColorMode =
    color === "leisure" ? "leisure" : color === "coverage" ? "coverage" : "score";
  return {
    filters: {
      year: validYear ? year : defaultFilters.year,
      transitDistance: validDistance
        ? (distance as FilterState["transitDistance"])
        : defaultFilters.transitDistance,
    },
    stationId: station && stations.some((s) => s.id === station) ? station : null,
    colorMode: validColor,
  };
}

function writeUrlState(
  filters: FilterState,
  stationId: string | null,
  colorMode: ColorMode,
) {
  const params = new URLSearchParams();
  if (filters.year !== defaultFilters.year) params.set("year", filters.year);
  if (filters.transitDistance !== defaultFilters.transitDistance)
    params.set("transit", filters.transitDistance);
  if (stationId) params.set("station", stationId);
  if (colorMode !== "score") params.set("color", colorMode);
  const query = params.toString();
  const url = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
  window.history.replaceState(null, "", url);
}

export function Explorer() {
  const [initial] = useState(readUrlState);
  const [filters, setFilters] = useState(initial.filters);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(
    initial.stationId,
  );
  const [colorMode, setColorMode] = useState<ColorMode>(initial.colorMode);

  useEffect(() => {
    writeUrlState(filters, selectedStationId, colorMode);
  }, [filters, selectedStationId, colorMode]);

  // Clear the selection when the selected station leaves the active slice:
  // either it exceeds the transit-distance filter or has 0 trips in the
  // selected year. This prevents stale rings/lines from appearing on the map.
  useEffect(() => {
    if (!selectedStationId) return;
    const raw = stationsArtifact.stations.find((s) => s.id === selectedStationId);
    if (!raw) { setSelectedStationId(null); return; }
    const maxTransitM = filters.transitDistance === "all" ? null : Number(filters.transitDistance);
    if (maxTransitM !== null && raw.nearestTransit.distanceM > maxTransitM) {
      setSelectedStationId(null);
      return;
    }
    const trips =
      filters.year === "t12" ? raw.trailing12.trips : (raw.tripsByYear[filters.year] ?? 0);
    if (trips === 0) setSelectedStationId(null);
  }, [filters, selectedStationId]);

  const selectedStation = useMemo(
    () => stations.find((station) => station.id === selectedStationId) ?? null,
    [selectedStationId],
  );

  const scopeLabel =
    filters.year === "t12"
      ? `Trailing 12 months to ${meta.sourceWindow.lastMonth}`
      : `Showing ${filters.year} trip volume · station details are trailing 12 months`;
  const distanceLabel =
    filters.transitDistance === "all"
      ? "all stations"
      : `within ${filters.transitDistance} m of rapid transit`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          <span>{scopeLabel}</span>
          <span aria-hidden="true"> · </span>
          <span>{distanceLabel}</span>
          <span aria-hidden="true"> · </span>
          <span>link reflects this view</span>
        </p>
        <div className="flex gap-1" role="group" aria-label="Colour stations by">
          {(
            [
              ["score", "Transit score"],
              ["leisure", "Leisure share"],
              ["coverage", "Coverage"],
            ] as const
          ).map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              aria-pressed={colorMode === mode}
              onClick={() => setColorMode(mode)}
              className={
                colorMode === mode
                  ? "px-3 py-1.5 text-sm text-foreground underline decoration-1 underline-offset-8"
                  : "px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {colorMode === "coverage" ? (
        <p className="text-xs leading-5 text-muted-foreground">
          This view flips the lens: rapid-transit stations are marked by{" "}
          <strong className="font-medium text-foreground">Mobi access</strong>.
          A station is filled when a dock sits within {DOCKED_TRANSIT_RADIUS_M} m
          of it, and ringed in blue when the nearest dock is more than a
          kilometre away. In Vancouver proper that split is stark:{" "}
          {uncoveredTransit.length} of {transitCoverage.length} stations have
          no dock within a kilometre, and every other station has one within
          ~200 m. Mobi dots dim to context; their size is still trip volume.
        </p>
      ) : (
        <p className="text-xs leading-5 text-muted-foreground">
          {colorMode === "score" ? (
            <>
              Blue intensity shows each station's <strong className="font-medium text-foreground">transit connector score</strong> (0–100):
              distance to rapid transit, trip volume, commute pattern, e-bike
              share, and destination diversity, weighted as defined in the{" "}
            </>
          ) : (
            <>
              Blue intensity shows the share of each station's trips classified
              as <strong className="font-medium text-foreground">leisure</strong> by a documented heuristic (round trips,
              seawall endpoints, long meandering rides). The definition is in the{" "}
            </>
          )}
          <a href="#methodology" className="text-primary underline decoration-1 underline-offset-2 transition-colors hover:text-accent-foreground">
            methodology
          </a>
          . Dot size is trip volume either way.
        </p>
      )}

      <div className="grid gap-8 xl:grid-cols-[280px_minmax(0,1fr)_340px]">
        {/* On mobile the map leads; controls and detail follow. On xl the
            source order (controls · map · detail) restores the columns. */}
        <div className="order-2 space-y-6 xl:order-none">
          <StationFinder
            selectedStationId={selectedStationId}
            onStationSelect={setSelectedStationId}
          />
          <FilterPanel
            filters={filters}
            onFiltersChange={setFilters}
            layout="compact"
          />
        </div>
        <div className="order-1 xl:order-none">
          <MapErrorBoundary>
            <Suspense
              fallback={
                <div
                  role="status"
                  aria-label="Loading map"
                  className="h-[560px] overflow-hidden rounded-lg border border-border"
                >
                  <MapSkeleton />
                </div>
              }
            >
              <InteractiveMap
                selectedStationId={selectedStationId}
                onStationSelect={setSelectedStationId}
                year={filters.year}
                maxTransitM={
                  filters.transitDistance === "all" ? null : Number(filters.transitDistance)
                }
                colorMode={colorMode}
              />
            </Suspense>
          </MapErrorBoundary>
        </div>
        <div className="order-3 xl:order-none">
          <StationDetailPanel station={selectedStation} year={filters.year} />
        </div>
      </div>
    </div>
  );
}
