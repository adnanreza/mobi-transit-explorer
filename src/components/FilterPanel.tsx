import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type FilterState = {
  dayType: "all" | "weekday" | "weekend";
  timeOfDay: "all" | "morning-commute" | "midday" | "evening-commute" | "late-night";
  bikeType: "all" | "classic" | "e-bike";
  transitDistance: "150m" | "300m" | "500m";
};

type FilterConfig = {
  key: keyof FilterState;
  label: string;
  options: Array<{ value: FilterState[keyof FilterState]; label: string }>;
};

export const defaultFilters: FilterState = {
  dayType: "all",
  timeOfDay: "all",
  bikeType: "all",
  transitDistance: "300m",
};

const filterConfig: FilterConfig[] = [
  {
    key: "dayType",
    label: "Day type",
    options: [
      { value: "all", label: "All" },
      { value: "weekday", label: "Weekday" },
      { value: "weekend", label: "Weekend" },
    ],
  },
  {
    key: "timeOfDay",
    label: "Time of day",
    options: [
      { value: "all", label: "All" },
      { value: "morning-commute", label: "Morning commute" },
      { value: "midday", label: "Midday" },
      { value: "evening-commute", label: "Evening commute" },
      { value: "late-night", label: "Late night" },
    ],
  },
  {
    key: "bikeType",
    label: "Bike type",
    options: [
      { value: "all", label: "All" },
      { value: "classic", label: "Classic" },
      { value: "e-bike", label: "E-bike" },
    ],
  },
  {
    key: "transitDistance",
    label: "Transit distance",
    options: [
      { value: "150m", label: "150m" },
      { value: "300m", label: "300m" },
      { value: "500m", label: "500m" },
    ],
  },
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
        <h3 className="text-sm font-medium text-foreground">Filters</h3>
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
          layout === "compact"
            ? "divide-y divide-border"
            : "grid gap-x-8 md:grid-cols-2 xl:grid-cols-4"
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
                className="h-8 w-40 border-none bg-transparent px-2 text-sm font-medium shadow-none hover:bg-muted focus:ring-0"
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
    </div>
  );
}
