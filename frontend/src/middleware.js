import { NextResponse } from "next/server";

const AUTH_ROUTES = ["/auth/login", "/auth/register"];
const ADMIN_ROUTES = ["/admin"];
const PROTECTED_ROUTES = ["/dashboard", "/posts/new"];

const matchesAny = (pathname, prefixes) =>
  prefixes.some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"));

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const refreshToken = request.cookies.get("refreshToken")?.value;
  const isAuthenticated = Boolean(refreshToken && refreshToken.length > 10);

  if (matchesAny(pathname, ADMIN_ROUTES)) {
    if (!isAuthenticated) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (matchesAny(pathname, PROTECTED_ROUTES)) {
    if (!isAuthenticated) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Ne pas rediriger depuis les pages auth — le cookie peut être expiré côté serveur.
  // La redirection post-login est gérée côté client dans chaque page.

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
