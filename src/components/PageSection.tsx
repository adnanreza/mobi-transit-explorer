import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

type PageSectionProps = ComponentPropsWithoutRef<"section"> & {
  spacing?: "default" | "compact" | "hero";
};

const spacingClasses = {
  default: "mt-14",
  compact: "mt-8",
  hero: "",
};

export function PageSection({
  className,
  spacing = "default",
  ...props
}: PageSectionProps) {
  return (
    <section
      className={cn("scroll-mt-32", spacingClasses[spacing], className)}
      {...props}
    />
  );
}
