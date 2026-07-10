import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

type PageSectionProps = ComponentPropsWithoutRef<"section"> & {
  spacing?: "default" | "compact" | "hero";
};

const spacingClasses = {
  default: "mt-24 sm:mt-32",
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
