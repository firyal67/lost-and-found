"use client";

import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-6">
      <div className="text-center max-w-2xl">
        <div className="flex items-center justify-center gap-2 mb-6">
          <MapPin className="h-10 w-10 text-blue-600" />
          <h1 className="text-4xl font-bold text-gray-900">
            Lost<span className="text-blue-600">&amp;</span>Found
          </h1>
        </div>
        <p className="text-xl text-gray-600 mb-2">Tunisie</p>
        <p className="text-gray-500 mb-10">
          Plateforme de mise en relation pour objets perdus et trouvés
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            onClick={() => router.push("/auth/register")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3"
          >
            Créer un compte
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => router.push("/auth/login")}
            className="border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold px-6 py-3"
          >
            Se connecter
          </Button>
        </div>
      </div>
    </main>
  );
}
