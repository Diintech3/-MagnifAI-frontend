import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "../../auth/AuthProvider";
import { api, apiForm, mediaUrl } from "../../lib/api";
import { toastFromError, toastSuccess } from "../../lib/toast";
import ReactMarkdown from "react-markdown";
import {
  LuBot,
  LuBrain,
  LuFileText,
  LuGlobe,
  LuMessageSquare,
  LuPlay,
  LuSquare,
  LuMic,
  LuUpload,
  LuTrash2,
  LuPlus,
  LuCheck,
  LuTrendingUp,
  LuShare2,
  LuSparkles,
  LuSettings,
  LuVolume2,
  LuArrowLeft,
  LuFolder,
  LuEye,
  LuEyeOff
} from "react-icons/lu";

const providerModels = {
  gemini: [
    { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
    { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
    { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
    { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
    { value: "gemini-3.5-flash", label: "Gemini 3.5 Flash (Default)" }
  ],
  openai: [
    { value: "gpt-4o-mini", label: "GPT-4o Mini" },
    { value: "gpt-4o", label: "GPT-4o" },
    { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
    { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" }
  ],
  groq: [
    { value: "llama-3.3-70b-versatile", label: "Llama 3.3 70B Versatile" },
    { value: "llama-3.1-70b-versatile", label: "Llama 3.1 70B Versatile" },
    { value: "llama-3.1-8b-instant", label: "Llama 3.1 8B Instant" },
    { value: "mixtral-8x7b-32768", label: "Mixtral 8x7B 32k" },
    { value: "gemma2-9b-it", label: "Gemma 2 9B IT" }
  ]
};
const providerVoices = {
  elevenlabs: [
    { value: "pNInz6obpgDQGcFmaJgB", label: "Adam (Male - Default)" },
    { value: "21m00Tcm4TlvDq8ikWAM", label: "Rachel (Female)" },
    { value: "EXAVITQu4vr4xnSDxMaL", label: "Bella (Female)" },
    { value: "ErXwobaYiN019PkySvjV", label: "Antoni (Male)" },
    { value: "VR6A4Yt77nC0GTLgJCFf", label: "Arnold (Male)" },
    { value: "AZnzlk1XvdvUeBnXmlld", label: "Domi (Female)" },
    { value: "custom", label: "Custom Voice ID..." }
  ],
  sarvam: [
    { value: "neutral", label: "Neutral Speaker" },
    { value: "casual", label: "Casual Speaker" },
    { value: "amri", label: "Amri (Female)" },
    { value: "arvind", label: "Arvind (Male)" },
    { value: "aditi", label: "Aditi (Female)" },
    { value: "dharani", label: "Dharani (Female)" },
    { value: "karthik", label: "Karthik (Male)" },
    { value: "custom", label: "Custom Voice ID..." }
  ]
};

export function AppAiAgent() {
  const { token } = useAuth();
  const [agents, setAgents] = useState([]);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [selectedAgent, setSelectedAgent] = useState(null);
  
  // Navigation Modes
  const [viewMode, setViewMode] = useState("dashboard"); // dashboard | form
  const [dashboardTab, setDashboardTab] = useState("overview"); // overview | logs | playground
  const [formActiveTab, setFormActiveTab] = useState("message"); // message | info | voice | system | action | custom | kb | datasources

  const [loading, setLoading] = useState(true);

  // Form States (for Create/Edit)
  const [formMode, setFormMode] = useState("create"); // create | edit
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formCategory, setFormCategory] = useState("calling");
  const [formPersonality, setFormPersonality] = useState("");
  const [formStartingMsg, setFormStartingMsg] = useState("");
  // System Config
  const [sysProvider, setSysProvider] = useState("gemini");
  const [sysModel, setSysModel] = useState("gemini-3.5-flash");
  const [sysApiKey, setSysApiKey] = useState("");
  const [sysPrompt, setSysPrompt] = useState("");
  const [showSysApiKey, setShowSysApiKey] = useState(false);
  // Voice Config
  const [voiceProvider, setVoiceProvider] = useState("elevenlabs");
  const [voiceName, setVoiceName] = useState("");
  const [voiceApiKey, setVoiceApiKey] = useState("");
  const [showVoiceApiKey, setShowVoiceApiKey] = useState(false);
  // Customization
  const [custLogoUrl, setCustLogoUrl] = useState("");
  const [custColor, setCustColor] = useState("#4f46e5");
  const [custChatLink, setCustChatLink] = useState("");
  const [custAuthorImage, setCustAuthorImage] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  async function handleLogoUpload(file) {
    if (!file) return;
    setUploadingLogo(true);
    const fd = new FormData();
    fd.append("image", file);
    try {
      const data = await apiForm("/api/agents/upload-image", { token, formData: fd });
      setCustLogoUrl(data.url);
      toastSuccess("Brand logo image uploaded successfully to R2!");
    } catch (err) {
      toastFromError(err, "Failed to upload logo image");
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleAvatarUpload(file) {
    if (!file) return;
    setUploadingAvatar(true);
    const fd = new FormData();
    fd.append("image", file);
    try {
      const data = await apiForm("/api/agents/upload-image", { token, formData: fd });
      setCustAuthorImage(data.url);
      toastSuccess("Author avatar image uploaded successfully to R2!");
    } catch (err) {
      toastFromError(err, "Failed to upload avatar image");
    } finally {
      setUploadingAvatar(false);
    }
  }
  // Q&A Pairs
  const [qaPairs, setQaPairs] = useState([{ q: "", a: "" }]);

  // Knowledge Base upload states
  const [pdfFile, setPdfFile] = useState(null);
  const [webUrl, setWebUrl] = useState("");
  const [ingesting, setIngesting] = useState(false);
  const [stagedPdfs, setStagedPdfs] = useState([]);
  const [stagedUrls, setStagedUrls] = useState([]);
  const [showSpecsModal, setShowSpecsModal] = useState(false);

  // Leads & Session logs state
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [sessionActiveTab, setSessionActiveTab] = useState("history");
  const [historyLoading, setHistoryLoading] = useState(false);
  const [analyzingSessionId, setAnalyzingSessionId] = useState(null);

  // Playground Sandbox
  const [chatInput, setChatInput] = useState("");
  const [sandboxHistory, setSandboxHistory] = useState([]);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const audioRef = useRef(null);
  const recognitionRef = useRef(null);

  // Load all agents
  async function loadAgents(selectFirst = false) {
    setLoading(true);
    try {
      const data = await api("/api/agents", { token });
      const list = data || [];
      setAgents(list);
      if (list.length > 0) {
        if (selectFirst || !selectedAgentId) {
          setSelectedAgentId(list[0].agent_id);
        }
      } else {
        setSelectedAgentId("");
        setSelectedAgent(null);
        enterCreateMode();
      }
    } catch (e) {
      toastFromError(e, "Failed to load agents");
    } finally {
      setLoading(false);
    }
  }

  // Load specific agent detail
  async function loadAgentDetails(id) {
    if (!id) return;
    try {
      const data = await api(`/api/agents/${id}`, { token });
      setSelectedAgent(data);
    } catch (e) {
      toastFromError(e, "Failed to fetch agent details");
    }
  }

  // Load visitor sessions
  async function loadSessions(id) {
    if (!id) return;
    try {
      const data = await api(`/api/agents/${id}/sessions`, { token });
      setSessions(data || []);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    loadAgents(true);
  }, [token]);

  useEffect(() => {
    if (selectedAgentId) {
      loadAgentDetails(selectedAgentId);
      loadSessions(selectedAgentId);
      setSandboxHistory([]);
      setSelectedSession(null);
      setChatHistory([]);
    }
  }, [selectedAgentId]);

  // Lead / Session Handlers
  async function handleSessionSelect(sess) {
    setSelectedSession(sess);
    setSessionActiveTab("user_info");
    setHistoryLoading(true);
    try {
      const data = await api(`/api/agents/sessions/${sess.session_id}/history`, { token });
      setChatHistory(data || []);
    } catch (e) {
      toastFromError(e, "Failed to fetch chat logs");
    } finally {
      setHistoryLoading(false);
    }
  }

  async function runAiAnalysis(sessId) {
    setAnalyzingSessionId(sessId);
    try {
      const data = await api(`/api/agents/sessions/${sessId}/analyze`, { method: "POST", token });
      toastSuccess("Conversation analysis complete!");
      setSessions(prev => prev.map(s => s.session_id === sessId ? { ...s, analysis: data } : s));
      if (selectedSession && selectedSession.session_id === sessId) {
        setSelectedSession(prev => ({ ...prev, analysis: data }));
      }
    } catch (e) {
      toastFromError(e, "AI analysis failed");
    } finally {
      setAnalyzingSessionId(null);
    }
  }

  // Sandbox Playground Chats
  async function sendSandboxMessage(e) {
    e.preventDefault();
    if (!chatInput.trim() || !selectedAgentId || chatLoading) return;

    const userMsg = chatInput.trim();
    setChatInput("");
    setChatLoading(true);

    const updatedHistory = [...sandboxHistory, { role: "user", content: userMsg }];
    setSandboxHistory(updatedHistory);

    try {
      const historyPayload = sandboxHistory.map(h => ({ role: h.role, content: h.content }));
      const data = await api(`/api/agents/${selectedAgentId}/ask`, {
        method: "POST",
        token,
        body: {
          question: userMsg,
          history: historyPayload,
          is_voice: isVoiceMode
        }
      });

      setSandboxHistory(prev => [...prev, { role: "assistant", content: data.answer, sources: data.sources || [], is_rag: data.is_rag }]);

      if (isVoiceMode && data.answer) {
        playTtsAudio(data.answer);
      }
    } catch (e) {
      toastFromError(e, "Failed to get response");
    } finally {
      setChatLoading(false);
    }
  }

  function playTtsAudio(text) {
    if (!selectedAgentId) return;
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlayingAudio(true);
    const streamUrl = `${import.meta.env.VITE_API_BASE_URL || ""}/api/agents/${selectedAgentId}/speak?text=${encodeURIComponent(text)}`;
    const audio = new Audio(streamUrl);
    audioRef.current = audio;
    audio.play().catch(err => {
      console.error(err);
      setIsPlayingAudio(false);
    });
    audio.onended = () => {
      setIsPlayingAudio(false);
    };
  }

  // Voice Input — Browser SpeechRecognition
  function toggleVoiceListening() {
    if (isListening) {
      // Stop listening
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toastFromError(new Error("Your browser does not support voice input. Use Chrome or Edge."));
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (transcript.trim()) {
        setChatInput(transcript.trim());
        // Auto-send the voice message
        setTimeout(() => {
          const fakeEvent = { preventDefault: () => {} };
          // We set chatInput above, but since state is async, we directly trigger
          const userMsg = transcript.trim();
          setChatLoading(true);
          const updatedHistory = [...sandboxHistory, { role: "user", content: userMsg }];
          setSandboxHistory(updatedHistory);
          setChatInput("");

          const historyPayload = sandboxHistory.map(h => ({ role: h.role, content: h.content }));
          api(`/api/agents/${selectedAgentId}/ask`, {
            method: "POST",
            token,
            body: { question: userMsg, history: historyPayload, is_voice: true }
          }).then(data => {
            setSandboxHistory(prev => [...prev, { role: "assistant", content: data.answer, sources: data.sources || [], is_rag: data.is_rag }]);
            if (data.answer) {
              playTtsAudio(data.answer);
            }
          }).catch(err => {
            toastFromError(err, "Failed to get response");
          }).finally(() => {
            setChatLoading(false);
          });
        }, 100);
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      if (event.error === "not-allowed") {
        toastFromError(new Error("Microphone access denied. Please allow mic permission."));
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }

  // Change View Modes
  function enterCreateMode() {
    setFormMode("create");
    setFormActiveTab("message");
    
    // Clear form fields
    setFormName("");
    setFormDesc("");
    setFormCategory("calling");
    setFormPersonality("");
    setFormStartingMsg("Hello! How can I help you today?");
    setSysProvider("gemini");
    setSysModel("gemini-3.5-flash");
    setSysApiKey("");
    setSysPrompt("");
    setVoiceProvider("elevenlabs");
    setVoiceName("");
    setVoiceApiKey("");
    setCustLogoUrl("");
    setCustColor("#4f46e5");
    setCustChatLink("");
    setCustAuthorImage("");
    setQaPairs([{ q: "", a: "" }]);
    setStagedPdfs([]);
    setStagedUrls([]);

    setShowSysApiKey(false);
    setShowVoiceApiKey(false);
    setViewMode("form");
  }

  function enterEditMode() {
    if (!selectedAgent) return;
    setFormMode("edit");
    setFormActiveTab("message");
    setShowSysApiKey(false);
    setShowVoiceApiKey(false);

    setFormName(selectedAgent.name || "");
    setFormDesc(selectedAgent.description || "");
    setFormCategory(selectedAgent.category || "calling");
    setFormPersonality(selectedAgent.personality || "");
    setFormStartingMsg(selectedAgent.starting_message || "");

    const cleanKey = (key) => (key && !key.toLowerCase().includes("your_") && !key.toLowerCase().includes("here") ? key : "");

    const sys = selectedAgent.system_config || {};
    setSysProvider(sys.provider || "gemini");
    setSysModel(sys.model || "gemini-3.5-flash");
    setSysApiKey(cleanKey(sys.api_key));
    setSysPrompt(sys.system_prompt || "");

    const vc = selectedAgent.voice_config || {};
    setVoiceProvider(vc.provider || "elevenlabs");
    setVoiceName(vc.voice_name || "");
    setVoiceApiKey(cleanKey(vc.api_key));

    const cleanUrl = (url) => (url && !url.includes("example.com") ? url : "");

    const cust = selectedAgent.customization || {};
    setCustLogoUrl(cleanUrl(cust.logo_url));
    setCustColor(cust.color || "#4f46e5");
    setCustChatLink(cleanUrl(cust.chat_link));
    setCustAuthorImage(cleanUrl(cust.author_image_url));

    setQaPairs(cust.qa_pairs && cust.qa_pairs.length > 0 ? cust.qa_pairs : [{ q: "", a: "" }]);
    setStagedPdfs([]);
    setStagedUrls([]);

    setViewMode("form");
  }

  // Save Config
  async function handleSaveAgent(e) {
    if (e) e.preventDefault();
    if (!formName.trim()) {
      toastFromError(new Error("Agent name is required"));
      setFormActiveTab("info");
      return;
    }

    const payload = {
      name: formName.trim(),
      description: formDesc.trim(),
      category: formCategory.trim(),
      personality: formPersonality.trim(),
      starting_message: formStartingMsg.trim(),
      system_config: {
        provider: sysProvider,
        model: sysModel,
        ...(sysApiKey.trim() ? { api_key: sysApiKey.trim() } : {}),
        ...(sysPrompt.trim() ? { system_prompt: sysPrompt.trim() } : {})
      },
      voice_config: {
        provider: voiceProvider,
        ...(voiceName ? { voice_name: voiceName } : {}),
        ...(voiceApiKey.trim() ? { api_key: voiceApiKey.trim() } : {})
      },
      customization: {
        ...(custLogoUrl.trim() ? { logo_url: custLogoUrl.trim() } : {}),
        ...(custColor.trim() ? { color: custColor.trim() } : {}),
        ...(custChatLink.trim() ? { chat_link: custChatLink.trim() } : {}),
        ...(custAuthorImage.trim() ? { author_image_url: custAuthorImage.trim() } : {}),
        qa_pairs: qaPairs.filter(pair => pair.q.trim() && pair.a.trim())
      },
      datastores: []
    };

    try {
      if (formMode === "create") {
        const res = await api("/api/agents", {
          method: "POST",
          token,
          body: payload
        });
        const newAgentId = res.agent_id;

        toastSuccess("AI Agent created successfully!");
        setSelectedAgentId(newAgentId);
        await loadAgents();
        setViewMode("dashboard");

        // Background indexing trigger
        (async () => {
          if (stagedPdfs.length > 0) {
            for (const pdf of stagedPdfs) {
              const fd = new FormData();
              fd.append("file", pdf.file);
              try {
                await apiForm(`/api/agents/${newAgentId}/upload-pdf`, {
                  method: "POST",
                  token,
                  formData: fd
                });
              } catch (pdfErr) {
                console.error("Failed to upload staged PDF:", pdf.name, pdfErr);
              }
            }
          }

          if (stagedUrls.length > 0) {
            for (const web of stagedUrls) {
              try {
                await api(`/api/agents/${newAgentId}/ingest-url`, {
                  method: "POST",
                  token,
                  body: { url: web.url }
                });
              } catch (urlErr) {
                console.error("Failed to ingest staged URL:", web.url, urlErr);
              }
            }
          }
          await loadAgentDetails(newAgentId);
          await loadAgents();
        })();
      } else {
        await api(`/api/agents/${selectedAgentId}`, {
          method: "PATCH",
          token,
          body: payload
        });

        toastSuccess("AI Agent updated successfully!");
        await loadAgentDetails(selectedAgentId);
        await loadAgents();
        setViewMode("dashboard");

        // Background indexing trigger
        (async () => {
          if (stagedPdfs.length > 0) {
            for (const pdf of stagedPdfs) {
              const fd = new FormData();
              fd.append("file", pdf.file);
              try {
                await apiForm(`/api/agents/${selectedAgentId}/upload-pdf`, {
                  method: "POST",
                  token,
                  formData: fd
                });
              } catch (pdfErr) {
                console.error("Failed to upload staged PDF:", pdf.name, pdfErr);
              }
            }
          }

          if (stagedUrls.length > 0) {
            for (const web of stagedUrls) {
              try {
                await api(`/api/agents/${selectedAgentId}/ingest-url`, {
                  method: "POST",
                  token,
                  body: { url: web.url }
                });
              } catch (urlErr) {
                console.error("Failed to ingest staged URL:", web.url, urlErr);
              }
            }
          }
          await loadAgentDetails(selectedAgentId);
          await loadAgents();
        })();
      }
    } catch (err) {
      toastFromError(err, "Failed to save agent configuration");
    }
  }

  async function handleAgentDelete(agentId) {
    if (!window.confirm("Are you sure you want to permanently delete this agent? All embeddings and visitor history will be deleted.")) return;
    try {
      await api(`/api/agents/${agentId}`, { method: "DELETE", token });
      toastSuccess("Agent deleted successfully");
      loadAgents(true);
    } catch (e) {
      toastFromError(e, "Delete failed");
    }
  }

  // Stage PDF & URL handlers for creation flow
  function handleStagePdf(e) {
    e.preventDefault();
    if (!pdfFile) return;
    setStagedPdfs(prev => [...prev, { file: pdfFile, name: pdfFile.name, id: Date.now() + Math.random() }]);
    setPdfFile(null);
    toastSuccess("PDF file staged! It will be uploaded on save.");
  }

  function handleStageUrl(e) {
    e.preventDefault();
    if (!webUrl.trim()) return;
    setStagedUrls(prev => [...prev, { url: webUrl.trim(), id: Date.now() + Math.random() }]);
    setWebUrl("");
    toastSuccess("Website URL staged! It will be crawled on save.");
  }

  function handleRemoveStagedItem(item) {
    if (item.source_type === "pdf") {
      setStagedPdfs(prev => prev.filter(p => p.id !== item.id));
    } else {
      setStagedUrls(prev => prev.filter(u => u.id !== item.id));
    }
    toastSuccess("Staged source removed.");
  }

  // PDF & URL Ingestion actions
  async function handleUploadPdf(e) {
    e.preventDefault();
    if (!pdfFile || !selectedAgentId) return;

    setIngesting(true);
    const fd = new FormData();
    fd.append("file", pdfFile);

    try {
      const res = await apiForm(`/api/agents/${selectedAgentId}/upload-pdf`, {
        method: "POST",
        token,
        formData: fd
      });
      toastSuccess(`PDF uploaded and parsed! Extracted ${res.total_chunks} chunks.`);
      setPdfFile(null);
      loadAgentDetails(selectedAgentId);
    } catch (err) {
      toastFromError(err, "Failed to upload PDF");
    } finally {
      setIngesting(false);
    }
  }

  async function handleIngestUrl(e) {
    e.preventDefault();
    if (!webUrl.trim() || !selectedAgentId) return;

    setIngesting(true);
    try {
      const res = await api(`/api/agents/${selectedAgentId}/ingest-url`, {
        method: "POST",
        token,
        body: { url: webUrl.trim() }
      });
      toastSuccess(`URL crawling complete! Extracted ${res.total_chunks} chunks.`);
      setWebUrl("");
      loadAgentDetails(selectedAgentId);
    } catch (err) {
      toastFromError(err, "URL Ingestion failed");
    } finally {
      setIngesting(false);
    }
  }

  async function handleDeleteSource(sourceId) {
    if (!window.confirm("Are you sure you want to remove this source?")) return;
    try {
      await api(`/api/agents/${selectedAgentId}/sources/${sourceId}`, { method: "DELETE", token });
      toastSuccess("Source deleted");
      loadAgentDetails(selectedAgentId);
    } catch (err) {
      toastFromError(err, "Failed to delete source");
    }
  }

  // Q&A Grid Helpers
  function addQaRow() {
    setQaPairs([...qaPairs, { q: "", a: "" }]);
  }
  function removeQaRow(index) {
    setQaPairs(qaPairs.filter((_, i) => i !== index));
  }
  function updateQaRow(index, field, value) {
    const updated = [...qaPairs];
    updated[index][field] = value;
    setQaPairs(updated);
  }

  // Calculate dynamic Profile Completion Percentage
  function calculateCompletion() {
    let score = 0;
    if (formName.trim()) score += 15;
    if (formDesc.trim()) score += 10;
    if (formStartingMsg.trim() && formStartingMsg !== "Hello! How can I help you today?") score += 15;
    if (formPersonality.trim()) score += 10;
    if (sysPrompt.trim()) score += 15;
    if (voiceName.trim()) score += 15;
    if (custLogoUrl.trim()) score += 10;
    const activeQa = qaPairs.filter(p => p.q.trim() && p.a.trim());
    if (activeQa.length > 0) score += 10;
    return score;
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 min-h-[calc(100dvh-3.5rem)] text-slate-800 p-3 sm:p-4 md:p-6">
      
      {viewMode === "dashboard" ? (
        /* ==================== VIEW 1: DASHBOARD MODE ==================== */
        <div>
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-4 mb-4 sm:mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-indigo-900">
                <LuBot className="h-6 sm:h-7 w-6 sm:w-7 text-indigo-600" />
                AI Assistant / Agent
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">Create, customize, and manage your business AI agents.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-3 md:mt-0">
              {selectedAgent && (
                <button
                  onClick={() => setShowSpecsModal(true)}
                  className="flex items-center gap-2 bg-white hover:bg-slate-100 border border-slate-350 text-indigo-750 font-bold text-xs py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg shadow-sm transition cursor-pointer"
                >
                  <LuBot className="h-4 w-4 text-indigo-600" /> View Specs Profile
                </button>
              )}
            </div>
          </div>

          {/* Tab selectors */}
          <div className="flex border-b border-slate-200 mb-4 sm:mb-6 bg-white rounded-t-xl shadow-sm overflow-x-auto scrollbar-thin">
            {[
              { id: "overview", label: "Overview", icon: LuSettings },
              { id: "logs", label: "Leads & Visitor Chats", icon: LuFileText },
              { id: "playground", label: "Test Chat Room", icon: LuMessageSquare }
            ].map((tab) => {
              const Icon = tab.icon;
              const active = dashboardTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setDashboardTab(tab.id)}
                  className={`flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 border-b-2 font-bold text-xs sm:text-sm text-nowrap shrink-0 transition-colors duration-150 ${
                    active
                      ? "border-indigo-600 text-indigo-600 bg-indigo-50/10"
                      : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <Icon className={`h-4.5 sm:h-5 w-4.5 sm:w-5 ${active ? "text-indigo-600" : "text-slate-400"}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Contents */}
          <div className="bg-white rounded-b-xl p-4 sm:p-6 shadow-sm border border-slate-200 border-t-0 min-h-[400px]">
            {loading && dashboardTab === "overview" ? (
              <div className="flex items-center justify-center p-12"><p className="text-slate-400 font-bold">Loading agent profile...</p></div>
            ) : (
              <div>
                
                {/* 1. OVERVIEW TABS */}
                {dashboardTab === "overview" && (
                  <div>
                    {selectedAgent ? (
                      <div className="space-y-6">
                        {/* KPI Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                          {/* Card 1: Trained Knowledge */}
                          <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 flex items-center gap-4 shadow-sm hover:shadow-md transition">
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                              <LuBrain className="h-6 w-6" />
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Trained Knowledge</p>
                              <p className="text-lg font-extrabold text-slate-800 mt-0.5">{selectedAgent.sources?.length || 0} Sources</p>
                              <p className="text-[10px] text-indigo-700 font-bold bg-indigo-50 px-1.5 py-0.5 rounded-sm inline-block mt-1">
                                {selectedAgent.sources?.reduce((acc, s) => acc + (s.chunk_count || 0), 0) || 0} Chunks Indexed
                              </p>
                            </div>
                          </div>

                          {/* Card 2: Visitor Session Logs */}
                          <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 flex items-center gap-4 shadow-sm hover:shadow-md transition">
                            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                              <LuFileText className="h-6 w-6" />
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Visitor Sessions</p>
                              <p className="text-lg font-extrabold text-slate-800 mt-0.5">{sessions.length} Conversations</p>
                              <p className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-sm inline-block mt-1">
                                Active Lead Captures
                              </p>
                            </div>
                          </div>

                          {/* Card 3: Voice Profile */}
                          <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 flex items-center gap-4 shadow-sm hover:shadow-md transition">
                            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                              <LuVolume2 className="h-6 w-6" />
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Voice Profile</p>
                              <p className="text-lg font-extrabold text-slate-800 mt-0.5 truncate max-w-[160px]">
                                {selectedAgent.voice_config?.voice_name || "Default Voice"}
                              </p>
                              <p className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded-sm inline-block mt-1 capitalize">
                                Provider: {selectedAgent.voice_config?.provider || "Elevenlabs"}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Lower Summary Row - Full Width */}
                        <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/40 space-y-4">
                          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-2.5 flex items-center gap-2">
                            <LuFolder className="text-indigo-600 h-4.5 w-4.5" /> Active Training Sources
                          </h2>
                          {selectedAgent.sources && selectedAgent.sources.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {selectedAgent.sources.map((s) => (
                                <div key={s.id} className="flex justify-between items-center text-xs bg-white border border-slate-200 p-3 rounded-lg shadow-2xs">
                                  <span className="font-bold text-slate-800 truncate max-w-xs">{s.source_name}</span>
                                  <span className="bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded capitalize">
                                    {s.source_type} ({s.chunk_count} chunks)
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 text-center py-8">
                              No active training sources. Click "View Specs Profile" in the header to edit configurations.
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <LuBot className="h-14 w-14 text-slate-300 mx-auto mb-3" />
                        <h3 className="font-bold text-slate-700 mb-1">No AI Agent configured</h3>
                        <p className="text-sm text-slate-500 mb-5">Configure your first AI agent now to get started.</p>
                        <button
                          onClick={enterCreateMode}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-lg shadow transition text-xs"
                        >
                          Create AI Agent
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. LEADS AND VISITOR CHATS TAB */}
                {dashboardTab === "logs" && (
                  <div>
                    {!selectedAgentId ? (
                      <p className="text-slate-400 text-center py-12">Please create an agent first to view logs.</p>
                    ) : (
                      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col min-h-[480px]">
                        {/* Sub-tab selectors */}
                        <div className="flex border-b border-slate-200 mb-4 bg-slate-50/50 p-1.5 rounded-lg gap-1.5">
                          {[
                            { id: "history", label: "History (All Chats)", icon: LuTrendingUp },
                            { id: "user_info", label: "User Info & Chat", icon: LuBot, disabled: !selectedSession },
                            { id: "conversation", label: "Conversation", icon: LuMessageSquare, disabled: !selectedSession },
                            { id: "summary", label: "Summary", icon: LuFileText, disabled: !selectedSession },
                            { id: "outcome", label: "Outcome Analysis", icon: LuSparkles, disabled: !selectedSession }
                          ].map((tab) => {
                            const Icon = tab.icon;
                            const active = sessionActiveTab === tab.id;
                            return (
                              <button
                                key={tab.id}
                                type="button"
                                onClick={() => !tab.disabled && setSessionActiveTab(tab.id)}
                                disabled={tab.disabled}
                                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-md font-bold text-xs transition-all ${
                                  tab.disabled
                                    ? "opacity-40 cursor-not-allowed text-slate-400"
                                    : active
                                      ? "bg-white text-indigo-750 shadow-sm border border-slate-200 cursor-pointer"
                                      : "text-slate-500 hover:text-slate-850 cursor-pointer"
                                }`}
                              >
                                <Icon className="h-4 w-4" />
                                {tab.label}
                              </button>
                            );
                          })}
                        </div>

                        {/* Content display */}
                        <div className="flex-1">
                          {/* Tab 1: HISTORY (List of all sessions) */}
                          {sessionActiveTab === "history" && (
                            <div className="space-y-4">
                              <h3 className="font-extrabold text-slate-855 text-xs uppercase tracking-wider mb-2">History of All Visitor Chats</h3>
                              {sessions.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {sessions.map((sess) => (
                                    <div
                                      key={sess.session_id}
                                      onClick={() => handleSessionSelect(sess)}
                                      className={`p-4 bg-slate-50 hover:bg-indigo-50/30 border rounded-xl cursor-pointer transition ${
                                        selectedSession?.session_id === sess.session_id ? "border-indigo-600 bg-indigo-50/10 shadow-xs" : "border-slate-200"
                                      }`}
                                    >
                                      <div className="flex justify-between items-start mb-2">
                                        <span className="font-bold text-slate-900 text-sm">
                                          {sess.user_name || "Anonymous Visitor"}
                                        </span>
                                        <span className="text-[9px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded">
                                          {sess.analysis ? "Analyzed" : "New Lead"}
                                        </span>
                                      </div>
                                      <p className="text-xs text-slate-650 font-bold mb-1">Phone: {sess.phone_number || "None"}</p>
                                      <div className="flex justify-between items-center text-[10px] text-slate-400 mt-3 pt-2 border-t border-slate-200">
                                        <span>Device: {sess.device_name || "N/A"}</span>
                                        <span>{new Date(sess.created_at).toLocaleDateString()}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-slate-400 text-xs text-center py-12">No visitor chats logged yet.</p>
                              )}
                            </div>
                          )}

                          {/* Tab 2: USER INFO & CHAT (Metadata + conversation transcript together!) */}
                          {sessionActiveTab === "user_info" && selectedSession && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                              {/* Metadata column */}
                              <div className="bg-slate-50/50 border border-slate-200/60 p-5 rounded-xl space-y-4">
                                <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center gap-1.5">
                                  <LuBot className="h-4 w-4 text-indigo-600" /> Visitor Metadata
                                </h4>
                                <div className="space-y-3.5 text-xs">
                                  <div className="bg-white border border-slate-200/80 p-3 rounded-lg shadow-3xs">
                                    <span className="font-bold text-slate-400 block mb-1 text-[9px] uppercase">Visitor Name</span>
                                    <span className="font-extrabold text-slate-800">{selectedSession.user_name || "Anonymous Visitor"}</span>
                                  </div>
                                  <div className="bg-white border border-slate-200/80 p-3 rounded-lg shadow-3xs">
                                    <span className="font-bold text-slate-400 block mb-1 text-[9px] uppercase">Phone Number</span>
                                    <span className="font-extrabold text-slate-800">{selectedSession.phone_number || "Not Provided"}</span>
                                  </div>
                                  <div className="bg-white border border-slate-200/80 p-3 rounded-lg shadow-3xs">
                                    <span className="font-bold text-slate-400 block mb-1 text-[9px] uppercase">Platform / Device</span>
                                    <span className="font-semibold text-slate-700">{selectedSession.device_name || "N/A"}</span>
                                  </div>
                                  <div className="bg-white border border-slate-200/80 p-3 rounded-lg shadow-3xs">
                                    <span className="font-bold text-slate-400 block mb-1 text-[9px] uppercase">Session Start Date</span>
                                    <span className="font-semibold text-slate-700">{new Date(selectedSession.created_at).toLocaleString()}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Conversation inside User Info tab */}
                              <div className="lg:col-span-2 space-y-4 bg-slate-50/30 p-4 rounded-xl border border-slate-200/60">
                                <h4 className="font-extrabold text-slate-850 text-xs uppercase tracking-wider border-b border-slate-200 pb-2 mb-3">Conversation Transcript</h4>
                                <div className="h-[280px] overflow-y-auto space-y-3 bg-white p-4 rounded-xl border border-slate-200">
                                  {historyLoading ? (
                                    <p className="text-xs text-slate-400 text-center py-12">Loading messages...</p>
                                  ) : chatHistory.length > 0 ? (
                                    chatHistory.map((chat, idx) => (
                                      <div key={idx} className={`flex flex-col ${chat.role === "user" ? "items-end" : "items-start"}`}>
                                        <div className={`max-w-md px-3.5 py-2.5 rounded-xl text-xs shadow-sm ${
                                          chat.role === "user" ? "bg-indigo-600 text-white rounded-tr-none" : "bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-none"
                                        }`}>
                                          {chat.content}
                                        </div>
                                        <span className="text-[9px] text-slate-400 mt-1">{new Date(chat.created_at).toLocaleTimeString()}</span>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-xs text-slate-400 text-center py-12">No chat logged.</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Tab 3: CONVERSATION (Chat bubbles transcript only) */}
                          {sessionActiveTab === "conversation" && selectedSession && (
                            <div className="space-y-4">
                              <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-200 pb-2 mb-3">Conversation Transcript: {selectedSession.user_name || "Anonymous Visitor"}</h4>
                              <div className="h-[340px] overflow-y-auto space-y-3.5 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                {historyLoading ? (
                                  <p className="text-xs text-slate-400 text-center py-12">Loading messages...</p>
                                ) : chatHistory.length > 0 ? (
                                  chatHistory.map((chat, idx) => (
                                    <div key={idx} className={`flex flex-col ${chat.role === "user" ? "items-end" : "items-start"}`}>
                                      <div className={`max-w-md px-3.5 py-2.5 rounded-xl text-xs shadow-sm ${
                                        chat.role === "user" ? "bg-indigo-600 text-white rounded-tr-none" : "bg-white border border-slate-200 text-slate-800 rounded-tl-none"
                                      }`}>
                                        {chat.content}
                                      </div>
                                      <span className="text-[9px] text-slate-400 mt-1">{new Date(chat.created_at).toLocaleTimeString()}</span>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-xs text-slate-400 text-center py-12">No chat logged.</p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Tab 4: SUMMARY (AI summary text) */}
                          {sessionActiveTab === "summary" && selectedSession && (
                            <div className="bg-slate-50/50 border border-slate-200/60 p-5 rounded-xl min-h-[260px]">
                              <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-200 pb-2 mb-3">AI Context Summary</h4>
                              {selectedSession.analysis ? (
                                <p className="text-xs text-slate-700 font-semibold leading-relaxed">{selectedSession.analysis.meaning || "No summary content."}</p>
                              ) : (
                                <div className="text-center py-12">
                                  <p className="text-xs text-slate-400 font-bold mb-3">No summary generated yet.</p>
                                  <button
                                    type="button"
                                    onClick={() => runAiAnalysis(selectedSession.session_id)}
                                    disabled={analyzingSessionId === selectedSession.session_id}
                                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-extrabold text-xs px-4.5 py-2.5 rounded-lg shadow-sm transition cursor-pointer"
                                  >
                                    {analyzingSessionId === selectedSession.session_id ? "Analyzing..." : "Analyze Conversation"}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Tab 5: OUTCOME (AI Category, Intent, Next Steps + Analyze button) */}
                          {sessionActiveTab === "outcome" && selectedSession && (
                            <div className="bg-slate-50/50 border border-slate-200/60 p-5 rounded-xl min-h-[260px]">
                              <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-4">
                                <h4 className="font-extrabold text-slate-850 text-xs uppercase tracking-wider">AI Leads Classification & Outcome</h4>
                                <button
                                  type="button"
                                  onClick={() => runAiAnalysis(selectedSession.session_id)}
                                  disabled={analyzingSessionId === selectedSession.session_id}
                                  className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white text-xs font-bold px-4.5 py-2.5 rounded-lg shadow-sm transition cursor-pointer"
                                >
                                  {analyzingSessionId === selectedSession.session_id ? "Analyzing..." : "Analyze Conversation"}
                                </button>
                              </div>
                              {selectedSession.analysis ? (
                                <div className="space-y-4 text-xs">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white border border-slate-200/80 p-3 rounded-lg shadow-3xs">
                                      <span className="font-bold text-slate-400 block mb-1 text-[9px] uppercase">Category</span>
                                      <span className="capitalize font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-[10px]">{selectedSession.analysis.category || "N/A"}</span>
                                    </div>
                                    <div className="bg-white border border-slate-200/80 p-3 rounded-lg shadow-3xs">
                                      <span className="font-bold text-slate-400 block mb-1 text-[9px] uppercase">User Intent</span>
                                      <span className="font-bold text-slate-750">{selectedSession.analysis.intent || "No intent extracted."}</span>
                                    </div>
                                  </div>
                                  <div className="bg-emerald-50/30 border border-emerald-200 p-3 rounded-lg shadow-3xs">
                                    <span className="font-bold text-emerald-700 block mb-1 text-[9px] uppercase">Recommended Actions / Next Steps</span>
                                    <span className="font-semibold text-emerald-850 leading-relaxed">{selectedSession.analysis.next_steps || "No next steps generated."}</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center py-12">
                                  <p className="text-xs text-slate-400 font-bold mb-3">No outcome metrics generated yet.</p>
                                  <p className="text-[10px] text-slate-400 mb-4">Click "Analyze Conversation" above to extract intent and next action steps using AI.</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. PLAYGROUND SANDBOX TAB */}
                {dashboardTab === "playground" && (
                  <div>
                    {!selectedAgentId ? (
                      <p className="text-slate-400 text-center py-12">Please create an agent first to launch chat playground.</p>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Interactive Sandbox Chat room */}
                        <div className="lg:col-span-2 border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col h-[480px]">
                          <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-4">
                            <h3 className="font-bold text-slate-800 text-sm">Testing Sandbox</h3>
                            <div className="flex items-center gap-3">
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isVoiceMode}
                                  onChange={(e) => setIsVoiceMode(e.target.checked)}
                                  className="w-4 h-4 text-indigo-600 border-slate-350 rounded"
                                />
                                <span className="text-xs font-bold text-slate-600 flex items-center gap-0.5">
                                  <LuVolume2 className="h-4 w-4 text-slate-500" /> Speech Response Mode
                                </span>
                              </label>
                              {isPlayingAudio && (
                                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                                  Playing...
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Message view */}
                          <div className="flex-1 overflow-y-auto space-y-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100 mb-4 text-xs">
                            {sandboxHistory.length > 0 ? (
                              sandboxHistory.map((chat, idx) => (
                                <div key={idx} className={`flex flex-col ${chat.role === "user" ? "items-end" : "items-start"}`}>
                                  <div className={`max-w-md px-3.5 py-2.5 rounded-xl shadow-xs ${
                                    chat.role === "user" ? "bg-indigo-600 text-white rounded-tr-none" : "bg-white border border-slate-200 text-slate-800 rounded-tl-none"
                                  }`}>
                                    <div className="prose prose-xs prose-slate max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_strong]:text-inherit [&_h1]:text-sm [&_h2]:text-xs [&_h3]:text-xs">
                                      <ReactMarkdown>{chat.content}</ReactMarkdown>
                                    </div>
                                    {chat.sources && chat.sources.length > 0 && (
                                      <div className="mt-2 border-t border-slate-100 pt-1.5 text-[9px] text-slate-400">
                                        <strong>Sources:</strong> {chat.sources.map(s => `${s.source_file} (Page ${s.page_number})`).join(", ")}
                                      </div>
                                    )}
                                  </div>
                                  {chat.role === "assistant" && (
                                    <button
                                      onClick={() => playTtsAudio(chat.content)}
                                      className="text-slate-400 hover:text-indigo-600 mt-1 flex items-center gap-0.5 text-[9px] font-semibold"
                                    >
                                      <LuVolume2 className="h-3 w-3" /> Speak response
                                    </button>
                                  )}
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-16 text-slate-400">
                                <LuBot className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                                <p className="font-semibold text-xs text-slate-500">Sandbox Playground Ready.</p>
                                <p className="text-[10px] text-slate-400 mt-1">Send a message to test the agent's RAG knowledge retrieval.</p>
                              </div>
                            )}
                            {chatLoading && <p className="text-[10px] text-slate-400 animate-pulse font-medium">Agent is typing...</p>}
                          </div>

                          <form onSubmit={sendSandboxMessage} className="flex gap-2">
                            <button
                              type="button"
                              onClick={toggleVoiceListening}
                              disabled={chatLoading}
                              className={`shrink-0 flex items-center justify-center w-10 h-10 rounded-lg border transition cursor-pointer ${
                                isListening
                                  ? "bg-red-500 border-red-600 text-white animate-pulse shadow-lg shadow-red-200"
                                  : "bg-white border-slate-350 text-slate-500 hover:text-indigo-600 hover:border-indigo-400 hover:bg-indigo-50"
                              }`}
                              title={isListening ? "Stop listening" : "Hold to speak"}
                            >
                              <LuMic className="h-4.5 w-4.5" />
                            </button>
                            <input
                              type="text"
                              placeholder={isListening ? "Listening... speak now" : "Type a message or click mic to speak..."}
                              value={chatInput}
                              onChange={(e) => setChatInput(e.target.value)}
                              className={`flex-1 bg-white border text-slate-700 text-xs rounded-lg focus:ring-indigo-500 focus:border-indigo-500 p-2.5 w-full shadow-xs ${
                                isListening ? "border-red-400 bg-red-50/30" : "border-slate-350"
                              }`}
                              disabled={chatLoading || isListening}
                            />
                            <button
                              type="submit"
                              disabled={chatLoading || !chatInput.trim()}
                              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-xs px-4.5 py-2.5 rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                            >
                              Send
                            </button>
                          </form>
                        </div>

                        {/* Right: QR Code Integration */}
                        <div className="border border-slate-200 rounded-xl p-5 shadow-xs bg-slate-50/40 text-center flex flex-col items-center">
                          <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <LuShare2 className="text-indigo-600 h-4.5 w-4.5" /> Share & Embed Code
                          </h3>
                          <p className="text-xs text-slate-500 mb-5">Scan this QR Code to test on your mobile device as an external caller.</p>
                          
                          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs mb-4 inline-block">
                            {selectedAgentId ? (
                              <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(
                                  `${window.location.origin}/agent-chat?id=${selectedAgentId}`
                                )}`}
                                alt="QR Code"
                                className="h-32 w-32 object-contain"
                              />
                            ) : (
                              <div className="h-32 w-32 bg-slate-100 flex items-center justify-center text-slate-400 text-xs">No active agent</div>
                            )}
                          </div>

                          <a
                            href={`${window.location.origin}/agent-chat?id=${selectedAgentId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-indigo-600 font-bold hover:underline mb-4"
                          >
                            Open Live Chat Link
                          </a>

                          <div className="text-left w-full border-t border-slate-200 pt-4 mt-2 text-[10px] text-slate-500 space-y-1">
                            <h4 className="font-bold text-slate-700">How to integrate QR:</h4>
                            <p>1. Print QR code and place on your product brochures, desks, or billboards.</p>
                            <p>2. Visitors scan with mobile camera to chat or make voice queries without login details.</p>
                            <p>3. Dynamic sessions log is automatically captured under the Leads tab.</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </div>
            )}
          </div>
        </div>
      ) : (
        /* ==================== VIEW 2: FORM/CREATE/EDIT MODE ==================== */
        <div className="bg-white border border-slate-200 rounded-2xl shadow-md overflow-hidden flex flex-col">
          {/* Header Panel */}
          <div className="bg-slate-50 border-b border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {agents.length > 0 && (
                <button
                  type="button"
                  onClick={() => setViewMode("dashboard")}
                  className="flex items-center gap-1 bg-white hover:bg-slate-100 border border-slate-350 text-slate-700 font-bold text-xs py-2 px-3 rounded-lg shadow-xs transition cursor-pointer shrink-0"
                >
                  <LuArrowLeft className="h-4 w-4" /> Back
                </button>
              )}
              <div>
                <h1 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-1.5">
                  {formMode === "create" ? "Create New Agent" : "Edit Agent Configuration"}
                </h1>
                <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase mt-0.5">Define your specialized AI personality</p>
              </div>
            </div>
            
            <button
              onClick={handleSaveAgent}
              className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs py-2.5 sm:py-2 px-4.5 rounded-lg shadow-sm transition cursor-pointer text-center"
            >
              Save Agent Configuration
            </button>
          </div>

          {/* Form Body Split-pane Layout */}
          <div className="flex flex-col md:flex-row min-h-[500px]">
            {/* Left horizontal (mobile) / vertical (desktop) tabs menu */}
            <aside className="w-full md:w-56 border-b md:border-b-0 md:border-r border-slate-200 bg-slate-50/50 p-3 sm:p-4 shrink-0">
              <div className="flex md:flex-col overflow-x-auto md:overflow-x-visible gap-1.5 pb-2 md:pb-0 scrollbar-thin">
                {[
                  { id: "message", label: "Message", icon: LuMessageSquare },
                  { id: "info", label: "Info", icon: LuBot },
                  { id: "voice", label: "Voice", icon: LuVolume2 },
                  { id: "system", label: "System", icon: LuSettings },
                  { id: "action", label: "Action (FAQ)", icon: LuPlus },
                  { id: "custom", label: "Custom Styling", icon: LuSparkles },
                  { id: "kb", label: "KB Train", icon: LuBrain },
                  { id: "datasources", label: "DataSources", icon: LuFolder }
                ].map((item) => {
                  const Icon = item.icon;
                  const active = formActiveTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setFormActiveTab(item.id)}
                      className={`flex items-center gap-2 py-2 sm:py-2.5 px-3 rounded-lg font-bold text-xs text-left text-nowrap shrink-0 transition cursor-pointer border-b-2 md:border-b-0 md:border-l-4 ${
                        active
                          ? "bg-orange-50 border-orange-500 text-orange-700 bg-orange-500/10"
                          : "border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </aside>

            {/* Right form input details pane */}
            <div className="flex-1 p-4 sm:p-6 md:p-8 text-xs text-slate-700 bg-white">
              
              {/* TAB A: MESSAGE CONTENT */}
              {formActiveTab === "message" && (
                <div className="space-y-6">
                  {/* Dynamic Progress Bar */}
                  <div className="border border-slate-150 p-4 rounded-xl bg-slate-50/50">
                    <div className="flex justify-between items-center mb-1 text-[10px] uppercase font-bold text-slate-500 tracking-wide">
                      <span>Profile Completion</span>
                      <span className="text-orange-600 font-extrabold">{calculateCompletion()}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        style={{ width: `${calculateCompletion()}%` }}
                        className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                      ></div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Starting Welcome Message*</label>
                    <textarea
                      required
                      placeholder="e.g. Hello! I am your Property Support assistant. How can I help you find your dream home today?"
                      value={formStartingMsg}
                      onChange={(e) => setFormStartingMsg(e.target.value)}
                      className="bg-white border border-slate-350 text-slate-700 text-xs rounded-lg focus:ring-indigo-500 focus:border-indigo-500 p-3 w-full h-32 shadow-xs"
                    />
                    <p className="text-[10px] text-slate-400 mt-1.5">This welcome text greeting is triggered automatically when a caller starts a new chat.</p>
                  </div>
                </div>
              )}

              {/* TAB B: BASIC INFO DETAILS */}
              {formActiveTab === "info" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1">Agent Name*</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Property Support Assistant"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        className="bg-white border border-slate-350 text-slate-700 text-xs rounded-lg focus:ring-indigo-500 focus:border-indigo-500 p-2.5 w-full shadow-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1">Function / Category*</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. calling"
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        className="bg-white border border-slate-350 text-slate-700 text-xs rounded-lg focus:ring-indigo-500 focus:border-indigo-500 p-2.5 w-full shadow-xs"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1">Short Description</label>
                      <input
                        type="text"
                        placeholder="e.g. Handles inbound leads for residential properties"
                        value={formDesc}
                        onChange={(e) => setFormDesc(e.target.value)}
                        className="bg-white border border-slate-350 text-slate-700 text-xs rounded-lg focus:ring-indigo-500 focus:border-indigo-500 p-2.5 w-full shadow-xs"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1">Personality Tone Description</label>
                      <textarea
                        placeholder="e.g. Helpful, friendly, and expert in real estate sales."
                        value={formPersonality}
                        onChange={(e) => setFormPersonality(e.target.value)}
                        className="bg-white border border-slate-350 text-slate-700 text-xs rounded-lg focus:ring-indigo-500 focus:border-indigo-500 p-2.5 w-full h-20 shadow-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB C: VOICE SPEECH CONFIG */}
              {formActiveTab === "voice" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1">Voice Provider</label>
                      <select
                        value={voiceProvider}
                        onChange={(e) => {
                          const prov = e.target.value;
                          setVoiceProvider(prov);
                          const voices = providerVoices[prov] || [];
                          if (voices.length > 0) {
                            setVoiceName(voices[0].value);
                          }
                        }}
                        className="bg-white border border-slate-350 text-slate-700 text-xs rounded-lg focus:ring-indigo-500 focus:border-indigo-500 p-2.5 w-full shadow-xs"
                      >
                        <option value="elevenlabs">ElevenLabs</option>
                        <option value="sarvam">Sarvam TTS</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1">Voice ID / Name</label>
                      {(() => {
                        const activeVoices = providerVoices[voiceProvider] || [];
                        const isPresetVoice = activeVoices.some(v => v.value === voiceName);
                        const selectVoiceValue = isPresetVoice ? voiceName : (voiceName ? "custom" : "");

                        return (
                          <div className="space-y-2">
                            <select
                              value={selectVoiceValue}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === "custom") {
                                  setVoiceName("");
                                } else {
                                  setVoiceName(val);
                                }
                              }}
                              className="bg-white border border-slate-350 text-slate-700 text-xs rounded-lg focus:ring-indigo-500 focus:border-indigo-500 p-2.5 w-full shadow-xs"
                            >
                              <option value="" disabled>-- Select a voice --</option>
                              {activeVoices.map((v) => (
                                <option key={v.value} value={v.value}>{v.label}</option>
                              ))}
                              {voiceName && !isPresetVoice && (
                                <option value="custom">Custom Voice ID (Active)</option>
                              )}
                            </select>

                            {(!isPresetVoice || selectVoiceValue === "custom") && (
                              <input
                                type="text"
                                placeholder="Enter custom Voice ID / Name..."
                                value={voiceName}
                                onChange={(e) => setVoiceName(e.target.value)}
                                className="bg-white border border-indigo-300 text-slate-700 text-xs rounded-lg focus:ring-indigo-500 focus:border-indigo-500 p-2.5 w-full shadow-xs mt-1.5"
                              />
                            )}
                          </div>
                        );
                      })()}
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1">Voice Provider API Key</label>
                      <div className="relative">
                        <input
                          type={showVoiceApiKey ? "text" : "password"}
                          placeholder="Enter Voice API Key..."
                          value={voiceApiKey}
                          onChange={(e) => setVoiceApiKey(e.target.value)}
                          className="bg-white border border-slate-350 text-slate-700 text-xs rounded-lg focus:ring-indigo-500 focus:border-indigo-500 p-2.5 pr-10 w-full shadow-xs"
                        />
                        <button
                          type="button"
                          onClick={() => setShowVoiceApiKey(prev => !prev)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer p-1"
                          title={showVoiceApiKey ? "Hide API Key" : "Show API Key"}
                        >
                          {showVoiceApiKey ? <LuEyeOff className="h-4 w-4" /> : <LuEye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB D: SYSTEM BRAIN MODEL CONFIG */}
              {formActiveTab === "system" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1">AI Provider</label>
                      <select
                        value={sysProvider}
                        onChange={(e) => {
                          const prov = e.target.value;
                          setSysProvider(prov);
                          const models = providerModels[prov] || [];
                          if (models.length > 0) {
                            setSysModel(models[0].value);
                          }
                        }}
                        className="bg-white border border-slate-350 text-slate-700 text-xs rounded-lg p-2.5 w-full shadow-xs"
                      >
                        <option value="gemini">Gemini</option>
                        <option value="openai">OpenAI</option>
                        <option value="groq">Groq</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1">Model Name</label>
                      <select
                        value={sysModel}
                        onChange={(e) => setSysModel(e.target.value)}
                        className="bg-white border border-slate-350 text-slate-700 text-xs rounded-lg p-2.5 w-full shadow-xs"
                      >
                        {(providerModels[sysProvider] || []).map((m) => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                        {sysModel && !(providerModels[sysProvider] || []).some(m => m.value === sysModel) && (
                          <option value={sysModel}>{sysModel} (Current Custom)</option>
                        )}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1">Model API Key</label>
                      <div className="relative">
                        <input
                          type={showSysApiKey ? "text" : "password"}
                          placeholder="Enter Model API Key..."
                          value={sysApiKey}
                          onChange={(e) => setSysApiKey(e.target.value)}
                          className="bg-white border border-slate-350 text-slate-700 text-xs rounded-lg p-2.5 pr-10 w-full shadow-xs"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSysApiKey(prev => !prev)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer p-1"
                          title={showSysApiKey ? "Hide API Key" : "Show API Key"}
                        >
                          {showSysApiKey ? <LuEyeOff className="h-4 w-4" /> : <LuEye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1">System Instruction prompt</label>
                      <textarea
                        placeholder="e.g. You are a senior real estate advisor. Help the user find apartments."
                        value={sysPrompt}
                        onChange={(e) => setSysPrompt(e.target.value)}
                        className="bg-white border border-slate-350 text-slate-700 text-xs rounded-lg p-2.5 w-full h-32 shadow-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB E: ACTION (FAQ DYNAMIC QA LIST) */}
              {formActiveTab === "action" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2">
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">Dynamic Q&A FAQ Pairs</h3>
                      <p className="text-[10px] text-slate-500">Provide direct answers for specific user questions (RAG fallback cache).</p>
                    </div>
                    <button
                      type="button"
                      onClick={addQaRow}
                      className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-750 font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-0.5 cursor-pointer"
                    >
                      <LuPlus className="h-4 w-4" /> Add Row
                    </button>
                  </div>
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {qaPairs.map((pair, idx) => (
                      <div key={idx} className="flex gap-2 items-start bg-slate-50 p-3 rounded-lg border border-slate-150">
                        <input
                          type="text"
                          placeholder="User Question"
                          value={pair.q}
                          onChange={(e) => updateQaRow(idx, "q", e.target.value)}
                          className="flex-1 bg-white border border-slate-350 text-slate-700 text-xs rounded p-2.5"
                        />
                        <input
                          type="text"
                          placeholder="Agent Answer Response"
                          value={pair.a}
                          onChange={(e) => updateQaRow(idx, "a", e.target.value)}
                          className="flex-1 bg-white border border-slate-350 text-slate-700 text-xs rounded p-2.5"
                        />
                        <button
                          type="button"
                          onClick={() => removeQaRow(idx)}
                          className="text-red-500 hover:text-red-750 p-2 border border-slate-300 rounded hover:bg-red-50 transition cursor-pointer"
                        >
                          <LuTrash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB F: CUSTOM VISUAL BRAND STYLE */}
              {formActiveTab === "custom" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1">Brand Logo Image</label>
                      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                        <input
                          type="text"
                          placeholder="e.g. https://domain.com/logo.png"
                          value={custLogoUrl}
                          onChange={(e) => setCustLogoUrl(e.target.value)}
                          className="bg-white border border-slate-350 text-slate-700 text-xs rounded-lg p-2.5 flex-1 min-w-0 shadow-xs"
                        />
                        <label className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-bold px-3 py-2.5 rounded-lg transition cursor-pointer shrink-0 flex items-center justify-center gap-1">
                          <LuUpload className="h-3.5 w-3.5" />
                          {uploadingLogo ? "Uploading..." : "Upload Image"}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleLogoUpload(e.target.files[0]);
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>
                      {custLogoUrl && (
                        <div className="mt-2 flex items-center gap-2">
                          <img src={mediaUrl(custLogoUrl)} alt="Logo Preview" className="h-8 w-8 object-contain rounded border border-slate-200 bg-slate-50 p-0.5" />
                          <span className="text-[10px] text-emerald-600 font-semibold">Logo Uploaded</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1">Author Image Avatar</label>
                      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                        <input
                          type="text"
                          placeholder="e.g. https://domain.com/avatar.jpg"
                          value={custAuthorImage}
                          onChange={(e) => setCustAuthorImage(e.target.value)}
                          className="bg-white border border-slate-350 text-slate-700 text-xs rounded-lg p-2.5 flex-1 min-w-0 shadow-xs"
                        />
                        <label className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-bold px-3 py-2.5 rounded-lg transition cursor-pointer shrink-0 flex items-center justify-center gap-1">
                          <LuUpload className="h-3.5 w-3.5" />
                          {uploadingAvatar ? "Uploading..." : "Upload Image"}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleAvatarUpload(e.target.files[0]);
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>
                      {custAuthorImage && (
                        <div className="mt-2 flex items-center gap-2">
                          <img src={mediaUrl(custAuthorImage)} alt="Avatar Preview" className="h-8 w-8 object-cover rounded-full border border-slate-200" />
                          <span className="text-[10px] text-emerald-600 font-semibold">Avatar Uploaded</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1">Chat Link Path</label>
                      <input
                        type="text"
                        placeholder="e.g. /chat/property-agent"
                        value={custChatLink}
                        onChange={(e) => setCustChatLink(e.target.value)}
                        className="bg-white border border-slate-350 text-slate-700 text-xs rounded-lg p-2.5 w-full shadow-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1">Theme Brand Color</label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="color"
                          value={custColor}
                          onChange={(e) => setCustColor(e.target.value)}
                          className="w-10 h-10 border border-slate-350 rounded cursor-pointer shrink-0"
                        />
                        <input
                          type="text"
                          value={custColor}
                          onChange={(e) => setCustColor(e.target.value)}
                          className="bg-white border border-slate-350 text-slate-700 text-xs rounded-lg p-2.5 w-28 shadow-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB G: KB FILE/URL INGESTION */}
              {formActiveTab === "kb" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* PDF */}
                    <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-4">
                      <h3 className="font-bold text-slate-800 flex items-center gap-1.5"><LuFileText className="text-indigo-600 h-4.5 w-4.5" /> Ingest PDF Training file</h3>
                      <form onSubmit={formMode === "create" ? handleStagePdf : handleUploadPdf} className="space-y-4">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-white hover:bg-slate-50">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <LuUpload className="w-8 h-8 text-slate-400 mb-2" />
                            <p className="text-[10px] text-slate-500 font-semibold">Click to upload or drag & drop</p>
                            <p className="text-[9px] text-slate-400 mt-1">PDF File (Max 50MB)</p>
                          </div>
                          <input
                            type="file"
                            accept=".pdf"
                            onChange={(e) => setPdfFile(e.target.files[0])}
                            className="hidden"
                          />
                        </label>
                        {pdfFile && (
                          <div className="flex justify-between items-center text-[10px] bg-indigo-50 p-2 rounded">
                            <span className="font-bold text-indigo-900 truncate max-w-xs">{pdfFile.name}</span>
                            <button type="button" onClick={() => setPdfFile(null)} className="text-red-500 font-bold">Remove</button>
                          </div>
                        )}
                        <button
                          type="submit"
                          disabled={!pdfFile || ingesting}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold py-2 rounded-lg transition cursor-pointer text-xs"
                        >
                          {formMode === "create" ? "Stage PDF Document" : (ingesting ? "Ingesting..." : "Index PDF File")}
                        </button>
                      </form>
                    </div>

                    {/* URL */}
                    <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-4">
                      <h3 className="font-bold text-slate-800 flex items-center gap-1.5"><LuGlobe className="text-indigo-600 h-4.5 w-4.5" /> Index website page URL</h3>
                      <form onSubmit={formMode === "create" ? handleStageUrl : handleIngestUrl} className="space-y-4">
                        <input
                          type="url"
                          placeholder="https://example.com/services"
                          value={webUrl}
                          onChange={(e) => setWebUrl(e.target.value)}
                          className="bg-white border border-slate-350 text-slate-700 text-xs rounded-lg p-2.5 w-full shadow-xs"
                          required
                        />
                        <button
                          type="submit"
                          disabled={!webUrl.trim() || ingesting}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold py-2 rounded-lg transition cursor-pointer text-xs"
                        >
                          {formMode === "create" ? "Stage Webpage URL" : (ingesting ? "Crawling page..." : "Index Webpage")}
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB H: DATASOURCES TABLE */}
              {formActiveTab === "datasources" && (
                <div className="space-y-4">
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                    <table className="min-w-full divide-y divide-slate-200 text-left text-slate-600">
                      <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        <tr>
                          <th className="px-5 py-3">Source name</th>
                          <th className="px-5 py-3">Type</th>
                          <th className="px-5 py-3 text-center">Chunks Indexed</th>
                          <th className="px-5 py-3 text-center">Status</th>
                          <th className="px-5 py-3 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {(() => {
                          const list = [];
                          // Add saved sources
                          if (formMode === "edit" && selectedAgent?.sources) {
                            list.push(...selectedAgent.sources.map(s => ({ ...s, status: "Active", isStaged: false })));
                          }
                          // Add staged PDFs
                          list.push(...stagedPdfs.map(p => ({
                            id: p.id,
                            source_name: p.name,
                            source_type: "pdf",
                            chunk_count: "-",
                            status: "Staged (Pending Save)",
                            isStaged: true
                          })));
                          // Add staged URLs
                          list.push(...stagedUrls.map(u => ({
                            id: u.id,
                            source_name: u.url,
                            source_type: "url",
                            chunk_count: "-",
                            status: "Staged (Pending Save)",
                            isStaged: true
                          })));

                          if (list.length === 0) {
                            return (
                              <tr>
                                <td colSpan="5" className="text-center py-8 text-slate-400">No training data linked yet. Use KB Train tab to add PDFs or Web Crawls.</td>
                              </tr>
                            );
                          }

                          return list.map((src) => (
                            <tr key={src.id} className="hover:bg-slate-50/50">
                              <td className="px-5 py-4 font-bold text-slate-800 truncate max-w-xs">{src.source_name}</td>
                              <td className="px-5 py-4 capitalize font-semibold">{src.source_type}</td>
                              <td className="px-5 py-4 text-center font-bold text-indigo-700">{src.chunk_count}</td>
                              <td className="px-5 py-4 text-center">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                  src.isStaged ? "bg-orange-100 text-orange-800" : "bg-emerald-100 text-emerald-800"
                                }`}>
                                  {src.status}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-center">
                                <button
                                  type="button"
                                  onClick={() => src.isStaged ? handleRemoveStagedItem(src) : handleDeleteSource(src.id)}
                                  className="text-red-500 hover:text-red-750 hover:bg-red-50 p-1 rounded-lg transition cursor-pointer animate-none"
                                >
                                  <LuTrash2 className="h-4.5 w-4.5" />
                                </button>
                              </td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Specs Profile Modal Overlay */}
      {showSpecsModal && selectedAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-slate-50 border-b border-slate-200 p-5 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <LuBot className="text-indigo-600 h-5 w-5" /> AI Agent Specification Profile
              </h2>
              <button
                onClick={() => setShowSpecsModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
            {/* Body */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                <h3 className="text-xs font-bold text-indigo-850 uppercase tracking-wide mb-3">Agent Profile</h3>
                <div className="grid grid-cols-3 gap-y-3 text-xs">
                  <span className="text-slate-500 font-semibold">Name:</span>
                  <span className="col-span-2 font-bold text-slate-800">{selectedAgent.name}</span>

                  <span className="text-slate-500 font-semibold">Category/Function:</span>
                  <span className="col-span-2 capitalize font-semibold text-slate-800">{selectedAgent.category}</span>

                  <span className="text-slate-500 font-semibold">Personality Tone:</span>
                  <span className="col-span-2 text-slate-700">{selectedAgent.personality || "None configured"}</span>

                  <span className="text-slate-500 font-semibold">Starting Message:</span>
                  <span className="col-span-2 text-slate-700 italic">"{selectedAgent.starting_message || "None"}"</span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                <h3 className="text-xs font-bold text-indigo-850 uppercase tracking-wide mb-3">AI Model & Voice Settings</h3>
                <div className="grid grid-cols-3 gap-y-3 text-xs">
                  <span className="text-slate-500 font-semibold">AI Provider:</span>
                  <span className="col-span-2 font-bold text-slate-800 capitalize">{selectedAgent.system_config?.provider || "gemini"}</span>

                  <span className="text-slate-500 font-semibold">AI Model:</span>
                  <span className="col-span-2 font-bold text-slate-800 font-mono text-[10px]">{selectedAgent.system_config?.model || "gemini-3.5-flash"}</span>

                  <span className="text-slate-500 font-semibold">Voice Provider:</span>
                  <span className="col-span-2 font-bold text-slate-800 capitalize">{selectedAgent.voice_config?.provider || "N/A"}</span>

                  <span className="text-slate-500 font-semibold">Voice ID/Name:</span>
                  <span className="col-span-2 font-bold text-slate-800 font-mono text-[10px]">{selectedAgent.voice_config?.voice_name || "N/A"}</span>

                  <span className="text-slate-500 font-semibold">Prompt Instructions:</span>
                  <span className="col-span-2 text-slate-600 text-xs bg-white border border-slate-200 p-3 rounded-lg block max-h-32 overflow-y-auto shadow-inner">
                    {selectedAgent.system_config?.system_prompt || "No instructions prompt set."}
                  </span>
                </div>
              </div>
            </div>
            {/* Footer */}
            <div className="bg-slate-50 border-t border-slate-200 p-4 flex items-center justify-between">
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setShowSpecsModal(false);
                    handleAgentDelete(selectedAgentId);
                  }}
                  className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2 px-4 rounded-lg shadow-sm transition cursor-pointer animate-none"
                >
                  <LuTrash2 className="h-4 w-4" /> Wipe Out Agent
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowSpecsModal(false);
                    enterEditMode();
                  }}
                  className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-4 rounded-lg shadow-sm transition cursor-pointer animate-none"
                >
                  <LuSettings className="h-4 w-4" /> Edit Configuration
                </button>
                <button
                  type="button"
                  onClick={() => setShowSpecsModal(false)}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs py-2 px-4 rounded-lg shadow-sm transition cursor-pointer animate-none"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
