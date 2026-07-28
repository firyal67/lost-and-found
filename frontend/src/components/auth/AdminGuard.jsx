"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldOff } from "lucide-react";
import { useAppSelector } from "@/store/hooks";

/**
 * AdminGuard — wraps any admin-only page.
 *
 * Renders a spinner while the auth store is hydrating.
 * Redirects to /auth/login if the user is not authenticated.
 * Renders a 403 screen if the user is authenticated but not an admin.
 * Renders children only when user.role === "admin".
 *
 * Usage:
 *   export default function SomeAdminPage() {
 *     return (
 *       <AdminGuard>
 *         <PageContent />
 *       </AdminGuard>
 *     );
 *   }
 */
export default function AdminGuard({ children }) {
  const router = useRouter();
  const { user, isHydrating } = useAppSelector((s) => s.auth);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (isHydrating) return;
    if (!user) {
      router.replace(
        `/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`
      );
    }
  }, [user, isHydrating, router]);

  // ── Still loading session ────────────────────────────────────────────────
  if (isHydrating) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: "#0d0f14" }}>
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#4f8ef7" }} />
      </div>
    );
  }

  // ── Not logged in — redirect in progress (useEffect above) ──────────────
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: "#0d0f14" }}>
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#4f8ef7" }} />
      </div>
    );
  }

  // ── Logged in but not admin — 403 ────────────────────────────────────────
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-5"
        style={{ background: "#0d0f14" }}>
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl"
          style={{ background: "rgba(248,113,113,0.10)", border: "1px solid rgba(248,113,113,0.22)" }}>
          <ShieldOff className="h-7 w-7" style={{ color: "#f87171" }} />
        </div>
        <div className="text-center">
          <p className="font-sans font-[700] text-[20px] tracking-[-0.02em]"
            style={{ color: "#f0f2f8" }}>
            Accès refusé
          </p>
          <p className="text-[14px] mt-1" style={{ color: "#6b7494" }}>
            Cette page est réservée aux administrateurs.
          </p>
        </div>
        <button
          onClick={() => router.replace("/")}
          className="px-5 py-2.5 rounded-lg text-[13px] font-[600] transition-all"
          style={{ background: "rgba(79,142,247,0.10)", color: "#4f8ef7", border: "1px solid rgba(79,142,247,0.22)" }}
        >
          Retour à l&apos;accueil
        </button>
      </div>
    );
  }

  // ── Admin — render page ──────────────────────────────────────────────────
  return children;
}
