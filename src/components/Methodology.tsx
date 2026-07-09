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
      "This MVP uses realistic sample data to shape the product experience first.",
      "A future version will use public Mobi monthly trip CSVs as the primary bike-share source.",
      "Near transit means a station or trip context falls within the selected walking distance.",
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
      "Times may be rounded or bucketed depending on the source export.",
      "The MVP does not know exact route paths between stations.",
      "Rebalancing or maintenance trips should be excluded where the source allows it.",
    ],
  },
  {
    title: "Future version",
    icon: FileText,
    items: [
      "Document CSV schemas, cleaning rules, and station matching assumptions.",
      "Generate browser-ready JSON for station metrics, station pairs, and opportunity scores.",
      "Keep the no-backend model unless a later feature explicitly changes the architecture.",
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
                  ? "A weighted sample score for station usefulness near transit."
                  : "Methodology notes for the portfolio MVP."}
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
