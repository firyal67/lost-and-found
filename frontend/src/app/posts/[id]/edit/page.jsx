"use client";

import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  Loader2, Search, Package, CheckCircle2, AlertTriangle,
  MapPin, Phone, Mail, MessageSquare, Check, ImagePlus,
  X, ChevronLeft, Save, AlertCircle,
} from "lucide-react";
import { refreshAccessToken } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { postsApi } from "@/lib/api/posts.api";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { updatePost, clearUpdatedPost, clearPostErrors } from "@/store/slices/postsSlice";
import { setAccessToken } from "@/store/slices/authSlice";

const OBJECT_TYPES = [
  { value: "cin",            label: "Carte d'identité (CIN)" },
  { value: "passport",       label: "Passeport" },
  { value: "permis",         label: "Permis de conduire" },
  { value: "carte_bancaire", label: "Carte bancaire" },
  { value: "telephone",      label: "Téléphone" },
  { value: "cles",           label: "Clés" },
  { value: "autre",          label: "Autre" },
];

const TUNISIAN_CITIES = [
  "Tunis","Sfax","Sousse","Kairouan","Bizerte","Gabès","Ariana",
  "Gafsa","Monastir","Ben Arous","Kasserine","Médenine","Nabeul",
  "Tataouine","Béja","Jendouba","El Kef","Mahdia","Sidi Bouzid",
  "Tozeur","Siliana","Zaghouan","Kebili","Manouba",
];

const SENSITIVE_DOC_REGEX = /\b\d{8}\b|\b[A-Z]\d{7}\b/;

const schema = z.object({
  objectType: z.enum(["cin","passport","permis","carte_bancaire","telephone","cles","autre"],
    { required_error: "Sélectionnez un type d'objet" }),
  title: z.string().min(5,"Minimum 5 caractères").max(100,"Maximum 100 caractères").trim(),
  description: z.string().min(10,"Minimum 10 caractères").max(1000,"Maximum 1000 caractères").trim()
    .refine((v) => !SENSITIVE_DOC_REGEX.test(v), "Ne pas inclure de numéro de document complet."),
  maskedDocNumber: z.string().regex(/^\*{4}\d{4}$/, "Format requis : ****1234").optional().or(z.literal("")),
  city: z.string().min(1, "La ville est requise"),
  delegation: z.string().max(100).optional().or(z.literal("")),
  date: z.string().min(1, "La date est requise")
    .refine((v) => new Date(v) <= new Date(), "La date ne peut pas être dans le futur"),
  reward: z.string().optional()
    .refine((v) => !v || (!isNaN(Number(v)) && Number(v) >= 0), "Montant invalide"),
});

/* ── FieldWrapper ────────────────────────────────────────────────────────── */
function FieldWrapper({ label, htmlFor, error, hint, required, children }) {
  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={htmlFor} className="font-sans text-[13px] font-[500] flex items-center gap-1"
          style={{ color: "#b8bdd0" }}>
          {label}
          {required && <span className="text-[#f87171] text-xs">*</span>}
        </Label>
      )}
      {children}
      {error
        ? <p className="text-[12px] font-[500]" style={{ color: "#f87171" }} role="alert">{error}</p>
        : hint
        ? <p className="text-[12px]" style={{ color: "#6b7494" }}>{hint}</p>
        : null}
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────────────────── */
export default function EditPostPage() {
  const { id }   = useParams();
  const router   = useRouter();
  const dispatch = useAppDispatch();
  const { accessToken, user } = useAppSelector((s) => s.auth);
  const { isSaving, error, fieldErrors, updatedPost } = useAppSelector((s) => s.posts);

  const [post,         setPost]         = useState(null);
  const [loadingPost,  setLoadingPost]  = useState(true);
  const [loadError,    setLoadError]    = useState(null);
  const [photo,        setPhoto]        = useState(null); // base64 or existing URL
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactPrefs, setContactPrefs] = useState({ platform: true, email: true, phone: false });
  const togglePref = (key) => setContactPrefs((p) => ({ ...p, [key]: !p[key] }));

  const tokenRef = useRef(accessToken);
  useEffect(() => { tokenRef.current = accessToken; }, [accessToken]);

  const getToken = async () => {
    if (tokenRef.current) return tokenRef.current;
    const t = await refreshAccessToken();
    dispatch(setAccessToken(t));
    tokenRef.current = t;
    return t;
  };

  const {
    register, handleSubmit, setValue, watch,
    setError, reset, formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const watchObjectType = watch("objectType");
  const watchType       = post?.type;

  /* ── Load existing post ─────────────────────────────────────────────────── */
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await postsApi.getPostById(id);
        const p    = data.data.post;
        if (cancelled) return;

        // Guard: only owner or admin
        const uid = user?._id ?? user?.id;
        if (uid && p.author?._id?.toString() !== uid?.toString() && user?.role !== "admin") {
          router.push(`/posts/${id}`);
          return;
        }
        // Guard: only active posts
        if (p.status !== "active") {
          toast.error("Seules les annonces actives peuvent être modifiées.");
          router.push(`/posts/${id}`);
          return;
        }

        setPost(p);
        setPhoto(p.photo ?? null);
        setContactEmail(p.contactEmail ?? "");
        setContactPhone(p.contactPhone ?? "");
        setContactPrefs({
          platform: p.contactPreferences?.platform ?? true,
          email:    p.contactPreferences?.email    ?? true,
          phone:    p.contactPreferences?.phone    ?? false,
        });

        // Pre-fill form
        reset({
          objectType:      p.objectType ?? "",
          title:           p.title ?? "",
          description:     p.description ?? "",
          maskedDocNumber: p.maskedDocNumber ?? "",
          city:            p.city ?? "",
          delegation:      p.delegation ?? "",
          date:            p.date ? new Date(p.date).toISOString().split("T")[0] : "",
          reward:          p.reward != null ? String(p.reward) : "",
        });
      } catch (err) {
        if (!cancelled) setLoadError("Impossible de charger l'annonce.");
      } finally {
        if (!cancelled) setLoadingPost(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, user, router, reset]);

  /* ── Redirect after successful save ─────────────────────────────────────── */
  useEffect(() => {
    if (updatedPost) {
      toast.success("Annonce mise à jour !");
      dispatch(clearUpdatedPost());
      router.push(`/posts/${updatedPost._id}`);
    }
  }, [updatedPost, router, dispatch]);

  /* ── Field errors from server ───────────────────────────────────────────── */
  useEffect(() => {
    fieldErrors?.forEach(({ field, message }) => setError(field, { message }));
  }, [fieldErrors, setError]);

  useEffect(() => {
    if (error && !fieldErrors) toast.error(error);
  }, [error, fieldErrors]);

  useEffect(() => () => { dispatch(clearPostErrors()); }, [dispatch]);

  /* ── Submit ──────────────────────────────────────────────────────────────── */
  const onSubmit = async (values) => {
    const token = await getToken();
    dispatch(updatePost({
      id,
      token,
      payload: {
        objectType:      values.objectType,
        title:           values.title,
        description:     values.description,
        city:            values.city,
        delegation:      values.delegation || "",
        date:            values.date,
        maskedDocNumber: values.maskedDocNumber || null,
        reward:          values.reward ? Number(values.reward) : null,
        photo:           photo || null,
        contactEmail:    (contactPrefs.email && contactEmail)  ? contactEmail.trim()  : null,
        contactPhone:    (contactPrefs.phone && contactPhone)  ? contactPhone.trim()  : null,
        contactPreferences: {
          platform: contactPrefs.platform,
          email:    contactPrefs.email,
          phone:    contactPrefs.phone,
        },
      },
    }));
  };

  /* ── Render states ───────────────────────────────────────────────────────── */
  const C = {
    canvas:  "#0d0f14", surface: "#13161e", elevated: "#1a1e28",
    border:  "rgba(255,255,255,0.08)", borderS: "rgba(255,255,255,0.05)",
    ink:     "#f0f2f8", inkSec: "#b8bdd0", inkMut: "#6b7494",
    accent:  "#4f8ef7",
  };

  if (loadingPost) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: C.canvas }}>
      <Loader2 className="h-6 w-6 animate-spin" style={{ color: C.accent }} />
    </div>
  );

  if (loadError) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: C.canvas }}>
      <AlertCircle className="h-10 w-10" style={{ color: "#f87171" }} />
      <p className="text-[15px]" style={{ color: C.inkSec }}>{loadError}</p>
      <Button variant="secondary" onClick={() => router.back()}>Retour</Button>
    </div>
  );

  return (
    <div className="min-h-screen py-10 px-4" style={{ background: C.canvas }}>
      <div className="max-w-[660px] mx-auto">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-[13px] mb-6" style={{ color: C.inkMut }}>
          <Link href="/" className="hover:text-[#f0f2f8] transition-colors">Accueil</Link>
          <span>/</span>
          <Link href="/posts" className="hover:text-[#f0f2f8] transition-colors">Annonces</Link>
          <span>/</span>
          <Link href={`/posts/${id}`} className="hover:text-[#f0f2f8] transition-colors truncate max-w-[160px]">
            {post?.title}
          </Link>
          <span>/</span>
          <span style={{ color: C.inkSec }}>Modifier</span>
        </nav>

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => router.push(`/posts/${id}`)}
            className="flex items-center justify-center w-9 h-9 rounded-lg transition-colors"
            style={{ background: C.elevated, border: `1px solid ${C.border}`, color: C.inkMut }}>
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="font-sans font-[700] text-[22px] tracking-[-0.02em]" style={{ color: C.ink }}>
              Modifier l&apos;annonce
            </h1>
            <p className="text-[13px] mt-0.5" style={{ color: C.inkMut }}>
              Type : <span className="font-[600]" style={{ color: post?.type === "lost" ? C.accent : "#34d399" }}>
                {post?.type === "lost" ? "Objet perdu" : "Objet trouvé"}
              </span>
              {" · "}Seules les annonces actives peuvent être modifiées.
            </p>
          </div>
        </div>

        {/* Form card */}
        <div className="rounded-xl overflow-hidden" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="px-6 py-6 space-y-6">

              {/* ── Type d'objet ──────────────────────────────────────────── */}
              <FieldWrapper label="Type d'objet" error={errors.objectType?.message} required>
                <div className="flex flex-wrap gap-2">
                  {OBJECT_TYPES.map(({ value, label }) => {
                    const active = watchObjectType === value;
                    return (
                      <button key={value} type="button"
                        onClick={() => setValue("objectType", value, { shouldValidate: true })}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-[13px] font-[500] transition-all focus:outline-none"
                        style={{
                          border:     active ? `1px solid ${C.accent}` : `1px solid ${C.border}`,
                          background: active ? "rgba(79,142,247,0.12)" : "transparent",
                          color:      active ? C.accent : C.inkSec,
                        }}>
                        {active && <Check className="h-3 w-3" strokeWidth={3} />}
                        {label}
                      </button>
                    );
                  })}
                </div>
              </FieldWrapper>

              {/* ── Titre ─────────────────────────────────────────────────── */}
              <FieldWrapper label="Titre" htmlFor="title" error={errors.title?.message} required>
                <Input id="title" placeholder="Ex : Portefeuille noir perdu…"
                  {...register("title")} className={errors.title ? "border-[#f87171]" : ""} />
              </FieldWrapper>

              {/* ── Description ───────────────────────────────────────────── */}
              <FieldWrapper label="Description" htmlFor="description" error={errors.description?.message} required
                hint="Ne pas inclure de numéro de document complet.">
                <textarea id="description" rows={5}
                  placeholder="Décrivez l'objet : couleur, marque, signes particuliers…"
                  {...register("description")}
                  className="w-full rounded-lg border px-3.5 py-2.5 text-[14px] resize-none focus:outline-none transition-all"
                  style={{
                    background:   "#161921",
                    border:       errors.description ? "1px solid #f87171" : `1px solid ${C.border}`,
                    color:        C.ink,
                  }}
                  onFocus={(e) => { e.target.style.borderColor = C.accent; e.target.style.boxShadow = "0 0 0 3px rgba(79,142,247,0.18)"; }}
                  onBlur={(e)  => { e.target.style.borderColor = errors.description ? "#f87171" : C.border; e.target.style.boxShadow = "none"; }}
                />
              </FieldWrapper>

              {/* ── Numéro masqué ─────────────────────────────────────────── */}
              <FieldWrapper label="Numéro masqué (optionnel)" htmlFor="maskedDocNumber"
                error={errors.maskedDocNumber?.message} hint="Format : ****1234">
                <Input id="maskedDocNumber" placeholder="****1234" {...register("maskedDocNumber")}
                  className={`font-mono ${errors.maskedDocNumber ? "border-[#f87171]" : ""}`} />
              </FieldWrapper>

              {/* ── Confidentialité notice ───────────────────────────────── */}
              <div className="flex gap-3 p-3.5 rounded-lg"
                style={{ background: "rgba(79,142,247,0.06)", border: "1px solid rgba(79,142,247,0.18)" }}>
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: C.accent }} />
                <p className="text-[12px] leading-[1.6]" style={{ color: "#7aabfa" }}>
                  Ne publiez jamais un numéro complet. Utilisez le format masqué{" "}
                  <code className="font-mono font-[600]">****1234</code>.
                </p>
              </div>

              {/* ── Ville ─────────────────────────────────────────────────── */}
              <FieldWrapper label="Ville" htmlFor="city" error={errors.city?.message} required>
                <select id="city" {...register("city")}
                  className="w-full rounded-lg border px-3.5 py-2.5 text-[14px] appearance-none focus:outline-none transition-all"
                  style={{
                    background: "#161921",
                    border:     errors.city ? "1px solid #f87171" : `1px solid ${C.border}`,
                    color:      C.ink,
                  }}>
                  <option value="">Sélectionnez une ville</option>
                  {TUNISIAN_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </FieldWrapper>

              {/* ── Délégation ────────────────────────────────────────────── */}
              <FieldWrapper label="Délégation / Quartier" htmlFor="delegation"
                error={errors.delegation?.message} hint="Optionnel">
                <Input id="delegation" placeholder="Ex : Bab Bhar, Lac 2…"
                  {...register("delegation")} className={errors.delegation ? "border-[#f87171]" : ""} />
              </FieldWrapper>

              {/* ── Date ──────────────────────────────────────────────────── */}
              <FieldWrapper label="Date de perte / découverte" htmlFor="date"
                error={errors.date?.message} required>
                <Input id="date" type="date"
                  max={new Date().toISOString().split("T")[0]}
                  {...register("date")} className={errors.date ? "border-[#f87171]" : ""} />
              </FieldWrapper>

              {/* ── Photo ─────────────────────────────────────────────────── */}
              <div className="space-y-2">
                <Label className="text-[13px] font-[500]" style={{ color: "#b8bdd0" }}>
                  Photo <span className="text-[12px] font-[400]" style={{ color: C.inkMut }}>(optionnel)</span>
                </Label>
                {photo ? (
                  <div className="relative w-full rounded-xl overflow-hidden"
                    style={{ background: C.elevated, border: `1px solid ${C.border}` }}>
                    <img src={photo} alt="Aperçu" className="w-full max-h-64 object-contain" />
                    <button type="button" onClick={() => setPhoto(null)}
                      className="absolute top-2 right-2 flex items-center justify-center w-7 h-7 rounded-full transition-colors"
                      style={{ background: "rgba(0,0,0,0.65)", color: "#f0f2f8" }}>
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <label htmlFor="photo-upload"
                    className="flex flex-col items-center justify-center gap-3 w-full h-32 rounded-xl border-2 border-dashed cursor-pointer transition-all group"
                    style={{ borderColor: C.border, background: "transparent" }}>
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg"
                      style={{ background: C.elevated }}>
                      <ImagePlus className="h-4 w-4" style={{ color: C.inkMut }} />
                    </div>
                    <p className="text-[12px]" style={{ color: C.inkMut }}>
                      Cliquez pour ajouter ou remplacer la photo
                    </p>
                    <input id="photo-upload" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 5 * 1024 * 1024) { toast.error("Max 5 Mo"); e.target.value = ""; return; }
                        const reader = new FileReader();
                        reader.onload = (ev) => setPhoto(ev.target.result);
                        reader.readAsDataURL(file);
                      }} />
                  </label>
                )}
              </div>

              {/* ── Récompense (lost only) ────────────────────────────────── */}
              {watchType === "lost" && (
                <FieldWrapper label="Récompense (optionnel)" htmlFor="reward"
                  error={errors.reward?.message} hint="Montant en dinars tunisiens (TND)">
                  <div className="relative">
                    <Input id="reward" type="number" min="0" step="1" placeholder="0"
                      {...register("reward")} className={`pr-14 ${errors.reward ? "border-[#f87171]" : ""}`} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-[600]"
                      style={{ color: C.inkMut }}>TND</span>
                  </div>
                </FieldWrapper>
              )}

              {/* ── Séparateur ────────────────────────────────────────────── */}
              <div style={{ borderTop: `1px solid ${C.borderS}` }} />

              {/* ── Préférences de contact ─────────────────────────────────── */}
              <div className="space-y-3">
                <p className="text-[13px] font-[600]" style={{ color: C.ink }}>
                  Préférences de contact
                </p>

                {[
                  { key: "platform", Icon: MessageSquare, label: "Via la messagerie de la plateforme" },
                  { key: "email",    Icon: Mail,           label: "Par email" },
                  { key: "phone",    Icon: Phone,          label: "Par téléphone" },
                ].map(({ key, Icon, label }) => (
                  <div key={key} className="space-y-2">
                    <label className="flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer select-none transition-all"
                      style={{
                        border:     contactPrefs[key] ? `1px solid ${C.accent}` : `1px solid ${C.border}`,
                        background: contactPrefs[key] ? "rgba(79,142,247,0.08)" : "transparent",
                      }}>
                      <input type="checkbox" className="sr-only"
                        checked={contactPrefs[key]}
                        onChange={() => togglePref(key)} />
                      <span className="flex items-center justify-center w-4 h-4 rounded border-2 shrink-0 transition-all"
                        style={{
                          background:  contactPrefs[key] ? C.accent : "transparent",
                          borderColor: contactPrefs[key] ? C.accent : "rgba(255,255,255,0.30)",
                        }}>
                        {contactPrefs[key] && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3.5} />}
                      </span>
                      <Icon className="h-4 w-4 shrink-0"
                        style={{ color: contactPrefs[key] ? C.accent : C.inkMut }} />
                      <span className="text-[13px]"
                        style={{ color: contactPrefs[key] ? C.ink : C.inkSec }}>
                        {label}
                      </span>
                    </label>

                    {key === "email" && contactPrefs.email && (
                      <div className="ml-3 pl-3 space-y-1.5"
                        style={{ borderLeft: "2px solid rgba(79,142,247,0.35)" }}>
                        <label htmlFor="contactEmail" className="block text-[12px] font-[500]"
                          style={{ color: "#b8bdd0" }}>Email de contact</label>
                        <input id="contactEmail" type="email" placeholder="votre@email.com"
                          value={contactEmail} onChange={(e) => setContactEmail(e.target.value)}
                          style={{
                            width: "100%", height: "40px", borderRadius: "8px",
                            border: `1px solid ${C.border}`, background: "#161921",
                            padding: "0 12px", color: C.ink, fontSize: "14px", outline: "none",
                            boxSizing: "border-box",
                          }}
                          onFocus={(e) => { e.target.style.borderColor = C.accent; e.target.style.boxShadow = "0 0 0 3px rgba(79,142,247,0.18)"; }}
                          onBlur={(e)  => { e.target.style.borderColor = C.border;  e.target.style.boxShadow = "none"; }}
                        />
                      </div>
                    )}

                    {key === "phone" && contactPrefs.phone && (
                      <div className="ml-3 pl-3 space-y-1.5"
                        style={{ borderLeft: "2px solid rgba(79,142,247,0.35)" }}>
                        <label htmlFor="contactPhone" className="block text-[12px] font-[500]"
                          style={{ color: "#b8bdd0" }}>Numéro de téléphone</label>
                        <input id="contactPhone" type="tel" placeholder="+216 XX XXX XXX"
                          value={contactPhone} onChange={(e) => setContactPhone(e.target.value)}
                          style={{
                            width: "100%", height: "40px", borderRadius: "8px",
                            border: `1px solid ${C.border}`, background: "#161921",
                            padding: "0 12px", color: C.ink, fontSize: "14px", outline: "none",
                            boxSizing: "border-box",
                          }}
                          onFocus={(e) => { e.target.style.borderColor = C.accent; e.target.style.boxShadow = "0 0 0 3px rgba(79,142,247,0.18)"; }}
                          onBlur={(e)  => { e.target.style.borderColor = C.border;  e.target.style.boxShadow = "none"; }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Footer actions ─────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-6 py-4"
              style={{ borderTop: `1px solid ${C.borderS}`, background: C.elevated }}>
              <button type="button" onClick={() => router.push(`/posts/${id}`)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-[500] transition-all"
                style={{ border: `1px solid ${C.border}`, color: C.inkSec, background: "transparent" }}>
                <ChevronLeft className="h-4 w-4" /> Annuler
              </button>

              <button type="submit" disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-[14px] font-[700] transition-all disabled:opacity-50 disabled:pointer-events-none"
                style={{ background: C.accent, color: "#fff" }}>
                {isSaving
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Enregistrement…</>
                  : <><Save className="h-4 w-4" /> Enregistrer les modifications</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
