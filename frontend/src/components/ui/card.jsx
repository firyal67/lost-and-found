import * as React from "react";
import { cn } from "@/lib/utils";

/* ── Card shell ── */
const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-2xl border border-border/70 bg-card text-card-foreground shadow-card",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

/* ── Header ── */
const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6 pb-4", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

/* ── Title ── */
const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-lg font-bold leading-tight tracking-tight text-gray-900",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

/* ── Description ── */
const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground leading-relaxed", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

/* ── Content ── */
const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("px-6 pb-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

/* ── Footer ── */
const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center px-6 pb-6 pt-0 border-t border-border/40 mt-2",
      className
    )}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
