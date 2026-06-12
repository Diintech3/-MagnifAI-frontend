import { useEffect, useState } from "react";
import { LuUser, LuBuilding2, LuPhone, LuGlobe, LuMapPin, LuPencil, LuCheck, LuX, LuRadio, LuTrendingUp, LuTrendingDown, LuMinus, LuExternalLink, LuCalendar } from "react-icons/lu";
import { useAuth } from "../../auth/AuthProvider";
import { api } from "../../lib/api";
import { toastFromError, toastSuccess } from "../../lib/toast";

// ── Profile Tab ────────────────────────────────────────────

function Field({ label, value }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">{label}</div>
      <div className="text-sm text-slate-800 font-medium">{value || <span className="text-slate-400 font-normal">—</span>}</div>
    </div>
  );
}

function ProfileTab({ token, user }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const d = await api("/api/app/overview", { token });
      setData(d);
    } catch (e) {
      toastFromError(e, "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [token]);

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
    setEditing(true);
  }

  async function onSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api("/api/app/profile", { method: "PATCH", token, body: form });
      toastSuccess("Profile updated!");
      await load();
      setEditing(false);
    } catch (err) {
      toastFromError(err, "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Profile</h3>
          <p className="text-sm text-slate-500">Your business and contact information</p>
        </div>
        {!editing && (
          <button onClick={openEdit}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm">
            <LuPencil className="h-4 w-4" /> Edit
          </button>
        )}
      </div>

      {editing ? (
        <form onSubmit={onSave} className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { key: "businessName", label: "Business Name", Icon: LuBuilding2 },
              { key: "fullName",     label: "Full Name",      Icon: LuUser },
              { key: "mobile",       label: "Mobile",         Icon: LuPhone },
              { key: "websiteUrl",   label: "Website URL",    Icon: LuGlobe },
              { key: "city",         label: "City",           Icon: LuMapPin },
              { key: "pincode",      label: "Pincode",        Icon: LuMapPin },
            ].map(({ key, label, Icon }) => (
              <div key={key}>
                <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
                <div className="relative">
                  <Icon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input value={form[key] || ""} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
              </div>
            ))}
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Address</label>
              <div className="relative">
                <LuMapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input value={form.address || ""} onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button type="button" onClick={() => setEditing(false)}
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              <LuX className="h-4 w-4" /> Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
              <LuCheck className="h-4 w-4" /> {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-2xl font-bold shadow">
              {(data?.businessName || data?.fullName || "?")[0].toUpperCase()}
            </div>
            <div>
              <div className="text-lg font-bold text-slate-900">{data?.businessName || "—"}</div>
              <div className="text-sm text-slate-500">{data?.email}</div>
              <span className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${data?.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                {data?.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Full Name" value={data?.fullName} />
            <Field label="Email"     value={data?.email} />
            <Field label="Mobile"    value={data?.mobile} />
            <Field label="Website"   value={data?.website} />
            <Field label="City"      value={data?.city} />
            <Field label="Pincode"   value={data?.pincode} />
            <div className="sm:col-span-2 lg:col-span-3">
              <Field label="Address" value={data?.address} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Digital Mentions Signatures Tab ───────────────────────

const SENTIMENT_STYLE = {
  positive: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", bar: "bg-emerald-500", Icon: LuTrendingUp },
  negative: { bg: "bg-rose-50",    text: "text-rose-700",    border: "border-rose-200",    bar: "bg-rose-500",    Icon: LuTrendingDown },
  neutral:  { bg: "bg-slate-50",   text: "text-slate-600",   border: "border-slate-200",   bar: "bg-slate-400",   Icon: LuMinus },
};

function SentimentBar({ label, count, total, sentiment }) {
  const s = SENTIMENT_STYLE[sentiment] || SENTIMENT_STYLE.neutral;
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className={`rounded-xl border ${s.border} ${s.bg} p-4`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <s.Icon className={`h-4 w-4 ${s.text}`} strokeWidth={1.75} />
          <span className={`text-sm font-semibold ${s.text}`}>{label}</span>
        </div>
        <span className={`text-lg font-bold ${s.text}`}>{count?.toLocaleString("en-IN") ?? 0}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/60">
        <div className={`h-full rounded-full ${s.bar} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <div className={`mt-1 text-right text-[11px] ${s.text}`}>{pct}% of total</div>
    </div>
  );
}

function MentionCard({ mention }) {
  const s = SENTIMENT_STYLE[mention.sentiment] || SENTIMENT_STYLE.neutral;
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-slate-500">{mention.source || "Unknown"}</span>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${s.border} ${s.bg} ${s.text}`}>
              {mention.sentiment}
            </span>
          </div>
          <p className="text-sm text-slate-800 line-clamp-2">{mention.text || mention.title || "—"}</p>
        </div>
        {mention.url && (
          <a href={mention.url} target="_blank" rel="noopener noreferrer"
            className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition">
            <LuExternalLink className="h-4 w-4" strokeWidth={1.75} />
          </a>
        )}
      </div>
      <div className="mt-2 flex items-center gap-1 text-[11px] text-slate-400">
        <LuCalendar className="h-3 w-3" />
        {mention.date ? new Date(mention.date).toLocaleDateString("en-IN") : "—"}
      </div>
    </div>
  );
}

const RANGE_OPTIONS = [
  { value: "7",  label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
];

const emptySigForm = { name: "", designation: "", company: "", linkedinUrl: "" };

function DigitalMentionsSignaturesTab({ token }) {
  // Signature info
  const [sigForm, setSigForm] = useState(emptySigForm);
  const [sigSaved, setSigSaved] = useState(false);
  const [sigEditing, setSigEditing] = useState(true);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("dm_signature") || "null");
      if (saved) { setSigForm(saved); setSigEditing(false); setSigSaved(true); }
    } catch { /* ignore */ }
  }, []);

  function onSigSave(e) {
    e.preventDefault();
    localStorage.setItem("dm_signature", JSON.stringify(sigForm));
    setSigEditing(false);
    setSigSaved(true);
    toastSuccess("Signature info saved!");
  }

  // Digital Mentions
  const [range, setRange] = useState("30");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api(`/api/app/digital-mentions?range=${range}`, { token })
      .then(d => { if (!cancelled) setData(d); })
      .catch(e => toastFromError(e, "Failed to load digital mentions"))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token, range]);

  const total = (data?.positive ?? 0) + (data?.negative ?? 0) + (data?.neutral ?? 0);
  const mentions = data?.mentions || [];

  return (
    <div className="space-y-8">

      {/* Signature Info */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-bold text-slate-900">Signature Info</h3>
            <p className="text-sm text-slate-500">Your identity details for digital signatures</p>
          </div>
          {!sigEditing && (
            <button onClick={() => setSigEditing(true)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm">
              <LuPencil className="h-4 w-4" /> Edit
            </button>
          )}
        </div>

        {sigEditing ? (
          <form onSubmit={onSigSave} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
                <div className="relative">
                  <LuUser className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input value={sigForm.name} onChange={e => setSigForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="Enter full name" required
                    className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Designation</label>
                <div className="relative">
                  <LuBuilding2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input value={sigForm.designation} onChange={e => setSigForm(p => ({ ...p, designation: e.target.value }))}
                    placeholder="e.g. CEO, Co-Founder"
                    className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Company Name</label>
                <div className="relative">
                  <LuBuilding2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input value={sigForm.company} onChange={e => setSigForm(p => ({ ...p, company: e.target.value }))}
                    placeholder="e.g. Acme Corp"
                    className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">LinkedIn URL</label>
                <div className="relative">
                  <LuGlobe className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input value={sigForm.linkedinUrl} onChange={e => setSigForm(p => ({ ...p, linkedinUrl: e.target.value }))}
                    placeholder="https://linkedin.com/in/yourprofile"
                    className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              {sigSaved && (
                <button type="button" onClick={() => setSigEditing(false)}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  <LuX className="h-4 w-4" /> Cancel
                </button>
              )}
              <button type="submit"
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
                <LuCheck className="h-4 w-4" /> Save
              </button>
            </div>
          </form>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {[
              { label: "Name",         value: sigForm.name },
              { label: "Designation",  value: sigForm.designation },
              { label: "Company Name", value: sigForm.company },
              { label: "LinkedIn URL", value: sigForm.linkedinUrl, link: true },
            ].map(({ label, value, link }) => (
              <div key={label}>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">{label}</div>
                {link && value
                  ? <a href={value} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:underline break-all">{value}</a>
                  : <div className="text-sm font-medium text-slate-800">{value || <span className="text-slate-400 font-normal">—</span>}</div>
                }
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Digital Mentions */}
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Digital Mentions</h3>
            <p className="text-sm text-slate-500">Online mentions &amp; sentiment analysis</p>
          </div>
          <div className="flex gap-1.5">
            {RANGE_OPTIONS.map((r) => (
              <button key={r.value} type="button" onClick={() => setRange(r.value)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                  range === r.value
                    ? "border-violet-500 bg-violet-600 text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}>
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white text-sm text-slate-400">
            <span className="animate-pulse">Analyzing mentions…</span>
          </div>
        ) : !data ? (
          <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white text-sm text-slate-400">
            No mention data available yet.
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-violet-100 bg-gradient-to-r from-violet-50 to-indigo-50 px-5 py-4">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-violet-500">Total Mentions</div>
              <div className="mt-1 text-3xl font-bold text-violet-900">{total.toLocaleString("en-IN")}</div>
              <div className="mt-0.5 text-xs text-slate-500">Across all online sources in the selected period</div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <SentimentBar label="Positive" count={data.positive} total={total} sentiment="positive" />
              <SentimentBar label="Negative" count={data.negative} total={total} sentiment="negative" />
              <SentimentBar label="Neutral"  count={data.neutral}  total={total} sentiment="neutral" />
            </div>
            {mentions.length ? (
              <div>
                <h3 className="mb-3 text-sm font-semibold text-slate-700">Recent Mentions</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {mentions.map((m, i) => <MentionCard key={m.id ?? i} mention={m} />)}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white py-10 text-center text-sm text-slate-400">
                No individual mentions to display.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Main AppProfile with Tabs ──────────────────────────────

const TABS = [
  { id: "profile",          label: "Profile",                    Icon: LuUser },
  { id: "digital-mentions", label: "Digital Mentions Signatures", Icon: LuRadio },
];

export function AppProfile() {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className="space-y-0 p-4 sm:p-6">
      <div className="flex items-center gap-3 mb-6">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow">
          <LuUser className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Profile</h2>
          <p className="text-sm text-slate-500">Manage your profile, mentions &amp; signatures</p>
        </div>
      </div>

      <div className="mb-6 flex gap-1 rounded-xl bg-slate-100 p-1 w-fit">
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} type="button" onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
              activeTab === id ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}>
            <Icon className="h-4 w-4" strokeWidth={1.75} />
            {label}
          </button>
        ))}
      </div>

      {activeTab === "profile" && <ProfileTab token={token} user={user} />}
      {activeTab === "digital-mentions" && <DigitalMentionsSignaturesTab token={token} />}
    </div>
  );
}
