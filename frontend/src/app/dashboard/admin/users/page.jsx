"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  Loader2, Search, RefreshCw, AlertCircle, ChevronLeft, ChevronRight,
  ShieldOff, ShieldCheck, Shield, User, X, CheckCircle2, XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AdminGuard from "@/components/auth/AdminGuard";
import { adminApi } from "@/lib/api/admin.api";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { setAccessToken } from "@/store/slices/authSlice";
import PageContainer from "@/components/layout/PageContainer";

/* ── Design tokens ───────────────────────────────────────────────────────── */
const C = {
  canvas:   "#0d0f14",
  surface:  "#13161e",
  elevated: "#1a1e28",
  border:   "rgba(255,255,255,0.08)",
  borderS:  "rgba(255,255,255,0.05)",
  ink:      "#f0f2f8",
  inkSec:   "#b8bdd0",
  inkMut:   "#6b7494",
  accent:   "#4f8ef7",
  success:  "#34d399",
  warning:  "#fbbf24",
  danger:   "#f87171",
};

/* ── BanConfirmModal ─────────────────────────────────────────────────────── */
function BanConfirmModal({ user, onClose, onConfirm, loading }) {
  const [reason,      setReason]      = useState("");
  const [reasonError, setReasonError] = useState("");

  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const isBanning = user.isActive;

  const handleConfirm = () => {
    if (reason.length > 300) {
      setReasonError("La raison ne doit pas dépasser 300 caractères");
      return;
    }
    setReasonError("");
    onConfirm(reason.trim() || undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog" aria-modal="true">
      <div className="w-full max-w-[400px] rounded-2xl p-6 animate-scale-in"
        style={{
          background: C.surface,
          border: isBanning ? "1px solid rgba(248,113,113,0.28)" : "1px solid rgba(52,211,153,0.28)",
          boxShadow: "0 24px 56px rgba(0,0,0,0.65)",
        }}>

        {/* Icon */}
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl mb-5 mx-auto"
          style={{
            background: isBanning ? "rgba(248,113,113,0.10)" : "rgba(52,211,153,0.10)",
            border: isBanning ? "1px solid rgba(248,113,113,0.22)" : "1px solid rgba(52,211,153,0.22)",
          }}>
          {isBanning
            ? <ShieldOff   className="h-6 w-6" style={{ color: C.danger  }} />
            : <ShieldCheck className="h-6 w-6" style={{ color: C.success }} />}
        </div>

        <h3 className="font-sans font-[700] text-[19px] tracking-[-0.02em] text-center mb-1"
          style={{ color: C.ink }}>
          {isBanning ? "Bannir cet utilisateur ?" : "Réactiver ce compte ?"}
        </h3>
        <p className="text-[14px] font-[600] text-center truncate px-4 mb-3" style={{ color: C.ink }}>
          {user.name}
        </p>
        <p className="text-[12px] text-center mb-6 leading-[1.6]" style={{ color: C.inkMut }}>
          {user.email}
        </p>

        {isBanning && (
          <>
            <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-lg mb-4"
              style={{ background: "rgba(248,113,113,0.07)", border: "1px solid rgba(248,113,113,0.18)" }}>
              <ShieldOff className="h-4 w-4 shrink-0 mt-0.5" style={{ color: C.danger }} />
              <p className="text-[12px] leading-[1.55]" style={{ color: "#8b91a8" }}>
                Le compte sera désactivé immédiatement. Toutes les sessions actives seront révoquées.
                L&apos;utilisateur ne pourra plus se connecter.
              </p>
            </div>

            {/* Optional ban reason */}
            <div className="mb-5 space-y-1.5">
              <label htmlFor="ban-reason" className="block text-[12px] font-[600]" style={{ color: C.inkSec }}>
                Raison <span className="font-[400]" style={{ color: C.inkMut }}>(optionnel)</span>
              </label>
              <textarea
                id="ban-reason"
                rows={2}
                maxLength={300}
                placeholder="Ex : spam, comportement abusif…"
                value={reason}
                onChange={(e) => { setReason(e.target.value); setReasonError(""); }}
                className="w-full rounded-lg px-3.5 py-2.5 text-[13px] resize-none focus:outline-none"
                style={{
                  background: "#161921",
                  border: reasonError ? "1px solid #f87171" : "1px solid rgba(255,255,255,0.10)",
                  color: C.ink,
                  boxSizing: "border-box",
                }}
              />
              <div className="flex items-center justify-between">
                {reasonError
                  ? <p className="text-[11px]" style={{ color: "#f87171" }} role="alert">{reasonError}</p>
                  : <span />}
                <p className="text-[11px]" style={{ color: reason.length > 280 ? C.warning : C.inkMut }}>
                  {reason.length}/300
                </p>
              </div>
            </div>
          </>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} disabled={loading}
            className="flex-1 h-10 rounded-lg text-[13px] font-[500] transition-all disabled:opacity-40"
            style={{ border: `1px solid ${C.border}`, color: C.inkSec, background: "transparent" }}>
            Annuler
          </button>
          <button onClick={handleConfirm} disabled={loading}
            className="flex-1 h-10 rounded-lg text-[13px] font-[700] transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            style={{
              background: isBanning ? C.danger : C.success,
              color: isBanning ? "#fff" : "#052e16",
            }}>
            {loading
              ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> {isBanning ? "Bannissement…" : "Réactivation…"}</>
              : isBanning
              ? <><ShieldOff className="h-3.5 w-3.5" /> Bannir</>
              : <><ShieldCheck className="h-3.5 w-3.5" /> Réactiver</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── UserRow ─────────────────────────────────────────────────────────────── */
function UserRow({ user: u, currentUserId, getToken, onUpdated }) {
  const [modal,   setModal]   = useState(false);
  const [loading, setLoading] = useState(false);

  const isCurrentUser = u._id === currentUserId;
  const isAdmin       = u.role === "admin";
  const isBanned      = !u.isActive;

  const createdAt = new Date(u.createdAt).toLocaleDateString("fr-TN", {
    day: "numeric", month: "short", year: "numeric",
  });

  const handleAction = async (reason) => {
    setLoading(true);
    try {
      const token = await getToken();
      const fn    = isBanned ? adminApi.unbanUser : adminApi.banUser;
      const data  = await fn(u._id, token, reason ? { reason } : undefined);
      toast.success(data.message);
      onUpdated({ ...u, isActive: !isBanned });
      setModal(false);
    } catch (err) {
      toast.error(err.response?.message || err.message || "Erreur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {modal && (
        <BanConfirmModal
          user={u}
          loading={loading}
          onClose={() => setModal(false)}
          onConfirm={handleAction}
        />
      )}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
        style={{ background: C.surface, border: `1px solid ${isBanned ? "rgba(248,113,113,0.18)" : C.border}` }}>

        {/* Avatar */}
        <div className="flex items-center justify-center w-9 h-9 rounded-full shrink-0 font-[700] text-[13px]"
          style={{
            background: isAdmin
              ? "rgba(251,191,36,0.15)"
              : isBanned
              ? "rgba(248,113,113,0.12)"
              : "rgba(79,142,247,0.12)",
            color: isAdmin ? C.warning : isBanned ? C.danger : C.accent,
            border: isAdmin
              ? "1px solid rgba(251,191,36,0.25)"
              : isBanned
              ? "1px solid rgba(248,113,113,0.22)"
              : "1px solid rgba(79,142,247,0.22)",
          }}>
          {u.name?.[0]?.toUpperCase() ?? "?"}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[14px] font-[600] truncate" style={{ color: C.ink }}>{u.name}</p>
            {isAdmin && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-[700]"
                style={{ color: C.warning, background: "rgba(251,191,36,0.10)", border: "1px solid rgba(251,191,36,0.22)" }}>
                <Shield className="h-2.5 w-2.5" /> Admin
              </span>
            )}
            {isBanned && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-[700]"
                style={{ color: C.danger, background: "rgba(248,113,113,0.10)", border: "1px solid rgba(248,113,113,0.22)" }}>
                <XCircle className="h-2.5 w-2.5" /> Banni
              </span>
            )}
            {!isBanned && !isAdmin && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-[700]"
                style={{ color: C.success, background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.18)" }}>
                <CheckCircle2 className="h-2.5 w-2.5" /> Actif
              </span>
            )}
          </div>
          <p className="text-[12px] truncate mt-0.5" style={{ color: C.inkMut }}>{u.email}</p>
        </div>

        {/* Date */}
        <p className="text-[11px] shrink-0 hidden sm:block" style={{ color: C.inkMut }}>
          {createdAt}
        </p>

        {/* Action button */}
        {!isCurrentUser && !isAdmin && (
          <button onClick={() => setModal(true)} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-[700] transition-all shrink-0 disabled:opacity-40"
            style={{
              background: isBanned ? "rgba(52,211,153,0.08)"     : "rgba(248,113,113,0.08)",
              color:      isBanned ? C.success                    : C.danger,
              border:     isBanned ? "1px solid rgba(52,211,153,0.22)" : "1px solid rgba(248,113,113,0.22)",
            }}>
            {isBanned
              ? <><ShieldCheck className="h-3 w-3" /> Réactiver</>
              : <><ShieldOff   className="h-3 w-3" /> Bannir</>}
          </button>
        )}
      </div>
    </>
  );
}

/* ── Main page ───────────────────────────────────────────────────────────── */
function AdminUsersContent() {
  const dispatch = useAppDispatch();
  const { user, accessToken } = useAppSelector((s) => s.auth);

  const [users,        setUsers]        = useState([]);
  const [pagination,   setPagination]   = useState(null);
  const [page,         setPage]         = useState(1);
  const [q,            setQ]            = useState("");
  const [qInput,       setQInput]       = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);

  const getToken = useCallback(async () => {
    if (accessToken) return accessToken;
    const { refreshAccessToken } = await import("@/lib/api-client");
    const t = await refreshAccessToken();
    dispatch(setAccessToken(t));
    return t;
  }, [accessToken, dispatch]);

  const fetchUsers = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const token = await getToken();
      const data  = await adminApi.getUsers({ q, status: statusFilter, page, limit: 15 }, token);
      setUsers(data.data.users);
      setPagination(data.data.pagination);
    } catch {
      setError("Impossible de charger les utilisateurs.");
    } finally {
      setLoading(false);
    }
  }, [q, statusFilter, page, getToken]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { setPage(1); }, [q, statusFilter]);

  const handleSearch = (e) => { e.preventDefault(); setQ(qInput.trim()); };

  const handleUpdated = useCallback((updated) => {
    setUsers((prev) => prev.map((u) => (u._id === updated._id ? { ...u, ...updated } : u)));
  }, []);

  const currentUserId = user?._id ?? user?.id;

  const selectStyle = {
    height: "42px", borderRadius: "10px", border: `1px solid ${C.border}`,
    background: "#161921", color: C.ink, padding: "0 12px",
    fontFamily: "Inter, system-ui, sans-serif", fontSize: "13px", outline: "none",
  };

  return (
    <div className="min-h-screen" style={{ background: C.canvas }}>
      <PageContainer>
        <div className="py-8 max-w-4xl mx-auto">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-[13px] mb-6" style={{ color: C.inkMut }}>
            <Link href="/" className="hover:text-[#f0f2f8] transition-colors">Accueil</Link>
            <span>/</span>
            <Link href="/dashboard" className="hover:text-[#f0f2f8] transition-colors">Dashboard</Link>
            <span>/</span>
            <span style={{ color: C.inkSec }}>Utilisateurs</span>
          </nav>

          {/* Header */}
          <div className="flex items-center justify-between gap-4 mb-7 flex-wrap">
            <div>
              <h1 className="font-sans font-[700] text-[26px] tracking-[-0.025em]" style={{ color: C.ink }}>
                Gestion des utilisateurs
              </h1>
              <p className="text-[14px] mt-0.5" style={{ color: C.inkMut }}>
                {pagination ? `${pagination.total} utilisateur${pagination.total !== 1 ? "s" : ""}` : "Chargement…"}
              </p>
            </div>
            <button onClick={fetchUsers} disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-[500] disabled:opacity-40"
              style={{ border: `1px solid ${C.border}`, color: C.inkMut, background: "transparent" }}>
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Actualiser
            </button>
          </div>

          {/* Search + filter */}
          <div className="flex flex-col sm:flex-row gap-2 mb-5">
            <form onSubmit={handleSearch} className="flex flex-1 gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: C.inkMut }} />
                <Input
                  value={qInput}
                  onChange={(e) => setQInput(e.target.value)}
                  placeholder="Rechercher par nom ou email…"
                  maxLength={100}
                  className="pl-9"
                />
              </div>
              <Button type="submit" variant="secondary" className="h-[42px] px-4 gap-1.5 shrink-0">
                <Search className="h-3.5 w-3.5" />
              </Button>
              {q && (
                <button type="button" onClick={() => { setQ(""); setQInput(""); }}
                  className="flex items-center justify-center w-[42px] h-[42px] rounded-lg shrink-0"
                  style={{ border: `1px solid ${C.border}`, color: C.inkMut, background: "transparent" }}>
                  <X className="h-4 w-4" />
                </button>
              )}
            </form>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={selectStyle}>
              <option value="">Tous les statuts</option>
              <option value="active">Actifs</option>
              <option value="banned">Bannis</option>
            </select>
          </div>

          {/* User list */}
          {loading ? (
            <div className="flex items-center justify-center py-28">
              <Loader2 className="h-6 w-6 animate-spin" style={{ color: C.accent }} />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
              <AlertCircle className="h-8 w-8" style={{ color: C.danger }} />
              <p style={{ color: C.inkSec }}>{error}</p>
              <Button variant="secondary" size="sm" onClick={fetchUsers}>Réessayer</Button>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl mb-5"
                style={{ background: C.elevated, border: `1px solid ${C.border}` }}>
                <User className="h-7 w-7" style={{ color: C.inkMut }} />
              </div>
              <p className="font-[600] text-[16px] mb-1" style={{ color: C.ink }}>Aucun utilisateur trouvé</p>
              <p className="text-[13px]" style={{ color: C.inkMut }}>Essayez de modifier vos filtres.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {users.map((u) => (
                <UserRow
                  key={u._id}
                  user={u}
                  currentUserId={currentUserId}
                  getToken={getToken}
                  onUpdated={handleUpdated}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-[500] transition-all disabled:opacity-40 disabled:pointer-events-none"
                style={{ border: `1px solid ${C.border}`, color: C.inkSec, background: "transparent" }}>
                <ChevronLeft className="h-4 w-4" /> Précédent
              </button>
              <span className="text-[13px] font-[500] px-4 py-2 rounded-lg"
                style={{ color: C.inkSec, background: C.elevated, border: `1px solid ${C.border}` }}>
                {pagination.page} / {pagination.pages}
              </span>
              <button onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-[500] transition-all disabled:opacity-40 disabled:pointer-events-none"
                style={{ border: `1px solid ${C.border}`, color: C.inkSec, background: "transparent" }}>
                Suivant <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

        </div>
      </PageContainer>
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <AdminGuard>
      <AdminUsersContent />
    </AdminGuard>
  );
}
