import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";

const buttonVariants = cva(
  [
    // base layout
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    // typography
    "font-sans font-[500] tracking-[-0.005em]",
    // interaction
    "transition-all duration-150 cursor-pointer select-none",
    // focus ring
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4f8ef7] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0f14]",
    // disabled
    "disabled:pointer-events-none disabled:opacity-40",
  ].join(" "),
  {
    variants: {
      variant: {
        /* ── Primary ─────────────────────────────────────── */
        default: [
          "bg-[#4f8ef7] text-white rounded-lg",
          "shadow-[0_1px_3px_rgba(0,0,0,0.35)]",
          "hover:bg-[#7aabfa] hover:shadow-[0_0_20px_rgba(79,142,247,0.30)]",
          "active:scale-[.97] active:bg-[#3a7ae4]",
        ].join(" "),

        /* ── Secondary — outlined ────────────────────────── */
        secondary: [
          "bg-transparent text-[#b8bdd0] rounded-lg",
          "border border-[rgba(255,255,255,0.12)]",
          "hover:bg-[#1a1e28] hover:text-[#f0f2f8] hover:border-[rgba(255,255,255,0.20)]",
          "active:scale-[.97]",
        ].join(" "),

        /* ── Tertiary — ghost with subtle fill ───────────── */
        tertiary: [
          "bg-transparent text-[#b8bdd0] rounded-lg",
          "hover:bg-[#1a1e28] hover:text-[#f0f2f8]",
          "active:scale-[.97]",
        ].join(" "),

        /* ── Destructive ─────────────────────────────────── */
        destructive: [
          "bg-[#f87171] text-white rounded-lg",
          "hover:bg-[#fca5a5] hover:shadow-[0_0_16px_rgba(248,113,113,0.25)]",
          "active:scale-[.97]",
        ].join(" "),

        /* ── Ghost ───────────────────────────────────────── */
        ghost: [
          "bg-transparent text-[#6b7494] rounded-lg",
          "hover:bg-[#1a1e28] hover:text-[#b8bdd0]",
          "active:scale-[.97]",
        ].join(" "),

        /* ── Link ────────────────────────────────────────── */
        link: [
          "bg-transparent text-[#7aabfa] p-0 h-auto",
          "underline-offset-4 hover:underline hover:text-[#a5c7fc]",
          "font-[400]",
        ].join(" "),

        /* ── Outline (legacy alias for secondary) ────────── */
        outline: [
          "bg-transparent text-[#b8bdd0] rounded-lg",
          "border border-[rgba(255,255,255,0.12)]",
          "hover:bg-[#1a1e28] hover:text-[#f0f2f8] hover:border-[rgba(255,255,255,0.20)]",
          "active:scale-[.97]",
        ].join(" "),
      },
      size: {
        default: "h-[38px] px-4 py-2 text-[13px] rounded-lg",
        sm:      "h-[32px] px-3 py-1.5 text-[12px] rounded-md",
        lg:      "h-[44px] px-6 py-2.5 text-[14px] rounded-lg",
        xl:      "h-[50px] px-8 py-3 text-[15px] rounded-lg",
        icon:    "h-[38px] w-[38px] p-0 rounded-lg",
        "icon-sm":"h-[32px] w-[32px] p-0 rounded-md",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={buttonVariants({ variant, size, className })}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
