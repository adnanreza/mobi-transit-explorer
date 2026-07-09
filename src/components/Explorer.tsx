import { useMemo, useState } from "react";
import { defaultFilters, FilterPanel } from "@/components/FilterPanel";
import { MobilityMap } from "@/components/MobilityMap";
import { StationDetailPanel } from "@/components/StationDetailPanel";
import { Badge } from "@/components/ui/badge";
import { meta, stations } from "@/data";

export function Explorer() {
  const [filters, setFilters] = useState(defaultFilters);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);

  const selectedStation = useMemo(
    () => stations.find((station) => station.id === selectedStationId) ?? null,
    [selectedStationId],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="bg-white text-muted-foreground">
          Trailing 12 months to {meta.sourceWindow.lastMonth}
        </Badge>
        <Badge variant="outline" className="bg-white text-muted-foreground">
          {formatFilter(filters.dayType)} days
        </Badge>
        <Badge variant="outline" className="bg-white text-muted-foreground">
          {filters.transitDistance} transit walk
        </Badge>
      </div>

      <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)_360px]">
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
