import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LuShare2, LuNewspaper, LuRadio, LuSettings, LuTrendingUp, LuUsers, LuLayoutDashboard, LuPencil, LuX } from "react-icons/lu";
import { useAuth } from "../../auth/AuthProvider";
import { api } from "../../lib/api";
import { toastFromError, toastSuccess } from "../../lib/toast";

const QUICK_LINKS = [
  { to: "/app/social",           label: "Social Media",     desc: "Platform stats & posts",          Icon: LuShare2,       color: "from-pink-500 to-violet-500" },
  { to: "/app/news",             label: "News",             desc: "Latest constituency news",         Icon: LuNewspaper,    color: "from-blue-500 to-indigo-500" },
  { to: "/app/digital-mentions", label: "Digital Mentions", desc: "Online sentiment & mentions",      Icon: LuRadio,        color: "from-violet-500 to-indigo-600" },
  { to: "/app/settings",         label: "Settings & Help",  desc: "Profile, connections & FAQ",       Icon: LuSettings,     color: "from-slate-600 to-slate-800" },
];

function StatCard({ label, value, Icon, color }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-white shadow`}>
        <Icon className="h-6 w-6" strokeWidth={1.75} />
      </span>
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</div>
        <div className="mt-0.5 text-2xl font-bold text-slate-900">{value ?? "—"}</div>
      </div>
    </div>
  );
}

export function AppOverview() {
  const { token, user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const d = await api("/api/app/overview", { token });
        if (!cancelled) setData(d);
      } catch (e) {
        if (!cancelled) toastFromError(e, "Failed to load overview");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [token]);

  function openEdit() {
    setForm({
      businessName: data?.businessName || "",
      fullName:     data?.fullName || user?.name || "",
      mobile:       data?.mobile || "",
      websiteUrl:   data?.website || "",
      city:         data?.city || "",
      address:      data?.address || "",
      pincode:      data?.pincode || "",
    });
    setEditOpen(true);
  }

  async function saveProfile(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api("/api/app/profile", { method: "PATCH", token, body: form });
      toastSuccess("Profile updated!");
      const d = await api("/api/app/overview", { token });
      setData(d);
      setEditOpen(false);
    } catch (err) {
      toastFromError(err, "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const businessName = data?.businessName || "Your App";

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Welcome banner */}
      <div className="rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-700 px-5 py-4 text-white shadow-md flex items-center gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/20">
          <LuLayoutDashboard className="h-5 w-5 text-white" strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium text-white/60">Welcome back</p>
          <h2 className="text-lg font-bold tracking-tight truncate">{businessName}</h2>
          <p className="text-xs text-white/60 truncate">Manage candidates, social media, news & digital mentions — all in one place.</p>
        </div>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Total Candidates" value={data?.totalCandidates} Icon={LuUsers}       color="from-emerald-500 to-teal-600" />
          <StatCard label="Agents"           value={data?.agentsCount}    Icon={LuUsers}       color="from-blue-500 to-indigo-600" />
          <StatCard label="Status"           value={data?.isActive ? "Active" : "Inactive"} Icon={LuTrendingUp} color="from-violet-500 to-purple-600" />
        </div>
      )}

      {/* Quick nav */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-600 uppercase tracking-wide">Quick Access</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_LINKS.map(({ to, label, desc, Icon, color }) => (
            <Link
              key={to}
              to={to}
              className="group flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md hover:border-slate-200 transition-all"
            >
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-white shadow group-hover:scale-105 transition-transform`}>
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors">{label}</div>
                <div className="text-xs text-slate-400 truncate">{desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
