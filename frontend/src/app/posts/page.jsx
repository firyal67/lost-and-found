"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search, SlidersHorizontal, MapPin, Tag,
  PlusCircle, Loader2, ChevronLeft, ChevronRight,
  Package, X, AlertCircle, Trash2, AlertTriangle, CheckCheck, Archive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { postsApi } from "@/lib/api/posts.api";
import PageContainer from "@/components/layout/PageContainer";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { setAccessToken } from "@/store/slices/authSlice";
import toast from "react-hot-toast";

const OBJECT_TYPE_LABELS = {
  cin:            "Carte d'identité",
  passport:       "Passeport",
  permis:         "Permis de conduire",
  carte_bancaire: "Carte bancaire",
  telephone:      "Téléphone",
  cles:           "Clés",
  autre:          "Autre",
};

const TUNISIAN_CITIES = [
  "Tunis","Sfax","Sousse","Kairouan","Bizerte","Gabès","Ariana",
  "Gafsa","Monastir","Ben Arous","Kasserine","Médenine","Nabeul",
  "Tataouine","Béja","Jendouba","El Kef","Mahdia","Sidi Bouzid",
  "Tozeur","Siliana","Zaghouan","Kebili","Manouba",
];

const C = {
  canvas:   "#0d0f14",
  surface:  "#13161e",
  elevated: "#1a1e28",
  border:   "rgba(255,255,255,0.08)",
  borderS:  "rgba(255,255,255,0.05)",
  accent:   "#4f8ef7",
  accentSub:"rgba(79,142,247,0.10)",
  accentBdr:"rgba(79,142,247,0.22)",
  ink:      "#f0f2f8",
  inkSec:   "#b8bdd0",
  inkMut:   "#6b7494",
  select:   "#161921",
  danger:   "#f87171",
  dangerSub:"rgba(248,113,113,0.10)",
  dangerBdr:"rgba(248,113,113,0.25)",
};

const selectStyle = {
  height: "42px", borderRadius: "10px",
  border: `1px solid ${C.border}`, background: C.select,
  color: C.ink, padding: "0 12px",
  fontFamily: "Inter, system-ui, sans-serif", fontSize: "14px", outline: "none",
};

function TypeBadge({ type }) {
  return type === "lost" ? (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-[600]"
      style={{ color: "#4f8ef7", background: "rgba(79,142,247,0.12)", border: "1px solid rgba(79,142,247,0.22)" }}>Perdu</span>
  ) : (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-[600]"
      style={{ color: "#34d399", background: "rgba(52,211,153,0.10)", border: "1px solid rgba(52,211,153,0.20)" }}>Trouvé</span>
  );
}

function ResolvedBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-[600]"
      style={{ color: "#34d399", background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.18)" }}>
      <CheckCheck className="h-3 w-3" /> Clôturée
    </span>
  );
}

function ArchivedBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-[600]"
      style={{ color: "#8b91a8", background: "rgba(107,116,148,0.10)", border: "1px solid rgba(107,116,148,0.20)" }}>
      <Archive className="h-3 w-3" /> Archivée
    </span>
  );
}

/* ── Archive confirmation modal (list page) ───────────────────────────────── */
function ArchiveModal({ post, onConfirm, onCancel, isArchiving }) {
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onCancel]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
      role="dialog" aria-modal="true">
      <div className="w-full max-w-[400px] rounded-xl p-6 animate-scale-in"
        style={{ background: C.surface, border: "1px solid rgba(107,116,148,0.28)", boxShadow: "0 20px 48px rgba(0,0,0,0.55)" }}>
        <div className="flex items-center justify-center w-12 h-12 rounded-xl mb-5 mx-auto"
          style={{ background: "rgba(107,116,148,0.12)", border: "1px solid rgba(107,116,148,0.22)" }}>
          <Archive className="h-5 w-5" style={{ color: "#8b91a8" }} />
        </div>
        <h3 className="font-sans font-[700] text-[18px] tracking-[-0.01em] text-center mb-2" style={{ color: C.ink }}>
          Archiver l&apos;annonce ?
        </h3>
        <p className="text-[13px] text-center mb-1 leading-[1.55]" style={{ color: C.inkSec }}>
          Elle disparaîtra de la liste publique mais restera conservée dans vos archives.
        </p>
        <p className="text-[14px] font-[600] text-center truncate px-4 mb-6" style={{ color: C.ink }}>
          &ldquo;{post.title}&rdquo;
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={isArchiving}
            className="flex-1 h-10 rounded-lg text-[13px] font-[500] transition-all disabled:opacity-40"
            style={{ border: `1px solid ${C.border}`, color: C.inkSec, background: "transparent" }}>Annuler</button>
          <button onClick={onConfirm} disabled={isArchiving}
            className="flex-1 h-10 rounded-lg text-[13px] font-[600] transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            style={{ background: "rgba(107,116,148,0.22)", color: C.ink, border: "1px solid rgba(107,116,148,0.32)" }}>
            {isArchiving ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Archivage…</> : <><Archive className="h-3.5 w-3.5" /> Archiver</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteModal({ post, onConfirm, onCancel, isDeleting }) {
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onCancel]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="w-full max-w-[400px] rounded-xl p-6 animate-scale-in"
        style={{ background: C.surface, border: `1px solid ${C.dangerBdr}`, boxShadow: "0 20px 48px rgba(0,0,0,0.55)" }}>
        <div className="flex items-center justify-center w-12 h-12 rounded-xl mb-5 mx-auto"
          style={{ background: C.dangerSub, border: `1px solid ${C.dangerBdr}` }}>
          <AlertTriangle className="h-5 w-5" style={{ color: C.danger }} />
        </div>
        <h3 className="font-sans font-[700] text-[18px] tracking-[-0.01em] text-center mb-2" style={{ color: C.ink }}>
          Supprimer l&apos;annonce ?
        </h3>
        <p className="text-[14px] font-[600] text-center truncate px-4 mb-6" style={{ color: C.ink }}>
          &ldquo;{post.title}&rdquo;
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={isDeleting}
            className="flex-1 h-10 rounded-lg text-[13px] font-[500] transition-all disabled:opacity-40"
            style={{ border: `1px solid ${C.border}`, color: C.inkSec, background: "transparent" }}>Annuler</button>
          <button onClick={onConfirm} disabled={isDeleting}
            className="flex-1 h-10 rounded-lg text-[13px] font-[600] transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            style={{ background: C.danger, color: "#fff" }}>
            {isDeleting ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Suppression…</> : <><Trash2 className="h-3.5 w-3.5" /> Supprimer</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function PostCard({ post, currentUser, accessToken, onDeleted, onArchived }) {
  const dispatch = useAppDispatch();
  const { accessToken: storeToken } = useAppSelector((s) => s.auth);
  const effectiveToken = accessToken || storeToken;

  const [showConfirm,   setShowConfirm]   = useState(false);
  const [isDeleting,    setIsDeleting]    = useState(false);
  const [showArchive,   setShowArchive]   = useState(false);
  const [isArchiving,   setIsArchiving]   = useState(false);
  const isResolved = post.status === "resolved";
  const isArchived = post.status === "archived";

  const canManage = currentUser &&
    (currentUser._id === post.author?._id?.toString() ||
     currentUser.id  === post.author?._id?.toString() ||
     currentUser.role === "admin");

  const formattedDate = post.date
    ? new Date(post.date).toLocaleDateString("fr-TN", { day: "numeric", month: "short", year: "numeric" })
    : "—";

  const getToken = async () => {
    if (effectiveToken) return effectiveToken;
    const { refreshAccessToken } = await import("@/lib/api-client");
    const token = await refreshAccessToken();
    dispatch(setAccessToken(token));
    return token;
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const token = await getToken();
      await postsApi.deletePost(post._id, token);
      toast.success("Annonce supprimée.");
      setShowConfirm(false);
      onDeleted(post._id);
    } catch (err) {
      toast.error(err?.response?.message || "Erreur lors de la suppression.");
      setIsDeleting(false);
    }
  };

  const handleArchive = async () => {
    setIsArchiving(true);
    try {
      const token = await getToken();
      const data = await postsApi.archivePost(post._id, token);
      toast.success("Annonce archivée.");
      setShowArchive(false);
      onArchived(data.data.post);
    } catch (err) {
      toast.error(err?.response?.message || "Erreur lors de l'archivage.");
      setIsArchiving(false);
    }
  };

  return (
    <>
      <div className="group relative flex flex-col rounded-xl overflow-hidden transition-all duration-200"
        style={{ background: C.surface, border: `1px solid ${C.border}`, opacity: (isResolved || isArchived) ? 0.65 : 1 }}
        onMouseEnter={(e) => { if (isResolved || isArchived) return; e.currentTarget.style.borderColor = C.accentBdr; e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,0,0,0.45)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; }}>

        {/* Action buttons — top-right, revealed on hover */}
        {canManage && (
          <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-150">
            {/* Archive button — only when not already archived */}
            {!isArchived && (
              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowArchive(true); }}
                title="Archiver"
                className="flex items-center justify-center w-8 h-8 rounded-lg"
                style={{ background: "rgba(107,116,148,0.15)", border: "1px solid rgba(107,116,148,0.28)", color: "#8b91a8" }}>
                <Archive className="h-3.5 w-3.5" />
              </button>
            )}
            {/* Delete button */}
            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowConfirm(true); }}
              title="Supprimer"
              className="flex items-center justify-center w-8 h-8 rounded-lg"
              style={{ background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.22)", color: C.danger }}>
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <Link href={`/posts/${post._id}`} className="flex flex-col flex-1">
          {post.photo ? (
            <div className="h-44 overflow-hidden shrink-0" style={{ background: C.elevated }}>
              <img src={post.photo} alt={post.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
            </div>
          ) : (
            <div className="h-44 flex items-center justify-center shrink-0" style={{ background: C.elevated }}>
              <Package className="h-10 w-10" style={{ color: "rgba(255,255,255,0.08)" }} />
            </div>
          )}
          <div className="p-4 flex flex-col gap-2.5 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <TypeBadge type={post.type} />
                {isResolved && <ResolvedBadge />}
                {isArchived && <ArchivedBadge />}
              </div>
              <span className="text-[12px] shrink-0" style={{ color: C.inkMut }}>{formattedDate}</span>
            </div>
            <div>
              <h3 className="font-sans font-[600] text-[15px] tracking-[-0.01em] line-clamp-2" style={{ color: C.ink }}>{post.title}</h3>
              <p className="text-[13px] leading-[1.6] mt-1 line-clamp-2" style={{ color: C.inkSec }}>{post.description}</p>
            </div>
            <div className="flex items-center gap-3 mt-auto pt-2.5" style={{ borderTop: `1px solid ${C.borderS}` }}>
              <span className="inline-flex items-center gap-1 text-[12px]" style={{ color: C.inkSec }}>
                <MapPin className="h-3 w-3 shrink-0" />{post.city}{post.delegation ? `, ${post.delegation}` : ""}
              </span>
              {post.objectType && (
                <span className="inline-flex items-center gap-1 text-[12px]" style={{ color: C.inkMut }}>
                  <Tag className="h-3 w-3 shrink-0" />{OBJECT_TYPE_LABELS[post.objectType] ?? post.objectType}
                </span>
              )}
            </div>
          </div>
        </Link>
      </div>
      {showConfirm && <DeleteModal  post={post} onConfirm={handleDelete}  onCancel={() => setShowConfirm(false)} isDeleting={isDeleting} />}
      {showArchive  && <ArchiveModal post={post} onConfirm={handleArchive} onCancel={() => setShowArchive(false)}  isArchiving={isArchiving} />}
    </>
  );
}

function EmptyState({ hasFilters, onReset }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
      <div className="flex items-center justify-center w-16 h-16 rounded-2xl mb-5" style={{ background: C.elevated, border: `1px solid ${C.border}` }}>
        <Search className="h-7 w-7" style={{ color: C.inkMut }} />
      </div>
      <h3 className="font-sans font-[600] text-[18px] tracking-[-0.01em] mb-2" style={{ color: C.ink }}>
        {hasFilters ? "Aucune annonce trouvée" : "Aucune annonce pour l'instant"}
      </h3>
      <p className="text-[14px] max-w-xs leading-[1.6]" style={{ color: C.inkSec }}>
        {hasFilters ? "Essayez de modifier vos filtres." : "Soyez le premier à publier une annonce."}
      </p>
      {hasFilters && <button onClick={onReset} className="mt-5 text-[13px] font-[500]" style={{ color: C.accent }}>Réinitialiser</button>}
    </div>
  );
}

function PostsPageContent() {
  const searchParams = useSearchParams();
  const { user, accessToken } = useAppSelector((s) => s.auth);

  const [q,           setQ]           = useState(searchParams.get("q")          ?? "");
  const [type,        setType]        = useState(searchParams.get("type")       ?? "");
  const [objectType,  setObjectType]  = useState(searchParams.get("objectType") ?? "");
  const [city,        setCity]        = useState(searchParams.get("city")       ?? "");
  const [dateFrom,    setDateFrom]    = useState(searchParams.get("dateFrom")   ?? "");
  const [dateTo,      setDateTo]      = useState(searchParams.get("dateTo")     ?? "");
  const [sort,        setSort]        = useState(searchParams.get("sort")       ?? "-date");
  const [status,      setStatus]      = useState(searchParams.get("status")     ?? "");
  const [page,        setPage]        = useState(Number(searchParams.get("page") ?? 1));
  const [showFilters, setShowFilters] = useState(false);
  const [posts,       setPosts]       = useState([]);
  const [pagination,  setPagination]  = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);

  const hasFilters = Boolean(q || type || objectType || city || dateFrom || dateTo || status);

  const fetchPosts = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams();
      if (q)          params.set("q",          q);
      if (type)       params.set("type",       type);
      if (objectType) params.set("objectType", objectType);
      if (city)       params.set("city",       city);
      if (dateFrom)   params.set("dateFrom",   dateFrom);
      if (dateTo)     params.set("dateTo",     dateTo);
      if (status)     params.set("status",     status);
      params.set("page", page); params.set("limit", "12"); params.set("sort", sort);
      const data = await postsApi.getPosts(params.toString());
      setPosts(data.data.posts); setPagination(data.data.pagination);
    } catch { setError("Impossible de charger les annonces."); }
    finally   { setLoading(false); }
  }, [q, type, objectType, city, page, sort, dateFrom, dateTo, status]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const applyFilters = (e) => { e?.preventDefault(); setPage(1); };
  const resetFilters = () => {
    setQ(""); setType(""); setObjectType(""); setCity("");
    setDateFrom(""); setDateTo(""); setSort("-date"); setStatus(""); setPage(1);
  };
  const handleDeleted = useCallback((id) => {
    setPosts((p) => p.filter((x) => x._id !== id));
    setPagination((p) => p ? { ...p, total: Math.max(0, p.total - 1) } : p);
  }, []);

  const handleArchived = useCallback((updatedPost) => {
    // If currently viewing active/all posts, replace in-place with updated data
    // (the card will now show the ArchivedBadge). If filtering by active only,
    // remove it from the list so the count stays consistent.
    setPosts((p) => {
      const replaced = p.map((x) => x._id === updatedPost._id ? updatedPost : x);
      // If the current filter wouldn't include archived posts, drop it
      if (!status || status === "") {
        return replaced.filter((x) => x.status !== "archived");
      }
      return replaced;
    });
    if (!status || status === "") {
      setPagination((p) => p ? { ...p, total: Math.max(0, p.total - 1) } : p);
    }
  }, [status]);

  const activeFilterCount = [type, objectType, city, dateFrom, dateTo, status].filter(Boolean).length;

  return (
    <div style={{ minHeight: "100vh", background: C.canvas }}>
      {/* Header bar */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.borderS}` }}>
        <PageContainer>
          <div className="py-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="font-sans font-[700] text-[28px] tracking-[-0.025em]" style={{ color: C.ink }}>Annonces</h1>
              <p className="text-[14px] mt-0.5" style={{ color: C.inkMut }}>
                {pagination ? `${pagination.total} annonce${pagination.total !== 1 ? "s" : ""}` : "Chargement…"}
              </p>
            </div>
            <Button asChild size="default" className="gap-2 shrink-0">
              <Link href="/posts/new"><PlusCircle className="h-4 w-4" /> Nouvelle annonce</Link>
            </Button>
          </div>

          {/* Search + sort */}
          <div className="pb-5 flex flex-col sm:flex-row gap-2">
            <form onSubmit={applyFilters} className="flex flex-1 gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: C.inkMut }} />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher une annonce…" className="pl-9" />
              </div>
              <Button type="submit" variant="secondary" className="h-[42px] px-4 gap-1.5 shrink-0">
                <Search className="h-3.5 w-3.5" /><span className="hidden sm:inline">Chercher</span>
              </Button>
            </form>
            <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}
              style={{ ...selectStyle, width: "auto", paddingRight: "32px" }}>
              <option value="-date">Plus récent</option>
              <option value="date">Plus ancien</option>
            </select>
            <button type="button" onClick={() => setShowFilters((v) => !v)}
              className="h-[42px] px-4 gap-2 rounded-[10px] text-[13px] font-[500] flex items-center transition-all duration-150"
              style={{ border: showFilters ? `1px solid ${C.accent}` : `1px solid ${C.border}`, background: showFilters ? C.accentSub : "transparent", color: showFilters ? C.accent : C.inkSec }}>
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filtres
              {activeFilterCount > 0 && (
                <span className="flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-[700]"
                  style={{ background: C.accent, color: "#fff" }}>{activeFilterCount}</span>
              )}
            </button>
          </div>

          {/* Filters panel */}
          {showFilters && (
            <div className="pb-5 pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-slide-down"
              style={{ borderTop: `1px solid ${C.borderS}` }}>
              <div className="space-y-1.5">
                <label className="text-[11px] font-[600] uppercase tracking-[0.07em]" style={{ color: C.inkMut }}>Type</label>
                <select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} style={{ ...selectStyle, width: "100%" }}>
                  <option value="">Tous</option><option value="lost">Perdu</option><option value="found">Trouvé</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-[600] uppercase tracking-[0.07em]" style={{ color: C.inkMut }}>Type d&apos;objet</label>
                <select value={objectType} onChange={(e) => { setObjectType(e.target.value); setPage(1); }} style={{ ...selectStyle, width: "100%" }}>
                  <option value="">Tous</option>
                  {Object.entries(OBJECT_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-[600] uppercase tracking-[0.07em]" style={{ color: C.inkMut }}>Ville</label>
                <select value={city} onChange={(e) => { setCity(e.target.value); setPage(1); }} style={{ ...selectStyle, width: "100%" }}>
                  <option value="">Toutes</option>
                  {TUNISIAN_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-[600] uppercase tracking-[0.07em]" style={{ color: C.inkMut }}>Statut</label>
                <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} style={{ ...selectStyle, width: "100%" }}>
                  <option value="">Actives uniquement</option>
                  <option value="resolved">Clôturées uniquement</option>
                  <option value="archived">Archivées uniquement</option>
                  <option value="all">Toutes</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-[600] uppercase tracking-[0.07em]" style={{ color: C.inkMut }}>Date — du</label>
                <input type="date" value={dateFrom} max={dateTo || new Date().toISOString().split("T")[0]}
                  onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} style={{ ...selectStyle, width: "100%" }} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-[600] uppercase tracking-[0.07em]" style={{ color: C.inkMut }}>Date — au</label>
                <input type="date" value={dateTo} min={dateFrom || undefined} max={new Date().toISOString().split("T")[0]}
                  onChange={(e) => { setDateTo(e.target.value); setPage(1); }} style={{ ...selectStyle, width: "100%" }} />
              </div>
              {hasFilters && (
                <div className="sm:col-span-3 flex items-center mt-1">
                  <button onClick={resetFilters} className="flex items-center gap-1.5 text-[13px] font-[500]" style={{ color: C.danger }}>
                    <X className="h-3.5 w-3.5" /> Effacer les filtres
                  </button>
                </div>
              )}
            </div>
          )}
        </PageContainer>
      </div>

      {/* Grid */}
      <PageContainer>
        <div className="py-8">
          {loading ? (
            <div className="flex items-center justify-center py-28">
              <Loader2 className="h-6 w-6 animate-spin" style={{ color: C.accent }} />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
              <AlertCircle className="h-8 w-8" style={{ color: C.danger }} />
              <p className="text-[15px]" style={{ color: C.inkSec }}>{error}</p>
              <Button variant="secondary" size="sm" onClick={fetchPosts}>Réessayer</Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {posts.length === 0
                  ? <EmptyState hasFilters={hasFilters} onReset={resetFilters} />
                  : posts.map((post) => (
                      <PostCard key={post._id} post={post} currentUser={user} accessToken={accessToken} onDeleted={handleDeleted} onArchived={handleArchived} />
                    ))
                }
              </div>
              {pagination && pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-12">
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

export default function PostsPage() {
  return <Suspense><PostsPageContent /></Suspense>;
}
