import type { CSSProperties, ElementType, ReactNode } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { cn } from "@/lib/utils";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  /** Render a different wrapper element (e.g. "dl") to preserve semantics. */
  as?: ElementType;
  /** Cascade direct children instead of animating the wrapper as one block. */
  stagger?: boolean;
  /** Milliseconds between each child's reveal when staggering. */
  staggerStep?: number;
};

export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = "div",
  stagger = false,
  staggerStep = 70,
}: RevealProps) {
  const { ref, isVisible } = useScrollReveal<HTMLElement>();

  if (stagger) {
    return (
      <Tag
        ref={ref}
        data-visible={isVisible}
        className={cn("reveal-stagger", className)}
        style={{ "--stagger-step": `${staggerStep}ms` } as CSSProperties}
      >
        {children}
      </Tag>
    );
  }

  return (
    <Tag
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-out",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
        className,
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}
