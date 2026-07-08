import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      /* base */
      `flex h-10 w-full rounded-lg border border-border bg-white px-3.5 py-2
       text-sm text-foreground shadow-sm
       placeholder:text-muted-foreground/60
       transition-colors duration-150
       /* focus */
       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:border-blue-400
       /* disabled */
       disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted`,
      className
    )}
    ref={ref}
    {...props}
  />
));
Input.displayName = "Input";

export { Input };
