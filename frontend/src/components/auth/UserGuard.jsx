"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAppSelector } from "@/store/hooks";

/**
 * UserGuard — wraps any page that requires authentication (any role).
 *
 * Renders a spinner while hydrating.
 * Redirects to /auth/login if the user is not authenticated.
 * Renders children for any authenticated user.
 *
 * Usage:
 *   export default function SomePage() {
 *     return (
 *       <UserGuard>
 *         <PageContent />
 *       </UserGuard>
 *     );
 *   }
 */
export default function UserGuard({ children }) {
  const router = useRouter();
  const { user, isHydrating } = useAppSelector((s) => s.auth);

  useEffect(() => {
    if (isHydrating) return;
    if (!user) {
      router.replace(
        `/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`
      );
    }
  }, [user, isHydrating, router]);

  // ── Still loading session ────────────────────────────────────────────────
  if (isHydrating || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: "#0d0f14" }}>
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#4f8ef7" }} />
      </div>
    );
  }

  return children;
}
