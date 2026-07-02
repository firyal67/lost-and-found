"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

// US-02 — Login page (to be implemented)
export default function LoginPage() {
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
          <CardTitle className="text-xl">Se connecter</CardTitle>
          <CardDescription>Connexion disponible dans le prochain sprint (US-02)</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">🚧 En cours de développement</p>
        </CardContent>
        <CardFooter className="justify-center text-sm text-muted-foreground">
          Pas encore de compte ?&nbsp;
          <Link href="/auth/register" className="text-blue-600 hover:underline font-medium">Créer un compte</Link>
        </CardFooter>
      </Card>
    </main>
  );
}
