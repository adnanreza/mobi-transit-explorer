import { lazy, Suspense, useMemo, useState } from "react";
import { defaultFilters, FilterPanel } from "@/components/FilterPanel";
import { StationDetailPanel } from "@/components/StationDetailPanel";
import { StationFinder } from "@/components/StationFinder";
import { meta, stationsAll as stations } from "@/data";

// MapLibre is the heaviest dependency in the app; loading it lazily keeps
// the hero and overview paint-fast.
const InteractiveMap = lazy(() => import("@/components/InteractiveMap"));

export function Explorer() {
  const [filters, setFilters] = useState(defaultFilters);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);

  const selectedStation = useMemo(
    () => stations.find((station) => station.id === selectedStationId) ?? null,
    [selectedStationId],
  );

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        <span>Trailing 12 months to {meta.sourceWindow.lastMonth}</span>
        <span aria-hidden="true"> · </span>
        <span>{formatFilter(filters.dayType)} days</span>
        <span aria-hidden="true"> · </span>
        <span>{filters.transitDistance} transit walk</span>
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
          />
        </Suspense>
        <StationDetailPanel station={selectedStation} />
      </div>
    </div>
  );
}

function formatFilter(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
