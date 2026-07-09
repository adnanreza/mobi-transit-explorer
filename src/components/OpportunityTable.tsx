import { ArrowUpRight } from "lucide-react";
import { MiniTrendChart } from "@/components/charts/MiniTrendChart";
import { opportunities as defaultOpportunities } from "@/data/opportunities";
import { stations } from "@/data/stations";
import type { Opportunity, PriorityLevel } from "@/types";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type OpportunityTableProps = {
  opportunities?: Opportunity[];
};

export function OpportunityTable({
  opportunities = defaultOpportunities,
}: OpportunityTableProps) {
  if (opportunities.length === 0) {
    return (
      <Card className="bg-white/90 shadow-sm">
        <CardHeader>
          <CardTitle>No opportunities ranked yet</CardTitle>
          <CardDescription>
            Opportunity scores will appear here when processed Mobi station data is available.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="bg-white/90 shadow-sm">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <Badge variant="outline" className="w-fit bg-white text-muted-foreground">
              Ranked insights
            </Badge>
            <CardTitle>Opportunity ranking</CardTitle>
            <CardDescription>
              Decision-oriented priorities for where Mobi can better support transit access.
            </CardDescription>
          </div>
          <Badge className="w-fit bg-primary/10 text-primary" variant="secondary">
            {opportunities.length} ranked areas
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Separator className="mb-2" />
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rank</TableHead>
              <TableHead>Area/station</TableHead>
              <TableHead>Opportunity type</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Priority</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {opportunities.map((opportunity) => {
              const station = stations.find((item) => item.id === opportunity.stationId);

              return (
                <TableRow key={opportunity.rank}>
                  <TableCell className="font-semibold text-slate-950">
                    #{opportunity.rank}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-slate-950">
                      {station?.name ?? opportunity.area}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {opportunity.area}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 font-medium">
                      <ArrowUpRight className="h-4 w-4 text-primary" aria-hidden="true" />
                      {opportunity.type}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-md text-muted-foreground">
                    <div className="flex items-start gap-3">
                      {station ? (
                        <div
                          className="mt-0.5 hidden shrink-0 sm:block"
                        >
                          <MiniTrendChart
                            ariaLabel="Connector score component chart"
                            data={Object.values(station.connectorScoreComponents)}
                            type="bar"
                            color="#008fd3"
                          />
                        </div>
                      ) : null}
                      <span>{opportunity.reason}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <PriorityBadge priority={opportunity.priority} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function PriorityBadge({ priority }: { priority: PriorityLevel }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "w-fit",
        priority === "High" && "border-rose-200 bg-rose-50 text-rose-700",
        priority === "Medium" && "border-amber-200 bg-amber-50 text-amber-700",
        priority === "Low" && "border-emerald-200 bg-emerald-50 text-emerald-700",
      )}
    >
      {priority}
    </Badge>
  );
}
