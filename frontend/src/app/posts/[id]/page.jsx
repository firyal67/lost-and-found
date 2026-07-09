"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  Loader2, MapPin, Calendar, Tag, User, Mail, Phone, MessageSquare,
  ArrowLeft, Package, Shield, Clock, AlertCircle, X, Send, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { postsApi } from "@/lib/api/posts.api";
import { useAppSelector } from "@/store/hooks";
import PageContainer from "@/components/layout/PageContainer";

// ─── Constants ───────────────────────────────────────────────────────────

const OBJECT_TYPE_LABELS = {
  cin:            "Carte d'identité (CIN)",
  passport:       "Passeport",
  permis:         "Permis de conduire",
  carte_bancaire: "Carte bancaire",
  telephone:      "Téléphone",
  cles:           "Clés",
  autre:          "Autre",
};

// ─── Sub-components ──────────────────────────────────────────────────────

function TypeBadge({ type }) {
  return type === "lost" ? (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 border border-orange-200">
      <Package className="h-3.5 w-3.5" /> Objet perdu
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
      <Package className="h-3.5 w-3.5" /> Objet trouvé
    </span>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 shrink-0 mt-0.5">
        <Icon className="h-4 w-4 text-slate-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-0.5">{label}</p>
        <p className="text-sm text-slate-800 font-medium break-words">{value}</p>
      </div>
    </div>
  );
}

// ─── Contact Modal ────────────────────────────────────────────────────────

function ContactModal({ post, onClose }) {
  const { accessToken } = useAppSelector((s) => s.auth);
  const [message,  setMessage]  = useState("");
  const [loading,  setLoading]  = useState(false);
  const [sent,     setSent]     = useState(false);
  const backdropRef = useRef(null);

  // Close on Escape
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
      const msg = err.response?.message || err.message || "Une erreur est survenue.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    /* Backdrop */
    <div
      ref={backdropRef}
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Contacter l'auteur"
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Contacter l'auteur</h2>
            <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[260px]">{post.title}</p>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {sent ? (
            /* ── Success state ── */
            <div className="flex flex-col items-center text-center gap-3 py-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50">
                <CheckCircle2 className="h-7 w-7 text-emerald-600" />
              </div>
              <div>
                <p className="text-base font-semibold text-slate-800">Demande envoyée !</p>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                  L'auteur de l'annonce a été notifié. Il pourra approuver ou rejeter votre demande.
                </p>
              </div>
              <Button onClick={onClose} className="mt-2 w-full">Fermer</Button>
            </div>
          ) : (
            /* ── Form ── */
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3">
                <p className="text-xs text-blue-800 leading-relaxed">
                  Votre demande sera envoyée à <strong>{post.author?.name ?? "l'auteur"}</strong>.
                  Vos coordonnées ne seront partagées qu'après approbation.
                </p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="contact-message" className="text-sm font-medium text-slate-700 flex items-center gap-1">
                  Message
                  <span className="text-slate-400 font-normal text-xs ml-1">(optionnel)</span>
                </label>
                <textarea
                  id="contact-message"
                  rows={4}
                  maxLength={500}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Bonjour, je pense avoir trouvé votre objet…"
                  className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 bg-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                />
                <p className="text-xs text-slate-400 text-right">{message.length}/500</p>
              </div>

              <div className="flex gap-3 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 border-slate-200 text-slate-600"
                  disabled={loading}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 gap-2"
                >
                  {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" />Envoi…</>
                  ) : (
                    <><Send className="h-4 w-4" />Envoyer</>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isHydrating } = useAppSelector((s) => s.auth);

  const [post,    setPost]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!params?.id) return;
    (async () => {
      setLoading(true);
      setError(null);
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-slate-300" />
          <div>
            <h2 className="text-lg font-semibold text-slate-800 mb-1">{error}</h2>
            <p className="text-sm text-slate-500">Retournez à la liste des annonces pour en consulter d'autres.</p>
          </div>
          <Button onClick={() => router.push("/posts")} variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Retour aux annonces
          </Button>
        </div>
      </div>
    );
  }

  if (!post) return null;

  const isOwnPost  = user && (post.author?._id?.toString() === user._id?.toString());
  const canContact = user && !isOwnPost;

  const formattedDate = post.date
    ? new Date(post.date).toLocaleDateString("fr-TN", { day: "numeric", month: "long", year: "numeric" })
    : "—";
  const createdAt = post.createdAt
    ? new Date(post.createdAt).toLocaleDateString("fr-TN", { day: "numeric", month: "short", year: "numeric" })
    : "—";

  return (
    <>
      {showModal && <ContactModal post={post} onClose={() => setShowModal(false)} />}

      <div className="min-h-screen bg-slate-50 py-8">
        <PageContainer maxWidth="4xl">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-sm text-slate-400 mb-6">
            <Link href="/" className="hover:text-slate-700 transition-colors">Accueil</Link>
            <span>/</span>
            <Link href="/posts" className="hover:text-slate-700 transition-colors">Annonces</Link>
            <span>/</span>
            <span className="text-slate-600 font-medium truncate">{post.title}</span>
          </nav>

          {/* Main card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

            {/* Photo */}
            {post.photo ? (
              <div className="w-full max-h-96 bg-slate-100">
                <img src={post.photo} alt={post.title} className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className="w-full h-64 bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center">
                <Package className="h-16 w-16 text-slate-300" />
              </div>
            )}

            <div className="p-6 sm:p-8 space-y-6">

              {/* Header */}
              <div className="space-y-3">
                <TypeBadge type={post.type} />
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">
                  {post.title}
                </h1>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {post.description}
                </p>
              </div>

              {/* Details grid */}
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                  <InfoRow icon={Tag}      label="Type d'objet" value={OBJECT_TYPE_LABELS[post.objectType] ?? post.objectType} />
                  <InfoRow icon={MapPin}   label="Ville"        value={`${post.city}${post.delegation ? `, ${post.delegation}` : ""}`} />
                  <InfoRow icon={Calendar} label="Date"         value={formattedDate} />
                  {post.maskedDocNumber && <InfoRow icon={Shield} label="Numéro masqué" value={post.maskedDocNumber} />}
                  {post.reward > 0 && post.type === "lost" && <InfoRow icon={Tag} label="Récompense" value={`${post.reward} TND`} />}
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                  <InfoRow icon={User}  label="Auteur"     value={post.author?.name ?? "Anonyme"} />
                  <InfoRow icon={Clock} label="Publié le"  value={createdAt} />
                  <div className="py-3">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Préférences de contact</p>
                    <div className="flex flex-wrap gap-2">
                      {post.contactPreferences?.platform && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 border border-blue-200 text-xs text-blue-700">
                          <MessageSquare className="h-3 w-3" /> Plateforme
                        </span>
                      )}
                      {post.contactPreferences?.email && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 border border-blue-200 text-xs text-blue-700">
                          <Mail className="h-3 w-3" /> Email
                        </span>
                      )}
                      {post.contactPreferences?.phone && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 border border-blue-200 text-xs text-blue-700">
                          <Phone className="h-3 w-3" /> Téléphone
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-200">
                {canContact ? (
                  <button
                    onClick={() => setShowModal(true)}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm active:scale-[.98] transition-all"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Contacter l'auteur
                  </button>
                ) : !user ? (
                  <Link
                    href={`/auth/login?redirect=/posts/${post._id}`}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition-all"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Connectez-vous pour contacter
                  </Link>
                ) : (
                  <div className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-slate-100 text-slate-500 text-sm font-medium cursor-not-allowed">
                    <MessageSquare className="h-4 w-4" />
                    C'est votre annonce
                  </div>
                )}

                <Button variant="outline" asChild>
                  <Link href="/posts">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour aux annonces
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-slate-400 mt-6 leading-relaxed">
            Si vous pensez avoir trouvé l'objet, contactez l'auteur via la plateforme.
          </p>
        </PageContainer>
      </div>
    </>
  );
}
