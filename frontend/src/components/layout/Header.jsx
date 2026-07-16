"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Search, Menu, X, Plus, LayoutDashboard, LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logoutUser } from "@/store/slices/authSlice";
import toast from "react-hot-toast";

export default function Header() {
  const router   = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { user, isHydrating } = useAppSelector((s) => s.auth);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled,   setScrolled]   = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    toast.success("Déconnecté");
    router.push("/");
  };

  const navLinks = [{ href: "/posts", label: "Annonces" }];

  /* active nav pill */
  const isActive = (href) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        width: "100%",
        transition: "background 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease",
        background: scrolled
          ? "rgba(13,15,20,0.85)"
          : "#0d0f14",
        borderBottom: scrolled
          ? "1px solid rgba(255,255,255,0.10)"
          : "1px solid rgba(255,255,255,0.05)",
        backdropFilter: scrolled ? "blur(16px) saturate(1.4)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(16px) saturate(1.4)" : "none",
        boxShadow: scrolled ? "0 4px 24px rgba(0,0,0,0.40)" : "none",
      }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-[60px] items-center justify-between gap-4">

          {/* ── Logo ─────────────────────────────────── */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div
              className="flex items-center justify-center w-8 h-8 rounded-lg transition-shadow duration-300 group-hover:shadow-[0_0_20px_rgba(79,142,247,0.35)]"
              style={{
                background: "linear-gradient(135deg, #4f8ef7, #3a7ae4)",
                boxShadow: "0 0 14px rgba(79,142,247,0.25)",
              }}
            >
              <Search className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <span
              className="font-sans font-[700] text-[18px] tracking-[-0.02em]"
              style={{ color: "#f0f2f8" }}
            >
              Lost<span style={{ color: "#4f8ef7" }}>&amp;</span>Found
            </span>
            <span
              className="hidden sm:inline-flex items-center text-[11px] font-[600] tracking-[0.07em] uppercase rounded-full px-2.5 py-0.5 leading-none"
              style={{
                color: "#4f8ef7",
                background: "rgba(79,142,247,0.10)",
                border: "1px solid rgba(79,142,247,0.22)",
              }}
            >
              Tunisie
            </span>
          </Link>

          {/* ── Desktop nav ──────────────────────────── */}
          <nav className="hidden md:flex items-center gap-1 flex-1 ml-6">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="relative px-3.5 py-2 rounded-lg text-[13px] font-[500] transition-all duration-150"
                style={{
                  color: isActive(href) ? "#f0f2f8" : "#8b91a8",
                  background: isActive(href) ? "rgba(255,255,255,0.06)" : "transparent",
                }}
                onMouseEnter={(e) => {
                  if (!isActive(href)) {
                    e.currentTarget.style.color = "#f0f2f8";
                    e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive(href)) {
                    e.currentTarget.style.color = "#8b91a8";
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                {label}
                {isActive(href) && (
                  <span
                    className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full"
                    style={{ background: "#4f8ef7" }}
                  />
                )}
              </Link>
            ))}
          </nav>

          {/* ── Desktop actions ───────────────────────── */}
          <div className="hidden md:flex items-center gap-2">
            {isHydrating ? (
              <div className="flex gap-2">
                <div className="h-8 w-28 rounded-lg animate-pulse-soft" style={{ background: "rgba(255,255,255,0.05)" }} />
                <div className="h-8 w-20 rounded-lg animate-pulse-soft" style={{ background: "rgba(255,255,255,0.05)" }} />
              </div>
            ) : user ? (
              <>
                {user.role === "admin" && (
                  <Button variant="ghost" size="sm" onClick={() => router.push("/admin")}>
                    <Shield className="h-3.5 w-3.5" />
                    Admin
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  Dashboard
                </Button>
                <Button size="sm" onClick={() => router.push("/posts/new")}>
                  <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                  Nouvelle annonce
                </Button>

                {/* User chip */}
                <div
                  className="flex items-center gap-2 pl-3 ml-1"
                  style={{ borderLeft: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <div
                    className="flex items-center justify-center w-8 h-8 rounded-full text-white font-sans text-[12px] font-[600] shrink-0"
                    style={{ background: "linear-gradient(135deg, #4f8ef7, #3a7ae4)" }}
                  >
                    {user.name?.[0]?.toUpperCase() ?? "U"}
                  </div>
                  <span className="hidden xl:block text-[13px] font-[500] truncate max-w-[120px]" style={{ color: "#b8bdd0" }}>
                    {user.name}
                  </span>
                  <button
                    onClick={handleLogout}
                    title="Se déconnecter"
                    className="ml-1 p-1.5 rounded-lg transition-all duration-150"
                    style={{ color: "#6b7494" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#f87171";
                      e.currentTarget.style.background = "rgba(248,113,113,0.08)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "#6b7494";
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => router.push("/auth/login")}>
                  Se connecter
                </Button>
                <Button size="sm" onClick={() => router.push("/auth/register")}>
                  Créer un compte
                </Button>
              </>
            )}
          </div>

          {/* ── Mobile hamburger ─────────────────────── */}
          <button
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-150"
            style={{ color: "#8b91a8" }}
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#f0f2f8";
              e.currentTarget.style.background = "rgba(255,255,255,0.06)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#8b91a8";
              e.currentTarget.style.background = "transparent";
            }}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* ── Mobile menu ──────────────────────────────── */}
      {mobileOpen && (
        <div
          className="md:hidden px-4 py-3 space-y-1 animate-slide-down"
          style={{
            borderTop: "1px solid rgba(255,255,255,0.07)",
            background: "rgba(13,15,20,0.97)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            boxShadow: "0 8px 28px rgba(0,0,0,0.50)",
          }}
        >
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center px-3 py-2.5 rounded-lg text-[14px] font-[500] transition-all duration-150"
              style={{
                color: isActive(href) ? "#f0f2f8" : "#8b91a8",
                background: isActive(href) ? "rgba(255,255,255,0.06)" : "transparent",
              }}
            >
              {label}
            </Link>
          ))}

          <div className="pt-3 mt-2 space-y-1" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            {user ? (
              <>
                {/* User info */}
                <div className="flex items-center gap-3 px-3 py-2.5 mb-1">
                  <div
                    className="flex items-center justify-center w-9 h-9 rounded-full text-white text-[14px] font-[600] shrink-0"
                    style={{ background: "linear-gradient(135deg, #4f8ef7, #3a7ae4)" }}
                  >
                    {user.name?.[0]?.toUpperCase() ?? "U"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] font-[500] truncate" style={{ color: "#f0f2f8" }}>{user.name}</p>
                    <p className="text-[12px] truncate" style={{ color: "#6b7494" }}>{user.email}</p>
                  </div>
                </div>

                {[
                  { label: "Nouvelle annonce", icon: <Plus className="h-4 w-4" />, action: () => router.push("/posts/new"), accent: true },
                  { label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" />, action: () => router.push("/dashboard") },
                  ...(user.role === "admin" ? [{ label: "Admin", icon: <Shield className="h-4 w-4" />, action: () => router.push("/admin") }] : []),
                ].map(({ label, icon, action, accent }) => (
                  <button
                    key={label}
                    onClick={action}
                    className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-[14px] font-[500] transition-colors"
                    style={{ color: accent ? "#4f8ef7" : "#8b91a8" }}
                  >
                    {icon} {label}
                  </button>
                ))}

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-[14px] font-[500] transition-colors"
                  style={{ color: "#f87171" }}
                >
                  <LogOut className="h-4 w-4" /> Se déconnecter
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => router.push("/auth/login")}
                  className="flex items-center w-full px-3 py-2.5 rounded-lg text-[14px] font-[500] transition-colors"
                  style={{ color: "#8b91a8" }}
                >
                  Se connecter
                </button>
                <button
                  onClick={() => router.push("/auth/register")}
                  className="flex items-center justify-center w-full px-3 py-3 rounded-lg text-[14px] font-[600] transition-all"
                  style={{
                    background: "linear-gradient(135deg, #4f8ef7, #3a7ae4)",
                    color: "#fff",
                  }}
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
