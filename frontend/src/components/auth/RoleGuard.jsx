"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldOff } from "lucide-react";
import { useAppSelector } from "@/store/hooks";

/**
 * RoleGuard — universal role-based access control wrapper for any page.
 *
 * Handles three protection levels via the `require` prop:
 *
 *   "auth"          → any authenticated user (same as UserGuard)
 *   "admin"         → must have role === "admin"
 *   (string | fn)   → custom role string or predicate: (user) => boolean
 *
 * Props:
 *   require   {string|function}  — access rule (default: "auth")
 *   redirect  {string}           — path to redirect unauthenticated users
 *                                  (default: /auth/login with ?redirect=...)
 *   fallback  {ReactNode}        — custom 403 UI instead of the default screen
 *   children  {ReactNode}
 *
 * Usage:
 *   // Any logged-in user
 *   <RoleGuard>…</RoleGuard>
 *
 *   // Admin only
 *   <RoleGuard require="admin">…</RoleGuard>
 *
 *   // Custom predicate
 *   <RoleGuard require={(u) => u.role === "admin" || u.isVerified}>…</RoleGuard>
 */
export default function RoleGuard({
  children,
  require: rule = "auth",
  redirect,
  fallback,
}) {
  const router = useRouter();
  const { user, isHydrating } = useAppSelector((s) => s.auth);

  // Resolve whether the current user passes the access rule
  const passes = (() => {
    if (!user) return false;
    if (rule === "auth")  return true;
    if (rule === "admin") return user.role === "admin";
    if (typeof rule === "function") return Boolean(rule(user));
    // treat any other string as an exact role match
    return user.role === rule;
  })();

  useEffect(() => {
    if (isHydrating) return;
    if (!user) {
      const loginPath = redirect ?? `/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      router.replace(loginPath);
    }
  }, [user, isHydrating, router, redirect]);

  // ── Still hydrating ──────────────────────────────────────────────────────
  if (isHydrating) {
    return <SpinnerScreen />;
  }

  // ── Not authenticated — redirect in progress ─────────────────────────────
  if (!user) {
    return <SpinnerScreen />;
  }

  // ── Authenticated but access denied ─────────────────────────────────────
  if (!passes) {
    if (fallback) return fallback;
    return <AccessDeniedScreen onBack={() => router.replace("/")} />;
  }

  return children;
}

/* ── Internal sub-components ─────────────────────────────────────────────── */

function SpinnerScreen() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "#0d0f14" }}
    >
      <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#4f8ef7" }} />
    </div>
  );
}

function AccessDeniedScreen({ onBack }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-5"
      style={{ background: "#0d0f14" }}
    >
      <div
        className="flex items-center justify-center w-16 h-16 rounded-2xl"
        style={{
          background: "rgba(248,113,113,0.10)",
          border: "1px solid rgba(248,113,113,0.22)",
        }}
      >
        <ShieldOff className="h-7 w-7" style={{ color: "#f87171" }} />
      </div>

      <div className="text-center">
        <p
          className="font-sans font-[700] text-[20px] tracking-[-0.02em]"
          style={{ color: "#f0f2f8" }}
        >
          Accès refusé
        </p>
        <p className="text-[14px] mt-1" style={{ color: "#6b7494" }}>
          Vous n&apos;avez pas les permissions nécessaires pour accéder à cette page.
        </p>
      </div>

      <button
        onClick={onBack}
        className="px-5 py-2.5 rounded-lg text-[13px] font-[600] transition-all"
        style={{
          background: "rgba(79,142,247,0.10)",
          color: "#4f8ef7",
          border: "1px solid rgba(79,142,247,0.22)",
        }}
      >
        Retour à l&apos;accueil
      </button>
    </div>
  );
}
