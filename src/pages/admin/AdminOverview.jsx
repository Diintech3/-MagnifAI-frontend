import { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthProvider";
import { api } from "../../lib/api";
import { StatCard } from "../../components/StatCard";
import { toastFromError } from "../../lib/toast";

export function AdminOverview() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      try {
        const d = await api("/api/admin/overview", { token });
        if (!cancelled) setData(d);
      } catch (e) {
        if (!cancelled) toastFromError(e, "Failed to load overview");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading) return <div className="p-6 text-slate-500">Loading…</div>;

  return (
    <div className="p-6">
      <div className="border-b border-slate-100 pb-5">
        <h2 className="text-xl font-bold text-slate-900">Admin Overview</h2>
        <p className="mt-1 text-sm text-slate-500">{data?.message}</p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="Total Apps" value={data?.totalApps} />
        <StatCard label="Active Apps" value={data?.activeApps} />
      </div>
    </div>
  );
}
