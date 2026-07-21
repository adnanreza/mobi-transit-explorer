import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Portfolio button language: nothing is filled. `default`/`outline` are quiet
// hairline-bordered controls; `cta` is the portfolio's mono underlined link
// (its own height/padding, so size is best left "default"); focus comes from
// the global :focus-visible outline in index.css.
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border border-border bg-transparent text-foreground hover:border-foreground",
        outline: "border border-border bg-transparent text-foreground hover:border-foreground",
        ghost: "text-muted-foreground hover:text-foreground",
        cta: "h-auto rounded-none border-b border-muted-2 px-0 pb-1 font-mono text-sm font-normal tracking-[0.04em] text-foreground hover:border-foreground",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    compoundVariants: [
      // cta draws its height from the text; neutralize the size box.
      { variant: "cta", size: "default", class: "h-auto px-0 py-0" },
      { variant: "cta", size: "lg", class: "h-auto px-0 py-0 text-sm" },
      { variant: "cta", size: "sm", class: "h-auto px-0 py-0" },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";

export { Button, buttonVariants };
