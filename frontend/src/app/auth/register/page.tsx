"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Eye, EyeOff, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { registerUser, clearErrors } from "@/store/slices/authSlice";

const registerSchema = z
  .object({
    name: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(50).trim(),
    email: z.string().email("Adresse email invalide").trim().toLowerCase(),
    password: z
      .string()
      .min(8, "8 caractères minimum")
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Doit contenir majuscule, minuscule et chiffre"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isLoading, error, fieldErrors, user } = useAppSelector((s) => s.auth);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { register, handleSubmit, setError, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  useEffect(() => {
    if (user) {
      toast.success("Compte créé avec succès !");
      router.push("/");
    }
  }, [user, router]);

  useEffect(() => {
    if (fieldErrors) {
      fieldErrors.forEach(({ field, message }) => {
        if (field === "name" || field === "email" || field === "password") {
          setError(field, { message });
        }
      });
    }
  }, [fieldErrors, setError]);

  useEffect(() => {
    if (error && !fieldErrors) toast.error(error);
    return () => { dispatch(clearErrors()); };
  }, [error, fieldErrors, dispatch]);

  const onSubmit = (values: RegisterFormValues) => {
    dispatch(registerUser({ name: values.name, email: values.email, password: values.password }));
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
          <CardTitle className="text-xl">Créer un compte</CardTitle>
          <CardDescription>Rejoignez la plateforme</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nom complet</Label>
              <Input id="name" placeholder="Ahmed Ben Ali" autoComplete="name" aria-invalid={!!errors.name} {...register("name")} className={errors.name ? "border-destructive" : ""} />
              {errors.name && <p className="text-xs text-destructive" role="alert">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Adresse email</Label>
              <Input id="email" type="email" placeholder="ahmed@example.com" autoComplete="email" aria-invalid={!!errors.email} {...register("email")} className={errors.email ? "border-destructive" : ""} />
              {errors.email && <p className="text-xs text-destructive" role="alert">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" autoComplete="new-password" aria-invalid={!!errors.password} {...register("password")} className={errors.password ? "border-destructive pr-10" : "pr-10"} />
                <button type="button" aria-label={showPassword ? "Masquer" : "Afficher"} onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password ? (
                <p className="text-xs text-destructive" role="alert">{errors.password.message}</p>
              ) : (
                <p className="text-xs text-muted-foreground">8 caractères min, majuscule, minuscule et chiffre</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <div className="relative">
                <Input id="confirmPassword" type={showConfirm ? "text" : "password"} placeholder="••••••••" autoComplete="new-password" aria-invalid={!!errors.confirmPassword} {...register("confirmPassword")} className={errors.confirmPassword ? "border-destructive pr-10" : "pr-10"} />
                <button type="button" aria-label={showConfirm ? "Masquer" : "Afficher"} onClick={() => setShowConfirm((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-xs text-destructive" role="alert">{errors.confirmPassword.message}</p>}
            </div>
            <Button type="submit" size="lg" disabled={isLoading} className="w-full mt-2">
              {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" />Création en cours…</> : "Créer mon compte"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center text-sm text-muted-foreground">
          Déjà un compte ?&nbsp;
          <Link href="/auth/login" className="text-blue-600 hover:underline font-medium">Se connecter</Link>
        </CardFooter>
      </Card>
    </main>
  );
}
