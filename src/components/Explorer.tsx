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
      <p className="text-sm text-muted-foreground">
        <span>{scopeLabel}</span>
        <span aria-hidden="true"> · </span>
        <span>{distanceLabel}</span>
        <span aria-hidden="true"> · </span>
        <span>link reflects this view</span>
      </p>

      <div className="grid gap-8 xl:grid-cols-[280px_minmax(0,1fr)_340px]">
        <div className="space-y-6">
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
          />
        </Suspense>
        <StationDetailPanel station={selectedStation} />
      </div>
    </div>
  );
}
