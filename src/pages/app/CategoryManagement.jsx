import { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthProvider";
import { api, apiForm, mediaUrl } from "../../lib/api";
import { toastFromError, toastSuccess } from "../../lib/toast";
import { LuFolder, LuPlus, LuTrash2, LuCheck, LuX, LuPencil, LuToggleLeft, LuToggleRight, LuCircleAlert, LuImage, LuArrowLeft } from "react-icons/lu";

const SECTIONS = [
  { value: "ugc_prompter", label: "UGC Prompter", desc: "Manage categories for UGC script prompter", color: "from-orange-500 to-amber-600" }
];

export function CategoryManagement() {
  const { token } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Navigation State — null = show sections, string = show categories inside that section
  const [activeSection, setActiveSection] = useState(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [editTarget, setEditTarget] = useState(null);

  // Form State
  const [name, setName] = useState("");
  const [section, setSection] = useState("ugc_prompter");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  async function loadCategories() {
    setLoading(true);
    try {
      const data = await api("/api/categories/all", { token });
      setCategories(data || []);
    } catch (e) {
      toastFromError(e, "Failed to load categories");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, [token]);

  // Count categories per section
  function countForSection(sectionValue) {
    return categories.filter(c => c.section === sectionValue).length;
  }

  function openCreateModal() {
    setModalMode("create");
    setEditTarget(null);
    setName("");
    setSection(activeSection || "ugc_prompter");
    setImageFile(null);
    setImagePreview("");
    setModalOpen(true);
  }

  function openEditModal(cat) {
    setModalMode("edit");
    setEditTarget(cat);
    setName(cat.name);
    setSection(cat.section);
    setImageFile(null);
    setImagePreview(cat.imageUrl ? mediaUrl(cat.imageUrl) : "");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditTarget(null);
    setName("");
    setImageFile(null);
    setImagePreview("");
  }

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", name.trim());
      fd.append("section", section);
      if (imageFile) {
        fd.append("image", imageFile);
      }

      if (modalMode === "create") {
        const newCat = await apiForm("/api/categories", {
          method: "POST",
          token,
          formData: fd
        });
        toastSuccess("Category created successfully!");
        setCategories(prev => [newCat, ...prev]);
      } else if (modalMode === "edit" && editTarget) {
        const updated = await apiForm(`/api/categories/${editTarget._id}`, {
          method: "PUT",
          token,
          formData: fd
        });
        toastSuccess("Category updated successfully!");
        setCategories(prev => prev.map(c => (c._id === editTarget._id ? updated : c)));
      }

      closeModal();
    } catch (err) {
      toastFromError(err, modalMode === "create" ? "Failed to create category" : "Failed to update category");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(cat) {
    try {
      const updated = await api(`/api/categories/${cat._id}`, {
        method: "PUT",
        token,
        body: { isActive: !cat.isActive }
      });
      setCategories(prev => prev.map(c => (c._id === cat._id ? updated : c)));
      toastSuccess(`Category "${cat.name}" ${updated.isActive ? "enabled" : "disabled"}.`);
    } catch (err) {
      toastFromError(err, "Failed to update category status");
    }
  }

  async function handleDelete(id) {
    if (!confirm("Are you sure you want to delete this category?")) return;
    try {
      await api(`/api/categories/${id}`, {
        method: "DELETE",
        token
      });
      setCategories(prev => prev.filter(c => c._id !== id));
      toastSuccess("Category deleted successfully.");
    } catch (err) {
      toastFromError(err, "Failed to delete category");
    }
  }

  const filtered = activeSection ? categories.filter(c => c.section === activeSection) : [];
  const activeSectionMeta = SECTIONS.find(s => s.value === activeSection);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow">
          <LuFolder className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-sans">Category Management</h2>
          <p className="mt-0.5 text-sm text-slate-500">Configure and manage dropdown options for different sections</p>
        </div>
      </div>

      {/* ── LEVEL 1: Section Cards ─────────────────────────────────── */}
      {!activeSection && (
        <>
          {loading ? (
            <div className="py-16 text-center text-slate-400 animate-pulse text-sm">Loading...</div>
          ) : (
            <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {SECTIONS.map(sec => (
                <button
                  key={sec.value}
                  onClick={() => setActiveSection(sec.value)}
                  className="group text-left bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden hover:shadow-md hover:border-slate-300 transition-all cursor-pointer"
                >
                  {/* Section Card Top Gradient */}
                  <div className={`h-32 bg-gradient-to-br ${sec.color} flex items-center justify-center relative`}>
                    <LuFolder className="h-14 w-14 text-white/30" strokeWidth={1.25} />
                    <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white">
                      {countForSection(sec.value)} categories
                    </div>
                  </div>

                  {/* Section Card Body */}
                  <div className="p-5">
                    <h3 className="text-base font-bold text-slate-800 group-hover:text-orange-700 transition-colors">{sec.label}</h3>
                    <p className="text-xs text-slate-400 mt-1">{sec.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── LEVEL 2: Categories Inside a Section ───────────────────── */}
      {activeSection && (
        <>
          {/* Toolbar */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveSection(null)}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                <LuArrowLeft className="h-3.5 w-3.5" />
                Back
              </button>
              <div className="flex items-center gap-2">
                <span className={`flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br ${activeSectionMeta?.color || "from-slate-400 to-slate-500"} text-white`}>
                  <LuFolder className="h-3.5 w-3.5" />
                </span>
                <span className="text-sm font-bold text-slate-800">{activeSectionMeta?.label || activeSection}</span>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                {filtered.length} categories
              </span>
            </div>

            <button
              onClick={openCreateModal}
              className="flex items-center gap-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 text-xs font-bold shadow transition cursor-pointer"
            >
              <LuPlus className="h-4 w-4" />
              Add Category
            </button>
          </div>

          {/* Category Grid Cards */}
          {loading ? (
            <div className="py-16 text-center text-slate-400 animate-pulse text-sm">Loading categories...</div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center">
              <LuCircleAlert className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-slate-700">No categories found</h4>
              <p className="text-xs text-slate-400 mt-1">Click "Add Category" to create your first category</p>
            </div>
          ) : (
            <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map(cat => (
                <div
                  key={cat._id}
                  className={`group relative bg-white border rounded-2xl shadow-xs overflow-hidden transition-all hover:shadow-md ${
                    cat.isActive ? "border-slate-200" : "border-slate-200 opacity-60"
                  }`}
                >
                  {/* Card Image */}
                  <div className="aspect-[16/10] bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center overflow-hidden">
                    {cat.imageUrl ? (
                      <img
                        src={mediaUrl(cat.imageUrl)}
                        alt={cat.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 text-slate-300">
                        <LuFolder className="h-10 w-10" strokeWidth={1.25} />
                      </div>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-slate-800 truncate capitalize">{cat.name}</h3>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{cat.section}</p>
                      </div>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border whitespace-nowrap mt-0.5 ${
                        cat.isActive
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-slate-100 text-slate-400 border-slate-200"
                      }`}>
                        {cat.isActive ? "Active" : "Disabled"}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => handleToggleStatus(cat)}
                        className={`rounded-lg border p-1.5 transition cursor-pointer ${
                          cat.isActive
                            ? "text-green-600 bg-green-50 border-green-200 hover:bg-green-100"
                            : "text-slate-400 bg-slate-50 border-slate-200 hover:bg-slate-100"
                        }`}
                        title={cat.isActive ? "Disable" : "Enable"}
                      >
                        {cat.isActive ? <LuToggleRight className="h-3.5 w-3.5" /> : <LuToggleLeft className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        onClick={() => openEditModal(cat)}
                        className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 hover:text-indigo-600 transition cursor-pointer"
                        title="Edit"
                      >
                        <LuPencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat._id)}
                        className="rounded-lg border border-slate-200 p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 transition cursor-pointer"
                        title="Delete"
                      >
                        <LuTrash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Modal Overlay ─────────────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeModal}
          />

          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 text-white">
                  {modalMode === "create" ? <LuPlus className="h-4 w-4" /> : <LuPencil className="h-4 w-4" />}
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  {modalMode === "create" ? "Create Category" : "Edit Category"}
                </h3>
              </div>
              <button
                onClick={closeModal}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
              >
                <LuX className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Image Upload */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Category Image</label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="modal-image-upload"
                  />
                  {imagePreview ? (
                    <div className="relative aspect-[16/9] rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                      <img src={imagePreview} className="h-full w-full object-cover" alt="Preview" />
                      <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                        <label
                          htmlFor="modal-image-upload"
                          className="rounded-lg bg-white/90 text-slate-700 px-3 py-1.5 text-xs font-bold cursor-pointer shadow"
                        >
                          Change Image
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setImageFile(null); setImagePreview(""); }}
                        className="absolute top-2 right-2 rounded-full bg-slate-900/60 text-white p-1 hover:bg-slate-900 cursor-pointer"
                      >
                        <LuX className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <label
                      htmlFor="modal-image-upload"
                      className="flex flex-col items-center justify-center aspect-[16/9] rounded-xl border-2 border-dashed border-slate-250 hover:border-orange-400 hover:bg-orange-50/30 cursor-pointer transition-colors"
                    >
                      <LuImage className="h-8 w-8 text-slate-300 mb-2" />
                      <span className="text-xs font-bold text-slate-400">Click to upload image</span>
                      <span className="text-[10px] text-slate-300 mt-0.5">JPG, PNG, WebP</span>
                    </label>
                  )}
                </div>
              </div>

              {/* Category Name */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Finance, Healthcare"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                  autoFocus
                />
              </div>

              {/* Section (pre-filled, read-only since user drilled into a section) */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">App Section</label>
                <select
                  value={section}
                  onChange={e => setSection(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors cursor-pointer"
                >
                  {SECTIONS.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !name.trim()}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white py-2.5 text-sm font-bold shadow transition cursor-pointer disabled:opacity-60"
                >
                  {modalMode === "create" ? <LuPlus className="h-4 w-4" /> : <LuCheck className="h-4 w-4" />}
                  {saving ? "Saving..." : (modalMode === "create" ? "Create" : "Save Changes")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
