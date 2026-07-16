import * as React from "react";

const Input = React.forwardRef(({ className, type, ...props }, ref) => (
  <input
    type={type}
    ref={ref}
    className={[
      // layout
      "flex h-[42px] w-full",
      // shape
      "rounded-md border border-[rgba(255,255,255,0.08)]",
      // color
      "bg-[#161921] text-[#f0f2f8]",
      // spacing
      "px-3 py-2",
      // typography
      "font-sans text-[14px] leading-normal",
      // placeholder
      "placeholder:text-[#6b7494]",
      // transitions
      "transition-all duration-150",
      // hover
      "hover:border-[rgba(255,255,255,0.16)]",
      // focus
      "focus-visible:outline-none focus-visible:border-[#4f8ef7] focus-visible:ring-2 focus-visible:ring-[rgba(79,142,247,0.20)] focus-visible:ring-offset-0",
      // disabled
      "disabled:cursor-not-allowed disabled:opacity-40",
      className ?? "",
    ].join(" ")}
    {...props}
  />
));
Input.displayName = "Input";

export { Input };
