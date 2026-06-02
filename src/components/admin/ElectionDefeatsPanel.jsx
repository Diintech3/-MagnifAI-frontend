import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { api } from "../../lib/api";
import { toastFromError } from "../../lib/toast";

export function buildDefeatsQuery(filters) {
  const p = new URLSearchParams();
  p.set("year", String(filters.year || "2022"));
  p.set("bodyType", filters.bodyType || "VIDHAN_SABHA");
  p.set("rankMode", filters.rankMode || "all");
  p.set("party", filters.party || "ALL");
  p.set("page", String(filters.page || 1));
  if (filters.search) p.set("search", filters.search);
  return p;
}

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
          {p.party} ({p.count})
        </button>
      ))}
    </div>
  );
}

export function ElectionDefeatsPanel({
  stateCode,
  stateName,
  fullPage = false,
  searchParams,
  onSearchParamsChange,
}) {
  const { token } = useAuth();
  const [bodyType, setBodyType] = useState(() => searchParams?.get("bodyType") || "VIDHAN_SABHA");
  const [year, setYear] = useState(() => searchParams?.get("year") || "2022");
  const [rankMode, setRankMode] = useState(() => searchParams?.get("rankMode") || "all");
  const [party, setParty] = useState(() => searchParams?.get("party") || "ALL");
  const [search, setSearch] = useState(() => searchParams?.get("search") || "");
  const [appliedSearch, setAppliedSearch] = useState(() => searchParams?.get("search") || "");
  const [page, setPage] = useState(() => parseInt(searchParams?.get("page") || "1", 10) || 1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fullPageHref = useMemo(
    () => `/admin/election/defeated?${buildDefeatsQuery({ year, bodyType, rankMode, party, page, search: appliedSearch }).toString()}`,
    [year, bodyType, rankMode, party, page, appliedSearch],
  );

  const bodyMeta = useMemo(() => BODY_OPTIONS.find((b) => b.id === bodyType) || BODY_OPTIONS[0], [bodyType]);
  const years = bodyMeta.years;
  const effectiveYear = years.includes(year) ? year : bodyMeta.defaultYear;

  useEffect(() => {
    if (!years.includes(year)) setYear(bodyMeta.defaultYear);
  }, [bodyMeta, year, years]);

  const load = useCallback(async () => {
    if (stateCode !== "UP") return;
    // Wait until we have a valid year for the selected body type (prevents 404/unsupported calls).
    if (!years.includes(year)) return;
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        bodyType,
        year: effectiveYear,
        rankMode,
        party,
        search: appliedSearch,
        page: String(page),
        limit: "50",
      });
      const d = await api(`/api/admin/election-defeats/${stateCode}?${qs.toString()}`, { token });
      setData(d);
    } catch (e) {
      toastFromError(e, "Failed to load defeated candidates");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [stateCode, token, bodyType, year, effectiveYear, years, rankMode, party, appliedSearch, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [bodyType, year, rankMode, party, appliedSearch]);

  useEffect(() => {
    if (!onSearchParamsChange) return;
    onSearchParamsChange(
      buildDefeatsQuery({ year: effectiveYear, bodyType, rankMode, party, page, search: appliedSearch }),
      { replace: true },
    );
  }, [effectiveYear, bodyType, rankMode, party, page, appliedSearch, onSearchParamsChange]);

  if (stateCode !== "UP") {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-8 text-center text-sm text-amber-950">
        <p className="font-semibold">Select Uttar Pradesh</p>
        <p className="mt-2">
          Detailed defeated-candidate data is currently available for <strong>UP</strong> only. Switch from{" "}
          {stateName || stateCode} to Uttar Pradesh.
        </p>
      </div>
    );
  }

  const titleText = `${stateName || "Uttar Pradesh"} — Defeated / lost candidates (${effectiveYear})`;

  return (
    <div className={fullPage ? "flex min-h-0 flex-1 flex-col gap-4" : "space-y-5"}>
      {!fullPage ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-950">
          <strong>Defeated candidates</strong> — full non-winning candidate details with winner and margin.{" "}
          <Link to={fullPageHref} className="font-semibold text-rose-800 underline hover:text-rose-950">
            Open full page ↗
          </Link>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <label className="text-[11px] font-medium uppercase text-slate-500">Election body</label>
          <select
            value={bodyType}
            onChange={(e) => setBodyType(e.target.value)}
            className="mt-1 block rounded border border-slate-300 px-2 py-1.5 text-sm"
          >
            {BODY_OPTIONS.map((b) => (
              <option key={b.id} value={b.id}>
                {b.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[11px] font-medium uppercase text-slate-500">Year</label>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="mt-1 block rounded border border-slate-300 px-2 py-1.5 text-sm"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[11px] font-medium uppercase text-slate-500">Show</label>
          <select
            value={rankMode}
            onChange={(e) => setRankMode(e.target.value)}
            className="mt-1 block rounded border border-slate-300 px-2 py-1.5 text-sm"
          >
            <option value="all">All defeated candidates</option>
            <option value="runner-up">Runner-up only (2nd)</option>
          </select>
        </div>
        <form
          className="flex flex-1 items-end gap-2 min-w-[200px]"
          onSubmit={(e) => {
            e.preventDefault();
            setAppliedSearch(search.trim());
          }}
        >
          <div className="flex-1">
            <label className="text-[11px] font-medium uppercase text-slate-500">Search</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Candidate, AC, district"
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
            />
          </div>
          <button type="submit" className="rounded bg-slate-800 px-3 py-1.5 text-sm text-white">
            Search
          </button>
        </form>
      </div>

      {data?.partial ? (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">{data.message}</p>
      ) : null}

      {data?.partyBreakdown ? (
        <PartyPills stats={data.partyBreakdown} active={party} onSelect={setParty} />
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="text-[11px] uppercase text-slate-500">Total defeated (filtered)</div>
          <div className="text-2xl font-bold text-slate-900">{data?.totalDefeated?.toLocaleString("en-IN") ?? "—"}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="text-[11px] uppercase text-slate-500">Page</div>
          <div className="text-2xl font-bold text-slate-900">
            {data?.page ?? 1} / {data?.totalPages ?? 1}
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="text-[11px] uppercase text-slate-500">Source</div>
          <div className="text-xs font-medium text-slate-800 mt-1">{data?.source || "—"}</div>
        </div>
      </div>

      <div
        className={`overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ${
          fullPage ? "flex min-h-0 flex-1 flex-col" : ""
        }`}
      >
        <div className="border-b border-slate-100 bg-[#c0392b] px-5 py-3">
          {fullPage ? (
            <h2 className="text-center text-sm font-semibold uppercase text-white sm:text-base">{titleText}</h2>
          ) : (
            <Link
              to={fullPageHref}
              className="block text-center text-sm font-semibold uppercase text-white hover:underline sm:text-base"
            >
              {titleText} — Open full page ↗
            </Link>
          )}
        </div>
        {loading ? (
          <div className="py-16 text-center text-sm text-slate-500">Loading defeated candidates…</div>
        ) : (
          <>
            <div
              className={
                fullPage ? "min-h-0 flex-1 overflow-auto" : "max-h-[520px] overflow-auto"
              }
            >
              <table className="w-full min-w-[960px] text-left text-sm">
                <thead className="sticky top-0 bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2">AC#</th>
                    <th className="px-3 py-2">Constituency</th>
                    <th className="px-3 py-2">District</th>
                    <th className="px-3 py-2">Rank</th>
                    <th className="px-3 py-2">Lost candidate</th>
                    <th className="px-3 py-2">Party</th>
                    <th className="px-3 py-2 text-right">Votes</th>
                    <th className="px-3 py-2 text-right">%</th>
                    <th className="px-3 py-2">Winner</th>
                    <th className="px-3 py-2">Winner party</th>
                    <th className="px-3 py-2 text-right">Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.defeated || []).map((r) => {
                    const detailHref = `/admin/election/defeated/${bodyType}/${effectiveYear}/seat/${r.seatNo}?candidate=${encodeURIComponent(
                      r.candidate || "",
                    )}`;
                    return (
                    <tr
                      key={`${r.seatNo}-${r.rank}-${r.candidate}`}
                      className="border-t border-slate-100 hover:bg-rose-50/40"
                    >
                      <td className="px-3 py-2 tabular-nums text-slate-500">
                        <Link className="font-semibold text-teal-800 hover:underline" to={detailHref}>
                          {r.seatNo}
                        </Link>
                      </td>
                      <td className="px-3 py-2 font-medium text-slate-900">
                        <Link className="hover:underline" to={detailHref}>
                          {r.seatName}
                        </Link>
                      </td>
                      <td className="px-3 py-2 text-slate-600">{r.district || "—"}</td>
                      <td className="px-3 py-2 tabular-nums">
                        {r.rank}
                        {r.result === "RUNNER_UP" ? (
                          <span className="ml-1 rounded bg-amber-100 px-1 text-[10px] text-amber-800">RU</span>
                        ) : null}
                      </td>
                      <td className="px-3 py-2">
                        <Link className="text-slate-900 hover:underline" to={detailHref}>
                          {r.candidate}
                        </Link>
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`rounded px-1.5 py-0.5 text-xs font-semibold text-white ${
                            PARTY_CHIP[r.party] || PARTY_CHIP.Others
                          }`}
                        >
                          {r.party}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{r.votes?.toLocaleString("en-IN")}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{r.votePercent}%</td>
                      <td className="px-3 py-2 text-slate-800">{r.winnerCandidate}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`rounded px-1.5 py-0.5 text-xs font-semibold text-white ${
                            PARTY_CHIP[r.winnerParty] || PARTY_CHIP.Others
                          }`}
                        >
                          {r.winnerParty}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-rose-700">
                        {r.marginVotes?.toLocaleString("en-IN")}
                        <span className="block text-[10px] text-slate-500">{r.marginPercent}% gap</span>
                      </td>
                    </tr>
                  );
                  })}
                </tbody>
              </table>
            </div>
            {!data?.defeated?.length && !loading ? (
              <p className="py-8 text-center text-sm text-slate-500">No defeated candidates match your filters.</p>
            ) : null}
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm">
              <span className="text-slate-500">
                Showing {data?.matchCount ?? 0} of {data?.totalDefeated?.toLocaleString("en-IN") ?? 0}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded border border-slate-300 px-3 py-1 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={!data || page >= data.totalPages || loading}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded border border-slate-300 px-3 py-1 disabled:opacity-40"
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
