import { Fragment, type ReactNode } from "react";
import { useViewportWindow } from "@/hooks/useViewportWindow";
import { useTheme } from "@/lib/theme";
import { ChartSkeleton } from "@/components/Skeletons";
import { cn } from "@/lib/utils";

// Mounts a chart only while it's near the viewport and unmounts it once it
// scrolls well clear, showing a ghost skeleton in its place. This does three
// things at once: the draw animation plays where the viewer can see it; a slow
// connection or slow device shows the chart's shape instead of a blank gap;
// and — the reason this exists — iOS Safari can't display a blanked canvas,
// because a fresh canvas is mounted every time the chart re-enters view
// (Safari purges the backing store of off-screen canvases, and Chart.js never
// learns it must repaint). See useViewportWindow for the full rationale.
//
// Keying the children on the theme remounts the chart when the theme flips,
// so Chart.js re-reads the global defaults (tick, grid, tooltip tones) that
// chartTheme.ts swaps per theme. The entrance animation doubles as the
// transition.
//
// Test mode renders the chart immediately: the jsdom IntersectionObserver mock
// never fires, so without this the tests would only ever see the skeleton.
export function ChartReveal({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const { ref, inView } = useViewportWindow();
  const theme = useTheme();
  const show = inView || import.meta.env.MODE === "test";

  return (
    <div ref={ref} className={cn("h-full w-full min-w-0", className)}>
      {show ? <Fragment key={theme}>{children}</Fragment> : <ChartSkeleton />}
    </div>
  );
}
