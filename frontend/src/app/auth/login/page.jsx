"use client";

import { Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { loginUser, clearErrors } from "@/store/slices/authSlice";
import {
  AuthBrandPanel, MobileLogo, FormField, PasswordInput, AuthFormCard,
} from "@/components/auth/AuthShared";

const schema = z.object({
  email:    z.string().email("Email invalide").trim().toLowerCase(),
  password: z.string().min(1, "Mot de passe requis"),
});

function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const dispatch     = useAppDispatch();
  const { isLoading, error, fieldErrors, user } = useAppSelector((s) => s.auth);
  const [showPwd, setShowPwd] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (user) {
      toast.success("Connexion réussie !");
      router.push(searchParams.get("redirect") || "/");
    }
  }, [user, router, searchParams]);

  useEffect(() => {
    fieldErrors?.forEach(({ field, message }) => {
      if (field === "email" || field === "password") setError(field, { message });
    });
  }, [fieldErrors, setError]);

  useEffect(() => {
    if (error && !fieldErrors) toast.error(error);
    return () => { dispatch(clearErrors()); };
  }, [error, fieldErrors, dispatch]);

  const onSubmit = (values) =>
    dispatch(loginUser({ email: values.email, password: values.password }));

  return (
    <main
      className="min-h-screen flex"
      style={{ background: "#0d0f14" }}
    >
      <AuthBrandPanel
        title="Bon retour parmi nous !"
        subtitle="Connectez-vous pour retrouver vos objets et gérer vos annonces."
        bullets={[
          "Accédez à toutes vos annonces",
          "Suivez l'état de vos déclarations",
          "Contactez d'autres utilisateurs",
        ]}
      />

      {/* Right — form */}
      <div className="flex flex-1 items-center justify-center p-6 sm:p-10" style={{ background: "#0d0f14" }}>
        <div className="w-full max-w-[420px]">
          <MobileLogo />

          <AuthFormCard>
            {/* Heading */}
            <div className="mb-8">
              <h1
                className="font-sans font-[700] text-[24px] tracking-[-0.02em]"
                style={{ color: "#f0f2f8" }}
              >
                Se connecter
              </h1>
              <p className="text-[14px] mt-1" style={{ color: "#6b7494" }}>
                Content de vous revoir
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
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
                labelRight={
                  <Link
                    href="/auth/forgot-password"
                    className="text-[12px] font-[500] transition-colors"
                    style={{ color: "#4f8ef7" }}
                  >
                    Mot de passe oublié ?
                  </Link>
                }
              >
                <PasswordInput
                  id="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  show={showPwd}
                  onToggle={() => setShowPwd((v) => !v)}
                  hasError={!!errors.password}
                  {...register("password")}
                />
              </FormField>

              <Button
                type="submit"
                size="lg"
                disabled={isLoading}
                className="w-full mt-1"
              >
                {isLoading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Connexion…</>
                ) : (
                  "Se connecter"
                )}
              </Button>
            </form>
          </AuthFormCard>

          <p
            className="text-center text-[13px] mt-5"
            style={{ color: "#6b7494" }}
          >
            Pas encore de compte ?{" "}
            <Link
              href="/auth/register"
              className="font-[500] transition-colors"
              style={{ color: "#4f8ef7" }}
            >
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
