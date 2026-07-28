"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MessageSquare, Flag, PlusCircle, FileText,
  LayoutDashboard, ChevronRight, Loader2, Users, BarChart2, ClipboardList,
} from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import PageContainer from "@/components/layout/PageContainer";

const C = {
  canvas:   "#0d0f14",
  surface:  "#13161e",
  elevated: "#1a1e28",
  border:   "rgba(255,255,255,0.08)",
  borderS:  "rgba(255,255,255,0.05)",
  ink:      "#f0f2f8",
  inkSec:   "#b8bdd0",
  inkMut:   "#6b7494",
  accent:   "#4f8ef7",
  success:  "#34d399",
  warning:  "#fbbf24",
  danger:   "#f87171",
  purple:   "#c084fc",
};

/* ── Nav card ────────────────────────────────────────────────────────────── */
function DashCard({ href, icon: Icon, iconColor, iconBg, iconBorder, title, description }) {
  return (
    <Link href={href}
      className="group flex items-center gap-4 p-5 rounded-xl transition-all duration-150"
      style={{ background: C.surface, border: `1px solid ${C.border}` }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(79,142,247,0.30)";
        e.currentTarget.style.boxShadow   = "0 8px 28px rgba(0,0,0,0.40)";
        e.currentTarget.style.transform   = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = C.border;
        e.currentTarget.style.boxShadow   = "none";
        e.currentTarget.style.transform   = "translateY(0)";
      }}>
      {/* Icon */}
      <div className="flex items-center justify-center w-12 h-12 rounded-xl shrink-0"
        style={{ background: iconBg, border: `1px solid ${iconBorder}` }}>
        <Icon className="h-5 w-5" style={{ color: iconColor }} />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="font-sans font-[700] text-[15px] tracking-[-0.01em]" style={{ color: C.ink }}>
          {title}
        </p>
        <p className="text-[13px] mt-0.5 leading-[1.5]" style={{ color: C.inkMut }}>
          {description}
        </p>
      </div>

      {/* Arrow */}
      <ChevronRight className="h-4 w-4 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5"
        style={{ color: C.inkMut }} />
    </Link>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const router = useRouter();
  const { user, isHydrating } = useAppSelector((s) => s.auth);

  useEffect(() => {
    if (!isHydrating && !user) router.push("/auth/login?redirect=/dashboard");
  }, [user, isHydrating, router]);

  if (isHydrating || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: C.canvas }}>
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: C.accent }} />
      </div>
    );
  }

  const isAdmin = user.role === "admin";

  const userCards = [
    {
      href: "/posts/new",
      icon: PlusCircle,
      iconColor: C.accent,
      iconBg:    "rgba(79,142,247,0.12)",
      iconBorder:"rgba(79,142,247,0.25)",
      title:       "Nouvelle annonce",
      description: "Publier une annonce d'objet perdu ou trouvé",
    },
    {
      href: "/posts",
      icon: FileText,
      iconColor: C.success,
      iconBg:    "rgba(52,211,153,0.10)",
      iconBorder:"rgba(52,211,153,0.22)",
      title:       "Annonces",
      description: "Parcourir toutes les annonces publiées",
    },
    {
      href: "/dashboard/contacts",
      icon: MessageSquare,
      iconColor: "#c084fc",
      iconBg:    "rgba(192,132,252,0.10)",
      iconBorder:"rgba(192,132,252,0.22)",
      title:       "Contacts",
      description: "Gérer vos demandes de contact reçues et envoyées",
    },
  ];

  const adminCards = [
    {
      href: "/dashboard/reports",
      icon: Flag,
      iconColor: C.warning,
      iconBg:    "rgba(251,191,36,0.10)",
      iconBorder:"rgba(251,191,36,0.25)",
      title:       "Signalements",
      description: "Modérer les annonces signalées par les utilisateurs",
    },
    {
      href: "/dashboard/admin/users",
      icon: Users,
      iconColor: C.danger,
      iconBg:    "rgba(248,113,113,0.10)",
      iconBorder:"rgba(248,113,113,0.22)",
      title:       "Utilisateurs",
      description: "Gérer les comptes et bannir les utilisateurs abusifs",
    },
    {
      href: "/dashboard/admin/metrics",
      icon: BarChart2,
      iconColor: C.purple ?? "#c084fc",
      iconBg:    "rgba(192,132,252,0.10)",
      iconBorder:"rgba(192,132,252,0.22)",
      title:       "Métriques",
      description: "Statistiques d'utilisation de la plateforme",
    },
    {
      href: "/dashboard/admin/audit-log",
      icon: ClipboardList,
      iconColor: C.accent,
      iconBg:    "rgba(79,142,247,0.10)",
      iconBorder:"rgba(79,142,247,0.22)",
      title:       "Journal d'audit",
      description: "Traçabilité de toutes les actions de modération",
    },
  ];

  return (
    <div className="min-h-screen" style={{ background: C.canvas }}>
      <PageContainer>
        <div className="py-10 max-w-2xl mx-auto">

          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="flex items-center justify-center w-11 h-11 rounded-xl shrink-0"
              style={{ background: "rgba(79,142,247,0.12)", border: "1px solid rgba(79,142,247,0.25)" }}>
              <LayoutDashboard className="h-5 w-5" style={{ color: C.accent }} />
            </div>
            <div>
              <h1 className="font-sans font-[700] text-[24px] tracking-[-0.025em]" style={{ color: C.ink }}>
                Dashboard
              </h1>
              <p className="text-[13px] mt-0.5" style={{ color: C.inkMut }}>
                Bonjour, <strong style={{ color: C.inkSec }}>{user.name}</strong>
                {isAdmin && (
                  <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-[700] uppercase tracking-[0.06em]"
                    style={{ background: "rgba(251,191,36,0.12)", color: C.warning, border: "1px solid rgba(251,191,36,0.25)" }}>
                    Admin
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* User section */}
          <div className="space-y-3 mb-8">
            <p className="text-[11px] font-[700] uppercase tracking-[0.08em] mb-3" style={{ color: C.inkMut }}>
              Mon espace
            </p>
            {userCards.map((c) => <DashCard key={c.href} {...c} />)}
          </div>

          {/* Admin section */}
          {isAdmin && (
            <div className="space-y-3">
              <p className="text-[11px] font-[700] uppercase tracking-[0.08em] mb-3" style={{ color: C.inkMut }}>
                Administration
              </p>
              {adminCards.map((c) => <DashCard key={c.href} {...c} />)}
            </div>
          )}

        </div>
      </PageContainer>
    </div>
  );
}
