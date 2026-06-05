import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { LuUsers } from "react-icons/lu";
import { useAuth } from "../../auth/AuthProvider";
import { api } from "../../lib/api";
import { toastFromError } from "../../lib/toast";

export function buildDefeatsQuery(filters) {
  const p = new URLSearchParams();
  p.set("year",     String(filters.year     || "2022"));
  p.set("bodyType", filters.bodyType        || "VIDHAN_SABHA");
  p.set("rankMode", filters.rankMode        || "all");
  p.set("party",    filters.party           || "ALL");
  p.set("page",     String(filters.page     || 1));
  if (filters.search) p.set("search", filters.search);
  return p;
}

const PARTY_CHIP = {
  BJP: "bg-orange-500", SP: "bg-lime-600", INC: "bg-sky-600",
  BSP: "bg-slate-700",  RLD: "bg-green-600", IND: "bg-gray-500",
  AAP: "bg-emerald-600", Others: "bg-slate-400",
};

const RANK_BADGE = {
  RUNNER_UP: "bg-amber-100 text-amber-800",
  LOST:      "bg-rose-100  text-rose-700",
};

const BODY_OPTIONS = [
  { id: "VIDHAN_SABHA", label: "Vidhan Sabha (MLA)", years: ["2022", "2017", "2012"], defaultYear: "2022" },
  { id: "LOK_SABHA",    label: "Lok Sabha (MP)",     years: ["2019"],                 defaultYear: "2019" },
];

export function ElectionDefeatsPanel({ stateCode, stateName, fullPage = false, searchParams, onSearchParamsChange }) {
  const { token } = useAuth();
  const [bodyType,       setBodyType]       = useState(() => searchParams?.get("bodyType") || "VIDHAN_SABHA");
  const [year,           setYear]           = useState(() => searchParams?.get("year")     || "2022");
  const [rankMode,       setRankMode]       = useState(() => searchParams?.get("rankMode") || "all");
  const [party,          setParty]          = useState(() => searchParams?.get("party")    || "ALL");
  const [search,         setSearch]         = useState(() => searchParams?.get("search")   || "");
  const [appliedSearch,  setAppliedSearch]  = useState(() => searchParams?.get("search")   || "");
  const [page,           setPage]           = useState(() => parseInt(searchParams?.get("page") || "1", 10) || 1);
  const [data,           setData]           = useState(null);
  const [loading,        setLoading]        = useState(false);

  const bodyMeta      = useMemo(() => BODY_OPTIONS.find((b) => b.id === bodyType) || BODY_OPTIONS[0], [bodyType]);
  const years         = bodyMeta.years;
  const effectiveYear = years.includes(year) ? year : bodyMeta.defaultYear;

  useEffect(() => { if (!years.includes(year)) setYear(bodyMeta.defaultYear); }, [bodyMeta, year, years]);

  const load = useCallback(async () => {
    if (stateCode !== "UP" || !years.includes(year)) return;
    setLoading(true);
    try {
      const qs = new URLSearchParams({ bodyType, year: effectiveYear, rankMode, party, search: appliedSearch, page: String(page), limit: "50" });
      const d  = await api(`/api/admin/election-defeats/${stateCode}?${qs}`, { token });
      setData(d);
    } catch (e) {
      toastFromError(e, "Failed to load candidates");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [stateCode, token, bodyType, year, effectiveYear, years, rankMode, party, appliedSearch, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [bodyType, year, rankMode, party, appliedSearch]);

  useEffect(() => {
    if (!onSearchParamsChange) return;
    const p = buildDefeatsQuery({ year: effectiveYear, bodyType, rankMode, party, page, search: appliedSearch });
    // preserve tab so it stays as 'defeated'
    if (!p.has("tab")) p.set("tab", "defeated");
    onSearchParamsChange(p, { replace: true });
  }, [effectiveYear, bodyType, rankMode, party, page, appliedSearch, onSearchParamsChange]);

  if (stateCode !== "UP") {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-10 text-center text-sm text-amber-900">
        <p className="text-base font-semibold">Select Uttar Pradesh</p>
        <p className="mt-1 text-stone-600">Candidate data available for UP only.</p>
      </div>
    );
  }

  const rows      = data?.defeated || [];
  const total     = data?.totalDefeated || 0;
  const matchCount = data?.matchCount || 0;

  return (
    <div className={fullPage ? "flex min-h-0 flex-1 flex-col gap-4" : "space-y-4"}>

      {/* ── Filters ── */}
      <div className="rounded-2xl border border-amber-200/80 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold uppercase tracking-wide text-stone-500">Election Body</label>
            <select value={bodyType} onChange={(e) => setBodyType(e.target.value)}
              className="rounded-lg border border-amber-200 bg-[#faf6f0] px-3 py-2 text-sm text-emerald-950 focus:outline-none focus:ring-2 focus:ring-rose-400">
              {BODY_OPTIONS.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold uppercase tracking-wide text-stone-500">Year</label>
            <select value={year} onChange={(e) => setYear(e.target.value)}
              className="rounded-lg border border-amber-200 bg-[#faf6f0] px-3 py-2 text-sm text-emerald-950 focus:outline-none focus:ring-2 focus:ring-rose-400">
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold uppercase tracking-wide text-stone-500">Show</label>
            <select value={rankMode} onChange={(e) => setRankMode(e.target.value)}
              className="rounded-lg border border-amber-200 bg-[#faf6f0] px-3 py-2 text-sm text-emerald-950 focus:outline-none focus:ring-2 focus:ring-rose-400">
              <option value="all">All non-winners</option>
              <option value="runner-up">Runner-up only (2nd)</option>
            </select>
          </div>
          <form className="flex flex-1 items-end gap-2 min-w-[200px]"
            onSubmit={(e) => { e.preventDefault(); setAppliedSearch(search.trim()); }}>
            <div className="flex flex-1 flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase tracking-wide text-stone-500">Search</label>
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Candidate, constituency, district…"
                className="rounded-lg border border-amber-200 bg-[#faf6f0] px-3 py-2 text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-400" />
            </div>
            <button type="submit" className="rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800">
              Search
            </button>
          </form>
        </div>

        {/* Party pills */}
        {data?.partyBreakdown?.length ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            <button type="button" onClick={() => setParty("ALL")}
              className={`rounded-full px-3 py-0.5 text-xs font-semibold transition ${party === "ALL" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
              All parties
            </button>
            {data.partyBreakdown.slice(0, 10).map((p) => (
              <button key={p.party} type="button" onClick={() => setParty(p.party)}
                className={`rounded-full px-3 py-0.5 text-xs font-semibold text-white transition ${PARTY_CHIP[p.party] || PARTY_CHIP.Others} ${party === p.party ? "ring-2 ring-offset-1 ring-slate-800" : "opacity-80 hover:opacity-100"}`}>
                {p.party} · {p.count}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {data?.partial ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800">{data.message}</div>
      ) : null}

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Candidates", value: total.toLocaleString("en-IN") },
          { label: "Showing", value: `${matchCount} results` },
          { label: "Page", value: `${data?.page ?? 1} / ${data?.totalPages ?? 1}` },
          { label: "Body", value: bodyMeta.label.split(" ")[0] + " " + effectiveYear },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-amber-200/70 bg-[#faf6f0] px-4 py-3 shadow-sm">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">{s.label}</div>
            <div className="mt-1 truncate text-lg font-bold text-rose-900">{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Table ── */}
      <div className={`overflow-hidden rounded-2xl border border-amber-200/80 bg-white shadow-sm ${fullPage ? "flex min-h-0 flex-1 flex-col" : ""}`}>
        <div className="flex items-center justify-between border-b border-rose-200 bg-rose-700 px-5 py-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-white">
          <LuUsers className="h-4 w-4 mr-1 inline" />
            Losers — {bodyMeta.label} · {effectiveYear}
          </h2>
          <span className="rounded-full bg-rose-600 px-3 py-0.5 text-xs font-semibold text-white">
            {total.toLocaleString("en-IN")} candidates
          </span>
        </div>

        {loading ? (
          <div className="flex flex-1 items-center justify-center py-20 text-sm text-stone-400">
            <span className="animate-pulse">Loading candidates…</span>
          </div>
        ) : !rows.length ? (
          <div className="py-16 text-center text-sm text-stone-400">No candidates match your filters.</div>
        ) : (
          <>
            <div className={fullPage ? "min-h-0 flex-1 overflow-auto" : "max-h-[520px] overflow-auto"}>
              <table className="w-full min-w-[1000px] text-left text-sm">
                <thead className="sticky top-0 z-10 bg-[#f0ece4] text-[11px] font-semibold uppercase tracking-wide text-stone-600">
                  <tr>
                    <th className="px-4 py-3 w-12">AC#</th>
                    <th className="px-4 py-3">Constituency</th>
                    <th className="px-4 py-3">District</th>
                    <th className="px-4 py-3 w-16">Rank</th>
                    <th className="px-4 py-3">Candidate</th>
                    <th className="px-4 py-3">Party</th>
                    <th className="px-4 py-3 text-right">Votes</th>
                    <th className="px-4 py-3 text-right">%</th>
                    <th className="px-4 py-3">Winner</th>
                    <th className="px-4 py-3 text-right">Margin</th>
                    <th className="px-4 py-3 w-20 text-center">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100/60">
                  {rows.map((r) => {
                    const href = `/admin/election/constituency/${bodyType}/${effectiveYear}/seat/${r.seatNo}?from=/admin/election/results&tab=defeated`;
                    const rankStyle = RANK_BADGE[r.result] || RANK_BADGE.LOST;
                    return (
                      <tr key={`${r.seatNo}-${r.rank}-${r.candidate}`} className="hover:bg-rose-50/30 transition-colors">
                        <td className="px-4 py-2.5 tabular-nums text-xs text-stone-400">{r.seatNo}</td>
                        <td className="px-4 py-2.5">
                          <Link to={href} className="font-semibold text-teal-800 hover:underline">{r.seatName}</Link>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-stone-500">{r.district || "—"}</td>
                        <td className="px-4 py-2.5">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${rankStyle}`}>
                            #{r.rank}{r.result === "RUNNER_UP" ? " RU" : ""}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <Link to={href} className="font-medium text-emerald-950 hover:underline">{r.candidate}</Link>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white ${PARTY_CHIP[r.party] || PARTY_CHIP.Others}`}>
                            {r.party}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums font-medium text-stone-700">
                          {r.votes?.toLocaleString("en-IN") || "—"}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-stone-500">{r.votePercent}%</td>
                        <td className="px-4 py-2.5">
                          <div className="text-xs font-medium text-emerald-900">{r.winnerCandidate}</div>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold text-white ${PARTY_CHIP[r.winnerParty] || PARTY_CHIP.Others}`}>
                            {r.winnerParty}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums">
                          <div className="font-semibold text-rose-700">{r.marginVotes?.toLocaleString("en-IN")}</div>
                          <div className="text-[10px] text-stone-400">{r.marginPercent}% gap</div>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <Link to={href} className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-100 transition">
                            View →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-amber-100 bg-[#faf6f0] px-5 py-3">
              <span className="text-xs text-stone-500">
                Showing {matchCount} of {total.toLocaleString("en-IN")} candidates
              </span>
              <div className="flex items-center gap-2">
                <button type="button" disabled={page <= 1 || loading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-amber-50 disabled:opacity-40">
                  ← Prev
                </button>
                <span className="rounded-lg bg-rose-700 px-3 py-1.5 text-xs font-bold text-white">
                  {data?.page ?? 1} / {data?.totalPages ?? 1}
                </span>
                <button type="button" disabled={!data || page >= data.totalPages || loading}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-amber-50 disabled:opacity-40">
                  Next →
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
