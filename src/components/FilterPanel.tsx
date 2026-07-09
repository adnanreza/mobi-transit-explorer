import { RotateCcw, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

export type FilterState = {
  month: "april-2026" | "may-2026";
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
  month: "april-2026",
  dayType: "all",
  timeOfDay: "all",
  bikeType: "all",
  transitDistance: "300m",
};

const filterConfig: FilterConfig[] = [
  {
    key: "month",
    label: "Month",
    options: [
      { value: "april-2026", label: "April 2026" },
      { value: "may-2026", label: "May 2026" },
    ],
  },
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

  const selectedSummary = [
    getOptionLabel("month", filters.month),
    getOptionLabel("dayType", filters.dayType),
    getOptionLabel("timeOfDay", filters.timeOfDay),
    getOptionLabel("bikeType", filters.bikeType),
    getOptionLabel("transitDistance", filters.transitDistance),
  ];

  return (
    <Card className="bg-white/90 shadow-sm">
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Badge variant="outline" className="w-fit bg-white text-muted-foreground">
              Interactive filters
            </Badge>
            <CardTitle className="flex items-center gap-2 text-xl">
              <SlidersHorizontal className="h-5 w-5 text-primary" aria-hidden="true" />
              Filter real trip metrics
            </CardTitle>
          </div>
          <Button type="button" variant="outline" onClick={() => onFiltersChange(defaultFilters)}>
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Reset filters
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedSummary.map((label, index) => (
            <Badge
              key={`${label}-${index}`}
              variant="secondary"
              className="bg-primary/10 text-primary"
            >
              {label}
            </Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <Separator />
        <div
          className={
            layout === "compact"
              ? "grid gap-4"
              : "grid gap-4 md:grid-cols-2 xl:grid-cols-5"
          }
        >
          {filterConfig.map((filter) => (
            <label key={filter.key} className="space-y-2">
              <span className="text-sm font-medium text-slate-700">
                {filter.label}
              </span>
              <Select
                value={filters[filter.key]}
                onValueChange={(value) => updateFilter(filter.key, value)}
              >
                <SelectTrigger aria-label={filter.label}>
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
      </CardContent>
    </Card>
  );
}

function getOptionLabel(key: keyof FilterState, value: string) {
  const option = filterConfig
    .find((filter) => filter.key === key)
    ?.options.find((item) => item.value === value);

  return option?.label ?? value;
}
