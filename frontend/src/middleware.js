import { NextResponse } from "next/server";

const PUBLIC_ROUTES = ["/", "/posts", "/auth/login", "/auth/register", "/auth/forgot-password", "/auth/reset-password"];
const AUTH_ROUTES = ["/auth/login", "/auth/register"];
const ADMIN_ROUTES = ["/admin"];
const PROTECTED_ROUTES = ["/dashboard", "/posts/new"];

/**
 * Vérifie si un pathname commence par l'un des préfixes donnés.
 */
const matchesAny = (pathname, prefixes) =>
  prefixes.some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"));

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const refreshToken = request.cookies.get("refreshToken")?.value;
  const isAuthenticated = Boolean(refreshToken);

  // 1. Routes admin → nécessitent d'être connecté
  //    Le rôle admin est vérifié côté page (le middleware Next.js n'a pas accès au JWT décodé côté serveur ici)
  if (matchesAny(pathname, ADMIN_ROUTES)) {
    if (!isAuthenticated) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // 2. Routes protégées (dashboard, créer une annonce) → redirect login si non connecté
  if (matchesAny(pathname, PROTECTED_ROUTES)) {
    if (!isAuthenticated) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // 3. Routes auth (login/register) → redirect accueil si déjà connecté
  if (matchesAny(pathname, AUTH_ROUTES) && isAuthenticated) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Appliquer le middleware sur toutes les routes sauf fichiers statiques et API Next.js
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
