"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Loader2, Mail, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { registerUser, clearErrors } from "@/store/slices/authSlice";
import {
  AuthBrandPanel, MobileLogo, FormField, PasswordInput, AuthFormCard,
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
    path: ["confirmPassword"],
  });

export default function RegisterPage() {
  const router   = useRouter();
  const dispatch = useAppDispatch();
  const { isLoading, error, fieldErrors, user, emailPreviewUrl } =
    useAppSelector((s) => s.auth);

  const [showPwd,     setShowPwd]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [registered,  setRegistered]  = useState(false);
  const [regEmail,    setRegEmail]    = useState("");

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (user && !registered) {
      setRegistered(true);
      setRegEmail(user.email);
      toast.success("Compte créé avec succès !");
    }
  }, [user, registered]);

  useEffect(() => {
    fieldErrors?.forEach(({ field, message }) => {
      if (["name", "email", "password"].includes(field)) setError(field, { message });
    });
  }, [fieldErrors, setError]);

  useEffect(() => {
    if (error && !fieldErrors) toast.error(error);
    return () => { dispatch(clearErrors()); };
  }, [error, fieldErrors, dispatch]);

  const onSubmit = (values) =>
    dispatch(registerUser({ name: values.name, email: values.email, password: values.password }));

  /* ── Success state ──────────────────────── */
  if (registered) {
    return (
      <main className="min-h-screen flex" style={{ background: "#0d0f14" }}>
        <AuthBrandPanel
          title="Bienvenue !"
          subtitle="Votre compte a été créé. Vérifiez votre boîte mail pour activer votre accès."
          bullets={[
            "Compte gratuit",
            "Accès immédiat après vérification",
            "Communauté bienveillante",
          ]}
        />

        <div className="flex flex-1 items-center justify-center p-6 sm:p-10" style={{ background: "#0d0f14" }}>
          <div className="w-full max-w-[420px]">
            <MobileLogo />
            <AuthFormCard>
              <div className="flex flex-col items-center text-center gap-5 py-4">
                {/* Icon */}
                <div
                  className="flex items-center justify-center w-16 h-16 rounded-2xl"
                  style={{
                    background: "rgba(79,142,247,0.10)",
                    border: "1px solid rgba(79,142,247,0.22)",
                  }}
                >
                  <Mail className="h-7 w-7" style={{ color: "#4f8ef7" }} />
                </div>

                <div>
                  <h2
                    className="font-sans font-[700] text-[22px] tracking-[-0.02em]"
                    style={{ color: "#f0f2f8" }}
                  >
                    Vérifiez votre email
                  </h2>
                  <p className="text-[14px] leading-[1.65] mt-2" style={{ color: "#8b91a8" }}>
                    Un lien de confirmation a été envoyé à{" "}
                    <span className="font-[500]" style={{ color: "#4f8ef7" }}>{regEmail}</span>.
                  </p>
                </div>

                <p className="text-[13px] leading-[1.65] max-w-sm" style={{ color: "#8b91a8" }}>
                  Cliquez sur le lien dans l&apos;email pour activer votre compte.
                  Le lien expire dans{" "}
                  <strong style={{ color: "#f0f2f8" }}>24 heures</strong>.
                </p>

                {/* Dev preview link */}
                {emailPreviewUrl && (
                  <div
                    className="w-full rounded-xl p-4 text-left space-y-2"
                    style={{
                      background: "rgba(79,142,247,0.07)",
                      border: "1px solid rgba(79,142,247,0.18)",
                    }}
                  >
                    <p
                      className="text-[11px] font-[600] uppercase tracking-[0.07em]"
                      style={{ color: "#4f8ef7" }}
                    >
                      Mode développement — Email simulé
                    </p>
                    <p className="text-[13px]" style={{ color: "#8b91a8" }}>
                      Aucun vrai email envoyé. Consultez l&apos;aperçu Ethereal :
                    </p>
                    <a
                      href={emailPreviewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[13px] font-[500] break-all"
                      style={{ color: "#4f8ef7" }}
                    >
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                      Voir l&apos;email sur Ethereal
                    </a>
                  </div>
                )}

                <Button
                  className="w-full mt-1"
                  size="lg"
                  onClick={() => router.push("/auth/login")}
                >
                  Aller à la connexion
                </Button>
              </div>
            </AuthFormCard>
          </div>
        </div>
      </main>
    );
  }

  /* ── Register form ──────────────────────── */
  return (
    <main className="min-h-screen flex" style={{ background: "#0d0f14" }}>
      <AuthBrandPanel
        title="Rejoignez la communauté"
        subtitle="Créez votre compte gratuitement et commencez à publier des annonces en quelques secondes."
        bullets={[
          "Inscription gratuite et rapide",
          "Publiez autant d'annonces que vous voulez",
          "Retrouvez vos objets perdus facilement",
        ]}
      />

      {/* Right — form */}
      <div className="flex flex-1 items-center justify-center p-6 sm:p-10" style={{ background: "#0d0f14" }}>
        <div className="w-full max-w-[420px]">
          <MobileLogo />

          <AuthFormCard>
            <div className="mb-8">
              <h1
                className="font-sans font-[700] text-[24px] tracking-[-0.02em]"
                style={{ color: "#f0f2f8" }}
              >
                Créer un compte
              </h1>
              <p className="text-[14px] mt-1" style={{ color: "#6b7494" }}>
                Rejoignez Lost&amp;Found Tunisie — c&apos;est gratuit.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
              <FormField label="Nom complet" htmlFor="name" error={errors.name?.message}>
                <Input
                  id="name"
                  placeholder="Ahmed Ben Ali"
                  autoComplete="name"
                  {...register("name")}
                  className={errors.name ? "border-[#f87171]" : ""}
                />
              </FormField>

              <FormField label="Adresse email" htmlFor="email" error={errors.email?.message}>
                <Input
                  id="email"
                  type="email"
                  placeholder="ahmed@example.com"
                  autoComplete="email"
                  {...register("email")}
                  className={errors.email ? "border-[#f87171]" : ""}
                />
              </FormField>

              <FormField
                label="Mot de passe"
                htmlFor="password"
                error={errors.password?.message}
                hint={!errors.password ? "8 caractères min, majuscule, minuscule et chiffre" : undefined}
              >
                <PasswordInput
                  id="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  show={showPwd}
                  onToggle={() => setShowPwd((v) => !v)}
                  hasError={!!errors.password}
                  {...register("password")}
                />
              </FormField>

              <FormField
                label="Confirmer le mot de passe"
                htmlFor="confirmPassword"
                error={errors.confirmPassword?.message}
              >
                <PasswordInput
                  id="confirmPassword"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  show={showConfirm}
                  onToggle={() => setShowConfirm((v) => !v)}
                  hasError={!!errors.confirmPassword}
                  {...register("confirmPassword")}
                />
              </FormField>

              <Button
                type="submit"
                size="lg"
                disabled={isLoading}
                className="w-full mt-1"
              >
                {isLoading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Création…</>
                ) : (
                  "Créer mon compte"
                )}
              </Button>
            </form>
          </AuthFormCard>

          <p
            className="text-center text-[13px] mt-5"
            style={{ color: "#6b7494" }}
          >
            Déjà un compte ?{" "}
            <Link
              href="/auth/login"
              className="font-[500] transition-colors"
              style={{ color: "#4f8ef7" }}
            >
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
