"use client";

import { useEffect, useState, useRef } from "react";
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
import { refreshAccessToken } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { createPost, clearPostErrors, clearCreatedPost } from "@/store/slices/postsSlice";
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
  type: z.enum(["lost","found"], { required_error: "Sélectionnez un type" }),
  objectType: z.enum(
    ["cin","passport","permis","carte_bancaire","telephone","cles","autre"],
    { required_error: "Sélectionnez un type d'objet" }
  ),
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
  ["type","objectType"],
  ["title","description","maskedDocNumber"],
  ["city","delegation","date"],
  ["reward"],
];

const STEP_META = [
  { label: "Type",        desc: "Perdu ou trouvé ?" },
  { label: "Détails",     desc: "Décrivez l'objet"  },
  { label: "Lieu & Date", desc: "Où et quand ?"     },
  { label: "Contact",     desc: "Vos préférences"   },
];

function Stepper({ current, total }) {
  return (
    <div className="flex items-center w-full" role="list" aria-label="Étapes du formulaire">
      {STEP_META.map((meta, i) => {
        const done   = i < current;
        const active = i === current;
        return (
          <div key={i} className="flex items-center flex-1 last:flex-none" role="listitem">
            <div className="flex flex-col items-center gap-1.5 min-w-[56px]">
              <div
                aria-current={active ? "step" : undefined}
                className={[
                  "flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all duration-300",
                  done   ? "bg-blue-600 text-white shadow-sm" : "",
                  active ? "bg-blue-600 text-white shadow-md ring-4 ring-blue-100" : "",
                  !done && !active ? "bg-slate-100 text-slate-400 border border-slate-200" : "",
                ].join(" ")}
              >
                {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : i + 1}
              </div>
              <span className={`text-[10px] font-semibold tracking-wide uppercase whitespace-nowrap hidden sm:block ${active ? "text-blue-600" : done ? "text-slate-500" : "text-slate-300"}`}>
                {meta.label}
              </span>
            </div>
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
            <span className="inline-block w-1 h-1 rounded-full bg-rose-500 shrink-0" />{error}
          </p>
        : hint
        ? <p className="text-xs text-slate-400 leading-relaxed">{hint}</p>
        : null}
    </div>
  );
}

export default function NewPostPage() {
  const router   = useRouter();
  const dispatch = useAppDispatch();
  const { accessToken } = useAppSelector((s) => s.auth);
  const { isLoading, error, fieldErrors, createdPost } = useAppSelector((s) => s.posts);
  const [step, setStep]   = useState(0);
  const [photo, setPhoto] = useState(null);
  const TOTAL_STEPS = 4;

  const [contactPrefs, setContactPrefs] = useState({ platform: true, email: true, phone: false });
  const togglePref = (key) => setContactPrefs((prev) => ({ ...prev, [key]: !prev[key] }));

  const tokenRef = useRef(accessToken);
  useEffect(() => { tokenRef.current = accessToken; }, [accessToken]);

  const { register, handleSubmit, trigger, watch, setValue, setError, formState: { errors } } =
    useForm({
      resolver: zodResolver(schema),
      defaultValues: {
        type: undefined, objectType: undefined,
        title: "", description: "", maskedDocNumber: "",
        city: "", delegation: "", date: "", reward: "",
      },
    });

  const watchType       = watch("type");
  const watchObjectType = watch("objectType");

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
    const valid = await trigger(STEP_FIELDS[step]);
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
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-[620px] mx-auto">
        <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-6">
          <Link href="/" className="hover:text-slate-700 font-medium">Accueil</Link>
          <span className="text-slate-300">/</span>
          <Link href="/posts" className="hover:text-slate-700 font-medium">Annonces</Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-600 font-semibold">Nouvelle annonce</span>
        </nav>
        <div className="mb-8">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-600 shadow-sm shrink-0">
              <MapPin className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Publier une annonce</h1>
          </div>
          <p className="text-sm text-slate-500 ml-[46px]">Déclarez un objet perdu ou trouvé — visible immédiatement.</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_24px_-4px_rgba(15,23,42,0.08)] overflow-hidden">
          <div className="px-8 pt-7 pb-6 border-b border-slate-100 bg-gradient-to-b from-slate-50/60 to-white">
            <Stepper current={step} total={TOTAL_STEPS} />
          </div>
          <div className="px-8 pt-6 pb-0">
            <span className="text-[11px] font-bold uppercase tracking-widest text-blue-500">Étape {step + 1} / {TOTAL_STEPS}</span>
            <h2 className="text-lg font-bold text-slate-900 mt-1">{STEP_META[step].label}</h2>
            <p className="text-sm text-slate-500 mt-0.5">{STEP_META[step].desc}</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="px-8 py-6 space-y-6">

              {/* ÉTAPE 1 */}
              {step === 0 && (
                <div className="space-y-7">
                  <FieldWrapper label="Type d'annonce" error={errors.type?.message} required>
                    <div className="grid grid-cols-2 gap-3 mt-1">
                      {[
                        { value:"lost",  icon:<Search className="h-5 w-5"/>,  label:"J'ai perdu",  desc:"Je cherche un objet que j'ai perdu",
                          sel:{ card:"border-orange-400 bg-gradient-to-br from-orange-50 to-amber-50",   icon:"bg-orange-100 text-orange-600",  ring:"ring-2 ring-orange-300/50" }},
                        { value:"found", icon:<Package className="h-5 w-5"/>, label:"J'ai trouvé", desc:"J'ai trouvé un objet qui ne m'appartient pas",
                          sel:{ card:"border-emerald-400 bg-gradient-to-br from-emerald-50 to-teal-50", icon:"bg-emerald-100 text-emerald-600", ring:"ring-2 ring-emerald-300/50" }},
                      ].map(({ value, icon, label, desc, sel }) => {
                        const active = watchType === value;
                        return (
                          <button key={value} type="button"
                            onClick={() => setValue("type", value, { shouldValidate: true })}
                            className={["relative flex flex-col gap-3.5 p-5 rounded-xl border-2 text-left transition-all duration-200 focus:outline-none",
                              active ? `${sel.card} ${sel.ring}` : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"].join(" ")}
                          >
                            {active && <span className="absolute top-3 right-3 flex items-center justify-center w-5 h-5 rounded-full bg-blue-600"><Check className="h-3 w-3 text-white" strokeWidth={3}/></span>}
                            <span className={`flex items-center justify-center w-10 h-10 rounded-xl ${active ? sel.icon : "bg-slate-100 text-slate-500"}`}>{icon}</span>
                            <div>
                              <p className="text-sm font-semibold text-slate-800">{label}</p>
                              <p className="text-xs text-slate-500 mt-1">{desc}</p>
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
                            className={["inline-flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-medium transition-all focus:outline-none",
                              active ? "border-blue-500 bg-blue-600 text-white shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"].join(" ")}
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

              {/* ÉTAPE 2 */}
              {step === 1 && (
                <div className="space-y-5">
                  <FieldWrapper label="Titre" htmlFor="title" error={errors.title?.message} required hint="Ex : CIN perdu au marché central de Tunis">
                    <Input id="title" placeholder="Ex : Portefeuille noir perdu près de l'avenue Bourguiba" {...register("title")}
                      className={`h-10 text-sm border-slate-200 placeholder:text-slate-400 ${errors.title ? "border-rose-400" : ""}`} />
                  </FieldWrapper>
                  <FieldWrapper label="Description" htmlFor="description" error={errors.description?.message} required hint="Ne pas inclure de numéro de document complet.">
                    <textarea id="description" rows={5}
                      placeholder="Décrivez l'objet : couleur, marque, signes particuliers, circonstances..."
                      {...register("description")}
                      className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 bg-white resize-none focus:outline-none focus:ring-2 focus:ring-offset-0 ${errors.description ? "border-rose-400 focus:ring-rose-100" : "border-slate-200 focus:ring-blue-100 focus:border-blue-400"}`} />
                  </FieldWrapper>
                  <FieldWrapper label="Numéro masqué (optionnel)" htmlFor="maskedDocNumber" error={errors.maskedDocNumber?.message} hint="Format : ****1234">
                    <Input id="maskedDocNumber" placeholder="****1234" {...register("maskedDocNumber")}
                      className={`h-10 text-sm border-slate-200 font-mono placeholder:text-slate-400 ${errors.maskedDocNumber ? "border-rose-400" : ""}`} />
                  </FieldWrapper>
                  <div className="flex gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200/80">
                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800 leading-relaxed">
                      <strong>Confidentialité :</strong> Ne publiez jamais un numéro complet (CIN, passeport, carte bancaire).
                      Utilisez le format <code className="font-mono bg-amber-100 px-1 rounded">****1234</code>.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                      Photo <span className="text-slate-400 font-normal text-xs ml-1">(optionnel)</span>
                    </Label>
                    {photo ? (
                      <div className="relative w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                        <img src={photo} alt="Aperçu" className="w-full max-h-64 object-contain" />
                        <button type="button" onClick={() => setPhoto(null)}
                          className="absolute top-2 right-2 flex items-center justify-center w-7 h-7 rounded-full bg-slate-900/60 hover:bg-slate-900/80 text-white">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <label htmlFor="photo-upload"
                        className="flex flex-col items-center justify-center gap-3 w-full h-36 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/60 hover:bg-slate-100/60 hover:border-blue-300 cursor-pointer transition-all group">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-blue-50">
                          <ImagePlus className="h-5 w-5 text-slate-400 group-hover:text-blue-500" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-slate-600">Cliquez pour ajouter une photo</p>
                          <p className="text-xs text-slate-400 mt-0.5">JPEG, PNG, WebP — max 5 Mo</p>
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

              {/* ÉTAPE 3 */}
              {step === 2 && (
                <div className="space-y-5">
                  <FieldWrapper label="Ville" htmlFor="city" error={errors.city?.message} required>
                    <select id="city" {...register("city")}
                      className={`w-full rounded-lg border px-3.5 py-2.5 text-sm bg-white text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-offset-0 ${errors.city ? "border-rose-400 focus:ring-rose-100" : "border-slate-200 focus:ring-blue-100 focus:border-blue-400"}`}>
                      <option value="">Sélectionnez une ville</option>
                      {TUNISIAN_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </FieldWrapper>
                  <FieldWrapper label="Délégation / Quartier" htmlFor="delegation" error={errors.delegation?.message} hint="Optionnel">
                    <Input id="delegation" placeholder="Ex : Bab Bhar, Montplaisir, Lac 2…" {...register("delegation")}
                      className={`h-10 text-sm border-slate-200 placeholder:text-slate-400 ${errors.delegation ? "border-rose-400" : ""}`} />
                  </FieldWrapper>
                  <FieldWrapper label="Date de perte / découverte" htmlFor="date" error={errors.date?.message} required>
                    <Input id="date" type="date" max={new Date().toISOString().split("T")[0]} {...register("date")}
                      className={`h-10 text-sm border-slate-200 ${errors.date ? "border-rose-400" : ""}`} />
                  </FieldWrapper>
                </div>
              )}

              {/* ÉTAPE 4 */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-slate-700">Préférences de contact</Label>
                    <div className="space-y-2">
                      {[
                        { key:"platform", label:"Via la messagerie de la plateforme", icon:<MessageSquare className="h-4 w-4"/> },
                        { key:"email",    label:"Par email",                          icon:<Mail className="h-4 w-4"/> },
                        { key:"phone",    label:"Par téléphone",                      icon:<Phone className="h-4 w-4"/> },
                      ].map(({ key, label, icon }) => {
                        const checked = contactPrefs[key];
                        return (
                          <button key={key} type="button" onClick={() => togglePref(key)}
                            className={["w-full flex items-center gap-3.5 px-4 py-3 rounded-xl border text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                              checked ? "border-blue-400 bg-blue-50/50" : "border-slate-200 bg-white hover:bg-slate-50"].join(" ")}>
                            <span className={["flex items-center justify-center w-4 h-4 rounded border-2 shrink-0 transition-all",
                              checked ? "bg-blue-600 border-blue-600" : "bg-white border-slate-300"].join(" ")}>
                              {checked && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3.5}/>}
                            </span>
                            <span className={`transition-colors ${checked ? "text-blue-600" : "text-slate-500"}`}>{icon}</span>
                            <span className={`text-sm font-medium transition-colors ${checked ? "text-slate-900" : "text-slate-700"}`}>{label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {watchType === "lost" && (
                    <FieldWrapper label="Récompense (optionnel)" htmlFor="reward" error={errors.reward?.message} hint="Montant en dinars tunisiens (TND)">
                      <div className="relative">
                        <Input id="reward" type="number" min="0" step="1" placeholder="0" {...register("reward")}
                          className={`h-10 text-sm border-slate-200 pr-16 ${errors.reward ? "border-rose-400" : ""}`} />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">TND</span>
                      </div>
                    </FieldWrapper>
                  )}

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
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-8 py-5 border-t border-slate-100 bg-slate-50/50">
              {step > 0 ? (
                <button type="button" onClick={goBack}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200 transition-all">
                  <ChevronLeft className="h-4 w-4"/>Retour
                </button>
              ) : (
                <Link href="/posts"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-800 hover:bg-white border border-transparent hover:border-slate-200 transition-all">
                  Annuler
                </Link>
              )}

              {step < TOTAL_STEPS - 1 ? (
                <button type="button" onClick={goNext}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold bg-blue-600 text-white shadow-sm hover:bg-blue-700 active:scale-[.98] transition-all">
                  Continuer<ChevronRight className="h-4 w-4"/>
                </button>
              ) : (
                <button type="submit" disabled={isLoading}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold bg-blue-600 text-white shadow-sm hover:bg-blue-700 active:scale-[.98] disabled:opacity-60 disabled:pointer-events-none transition-all min-w-[160px] justify-center">
                  {isLoading
                    ? <><Loader2 className="h-4 w-4 animate-spin"/>Publication…</>
                    : <><CheckCircle2 className="h-4 w-4"/>Publier l'annonce</>}
                </button>
              )}
            </div>
          </form>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6 leading-relaxed">
          En publiant, vous acceptez nos{" "}
          <Link href="/terms" className="text-blue-500 hover:underline">conditions d'utilisation</Link>{" "}
          et confirmez que les informations fournies sont exactes.
        </p>
      </div>
    </div>
  );
}
