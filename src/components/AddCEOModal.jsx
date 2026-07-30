import { useEffect, useMemo, useState } from "react";
import { Modal } from "./Modal";
import { apiForm } from "../lib/api";
import { toastFromError, toastSuccess } from "../lib/toast";
import { LuEye, LuEyeOff } from "react-icons/lu";

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
  name: "", company: "", industry: "", designation: "",
  website: "", city: "", pincode: "", address: "",
  email: "", mobile: "", password: "", confirmPassword: "",
};

export function AddCEOModal({ open, onClose, onSaved, token, editCEO }) {
  const [form, setForm] = useState(emptyForm);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isEdit = Boolean(editCEO);

  useEffect(() => {
    if (!open) return;
    if (editCEO) {
      setForm({
        name: editCEO.name || "", company: editCEO.company || "",
        industry: editCEO.industry || "", designation: editCEO.designation || "",
        website: editCEO.website || "", city: editCEO.city || "",
        pincode: editCEO.pincode || "", address: editCEO.address || "",
        email: editCEO.email || "", mobile: editCEO.mobile || "",
        password: "", confirmPassword: "",
      });
      setPhotoPreview(editCEO.photoUrl || "");
    } else {
      setForm(emptyForm);
      setPhotoPreview("");
    }
    setPhoto(null);
  }, [open, editCEO]);

  const canSave = useMemo(() => {
    const base = form.name.trim() && form.email.trim() && form.mobile.trim().length >= 8;
    if (!base) return false;
    if (!isEdit && (!form.password || form.password.length < 10)) return false;
    if (!isEdit && form.password !== form.confirmPassword) return false;
    if (isEdit && form.password && form.password !== form.confirmPassword) return false;
    return true;
  }, [form, isEdit]);

  function setField(key, value) { setForm(f => ({ ...f, [key]: value })); }

  function onPhotoChange(e) {
    const file = e.target.files?.[0];
    setPhoto(file || null);
    setPhotoPreview(file ? URL.createObjectURL(file) : editCEO?.photoUrl || "");
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
    if (photo) fd.append("photo", photo);
    try {
      const path = isEdit ? `/api/app/ceos/${editCEO.id}` : "/api/app/ceos";
      await apiForm(path, { method: isEdit ? "PATCH" : "POST", token, formData: fd });
      toastSuccess(isEdit ? "CEO updated successfully" : "CEO added successfully");
      onSaved();
      onClose();
    } catch (err) {
      toastFromError(err, "Failed to save CEO");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      wide
      title={isEdit ? "Edit CEO / Founder" : "Add New CEO / Founder"}
      subtitle={isEdit ? "Update CEO details below" : "Fill in the details to register a new CEO"}
      onClose={onClose}
    >
      <form className="space-y-6" onSubmit={onSubmit}>
        <Section title="Basic Information">
          <Field label="Full Name" required>
            <input className={inputClass} value={form.name}
              onChange={e => setField("name", e.target.value)} placeholder="Enter full name" required />
          </Field>
          <Field label="Photo">
            <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={onPhotoChange}
              className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-slate-700" />
            <p className="mt-1 text-xs text-slate-500">PNG, JPG up to 10MB</p>
            {photoPreview && (
              <img src={photoPreview} alt="Preview"
                className="mt-2 h-16 w-16 rounded-full border border-slate-200 object-cover" />
            )}
          </Field>
          <Field label="Company / Organization">
            <input className={inputClass} value={form.company}
              onChange={e => setField("company", e.target.value)} placeholder="e.g. Acme Corp" />
          </Field>
          <Field label="Industry">
            <input className={inputClass} value={form.industry}
              onChange={e => setField("industry", e.target.value)} placeholder="e.g. Technology, Finance" />
          </Field>
          <Field label="Designation">
            <input className={inputClass} value={form.designation}
              onChange={e => setField("designation", e.target.value)} placeholder="e.g. CEO, Co-Founder" />
          </Field>
          <Field label="Website">
            <input className={inputClass} value={form.website}
              onChange={e => setField("website", e.target.value)} placeholder="e.g. https://example.com" />
          </Field>
          <Field label="City">
            <input className={inputClass} value={form.city}
              onChange={e => setField("city", e.target.value)} placeholder="e.g. Mumbai" />
          </Field>
          <Field label="Pincode">
            <input className={inputClass} value={form.pincode}
              onChange={e => setField("pincode", e.target.value)} placeholder="e.g. 400001" />
          </Field>
          <div className="md:col-span-2">
            <Field label="Address">
              <input className={inputClass} value={form.address}
                onChange={e => setField("address", e.target.value)} placeholder="Enter full address" />
            </Field>
          </div>
        </Section>

        <Section title="Contact">
          <Field label="Email" required>
            <input type="email" className={inputClass} value={form.email}
              onChange={e => setField("email", e.target.value)} placeholder="Enter email address" required />
          </Field>
          <Field label="Mobile Number" required>
            <input type="tel" className={inputClass} value={form.mobile}
              onChange={e => setField("mobile", e.target.value)} placeholder="Enter mobile number" required minLength={8} />
          </Field>
        </Section>

        <Section title="Login Credentials">
          <Field label="Password" required={!isEdit}>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} className={`${inputClass} pr-10`} value={form.password}
                onChange={e => setField("password", e.target.value)}
                placeholder={isEdit ? "Leave blank to keep current password" : "Min 10 characters"}
                required={!isEdit} minLength={isEdit ? undefined : 10} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-700 focus:outline-none"
              >
                {showPassword ? <LuEyeOff size={18} /> : <LuEye size={18} />}
              </button>
            </div>
            {isEdit && editCEO?.hasPassword
              ? <p className="mt-1 text-xs text-emerald-600">Password is set. Leave blank to keep unchanged.</p>
              : null}
          </Field>
          <Field label="Confirm Password" required={!isEdit}>
            <div className="relative">
              <input type={showConfirmPassword ? "text" : "password"} className={`${inputClass} pr-10`} value={form.confirmPassword}
                onChange={e => setField("confirmPassword", e.target.value)}
                placeholder="Confirm password" required={!isEdit} minLength={isEdit ? undefined : 10} />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-700 focus:outline-none"
              >
                {showConfirmPassword ? <LuEyeOff size={18} /> : <LuEye size={18} />}
              </button>
            </div>
          </Field>
        </Section>

        <p className="text-xs text-slate-500">* Required fields</p>

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <button type="button" onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Cancel
          </button>
          <button type="submit" disabled={!canSave || saving}
            className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
            {saving ? "Saving…" : isEdit ? "Update CEO" : "Add CEO"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
