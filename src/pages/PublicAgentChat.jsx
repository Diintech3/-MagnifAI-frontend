import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { toastSuccess } from "../lib/toast";
import ReactMarkdown from "react-markdown";
import {
  LuBot,
  LuPlay,
  LuMic,
  LuSquare,
  LuVolume2,
  LuSend,
  LuUser,
  LuPhone,
  LuSmartphone
} from "react-icons/lu";

export function PublicAgentChat() {
  const [searchParams] = useSearchParams();
  const agentId = searchParams.get("id");

  const [agent, setAgent] = useState(null);
  const [loadingAgent, setLoadingAgent] = useState(true);

  // Visitor Details Form
  const [isRegistered, setIsRegistered] = useState(true);
  const [userName, setUserName] = useState("Anonymous Visitor");
  const [phoneNumber, setPhoneNumber] = useState("Not Provided");
  const [sessionId, setSessionId] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [deviceName, setDeviceName] = useState("");

  // Chat States
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // Audio & STT WebSocket States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingText, setRecordingText] = useState("");
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const [isVoicePageOpen, setIsVoicePageOpen] = useState(false);
  const isVoicePageOpenRef = useRef(false);

  useEffect(() => {
    isVoicePageOpenRef.current = isVoicePageOpen;
  }, [isVoicePageOpen]);

  const recognitionRef = useRef(null);
  const audioRef = useRef(null);
  const speechSentRef = useRef(false);
  const sendingRef = useRef(false);

  // Auto-detect visitor device information
  function getBrowserDeviceName() {
    const ua = navigator.userAgent;
    if (/android/i.test(ua)) return "Android Device";
    if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) return "iOS Device";
    if (/chrome|crios/i.test(ua)) return "Chrome Browser";
    if (/safari/i.test(ua)) return "Safari Browser";
    if (/firefox|iceweasel/i.test(ua)) return "Firefox Browser";
    return "Desktop Web Client";
  }

  // Load agent public customization info (like brand color, logo, welcome message)
  async function loadPublicAgentDetails() {
    if (!agentId) return;
    setLoadingAgent(true);
    try {
      // Since visitor doesn't have token, we hit a public route or bypass local auth if needed.
      // But wait! GET /api/agents/:id is normally authenticated. Let's see if we should fetch
      // agent settings via public ask endpoint or if we need a public configuration fetcher.
      // Wait, we can hit GET /api/public/agent/:id if we had one, OR we can fetch it from our backend.
      // Let's check: does our backend have a public endpoint for fetching agent settings?
      // No, the backend routes/agents.js we created has requireAuth on GET /:agent_id.
      // Wait! Let's think: the visitor scanning the QR code doesn't have a login token. So how can they see the logo and welcome message?
      // They need to be able to fetch agent public customization parameters (logo, color, name) without auth!
      // This is a crucial logical detail! We should expose a public route to get agent details for styling!
      // Let's fetch it via a public endpoint in the backend. Let's register `GET /api/agents/:agent_id/public-config` in the backend as a public route!
      // This is exactly the kind of robust logic that avoids "tukka".
      // Let's implement that fetch here:
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || ""}/api/agents/${agentId}/public-config`);
      if (res.ok) {
        const data = await res.json();
        setAgent(data);
      }
    } catch (e) {
      console.error("Failed to load agent configuration", e);
    } finally {
      setLoadingAgent(false);
    }
  }

  useEffect(() => {
    if (agentId) {
      loadPublicAgentDetails();

      // Retrieve or create visitor session key and device details
      const storedSession = localStorage.getItem(`magnifai_sess_${agentId}`);
      const storedDevice = localStorage.getItem("magnifai_device_id");
      const storedName = localStorage.getItem("magnifai_user_name");
      const storedPhone = localStorage.getItem("magnifai_user_phone");

      const sysDeviceName = getBrowserDeviceName();
      setDeviceName(sysDeviceName);

      if (storedSession) {
        setSessionId(storedSession);
        setDeviceId(storedDevice || "dev-" + Math.random().toString(36).substring(2, 11));
        if (storedName) setUserName(storedName);
        if (storedPhone) setPhoneNumber(storedPhone);
        setIsRegistered(true);
      } else {
        const newSess = "sess-" + Math.random().toString(36).substring(2, 11);
        const newDev = "dev-" + Math.random().toString(36).substring(2, 11);
        setSessionId(newSess);
        setDeviceId(newDev);
        setIsRegistered(true);
      }
    }
  }, [agentId]);

  useEffect(() => {
    // Add Welcome message on load
    if (isRegistered && agent) {
      setMessages([
        {
          role: "assistant",
          content: agent.starting_message || `Hello! I am your AI assistant. How can I help you today?`
        }
      ]);
    }
  }, [isRegistered, agent]);

  // Visitor Registration Handler
  function handleRegisterSubmit(e) {
    e.preventDefault();
    if (!userName.trim() || !phoneNumber.trim()) return;

    localStorage.setItem(`magnifai_sess_${agentId}`, sessionId);
    localStorage.setItem("magnifai_device_id", deviceId);
    localStorage.setItem("magnifai_user_name", userName.trim());
    localStorage.setItem("magnifai_user_phone", phoneNumber.trim());

    setIsRegistered(true);
    toastSuccess("Welcome! Chat room initialized.");
  }

  // Send Message function
  async function sendTextMessage(userText) {
    if (!userText.trim() || sendingRef.current || !agentId) return;

    sendingRef.current = true;
    setChatLoading(true);
    setMessages(prev => [...prev, { role: "user", content: userText }]);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || ""}/api/agents/${agentId}/public-ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: userText,
          session_id: sessionId,
          device_id: deviceId,
          device_name: deviceName,
          user_name: userName,
          phone_number: phoneNumber
        })
      });

      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();

      setMessages(prev => [...prev, { role: "assistant", content: data.answer }]);

      if (isVoicePageOpenRef.current) {
        if (data.answer) {
          playSpeech(data.answer);
        } else {
          startRecording();
        }
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I am facing an issue connecting right now. Please try again." }]);
      if (isVoicePageOpenRef.current) {
        playSpeech("Sorry, I faced a connection issue. Please try again.");
      }
    } finally {
      setChatLoading(false);
      sendingRef.current = false;
    }
  }

  // Send Message to Public Ask API
  async function sendMessage(e) {
    e?.preventDefault();
    if (!chatInput.trim() || chatLoading) return;
    const txt = chatInput.trim();
    setChatInput("");
    await sendTextMessage(txt);
  }

  function playSpeech(text) {
    if (!agentId) return;
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlayingAudio(true);
    const audioUrl = `${import.meta.env.VITE_API_BASE_URL || ""}/api/agents/${agentId}/speak?text=${encodeURIComponent(text)}`;
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    // Start listening during playback to support barge-in interruption!
    if (isVoicePageOpenRef.current) {
      startRecording();
    }

    audio.play().catch(err => {
      console.error(err);
      setIsPlayingAudio(false);
      if (isVoicePageOpenRef.current) {
        startRecording();
      }
    });
    audio.onended = () => {
      setIsPlayingAudio(false);
      if (isVoicePageOpenRef.current) {
        startRecording();
      }
    };
  }

  // Browser-based Speech-to-Text STT with auto-send on silence
  function startRecording() {
    if (isRecording) return;
    speechSentRef.current = false;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support voice input. Please use Google Chrome or Microsoft Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onstart = () => {
      setIsRecording(true);
      setRecordingText("");
    };

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join("");
      setChatInput(transcript);

      // Barge-in (Interruption Handling): If user starts speaking, stop AI speaking instantly!
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
        setIsPlayingAudio(false);
      }
    };

    recognition.onerror = (event) => {
      console.error("[STT-Error]", event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
      if (speechSentRef.current) return;
      speechSentRef.current = true;
      // Wait slightly and send the finalized transcript automatically
      setTimeout(() => {
        setChatInput((currentInput) => {
          if (currentInput.trim()) {
            sendTextMessage(currentInput.trim());
          } else if (isVoicePageOpenRef.current) {
            // Keep microphone listening if it timed out due to silence
            startRecording();
          }
          return "";
        });
      }, 300);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }

  function stopRecording() {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  }

  const brandColor = agent?.customization?.color || "#4f46e5";

  if (loadingAgent) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <LuBot className="h-10 w-10 text-indigo-600 animate-bounce mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-500">Connecting to agent...</p>
        </div>
      </div>
    );
  }

  if (!agentId) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 p-6 text-center">
        <div>
          <h2 className="text-lg font-bold text-red-600 mb-2">Invalid Access Link</h2>
          <p className="text-sm text-slate-500">Please scan a valid agent QR code to begin conversation.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-100 text-slate-800">
      
      {/* Brand Header */}
      <header className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full overflow-hidden border border-slate-700 bg-white flex items-center justify-center">
            {agent?.customization?.logo_url ? (
              <img src={agent.customization.logo_url} alt="Logo" className="h-full w-full object-cover" />
            ) : (
              <LuBot className="h-6 w-6 text-indigo-600" />
            )}
          </div>
          <div>
            <h1 className="text-sm font-bold truncate max-w-xs">{agent?.name || "AI Support Agent"}</h1>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{agent?.category || "Interactive"} Chatroom</span>
          </div>
        </div>

        {isPlayingAudio && (
          <span className="text-[9px] bg-indigo-500 text-white font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 animate-pulse">
            <LuVolume2 className="h-3 w-3" /> Agent Speaking
          </span>
        )}
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col justify-center max-w-lg w-full mx-auto bg-white shadow-lg overflow-hidden border-x border-slate-200">
        {!isRegistered ? (
          /* Registration Form */
          <div className="p-6 space-y-6">
            <div className="text-center">
              <div className="h-14 w-14 bg-indigo-50 border border-indigo-150 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                <LuBot className="h-7 w-7 text-indigo-600" />
              </div>
              <h2 className="text-base font-bold text-slate-800">Verify Identity to Chat</h2>
              <p className="text-xs text-slate-500 mt-1">Please enter your basic information. Your host will be notified of this session.</p>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1 flex items-center gap-1">
                  <LuUser className="h-3.5 w-3.5" /> Full Name*
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aditya Sharma"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="bg-white border border-slate-300 text-slate-700 text-xs rounded-lg focus:ring-indigo-500 focus:border-indigo-500 p-2.5 w-full shadow-sm"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1 flex items-center gap-1">
                  <LuPhone className="h-3.5 w-3.5" /> Mobile Number*
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="bg-white border border-slate-300 text-slate-700 text-xs rounded-lg focus:ring-indigo-500 focus:border-indigo-500 p-2.5 w-full shadow-sm"
                />
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg flex items-center gap-2.5 text-[10px] text-slate-500">
                <LuSmartphone className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                <span>Detected Platform: <strong>{deviceName}</strong></span>
              </div>

              <button
                type="submit"
                style={{ backgroundColor: brandColor }}
                className="w-full text-white font-semibold py-2.5 rounded-lg shadow-md transition hover:brightness-95 text-sm"
              >
                Launch Conversation
              </button>
            </form>
          </div>
        ) : isVoicePageOpen ? (
          /* ==================== Dedicated Voice-to-Voice Call Screen ==================== */
          <div className="flex-1 flex flex-col justify-between items-center bg-slate-950 text-white p-6 relative overflow-hidden h-full">
            {/* Glassmorphic glowing circles background */}
            <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-60 h-60 bg-emerald-500/15 rounded-full blur-3xl animate-pulse delay-1000"></div>

            {/* Header info */}
            <div className="text-center mt-8 z-10">
              <h2 className="text-lg font-bold text-slate-100">{agent?.name || "AI Assistant"}</h2>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-1">{agent?.category || "Interactive"} Call Mode</p>
            </div>

            {/* Pulsing visual indicator circle */}
            <div className="flex flex-col items-center justify-center z-10 my-auto">
              <div className="relative flex items-center justify-center">
                {/* Outermost pulsing ring */}
                {(isRecording || chatLoading || isPlayingAudio) && (
                  <div className="absolute w-36 h-36 rounded-full border border-indigo-500/30 animate-ping duration-1000"></div>
                )}
                {/* Secondary pulsing ring */}
                {isPlayingAudio && (
                  <div className="absolute w-28 h-28 rounded-full bg-indigo-600/10 border border-indigo-400/20 animate-pulse"></div>
                )}
                {isRecording && (
                  <div className="absolute w-28 h-28 rounded-full bg-emerald-600/10 border border-emerald-400/20 animate-pulse"></div>
                )}

                {/* Core assistant visual circle */}
                <div className={`w-24 h-24 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 border-2 ${
                  chatLoading 
                    ? "bg-slate-800 border-slate-600" 
                    : isPlayingAudio 
                      ? "bg-indigo-600 border-indigo-400 shadow-indigo-500/20" 
                      : isRecording 
                        ? "bg-emerald-600 border-emerald-400 shadow-emerald-500/20 animate-pulse" 
                        : "bg-slate-900 border-slate-700"
                }`}>
                  <LuBot className={`h-10 w-10 text-white ${chatLoading ? "animate-bounce" : ""}`} />
                </div>
              </div>

              {/* Status Text */}
              <div className="mt-8 text-center min-h-[40px]">
                <p className={`text-sm font-bold tracking-wide transition-all ${
                  chatLoading 
                    ? "text-indigo-400" 
                    : isPlayingAudio 
                      ? "text-indigo-300" 
                      : isRecording 
                        ? "text-emerald-400" 
                        : "text-slate-400"
                }`}>
                  {chatLoading ? "Thinking..." : isPlayingAudio ? "Speaking..." : isRecording ? "Listening... speak now" : "Tap Mic to Start"}
                </p>
                {/* Live transcript indicator */}
                {isRecording && chatInput && (
                  <p className="text-[11px] text-slate-350 italic max-w-xs mt-2 truncate bg-white/5 px-3 py-1 rounded-full">{chatInput}</p>
                )}
              </div>
            </div>

            {/* Bottom Call Controls */}
            <div className="w-full flex flex-col items-center gap-6 pb-8 z-10">
              <div className="flex items-center gap-6">
                {/* Mic toggle */}
                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 cursor-pointer ${
                    isRecording 
                      ? "bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/10" 
                      : "bg-white/10 text-white border border-white/20 hover:bg-white/20"
                  }`}
                  title={isRecording ? "Mute Mic" : "Unmute Mic"}
                >
                  <LuMic className="h-6 w-6" />
                </button>

                {/* Hang up / End button */}
                <button
                  type="button"
                  onClick={() => {
                    stopRecording();
                    if (audioRef.current) {
                      audioRef.current.pause();
                    }
                    setIsPlayingAudio(false);
                    setIsVoicePageOpen(false);
                  }}
                  className="w-14 h-14 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-lg shadow-red-500/20 transition-all duration-200 cursor-pointer"
                  title="Hang Up"
                >
                  <LuPhone className="h-6 w-6 transform rotate-[135deg]" />
                </button>
              </div>

              <p className="text-[9px] text-slate-500 font-semibold tracking-widest uppercase">Voice Assistant Enabled</p>
            </div>
          </div>
        ) : (
          /* ==================== Conversational Chat Portal ==================== */
          <div className="flex-1 flex flex-col justify-between h-full bg-slate-50 text-xs">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[calc(100vh-8rem)]">
              {messages.map((chat, idx) => (
                <div key={idx} className={`flex flex-col ${chat.role === "user" ? "items-end" : "items-start"}`}>
                  <div
                    style={chat.role === "user" ? { backgroundColor: brandColor, color: "#fff" } : { backgroundColor: "#fff", color: "#1e293b", borderWidth: "1px", borderColor: "#e2e8f0" }}
                    className={`max-w-xs px-3.5 py-2.5 rounded-lg shadow-sm ${
                      chat.role === "user" ? "rounded-tr-none" : "rounded-tl-none"
                    }`}
                  >
                    <div className="prose prose-xs prose-slate max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_strong]:text-inherit [&_h1]:text-sm [&_h2]:text-xs [&_h3]:text-xs">
                      <ReactMarkdown>{chat.content}</ReactMarkdown>
                    </div>
                  </div>
                  {chat.role === "assistant" && (
                    <button
                      onClick={() => playSpeech(chat.content)}
                      className="text-slate-400 hover:text-indigo-600 mt-1 flex items-center gap-0.5 text-[9px]"
                      title="Play Audio"
                    >
                      <LuVolume2 className="h-3 w-3" /> Read aloud
                    </button>
                  )}
                </div>
              ))}
              {chatLoading && <p className="text-[10px] text-slate-400 animate-pulse">Thinking...</p>}
            </div>

            {/* Input Form Controls */}
            <div className="bg-white border-t border-slate-200 p-3 shadow-md flex flex-col gap-2">
              {/* FAQ Q&A Suggestion Chips */}
              {agent?.customization?.qa_pairs && agent.customization.qa_pairs.length > 0 && (
                <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-thin">
                  {agent.customization.qa_pairs.map((qa, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => sendTextMessage(qa.q)}
                      className="shrink-0 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 hover:border-indigo-300 text-[10px] font-bold text-slate-600 px-3 py-1.5 rounded-full transition cursor-pointer"
                    >
                      {qa.q}
                    </button>
                  ))}
                </div>
              )}

              <form onSubmit={sendMessage} className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsVoicePageOpen(true);
                    startRecording();
                  }}
                  className="p-2.5 rounded-lg shadow-sm border border-slate-300 text-slate-650 bg-slate-50 hover:bg-slate-100 hover:text-indigo-650 transition shrink-0 cursor-pointer"
                  title="Switch to Voice-to-Voice Call Mode"
                >
                  <LuMic className="h-4.5 w-4.5" />
                </button>

                <input
                  type="text"
                  placeholder="Type your message..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 bg-white border border-slate-300 text-slate-700 text-xs rounded-lg focus:ring-indigo-500 focus:border-indigo-500 p-2.5 shadow-sm"
                  disabled={chatLoading}
                />

                <button
                  type="submit"
                  disabled={chatLoading || !chatInput.trim()}
                  style={{ backgroundColor: brandColor }}
                  className="text-white font-semibold p-2.5 rounded-lg shadow transition hover:brightness-95 flex items-center justify-center shrink-0"
                >
                  <LuSend className="h-4.5 w-4.5" />
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

    </div>
  );
}
