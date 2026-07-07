"use client";

import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Eye, EyeOff, MapPin, Loader2, CheckCircle, XCircle } from "lucide-react";
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
import { authApi } from "@/lib/api/auth.api";

const schema = z
  .object({
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

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | success | error
  const [errorMessage, setErrorMessage] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  if (!token) {
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
            <CardTitle className="text-xl">Lien invalide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 py-4">
            <XCircle className="h-12 w-12 text-red-500 mx-auto" />
            <p className="text-gray-700">Ce lien de réinitialisation est invalide ou manquant.</p>
            <Button className="w-full" asChild>
              <Link href="/auth/forgot-password">Demander un nouveau lien</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const onSubmit = async (values) => {
    setIsLoading(true);
    try {
      await authApi.resetPassword({
        token,
        password: values.password,
        confirmPassword: values.confirmPassword,
      });
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
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <MapPin className="h-7 w-7 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">
              Lost<span className="text-blue-600">&amp;</span>Found
            </span>
          </div>
          <CardTitle className="text-xl">Nouveau mot de passe</CardTitle>
          <CardDescription>Choisissez un mot de passe sécurisé</CardDescription>
        </CardHeader>

        <CardContent>
          {status === "success" && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <CheckCircle className="h-12 w-12 text-green-500" />
              <p className="text-gray-700 font-medium">Mot de passe réinitialisé !</p>
              <p className="text-sm text-muted-foreground">
                Vous allez être redirigé vers la page de connexion…
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <XCircle className="h-12 w-12 text-red-500" />
              <p className="text-gray-700 font-medium">{errorMessage}</p>
              <Button className="w-full" asChild>
                <Link href="/auth/forgot-password">Demander un nouveau lien</Link>
              </Button>
            </div>
          )}

          {status === "idle" && (
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="password">Nouveau mot de passe</Label>
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
                    Réinitialisation…
                  </>
                ) : (
                  "Réinitialiser le mot de passe"
                )}
              </Button>
            </form>
          )}
        </CardContent>

        {status === "idle" && (
          <CardFooter className="justify-center text-sm text-muted-foreground">
            Vous vous souvenez ?&nbsp;
            <Link href="/auth/login" className="text-blue-600 hover:underline font-medium">
              Se connecter
            </Link>
          </CardFooter>
        )}
      </Card>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  );
}