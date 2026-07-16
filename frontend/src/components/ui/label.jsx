import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";

const Label = React.forwardRef(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={[
      "block font-sans text-label-md text-neutral-200 leading-none select-none",
      "peer-disabled:cursor-not-allowed peer-disabled:opacity-60",
      className || "",
    ].join(" ")}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
