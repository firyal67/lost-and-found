"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { MapPin, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState("loading"); // loading | success | error
  const [message, setMessage] = useState("");
  const hasVerified = useRef(false); // empêche le double appel en Strict Mode

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Lien de vérification invalide ou manquant.");
      return;
    }

    // React Strict Mode monte/démonte deux fois en dev — on ignore le second appel
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
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg text-center">
        <CardHeader>
          <div className="flex items-center justify-center gap-2 mb-2">
            <MapPin className="h-7 w-7 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">
              Lost<span className="text-blue-600">&amp;</span>Found
            </span>
          </div>
          <CardTitle className="text-xl">Vérification de l'email</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {status === "loading" && (
            <div className="flex flex-col items-center gap-3 py-4">
              <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
              <CardDescription>Vérification en cours…</CardDescription>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center gap-3 py-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
              <p className="text-gray-700 font-medium">{message}</p>
              <Button className="w-full mt-2" onClick={() => router.push("/auth/login")}>
                Se connecter
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center gap-3 py-4">
              <XCircle className="h-12 w-12 text-red-500" />
              <p className="text-gray-700 font-medium">{message}</p>
              <p className="text-sm text-muted-foreground">
                Le lien a peut-être expiré.{" "}
                <Link href="/auth/login" className="text-blue-600 hover:underline">
                  Connectez-vous
                </Link>{" "}
                pour en demander un nouveau.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}