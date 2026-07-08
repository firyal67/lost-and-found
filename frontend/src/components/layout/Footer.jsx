import Link from "next/link";
import { MapPin } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/60 bg-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">

          {/* ── Brand ── */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-7 h-7 rounded-md bg-blue-600 shadow-sm">
                <MapPin className="h-4 w-4 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-bold text-gray-900 tracking-tight">
                Lost<span className="text-blue-600">&amp;</span>Found
              </span>
              <span className="text-xs font-medium text-gray-400 bg-gray-100 rounded-full px-2 py-0.5 leading-none">
                Tunisie
              </span>
            </div>
            <p className="text-xs text-gray-400 max-w-[220px]">
              Retrouvez vos objets perdus ou aidez quelqu'un à retrouver les siens.
            </p>
          </div>

          {/* ── Links ── */}
          <nav className="flex items-center gap-6 text-sm">
            <Link
              href="/posts"
              className="text-gray-500 hover:text-gray-900 font-medium transition-colors"
            >
              Annonces
            </Link>
            <Link
              href="/auth/login"
              className="text-gray-500 hover:text-gray-900 font-medium transition-colors"
            >
              Connexion
            </Link>
            <Link
              href="/auth/register"
              className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
            >
              S'inscrire
            </Link>
          </nav>
        </div>

        {/* ── Divider + copyright ── */}
        <div className="mt-8 pt-6 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-400">
            © {year} Lost&amp;Found Tunisie. Tous droits réservés.
          </p>
          <p className="text-xs text-gray-300">
            Fait avec ♥ en Tunisie
          </p>
        </div>
      </div>
    </footer>
  );
}
