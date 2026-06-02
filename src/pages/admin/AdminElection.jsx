import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { api } from "../../lib/api";
import { toastFromError } from "../../lib/toast";
import { IconKpiCompetitive, IconKpiSeats, IconKpiStates, IconKpiTurnout, IconNavChevron } from "../../components/icons";
import { ElectionBodyTabs } from "../../components/admin/ElectionBodyTabs";
import { ElectionBodyPanel } from "../../components/admin/ElectionBodyPanel";
import { StateElectionAnalysis, StateHeroSummary } from "../../components/admin/StateElectionAnalysis";

function KpiTile({ label, value, sub, icon: Icon }) {
  return (
    <div className="rounded-lg border border-amber-200/80 bg-[#faf6f0] px-4 py-3 shadow-sm shadow-amber-900/5">
      <div className="flex items-start justify-between gap-2">
        <div className="text-[11px] font-medium uppercase tracking-wider text-stone-600">{label}</div>
        {Icon ? (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-emerald-100 text-emerald-800">
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
      </div>
      <div className="mt-1 text-2xl font-bold tabular-nums text-emerald-950">{value ?? "—"}</div>
      {sub ? <div className="mt-0.5 text-xs text-stone-600">{sub}</div> : null}
    </div>
  );
}

export function AdminElection() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [summary, setSummary] = useState(null);
  const [selectedCode, setSelectedCode] = useState(null);
  const [stateDetail, setStateDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [regionFilter, setRegionFilter] = useState("All");
  const [deskOpen, setDeskOpen] = useState(false);
  const [mainTab, setMainTab] = useState("election");
  const [electionBody, setElectionBody] = useState("VIDHAN_SABHA");
  const [electionYear, setElectionYear] = useState(2022);
  const [backendDown, setBackendDown] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setBackendDown(false);
      try {
        const d = await api("/api/admin/election", { token });
        if (!cancelled) {
          setSummary(d);
          if (d?.states?.length && !selectedCode) {
            const up = d.states.find((s) => s.code === "UP");
            setSelectedCode(up ? up.code : d.states[0].code);
          }
        }
      } catch (e) {
        if (!cancelled) {
          if (e?.code === "BACKEND_UNREACHABLE") setBackendDown(true);
          toastFromError(e, "Failed to load election data");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    setElectionBody("VIDHAN_SABHA");
    setElectionYear(2022);
    setMainTab("election");
    if (!selectedCode) {
      setStateDetail(null);
      return;
    }
    let cancelled = false;
    async function loadState() {
      setDetailLoading(true);
      try {
        const d = await api(`/api/admin/election/${selectedCode}`, { token });
        if (!cancelled) setStateDetail(d.state);
      } catch (e) {
        if (!cancelled) toastFromError(e, "Failed to load state electoral profile");
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    }
    loadState();
    return () => {
      cancelled = true;
    };
  }, [selectedCode, token]);

  const regions = useMemo(() => {
    const set = new Set((summary?.states || []).map((s) => s.region));
    return ["All", ...Array.from(set)];
  }, [summary]);

  const filteredStates = useMemo(() => {
    if (!summary?.states) return [];
    if (regionFilter === "All") return summary.states;
    return summary.states.filter((s) => s.region === regionFilter);
  }, [summary, regionFilter]);

  if (loading) {
    return (
      <div className="-m-4 flex min-h-[calc(100dvh-3.5rem)] items-center justify-center bg-[#f3ede4] sm:-m-6">
        <p className="text-sm text-stone-600">Loading electoral dataset…</p>
      </div>
    );
  }

  const state = stateDetail;

  return (
    <div className="-m-4 min-h-[calc(100dvh-3.5rem)] bg-[#f3ede4] sm:-m-6">
      {backendDown ? (
        <div className="border-b border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 sm:px-6">
          <strong>Backend not running.</strong> Start API server:{" "}
          <code className="rounded bg-amber-100 px-1.5 py-0.5">cd backend &amp;&amp; node index.js</code> (port 4000).
          Vite proxy cannot reach <code className="rounded bg-amber-100 px-1">localhost:4000</code>.
        </div>
      ) : null}

      <div className="border-b border-amber-200/70 bg-gradient-to-br from-[#e5efe8] via-[#faf6f0] to-[#f0e6dc]">
        <button
          type="button"
          onClick={() => setDeskOpen((v) => !v)}
          className="flex w-full items-start justify-between gap-4 px-4 py-5 text-left transition hover:bg-amber-100/30 sm:px-6"
        >
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-teal-800">
              National electoral operations desk
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-emerald-950">State-level electoral analytics</h2>
            <p className="mt-1 max-w-2xl text-sm text-stone-700">
              Lok Sabha coverage across {summary?.totalStates} priority states — seats, turnout, party arithmetic,
              swing regions, and field directives.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="hidden rounded-full border border-amber-300/80 bg-[#faf6f0]/90 px-4 py-2 text-xs text-stone-700 sm:inline">
              Last sync: <span className="font-semibold text-amber-900">Live dataset</span>
            </span>
            <IconNavChevron className={`h-5 w-5 text-teal-800 transition ${deskOpen ? "rotate-180" : ""}`} />
          </div>
        </button>
        {deskOpen ? (
          <div className="border-t border-amber-200/50 bg-[#f5f0e8]/90 px-4 pb-5 pt-4 sm:px-6">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <KpiTile icon={IconKpiStates} label="States tracked" value={summary?.totalStates} sub="Priority battlegrounds" />
              <KpiTile icon={IconKpiSeats} label="Lok Sabha seats" value={summary?.totalLokSabhaSeats} sub="Mapped in dataset" />
              <KpiTile icon={IconKpiTurnout} label="Avg turnout" value={summary?.avgTurnout} sub="Weighted estimate" />
              <KpiTile
                icon={IconKpiCompetitive}
                label="Competitive"
                value={summary?.competitiveStates}
                sub="Margin under 5%"
              />
            </div>
          </div>
        ) : null}
      </div>

      <div className="border-b border-amber-200/70 bg-[#faf6f0]">
        <div className="px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {regions.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRegionFilter(r)}
                  className={`rounded-md px-2 py-1 text-[11px] font-medium transition ${
                    regionFilter === r
                      ? "bg-teal-800 text-amber-50 shadow-sm"
                      : "bg-[#f0e6dc] text-stone-700 hover:bg-amber-100/60"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <div className="text-xs text-stone-600">
              Viewing: <span className="font-semibold text-emerald-950">{regionFilter}</span>
            </div>
          </div>
        </div>

        <div className="scrollbar-none overflow-x-auto border-t border-amber-200/40">
          <div className="flex min-w-max gap-2 px-4 py-3 sm:px-6">
            {filteredStates.map((s) => {
              const active = selectedCode === s.code;
              return (
                <button
                  key={s.code}
                  type="button"
                  onClick={() => setSelectedCode(s.code)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition ${
                    active
                      ? "border-teal-700 bg-emerald-50/80 shadow-sm"
                      : "border-amber-200/80 bg-[#faf6f0] hover:bg-amber-50/50"
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded text-[10px] font-bold ${
                      active ? "bg-teal-800 text-amber-50" : "bg-amber-100 text-amber-950"
                    }`}
                  >
                    {s.code}
                  </span>
                  <span className="min-w-0">
                    <span className="block max-w-[180px] truncate font-semibold text-emerald-950">{s.name}</span>
                    <span className="block text-[11px] text-stone-600">
                      {s.region} · {s.leadingParty} · {s.turnout}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="border-b border-amber-200/70 bg-[#faf6f0] px-4 sm:px-6">
        <div className="flex gap-1 pt-3">
          <button
            type="button"
            onClick={() => setMainTab("election")}
            className={`rounded-t-lg border border-b-0 px-6 py-2.5 text-sm font-semibold transition ${
              mainTab === "election"
                ? "border-teal-700 bg-[#faf6f0] text-teal-900"
                : "border-transparent bg-[#f0e6dc] text-stone-700 hover:bg-amber-100/50"
            }`}
          >
            Election
          </button>
          <button
            type="button"
            onClick={() => {
              const qs = new URLSearchParams({
                year: String(electionYear || 2022),
                bodyType: electionBody === "LOK_SABHA" ? "LOK_SABHA" : "VIDHAN_SABHA",
                rankMode: "all",
                party: "ALL",
                page: "1",
              });
              navigate(`/admin/election/defeated?${qs.toString()}`);
            }}
            className="rounded-t-lg border border-b-0 border-transparent bg-[#f0e6dc] px-6 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-rose-100/60 hover:text-rose-900"
          >
            Defeated ↗
          </button>
          <button
            type="button"
            onClick={() => setMainTab("analysis")}
            className={`rounded-t-lg border border-b-0 px-6 py-2.5 text-sm font-semibold transition ${
              mainTab === "analysis"
                ? "border-teal-700 bg-[#faf6f0] text-teal-900"
                : "border-transparent bg-[#f0e6dc] text-stone-700 hover:bg-amber-100/50"
            }`}
          >
            Analysis
          </button>
        </div>
        <p className="border-t border-teal-700/80 px-1 pb-3 pt-2 text-xs text-stone-600">
          {mainTab === "election"
            ? "Official results: Vidhan Sabha, Lok Sabha, MLC, Municipality — maps and seat-wise lists. Defeated tab opens full page."
            : "Strategy: party trends, demographics, swing zones, watchlist, charts, and field briefing."}
        </p>
      </div>

      <div className="p-4 sm:p-6">
        {detailLoading ? (
          <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-amber-300/80 bg-[#faf6f0] text-sm text-stone-600">
            Loading state profile…
          </div>
        ) : !state ? (
          <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-amber-300/80 bg-[#faf6f0] text-sm text-stone-600">
            Select a state from the tabs above
          </div>
        ) : mainTab === "election" ? (
          <div className="space-y-5">
            <StateHeroSummary state={state} />
            <ElectionBodyTabs
              stateCode={state.code}
              activeBody={electionBody}
              onChange={(body, defaultYear) => {
                setElectionBody(body);
                setElectionYear(defaultYear);
              }}
            />
            <ElectionBodyPanel
              stateCode={state.code}
              stateName={state.name}
              bodyType={electionBody}
              year={electionYear}
            />
          </div>
        ) : (
          <div className="space-y-5">
            <StateHeroSummary state={state} />
            <StateElectionAnalysis state={state} stateCode={state.code} />
          </div>
        )}
      </div>

      {summary?.comparison?.length && mainTab === "analysis" ? (
        <div className="border-t border-amber-200/70 bg-[#faf6f0] px-4 py-5 sm:px-6">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-teal-800">
            All-state comparison matrix
          </h3>
          <div className="overflow-x-auto rounded-lg border border-amber-200/80">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-[#f0e6dc] text-xs font-semibold uppercase text-stone-700">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">State</th>
                  <th className="px-4 py-3">Region</th>
                  <th className="px-4 py-3 text-right">LS Seats</th>
                  <th className="px-4 py-3 text-right">Turnout</th>
                  <th className="px-4 py-3">Leading</th>
                  <th className="px-4 py-3 text-right">Margin</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {summary.comparison.map((row) => (
                  <tr
                    key={row.code}
                    onClick={() => setSelectedCode(row.code)}
                    className={`cursor-pointer border-t border-amber-100/80 transition hover:bg-emerald-50/60 ${
                      selectedCode === row.code ? "bg-emerald-50/80" : ""
                    }`}
                  >
                    <td className="px-4 py-2.5 font-bold text-teal-800">{row.code}</td>
                    <td className="px-4 py-2.5 font-medium text-emerald-950">{row.name}</td>
                    <td className="px-4 py-2.5 text-stone-700">{row.region}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-semibold">{row.seats}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{row.turnout}</td>
                    <td className="px-4 py-2.5">{row.leadingParty}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{row.margin}</td>
                    <td className="px-4 py-2.5">
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-950">
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
