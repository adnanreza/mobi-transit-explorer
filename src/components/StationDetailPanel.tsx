import { Bike, MapPin, Route, Zap } from "lucide-react";
import { Sparkline } from "react-tiny-sparkline";
import { transitNodes } from "@/data/transitNodes";
import type { MobiStation } from "@/types";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

type StationDetailPanelProps = {
  station?: MobiStation | null;
};

export function StationDetailPanel({ station }: StationDetailPanelProps) {
  if (!station) {
    return (
      <Card className="h-full bg-white/90 shadow-sm">
        <CardHeader>
          <Badge variant="outline" className="w-fit bg-white text-muted-foreground">
            Station profile
          </Badge>
          <CardTitle>Select a station</CardTitle>
          <CardDescription>
            Choose a Mobi station on the map to inspect its transit connector
            score, trip profile, and top destinations.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const transitNode = transitNodes.find((node) => node.id === station.nearbyTransitNode);
  const tripsNearTransitTrend = getStablePercentageTrend(
    station.tripsNearTransitPercentage,
    station.trend,
  );
  const ebikeShareTrend = getStablePercentageTrend(station.ebikeShare, station.trend, 38);

  return (
    <Card className="h-full bg-white/90 shadow-sm">
      <CardHeader className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="bg-primary/10 text-primary" variant="secondary">
            {station.label}
          </Badge>
          <Badge variant="outline" className="bg-white text-muted-foreground">
            {station.tripVolume} trip volume
          </Badge>
        </div>
        <div>
          <CardTitle>{station.name}</CardTitle>
          <CardDescription className="mt-2 flex items-center gap-2">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            {station.area}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <MetricBlock
          icon={Route}
          label="Nearby transit node"
          value={transitNode?.name ?? station.nearbyTransitNode}
        />

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-slate-700">
              Transit connector score
            </span>
            <span className="text-sm font-semibold text-slate-950">
              {station.connectorScore}/100
            </span>
          </div>
          <Progress value={station.connectorScore} className="tabular-nums" aria-label="Transit connector score" />
        </div>

        <Separator />

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
          <MetricBlock icon={Bike} label="Monthly trips" value={station.monthlyTrips.toLocaleString("en-CA")}>
            <Sparkline data={station.trend} variant="area" color="#008fd3" width={80} height={24} />
          </MetricBlock>
          <MetricBlock
            icon={Route}
            label="Trips near transit"
            value={`${station.tripsNearTransitPercentage}%`}
          >
            <Sparkline
              data={tripsNearTransitTrend}
              variant="bar"
              color="#22c55e"
              width={80}
              height={24}
            />
          </MetricBlock>
          <MetricBlock icon={Zap} label="E-bike share" value={`${station.ebikeShare}%`}>
            <Sparkline
              data={ebikeShareTrend}
              variant="area"
              color="#a855f7"
              width={80}
              height={24}
            />
          </MetricBlock>
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="text-sm font-medium text-slate-700">Top destinations</div>
          <div className="flex flex-wrap gap-2">
            {station.topDestinations.map((destination) => (
              <Badge key={destination} variant="outline" className="bg-white">
                {destination}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getStablePercentageTrend(
  basePercentage: number,
  tripTrend: number[],
  sensitivity = 28,
) {
  const baseline = tripTrend[0] ?? 1;
  const midpoint = (tripTrend.length - 1) / 2;

  return tripTrend.map((value, index) => {
    const tripDelta = ((value - baseline) / baseline) * sensitivity;
    const cadence = (index - midpoint) * 0.35;

    return clamp(Math.round(basePercentage + tripDelta + cadence), 0, 100);
  });
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function MetricBlock({
  icon: Icon,
  label,
  value,
  children,
}: {
  icon: typeof Bike;
  label: string;
  value: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-white p-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-normal text-muted-foreground">
        <Icon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
        {label}
      </div>
      <div className="text-base font-semibold text-slate-950 tabular-nums">{value}</div>
      {children ? <div className="mt-1">{children}</div> : null}
    </div>
  );
}
