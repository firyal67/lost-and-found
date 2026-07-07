"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import toast from "react-hot-toast";
import { MapPin, Loader2, Mail, ArrowLeft } from "lucide-react";
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

const schema = z.object({
  email: z.string().email("Email invalide").trim().toLowerCase(),
});

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

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
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <MapPin className="h-7 w-7 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">
              Lost<span className="text-blue-600">&amp;</span>Found
            </span>
          </div>
          <CardTitle className="text-xl">Mot de passe oublié</CardTitle>
          <CardDescription>
            Entrez votre email pour recevoir un lien de réinitialisation
          </CardDescription>
        </CardHeader>

        <CardContent>
          {submitted ? (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <Mail className="h-12 w-12 text-blue-500" />
              <p className="text-gray-700 font-medium">Email envoyé !</p>
              <p className="text-sm text-muted-foreground">
                Si un compte est associé à cette adresse, vous recevrez un lien
                de réinitialisation dans quelques minutes. Pensez à vérifier
                vos spams.
              </p>
              <Button
                variant="outline"
                className="w-full mt-2"
                asChild
              >
                <Link href="/auth/login">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour à la connexion
                </Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
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
              <Button type="submit" size="lg" disabled={isLoading} className="w-full mt-2">
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Envoi en cours…
                  </>
                ) : (
                  "Envoyer le lien"
                )}
              </Button>
            </form>
          )}
        </CardContent>

        {!submitted && (
          <CardFooter className="justify-center text-sm text-muted-foreground">
            <Link
              href="/auth/login"
              className="flex items-center gap-1 text-blue-600 hover:underline font-medium"
            >
              <ArrowLeft className="h-3 w-3" />
              Retour à la connexion
            </Link>
          </CardFooter>
        )}
      </Card>
    </main>
  );
}
