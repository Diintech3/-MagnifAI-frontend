import { useEffect, useState } from "react";
import { LuRefreshCw, LuEye, LuCheck, LuLoader, LuArrowRight } from "react-icons/lu";
import { useAuth } from "../../auth/AuthProvider";
import { api } from "../../lib/api";
import { toastFromError, toastSuccess } from "../../lib/toast";

const STAGES = [
  { key:"draft",     label:"Generated",  color:"bg-slate-100 text-slate-600",    dot:"bg-slate-400" },
  { key:"pending",   label:"QA Review",  color:"bg-amber-100 text-amber-700",    dot:"bg-amber-400" },
  { key:"approved",  label:"Approved",   color:"bg-blue-100 text-blue-700",      dot:"bg-blue-500" },
  { key:"assigned",  label:"Assigned",   color:"bg-violet-100 text-violet-700",  dot:"bg-violet-500" },
  { key:"scheduled", label:"Scheduled",  color:"bg-indigo-100 text-indigo-700",  dot:"bg-indigo-500" },
  { key:"published", label:"Published",  color:"bg-green-100 text-green-700",    dot:"bg-green-500" },
  { key:"verified",  label:"Verified",   color:"bg-emerald-100 text-emerald-700",dot:"bg-emerald-500" },
  { key:"completed", label:"Completed",  color:"bg-teal-100 text-teal-700",      dot:"bg-teal-500" },
];

const NEXT = { draft:"pending", pending:"approved", approved:"assigned", assigned:"published", published:"verified", verified:"completed" };

export function AppDistributionQueue() {
  const { token } = useAuth();
  const [byStage, setByStage] = useState({});
  const [loading, setLoading] = useState(true);
  const [moving, setMoving] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const results = await Promise.all(
        STAGES.map(s => api(`/api/app/content?status=${s.key}&limit=20`, { token }))
      );
      const map = {};
      STAGES.forEach((s, i) => { map[s.key] = results[i].items || []; });
      setByStage(map);
    } catch (e) { toastFromError(e, "Failed to load"); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [token]);

  async function moveNext(item) {
    const next = NEXT[item.status];
    if (!next) return;
    setMoving(item._id);
    try {
      await api(`/api/app/content/${item._id}/status`, { method:"PATCH", token, body:{ status: next } });
      toastSuccess(`Moved to ${next}`);
      load();
    } catch (e) { toastFromError(e, "Failed"); }
    finally { setMoving(null); }
  }

  const total = Object.values(byStage).reduce((s, arr) => s + arr.length, 0);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Distribution Queue</h2>
          <p className="text-sm text-slate-500">Track every content piece through the full distribution pipeline</p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition">
          <LuRefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {/* Pipeline summary */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {STAGES.map((s, i) => (
          <div key={s.key} className="flex items-center gap-1 shrink-0">
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-center shadow-sm min-w-[80px]">
              <div className="text-lg font-bold text-slate-900">{byStage[s.key]?.length || 0}</div>
              <div className={`mt-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.color}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />{s.label}
              </div>
            </div>
            {i < STAGES.length - 1 && <LuArrowRight className="h-4 w-4 text-slate-300 shrink-0" />}
          </div>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STAGES.slice(0,8).map(s => <div key={s.key} className="h-40 animate-pulse rounded-2xl bg-slate-100" />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STAGES.map(stage => (
            <div key={stage.key} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 space-y-2">
              <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${stage.color}`}>
                <span className={`h-2 w-2 rounded-full ${stage.dot}`} />
                <span className="text-xs font-bold">{stage.label}</span>
                <span className="ml-auto text-xs font-bold">{byStage[stage.key]?.length || 0}</span>
              </div>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {(byStage[stage.key] || []).length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-200 bg-white py-6 text-center text-xs text-slate-400">Empty</div>
                ) : (
                  (byStage[stage.key] || []).map(item => (
                    <div key={item._id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm space-y-2">
                      <p className="text-xs font-semibold text-slate-800 line-clamp-2">{item.output?.title || item.topic}</p>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 flex-wrap">
                        <span className="rounded bg-indigo-50 text-indigo-700 px-1.5 py-0.5 font-semibold">{item.contentType}</span>
                        <span>{item.ceoName}</span>
                      </div>
                      {item.assignedTo && <p className="text-[10px] text-slate-400">→ {item.assignedTo}</p>}
                      {/* Scores */}
                      {item.output?.scores && (
                        <div className="flex gap-1 flex-wrap">
                          {[["S", item.output.scores.seo, "emerald"], ["A", item.output.scores.aeo, "blue"], ["R", item.output.scores.readability, "violet"]].map(([l,v,c]) => v ? (
                            <span key={l} className={`rounded bg-${c}-50 text-${c}-700 px-1 text-[9px] font-bold`}>{l}:{v}</span>
                          ) : null)}
                        </div>
                      )}
                      {NEXT[item.status] && (
                        <button onClick={() => moveNext(item)} disabled={moving === item._id}
                          className="w-full flex items-center justify-center gap-1 rounded-lg bg-indigo-50 border border-indigo-200 px-2 py-1 text-[10px] font-bold text-indigo-700 hover:bg-indigo-100 transition">
                          {moving === item._id ? <LuLoader className="h-3 w-3 animate-spin" /> : <LuArrowRight className="h-3 w-3" />}
                          Move to {NEXT[item.status]}
                        </button>
                      )}
                      {item.status === "verified" && item.verificationUrl && (
                        <a href={item.verificationUrl} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[10px] text-emerald-600 hover:underline">
                          <LuCheck className="h-3 w-3" /> View Published
                        </a>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
