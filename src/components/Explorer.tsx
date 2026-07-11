import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { defaultFilters, FilterPanel, type FilterState } from "@/components/FilterPanel";
import { StationDetailPanel } from "@/components/StationDetailPanel";
import { StationFinder } from "@/components/StationFinder";
import { lastCompleteYear, meta, stationsAll as stations } from "@/data";

// MapLibre is the heaviest dependency in the app; loading it lazily keeps
// the hero and overview paint-fast.
const InteractiveMap = lazy(() => import("@/components/InteractiveMap"));

function readUrlState(): { filters: FilterState; stationId: string | null } {
  const params = new URLSearchParams(window.location.search);
  const year = params.get("year");
  const validYear =
    year && (year === "t12" || (/^\d{4}$/.test(year) && Number(year) <= lastCompleteYear));
  const distance = params.get("transit");
  const validDistance = ["150", "300", "500"].includes(distance ?? "");
  const station = params.get("station");
  return {
    filters: {
      year: validYear ? year : defaultFilters.year,
      transitDistance: validDistance
        ? (distance as FilterState["transitDistance"])
        : defaultFilters.transitDistance,
    },
    stationId: station && stations.some((s) => s.id === station) ? station : null,
  };
}

function writeUrlState(filters: FilterState, stationId: string | null) {
  const params = new URLSearchParams();
  if (filters.year !== defaultFilters.year) params.set("year", filters.year);
  if (filters.transitDistance !== defaultFilters.transitDistance)
    params.set("transit", filters.transitDistance);
  if (stationId) params.set("station", stationId);
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
  const [colorMode, setColorMode] = useState<"score" | "leisure">("score");

  useEffect(() => {
    writeUrlState(filters, selectedStationId);
  }, [filters, selectedStationId]);

  const selectedStation = useMemo(
    () => stations.find((station) => station.id === selectedStationId) ?? null,
    [selectedStationId],
  );

  const scopeLabel =
    filters.year === "t12"
      ? `Trailing 12 months to ${meta.sourceWindow.lastMonth}`
      : `Showing ${filters.year}`;
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
            ] as const
          ).map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              aria-pressed={colorMode === mode}
              onClick={() => setColorMode(mode)}
              className={
                colorMode === mode
                  ? "rounded-lg bg-secondary px-3 py-1.5 text-sm font-medium text-foreground"
                  : "rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

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
            seawall endpoints, long meandering rides) — definition in the{" "}
          </>
        )}
        <a href="#methodology" className="text-primary underline-offset-2 hover:underline">
          methodology
        </a>
        . Dot size is trip volume either way.
      </p>

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
          <Suspense
            fallback={
              <div
                aria-label="Loading map"
                className="flex h-[560px] items-center justify-center rounded-xl border border-border text-sm text-muted-foreground"
              >
                Loading map…
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
        </div>
        <div className="order-3 xl:order-none">
          <StationDetailPanel station={selectedStation} />
        </div>
      </div>
    </div>
  );
}
