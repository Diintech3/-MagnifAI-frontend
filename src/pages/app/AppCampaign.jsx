import { useEffect, useRef, useState } from "react";
import {
  LuMegaphone, LuPlus, LuCalendar, LuTarget, LuTrendingUp,
  LuPencil, LuTrash2, LuCheck, LuX, LuClock, LuEye, LuEllipsisVertical,
} from "react-icons/lu";
import { useAuth } from "../../auth/AuthProvider";
import { api } from "../../lib/api";
import { toastFromError, toastSuccess } from "../../lib/toast";

const STATUS_STYLES = {
  active:    { badge: "bg-green-100 text-green-700",  bar: "bg-green-500" },
  planned:   { badge: "bg-blue-100 text-blue-700",    bar: "bg-blue-500" },
  completed: { badge: "bg-slate-100 text-slate-600",  bar: "bg-slate-400" },
  paused:    { badge: "bg-amber-100 text-amber-700",  bar: "bg-amber-500" },
};

const EMPTY_FORM = { name: "", description: "", status: "planned", startDate: "", endDate: "", goal: "" };

// ── 3-dot Dropdown ────────────────────────────────────────────────────────────
function CardMenu({ onView, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(v => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition">
        <LuEllipsisVertical className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-50 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg py-1">
          <button onClick={() => { onView(); setOpen(false); }}
            className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition">
            <LuEye className="h-4 w-4 text-indigo-500" /> View
          </button>
          <button onClick={() => { onEdit(); setOpen(false); }}
            className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition">
            <LuPencil className="h-4 w-4 text-amber-500" /> Edit
          </button>
          <div className="my-1 border-t border-slate-100" />
          <button onClick={() => { onDelete(); setOpen(false); }}
            className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition">
            <LuTrash2 className="h-4 w-4" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

// ── Campaign Card ─────────────────────────────────────────────────────────────
function CampaignCard({ campaign, onView, onEdit, onDelete }) {
  const st = STATUS_STYLES[campaign.status] || STATUS_STYLES.planned;
  return (
    <div className="group rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all overflow-hidden">
      {/* Color bar */}
      <div className={`h-1 w-full ${st.bar}`} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <span className={`mb-2 inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize ${st.badge}`}>
              {campaign.status}
            </span>
            <h3 className="text-sm font-bold text-slate-900 truncate leading-tight">{campaign.name}</h3>
          </div>
          <CardMenu onView={onView} onEdit={onEdit} onDelete={onDelete} />
        </div>

        {campaign.description && (
          <p className="text-xs text-slate-500 line-clamp-2 mb-3">{campaign.description}</p>
        )}

        <div className="flex flex-col gap-1.5 text-xs text-slate-500">
          {campaign.goal && (
            <span className="flex items-center gap-1.5">
              <LuTarget className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <span className="truncate">{campaign.goal}</span>
            </span>
          )}
          {campaign.startDate && (
            <span className="flex items-center gap-1.5">
              <LuCalendar className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
              {new Date(campaign.startDate).toLocaleDateString("en-IN")}
              {campaign.endDate && <> → {new Date(campaign.endDate).toLocaleDateString("en-IN")}</>}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── View Modal ────────────────────────────────────────────────────────────────
function ViewModal({ campaign, onClose, onEdit }) {
  const st = STATUS_STYLES[campaign.status] || STATUS_STYLES.planned;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl" onClick={e => e.stopPropagation()}>
        <div className={`h-1.5 w-full rounded-t-2xl ${st.bar}`} />
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <span className={`mb-1 inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize ${st.badge}`}>
                {campaign.status}
              </span>
              <h3 className="text-lg font-bold text-slate-900">{campaign.name}</h3>
            </div>
            <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 transition">
              <LuX className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3 text-sm">
            {campaign.description && (
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Description</div>
                <p className="text-slate-700">{campaign.description}</p>
              </div>
            )}
            {campaign.goal && (
              <div className="flex items-center gap-2">
                <LuTarget className="h-4 w-4 text-emerald-500" />
                <span className="text-slate-700">{campaign.goal}</span>
              </div>
            )}
            {campaign.startDate && (
              <div className="flex items-center gap-2">
                <LuCalendar className="h-4 w-4 text-indigo-400" />
                <span className="text-slate-700">
                  {new Date(campaign.startDate).toLocaleDateString("en-IN")}
                  {campaign.endDate && ` → ${new Date(campaign.endDate).toLocaleDateString("en-IN")}`}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <LuClock className="h-4 w-4 text-slate-400" />
              <span className="text-slate-500">Created {new Date(campaign.createdAt).toLocaleDateString("en-IN")}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-100">
            <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Close
            </button>
            <button onClick={onEdit} className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
              <LuPencil className="h-3.5 w-3.5" /> Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Edit / Create Modal ───────────────────────────────────────────────────────
function FormModal({ initial, onSave, onClose, saving }) {
  const [form, setForm] = useState(initial ? {
    name: initial.name || "", description: initial.description || "",
    status: initial.status || "planned", goal: initial.goal || "",
    startDate: initial.startDate ? initial.startDate.slice(0, 10) : "",
    endDate:   initial.endDate   ? initial.endDate.slice(0, 10)   : "",
  } : EMPTY_FORM);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="text-base font-bold text-slate-900">{initial?._id ? "Edit Campaign" : "New Campaign"}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 transition">
            <LuX className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Campaign Name *</label>
            <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Lok Sabha 2024 Outreach"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
            <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={3}
              placeholder="Campaign objective..." className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
              <select value={form.status} onChange={e => set("status", e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                <option value="planned">Planned</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Goal</label>
              <input value={form.goal} onChange={e => set("goal", e.target.value)} placeholder="e.g. 10,000 reach"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Start Date</label>
              <input type="date" value={form.startDate} onChange={e => set("startDate", e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">End Date</label>
              <input type="date" value={form.endDate} onChange={e => set("endDate", e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
          <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Cancel
          </button>
          <button onClick={() => onSave(form)} disabled={saving || !form.name.trim()}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
            <LuCheck className="h-4 w-4" /> {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Delete Confirm Modal ──────────────────────────────────────────────────────
function DeleteModal({ campaign, onConfirm, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl p-6" onClick={e => e.stopPropagation()}>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mx-auto mb-4">
          <LuTrash2 className="h-5 w-5 text-red-600" />
        </div>
        <h3 className="text-base font-bold text-slate-900 text-center mb-1">Delete Campaign?</h3>
        <p className="text-sm text-slate-500 text-center mb-6">
          "<span className="font-medium text-slate-700">{campaign.name}</span>" will be permanently deleted.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-700">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function AppCampaign() {
  const { token } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formModal, setFormModal] = useState(null); // null | "new" | campaign object
  const [viewModal, setViewModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const d = await api("/api/app/campaigns", { token });
      setCampaigns(d.campaigns || []);
    } catch (e) { toastFromError(e, "Failed to load campaigns"); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [token]);

  async function onSave(form) {
    setSaving(true);
    try {
      if (formModal?._id) {
        await api(`/api/app/campaigns/${formModal._id}`, { method: "PATCH", token, body: form });
        toastSuccess("Campaign updated!");
      } else {
        await api("/api/app/campaigns", { method: "POST", token, body: form });
        toastSuccess("Campaign created!");
      }
      setFormModal(null);
      load();
    } catch (e) { toastFromError(e, "Failed to save"); }
    finally { setSaving(false); }
  }

  async function onDeleteConfirm() {
    try {
      await api(`/api/app/campaigns/${deleteModal._id}`, { method: "DELETE", token });
      toastSuccess("Campaign deleted");
      setDeleteModal(null);
      load();
    } catch (e) { toastFromError(e, "Failed to delete"); }
  }

  const counts = {
    active:    campaigns.filter(c => c.status === "active").length,
    planned:   campaigns.filter(c => c.status === "planned").length,
    completed: campaigns.filter(c => c.status === "completed").length,
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-rose-600 text-white shadow">
            <LuMegaphone className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Campaigns</h2>
            <p className="text-sm text-slate-500">Manage your election campaigns</p>
          </div>
        </div>
        <button onClick={() => setFormModal("new")}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition shadow-sm">
          <LuPlus className="h-4 w-4" /> New Campaign
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Active",    value: counts.active,    Icon: LuTrendingUp, color: "bg-green-500" },
          { label: "Planned",   value: counts.planned,   Icon: LuCalendar,   color: "bg-blue-500" },
          { label: "Completed", value: counts.completed, Icon: LuCheck,      color: "bg-slate-500" },
        ].map(({ label, value, Icon, color }) => (
          <div key={label} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${color} text-white`}>
              <Icon className="h-4 w-4" strokeWidth={1.75} />
            </span>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</div>
              <div className="text-xl font-bold text-slate-900">{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Cards */}
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1,2,3].map(i => <div key={i} className="h-36 animate-pulse rounded-2xl bg-slate-100" />)}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
          <LuMegaphone className="mx-auto mb-3 h-10 w-10 text-slate-300" strokeWidth={1.5} />
          <p className="text-sm font-semibold text-slate-500">No campaigns yet</p>
          <p className="text-xs text-slate-400 mt-1">Click "New Campaign" to get started</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map(c => (
            <CampaignCard key={c._id} campaign={c}
              onView={() => setViewModal(c)}
              onEdit={() => setFormModal(c)}
              onDelete={() => setDeleteModal(c)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {formModal && (
        <FormModal
          initial={formModal === "new" ? null : formModal}
          onSave={onSave}
          onClose={() => setFormModal(null)}
          saving={saving}
        />
      )}
      {viewModal && (
        <ViewModal
          campaign={viewModal}
          onClose={() => setViewModal(null)}
          onEdit={() => { setFormModal(viewModal); setViewModal(null); }}
        />
      )}
      {deleteModal && (
        <DeleteModal
          campaign={deleteModal}
          onConfirm={onDeleteConfirm}
          onClose={() => setDeleteModal(null)}
        />
      )}
    </div>
  );
}
