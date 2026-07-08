"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import toast from "react-hot-toast";
import { Loader2, Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authApi } from "@/lib/api/auth.api";
import {
  AuthBrandPanel,
  MobileLogo,
  FormField,
  AuthFormCard,
} from "@/components/auth/AuthShared";

const schema = z.object({
  email: z.string().email("Email invalide").trim().toLowerCase(),
});

export default function ForgotPasswordPage() {
  const [submitted,  setSubmitted]  = useState(false);
  const [isLoading,  setIsLoading]  = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values) => {
    setIsLoading(true);
    try {
      await authApi.forgotPassword({ email: values.email });
      setSubmitted(true);
    } catch (err) {
      toast.error(err.message || "Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex">
      <AuthBrandPanel
        title="Récupérez votre accès"
        subtitle="Pas d'inquiétude — entrez votre email et nous vous enverrons un lien pour créer un nouveau mot de passe."
        bullets={[
          "Lien sécurisé et temporaire",
          "Valable 1 heure",
          "Aucune donnée modifiée sans confirmation",
        ]}
      />

      <div className="flex flex-1 items-center justify-center p-6 bg-gray-50/50">
        <div className="w-full max-w-md">
          <MobileLogo />

          <AuthFormCard>
            {submitted ? (
              /* ── Success state ── */
              <div className="flex flex-col items-center text-center gap-5 py-4">
                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50">
                  <Mail className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Email envoyé !</h2>
                  <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
                    Si un compte est associé à cette adresse, vous recevrez un lien
                    de réinitialisation dans quelques minutes.{" "}
                    <span className="text-gray-500">Vérifiez aussi vos spams.</span>
                  </p>
                </div>
                <Button variant="outline" size="lg" className="w-full" asChild>
                  <Link href="/auth/login">
                    <ArrowLeft className="h-4 w-4" />
                    Retour à la connexion
                  </Link>
                </Button>
              </div>
            ) : (
              /* ── Form ── */
              <>
                <div className="mb-8">
                  <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Mot de passe oublié</h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Entrez votre email pour recevoir un lien de réinitialisation.
                  </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
                  <FormField label="Adresse email" htmlFor="email" error={errors.email?.message}>
                    <Input
                      id="email" type="email" placeholder="ahmed@example.com"
                      autoComplete="email" {...register("email")}
                      className={errors.email ? "border-destructive" : ""}
                    />
                  </FormField>

                  <Button type="submit" size="lg" disabled={isLoading} className="w-full mt-1">
                    {isLoading
                      ? <><Loader2 className="h-4 w-4 animate-spin" />Envoi…</>
                      : "Envoyer le lien"}
                  </Button>
                </form>
              </>
            )}
          </AuthFormCard>

          {!submitted && (
            <p className="text-center text-sm text-muted-foreground mt-5">
              <Link href="/auth/login" className="inline-flex items-center gap-1 text-blue-600 hover:underline font-semibold">
                <ArrowLeft className="h-3 w-3" />
                Retour à la connexion
              </Link>
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
