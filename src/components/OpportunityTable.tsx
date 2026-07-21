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
import { TableSkeleton } from "@/components/Skeletons";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { cn } from "@/lib/utils";

type OpportunityTableProps = {
  opportunities?: Opportunity[];
};

function stationName(opportunity: Opportunity): string {
  return stations.find((item) => item.id === opportunity.stationId)?.name ?? opportunity.area;
}

export function OpportunityTable({
  opportunities = defaultOpportunities,
}: OpportunityTableProps) {
  // The table is bundled data, but on a slow first load it still sits below
  // the fold; show its ghost until it's scrolled near, matching the charts.
  const { ref, isVisible } = useScrollReveal<HTMLDivElement>({
    rootMargin: "200px 0px",
  });
  const show = isVisible || import.meta.env.MODE === "test";

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

  if (!show) {
    return (
      <div ref={ref}>
        <TableSkeleton rows={opportunities.length} />
      </div>
    );
  }

  return (
    <div ref={ref} className="border-t border-border pt-2">
      <h3 className="sr-only">Opportunity ranking</h3>

      {/* Mobile: stacked cards — a 5-column table cannot fit a phone. */}
      <ul className="space-y-3 md:hidden">
        {opportunities.map((opportunity) => (
          <li
            key={opportunity.rank}
            className="rounded-lg border border-border p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground tabular-nums">
                #{opportunity.rank}
              </span>
              <PriorityText priority={opportunity.priority} />
            </div>
            <p className="mt-2 font-medium text-foreground">
              {stationName(opportunity)}
            </p>
            <p className="text-sm text-muted-foreground">{opportunity.area}</p>
            <p className="mt-3 text-sm font-medium text-foreground">
              {opportunity.type}
            </p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {opportunity.reason}
            </p>
          </li>
        ))}
      </ul>

      {/* Desktop/tablet: the ranked table. */}
      <div className="hidden md:block">
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
            {opportunities.map((opportunity) => (
              <TableRow key={opportunity.rank} className="transition-colors hover:bg-muted/40">
                <TableCell className="text-muted-foreground tabular-nums">
                  #{opportunity.rank}
                </TableCell>
                <TableCell>
                  <div className="font-medium text-foreground">
                    {stationName(opportunity)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {opportunity.area}
                  </div>
                </TableCell>
                <TableCell className="font-medium text-foreground">
                  {opportunity.type}
                </TableCell>
                <TableCell className="max-w-md text-muted-foreground">
                  <span className="text-sm leading-6">{opportunity.reason}</span>
                </TableCell>
                <TableCell>
                  <PriorityText priority={opportunity.priority} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Each signal comes from an explicit rule over the trailing twelve
        months. These are patterns that warrant investigation, not validated
        recommendations. Thresholds and definitions are in the{" "}
        <a href="#methodology" className="text-primary underline decoration-1 underline-offset-2 transition-colors hover:text-accent-foreground">
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
