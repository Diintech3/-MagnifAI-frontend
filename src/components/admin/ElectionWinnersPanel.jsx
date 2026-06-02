import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { api } from "../../lib/api";
import { toastFromError } from "../../lib/toast";

const PARTY_CHIP = {
  BJP: "bg-orange-500",
  SP: "bg-lime-600",
  INC: "bg-sky-600",
  BSP: "bg-slate-600",
  RLD: "bg-green-600",
  IND: "bg-gray-500",
  AAP: "bg-emerald-600",
  Others: "bg-slate-400",
};

const BODY_OPTIONS = [
  { id: "VIDHAN_SABHA", label: "Vidhan Sabha (MLA)", years: ["2022", "2017", "2012"], defaultYear: "2022" },
  { id: "LOK_SABHA", label: "Lok Sabha (MP)", years: ["2019"], defaultYear: "2019" },
  { id: "MLC", label: "Vidhan Parishad (MLC)", years: ["2022"], defaultYear: "2022" },
  { id: "MUNICIPAL", label: "Municipality (Mayor)", years: ["2023"], defaultYear: "2023" },
];

function PartyPills({ stats, active, onSelect }) {
  if (!stats?.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      <button
        type="button"
        onClick={() => onSelect("ALL")}
        className={`rounded px-2 py-0.5 text-[10px] font-medium ${
          active === "ALL" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-700"
        }`}
      >
        All parties
      </button>
      {stats.slice(0, 10).map((p) => (
        <button
          key={p.party}
          type="button"
          onClick={() => onSelect(p.party)}
          className={`rounded px-2 py-0.5 text-[10px] font-medium text-white ${
            PARTY_CHIP[p.party] || PARTY_CHIP.Others
          } ${active === p.party ? "ring-2 ring-slate-900 ring-offset-1" : "opacity-90"}`}
        >
          {p.party} ({p.seats})
        </button>
      ))}
    </div>
  );
}

export function ElectionWinnersPanel({ searchParams, onSearchParamsChange }) {
  const { token } = useAuth();
  const [bodyType, setBodyType] = useState(() => searchParams?.get("bodyType") || "VIDHAN_SABHA");
  const [year, setYear] = useState(() => searchParams?.get("year") || "2022");
  const [party, setParty] = useState(() => searchParams?.get("party") || "ALL");
  const [search, setSearch] = useState(() => searchParams?.get("search") || "");
  const [appliedSearch, setAppliedSearch] = useState(() => searchParams?.get("search") || "");
  const [page, setPage] = useState(() => parseInt(searchParams?.get("page") || "1", 10) || 1);

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const bodyMeta = useMemo(() => BODY_OPTIONS.find((b) => b.id === bodyType) || BODY_OPTIONS[0], [bodyType]);
  const years = bodyMeta.years;
  const effectiveYear = years.includes(year) ? year : bodyMeta.defaultYear;

  useEffect(() => {
    if (!years.includes(year)) setYear(bodyMeta.defaultYear);
  }, [bodyMeta, year, years]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        bodyType,
        year: effectiveYear,
        search: appliedSearch,
        party,
      });
      const d = await api(`/api/admin/election-analytics/UP?${qs.toString()}`, { token });
      setData(d);
    } catch (e) {
      toastFromError(e, "Failed to load winners");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [token, bodyType, effectiveYear, appliedSearch, party]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [bodyType, effectiveYear, party, appliedSearch]);

  useEffect(() => {
    if (!onSearchParamsChange) return;
    const p = new URLSearchParams(searchParams || undefined);
    p.set("tab", "winners");
    p.set("bodyType", bodyType);
    p.set("year", effectiveYear);
    p.set("party", party);
    p.set("page", String(page));
    if (appliedSearch) p.set("search", appliedSearch);
    else p.delete("search");
    onSearchParamsChange(p, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bodyType, effectiveYear, party, page, appliedSearch, onSearchParamsChange]);

  const rows = data?.constituencies || [];
  const limit = 50;
  const totalPages = Math.max(1, Math.ceil(rows.length / limit));
  const pageRows = rows.slice((page - 1) * limit, (page - 1) * limit + limit);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="rounded-xl border border-amber-200/80 bg-[#faf6f0] p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="text-[11px] font-medium uppercase text-stone-600">Election body</label>
            <select
              value={bodyType}
              onChange={(e) => setBodyType(e.target.value)}
              className="mt-1 block rounded border border-amber-300/80 bg-white px-2 py-1.5 text-sm"
            >
              {BODY_OPTIONS.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-medium uppercase text-stone-600">Year</label>
            <select
              value={effectiveYear}
              onChange={(e) => setYear(e.target.value)}
              className="mt-1 block rounded border border-amber-300/80 bg-white px-2 py-1.5 text-sm"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <form
            className="flex flex-1 items-end gap-2 min-w-[220px]"
            onSubmit={(e) => {
              e.preventDefault();
              setAppliedSearch(search.trim());
            }}
          >
            <div className="flex-1">
              <label className="text-[11px] font-medium uppercase text-stone-600">Search</label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Constituency / winner / district"
                className="mt-1 w-full rounded border border-amber-300/80 bg-white px-2 py-1.5 text-sm"
              />
            </div>
            <button type="submit" className="rounded bg-teal-900 px-3 py-1.5 text-sm text-amber-50">
              Search
            </button>
          </form>
        </div>

        <div className="mt-3">
          <PartyPills stats={data?.partyStats || []} active={party} onSelect={setParty} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-amber-200/80 bg-[#faf6f0] px-4 py-3 shadow-sm">
          <div className="text-[11px] uppercase text-stone-600">Total winners</div>
          <div className="text-2xl font-bold text-emerald-950">{rows.length.toLocaleString("en-IN")}</div>
        </div>
        <div className="rounded-lg border border-amber-200/80 bg-[#faf6f0] px-4 py-3 shadow-sm">
          <div className="text-[11px] uppercase text-stone-600">Page</div>
          <div className="text-2xl font-bold text-emerald-950">
            {page} / {totalPages}
          </div>
        </div>
        <div className="rounded-lg border border-amber-200/80 bg-[#faf6f0] px-4 py-3 shadow-sm">
          <div className="text-[11px] uppercase text-stone-600">Source</div>
          <div className="mt-1 text-xs font-medium text-stone-700">{data?.source || "—"}</div>
        </div>
      </div>

        <div className="overflow-hidden rounded-xl border border-amber-200/80 bg-[#faf6f0] shadow-sm">
        <div className="border-b border-amber-200/60 bg-[#2b7a6b] px-5 py-3">
          <h2 className="text-center text-sm font-semibold uppercase text-amber-50 sm:text-base">
            Uttar Pradesh — Winners ({effectiveYear})
          </h2>
        </div>
        {loading ? (
          <div className="py-16 text-center text-sm text-stone-600">Loading winners…</div>
        ) : (
          <>
            <div className="max-h-[520px] overflow-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="sticky top-0 bg-[#f0e6dc] text-xs uppercase text-stone-700">
                  <tr>
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">Constituency</th>
                    <th className="px-3 py-2">District</th>
                    <th className="px-3 py-2">Winner</th>
                    <th className="px-3 py-2">Party</th>
                    <th className="px-3 py-2 text-right">Votes</th>
                    <th className="px-3 py-2 text-right">%</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((r) => {
                    const detailHref = `/admin/election/defeated/${bodyType}/${effectiveYear}/seat/${r.acNo}?candidate=${encodeURIComponent(
                      r.candidate || "",
                    )}`;
                    return (
                    <tr key={`${r.acNo}-${r.acName}`} className="border-t border-amber-100/70 hover:bg-amber-50/60">
                      <td className="px-3 py-2 tabular-nums text-stone-700">{r.acNo}</td>
                      <td className="px-3 py-2 font-medium text-emerald-950">
                        <Link className="text-teal-900 hover:underline" to={detailHref}>
                          {r.acName}
                        </Link>
                      </td>
                      <td className="px-3 py-2 text-stone-700">{r.district || "—"}</td>
                      <td className="px-3 py-2 text-stone-800">
                        <Link className="hover:underline" to={detailHref}>
                          {r.candidate || "—"}
                        </Link>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`rounded px-1.5 py-0.5 text-xs font-semibold text-white ${PARTY_CHIP[r.party] || PARTY_CHIP.Others}`}>
                          {r.party}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-stone-800">
                        {r.votes ? Number(r.votes).toLocaleString("en-IN") : "—"}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-stone-800">{r.votePercent || "—"}</td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-amber-200/60 px-4 py-3 text-sm">
              <span className="text-stone-600">
                Showing {pageRows.length} of {rows.length.toLocaleString("en-IN")}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded border border-amber-300/80 bg-white px-3 py-1 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded border border-amber-300/80 bg-white px-3 py-1 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

