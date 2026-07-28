"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Loader2, AlertCircle, RefreshCw, ChevronLeft, ChevronRight,
  ShieldOff, ShieldCheck, Flag, Trash2, Archive,
  ClipboardList, Filter, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

/* ── Action config ───────────────────────────────────────────────────────── */
const ACTION_CONFIG = {
  "user.ban":         { label: "Bannissement",      icon: ShieldOff,   color: C.danger,   bg: "rgba(248,113,113,0.10)", border: "rgba(248,113,113,0.25)" },
  "user.unban":       { label: "Réactivation",      icon: ShieldCheck, color: C.success,  bg: "rgba(52,211,153,0.10)",  border: "rgba(52,211,153,0.25)"  },
  "report.reviewed":  { label: "Signalement examiné", icon: Flag,       color: C.accent,   bg: "rgba(79,142,247,0.10)",  border: "rgba(79,142,247,0.25)"  },
  "report.actioned":  { label: "Action prise",      icon: Flag,        color: C.warning,  bg: "rgba(251,191,36,0.10)",  border: "rgba(251,191,36,0.25)"  },
  "report.dismissed": { label: "Signalement rejeté",icon: Flag,        color: C.inkMut,   bg: "rgba(107,116,148,0.10)", border: "rgba(107,116,148,0.25)" },
  "post.deleted":     { label: "Annonce supprimée", icon: Trash2,      color: C.danger,   bg: "rgba(248,113,113,0.10)", border: "rgba(248,113,113,0.25)" },
  "post.archived":    { label: "Annonce archivée",  icon: Archive,     color: "#fb923c",  bg: "rgba(251,146,60,0.10)",  border: "rgba(251,146,60,0.25)"  },
};

const ALL_ACTIONS = Object.keys(ACTION_CONFIG);

/* ── ActionBadge ─────────────────────────────────────────────────────────── */
function ActionBadge({ action }) {
  const cfg = ACTION_CONFIG[action] ?? { label: action, color: C.inkMut, bg: "rgba(107,116,148,0.10)", border: "rgba(107,116,148,0.25)", icon: Flag };
  const Icon = cfg.icon;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-[700]"
      style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

/* ── AuditEntry card ─────────────────────────────────────────────────────── */
function AuditEntry({ entry }) {
  const cfg = ACTION_CONFIG[entry.action] ?? {};
  const date = new Date(entry.createdAt).toLocaleString("fr-TN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className="flex items-start gap-4 px-4 py-4 rounded-xl transition-all"
      style={{ background: C.surface, border: `1px solid ${C.border}` }}>

      {/* Icon bubble */}
      <div className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0 mt-0.5"
        style={{ background: cfg.bg ?? "rgba(107,116,148,0.10)", border: `1px solid ${cfg.border ?? C.border}` }}>
        {cfg.icon && <cfg.icon className="h-4 w-4" style={{ color: cfg.color }} />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <ActionBadge action={entry.action} />
          <span className="text-[11px]" style={{ color: C.inkMut }}>{date}</span>
        </div>

        {/* Admin */}
        <p className="text-[13px]" style={{ color: C.inkSec }}>
          Par <strong style={{ color: C.ink }}>{entry.performedBy?.name ?? "—"}</strong>
          {entry.performedBy?.email && (
            <span className="ml-1" style={{ color: C.inkMut }}>({entry.performedBy.email})</span>
          )}
        </p>

        {/* Target user */}
        {entry.targetUser && (
          <p className="text-[12px] mt-1" style={{ color: C.inkMut }}>
            Utilisateur : <strong style={{ color: C.inkSec }}>{entry.targetUser.name}</strong>
            {" · "}{entry.targetUser.email}
          </p>
        )}

        {/* Target post */}
        {entry.targetPost && (
          <p className="text-[12px] mt-1" style={{ color: C.inkMut }}>
            Annonce :{" "}
            <Link href={`/posts/${entry.targetPost._id}`} target="_blank"
              className="font-[600] underline underline-offset-2" style={{ color: C.accent }}>
              {entry.targetPost.title ?? entry.targetPost._id}
            </Link>
          </p>
        )}

        {/* Details */}
        {entry.details && Object.keys(entry.details).length > 0 && (
          <div className="mt-2 px-3 py-2 rounded-lg space-y-0.5"
            style={{ background: C.elevated, border: `1px solid ${C.borderS}` }}>
            {entry.details.reason && (
              <p className="text-[12px]" style={{ color: C.inkMut }}>
                Raison : <span style={{ color: C.inkSec }}>{entry.details.reason}</span>
              </p>
            )}
            {entry.details.newStatus && (
              <p className="text-[12px]" style={{ color: C.inkMut }}>
                Nouveau statut : <span style={{ color: C.inkSec }}>{entry.details.newStatus}</span>
              </p>
            )}
            {entry.details.adminNote && (
              <p className="text-[12px] italic" style={{ color: C.inkMut }}>
                &ldquo;{entry.details.adminNote}&rdquo;
              </p>
            )}
            {entry.ip && (
              <p className="text-[11px]" style={{ color: C.inkMut }}>IP : {entry.ip}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Empty state ─────────────────────────────────────────────────────────── */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="flex items-center justify-center w-16 h-16 rounded-2xl mb-5"
        style={{ background: C.elevated, border: `1px solid ${C.border}` }}>
        <ClipboardList className="h-7 w-7" style={{ color: C.inkMut }} />
      </div>
      <h3 className="font-sans font-[600] text-[18px] tracking-[-0.01em] mb-2" style={{ color: C.ink }}>
        Aucune entrée
      </h3>
      <p className="text-[14px] max-w-xs leading-[1.6]" style={{ color: C.inkSec }}>
        Les actions de modération apparaîtront ici dès qu&apos;elles sont effectuées.
      </p>
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────────────────── */
function AuditLogContent() {
  const dispatch = useAppDispatch();
  const { accessToken } = useAppSelector((s) => s.auth);

  const [entries,    setEntries]    = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page,       setPage]       = useState(1);
  const [action,     setAction]     = useState("");
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);

  const getToken = useCallback(async () => {
    if (accessToken) return accessToken;
    const { refreshAccessToken } = await import("@/lib/api-client");
    const t = await refreshAccessToken();
    dispatch(setAccessToken(t));
    return t;
  }, [accessToken, dispatch]);

  const fetchLog = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const token = await getToken();
      const data  = await adminApi.getAuditLog({ action: action || undefined, page, limit: 20 }, token);
      setEntries(data.data.entries);
      setPagination(data.data.pagination);
    } catch {
      setError("Impossible de charger le journal d'audit.");
    } finally {
      setLoading(false);
    }
  }, [action, page, getToken]);

  useEffect(() => { fetchLog(); }, [fetchLog]);
  useEffect(() => { setPage(1); }, [action]);

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
            <span style={{ color: C.inkSec }}>Journal d&apos;audit</span>
          </nav>

          {/* Header */}
          <div className="flex items-center justify-between gap-4 mb-7 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-11 h-11 rounded-xl shrink-0"
                style={{ background: "rgba(79,142,247,0.12)", border: "1px solid rgba(79,142,247,0.25)" }}>
                <ClipboardList className="h-5 w-5" style={{ color: C.accent }} />
              </div>
              <div>
                <h1 className="font-sans font-[700] text-[26px] tracking-[-0.025em]" style={{ color: C.ink }}>
                  Journal d&apos;audit
                </h1>
                <p className="text-[14px] mt-0.5" style={{ color: C.inkMut }}>
                  {pagination ? `${pagination.total} action${pagination.total !== 1 ? "s" : ""} enregistrée${pagination.total !== 1 ? "s" : ""}` : "Chargement…"}
                </p>
              </div>
            </div>
            <button onClick={fetchLog} disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-[500] disabled:opacity-40"
              style={{ border: `1px solid ${C.border}`, color: C.inkMut, background: "transparent" }}>
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Actualiser
            </button>
          </div>

          {/* Filter bar */}
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg shrink-0"
              style={{ background: C.elevated, border: `1px solid ${C.border}` }}>
              <Filter className="h-3.5 w-3.5" style={{ color: C.inkMut }} />
              <span className="text-[12px] font-[500]" style={{ color: C.inkMut }}>Filtrer</span>
            </div>
            <select value={action} onChange={(e) => setAction(e.target.value)} style={selectStyle}>
              <option value="">Toutes les actions</option>
              {ALL_ACTIONS.map((a) => (
                <option key={a} value={a}>{ACTION_CONFIG[a].label}</option>
              ))}
            </select>
            {action && (
              <button onClick={() => setAction("")}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-[12px] font-[500]"
                style={{ border: `1px solid ${C.border}`, color: C.inkMut, background: "transparent" }}>
                <X className="h-3.5 w-3.5" /> Effacer
              </button>
            )}
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-28">
              <Loader2 className="h-6 w-6 animate-spin" style={{ color: C.accent }} />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
              <AlertCircle className="h-8 w-8" style={{ color: C.danger }} />
              <p className="text-[15px]" style={{ color: C.inkSec }}>{error}</p>
              <Button variant="secondary" size="sm" onClick={fetchLog}>Réessayer</Button>
            </div>
          ) : entries.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-2">
              {entries.map((e) => <AuditEntry key={e._id} entry={e} />)}
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

export default function AuditLogPage() {
  return (
    <AdminGuard>
      <AuditLogContent />
    </AdminGuard>
  );
}
