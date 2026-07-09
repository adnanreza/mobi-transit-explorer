import { Database, FileText, Gauge, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const methodologyGroups = [
  {
    title: "Data sources",
    icon: Database,
    items: [
      "Every published Mobi by Rogers trip file from 2017 through today, plus the Mobi GBFS station feed and City of Vancouver open data.",
      "Raw files run through a staged local pipeline (Python + DuckDB) into compact JSON aggregates before deployment.",
      "Transit proximity is computed from real coordinates: GBFS station positions against City of Vancouver rapid-transit station locations.",
    ],
  },
  {
    title: "Connector score",
    icon: Gauge,
    items: [
      "Transit proximity",
      "Trip volume",
      "Commute pattern",
      "E-bike share",
      "Station connectivity",
    ],
  },
  {
    title: "Limitations",
    icon: ShieldAlert,
    items: [
      "Public trip data is anonymized and cannot identify individual riders.",
      "Departure and return times are rounded to the nearest hour by the publisher.",
      "The source does not include exact route paths between stations.",
      "The publisher removes operations trips for rebalancing and maintenance.",
    ],
  },
  {
    title: "Future version",
    icon: FileText,
    items: [
      "Upgrade the map to real Vancouver geometry: actual shoreline and true station positions.",
      "Tell the year-over-year story: growth, seasonality, the pandemic, e-bike adoption, and weather.",
      "Publish the full data-quality report alongside the methodology.",
    ],
  },
];

export function Methodology() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {methodologyGroups.map((group) => {
        const Icon = group.icon;

        return (
          <Card key={group.title} className="border-dashed bg-white/80 shadow-sm">
            <CardHeader>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <CardTitle>{group.title}</CardTitle>
              <CardDescription>
                {group.title === "Connector score"
                  ? "A weighted score for station usefulness near transit."
                  : "Methodology notes for the real-data portfolio MVP."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Separator />
              <ul className="space-y-3">
                {group.items.map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-6 text-muted-foreground">
                    <Badge className="mt-1 h-2 w-2 rounded-full bg-primary p-0" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
