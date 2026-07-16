import { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthProvider";
import { api, apiForm, mediaUrl } from "../../lib/api";
import { toastFromError, toastSuccess } from "../../lib/toast";
import { LuPlus, LuPencil, LuTrash2, LuEye, LuX, LuCheck, LuMegaphone, LuClock, LuCircleHelp, LuUsers, LuImage, LuSearch } from "react-icons/lu";

const CATEGORIES = [
  "Spiritual",
  "Health",
  "Education",
  "Business",
  "Government",
  "Agriculture",
  "Social",
  "Festivals",
  "Motivation",
  "Real Estate"
];

export function AppScriptsApproval() {
  const { token } = useAuth();
  const [scripts, setScripts] = useState([]);
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewScript, setViewScript] = useState(null);
  
  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editScript, setEditScript] = useState(null);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  // Assign Modal State
  const [assignScript, setAssignScript] = useState(null);
  const [selectedCreatorIds, setSelectedCreatorIds] = useState([]);

  // Form State
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [duration, setDuration] = useState("45s");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  // Filters State
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("Newest First");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  // Objection State
  const [objectionScript, setObjectionScript] = useState(null);
  const [objectionNote, setObjectionNote] = useState("");

  const getLocalDateTimeString = (date) => {
    const tzoffset = date.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(date - tzoffset)).toISOString().slice(0, 16);
    return localISOTime;
  };
  const [scheduledAt, setScheduledAt] = useState(getLocalDateTimeString(new Date()));
  const [generating, setGenerating] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const [scriptsRes, creatorsRes] = await Promise.all([
        api("/api/app/scripts", { token }),
        api("/api/app/creators", { token })
      ]);
      setScripts(scriptsRes.scripts || []);
      setCreators(creatorsRes.creators || []);
    } catch (e) {
      toastFromError(e, "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [token]);

  function openCreate() {
    setEditScript(null);
    setTitle("");
    setBody("");
    setDescription("");
    setCategory(CATEGORIES[0]);
    setDuration("45s");
    setScheduledAt(getLocalDateTimeString(new Date()));
    setImageFile(null);
    setImagePreview("");
    setModalOpen(true);
  }

  function openEdit(s) {
    setEditScript(s);
    setTitle(s.title);
    setBody(s.body);
    setDescription(s.description || "");
    setCategory(s.category);
    setDuration(s.duration || "45s");
    setScheduledAt(getLocalDateTimeString(new Date(s.createdAt || Date.now())));
    setImageFile(null);
    setImagePreview(s.imageUrl ? mediaUrl(s.imageUrl) : "");
    setModalOpen(true);
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function openAssign(s) {
    setAssignScript(s);
    setSelectedCreatorIds(s.userIds || []);
  }

  async function onSave(e) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      return;
    }
    setSaving(true);
    try {
      const dt = new Date(scheduledAt);
      const formattedDate = dt.toLocaleDateString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "short",
        day: "numeric"
      });

      const formattedTime = dt.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });

      const fd = new FormData();
      fd.append("title", title.trim());
      fd.append("body", body.trim());
      if (description) {
        fd.append("description", description.trim());
      }
      fd.append("category", category);
      fd.append("duration", duration);
      fd.append("scheduledDate", formattedDate);
      fd.append("scheduledTime", formattedTime);
      if (imageFile) {
        fd.append("image", imageFile);
      }

      if (editScript) {
        await apiForm(`/api/app/scripts/${editScript.scriptId}`, {
          method: "PATCH",
          token,
          formData: fd
        });
        toastSuccess("Script updated successfully");
      } else {
        await apiForm("/api/app/scripts", {
          method: "POST",
          token,
          formData: fd
        });
        toastSuccess("Script template created successfully");
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      toastFromError(err, "Failed to save script");
    } finally {
      setSaving(false);
    }
  }

  async function handleAiGenerate() {
    if (!title.trim()) {
      alert("Please enter a Script Title first.");
      return;
    }
    setGenerating(true);
    try {
      const res = await api("/api/app/generate-script", {
        method: "POST",
        token,
        body: { title, category, duration, description: description.trim() || null }
      });
      if (res.success) {
        toastSuccess("Script template generated and saved successfully!");
        setModalOpen(false);
        loadData();
      }
    } catch (e) {
      toastFromError(e, "Failed to generate script");
    } finally {
      setGenerating(false);
    }
  }

  async function submitAssignment(e) {
    e.preventDefault();
    if (!assignScript) return;
    setSaving(true);
    try {
      await api(`/api/app/scripts/${assignScript.scriptId}`, {
        method: "PATCH",
        token,
        body: { creatorIds: selectedCreatorIds }
      });
      toastSuccess("Script assignments updated successfully");
      setAssignScript(null);
      loadData();
    } catch (err) {
      toastFromError(err, "Failed to update assignments");
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(scriptId, status) {
    setUpdatingId(scriptId);
    try {
      await api(`/api/app/scripts/${scriptId}/status`, {
        method: "PUT",
        token,
        body: { status }
      });
      toastSuccess(`Script status updated to ${status}`);
      if (viewScript && viewScript.scriptId === scriptId) {
        setViewScript(prev => ({ ...prev, approvalStatus: status }));
      }
      loadData();
    } catch (e) {
      toastFromError(e, "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  }

  async function raiseObjection(e) {
    e.preventDefault();
    if (!objectionScript || !objectionNote.trim()) return;
    setSaving(true);
    try {
      await api(`/api/app/scripts/${objectionScript.scriptId}/status`, {
        method: "PUT",
        token,
        body: { status: "Objection", note: objectionNote.trim() }
      });
      toastSuccess("Objection raised successfully. Script sent back for re-editing.");
      if (viewScript && viewScript.scriptId === objectionScript.scriptId) {
        setViewScript(prev => ({ ...prev, approvalStatus: "Objection" }));
      }
      setObjectionScript(null);
      setObjectionNote("");
      loadData();
    } catch (err) {
      toastFromError(err, "Failed to raise objection");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(s) {
    if (!window.confirm(`Delete script "${s.title}"?`)) return;
    try {
      await api(`/api/app/scripts/${s.scriptId}`, { method: "DELETE", token });
      toastSuccess("Script deleted successfully");
      loadData();
    } catch (e) {
      toastFromError(e, "Failed to delete script");
    }
  }

  // --- Dynamic Tab Counts ---
  const countAll = scripts.length;
  const countPending = scripts.filter(s => s.approvalStatus === "Pending" || s.approvalStatus === "Waiting" || s.approvalStatus === "Draft").length;
  const countSubmitted = scripts.filter(s => s.approvalStatus === "Submitted").length;
  const countEditing = scripts.filter(s => s.approvalStatus === "Editing").length;
  const countEdited = scripts.filter(s => s.approvalStatus === "Edited").length;
  const countApproved = scripts.filter(s => s.approvalStatus === "Approved").length;
  const countObjection = scripts.filter(s => s.approvalStatus === "Objection").length;
  const countRejected = scripts.filter(s => s.approvalStatus === "Rejected").length;

  // --- Filtering & Sorting ---
  let filteredScripts = [...scripts];

  // 1. Tab Filtering
  if (activeTab === "Pending") {
    filteredScripts = filteredScripts.filter(s => s.approvalStatus === "Pending" || s.approvalStatus === "Waiting" || s.approvalStatus === "Draft");
  } else if (activeTab === "Submitted") {
    filteredScripts = filteredScripts.filter(s => s.approvalStatus === "Submitted");
  } else if (activeTab === "Editing") {
    filteredScripts = filteredScripts.filter(s => s.approvalStatus === "Editing");
  } else if (activeTab === "Edited") {
    filteredScripts = filteredScripts.filter(s => s.approvalStatus === "Edited");
  } else if (activeTab === "Approved") {
    filteredScripts = filteredScripts.filter(s => s.approvalStatus === "Approved");
  } else if (activeTab === "Objection") {
    filteredScripts = filteredScripts.filter(s => s.approvalStatus === "Objection");
  } else if (activeTab === "Rejected") {
    filteredScripts = filteredScripts.filter(s => s.approvalStatus === "Rejected");
  }

  // 2. Search Query Filtering
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filteredScripts = filteredScripts.filter(s => 
      s.title.toLowerCase().includes(query) || 
      s.body.toLowerCase().includes(query)
    );
  }

  // 3. Category Filtering
  if (selectedCategory !== "All") {
    filteredScripts = filteredScripts.filter(s => s.category === selectedCategory);
  }

  // 4. Date Filtering
  if (startDate) {
    const start = new Date(startDate);
    filteredScripts = filteredScripts.filter(s => new Date(s.createdAt) >= start);
  }
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    filteredScripts = filteredScripts.filter(s => new Date(s.createdAt) <= end);
  }

  // 5. Sorting
  if (sortBy === "Newest First") {
    filteredScripts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else if (sortBy === "Oldest First") {
    filteredScripts.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  } else if (sortBy === "Alphabetical (A-Z)") {
    filteredScripts.sort((a, b) => a.title.localeCompare(b.title));
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow">
            <LuMegaphone className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <div>
            <h2 className="text-xl font-bold text-slate-900 font-sans">UGC Prompter</h2>
            <p className="mt-0.5 text-sm text-slate-500">Create scripts for your creators &amp; review their submissions</p>
          </div>
        </div>
        
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white px-4 py-2.5 text-sm font-semibold shadow transition-all hover:scale-[1.02]"
        >
          <LuPlus className="h-4 w-4" /> Create New Script
        </button>
      </div>

      {/* Tabs list (Matches Reference Design) */}
      <div className="flex flex-wrap gap-2.5 items-center">
        {[
          { label: "All", count: countAll },
          { label: "Pending", count: countPending },
          { label: "Submitted", count: countSubmitted },
          { label: "Editing", count: countEditing },
          { label: "Edited", count: countEdited },
          { label: "Approved", count: countApproved },
          { label: "Objection", count: countObjection },
          { label: "Rejected", count: countRejected }
        ].map(t => {
          const isActive = activeTab === t.label;
          return (
            <button
              key={t.label}
              onClick={() => setActiveTab(t.label)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition shadow-xs border ${
                isActive
                  ? "bg-gradient-to-r from-orange-500 to-amber-600 border-orange-600 text-white"
                  : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
              }`}
            >
              <span>{t.label}</span>
              <span className={`inline-flex items-center justify-center rounded-full h-5 w-5 text-[10px] font-extrabold ${
                isActive ? "bg-white text-orange-600" : "bg-slate-100 text-slate-600"
              }`}>
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search & Filter Container (Matches Reference Design) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          {/* SEARCH */}
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">Search</label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search topic or script..."
                className="w-full rounded-lg border border-slate-300 pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-slate-800 placeholder-slate-400"
              />
              <LuSearch className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            </div>
          </div>

          {/* CATEGORY */}
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-slate-800"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* SORT BY */}
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-slate-800"
            >
              <option value="Newest First">Newest First</option>
              <option value="Oldest First">Oldest First</option>
              <option value="Alphabetical (A-Z)">Alphabetical (A-Z)</option>
            </select>
          </div>

          {/* START DATE */}
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-slate-800"
            />
          </div>

          {/* END DATE */}
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-slate-800"
            />
          </div>
        </div>
      </div>

      {/* Scripts table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="py-12 text-center text-slate-400 animate-pulse">Loading scripts…</div>
        ) : filteredScripts.length === 0 ? (
          <div className="py-16 text-center max-w-sm mx-auto">
            <LuCircleHelp className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">No scripts found</h3>
            <p className="text-sm text-slate-500 mt-1">
              Try adjusting your filter tabs, category dropdown, or search query.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                  <th className="px-4 py-3.5">Title</th>
                  <th className="px-4 py-3.5">Creator Assigned</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Duration</th>
                  <th className="px-4 py-3.5">Scheduled Time</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredScripts.map((s) => (
                  <tr key={s.scriptId} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-3">
                        {s.imageUrl ? (
                          <img
                            src={mediaUrl(s.imageUrl)}
                            alt={s.title}
                            className="h-9 w-9 rounded-lg object-cover border border-slate-100 shrink-0"
                          />
                        ) : (
                          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-slate-400 border border-slate-100 shrink-0">
                            <LuImage className="h-4 w-4" />
                          </span>
                        )}
                        <span>{s.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {s.assignedCreators && s.assignedCreators.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                          {s.assignedCreators.map(ac => (
                            <span
                              key={ac.creatorId}
                              className="inline-flex flex-col rounded-lg bg-indigo-50 border border-indigo-100 px-2 py-1 text-xs"
                            >
                              <span className="font-semibold text-indigo-900 leading-tight">{ac.name}</span>
                              <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wide">
                                {ac.role}
                              </span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                        {s.category}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-mono text-xs">{s.duration}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <LuClock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        {s.scheduledTime}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold border ${
                        s.approvalStatus === "Approved" ? "bg-green-50 text-green-700 border-green-200" :
                        s.approvalStatus === "Rejected" ? "bg-red-50 text-red-700 border-red-200" :
                        s.approvalStatus === "Pending" || s.approvalStatus === "Waiting" || s.approvalStatus === "Draft" ? "bg-amber-50 text-amber-700 border-amber-200" :
                        s.approvalStatus === "Submitted" ? "bg-blue-50 text-blue-700 border-blue-200" :
                        s.approvalStatus === "Editing" ? "bg-purple-50 text-purple-700 border-purple-200 animate-pulse" :
                        s.approvalStatus === "Edited" ? "bg-teal-50 text-teal-700 border-teal-200" :
                        s.approvalStatus === "Objection" ? "bg-orange-50 text-orange-700 border-orange-200" :
                        "bg-slate-50 text-slate-600 border-slate-200"
                      }`}>
                        {s.approvalStatus === "Editing" ? `Editing (${s.processingProgress || 0}%)` : s.approvalStatus}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="inline-flex gap-2">
                        <button
                          onClick={() => setViewScript(s)}
                          className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 transition-colors"
                          title="View Script"
                        >
                          <LuEye className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => openEdit(s)}
                          className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                          title="Edit Script"
                        >
                          <LuPencil className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => onDelete(s)}
                          className="rounded-lg border border-slate-200 p-1.5 text-red-500 hover:bg-red-50 transition-colors"
                          title="Delete Script"
                        >
                          <LuTrash2 className="h-4 w-4" />
                        </button>

                        {!s.createdByAdmin ? (
                          <span className="inline-flex items-center rounded-lg bg-orange-50 border border-orange-200 px-2.5 py-1.5 text-xs font-bold text-orange-700 whitespace-nowrap">
                            Private
                          </span>
                        ) : (
                          creators.length > 0 && (
                            <button
                              onClick={() => openAssign(s)}
                              className="flex items-center gap-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 px-2 py-1.5 text-xs font-bold text-indigo-700 transition"
                              title="Assign to Creator"
                            >
                              <LuUsers className="h-3.5 w-3.5 mr-1" /> Assign
                            </button>
                          )
                        )}

                        {s.approvalStatus === "Edited" && (
                          <div className="flex gap-1.5 shrink-0">
                            <button
                              disabled={updatingId === s.scriptId}
                              onClick={() => updateStatus(s.scriptId, "Approved")}
                              className="flex items-center gap-1 rounded-lg bg-green-600 hover:bg-green-700 px-2.5 py-1 text-xs font-bold text-white shadow transition"
                              title="Approve Video"
                            >
                              <LuCheck className="h-3.5 w-3.5" /> Approve
                            </button>

                            <button
                              disabled={updatingId === s.scriptId}
                              onClick={() => setObjectionScript(s)}
                              className="flex items-center gap-1 rounded-lg bg-orange-500 hover:bg-orange-600 px-2.5 py-1 text-xs font-bold text-white shadow transition"
                              title="Raise Objection"
                            >
                              <LuCircleHelp className="h-3.5 w-3.5" /> Objection
                            </button>

                            <button
                              disabled={updatingId === s.scriptId}
                              onClick={() => updateStatus(s.scriptId, "Rejected")}
                              className="flex items-center gap-1 rounded-lg bg-red-600 hover:bg-red-700 px-2.5 py-1 text-xs font-bold text-white shadow transition"
                              title="Reject Video"
                            >
                              <LuX className="h-3.5 w-3.5" /> Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Script Modal */}
      {viewScript && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setViewScript(null)} />
          <div className="relative z-10 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl border border-slate-200 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900">Review Submitted Script</h3>
                <p className="text-xs text-slate-400">
                  {viewScript.userId ? `By ${viewScript.creatorName} (${viewScript.creatorRole})` : "Unassigned Script Template"}
                </p>
              </div>
              <button type="button" onClick={() => setViewScript(null)} className="text-slate-400 hover:text-slate-600">
                <LuX className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4 overflow-y-auto pr-1 flex-1 py-1">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl text-sm border border-slate-100">
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Script Title</span>
                  <span className="font-bold text-slate-800">{viewScript.title}</span>
                </div>
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Category</span>
                  <span className="font-semibold text-slate-800">{viewScript.category}</span>
                </div>
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Duration / TimeGroup</span>
                  <span className="font-mono text-slate-800">{viewScript.duration} / {viewScript.timeGroup}</span>
                </div>
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Scheduled Time</span>
                  <span className="font-semibold text-slate-800">{viewScript.scheduledTime}</span>
                </div>
              </div>

              {viewScript.imageUrl && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Reference Image</label>
                  <div className="max-w-xs overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                    <img
                      src={mediaUrl(viewScript.imageUrl)}
                      alt="Reference"
                      className="w-full h-auto object-cover max-h-48"
                    />
                  </div>
                </div>
              )}

              {viewScript.description && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Context / Description</label>
                  <div className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs leading-relaxed text-slate-700 whitespace-pre-wrap font-sans">
                    {viewScript.description}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Script Content</label>
                <div className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-4 text-sm leading-relaxed text-slate-800 whitespace-pre-wrap font-sans min-h-[150px]">
                  {viewScript.body}
                </div>
              </div>

              {viewScript.objectionNote && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-xs text-orange-850">
                  <span className="font-bold uppercase tracking-wider block mb-1">Objection Reason:</span>
                  {viewScript.objectionNote}
                </div>
              )}

              {(viewScript.rawVideoUrl || viewScript.processedVideoUrl) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {viewScript.rawVideoUrl && (
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Raw Video (Creator Upload)</label>
                      <div className="rounded-xl overflow-hidden border border-slate-200 bg-black aspect-video">
                        <video src={mediaUrl(viewScript.rawVideoUrl)} controls className="w-full h-full object-contain" />
                      </div>
                    </div>
                  )}
                  {viewScript.processedVideoUrl && (
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Processed Video (Edited AI)</label>
                      <div className="rounded-xl overflow-hidden border border-slate-200 bg-black aspect-video">
                        <video src={mediaUrl(viewScript.processedVideoUrl)} controls className="w-full h-full object-contain" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {viewScript.viralVideoUrl && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Viral-Optimized Video (AI)</label>
                  <div className="rounded-xl overflow-hidden border border-slate-200 bg-black max-w-sm aspect-video mx-auto">
                    <video src={mediaUrl(viewScript.viralVideoUrl)} controls className="w-full h-full object-contain" />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end items-center pt-4 border-t border-slate-100 mt-5 shrink-0 gap-3">
              {viewScript.approvalStatus === "Edited" && (
                <>
                  <button
                    disabled={updatingId === viewScript.scriptId}
                    onClick={() => { updateStatus(viewScript.scriptId, "Approved"); setViewScript(null); }}
                    className="flex items-center gap-1.5 rounded-lg bg-green-600 hover:bg-green-700 px-4 py-2 text-sm font-semibold text-white transition shadow"
                  >
                    <LuCheck className="h-4 w-4" /> Approve Video
                  </button>
                  <button
                    disabled={updatingId === viewScript.scriptId}
                    onClick={() => { setObjectionScript(viewScript); setViewScript(null); }}
                    className="flex items-center gap-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition shadow"
                  >
                    <LuCircleHelp className="h-4 w-4" /> Objection
                  </button>
                  <button
                    disabled={updatingId === viewScript.scriptId}
                    onClick={() => { updateStatus(viewScript.scriptId, "Rejected"); setViewScript(null); }}
                    className="flex items-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-700 px-4 py-2 text-sm font-semibold text-white transition shadow"
                  >
                    <LuX className="h-4 w-4" /> Reject Video
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => setViewScript(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setModalOpen(false)} />
          <div className="relative z-10 w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 shrink-0">
              <h3 className="text-base font-bold text-slate-900">
                {editScript ? "Edit UGC Script Template" : "Create New UGC Script Template"}
              </h3>
              <button type="button" onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <LuX className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={onSave} className="space-y-4 overflow-y-auto pr-1 flex-1 py-1">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Script Title</label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Organic Farming speech"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Duration</label>
                  <input
                    required
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g., 45s, 60s"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Schedule Date &amp; Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Reference Image (Optional)</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="script-image-upload"
                    />
                    <label
                      htmlFor="script-image-upload"
                      className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm cursor-pointer hover:bg-slate-50 transition text-slate-600 font-semibold w-full text-center justify-center"
                    >
                      <LuImage className="h-4 w-4" /> {imageFile ? "Change Image" : "Upload Image"}
                    </label>
                  </div>
                </div>
              </div>

              {imagePreview && (
                <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => { setImageFile(null); setImagePreview(""); }}
                    className="absolute top-1 right-1 rounded-full bg-slate-900/60 p-1 text-white hover:bg-slate-950 transition"
                  >
                    <LuX className="h-3 w-3" />
                  </button>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Context / Description (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Focus on digital transformation roadmap, customer retention strategies..."
                  rows={2}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white font-sans text-slate-800"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Script Body</label>
                  <button
                    type="button"
                    disabled={generating || !title.trim()}
                    onClick={handleAiGenerate}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 disabled:opacity-50 flex items-center gap-1"
                  >
                    {generating ? "Generating with AI..." : "✨ Auto-generate with AI"}
                  </button>
                </div>
                <textarea
                  required
                  rows={6}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write the teleprompter speech content here..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 font-sans"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-5 shrink-0">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60 transition shadow"
                >
                  {saving ? "Saving…" : "Save Script"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Creator Modal */}
      {assignScript && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setAssignScript(null)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Assign Script to Creators</h3>
              <button type="button" onClick={() => setAssignScript(null)} className="text-slate-400 hover:text-slate-600">
                <LuX className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={submitAssignment} className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 mb-3 font-sans">
                  Select creators (CEOs and Candidates) to assign script <strong>"{assignScript.title}"</strong> to:
                </p>
                
                <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1 bg-slate-50/50">
                  {creators.map(c => {
                    const isChecked = selectedCreatorIds.includes(c.creatorId);
                    return (
                      <label key={c.creatorId} className="flex items-center gap-3 p-2.5 hover:bg-white rounded-lg cursor-pointer transition border border-transparent hover:border-slate-100">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCreatorIds(prev => [...prev, c.creatorId]);
                            } else {
                              setSelectedCreatorIds(prev => prev.filter(id => id !== c.creatorId));
                            }
                          }}
                          className="h-4 w-4 rounded border-slate-355 text-indigo-600 focus:ring-indigo-400 cursor-pointer"
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-800 leading-tight">{c.name}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">{c.role}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-5">
                <button
                  type="button"
                  onClick={() => setAssignScript(null)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60 transition shadow"
                >
                  {saving ? "Updating…" : "Update Assignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Objection Reason Modal */}
      {objectionScript && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setObjectionScript(null)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Raise Objection</h3>
              <button type="button" onClick={() => setObjectionScript(null)} className="text-slate-400 hover:text-slate-600">
                <LuX className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={raiseObjection} className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 mb-3 font-sans">
                  Explain what needs to be changed in the video for script <strong>"{objectionScript.title}"</strong>:
                </p>
                <textarea
                  required
                  rows={4}
                  value={objectionNote}
                  onChange={(e) => setObjectionNote(e.target.value)}
                  placeholder="E.g., Please fix the caption font size, or change the B-roll music in the middle section..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-5">
                <button
                  type="button"
                  onClick={() => setObjectionScript(null)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !objectionNote.trim()}
                  className="flex items-center gap-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60 transition shadow"
                >
                  {saving ? "Submitting…" : "Send for Editing"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
