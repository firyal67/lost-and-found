"use client";

import * as React from "react";
import Link from "next/link";
import { MapPin, CheckCircle, Eye, EyeOff } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

/* ══════════════════════════════════════════════════
   AuthBrandPanel
   Left decorative column shown on lg+ screens.
══════════════════════════════════════════════════ */
export function AuthBrandPanel({ title, subtitle, bullets = [] }) {
  return (
    <div className="hidden lg:flex lg:w-[42%] xl:w-[45%] flex-col justify-between p-12 bg-gradient-to-br from-blue-600 to-indigo-600 text-white relative overflow-hidden shrink-0">
      {/* decorative circles */}
      <div aria-hidden className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/10" />
      <div aria-hidden className="absolute -bottom-28 -left-16 w-80 h-80 rounded-full bg-white/10" />

      {/* Logo */}
      <div className="relative z-10 flex items-center gap-2.5">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm">
          <MapPin className="h-5 w-5 text-white" strokeWidth={2.5} />
        </div>
        <span className="text-xl font-bold tracking-tight">Lost&amp;Found</span>
        <span className="text-xs font-medium bg-white/20 rounded-full px-2 py-0.5 leading-none">
          Tunisie
        </span>
      </div>

      {/* Copy */}
      <div className="relative z-10 space-y-6">
        <div>
          <h2 className="text-3xl font-extrabold leading-tight tracking-tight">{title}</h2>
          <p className="mt-3 text-blue-100 text-base leading-relaxed">{subtitle}</p>
        </div>
        {bullets.length > 0 && (
          <ul className="space-y-3">
            {bullets.map((b) => (
              <li key={b} className="flex items-center gap-2.5 text-sm text-blue-50">
                <CheckCircle className="h-4 w-4 text-white/80 shrink-0" />
                {b}
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="relative z-10 text-xs text-blue-200">
        © {new Date().getFullYear()} Lost&amp;Found Tunisie
      </p>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   MobileLogo
   Centered logo shown on small screens (no panel).
══════════════════════════════════════════════════ */
export function MobileLogo() {
  return (
    <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 shadow-sm">
        <MapPin className="h-4 w-4 text-white" strokeWidth={2.5} />
      </div>
      <span className="text-lg font-bold tracking-tight text-gray-900">
        Lost<span className="text-blue-600">&amp;</span>Found
      </span>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   FormField
   Label + input slot + optional error / hint.
══════════════════════════════════════════════════ */
export function FormField({ label, labelRight, error, hint, children, htmlFor }) {
  return (
    <div className="space-y-1.5">
      {(label || labelRight) && (
        <div className="flex items-center justify-between">
          {label && <Label htmlFor={htmlFor}>{label}</Label>}
          {labelRight}
        </div>
      )}
      {children}
      {error
        ? <p className="text-xs text-destructive font-medium" role="alert">{error}</p>
        : hint
        ? <p className="text-xs text-muted-foreground">{hint}</p>
        : null}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   PasswordInput
   Input with show/hide toggle button.
══════════════════════════════════════════════════ */
export const PasswordInput = React.forwardRef(
  ({ show, onToggle, hasError, ...props }, ref) => (
    <div className="relative">
      <Input
        type={show ? "text" : "password"}
        className={hasError ? "border-destructive pr-10" : "pr-10"}
        ref={ref}
        {...props}
      />
      <button
        type="button"
        onClick={onToggle}
        tabIndex={-1}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
);
PasswordInput.displayName = "PasswordInput";

/* ══════════════════════════════════════════════════
   AuthFormCard
   White rounded card that wraps the form content.
══════════════════════════════════════════════════ */
export function AuthFormCard({ children }) {
  return (
    <div className="bg-white rounded-2xl border border-border/70 shadow-card p-8">
      {children}
    </div>
  );
}
