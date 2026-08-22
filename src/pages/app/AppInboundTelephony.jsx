import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "../../auth/AuthProvider";
import { api } from "../../lib/api";
import { toastFromError, toastSuccess } from "../../lib/toast";
import {
  LuPhoneCall,
  LuRefreshCw,
  LuPlay,
  LuPause,
  LuX,
  LuBrain,
  LuLoader,
  LuServer,
  LuSmartphone,
  LuClock,
  LuCheck,
  LuCalendar,
  LuFileAudio,
} from "react-icons/lu";

// Custom inline audio player button
function AudioPlayButton({ src }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    // Lazy instantiate audio to avoid hitting limits
    if (!audioRef.current && src) {
      audioRef.current = new Audio(src);
    }

    const audio = audioRef.current;
    if (!audio) return;

    const onEnded = () => setPlaying(false);
    const onPause = () => setPlaying(false);
    const onPlay = () => setPlaying(true);

    audio.addEventListener("ended", onEnded);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("play", onPlay);

    return () => {
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("play", onPlay);
      audio.pause();
    };
  }, [src]);

  const toggle = (e) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.pause();
    } else {
      // Pause any other playing audio on the page first
      const audios = document.getElementsByTagName("audio");
      for (let i = 0; i < audios.length; i++) {
        audios[i].pause();
      }
      audio.play().catch((err) => console.error("Audio play failed:", err));
    }
  };

  return (
    <button
      onClick={toggle}
      className={`inline-flex items-center justify-center p-1.5 rounded-lg border transition ${
        playing
          ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
          : "border-indigo-100 bg-indigo-50/50 text-indigo-600 hover:bg-indigo-100/80"
      }`}
      title={playing ? "Pause Statement" : "Play Statement Audio"}
    >
      {playing ? <LuPause className="h-3.5 w-3.5" /> : <LuPlay className="h-3.5 w-3.5" />}
    </button>
  );
}

export function AppInboundTelephony() {
  const { token, user } = useAuth();
  const [routingMode, setRoutingMode] = useState("auto");

  // Sync routingMode state with user profile
  useEffect(() => {
    if (user && user.telephonyMode) {
      setRoutingMode(user.telephonyMode);
    }
  }, [user]);

  // Handler to toggle routing mode in backend
  const toggleRoutingMode = async (newMode) => {
    try {
      const res = await api("/api/telephony/mode", {
        method: "PUT",
        token,
        body: { mode: newMode }
      });
      if (res && res.success) {
        setRoutingMode(res.telephonyMode);
        toastSuccess(`Routing mode updated to ${newMode === "auto" ? "AI Assistant" : "Manual Forward"}`);
      }
    } catch (e) {
      toastFromError(e, "Failed to update routing mode");
    }
  };

  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [agentsLoading, setAgentsLoading] = useState(true);

  // Drawer state
  const [activeSession, setActiveSession] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Load RAG agents
  const loadAgents = useCallback(async () => {
    setAgentsLoading(true);
    try {
      const res = await api("/api/agents", { token });
      const list = Array.isArray(res) ? res : [];
      // Filter out root_assistant if any
      const filtered = list.filter((ag) => ag.category !== "root_assistant");
      setAgents(filtered);
      if (filtered.length > 0) {
        setSelectedAgent(filtered[0]);
      }
    } catch (e) {
      toastFromError(e, "Failed to load agents");
    } finally {
      setAgentsLoading(false);
    }
  }, [token]);

  // Load sessions for active agent
  const loadSessions = useCallback(
    async (agentId) => {
      if (!agentId) return;
      setSessionsLoading(true);
      try {
        const res = await api(`/api/agents/${agentId}/sessions`, { token });
        const list = Array.isArray(res) ? res : [];
        // Only show actual voice call sessions (tel_ prefix or Voice Call device)
        const callSessions = list.filter(
          (s) => s.session_id?.startsWith("tel_") || s.device_name === "Voice Call"
        );
        setSessions(callSessions);
      } catch (e) {
        toastFromError(e, "Failed to load call logs");
      } finally {
        setSessionsLoading(false);
      }
    },
    [token]
  );

  // Load chat history details
  const loadHistory = useCallback(
    async (sessionId) => {
      setHistoryLoading(true);
      try {
        const res = await api(`/api/agents/sessions/${sessionId}/history`, { token });
        setHistory(Array.isArray(res) ? res : []);
      } catch (e) {
        toastFromError(e, "Failed to load dialogue turns");
      } finally {
        setHistoryLoading(false);
      }
    },
    [token]
  );

  // Initialize
  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  // Load sessions when agent is selected
  useEffect(() => {
    if (selectedAgent) {
      loadSessions(selectedAgent.agent_id || selectedAgent.id);
    }
  }, [selectedAgent, loadSessions]);

  // Handle agent selection change
  const handleAgentChange = (e) => {
    const ag = agents.find((x) => (x.agent_id || x.id) === e.target.value);
    if (ag) setSelectedAgent(ag);
  };

  // Open transcript drawer
  const openSessionDetail = (session) => {
    setActiveSession(session);
    loadHistory(session.session_id);
  };

  // Trigger analysis for active session
  const runAnalysis = async (session) => {
    try {
      toastSuccess("Analyzing call session...");
      const res = await api(`/api/agents/sessions/${session.session_id}/analyze`, {
        method: "POST",
        token,
      });
      if (res && res.analysis) {
        toastSuccess("Analysis completed!");
        // Update local session details
        setSessions((prev) =>
          prev.map((s) => (s.session_id === session.session_id ? { ...s, analysis: res.analysis } : s))
        );
        setActiveSession((prev) => (prev ? { ...prev, analysis: res.analysis } : null));
      }
    } catch (e) {
      toastFromError(e, "Analysis failed");
    }
  };

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] overflow-hidden">
      {/* Main Content Area */}
      <div className={`flex-1 space-y-6 p-4 sm:p-6 transition-all duration-300 ${activeSession ? "mr-[28rem]" : ""}`}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow">
              <LuPhoneCall className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Inbound Telephony</h2>
              <p className="text-sm text-slate-500">Track and review incoming AI voice assistant sessions</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Agent Select Dropdown */}
            {agents.length > 0 && (
              <select
                onChange={handleAgentChange}
                value={selectedAgent ? selectedAgent.agent_id || selectedAgent.id : ""}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 focus:border-indigo-500 focus:outline-none shadow-sm"
              >
                {agents.map((ag) => (
                  <option key={ag.agent_id || ag.id} value={ag.agent_id || ag.id}>
                    {ag.name} ({ag.category || "Agent"})
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={() => selectedAgent && loadSessions(selectedAgent.agent_id || selectedAgent.id)}
              disabled={sessionsLoading || agentsLoading}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:text-slate-800 focus:outline-none shadow-sm hover:border-slate-300 disabled:opacity-50 transition"
              title="Refresh Calls List"
            >
              <LuRefreshCw className={`h-5 w-5 ${sessionsLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Loading State */}
        {agentsLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <LuLoader className="h-8 w-8 text-indigo-600 animate-spin" />
            <p className="text-sm text-slate-500 font-semibold">Loading agent configuration...</p>
          </div>
        ) : (
          <>
            {/* DID Routing Information Card */}
            {selectedAgent && (() => {
              const rawPhone = selectedAgent.phone_number || selectedAgent.customization?.call_number;
              const displayPhone = rawPhone ? (rawPhone.startsWith("+") ? rawPhone : `+${rawPhone}`) : "No DID Line Mapped";
              const isLineActive = !!rawPhone;

              return (
                <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                  <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm md:col-span-2">
                    <div className="flex items-center gap-2 text-indigo-600 mb-3">
                      <LuServer className="h-5 w-5" />
                      <h3 className="text-sm font-bold uppercase tracking-wider">Active DID Number Configuration</h3>
                    </div>
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 mt-4">
                      <div>
                        <div className="text-xs font-semibold text-slate-400 uppercase">Incoming Phone Line</div>
                        <div className="mt-1 text-lg font-bold text-slate-900">{displayPhone}</div>
                        <div className="mt-0.5 text-xs text-slate-400">DID number mapped to this workspace</div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-400 uppercase">Voice Agent Mapping</div>
                        <div className="mt-1 text-base font-bold text-slate-900">{selectedAgent.name}</div>
                        <div className="mt-0.5 text-xs text-slate-400">
                          Category: {selectedAgent.category || "Voice Assistant"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-indigo-600">
                        <LuCheck className="h-5 w-5" />
                        <h3 className="text-sm font-bold uppercase tracking-wider">Line Status</h3>
                      </div>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold border ${
                        isLineActive 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                          : "bg-slate-50 text-slate-500 border-slate-200"
                      }`}>
                        {isLineActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="mt-3 text-xs text-slate-400 space-y-2">
                      <div className="flex justify-between">
                        <span className="font-semibold text-slate-500">Matching Priority:</span>
                        <span className="text-slate-700">1. Suffix Match</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold text-slate-500">Provider Trunk:</span>
                        <span className="text-slate-700">Vobiz SIP Telephony</span>
                      </div>
                    </div>
                    <div className="border-t border-slate-100 mt-4 pt-4">
                      <span className="block text-xs font-semibold text-slate-400 uppercase mb-2">Routing Mode</span>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => toggleRoutingMode("auto")}
                          className={`flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-bold transition-all ${
                            routingMode === "auto"
                              ? "bg-indigo-50 border-indigo-200 text-indigo-600 shadow-sm"
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          Auto (AI)
                        </button>
                        <button
                          onClick={() => toggleRoutingMode("manual")}
                          className={`flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-bold transition-all ${
                            routingMode === "manual"
                              ? "bg-indigo-50 border-indigo-200 text-indigo-600 shadow-sm"
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          Manual (Forward)
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Sessions Table */}
            <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-slate-100 bg-slate-50 px-6 py-4 flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">Inbound Call Logs</h3>
                <span className="text-xs text-slate-400">{sessions.length} sessions logged</span>
              </div>

              {sessionsLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <LuLoader className="h-8 w-8 text-indigo-600 animate-spin" />
                  <p className="text-sm text-slate-500">Fetching live sessions list...</p>
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-20 text-slate-400 text-sm">
                  No inbound calls logged for this agent yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        <th className="py-3 px-6">Caller / Device</th>
                        <th className="py-3 px-6">Date & Time</th>
                        <th className="py-3 px-6">Intent</th>
                        <th className="py-3 px-6">AI Summary</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessions.map((sess) => (
                        <tr
                          key={sess.id || sess.session_id}
                          onClick={() => openSessionDetail(sess)}
                          className="border-b border-slate-50 hover:bg-slate-50/50 cursor-pointer transition-colors"
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                                <LuSmartphone className="h-4.5 w-4.5" />
                              </span>
                              <div>
                                <div className="font-semibold text-slate-900">
                                  {sess.user_name || "Voice Caller"}
                                </div>
                                <div className="text-xs text-slate-400">
                                  {sess.phone_number || sess.device_id}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-slate-500">
                            <div className="flex items-center gap-1.5">
                              <LuClock className="h-4 w-4 shrink-0 text-slate-400" />
                              {sess.created_at ? new Date(sess.created_at).toLocaleString() : "—"}
                            </div>
                          </td>
                          <td className="py-4 px-6 font-medium text-slate-700">
                            {sess.analysis?.intent || (
                              <span className="text-slate-400 text-xs italic font-normal">Pending analysis</span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-slate-500 max-w-xs truncate">
                            {sess.analysis?.summary || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Slide-out Review Drawer */}
      <div
        className={`fixed inset-y-0 right-0 z-40 w-[28rem] border-l border-slate-200 bg-white shadow-2xl transition-transform duration-300 transform ${
          activeSession ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {activeSession && (
          <div className="flex flex-col h-full">
            {/* Drawer Header */}
            <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-900 truncate">
                  Call Details: {activeSession.user_name || "Visitor"}
                </h3>
                <p className="text-xs text-slate-400 truncate">{activeSession.phone_number}</p>
              </div>
              <button
                onClick={() => setActiveSession(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <LuX className="h-5 w-5" />
              </button>
            </div>

            {/* Session Analytics/Intent summary */}
            <div className="border-b border-slate-100 bg-slate-50 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 uppercase tracking-wider">
                  <LuBrain className="h-4 w-4" /> AI Analysis
                </span>
                <button
                  onClick={() => runAnalysis(activeSession)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 focus:outline-none"
                >
                  <LuRefreshCw className="h-3 w-3" /> Re-Analyze
                </button>
              </div>
              {activeSession.analysis ? (
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="block text-[11px] font-bold uppercase text-slate-400 mb-0.5">Intent</span>
                    <p className="text-slate-800 font-semibold">{activeSession.analysis.intent}</p>
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold uppercase text-slate-400 mb-0.5">Summary</span>
                    <p className="text-slate-600 text-xs leading-relaxed">{activeSession.analysis.summary}</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-4 bg-white border border-dashed border-slate-200 rounded-xl">
                  <p className="text-xs text-slate-400 mb-2">No session analysis generated yet</p>
                  <button
                    onClick={() => runAnalysis(activeSession)}
                    className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 border border-indigo-100 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition"
                  >
                    Analyze Session
                  </button>
                </div>
              )}
            </div>

            {/* Chat Transcription list */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
              <span className="block text-xs font-semibold text-slate-400 uppercase mb-2">Call Transcript</span>

              {historyLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <LuLoader className="h-6 w-6 text-indigo-600 animate-spin" />
                  <p className="text-xs text-slate-400">Loading dialogue transcript...</p>
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs italic">
                  No dialogue turns logged for this call.
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((turn, index) => {
                    const isUser = turn.role === "user";
                    return (
                      <div key={index} className={`flex flex-col ${isUser ? "items-start" : "items-end"}`}>
                        <div
                          className={`max-w-[85%] rounded-2xl p-4 shadow-sm text-sm border ${
                            isUser
                              ? "bg-white border-slate-100 text-slate-800 rounded-tl-none"
                              : "bg-indigo-600 border-indigo-700 text-white rounded-tr-none"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <p className="leading-relaxed whitespace-pre-wrap">{turn.content}</p>
                            {/* Render play button for user turn audio if file_url exists */}
                            {isUser && turn.file_url && (
                              <div className="shrink-0 pt-0.5">
                                <AudioPlayButton src={turn.file_url} />
                              </div>
                            )}
                          </div>

                          <div
                            className={`mt-1.5 flex items-center justify-end gap-1 text-[10px] ${
                              isUser ? "text-slate-400" : "text-indigo-200"
                            }`}
                          >
                            <LuClock className="h-3 w-3" />
                            {turn.created_at ? new Date(turn.created_at).toLocaleTimeString() : ""}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
