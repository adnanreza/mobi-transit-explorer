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
      "The app uses April and May 2026 public Mobi by Rogers system-data CSVs.",
      "Raw CSV files are processed locally into static TypeScript datasets before deployment.",
      "Near-transit context is estimated from station names because the trip CSVs do not include station coordinates.",
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
      "Add station coordinates from an official station feed or maintained station reference.",
      "Upgrade the map to use geographic coordinates instead of generated map positions.",
      "Expand processing to a rolling 12-month history while keeping raw CSVs out of git.",
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
