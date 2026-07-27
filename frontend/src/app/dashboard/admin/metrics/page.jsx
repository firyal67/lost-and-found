"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Loader2, AlertCircle, RefreshCw, Users, FileText,
  Flag, MessageSquare, TrendingUp, ShieldOff, CheckCircle2,
  Archive, Link2, Clock,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { adminApi } from "@/lib/api/admin.api";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { setAccessToken } from "@/store/slices/authSlice";
import PageContainer from "@/components/layout/PageContainer";

/* ── Design tokens ───────────────────────────────────────────────────────── */
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

/* ── StatCard ────────────────────────────────────────────────────────────── */
function StatCard({ icon: Icon, iconColor, iconBg, iconBorder, label, value, sub, subColor }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl"
      style={{ background: C.surface, border: `1px solid ${C.border}` }}>
      <div className="flex items-center justify-center w-11 h-11 rounded-xl shrink-0"
        style={{ background: iconBg, border: `1px solid ${iconBorder}` }}>
        <Icon className="h-5 w-5" style={{ color: iconColor }} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-[600] uppercase tracking-[0.07em]" style={{ color: C.inkMut }}>{label}</p>
        <p className="text-[26px] font-[800] tracking-[-0.03em] leading-none mt-0.5" style={{ color: C.ink }}>
          {value ?? "—"}
        </p>
        {sub !== undefined && (
          <p className="text-[11px] mt-1" style={{ color: subColor ?? C.inkMut }}>{sub}</p>
        )}
      </div>
    </div>
  );
}

/* ── MiniBar ─────────────────────────────────────────────────────────────── */
function MiniBar({ label, value, total, color }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[12px]">
        <span style={{ color: C.inkSec }}>{label}</span>
        <span className="font-[700]" style={{ color }}>{value} <span style={{ color: C.inkMut }}>({pct}%)</span></span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

/* ── Custom tooltip for chart ────────────────────────────────────────────── */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3.5 py-2.5 rounded-xl text-[12px]"
      style={{ background: "#1a1e28", border: "1px solid rgba(255,255,255,0.10)", boxShadow: "0 8px 24px rgba(0,0,0,0.50)" }}>
      <p className="font-[600] mb-1.5" style={{ color: C.inkSec }}>{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
          <span style={{ color: C.inkMut }}>{p.name === "users" ? "Utilisateurs" : "Annonces"} : </span>
          <span className="font-[700]" style={{ color: C.ink }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────────────────── */
export default function AdminMetricsPage() {
  const router   = useRouter();
  const dispatch = useAppDispatch();
  const { user, isHydrating, accessToken } = useAppSelector((s) => s.auth);

  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!isHydrating && !user)                  router.push("/auth/login?redirect=/dashboard/admin/metrics");
    if (!isHydrating && user?.role !== "admin") router.push("/");
  }, [user, isHydrating, router]);

  const getToken = useCallback(async () => {
    if (accessToken) return accessToken;
    const { refreshAccessToken } = await import("@/lib/api-client");
    const t = await refreshAccessToken();
    dispatch(setAccessToken(t));
    return t;
  }, [accessToken, dispatch]);

  const fetchMetrics = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const token = await getToken();
      const data  = await adminApi.getMetrics(token);
      setMetrics(data.data);
    } catch {
      setError("Impossible de charger les métriques.");
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (!isHydrating && user?.role === "admin") fetchMetrics();
  }, [isHydrating, user, fetchMetrics]);

  if (isHydrating || (!metrics && loading)) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: C.canvas }}>
      <Loader2 className="h-6 w-6 animate-spin" style={{ color: C.accent }} />
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: C.canvas }}>
      <div className="flex flex-col items-center gap-4 text-center">
        <AlertCircle className="h-10 w-10" style={{ color: C.danger }} />
        <p style={{ color: C.inkSec }}>{error}</p>
        <button onClick={fetchMetrics}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-[500]"
          style={{ border: `1px solid ${C.border}`, color: C.inkSec, background: "transparent" }}>
          <RefreshCw className="h-3.5 w-3.5" /> Réessayer
        </button>
      </div>
    </div>
  );

  const m = metrics;

  return (
    <div className="min-h-screen" style={{ background: C.canvas }}>
      <PageContainer>
        <div className="py-8 max-w-5xl mx-auto">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-[13px] mb-6" style={{ color: C.inkMut }}>
            <Link href="/" className="hover:text-[#f0f2f8] transition-colors">Accueil</Link>
            <span>/</span>
            <Link href="/dashboard" className="hover:text-[#f0f2f8] transition-colors">Dashboard</Link>
            <span>/</span>
            <span style={{ color: C.inkSec }}>Métriques</span>
          </nav>

          {/* Header */}
          <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
            <div>
              <h1 className="font-sans font-[700] text-[26px] tracking-[-0.025em]" style={{ color: C.ink }}>
                Métriques de la plateforme
              </h1>
              <p className="text-[14px] mt-0.5" style={{ color: C.inkMut }}>
                Aperçu de l&apos;activité sur les 30 derniers jours
              </p>
            </div>
            <button onClick={fetchMetrics} disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-[500] disabled:opacity-40"
              style={{ border: `1px solid ${C.border}`, color: C.inkMut, background: "transparent" }}>
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Actualiser
            </button>
          </div>

          {/* ── Section: Utilisateurs ──────────────────────────────────── */}
          <p className="text-[11px] font-[700] uppercase tracking-[0.08em] mb-3" style={{ color: C.inkMut }}>
            Utilisateurs
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            <StatCard icon={Users}    iconColor={C.accent}   iconBg="rgba(79,142,247,0.12)"   iconBorder="rgba(79,142,247,0.25)"   label="Total"        value={m.users.total}  sub={`+${m.users.new30} ce mois`}   subColor={C.accent}  />
            <StatCard icon={CheckCircle2} iconColor={C.success} iconBg="rgba(52,211,153,0.10)" iconBorder="rgba(52,211,153,0.22)" label="Actifs"       value={m.users.active} sub={`+${m.users.new7} cette semaine`} subColor={C.success} />
            <StatCard icon={ShieldOff} iconColor={C.danger}  iconBg="rgba(248,113,113,0.10)"  iconBorder="rgba(248,113,113,0.22)"  label="Bannis"       value={m.users.banned} />
            <StatCard icon={TrendingUp} iconColor={C.warning} iconBg="rgba(251,191,36,0.10)"  iconBorder="rgba(251,191,36,0.22)"  label="Nouveaux (7j)" value={m.users.new7}  />
          </div>

          {/* ── Section: Annonces ─────────────────────────────────────── */}
          <p className="text-[11px] font-[700] uppercase tracking-[0.08em] mb-3" style={{ color: C.inkMut }}>
            Annonces
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            <StatCard icon={FileText}  iconColor={C.accent}   iconBg="rgba(79,142,247,0.12)"   iconBorder="rgba(79,142,247,0.25)"   label="Total"         value={m.posts.total}    sub={`+${m.posts.new30} ce mois`}    subColor={C.accent}  />
            <StatCard icon={TrendingUp} iconColor={C.success}  iconBg="rgba(52,211,153,0.10)"   iconBorder="rgba(52,211,153,0.22)"   label="Actives"       value={m.posts.active}   sub={`+${m.posts.new7} cette semaine`} subColor={C.success} />
            <StatCard icon={Archive}   iconColor={C.inkMut}   iconBg="rgba(107,116,148,0.10)"  iconBorder="rgba(107,116,148,0.22)"  label="Archivées"     value={m.posts.archived} />
          </div>
          <div className="p-4 rounded-xl mb-8 space-y-3"
            style={{ background: C.surface, border: `1px solid ${C.border}` }}>
            <p className="text-[12px] font-[600] uppercase tracking-[0.06em]" style={{ color: C.inkMut }}>
              Répartition des statuts
            </p>
            <MiniBar label="Actives"     value={m.posts.active}   total={m.posts.total} color={C.accent}  />
            <MiniBar label="Clôturées"   value={m.posts.resolved} total={m.posts.total} color={C.success} />
            <MiniBar label="Mises en cor." value={m.posts.matched} total={m.posts.total} color={C.purple}  />
            <MiniBar label="Archivées"   value={m.posts.archived} total={m.posts.total} color={C.inkMut}  />
          </div>

          {/* ── Section: Signalements + Contacts ──────────────────────── */}
          <div className="grid sm:grid-cols-2 gap-6 mb-8">
            {/* Reports */}
            <div>
              <p className="text-[11px] font-[700] uppercase tracking-[0.08em] mb-3" style={{ color: C.inkMut }}>
                Signalements
              </p>
              <div className="p-4 rounded-xl space-y-3"
                style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-[600]" style={{ color: C.inkSec }}>Total</span>
                  <span className="text-[20px] font-[800]" style={{ color: C.ink }}>{m.reports.total}</span>
                </div>
                <MiniBar label="En attente" value={m.reports.pending}   total={m.reports.total} color={C.warning} />
                <MiniBar label="Traités"    value={m.reports.actioned}  total={m.reports.total} color={C.success} />
                <MiniBar label="Rejetés"    value={m.reports.dismissed} total={m.reports.total} color={C.inkMut}  />
              </div>
            </div>

            {/* Contacts */}
            <div>
              <p className="text-[11px] font-[700] uppercase tracking-[0.08em] mb-3" style={{ color: C.inkMut }}>
                Demandes de contact
              </p>
              <div className="p-4 rounded-xl space-y-3"
                style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-[600]" style={{ color: C.inkSec }}>Total</span>
                  <span className="text-[20px] font-[800]" style={{ color: C.ink }}>{m.contacts.total}</span>
                </div>
                <MiniBar label="Approuvées" value={m.contacts.approved} total={m.contacts.total} color={C.success} />
                <MiniBar label="En attente" value={m.contacts.pending}  total={m.contacts.total} color={C.warning} />
              </div>
            </div>
          </div>

          {/* ── Section: Activité 7 jours ──────────────────────────────── */}
          <p className="text-[11px] font-[700] uppercase tracking-[0.08em] mb-3" style={{ color: C.inkMut }}>
            Activité — 7 derniers jours
          </p>
          <div className="p-5 rounded-xl" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={m.activity} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#4f8ef7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4f8ef7" stopOpacity={0}   />
                  </linearGradient>
                  <linearGradient id="colorPosts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#34d399" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: C.inkMut, fontSize: 11 }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: C.inkMut, fontSize: 11 }}
                  axisLine={false} tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  formatter={(v) => (
                    <span style={{ color: C.inkSec, fontSize: 12 }}>
                      {v === "users" ? "Nouveaux utilisateurs" : "Nouvelles annonces"}
                    </span>
                  )}
                />
                <Area type="monotone" dataKey="users" stroke="#4f8ef7" strokeWidth={2}
                  fill="url(#colorUsers)" dot={{ fill: "#4f8ef7", r: 3 }} activeDot={{ r: 5 }} />
                <Area type="monotone" dataKey="posts" stroke="#34d399" strokeWidth={2}
                  fill="url(#colorPosts)" dot={{ fill: "#34d399", r: 3 }} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

        </div>
      </PageContainer>
    </div>
  );
}
