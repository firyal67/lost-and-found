"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Loader2, MessageSquare, Mail, Phone, Check, X,
  ChevronRight, Package, MapPin, Clock, AlertCircle,
  Inbox, Send as SendIcon, CheckCircle2, XCircle, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { contactsApi } from "@/lib/api/contacts.api";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { setAccessToken } from "@/store/slices/authSlice";
import PageContainer from "@/components/layout/PageContainer";

/* ── Tokens ──────────────────────────────────────────────────────────────── */
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

/* ── Status config ───────────────────────────────────────────────────────── */
const STATUS = {
  pending:  { label: "En attente",  color: C.warning, bg: "rgba(251,191,36,0.10)", border: "rgba(251,191,36,0.25)", icon: <Clock className="h-3 w-3" /> },
  approved: { label: "Approuvée",   color: C.success, bg: "rgba(52,211,153,0.10)", border: "rgba(52,211,153,0.25)", icon: <CheckCircle2 className="h-3 w-3" /> },
  rejected: { label: "Refusée",     color: C.danger,  bg: "rgba(248,113,113,0.10)",border: "rgba(248,113,113,0.25)",icon: <XCircle className="h-3 w-3" /> },
};

const OBJECT_TYPE_LABELS = {
  cin:            "Carte d'identité",
  passport:       "Passeport",
  permis:         "Permis de conduire",
  carte_bancaire: "Carte bancaire",
  telephone:      "Téléphone",
  cles:           "Clés",
  autre:          "Autre",
};

/* ── ContactCard ─────────────────────────────────────────────────────────── */
function ContactCard({ contact, userId, token, onUpdated }) {
  const [actioning, setActioning] = useState(null); // "approve" | "reject"
  const cfg   = STATUS[contact.status] ?? STATUS.pending;
  const isOwner = contact.owner?._id?.toString() === userId || contact.owner?._id === userId;

  const postTitle     = contact.post?.title     ?? "Annonce supprimée";
  const postCity      = contact.post?.city      ?? "";
  const postObjType   = OBJECT_TYPE_LABELS[contact.post?.objectType] ?? contact.post?.objectType ?? "";
  const postType      = contact.post?.type;
  const postId        = contact.post?._id;
  const requesterName = contact.requester?.name  ?? "Utilisateur inconnu";
  const ownerName     = contact.owner?.name      ?? "Auteur inconnu";
  const createdAt     = new Date(contact.createdAt).toLocaleDateString("fr-TN", {
    day: "numeric", month: "short", year: "numeric",
  });

  const handleApprove = async () => {
    setActioning("approve");
    try {
      const data = await contactsApi.approveContact(contact._id, token);
      toast.success("Demande approuvée !");
      onUpdated(data.data.contact);
    } catch (err) {
      toast.error(err.response?.message || "Erreur lors de l'approbation.");
    } finally {
      setActioning(null);
    }
  };

  const handleReject = async () => {
    setActioning("reject");
    try {
      const data = await contactsApi.rejectContact(contact._id, token);
      toast.success("Demande refusée.");
      onUpdated(data.data.contact);
    } catch (err) {
      toast.error(err.response?.message || "Erreur lors du refus.");
    } finally {
      setActioning(null);
    }
  };

  return (
    <div
      className="rounded-xl overflow-hidden transition-all"
      style={{ background: C.surface, border: `1px solid ${C.border}` }}
    >
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ background: cfg.bg, borderBottom: `1px solid ${cfg.border}` }}
      >
        <span className="inline-flex items-center gap-1.5 text-[11px] font-[700]" style={{ color: cfg.color }}>
          {cfg.icon} {cfg.label}
        </span>
        <span className="text-[11px]" style={{ color: C.inkMut }}>{createdAt}</span>
      </div>

      <div className="p-4 space-y-3">
        {/* Post info */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {postType && (
                <span
                  className="text-[10px] font-[700] px-2 py-0.5 rounded-full"
                  style={{
                    color:      postType === "lost" ? C.accent  : C.success,
                    background: postType === "lost" ? "rgba(79,142,247,0.12)" : "rgba(52,211,153,0.10)",
                    border:     postType === "lost" ? "1px solid rgba(79,142,247,0.22)" : "1px solid rgba(52,211,153,0.20)",
                  }}
                >
                  {postType === "lost" ? "Perdu" : "Trouvé"}
                </span>
              )}
              {postObjType && (
                <span className="text-[11px]" style={{ color: C.inkMut }}>{postObjType}</span>
              )}
            </div>
            <p className="text-[14px] font-[600] leading-snug" style={{ color: C.ink }}>
              {postTitle}
            </p>
            {postCity && (
              <p className="text-[12px] flex items-center gap-1 mt-0.5" style={{ color: C.inkMut }}>
                <MapPin className="h-3 w-3 shrink-0" /> {postCity}
              </p>
            )}
          </div>
          {postId && (
            <Link
              href={`/posts/${postId}`}
              className="flex items-center gap-1 shrink-0 text-[11px] font-[600] px-2.5 py-1.5 rounded-lg transition-colors"
              style={{ color: C.accent, background: "rgba(79,142,247,0.08)", border: "1px solid rgba(79,142,247,0.18)" }}
            >
              Voir <ChevronRight className="h-3 w-3" />
            </Link>
          )}
        </div>

        {/* Who */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px]"
          style={{ background: C.elevated, border: `1px solid ${C.borderS}` }}
        >
          {isOwner ? (
            <>
              <SendIcon className="h-3.5 w-3.5 shrink-0" style={{ color: C.inkMut }} />
              <span style={{ color: C.inkMut }}>Demande de</span>
              <span className="font-[600]" style={{ color: C.inkSec }}>{requesterName}</span>
            </>
          ) : (
            <>
              <MessageSquare className="h-3.5 w-3.5 shrink-0" style={{ color: C.inkMut }} />
              <span style={{ color: C.inkMut }}>Envoyée à</span>
              <span className="font-[600]" style={{ color: C.inkSec }}>{ownerName}</span>
            </>
          )}
        </div>

        {/* Message */}
        {contact.message && (
          <p
            className="text-[13px] leading-[1.6] px-3 py-2.5 rounded-lg italic"
            style={{ background: C.elevated, color: C.inkSec, border: `1px solid ${C.borderS}` }}
          >
            &ldquo;{contact.message}&rdquo;
          </p>
        )}

        {/* Revealed coordinates (approved) */}
        {contact.status === "approved" && (
          <div className="space-y-2 pt-1">
            <p className="text-[11px] font-[600] uppercase tracking-[0.06em]" style={{ color: C.inkMut }}>
              {isOwner ? "Coordonnées partagées avec le demandeur" : "Coordonnées révélées"}
            </p>
            {contact.revealedEmail && (
              <a
                href={`mailto:${contact.revealedEmail}`}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg group transition-all"
                style={{ background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.18)" }}
              >
                <Mail className="h-4 w-4 shrink-0" style={{ color: C.success }} />
                <div className="min-w-0">
                  <p className="text-[11px] font-[600] uppercase tracking-[0.05em]" style={{ color: C.inkMut }}>Email</p>
                  <p className="text-[13px] font-[500] truncate group-hover:underline" style={{ color: C.success }}>
                    {contact.revealedEmail}
                  </p>
                </div>
              </a>
            )}
            {contact.revealedPhone && (
              <a
                href={`tel:${contact.revealedPhone}`}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg group transition-all"
                style={{ background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.18)" }}
              >
                <Phone className="h-4 w-4 shrink-0" style={{ color: C.success }} />
                <div className="min-w-0">
                  <p className="text-[11px] font-[600] uppercase tracking-[0.05em]" style={{ color: C.inkMut }}>Téléphone</p>
                  <p className="text-[13px] font-[500] truncate group-hover:underline" style={{ color: C.success }}>
                    {contact.revealedPhone}
                  </p>
                </div>
              </a>
            )}
            {!contact.revealedEmail && !contact.revealedPhone && (
              <p className="text-[12px]" style={{ color: C.inkMut }}>
                Aucune coordonnée renseignée par l&apos;auteur.
              </p>
            )}
          </div>
        )}

        {/* Owner actions — only if pending */}
        {isOwner && contact.status === "pending" && (
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleApprove}
              disabled={!!actioning}
              className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg text-[12px] font-[700] transition-all disabled:opacity-50"
              style={{ background: "rgba(52,211,153,0.12)", color: C.success, border: "1px solid rgba(52,211,153,0.25)" }}
            >
              {actioning === "approve"
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <><Check className="h-3.5 w-3.5" /> Approuver</>}
            </button>
            <button
              onClick={handleReject}
              disabled={!!actioning}
              className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg text-[12px] font-[700] transition-all disabled:opacity-50"
              style={{ background: "rgba(248,113,113,0.08)", color: C.danger, border: "1px solid rgba(248,113,113,0.22)" }}
            >
              {actioning === "reject"
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <><X className="h-3.5 w-3.5" /> Refuser</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Empty state ─────────────────────────────────────────────────────────── */
function EmptyState({ tab }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div
        className="flex items-center justify-center w-16 h-16 rounded-2xl mb-5"
        style={{ background: C.elevated, border: `1px solid ${C.border}` }}
      >
        <Inbox className="h-7 w-7" style={{ color: C.inkMut }} />
      </div>
      <h3 className="font-sans font-[600] text-[18px] tracking-[-0.01em] mb-2" style={{ color: C.ink }}>
        {tab === "received" ? "Aucune demande reçue" : "Aucune demande envoyée"}
      </h3>
      <p className="text-[14px] max-w-xs leading-[1.6]" style={{ color: C.inkSec }}>
        {tab === "received"
          ? "Les demandes de contact pour vos annonces apparaîtront ici."
          : "Les demandes que vous avez envoyées apparaîtront ici."}
      </p>
      {tab !== "received" && (
        <Link href="/posts" className="mt-5 text-[13px] font-[500]" style={{ color: C.accent }}>
          Parcourir les annonces →
        </Link>
      )}
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────────────────── */
export default function ContactsDashboardPage() {
  const router   = useRouter();
  const dispatch = useAppDispatch();
  const { user, isHydrating, accessToken } = useAppSelector((s) => s.auth);

  const [tab,      setTab]      = useState("received"); // "received" | "sent"
  const [contacts, setContacts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [token,    setToken]    = useState(accessToken);

  // Redirect if not logged in
  useEffect(() => {
    if (!isHydrating && !user) router.push("/auth/login?redirect=/dashboard/contacts");
  }, [user, isHydrating, router]);

  const getToken = useCallback(async () => {
    if (accessToken) return accessToken;
    const { refreshAccessToken } = await import("@/lib/api-client");
    const t = await refreshAccessToken();
    dispatch(setAccessToken(t));
    setToken(t);
    return t;
  }, [accessToken, dispatch]);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const t    = await getToken();
      const role = tab === "received" ? "owner" : "requester";
      const data = await contactsApi.getMyContacts({ role }, t);
      setContacts(data?.data?.contacts ?? []);
    } catch (err) {
      setError("Impossible de charger les demandes.");
    } finally {
      setLoading(false);
    }
  }, [tab, getToken]);

  useEffect(() => {
    if (!isHydrating && user) fetchContacts();
  }, [tab, isHydrating, user, fetchContacts]);

  const handleUpdated = (updated) => {
    setContacts((prev) => prev.map((c) => (c._id === updated._id ? updated : c)));
  };

  const userId = user?._id ?? user?.id;

  // Pending count for badge
  const pendingCount = tab === "received"
    ? contacts.filter((c) => c.status === "pending").length
    : 0;

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
        <div className="py-8 max-w-3xl mx-auto">

          {/* Header */}
          <div className="mb-8">
            <nav className="flex items-center gap-1.5 text-[13px] mb-4" style={{ color: C.inkMut }}>
              <Link href="/" className="transition-colors hover:text-[#f0f2f8]">Accueil</Link>
              <span>/</span>
              <Link href="/dashboard" className="transition-colors hover:text-[#f0f2f8]">Dashboard</Link>
              <span>/</span>
              <span style={{ color: C.inkSec }}>Contacts</span>
            </nav>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="font-sans font-[700] text-[26px] tracking-[-0.025em]" style={{ color: C.ink }}>
                  Demandes de contact
                </h1>
                <p className="text-[14px] mt-0.5" style={{ color: C.inkMut }}>
                  Gérez les échanges liés à vos annonces
                </p>
              </div>
              <button
                onClick={fetchContacts}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-[500] transition-all disabled:opacity-40"
                style={{ border: `1px solid ${C.border}`, color: C.inkMut, background: "transparent" }}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                Actualiser
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div
            className="flex rounded-xl p-1 mb-6"
            style={{ background: C.surface, border: `1px solid ${C.border}` }}
          >
            {[
              { id: "received", label: "Reçues",  icon: <Inbox className="h-4 w-4" /> },
              { id: "sent",     label: "Envoyées", icon: <SendIcon className="h-4 w-4" /> },
            ].map(({ id, label, icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[13px] font-[600] transition-all"
                style={{
                  background: tab === id ? C.elevated : "transparent",
                  color:      tab === id ? C.ink      : C.inkMut,
                  border:     tab === id ? `1px solid ${C.border}` : "1px solid transparent",
                }}
              >
                {icon}
                {label}
                {id === "received" && pendingCount > 0 && !loading && (
                  <span
                    className="flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-[800]"
                    style={{ background: C.warning, color: "#1c1400" }}
                  >
                    {pendingCount}
                  </span>
                )}
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
              <Button variant="secondary" size="sm" onClick={fetchContacts}>Réessayer</Button>
            </div>
          ) : contacts.length === 0 ? (
            <EmptyState tab={tab} />
          ) : (
            <div className="space-y-3">
              {contacts.map((contact) => (
                <ContactCard
                  key={contact._id}
                  contact={contact}
                  userId={userId}
                  token={token || accessToken}
                  onUpdated={handleUpdated}
                />
              ))}
            </div>
          )}
        </div>
      </PageContainer>
    </div>
  );
}
