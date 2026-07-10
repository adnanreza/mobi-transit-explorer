import { MiniTrendChart } from "@/components/charts/MiniTrendChart";
import { opportunities as defaultOpportunities, stationsAll as stations } from "@/data";
import type { Opportunity, PriorityLevel } from "@/types";
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
      <div className="border-t border-border pt-6">
        <h3 className="text-lg font-medium tracking-tight text-foreground">
          No opportunities ranked yet
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Opportunity scores will appear here when processed Mobi station data
          is available.
        </p>
      </div>
    );
  }

  return (
    <div className="border-t border-border pt-2">
      <h3 className="sr-only">Opportunity ranking</h3>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Rank</TableHead>
            <TableHead>Station</TableHead>
            <TableHead>Opportunity</TableHead>
            <TableHead>Evidence</TableHead>
            <TableHead>Priority</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {opportunities.map((opportunity) => {
            const station = stations.find((item) => item.id === opportunity.stationId);

            return (
              <TableRow key={opportunity.rank} className="hover:bg-muted/40">
                <TableCell className="text-muted-foreground tabular-nums">
                  #{opportunity.rank}
                </TableCell>
                <TableCell>
                  <div className="font-medium text-foreground">
                    {station?.name ?? opportunity.area}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {opportunity.area}
                  </div>
                </TableCell>
                <TableCell className="font-medium text-foreground">
                  {opportunity.type}
                </TableCell>
                <TableCell className="max-w-md text-muted-foreground">
                  <div className="flex items-start gap-3">
                    {station ? (
                      <div className="mt-0.5 hidden shrink-0 sm:block">
                        <MiniTrendChart
                          ariaLabel="Connector score component chart"
                          data={Object.values(station.connectorScoreComponents)}
                          type="bar"
                          color="#008fd3"
                        />
                      </div>
                    ) : null}
                    <span className="text-sm leading-6">{opportunity.reason}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <PriorityText priority={opportunity.priority} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <p className="mt-4 text-xs text-muted-foreground">
        Each finding comes from an explicit rule over the trailing twelve
        months — thresholds and definitions are in the{" "}
        <a href="#methodology" className="text-primary underline-offset-2 hover:underline">
          methodology
        </a>
        .
      </p>
    </div>
  );
}

function PriorityText({ priority }: { priority: PriorityLevel }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 text-sm",
        priority === "High" && "font-semibold text-foreground",
        priority === "Medium" && "font-medium text-muted-foreground",
        priority === "Low" && "text-muted-foreground",
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          priority === "High" && "bg-primary",
          priority === "Medium" && "bg-primary/40",
          priority === "Low" && "bg-border",
        )}
      />
      {priority}
    </span>
  );
}
