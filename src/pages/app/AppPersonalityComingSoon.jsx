import { useEffect, useState, useRef } from "react";
import { useAuth } from "../../auth/AuthProvider";
import { api, apiForm, mediaUrl } from "../../lib/api";
import { toastFromError, toastSuccess } from "../../lib/toast";
import { LuUser, LuPlus, LuEye, LuX, LuPlay, LuPause, LuRotateCcw, LuImage, LuClock, LuCalendar, LuCircleHelp, LuHeading, LuSparkles, LuPencil, LuTrash2 } from "react-icons/lu";

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

export function AppPersonalityComingSoon() {
  const { token, user } = useAuth();
  const [scripts, setScripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewScript, setViewScript] = useState(null);
  
  // Teleprompter Modal State
  const [teleprompterScript, setTeleprompterScript] = useState(null);
  const [scrollSpeed, setScrollSpeed] = useState(3); // 1 to 10
  const [fontSize, setFontSize] = useState(24); // 16 to 48
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollRef = useRef(null);
  const scrollInterval = useRef(null);

  // Creation Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [duration, setDuration] = useState("45s");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const getLocalDateTimeString = (date) => {
    const tzoffset = date.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(date - tzoffset)).toISOString().slice(0, 16);
    return localISOTime;
  };
  const [scheduledAt, setScheduledAt] = useState(getLocalDateTimeString(new Date()));

  async function loadScripts() {
    setLoading(true);
    try {
      const data = await api("/api/personality/scripts", { token });
      setScripts(data || []);
    } catch (e) {
      toastFromError(e, "Failed to load scripts");
    } finally {
      setLoading(false);
    }
  }

  async function handleAcceptScript(scriptId) {
    setLoading(true);
    try {
      await api(`/api/personality/scripts/${scriptId}/accept`, {
        method: "POST",
        token
      });
      toastSuccess("Script accepted successfully! Ready to record.");
      loadScripts();
    } catch (e) {
      toastFromError(e, "Failed to accept script");
    } finally {
      setLoading(false);
    }
  }

  async function handleVideoUpload(scriptId, e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 200 * 1024 * 1024) {
      alert("Video file size cannot exceed 200MB.");
      return;
    }

    setLoading(true);
    
    const fd = new FormData();
    fd.append("video", file);

    try {
      await apiForm(`/api/personality/scripts/${scriptId}/upload-video`, {
        method: "POST",
        token,
        formData: fd
      });
      toastSuccess("Raw video uploaded successfully! Initiated AI video processing engine.");
      loadScripts();
    } catch (err) {
      toastFromError(err, "Failed to upload raw video");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadScripts();
  }, [token]);

  // Dynamic Polling for scripts in 'Editing' state
  useEffect(() => {
    const hasEditing = scripts.some(s => s.approvalStatus === "Editing");
    let interval = null;
    if (hasEditing) {
      interval = setInterval(() => {
        // Poll for updates in background
        api("/api/personality/scripts", { token })
          .then(data => {
            if (data) setScripts(data);
          })
          .catch(e => console.error("Poll scripts error:", e.message));
      }, 10000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [scripts, token]);

  // Teleprompter Scrolling Logic
  useEffect(() => {
    if (isScrolling && teleprompterScript) {
      scrollInterval.current = setInterval(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop += scrollSpeed / 2;
          // Check if reached bottom
          if (scrollRef.current.scrollTop + scrollRef.current.clientHeight >= scrollRef.current.scrollHeight) {
            setIsScrolling(false);
          }
        }
      }, 30);
    } else {
      if (scrollInterval.current) {
        clearInterval(scrollInterval.current);
      }
    }
    return () => {
      if (scrollInterval.current) {
        clearInterval(scrollInterval.current);
      }
    };
  }, [isScrolling, scrollSpeed, teleprompterScript]);

  function startTeleprompter(s) {
    setTeleprompterScript(s);
    setIsScrolling(false);
    setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    }, 50);
  }

  function closeTeleprompter() {
    setTeleprompterScript(null);
    setIsScrolling(false);
  }

  const [generating, setGenerating] = useState(false);

  async function handleAiGenerate() {
    if (!title.trim()) {
      alert("Please enter a Script Title first to generate content.");
      return;
    }
    setGenerating(true);
    try {
      const result = await api("/api/personality/generate-script", {
        method: "POST",
        token,
        body: {
          title: title.trim(),
          category,
          duration,
          description: description.trim() || null
        }
      });
      if (result) {
        toastSuccess("Script generated and saved successfully!");
        setModalOpen(false);
        loadScripts();
      }
    } catch (err) {
      toastFromError(err, "Failed to generate script with AI");
    } finally {
      setGenerating(false);
    }
  }

  const [editScript, setEditScript] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [objectionScript, setObjectionScript] = useState(null);
  const [objectionNote, setObjectionNote] = useState("");

  function openEdit(s) {
    setEditScript(s);
    setTitle(s.title);
    setBody(s.body);
    setDescription(s.description || "");
    setCategory(s.category);
    setDuration(s.duration || "45s");
    setScheduledAt(getLocalDateTimeString(new Date(s.createdAt || Date.now())));
    setImageFile(null);
    setImagePreview("");
    setModalOpen(true);
  }

  async function handleDelete(scriptId) {
    if (!window.confirm("Are you sure you want to delete this script?")) return;
    setLoading(true);
    try {
      await api(`/api/personality/scripts/${scriptId}`, {
        method: "DELETE",
        token
      });
      toastSuccess("Script deleted successfully");
      loadScripts();
    } catch (e) {
      toastFromError(e, "Failed to delete script");
    } finally {
      setLoading(false);
    }
  }

  async function updateScriptStatus(scriptId, status, note = "") {
    setUpdatingId(scriptId);
    try {
      await api(`/api/personality/scripts/${scriptId}/status`, {
        method: "PUT",
        token,
        body: { status, note }
      });
      toastSuccess(`Script status updated to ${status}`);
      if (viewScript && viewScript.scriptId === scriptId) {
        setViewScript(prev => ({ ...prev, approvalStatus: status }));
      }
      loadScripts();
    } catch (e) {
      toastFromError(e, "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleRaiseObjection(e) {
    e.preventDefault();
    if (!objectionScript || !objectionNote.trim()) return;
    setSaving(true);
    try {
      await updateScriptStatus(objectionScript.scriptId, "Objection", objectionNote.trim());
      setObjectionScript(null);
      setObjectionNote("");
    } finally {
      setSaving(false);
    }
  }

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

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
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

      const payload = {
        title: title.trim(),
        body: body.trim(),
        description: description.trim() || null,
        category,
        duration,
        scheduledDate: formattedDate,
        scheduledTime: formattedTime
      };
      
      if (editScript) {
        await api(`/api/personality/scripts/${editScript.scriptId}`, {
          method: "PUT",
          token,
          body: payload
        });
        toastSuccess("Script updated successfully");
      } else {
        await api("/api/personality/scripts", {
          method: "POST",
          token,
          body: payload
        });
        toastSuccess("Script created successfully");
      }

      setModalOpen(false);
      loadScripts();
    } catch (err) {
      toastFromError(err, "Failed to save script");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow">
            <LuUser className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <div>
            <h2 className="text-xl font-bold text-slate-900 font-sans">Teleprompter Scripts</h2>
            <p className="mt-0.5 text-sm text-slate-500">Read assigned speech scripts on the teleprompter or write your own</p>
          </div>
        </div>

        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white px-4 py-2.5 text-sm font-semibold shadow transition-all hover:scale-[1.02]"
        >
          <LuPlus className="h-4 w-4" /> Write New Script
        </button>
      </div>

      {/* Grid of scripts */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 animate-pulse">Loading scripts…</div>
      ) : scripts.length === 0 ? (
        <div className="py-16 text-center max-w-sm mx-auto">
          <LuCircleHelp className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">No scripts assigned yet</h3>
          <p className="text-sm text-slate-500 mt-1">
            Scripts assigned to you by the Founder or written by you will appear here.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {scripts.map((s) => (
            <div key={s.scriptId} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
              {/* Script image preview */}
              {s.imageUrl && (
                <div className="mb-4 h-36 w-full rounded-xl overflow-hidden border border-slate-100 bg-slate-50">
                  <img src={mediaUrl(s.imageUrl)} alt={s.title} className="w-full h-full object-cover" />
                </div>
              )}
              
              <div className="flex items-center gap-2 mb-2 shrink-0">
                <span className="inline-flex rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-semibold text-orange-700">
                  {s.category}
                </span>
                <span className="text-xs text-slate-400 font-mono">{s.duration}</span>
              </div>
              
              <h3 className="text-base font-bold text-slate-900 line-clamp-1 mb-2" title={s.title}>
                {s.title}
              </h3>
              
              <p className="text-sm text-slate-500 line-clamp-3 mb-4 flex-1">
                {s.body}
              </p>
              
              {s.approvalStatus === "Objection" && (
                <div className="mb-3.5 rounded-xl bg-orange-50 border border-orange-200 p-2.5 text-xs text-orange-850">
                  <span className="font-extrabold block uppercase tracking-wider text-[9px] mb-0.5 text-orange-600">Objection Reason:</span>
                  {s.objectionNote || "Please re-upload video."}
                </div>
              )}

              <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-400">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold border ${
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
                
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setViewScript(s)}
                    className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 transition-colors"
                    title="View Details"
                  >
                    <LuEye className="h-4 w-4" />
                  </button>

                  {s.userId === user?.id && !s.createdByAdmin && (
                    <>
                      <button
                        onClick={() => openEdit(s)}
                        className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                        title="Edit Script"
                      >
                        <LuPencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(s.scriptId)}
                        className="rounded-lg border border-slate-200 p-1.5 text-red-500 hover:bg-red-50 transition-colors"
                        title="Delete Script"
                      >
                        <LuTrash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}

                  {/* Context-sensitive actions */}
                  {(s.approvalStatus === "Pending" || s.approvalStatus === "Waiting") && (
                    <button
                      onClick={() => handleAcceptScript(s.scriptId)}
                      className="rounded-lg bg-indigo-600 hover:bg-indigo-750 text-white px-3 py-1.5 text-xs font-bold transition shadow"
                    >
                      Accept
                    </button>
                  )}

                  {(s.approvalStatus === "Draft" || s.approvalStatus === "Objection" || (s.approvalStatus === "Submitted" && !s.rawVideoUrl)) && (
                    <label className="rounded-lg bg-indigo-600 hover:bg-indigo-750 text-white px-3 py-1.5 text-xs font-bold transition shadow cursor-pointer">
                      Upload Video
                      <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => handleVideoUpload(s.scriptId, e)}
                        className="hidden"
                      />
                    </label>
                  )}

                  {(s.approvalStatus === "Submitted" && s.rawVideoUrl) && (
                    <div className="flex gap-1.5">
                      <button
                        disabled={updatingId === s.scriptId}
                        onClick={() => updateScriptStatus(s.scriptId, "Approved")}
                        className="rounded-lg bg-green-600 hover:bg-green-700 text-white px-2.5 py-1.5 text-[11px] font-bold transition shadow"
                        title="Approve Video Directly"
                      >
                        Approve
                      </button>
                      <button
                        disabled={updatingId === s.scriptId}
                        onClick={() => updateScriptStatus(s.scriptId, "Editing")}
                        className="rounded-lg bg-indigo-600 hover:bg-indigo-755 text-white px-2.5 py-1.5 text-[11px] font-bold transition shadow"
                        title="Request AI Video Edit"
                      >
                        AI Edit
                      </button>
                    </div>
                  )}

                  {s.approvalStatus === "Edited" && (
                    <div className="flex gap-1">
                      <button
                        disabled={updatingId === s.scriptId}
                        onClick={() => updateScriptStatus(s.scriptId, "Approved")}
                        className="rounded-lg bg-green-600 hover:bg-green-700 text-white px-2 py-1 text-[10px] font-bold transition shadow"
                        title="Accept Video"
                      >
                        Accept
                      </button>
                      <button
                        disabled={updatingId === s.scriptId}
                        onClick={() => setObjectionScript(s)}
                        className="rounded-lg bg-orange-500 hover:bg-orange-600 text-white px-2 py-1 text-[10px] font-bold transition shadow"
                        title="Raise Objection"
                      >
                        Objection
                      </button>
                      <button
                        disabled={updatingId === s.scriptId}
                        onClick={() => updateScriptStatus(s.scriptId, "Rejected")}
                        className="rounded-lg bg-red-600 hover:bg-red-700 text-white px-2 py-1 text-[10px] font-bold transition shadow"
                        title="Reject Video"
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {(s.approvalStatus !== "Pending" && s.approvalStatus !== "Waiting") && (
                    <button
                      onClick={() => startTeleprompter(s)}
                      className="flex items-center gap-1 rounded-lg bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 font-bold transition shadow"
                    >
                      <LuPlay className="h-3.5 w-3.5" /> Start
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Script Details Modal */}
      {viewScript && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setViewScript(null)} />
          <div className="relative z-10 w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">{viewScript.title}</h3>
              <button type="button" onClick={() => setViewScript(null)} className="text-slate-400 hover:text-slate-600">
                <LuX className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl text-sm">
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Category</span>
                  <span className="font-semibold text-slate-800">{viewScript.category}</span>
                </div>
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Duration</span>
                  <span className="font-mono text-slate-800">{viewScript.duration}</span>
                </div>
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Scheduled Time</span>
                  <span className="font-semibold text-slate-800">{viewScript.scheduledTime}</span>
                </div>
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Status</span>
                  <span className="font-semibold text-slate-800">{viewScript.approvalStatus}</span>
                </div>
              </div>

              {viewScript.imageUrl && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Storyboard Reference</label>
                  <img src={mediaUrl(viewScript.imageUrl)} alt="Reference" className="w-full max-h-48 object-cover rounded-xl border border-slate-200" />
                </div>
              )}

              {viewScript.description && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Context / Description</label>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-700 whitespace-pre-wrap font-sans">
                    {viewScript.description}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Script Text</label>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-800 whitespace-pre-wrap font-sans">
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
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Raw Recorded Video</label>
                      <div className="rounded-xl overflow-hidden border border-slate-200 bg-black aspect-video">
                        <video src={mediaUrl(viewScript.rawVideoUrl)} controls className="w-full h-full object-contain" />
                      </div>
                    </div>
                  )}
                  {viewScript.processedVideoUrl && (
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">AI Processed Video</label>
                      <div className="rounded-xl overflow-hidden border border-slate-200 bg-black aspect-video">
                        <video src={mediaUrl(viewScript.processedVideoUrl)} controls className="w-full h-full object-contain" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {viewScript.viralVideoUrl && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Viral-Optimized AI Video</label>
                  <div className="rounded-xl overflow-hidden border border-slate-200 bg-black max-w-sm aspect-video mx-auto">
                    <video src={mediaUrl(viewScript.viralVideoUrl)} controls className="w-full h-full object-contain" />
                  </div>
                </div>
              )}
            </div>            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-5">
              {viewScript.approvalStatus === "Edited" && (
                <>
                  <button
                    disabled={updatingId === viewScript.scriptId}
                    onClick={() => { updateScriptStatus(viewScript.scriptId, "Approved"); setViewScript(null); }}
                    className="rounded-lg bg-green-600 hover:bg-green-700 px-4 py-2 text-sm font-semibold text-white transition shadow"
                  >
                    Accept Video
                  </button>
                  <button
                    disabled={updatingId === viewScript.scriptId}
                    onClick={() => { setObjectionScript(viewScript); setViewScript(null); }}
                    className="rounded-lg bg-orange-500 hover:bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition shadow"
                  >
                    Objection
                  </button>
                  <button
                    disabled={updatingId === viewScript.scriptId}
                    onClick={() => { updateScriptStatus(viewScript.scriptId, "Rejected"); setViewScript(null); }}
                    className="rounded-lg bg-red-600 hover:bg-red-700 px-4 py-2 text-sm font-semibold text-white transition shadow"
                  >
                    Reject Video
                  </button>
                </>
              )}

              {(viewScript.approvalStatus === "Pending" || viewScript.approvalStatus === "Waiting") && (
                <button
                  type="button"
                  onClick={() => { handleAcceptScript(viewScript.scriptId); setViewScript(null); }}
                  className="rounded-lg bg-indigo-600 hover:bg-indigo-750 px-4 py-2 text-sm font-semibold text-white transition shadow"
                >
                  Accept Script
                </button>
              )}

              {(viewScript.approvalStatus === "Draft" || viewScript.approvalStatus === "Objection" || (viewScript.approvalStatus === "Submitted" && !viewScript.rawVideoUrl)) && (
                <label className="rounded-lg bg-indigo-600 hover:bg-indigo-750 text-white px-4 py-2 text-sm font-semibold transition shadow cursor-pointer text-center flex items-center justify-center">
                  Upload Video
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => { handleVideoUpload(viewScript.scriptId, e); setViewScript(null); }}
                    className="hidden"
                  />
                </label>
              )}

              {(viewScript.approvalStatus === "Submitted" && viewScript.rawVideoUrl) && (
                <>
                  <button
                    disabled={updatingId === viewScript.scriptId}
                    onClick={() => { updateScriptStatus(viewScript.scriptId, "Approved"); setViewScript(null); }}
                    className="rounded-lg bg-green-600 hover:bg-green-700 px-4 py-2 text-sm font-semibold text-white transition shadow"
                  >
                    Approve Video
                  </button>
                  <button
                    disabled={updatingId === viewScript.scriptId}
                    onClick={() => { updateScriptStatus(viewScript.scriptId, "Editing"); setViewScript(null); }}
                    className="rounded-lg bg-indigo-600 hover:bg-indigo-755 px-4 py-2 text-sm font-semibold text-white transition shadow"
                  >
                    AI Edit
                  </button>
                </>
              )}

              {(viewScript.approvalStatus !== "Pending" && viewScript.approvalStatus !== "Waiting") && (
                <button
                  type="button"
                  onClick={() => startTeleprompter(viewScript)}
                  className="flex items-center gap-1 rounded-lg bg-orange-600 hover:bg-orange-700 px-4 py-2 text-sm font-semibold text-white transition shadow"
                >
                  <LuPlay className="h-4 w-4" /> Start Teleprompter
                </button>
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

      {/* Teleprompter Fullscreen Overlay */}
      {teleprompterScript && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white p-6 md:p-10 select-none">
          {/* Header toolbar */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4 shrink-0">
            <div>
              <h3 className="text-lg font-bold tracking-tight">{teleprompterScript.title}</h3>
              <p className="text-xs text-slate-400">Duration: {teleprompterScript.duration} | Category: {teleprompterScript.category}</p>
            </div>
            <button
              onClick={closeTeleprompter}
              className="rounded-lg bg-slate-900 border border-slate-800 p-2 text-slate-400 hover:text-white transition"
              title="Close Teleprompter"
            >
              <LuX className="h-5 w-5" />
            </button>
          </div>

          {/* Settings toolbar */}
          <div className="flex flex-wrap gap-6 items-center justify-center bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 mb-6 shrink-0 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Font Size:</span>
              <input
                type="range"
                min="18"
                max="48"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-24 accent-orange-500 cursor-pointer"
              />
              <span className="font-semibold w-8">{fontSize}px</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400">Scroll Speed:</span>
              <input
                type="range"
                min="1"
                max="10"
                value={scrollSpeed}
                onChange={(e) => setScrollSpeed(Number(e.target.value))}
                className="w-24 accent-orange-500 cursor-pointer"
              />
              <span className="font-semibold w-6">{scrollSpeed}</span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setIsScrolling(!isScrolling)}
                className={`flex items-center gap-1.5 rounded-lg px-4 py-2 font-bold transition shadow ${
                  isScrolling ? "bg-amber-600 hover:bg-amber-700" : "bg-orange-600 hover:bg-orange-700"
                }`}
              >
                {isScrolling ? <LuPause className="h-4 w-4" /> : <LuPlay className="h-4 w-4" />}
                {isScrolling ? "Pause" : "Scroll"}
              </button>

              <button
                onClick={() => {
                  setIsScrolling(false);
                  if (scrollRef.current) scrollRef.current.scrollTop = 0;
                }}
                className="flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-2 font-semibold text-slate-300 hover:text-white transition"
              >
                <LuRotateCcw className="h-4 w-4" /> Reset
              </button>
            </div>
          </div>

          {/* Large Text Container */}
          <div className="relative flex-1 overflow-hidden rounded-2xl border border-slate-850 bg-slate-950">
            {/* Guide markers (eyeline anchor) */}
            <div className="absolute left-0 right-0 top-1/3 h-0.5 bg-orange-600/30 pointer-events-none z-10">
              <div className="absolute left-2 -top-2 bg-orange-600 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider text-white">Eyeline</div>
            </div>
            
            <div
              ref={scrollRef}
              className="w-full h-full overflow-y-auto px-6 md:px-12 py-32 text-center scroll-smooth leading-relaxed"
              style={{ fontSize: `${fontSize}px` }}
            >
              <div className="max-w-3xl mx-auto whitespace-pre-wrap font-sans text-slate-200">
                {teleprompterScript.body}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Creation Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setModalOpen(false)} />
          <div className="relative z-10 w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl border border-slate-200 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 shrink-0">
              <h3 className="text-base font-bold text-slate-900">Write New Script</h3>
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
                  placeholder="e.g. My morning thoughts speech"
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

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Context / Description (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Focus on mindfulness, deep breathing, and starting with a hook about morning stress..."
                  rows={2}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white font-sans text-slate-800"
                />
              </div>

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
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 font-sans">Script Body</label>
                  <button
                    type="button"
                    onClick={handleAiGenerate}
                    disabled={generating || !title.trim()}
                    className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <LuSparkles className="h-3.5 w-3.5" />
                    {generating ? "Generating..." : "Generate with AI"}
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
                  className="flex items-center gap-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60 transition shadow"
                >
                  {saving ? "Saving…" : "Save Script"}
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
              <h3 className="text-base font-bold text-slate-900 font-sans">Raise Objection</h3>
              <button type="button" onClick={() => setObjectionScript(null)} className="text-slate-400 hover:text-slate-600">
                <LuX className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleRaiseObjection} className="space-y-4">
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
