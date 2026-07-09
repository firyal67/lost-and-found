"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search, SlidersHorizontal, MapPin, Calendar, Tag,
  PlusCircle, Loader2, ChevronLeft, ChevronRight,
  Package, X, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { postsApi } from "@/lib/api/posts.api";
import PageContainer from "@/components/layout/PageContainer";

// ─── Constants ────────────────────────────────────────────────────────────

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

// ─── Sub-components ───────────────────────────────────────────────────────

function TypeBadge({ type }) {
  return type === "lost" ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-orange-100 text-orange-700 border border-orange-200">
      Perdu
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
      Trouvé
    </span>
  );
}

function PostCard({ post }) {
  const formattedDate = post.date
    ? new Date(post.date).toLocaleDateString("fr-TN", { day: "numeric", month: "short", year: "numeric" })
    : "—";

  return (
    <Link
      href={`/posts/${post._id}`}
      className="group flex flex-col bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 overflow-hidden"
    >
      {/* Photo */}
      {post.photo ? (
        <div className="h-44 bg-slate-100 overflow-hidden shrink-0">
          <img
            src={post.photo}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      ) : (
        <div className="h-44 bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center shrink-0">
          <Package className="h-10 w-10 text-slate-300" />
        </div>
      )}

      {/* Content */}
      <div className="p-4 flex flex-col gap-2.5 flex-1">
        <div className="flex items-start justify-between gap-2">
          <TypeBadge type={post.type} />
          <span className="text-[11px] text-slate-400 shrink-0">{formattedDate}</span>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-800 line-clamp-2 group-hover:text-blue-600 transition-colors leading-snug">
            {post.title}
          </h3>
          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
            {post.description}
          </p>
        </div>

        <div className="flex items-center gap-3 mt-auto pt-2 border-t border-slate-100">
          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
            <MapPin className="h-3 w-3 shrink-0" />
            {post.city}{post.delegation ? `, ${post.delegation}` : ""}
          </span>
          {post.objectType && (
            <span className="inline-flex items-center gap-1 text-xs text-slate-400">
              <Tag className="h-3 w-3 shrink-0" />
              {OBJECT_TYPE_LABELS[post.objectType] ?? post.objectType}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function EmptyState({ hasFilters, onReset }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
      <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 mb-4">
        <Search className="h-7 w-7 text-slate-400" />
      </div>
      <h3 className="text-base font-semibold text-slate-700 mb-1">
        {hasFilters ? "Aucune annonce trouvée" : "Aucune annonce pour l'instant"}
      </h3>
      <p className="text-sm text-slate-500 max-w-xs">
        {hasFilters
          ? "Essayez de modifier vos filtres pour élargir la recherche."
          : "Soyez le premier à publier une annonce."}
      </p>
      {hasFilters && (
        <button
          onClick={onReset}
          className="mt-4 text-sm text-blue-600 hover:underline font-medium"
        >
          Réinitialiser les filtres
        </button>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default function PostsPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  // ── Filters from URL ──
  const [q,          setQ]          = useState(searchParams.get("q") ?? "");
  const [type,       setType]       = useState(searchParams.get("type") ?? "");
  const [objectType, setObjectType] = useState(searchParams.get("objectType") ?? "");
  const [city,       setCity]       = useState(searchParams.get("city") ?? "");
  const [page,       setPage]       = useState(Number(searchParams.get("page") ?? 1));
  const [showFilters,setShowFilters]= useState(false);

  // ── Data ──
  const [posts,      setPosts]      = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);

  const hasFilters = Boolean(q || type || objectType || city);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (q)          params.set("q", q);
      if (type)       params.set("type", type);
      if (objectType) params.set("objectType", objectType);
      if (city)       params.set("city", city);
      params.set("page", page);
      params.set("limit", "12");
      params.set("sort", "-date");

      const data = await postsApi.getPosts(params.toString());
      setPosts(data.data.posts);
      setPagination(data.data.pagination);
    } catch (err) {
      setError("Impossible de charger les annonces.");
    } finally {
      setLoading(false);
    }
  }, [q, type, objectType, city, page]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const applyFilters = (e) => {
    e?.preventDefault();
    setPage(1);
  };

  const resetFilters = () => {
    setQ(""); setType(""); setObjectType(""); setCity(""); setPage(1);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Header strip ── */}
      <div className="bg-white border-b border-slate-200">
        <PageContainer>
          <div className="py-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Annonces</h1>
              <p className="text-sm text-slate-500 mt-1">
                {pagination ? `${pagination.total} annonce${pagination.total !== 1 ? "s" : ""} publiée${pagination.total !== 1 ? "s" : ""}` : "Chargement…"}
              </p>
            </div>
            <Button asChild className="gap-2 shrink-0">
              <Link href="/posts/new">
                <PlusCircle className="h-4 w-4" />
                Nouvelle annonce
              </Link>
            </Button>
          </div>

          {/* ── Search + filter toggle ── */}
          <div className="pb-5 flex flex-col sm:flex-row gap-2">
            <form onSubmit={applyFilters} className="flex flex-1 gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Rechercher une annonce…"
                  className="pl-9 h-10 text-sm border-slate-200"
                />
              </div>
              <Button type="submit" variant="outline" className="h-10 px-4 gap-1.5 border-slate-200 text-slate-600">
                <Search className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Chercher</span>
              </Button>
            </form>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowFilters((v) => !v)}
              className={`h-10 px-4 gap-1.5 border-slate-200 text-slate-600 ${showFilters ? "bg-blue-50 border-blue-300 text-blue-700" : ""}`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filtres
              {hasFilters && (
                <span className="ml-1 flex items-center justify-center w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-bold">
                  {[type, objectType, city].filter(Boolean).length}
                </span>
              )}
            </Button>
          </div>

          {/* ── Filter panel ── */}
          {showFilters && (
            <div className="pb-5 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-slate-100 pt-4">
              {/* Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Type</label>
                <select
                  value={type}
                  onChange={(e) => { setType(e.target.value); setPage(1); }}
                  className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="">Tous</option>
                  <option value="lost">Perdu</option>
                  <option value="found">Trouvé</option>
                </select>
              </div>

              {/* Objet */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Type d'objet</label>
                <select
                  value={objectType}
                  onChange={(e) => { setObjectType(e.target.value); setPage(1); }}
                  className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="">Tous</option>
                  {Object.entries(OBJECT_TYPE_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>

              {/* Ville */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Ville</label>
                <select
                  value={city}
                  onChange={(e) => { setCity(e.target.value); setPage(1); }}
                  className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="">Toutes</option>
                  {TUNISIAN_CITIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {hasFilters && (
                <button
                  onClick={resetFilters}
                  className="sm:col-span-3 text-xs text-rose-500 hover:text-rose-700 font-medium flex items-center gap-1 mt-1"
                >
                  <X className="h-3 w-3" /> Effacer les filtres
                </button>
              )}
            </div>
          )}
        </PageContainer>
      </div>

      {/* ── Grid ── */}
      <PageContainer>
        <div className="py-8">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
              <AlertCircle className="h-8 w-8 text-rose-400" />
              <p className="text-sm text-slate-600">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchPosts}>Réessayer</Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {posts.length === 0 ? (
                  <EmptyState hasFilters={hasFilters} onReset={resetFilters} />
                ) : (
                  posts.map((post) => <PostCard key={post._id} post={post} />)
                )}
              </div>

              {/* ── Pagination ── */}
              {pagination && pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" /> Précédent
                  </button>

                  <span className="text-sm text-slate-500 px-2">
                    Page {pagination.page} / {pagination.pages}
                  </span>

                  <button
                    onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                    disabled={page === pagination.pages}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                  >
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
