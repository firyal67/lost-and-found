import Link from "next/link";
import { MapPin } from "lucide-react";

export default function HomePage() {
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
          <Link
            href="/auth/register"
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Créer un compte
          </Link>
          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center gap-2 border border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Se connecter
          </Link>
        </div>
      </div>
    </main>
  );
}
