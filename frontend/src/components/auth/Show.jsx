"use client";

import { useCanAccess, useIsOwner } from "@/store/rbac";

/**
 * <Show> — declarative role-based conditional rendering.
 *
 * Renders `children` only when the access check passes.
 * Renders `fallback` (default: null) otherwise.
 *
 * Props:
 *   when     {"auth"|"admin"|string|function}  — access rule (default: "auth")
 *   owner    {string}   — if provided, also checks useIsOwner(owner)
 *                         (admin bypass applies automatically)
 *   fallback {ReactNode} — rendered when access is denied (default: null)
 *
 * Usage:
 *   // Show only to authenticated users
 *   <Show when="auth"><ContactButton /></Show>
 *
 *   // Show only to admins
 *   <Show when="admin"><BanButton /></Show>
 *
 *   // Show to owner OR admin
 *   <Show owner={post.author._id}><EditButton /></Show>
 *
 *   // Custom predicate
 *   <Show when={(u) => u.isEmailVerified}><VerifiedBadge /></Show>
 *
 *   // With fallback
 *   <Show when="admin" fallback={<p>Réservé aux admins</p>}>
 *     <AdminPanel />
 *   </Show>
 */
export default function Show({ children, when = "auth", owner, fallback = null }) {
  const passesRule  = useCanAccess(when);
  const passesOwner = useIsOwner(owner);

  // If `owner` is provided, either rule OR ownership must pass
  const allowed = owner !== undefined ? (passesOwner || passesRule) : passesRule;

  return allowed ? children : fallback;
}
