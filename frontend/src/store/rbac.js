/**
 * RBAC hooks and utilities for role-based rendering in React components.
 *
 * All hooks read from the Redux auth slice and are safe to call anywhere
 * inside the component tree (they do not cause redirects — use RoleGuard
 * or AdminGuard for page-level enforcement).
 *
 * Usage:
 *   import { useIsAdmin, useHasRole, useIsOwner, useCanAccess } from "@/store/rbac";
 */

import { useAppSelector } from "./hooks";

// ── Primitive role hooks ───────────────────────────────────────────────────

/**
 * Returns the authenticated user object, or null when not logged in.
 */
export const useAuthUser = () => useAppSelector((s) => s.auth.user);

/**
 * Returns true while the auth store is rehydrating from the server session.
 * Use this to suppress role-conditional UI flicker on first render.
 */
export const useIsHydrating = () => useAppSelector((s) => s.auth.isHydrating);

/**
 * Returns true when a user is authenticated (any role).
 */
export const useIsAuthenticated = () => {
  const user = useAppSelector((s) => s.auth.user);
  return Boolean(user);
};

/**
 * Returns true when the authenticated user has the `admin` role.
 */
export const useIsAdmin = () => {
  const user = useAppSelector((s) => s.auth.user);
  return user?.role === "admin";
};

/**
 * Returns true when the authenticated user has the given role.
 *
 * @param {string} role — e.g. "admin" | "user"
 *
 * @example
 *   const isModerator = useHasRole("moderator");
 */
export const useHasRole = (role) => {
  const user = useAppSelector((s) => s.auth.user);
  return user?.role === role;
};

// ── Resource ownership hook ───────────────────────────────────────────────

/**
 * Returns true when the authenticated user owns the given resource.
 * Also returns true for admins (they can act on any resource).
 *
 * @param {string|null|undefined} ownerId — the resource's owner ObjectId string
 * @param {object} [options]
 * @param {boolean} [options.adminBypass=true] — whether admins always pass
 *
 * @example
 *   const canEdit = useIsOwner(post.author._id);
 *   // show edit button only to the post's author or an admin
 *   {canEdit && <EditButton />}
 */
export const useIsOwner = (ownerId, { adminBypass = true } = {}) => {
  const user = useAppSelector((s) => s.auth.user);
  if (!user || !ownerId) return false;
  if (adminBypass && user.role === "admin") return true;
  return user._id === ownerId || user._id === ownerId?.toString();
};

// ── Flexible access check ─────────────────────────────────────────────────

/**
 * Evaluates an access rule against the current user and returns a boolean.
 * Mirrors the `require` prop semantics of RoleGuard.
 *
 * @param {"auth"|"admin"|string|function} rule
 *   "auth"      → any authenticated user
 *   "admin"     → role must be "admin"
 *   string      → exact role match
 *   function    → predicate (user) => boolean
 *
 * @example
 *   const canViewReports = useCanAccess("admin");
 *   const canPost = useCanAccess("auth");
 *   const canSeeOwn = useCanAccess((u) => u._id === someOwnerId);
 */
export const useCanAccess = (rule = "auth") => {
  const user = useAppSelector((s) => s.auth.user);
  if (!user) return false;
  if (rule === "auth")  return true;
  if (rule === "admin") return user.role === "admin";
  if (typeof rule === "function") return Boolean(rule(user));
  return user.role === rule;
};
