"use client";

import { useEffect, useState } from "react";
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
  ImagePlus, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { createPost, clearPostErrors, clearCreatedPost } from "@/store/slices/postsSlice";

// ─── Données de référence ─────────────────────────────────────────────────

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
  type: z.enum(["lost","found"],{ required_error:"Sélectionnez un type" }),
  objectType: z.enum(
    ["cin","passport","permis","carte_bancaire","telephone","cles","autre"],
    { required_error:"Sélectionnez un type d'objet" }
  ),
  title: z.string().min(5,"Minimum 5 caractères").max(100,"Maximum 100 caractères").trim(),
  description: z.string().min(10,"Minimum 10 caractères").max(1000,"Maximum 1000 caractères").trim()
    .refine((v)=>!SENSITIVE_DOC_REGEX.test(v),"Ne pas inclure de numéro de document complet. Utilisez le format ****1234"),
  maskedDocNumber: z.string().regex(/^\*{4}\d{4}$/,"Format requis : ****1234").optional().or(z.literal("")),
  city: z.string().min(1,"La ville est requise"),
  delegation: z.string().max(100).optional().or(z.literal("")),
  date: z.string().min(1,"La date est requise")
    .refine((v)=>new Date(v)<=new Date(),"La date ne peut pas être dans le futur"),
  reward: z.string().optional()
    .refine((v)=>!v||(!isNaN(Number(v))&&Number(v)>=0),"Montant invalide"),
  contactPhone:    z.boolean().default(false),
  contactEmail:    z.boolean().default(true),
  contactPlatform: z.boolean().default(true),
});

const STEP_FIELDS = [
  ["type","objectType"],
  ["title","description","maskedDocNumber"],
  ["city","delegation","date"],
  ["reward","contactPhone","contactEmail","contactPlatform"],
];

const STEP_META = [
  { label:"Type",       desc:"Perdu ou trouvé ?" },
  { label:"Détails",    desc:"Décrivez l'objet" },
  { label:"Lieu & Date",desc:"Où et quand ?"    },
  { label:"Contact",    desc:"Vos préférences"  },
];

// ─── Sub-components ──────────────────────────────────────────────────────

function Stepper({ current, total }) {
  return (
    <div className="flex items-center w-full" role="list" aria-label="Étapes du formulaire">
      {STEP_META.map((meta, i) => {
        const done   = i < current;
        const active = i === current;
        return (
          <div key={i} className="flex items-center flex-1 last:flex-none" role="listitem">
            {/* Circle + label */}
            <div className="flex flex-col items-center gap-1.5 min-w-[56px]">
              <div
                aria-current={active ? "step" : undefined}
                className={[
                  "flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all duration-300 ring-offset-white",
                  done   ? "bg-blue-600 text-white shadow-sm"                              : "",
                  active ? "bg-blue-600 text-white shadow-md ring-4 ring-blue-100"         : "",
                  !done && !active ? "bg-slate-100 text-slate-400 border border-slate-200" : "",
                ].join(" ")}
              >
                {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : i + 1}
              </div>
              <span className={`text-[10px] font-semibold tracking-wide uppercase whitespace-nowrap hidden sm:block
                ${active ? "text-blue-600" : done ? "text-slate-500" : "text-slate-300"}`}>
                {meta.label}
              </span>
            </div>
            {/* Connector */}
            {i < total - 1 && (
              <div className="flex-1 mx-1 mt-[-10px] sm:mt-[-18px]">
                <div className={`h-px w-full transition-colors duration-500 ${i < current ? "bg-blue-400" : "bg-slate-200"}`} />
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
        <Label htmlFor={htmlFor} className="text-sm font-medium text-slate-700 flex items-center gap-1">
          {label}
          {required && <span className="text-rose-500 text-xs leading-none">*</span>}
        </Label>
      )}
      {children}
      {error
        ? <p className="flex items-center gap-1 text-xs text-rose-600 font-medium" role="alert">
            <span className="inline-block w-1 h-1 rounded-full bg-rose-500 shrink-0" />
            {error}
          </p>
        : hint
        ? <p className="text-xs text-slate-400 leading-relaxed">{hint}</p>
        : null}
    </div>
  );
}

function SectionHeader({ title, desc }) {
  return (
    <div className="pb-5 border-b border-slate-100">
      <h2 className="text-base font-semibold text-slate-800">{title}</h2>
      <p className="text-sm text-slate-500 mt-0.5">{desc}</p>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────

export default function NewPostPage() {
  const router   = useRouter();
  const dispatch = useAppDispatch();
  const { user, accessToken, isHydrating } = useAppSelector((s) => s.auth);
  const { isLoading, error, fieldErrors, createdPost } = useAppSelector((s) => s.posts);
  const [step, setStep] = useState(0);
  const [photo, setPhoto] = useState(null); // base64 data-URI or null
  const TOTAL_STEPS = 4;

  const { register, handleSubmit, trigger, watch, setValue, setError, formState: { errors } } =
    useForm({
      resolver: zodResolver(schema),
      defaultValues: {
        type: undefined, objectType: undefined,
        title: "", description: "", maskedDocNumber: "",
        city: "", delegation: "", date: "", reward: "",
        contactPhone: false, contactEmail: true, contactPlatform: true,
      },
    });

  const watchType       = watch("type");
  const watchObjectType = watch("objectType");

  useEffect(() => {
    if (!isHydrating && !user) router.push("/auth/login?redirect=/posts/new");
  }, [isHydrating, user, router]);

  useEffect(() => {
    if (createdPost) {
      toast.success("Annonce publiée avec succès !");
      dispatch(clearCreatedPost());
      router.push(`/posts/${createdPost._id}`);
    }
  }, [createdPost, router, dispatch]);

  useEffect(() => {
    if (error && !fieldErrors) toast.error(error);
    return () => { dispatch(clearPostErrors()); };
  }, [error, fieldErrors, dispatch]);

  useEffect(() => {
    fieldErrors?.forEach(({ field, message }) => setError(field, { message }));
  }, [fieldErrors, setError]);

  const goNext = async () => {
    const valid = await trigger(STEP_FIELDS[step]);
    if (valid) setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  };
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const onSubmit = (values) => {
    dispatch(createPost({
      payload: {
        type: values.type, objectType: values.objectType,
        title: values.title, description: values.description,
        city: values.city, delegation: values.delegation || "",
        date: values.date,
        maskedDocNumber: values.maskedDocNumber || null,
        reward: values.reward ? Number(values.reward) : null,
        photo: photo || null,
        contactPreferences: {
          phone: values.contactPhone, email: values.contactEmail, platform: values.contactPlatform,
        },
      },
      token: accessToken,
    }));
  };

  if (isHydrating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-[620px] mx-auto">

        {/* ── Breadcrumb ── */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-6" aria-label="Fil d'Ariane">
          <Link href="/" className="hover:text-slate-700 transition-colors font-medium">Accueil</Link>
          <span className="text-slate-300">/</span>
          <Link href="/posts" className="hover:text-slate-700 transition-colors font-medium">Annonces</Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-600 font-semibold">Nouvelle annonce</span>
        </nav>

        {/* ── Page header ── */}
        <div className="mb-8">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-600 shadow-sm shrink-0">
              <MapPin className="h-4.5 w-4.5 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-[22px] font-bold text-slate-900 tracking-tight leading-tight">
              Publier une annonce
            </h1>
          </div>
          <p className="text-sm text-slate-500 leading-relaxed ml-[46px]">
            Déclarez un objet perdu ou trouvé — votre annonce sera visible immédiatement.
          </p>
        </div>

        {/* ── Card principale ── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_24px_-4px_rgba(15,23,42,0.08)] overflow-hidden">

          {/* ── Stepper header ── */}
          <div className="px-8 pt-7 pb-6 border-b border-slate-100 bg-gradient-to-b from-slate-50/60 to-white">
            <Stepper current={step} total={TOTAL_STEPS} />
          </div>

          {/* ── Step label ── */}
          <div className="px-8 pt-6 pb-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-widest text-blue-500">
                Étape {step + 1} / {TOTAL_STEPS}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              {STEP_META[step].label}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">{STEP_META[step].desc}</p>
          </div>

          {/* ── Contenu formulaire ── */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="px-8 py-6 space-y-6">

              {/* ══════════ ÉTAPE 1 — Type & objet ══════════ */}
              {step === 0 && (
                <div className="space-y-7">

                  {/* Type lost / found */}
                  <FieldWrapper label="Type d'annonce" error={errors.type?.message} required>
                    <div className="grid grid-cols-2 gap-3 mt-1">
                      {[
                        {
                          value: "lost",
                          icon: <Search className="h-5 w-5" />,
                          label: "J'ai perdu",
                          desc: "Je cherche un objet que j'ai perdu",
                          selected: {
                            card: "border-orange-400 bg-gradient-to-br from-orange-50 to-amber-50 shadow-sm shadow-orange-100",
                            icon: "bg-orange-100 text-orange-600",
                            ring: "ring-2 ring-orange-300/50",
                          },
                        },
                        {
                          value: "found",
                          icon: <Package className="h-5 w-5" />,
                          label: "J'ai trouvé",
                          desc: "J'ai trouvé un objet qui ne m'appartient pas",
                          selected: {
                            card: "border-emerald-400 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-sm shadow-emerald-100",
                            icon: "bg-emerald-100 text-emerald-600",
                            ring: "ring-2 ring-emerald-300/50",
                          },
                        },
                      ].map(({ value, icon, label, desc, selected }) => {
                        const isSelected = watchType === value;
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setValue("type", value, { shouldValidate: true })}
                            className={[
                              "relative flex flex-col gap-3.5 p-5 rounded-xl border-2 text-left transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                              isSelected
                                ? `${selected.card} ${selected.ring}`
                                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60 hover:shadow-sm",
                            ].join(" ")}
                          >
                            {isSelected && (
                              <span className="absolute top-3 right-3 flex items-center justify-center w-5 h-5 rounded-full bg-blue-600">
                                <Check className="h-3 w-3 text-white" strokeWidth={3} />
                              </span>
                            )}
                            <span className={`flex items-center justify-center w-10 h-10 rounded-xl transition-colors ${isSelected ? selected.icon : "bg-slate-100 text-slate-500"}`}>
                              {icon}
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-slate-800 leading-snug">{label}</p>
                              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{desc}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </FieldWrapper>

                  {/* Type d'objet */}
                  <FieldWrapper label="Type d'objet" error={errors.objectType?.message} required>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {OBJECT_TYPES.map(({ value, label }) => {
                        const isSelected = watchObjectType === value;
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setValue("objectType", value, { shouldValidate: true })}
                            className={[
                              "inline-flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                              isSelected
                                ? "border-blue-500 bg-blue-600 text-white shadow-sm"
                                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50",
                            ].join(" ")}
                          >
                            {isSelected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </FieldWrapper>
                </div>
              )}

              {/* ══════════ ÉTAPE 2 — Titre & description ══════════ */}
              {step === 1 && (
                <div className="space-y-5">
                  <FieldWrapper label="Titre" htmlFor="title" error={errors.title?.message} required
                    hint="Ex : CIN perdu au marché central de Tunis">
                    <Input
                      id="title"
                      placeholder="Ex : Portefeuille noir perdu près de l'avenue Bourguiba"
                      {...register("title")}
                      className={[
                        "h-10 text-sm border-slate-200 focus:border-blue-400 focus:ring-blue-100 placeholder:text-slate-400 transition-shadow",
                        errors.title ? "border-rose-400 focus:border-rose-400 focus:ring-rose-100" : "",
                      ].join(" ")}
                    />
                  </FieldWrapper>

                  <FieldWrapper label="Description" htmlFor="description" error={errors.description?.message} required
                    hint="Ne pas inclure de numéro de document complet.">
                    <textarea
                      id="description"
                      rows={5}
                      placeholder="Décrivez l'objet : couleur, marque, signes particuliers, circonstances... Évitez les numéros complets (CIN, passeport)."
                      {...register("description")}
                      className={[
                        "w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 bg-white resize-none transition-all",
                        "focus:outline-none focus:ring-2 focus:ring-offset-0",
                        errors.description
                          ? "border-rose-400 focus:ring-rose-100 focus:border-rose-400"
                          : "border-slate-200 focus:ring-blue-100 focus:border-blue-400",
                      ].join(" ")}
                    />
                  </FieldWrapper>

                  <FieldWrapper label="Numéro masqué (optionnel)" htmlFor="maskedDocNumber"
                    error={errors.maskedDocNumber?.message}
                    hint="Format : ****1234 — uniquement les 4 derniers chiffres du document">
                    <Input
                      id="maskedDocNumber"
                      placeholder="****1234"
                      {...register("maskedDocNumber")}
                      className={[
                        "h-10 text-sm border-slate-200 focus:border-blue-400 focus:ring-blue-100 placeholder:text-slate-400 font-mono",
                        errors.maskedDocNumber ? "border-rose-400 focus:border-rose-400" : "",
                      ].join(" ")}
                    />
                  </FieldWrapper>

                  {/* Bandeau confidentialité */}
                  <div className="flex gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200/80">
                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800 leading-relaxed">
                      <strong className="font-semibold">Confidentialité :</strong> Ne publiez jamais un numéro de document complet
                      (CIN, passeport, carte bancaire). Utilisez uniquement les 4 derniers chiffres au format <code className="font-mono bg-amber-100 px-1 rounded">****1234</code>.
                    </p>
                  </div>

                  {/* ── Photo (optionnelle) ── */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                      Photo
                      <span className="text-slate-400 font-normal text-xs ml-1">(optionnel)</span>
                    </Label>

                    {photo ? (
                      /* ── Prévisualisation ── */
                      <div className="relative w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                        <img
                          src={photo}
                          alt="Aperçu de la photo"
                          className="w-full max-h-64 object-contain"
                        />
                        <button
                          type="button"
                          onClick={() => setPhoto(null)}
                          className="absolute top-2 right-2 flex items-center justify-center w-7 h-7 rounded-full bg-slate-900/60 hover:bg-slate-900/80 text-white transition-colors"
                          aria-label="Supprimer la photo"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      /* ── Zone de dépôt / sélection ── */
                      <label
                        htmlFor="photo-upload"
                        className="flex flex-col items-center justify-center gap-3 w-full h-36 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/60 hover:bg-slate-100/60 hover:border-blue-300 cursor-pointer transition-all group"
                      >
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-blue-50 transition-colors">
                          <ImagePlus className="h-5 w-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-slate-600 group-hover:text-slate-800">
                            Cliquez pour ajouter une photo
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">JPEG, PNG, WebP — max 5 Mo</p>
                        </div>
                        <input
                          id="photo-upload"
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          className="sr-only"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (file.size > 5 * 1024 * 1024) {
                              toast.error("L'image ne doit pas dépasser 5 Mo");
                              e.target.value = "";
                              return;
                            }
                            const reader = new FileReader();
                            reader.onload = (ev) => setPhoto(ev.target.result);
                            reader.readAsDataURL(file);
                          }}
                        />
                      </label>
                    )}
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Une photo aide à identifier l'objet plus rapidement.
                    </p>
                  </div>
                </div>
              )}

              {/* ══════════ ÉTAPE 3 — Lieu & date ══════════ */}
              {step === 2 && (
                <div className="space-y-5">
                  <FieldWrapper label="Ville" htmlFor="city" error={errors.city?.message} required>
                    <select
                      id="city"
                      {...register("city")}
                      className={[
                        "w-full rounded-lg border px-3.5 py-2.5 text-sm bg-white text-slate-900 appearance-none",
                        "focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all",
                        errors.city
                          ? "border-rose-400 focus:ring-rose-100"
                          : "border-slate-200 focus:ring-blue-100 focus:border-blue-400",
                      ].join(" ")}
                    >
                      <option value="">Sélectionnez une ville</option>
                      {TUNISIAN_CITIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </FieldWrapper>

                  <FieldWrapper label="Délégation / Quartier" htmlFor="delegation"
                    error={errors.delegation?.message}
                    hint="Optionnel — précisez pour faciliter la recherche">
                    <Input
                      id="delegation"
                      placeholder="Ex : Bab Bhar, Montplaisir, Lac 2…"
                      {...register("delegation")}
                      className={[
                        "h-10 text-sm border-slate-200 focus:border-blue-400 focus:ring-blue-100 placeholder:text-slate-400",
                        errors.delegation ? "border-rose-400" : "",
                      ].join(" ")}
                    />
                  </FieldWrapper>

                  <FieldWrapper label="Date de perte / découverte" htmlFor="date"
                    error={errors.date?.message} required>
                    <Input
                      id="date"
                      type="date"
                      max={new Date().toISOString().split("T")[0]}
                      {...register("date")}
                      className={[
                        "h-10 text-sm border-slate-200 focus:border-blue-400 focus:ring-blue-100",
                        errors.date ? "border-rose-400" : "",
                      ].join(" ")}
                    />
                  </FieldWrapper>
                </div>
              )}

              {/* ══════════ ÉTAPE 4 — Contact & récompense ══════════ */}
              {step === 3 && (
                <div className="space-y-6">

                  {/* Préférences de contact */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-slate-700">Préférences de contact</Label>
                    <div className="space-y-2">
                      {[
                        { name:"contactPlatform", label:"Via la messagerie de la plateforme", icon:<MessageSquare className="h-4 w-4" /> },
                        { name:"contactEmail",    label:"Par email",                          icon:<Mail className="h-4 w-4" /> },
                        { name:"contactPhone",    label:"Par téléphone",                      icon:<Phone className="h-4 w-4" /> },
                      ].map(({ name, label, icon }) => (
                        <label key={name}
                          className="flex items-center gap-3.5 px-4 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition-all group has-[:checked]:border-blue-400 has-[:checked]:bg-blue-50/50">
                          <input
                            type="checkbox"
                            {...register(name)}
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 accent-blue-600 cursor-pointer focus:ring-blue-500"
                          />
                          <span className="text-slate-500 group-has-[:checked]:text-blue-600 transition-colors">{icon}</span>
                          <span className="text-sm font-medium text-slate-700 group-has-[:checked]:text-slate-900">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Récompense — uniquement pour type lost */}
                  {watchType === "lost" && (
                    <FieldWrapper label="Récompense (optionnel)" htmlFor="reward"
                      error={errors.reward?.message}
                      hint="Montant en dinars tunisiens (TND)">
                      <div className="relative">
                        <Input
                          id="reward"
                          type="number"
                          min="0"
                          step="1"
                          placeholder="0"
                          {...register("reward")}
                          className={[
                            "h-10 text-sm border-slate-200 focus:border-blue-400 focus:ring-blue-100 pr-16",
                            errors.reward ? "border-rose-400" : "",
                          ].join(" ")}
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 select-none">TND</span>
                      </div>
                    </FieldWrapper>
                  )}

                  {/* Récapitulatif */}
                  <div className="rounded-xl bg-slate-50 border border-slate-200 overflow-hidden">
                    <div className="px-4 py-3 bg-slate-100/60 border-b border-slate-200">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Récapitulatif</p>
                    </div>
                    <div className="px-4 py-3 divide-y divide-slate-100">
                      {[
                        { label:"Type",  value: watchType === "lost" ? "Objet perdu" : "Objet trouvé" },
                        { label:"Objet", value: OBJECT_TYPES.find((o) => o.value === watchObjectType)?.label ?? "—" },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex justify-between items-center py-2.5 text-sm">
                          <span className="text-slate-500">{label}</span>
                          <span className="font-semibold text-slate-800">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>{/* /form content */}

            {/* ── Footer navigation ── */}
            <div className="flex items-center justify-between px-8 py-5 border-t border-slate-100 bg-slate-50/50">
              {step > 0 ? (
                <button
                  type="button"
                  onClick={goBack}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-white hover:border hover:border-slate-200 transition-all"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Retour
                </button>
              ) : (
                <Link
                  href="/posts"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-800 hover:bg-white hover:border hover:border-slate-200 transition-all"
                >
                  Annuler
                </Link>
              )}

              {step < TOTAL_STEPS - 1 ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold bg-blue-600 text-white shadow-sm hover:bg-blue-700 active:scale-[.98] transition-all"
                >
                  Continuer
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold bg-blue-600 text-white shadow-sm hover:bg-blue-700 active:scale-[.98] disabled:opacity-60 disabled:pointer-events-none transition-all min-w-[160px] justify-center"
                >
                  {isLoading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" />Publication…</>
                  ) : (
                    <><CheckCircle2 className="h-4 w-4" />Publier l'annonce</>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>{/* /card */}

        {/* Note légale */}
        <p className="text-center text-xs text-slate-400 mt-6 leading-relaxed">
          En publiant, vous acceptez nos{" "}
          <Link href="/terms" className="text-blue-500 hover:underline">conditions d'utilisation</Link>{" "}
          et confirmez que les informations fournies sont exactes.
        </p>
      </div>
    </div>
  );
}
