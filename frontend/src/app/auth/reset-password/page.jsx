"use client";

import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authApi } from "@/lib/api/auth.api";
import {
  AuthBrandPanel,
  MobileLogo,
  FormField,
  PasswordInput,
  AuthFormCard,
} from "@/components/auth/AuthShared";

const schema = z
  .object({
    password: z
      .string()
      .min(8, "8 caractères minimum")
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Doit contenir majuscule, minuscule et chiffre"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path:    ["confirmPassword"],
  });

function ResetPasswordContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const token        = searchParams.get("token");

  const [isLoading,     setIsLoading]     = useState(false);
  const [status,        setStatus]        = useState("idle"); // idle | success | error
  const [errorMessage,  setErrorMessage]  = useState("");
  const [showPwd,       setShowPwd]       = useState(false);
  const [showConfirm,   setShowConfirm]   = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  /* ── Invalid / missing token ── */
  if (!token) {
    return (
      <main className="min-h-screen flex">
        <AuthBrandPanel
          title="Lien invalide"
          subtitle="Ce lien de réinitialisation est manquant ou corrompu."
          bullets={[]}
        />
        <div className="flex flex-1 items-center justify-center p-6 bg-gray-50/50">
          <div className="w-full max-w-md">
            <MobileLogo />
            <AuthFormCard>
              <div className="flex flex-col items-center text-center gap-4 py-4">
                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-red-50">
                  <XCircle className="h-8 w-8 text-red-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Lien invalide</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Ce lien de réinitialisation est invalide ou manquant.
                  </p>
                </div>
                <Button size="lg" className="w-full" asChild>
                  <Link href="/auth/forgot-password">Demander un nouveau lien</Link>
                </Button>
              </div>
            </AuthFormCard>
          </div>
        </div>
      </main>
    );
  }

  const onSubmit = async (values) => {
    setIsLoading(true);
    try {
      await authApi.resetPassword({ token, password: values.password, confirmPassword: values.confirmPassword });
      setStatus("success");
      toast.success("Mot de passe réinitialisé avec succès !");
      setTimeout(() => router.push("/auth/login"), 2500);
    } catch (err) {
      setStatus("error");
      setErrorMessage(err.message || "Lien invalide ou expiré.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex">
      <AuthBrandPanel
        title="Nouveau mot de passe"
        subtitle="Choisissez un mot de passe fort pour sécuriser votre compte."
        bullets={[
          "8 caractères minimum",
          "Mélange de majuscules et chiffres",
          "Ne réutilisez pas un ancien mot de passe",
        ]}
      />

      <div className="flex flex-1 items-center justify-center p-6 bg-gray-50/50">
        <div className="w-full max-w-md">
          <MobileLogo />

          <AuthFormCard>
            {/* ── Success ── */}
            {status === "success" && (
              <div className="flex flex-col items-center text-center gap-4 py-4">
                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-50">
                  <CheckCircle className="h-8 w-8 text-emerald-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Mot de passe réinitialisé !</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Vous allez être redirigé vers la page de connexion…
                  </p>
                </div>
              </div>
            )}

            {/* ── Error ── */}
            {status === "error" && (
              <div className="flex flex-col items-center text-center gap-4 py-4">
                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-red-50">
                  <XCircle className="h-8 w-8 text-red-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Lien expiré</h2>
                  <p className="text-sm text-muted-foreground mt-1">{errorMessage}</p>
                </div>
                <Button size="lg" className="w-full" asChild>
                  <Link href="/auth/forgot-password">Demander un nouveau lien</Link>
                </Button>
              </div>
            )}

            {/* ── Form ── */}
            {status === "idle" && (
              <>
                <div className="mb-8">
                  <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Nouveau mot de passe</h1>
                  <p className="text-sm text-muted-foreground mt-1">Choisissez un mot de passe sécurisé.</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
                  <FormField
                    label="Nouveau mot de passe" htmlFor="password"
                    error={errors.password?.message}
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

                  <FormField
                    label="Confirmer le mot de passe" htmlFor="confirmPassword"
                    error={errors.confirmPassword?.message}
                  >
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
                      ? <><Loader2 className="h-4 w-4 animate-spin" />Réinitialisation…</>
                      : "Réinitialiser le mot de passe"}
                  </Button>
                </form>
              </>
            )}
          </AuthFormCard>

          {status === "idle" && (
            <p className="text-center text-sm text-muted-foreground mt-5">
              Vous vous souvenez ?{" "}
              <Link href="/auth/login" className="text-blue-600 hover:underline font-semibold">
                Se connecter
              </Link>
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return <Suspense><ResetPasswordContent /></Suspense>;
}
