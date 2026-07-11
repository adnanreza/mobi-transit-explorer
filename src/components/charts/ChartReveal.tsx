import type { ReactNode } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { cn } from "@/lib/utils";

// Mounts its children only once meaningfully in view, so Chart.js's draw
// animation plays where the viewer can see it. Under reduced motion the
// hook flips visible on mount and the global animation default is off, so
// charts simply render pre-drawn. Test mode renders immediately because the
// jsdom IntersectionObserver mock never fires.
export function ChartReveal({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.35 });
  const show = isVisible || import.meta.env.MODE === "test";

  return (
    <div ref={ref} className={cn("h-full w-full min-w-0", className)}>
      {show ? children : null}
    </div>
  );
}
