import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { api } from "../../lib/api";
import { toastFromError } from "../../lib/toast";
import {
  LuMapPin, LuUsers, LuVote, LuTrendingUp, LuTrendingDown,
  LuMinus, LuChartBar, LuNewspaper, LuMap, LuArrowRight,
} from "react-icons/lu";

function StatCard({ label, value, sub, Icon, color }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white shadow ${color}`}>
        <Icon className="h-6 w-6" strokeWidth={1.75} />
      </span>
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</div>
        <div className="mt-0.5 text-2xl font-bold text-slate-900">{value ?? "—"}</div>
        {sub && <div className="text-xs text-slate-500">{sub}</div>}
      </div>
    </div>
  );
}

function TrendIcon({ trend }) {
  if (trend === "up")   return <LuTrendingUp className="h-4 w-4 text-emerald-500" />;
  if (trend === "down") return <LuTrendingDown className="h-4 w-4 text-rose-500" />;
  return <LuMinus className="h-4 w-4 text-slate-400" />;
}

function QuickLink({ label, desc, Icon, color, onClick }) {
  return (
    <button onClick={onClick}
      className="group flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md hover:border-slate-200 transition-all text-left w-full">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow group-hover:scale-105 transition-transform ${color}`}>
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors">{label}</div>
        <div className="text-xs text-slate-400 truncate">{desc}</div>
      </div>
      <LuArrowRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-400 transition-colors shrink-0" />
    </button>
  );
}

export function CandidateConstituencyOverview() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const d = await api("/api/candidate/sections/constituency", { token });
        if (!cancelled) setData(d);
      } catch (e) {
        if (!cancelled) toastFromError(e, "Failed to load constituency data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [token]);

  if (loading) return (
    <div className="p-6 space-y-4">
      {[1,2,3].map(i => <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100" />)}
    </div>
  );

  const p = data?.data || {};

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow">
          <LuMapPin className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            {p.constituencyName || "Constituency Overview"}
          </h2>
          <p className="text-sm text-slate-500">
            {p.state || ""}{p.district ? ` · ${p.district}` : ""}{p.bodyType ? ` · ${p.bodyType}` : ""}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Voters"     value={p.totalVoters}     sub="Registered voters"    Icon={LuUsers}     color="bg-gradient-to-br from-indigo-500 to-violet-600" />
        <StatCard label="Male Voters"      value={p.maleVoters}      sub="Male electorate"      Icon={LuUsers}     color="bg-gradient-to-br from-blue-500 to-indigo-600" />
        <StatCard label="Female Voters"    value={p.femaleVoters}    sub="Female electorate"    Icon={LuUsers}     color="bg-gradient-to-br from-pink-500 to-rose-600" />
        <StatCard label="Voter Turnout"    value={p.turnout}         sub="Last election"        Icon={LuVote}      color="bg-gradient-to-br from-emerald-500 to-teal-600" />
      </div>

      {/* Candidate standing */}
      {p.standing && (
        <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50 p-5">
          <div className="mb-3 text-sm font-semibold text-indigo-800">Your Standing</div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "Popularity Index", value: p.standing.pi, trend: p.standing.piTrend },
              { label: "Lead / Deficit",   value: p.standing.lead, trend: p.standing.leadTrend },
              { label: "Swing Wards",      value: p.standing.swingWards, trend: "neutral" },
            ].map(({ label, value, trend }) => (
              <div key={label} className="rounded-xl bg-white border border-indigo-100 p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</span>
                  <TrendIcon trend={trend} />
                </div>
                <div className="text-2xl font-bold text-slate-900">{value ?? "—"}</div>
              </div>
            ))}
          </div>
          {p.standing.note && (
            <p className="mt-3 text-xs text-indigo-700 bg-white/60 rounded-lg px-3 py-2">{p.standing.note}</p>
          )}
        </div>
      )}

      {/* Ward breakdown */}
      {p.wards?.length > 0 && (
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4">
            <div className="text-sm font-semibold text-slate-900">Ward Summary</div>
            <div className="text-xs text-slate-500 mt-0.5">Booth-level status across your constituency</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {["Ward / Block", "Voters", "Status", "PI Score", "Priority"].map(h => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {p.wards.map((w, i) => (
                  <tr key={w.name} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/60"}>
                    <td className="px-4 py-3 font-medium text-slate-900">{w.name}</td>
                    <td className="px-4 py-3 text-slate-600">{w.voters ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold
                        ${w.status === "Green"  ? "bg-emerald-100 text-emerald-700" :
                          w.status === "Yellow" ? "bg-amber-100 text-amber-700" :
                          w.status === "Red"    ? "bg-red-100 text-red-700" :
                          "bg-slate-100 text-slate-600"}`}>
                        {w.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{w.pi ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{w.priority ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Insight */}
      {p.insight && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          <span className="font-semibold">Field Insight: </span>{p.insight}
        </div>
      )}

      {/* Quick Links */}
      <div>
        <div className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Explore Constituency</div>
        <div className="grid gap-3 sm:grid-cols-2">
          <QuickLink label="Demography"    desc="Voter demographic breakdown"       Icon={LuUsers}    color="bg-gradient-to-br from-indigo-500 to-violet-600"  onClick={() => navigate("/candidate/demography")} />
          <QuickLink label="Election Data" desc="Results, margins & party breakdown" Icon={LuChartBar} color="bg-gradient-to-br from-blue-500 to-indigo-600"    onClick={() => navigate("/candidate/demography/election")} />
          <QuickLink label="News"          desc="Regional election news feed"        Icon={LuNewspaper} color="bg-gradient-to-br from-emerald-500 to-teal-600"  onClick={() => navigate("/candidate/demography/news")} />
          <QuickLink label="News Analysis" desc="Narrative tracking & sentiment"     Icon={LuMap}      color="bg-gradient-to-br from-violet-500 to-purple-600"  onClick={() => navigate("/candidate/demography/news-analysis")} />
        </div>
      </div>
    </div>
  );
}
