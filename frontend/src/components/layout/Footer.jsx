import Link from "next/link";
import { Search, Heart } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      style={{
        borderTop: "1px solid rgba(255,255,255,0.07)",
        background: "#0d0f14",
        marginTop: "auto",
      }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">

        {/* Top row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-10">

          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div
                className="flex items-center justify-center w-8 h-8 rounded-lg"
                style={{
                  background: "linear-gradient(135deg, #4f8ef7, #3a7ae4)",
                  boxShadow: "0 0 14px rgba(79,142,247,0.22)",
                }}
              >
                <Search className="h-4 w-4 text-white" strokeWidth={2.5} />
              </div>
              <span
                className="font-sans font-[700] text-[18px] tracking-[-0.02em]"
                style={{ color: "#f0f2f8" }}
              >
                Lost<span style={{ color: "#4f8ef7" }}>&amp;</span>Found
              </span>
              <span
                className="text-[11px] font-[600] tracking-[0.07em] uppercase rounded-full px-2.5 py-0.5 leading-none"
                style={{
                  color: "#4f8ef7",
                  background: "rgba(79,142,247,0.10)",
                  border: "1px solid rgba(79,142,247,0.20)",
                }}
              >
                Tunisie
              </span>
            </div>
            <p className="text-[14px] leading-[1.65]" style={{ color: "#6b7494", maxWidth: "300px" }}>
              Retrouvez vos objets perdus ou aidez quelqu&apos;un à retrouver les siens.
              Une plateforme tunisienne gratuite et solidaire.
            </p>
          </div>

          {/* Nav links */}
          <nav className="flex items-center gap-8">
            {[
              { href: "/posts",          label: "Annonces" },
              { href: "/auth/login",     label: "Connexion" },
              { href: "/auth/register",  label: "S'inscrire", accent: true },
            ].map(({ href, label, accent }) => (
              <Link
                key={href}
                href={href}
                className="text-[14px] font-[500] transition-colors duration-150"
                style={{ color: accent ? "#4f8ef7" : "#6b7494" }}
                onMouseEnter={(e) => e.currentTarget.style.color = accent ? "#7aabfa" : "#b8bdd0"}
                onMouseLeave={(e) => e.currentTarget.style.color = accent ? "#4f8ef7" : "#6b7494"}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Divider */}
        <div
          className="mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <p className="text-[12px]" style={{ color: "#3d4460" }}>
            &copy; {year} Lost&amp;Found Tunisie. Tous droits réservés.
          </p>
          <p className="text-[12px] flex items-center gap-1.5" style={{ color: "#3d4460" }}>
            Fait avec <Heart className="h-3 w-3" style={{ color: "#f87171" }} /> en Tunisie
          </p>
        </div>
      </div>
    </footer>
  );
}
