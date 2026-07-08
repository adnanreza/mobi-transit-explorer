import {
  Bike,
  CircleDotDashed,
  MapPinned,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { overviewMetrics } from "@/data/metrics";
import type { OverviewMetric } from "@/types";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type OverviewCardsProps = {
  metrics?: OverviewMetric[];
};

const metricIcons: Record<string, LucideIcon> = {
  "trips-analyzed": Bike,
  "trips-near-transit": MapPinned,
  "strong-connectors": CircleDotDashed,
  "expansion-opportunities": TrendingUp,
};

export function OverviewCards({ metrics = overviewMetrics }: OverviewCardsProps) {
  if (metrics.length === 0) {
    return (
      <Card className="bg-white/90">
        <CardHeader>
          <CardTitle>Overview metrics unavailable</CardTitle>
          <CardDescription>
            Metrics will appear here when sample station data is available.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => {
        const Icon = metricIcons[metric.id] ?? CircleDotDashed;

        return (
          <Card key={metric.id} className="bg-white/90 shadow-sm">
            <CardHeader className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                {metric.context ? (
                  <Badge variant="outline" className="bg-white text-muted-foreground">
                    {metric.context}
                  </Badge>
                ) : null}
              </div>
              <div>
                <CardDescription>{metric.label}</CardDescription>
                <CardTitle className="mt-2 text-3xl">{metric.value}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-muted-foreground">
                {metric.caption}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
