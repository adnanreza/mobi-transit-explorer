import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  headingLevel?: 2 | 3;
  className?: string;
};

export function SectionHeader({
  title,
  description,
  eyebrow,
  headingLevel = 2,
  className,
}: SectionHeaderProps) {
  const Heading = headingLevel === 2 ? "h2" : "h3";

  return (
    <div className={cn("space-y-4", className)}>
      {eyebrow ? (
        <Badge className="bg-primary/10 text-primary" variant="secondary">
          {eyebrow}
        </Badge>
      ) : null}
      <Heading className="text-3xl font-semibold tracking-normal text-slate-950 sm:text-4xl">
        {title}
      </Heading>
      {description ? (
        <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
          {description}
        </p>
      ) : null}
    </div>
  );
}
