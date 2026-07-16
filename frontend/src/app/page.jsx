"use client";

import Link from "next/link";
import { Search, PlusCircle, CheckCircle, ArrowRight, Shield, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageContainer from "@/components/layout/PageContainer";
import { useAppSelector } from "@/store/hooks";

/* ── Shared style tokens ──────────────────── */
const C = {
  canvas:   "#0d0f14",
  surface:  "#13161e",
  elevated: "#1a1e28",
  border:   "rgba(255,255,255,0.08)",
  borderS:  "rgba(255,255,255,0.05)",
  accent:   "#4f8ef7",
  accentHov:"#7aabfa",
  accentSub:"rgba(79,142,247,0.10)",
  accentBdr:"rgba(79,142,247,0.22)",
  ink:      "#f0f2f8",
  inkSec:   "#b8bdd0",
  inkMut:   "#6b7494",
  inkDis:   "#3d4460",
};

const STATS = [
  { label: "Annonces publiées", value: "1 200+" },
  { label: "Objets retrouvés",  value: "340+" },
  { label: "Utilisateurs",      value: "800+" },
];

const STEPS = [
  {
    icon: <PlusCircle className="h-5 w-5" style={{ color: C.accent }} />,
    step: "01",
    title: "Déclarez",
    desc: "Publiez une annonce pour un objet perdu ou trouvé en quelques secondes, avec photo et localisation.",
  },
  {
    icon: <Search className="h-5 w-5" style={{ color: C.accent }} />,
    step: "02",
    title: "Recherchez",
    desc: "Parcourez les annonces par ville, catégorie ou date et trouvez une correspondance instantanément.",
  },
  {
    icon: <CheckCircle className="h-5 w-5" style={{ color: C.accent }} />,
    step: "03",
    title: "Contactez",
    desc: "Échangez via la plateforme en toute sécurité et organisez la restitution de l'objet.",
  },
];

const TRUST = [
  {
    icon: <Shield className="h-5 w-5" style={{ color: C.accent }} />,
    title: "Gratuit & sécurisé",
    desc: "Aucun frais, aucune donnée vendue. Votre confidentialité est notre priorité.",
  },
  {
    icon: <Users className="h-5 w-5" style={{ color: C.accent }} />,
    title: "Communauté active",
    desc: "Des centaines de Tunisiens s'entraident chaque jour sur la plateforme.",
  },
  {
    icon: <Zap className="h-5 w-5" style={{ color: C.accent }} />,
    title: "Résultats prouvés",
    desc: "Plus de 340 objets ont déjà été retrouvés grâce à notre réseau.",
  },
];

export default function HomePage() {
  const { user } = useAppSelector((s) => s.auth);

  return (
    <>
      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden"
        style={{ background: C.canvas }}
      >
        {/* Background glows */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full"
            style={{ background: "radial-gradient(ellipse, rgba(79,142,247,0.10) 0%, transparent 70%)" }} />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(79,142,247,0.05) 0%, transparent 70%)" }} />
          {/* Grid */}
          <div className="absolute inset-0 opacity-[0.028]"
            style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
              backgroundSize: "56px 56px",
            }}
          />
        </div>

        <PageContainer>
          <div className="py-28 sm:py-36 flex flex-col items-center text-center max-w-4xl mx-auto">

            {/* Eyebrow badge */}
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8 text-[11px] font-[600] tracking-[0.07em] uppercase"
              style={{
                color: C.accent,
                background: C.accentSub,
                border: `1px solid ${C.accentBdr}`,
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: C.accent }} />
              Plateforme tunisienne
            </div>

            {/* Headline */}
            <h1
              className="font-sans font-[700] text-[44px] sm:text-[54px] leading-[1.06] tracking-[-0.03em] mb-6 max-w-3xl"
              style={{ color: C.ink }}
            >
              Retrouvez ce qui{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, #4f8ef7 0%, #a5c7fc 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                compte pour vous
              </span>
            </h1>

            {/* Sub */}
            <p
              className="font-sans text-[18px] leading-[1.65] mb-10 max-w-2xl"
              style={{ color: C.inkSec }}
            >
              Lost&amp;Found Tunisie connecte les personnes ayant perdu un objet
              avec celles qui l'ont trouvé — simplement, rapidement, gratuitement.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="xl" asChild>
                <Link href="/posts/new" className="gap-2">
                  <PlusCircle className="h-4.5 w-4.5" />
                  Déclarer un objet
                </Link>
              </Button>
              <Button variant="secondary" size="xl" asChild>
                <Link href="/posts" className="gap-2">
                  <Search className="h-4.5 w-4.5" />
                  Parcourir les annonces
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Stats strip */}
            <div
              className="flex items-center gap-10 mt-14 pt-10"
              style={{ borderTop: `1px solid ${C.borderS}` }}
            >
              {STATS.map(({ label, value }) => (
                <div key={label} className="text-center">
                  <p
                    className="font-sans font-[700] text-[26px] tracking-[-0.02em]"
                    style={{ color: C.ink }}
                  >
                    {value}
                  </p>
                  <p
                    className="text-[12px] font-[500] mt-0.5 tracking-[0.02em]"
                    style={{ color: C.inkMut }}
                  >
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </PageContainer>
      </section>

      {/* ══════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════ */}
      <section
        className="py-24"
        style={{
          background: C.surface,
          borderTop:    `1px solid ${C.borderS}`,
          borderBottom: `1px solid ${C.borderS}`,
        }}
      >
        <PageContainer>
          <div className="text-center mb-14">
            <p
              className="text-[11px] font-[600] uppercase tracking-[0.08em] mb-3"
              style={{ color: C.accent }}
            >
              Comment ça marche
            </p>
            <h2
              className="font-sans font-[700] text-[32px] tracking-[-0.025em] mb-3"
              style={{ color: C.ink }}
            >
              Trois étapes, c&apos;est tout
            </h2>
            <p
              className="text-[16px] leading-[1.65] max-w-xl mx-auto"
              style={{ color: C.inkSec }}
            >
              Déclarer, rechercher et contacter — le processus est conçu pour être
              aussi simple que possible.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {STEPS.map(({ icon, step, title, desc }) => (
              <div
                key={step}
                className="relative flex flex-col items-start p-7 rounded-xl transition-all duration-200 group"
                style={{
                  background: C.elevated,
                  border: `1px solid ${C.border}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = C.accentBdr;
                  e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,0,0,0.40)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = C.border;
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {/* Step number */}
                <span
                  className="absolute top-5 right-5 font-[700] text-[28px] tracking-[-0.02em] select-none leading-none"
                  style={{ color: "rgba(255,255,255,0.04)" }}
                >
                  {step}
                </span>
                {/* Icon */}
                <div
                  className="mb-5 flex items-center justify-center w-11 h-11 rounded-lg"
                  style={{ background: C.accentSub, border: `1px solid ${C.accentBdr}` }}
                >
                  {icon}
                </div>
                <h3
                  className="font-sans font-[600] text-[17px] tracking-[-0.01em] mb-2"
                  style={{ color: C.ink }}
                >
                  {title}
                </h3>
                <p className="text-[14px] leading-[1.65]" style={{ color: C.inkSec }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </PageContainer>
      </section>

      {/* ══════════════════════════════════════════
          TRUST
      ══════════════════════════════════════════ */}
      <section className="py-20" style={{ background: C.canvas }}>
        <PageContainer>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {TRUST.map(({ icon, title, desc }) => (
              <div key={title} className="flex flex-col items-center text-center gap-4 px-4">
                <div
                  className="flex items-center justify-center w-12 h-12 rounded-xl"
                  style={{
                    background: C.elevated,
                    border: `1px solid ${C.border}`,
                  }}
                >
                  {icon}
                </div>
                <h3
                  className="font-sans font-[600] text-[17px] tracking-[-0.01em]"
                  style={{ color: C.ink }}
                >
                  {title}
                </h3>
                <p className="text-[14px] leading-[1.65] max-w-xs" style={{ color: C.inkSec }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </PageContainer>
      </section>

      {/* ══════════════════════════════════════════
          CTA BOTTOM
      ══════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden py-24"
        style={{
          background: C.surface,
          borderTop: `1px solid ${C.borderS}`,
        }}
      >
        {/* Glow */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full"
            style={{ background: "radial-gradient(ellipse, rgba(79,142,247,0.08) 0%, transparent 70%)" }} />
        </div>

        <PageContainer>
          <div className="flex flex-col items-center text-center gap-6 max-w-2xl mx-auto">
            <h2
              className="font-sans font-[700] text-[32px] tracking-[-0.025em]"
              style={{ color: C.ink }}
            >
              Vous avez perdu ou trouvé quelque chose ?
            </h2>
            <p className="text-[16px] leading-[1.65] max-w-xl" style={{ color: C.inkSec }}>
              {user
                ? "Publiez une annonce ou parcourez les annonces existantes pour retrouver vos objets."
                : "Rejoignez la communauté Lost&Found Tunisie et contribuez à réunir les gens avec leurs affaires."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-2">
              {user ? (
                <Button size="xl" asChild>
                  <Link href="/posts/new" className="gap-2">
                    <PlusCircle className="h-4 w-4" />
                    Publier une annonce
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <Button size="xl" asChild>
                  <Link href="/auth/register" className="gap-2">
                    Créer un compte gratuit
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              )}
              <Button variant="secondary" size="xl" asChild>
                <Link href="/posts">Voir les annonces</Link>
              </Button>
            </div>
          </div>
        </PageContainer>
      </section>
    </>
  );
}
