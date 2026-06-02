import { useEffect, useMemo, useState } from "react";
import { Modal } from "./Modal";
import { apiForm } from "../lib/api";
import { toastFromError, toastSuccess } from "../lib/toast";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

const ASSEMBLY_OPTIONS = ["MP", "MLA", "MLC", "MC"];

function Field({ label, required, children, className = "" }) {
  return (
    <div className={className}>
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
  name: "",
  partyName: "",
  constituency: "",
  assembly: "",
  address: "",
  email: "",
  mobile: "",
  password: "",
  confirmPassword: "",
};

function ImagePreview({ src, label, round = true }) {
  if (!src) return null;
  return (
    <div className="mt-2">
      <img
        src={src}
        alt={label}
        className={`h-16 w-16 border border-slate-200 object-cover ${round ? "rounded-full" : "rounded-lg"}`}
      />
    </div>
  );
}

export function AddCandidateModal({ open, onClose, onSaved, token, editCandidate }) {
  const [form, setForm] = useState(emptyForm);
  const [partyLogo, setPartyLogo] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [partyLogoPreview, setPartyLogoPreview] = useState("");
  const [photoPreview, setPhotoPreview] = useState("");
  const [saving, setSaving] = useState(false);

  const isEdit = Boolean(editCandidate);

  useEffect(() => {
    if (!open) return;
    if (editCandidate) {
      setForm({
        name: editCandidate.name || "",
        partyName: editCandidate.partyName || "",
        constituency: editCandidate.constituency || "",
        assembly: editCandidate.assembly || "",
        address: editCandidate.address || "",
        email: editCandidate.email || "",
        mobile: editCandidate.mobile || "",
        password: "",
        confirmPassword: "",
      });
      setPartyLogoPreview(editCandidate.partyLogoUrl || "");
      setPhotoPreview(editCandidate.photoUrl || "");
    } else {
      setForm(emptyForm);
      setPartyLogoPreview("");
      setPhotoPreview("");
    }
    setPartyLogo(null);
    setPhoto(null);
  }, [open, editCandidate]);

  const canSave = useMemo(() => {
    const base =
      form.name.trim() &&
      form.partyName.trim() &&
      form.constituency.trim() &&
      form.assembly &&
      form.email.trim() &&
      form.mobile.trim().length >= 8;
    if (!base) return false;
    if (!isEdit && (!form.password || form.password.length < 10)) return false;
    if (!isEdit && form.password !== form.confirmPassword) return false;
    if (isEdit && form.password && form.password !== form.confirmPassword) return false;
    return true;
  }, [form, isEdit]);

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function onFileChange(type, e) {
    const file = e.target.files?.[0];
    if (type === "partyLogo") {
      setPartyLogo(file || null);
      setPartyLogoPreview(file ? URL.createObjectURL(file) : editCandidate?.partyLogoUrl || "");
    } else {
      setPhoto(file || null);
      setPhotoPreview(file ? URL.createObjectURL(file) : editCandidate?.photoUrl || "");
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
    if (partyLogo) fd.append("partyLogo", partyLogo);
    if (photo) fd.append("photo", photo);

    try {
      const path = isEdit ? `/api/app/candidates/${editCandidate.id}` : "/api/app/candidates";
      await apiForm(path, { method: isEdit ? "PATCH" : "POST", token, formData: fd });
      toastSuccess(isEdit ? "Candidate updated successfully" : "Candidate added successfully");
      onSaved();
      onClose();
    } catch (err) {
      toastFromError(err, "Failed to save candidate");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      wide
      title={isEdit ? "Edit Candidate" : "Add New Candidate"}
      subtitle={isEdit ? "Update candidate details below" : "Fill in the details to register a new candidate"}
      onClose={onClose}
    >
      <form className="space-y-6" onSubmit={onSubmit}>
        <Section title="Candidate Information">
          <Field label="Name" required>
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              placeholder="Enter candidate name"
              required
            />
          </Field>
          <Field label="Photo">
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={(e) => onFileChange("photo", e)}
              className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-slate-700"
            />
            <p className="mt-1 text-xs text-slate-500">PNG, JPG up to 10MB</p>
            <ImagePreview src={photoPreview} label="Photo preview" />
          </Field>
        </Section>

        <Section title="Party Details">
          <Field label="Party Name" required>
            <input
              className={inputClass}
              value={form.partyName}
              onChange={(e) => setField("partyName", e.target.value)}
              placeholder="Enter party name"
              required
            />
          </Field>
          <Field label="Party Logo">
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={(e) => onFileChange("partyLogo", e)}
              className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-slate-700"
            />
            <p className="mt-1 text-xs text-slate-500">PNG, JPG up to 10MB</p>
            <ImagePreview src={partyLogoPreview} label="Party logo preview" round={false} />
          </Field>
        </Section>

        <Section title="Constituency">
          <Field label="Constituency" required>
            <input
              className={inputClass}
              value={form.constituency}
              onChange={(e) => setField("constituency", e.target.value)}
              placeholder="Enter constituency name"
              required
            />
          </Field>
          <Field label="Assembly" required>
            <select
              className={inputClass}
              value={form.assembly}
              onChange={(e) => setField("assembly", e.target.value)}
              required
            >
              <option value="">Select assembly</option>
              {ASSEMBLY_OPTIONS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </Field>
        </Section>

        <Section title="Contact">
          <Field label="Email" required>
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
              type="tel"
              className={inputClass}
              value={form.mobile}
              onChange={(e) => setField("mobile", e.target.value)}
              placeholder="Enter mobile number"
              required
              minLength={8}
            />
          </Field>
          <div className="md:col-span-2">
            <Field label="Address">
              <textarea
                className={`${inputClass} min-h-[80px] resize-y`}
                value={form.address}
                onChange={(e) => setField("address", e.target.value)}
                placeholder="Enter full address"
                rows={3}
              />
            </Field>
          </div>
        </Section>

        <Section title="Login credentials">
          <Field label="Password" required={!isEdit}>
            <input
              type="password"
              className={inputClass}
              value={form.password}
              onChange={(e) => setField("password", e.target.value)}
              placeholder={isEdit ? "Leave blank to keep current password" : "Min 10 characters"}
              required={!isEdit}
              minLength={isEdit ? undefined : 10}
            />
            {isEdit && editCandidate?.hasPassword ? (
              <p className="mt-1 text-xs text-emerald-600">Password is set. Leave blank to keep unchanged.</p>
            ) : null}
          </Field>
          <Field label="Confirm Password" required={!isEdit}>
            <input
              type="password"
              className={inputClass}
              value={form.confirmPassword}
              onChange={(e) => setField("confirmPassword", e.target.value)}
              placeholder="Confirm password"
              required={!isEdit}
              minLength={isEdit ? undefined : 10}
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
            {saving ? "Saving…" : isEdit ? "Update candidate" : "Add candidate"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
