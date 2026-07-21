import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  title: string;
  description?: string;
  headingLevel?: 2 | 3;
  className?: string;
};

// Portfolio section-header pattern: the section name is a mono uppercase
// eyebrow (it stays the h2/h3 so nav targets and the outline read the same),
// and the description carries the visual weight as an ink lead-in.
export function SectionHeader({
  title,
  description,
  headingLevel = 2,
  className,
}: SectionHeaderProps) {
  const Heading = headingLevel === 2 ? "h2" : "h3";

  return (
    <div className={cn("space-y-5", className)}>
      <Heading className="eyebrow">{title}</Heading>
      {description ? (
        <p className="max-w-2xl text-xl leading-snug tracking-[-0.018em] text-foreground sm:text-2xl">
          {description}
        </p>
      ) : null}
    </div>
  );
}
