import * as React from "react";

const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={`card-sof ${className || ""}`}
    {...props}
  />
));
Card.displayName = "Card";

const CardInteractive = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={`card-sof card-sof--interactive ${className || ""}`}
    {...props}
  />
));
CardInteractive.displayName = "CardInteractive";

const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={`flex flex-col space-y-1.5 pb-3 ${className || ""}`} {...props} />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h3 ref={ref} className={`font-slab text-h3 text-neutral-50 ${className || ""}`} {...props} />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p ref={ref} className={`font-sans text-body-sm text-neutral-200 ${className || ""}`} {...props} />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={`pt-0 ${className || ""}`} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={`flex items-center pt-3 mt-2 border-t border-border-subtle ${className || ""}`}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export { Card, CardInteractive, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
