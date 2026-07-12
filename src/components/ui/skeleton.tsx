import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

// The shadcn/ui Skeleton primitive: a single softly-pulsing block. The shaped
// skeletons in components/Skeletons.tsx compose many of these into the outline
// of a chart, map, or table.
function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("animate-pulse rounded-md bg-muted", className)} {...props} />
  );
}

export { Skeleton };
