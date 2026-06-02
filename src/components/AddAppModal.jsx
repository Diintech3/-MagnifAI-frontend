import { useEffect, useMemo, useState } from "react";
import { Modal } from "./Modal";
import { api, apiForm } from "../lib/api";
import { toastFromError, toastSuccess } from "../lib/toast";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

function Field({ label, required, children }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </label>
      {children}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h4 className="mb-3 text-sm font-semibold text-slate-800">{title}</h4>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>
    </div>
  );
}

const emptyForm = {
  businessName: "",
  websiteUrl: "",
  gstNumber: "",
  panNumber: "",
  fullName: "",
  email: "",
  mobile: "",
  city: "",
  address: "",
  pincode: "",
  linkedAppId: "",
  password: "",
  confirmPassword: "",
};

export function AddAppModal({ open, onClose, onSaved, token, editApp }) {
  const [form, setForm] = useState(emptyForm);
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [appOptions, setAppOptions] = useState([]);
  const [saving, setSaving] = useState(false);

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
        businessName: editApp.businessName || "",
        websiteUrl: editApp.websiteUrl || "",
        gstNumber: editApp.gstNumber || "",
        panNumber: editApp.panNumber || "",
        fullName: editApp.fullName || "",
        email: editApp.email || "",
        mobile: editApp.mobile || "",
        city: editApp.city || "",
        address: editApp.address || "",
        pincode: editApp.pincode || "",
        linkedAppId: editApp.linkedAppId || "",
        password: "",
        confirmPassword: "",
      });
      setLogoPreview(editApp.logoUrl || "");
    } else {
      setForm(emptyForm);
      setLogoPreview("");
    }
    setLogo(null);
  }, [open, editApp]);

  const canSave = useMemo(() => {
    if (!form.businessName.trim() || !form.fullName.trim() || !form.email.trim() || !form.mobile.trim()) {
      return false;
    }
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
    if (file) {
      setLogoPreview(URL.createObjectURL(file));
    } else if (editApp?.logoUrl) {
      setLogoPreview(editApp.logoUrl);
    } else {
      setLogoPreview("");
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (isEdit && k === "password" && !v) return;
      if (isEdit && k === "confirmPassword" && !form.password) return;
      fd.append(k, v);
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
      <form className="space-y-6" onSubmit={onSubmit}>
        <Section title="Business Information">
          <Field label="Business Name" required>
            <input
              className={inputClass}
              value={form.businessName}
              onChange={(e) => setField("businessName", e.target.value)}
              placeholder="Enter business name"
              required
            />
          </Field>
          <Field label="Website URL">
            <input
              className={inputClass}
              value={form.websiteUrl}
              onChange={(e) => setField("websiteUrl", e.target.value)}
              placeholder="https://example.com"
            />
          </Field>
          <Field label="GST Number">
            <input
              className={inputClass}
              value={form.gstNumber}
              onChange={(e) => setField("gstNumber", e.target.value)}
              placeholder="Enter GST number"
            />
          </Field>
          <Field label="PAN Number">
            <input
              className={inputClass}
              value={form.panNumber}
              onChange={(e) => setField("panNumber", e.target.value)}
              placeholder="Enter PAN number"
            />
          </Field>
          <div className="md:col-span-2">
            <Field label="Business Logo">
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={onLogoChange}
                className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-slate-700"
              />
              <p className="mt-1 text-xs text-slate-500">PNG, JPG up to 10MB</p>
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="mt-3 h-16 w-16 rounded-full border border-slate-200 object-cover"
                />
              ) : null}
            </Field>
          </div>
        </Section>

        <Section title="Personal Information">
          <Field label="Full Name" required>
            <input
              className={inputClass}
              value={form.fullName}
              onChange={(e) => setField("fullName", e.target.value)}
              placeholder="Enter full name"
              required
            />
          </Field>
          <Field label="Email Address" required>
            <input
              type="email"
              className={inputClass}
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
              placeholder="Enter email address"
              required
            />
          </Field>
          <Field label="Mobile Number" required>
            <input
              className={inputClass}
              value={form.mobile}
              onChange={(e) => setField("mobile", e.target.value)}
              placeholder="Enter mobile number"
              required
            />
          </Field>
          <Field label="City">
            <input
              className={inputClass}
              value={form.city}
              onChange={(e) => setField("city", e.target.value)}
              placeholder="Enter city"
            />
          </Field>
          <div className="md:col-span-2">
            <Field label="Address">
              <input
                className={inputClass}
                value={form.address}
                onChange={(e) => setField("address", e.target.value)}
                placeholder="Enter address"
              />
            </Field>
          </div>
          <Field label="Pincode">
            <input
              className={inputClass}
              value={form.pincode}
              onChange={(e) => setField("pincode", e.target.value)}
              placeholder="Enter pincode"
            />
          </Field>
        </Section>

        <Section title="Account Security">
          <Field label="App" required={appOptions.length > 0}>
            <select
              className={inputClass}
              value={form.linkedAppId}
              onChange={(e) => setField("linkedAppId", e.target.value)}
              disabled={appOptions.length === 0}
            >
              <option value="">
                {appOptions.length === 0 ? "No apps yet — create your first app" : "Select app (optional)"}
              </option>
              {appOptions.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.businessName}
                </option>
              ))}
            </select>
            {appOptions.length === 0 ? (
              <p className="mt-1 text-xs text-slate-500">
                After you create apps, they will appear in this list.
              </p>
            ) : null}
          </Field>
          <div />
          <Field label="Password" required={!isEdit}>
            <input
              type="password"
              className={inputClass}
              value={form.password}
              onChange={(e) => setField("password", e.target.value)}
              placeholder={isEdit ? "Leave blank to keep current password" : "Enter password"}
              required={!isEdit}
              minLength={isEdit ? undefined : 10}
              autoComplete={isEdit ? "new-password" : "new-password"}
            />
            {isEdit && editApp?.hasPassword ? (
              <p className="mt-1 text-xs text-emerald-600">Password is set. Leave blank to keep it unchanged.</p>
            ) : null}
          </Field>
          <Field label="Confirm Password" required={!isEdit}>
            <input
              type="password"
              className={inputClass}
              value={form.confirmPassword}
              onChange={(e) => setField("confirmPassword", e.target.value)}
              placeholder={isEdit ? "Only if changing password" : "Confirm password"}
              required={!isEdit}
              minLength={isEdit ? undefined : 10}
              autoComplete="new-password"
            />
          </Field>
        </Section>

        <p className="text-xs text-slate-500">* Required fields</p>

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSave || saving}
            className="rounded-lg bg-[#f97316] px-5 py-2 text-sm font-semibold text-white hover:bg-[#ea580c] disabled:opacity-60"
          >
            {saving ? "Saving…" : isEdit ? "Update app" : "Add app"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
