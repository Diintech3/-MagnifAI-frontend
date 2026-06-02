import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../auth/AuthProvider";
import { api } from "../../lib/api";
import { toastFromError } from "../../lib/toast";
import { AssemblyPreviewMap } from "./AssemblyPreviewMap";
import { DEFAULT_BODIES, getBodyMeta } from "./ElectionBodyTabs";

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

function PartyStatCards({ stats }) {
  if (!stats?.length) return null;
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {stats.slice(0, 8).map((p) => (
        <div key={p.party} className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-sm ${PARTY_CHIP[p.party] || PARTY_CHIP.Others}`} />
            <span className="text-sm font-semibold text-slate-900">{p.party}</span>
          </div>
          <div className="mt-2 text-2xl font-bold tabular-nums text-slate-900">{p.seats}</div>
          <div className="text-xs text-slate-500">seats · {p.voteShare ? `${p.voteShare}% votes` : "—"}</div>
        </div>
      ))}
    </div>
  );
}

function WardBreakdownBar({ wardBreakdown }) {
  if (!wardBreakdown) return <span className="text-slate-400">—</span>;
  const total = Object.values(wardBreakdown).reduce((s, n) => s + (n || 0), 0);
  if (!total) return <span className="text-slate-400">—</span>;
  const colors = { BJP: "bg-orange-500", SP: "bg-lime-600", BSP: "bg-slate-600", INC: "bg-sky-600", Others: "bg-gray-400" };
  return (
    <div className="flex min-w-[120px] overflow-hidden rounded-full h-2">
      {Object.entries(wardBreakdown).map(([party, n]) =>
        n ? (
          <span
            key={party}
            className={colors[party] || "bg-slate-300"}
            style={{ width: `${(n / total) * 100}%` }}
            title={`${party}: ${n}`}
          />
        ) : null,
      )}
    </div>
  );
}

function ResultsTable({ rows, bodyType, year, stateName }) {
  const isMunicipal = bodyType === "MUNICIPAL";
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-[#eb7f2b] px-5 py-3">
        <h3 className="text-center text-sm font-semibold uppercase text-white">
          {stateName || "Uttar Pradesh"} — {isMunicipal ? "17 Nagar Nigam mayor results" : "Constituency wise winner results"} ({year})
        </h3>
      </div>
      <div className="max-h-[420px] overflow-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="sticky top-0 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">{isMunicipal ? "Nagar Nigam" : "Constituency"}</th>
              <th className="px-3 py-2">District</th>
              <th className="px-3 py-2">Winner</th>
              <th className="px-3 py-2">Party</th>
              {!isMunicipal ? <th className="px-3 py-2 text-right">Votes</th> : null}
              {!isMunicipal ? <th className="px-3 py-2 text-right">%</th> : null}
              {isMunicipal ? <th className="px-3 py-2 text-right">Wards</th> : null}
              {isMunicipal ? <th className="px-3 py-2">Ward split (BJP/SP/BSP/INC)</th> : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={`${r.acNo}-${r.acName}`} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-2 tabular-nums text-slate-500">{r.acNo}</td>
                <td className="px-3 py-2 font-medium text-slate-900">{r.acName}</td>
                <td className="px-3 py-2 text-slate-600">{r.district}</td>
                <td className="px-3 py-2">{r.candidate}</td>
                <td className="px-3 py-2">
                  <span className={`rounded px-1.5 py-0.5 text-xs font-semibold text-white ${PARTY_CHIP[r.party] || PARTY_CHIP.Others}`}>
                    {r.party}
                  </span>
                </td>
                {!isMunicipal ? (
                  <>
                    <td className="px-3 py-2 text-right tabular-nums">{r.votes?.toLocaleString() || "—"}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{r.votePercent || "—"}</td>
                  </>
                ) : (
                  <>
                    <td className="px-3 py-2 text-right tabular-nums">{r.totalWards || "—"}</td>
                    <td className="px-3 py-2">
                      <WardBreakdownBar wardBreakdown={r.wardBreakdown} />
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MunicipalSummary({ summary }) {
  if (!summary) return null;
  const blocks = [
    { title: "Nagar Nigam — Mayor", data: summary.nagarNigamMayor },
    { title: "Nagar Palika — Chairman", data: summary.nagarPalikaChairman },
    { title: "Nagar Panchayat — Chairman", data: summary.nagarPanchayatChairman },
  ];
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {blocks.map((b) => (
        <div key={b.title} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{b.title}</h4>
          <ul className="mt-3 space-y-1.5 text-sm">
            {Object.entries(b.data || {}).map(([party, seats]) => (
              <li key={party} className="flex justify-between">
                <span className="font-medium text-slate-700">{party}</span>
                <span className="tabular-nums font-semibold text-slate-900">{seats}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function UpDataBanner({ stateName }) {
  return (
    <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-950">
      <strong>{stateName}</strong> (UP) — Vidhan Sabha (403 MLA), Lok Sabha (80 MP), Vidhan Parishad (36 MLC), aur
      Municipality (17 Nagar Nigam + 760 urban bodies, 2023) ka official-style dataset yahan load hota hai.
    </div>
  );
}

export function ElectionBodyPanel({ stateCode, stateName, bodyType, year, onAnalyticsLoaded }) {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  const meta = useMemo(() => getBodyMeta(DEFAULT_BODIES, bodyType), [bodyType]);

  const onAnalyticsLoadedRef = useRef(onAnalyticsLoaded);
  useEffect(() => {
    onAnalyticsLoadedRef.current = onAnalyticsLoaded;
  }, [onAnalyticsLoaded]);

  const load = useCallback(async () => {
    if (stateCode !== "UP" || bodyType === "VIDHAN_SABHA") return;
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        bodyType,
        year: String(year),
        search: appliedSearch,
      });
      const d = await api(`/api/admin/election-analytics/${stateCode}?${qs.toString()}`, { token });
      setData(d);
      onAnalyticsLoadedRef.current?.(d);
    } catch (e) {
      toastFromError(e, "Failed to load election body data");
    } finally {
      setLoading(false);
    }
  }, [stateCode, token, bodyType, year, appliedSearch]);

  useEffect(() => {
    if (bodyType !== "VIDHAN_SABHA") load();
    else setData(null);
  }, [load, bodyType]);

  const handleVidhanDataLoaded = useCallback((d) => {
    setData(d);
    onAnalyticsLoadedRef.current?.(d);
  }, []);

  if (stateCode !== "UP") {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-8 text-center text-sm text-amber-950">
        <p className="font-semibold">Uttar Pradesh data is required for this section</p>
        <p className="mt-2 text-amber-800">
          {stateName || stateCode} ke liye body-wise results abhi load nahi hain. Upar state tabs se{" "}
          <strong>Uttar Pradesh (UP)</strong> select karein — Vidhan Sabha map, Lok Sabha, MLC, aur Municipality data
          milega.
        </p>
      </div>
    );
  }

  if (bodyType === "VIDHAN_SABHA") {
    return (
      <div className="space-y-4">
        <UpDataBanner stateName="Uttar Pradesh" />
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <strong className="text-slate-900">Vidhan Sabha (MLA)</strong> — official constituency map, filters, and
          winner list. Charts and strategic breakdown are under the <strong>Analysis</strong> tab.
        </div>
        <AssemblyPreviewMap
          stateCode={stateCode}
          stateName="Uttar Pradesh"
          bodyType="VIDHAN_SABHA"
          year={year}
          onDataLoaded={handleVidhanDataLoaded}
        />
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center text-sm text-slate-500">
        Loading {meta?.label} data…
      </div>
    );
  }

  if (!data?.supported) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-6 text-sm text-amber-900">
        {data?.message || `${meta?.label} data unavailable.`}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <UpDataBanner stateName={data.stateName || "Uttar Pradesh"} />
      <div className="flex flex-wrap items-end justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-600">
            {data.stateName || "Uttar Pradesh"} · {data.stateCode || "UP"}
          </p>
          <h3 className="text-base font-semibold text-slate-900">
            {data.bodyLabel || meta?.label} — {data.role} ({year})
          </h3>
          <p className="text-xs text-slate-500">{data.source}</p>
          {bodyType === "MUNICIPAL" && data.totalUrbanBodies ? (
            <p className="mt-1 text-xs text-slate-600">
              {data.totalSeats} Nagar Nigam (mayor) · {data.totalUrbanBodies} total urban local bodies in UP (2023 cycle)
            </p>
          ) : null}
        </div>
        <form
          className="flex items-center gap-2 text-xs"
          onSubmit={(e) => {
            e.preventDefault();
            setAppliedSearch(search.trim());
          }}
        >
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search seat or candidate"
            className="rounded border border-slate-300 px-2 py-1.5"
          />
          <button type="submit" className="rounded bg-slate-800 px-3 py-1.5 text-white">
            Search
          </button>
        </form>
      </div>

      <PartyStatCards stats={data.partyStats} />

      {bodyType === "MUNICIPAL" ? <MunicipalSummary summary={data.summary} /> : null}

      <ResultsTable
        rows={data.constituencies || []}
        bodyType={bodyType}
        year={year}
        stateName={data.stateName || "Uttar Pradesh"}
      />
      {data.constituencies?.length ? (
        <p className="text-xs text-slate-500">
          Showing {data.matchCount} of {data.totalConstituencies} records.
        </p>
      ) : null}
    </div>
  );
}
