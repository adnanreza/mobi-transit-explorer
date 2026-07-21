import { Button } from "@/components/ui/button";
import { lastCompleteYear, yearly } from "@/data";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Every option here changes what the map actually shows — no decorative
// filters. Year re-renders station volumes from tripsByYear; transit
// distance filters stations by their real haversine distance to rapid
// transit.
export type FilterState = {
  year: string; // "t12" or a four-digit year
  transitDistance: "all" | "150" | "300" | "500";
};

export const defaultFilters: FilterState = {
  year: "t12",
  transitDistance: "all",
};

const yearOptions = [
  { value: "t12", label: "Trailing 12 months" },
  ...yearly
    .filter((row) => row.year <= lastCompleteYear)
    .map((row) => ({ value: String(row.year), label: String(row.year) }))
    .reverse(),
];

const distanceOptions = [
  { value: "all", label: "All stations" },
  { value: "150", label: "Within 150 m" },
  { value: "300", label: "Within 300 m" },
  { value: "500", label: "Within 500 m" },
];

const filterConfig = [
  { key: "year" as const, label: "Year", options: yearOptions },
  { key: "transitDistance" as const, label: "Transit distance", options: distanceOptions },
];

export function FilterPanel({
  filters,
  onFiltersChange,
  layout = "wide",
}: {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  layout?: "wide" | "compact";
}) {
  const updateFilter = (key: keyof FilterState, value: string) => {
    onFiltersChange({ ...filters, [key]: value } as FilterState);
  };

  return (
    <div>
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h3 className="eyebrow">Filters</h3>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label="Reset filters"
          className="h-auto px-2 py-1 text-sm text-primary hover:text-primary"
          onClick={() => onFiltersChange(defaultFilters)}
        >
          Reset
        </Button>
      </div>
      <div
        className={
          layout === "compact" ? "divide-y divide-border" : "grid gap-x-8 md:grid-cols-2"
        }
      >
        {filterConfig.map((filter) => (
          <label
            key={filter.key}
            className="flex items-center justify-between gap-4 py-3"
          >
            <span className="text-sm text-muted-foreground">{filter.label}</span>
            <Select
              value={filters[filter.key]}
              onValueChange={(value) => updateFilter(filter.key, value)}
            >
              <SelectTrigger
                aria-label={filter.label}
                className="h-8 w-44 border-none bg-transparent px-2 text-sm font-medium shadow-none hover:bg-muted focus:ring-0"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {filter.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        ))}
      </div>
      <p className="mt-4 text-xs leading-5 text-muted-foreground">
        Year view sizes stations by that year's departures — watch the network
        grow outward from downtown. Distance measures each station to its
        nearest rapid-transit entrance.
      </p>
    </div>
  );
}
