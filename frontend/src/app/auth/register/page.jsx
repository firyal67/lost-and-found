"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Loader2, Mail, ExternalLink, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { registerUser, clearErrors } from "@/store/slices/authSlice";
import {
  AuthBrandPanel,
  MobileLogo,
  FormField,
  PasswordInput,
  AuthFormCard,
} from "@/components/auth/AuthShared";

const schema = z
  .object({
    name:            z.string().min(2, "Minimum 2 caractères").max(50).trim(),
    email:           z.string().email("Email invalide").trim().toLowerCase(),
    password:        z
      .string()
      .min(8, "8 caractères minimum")
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Doit contenir majuscule, minuscule et chiffre"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path:    ["confirmPassword"],
  });

export default function RegisterPage() {
  const router   = useRouter();
  const dispatch = useAppDispatch();
  const { isLoading, error, fieldErrors, user, emailPreviewUrl } = useAppSelector((s) => s.auth);
  const [showPwd,     setShowPwd]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [registered,  setRegistered]  = useState(false);
  const [regEmail,    setRegEmail]    = useState("");

  const { register, handleSubmit, setError, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (user && !registered) {
      setRegistered(true);
      setRegEmail(user.email);
      toast.success("Compte créé avec succès !");
    }
  }, [user, registered]);

  useEffect(() => {
    fieldErrors?.forEach(({ field, message }) => {
      if (field === "name" || field === "email" || field === "password")
        setError(field, { message });
    });
  }, [fieldErrors, setError]);

  useEffect(() => {
    if (error && !fieldErrors) toast.error(error);
    return () => { dispatch(clearErrors()); };
  }, [error, fieldErrors, dispatch]);

  const onSubmit = (values) =>
    dispatch(registerUser({ name: values.name, email: values.email, password: values.password }));

  /* ── Success screen ── */
  if (registered) {
    return (
      <main className="min-h-screen flex">
        <AuthBrandPanel
          title="Bienvenue !"
          subtitle="Votre compte a été créé. Vérifiez votre boîte mail pour activer votre accès."
          bullets={["Compte gratuit", "Accès immédiat après vérification", "Communauté bienveillante"]}
        />
        <div className="flex flex-1 items-center justify-center p-6 bg-gray-50/50">
          <div className="w-full max-w-md">
            <MobileLogo />
            <AuthFormCard>
              <div className="flex flex-col items-center text-center gap-4 py-4">
                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50">
                  <Mail className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Vérifiez votre email</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Un lien de confirmation a été envoyé à{" "}
                    <span className="font-semibold text-blue-600">{regEmail}</span>.
                  </p>
                </div>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Cliquez sur le lien dans l'email pour activer votre compte.
                  Le lien expire dans <strong className="text-gray-700">24 heures</strong>.
                </p>

                {emailPreviewUrl && (
                  <div className="w-full bg-amber-50 border border-amber-200 rounded-xl p-4 text-left space-y-2">
                    <p className="text-[11px] font-bold text-amber-700 uppercase tracking-widest">
                      Mode développement — Email simulé
                    </p>
                    <p className="text-sm text-amber-800">
                      Aucun vrai email envoyé. Consultez l'aperçu Ethereal :
                    </p>
                    <a
                      href={emailPreviewUrl}
                      target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:underline break-all"
                    >
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                      Voir l'email sur Ethereal
                    </a>
                  </div>
                )}

                <Button className="w-full mt-2" size="lg" onClick={() => router.push("/auth/login")}>
                  Aller à la connexion
                </Button>
              </div>
            </AuthFormCard>
          </div>
        </div>
      </main>
    );
  }

  /* ── Registration form ── */
  return (
    <main className="min-h-screen flex">
      <AuthBrandPanel
        title="Rejoignez la communauté"
        subtitle="Créez votre compte gratuitement et commencez à publier des annonces en quelques secondes."
        bullets={[
          "Inscription gratuite et rapide",
          "Publiez autant d'annonces que vous voulez",
          "Retrouvez vos objets perdus facilement",
        ]}
      />

      <div className="flex flex-1 items-center justify-center p-6 bg-gray-50/50">
        <div className="w-full max-w-md">
          <MobileLogo />

          <AuthFormCard>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Créer un compte</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Rejoignez Lost&amp;Found Tunisie — c'est gratuit.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
              <FormField label="Nom complet" htmlFor="name" error={errors.name?.message}>
                <Input
                  id="name" placeholder="Ahmed Ben Ali"
                  autoComplete="name" {...register("name")}
                  className={errors.name ? "border-destructive" : ""}
                />
              </FormField>

              <FormField label="Adresse email" htmlFor="email" error={errors.email?.message}>
                <Input
                  id="email" type="email" placeholder="ahmed@example.com"
                  autoComplete="email" {...register("email")}
                  className={errors.email ? "border-destructive" : ""}
                />
              </FormField>

              <FormField
                label="Mot de passe" htmlFor="password" error={errors.password?.message}
                hint={!errors.password ? "8 caractères min, majuscule, minuscule et chiffre" : undefined}
              >
                <PasswordInput
                  id="password" placeholder="••••••••"
                  autoComplete="new-password"
                  show={showPwd} onToggle={() => setShowPwd((v) => !v)}
                  hasError={!!errors.password}
                  {...register("password")}
                />
              </FormField>

              <FormField label="Confirmer le mot de passe" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
                <PasswordInput
                  id="confirmPassword" placeholder="••••••••"
                  autoComplete="new-password"
                  show={showConfirm} onToggle={() => setShowConfirm((v) => !v)}
                  hasError={!!errors.confirmPassword}
                  {...register("confirmPassword")}
                />
              </FormField>

              <Button type="submit" size="lg" disabled={isLoading} className="w-full mt-1">
                {isLoading
                  ? <><Loader2 className="h-4 w-4 animate-spin" />Création…</>
                  : "Créer mon compte"}
              </Button>
            </form>
          </AuthFormCard>

          <p className="text-center text-sm text-muted-foreground mt-5">
            Déjà un compte ?{" "}
            <Link href="/auth/login" className="text-blue-600 hover:underline font-semibold">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
