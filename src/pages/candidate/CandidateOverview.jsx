import { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthProvider";
import { api } from "../../lib/api";
import { CandidateAvatar } from "../../components/CandidateAvatar";
import { StatCard } from "../../components/StatCard";
import { toastFromError } from "../../lib/toast";

export function CandidateOverview() {
  const { token, user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const d = await api("/api/candidate/overview", { token });
        if (!cancelled) setData(d);
      } catch (e) {
        if (!cancelled) toastFromError(e, "Failed to load overview");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading) return <div className="p-6 text-center text-slate-500">Loading…</div>;

  const c = data?.candidate;
  const m = data?.metrics || {};

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-wrap items-start gap-4 border-b border-slate-100 pb-6">
        <CandidateAvatar candidate={c} className="h-16 w-16" textClassName="text-lg" />
        <div>
          <h2 className="text-xl font-bold text-slate-900">{c?.name || user?.name}</h2>
          <p className="text-sm text-slate-600">
            {c?.partyName} · {c?.constituency} · {c?.assembly}
          </p>
          <p className="mt-1 text-xs text-indigo-600">State focus: {m.stateName}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Constituency rank" value={m.constituencyRank} />
        <StatCard label="Booth coverage" value={m.boothCoverage} />
        <StatCard label="Digital reach" value={m.digitalReach} />
        <StatCard label="Sentiment score" value={m.sentimentScore} />
        <StatCard label="Days to election" value={m.campaignDaysLeft} />
      </div>
    </div>
  );
}
