import { Link, useSearchParams } from "react-router-dom";
import { ElectionDefeatsPanel } from "../../components/admin/ElectionDefeatsPanel";
import { ElectionWinnersPanel } from "../../components/admin/ElectionWinnersPanel";

export function AdminElectionDefeatedPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "defeated";

  return (
    <div className="-m-4 flex min-h-[calc(100dvh-3.5rem)] flex-col bg-[#f3ede4] sm:-m-6">
      <div className="shrink-0 border-b border-amber-200/70 bg-gradient-to-br from-[#f5e8e6] via-[#faf6f0] to-[#e5efe8] px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <Link
              to="/admin/election"
              className="text-sm font-medium text-teal-800 hover:text-teal-950 hover:underline"
            >
              ← Back to Election desk
            </Link>
            <h1 className="mt-1 text-xl font-bold tracking-tight text-emerald-950 sm:text-2xl">
              Uttar Pradesh — Winners & Defeated (All results)
            </h1>
            <p className="mt-1 text-sm text-stone-700">
              Tab-wise view — both winner and defeated data in one place.
            </p>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-4 sm:p-6">
        <div className="mb-4 flex gap-1 rounded-xl border border-amber-200/70 bg-[#faf6f0] p-1">
          <button
            type="button"
            onClick={() => {
              const p = new URLSearchParams(searchParams);
              p.set("tab", "winners");
              if (!p.get("page")) p.set("page", "1");
              setSearchParams(p, { replace: true });
            }}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${
              tab === "winners" ? "bg-teal-900 text-amber-50" : "text-stone-700 hover:bg-amber-50/60"
            }`}
          >
            Winners
          </button>
          <button
            type="button"
            onClick={() => {
              const p = new URLSearchParams(searchParams);
              p.set("tab", "defeated");
              if (!p.get("page")) p.set("page", "1");
              setSearchParams(p, { replace: true });
            }}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${
              tab === "defeated" ? "bg-[#c0392b] text-amber-50" : "text-stone-700 hover:bg-amber-50/60"
            }`}
          >
            Defeated
          </button>
        </div>

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
