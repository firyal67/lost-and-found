"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { MapPin, Menu, X, Plus, LayoutDashboard, LogOut, User, Shield, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logoutUser } from "@/store/slices/authSlice";
import toast from "react-hot-toast";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { user, isHydrating } = useAppSelector((s) => s.auth);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  /* ── shadow on scroll ── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ── close mobile menu on route change ── */
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    toast.success("Déconnecté avec succès");
    router.push("/");
  };

  const navLinks = [{ href: "/posts", label: "Annonces" }];
  const isActive = (href) => pathname === href || pathname.startsWith(href + "/");

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-200
        ${scrolled
          ? "bg-white/95 backdrop-blur-md shadow-[0_1px_12px_rgb(0_0_0/.08)] border-b border-border/60"
          : "bg-white/90 backdrop-blur-sm border-b border-border/40"
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">

          {/* ── Logo ── */}
          <Link
            href="/"
            className="flex items-center gap-2 shrink-0 group"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 shadow-sm group-hover:shadow-md transition-shadow">
              <MapPin className="h-4.5 w-4.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-lg font-bold tracking-tight text-gray-900">
              Lost<span className="text-blue-600">&amp;</span>Found
            </span>
            <span className="hidden sm:inline-block text-[11px] font-medium text-gray-400 bg-gray-100 rounded-full px-2 py-0.5 leading-none mt-px">
              Tunisie
            </span>
          </Link>

          {/* ── Nav desktop ── */}
          <nav className="hidden md:flex items-center gap-0.5 flex-1 ml-2">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`relative px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150
                  ${isActive(href)
                    ? "text-blue-600 bg-blue-50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50/80"
                  }`}
              >
                {label}
                {isActive(href) && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-600" />
                )}
              </Link>
            ))}
          </nav>

          {/* ── Actions desktop ── */}
          <div className="hidden md:flex items-center gap-2">
            {isHydrating ? (
              <div className="flex gap-2">
                <div className="h-8 w-28 animate-pulse bg-gray-100 rounded-lg" />
                <div className="h-8 w-20 animate-pulse bg-gray-100 rounded-lg" />
              </div>
            ) : user ? (
              <>
                {user.role === "admin" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => router.push("/admin")}
                    className="gap-1.5 text-violet-600 hover:text-violet-700 hover:bg-violet-50 font-medium"
                  >
                    <Shield className="h-3.5 w-3.5" />
                    Admin
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => router.push("/dashboard")}
                  className="gap-1.5 text-gray-600 hover:text-gray-900 font-medium"
                >
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  Dashboard
                </Button>

                <Button
                  size="sm"
                  onClick={() => router.push("/posts/new")}
                  className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-medium"
                >
                  <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                  Nouvelle annonce
                </Button>

                {/* ── User chip ── */}
                <div className="flex items-center gap-1 pl-2 ml-1 border-l border-border">
                  <div className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-semibold text-xs shrink-0">
                    {user.name?.[0]?.toUpperCase() ?? "U"}
                  </div>
                  <span className="hidden lg:block text-sm font-medium text-gray-700 truncate max-w-[110px]">
                    {user.name}
                  </span>
                  <button
                    onClick={handleLogout}
                    title="Se déconnecter"
                    className="ml-1 p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => router.push("/auth/login")}
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  Se connecter
                </Button>
                <Button
                  size="sm"
                  onClick={() => router.push("/auth/register")}
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-medium"
                >
                  Créer un compte
                </Button>
              </>
            )}
          </div>

          {/* ── Burger mobile ── */}
          <button
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border/60 bg-white/98 px-4 py-3 space-y-1 shadow-lg">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${isActive(href)
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
            >
              {label}
            </Link>
          ))}

          <div className="pt-2 mt-2 border-t border-border/60 space-y-1">
            {user ? (
              <>
                {/* User identity row */}
                <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm shrink-0">
                    {user.name?.[0]?.toUpperCase() ?? "U"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{user.name}</p>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  </div>
                </div>

                <button
                  onClick={() => router.push("/posts/new")}
                  className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Nouvelle annonce
                </button>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </button>
                {user.role === "admin" && (
                  <button
                    onClick={() => router.push("/admin")}
                    className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-violet-600 hover:bg-violet-50 transition-colors"
                  >
                    <Shield className="h-4 w-4" />
                    Admin
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Se déconnecter
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => router.push("/auth/login")}
                  className="flex items-center w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Se connecter
                </button>
                <button
                  onClick={() => router.push("/auth/register")}
                  className="flex items-center justify-center w-full px-3 py-2.5 rounded-lg text-sm font-semibold bg-blue-600 text-white transition-opacity hover:opacity-90"
                >
                  Créer un compte
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
