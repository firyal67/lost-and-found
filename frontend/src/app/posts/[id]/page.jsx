"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  Loader2, MapPin, Calendar, Tag, User, Mail, Phone, MessageSquare,
  ArrowLeft, Package, Shield, Clock, AlertCircle, X, Send, CheckCircle2,
  Trash2, CheckCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { postsApi } from "@/lib/api/posts.api";
import { useAppSelector } from "@/store/hooks";
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

/* ── Status banner ────────────────────────────────────────────────────────── */
function StatusBanner({ status, resolvedAt }) {
  if (status !== "resolved") return null;
  const date = resolvedAt
    ? new Date(resolvedAt).toLocaleDateString("fr-TN", { day: "numeric", month: "long", year: "numeric" })
    : null;
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl mb-6"
      style={{
        background: "rgba(52,211,153,0.08)",
        border: "1px solid rgba(52,211,153,0.22)",
      }}
    >
      <CheckCheck className="h-5 w-5 shrink-0" style={{ color: "#34d399" }} />
      <div>
        <p className="text-[14px] font-[600]" style={{ color: "#34d399" }}>
          Annonce clôturée — objet retrouvé
        </p>
        {date && (
          <p className="text-[12px] mt-0.5" style={{ color: "#6b7494" }}>
            Clôturée le {date}
          </p>
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
  const { accessToken } = useAppSelector((s) => s.auth);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const backdropRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await postsApi.createContactRequest({ postId: post._id, message }, accessToken);
      setSent(true);
      toast.success("Demande de contact envoyée !");
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
      role="dialog" aria-modal="true" aria-label="Contacter l'auteur"
    >
      <div className="w-full max-w-md rounded-xl overflow-hidden animate-scale-in"
        style={{ background: "#13161e", border: "1px solid rgba(255,255,255,0.10)", boxShadow: "0 20px 48px rgba(0,0,0,0.55)" }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div>
            <h2 className="font-sans font-[700] text-[18px] tracking-[-0.01em]" style={{ color: "#f0f2f8" }}>
              Contacter l&apos;auteur
            </h2>
            <p className="text-[13px] mt-0.5 truncate max-w-[260px]" style={{ color: "#6b7494" }}>{post.title}</p>
          </div>
          <button onClick={onClose} className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
            style={{ color: "#6b7494" }} aria-label="Fermer">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-6 py-5">
          {sent ? (
            <div className="flex flex-col items-center text-center gap-3 py-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl"
                style={{ background: "rgba(79,142,247,0.10)", border: "1px solid rgba(79,142,247,0.22)" }}>
                <CheckCircle2 className="h-7 w-7" style={{ color: "#4f8ef7" }} />
              </div>
              <div>
                <p className="font-sans font-[700] text-[18px]" style={{ color: "#f0f2f8" }}>Demande envoyée !</p>
                <p className="text-[14px] mt-1 leading-[1.65]" style={{ color: "#8b91a8" }}>L&apos;auteur a été notifié.</p>
              </div>
              <Button onClick={onClose} className="mt-2 w-full">Fermer</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div className="rounded-lg px-4 py-3" style={{ background: "rgba(79,142,247,0.07)", border: "1px solid rgba(79,142,247,0.18)" }}>
                <p className="text-[13px]" style={{ color: "#7aabfa" }}>
                  Votre demande sera envoyée à <strong>{post.author?.name ?? "l'auteur"}</strong>.
                </p>
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
                <Button type="button" variant="secondary" onClick={onClose} className="flex-1" disabled={loading}>Annuler</Button>
                <Button type="submit" disabled={loading} className="flex-1 gap-2">
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Envoi…</> : <><Send className="h-4 w-4" />Envoyer</>}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Delete modal ─────────────────────────────────────────────────────────── */
function DeleteModal({ post, onClose, onDeleted }) {
  const { accessToken } = useAppSelector((s) => s.auth);
  const [loading, setLoading] = useState(false);
  const backdropRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await postsApi.deletePost(post._id, accessToken);
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

/* ── Resolve modal ────────────────────────────────────────────────────────── */
function ResolveModal({ post, onClose, onResolved }) {
  const { accessToken } = useAppSelector((s) => s.auth);
  const [loading, setLoading] = useState(false);
  const backdropRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleResolve = async () => {
    setLoading(true);
    try {
      const data = await postsApi.resolvePost(post._id, accessToken);
      toast.success("Annonce clôturée avec succès !");
      onResolved(data.data.post);
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
      <div className="w-full max-w-[420px] rounded-xl p-6 animate-scale-in"
        style={{ background: "#13161e", border: "1px solid rgba(52,211,153,0.25)", boxShadow: "0 20px 48px rgba(0,0,0,0.55)" }}>
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl mb-5 mx-auto"
          style={{ background: "rgba(52,211,153,0.10)", border: "1px solid rgba(52,211,153,0.22)" }}>
          <CheckCheck className="h-6 w-6" style={{ color: "#34d399" }} />
        </div>
        <h3 className="font-sans font-[700] text-[20px] tracking-[-0.02em] text-center mb-2" style={{ color: "#f0f2f8" }}>
          Clôturer cette annonce ?
        </h3>
        <p className="text-[14px] leading-[1.65] text-center mb-2" style={{ color: "#8b91a8" }}>
          Vous confirmez que l&apos;objet a été retrouvé ou que l&apos;annonce n&apos;est plus d&apos;actualité.
        </p>
        <p className="text-[14px] font-[600] text-center truncate px-4 mb-2" style={{ color: "#f0f2f8" }}>
          &ldquo;{post.title}&rdquo;
        </p>
        <p className="text-[13px] text-center mb-6" style={{ color: "#6b7494" }}>
          L&apos;annonce disparaîtra de la liste active. Elle reste accessible via son lien direct.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} disabled={loading}
            className="flex-1 h-10 rounded-lg text-[13px] font-[500] transition-all disabled:opacity-40"
            style={{ border: "1px solid rgba(255,255,255,0.08)", color: "#b8bdd0", background: "transparent" }}>
            Annuler
          </button>
          <button onClick={handleResolve} disabled={loading}
            className="flex-1 h-10 rounded-lg text-[13px] font-[600] transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            style={{ background: "#34d399", color: "#052e16" }}>
            {loading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Clôture…</> : <><CheckCheck className="h-3.5 w-3.5" /> Clôturer</>}
          </button>
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

  const [post,             setPost]             = useState(null);
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState(null);
  const [showContact,      setShowContact]      = useState(false);
  const [showDeleteModal,  setShowDeleteModal]  = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);

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

  const isOwner  = user && (post.author?._id?.toString() === user._id?.toString() || post.author?._id?.toString() === user.id?.toString());
  const isAdmin  = user?.role === "admin";
  const canManage = isOwner || isAdmin;
  const canContact = user && !isOwner;
  const isResolved = post.status === "resolved";

  const formattedDate = post.date
    ? new Date(post.date).toLocaleDateString("fr-TN", { day: "numeric", month: "long", year: "numeric" })
    : "—";
  const createdAt = post.createdAt
    ? new Date(post.createdAt).toLocaleDateString("fr-TN", { day: "numeric", month: "short", year: "numeric" })
    : "—";

  return (
    <>
      {showContact      && <ContactModal  post={post} onClose={() => setShowContact(false)} />}
      {showDeleteModal  && <DeleteModal   post={post} onClose={() => setShowDeleteModal(false)}  onDeleted={() => router.push("/posts")} />}
      {showResolveModal && <ResolveModal  post={post} onClose={() => setShowResolveModal(false)} onResolved={(updated) => setPost(updated)} />}

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

          {/* Resolved banner */}
          <StatusBanner status={post.status} resolvedAt={post.resolvedAt} />

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
                  {isResolved && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-[600]"
                      style={{ color: "#34d399", background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.18)" }}>
                      <CheckCheck className="h-3 w-3" /> Clôturée
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
                  <div className="py-3">
                    <p className="text-[11px] font-[600] uppercase tracking-[0.07em] mb-2" style={{ color: "#6b7494" }}>Contact</p>
                    <div className="flex flex-wrap gap-2">
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
                  </div>
                </div>
              </div>

              {/* Action bar */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                {/* Contact button — only for other users on active posts */}
                {canContact && !isResolved && (
                  <button onClick={() => setShowContact(true)}
                    className="flex-1 inline-flex items-center justify-center gap-2 h-[42px] rounded-lg text-[14px] font-[600] transition-all"
                    style={{ background: "#4f8ef7", color: "#fff" }}>
                    <MessageSquare className="h-4 w-4" /> Contacter l&apos;auteur
                  </button>
                )}
                {canContact && isResolved && (
                  <div className="flex-1 inline-flex items-center justify-center gap-2 h-[42px] rounded-lg text-[14px] font-[500] cursor-not-allowed"
                    style={{ background: "#1a1e28", color: "#6b7494", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <CheckCheck className="h-4 w-4" /> Annonce clôturée
                  </div>
                )}
                {!user && (
                  <Link href={`/auth/login?redirect=/posts/${post._id}`}
                    className="flex-1 inline-flex items-center justify-center gap-2 h-[42px] rounded-lg text-[14px] font-[600] transition-all"
                    style={{ background: "#4f8ef7", color: "#fff" }}>
                    <MessageSquare className="h-4 w-4" /> Connexion pour contacter
                  </Link>
                )}
                {isOwner && !user && null /* already handled above */}
                {canManage && isOwner && !canContact && !isResolved && (
                  <div className="inline-flex items-center justify-center gap-2 h-[42px] px-4 rounded-lg text-[13px] font-[500] cursor-not-allowed"
                    style={{ background: "#1a1e28", color: "#6b7494", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <MessageSquare className="h-4 w-4" /> C&apos;est votre annonce
                  </div>
                )}

                {/* Resolve button — only if active */}
                {canManage && !isResolved && (
                  <button onClick={() => setShowResolveModal(true)}
                    className="inline-flex items-center justify-center gap-2 h-[42px] px-4 rounded-lg text-[13px] font-[600] transition-all"
                    style={{ background: "rgba(52,211,153,0.10)", color: "#34d399", border: "1px solid rgba(52,211,153,0.22)" }}>
                    <CheckCheck className="h-4 w-4" /> Marquer comme résolu
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
