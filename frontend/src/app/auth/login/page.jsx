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
import { loginUser, clearErrors } from "@/store/slices/authSlice";

const schema = z.object({
  email: z.string().email("Email invalide").trim().toLowerCase(),
  password: z.string().min(1, "Mot de passe requis"),
});

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isLoading, error, fieldErrors, user } = useAppSelector((s) => s.auth);
  const [showPwd, setShowPwd] = useState(false);

  const { register, handleSubmit, setError, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (user) {
      toast.success("Connexion réussie !");
      router.push("/");
    }
  }, [user, router]);

  useEffect(() => {
    fieldErrors?.forEach(({ field, message }) => {
      if (field === "email" || field === "password") {
        setError(field, { message });
      }
    });
  }, [fieldErrors, setError]);

  useEffect(() => {
    if (error && !fieldErrors) toast.error(error);
    return () => { dispatch(clearErrors()); };
  }, [error, fieldErrors, dispatch]);

  const onSubmit = (values) => {
    dispatch(loginUser({ email: values.email, password: values.password }));
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
          <CardTitle className="text-xl">Se connecter</CardTitle>
          <CardDescription>Content de vous revoir</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Adresse email</Label>
              <Input id="email" type="email" placeholder="ahmed@example.com" autoComplete="email" {...register("email")} className={errors.email ? "border-destructive" : ""} />
              {errors.email && <p className="text-xs text-destructive" role="alert">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Mot de passe</Label>
                <Link href="/auth/forgot-password" className="text-xs text-blue-600 hover:underline">Mot de passe oublié ?</Link>
              </div>
              <div className="relative">
                <Input id="password" type={showPwd ? "text" : "password"} placeholder="••••••••" autoComplete="current-password" {...register("password")} className={errors.password ? "border-destructive pr-10" : "pr-10"} />
                <button type="button" onClick={() => setShowPwd((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive" role="alert">{errors.password.message}</p>}
            </div>
            <Button type="submit" size="lg" disabled={isLoading} className="w-full mt-2">
              {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" />Connexion en cours…</> : "Se connecter"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center text-sm text-muted-foreground">
          Pas encore de compte ?&nbsp;
          <Link href="/auth/register" className="text-blue-600 hover:underline font-medium">Créer un compte</Link>
        </CardFooter>
      </Card>
    </main>
  );
}
