import { useEffect, useMemo, useState } from "react";
import { Modal } from "./Modal";
import { api, apiForm } from "../lib/api";
import { toastFromError, toastSuccess } from "../lib/toast";
import { LuEye, LuEyeOff } from "react-icons/lu";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20";

function Field({ label, required, hint, children }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}{required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function SectionTitle({ number, title, desc }) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white text-[10px] font-bold mt-0.5">{number}</span>
      <div>
        <div className="text-sm font-bold text-slate-800">{title}</div>
        {desc && <div className="text-xs text-slate-400">{desc}</div>}
      </div>
    </div>
  );
}

const DASHBOARD_OPTIONS = [
  { value: "default",     label: "CEO Content OS — Founder & CEOs" },
  { value: "founder",     label: "Founder OS — CEO Management Dashboard" },
  { value: "spiritual",   label: "Spiritual Guru OS — Spiritual Gurus" },
  { value: "political",   label: "Political Campaign OS — Political Leaders" },
  { value: "actor",       label: "Actor & Artist OS — Actors & Artists" },
  { value: "changemaker", label: "Change Maker OS — Change Makers" },
  { value: "ecommerce",   label: "E-Commerce OS — Coming Soon" },
  { value: "healthcare",  label: "Healthcare OS — Coming Soon" },
  { value: "custom",      label: "Custom OS — Custom Dashboard" },
];

const emptyForm = {
  businessName: "", websiteUrl: "", gstNumber: "", panNumber: "",
  fullName: "", email: "", mobile: "", city: "", address: "", pincode: "",
  linkedAppId: "", password: "", confirmPassword: "",
  dashboardType: "default", showCandidates: false,
};

export function AddAppModal({ open, onClose, onSaved, token, editApp }) {
  const [form, setForm] = useState(emptyForm);
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [appOptions, setAppOptions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const isEdit = Boolean(editApp);

  useEffect(() => {
    if (!open) return;
    const exclude = editApp?.id ? `?exclude=${editApp.id}` : "";
    api(`/api/admin/apps/dropdown${exclude}`, { token })
      .then((d) => setAppOptions(d.apps || []))
      .catch(() => setAppOptions([]));
  }, [open, token, editApp?.id]);

  useEffect(() => {
    if (!open) return;
    if (editApp) {
      setForm({
        businessName:    editApp.businessName || "",
        websiteUrl:      editApp.websiteUrl || "",
        gstNumber:       editApp.gstNumber || "",
        panNumber:       editApp.panNumber || "",
        fullName:        editApp.fullName || "",
        email:           editApp.email || "",
        mobile:          editApp.mobile || "",
        city:            editApp.city || "",
        address:         editApp.address || "",
        pincode:         editApp.pincode || "",
        linkedAppId:     editApp.linkedAppId || "",
        password:        "",
        confirmPassword: "",
        dashboardType:   editApp.dashboardType || "default",
        showCandidates:  editApp.showCandidates ?? false,
      });
      setLogoPreview(editApp.logoUrl || "");
    } else {
      setForm(emptyForm);
      setLogoPreview("");
    }
    setLogo(null);
  }, [open, editApp]);

  const canSave = useMemo(() => {
    if (!form.businessName.trim() || !form.fullName.trim() || !form.email.trim() || !form.mobile.trim()) return false;
    if (!isEdit && (!form.password || form.password.length < 10)) return false;
    if (!isEdit && form.password !== form.confirmPassword) return false;
    if (isEdit && form.password && form.password !== form.confirmPassword) return false;
    return true;
  }, [form, isEdit]);

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function onLogoChange(e) {
    const file = e.target.files?.[0];
    setLogo(file || null);
    if (file) setLogoPreview(URL.createObjectURL(file));
    else if (editApp?.logoUrl) setLogoPreview(editApp.logoUrl);
    else setLogoPreview("");
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (isEdit && k === "password" && !v) return;
      if (isEdit && k === "confirmPassword" && !form.password) return;
      if (k === "showCandidates") { fd.append(k, v ? "true" : "false"); return; }
      fd.append(k, v ?? "");
    });
    if (logo) fd.append("logo", logo);
    try {
      if (isEdit) {
        await apiForm(`/api/admin/apps/${editApp.id}`, { method: "PATCH", token, formData: fd });
      } else {
        await apiForm("/api/admin/apps", { method: "POST", token, formData: fd });
      }
      toastSuccess(isEdit ? "App updated successfully" : "App created successfully");
      onSaved();
      onClose();
    } catch (err) {
      toastFromError(err, "Failed to save app");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      wide
      title={isEdit ? "Edit App" : "Add New App"}
      subtitle={isEdit ? "Update app details below" : "Fill in the details to register a new app"}
      onClose={onClose}
    >
      <form className="space-y-8" onSubmit={onSubmit}>

        {/* ── Section 1: Business Info ── */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5">
          <SectionTitle number="1" title="Business Information" desc="Basic business details and identity" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Business Name" required>
              <input className={inputClass} value={form.businessName} onChange={(e) => setField("businessName", e.target.value)} placeholder="e.g. MagnifAI Pvt. Ltd." />
            </Field>
            <Field label="Website URL">
              <input className={inputClass} value={form.websiteUrl} onChange={(e) => setField("websiteUrl", e.target.value)} placeholder="https://example.com" />
            </Field>
            <Field label="GST Number">
              <input className={inputClass} value={form.gstNumber} onChange={(e) => setField("gstNumber", e.target.value)} placeholder="e.g. 27AAPFU0939F1ZV" />
            </Field>
            <Field label="PAN Number">
              <input className={inputClass} value={form.panNumber} onChange={(e) => setField("panNumber", e.target.value)} placeholder="e.g. AAPFU0939F" />
            </Field>
            <div className="md:col-span-2">
              <Field label="Business Logo" hint="PNG, JPG up to 10MB">
                <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp" onChange={onLogoChange}
                  className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100" />
                {logoPreview && <img src={logoPreview} alt="Logo preview" className="mt-3 h-14 w-14 rounded-xl border border-slate-200 object-cover" />}
              </Field>
            </div>
          </div>
        </div>

        {/* ── Section 2: Contact Info ── */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5">
          <SectionTitle number="2" title="Contact Information" desc="Person of contact for this app account" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Full Name" required>
              <input className={inputClass} value={form.fullName} onChange={(e) => setField("fullName", e.target.value)} placeholder="e.g. Vijay Kumar Singh" />
            </Field>
            <Field label="Email Address" required>
              <input type="email" className={inputClass} value={form.email} onChange={(e) => setField("email", e.target.value)} placeholder="e.g. contact@company.com" />
            </Field>
            <Field label="Mobile Number" required>
              <input className={inputClass} value={form.mobile} onChange={(e) => setField("mobile", e.target.value)} placeholder="e.g. 9876543210" />
            </Field>
            <Field label="City">
              <input className={inputClass} value={form.city} onChange={(e) => setField("city", e.target.value)} placeholder="e.g. Mumbai" />
            </Field>
            <div className="md:col-span-2">
              <Field label="Address">
                <input className={inputClass} value={form.address} onChange={(e) => setField("address", e.target.value)} placeholder="Full address" />
              </Field>
            </div>
            <Field label="Pincode">
              <input className={inputClass} value={form.pincode} onChange={(e) => setField("pincode", e.target.value)} placeholder="e.g. 400001" />
            </Field>
          </div>
        </div>

        {/* ── Section 3: Login Credentials ── */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5">
          <SectionTitle number="3" title="Login Credentials" desc="Set the password for this app's login" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
             <Field label="Password" required={!isEdit} hint={isEdit ? "Leave blank to keep current password" : "Minimum 10 characters"}>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} className={`${inputClass} pr-10`} value={form.password}
                  onChange={(e) => setField("password", e.target.value)}
                  placeholder={isEdit ? "Leave blank to keep unchanged" : "Enter password (min 10 chars)"}
                  minLength={isEdit ? undefined : 10} autoComplete="new-password" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-700 focus:outline-none"
                >
                  {showPassword ? <LuEyeOff size={18} /> : <LuEye size={18} />}
                </button>
              </div>
            </Field>
            <Field label="Confirm Password" required={!isEdit}>
              <div className="relative">
                <input type={showConfirmPassword ? "text" : "password"} className={`${inputClass} pr-10`} value={form.confirmPassword}
                  onChange={(e) => setField("confirmPassword", e.target.value)}
                  placeholder="Re-enter password" autoComplete="new-password" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-700 focus:outline-none"
                >
                  {showConfirmPassword ? <LuEyeOff size={18} /> : <LuEye size={18} />}
                </button>
              </div>
              {form.password && form.confirmPassword && form.password !== form.confirmPassword && (
                <p className="mt-1 text-xs text-red-500">Passwords do not match</p>
              )}
              {form.password && form.confirmPassword && form.password === form.confirmPassword && (
                <p className="mt-1 text-xs text-emerald-600">✓ Passwords match</p>
              )}
            </Field>
          </div>
        </div>

        {/* ── Section 4: App Type ── */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5">
          <SectionTitle number="4" title="App Type" desc="Select the type — this controls which dashboard the user sees after login" />
          <Field label="Select App Type">
            <select className={inputClass} value={form.dashboardType}
              onChange={(e) => {
                setField("dashboardType", e.target.value);
                setField("showCandidates", e.target.value === "political");
              }}>
              {DASHBOARD_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Field>
        </div>

        <p className="text-xs text-slate-400">* Required fields</p>

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <button type="button" onClick={onClose}
            className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition">
            Cancel
          </button>
          <button type="submit" disabled={!canSave || saving}
            className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition">
            {saving ? "Saving…" : isEdit ? "Update App" : "Add App"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
