import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { LuTrophy } from "react-icons/lu";
import { useAuth } from "../../auth/AuthProvider";
import { api } from "../../lib/api";
import { toastFromError } from "../../lib/toast";

const PARTY_CHIP = {
  BJP: "bg-orange-500",
  SP: "bg-lime-600",
  INC: "bg-sky-600",
  BSP: "bg-slate-700",
  RLD: "bg-green-600",
  IND: "bg-gray-500",
  AAP: "bg-emerald-600",
  Others: "bg-slate-400",
};

const BODY_OPTIONS = [
  { id: "VIDHAN_SABHA", label: "Vidhan Sabha (MLA)", years: ["2022", "2017", "2012"], defaultYear: "2022" },
  { id: "LOK_SABHA",    label: "Lok Sabha (MP)",     years: ["2019"],                 defaultYear: "2019" },
  { id: "MLC",          label: "Vidhan Parishad (MLC)", years: ["2022"],              defaultYear: "2022" },
  { id: "MUNICIPAL",    label: "Municipality (Mayor)", years: ["2023"],               defaultYear: "2023" },
];

export function ElectionWinnersPanel({ searchParams, onSearchParamsChange }) {
  const { token } = useAuth();
  const [bodyType, setBodyType]           = useState(() => searchParams?.get("bodyType") || "VIDHAN_SABHA");
  const [year, setYear]                   = useState(() => searchParams?.get("year") || "2022");
  const [party, setParty]                 = useState(() => searchParams?.get("party") || "ALL");
  const [search, setSearch]               = useState(() => searchParams?.get("search") || "");
  const [appliedSearch, setAppliedSearch] = useState(() => searchParams?.get("search") || "");
  const [page, setPage]                   = useState(() => parseInt(searchParams?.get("page") || "1", 10) || 1);
  const [loading, setLoading]             = useState(false);
  const [data, setData]                   = useState(null);

  const bodyMeta      = useMemo(() => BODY_OPTIONS.find((b) => b.id === bodyType) || BODY_OPTIONS[0], [bodyType]);
  const years         = bodyMeta.years;
  const effectiveYear = years.includes(year) ? year : bodyMeta.defaultYear;

  useEffect(() => { if (!years.includes(year)) setYear(bodyMeta.defaultYear); }, [bodyMeta, year, years]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ bodyType, year: effectiveYear, search: appliedSearch, party });
      const d  = await api(`/api/admin/election-analytics/UP?${qs}`, { token });
      setData(d);
    } catch (e) {
      toastFromError(e, "Failed to load winners");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [token, bodyType, effectiveYear, appliedSearch, party]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [bodyType, effectiveYear, party, appliedSearch]);

  useEffect(() => {
    if (!onSearchParamsChange) return;
    const p = new URLSearchParams(searchParams || undefined);
    p.set("tab", "winners");
    p.set("bodyType", bodyType);
    p.set("year", effectiveYear);
    p.set("party", party);
    p.set("page", String(page));
    if (appliedSearch) p.set("search", appliedSearch); else p.delete("search");
    onSearchParamsChange(p, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bodyType, effectiveYear, party, page, appliedSearch, onSearchParamsChange]);

  const rows       = data?.constituencies || [];
  const limit      = 50;
  const totalPages = Math.max(1, Math.ceil(rows.length / limit));
  const pageRows   = rows.slice((page - 1) * limit, page * limit);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">

      {/* ── Filters ── */}
      <div className="rounded-2xl border border-amber-200/80 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold uppercase tracking-wide text-stone-500">Election Body</label>
            <select
              value={bodyType}
              onChange={(e) => setBodyType(e.target.value)}
              className="rounded-lg border border-amber-200 bg-[#faf6f0] px-3 py-2 text-sm text-emerald-950 focus:outline-none focus:ring-2 focus:ring-teal-400"
            >
              {BODY_OPTIONS.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold uppercase tracking-wide text-stone-500">Year</label>
            <select
              value={effectiveYear}
              onChange={(e) => setYear(e.target.value)}
              className="rounded-lg border border-amber-200 bg-[#faf6f0] px-3 py-2 text-sm text-emerald-950 focus:outline-none focus:ring-2 focus:ring-teal-400"
            >
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <form
            className="flex flex-1 items-end gap-2 min-w-[220px]"
            onSubmit={(e) => { e.preventDefault(); setAppliedSearch(search.trim()); }}
          >
            <div className="flex flex-1 flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase tracking-wide text-stone-500">Search</label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Constituency / candidate / district…"
                className="rounded-lg border border-amber-200 bg-[#faf6f0] px-3 py-2 text-sm text-emerald-950 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>
            <button type="submit" className="rounded-lg bg-teal-800 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-900">
              Search
            </button>
          </form>
        </div>

        {/* Party pills */}
        {data?.partyStats?.length ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setParty("ALL")}
              className={`rounded-full px-3 py-0.5 text-xs font-semibold transition ${party === "ALL" ? "bg-emerald-800 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
            >
              All parties
            </button>
            {data.partyStats.slice(0, 10).map((p) => (
              <button
                key={p.party}
                type="button"
                onClick={() => setParty(p.party)}
                className={`rounded-full px-3 py-0.5 text-xs font-semibold text-white transition ${PARTY_CHIP[p.party] || PARTY_CHIP.Others} ${party === p.party ? "ring-2 ring-offset-1 ring-slate-800" : "opacity-80 hover:opacity-100"}`}
              >
                {p.party} · {p.seats}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Constituencies", value: rows.length, color: "text-emerald-900" },
          { label: "Showing", value: `${pageRows.length} results`, color: "text-teal-800" },
          { label: "Page", value: `${page} / ${totalPages}`, color: "text-stone-700" },
          { label: "Source", value: data?.source?.split("·")[0] || "—", color: "text-stone-500", small: true },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-amber-200/70 bg-[#faf6f0] px-4 py-3 shadow-sm">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">{s.label}</div>
            <div className={`mt-1 truncate font-bold ${s.small ? "text-xs" : "text-xl"} ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Table ── */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-amber-200/80 bg-white shadow-sm">
        {/* Table header bar */}
        <div className="flex items-center justify-between border-b border-amber-200/60 bg-emerald-800 px-5 py-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-white">
          <LuTrophy className="h-4 w-4 mr-1 inline" />
            Winners — {bodyMeta.label} · {effectiveYear}
          </h2>
          <span className="rounded-full bg-emerald-700 px-3 py-0.5 text-xs font-semibold text-white">
            {rows.length} seats
          </span>
        </div>

        {loading ? (
          <div className="flex flex-1 items-center justify-center py-20 text-sm text-stone-500">
            <span className="animate-pulse">Loading winners…</span>
          </div>
        ) : !rows.length ? (
          <div className="py-16 text-center text-sm text-stone-400">No results found.</div>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="sticky top-0 z-10 bg-[#f0ece4] text-[11px] font-semibold uppercase tracking-wide text-stone-600">
                  <tr>
                    <th className="px-4 py-3 w-12">#</th>
                    <th className="px-4 py-3">Constituency</th>
                    <th className="px-4 py-3">District</th>
                    <th className="px-4 py-3">Winner</th>
                    <th className="px-4 py-3">Party</th>
                    <th className="px-4 py-3 text-right">Votes</th>
                    <th className="px-4 py-3 text-right">%</th>
                    <th className="px-4 py-3 w-20 text-center">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100/60">
                  {pageRows.map((r) => {
                    const href = `/admin/election/constituency/${bodyType}/${effectiveYear}/seat/${r.acNo}?from=/admin/election/results&tab=winners`;
                    return (
                      <tr key={`${r.acNo}-${r.acName}`} className="hover:bg-amber-50/50 transition-colors">
                        <td className="px-4 py-2.5 tabular-nums text-stone-400 text-xs">{r.acNo}</td>
                        <td className="px-4 py-2.5">
                          <Link to={href} className="font-semibold text-teal-800 hover:underline">
                            {r.acName}
                          </Link>
                        </td>
                        <td className="px-4 py-2.5 text-stone-500 text-xs">{r.district || "—"}</td>
                        <td className="px-4 py-2.5">
                          <Link to={href} className="font-medium text-emerald-950 hover:underline">
                            {r.candidate || "—"}
                          </Link>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white ${PARTY_CHIP[r.party] || PARTY_CHIP.Others}`}>
                            {r.party}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-emerald-950">
                          {r.votes ? Number(r.votes).toLocaleString("en-IN") : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-stone-600">
                          {r.votePercent ? `${r.votePercent}%` : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <Link
                            to={href}
                            className="inline-flex items-center gap-1 rounded-lg bg-teal-50 px-2.5 py-1 text-[11px] font-semibold text-teal-800 hover:bg-teal-100 transition"
                          >
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
                Showing {pageRows.length} of {rows.length.toLocaleString("en-IN")} winners
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-amber-50 disabled:opacity-40"
                >
                  ← Prev
                </button>
                <span className="rounded-lg bg-emerald-800 px-3 py-1.5 text-xs font-bold text-white">
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-amber-50 disabled:opacity-40"
                >
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
