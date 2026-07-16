"use client";

import * as React from "react";
import Link from "next/link";
import { Search, CheckCircle, Eye, EyeOff } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

/* ─────────────────────────────────────────────
   Brand panel — left column on lg screens
───────────────────────────────────────────── */
export function AuthBrandPanel({ title, subtitle, bullets = [] }) {
  return (
    <div className="hidden lg:flex lg:w-[44%] xl:w-[46%] flex-col justify-between p-12 relative overflow-hidden shrink-0"
      style={{ background: "linear-gradient(160deg, #13161e 0%, #0d1520 100%)" }}
    >
      {/* Ambient glows */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-24 w-[420px] h-[420px] rounded-full opacity-30"
          style={{ background: "radial-gradient(circle, rgba(79,142,247,0.18) 0%, transparent 70%)" }} />
        <div className="absolute bottom-0 right-0 w-[360px] h-[360px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, rgba(79,142,247,0.14) 0%, transparent 70%)" }} />
        <div className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      {/* Logo */}
      <div className="relative z-10 flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl"
          style={{ background: "linear-gradient(135deg, #4f8ef7, #3a7ae4)", boxShadow: "0 0 20px rgba(79,142,247,0.35)" }}
        >
          <Search className="h-5 w-5 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <span className="font-sans font-[700] text-[20px] tracking-[-0.02em] text-[#f0f2f8]">
            Lost<span className="text-[#4f8ef7]">&</span>Found
          </span>
          <span className="block text-[11px] font-[600] text-[#4f8ef7] tracking-[0.08em] uppercase leading-none mt-0.5">
            Tunisie
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 space-y-8">
        <div className="space-y-4">
          <h2 className="font-sans font-[700] text-[32px] leading-[1.15] tracking-[-0.025em] text-[#f0f2f8]">
            {title}
          </h2>
          <p className="font-sans text-[16px] leading-[1.65] text-[#8b91a8]">{subtitle}</p>
        </div>
        {bullets.length > 0 && (
          <ul className="space-y-3">
            {bullets.map((b) => (
              <li key={b} className="flex items-center gap-3 text-[14px] text-[#8b91a8]">
                <span className="flex items-center justify-center w-5 h-5 rounded-full shrink-0"
                  style={{ background: "rgba(79,142,247,0.15)", border: "1px solid rgba(79,142,247,0.25)" }}
                >
                  <CheckCircle className="h-3 w-3 text-[#4f8ef7]" />
                </span>
                {b}
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="relative z-10 font-sans text-[12px] text-[#3d4460]">
        &copy; {new Date().getFullYear()} Lost&amp;Found Tunisie
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Mobile logo (shown on small screens)
───────────────────────────────────────────── */
export function MobileLogo() {
  return (
    <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
      <div className="flex items-center justify-center w-9 h-9 rounded-xl"
        style={{ background: "linear-gradient(135deg, #4f8ef7, #3a7ae4)", boxShadow: "0 0 16px rgba(79,142,247,0.30)" }}
      >
        <Search className="h-4.5 w-4.5 text-white" strokeWidth={2.5} />
      </div>
      <span className="font-sans font-[700] text-[20px] tracking-[-0.02em] text-[#f0f2f8]">
        Lost<span className="text-[#4f8ef7]">&</span>Found
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Form field wrapper
───────────────────────────────────────────── */
export function FormField({ label, labelRight, error, hint, children, htmlFor }) {
  return (
    <div className="space-y-1.5">
      {(label || labelRight) && (
        <div className="flex items-center justify-between">
          {label && (
            <Label htmlFor={htmlFor} className="text-[13px] font-[500] text-[#b8bdd0]">
              {label}
            </Label>
          )}
          {labelRight}
        </div>
      )}
      {children}
      {error ? (
        <p className="text-[12px] font-[500] text-[#f87171]" role="alert">{error}</p>
      ) : hint ? (
        <p className="text-[12px] text-[#6b7494]">{hint}</p>
      ) : null}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Password input with toggle
───────────────────────────────────────────── */
export const PasswordInput = React.forwardRef(
  ({ show, onToggle, hasError, ...props }, ref) => (
    <div className="relative">
      <Input
        type={show ? "text" : "password"}
        className={hasError ? "border-[#f87171] pr-10" : "pr-10"}
        ref={ref}
        {...props}
      />
      <button
        type="button"
        onClick={onToggle}
        tabIndex={-1}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7494] hover:text-[#b8bdd0] transition-colors"
        aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
);
PasswordInput.displayName = "PasswordInput";

/* ─────────────────────────────────────────────
   Auth form card wrapper
───────────────────────────────────────────── */
export function AuthFormCard({ children }) {
  return (
    <div
      className="animate-fade-in p-8 sm:p-10 rounded-xl"
      style={{
        background: "#13161e",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 8px 28px rgba(0,0,0,0.50), 0 3px 8px rgba(0,0,0,0.35)",
      }}
    >
      {children}
    </div>
  );
}
