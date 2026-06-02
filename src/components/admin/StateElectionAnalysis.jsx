import { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthProvider";
import { api } from "../../lib/api";
import { toastFromError } from "../../lib/toast";
import { ElectionAnalyticsCharts } from "./ElectionAnalyticsCharts";

const PARTY_COLORS = {
  BJP: "bg-orange-500",
  INC: "bg-sky-600",
  SP: "bg-red-600",
  BSP: "bg-blue-700",
  RJD: "bg-lime-600",
  JDU: "bg-emerald-600",
  AITC: "bg-green-500",
  DMK: "bg-rose-600",
  AIADMK: "bg-amber-500",
  SS: "bg-orange-400",
  NCP: "bg-violet-600",
  "JD(S)": "bg-teal-600",
  Left: "bg-red-800",
  Others: "bg-slate-400",
};

function statusTone(status) {
  const s = String(status || "").toLowerCase();
  if (s.includes("high") || s.includes("flip") || s.includes("competitive"))
    return "bg-amber-100 text-amber-800 ring-amber-200";
  if (s.includes("stronghold")) return "bg-emerald-100 text-emerald-800 ring-emerald-200";
  return "bg-indigo-100 text-indigo-800 ring-indigo-200";
}

function trendIcon(trend) {
  if (trend === "up") return "↑";
  if (trend === "down") return "↓";
  return "→";
}

function Section({ title, desc, children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {desc ? <p className="mt-0.5 text-xs text-slate-500">{desc}</p> : null}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function PartyBars({ parties }) {
  const max = Math.max(...(parties || []).map((p) => p.voteShareNum || 0), 1);
  return (
    <div className="space-y-4">
      {parties?.map((p) => (
        <div key={p.party}>
          <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2 font-medium text-slate-800">
              <span className={`h-2.5 w-2.5 rounded-sm ${PARTY_COLORS[p.party] || "bg-slate-400"}`} />
              {p.party}
              <span className="text-slate-400">·</span>
              <span className="font-normal text-slate-500">{p.seats} seats</span>
            </div>
            <div className="flex items-center gap-2 tabular-nums text-slate-700">
              <span className="font-semibold">{p.voteShare}</span>
              <span
                className={`text-xs ${
                  p.trend === "up" ? "text-emerald-600" : p.trend === "down" ? "text-red-600" : "text-slate-500"
                }`}
              >
                {trendIcon(p.trend)}
              </span>
            </div>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-all ${PARTY_COLORS[p.party] || "bg-slate-400"}`}
              style={{ width: `${((p.voteShareNum || 0) / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function DemographyGrid({ items }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items?.map((d) => {
        const pct = parseFloat(String(d.value).replace("%", "")) || 0;
        return (
          <div key={d.label}>
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-slate-600">{d.label}</span>
              <span className="font-semibold tabular-nums text-slate-900">{d.value}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.min(pct, 100)}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function StateElectionAnalysis({ state, stateCode }) {
  const { token } = useAuth();
  const [upAnalytics, setUpAnalytics] = useState(null);
  const [chartsLoading, setChartsLoading] = useState(false);

  useEffect(() => {
    if (stateCode !== "UP") {
      setUpAnalytics(null);
      return;
    }
    let cancelled = false;
    async function load() {
      setChartsLoading(true);
      try {
        const qs = new URLSearchParams({ bodyType: "VIDHAN_SABHA", year: "2022" });
        const d = await api(`/api/admin/election-analytics/${stateCode}?${qs.toString()}`, { token });
        if (!cancelled) setUpAnalytics(d);
      } catch (e) {
        if (!cancelled) toastFromError(e, "Failed to load UP analytics charts");
      } finally {
        if (!cancelled) setChartsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [stateCode, token]);

  if (!state) return null;

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 px-4 py-3 text-sm text-indigo-950">
        Strategic and demographic analysis for <strong>{state.name}</strong>. Official seat-wise results and maps
        are under the <strong>Election</strong> tab.
      </div>

      {stateCode === "UP" ? (
        <div className="space-y-5">
          {chartsLoading ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white py-10 text-center text-sm text-slate-500">
              Loading Vidhan Sabha charts…
            </div>
          ) : upAnalytics?.supported ? (
            <ElectionAnalyticsCharts analytics={upAnalytics} year="2022" />
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-2">
        <Section title="Party vote share & seat split" desc="Projected Lok Sabha breakdown">
          <PartyBars parties={state.partyBreakdown} />
          <div className="mt-4 flex flex-wrap gap-4 rounded-lg bg-slate-50 px-4 py-3 text-xs text-slate-600">
            <span>
              Seats mapped: <strong className="text-slate-900">{state.seatMath?.allocated}</strong> /{" "}
              {state.seatMath?.lokSabha}
            </span>
            {state.seatMath?.swing > 0 ? (
              <span>
                Swing bucket: <strong className="text-amber-700">{state.seatMath.swing}</strong> seats
              </span>
            ) : null}
          </div>
        </Section>

        <Section title="Polling phases" desc="Phase-wise seat distribution">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[320px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase text-slate-500">
                  <th className="pb-2 pr-4">Phase</th>
                  <th className="pb-2 pr-4">Seats</th>
                  <th className="pb-2 pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {state.phaseSchedule?.map((ph) => (
                  <tr key={ph.phase} className="border-b border-slate-50">
                    <td className="py-2.5 font-medium text-slate-800">Phase {ph.phase}</td>
                    <td className="py-2.5 tabular-nums text-slate-700">{ph.seats}</td>
                    <td className="py-2.5">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-medium ${
                          ph.status === "Active"
                            ? "bg-emerald-100 text-emerald-800"
                            : ph.status === "Completed"
                              ? "bg-slate-100 text-slate-600"
                              : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {ph.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Section title="Voter demographics" desc="Population & electorate mix">
          <DemographyGrid items={state.demographics} />
        </Section>

        <Section title="Swing regions" desc="Sub-regional competitiveness">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[300px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase text-slate-500">
                  <th className="pb-2">Region</th>
                  <th className="pb-2 text-right">Est. seats</th>
                  <th className="pb-2 text-right">Heat</th>
                </tr>
              </thead>
              <tbody>
                {state.swingRegionDetails?.map((r) => (
                  <tr key={r.region} className="border-b border-slate-50">
                    <td className="py-2.5 font-medium text-slate-800">{r.region}</td>
                    <td className="py-2.5 text-right tabular-nums">{r.seats}</td>
                    <td className="py-2.5 text-right">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-medium ${
                          r.competitiveness === "High"
                            ? "bg-red-100 text-red-800"
                            : r.competitiveness === "Medium"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {r.competitiveness}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      </div>

      <Section title="Constituency watchlist" desc="Priority districts & campaign focus">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                <th className="px-3 py-2.5">Constituency</th>
                <th className="px-3 py-2.5">Zone</th>
                <th className="px-3 py-2.5">Leading</th>
                <th className="px-3 py-2.5 text-right">Margin</th>
                <th className="px-3 py-2.5">Priority</th>
                <th className="px-3 py-2.5">Field note</th>
              </tr>
            </thead>
            <tbody>
              {state.constituencyWatch?.map((c) => (
                <tr key={c.constituency} className="border-b border-slate-100 hover:bg-slate-50/80">
                  <td className="px-3 py-3 font-semibold text-slate-900">{c.constituency}</td>
                  <td className="px-3 py-3 text-slate-600">{c.zone}</td>
                  <td className="px-3 py-3 font-medium">{c.leading}</td>
                  <td className="px-3 py-3 text-right tabular-nums font-medium">{c.margin}</td>
                  <td className="px-3 py-3">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-semibold ${
                        c.priority === "Critical"
                          ? "bg-red-100 text-red-800"
                          : c.priority === "High"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {c.priority}
                    </span>
                  </td>
                  <td className="max-w-xs px-3 py-3 text-slate-600">{c.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Operational briefing" desc="Executive summary, strengths, risks, and directive">
        <p className="text-sm leading-relaxed text-slate-700">{state.analysis?.summary}</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-4">
            <div className="text-xs font-bold uppercase tracking-wide text-emerald-800">Strengths</div>
            <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
              {state.analysis?.strengths?.map((s) => (
                <li key={s} className="flex gap-2">
                  <span className="text-emerald-600">+</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border border-red-100 bg-red-50/50 p-4">
            <div className="text-xs font-bold uppercase tracking-wide text-red-800">Risks</div>
            <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
              {state.analysis?.risks?.map((r) => (
                <li key={r} className="flex gap-2">
                  <span className="text-red-600">!</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-4 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-950">
          Field directive: {state.analysis?.recommendation}
        </div>
      </Section>

      {state.news?.length ? (
        <Section title="Electoral desk feed" desc="Latest verified signals">
          <ul className="divide-y divide-slate-100">
            {state.news.map((n) => (
              <li key={n.title} className="flex flex-wrap items-baseline justify-between gap-2 py-3 first:pt-0">
                <span className="font-medium text-slate-900">{n.title}</span>
                <span className="text-xs text-slate-500">
                  {n.date} · {n.source}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
    </div>
  );
}

export function StateHeroSummary({ state }) {
  if (!state) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-bold text-slate-900">{state.name}</h3>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${statusTone(state.status)}`}
            >
              {state.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            {state.capital} · {state.region} · Leading:{" "}
            <span className="font-semibold text-slate-900">{state.leadingParty}</span> · Margin {state.margin}
          </p>
        </div>
        <div className="flex gap-6 text-center">
          <div>
            <div className="text-2xl font-bold tabular-nums text-indigo-600">{state.totalSeats}</div>
            <div className="text-[10px] uppercase tracking-wide text-slate-500">Lok Sabha</div>
          </div>
          <div>
            <div className="text-2xl font-bold tabular-nums text-slate-800">{state.assemblySeats}</div>
            <div className="text-[10px] uppercase tracking-wide text-slate-500">Assembly</div>
          </div>
          <div>
            <div className="text-2xl font-bold tabular-nums text-slate-800">{state.phases}</div>
            <div className="text-[10px] uppercase tracking-wide text-slate-500">Phases</div>
          </div>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {state.keyMetrics?.map((m) => (
          <div key={m.label} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
            <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500">{m.label}</div>
            <div className="mt-0.5 text-sm font-bold tabular-nums text-slate-900">{m.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
