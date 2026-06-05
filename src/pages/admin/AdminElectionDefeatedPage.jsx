import { Link, useSearchParams } from "react-router-dom";
import { LuTrophy, LuUsers } from "react-icons/lu";
import { ElectionDefeatsPanel } from "../../components/admin/ElectionDefeatsPanel";
import { ElectionWinnersPanel } from "../../components/admin/ElectionWinnersPanel";

export function AdminElectionDefeatedPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "winners";

  function setTab(t) {
    const p = new URLSearchParams(searchParams);
    p.set("tab", t);
    p.set("page", "1");
    setSearchParams(p, { replace: true });
  }

  return (
    <div className="-m-4 flex min-h-[calc(100dvh-3.5rem)] flex-col bg-[#f3ede4] sm:-m-6 overflow-hidden">

      {/* ── Header ── */}
      <div className="shrink-0 border-b border-amber-200/70 bg-gradient-to-r from-[#e5efe8] via-[#faf6f0] to-[#f0e6dc] px-4 py-5 sm:px-6">
        <Link to="/admin/election" className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-700 hover:text-teal-900 hover:underline">
          ← Election Desk
        </Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-emerald-950">
          Constituency — Election Results
        </h1>
        <p className="mt-0.5 text-sm text-stone-600">
          Uttar Pradesh · Click any row to open full candidate detail
        </p>
      </div>

      {/* ── Tab Bar ── */}
      <div className="shrink-0 border-b border-amber-200/60 bg-[#faf6f0] px-4 sm:px-6">
        <div className="flex">
          <button
            type="button"
            onClick={() => setTab("winners")}
            className={`relative flex items-center gap-2 px-5 py-3.5 text-sm font-semibold transition-colors ${
              tab === "winners"
                ? "text-emerald-900 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-emerald-700"
                : "text-stone-500 hover:text-stone-800"
            }`}
          >
            <LuTrophy className="h-4 w-4" />
            Winners
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              tab === "winners" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"
            }`}>403</span>
          </button>
          <button
            type="button"
            onClick={() => setTab("defeated")}
            className={`relative flex items-center gap-2 px-5 py-3.5 text-sm font-semibold transition-colors ${
              tab === "defeated"
                ? "text-rose-900 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-rose-600"
                : "text-stone-500 hover:text-stone-800"
            }`}
          >
            <LuUsers className="h-4 w-4" />
            Losers
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4 sm:p-6">
        {tab === "winners" ? (
          <ElectionWinnersPanel searchParams={searchParams} onSearchParamsChange={setSearchParams} />
        ) : (
          <ElectionDefeatsPanel
            stateCode="UP"
            stateName="Uttar Pradesh"
            fullPage
            searchParams={searchParams}
            onSearchParamsChange={setSearchParams}
          />
        )}
      </div>
    </div>
  );
}
