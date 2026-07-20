"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  Loader2, Search, Package, CheckCircle2,
  ChevronLeft, ChevronRight, AlertTriangle,
  MapPin, Phone, Mail, MessageSquare, Check,
  ImagePlus, X, Sparkles, ExternalLink, Tag, Calendar,
} from "lucide-react";
import { refreshAccessToken } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { createPost, clearPostErrors, clearCreatedPost, fetchMatchingSuggestions, clearSuggestions } from "@/store/slices/postsSlice";
import { setAccessToken } from "@/store/slices/authSlice";

const OBJECT_TYPES = [
  { value: "cin", label: "Carte d'identité (CIN)" },
  { value: "passport", label: "Passeport" },
  { value: "permis", label: "Permis de conduire" },
  { value: "carte_bancaire", label: "Carte bancaire" },
  { value: "telephone", label: "Téléphone" },
  { value: "cles", label: "Clés" },
  { value: "autre", label: "Autre" },
];

const TUNISIAN_CITIES = [
  "Tunis","Sfax","Sousse","Kairouan","Bizerte","Gabès","Ariana",
  "Gafsa","Monastir","Ben Arous","Kasserine","Médenine","Nabeul",
  "Tataouine","Béja","Jendouba","El Kef","Mahdia","Sidi Bouzid",
  "Tozeur","Siliana","Zaghouan","Kebili","Manouba",
];

const SENSITIVE_DOC_REGEX = /\b\d{8}\b|\b[A-Z]\d{7}\b/;

const schema = z.object({
  type: z.enum(["lost","found"], { required_error: "Sélectionnez un type" }),
  objectType: z.enum(["cin","passport","permis","carte_bancaire","telephone","cles","autre"], { required_error: "Sélectionnez un type d'objet" }),
  title: z.string().min(5,"Minimum 5 caractères").max(100,"Maximum 100 caractères").trim(),
  description: z.string().min(10,"Minimum 10 caractères").max(1000,"Maximum 1000 caractères").trim()
    .refine((v) => !SENSITIVE_DOC_REGEX.test(v), "Ne pas inclure de numéro de document complet. Format ****1234"),
  maskedDocNumber: z.string().regex(/^\*{4}\d{4}$/, "Format requis : ****1234").optional().or(z.literal("")),
  city: z.string().min(1, "La ville est requise"),
  delegation: z.string().max(100).optional().or(z.literal("")),
  date: z.string().min(1, "La date est requise")
    .refine((v) => new Date(v) <= new Date(), "La date ne peut pas être dans le futur"),
  reward: z.string().optional()
    .refine((v) => !v || (!isNaN(Number(v)) && Number(v) >= 0), "Montant invalide"),
});

const STEP_FIELDS = [
  ["type", "objectType"],   // étape 1
  ["title", "description"], // étape 2
  ["city"],                 // étape 3 — date validée à la soumission seulement
  [],                       // étape 4 — tout optionnel
];

const STEP_META = [
  { label: "Type", desc: "Perdu ou trouvé ?" },
  { label: "Détails", desc: "Décrivez l'objet" },
  { label: "Lieu & Date", desc: "Où et quand ?" },
  { label: "Contact", desc: "Vos préférences" },
];

function Stepper({ current, total }) {
  return (
    <div className="flex items-center w-full" role="list" aria-label="Étapes du formulaire">
      {STEP_META.map((meta, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={i} className="flex items-center flex-1 last:flex-none" role="listitem">
            <div className="flex flex-col items-center gap-1.5 min-w-[56px]">
              <div aria-current={active ? "step" : undefined}
                className={[
                  "flex items-center justify-center w-8 h-8 rounded-full font-sans text-micro font-bold transition-all duration-300",
                  done ? "bg-primary text-neutral-50" : "",
                  active ? "bg-primary text-neutral-50 ring-4 ring-primary/20" : "",
                  !done && !active ? "bg-surface-elevated text-neutral-300 border border-border-default" : "",
                ].join(" ")}
              >
                {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : i + 1}
              </div>
              <span className={`text-micro font-semibold tracking-wide uppercase whitespace-nowrap hidden sm:block ${active ? "text-primary" : done ? "text-neutral-200" : "text-neutral-300"}`}>
                {meta.label}
              </span>
            </div>
            {i < total - 1 && (
              <div className="flex-1 mx-1 mt-[-10px] sm:mt-[-18px]">
                <div className={`h-px w-full transition-colors duration-500 ${i < current ? "bg-primary/60" : "bg-border-default"}`} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function FieldWrapper({ label, htmlFor, error, hint, required, children }) {
  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={htmlFor} className="font-sans text-label-md text-neutral-100 flex items-center gap-1">
          {label}
          {required && <span className="text-destructive text-xs leading-none">*</span>}
        </Label>
      )}
      {children}
      {error
        ? <p className="flex items-center gap-1 font-sans text-body-sm text-destructive" role="alert">
            <span className="inline-block w-1 h-1 rounded-full bg-[#d92d20] shrink-0" />{error}
          </p>
        : hint
        ? <p className="font-sans text-body-sm text-neutral-300 leading-relaxed">{hint}</p>
        : null}
    </div>
  );
}

/* ── Matching score bar ───────────────────────────────────────────────────── */
function ScoreBar({ score }) {
  const pct    = Math.min(100, Math.max(0, score));
  const color  = pct >= 80 ? "#34d399" : pct >= 50 ? "#fbbf24" : "#4f8ef7";
  const label  = pct >= 80 ? "Très pertinent" : pct >= 50 ? "Pertinent" : "Possible";
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[11px] font-[600] shrink-0" style={{ color }}>{label}</span>
    </div>
  );
}

/* ── Matching suggestions panel ───────────────────────────────────────────── */
const OBJECT_TYPE_LABELS_MAP = {
  cin:            "Carte d'identité",
  passport:       "Passeport",
  permis:         "Permis de conduire",
  carte_bancaire: "Carte bancaire",
  telephone:      "Téléphone",
  cles:           "Clés",
  autre:          "Autre",
};

function MatchingSuggestionsPanel({ suggestions, isLoading, currentType }) {
  const oppositeLabel = currentType === "lost" ? "trouvés" : "perdus";

  if (isLoading) {
    return (
      <div
        className="rounded-xl p-5 flex items-center gap-3"
        style={{ background: "rgba(79,142,247,0.06)", border: "1px solid rgba(79,142,247,0.18)" }}
      >
        <Loader2 className="h-4 w-4 animate-spin shrink-0" style={{ color: "#4f8ef7" }} />
        <p className="text-[13px]" style={{ color: "#8b91a8" }}>
          Recherche de correspondances…
        </p>
      </div>
    );
  }

  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div
      className="rounded-xl overflow-hidden animate-fade-in"
      style={{ border: "1px solid rgba(79,142,247,0.25)" }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2.5 px-4 py-3"
        style={{ background: "rgba(79,142,247,0.10)", borderBottom: "1px solid rgba(79,142,247,0.18)" }}
      >
        <Sparkles className="h-4 w-4 shrink-0" style={{ color: "#4f8ef7" }} />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-[700]" style={{ color: "#f0f2f8" }}>
            {suggestions.length} correspondance{suggestions.length > 1 ? "s" : ""} possible{suggestions.length > 1 ? "s" : ""} trouvée{suggestions.length > 1 ? "s" : ""}
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: "#6b7494" }}>
            Annonces d&apos;objets {oppositeLabel} qui pourraient correspondre
          </p>
        </div>
      </div>

      {/* Cards */}
      <div style={{ background: "#13161e" }}>
        {suggestions.map((post, idx) => {
          const dateStr = post.date
            ? new Date(post.date).toLocaleDateString("fr-TN", { day: "numeric", month: "short", year: "numeric" })
            : "—";

          return (
            <div
              key={post._id}
              className="px-4 py-3.5 transition-colors"
              style={{
                borderTop: idx > 0 ? "1px solid rgba(255,255,255,0.05)" : "none",
              }}
            >
              {/* Score bar */}
              <ScoreBar score={post.matchScore} />

              {/* Title + link */}
              <div className="flex items-start justify-between gap-2 mt-2">
                <p className="text-[14px] font-[600] leading-tight line-clamp-1" style={{ color: "#f0f2f8" }}>
                  {post.title}
                </p>
                <Link
                  href={`/posts/${post._id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 shrink-0 text-[11px] font-[600] px-2.5 py-1 rounded-full transition-all"
                  style={{
                    color: "#4f8ef7",
                    background: "rgba(79,142,247,0.10)",
                    border: "1px solid rgba(79,142,247,0.22)",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  Voir <ExternalLink className="h-3 w-3" />
                </Link>
              </div>

              {/* Meta */}
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1 text-[12px]" style={{ color: "#8b91a8" }}>
                  <Tag className="h-3 w-3 shrink-0" />
                  {OBJECT_TYPE_LABELS_MAP[post.objectType] ?? post.objectType}
                </span>
                <span className="inline-flex items-center gap-1 text-[12px]" style={{ color: "#8b91a8" }}>
                  <MapPin className="h-3 w-3 shrink-0" />
                  {post.city}
                </span>
                <span className="inline-flex items-center gap-1 text-[12px]" style={{ color: "#8b91a8" }}>
                  <Calendar className="h-3 w-3 shrink-0" />
                  {dateStr}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div
        className="px-4 py-2.5 flex items-center justify-between"
        style={{ background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        <p className="text-[11px]" style={{ color: "#6b7494" }}>
          Vérifiez ces annonces avant de publier — l&apos;objet a peut-être déjà été signalé.
        </p>
        <Link
          href="/posts"
          className="text-[11px] font-[600] ml-3 shrink-0 transition-colors"
          style={{ color: "#4f8ef7" }}
        >
          Voir toutes →
        </Link>
      </div>
    </div>
  );
}

export default function NewPostPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { accessToken } = useAppSelector((s) => s.auth);
  const { isLoading, error, fieldErrors, createdPost, suggestions, isFetchingSuggestions } = useAppSelector((s) => s.posts);
  const [step, setStep] = useState(0);
  const [photo, setPhoto] = useState(null);
  const TOTAL_STEPS = 4;

  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactPrefs, setContactPrefs] = useState({ platform: true, email: true, phone: false });
  const togglePref = (key) => setContactPrefs((prev) => ({ ...prev, [key]: !prev[key] }));

  const tokenRef = useRef(accessToken);
  useEffect(() => { tokenRef.current = accessToken; }, [accessToken]);

  // Debounce timer ref for matching suggestions
  const suggestTimerRef = useRef(null);

  const { register, handleSubmit, trigger, watch, setValue, setError, formState: { errors } } =
    useForm({
      resolver: zodResolver(schema),
      defaultValues: {
        type: undefined, objectType: undefined,
        title: "", description: "", maskedDocNumber: "",
        city: "", delegation: "", date: "", reward: "",
      },
    });

  const watchType        = watch("type");
  const watchObjectType  = watch("objectType");
  const watchCity        = watch("city");
  const watchDate        = watch("date");
  const watchDelegation  = watch("delegation");
  const watchTitle       = watch("title");
  const watchDescription = watch("description");

  // ── Auto-fetch matching suggestions when key fields change ────────────────
  // Triggers on step 2 (city+date collected) or step 3 (summary)
  // Debounced 600ms so we don't fire on every keystroke
  useEffect(() => {
    if (!watchObjectType) return; // need at least objectType
    if (step < 2) return;         // wait until we have city+date context

    if (suggestTimerRef.current) clearTimeout(suggestTimerRef.current);

    suggestTimerRef.current = setTimeout(() => {
      dispatch(fetchMatchingSuggestions({
        type:        watchType,
        objectType:  watchObjectType,
        city:        watchCity        || undefined,
        delegation:  watchDelegation  || undefined,
        date:        watchDate        || undefined,
        title:       watchTitle       || undefined,
        description: watchDescription || undefined,
      }));
    }, 600);

    return () => {
      if (suggestTimerRef.current) clearTimeout(suggestTimerRef.current);
    };
  }, [watchType, watchObjectType, watchCity, watchDate, watchDelegation, watchTitle, watchDescription, step, dispatch]);

  // Clear suggestions when leaving the form
  useEffect(() => {
    return () => { dispatch(clearSuggestions()); };
  }, [dispatch]);

  useEffect(() => {
    if (createdPost) {
      toast.success("Annonce publiée avec succès !");
      dispatch(clearCreatedPost());
      router.push(`/posts/${createdPost._id}`);
    }
  }, [createdPost, router, dispatch]);

  useEffect(() => {
    if (error && !fieldErrors) toast.error(error);
  }, [error, fieldErrors]);

  useEffect(() => {
    return () => { dispatch(clearPostErrors()); };
  }, [dispatch]);

  useEffect(() => {
    fieldErrors?.forEach(({ field, message }) => setError(field, { message }));
  }, [fieldErrors, setError]);

  const goNext = async () => {
    const fields = STEP_FIELDS[step];
    const valid = fields.length === 0 ? true : await trigger(fields);
    if (valid) setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  };
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const onSubmit = async (values) => {
    let token = tokenRef.current;
    if (!token) {
      try {
        token = await refreshAccessToken();
        dispatch(setAccessToken(token));
        tokenRef.current = token;
      } catch {
        toast.error("Session expirée. Veuillez vous reconnecter.");
        router.push("/auth/login?redirect=/posts/new");
        return;
      }
    }
    dispatch(createPost({
      payload: {
        type: values.type, objectType: values.objectType,
        title: values.title, description: values.description,
        city: values.city, delegation: values.delegation || "",
        date: values.date,
        maskedDocNumber: values.maskedDocNumber || null,
        reward: values.reward ? Number(values.reward) : null,
        photo: photo || null,
        contactEmail: (contactPrefs.email && contactEmail)  ? contactEmail.trim()  : null,
        contactPhone: (contactPrefs.phone && contactPhone)  ? contactPhone.trim()  : null,
        contactPreferences: {
          phone:    contactPrefs.phone,
          email:    contactPrefs.email,
          platform: contactPrefs.platform,
        },
      },
      token,
    }));
  };

  return (
    <div className="min-h-screen bg-app-bg py-10 px-4">
      <div className="max-w-[620px] mx-auto">
        <nav className="flex items-center gap-1.5 font-sans text-body-sm text-neutral-300 mb-6">
          <Link href="/" className="hover:text-neutral-50 font-medium">Accueil</Link>
          <span className="text-neutral-300/30">/</span>
          <Link href="/posts" className="hover:text-neutral-50 font-medium">Annonces</Link>
          <span className="text-neutral-300/30">/</span>
          <span className="text-neutral-200 font-semibold">Nouvelle annonce</span>
        </nav>

        <div className="mb-8">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#0267ad] shrink-0">
              <MapPin className="h-4 w-4 text-neutral-50" strokeWidth={2.5} />
            </div>
            <h1 className="text-h2 text-neutral-50">Publier une annonce</h1>
          </div>
          <p className="font-sans text-body text-neutral-200 ml-[46px]">Déclarez un objet perdu ou trouvé — visible immédiatement.</p>
        </div>

        <div className="bg-[#1a1a1a] rounded-lg border border-border-default overflow-hidden">
          <div className="px-8 pt-7 pb-6 border-b border-border-subtle bg-app-bg">
            <Stepper current={step} total={TOTAL_STEPS} />
          </div>

          <div className="px-8 pt-6 pb-0">
            <span className="text-micro font-bold uppercase tracking-widest text-primary">Étape {step + 1} / {TOTAL_STEPS}</span>
            <h2 className="text-h3 text-neutral-50 mt-1">{STEP_META[step].label}</h2>
            <p className="font-sans text-body-sm text-neutral-200 mt-0.5">{STEP_META[step].desc}</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="px-8 py-6 space-y-6">
              {step === 0 && (
                <div className="space-y-7">
                  <FieldWrapper label="Type d'annonce" error={errors.type?.message} required>
                    <div className="grid grid-cols-2 gap-3 mt-1">
                      {[
                        { value:"lost", icon:<Search className="h-5 w-5"/>, label:"J'ai perdu", desc:"Je cherche un objet que j'ai perdu",
                          sel:{ card:"border-primary bg-primary text-white", icon:"bg-white/20 text-white" }},
                        { value:"found", icon:<Package className="h-5 w-5"/>, label:"J'ai trouvé", desc:"J'ai trouvé un objet qui ne m'appartient pas",
                          sel:{ card:"border-primary bg-primary text-white", icon:"bg-white/20 text-white" }},
                      ].map(({ value, icon, label, desc, sel }) => {
                        const active = watchType === value;
                        return (
                          <button key={value} type="button"
                            onClick={() => setValue("type", value, { shouldValidate: true })}
                            className={["relative flex flex-col gap-3.5 p-5 rounded-lg border-2 text-left transition-all duration-200 focus:outline-none",
                              active ? `${sel.card}` : "border-primary/30 bg-primary-subtle text-neutral-100 hover:bg-primary/20 hover:border-primary/50"].join(" ")}
                          >
                            {active && <span className="absolute top-3 right-3 flex items-center justify-center w-5 h-5 rounded-full bg-white/30"><Check className="h-3 w-3 text-white" strokeWidth={3}/></span>}
                            <span className={`flex items-center justify-center w-10 h-10 rounded-lg ${active ? sel.icon : "bg-primary/20 text-primary"}`}>{icon}</span>
                            <div>
                              <p className={`font-slab text-label-lg ${active ? "text-white" : "text-neutral-50"}`}>{label}</p>
                              <p className={`font-sans text-body-sm mt-1 ${active ? "text-white/80" : "text-neutral-200"}`}>{desc}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </FieldWrapper>
                  <FieldWrapper label="Type d'objet" error={errors.objectType?.message} required>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {OBJECT_TYPES.map(({ value, label }) => {
                        const active = watchObjectType === value;
                        return (
                          <button key={value} type="button"
                            onClick={() => setValue("objectType", value, { shouldValidate: true })}
                            className={["inline-flex items-center gap-1.5 px-4 py-2 rounded-full border font-sans text-label-md transition-all focus:outline-none",
                              active ? "border-primary bg-primary text-neutral-50" : "border-border-default bg-transparent text-neutral-200 hover:border-white/30"].join(" ")}
                          >
                            {active && <Check className="h-3.5 w-3.5" strokeWidth={3}/>}
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </FieldWrapper>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-5">
                  <FieldWrapper label="Titre" htmlFor="title" error={errors.title?.message} required hint="Ex : CIN perdu au marché central de Tunis">
                    <Input id="title" placeholder="Ex : Portefeuille noir perdu près de l'avenue Bourguiba" {...register("title")}
                      className={errors.title ? "border-[#d92d20]" : ""} />
                  </FieldWrapper>
                  <FieldWrapper label="Description" htmlFor="description" error={errors.description?.message} required hint="Ne pas inclure de numéro de document complet.">
                    <textarea id="description" rows={5}
                      placeholder="Décrivez l'objet : couleur, marque, signes particuliers..."
                      {...register("description")}
                      className={`w-full rounded-lg border px-3.5 py-2.5 font-sans text-body text-neutral-50 placeholder:text-neutral-50/40 bg-[#1c1e26] resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${errors.description ? "border-destructive" : "border-border-default"}`} />
                  </FieldWrapper>
                  <FieldWrapper label="Numéro masqué (optionnel)" htmlFor="maskedDocNumber" error={errors.maskedDocNumber?.message} hint="Format : ****1234">
                    <Input id="maskedDocNumber" placeholder="****1234" {...register("maskedDocNumber")}
                      className={`font-mono ${errors.maskedDocNumber ? "border-[#d92d20]" : ""}`} />
                  </FieldWrapper>
                  <div className="flex gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <AlertTriangle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <p className="font-sans text-body-sm text-primary leading-relaxed">
                      <strong>Confidentialité :</strong> Ne publiez jamais un numéro complet (CIN, passeport, carte bancaire).
                      Utilisez le format <code className="font-mono bg-surface-elevated px-1 rounded">****1234</code>.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-sans text-label-md text-neutral-100 flex items-center gap-1">
                      Photo <span className="text-neutral-300 font-sans text-label-sm ml-1">(optionnel)</span>
                    </Label>
                    {photo ? (
                      <div className="relative w-full rounded-lg overflow-hidden border border-border-default bg-app-bg">
                        <img src={photo} alt="Aperçu" className="w-full max-h-64 object-contain" />
                        <button type="button" onClick={() => setPhoto(null)}
                          className="absolute top-2 right-2 flex items-center justify-center w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 text-neutral-50">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <label htmlFor="photo-upload"
                        className="flex flex-col items-center justify-center gap-3 w-full h-36 rounded-lg border-2 border-dashed border-border-default bg-transparent hover:border-primary/50 cursor-pointer transition-all group">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-surface-elevated group-hover:bg-primary-subtle">
                          <ImagePlus className="h-5 w-5 text-neutral-300 group-hover:text-primary" />
                        </div>
                        <div className="text-center">
                          <p className="font-sans text-label-md text-neutral-200">Cliquez pour ajouter une photo</p>
                          <p className="font-sans text-body-sm text-neutral-300 mt-0.5">JPEG, PNG, WebP — max 5 Mo</p>
                        </div>
                        <input id="photo-upload" type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (file.size > 5 * 1024 * 1024) { toast.error("L'image ne doit pas dépasser 5 Mo"); e.target.value = ""; return; }
                            const reader = new FileReader();
                            reader.onload = (ev) => setPhoto(ev.target.result);
                            reader.readAsDataURL(file);
                          }} />
                      </label>
                    )}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  <FieldWrapper label="Ville" htmlFor="city" error={errors.city?.message} required>
                    <select id="city" {...register("city")}
                      className={`w-full rounded-lg border px-3.5 py-2.5 font-sans text-body bg-[#1c1e26] text-neutral-50 appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${errors.city ? "border-destructive" : "border-border-default"}`}>
                      <option value="">Sélectionnez une ville</option>
                      {TUNISIAN_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </FieldWrapper>
                  <FieldWrapper label="Délégation / Quartier" htmlFor="delegation" error={errors.delegation?.message} hint="Optionnel">
                    <Input id="delegation" placeholder="Ex : Bab Bhar, Montplaisir, Lac 2…" {...register("delegation")}
                      className={errors.delegation ? "border-[#d92d20]" : ""} />
                  </FieldWrapper>
                  <FieldWrapper label="Date de perte / découverte" htmlFor="date" error={errors.date?.message} required>
                    <Input id="date" type="date" max={new Date().toISOString().split("T")[0]} {...register("date")}
                      className={errors.date ? "border-[#d92d20]" : ""} />
                  </FieldWrapper>

                  {/* ── Suggestions de correspondance ─────────────────── */}
                  <MatchingSuggestionsPanel
                    suggestions={suggestions}
                    isLoading={isFetchingSuggestions}
                    currentType={watchType}
                  />
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">

                  {/* ── Correspondances potentielles (rappel étape 3) ────── */}
                  {suggestions.length > 0 && (
                    <div
                      className="rounded-xl p-4 flex items-start gap-3 animate-fade-in"
                      style={{ background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.22)" }}
                    >
                      <Sparkles className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "#34d399" }} />
                      <div className="min-w-0">
                        <p className="text-[13px] font-[600]" style={{ color: "#34d399" }}>
                          {suggestions.length} annonce{suggestions.length > 1 ? "s" : ""} correspondante{suggestions.length > 1 ? "s" : ""} trouvée{suggestions.length > 1 ? "s" : ""}
                        </p>
                        <p className="text-[12px] mt-0.5 leading-relaxed" style={{ color: "#8b91a8" }}>
                          Avant de publier, vérifiez que votre objet n&apos;est pas déjà signalé.{" "}
                          <Link
                            href="/posts"
                            target="_blank"
                            className="font-[600] underline"
                            style={{ color: "#34d399" }}
                          >
                            Voir les annonces →
                          </Link>
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ── Préférences de contact ─────────────────────────── */}
                  <div className="space-y-2">
                    <p className="font-sans text-[13px] font-[600] text-[#f0f2f8]">
                      Préférences de contact
                      <span className="ml-2 text-[12px] font-[400] text-[#6b7494]">— choisissez au moins une</span>
                    </p>

                    {/* Plateforme */}
                    <label className="flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer select-none transition-all"
                      style={{
                        border: contactPrefs.platform ? "1px solid #4f8ef7" : "1px solid rgba(255,255,255,0.08)",
                        background: contactPrefs.platform ? "rgba(79,142,247,0.08)" : "transparent",
                      }}>
                      <input type="checkbox" className="sr-only"
                        checked={contactPrefs.platform}
                        onChange={() => togglePref("platform")} />
                      <span className="flex items-center justify-center w-4 h-4 rounded border-2 shrink-0 transition-all"
                        style={{
                          background: contactPrefs.platform ? "#4f8ef7" : "transparent",
                          borderColor: contactPrefs.platform ? "#4f8ef7" : "rgba(255,255,255,0.30)",
                        }}>
                        {contactPrefs.platform && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3.5} />}
                      </span>
                      <MessageSquare className="h-4 w-4 shrink-0" style={{ color: contactPrefs.platform ? "#4f8ef7" : "#6b7494" }} />
                      <span className="font-sans text-[13px]" style={{ color: contactPrefs.platform ? "#f0f2f8" : "#b8bdd0" }}>
                        Via la messagerie de la plateforme
                      </span>
                    </label>

                    {/* Email */}
                    <label className="flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer select-none transition-all"
                      style={{
                        border: contactPrefs.email ? "1px solid #4f8ef7" : "1px solid rgba(255,255,255,0.08)",
                        background: contactPrefs.email ? "rgba(79,142,247,0.08)" : "transparent",
                      }}>
                      <input type="checkbox" className="sr-only"
                        checked={contactPrefs.email}
                        onChange={() => togglePref("email")} />
                      <span className="flex items-center justify-center w-4 h-4 rounded border-2 shrink-0 transition-all"
                        style={{
                          background: contactPrefs.email ? "#4f8ef7" : "transparent",
                          borderColor: contactPrefs.email ? "#4f8ef7" : "rgba(255,255,255,0.30)",
                        }}>
                        {contactPrefs.email && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3.5} />}
                      </span>
                      <Mail className="h-4 w-4 shrink-0" style={{ color: contactPrefs.email ? "#4f8ef7" : "#6b7494" }} />
                      <span className="font-sans text-[13px]" style={{ color: contactPrefs.email ? "#f0f2f8" : "#b8bdd0" }}>
                        Par email
                      </span>
                    </label>

                    {/* Champ email — géré par useState, indépendant de react-hook-form */}
                    {contactPrefs.email && (
                      <div className="ml-3 pl-3 space-y-1.5" style={{ borderLeft: "2px solid rgba(79,142,247,0.35)" }}>
                        <label htmlFor="contactEmail" className="block text-[12px] font-[500]" style={{ color: "#b8bdd0" }}>
                          Adresse email de contact
                        </label>
                        <input
                          id="contactEmail"
                          type="email"
                          placeholder="votre@email.com"
                          autoComplete="email"
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          style={{
                            width: "100%", height: "42px", borderRadius: "8px",
                            border: "1px solid rgba(255,255,255,0.10)",
                            background: "#161921", padding: "0 12px",
                            color: "#f0f2f8", fontSize: "14px", outline: "none",
                            boxSizing: "border-box",
                          }}
                          onFocus={(e) => { e.target.style.borderColor = "#4f8ef7"; e.target.style.boxShadow = "0 0 0 3px rgba(79,142,247,0.20)"; }}
                          onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.10)"; e.target.style.boxShadow = "none"; }}
                        />
                        <p className="text-[12px]" style={{ color: "#6b7494" }}>Visible uniquement par les personnes connectées</p>
                      </div>
                    )}

                    {/* Téléphone */}
                    <label className="flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer select-none transition-all"
                      style={{
                        border: contactPrefs.phone ? "1px solid #4f8ef7" : "1px solid rgba(255,255,255,0.08)",
                        background: contactPrefs.phone ? "rgba(79,142,247,0.08)" : "transparent",
                      }}>
                      <input type="checkbox" className="sr-only"
                        checked={contactPrefs.phone}
                        onChange={() => togglePref("phone")} />
                      <span className="flex items-center justify-center w-4 h-4 rounded border-2 shrink-0 transition-all"
                        style={{
                          background: contactPrefs.phone ? "#4f8ef7" : "transparent",
                          borderColor: contactPrefs.phone ? "#4f8ef7" : "rgba(255,255,255,0.30)",
                        }}>
                        {contactPrefs.phone && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3.5} />}
                      </span>
                      <Phone className="h-4 w-4 shrink-0" style={{ color: contactPrefs.phone ? "#4f8ef7" : "#6b7494" }} />
                      <span className="font-sans text-[13px]" style={{ color: contactPrefs.phone ? "#f0f2f8" : "#b8bdd0" }}>
                        Par téléphone
                      </span>
                    </label>

                    {/* Champ téléphone — géré par useState, indépendant de react-hook-form */}
                    {contactPrefs.phone && (
                      <div className="ml-3 pl-3 space-y-1.5" style={{ borderLeft: "2px solid rgba(79,142,247,0.35)" }}>
                        <label htmlFor="contactPhone" className="block text-[12px] font-[500]" style={{ color: "#b8bdd0" }}>
                          Numéro de téléphone de contact
                        </label>
                        <input
                          id="contactPhone"
                          type="tel"
                          placeholder="+216 XX XXX XXX"
                          autoComplete="tel"
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value)}
                          style={{
                            width: "100%", height: "42px", borderRadius: "8px",
                            border: "1px solid rgba(255,255,255,0.10)",
                            background: "#161921", padding: "0 12px",
                            color: "#f0f2f8", fontSize: "14px", outline: "none",
                            boxSizing: "border-box",
                          }}
                          onFocus={(e) => { e.target.style.borderColor = "#4f8ef7"; e.target.style.boxShadow = "0 0 0 3px rgba(79,142,247,0.20)"; }}
                          onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.10)"; e.target.style.boxShadow = "none"; }}
                        />
                        <p className="text-[12px]" style={{ color: "#6b7494" }}>Visible uniquement par les personnes connectées</p>
                      </div>
                    )}
                  </div>

                  {watchType === "lost" && (
                    <FieldWrapper label="Récompense (optionnel)" htmlFor="reward" error={errors.reward?.message} hint="Montant en dinars tunisiens (TND)">
                      <div className="relative">
                        <Input id="reward" type="number" min="0" step="1" placeholder="0" {...register("reward")}
                          className={`pr-16 ${errors.reward ? "border-[#d92d20]" : ""}`} />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-sans text-label-sm text-neutral-200">TND</span>
                      </div>
                    </FieldWrapper>
                  )}

                  <div className="rounded-lg bg-app-bg border border-border-default overflow-hidden">
                    <div className="px-4 py-3 bg-surface-elevated/50 border-b border-border-default">
                      <p className="text-micro font-bold uppercase tracking-widest text-neutral-200">Récapitulatif</p>
                    </div>
                    <div className="px-4 py-3 divide-y divide-border-subtle">
                      {[
                        { label:"Type", value: watchType === "lost" ? "Objet perdu" : "Objet trouvé" },
                        { label:"Objet", value: OBJECT_TYPES.find((o) => o.value === watchObjectType)?.label ?? "—" },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex justify-between items-center py-2.5">
                          <span className="font-sans text-body-sm text-neutral-200">{label}</span>
                          <span className="font-sans text-label-md text-neutral-50 font-medium">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between px-8 py-5 border-t border-border-subtle bg-app-bg">
              {step > 0 ? (
                <button type="button" onClick={goBack}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full font-sans text-label-md text-neutral-200 hover:text-neutral-50 hover:bg-surface-elevated/50 border border-transparent hover:border-border-default transition-all">
                  <ChevronLeft className="h-4 w-4"/> Retour
                </button>
              ) : (
                <Link href="/posts"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full font-sans text-label-md text-neutral-300 hover:text-neutral-200 hover:bg-surface-elevated/50 border border-transparent hover:border-border-default transition-all">
                  Annuler
                </Link>
              )}
              {step < TOTAL_STEPS - 1 ? (
                <button type="button" onClick={goNext}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-slab text-label-lg bg-primary text-neutral-50 hover:bg-[#015a94] active:scale-[.98] transition-all">
                  Continuer<ChevronRight className="h-4 w-4"/>
                </button>
              ) : (
                <button type="submit" disabled={isLoading}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-slab text-label-lg bg-primary text-neutral-50 hover:bg-[#015a94] active:scale-[.98] disabled:opacity-60 disabled:pointer-events-none transition-all min-w-[160px] justify-center">
                  {isLoading
                    ? <><Loader2 className="h-4 w-4 animate-spin"/> Publication…</>
                    : <><CheckCircle2 className="h-4 w-4"/> Publier l'annonce</>}
                </button>
              )}
            </div>
          </form>
        </div>

        <p className="text-center font-sans text-body-sm text-neutral-300 mt-6 leading-relaxed">
          En publiant, vous acceptez nos{" "}
          <Link href="/terms" className="text-primary hover:underline">conditions d'utilisation</Link>{" "}
          et confirmez que les informations fournies sont exactes.
        </p>
      </div>
    </div>
  );
}