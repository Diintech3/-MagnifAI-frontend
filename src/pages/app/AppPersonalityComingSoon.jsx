import { useEffect, useState, useRef } from "react";
import { useAuth } from "../../auth/AuthProvider";
import { api, apiForm, mediaUrl } from "../../lib/api";
import { toastFromError, toastSuccess } from "../../lib/toast";
import { LuUser, LuPlus, LuEye, LuX, LuPlay, LuPause, LuRotateCcw, LuImage, LuClock, LuCalendar, LuCircleHelp, LuHeading, LuSparkles, LuPencil, LuTrash2, LuArrowLeft, LuCheck } from "react-icons/lu";



export function AppPersonalityComingSoon() {
  const { token, user } = useAuth();
  const [scripts, setScripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewScript, setViewScript] = useState(null);
  const [activeTab, setActiveTab] = useState("All");
  const [workspaceTab, setWorkspaceTab] = useState("Script Text");

  useEffect(() => {
    if (viewScript) {
      const status = viewScript.approvalStatus;
      if (status === "Approved") {
        setWorkspaceTab("Approved Video");
      } else if (status === "Objection" || status === "Rejected") {
        setWorkspaceTab("Objections / Rejected");
      } else if (status === "Submitted" || status === "Editing") {
        setWorkspaceTab("AI Processing");
      } else if (status === "Edited") {
        setWorkspaceTab("Review & Action");
      } else {
        if (viewScript.rawVideoUrl) {
          setWorkspaceTab("Raw Video");
        } else {
          setWorkspaceTab("Script Text");
        }
      }
    } else {
      setWorkspaceTab("Script Text");
    }
  }, [viewScript]);
  
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
  const [dynamicCategories, setDynamicCategories] = useState([]);
  const [category, setCategory] = useState("");

  useEffect(() => {
    api("/api/categories?section=ugc_prompter", { token })
      .then(data => {
        const catNames = (data && data.length > 0)
          ? data.map(c => c.name)
          : ["Spiritual", "Health", "Education", "Business", "Government", "Agriculture", "Social", "Festivals", "Motivation", "Real Estate"];
        setDynamicCategories(catNames);
        if (catNames.length > 0) {
          setCategory(catNames[0]);
        }
      })
      .catch(e => {
        console.error("Error loading categories:", e);
        const fallback = ["Spiritual", "Health", "Education", "Business", "Government", "Agriculture", "Social", "Festivals", "Motivation", "Real Estate"];
        setDynamicCategories(fallback);
        setCategory(fallback[0]);
      });
  }, [token]);
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
      const res = await apiForm(`/api/personality/scripts/${scriptId}/upload-video`, {
        method: "POST",
        token,
        formData: fd
      });
      toastSuccess("Raw video uploaded successfully! Ready for your review.");
      
      // Update local state instead of closing workspace
      if (res && res.rawVideoUrl) {
        setViewScript(prev => ({
          ...prev,
          rawVideoUrl: res.rawVideoUrl,
          approvalStatus: res.approvalStatus,
          processingStatus: res.processingStatus
        }));
      }
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

    // Restore scheduled date/time from existing script data for reschedule support
    let restoreDate = new Date();
    if (s.scheduledDate && s.scheduledDate !== "Self-scheduled") {
      const parsed = new Date(s.scheduledDate);
      if (!isNaN(parsed.getTime())) restoreDate = parsed;
    }
    // Try to apply existing time if available
    if (s.scheduledTime && s.scheduledTime !== "Self-scheduled") {
      const timeParts = s.scheduledTime.replace(/(am|pm)/i, "").trim().split(":");
      let hr = Number(timeParts[0]) || 0;
      const min = Number(timeParts[1]) || 0;
      const ampmMatch = s.scheduledTime.match(/(am|pm)/i);
      if (ampmMatch) {
        const isPm = ampmMatch[0].toLowerCase() === "pm";
        if (isPm && hr < 12) hr += 12;
        if (!isPm && hr === 12) hr = 0;
      }
      restoreDate.setHours(hr, min, 0, 0);
    }
    setScheduledAt(getLocalDateTimeString(restoreDate));

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
    setCategory(dynamicCategories[0] || "");
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

  const renderWorkflowProgress = (s) => {
    const steps = ["Draft", "Recorded", "Submitted (Approved Raw)", "AI Editing", "Finalized"];
    let currentStepIndex = 0;
    
    if (s.approvalStatus === "Draft" || s.approvalStatus === "Pending" || s.approvalStatus === "Waiting") {
      currentStepIndex = 0;
    } else if (s.approvalStatus === "Recorded" || s.approvalStatus === "Retake") {
      currentStepIndex = 1;
    } else if (s.approvalStatus === "Submitted") {
      currentStepIndex = 2;
    } else if (s.approvalStatus === "Editing" || s.approvalStatus === "Edited") {
      currentStepIndex = 3;
    } else if (["Approved", "Rejected", "Objection"].includes(s.approvalStatus)) {
      currentStepIndex = 4;
    }

    return (
      <div className="mb-4 mt-2">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Workflow Step</span>
          <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
            {currentStepIndex + 1}/{steps.length}: {steps[currentStepIndex]}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {steps.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            return (
              <div key={step} className="flex-1" title={`${step} (${idx < currentStepIndex ? "Completed" : idx === currentStepIndex ? "Current" : "Pending"})`}>
                <div 
                  className={`h-1.5 rounded-full transition-all duration-350 ${
                    isCompleted ? "bg-green-500 shadow-xs" :
                    isCurrent ? "bg-indigo-600 animate-pulse ring-2 ring-indigo-200" :
                    "bg-slate-200"
                  }`}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const getWorkflowHelperText = (s) => {
    if (s.processingStatus === "failed") {
      return "❌ Last AI Video Edit attempt failed. Please contact Admin to retry.";
    }
    
    if (!s.rawVideoUrl) {
      return "👉 Next Step: Click 'Raw Video' tab to record or upload your video.";
    }

    if (s.approvalStatus === "Draft" || s.approvalStatus === "Pending" || s.approvalStatus === "Waiting") {
      return "👉 Next Step: Preview your video on 'Raw Video' tab and decide next action.";
    }
    if (s.approvalStatus === "Recorded") {
      return "⏳ Raw video uploaded. Awaiting Admin raw video approval to enable AI Edit.";
    }
    if (s.approvalStatus === "Retake") {
      return "❌ Raw video rejected by Admin. Please read the note below and upload a retake.";
    }
    if (s.approvalStatus === "Submitted") {
      return "🎉 Raw video approved! Click 'Request AI Edit' below to start AI processing.";
    }
    if (s.approvalStatus === "Editing") {
      return "⚡ AI Video Editing is processing in the background. Please wait...";
    }
    if (s.approvalStatus === "Edited") {
      return "🎉 AI Edited video is ready! Play it on 'Review & Action' tab and Accept or Reject.";
    }
    if (s.approvalStatus === "Approved") {
      return "✅ Video Approved & Finalized successfully!";
    }
    if (s.approvalStatus === "Objection") {
      return "⚠️ Objection note received. Please re-upload or adjust video on 'Raw Video' tab.";
    }
    if (s.approvalStatus === "Rejected") {
      return "❌ Video Rejected.";
    }
    return "";
  };

  if (viewScript) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        {/* Workspace Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setViewScript(null)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-sm font-bold text-slate-600 shadow-xs cursor-pointer transition"
            >
              <LuArrowLeft className="h-4 w-4" /> Back to Scripts
            </button>
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-sans">{viewScript.title}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex rounded-full bg-orange-50 px-2.5 py-0.5 text-[10px] font-bold text-orange-700">
                  {viewScript.category}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">{viewScript.duration}</span>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                  viewScript.approvalStatus === "Approved" ? "bg-green-50 text-green-700 border-green-200" :
                  viewScript.approvalStatus === "Rejected" ? "bg-red-50 text-red-700 border-red-200" :
                  viewScript.approvalStatus === "Pending" || viewScript.approvalStatus === "Waiting" || viewScript.approvalStatus === "Draft" ? "bg-amber-50 text-amber-700 border-amber-200" :
                  viewScript.approvalStatus === "Submitted" ? "bg-blue-50 text-blue-700 border-blue-200" :
                  viewScript.approvalStatus === "Editing" ? "bg-purple-50 text-purple-700 border-purple-200 animate-pulse" :
                  viewScript.approvalStatus === "Edited" ? "bg-teal-50 text-teal-700 border-teal-200" :
                  viewScript.approvalStatus === "Objection" ? "bg-orange-50 text-orange-700 border-orange-200" :
                  "bg-slate-50 text-slate-600 border-slate-200"
                }`}>
                  Status: {viewScript.approvalStatus}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Unified Workspace Card Frame */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col space-y-6">
          {/* Workspace Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-4">
            <button
              onClick={() => setWorkspaceTab("Script Text")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
                workspaceTab === "Script Text"
                  ? "bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              Script Text
            </button>
            <button
              onClick={() => setWorkspaceTab("Raw Video")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
                workspaceTab === "Raw Video"
                  ? "bg-gradient-to-r from-orange-500 to-amber-650 text-white shadow"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              Raw Video
            </button>
            <button
              onClick={() => setWorkspaceTab("AI Processing")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
                workspaceTab === "AI Processing"
                  ? "bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              AI Processing
            </button>
            <button
              onClick={() => setWorkspaceTab("Review & Action")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
                workspaceTab === "Review & Action"
                  ? "bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              Review & Action
            </button>
            <button
              onClick={() => setWorkspaceTab("Approved Video")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
                workspaceTab === "Approved Video"
                  ? "bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              Approved Video
            </button>
            <button
              onClick={() => setWorkspaceTab("Objections / Rejected")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
                workspaceTab === "Objections / Rejected"
                  ? "bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              Objections / Rejected
            </button>
          </div>

          {/* Workspace Tab Content */}
          <div className="flex-1">
            {workspaceTab === "Script Text" && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left side info (1/3 column) */}
                <div className="lg:col-span-1 space-y-5">
                  {viewScript.imageUrl && (
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Storyboard Reference</span>
                      <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shadow-xs">
                        <img src={mediaUrl(viewScript.imageUrl)} alt="Reference" className="w-full object-cover max-h-56" />
                      </div>
                    </div>
                  )}
                  {viewScript.description && (
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Context / Description</span>
                      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs leading-relaxed text-slate-650 whitespace-pre-wrap font-sans">
                        {viewScript.description}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right side script content (2/3 column) */}
                <div className="lg:col-span-2 flex flex-col">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Script Text Content</span>
                  <div className="flex-1 rounded-xl border border-slate-200 bg-slate-50/30 p-5 text-sm leading-relaxed text-slate-800 whitespace-pre-wrap font-sans min-h-[300px]">
                    {viewScript.body}
                  </div>
                </div>
              </div>
              {/* Accept Script Banner */}
              {(viewScript.approvalStatus === "Pending" || viewScript.approvalStatus === "Waiting") && (
                <div className="bg-indigo-50 border border-indigo-150 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 mt-5">
                  <div>
                    <span className="block text-sm font-bold text-indigo-900">Accept this Script Assignment</span>
                    <span className="block text-xs text-indigo-600 mt-0.5 font-medium">Please review the script text and accept the assignment to enable recording and video uploading.</span>
                  </div>
                  <button
                    type="button"
                    disabled={updatingId === viewScript.scriptId}
                    onClick={() => updateScriptStatus(viewScript.scriptId, "Submitted")}
                    className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-750 text-white px-5 py-2.5 text-xs font-bold transition shadow cursor-pointer shrink-0"
                  >
                    <LuCheck className="h-4 w-4" /> Accept Script
                  </button>
                </div>
              )}
              </>
            )}

            {workspaceTab === "Raw Video" && (
              <div className="space-y-6">
                {/* Block actions if script is not accepted yet */}
                {(viewScript.approvalStatus === "Pending" || viewScript.approvalStatus === "Waiting") ? (
                  <div className="flex flex-col items-center justify-center text-slate-400 py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white shadow-2xs">
                    <LuUser className="h-10 w-10 text-slate-350 mb-3 animate-pulse" />
                    <h4 className="text-sm font-bold text-slate-800">Script Not Accepted Yet</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-[320px] leading-relaxed">
                      You must accept this script under the <strong>Script Text</strong> tab before you can record or upload a video.
                    </p>
                  </div>
                ) : (
                  /* Guided actions for teleprompter start/upload */
                  (viewScript.approvalStatus === "Draft" || viewScript.approvalStatus === "Objection" || (viewScript.approvalStatus === "Submitted" && !viewScript.rawVideoUrl)) && (
                    <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100/70 flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <span className="block text-xs font-bold text-orange-950">Record Video on Teleprompter</span>
                        <span className="block text-[10px] text-orange-600 mt-0.5">Read script while recording, or upload pre-recorded video.</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => startTeleprompter(viewScript)}
                          className="flex items-center gap-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white px-3.5 py-2 text-xs font-bold transition shadow-xs cursor-pointer"
                        >
                          <LuPlay className="h-3.5 w-3.5" /> Start Recording
                        </button>
                        <label className="flex items-center gap-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3.5 py-2 text-xs font-bold transition cursor-pointer shadow-xs">
                          Upload Video File
                          <input
                            type="file"
                            accept="video/*"
                            onChange={(e) => handleVideoUpload(viewScript.scriptId, e)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  )
                )}

                {/* Raw Video display */}
                <div className="flex flex-col items-center">
                  {viewScript.rawVideoUrl ? (
                    <div className="rounded-xl overflow-hidden bg-black aspect-video w-full max-w-xl border border-slate-200 shadow-sm">
                      <video src={mediaUrl(viewScript.rawVideoUrl)} controls className="w-full h-full object-contain" />
                    </div>
                  ) : (
                    <div className="text-sm text-slate-400 italic py-16 text-center border border-dashed border-slate-200 rounded-xl w-full">
                      No raw video has been uploaded yet for this script.
                    </div>
                  )}
                </div>

                {viewScript.rawVideoUrl && ["Draft", "Pending", "Waiting", "Recorded", "Retake", "Submitted"].includes(viewScript.approvalStatus) && (
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 max-w-xl mx-auto mt-4 space-y-4">
                    <div>
                      <span className="block text-sm font-bold text-slate-800">What would you like to do with this video?</span>
                      <span className="block text-xs text-slate-500 mt-1">Select one of the options below to proceed.</span>
                    </div>

                    {viewScript.approvalStatus === "Retake" && viewScript.objectionNote && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-xs whitespace-pre-wrap font-sans">
                        <strong>⚠️ Raw Video Rejected:</strong> {viewScript.objectionNote}
                      </div>
                    )}

                    {viewScript.approvalStatus === "Recorded" && (
                      <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2.5 rounded-xl text-xs font-medium">
                        ⏳ Raw video is uploaded. Awaiting Admin review and approval before you can request AI editing.
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <button
                        type="button"
                        disabled={updatingId === viewScript.scriptId}
                        onClick={async () => {
                          if (window.confirm("Are you sure you want to retake and delete this video?")) {
                            setUpdatingId(viewScript.scriptId);
                            try {
                              await api(`/api/personality/scripts/${viewScript.scriptId}/status`, {
                                method: "PUT",
                                token,
                                body: { status: "Pending", clearVideo: true }
                              });
                              toastSuccess("Video cleared. Ready for retake.");
                              setViewScript(prev => ({
                                ...prev,
                                rawVideoUrl: null,
                                processedVideoUrl: null,
                                viralVideoUrl: null,
                                processingStatus: "none",
                                processingProgress: 0,
                                objectionNote: null,
                                approvalStatus: "Draft"
                              }));
                              loadScripts();
                            } catch (e) {
                              toastFromError(e, "Failed to retake video");
                            } finally {
                              setUpdatingId(null);
                            }
                          }
                        }}
                        className="rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-3 py-2.5 text-xs font-bold transition cursor-pointer text-center"
                      >
                        Retake / Delete
                      </button>
                      <button
                        type="button"
                        disabled={updatingId === viewScript.scriptId}
                        onClick={async () => {
                          if (window.confirm("Approve this raw video directly without AI Editing?")) {
                            await updateScriptStatus(viewScript.scriptId, "Approved");
                            setViewScript(null);
                          }
                        }}
                        className="rounded-xl bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 px-3 py-2.5 text-xs font-bold transition cursor-pointer text-center"
                      >
                        Approve (Direct Share)
                      </button>
                      <button
                        type="button"
                        disabled={viewScript.approvalStatus !== "Submitted" || updatingId === viewScript.scriptId}
                        onClick={async () => {
                          await updateScriptStatus(viewScript.scriptId, "Editing");
                          setViewScript(null);
                        }}
                        className={`rounded-xl px-3 py-2.5 text-xs font-bold transition text-center ${
                          viewScript.approvalStatus === "Submitted"
                            ? "bg-indigo-600 hover:bg-indigo-755 text-white shadow cursor-pointer"
                            : "bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed"
                        }`}
                      >
                        {viewScript.approvalStatus === "Recorded" ? "Awaiting Approval" : "Request AI Edit"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {workspaceTab === "AI Processing" && (
              <div className="space-y-6">
                {viewScript.approvalStatus === "Submitted" && viewScript.rawVideoUrl && (
                  <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <span className="block text-xs font-bold text-indigo-900">Awaiting Admin Review</span>
                      <span className="block text-[10px] text-indigo-650 mt-0.5 font-medium">Your raw video has been uploaded successfully. Admin will review the video to trigger AI editing.</span>
                    </div>
                  </div>
                )}

                {viewScript.approvalStatus === "Editing" && (
                  <div className="bg-purple-50 border border-purple-100 text-purple-750 rounded-xl p-4 text-center text-xs font-bold flex items-center justify-center gap-2.5 animate-pulse">
                    <div className="w-4.5 h-4.5 border-2 border-purple-755 border-t-transparent rounded-full animate-spin"></div>
                    AI Video Editing is processing in the background ({viewScript.processingProgress || 0}%)
                  </div>
                )}

                {!["Submitted", "Editing"].includes(viewScript.approvalStatus) && (
                  <div className="text-sm text-slate-400 italic py-16 text-center border border-dashed border-slate-200 rounded-xl w-full">
                    {["Draft", "Pending", "Waiting"].includes(viewScript.approvalStatus) 
                      ? "No raw video has been submitted for AI processing yet. Please go to the 'Raw Video' tab to upload/record first." 
                      : "AI Video Editing is completed. Current Status: " + viewScript.approvalStatus}
                  </div>
                )}
              </div>
            )}

            {workspaceTab === "Review & Action" && (
              <div className="space-y-6">
                {viewScript.approvalStatus === "Edited" ? (
                  <>
                    <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <span className="block text-xs font-bold text-indigo-900">Review and Accept AI Video</span>
                        <span className="block text-[10px] text-indigo-605 mt-0.5">Verify if the AI edited video is correct and accept/approve it.</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          disabled={updatingId === viewScript.scriptId}
                          onClick={() => { updateScriptStatus(viewScript.scriptId, "Approved"); setViewScript(null); }}
                          className="rounded-lg bg-green-600 hover:bg-green-700 px-3.5 py-2 text-xs font-bold text-white transition shadow cursor-pointer"
                        >
                          Accept Video
                        </button>
                        <button
                          disabled={updatingId === viewScript.scriptId}
                          onClick={() => { setObjectionScript(viewScript); setViewScript(null); }}
                          className="rounded-lg bg-orange-500 hover:bg-orange-600 px-3.5 py-2 text-xs font-bold text-white transition shadow cursor-pointer"
                        >
                          Objection
                        </button>
                        <button
                          disabled={updatingId === viewScript.scriptId}
                          onClick={() => { updateScriptStatus(viewScript.scriptId, "Rejected"); setViewScript(null); }}
                          className="rounded-lg bg-red-600 hover:bg-red-700 px-3.5 py-2 text-xs font-bold text-white transition shadow cursor-pointer"
                        >
                          Reject Video
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col items-center">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">AI Edited Video</span>
                      {viewScript.processedVideoUrl ? (
                        <div className="rounded-xl overflow-hidden bg-black aspect-video w-full max-w-xl border border-slate-200 shadow-sm">
                          <video src={mediaUrl(viewScript.processedVideoUrl)} controls className="w-full h-full object-contain" />
                        </div>
                      ) : (
                        <div className="text-sm text-slate-400 italic py-16 text-center border border-dashed border-slate-200 rounded-xl w-full">
                          AI Edited video is not available yet.
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-slate-400 italic py-16 text-center border border-dashed border-slate-200 rounded-xl w-full">
                    No AI Edited video is currently pending review. Current status: {viewScript.approvalStatus}
                  </div>
                )}
              </div>
            )}

            {workspaceTab === "Approved Video" && (
              <div className="space-y-6">
                {viewScript.approvalStatus === "Approved" ? (
                  <>
                    <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                      <span className="block text-xs font-bold text-green-950">✅ Final Approved Content</span>
                      <span className="block text-[10px] text-green-600 mt-0.5">This video has been successfully approved and finalized.</span>
                    </div>

                    <div className="flex flex-col">
                      {(viewScript.processedVideoUrl || viewScript.viralVideoUrl || viewScript.rawVideoUrl) ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 justify-center">
                          {viewScript.processedVideoUrl && (
                            <div className="flex flex-col items-center">
                              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Approved AI Edited Video</span>
                              <div className="rounded-xl overflow-hidden bg-black aspect-video w-full border border-slate-200 shadow-sm">
                                <video src={mediaUrl(viewScript.processedVideoUrl)} controls className="w-full h-full object-contain" />
                              </div>
                            </div>
                          )}
                          {viewScript.viralVideoUrl && (
                            <div className="flex flex-col items-center">
                              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Approved AI Viral-Optimized Video</span>
                              <div className="rounded-xl overflow-hidden bg-black aspect-video w-full border border-slate-200 shadow-sm">
                                <video src={mediaUrl(viewScript.viralVideoUrl)} controls className="w-full h-full object-contain" />
                              </div>
                            </div>
                          )}
                          {!viewScript.processedVideoUrl && !viewScript.viralVideoUrl && viewScript.rawVideoUrl && (
                            <div className="flex flex-col items-center col-span-2 max-w-xl mx-auto w-full">
                              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Approved Raw Video (Direct Shared)</span>
                              <div className="rounded-xl overflow-hidden bg-black aspect-video w-full border border-slate-200 shadow-sm">
                                <video src={mediaUrl(viewScript.rawVideoUrl)} controls className="w-full h-full object-contain" />
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm text-slate-400 italic py-16 text-center border border-dashed border-slate-200 rounded-xl w-full">
                          Approved videos are not available.
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-slate-400 italic py-16 text-center border border-dashed border-slate-200 rounded-xl w-full">
                    This video has not been approved yet. Current status: {viewScript.approvalStatus}
                  </div>
                )}
              </div>
            )}

            {workspaceTab === "Objections / Rejected" && (
              <div className="space-y-6">
                {["Objection", "Rejected"].includes(viewScript.approvalStatus) ? (
                  <>
                    <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                      <span className="block text-xs font-bold text-red-950">
                        {viewScript.approvalStatus === "Objection" ? "⚠️ Objection Raised" : "❌ Video Rejected"}
                      </span>
                      {viewScript.objectionNote && (
                        <div className="mt-2 text-xs text-red-750 bg-white/70 p-2.5 rounded-lg border border-red-200/50 whitespace-pre-wrap font-sans">
                          <strong>Note:</strong> {viewScript.objectionNote}
                        </div>
                      )}
                      <span className="block text-[10px] text-red-600 mt-2">
                        Please record or upload a corrected video file in the <strong>Raw Video</strong> tab and submit again.
                      </span>
                    </div>

                    <div className="flex flex-col items-center">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Previous Raw Video Preview</span>
                      {viewScript.rawVideoUrl ? (
                        <div className="rounded-xl overflow-hidden bg-black aspect-video w-full max-w-xl border border-slate-200 shadow-sm">
                          <video src={mediaUrl(viewScript.rawVideoUrl)} controls className="w-full h-full object-contain" />
                        </div>
                      ) : (
                        <div className="text-sm text-slate-400 italic py-16 text-center border border-dashed border-slate-200 rounded-xl w-full">
                          No raw video preview available.
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-slate-400 italic py-16 text-center border border-dashed border-slate-200 rounded-xl w-full">
                    No objections or rejections for this script. Current status: {viewScript.approvalStatus}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
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

      {/* Tabs */}
      {!loading && scripts.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          <button
            onClick={() => setActiveTab("All")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
              activeTab === "All"
                ? "bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            All ({scripts.length})
          </button>
          <button
            onClick={() => setActiveTab("Scripts")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
              activeTab === "Scripts"
                ? "bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            Scripts / Drafts ({scripts.filter(s => ["Draft", "Pending", "Waiting"].includes(s.approvalStatus)).length})
          </button>
          <button
            onClick={() => setActiveTab("Processing")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
              activeTab === "Processing"
                ? "bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            Processing ({scripts.filter(s => ["Recorded", "Submitted", "Editing"].includes(s.approvalStatus)).length})
          </button>
          <button
            onClick={() => setActiveTab("Ready for Review")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
              activeTab === "Ready for Review"
                ? "bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            Ready for Review ({scripts.filter(s => s.approvalStatus === "Edited").length})
          </button>
          <button
            onClick={() => setActiveTab("Approved")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
              activeTab === "Approved"
                ? "bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            Approved ({scripts.filter(s => s.approvalStatus === "Approved").length})
          </button>
          <button
            onClick={() => setActiveTab("Objections / Rejected")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
              activeTab === "Objections / Rejected"
                ? "bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            Objections / Rejected ({scripts.filter(s => ["Objection", "Rejected", "Retake"].includes(s.approvalStatus)).length})
          </button>
        </div>
      )}

      {/* Grid of scripts */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 animate-pulse">Loading scripts…</div>
      ) : (() => {
        const filteredScripts = scripts.filter(s => {
          if (activeTab === "Scripts") return ["Draft", "Pending", "Waiting"].includes(s.approvalStatus);
          if (activeTab === "Processing") return ["Recorded", "Submitted", "Editing"].includes(s.approvalStatus);
          if (activeTab === "Ready for Review") return s.approvalStatus === "Edited";
          if (activeTab === "Approved") return s.approvalStatus === "Approved";
          if (activeTab === "Objections / Rejected") return ["Objection", "Rejected", "Retake"].includes(s.approvalStatus);
          return true;
        });

        if (filteredScripts.length === 0) {
          return (
            <div className="py-16 text-center max-w-sm mx-auto">
              <LuCircleHelp className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900">No scripts found</h3>
              <p className="text-sm text-slate-500 mt-1">
                No scripts match the selected tab filter.
              </p>
            </div>
          );
        }

        return (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filteredScripts.map((s) => (
              <div 
                key={s.scriptId} 
                onClick={() => setViewScript(s)}
                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all hover:scale-[1.01] cursor-pointer"
              >
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
                
                <p className="text-xs text-slate-500 line-clamp-2 mb-4 flex-1">
                  {s.body}
                </p>

                {/* Meta tags at the bottom */}
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</span>
                    <span className={`inline-flex items-center text-[10px] font-bold mt-0.5 ${
                      s.approvalStatus === "Approved" ? "text-green-600" :
                      s.approvalStatus === "Rejected" ? "text-red-600" :
                      s.approvalStatus === "Submitted" ? "text-blue-600" :
                      s.approvalStatus === "Editing" ? "text-purple-600 animate-pulse" :
                      s.approvalStatus === "Edited" ? "text-teal-600" :
                      s.approvalStatus === "Objection" ? "text-orange-600 font-extrabold" :
                      "text-amber-600"
                    }`}>
                      {s.approvalStatus === "Editing" ? `Editing (${s.processingProgress || 0}%)` : s.approvalStatus}
                    </span>
                  </div>

                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setViewScript(s)}
                      className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                      title="View details"
                    >
                      <LuEye className="h-4 w-4" />
                    </button>
                    {/* Edit button: only self-created, no-action-taken scripts (Draft/Pending only) */}
                    {!s.createdByAdmin && (s.approvalStatus === "Draft" || s.approvalStatus === "Pending") && (
                      <button
                        onClick={() => openEdit(s)}
                        className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition cursor-pointer"
                        title="Edit / Reschedule"
                      >
                        <LuPencil className="h-4 w-4" />
                      </button>
                    )}
                    {/* Delete button: only self-created Draft scripts */}
                    {s.userId === user?.id && !s.createdByAdmin && s.approvalStatus === "Draft" && (
                      <button
                        onClick={() => handleDelete(s.scriptId)}
                        className="rounded-lg border border-slate-200 p-1.5 text-red-500 hover:bg-red-50 transition cursor-pointer"
                        title="Delete script"
                      >
                        <LuTrash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      })()}

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
                    {dynamicCategories.map(cat => (
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
