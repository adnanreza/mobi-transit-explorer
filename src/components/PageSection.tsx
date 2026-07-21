import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

type PageSectionProps = ComponentPropsWithoutRef<"section"> & {
  spacing?: "default" | "compact" | "hero";
};

// Default sections open with the portfolio's full-width hairline rule.
const spacingClasses = {
  default: "mt-24 border-t border-border pt-12 sm:mt-32 sm:pt-16",
  compact: "mt-12",
  hero: "",
};

export function PageSection({
  className,
  spacing = "default",
  ...props
}: PageSectionProps) {
  return (
    <section
      className={cn("scroll-mt-24", spacingClasses[spacing], className)}
      {...props}
    />
  );
}
