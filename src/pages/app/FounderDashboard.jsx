import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../auth/AuthProvider";
import { api } from "../../lib/api";
import { AddCEOModal } from "../../components/AddCEOModal";
import { IconCog } from "../../components/icons";
import { toastFromError, toastSuccess } from "../../lib/toast";

function RowActions({ ceo, onEdit, onDelete, onView }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
        aria-label="Settings"
      >
        <IconCog className="h-5 w-5" />
      </button>
      {open ? (
        <div className="absolute right-0 z-20 mt-1 w-36 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          <button
            type="button"
            onClick={() => { setOpen(false); onEdit(ceo); }}
            className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => { setOpen(false); onView(ceo); }}
            className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
          >
            View
          </button>
          <button
            type="button"
            onClick={() => { setOpen(false); onDelete(ceo); }}
            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      ) : null}
    </div>
  );
}

function ViewField({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-900 break-words">{value || "—"}</dd>
    </div>
  );
}

function CEOAvatar({ ceo, className = "h-9 w-9", textClassName = "text-sm" }) {
  if (ceo.photoUrl) {
    return (
      <img
        src={ceo.photoUrl}
        alt={ceo.name}
        className={`${className} rounded-full object-cover border border-slate-200`}
      />
    );
  }
  return (
    <div
      className={`${className} rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold shrink-0 ${textClassName}`}
    >
      {ceo.name?.charAt(0)?.toUpperCase() || "C"}
    </div>
  );
}

export function FounderDashboard() {
  const { token } = useAuth();
  const [ceos, setCeos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editCEO, setEditCEO] = useState(null);
  const [viewCEO, setViewCEO] = useState(null);
  const [loginLoadingId, setLoginLoadingId] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const q = search.trim() ? `?q=${encodeURIComponent(search.trim())}` : "";
      const d = await api(`/api/app/ceos${q}`, { token });
      setCeos(d.ceos || []);
    } catch (e) {
      toastFromError(e, "Failed to load CEOs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, search]);

  const count = useMemo(() => ceos.length, [ceos]);

  function openCreate() {
    setEditCEO(null);
    setModalOpen(true);
  }

  function openEdit(c) {
    setEditCEO(c);
    setModalOpen(true);
  }

  async function onDelete(c) {
    if (!window.confirm(`Delete CEO "${c.name}"?`)) return;
    try {
      await api(`/api/app/ceos/${c.id}`, { method: "DELETE", token });
      toastSuccess("CEO deleted successfully");
      await load();
    } catch (e) {
      toastFromError(e, "Failed to delete CEO");
    }
  }

  async function onLoginAs(c) {
    setLoginLoadingId(c.id);
    try {
      const data = await api(`/api/app/ceos/${c.id}/login-as`, { method: "POST", token });
      const url = new URL("/app", window.location.origin);
      url.searchParams.set("session", data.accessToken);
      window.open(url.toString(), "_blank", "noopener,noreferrer");
      toastSuccess("CEO dashboard opened in new tab");
    } catch (e) {
      toastFromError(e, "Failed to login as CEO");
    } finally {
      setLoginLoadingId(null);
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900">CEOs / Founders</h2>
          <p className="mt-1 text-sm text-slate-500">{count} CEO(s)</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-lg bg-[#f97316] px-4 py-2 text-sm font-semibold text-white hover:bg-[#ea580c]"
        >
          + Add New CEO
        </button>
      </div>

      <div className="relative mt-5 max-w-md">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, company, industry…"
          className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        />
        <svg
          className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
        </svg>
      </div>

      <div className="mt-5 overflow-hidden rounded-lg border border-slate-200">
        {loading ? (
          <div className="px-4 py-12 text-center text-slate-500">Loading…</div>
        ) : ceos.length ? (
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr className="text-slate-700">
                  <th className="w-10 px-2 py-3 font-semibold">#</th>
                  <th className="w-14 px-2 py-3 font-semibold">Photo</th>
                  <th className="w-[18%] px-2 py-3 font-semibold">Name</th>
                  <th className="w-[18%] px-2 py-3 font-semibold">Company</th>
                  <th className="w-[14%] px-2 py-3 font-semibold">Industry</th>
                  <th className="w-[14%] px-2 py-3 font-semibold">Designation</th>
                  <th className="w-[16%] px-2 py-3 font-semibold">Contact</th>
                  <th className="w-16 px-2 py-3 font-semibold">Login</th>
                  <th className="w-12 px-2 py-3 text-right font-semibold"> </th>
                </tr>
              </thead>
              <tbody>
                {ceos.map((c, i) => (
                  <tr key={c.id} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/80"}>
                    <td className="px-2 py-3 text-slate-500">{i + 1}</td>
                    <td className="px-2 py-3">
                      <CEOAvatar ceo={c} />
                    </td>
                    <td className="px-2 py-3">
                      <div className="truncate font-medium text-slate-900" title={c.name}>
                        {c.name}
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="truncate text-slate-700" title={c.company}>
                        {c.company || "—"}
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      {c.industry ? (
                        <span className="inline-block rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                          {c.industry}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-2 py-3">
                      <div className="truncate text-slate-600 text-xs" title={c.designation}>
                        {c.designation || "—"}
                      </div>
                    </td>
                    <td className="px-2 py-3 text-slate-600">
                      <div className="truncate" title={c.mobile}>{c.mobile}</div>
                      <div className="truncate text-xs" title={c.email}>{c.email}</div>
                    </td>
                    <td className="px-2 py-3">
                      <button
                        type="button"
                        disabled={loginLoadingId === c.id}
                        onClick={() => onLoginAs(c)}
                        className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                      >
                        {loginLoadingId === c.id ? "…" : "Login"}
                      </button>
                    </td>
                    <td className="px-2 py-3 text-right">
                      <RowActions ceo={c} onEdit={openEdit} onDelete={onDelete} onView={setViewCEO} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-4 py-12 text-center text-slate-500">
            No CEOs found. Click Add New CEO to register one.
          </div>
        )}
      </div>

      <AddCEOModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditCEO(null); }}
        onSaved={load}
        token={token}
        editCEO={editCEO}
      />

      {viewCEO ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-black/40" onClick={() => setViewCEO(null)} />
          <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-start gap-4 border-b border-slate-100 pb-4">
              <CEOAvatar ceo={viewCEO} className="h-16 w-16" textClassName="text-xl" />
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold text-slate-900">{viewCEO.name}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {viewCEO.designation || "CEO / Founder"}
                  {viewCEO.company ? ` · ${viewCEO.company}` : ""}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <ViewField label="Company" value={viewCEO.company} />
              <ViewField label="Industry" value={viewCEO.industry} />
              <ViewField label="Designation" value={viewCEO.designation} />
              <ViewField label="Mobile" value={viewCEO.mobile} />
              <ViewField label="Email" value={viewCEO.email} />
            </div>

            <button
              type="button"
              onClick={() => setViewCEO(null)}
              className="mt-6 rounded-lg bg-slate-800 px-4 py-2 text-sm text-white"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
