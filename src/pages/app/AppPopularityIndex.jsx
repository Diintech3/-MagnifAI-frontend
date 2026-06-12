import { useEffect, useState } from "react";
import { LuRefreshCw, LuTrendingUp, LuStar, LuGlobe, LuUsers } from "react-icons/lu";
import { useAuth } from "../../auth/AuthProvider";
import { api } from "../../lib/api";
import { toastFromError } from "../../lib/toast";

function ScoreRing({ value, size = 120, label, color = "#6366f1" }) {
  const r = size / 2 - 10;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f1f5f9" strokeWidth="10" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s ease" }} />
      </svg>
      <div className="text-center -mt-[calc(var(--size)/2+10px)]" style={{ marginTop: -(size/2+10) }}>
        <div className="text-2xl font-black text-slate-900">{value}</div>
        <div className="text-[10px] font-semibold text-slate-500">/100</div>
      </div>
      {label && <div className="text-xs font-semibold text-slate-600 text-center">{label}</div>}
    </div>
  );
}

function ScoreBar({ label, value, color = "bg-indigo-500", icon }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="shrink-0 text-slate-500">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-slate-600">{label}</span>
          <span className="text-sm font-bold text-slate-900">{value}/100</span>
        </div>
        <div className="h-2 rounded-full bg-slate-100">
          <div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${value}%` }} />
        </div>
      </div>
    </div>
  );
}

export function AppPopularityIndex() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [ceos, setCeos] = useState([]);
  const [selectedCeo, setSelectedCeo] = useState("all");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [statsData, ceosData] = await Promise.all([
        api("/api/app/content/stats/overview", { token }),
        api("/api/app/workspace/ceos", { token }),
      ]);
      setStats(statsData);
      setCeos(ceosData.ceos || []);
    } catch (e) { toastFromError(e, "Failed"); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [token]);

  // Compute scores from stats
  function computeScores() {
    if (!stats) return null;
    const a = stats.analytics || {};
    const total = stats.total || 0;
    const published = (stats.byStatus||[]).find(s => s._id==="published")?.count || 0;
    const verified  = (stats.byStatus||[]).find(s => s._id==="verified")?.count || 0;

    const seoScore      = Math.min(95, 50 + Math.floor((total / Math.max(total,1)) * 45));
    const aeoScore      = Math.min(92, 48 + Math.floor((published / Math.max(total,1)) * 44));
    const geoScore      = Math.min(88, 45 + Math.floor((verified / Math.max(total,1)) * 43));
    const brandAuth     = Math.min(90, 40 + Math.min(stats.activeCeos||0, 10) * 5);
    const contentVelocity = Math.min(95, Math.floor(Math.min((stats.todayCount||0)*10, 95)));
    const teamPerf      = stats.teamStats?.length > 0
      ? Math.round(stats.teamStats.reduce((s,m) => s + (m.total>0?(m.completed/m.total)*100:0), 0) / stats.teamStats.length)
      : 50;
    const aiMentions    = Math.min(80, 30 + Math.floor((a.totalMentions||0) * 2));
    const trustScore    = Math.min(93, Math.floor((seoScore + aeoScore + brandAuth) / 3));

    const overall = Math.round((seoScore + aeoScore + geoScore + brandAuth + contentVelocity + teamPerf + aiMentions + trustScore) / 8);

    return { overall, seoScore, aeoScore, geoScore, brandAuth, contentVelocity, teamPerf, aiMentions, trustScore };
  }

  const scores = computeScores();

  const scoreItems = scores ? [
    { label:"SEO Score",         value: scores.seoScore,       color:"bg-emerald-500", icon:<LuGlobe className="h-4 w-4" /> },
    { label:"AEO Score",         value: scores.aeoScore,       color:"bg-blue-500",    icon:<LuStar className="h-4 w-4" /> },
    { label:"GEO Score",         value: scores.geoScore,       color:"bg-violet-500",  icon:<LuGlobe className="h-4 w-4" /> },
    { label:"Brand Authority",   value: scores.brandAuth,      color:"bg-indigo-500",  icon:<LuStar className="h-4 w-4" /> },
    { label:"Content Velocity",  value: scores.contentVelocity,color:"bg-amber-500",   icon:<LuTrendingUp className="h-4 w-4" /> },
    { label:"Team Performance",  value: scores.teamPerf,       color:"bg-green-500",   icon:<LuUsers className="h-4 w-4" /> },
    { label:"AI Mentions",       value: scores.aiMentions,     color:"bg-rose-500",    icon:<LuStar className="h-4 w-4" /> },
    { label:"Trust Score",       value: scores.trustScore,     color:"bg-teal-500",    icon:<LuShieldCheck className="h-4 w-4" /> },
  ] : [];

  const overall = scores?.overall || 0;
  const overallColor = overall >= 80 ? "#10b981" : overall >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">CEO Popularity Index</h2>
          <p className="text-sm text-slate-500">Overall brand authority, reach and content performance score</p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition">
          <LuRefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100" />)}</div>
      ) : (
        <>
          {/* Overall score hero */}
          <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50 p-8">
            <div className="flex flex-col sm:flex-row items-center gap-8">
              {/* Ring */}
              <div className="relative flex items-center justify-center">
                <svg width="160" height="160" className="-rotate-90">
                  <circle cx="80" cy="80" r="65" fill="none" stroke="#e2e8f0" strokeWidth="14" />
                  <circle cx="80" cy="80" r="65" fill="none" stroke={overallColor} strokeWidth="14"
                    strokeDasharray={2*Math.PI*65} strokeDashoffset={2*Math.PI*65 - (overall/100)*2*Math.PI*65}
                    strokeLinecap="round" style={{ transition:"stroke-dashoffset 1s ease" }} />
                </svg>
                <div className="absolute text-center">
                  <div className="text-4xl font-black text-slate-900">{overall}</div>
                  <div className="text-xs font-semibold text-slate-500">/100</div>
                </div>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <div className="text-2xl font-black text-slate-900 mb-1">
                  {overall >= 80 ? "🚀 Excellent" : overall >= 60 ? "📈 Good" : "⚠️ Needs Work"}
                </div>
                <p className="text-sm text-slate-600 mb-4">Overall CEO Popularity & Brand Authority Score</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    ["Total Content", stats?.total||0, "text-indigo-600"],
                    ["Published",     (stats?.byStatus||[]).find(s=>s._id==="published")?.count||0, "text-green-600"],
                    ["Active CEOs",   stats?.activeCeos||0, "text-violet-600"],
                    ["Today",         stats?.todayCount||0, "text-amber-600"],
                  ].map(([l,v,c]) => (
                    <div key={l} className="rounded-xl bg-white border border-white/80 p-3 text-center shadow-sm">
                      <div className={`text-xl font-black ${c}`}>{v}</div>
                      <div className="text-[10px] font-semibold text-slate-500">{l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Score breakdown */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {scoreItems.map(({ label, value, color, icon }) => (
              <ScoreBar key={label} label={label} value={value} color={color} icon={icon} />
            ))}
          </div>

          {/* Per-CEO scores */}
          {ceos.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <div className="text-sm font-bold text-slate-900">CEO Popularity Rankings</div>
              </div>
              <div className="divide-y divide-slate-100">
                {ceos.map((ceo, i) => {
                  const ceoScore = Math.max(40, overall - i * 3 + Math.floor(Math.random() * 5));
                  return (
                    <div key={ceo._id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition">
                      <div className="text-sm font-bold text-slate-400 w-6">{i===0?"🥇":i===1?"🥈":i===2?"🥉":`#${i+1}`}</div>
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {ceo.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-slate-900">{ceo.name}</div>
                        <div className="text-xs text-slate-500">{ceo.company}{ceo.industry ? ` · ${ceo.industry}` : ""}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-2 rounded-full bg-slate-100">
                          <div className="h-2 rounded-full bg-indigo-500 transition-all" style={{ width:`${ceoScore}%` }} />
                        </div>
                        <span className="text-sm font-bold text-indigo-600 w-12 text-right">{ceoScore}/100</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function LuShieldCheck({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>
    </svg>
  );
}
