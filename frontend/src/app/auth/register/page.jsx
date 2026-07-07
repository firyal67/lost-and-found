"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Eye, EyeOff, MapPin, Loader2, Mail, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { registerUser, clearErrors } from "@/store/slices/authSlice";

const schema = z
  .object({
    name: z.string().min(2, "Minimum 2 caractères").max(50).trim(),
    email: z.string().email("Email invalide").trim().toLowerCase(),
    password: z
      .string()
      .min(8, "8 caractères minimum")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Doit contenir majuscule, minuscule et chiffre"
      ),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isLoading, error, fieldErrors, user, emailPreviewUrl } = useAppSelector((s) => s.auth);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  const {
    register,
    handleSubmit,
    setError,
    getValues,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (user && !registered) {
      setRegistered(true);
      setRegisteredEmail(user.email);
      toast.success("Compte créé avec succès !");
    }
  }, [user, registered]);

  useEffect(() => {
    fieldErrors?.forEach(({ field, message }) => {
      if (field === "name" || field === "email" || field === "password") {
        setError(field, { message });
      }
    });
  }, [fieldErrors, setError]);

  useEffect(() => {
    if (error && !fieldErrors) toast.error(error);
    return () => {
      dispatch(clearErrors());
    };
  }, [error, fieldErrors, dispatch]);

  const onSubmit = (values) => {
    dispatch(
      registerUser({ name: values.name, email: values.email, password: values.password })
    );
  };

  // Écran de succès après inscription
  if (registered) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg text-center">
          <CardHeader>
            <div className="flex items-center justify-center gap-2 mb-2">
              <MapPin className="h-7 w-7 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">
                Lost<span className="text-blue-600">&amp;</span>Found
              </span>
            </div>
            <CardTitle className="text-xl">Vérifiez votre email</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 py-2">
            <Mail className="h-14 w-14 text-blue-500 mx-auto" />
            <p className="text-gray-700">
              Un email de confirmation a été envoyé à{" "}
              <span className="font-semibold text-blue-600">{registeredEmail}</span>.
            </p>
            <p className="text-sm text-muted-foreground">
              Cliquez sur le lien dans l'email pour activer votre compte. Le lien expire dans{" "}
              <strong>24 heures</strong>.
            </p>

            {/* Lien Ethereal en mode dev — uniquement si SMTP n'est pas configuré */}
            {emailPreviewUrl && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left space-y-2">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                  Mode développement — Email simulé
                </p>
                <p className="text-sm text-amber-800">
                  Aucun vrai email n'a été envoyé. Consultez l'aperçu Ethereal pour voir l'email :
                </p>
                <a
                  href={emailPreviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline break-all"
                >
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  Voir l'email sur Ethereal
                </a>
              </div>
            )}

            <Button className="w-full" onClick={() => router.push("/auth/login")}>
              Aller à la connexion
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <MapPin className="h-7 w-7 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">
              Lost<span className="text-blue-600">&amp;</span>Found
            </span>
          </div>
          <CardTitle className="text-xl">Créer un compte</CardTitle>
          <CardDescription>Rejoignez la plateforme Lost &amp; Found Tunisie</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nom complet</Label>
              <Input
                id="name"
                placeholder="Ahmed Ben Ali"
                autoComplete="name"
                {...register("name")}
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && (
                <p className="text-xs text-destructive" role="alert">
                  {errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Adresse email</Label>
              <Input
                id="email"
                type="email"
                placeholder="ahmed@example.com"
                autoComplete="email"
                {...register("email")}
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && (
                <p className="text-xs text-destructive" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPwd ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  {...register("password")}
                  className={errors.password ? "border-destructive pr-10" : "pr-10"}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password ? (
                <p className="text-xs text-destructive" role="alert">
                  {errors.password.message}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  8 caractères min, majuscule, minuscule et chiffre
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  {...register("confirmPassword")}
                  className={errors.confirmPassword ? "border-destructive pr-10" : "pr-10"}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-destructive" role="alert">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
            <Button type="submit" size="lg" disabled={isLoading} className="w-full mt-2">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Création en cours…
                </>
              ) : (
                "Créer mon compte"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center text-sm text-muted-foreground">
          Déjà un compte ?&nbsp;
          <Link href="/auth/login" className="text-blue-600 hover:underline font-medium">
            Se connecter
          </Link>
        </CardFooter>
      </Card>
    </main>
  );
}
