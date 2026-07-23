"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  Loader2, MapPin, Calendar, Tag, User, Mail, Phone, MessageSquare,
  ArrowLeft, Package, Shield, Clock, AlertCircle, X, Send, CheckCircle2,
  Trash2, CheckCheck, Sparkles, ExternalLink, TrendingUp, ChevronDown, ChevronUp,
  Link2, Pencil, Archive, Flag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { postsApi } from "@/lib/api/posts.api";
import { reportsApi } from "@/lib/api/reports.api";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { setAccessToken } from "@/store/slices/authSlice";
import PageContainer from "@/components/layout/PageContainer";

const OBJECT_TYPE_LABELS = {
  cin: "Carte d'identité (CIN)",
  passport: "Passeport",
  permis: "Permis de conduire",
  carte_bancaire: "Carte bancaire",
  telephone: "Téléphone",
  cles: "Clés",
  autre: "Autre",
};

/* ── Score bar ────────────────────────────────────────────────────────────── */
function ScoreBar({ score }) {
  const pct   = Math.min(100, Math.max(0, score));
  const color = pct >= 80 ? "#34d399" : pct >= 50 ? "#fbbf24" : "#4f8ef7";
  const label = pct >= 80 ? "Très pertinent" : pct >= 50 ? "Pertinent" : "Possible";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[11px] font-[600] shrink-0 w-24 text-right" style={{ color }}>
        {label} ({pct}%)
      </span>
    </div>
  );
}

/* ── Score breakdown tooltip ──────────────────────────────────────────────── */
function BreakdownBadge({ icon, label, value, max }) {
  const active = value > 0;
  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-[500]"
      style={{
        background: active ? "rgba(79,142,247,0.10)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${active ? "rgba(79,142,247,0.22)" : "rgba(255,255,255,0.06)"}`,
        color: active ? "#7aabfa" : "#3d4460",
      }}
    >
      {icon}
      <span>{label}</span>
      <span className="font-[700]" style={{ color: active ? "#4f8ef7" : "#3d4460" }}>
        +{value}/{max}
      </span>
    </div>
  );
}

/* ── Related matches panel ────────────────────────────────────────────────── */
function RelatedMatchesPanel({ postId, postType }) {
  const [matches,   setMatches]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [expanded,  setExpanded]  = useState(false);
  const [showPanel, setShowPanel] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await postsApi.getPostMatches(postId);
        if (!cancelled) {
          const m = data?.data?.matches ?? [];
          setMatches(m);
          setShowPanel(m.length > 0);
        }
      } catch {
        // silencieux — ne pas bloquer la page si l'API échoue
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [postId]);

  const oppositeLabel = postType === "lost" ? "objets trouvés" : "objets perdus";

  // Ne rien afficher pendant le chargement (spinner discret sur la page principale)
  if (loading) return (
    <div className="flex items-center gap-2 mb-6 px-1" aria-live="polite">
      <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: "#4f8ef7" }} />
      <span className="text-[12px]" style={{ color: "#6b7494" }}>Recherche de correspondances…</span>
    </div>
  );

  if (!showPanel || matches.length === 0) return null;

  const visibleMatches = expanded ? matches : matches.slice(0, 2);

  return (
    <div className="mb-6 rounded-xl overflow-hidden animate-fade-in"
      style={{ border: "1px solid rgba(79,142,247,0.28)" }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3.5"
        style={{ background: "rgba(79,142,247,0.10)", borderBottom: "1px solid rgba(79,142,247,0.18)" }}>
        <div className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
          style={{ background: "rgba(79,142,247,0.18)" }}>
          <Sparkles className="h-4 w-4" style={{ color: "#4f8ef7" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-[700]" style={{ color: "#f0f2f8" }}>
            {matches.length} correspondance{matches.length > 1 ? "s" : ""} trouvée{matches.length > 1 ? "s" : ""}
          </p>
          <p className="text-[12px] mt-0.5" style={{ color: "#6b7494" }}>
            {oppositeLabel} similaires — vérifiez avant de contacter
          </p>
        </div>
        <TrendingUp className="h-4 w-4 shrink-0" style={{ color: "#4f8ef7" }} />
      </div>

      {/* Match cards */}
      <div style={{ background: "#0f1219" }}>
        {visibleMatches.map((match, idx) => {
          const dateStr = match.date
            ? new Date(match.date).toLocaleDateString("fr-TN", {
                day: "numeric", month: "short", year: "numeric",
              })
            : "—";
          const bd = match.matchBreakdown ?? {};
          const details = match.matchDetails ?? {};

          return (
            <div key={match._id}
              className="p-4 transition-colors"
              style={{ borderTop: idx > 0 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>

              {/* Score bar */}
              <ScoreBar score={match.matchScore} />

              {/* Title + link */}
              <div className="flex items-start justify-between gap-2 mt-2.5 mb-2">
                <p className="text-[14px] font-[600] leading-snug line-clamp-2"
                  style={{ color: "#f0f2f8" }}>
                  {match.title}
                </p>
                <Link
                  href={`/posts/${match._id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 shrink-0 text-[11px] font-[600] px-2.5 py-1 rounded-full"
                  style={{
                    color: "#4f8ef7",
                    background: "rgba(79,142,247,0.10)",
                    border: "1px solid rgba(79,142,247,0.22)",
                  }}
                >
                  Voir <ExternalLink className="h-3 w-3" />
                </Link>
              </div>

              {/* Meta row */}
              <div className="flex items-center gap-3 flex-wrap mb-3">
                <span className="inline-flex items-center gap-1 text-[12px]" style={{ color: "#8b91a8" }}>
                  <MapPin className="h-3 w-3 shrink-0" />
                  {match.city}{match.delegation ? `, ${match.delegation}` : ""}
                </span>
                <span className="inline-flex items-center gap-1 text-[12px]" style={{ color: "#8b91a8" }}>
                  <Calendar className="h-3 w-3 shrink-0" />
                  {dateStr}
                  {details.diffDays != null && (
                    <span style={{ color: "#4d5473" }}>
                      &nbsp;({Math.round(details.diffDays)}j d&apos;écart)
                    </span>
                  )}
                </span>
                {details.sharedTokens?.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-[12px]" style={{ color: "#8b91a8" }}>
                    <Tag className="h-3 w-3 shrink-0" />
                    {details.sharedTokens.slice(0, 3).join(", ")}
                  </span>
                )}
              </div>

              {/* Score breakdown badges */}
              <div className="flex flex-wrap gap-1.5">
                <BreakdownBadge
                  icon={<Package className="h-3 w-3" />}
                  label="Objet" value={bd.objectType ?? 0} max={40} />
                <BreakdownBadge
                  icon={<MapPin className="h-3 w-3" />}
                  label="Ville" value={bd.city ?? 0} max={25} />
                <BreakdownBadge
                  icon={<MapPin className="h-3 w-3" style={{ opacity: 0.6 }} />}
                  label="Délég." value={bd.delegation ?? 0} max={10} />
                <BreakdownBadge
                  icon={<Calendar className="h-3 w-3" />}
                  label="Date" value={bd.date ?? 0} max={15} />
                <BreakdownBadge
                  icon={<Tag className="h-3 w-3" />}
                  label="Mots-clés" value={bd.keywords ?? 0} max={10} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Show more / less */}
      {matches.length > 2 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center justify-center gap-2 py-2.5 text-[12px] font-[600] transition-colors"
          style={{
            borderTop: "1px solid rgba(255,255,255,0.05)",
            background: "rgba(255,255,255,0.02)",
            color: "#4f8ef7",
          }}
        >
          {expanded ? (
            <><ChevronUp className="h-3.5 w-3.5" /> Voir moins</>
          ) : (
            <><ChevronDown className="h-3.5 w-3.5" /> Voir {matches.length - 2} de plus</>
          )}
        </button>
      )}

      {/* Footer */}
      <div className="px-5 py-2.5 flex items-center justify-between"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.015)" }}>
        <p className="text-[11px]" style={{ color: "#6b7494" }}>
          Score basé sur le type, la ville, la date et les mots-clés.
        </p>
        <Link href="/posts" className="text-[11px] font-[600]" style={{ color: "#4f8ef7" }}>
          Toutes les annonces →
        </Link>
      </div>
    </div>
  );
}

/* ── Status banner ────────────────────────────────────────────────────────── */
function StatusBanner({ post }) {
  const { status, resolvedAt, matchedAt, matchedWith } = post;
  if (status !== "resolved" && status !== "matched" && status !== "archived") return null;

  const isMatched  = status === "matched";
  const isResolved = status === "resolved";
  const isArchived = status === "archived";

  const dateStr = isMatched
    ? (matchedAt  ? new Date(matchedAt).toLocaleDateString("fr-TN",  { day: "numeric", month: "long", year: "numeric" }) : null)
    : isResolved
    ? (resolvedAt ? new Date(resolvedAt).toLocaleDateString("fr-TN", { day: "numeric", month: "long", year: "numeric" }) : null)
    : null;

  const bg     = isMatched ? "rgba(79,142,247,0.08)"  : isArchived ? "rgba(107,116,148,0.10)" : "rgba(52,211,153,0.08)";
  const border = isMatched ? "1px solid rgba(79,142,247,0.22)" : isArchived ? "1px solid rgba(107,116,148,0.22)" : "1px solid rgba(52,211,153,0.22)";
  const color  = isMatched ? "#4f8ef7" : isArchived ? "#8b91a8" : "#34d399";

  const icon = isMatched
    ? <Link2    className="h-5 w-5 shrink-0 mt-0.5" style={{ color }} />
    : isArchived
    ? <Archive  className="h-5 w-5 shrink-0 mt-0.5" style={{ color }} />
    : <CheckCheck className="h-5 w-5 shrink-0 mt-0.5" style={{ color }} />;

  const title = isMatched
    ? "Annonce mise en correspondance — objet retrouvé via la plateforme"
    : isArchived
    ? "Annonce archivée — conservée pour référence, non visible dans la liste"
    : "Annonce clôturée — situation résolue";

  const dateLabel = isMatched ? "Correspondance confirmée" : isResolved ? "Clôturée" : null;

  return (
    <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl mb-6"
      style={{ background: bg, border }}>
      {icon}
      <div className="min-w-0">
        <p className="text-[14px] font-[700]" style={{ color }}>{title}</p>
        {dateStr && dateLabel && (
          <p className="text-[12px] mt-0.5" style={{ color: "#6b7494" }}>
            {dateLabel} le {dateStr}
          </p>
        )}
        {isMatched && matchedWith && (
          <Link
            href={`/posts/${typeof matchedWith === "object" ? matchedWith._id : matchedWith}`}
            className="inline-flex items-center gap-1 mt-1.5 text-[12px] font-[600] transition-colors"
            style={{ color: "#4f8ef7" }}
          >
            Voir l&apos;annonce liée <ExternalLink className="h-3 w-3" />
          </Link>
        )}
      </div>
    </div>
  );
}

/* ── Type badge ───────────────────────────────────────────────────────────── */
function TypeBadge({ type }) {
  return type === "lost" ? (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-[600]"
      style={{ color: "#4f8ef7", background: "rgba(79,142,247,0.12)", border: "1px solid rgba(79,142,247,0.22)" }}
    >
      <Package className="h-3.5 w-3.5" /> Objet perdu
    </span>
  ) : (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-[600]"
      style={{ color: "#34d399", background: "rgba(52,211,153,0.10)", border: "1px solid rgba(52,211,153,0.20)" }}
    >
      <Package className="h-3.5 w-3.5" /> Objet trouvé
    </span>
  );
}

/* ── Info row ─────────────────────────────────────────────────────────────── */
function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <div
        className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0 mt-0.5"
        style={{ background: "#1a1e28" }}
      >
        <Icon className="h-4 w-4" style={{ color: "#6b7494" }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-[600] uppercase tracking-[0.07em] mb-0.5" style={{ color: "#6b7494" }}>{label}</p>
        <p className="text-[14px] font-[400] break-words" style={{ color: "#f0f2f8" }}>{value}</p>
      </div>
    </div>
  );
}

/* ── Contact modal ────────────────────────────────────────────────────────── */
function ContactModal({ post, onClose }) {
  const dispatch = useAppDispatch();
  const { accessToken } = useAppSelector((s) => s.auth);
  const [message,         setMessage]         = useState("");
  const [loading,         setLoading]         = useState(false);
  const [checkingExisting,setCheckingExisting]= useState(true);
  const [existingContact, setExistingContact] = useState(null); // null = not sent yet
  const [sent,            setSent]            = useState(false);
  const backdropRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Check if user already sent a request for this post
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let token = accessToken;
        if (!token) {
          const { refreshAccessToken } = await import("@/lib/api-client");
          token = await refreshAccessToken();
          dispatch(setAccessToken(token));
        }
        const { contactsApi } = await import("@/lib/api/contacts.api");
        const data = await contactsApi.getContactForPost(post._id, token);
        if (!cancelled && data?.data?.contact) {
          setExistingContact(data.data.contact);
        }
      } catch {
        // silencieux
      } finally {
        if (!cancelled) setCheckingExisting(false);
      }
    })();
    return () => { cancelled = true; };
  }, [post._id, accessToken, dispatch]);

  const getToken = async () => {
    if (accessToken) return accessToken;
    const { refreshAccessToken } = await import("@/lib/api-client");
    const token = await refreshAccessToken();
    dispatch(setAccessToken(token));
    return token;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = await getToken();
      await postsApi.createContactRequest({ postId: post._id, message }, token);
      setSent(true);
      toast.success("Demande de contact envoyée !");
    } catch (err) {
      toast.error(err.response?.message || err.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Status badge ─────────────────────────────────────────────────── */
  const STATUS_CONFIG = {
    pending:  { label: "En attente",  color: "#fbbf24", bg: "rgba(251,191,36,0.10)",  border: "rgba(251,191,36,0.25)"  },
    approved: { label: "Approuvée",   color: "#34d399", bg: "rgba(52,211,153,0.10)",  border: "rgba(52,211,153,0.25)"  },
    rejected: { label: "Refusée",     color: "#f87171", bg: "rgba(248,113,113,0.10)", border: "rgba(248,113,113,0.25)" },
  };

  return (
    <div ref={backdropRef} onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
      role="dialog" aria-modal="true" aria-label="Contacter l'auteur"
    >
      <div className="w-full max-w-md rounded-xl overflow-hidden animate-scale-in"
        style={{ background: "#13161e", border: "1px solid rgba(255,255,255,0.10)", boxShadow: "0 20px 48px rgba(0,0,0,0.55)" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div>
            <h2 className="font-sans font-[700] text-[18px] tracking-[-0.01em]" style={{ color: "#f0f2f8" }}>
              Contacter l&apos;auteur
            </h2>
            <p className="text-[13px] mt-0.5 truncate max-w-[260px]" style={{ color: "#6b7494" }}>{post.title}</p>
          </div>
          <button onClick={onClose} className="flex items-center justify-center w-8 h-8 rounded-lg"
            style={{ color: "#6b7494" }} aria-label="Fermer">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-5">

          {/* ── Loading check ─────────────────────────────────────────── */}
          {checkingExisting && (
            <div className="flex items-center justify-center py-8 gap-3">
              <Loader2 className="h-4 w-4 animate-spin" style={{ color: "#4f8ef7" }} />
              <span className="text-[13px]" style={{ color: "#6b7494" }}>Vérification…</span>
            </div>
          )}

          {/* ── Already sent — show status ────────────────────────────── */}
          {!checkingExisting && existingContact && !sent && (() => {
            const cfg = STATUS_CONFIG[existingContact.status] ?? STATUS_CONFIG.pending;
            return (
              <div className="space-y-4">
                {/* Status card */}
                <div className="flex items-start gap-3 p-4 rounded-xl"
                  style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                  <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: cfg.color }} />
                  <div className="min-w-0">
                    <p className="text-[14px] font-[700]" style={{ color: cfg.color }}>
                      Demande {cfg.label}
                    </p>
                    <p className="text-[12px] mt-1 leading-[1.55]" style={{ color: "#8b91a8" }}>
                      {existingContact.status === "pending"  && "Votre demande est en attente de réponse de l'auteur."}
                      {existingContact.status === "approved" && "L'auteur a approuvé votre demande. Ses coordonnées sont disponibles ci-dessous."}
                      {existingContact.status === "rejected" && "L'auteur a décliné votre demande de contact."}
                    </p>
                    {existingContact.message && (
                      <p className="text-[12px] mt-2 italic" style={{ color: "#6b7494" }}>
                        Votre message : &ldquo;{existingContact.message}&rdquo;
                      </p>
                    )}
                  </div>
                </div>

                {/* Revealed coordinates (approved only) */}
                {existingContact.status === "approved" && (
                  <div className="space-y-2">
                    <p className="text-[12px] font-[600] uppercase tracking-[0.06em]" style={{ color: "#6b7494" }}>
                      Coordonnées révélées
                    </p>
                    {existingContact.revealedEmail ? (
                      <a href={`mailto:${existingContact.revealedEmail}`}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg group transition-all"
                        style={{ background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.18)" }}>
                        <Mail className="h-4 w-4 shrink-0" style={{ color: "#34d399" }} />
                        <div className="min-w-0">
                          <p className="text-[11px] font-[600] uppercase tracking-[0.06em]" style={{ color: "#6b7494" }}>Email</p>
                          <p className="text-[13px] font-[500] truncate group-hover:underline" style={{ color: "#34d399" }}>
                            {existingContact.revealedEmail}
                          </p>
                        </div>
                      </a>
                    ) : null}
                    {existingContact.revealedPhone ? (
                      <a href={`tel:${existingContact.revealedPhone}`}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg group transition-all"
                        style={{ background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.18)" }}>
                        <Phone className="h-4 w-4 shrink-0" style={{ color: "#34d399" }} />
                        <div className="min-w-0">
                          <p className="text-[11px] font-[600] uppercase tracking-[0.06em]" style={{ color: "#6b7494" }}>Téléphone</p>
                          <p className="text-[13px] font-[500] truncate group-hover:underline" style={{ color: "#34d399" }}>
                            {existingContact.revealedPhone}
                          </p>
                        </div>
                      </a>
                    ) : null}
                    {!existingContact.revealedEmail && !existingContact.revealedPhone && (
                      <p className="text-[12px]" style={{ color: "#6b7494" }}>
                        Aucune coordonnée renseignée par l&apos;auteur.
                      </p>
                    )}
                  </div>
                )}

                <button onClick={onClose}
                  className="w-full h-10 rounded-lg text-[13px] font-[500] transition-all mt-1"
                  style={{ border: "1px solid rgba(255,255,255,0.08)", color: "#b8bdd0", background: "transparent" }}>
                  Fermer
                </button>
              </div>
            );
          })()}

          {/* ── Success screen ────────────────────────────────────────── */}
          {(sent || (!checkingExisting && !existingContact && false)) && (
            <div className="flex flex-col items-center text-center gap-3 py-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl"
                style={{ background: "rgba(79,142,247,0.10)", border: "1px solid rgba(79,142,247,0.22)" }}>
                <CheckCircle2 className="h-7 w-7" style={{ color: "#4f8ef7" }} />
              </div>
              <div>
                <p className="font-sans font-[700] text-[18px]" style={{ color: "#f0f2f8" }}>Demande envoyée !</p>
                <p className="text-[14px] mt-1 leading-[1.65]" style={{ color: "#8b91a8" }}>
                  L&apos;auteur a été notifié. Vous serez informé de sa réponse.
                </p>
              </div>
              <Button onClick={onClose} className="mt-2 w-full">Fermer</Button>
            </div>
          )}

          {/* ── New request form ──────────────────────────────────────── */}
          {!checkingExisting && !existingContact && !sent && (
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* Privacy note */}
              <div className="rounded-lg px-4 py-3"
                style={{ background: "rgba(79,142,247,0.07)", border: "1px solid rgba(79,142,247,0.18)" }}>
                <div className="flex items-start gap-2.5">
                  <Shield className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#4f8ef7" }} />
                  <div>
                    <p className="text-[13px] font-[600]" style={{ color: "#7aabfa" }}>Envoi sécurisé</p>
                    <p className="text-[12px] mt-0.5 leading-[1.55]" style={{ color: "#6b7494" }}>
                      Votre demande sera envoyée à <strong style={{ color: "#b8bdd0" }}>{post.author?.name ?? "l'auteur"}</strong>.
                      Vos coordonnées ne sont <strong style={{ color: "#b8bdd0" }}>pas partagées</strong> tant que l&apos;auteur n&apos;a pas approuvé votre demande.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="contact-message" className="text-[13px] font-[500]" style={{ color: "#b8bdd0" }}>
                  Message <span className="text-[12px] font-[400]" style={{ color: "#6b7494" }}>(optionnel)</span>
                </label>
                <textarea id="contact-message" rows={4} maxLength={500} value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Bonjour, je pense avoir trouvé votre objet…"
                  className="w-full rounded-lg px-3.5 py-2.5 text-[14px] resize-none focus:outline-none transition-all"
                  style={{ background: "#161921", border: "1px solid rgba(255,255,255,0.08)", color: "#f0f2f8" }}
                />
                <p className="text-right text-[12px]" style={{ color: "#6b7494" }}>{message.length}/500</p>
              </div>

              <div className="flex gap-3 pt-1">
                <Button type="button" variant="secondary" onClick={onClose} className="flex-1" disabled={loading}>
                  Annuler
                </Button>
                <Button type="submit" disabled={loading} className="flex-1 gap-2">
                  {loading
                    ? <><Loader2 className="h-4 w-4 animate-spin" />Envoi…</>
                    : <><Send className="h-4 w-4" />Envoyer la demande</>}
                </Button>
              </div>
            </form>
          )}

          {/* ── Sent (after submit) ───────────────────────────────────── */}
          {sent && (
            <div className="flex flex-col items-center text-center gap-3 py-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl"
                style={{ background: "rgba(79,142,247,0.10)", border: "1px solid rgba(79,142,247,0.22)" }}>
                <CheckCircle2 className="h-7 w-7" style={{ color: "#4f8ef7" }} />
              </div>
              <div>
                <p className="font-sans font-[700] text-[18px]" style={{ color: "#f0f2f8" }}>Demande envoyée !</p>
                <p className="text-[14px] mt-1 leading-[1.65]" style={{ color: "#8b91a8" }}>
                  L&apos;auteur a été notifié. Vous serez informé de sa réponse.
                </p>
              </div>
              <Button onClick={onClose} className="mt-2 w-full">Fermer</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Delete modal ─────────────────────────────────────────────────────────── */
function DeleteModal({ post, onClose, onDeleted }) {
  const dispatch = useAppDispatch();
  const { accessToken } = useAppSelector((s) => s.auth);
  const [loading, setLoading] = useState(false);
  const backdropRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const getToken = async () => {
    if (accessToken) return accessToken;
    const { refreshAccessToken } = await import("@/lib/api-client");
    const token = await refreshAccessToken();
    dispatch(setAccessToken(token));
    return token;
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      await postsApi.deletePost(post._id, token);
      toast.success("Annonce supprimée.");
      onDeleted();
    } catch (err) {
      toast.error(err.response?.message || err.message || "Une erreur est survenue.");
      setLoading(false);
    }
  };

  return (
    <div ref={backdropRef} onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
      role="dialog" aria-modal="true"
    >
      <div className="w-full max-w-[400px] rounded-xl p-6 animate-scale-in"
        style={{ background: "#13161e", border: "1px solid rgba(248,113,113,0.25)", boxShadow: "0 20px 48px rgba(0,0,0,0.55)" }}>
        <div className="flex items-center justify-center w-12 h-12 rounded-xl mb-5 mx-auto"
          style={{ background: "rgba(248,113,113,0.10)", border: "1px solid rgba(248,113,113,0.22)" }}>
          <Trash2 className="h-5 w-5" style={{ color: "#f87171" }} />
        </div>
        <h3 className="font-sans font-[700] text-[18px] tracking-[-0.01em] text-center mb-2" style={{ color: "#f0f2f8" }}>
          Supprimer l&apos;annonce ?
        </h3>
        <p className="text-[14px] text-center mb-1" style={{ color: "#8b91a8" }}>Cette action est irréversible.</p>
        <p className="text-[14px] font-[600] text-center truncate px-4 mb-6" style={{ color: "#f0f2f8" }}>
          &ldquo;{post.title}&rdquo;
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} disabled={loading}
            className="flex-1 h-10 rounded-lg text-[13px] font-[500] transition-all disabled:opacity-40"
            style={{ border: "1px solid rgba(255,255,255,0.08)", color: "#b8bdd0", background: "transparent" }}>
            Annuler
          </button>
          <button onClick={handleDelete} disabled={loading}
            className="flex-1 h-10 rounded-lg text-[13px] font-[600] transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            style={{ background: "#f87171", color: "#fff" }}>
            {loading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Suppression…</> : <><Trash2 className="h-3.5 w-3.5" /> Supprimer</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Archive modal ────────────────────────────────────────────────────────── */
function ArchiveModal({ post, onClose, onArchived }) {
  const dispatch = useAppDispatch();
  const { accessToken } = useAppSelector((s) => s.auth);
  const [loading, setLoading] = useState(false);
  const backdropRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const getToken = async () => {
    if (accessToken) return accessToken;
    const { refreshAccessToken } = await import("@/lib/api-client");
    const token = await refreshAccessToken();
    dispatch(setAccessToken(token));
    return token;
  };

  const handleArchive = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const data  = await postsApi.archivePost(post._id, token);
      toast.success("Annonce archivée.");
      onArchived(data.data.post);
    } catch (err) {
      toast.error(err.response?.message || err.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={backdropRef} onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
      role="dialog" aria-modal="true" aria-label="Archiver l'annonce"
    >
      <div className="w-full max-w-[420px] rounded-xl p-6 animate-scale-in"
        style={{ background: "#13161e", border: "1px solid rgba(107,116,148,0.30)", boxShadow: "0 20px 48px rgba(0,0,0,0.55)" }}>

        {/* Icon */}
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl mb-5 mx-auto"
          style={{ background: "rgba(107,116,148,0.12)", border: "1px solid rgba(107,116,148,0.25)" }}>
          <Archive className="h-6 w-6" style={{ color: "#8b91a8" }} />
        </div>

        <h3 className="font-sans font-[700] text-[20px] tracking-[-0.02em] text-center mb-2"
          style={{ color: "#f0f2f8" }}>
          Archiver cette annonce ?
        </h3>

        <p className="text-[14px] font-[600] text-center truncate px-4 mb-4"
          style={{ color: "#f0f2f8" }}>
          &ldquo;{post.title}&rdquo;
        </p>

        {/* Info boxes */}
        <div className="space-y-2.5 mb-6">
          <div className="flex items-start gap-2.5 px-4 py-3 rounded-lg"
            style={{ background: "rgba(107,116,148,0.08)", border: "1px solid rgba(107,116,148,0.18)" }}>
            <Archive className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#8b91a8" }} />
            <div>
              <p className="text-[13px] font-[600]" style={{ color: "#b8bdd0" }}>L&apos;annonce sera conservée</p>
              <p className="text-[12px] mt-0.5 leading-[1.55]" style={{ color: "#6b7494" }}>
                Elle disparaît de la liste publique mais reste accessible via son lien direct et dans vos archives personnelles.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2.5 px-4 py-3 rounded-lg"
            style={{ background: "rgba(79,142,247,0.06)", border: "1px solid rgba(79,142,247,0.14)" }}>
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#4f8ef7" }} />
            <p className="text-[12px] leading-[1.55]" style={{ color: "#7aabfa" }}>
              Contrairement à la suppression, vos données restent intactes et récupérables à tout moment.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} disabled={loading}
            className="flex-1 h-10 rounded-lg text-[13px] font-[500] transition-all disabled:opacity-40"
            style={{ border: "1px solid rgba(255,255,255,0.08)", color: "#b8bdd0", background: "transparent" }}>
            Annuler
          </button>
          <button onClick={handleArchive} disabled={loading}
            className="flex-1 h-10 rounded-lg text-[13px] font-[700] transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            style={{ background: "rgba(107,116,148,0.22)", color: "#f0f2f8", border: "1px solid rgba(107,116,148,0.32)" }}>
            {loading
              ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Archivage…</>
              : <><Archive className="h-3.5 w-3.5" /> Archiver</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Report modal ─────────────────────────────────────────────────────────── */
const REPORT_REASONS = [
  { value: "spam",          label: "Spam",                      description: "Contenu répétitif ou publicitaire non sollicité" },
  { value: "scam",          label: "Arnaque / fraude",          description: "Tentative de tromperie ou d'escroquerie" },
  { value: "misleading",    label: "Informations trompeuses",   description: "Contenu faux, inexact ou volontairement trompeur" },
  { value: "inappropriate", label: "Contenu inapproprié",       description: "Propos offensants, hors-sujet ou irrespectueux" },
  { value: "duplicate",     label: "Annonce en double",         description: "Cette annonce existe déjà sur la plateforme" },
  { value: "other",         label: "Autre",                     description: "Autre raison non listée ci-dessus" },
];

function ReportModal({ post, onClose, alreadyReported }) {
  const dispatch    = useAppDispatch();
  const { accessToken } = useAppSelector((s) => s.auth);
  const [reason,    setReason]  = useState("");
  const [comment,   setComment] = useState("");
  const [loading,   setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(alreadyReported);
  const backdropRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const getToken = async () => {
    if (accessToken) return accessToken;
    const { refreshAccessToken } = await import("@/lib/api-client");
    const token = await refreshAccessToken();
    dispatch(setAccessToken(token));
    return token;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) return;
    setLoading(true);
    try {
      const token = await getToken();
      await reportsApi.createReport({ postId: post._id, reason, comment }, token);
      setSubmitted(true);
      toast.success("Signalement envoyé. Merci pour votre vigilance.");
    } catch (err) {
      const msg = err.response?.message || err.message || "Une erreur est survenue.";
      if (err.status === 409) {
        setSubmitted(true); // already reported — show success state
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={backdropRef} onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: "rgba(0,0,0,0.70)", backdropFilter: "blur(8px)" }}
      role="dialog" aria-modal="true" aria-label="Signaler l'annonce"
    >
      <div className="w-full max-w-[460px] rounded-2xl overflow-hidden animate-scale-in"
        style={{ background: "#13161e", border: "1px solid rgba(255,255,255,0.10)", boxShadow: "0 24px 56px rgba(0,0,0,0.60)" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
              style={{ background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.22)" }}>
              <Flag className="h-4 w-4" style={{ color: "#fbbf24" }} />
            </div>
            <div>
              <h2 className="font-sans font-[700] text-[16px] tracking-[-0.01em]" style={{ color: "#f0f2f8" }}>
                Signaler l&apos;annonce
              </h2>
              <p className="text-[12px] truncate max-w-[280px] mt-0.5" style={{ color: "#6b7494" }}>{post.title}</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Fermer"
            className="flex items-center justify-center w-8 h-8 rounded-lg"
            style={{ color: "#6b7494" }}>
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {submitted ? (
            /* ── Success state ────────────────────────────────────────── */
            <div className="flex flex-col items-center text-center gap-3 py-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl"
                style={{ background: "rgba(251,191,36,0.10)", border: "1px solid rgba(251,191,36,0.22)" }}>
                <CheckCircle2 className="h-7 w-7" style={{ color: "#fbbf24" }} />
              </div>
              <div>
                <p className="font-sans font-[700] text-[18px]" style={{ color: "#f0f2f8" }}>
                  {alreadyReported ? "Déjà signalée" : "Signalement envoyé"}
                </p>
                <p className="text-[14px] mt-1 leading-[1.65]" style={{ color: "#8b91a8" }}>
                  {alreadyReported
                    ? "Vous avez déjà signalé cette annonce. Notre équipe l'examine."
                    : "Merci pour votre vigilance. Notre équipe va examiner cette annonce dans les plus brefs délais."}
                </p>
              </div>
              <button onClick={onClose}
                className="mt-2 w-full h-10 rounded-lg text-[13px] font-[500] transition-all"
                style={{ border: "1px solid rgba(255,255,255,0.08)", color: "#b8bdd0", background: "transparent" }}>
                Fermer
              </button>
            </div>
          ) : (
            /* ── Form ────────────────────────────────────────────────── */
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* Info note */}
              <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-lg"
                style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.16)" }}>
                <Shield className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#fbbf24" }} />
                <p className="text-[12px] leading-[1.55]" style={{ color: "#b8a050" }}>
                  Les signalements sont anonymes et examinés par notre équipe de modération.
                  Les abus répétés peuvent entraîner la suspension de votre compte.
                </p>
              </div>

              {/* Reason selection */}
              <div className="space-y-1.5">
                <p className="text-[12px] font-[600]" style={{ color: "#b8bdd0" }}>
                  Raison du signalement <span style={{ color: "#f87171" }}>*</span>
                </p>
                <div className="space-y-1.5">
                  {REPORT_REASONS.map(({ value, label, description }) => (
                    <label key={value}
                      className="flex items-start gap-3 px-3.5 py-3 rounded-lg cursor-pointer transition-all"
                      style={{
                        background: reason === value ? "rgba(251,191,36,0.08)" : "rgba(255,255,255,0.02)",
                        border:     reason === value ? "1px solid rgba(251,191,36,0.30)" : "1px solid rgba(255,255,255,0.06)",
                      }}>
                      <input type="radio" name="reason" value={value}
                        checked={reason === value}
                        onChange={() => setReason(value)}
                        className="mt-0.5 shrink-0 accent-yellow-400"
                      />
                      <div className="min-w-0">
                        <p className="text-[13px] font-[600]" style={{ color: reason === value ? "#fbbf24" : "#f0f2f8" }}>{label}</p>
                        <p className="text-[11px] mt-0.5" style={{ color: "#6b7494" }}>{description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Optional comment */}
              <div className="space-y-1.5">
                <label htmlFor="report-comment" className="text-[12px] font-[600]" style={{ color: "#b8bdd0" }}>
                  Précisions <span className="font-[400]" style={{ color: "#6b7494" }}>(optionnel)</span>
                </label>
                <textarea id="report-comment" rows={3} maxLength={500} value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Décrivez brièvement le problème…"
                  className="w-full rounded-lg px-3.5 py-2.5 text-[13px] resize-none focus:outline-none transition-all"
                  style={{ background: "#161921", border: "1px solid rgba(255,255,255,0.08)", color: "#f0f2f8" }}
                  onFocus={(e) => { e.target.style.borderColor = "rgba(251,191,36,0.40)"; e.target.style.boxShadow = "0 0 0 3px rgba(251,191,36,0.08)"; }}
                  onBlur={(e)  => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; e.target.style.boxShadow = "none"; }}
                />
                <p className="text-right text-[11px]" style={{ color: "#6b7494" }}>{comment.length}/500</p>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={onClose} disabled={loading}
                  className="flex-1 h-10 rounded-lg text-[13px] font-[500] transition-all disabled:opacity-40"
                  style={{ border: "1px solid rgba(255,255,255,0.08)", color: "#b8bdd0", background: "transparent" }}>
                  Annuler
                </button>
                <button type="submit" disabled={loading || !reason}
                  className="flex-1 h-10 rounded-lg text-[13px] font-[700] transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                  style={{ background: reason ? "rgba(251,191,36,0.18)" : "rgba(255,255,255,0.05)", color: reason ? "#fbbf24" : "#6b7494", border: reason ? "1px solid rgba(251,191,36,0.30)" : "1px solid rgba(255,255,255,0.06)" }}>
                  {loading
                    ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Envoi…</>
                    : <><Flag className="h-3.5 w-3.5" /> Envoyer le signalement</>}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Mark status modal (matched OR resolved) ──────────────────────────────── */
function MarkStatusModal({ post, onClose, onUpdated }) {
  const dispatch = useAppDispatch();
  const { accessToken } = useAppSelector((s) => s.auth);

  // "choose" → "matched" → "resolved"
  const [flow,           setFlow]       = useState("choose");
  const [loading,        setLoading]    = useState(false);
  const [matchedWithId,  setMatchedWithId] = useState("");
  const backdropRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const getToken = async () => {
    if (accessToken) return accessToken;
    const { refreshAccessToken } = await import("@/lib/api-client");
    const token = await refreshAccessToken();
    dispatch(setAccessToken(token));
    return token;
  };

  const handleMatch = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const data  = await postsApi.matchPost(post._id, token, matchedWithId.trim() || null);
      toast.success("Annonce marquée comme mise en correspondance !");
      onUpdated(data.data.post);
    } catch (err) {
      toast.error(err.response?.message || err.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const data  = await postsApi.resolvePost(post._id, token);
      toast.success("Annonce clôturée avec succès !");
      onUpdated(data.data.post);
    } catch (err) {
      toast.error(err.response?.message || err.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      ref={backdropRef}
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: "rgba(0,0,0,0.70)", backdropFilter: "blur(8px)" }}
      role="dialog" aria-modal="true"
    >
      <div
        className="w-full max-w-[460px] rounded-2xl overflow-hidden animate-scale-in"
        style={{ background: "#13161e", border: "1px solid rgba(255,255,255,0.10)", boxShadow: "0 24px 56px rgba(0,0,0,0.60)" }}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div>
            <h2 className="font-sans font-[700] text-[17px] tracking-[-0.01em]" style={{ color: "#f0f2f8" }}>
              {flow === "choose"   && "Mettre à jour le statut"}
              {flow === "matched"  && "Mise en correspondance"}
              {flow === "resolved" && "Clôturer l'annonce"}
            </h2>
            <p className="text-[12px] mt-0.5 truncate max-w-[300px]" style={{ color: "#6b7494" }}>
              {post.title}
            </p>
          </div>
          <button onClick={onClose} aria-label="Fermer"
            className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
            style={{ color: "#6b7494" }}>
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Body ───────────────────────────────────────────────────────── */}
        <div className="px-6 py-5 space-y-4">

          {/* ── CHOOSE FLOW ──────────────────────────────────────────────── */}
          {flow === "choose" && (
            <>
              <p className="text-[13px] leading-[1.65]" style={{ color: "#8b91a8" }}>
                Comment souhaitez-vous clore cette annonce ?
              </p>

              {/* Option 1 — Matched */}
              <button
                type="button"
                onClick={() => setFlow("matched")}
                className="w-full flex items-start gap-4 p-4 rounded-xl text-left transition-all group"
                style={{
                  background: "rgba(79,142,247,0.06)",
                  border: "1px solid rgba(79,142,247,0.20)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(79,142,247,0.12)";
                  e.currentTarget.style.borderColor = "rgba(79,142,247,0.40)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(79,142,247,0.06)";
                  e.currentTarget.style.borderColor = "rgba(79,142,247,0.20)";
                }}
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0 mt-0.5"
                  style={{ background: "rgba(79,142,247,0.15)", border: "1px solid rgba(79,142,247,0.25)" }}>
                  <Link2 className="h-5 w-5" style={{ color: "#4f8ef7" }} />
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] font-[700]" style={{ color: "#f0f2f8" }}>
                    Mis en correspondance
                  </p>
                  <p className="text-[12px] mt-1 leading-[1.55]" style={{ color: "#6b7494" }}>
                    L&apos;objet a été retrouvé grâce à une autre annonce de la plateforme.
                    Vous pouvez lier les deux annonces.
                  </p>
                </div>
              </button>

              {/* Option 2 — Resolved */}
              <button
                type="button"
                onClick={() => setFlow("resolved")}
                className="w-full flex items-start gap-4 p-4 rounded-xl text-left transition-all"
                style={{
                  background: "rgba(52,211,153,0.06)",
                  border: "1px solid rgba(52,211,153,0.20)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(52,211,153,0.12)";
                  e.currentTarget.style.borderColor = "rgba(52,211,153,0.40)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(52,211,153,0.06)";
                  e.currentTarget.style.borderColor = "rgba(52,211,153,0.20)";
                }}
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0 mt-0.5"
                  style={{ background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.25)" }}>
                  <CheckCheck className="h-5 w-5" style={{ color: "#34d399" }} />
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] font-[700]" style={{ color: "#f0f2f8" }}>
                    Résolu — situation gérée
                  </p>
                  <p className="text-[12px] mt-1 leading-[1.55]" style={{ color: "#6b7494" }}>
                    L&apos;objet a été retrouvé ou la situation est résolue
                    autrement qu&apos;via la plateforme.
                  </p>
                </div>
              </button>
            </>
          )}

          {/* ── MATCHED FLOW ─────────────────────────────────────────────── */}
          {flow === "matched" && (
            <>
              <div className="flex items-start gap-3 p-3.5 rounded-xl"
                style={{ background: "rgba(79,142,247,0.07)", border: "1px solid rgba(79,142,247,0.18)" }}>
                <Link2 className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#4f8ef7" }} />
                <p className="text-[13px] leading-[1.55]" style={{ color: "#7aabfa" }}>
                  Indiquez l&apos;ID de l&apos;annonce qui a permis la correspondance
                  pour lier les deux — ou laissez vide pour marquer sans lien.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[12px] font-[500]" style={{ color: "#b8bdd0" }}>
                  ID de l&apos;annonce correspondante
                  <span className="ml-1.5 text-[11px] font-[400]" style={{ color: "#6b7494" }}>(optionnel)</span>
                </label>
                <input
                  type="text"
                  placeholder="ex : 6a58b4372d2240164f50fb8a"
                  value={matchedWithId}
                  onChange={(e) => setMatchedWithId(e.target.value)}
                  style={{
                    width: "100%", height: "40px", borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "#161921", padding: "0 12px",
                    color: "#f0f2f8", fontSize: "13px",
                    fontFamily: "monospace", outline: "none",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => { e.target.style.borderColor = "#4f8ef7"; e.target.style.boxShadow = "0 0 0 3px rgba(79,142,247,0.18)"; }}
                  onBlur={(e)  => { e.target.style.borderColor = "rgba(255,255,255,0.10)"; e.target.style.boxShadow = "none"; }}
                />
                <p className="text-[11px]" style={{ color: "#6b7494" }}>
                  Copiez l&apos;ID depuis l&apos;URL de l&apos;annonce : /posts/<strong style={{ color: "#4f8ef7" }}>[ID]</strong>
                </p>
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={() => setFlow("choose")} disabled={loading}
                  className="flex-1 h-10 rounded-lg text-[13px] font-[500] transition-all disabled:opacity-40"
                  style={{ border: "1px solid rgba(255,255,255,0.08)", color: "#b8bdd0", background: "transparent" }}>
                  Retour
                </button>
                <button onClick={handleMatch} disabled={loading}
                  className="flex-1 h-10 rounded-lg text-[13px] font-[700] transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                  style={{ background: "#4f8ef7", color: "#fff" }}>
                  {loading
                    ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> En cours…</>
                    : <><Link2 className="h-3.5 w-3.5" /> Confirmer la correspondance</>}
                </button>
              </div>
            </>
          )}

          {/* ── RESOLVED FLOW ────────────────────────────────────────────── */}
          {flow === "resolved" && (
            <>
              <div className="flex items-start gap-3 p-3.5 rounded-xl"
                style={{ background: "rgba(52,211,153,0.07)", border: "1px solid rgba(52,211,153,0.18)" }}>
                <CheckCheck className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#34d399" }} />
                <div>
                  <p className="text-[13px] font-[600]" style={{ color: "#34d399" }}>
                    Clôturer l&apos;annonce &ldquo;{post.title}&rdquo;
                  </p>
                  <p className="text-[12px] mt-1 leading-[1.55]" style={{ color: "#8b91a8" }}>
                    L&apos;annonce disparaîtra de la liste active mais restera accessible via son lien direct.
                    Cette action peut être annulée en vous contactant.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={() => setFlow("choose")} disabled={loading}
                  className="flex-1 h-10 rounded-lg text-[13px] font-[500] transition-all disabled:opacity-40"
                  style={{ border: "1px solid rgba(255,255,255,0.08)", color: "#b8bdd0", background: "transparent" }}>
                  Retour
                </button>
                <button onClick={handleResolve} disabled={loading}
                  className="flex-1 h-10 rounded-lg text-[13px] font-[700] transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                  style={{ background: "#34d399", color: "#052e16" }}>
                  {loading
                    ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Clôture…</>
                    : <><CheckCheck className="h-3.5 w-3.5" /> Confirmer la clôture</>}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Main page ────────────────────────────────────────────────────────────── */
export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isHydrating } = useAppSelector((s) => s.auth);

  const [post,              setPost]              = useState(null);
  const [loading,           setLoading]           = useState(true);
  const [error,             setError]             = useState(null);
  const [showContact,       setShowContact]       = useState(false);
  const [showDeleteModal,   setShowDeleteModal]   = useState(false);
  const [showMarkStatusModal, setShowMarkStatusModal] = useState(false);
  const [showArchiveModal,  setShowArchiveModal]  = useState(false);
  const [showReportModal,   setShowReportModal]   = useState(false);
  const [alreadyReported,   setAlreadyReported]   = useState(false);

  useEffect(() => {
    if (!params?.id) return;
    (async () => {
      setLoading(true); setError(null);
      try {
        const data = await postsApi.getPostById(params.id);
        setPost(data.data.post);
      } catch (err) {
        setError(err.status === 404 ? "Cette annonce n'existe pas." : "Impossible de charger l'annonce.");
      } finally {
        setLoading(false);
      }
    })();
  }, [params?.id]);

  // Check if the current user has already reported this post (silent — no toast on failure)
  useEffect(() => {
    if (!params?.id || !user) return;
    (async () => {
      try {
        let token = accessToken;
        if (!token) {
          const { refreshAccessToken } = await import("@/lib/api-client");
          token = await refreshAccessToken();
          dispatch(setAccessToken(token));
        }
        const data = await reportsApi.getReportForPost(params.id, token);
        if (data?.data?.reported) setAlreadyReported(true);
      } catch {
        // silencieux — ne pas bloquer la page
      }
    })();
  }, [params?.id, user, accessToken, dispatch]);

  if (loading || isHydrating) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0d0f14" }}>
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#4f8ef7" }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0d0f14" }}>
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <AlertCircle className="h-12 w-12" style={{ color: "rgba(255,255,255,0.12)" }} />
          <h2 className="font-sans font-[700] text-[20px]" style={{ color: "#f0f2f8" }}>{error}</h2>
          <Button onClick={() => router.push("/posts")} variant="secondary" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Retour aux annonces
          </Button>
        </div>
      </div>
    );
  }

  if (!post) return null;

  const isOwner    = user && (post.author?._id?.toString() === user._id?.toString() || post.author?._id?.toString() === user.id?.toString());
  const isAdmin    = user?.role === "admin";
  const canManage  = isOwner || isAdmin;
  const canContact = user && !isOwner;
  const isClosed   = post.status === "resolved" || post.status === "matched";
  const isArchived = post.status === "archived";

  const formattedDate = post.date
    ? new Date(post.date).toLocaleDateString("fr-TN", { day: "numeric", month: "long", year: "numeric" })
    : "—";
  const createdAt = post.createdAt
    ? new Date(post.createdAt).toLocaleDateString("fr-TN", { day: "numeric", month: "short", year: "numeric" })
    : "—";

  return (
    <>
      {showContact          && <ContactModal    post={post} onClose={() => setShowContact(false)} />}
      {showDeleteModal      && <DeleteModal     post={post} onClose={() => setShowDeleteModal(false)} onDeleted={() => router.push("/posts")} />}
      {showMarkStatusModal  && <MarkStatusModal post={post} onClose={() => setShowMarkStatusModal(false)} onUpdated={(updated) => setPost(updated)} />}
      {showArchiveModal     && <ArchiveModal    post={post} onClose={() => setShowArchiveModal(false)}  onArchived={(updated) => setPost(updated)} />}
      {showReportModal      && <ReportModal     post={post} onClose={() => setShowReportModal(false)}   alreadyReported={alreadyReported} />}

      <div className="min-h-screen py-8" style={{ background: "#0d0f14" }}>
        <PageContainer maxWidth="4xl">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-[13px] mb-6" style={{ color: "#6b7494" }}>
            <Link href="/" className="transition-colors hover:text-[#f0f2f8]">Accueil</Link>
            <span>/</span>
            <Link href="/posts" className="transition-colors hover:text-[#f0f2f8]">Annonces</Link>
            <span>/</span>
            <span className="truncate" style={{ color: "#b8bdd0" }}>{post.title}</span>
          </nav>

          {/* Status banner (matched or resolved) */}
          <StatusBanner post={post} />

          {/* ── Matching suggestions (only for active posts) ─────────── */}
          {!isClosed && !isArchived && (
            <RelatedMatchesPanel postId={post._id} postType={post.type} />
          )}

          {/* Card */}
          <div className="rounded-xl overflow-hidden" style={{ background: "#13161e", border: "1px solid rgba(255,255,255,0.08)" }}>
            {/* Image */}
            {post.photo ? (
              <div className="w-full max-h-96 overflow-hidden" style={{ background: "#1a1e28" }}>
                <img src={post.photo} alt={post.title} className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className="w-full h-56 flex items-center justify-center" style={{ background: "#1a1e28" }}>
                <Package className="h-14 w-14" style={{ color: "rgba(255,255,255,0.07)" }} />
              </div>
            )}

            <div className="p-6 sm:p-8 space-y-6">
              {/* Header */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <TypeBadge type={post.type} />
                  {post.status === "matched" && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-[600]"
                      style={{ color: "#4f8ef7", background: "rgba(79,142,247,0.10)", border: "1px solid rgba(79,142,247,0.22)" }}>
                      <Link2 className="h-3 w-3" /> Mise en correspondance
                    </span>
                  )}
                  {post.status === "resolved" && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-[600]"
                      style={{ color: "#34d399", background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.18)" }}>
                      <CheckCheck className="h-3 w-3" /> Clôturée
                    </span>
                  )}
                  {post.status === "archived" && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-[600]"
                      style={{ color: "#8b91a8", background: "rgba(107,116,148,0.10)", border: "1px solid rgba(107,116,148,0.22)" }}>
                      <Archive className="h-3 w-3" /> Archivée
                    </span>
                  )}
                </div>
                <h1 className="font-sans font-[700] text-[28px] tracking-[-0.025em] leading-tight" style={{ color: "#f0f2f8" }}>
                  {post.title}
                </h1>
                <p className="text-[15px] leading-[1.7] whitespace-pre-wrap" style={{ color: "#8b91a8" }}>
                  {post.description}
                </p>
              </div>

              {/* Details grid */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="rounded-xl p-4" style={{ background: "#1a1e28", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <InfoRow icon={Tag}      label="Type d'objet" value={OBJECT_TYPE_LABELS[post.objectType] ?? post.objectType} />
                  <InfoRow icon={MapPin}   label="Ville"        value={`${post.city}${post.delegation ? `, ${post.delegation}` : ""}`} />
                  <InfoRow icon={Calendar} label="Date"         value={formattedDate} />
                  {post.maskedDocNumber && <InfoRow icon={Shield} label="Numéro masqué" value={post.maskedDocNumber} />}
                  {post.reward > 0 && post.type === "lost" && <InfoRow icon={Tag} label="Récompense" value={`${post.reward} TND`} />}
                </div>
                <div className="rounded-xl p-4" style={{ background: "#1a1e28", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <InfoRow icon={User}  label="Auteur"     value={post.author?.name ?? "Anonyme"} />
                  <InfoRow icon={Clock} label="Publié le"  value={createdAt} />

                  {/* ── Coordonnées de contact ──────────────────────────── */}
                  <div className="pt-3 mt-1" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                    <p className="text-[11px] font-[600] uppercase tracking-[0.07em] mb-3" style={{ color: "#6b7494" }}>
                      Contact
                    </p>

                    {/* Modes de contact actifs */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {post.contactPreferences?.platform && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-[600]"
                          style={{ color: "#4f8ef7", background: "rgba(79,142,247,0.10)", border: "1px solid rgba(79,142,247,0.20)" }}>
                          <MessageSquare className="h-3 w-3" /> Plateforme
                        </span>
                      )}
                      {post.contactPreferences?.email && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-[600]"
                          style={{ color: "#4f8ef7", background: "rgba(79,142,247,0.10)", border: "1px solid rgba(79,142,247,0.20)" }}>
                          <Mail className="h-3 w-3" /> Email
                        </span>
                      )}
                      {post.contactPreferences?.phone && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-[600]"
                          style={{ color: "#4f8ef7", background: "rgba(79,142,247,0.10)", border: "1px solid rgba(79,142,247,0.20)" }}>
                          <Phone className="h-3 w-3" /> Téléphone
                        </span>
                      )}
                    </div>

                    {/* Coordonnées réelles — visibles uniquement si connecté */}
                    {user ? (
                      <div className="space-y-2">
                        {post.contactEmail && (
                          <a
                            href={`mailto:${post.contactEmail}`}
                            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all group"
                            style={{ background: "rgba(79,142,247,0.06)", border: "1px solid rgba(79,142,247,0.16)" }}
                          >
                            <Mail className="h-4 w-4 shrink-0" style={{ color: "#4f8ef7" }} />
                            <div className="min-w-0">
                              <p className="text-[11px] font-[600] uppercase tracking-[0.06em] mb-0.5" style={{ color: "#6b7494" }}>Email</p>
                              <p className="text-[13px] font-[500] truncate group-hover:underline" style={{ color: "#7aabfa" }}>
                                {post.contactEmail}
                              </p>
                            </div>
                          </a>
                        )}
                        {post.contactPhone && (
                          <a
                            href={`tel:${post.contactPhone}`}
                            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all group"
                            style={{ background: "rgba(79,142,247,0.06)", border: "1px solid rgba(79,142,247,0.16)" }}
                          >
                            <Phone className="h-4 w-4 shrink-0" style={{ color: "#4f8ef7" }} />
                            <div className="min-w-0">
                              <p className="text-[11px] font-[600] uppercase tracking-[0.06em] mb-0.5" style={{ color: "#6b7494" }}>Téléphone</p>
                              <p className="text-[13px] font-[500] truncate group-hover:underline" style={{ color: "#7aabfa" }}>
                                {post.contactPhone}
                              </p>
                            </div>
                          </a>
                        )}
                        {!post.contactEmail && !post.contactPhone && !post.contactPreferences?.platform && (
                          <p className="text-[12px]" style={{ color: "#6b7494" }}>
                            Aucune coordonnée renseignée.
                          </p>
                        )}
                      </div>
                    ) : (
                      /* Non connecté — invite à se connecter */
                      <Link
                        href={`/auth/login?redirect=/posts/${post._id}`}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-[13px] font-[500] transition-all"
                        style={{ background: "rgba(79,142,247,0.06)", border: "1px solid rgba(79,142,247,0.16)", color: "#7aabfa" }}
                      >
                        <Shield className="h-3.5 w-3.5 shrink-0" />
                        Connectez-vous pour voir les coordonnées
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {/* Action bar */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                {/* Contact button */}
                {canContact && !isClosed && (
                  <button onClick={() => setShowContact(true)}
                    className="flex-1 inline-flex items-center justify-center gap-2 h-[42px] rounded-lg text-[14px] font-[600] transition-all"
                    style={{ background: "#4f8ef7", color: "#fff" }}>
                    <MessageSquare className="h-4 w-4" /> Contacter l&apos;auteur
                  </button>
                )}
                {canContact && isClosed && (
                  <div className="flex-1 inline-flex items-center justify-center gap-2 h-[42px] rounded-lg text-[14px] font-[500] cursor-not-allowed"
                    style={{ background: "#1a1e28", color: "#6b7494", border: "1px solid rgba(255,255,255,0.06)" }}>
                    {post.status === "matched"
                      ? <><Link2 className="h-4 w-4" /> Annonce mise en correspondance</>
                      : <><CheckCheck className="h-4 w-4" /> Annonce clôturée</>}
                  </div>
                )}
                {!user && (
                  <Link href={`/auth/login?redirect=/posts/${post._id}`}
                    className="flex-1 inline-flex items-center justify-center gap-2 h-[42px] rounded-lg text-[14px] font-[600] transition-all"
                    style={{ background: "#4f8ef7", color: "#fff" }}>
                    <MessageSquare className="h-4 w-4" /> Connexion pour contacter
                  </Link>
                )}
                {canManage && isOwner && !canContact && !isClosed && (
                  <div className="inline-flex items-center justify-center gap-2 h-[42px] px-4 rounded-lg text-[13px] font-[500] cursor-not-allowed"
                    style={{ background: "#1a1e28", color: "#6b7494", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <MessageSquare className="h-4 w-4" /> C&apos;est votre annonce
                  </div>
                )}

                {/* Mark as matched/resolved button — single entry point */}
                {canManage && !isClosed && (
                  <button onClick={() => setShowMarkStatusModal(true)}
                    className="inline-flex items-center justify-center gap-2 h-[42px] px-4 rounded-lg text-[13px] font-[600] transition-all"
                    style={{ background: "rgba(79,142,247,0.08)", color: "#4f8ef7", border: "1px solid rgba(79,142,247,0.22)" }}>
                    <CheckCheck className="h-4 w-4" /> Marquer comme résolu
                  </button>
                )}

                {/* Edit button — only owner on active posts */}
                {canManage && !isClosed && (
                  <Link
                    href={`/posts/${post._id}/edit`}
                    className="inline-flex items-center justify-center gap-2 h-[42px] px-4 rounded-lg text-[13px] font-[600] transition-all"
                    style={{ background: "rgba(255,255,255,0.05)", color: "#b8bdd0", border: "1px solid rgba(255,255,255,0.10)" }}
                  >
                    <Pencil className="h-4 w-4" /> Modifier
                  </Link>
                )}

                {/* Archive button — owner/admin on any non-archived post */}
                {canManage && !isArchived && (
                  <button onClick={() => setShowArchiveModal(true)}
                    className="inline-flex items-center justify-center gap-2 h-[42px] px-4 rounded-lg text-[13px] font-[600] transition-all"
                    style={{ background: "rgba(107,116,148,0.08)", color: "#8b91a8", border: "1px solid rgba(107,116,148,0.22)" }}>
                    <Archive className="h-4 w-4" /> Archiver
                  </button>
                )}

                {/* Delete button */}
                {canManage && (
                  <button onClick={() => setShowDeleteModal(true)}
                    className="inline-flex items-center justify-center gap-2 h-[42px] px-4 rounded-lg text-[13px] font-[600] transition-all"
                    style={{ background: "rgba(248,113,113,0.08)", color: "#f87171", border: "1px solid rgba(248,113,113,0.20)" }}>
                    <Trash2 className="h-4 w-4" /> Supprimer
                  </button>
                )}

                {/* Report button — available to any logged-in non-owner user */}
                {user && !isOwner && (
                  <button onClick={() => setShowReportModal(true)}
                    title={alreadyReported ? "Vous avez déjà signalé cette annonce" : "Signaler cette annonce"}
                    className="inline-flex items-center justify-center gap-2 h-[42px] px-4 rounded-lg text-[13px] font-[600] transition-all"
                    style={{
                      background: alreadyReported ? "rgba(251,191,36,0.10)" : "rgba(255,255,255,0.03)",
                      color:      alreadyReported ? "#fbbf24"               : "#6b7494",
                      border:     alreadyReported ? "1px solid rgba(251,191,36,0.25)" : "1px solid rgba(255,255,255,0.08)",
                    }}>
                    <Flag className="h-4 w-4" />
                    {alreadyReported ? "Signalée" : "Signaler"}
                  </button>
                )}

                <Button variant="secondary" asChild>
                  <Link href="/posts" className="gap-2">
                    <ArrowLeft className="h-4 w-4" /> Retour
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </PageContainer>
      </div>
    </>
  );
}
