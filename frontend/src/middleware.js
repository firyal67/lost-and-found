import { NextResponse } from "next/server";

// Routes that require only authentication (any logged-in user)
const PROTECTED_ROUTES = [
  "/dashboard",
  "/posts/new",
];

// Routes that require authentication AND admin role.
// The middleware can only check cookie presence (not the JWT role claim) at the edge,
// so we redirect unauthenticated users here. The role check is handled by AdminGuard
// inside the page component once the Redux store is hydrated.
const ADMIN_ROUTES = [
  "/dashboard/admin",
  "/dashboard/reports",
];

const matchesAny = (pathname, prefixes) =>
  prefixes.some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"));

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const refreshToken    = request.cookies.get("refreshToken")?.value;
  const isAuthenticated = Boolean(refreshToken && refreshToken.length > 10);

  // Admin routes — must be checked BEFORE generic protected routes
  // because /dashboard/reports and /dashboard/admin are sub-paths of /dashboard
  if (matchesAny(pathname, ADMIN_ROUTES)) {
    if (!isAuthenticated) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
    // Role check is deferred to the AdminGuard client component
    return NextResponse.next();
  }

  // General protected routes
  if (matchesAny(pathname, PROTECTED_ROUTES)) {
    if (!isAuthenticated) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
