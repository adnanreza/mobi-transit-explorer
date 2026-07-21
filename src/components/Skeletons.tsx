import type { CSSProperties } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Ghost-structure loading states. Each composes the shadcn Skeleton primitive
// (a soft pulse) into the outline of the real surface — a chart, the map, the
// opportunities table — so a slow connection shows the shape of what's coming,
// not a spinner. They fill their parent's box exactly, so swapping the real
// content in never shifts layout. All are aria-hidden: the pulse is decorative,
// and the real content carries the semantics once it arrives.

// Fixed, hand-tuned column heights — deterministic so the ghost never "jumps".
const BAR_HEIGHTS = [52, 74, 61, 88, 68, 46, 80, 57, 92, 66, 71, 84];

export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn("flex h-full w-full flex-col gap-3", className)}>
      {/* Plot area: soft columns standing on a hairline baseline. */}
      <div className="flex flex-1 items-end gap-1.5 border-b border-border pb-px sm:gap-2">
        {BAR_HEIGHTS.map((height, i) => (
          <Skeleton
            key={i}
            className="min-w-0 flex-1 rounded-b-none bg-muted-foreground/20"
            style={{ height: `${height}%` } as CSSProperties}
          />
        ))}
      </div>
      {/* Axis-label ghosts. */}
      <div className="flex items-center justify-between gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-2 w-8 bg-muted-foreground/10" />
        ))}
      </div>
    </div>
  );
}

export function MapSkeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("relative h-full w-full overflow-hidden bg-muted", className)}
    >
      {/* A faint street grid reads as "map" without drawing anything specific. */}
      <div className="absolute inset-0 grid grid-cols-6 grid-rows-8">
        {Array.from({ length: 48 }).map((_, i) => (
          <div key={i} className="border-b border-r border-border/50" />
        ))}
      </div>
      {/* A single pulsing pin at the centre. */}
      <div className="absolute inset-0 flex items-center justify-center">
        <Skeleton className="h-4 w-4 rounded-full bg-muted-foreground/30" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div aria-hidden="true" className="border-t border-border pt-2">
      {/* Mobile: stacked ghost cards, matching the real card layout. */}
      <ul className="space-y-3 md:hidden">
        {Array.from({ length: rows }).map((_, i) => (
          <li key={i} className="rounded-lg border border-border p-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-8 bg-muted-foreground/10" />
              <Skeleton className="h-4 w-16 bg-muted-foreground/10" />
            </div>
            <Skeleton className="mt-3 h-4 w-2/3 bg-muted-foreground/20" />
            <Skeleton className="mt-2 h-3 w-1/3 bg-muted-foreground/10" />
            <Skeleton className="mt-4 h-4 w-1/2 bg-muted-foreground/20" />
            <Skeleton className="mt-2 h-3 w-5/6 bg-muted-foreground/10" />
          </li>
        ))}
      </ul>

      {/* Desktop/tablet: a ghost of the ranked table. */}
      <div className="hidden md:block">
        <div className="flex gap-4 border-b border-border py-3">
          <Skeleton className="h-3 w-10 bg-muted-foreground/10" />
          <Skeleton className="h-3 w-24 bg-muted-foreground/10" />
          <Skeleton className="h-3 w-28 bg-muted-foreground/10" />
          <Skeleton className="h-3 flex-1 bg-muted-foreground/10" />
          <Skeleton className="h-3 w-16 bg-muted-foreground/10" />
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-border/60 py-4">
            <Skeleton className="h-4 w-8 bg-muted-foreground/10" />
            <div className="w-40 space-y-1.5">
              <Skeleton className="h-4 w-32 bg-muted-foreground/20" />
              <Skeleton className="h-3 w-20 bg-muted-foreground/10" />
            </div>
            <Skeleton className="h-4 w-28 bg-muted-foreground/20" />
            <Skeleton className="h-4 flex-1 bg-muted-foreground/10" />
            <Skeleton className="h-4 w-16 bg-muted-foreground/20" />
          </div>
        ))}
      </div>
    </div>
  );
}
