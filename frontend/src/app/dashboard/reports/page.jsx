"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Loader2, Flag, AlertCircle, RefreshCw, ChevronLeft, ChevronRight,
  ExternalLink, CheckCircle2, XCircle, Eye, Clock, ShieldAlert,
  MapPin, Tag, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { reportsApi } from "@/lib/api/reports.api";
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

/* ── Static maps ─────────────────────────────────────────────────────────── */
const REASON_LABELS = {
  spam:          { label: "Spam",                    color: C.warning,  bg: "rgba(251,191,36,0.10)",  border: "rgba(251,191,36,0.25)"  },
  scam:          { label: "Arnaque / fraude",        color: "#f87171",  bg: "rgba(248,113,113,0.10)", border: "rgba(248,113,113,0.25)" },
  misleading:    { label: "Informations trompeuses", color: "#fb923c",  bg: "rgba(251,146,60,0.10)",  border: "rgba(251,146,60,0.25)"  },
  inappropriate: { label: "Contenu inapproprié",     color: "#c084fc",  bg: "rgba(192,132,252,0.10)", border: "rgba(192,132,252,0.25)" },
  duplicate:     { label: "Doublon",                 color: C.accent,   bg: "rgba(79,142,247,0.10)",  border: "rgba(79,142,247,0.25)"  },
  other:         { label: "Autre",                   color: C.inkSec,   bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.12)" },
};

const STATUS_CONFIG = {
  pending:   { label: "En attente",  color: C.warning, bg: "rgba(251,191,36,0.10)",  border: "rgba(251,191,36,0.25)",  icon: <Clock        className="h-3 w-3" /> },
  reviewed:  { label: "Examiné",     color: C.accent,  bg: "rgba(79,142,247,0.10)",  border: "rgba(79,142,247,0.25)",  icon: <Eye          className="h-3 w-3" /> },
  actioned:  { label: "Traité",      color: C.success, bg: "rgba(52,211,153,0.10)",  border: "rgba(52,211,153,0.25)",  icon: <CheckCircle2 className="h-3 w-3" /> },
  dismissed: { label: "Rejeté",      color: C.inkMut,  bg: "rgba(107,116,148,0.10)", border: "rgba(107,116,148,0.25)", icon: <XCircle      className="h-3 w-3" /> },
};

const OBJECT_TYPE_LABELS = {
  cin: "Carte d'identité", passport: "Passeport", permis: "Permis",
  carte_bancaire: "Carte bancaire", telephone: "Téléphone", cles: "Clés", autre: "Autre",
};

const STATUS_TABS = [
  { id: "pending",   label: "En attente" },
  { id: "reviewed",  label: "Examinés"   },
  { id: "actioned",  label: "Traités"    },
  { id: "dismissed", label: "Rejetés"    },
  { id: "all",       label: "Tous"       },
];

/* ── ReasonBadge ─────────────────────────────────────────────────────────── */
function ReasonBadge({ reason }) {
  const cfg = REASON_LABELS[reason] ?? REASON_LABELS.other;
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-[700]"
      style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
      <Flag className="h-2.5 w-2.5" /> {cfg.label}
    </span>
  );
}

/* ── StatusBadge ─────────────────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-[700]"
      style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

/* ── AdminNoteModal ──────────────────────────────────────────────────────── */
function AdminNoteModal({ report, onClose, onUpdated, token }) {
  const [status,    setStatus]    = useState(report.status);
  const [adminNote, setAdminNote] = useState(report.adminNote || "");
  const [loading,   setLoading]   = useState(false);

  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const data = await reportsApi.updateReportStatus(report._id, { status, adminNote }, token);
      toast.success("Statut mis à jour.");
      onUpdated(data.data.report);
      onClose();
    } catch (err) {
      toast.error(err.response?.message || "Erreur lors de la mise à jour.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%", height: "40px", borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.10)", background: "#161921",
    padding: "0 12px", color: C.ink, fontSize: "13px", outline: "none", boxSizing: "border-box",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: "rgba(0,0,0,0.70)", backdropFilter: "blur(8px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog" aria-modal="true">
      <div className="w-full max-w-[440px] rounded-2xl overflow-hidden animate-scale-in"
        style={{ background: C.surface, border: `1px solid ${C.border}`, boxShadow: "0 24px 56px rgba(0,0,0,0.60)" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: `1px solid ${C.borderS}` }}>
          <h2 className="font-sans font-[700] text-[16px]" style={{ color: C.ink }}>Traiter le signalement</h2>
          <button onClick={onClose} className="flex items-center justify-center w-8 h-8 rounded-lg" style={{ color: C.inkMut }}>
            <X className="h-4 w-4" />
          </button>
        </div>
        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Post info */}
          <div className="px-3.5 py-3 rounded-lg" style={{ background: C.elevated, border: `1px solid ${C.borderS}` }}>
            <p className="text-[11px] font-[600] uppercase tracking-[0.06em] mb-1" style={{ color: C.inkMut }}>Annonce signalée</p>
            <p className="text-[14px] font-[600] truncate" style={{ color: C.ink }}>{report.post?.title ?? "—"}</p>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <ReasonBadge reason={report.reason} />
              {report.reporter?.name && (
                <span className="text-[11px]" style={{ color: C.inkMut }}>
                  Signalé par <strong style={{ color: C.inkSec }}>{report.reporter.name}</strong>
                </span>
              )}
            </div>
            {report.comment && (
              <p className="text-[12px] italic mt-2 leading-[1.55]" style={{ color: C.inkMut }}>
                &ldquo;{report.comment}&rdquo;
              </p>
            )}
          </div>
          {/* Status select */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-[600]" style={{ color: C.inkSec }}>Nouveau statut</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} style={inputStyle}>
              <option value="pending">En attente</option>
              <option value="reviewed">Examiné (aucune action)</option>
              <option value="actioned">Traité (action prise)</option>
              <option value="dismissed">Rejeté (infondé)</option>
            </select>
          </div>
          {/* Admin note */}
          <div className="space-y-1.5">
            <label className="text-[12px] font-[600]" style={{ color: C.inkSec }}>
              Note interne <span className="font-[400]" style={{ color: C.inkMut }}>(optionnel)</span>
            </label>
            <textarea rows={3} maxLength={500} value={adminNote} onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Décision prise, contexte, etc."
              className="w-full rounded-lg px-3.5 py-2.5 text-[13px] resize-none focus:outline-none"
              style={{ background: "#161921", border: "1px solid rgba(255,255,255,0.10)", color: C.ink, boxSizing: "border-box" }} />
            <p className="text-right text-[11px]" style={{ color: C.inkMut }}>{adminNote.length}/500</p>
          </div>
          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} disabled={loading}
              className="flex-1 h-10 rounded-lg text-[13px] font-[500] disabled:opacity-40"
              style={{ border: `1px solid ${C.border}`, color: C.inkSec, background: "transparent" }}>
              Annuler
            </button>
            <button onClick={handleSave} disabled={loading}
              className="flex-1 h-10 rounded-lg text-[13px] font-[700] disabled:opacity-40 flex items-center justify-center gap-2"
              style={{ background: C.accent, color: "#fff" }}>
              {loading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Enregistrement…</> : "Enregistrer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── ReportCard ──────────────────────────────────────────────────────────── */
function ReportCard({ report, token, onUpdated }) {
  const [showModal, setShowModal] = useState(false);

  const post        = report.post;
  const reporter    = report.reporter;
  const reviewedBy  = report.reviewedBy;
  const createdAt   = new Date(report.createdAt).toLocaleDateString("fr-TN", { day: "numeric", month: "short", year: "numeric" });
  const reviewedAt  = report.reviewedAt
    ? new Date(report.reviewedAt).toLocaleDateString("fr-TN", { day: "numeric", month: "short", year: "numeric" })
    : null;

  return (
    <>
      {showModal && (
        <AdminNoteModal report={report} token={token} onClose={() => setShowModal(false)} onUpdated={onUpdated} />
      )}
      <div className="rounded-xl overflow-hidden transition-all"
        style={{ background: C.surface, border: `1px solid ${C.border}` }}>
        {/* Top stripe */}
        <div className="flex items-center justify-between px-4 py-2.5"
          style={{ background: STATUS_CONFIG[report.status]?.bg ?? "transparent", borderBottom: `1px solid ${STATUS_CONFIG[report.status]?.border ?? C.borderS}` }}>
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={report.status} />
            <ReasonBadge reason={report.reason} />
          </div>
          <span className="text-[11px]" style={{ color: C.inkMut }}>{createdAt}</span>
        </div>

        <div className="p-4 space-y-3">
          {/* Post info */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              {post ? (
                <>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {post.type && (
                      <span className="text-[10px] font-[700] px-2 py-0.5 rounded-full"
                        style={{ color: post.type === "lost" ? C.accent : C.success, background: post.type === "lost" ? "rgba(79,142,247,0.12)" : "rgba(52,211,153,0.10)", border: post.type === "lost" ? "1px solid rgba(79,142,247,0.22)" : "1px solid rgba(52,211,153,0.20)" }}>
                        {post.type === "lost" ? "Perdu" : "Trouvé"}
                      </span>
                    )}
                    {post.objectType && <span className="text-[11px]" style={{ color: C.inkMut }}>{OBJECT_TYPE_LABELS[post.objectType] ?? post.objectType}</span>}
                  </div>
                  <p className="text-[14px] font-[600] leading-snug truncate" style={{ color: C.ink }}>{post.title}</p>
                  {post.city && (
                    <p className="text-[12px] flex items-center gap-1 mt-0.5" style={{ color: C.inkMut }}>
                      <MapPin className="h-3 w-3 shrink-0" /> {post.city}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-[13px] italic" style={{ color: C.inkMut }}>Annonce supprimée</p>
              )}
            </div>
            {post?._id && (
              <Link href={`/posts/${post._id}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 shrink-0 text-[11px] font-[600] px-2.5 py-1.5 rounded-lg transition-colors"
                style={{ color: C.accent, background: "rgba(79,142,247,0.08)", border: "1px solid rgba(79,142,247,0.18)" }}>
                Voir <ExternalLink className="h-3 w-3" />
              </Link>
            )}
          </div>

          {/* Reporter */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px]"
            style={{ background: C.elevated, border: `1px solid ${C.borderS}` }}>
            <Flag className="h-3.5 w-3.5 shrink-0" style={{ color: C.inkMut }} />
            <span style={{ color: C.inkMut }}>Signalé par</span>
            <span className="font-[600]" style={{ color: C.inkSec }}>{reporter?.name ?? "Utilisateur inconnu"}</span>
            {reporter?.email && <span style={{ color: C.inkMut }}>— {reporter.email}</span>}
          </div>

          {/* Comment */}
          {report.comment && (
            <p className="text-[12px] italic px-3 py-2.5 rounded-lg leading-[1.6]"
              style={{ background: C.elevated, color: C.inkSec, border: `1px solid ${C.borderS}` }}>
              &ldquo;{report.comment}&rdquo;
            </p>
          )}

          {/* Admin note */}
          {report.adminNote && (
            <div className="px-3 py-2.5 rounded-lg" style={{ background: "rgba(79,142,247,0.06)", border: "1px solid rgba(79,142,247,0.16)" }}>
              <p className="text-[11px] font-[600] uppercase tracking-[0.06em] mb-1" style={{ color: C.inkMut }}>Note admin</p>
              <p className="text-[12px] leading-[1.6]" style={{ color: C.inkSec }}>{report.adminNote}</p>
              {reviewedBy && reviewedAt && (
                <p className="text-[11px] mt-1" style={{ color: C.inkMut }}>
                  Par {reviewedBy.name} · {reviewedAt}
                </p>
              )}
            </div>
          )}

          {/* Action button */}
          <button onClick={() => setShowModal(true)}
            className="w-full flex items-center justify-center gap-2 h-9 rounded-lg text-[12px] font-[700] transition-all mt-1"
            style={{ background: "rgba(79,142,247,0.08)", color: C.accent, border: "1px solid rgba(79,142,247,0.22)" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(79,142,247,0.16)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(79,142,247,0.08)"; }}>
            <ShieldAlert className="h-3.5 w-3.5" /> Traiter ce signalement
          </button>
        </div>
      </div>
    </>
  );
}

/* ── Empty state ─────────────────────────────────────────────────────────── */
function EmptyState({ status }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center col-span-full">
      <div className="flex items-center justify-center w-16 h-16 rounded-2xl mb-5"
        style={{ background: C.elevated, border: `1px solid ${C.border}` }}>
        <Flag className="h-7 w-7" style={{ color: C.inkMut }} />
      </div>
      <h3 className="font-sans font-[600] text-[18px] tracking-[-0.01em] mb-2" style={{ color: C.ink }}>
        {status === "pending" ? "Aucun signalement en attente" : "Aucun signalement"}
      </h3>
      <p className="text-[14px] max-w-xs leading-[1.6]" style={{ color: C.inkSec }}>
        {status === "pending"
          ? "Tout est sous contrôle — aucun signalement à traiter."
          : "Aucun signalement ne correspond à ce filtre."}
      </p>
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────────────────── */
export default function ReportsDashboardPage() {
  const router   = useRouter();
  const dispatch = useAppDispatch();
  const { user, isHydrating, accessToken } = useAppSelector((s) => s.auth);

  const [activeTab,   setActiveTab]   = useState("pending");
  const [reports,     setReports]     = useState([]);
  const [pagination,  setPagination]  = useState(null);
  const [page,        setPage]        = useState(1);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [token,       setToken]       = useState(accessToken);

  // Redirect non-admins
  useEffect(() => {
    if (!isHydrating && !user) router.push("/auth/login?redirect=/dashboard/reports");
    if (!isHydrating && user && user.role !== "admin") router.push("/");
  }, [user, isHydrating, router]);

  const getToken = useCallback(async () => {
    if (accessToken) return accessToken;
    const { refreshAccessToken } = await import("@/lib/api-client");
    const t = await refreshAccessToken();
    dispatch(setAccessToken(t));
    setToken(t);
    return t;
  }, [accessToken, dispatch]);

  const fetchReports = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const t = await getToken();
      const data = await reportsApi.getReports({ status: activeTab, page, limit: 12 }, t);
      setReports(data.data.reports);
      setPagination(data.data.pagination);
    } catch {
      setError("Impossible de charger les signalements.");
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, getToken]);

  useEffect(() => {
    if (!isHydrating && user?.role === "admin") fetchReports();
  }, [activeTab, page, isHydrating, user, fetchReports]);

  // Reset to page 1 when tab changes
  useEffect(() => { setPage(1); }, [activeTab]);

  const handleUpdated = (updated) => {
    setReports((prev) => prev.map((r) => (r._id === updated._id ? updated : r)));
  };

  const pendingCount = activeTab === "pending" ? pagination?.total ?? 0 : 0;

  if (isHydrating) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: C.canvas }}>
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: C.accent }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: C.canvas }}>
      <PageContainer>
        <div className="py-8 max-w-5xl mx-auto">

          {/* Header */}
          <div className="mb-8">
            <nav className="flex items-center gap-1.5 text-[13px] mb-4" style={{ color: C.inkMut }}>
              <Link href="/" className="transition-colors hover:text-[#f0f2f8]">Accueil</Link>
              <span>/</span>
              <Link href="/dashboard" className="transition-colors hover:text-[#f0f2f8]">Dashboard</Link>
              <span>/</span>
              <span style={{ color: C.inkSec }}>Signalements</span>
            </nav>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="font-sans font-[700] text-[26px] tracking-[-0.025em]" style={{ color: C.ink }}>
                    Signalements
                  </h1>
                  {pagination?.total > 0 && activeTab === "pending" && (
                    <span className="flex items-center justify-center px-2.5 py-0.5 rounded-full text-[11px] font-[800]"
                      style={{ background: C.warning, color: "#1c1400" }}>
                      {pagination.total}
                    </span>
                  )}
                </div>
                <p className="text-[14px]" style={{ color: C.inkMut }}>
                  Modération des annonces signalées par les utilisateurs
                </p>
              </div>
              <button onClick={fetchReports} disabled={loading}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-[500] transition-all disabled:opacity-40"
                style={{ border: `1px solid ${C.border}`, color: C.inkMut, background: "transparent" }}>
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                Actualiser
              </button>
            </div>
          </div>

          {/* Status tabs */}
          <div className="flex overflow-x-auto rounded-xl p-1 mb-6 gap-1"
            style={{ background: C.surface, border: `1px solid ${C.border}` }}>
            {STATUS_TABS.map(({ id, label }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className="flex-1 min-w-[80px] py-2.5 rounded-lg text-[12px] font-[600] transition-all whitespace-nowrap"
                style={{
                  background: activeTab === id ? C.elevated : "transparent",
                  color:      activeTab === id ? C.ink      : C.inkMut,
                  border:     activeTab === id ? `1px solid ${C.border}` : "1px solid transparent",
                }}>
                {label}
              </button>
            ))}
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
              <Button variant="secondary" size="sm" onClick={fetchReports}>Réessayer</Button>
            </div>
          ) : reports.length === 0 ? (
            <EmptyState status={activeTab} />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reports.map((report) => (
                  <ReportCard
                    key={report._id}
                    report={report}
                    token={token || accessToken}
                    onUpdated={handleUpdated}
                  />
                ))}
              </div>

              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
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
            </>
          )}

        </div>
      </PageContainer>
    </div>
  );
}
