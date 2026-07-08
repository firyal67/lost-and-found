import Link from "next/link";
import { MapPin, Search, PlusCircle, CheckCircle, ArrowRight, Shield, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageContainer from "@/components/layout/PageContainer";

export default function HomePage() {
  return (
    <>
      {/* ════════════════════════════════════════
          HERO
      ════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-white">
        {/* Decorative background blobs */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full bg-blue-100/60 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full bg-indigo-100/50 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-blue-50/40 blur-3xl" />
        </div>

        <PageContainer>
          <div className="py-24 sm:py-32 flex flex-col items-center text-center max-w-4xl mx-auto">

            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-full px-4 py-1.5 mb-8">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-xs font-semibold text-blue-700 tracking-wide uppercase">
                Plateforme tunisienne
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-gray-900 leading-[1.1] mb-6">
              Retrouvez ce qui{" "}
              <span className="text-blue-600">compte pour vous</span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mb-10 leading-relaxed">
              Lost&amp;Found Tunisie connecte les personnes ayant perdu un objet
              avec celles qui l'ont trouvé — simplement, rapidement, gratuitement.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="xl" asChild className="gap-2 shadow-md hover:shadow-lg transition-shadow">
                <Link href="/posts/new">
                  <PlusCircle className="h-5 w-5" />
                  Déclarer un objet
                </Link>
              </Button>
              <Button size="xl" variant="outline" asChild className="gap-2">
                <Link href="/posts">
                  <Search className="h-5 w-5" />
                  Parcourir les annonces
                  <ArrowRight className="h-4 w-4 opacity-60" />
                </Link>
              </Button>
            </div>

            {/* Social proof micro-row */}
            <div className="flex items-center gap-6 mt-12 pt-8 border-t border-border/50 text-sm text-gray-400">
              {[
                { label: "Annonces publiées", value: "1 200+" },
                { label: "Objets retrouvés",  value: "340+"   },
                { label: "Utilisateurs",       value: "800+"   },
              ].map(({ label, value }) => (
                <div key={label} className="text-center">
                  <p className="text-2xl font-bold text-gray-800">{value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </PageContainer>
      </section>

      {/* ════════════════════════════════════════
          HOW IT WORKS
      ════════════════════════════════════════ */}
      <section className="py-20 bg-gray-50/70 border-y border-border/50">
        <PageContainer>
          {/* Section label */}
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-3">
              Comment ça marche
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              Trois étapes, c'est tout
            </h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto text-base">
              Déclarer, rechercher et contacter — le processus est conçu pour être
              aussi simple que possible.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Connector line (desktop) */}
            <div
              aria-hidden
              className="hidden md:block absolute top-12 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent"
            />

            {[
              {
                icon:  <PlusCircle className="h-6 w-6 text-blue-600" />,
                step:  "01",
                title: "Déclarez",
                desc:  "Publiez une annonce pour un objet perdu ou trouvé en quelques secondes, avec photo et localisation.",
                color: "bg-blue-50 text-blue-600",
              },
              {
                icon:  <Search className="h-6 w-6 text-indigo-600" />,
                step:  "02",
                title: "Recherchez",
                desc:  "Parcourez les annonces par ville, catégorie ou date et trouvez une correspondance instantanément.",
                color: "bg-indigo-50 text-indigo-600",
              },
              {
                icon:  <CheckCircle className="h-6 w-6 text-emerald-600" />,
                step:  "03",
                title: "Contactez",
                desc:  "Échangez via la plateforme en toute sécurité et organisez la restitution de l'objet.",
                color: "bg-emerald-50 text-emerald-600",
              },
            ].map(({ icon, step, title, desc, color }) => (
              <div
                key={step}
                className="relative flex flex-col items-center text-center p-8 rounded-2xl bg-white border border-border/60 shadow-card hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                {/* Step number */}
                <span className="absolute top-4 right-5 text-xs font-bold text-gray-200 tracking-widest select-none">
                  {step}
                </span>
                {/* Icon badge */}
                <div className={`mb-5 flex items-center justify-center w-14 h-14 rounded-2xl ${color}`}>
                  {icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </PageContainer>
      </section>

      {/* ════════════════════════════════════════
          TRUST STRIP
      ════════════════════════════════════════ */}
      <section className="py-14 bg-white border-b border-border/50">
        <PageContainer>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            {[
              {
                icon:  <Shield className="h-7 w-7 text-blue-600" />,
                title: "Gratuit & sécurisé",
                desc:  "Aucun frais, aucune donnée vendue. Votre confidentialité est notre priorité.",
              },
              {
                icon:  <Users className="h-7 w-7 text-indigo-600" />,
                title: "Communauté active",
                desc:  "Des centaines de Tunisiens s'entraident chaque jour sur la plateforme.",
              },
              {
                icon:  <CheckCircle className="h-7 w-7 text-emerald-600" />,
                title: "Résultats prouvés",
                desc:  "Plus de 340 objets ont déjà été retrouvés grâce à notre réseau.",
              },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="flex flex-col items-center gap-3 px-4">
                <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gray-50 border border-border/60">
                  {icon}
                </div>
                <h3 className="font-bold text-gray-900">{title}</h3>
                <p className="text-sm text-gray-500 max-w-xs">{desc}</p>
              </div>
            ))}
          </div>
        </PageContainer>
      </section>

      {/* ════════════════════════════════════════
          CTA BOTTOM
      ════════════════════════════════════════ */}
      <section className="relative overflow-hidden py-20">
        {/* Gradient background */}
        <div aria-hidden className="absolute inset-0 -z-10 bg-blue-600 opacity-95" />
        {/* Subtle mesh */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 25% 50%, white 1px, transparent 1px), radial-gradient(circle at 75% 50%, white 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <PageContainer>
          <div className="flex flex-col items-center text-center text-white gap-6 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Vous avez perdu ou trouvé quelque chose ?
            </h2>
            <p className="text-blue-100 text-base sm:text-lg max-w-xl">
              Rejoignez la communauté Lost&amp;Found Tunisie et contribuez à
              réunir les gens avec leurs affaires.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="xl"
                asChild
                className="bg-white text-blue-700 hover:bg-blue-50 shadow-lg font-bold gap-2"
              >
                <Link href="/auth/register">
                  Créer un compte gratuit
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="xl"
                variant="ghost"
                asChild
                className="text-white hover:bg-white/15 border border-white/30"
              >
                <Link href="/posts">Voir les annonces</Link>
              </Button>
            </div>
          </div>
        </PageContainer>
      </section>
    </>
  );
}
