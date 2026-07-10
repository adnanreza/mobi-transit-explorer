import { useMemo, useState } from "react";
import { defaultFilters, FilterPanel } from "@/components/FilterPanel";
import { MobilityMap } from "@/components/MobilityMap";
import { StationDetailPanel } from "@/components/StationDetailPanel";
import { meta, stationsAll as stations } from "@/data";

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
        <FilterPanel
          filters={filters}
          onFiltersChange={setFilters}
          layout="compact"
        />
        <MobilityMap
          stations={stations}
          selectedStationId={selectedStationId}
          onStationSelect={(station) => setSelectedStationId(station.id)}
        />
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
