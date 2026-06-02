import { useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "../../auth/AuthProvider";

import { api } from "../../lib/api";

import { AddAppModal } from "../../components/AddAppModal";
import { AppLogo } from "../../components/AppLogo";
import { IconCog } from "../../components/icons";
import { toastFromError, toastSuccess } from "../../lib/toast";

function fmtDate(v) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function RowActions({ app, onEdit, onDelete, onView }) {

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

            onClick={() => {

              setOpen(false);

              onEdit(app);

            }}

            className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"

          >

            Edit

          </button>

          <button

            type="button"

            onClick={() => {

              setOpen(false);

              onView(app);

            }}

            className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"

          >

            View

          </button>

          <button

            type="button"

            onClick={() => {

              setOpen(false);

              onDelete(app);

            }}

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



export function AdminApps() {

  const { token } = useAuth();

  const [apps, setApps] = useState([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);

  const [editApp, setEditApp] = useState(null);

  const [viewApp, setViewApp] = useState(null);

  const [loginLoadingId, setLoginLoadingId] = useState(null);



  async function load() {

    setLoading(true);

    try {

      const q = search.trim() ? `?q=${encodeURIComponent(search.trim())}` : "";

      const d = await api(`/api/admin/apps${q}`, { token });

      setApps(d.apps || []);

    } catch (e) {

      toastFromError(e, "Failed to load apps");

    } finally {

      setLoading(false);

    }

  }



  useEffect(() => {

    const t = setTimeout(load, 300);

    return () => clearTimeout(t);

    // eslint-disable-next-line react-hooks/exhaustive-deps

  }, [token, search]);



  const filteredCount = useMemo(() => apps.length, [apps]);



  function openCreate() {

    setEditApp(null);

    setModalOpen(true);

  }



  function openEdit(app) {

    setEditApp(app);

    setModalOpen(true);

  }



  async function onDelete(app) {

    if (!window.confirm(`Delete app "${app.businessName}"?`)) return;

    try {

      await api(`/api/admin/apps/${app.id}`, { method: "DELETE", token });

      toastSuccess("App deleted successfully");

      await load();

    } catch (e) {

      toastFromError(e, "Failed to delete app");

    }

  }



  async function onLoginAs(app) {

    if (!app.isActive) return;

    setLoginLoadingId(app.id);

    try {

      const data = await api(`/api/admin/apps/${app.id}/login-as`, { method: "POST", token });

      const url = new URL("/app", window.location.origin);

      url.searchParams.set("session", data.accessToken);

      window.open(url.toString(), "_blank", "noopener,noreferrer");

      toastSuccess("App portal opened in new tab");

    } catch (e) {

      toastFromError(e, "Failed to login as app");

    } finally {

      setLoginLoadingId(null);

    }

  }



  return (

    <div className="p-4 sm:p-6">

      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">

        <div>

          <h2 className="text-xl font-bold text-slate-900">Apps Management</h2>

          <p className="mt-1 text-sm text-slate-500">{filteredCount} app(s)</p>

        </div>

        <button

          type="button"

          onClick={openCreate}

          className="rounded-lg bg-[#f97316] px-4 py-2 text-sm font-semibold text-white hover:bg-[#ea580c]"

        >

          + Add New App

        </button>

      </div>



      <div className="relative mt-5 max-w-md">

        <input

          value={search}

          onChange={(e) => setSearch(e.target.value)}

          placeholder="Search apps..."

          className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"

        />

        <svg

          className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400"

          fill="none"

          viewBox="0 0 24 24"

          stroke="currentColor"

        >

          <path

            strokeLinecap="round"

            strokeLinejoin="round"

            strokeWidth={2}

            d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z"

          />

        </svg>

      </div>



      <div className="mt-5 overflow-hidden rounded-lg border border-slate-200">

        {loading ? (

          <div className="px-4 py-12 text-center text-slate-500">Loading…</div>

        ) : apps.length ? (

          <div className="overflow-x-auto">

            <table className="w-full table-fixed text-left text-sm">

              <thead className="border-b border-slate-200 bg-slate-50">

                <tr className="text-slate-700">

                  <th className="w-10 px-2 py-3 font-semibold">#</th>

                  <th className="w-14 px-2 py-3 font-semibold">Logo</th>

                  <th className="w-[18%] px-2 py-3 font-semibold">Business</th>

                  <th className="w-[14%] px-2 py-3 font-semibold">Owner</th>

                  <th className="w-[18%] px-2 py-3 font-semibold">Contact</th>

                  <th className="w-[14%] px-2 py-3 font-semibold">GST / PAN</th>

                  <th className="w-16 px-2 py-3 font-semibold">Status</th>

                  <th className="w-20 px-2 py-3 font-semibold">Login</th>

                  <th className="w-12 px-2 py-3 text-right font-semibold"> </th>

                </tr>

              </thead>

              <tbody>

                {apps.map((app, i) => (

                  <tr key={app.id} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/80"}>

                    <td className="px-2 py-3 text-slate-500">{i + 1}</td>

                    <td className="px-2 py-3">

                      <AppLogo app={app} />

                    </td>

                    <td className="px-2 py-3">

                      <div className="truncate font-medium text-slate-900" title={app.businessName}>

                        {app.businessName}

                      </div>

                      {app.linkedAppName ? (

                        <div className="truncate text-xs text-slate-500" title={`Linked: ${app.linkedAppName}`}>

                          Linked: {app.linkedAppName}

                        </div>

                      ) : null}

                      <div className="mt-0.5 text-xs text-slate-400">

                        {app.source || "Direct"} · {app.agentsCount ?? 0} agents

                      </div>

                    </td>

                    <td className="px-2 py-3">

                      <div className="truncate text-slate-600" title={app.fullName}>

                        {app.fullName}

                      </div>

                    </td>

                    <td className="px-2 py-3 text-slate-600">

                      <div className="truncate" title={app.mobile}>

                        {app.mobile}

                      </div>

                      <div className="truncate text-xs" title={app.email}>

                        {app.email}

                      </div>

                    </td>

                    <td className="px-2 py-3 text-xs text-slate-600">

                      <div className="truncate" title={app.gstNumber}>

                        GST: {app.gstNumber || "—"}

                      </div>

                      <div className="truncate" title={app.panNumber}>

                        PAN: {app.panNumber || "—"}

                      </div>

                    </td>

                    <td className="px-2 py-3">

                      <span

                        className={

                          app.isActive

                            ? "inline-block rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-medium text-white"

                            : "inline-block rounded-full bg-slate-400 px-2 py-0.5 text-xs text-white"

                        }

                      >

                        {app.isActive ? "Active" : "Off"}

                      </span>

                    </td>

                    <td className="px-2 py-3">

                      <button

                        type="button"

                        disabled={!app.isActive || loginLoadingId === app.id}

                        onClick={() => onLoginAs(app)}

                        className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"

                      >

                        {loginLoadingId === app.id ? "…" : "Login"}

                      </button>

                    </td>

                    <td className="px-2 py-3 text-right">

                      <RowActions app={app} onEdit={openEdit} onDelete={onDelete} onView={setViewApp} />

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        ) : (

          <div className="px-4 py-12 text-center text-slate-500">No apps found. Click Add New App to register one.</div>

        )}

      </div>



      <AddAppModal

        open={modalOpen}

        onClose={() => {

          setModalOpen(false);

          setEditApp(null);

        }}

        onSaved={load}

        token={token}

        editApp={editApp}

      />



      {viewApp ? (

        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

          <button type="button" className="absolute inset-0 bg-black/40" onClick={() => setViewApp(null)} />

          <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">

            <div className="flex items-start gap-4 border-b border-slate-100 pb-4">

              <AppLogo app={viewApp} className="h-14 w-14" />

              <div className="min-w-0 flex-1">

                <h3 className="text-lg font-bold text-slate-900">{viewApp.businessName}</h3>

                <p className="mt-1 text-sm text-slate-500">{viewApp.fullName}</p>

              </div>

            </div>



            <div className="mt-5 grid gap-4 sm:grid-cols-2">

              <ViewField label="Email" value={viewApp.email} />

              <ViewField label="Mobile" value={viewApp.mobile} />

              <ViewField label="Website" value={viewApp.websiteUrl} />

              <ViewField label="City" value={viewApp.city} />

              <ViewField label="Pincode" value={viewApp.pincode} />

              <ViewField label="GST Number" value={viewApp.gstNumber} />

              <ViewField label="PAN Number" value={viewApp.panNumber} />

              <ViewField label="Source" value={viewApp.source || "Direct"} />

              <ViewField label="Agents" value={String(viewApp.agentsCount ?? 0)} />

              <ViewField label="Linked App" value={viewApp.linkedAppName} />

              <ViewField label="Status" value={viewApp.isActive ? "Active" : "Inactive"} />

              <ViewField label="Created" value={fmtDate(viewApp.createdAt)} />

              <ViewField label="Updated" value={fmtDate(viewApp.updatedAt)} />

            </div>



            {viewApp.address ? (

              <div className="mt-4 rounded-lg bg-slate-50 p-3">

                <ViewField label="Address" value={viewApp.address} />

              </div>

            ) : null}



            <button

              type="button"

              onClick={() => setViewApp(null)}

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


