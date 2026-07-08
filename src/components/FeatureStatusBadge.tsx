import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type FeatureStatus = "live" | "sample" | "planned" | "future";

const statusLabels: Record<FeatureStatus, string> = {
  live: "Live foundation",
  sample: "Sample data",
  planned: "Planned feature",
  future: "Future integration",
};

const statusStyles: Record<FeatureStatus, string> = {
  live: "border-primary/20 bg-primary/10 text-primary",
  sample: "border-sky-200 bg-sky-50 text-sky-700",
  planned: "border-slate-200 bg-white text-slate-600",
  future: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

type FeatureStatusBadgeProps = {
  status: FeatureStatus;
  className?: string;
};

export function FeatureStatusBadge({ status, className }: FeatureStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn("w-fit font-medium", statusStyles[status], className)}
    >
      {statusLabels[status]}
    </Badge>
  );
}
