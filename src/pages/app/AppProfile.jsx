import { useEffect, useState } from "react";
import { LuUser, LuBuilding2, LuMail, LuPhone, LuGlobe, LuMapPin, LuPencil, LuCheck, LuX } from "react-icons/lu";
import { useAuth } from "../../auth/AuthProvider";
import { api } from "../../lib/api";
import { toastFromError, toastSuccess } from "../../lib/toast";

function Field({ label, value }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">{label}</div>
      <div className="text-sm text-slate-800 font-medium">{value || <span className="text-slate-400 font-normal">—</span>}</div>
    </div>
  );
}

export function AppProfile() {
  const { token, user } = useAuth();
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
      <div className="p-6 space-y-4">
        {[1,2,3].map(i => <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow">
            <LuUser className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Profile</h2>
            <p className="text-sm text-slate-500">Your business and contact information</p>
          </div>
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
              { key: "businessName", label: "Business Name",  Icon: LuBuilding2 },
              { key: "fullName",     label: "Full Name",       Icon: LuUser },
              { key: "mobile",       label: "Mobile",          Icon: LuPhone },
              { key: "websiteUrl",   label: "Website URL",     Icon: LuGlobe },
              { key: "city",         label: "City",            Icon: LuMapPin },
              { key: "pincode",      label: "Pincode",         Icon: LuMapPin },
            ].map(({ key, label, Icon }) => (
              <div key={key}>
                <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
                <div className="relative">
                  <Icon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    value={form[key] || ""}
                    onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              </div>
            ))}
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Address</label>
              <div className="relative">
                <LuMapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  value={form.address || ""}
                  onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
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
          {/* Avatar */}
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
            <Field label="Full Name"     value={data?.fullName} />
            <Field label="Email"         value={data?.email} />
            <Field label="Mobile"        value={data?.mobile} />
            <Field label="Website"       value={data?.website} />
            <Field label="City"          value={data?.city} />
            <Field label="Pincode"       value={data?.pincode} />
            <div className="sm:col-span-2 lg:col-span-3">
              <Field label="Address" value={data?.address} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
