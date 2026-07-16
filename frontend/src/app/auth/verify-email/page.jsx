"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AuthBrandPanel, MobileLogo, AuthFormCard,
} from "@/components/auth/AuthShared";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const hasVerified = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Lien de vérification invalide ou manquant.");
      return;
    }
    if (hasVerified.current) return;
    hasVerified.current = true;

    const verify = async () => {
      try {
        const res = await fetch(`/api/auth/verify-email/${token}`, { method: "GET" });
        const data = await res.json();
        if (res.ok) {
          setStatus("success");
          setMessage(data.message || "Email vérifié avec succès !");
        } else {
          setStatus("error");
          setMessage(data.message || "Lien invalide ou expiré.");
        }
      } catch {
        setStatus("error");
        setMessage("Erreur réseau. Veuillez réessayer.");
      }
    };
    verify();
  }, [token]);

  return (
    <main className="min-h-screen flex bg-app-bg">
      <AuthBrandPanel
        title="Vérification de l'email"
        subtitle="Nous vérifions votre adresse email pour activer votre compte."
        bullets={["Accès sécurisé à votre espace", "Notifications activées", "Profil prêt à l'emploi"]}
      />
      <div className="flex flex-1 items-center justify-center p-6 bg-app-bg">
        <div className="w-full max-w-md">
          <MobileLogo />
          <AuthFormCard>
            {status === "loading" && (
              <div className="flex flex-col items-center text-center gap-5 py-6">
                <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-primary-subtle">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
                <h2 className="font-slab text-h2 text-neutral-50">Vérification en cours…</h2>
                <p className="font-sans text-body text-neutral-200">Merci de patienter.</p>
              </div>
            )}
            {status === "success" && (
              <div className="flex flex-col items-center text-center gap-5 py-6">
                <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-primary-subtle">
                  <CheckCircle className="h-8 w-8 text-primary" />
                </div>
                <h2 className="font-slab text-h2 text-neutral-50">Email vérifié !</h2>
                <p className="font-sans text-body text-neutral-200">{message}</p>
                <Button size="lg" className="w-full" onClick={() => router.push("/auth/login")}>
                  Se connecter
                </Button>
              </div>
            )}
            {status === "error" && (
              <div className="flex flex-col items-center text-center gap-5 py-6">
                <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-destructive/10">
                  <XCircle className="h-8 w-8 text-destructive" />
                </div>
                <h2 className="font-slab text-h2 text-neutral-50">Vérification échouée</h2>
                <p className="font-sans text-body text-neutral-200">{message}</p>
                <p className="font-sans text-body-sm text-neutral-200">
                  Le lien a peut-être expiré.{" "}
                  <Link href="/auth/login" className="text-primary hover:text-primary-hover font-sans font-medium">
                    Connectez-vous
                  </Link>{" "}
                  pour en demander un nouveau.
                </p>
              </div>
            )}
          </AuthFormCard>
        </div>
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return <Suspense><VerifyEmailContent /></Suspense>;
}