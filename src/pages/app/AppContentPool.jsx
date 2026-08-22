import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { useAuth } from "../../auth/AuthProvider";
import { toastFromError } from "../../lib/toast";
import { LuVideo, LuDownload, LuFileText, LuSearch, LuArrowLeft } from "react-icons/lu";
import { Link } from "react-router-dom";

export function AppContentPool() {
  const { token } = useAuth();
  const [scripts, setScripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all"); // "all" | "ai_edited" | "viral" | "raw"
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedScript, setSelectedScript] = useState(null); // For viewing script body in modal

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const data = await api("/api/personality/scripts", { token });
        if (!cancelled) {
          // Filter scripts that have at least one video URL
          const videoScripts = (data.scripts || []).filter(
            (s) => s.rawVideoUrl || s.processedVideoUrl || s.viralVideoUrl
          );
          setScripts(videoScripts);
        }
      } catch (err) {
        if (!cancelled) toastFromError(err, "Failed to load video content pool");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  // Filter scripts based on selected tab and search query
  const filteredScripts = scripts.filter((s) => {
    const matchesSearch = s.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    if (filterType === "ai_edited") {
      return !!s.processedVideoUrl;
    } else if (filterType === "viral") {
      return !!s.viralVideoUrl;
    } else if (filterType === "raw") {
      return !!s.rawVideoUrl && !s.processedVideoUrl;
    }
    return true;
  });

  return (
    <div className="space-y-6 p-4 sm:p-6 min-h-screen bg-slate-50/20 font-sans">
      {/* Header and Back Link */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/60 pb-5">
        <div className="flex items-center gap-3">
          <Link to="/ceo/tools" className="p-2 hover:bg-slate-100 rounded-xl transition-all border border-transparent hover:border-slate-200">
            <LuArrowLeft className="h-5 w-5 text-slate-600" />
          </Link>
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow">
              <LuVideo className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Content Pool</h2>
              <p className="text-xs text-slate-500 mt-0.5">Explore, watch, and download your AI-generated and edited video templates.</p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <LuSearch className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search scripts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-200/40 pb-2 overflow-x-auto scrollbar-none">
        {[
          { id: "all", label: "All Videos" },
          { id: "ai_edited", label: "AI Edited" },
          { id: "viral", label: "Viral Format" },
          { id: "raw", label: "Raw Uploads" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id)}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap border ${
              filterType === tab.id
                ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                : "bg-white border-slate-200 text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content Grid */}
      {loading ? (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-80 animate-pulse rounded-3xl bg-slate-100 border border-slate-200" />
          ))}
        </div>
      ) : filteredScripts.length > 0 ? (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filteredScripts.map((s) => {
            const videoUrl = s.viralVideoUrl || s.processedVideoUrl || s.rawVideoUrl;
            const isAiEdited = !!(s.viralVideoUrl || s.processedVideoUrl);
            const isViral = !!s.viralVideoUrl;

            return (
              <div key={s._id || s.scriptId} className="flex flex-col rounded-3xl border border-slate-200/80 bg-white shadow-sm hover:shadow-md transition-all overflow-hidden relative group">
                {/* Video Player */}
                <div className="relative aspect-video bg-black flex items-center justify-center group-hover:scale-[1.01] transition-transform duration-200">
                  <video
                    src={videoUrl}
                    controls
                    preload="metadata"
                    className="w-full h-full object-cover"
                  />
                  {/* Badge */}
                  <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider shadow-sm border ${
                    isViral 
                      ? "bg-purple-100 text-purple-700 border-purple-200" 
                      : isAiEdited 
                        ? "bg-indigo-100 text-indigo-700 border-indigo-200" 
                        : "bg-slate-100 text-slate-600 border-slate-200"
                  }`}>
                    {isViral ? "⚡ Viral Format" : isAiEdited ? "🤖 AI Edited" : "📹 Raw Upload"}
                  </span>
                </div>

                {/* Card Content Details */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-black text-slate-900 font-sans truncate">{s.title}</h4>
                      <span className="shrink-0 px-2 py-0.5 rounded bg-slate-100 text-[10px] text-slate-500 font-bold capitalize">
                        {s.category || "UGC"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2">{s.description || "No description provided."}</p>
                  </div>

                  {/* Actions row */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setSelectedScript(s)}
                      className="flex-1 py-2 px-3 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                    >
                      <LuFileText className="h-4 w-4" /> View Script
                    </button>
                    <a
                      href={videoUrl}
                      download
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-2 px-3 bg-slate-950 text-white rounded-xl hover:bg-slate-800 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <LuDownload className="h-4 w-4" /> Download
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-200 p-12 text-center max-w-md mx-auto space-y-4">
          <div className="h-12 w-12 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto border border-slate-100">
            <LuVideo className="h-6 w-6" />
          </div>
          <div className="space-y-1.5">
            <h4 className="text-sm font-black text-slate-800 font-sans">No videos found</h4>
            <p className="text-xs text-slate-400">
              {searchQuery 
                ? "No matching video scripts found for your search query." 
                : "You haven't requested AI editing for any raw videos yet. Go to the 'Personality' section to upload raw content."}
            </p>
          </div>
          {!searchQuery && (
            <Link
              to="/ceo/personality"
              className="inline-flex items-center justify-center py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              Go to Personality Section
            </Link>
          )}
        </div>
      )}

      {/* Script Text Modal Details */}
      {selectedScript && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full overflow-hidden shadow-xl animate-scaleUp">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] text-slate-500 font-bold capitalize">
                  {selectedScript.category || "UGC"}
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1 font-sans">{selectedScript.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedScript(null)}
                className="p-1.5 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-slate-600 text-xl font-bold leading-none"
              >
                &times;
              </button>
            </div>

            {/* Modal Scroll Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Description</span>
                <p className="text-xs text-slate-600 leading-relaxed">{selectedScript.description || "No description provided."}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Script Text Speech</span>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs text-slate-700 font-medium whitespace-pre-line leading-relaxed">
                  {selectedScript.scriptText || selectedScript.promptText || "No script text content available."}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedScript(null)}
                className="py-2 px-5 bg-slate-950 text-white rounded-xl hover:bg-slate-800 text-xs font-bold transition-all shadow-sm"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
