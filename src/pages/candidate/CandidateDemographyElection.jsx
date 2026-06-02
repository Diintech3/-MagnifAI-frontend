import { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthProvider";
import { api } from "../../lib/api";
import { IconKpiCompetitive, IconKpiSeats, IconKpiStates, IconKpiTurnout, IconNavChevron } from "../../components/icons";
import { toastFromError } from "../../lib/toast";

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

function WhiteCard({ title, desc, children, className }) {
  return (
    <section className={cn("rounded-xl border border-slate-200 bg-white shadow-sm", className)}>
      {(title || desc) && (
        <div className="border-b border-slate-100 px-5 py-4">
          {title ? <h3 className="text-sm font-semibold text-slate-900">{title}</h3> : null}
          {desc ? <p className="mt-0.5 text-xs text-slate-500">{desc}</p> : null}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

function heatColor(status) {
  if (status === "Green") return "bg-emerald-100 text-emerald-800";
  if (status === "Yellow") return "bg-amber-100 text-amber-800";
  if (status === "Red") return "bg-red-100 text-red-800";
  return "bg-slate-100 text-slate-700";
}

export function CandidateDemographyElection() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deskOpen, setDeskOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const d = await api("/api/candidate/sections/demography-election", { token });
        if (!cancelled) setData(d);
      } catch (e) {
        if (!cancelled) toastFromError(e, "Failed to load electoral dataset");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading) {
    return <div className="bg-white p-8 text-center text-sm text-slate-500">Loading electoral desk…</div>;
  }

  const payload = data?.data || {};
  const state = payload.state;
  const pi = payload.popularityIndex;

  return (
    <div className="bg-white">
      {/* Collapsible election desk header — white theme */}
      <div className="border-b border-slate-200">
        <button
          type="button"
          onClick={() => setDeskOpen((v) => !v)}
          className="flex w-full items-start justify-between gap-4 px-4 py-5 text-left transition hover:bg-slate-50 sm:px-6"
        >
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-600">
              National electoral operations desk
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">State-level electoral overview</h2>
            <p className="mt-1 text-sm text-slate-600">
              {payload.summary}
              {state ? ` · ${state.name} (${state.code})` : ""}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="hidden rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600 sm:inline">
              Last sync: <span className="font-medium text-slate-900">Live</span>
            </span>
            <IconNavChevron
              className={cn("h-5 w-5 text-slate-500 transition", deskOpen && "rotate-180")}
            />
          </div>
        </button>

        {deskOpen ? (
          <div className="border-t border-slate-100 bg-slate-50/80 px-4 pb-5 pt-4 sm:px-6">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Your PI score</p>
                  <IconKpiCompetitive className="h-4 w-4 text-indigo-500" />
                </div>
                <p className="mt-1 text-2xl font-bold text-slate-900">{pi?.current ?? "—"}</p>
                <p className="text-xs text-slate-500">Target {pi?.target}+ before poll day</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">State seats</p>
                  <IconKpiSeats className="h-4 w-4 text-indigo-500" />
                </div>
                <p className="mt-1 text-2xl font-bold text-slate-900">{state?.totalSeats ?? "—"}</p>
                <p className="text-xs text-slate-500">Lok Sabha · {state?.phases} phases</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Turnout est.</p>
                  <IconKpiTurnout className="h-4 w-4 text-indigo-500" />
                </div>
                <p className="mt-1 text-2xl font-bold text-slate-900">{state?.turnout ?? "—"}</p>
                <p className="text-xs text-slate-500">Leading: {state?.leadingParty}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Victory margin</p>
                  <IconKpiStates className="h-4 w-4 text-indigo-500" />
                </div>
                <p className="mt-1 text-2xl font-bold text-slate-900">{state?.margin ?? "—"}</p>
                <p className="text-xs text-slate-500">{state?.status}</p>
              </div>
            </div>
            {pi?.interpretation ? (
              <p className="mt-3 rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-2.5 text-sm text-indigo-900">
                {pi.interpretation}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="space-y-5 p-4 sm:p-6">
        {pi?.clusters?.length ? (
          <WhiteCard title="Popularity Index (PI) — signal clusters" desc="Five weighted performance clusters (daily composite)">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {pi.clusters.map((c) => (
                <div key={c.label} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <div className="text-xs text-slate-500">{c.label}</div>
                  <div className="mt-1 text-xl font-bold text-slate-900">{c.value}</div>
                  <div className="text-[10px] text-slate-400">Weight {c.weight}</div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-indigo-500" style={{ width: `${c.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </WhiteCard>
        ) : null}

        {payload.wardHeatmap?.length ? (
          <WhiteCard title="Ward-level heatmap" desc="Daily ward status and intervention priority">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Ward / block</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2 text-right">PI</th>
                    <th className="px-3 py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {payload.wardHeatmap.map((w) => (
                    <tr key={w.ward} className="border-t border-slate-100">
                      <td className="px-3 py-3 font-medium text-slate-900">{w.ward}</td>
                      <td className="px-3 py-3">
                        <span className={cn("rounded px-2 py-0.5 text-xs font-semibold", heatColor(w.status))}>
                          {w.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right font-semibold tabular-nums">{w.pi}</td>
                      <td className="px-3 py-3 text-slate-600">{w.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </WhiteCard>
        ) : null}

        {state?.partyBreakdown?.length ? (
          <WhiteCard title="Party arithmetic" desc={`${state.name} — projected Lok Sabha seat split`}>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500">Party</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500">Seats</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500">Vote share</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {state.partyBreakdown.map((p) => (
                    <tr key={p.party} className="border-t border-slate-100">
                      <td className="px-4 py-3 font-medium text-slate-900">{p.party}</td>
                      <td className="px-4 py-3 tabular-nums">{p.seats}</td>
                      <td className="px-4 py-3 tabular-nums">{p.voteShare}</td>
                      <td className="px-4 py-3 capitalize text-slate-600">{p.trend}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </WhiteCard>
        ) : null}

        {payload.campaignPhases?.length ? (
          <WhiteCard title="Campaign phase calendar" desc="Budget allocation by campaign phase">
            <div className="grid gap-3 sm:grid-cols-2">
              {payload.campaignPhases.map((ph) => (
                <div key={ph.phase} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">{ph.phase}</span>
                    <span className="rounded bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-800">
                      {ph.budget}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{ph.timeline}</p>
                  <p className="mt-2 text-sm text-slate-700">{ph.goal}</p>
                </div>
              ))}
            </div>
          </WhiteCard>
        ) : null}

        {state?.constituencyWatch?.length ? (
          <WhiteCard title="Priority constituencies" desc="High-stakes districts in your state cluster">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Seat</th>
                    <th className="px-3 py-2">Zone</th>
                    <th className="px-3 py-2">Priority</th>
                    <th className="px-3 py-2">Margin</th>
                    <th className="px-3 py-2">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {state.constituencyWatch.map((c) => (
                    <tr key={c.constituency} className="border-t border-slate-100">
                      <td className="px-3 py-2.5 font-medium">{c.constituency}</td>
                      <td className="px-3 py-2.5 text-slate-600">{c.zone}</td>
                      <td className="px-3 py-2.5">
                        <span
                          className={cn(
                            "rounded px-2 py-0.5 text-xs font-semibold",
                            c.priority === "Critical" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800",
                          )}
                        >
                          {c.priority}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 tabular-nums">{c.margin}</td>
                      <td className="px-3 py-2.5 text-slate-600">{c.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </WhiteCard>
        ) : null}

        {state?.analysis?.recommendation ? (
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-5 py-4 text-sm text-indigo-950">
            <span className="font-semibold">Field directive:</span> {state.analysis.recommendation}
          </div>
        ) : null}
      </div>
    </div>
  );
}
