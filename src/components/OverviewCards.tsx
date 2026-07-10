import { overviewMetrics } from "@/data";
import type { OverviewMetric } from "@/types";

type OverviewCardsProps = {
  metrics?: OverviewMetric[];
};

export function OverviewCards({ metrics = overviewMetrics }: OverviewCardsProps) {
  if (metrics.length === 0) {
    return (
      <div className="border-t border-border pt-6">
        <p className="font-medium text-foreground">Overview metrics unavailable</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Metrics will appear here when processed Mobi station data is available.
        </p>
      </div>
    );
  }

  return (
    <dl className="grid gap-x-8 gap-y-10 border-t border-border pt-10 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => (
        <div key={metric.id}>
          <dt className="text-sm text-muted-foreground">{metric.label}</dt>
          <dd className="mt-2 text-4xl font-semibold tracking-tight text-foreground tabular-nums sm:text-5xl">
            {metric.value}
          </dd>
          <p className="mt-3 max-w-[26ch] text-sm leading-6 text-muted-foreground">
            {metric.caption}
          </p>
        </div>
      ))}
    </dl>
  );
}
