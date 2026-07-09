import { TrainFront, Waves } from "lucide-react";
import { stations as defaultStations, transitNodes as defaultTransitNodes } from "@/data";
import type { MobiStation, TransitNode } from "@/types";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type MobilityMapProps = {
  stations?: MobiStation[];
  transitNodes?: TransitNode[];
  selectedStationId?: string | null;
  onStationSelect?: (station: MobiStation) => void;
};

const volumeSize = {
  Low: "h-3.5 w-3.5",
  Medium: "h-[1.125rem] w-[1.125rem]",
  High: "h-6 w-6",
};

export function MobilityMap({
  stations = defaultStations,
  transitNodes = defaultTransitNodes,
  selectedStationId,
  onStationSelect,
}: MobilityMapProps) {
  return (
    <Card className="overflow-hidden bg-white/90 shadow-sm">
      <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <Badge variant="outline" className="w-fit bg-white text-muted-foreground">
            Mock Vancouver geography
          </Badge>
          <CardTitle>Mobility map</CardTitle>
          <CardDescription>
            Station size reflects trip volume. Blue intensity reflects transit
            connector score.
          </CardDescription>
        </div>
        <Legend />
      </CardHeader>
      <CardContent>
<div
            className="relative min-h-[560px] overflow-hidden rounded-lg border bg-[linear-gradient(135deg,#f0f8ff_0%,#e8f4fa_48%,#fafcff_100%)]"
            aria-label="Mobi stations and transit nodes map"
          >
            <div className="absolute left-0 top-0 h-36 w-full bg-gradient-to-b from-sky-200/50 to-transparent" />
            <div className="absolute left-[-8%] top-[5%] h-80 w-[54%] rounded-full bg-sky-200/40 blur-xl" />
            <div className="absolute left-[50%] top-[10%] h-32 w-[28%] rounded-full bg-sky-200/30 blur-md" />
            <div className="absolute bottom-0 right-0 h-48 w-[46%] rounded-tl-[60%] bg-emerald-50" />
            <div className="absolute left-[30%] top-[74%] h-16 w-[20%] rounded-full bg-emerald-200/30 blur-md" />
            <div className="absolute left-[14%] top-[60%] h-1.5 w-[72%] -rotate-6 rounded-full bg-slate-300/55" />
            <div className="absolute left-[28%] top-[36%] h-1.5 w-[58%] rotate-[28deg] rounded-full bg-slate-300/45" />
            <div className="absolute left-[32%] top-[18%] flex items-center gap-2 text-xs font-medium text-sky-700">
              <Waves className="h-4 w-4" aria-hidden="true" />
              Burrard Inlet
            </div>
            <div className="absolute left-[56%] top-[26%] flex items-center gap-2 text-xs font-medium text-sky-700">
              <Waves className="h-3 w-3" aria-hidden="true" />
              False Creek
            </div>
            <div className="absolute bottom-5 left-6 text-xs font-medium text-muted-foreground">
              Generated Vancouver station grid
            </div>

          {transitNodes.map((node) => (
            <div
              key={node.id}
              className="group absolute z-20 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
            >
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-slate-950 text-white shadow-sm motion-safe:animate-pulse"
                title={`${node.name} transit node`}
                aria-label={`${node.name} transit node`}
              >
                <TrainFront className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="pointer-events-none absolute left-1/2 top-9 min-w-max -translate-x-1/2 rounded-md border bg-white px-2 py-1 text-xs font-medium text-slate-700 opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                {node.name}
              </div>
            </div>
          ))}

          {stations.map((station) => {
            const selected = station.id === selectedStationId;

            return (
              <button
                key={station.id}
                type="button"
                aria-label={`${station.name}, connector score ${station.connectorScore}`}
                aria-pressed={selected}
                title={`${station.name}: ${station.connectorScore} connector score`}
                className={cn(
                  "group absolute z-30 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-sm outline-none transition-all duration-300 hover:scale-125 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  volumeSize[station.tripVolume],
                  getScoreColor(station.connectorScore),
                  selected && "scale-125 ring-4 ring-primary/25 shadow-lg",
                )}
                style={{ left: `${station.x}%`, top: `${station.y}%` }}
                onClick={() => onStationSelect?.(station)}
                data-selected={selected ? "true" : "false"}
              >
                <span className="sr-only">{station.name}</span>
                <span className="pointer-events-none absolute left-1/2 top-7 min-w-48 -translate-x-1/2 rounded-md border bg-white px-3 py-2 text-left text-xs text-slate-700 opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                  <span className="block font-semibold text-slate-950">
                    {station.name}
                  </span>
                  <span>{station.connectorScore} connector score</span>
                </span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function Legend() {
  return (
    <div className="min-w-44 rounded-lg border bg-white p-3 text-xs text-muted-foreground">
      <div className="font-medium text-slate-800">Connector score</div>
      <Separator className="my-2" />
      <div className="space-y-2">
        <LegendItem className="bg-primary" label="85-100 strong" />
        <LegendItem className="bg-sky-400" label="70-84 emerging" />
        <LegendItem className="bg-slate-400" label="Below 70 watch" />
      </div>
    </div>
  );
}

function LegendItem({ className, label }: { className: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn("h-2.5 w-2.5 rounded-full", className)} />
      <span>{label}</span>
    </div>
  );
}

function getScoreColor(score: number) {
  if (score >= 85) {
    return "bg-primary";
  }

  if (score >= 70) {
    return "bg-sky-400";
  }

  return "bg-slate-400";
}
