import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../auth/AuthProvider";
import { api } from "../../lib/api";
import { Modal } from "../../components/Modal";
import { IconCog } from "../../components/icons";
import { toastError, toastFromError, toastSuccess } from "../../lib/toast";

function fmtDate(v) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function RowActions({ admin, onEdit, onDelete }) {
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
        className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100"
        aria-label="Actions"
      >
        <IconCog className="h-5 w-5" />
      </button>
      {open ? (
        <div className="absolute right-0 z-20 mt-1 w-36 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onEdit(admin);
            }}
            className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onDelete(admin);
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

export function SuperAdminAdmins() {
  const { token } = useAuth();

  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [loginLoadingId, setLoginLoadingId] = useState(null);

  const isEdit = Boolean(editing);
  const canSave = useMemo(() => {
    if (!email.trim()) return false;
    if (isEdit) return true;
    return password.length >= 10;
  }, [email, password, isEdit]);

  async function load() {
    setLoading(true);
    try {
      const d = await api("/api/superadmin/admins", { token });
      setAdmins(d.admins || []);
    } catch (e) {
      toastFromError(e, "Failed to load admins");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  function openCreate() {
    setEditing(null);
    setEmail("");
    setName("");
    setPassword("");
    setModalOpen(true);
  }

  function openEdit(admin) {
    setEditing(admin);
    setEmail(admin.email);
    setName(admin.name || "");
    setPassword("");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    setEmail("");
    setName("");
    setPassword("");
  }

  async function onSave(e) {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    try {
      if (isEdit) {
        const body = {
          email: email.trim(),
          name: name.trim() || undefined,
        };
        if (password) body.password = password;
        await api(`/api/superadmin/admins/${editing.id}`, {
          method: "PATCH",
          token,
          body,
        });
      } else {
        await api("/api/superadmin/admins", {
          method: "POST",
          token,
          body: {
            email: email.trim(),
            name: name.trim() || undefined,
            password,
          },
        });
      }
      toastSuccess(isEdit ? "Admin updated successfully" : "Admin created successfully");
      closeModal();
      await load();
    } catch (e2) {
      toastFromError(e2, "Failed to save admin");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(admin) {
    if (!window.confirm(`Delete admin ${admin.email}?`)) return;
    try {
      await api(`/api/superadmin/admins/${admin.id}`, { method: "DELETE", token });
      toastSuccess("Admin deleted successfully");
      await load();
    } catch (e) {
      toastFromError(e, "Failed to delete admin");
    }
  }

  async function onLoginAs(admin) {
    if (!admin.isActive) {
      toastError("Cannot login as disabled admin");
      return;
    }
    setLoginLoadingId(admin.id);
    try {
      const data = await api(`/api/superadmin/admins/${admin.id}/login-as`, {
        method: "POST",
        token,
      });
      const url = new URL("/admin", window.location.origin);
      url.searchParams.set("session", data.accessToken);
      window.open(url.toString(), "_blank", "noopener,noreferrer");
      toastSuccess("Admin portal opened in new tab");
    } catch (e) {
      toastFromError(e, "Failed to login as admin");
    } finally {
      setLoginLoadingId(null);
    }
  }

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <h2 className="text-xl font-bold text-slate-900">Admins</h2>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8]"
        >
          Add Admin
        </button>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200">
        {loading ? (
          <div className="px-4 py-10 text-center text-slate-500">Loading…</div>
        ) : admins.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-white">
                <tr className="text-slate-700">
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Created At</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Login</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((a, i) => (
                  <tr key={a.id} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                    <td className="px-4 py-3 text-slate-800">{a.email}</td>
                    <td className="px-4 py-3 text-slate-600">{a.name || "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{fmtDate(a.createdAt)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          a.isActive
                            ? "inline-block rounded-full bg-emerald-500 px-3 py-0.5 text-xs font-medium text-white"
                            : "inline-block rounded-full bg-slate-400 px-3 py-0.5 text-xs font-medium text-white"
                        }
                      >
                        {a.isActive ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        disabled={!a.isActive || loginLoadingId === a.id}
                        onClick={() => onLoginAs(a)}
                        className="rounded-lg bg-[#2563eb] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {loginLoadingId === a.id ? "…" : "Login"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <RowActions admin={a} onEdit={openEdit} onDelete={onDelete} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-4 py-10 text-center text-slate-500">No admins found.</div>
        )}
      </div>

      <Modal open={modalOpen} title={isEdit ? "Edit Admin" : "Create Admin"} onClose={closeModal}>
        <form className="space-y-4" onSubmit={onSave}>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              placeholder="admin@company.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Name (optional)</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              placeholder="Full name"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Password {isEdit ? "(leave blank to keep)" : ""}
            </label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required={!isEdit}
              minLength={isEdit ? undefined : 10}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              placeholder={isEdit ? "••••••••••" : "Min 10 characters"}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSave || saving}
              className="rounded-lg bg-[#2563eb] px-5 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8] disabled:opacity-60"
            >
              {saving ? "Saving…" : isEdit ? "Update" : "Create Admin"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
