import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  /* base */
  `inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold
   transition-all duration-150 focus-visible:outline-none focus-visible:ring-2
   focus-visible:ring-ring focus-visible:ring-offset-2
   disabled:pointer-events-none disabled:opacity-50 select-none`,
  {
    variants: {
      variant: {
        /* ── Primary: gradient blue → indigo ── */
        default:
          "bg-blue-600 text-white shadow-sm hover:bg-blue-700 active:scale-[.98]",

        /* ── Destructive ── */
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 active:scale-[.98]",

        /* ── Outline ── */
        outline:
          "border border-border bg-white text-gray-700 shadow-sm hover:bg-gray-50 hover:border-gray-300 active:scale-[.98]",

        /* ── Secondary / muted fill ── */
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/70 active:scale-[.98]",

        /* ── Ghost ── */
        ghost:
          "text-gray-600 hover:bg-gray-100 hover:text-gray-900 active:scale-[.98]",

        /* ── Link ── */
        link: "text-blue-600 underline-offset-4 hover:underline p-0 h-auto font-medium",

        /* ── Success ── */
        success:
          "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 active:scale-[.98]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm:      "h-8 px-3 text-xs rounded-md",
        lg:      "h-11 px-6 text-base",
        xl:      "h-12 px-8 text-base",
        icon:    "h-9 w-9 rounded-lg",
        "icon-sm": "h-7 w-7 rounded-md",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
