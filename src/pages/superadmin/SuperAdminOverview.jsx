import { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthProvider";
import { api } from "../../lib/api";
import { toastFromError } from "../../lib/toast";

function StatCard({ label, value, highlight }) {
  return (
    <div
      className={
        highlight
          ? "rounded-lg border border-amber-200 bg-amber-400 p-5 shadow-sm"
          : "rounded-lg border border-slate-200 bg-slate-50 p-5"
      }
    >
      <div className={highlight ? "text-sm font-medium text-amber-950/80" : "text-sm text-slate-500"}>
        {label}
      </div>
      <div
        className={
          highlight ? "mt-2 text-3xl font-bold text-amber-950" : "mt-2 text-3xl font-bold text-slate-900"
        }
      >
        {value ?? 0}
      </div>
    </div>
  );
}

export function SuperAdminOverview() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      try {
        const d = await api("/api/superadmin/overview", { token });
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
        <h2 className="text-xl font-bold text-slate-900">Super Admin Overview</h2>
        <p className="mt-1 text-sm text-slate-500">Live stats from database</p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Admins" value={data?.totalAdmins} />
        <StatCard label="Active Admins" value={data?.activeAdmins} />
        <StatCard label="Total Apps" value={data?.totalApps} />
        <StatCard
          label="Inactive Admins"
          value={data?.inactiveAdmins}
          highlight={(data?.inactiveAdmins ?? 0) > 0}
        />
      </div>
    </div>
  );
}
