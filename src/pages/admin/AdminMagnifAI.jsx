import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { api } from "../../lib/api";
import {
  LuVote,
  LuUsers,
  LuTrophy,
  LuChartBar,
  LuMapPin,
  LuTrendingUp,
  LuShieldCheck,
  LuArrowRight,
  LuBriefcase,
  LuGlobe,
  LuStar,
  LuZap,
  LuActivity,
  LuDatabase,
} from "react-icons/lu";

// ── Stat Card ──────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, sub, color }) {
  const colors = {
    teal:   "bg-teal-50   border-teal-200   text-teal-700",
    amber:  "bg-amber-50  border-amber-200  text-amber-700",
    rose:   "bg-rose-50   border-rose-200   text-rose-700",
    indigo: "bg-indigo-50 border-indigo-200 text-indigo-700",
    emerald:"bg-emerald-50 border-emerald-200 text-emerald-700",
    violet: "bg-violet-50 border-violet-200 text-violet-700",
  };
  const cls = colors[color] || colors.teal;
  return (
    <div className={`rounded-2xl border px-5 py-4 shadow-sm ${cls}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide opacity-70">{label}</p>
          <p className="mt-1 text-3xl font-bold">{value ?? "—"}</p>
          {sub ? <p className="mt-0.5 text-[11px] opacity-60">{sub}</p> : null}
        </div>
        <span className="rounded-xl bg-white/60 p-2.5 shadow-sm">
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}

// ── Quick Action Card ──────────────────────────────────────────────────────
function ActionCard({ icon: Icon, title, desc, to, color }) {
  const colors = {
    teal:   "hover:border-teal-300   hover:bg-teal-50/60",
    amber:  "hover:border-amber-300  hover:bg-amber-50/60",
    rose:   "hover:border-rose-300   hover:bg-rose-50/60",
    indigo: "hover:border-indigo-300 hover:bg-indigo-50/60",
    emerald:"hover:border-emerald-300 hover:bg-emerald-50/60",
  };
  const iconColors = {
    teal:   "bg-teal-100   text-teal-700",
    amber:  "bg-amber-100  text-amber-700",
    rose:   "bg-rose-100   text-rose-700",
    indigo: "bg-indigo-100 text-indigo-700",
    emerald:"bg-emerald-100 text-emerald-700",
  };
  return (
    <Link
      to={to}
      className={`group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-150 ${colors[color] || colors.teal}`}
    >
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconColors[color] || iconColors.teal}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-slate-900">{title}</p>
        <p className="mt-0.5 text-xs text-slate-500">{desc}</p>
      </div>
      <LuArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-slate-600" />
    </Link>
  );
}

// ── Feature Badge ──────────────────────────────────────────────────────────
function FeatureBadge({ icon: Icon, label, active }) {
  return (
    <div className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${
      active
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : "border-slate-200 bg-slate-50 text-slate-500"
    }`}>
      <Icon className="h-3.5 w-3.5" />
      {label}
      {active ? <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> : null}
    </div>
  );
}

// ── Activity Row ───────────────────────────────────────────────────────────
function ActivityRow({ icon: Icon, title, sub, time, color }) {
  const colors = {
    teal: "bg-teal-100 text-teal-700",
    amber: "bg-amber-100 text-amber-700",
    rose: "bg-rose-100 text-rose-700",
    indigo: "bg-indigo-100 text-indigo-700",
  };
  return (
    <div className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-0">
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${colors[color] || colors.teal}`}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-800 truncate">{title}</p>
        <p className="text-xs text-slate-400">{sub}</p>
      </div>
      <span className="shrink-0 text-[11px] text-slate-400">{time}</span>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export function AdminMagnifAI() {
  const { user, token } = useAuth();
  const [overview, setOverview] = useState(null);

  useEffect(() => {
    api("/api/admin/overview", { token })
      .then(setOverview)
      .catch(() => {});
  }, [token]);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <div className="-m-4 min-h-[calc(100dvh-3.5rem)] bg-[#f3ede4] sm:-m-6">

      {/* ── Hero Banner ── */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 px-6 py-8 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-indigo-300">
                {greeting}, {user?.businessName || user?.name || "Admin"} 👋
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">
                MagnifAI Dashboard
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                Electoral intelligence platform · Uttar Pradesh
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 sm:mt-0">
              <FeatureBadge icon={LuShieldCheck} label="Live Data"     active />
              <FeatureBadge icon={LuDatabase}    label="3,226 Profiles" active />
              <FeatureBadge icon={LuGlobe}       label="UP 2022"       active />
              <FeatureBadge icon={LuZap}         label="AI Ready"      active={false} />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">

        {/* ── KPI Row ── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <KpiCard icon={LuVote}      label="Total Apps"     value={overview?.totalApps}   sub="Registered"      color="teal"    />
          <KpiCard icon={LuActivity}  label="Active Apps"    value={overview?.activeApps}  sub="Running now"     color="emerald" />
          <KpiCard icon={LuUsers}     label="Candidates"     value="4,441"                 sub="UP 2022"         color="indigo"  />
          <KpiCard icon={LuTrophy}    label="Constituencies" value="403"                   sub="Vidhan Sabha"    color="amber"   />
          <KpiCard icon={LuDatabase}  label="Profiles"       value="3,226"                 sub="Myneta scraped"  color="violet"  />
          <KpiCard icon={LuMapPin}    label="Districts"      value="75"                    sub="Uttar Pradesh"   color="rose"    />
        </div>

        {/* ── Quick Actions ── */}
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-stone-500">
            <LuZap className="h-4 w-4" /> Quick Actions
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <ActionCard
              icon={LuVote}
              title="Election Analytics"
              desc="State-level electoral data, maps, party breakdowns"
              to="/admin/election"
              color="teal"
            />
            <ActionCard
              icon={LuTrophy}
              title="Constituency Results"
              desc="Winner & loser details with candidate profiles"
              to="/admin/election/results?tab=winners"
              color="emerald"
            />
            <ActionCard
              icon={LuUsers}
              title="All Candidates"
              desc="Browse all 4,441 contestants with filters"
              to="/admin/election/results?tab=defeated"
              color="indigo"
            />
            <ActionCard
              icon={LuChartBar}
              title="Election Analysis"
              desc="Party trends, swing zones, demographic insights"
              to="/admin/election?tab=analysis"
              color="amber"
            />
            <ActionCard
              icon={LuBriefcase}
              title="Apps Management"
              desc="Manage client apps and portal access"
              to="/admin/apps"
              color="rose"
            />
            <ActionCard
              icon={LuStar}
              title="Overview"
              desc="Admin portal summary and system status"
              to="/admin"
              color="teal"
            />
          </div>
        </div>

        {/* ── Bottom two cols ── */}
        <div className="grid gap-4 lg:grid-cols-2">

          {/* Data Coverage */}
          <div className="rounded-2xl border border-amber-200/70 bg-white p-5 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800">
              <LuDatabase className="h-4 w-4 text-indigo-600" /> Data Coverage
            </h3>
            {[
              { label: "Vidhan Sabha 2022 candidates", pct: 88, color: "bg-emerald-500", val: "3,226 / 4,441" },
              { label: "Vidhan Sabha 2017 candidates", pct: 100, color: "bg-teal-500", val: "CSV full" },
              { label: "Vidhan Sabha 2012 candidates", pct: 100, color: "bg-teal-400", val: "CSV full" },
              { label: "Lok Sabha 2019 constituencies", pct: 100, color: "bg-amber-500", val: "80 seats" },
              { label: "Asset / criminal data (myneta)", pct: 73, color: "bg-indigo-500", val: "3,226 profiles" },
            ].map((r) => (
              <div key={r.label} className="mb-3">
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-slate-600">{r.label}</span>
                  <span className="font-semibold text-slate-800">{r.val}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-1.5 rounded-full ${r.color}`} style={{ width: `${r.pct}%` }} />
                </div>
              </div>
            ))}
          </div>

          {/* Activity Feed */}
          <div className="rounded-2xl border border-amber-200/70 bg-white p-5 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800">
              <LuActivity className="h-4 w-4 text-teal-600" /> Platform Activity
            </h3>
            <ActivityRow icon={LuDatabase}   title="Myneta data scraped"        sub="4,000 candidate IDs processed"   time="Today"    color="indigo" />
            <ActivityRow icon={LuVote}       title="Election data loaded"        sub="UP Vidhan Sabha 2022, 2017, 2012" time="Active"   color="teal"  />
            <ActivityRow icon={LuMapPin}     title="Constituency map live"       sub="403 seats with GeoJSON"           time="Active"   color="amber" />
            <ActivityRow icon={LuTrophy}     title="Winner profiles enriched"    sub="Wikipedia auto-enrichment done"   time="Done"     color="teal"  />
            <ActivityRow icon={LuTrendingUp} title="Lok Sabha 2019 loaded"       sub="80 MP constituencies"             time="Active"   color="indigo"/>
            <ActivityRow icon={LuShieldCheck} title="Backend API running"        sub="Port 4000 · All routes healthy"   time="Live"     color="teal"  />
          </div>
        </div>

        {/* ── Platform Info Banner ── */}
        <div className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-violet-50 px-6 py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-bold text-indigo-900">MagnifAI — Electoral Intelligence Platform</h3>
              <p className="mt-1 text-sm text-indigo-700">
                Complete election data ecosystem — results, candidate profiles, assets, criminal records,
                demographic analysis, and constituency maps for Uttar Pradesh.
              </p>
            </div>
            <Link
              to="/admin/election"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition"
            >
              <LuVote className="h-4 w-4" /> Open Election Desk
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
