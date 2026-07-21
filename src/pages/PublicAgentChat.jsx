import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { api, mediaUrl } from "../lib/api";
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
  LuSmartphone,
  LuStar,
  LuMessageCircle,
  LuX
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

  // Action Button & Feedback states
  const [activeActionButton, setActiveActionButton] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackEmail, setFeedbackEmail] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Chat States
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [askedQuestions, setAskedQuestions] = useState([]);

  // Audio & STT WebSocket States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingText, setRecordingText] = useState("");
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const [isVoicePageOpen, setIsVoicePageOpen] = useState(false);
  const isVoicePageOpenRef = useRef(false);

  useEffect(() => {
    isVoicePageOpenRef.current = isVoicePageOpen;
  }, [isVoicePageOpen]);

  const wsRef = useRef(null);
  const processorRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const recognitionRef = useRef(null);
  const audioRef = useRef(null);
  const speechSentRef = useRef(false);
  const sendingRef = useRef(false);

  // Background media stream / Web Audio API refs for Hands-free Interruption
  const wsFailedRef = useRef(false);
  const mediaStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const vadIntervalRef = useRef(null);
  const aiSpeechStartRef = useRef(0);
  const isManuallyMutedRef = useRef(false);

  // Initialize background stream for Acoustic Echo Cancellation (AEC) and Voice Activity Detection (VAD)
  async function enableAEC() {
    // Option B: No background mic stream during AI playback to prevent echo/feedback loops
    return;
  }

  function disableAEC() {
    return;
  }

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
    return () => {
      disableAEC();
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [agentId]);

  // Restore visitor chat history from server on load (GET /api/agents/:id/public-history)
  useEffect(() => {
    async function restorePublicHistory() {
      if (!agentId || !sessionId || !deviceId) return;
      const apiBase = import.meta.env.VITE_API_BASE_URL || "";
      try {
        const res = await fetch(`${apiBase}/api/agents/${agentId}/public-history?device_id=${encodeURIComponent(deviceId)}&session_id=${encodeURIComponent(sessionId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.messages && data.messages.length > 0) {
            setMessages(data.messages);
            return;
          }
        }
      } catch (err) {
        console.error("[restore-history-error]", err);
      }
      // Default welcome message if no history found
      if (agent) {
        setMessages([
          {
            role: "assistant",
            content: agent.starting_message || `Hello! I am your AI assistant. How can I help you today?`
          }
        ]);
      }
    }

    if (isRegistered && agent) {
      restorePublicHistory();
    }
  }, [isRegistered, agent, agentId, sessionId, deviceId]);

  // Real-time Session Status Polling for Creator Action Buttons (GET /api/agents/:id/session-status)
  useEffect(() => {
    if (!agentId || !sessionId || !deviceId) return;

    async function checkSessionStatus() {
      const apiBase = import.meta.env.VITE_API_BASE_URL || "";
      try {
        const res = await fetch(`${apiBase}/api/agents/${agentId}/session-status?device_id=${encodeURIComponent(deviceId)}&session_id=${encodeURIComponent(sessionId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.session && data.session.action_button) {
            setActiveActionButton(data.session.action_button);
          } else {
            setActiveActionButton(null);
          }
        }
      } catch (e) {
        // ignore polling error
      }
    }

    checkSessionStatus();
    const interval = setInterval(checkSessionStatus, 4000);
    return () => clearInterval(interval);
  }, [agentId, sessionId, deviceId]);

  // Submit Feedback Handler (POST /api/agents/:id/feedback)
  async function handleFeedbackSubmit(e) {
    e.preventDefault();
    if (!agentId) return;
    setSubmittingFeedback(true);
    const apiBase = import.meta.env.VITE_API_BASE_URL || "";
    try {
      const res = await fetch(`${apiBase}/api/agents/${agentId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_name: userName || "Anonymous Visitor",
          user_email: feedbackEmail.trim(),
          feedback_type: "feedback",
          rating: feedbackRating,
          comment: feedbackComment.trim()
        })
      });
      if (!res.ok) throw new Error("Failed to submit feedback");
      toastSuccess("Thank you! Your feedback has been submitted.");
      setShowFeedbackModal(false);
      setFeedbackComment("");
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingFeedback(false);
    }
  }

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

    // Immediately stop any ongoing AI audio speech
    stopAiSpeech();

    // Mark question as asked so it vanishes from FAQ chips and next follow-up slides in
    const trimmedTxt = userText.trim();
    setAskedQuestions(prev => prev.includes(trimmedTxt) ? prev : [...prev, trimmedTxt]);

    sendingRef.current = true;
    setChatLoading(true);
    setMessages(prev => [...prev, { role: "user", content: trimmedTxt }]);

    const apiBase = import.meta.env.VITE_API_BASE_URL || "";
    try {
      let res;
      try {
        res = await fetch(`${apiBase}/api/agents/${agentId}/public-ask`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: userText,
            session_id: sessionId,
            device_id: deviceId,
            device_name: deviceName,
            user_name: (userName && userName !== "Anonymous Visitor") ? userName : "",
            phone_number: (phoneNumber && phoneNumber !== "Not Provided") ? phoneNumber : ""
          })
        });
      } catch (firstErr) {
        // Fallback to live EC2 backend if local connection is refused/offline
        if (!apiBase || apiBase.includes("localhost")) {
          console.warn("[API] Local backend offline; using live EC2 backend fallback...");
          const liveBase = "http://65.2.129.159:4000";
          res = await fetch(`${liveBase}/api/agents/${agentId}/public-ask`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              question: userText,
              session_id: sessionId,
              device_id: deviceId,
              device_name: deviceName,
              user_name: (userName && userName !== "Anonymous Visitor") ? userName : "",
              phone_number: (phoneNumber && phoneNumber !== "Not Provided") ? phoneNumber : ""
            })
          });
        } else {
          throw firstErr;
        }
      }

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

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatLoading]);

  const isPlayingAudioRef = useRef(false);
  useEffect(() => {
    isPlayingAudioRef.current = isPlayingAudio;
  }, [isPlayingAudio]);

  function stopAiSpeech() {
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch (e) {}
      audioRef.current = null;
    }
    setIsPlayingAudio(false);
    isPlayingAudioRef.current = false;
  }

  function playSpeech(text) {
    if (!agentId) return;

    stopAiSpeech();
    setIsPlayingAudio(true);
    isPlayingAudioRef.current = true;
    aiSpeechStartRef.current = Date.now();

    const apiBase = import.meta.env.VITE_API_BASE_URL || "http://65.2.129.159:4000";
    const audioUrl = `${apiBase}/api/agents/${agentId}/speak?text=${encodeURIComponent(text)}`;
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.play().catch(err => {
      console.error(err);
      if (apiBase.includes("localhost")) {
        const fallbackUrl = `http://65.2.129.159:4000/api/agents/${agentId}/speak?text=${encodeURIComponent(text)}`;
        const fallbackAudio = new Audio(fallbackUrl);
        audioRef.current = fallbackAudio;
        fallbackAudio.play().catch(e => {
          console.error(e);
          setIsPlayingAudio(false);
          isPlayingAudioRef.current = false;
        });
        fallbackAudio.onended = () => {
          setIsPlayingAudio(false);
          isPlayingAudioRef.current = false;
          if (isVoicePageOpenRef.current && !isManuallyMutedRef.current) {
            setTimeout(() => {
              if (isVoicePageOpenRef.current && !isManuallyMutedRef.current && !isPlayingAudioRef.current) {
                startRecording();
              }
            }, 400);
          }
        };
      } else {
        setIsPlayingAudio(false);
        isPlayingAudioRef.current = false;
      }
    });

    audio.onended = () => {
      setIsPlayingAudio(false);
      isPlayingAudioRef.current = false;
      // Auto-start listening for user's question AFTER AI finishes speaking
      if (isVoicePageOpenRef.current && !isManuallyMutedRef.current) {
        setTimeout(() => {
          if (isVoicePageOpenRef.current && !isManuallyMutedRef.current && !isPlayingAudioRef.current) {
            startRecording();
          }
        }, 400);
      }
    };
  }

  // Real-time External STT via Backend WebSocket Proxy (/api/agents/ws/transcribe)
  function startRecording() {
    if (isRecording || wsRef.current || recognitionRef.current || isPlayingAudioRef.current) return;
    isManuallyMutedRef.current = false;
    speechSentRef.current = false;

    // If WebSocket previously failed or HTTPS/HTTP mismatch, directly route to Web Speech STT
    const apiBase = import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}:4000`;
    const isHttpsPage = window.location.protocol === "https:";
    const isHttpApi = apiBase.startsWith("http:");

    if (wsFailedRef.current || (isHttpsPage && isHttpApi)) {
      console.log("[STT] Routing directly to Web Speech STT for reliable voice recording.");
      startFallbackWebSpeechSTT();
      return;
    }

    try {
      const urlObj = new URL(apiBase, window.location.href);
      const wsProtocol = urlObj.protocol === "https:" ? "wss:" : "ws:";
      const wsHost = urlObj.port ? `${urlObj.hostname}:${urlObj.port}` : urlObj.host;
      const wsUrl = `${wsProtocol}//${wsHost}/api/agents/ws/transcribe?agent_id=${encodeURIComponent(agentId || "")}`;

      console.log("[STT] Connecting to backend WebSocket proxy:", wsUrl);
      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = async () => {
        console.log("[STT] WebSocket connected, requesting microphone access...");
        setIsRecording(true);

        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              channelCount: 1,
              sampleRate: 16000,
              echoCancellation: true,
              noiseSuppression: true
            }
          });
          mediaStreamRef.current = stream;

          const AudioContextClass = window.AudioContext || window.webkitAudioContext;
          const audioCtx = new AudioContextClass({ sampleRate: 16000 });
          audioContextRef.current = audioCtx;

          const source = audioCtx.createMediaStreamSource(stream);
          const processor = audioCtx.createScriptProcessor(4096, 1, 1);
          processorRef.current = processor;

          processor.onaudioprocess = (e) => {
            if (socket.readyState !== WebSocket.OPEN) return;
            // Prevent sending speaker audio buffer to STT while AI is speaking
            if (isPlayingAudioRef.current) return;

            const inputData = e.inputBuffer.getChannelData(0);

            // Convert 32-bit float PCM to 16-bit Int16 PCM ArrayBuffer
            const pcm16 = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) {
              const s = Math.max(-1, Math.min(1, inputData[i]));
              pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
            }
            socket.send(pcm16.buffer);
          };

          source.connect(processor);
          processor.connect(audioCtx.destination);
        } catch (micErr) {
          console.error("[STT] Microphone access error:", micErr);
          setIsRecording(false);
          stopRecording();
        }
      };

      socket.onmessage = (event) => {
        try {
          // Ignore any message if AI is currently playing audio to prevent self-echo
          if (isPlayingAudioRef.current) return;

          let textStr = "";
          let isFinal = false;

          if (typeof event.data === "string") {
            try {
              const data = JSON.parse(event.data);
              const altTranscript = data?.channel?.alternatives?.[0]?.transcript;
              if (typeof altTranscript === "string") {
                textStr = altTranscript;
              } else if (typeof data.transcript === "string") {
                textStr = data.transcript;
              } else if (typeof data.text === "string") {
                textStr = data.text;
              } else if (typeof data.message === "string") {
                textStr = data.message;
              }
              isFinal = Boolean(data.is_final || data.speech_final || data.final);
            } catch (e) {
              textStr = event.data;
            }
          } else if (event.data && typeof event.data === "object") {
            const altTranscript = event.data?.channel?.alternatives?.[0]?.transcript;
            if (typeof altTranscript === "string") textStr = altTranscript;
            else if (typeof event.data.transcript === "string") textStr = event.data.transcript;
            else if (typeof event.data.text === "string") textStr = event.data.text;
          }

          if (typeof textStr !== "string") {
            textStr = "";
          }

          const cleanText = textStr.trim();
          if (cleanText) {
            setChatInput(cleanText);

            // Auto-send on final or 1500ms silence timeout
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            if (isFinal) {
              sendTextMessage(cleanText);
            } else {
              silenceTimerRef.current = setTimeout(() => {
                sendTextMessage(cleanText);
              }, 1500);
            }
          }
        } catch (err) {
          console.error("[STT] Failed to parse message:", err);
        }
      };

      socket.onerror = (err) => {
        console.warn("[STT] WebSocket error, flagging for Web Speech fallback");
        wsFailedRef.current = true;
      };

      socket.onclose = () => {
        console.log("[STT] WebSocket connection closed, enabling fallback Speech STT...");
        wsFailedRef.current = true;
        wsRef.current = null;
        if (isVoicePageOpenRef.current && !isManuallyMutedRef.current && !isPlayingAudioRef.current) {
          startFallbackWebSpeechSTT();
        } else {
          setIsRecording(false);
        }
      };
    } catch (err) {
      console.error("[STT] Failed to initialize WebSocket:", err);
      wsFailedRef.current = true;
      if (isVoicePageOpenRef.current && !isManuallyMutedRef.current && !isPlayingAudioRef.current) {
        startFallbackWebSpeechSTT();
      } else {
        setIsRecording(false);
      }
    }
  }

  function startFallbackWebSpeechSTT() {
    stopRecording(); // ensure previous Web Audio stream tracks are closed
    if (isPlayingAudioRef.current) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("[STT] Web Speech API not supported in this browser");
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-IN"; // English (Indian accent)
      recognition.interimResults = true;
      recognition.continuous = false; // Single phrase mode prevents Android Chrome speech service crashes

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (e) => {
        // PREVENT SELF-ECHO: Ignore any speech recognition results if AI is playing audio
        if (isPlayingAudioRef.current) {
          console.log("[STT] Suppressed speaker self-echo while AI is speaking");
          return;
        }

        let interim = "";
        let final = "";
        for (let i = e.resultIndex; i < e.results.length; ++i) {
          if (e.results[i].isFinal) {
            final += e.results[i][0].transcript;
          } else {
            interim += e.results[i][0].transcript;
          }
        }
        const cleanText = (final || interim).trim();
        if (cleanText) {
          setChatInput(cleanText);

          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          if (final) {
            sendTextMessage(cleanText);
          } else {
            silenceTimerRef.current = setTimeout(() => {
              sendTextMessage(cleanText);
            }, 1500);
          }
        }
      };

      recognition.onerror = (e) => {
        console.warn("[STT WebSpeech Error]", e.error);
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed' || e.error === 'audio-capture') {
          setIsRecording(false);
          isManuallyMutedRef.current = true;
        }
      };

      recognition.onend = () => {
        recognitionRef.current = null;
        if (isVoicePageOpenRef.current && !isManuallyMutedRef.current && !isPlayingAudioRef.current) {
          setTimeout(() => {
            if (isVoicePageOpenRef.current && !isManuallyMutedRef.current && !isPlayingAudioRef.current) {
              startFallbackWebSpeechSTT();
            }
          }, 400);
        } else {
          setIsRecording(false);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("[STT WebSpeech] Exception starting recognition:", err);
      setIsRecording(false);
    }
  }

  function stopRecording() {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (processorRef.current) {
      try { processorRef.current.disconnect(); } catch (e) {}
      processorRef.current = null;
    }
    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch (e) {}
      audioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
      try { mediaStreamRef.current.getTracks().forEach(track => track.stop()); } catch (e) {}
      mediaStreamRef.current = null;
    }
    if (wsRef.current) {
      try { wsRef.current.close(); } catch (e) {}
      wsRef.current = null;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
      recognitionRef.current = null;
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
    <div className="flex flex-col h-[100dvh] bg-slate-950 text-slate-100 font-sans overflow-hidden">
      
      {/* Brand Header */}
      <header className="bg-slate-900/90 backdrop-blur-md text-white px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between border-b border-slate-800/80 shadow-lg shrink-0 z-20">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full overflow-hidden border-2 border-indigo-500/50 bg-white flex items-center justify-center shadow-md shrink-0">
            {agent?.customization?.author_image_url || agent?.customization?.logo_url ? (
              <img src={mediaUrl(agent.customization.author_image_url || agent.customization.logo_url)} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <LuBot className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" />
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-xs sm:text-base font-extrabold truncate max-w-[140px] xs:max-w-[180px] sm:max-w-md text-slate-100">{agent?.name || "AI Support Agent"}</h1>
            <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate">
              <span className="flex items-center gap-1 text-emerald-400 shrink-0">
                <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-emerald-500 animate-ping inline-block"></span> Online Assistant
              </span>
              <span className="hidden sm:inline">• {agent?.category || "Interactive"} Chatroom</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isPlayingAudio && (
            <span className="text-[9px] sm:text-[10px] bg-indigo-600 text-white font-bold px-2.5 py-1 rounded-full flex items-center gap-1 animate-pulse shadow-md">
              <LuVolume2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> <span className="hidden xs:inline">Agent</span> Speaking...
            </span>
          )}
        </div>
      </header>

      {/* Main Container (Spacious Responsive Full Desktop Width) */}
      <main className="flex-1 flex flex-col justify-center max-w-4xl lg:max-w-5xl w-full mx-auto bg-slate-900/40 shadow-2xl overflow-hidden border-x border-slate-800/60 relative">
        {!isRegistered ? (
          /* Registration Form */
          <div className="p-6 space-y-6 max-w-md mx-auto w-full my-auto">
            <div className="text-center">
              <div className="h-16 w-16 bg-indigo-900/40 border border-indigo-500/30 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg overflow-hidden">
                {agent?.customization?.author_image_url || agent?.customization?.logo_url ? (
                  <img src={mediaUrl(agent.customization.author_image_url || agent.customization.logo_url)} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <LuBot className="h-8 w-8 text-indigo-400" />
                )}
              </div>
              <h2 className="text-lg font-extrabold text-slate-100">Verify Identity to Chat</h2>
              <p className="text-xs text-slate-400 mt-1">Please enter your basic information to start your AI session.</p>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1 flex items-center gap-1">
                  <LuUser className="h-3.5 w-3.5" /> Full Name*
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aditya Sharma"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-slate-100 text-xs rounded-xl focus:ring-indigo-500 focus:border-indigo-500 p-3 w-full shadow-sm"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1 flex items-center gap-1">
                  <LuPhone className="h-3.5 w-3.5" /> Mobile Number*
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-slate-100 text-xs rounded-xl focus:ring-indigo-500 focus:border-indigo-500 p-3 w-full shadow-sm"
                />
              </div>

              <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-xl flex items-center gap-2.5 text-[10px] text-slate-400">
                <LuSmartphone className="h-4.5 w-4.5 text-slate-500 shrink-0" />
                <span>Detected Platform: <strong>{deviceName}</strong></span>
              </div>

              <button
                type="submit"
                style={{ backgroundColor: brandColor }}
                className="w-full text-white font-bold py-3 rounded-xl shadow-lg transition hover:brightness-110 text-sm cursor-pointer"
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
                <div 
                  onClick={() => {
                    if (isPlayingAudio) {
                      stopAiSpeech();
                      isManuallyMutedRef.current = false;
                      startRecording();
                    }
                  }}
                  className={`w-24 h-24 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 border-2 overflow-hidden ${
                    isPlayingAudio ? "cursor-pointer hover:scale-105 active:scale-95" : ""
                  } ${
                    chatLoading 
                      ? "bg-slate-800 border-slate-600" 
                      : isPlayingAudio 
                        ? "bg-indigo-600 border-indigo-400 shadow-indigo-500/20" 
                        : isRecording 
                          ? "bg-emerald-600 border-emerald-400 shadow-emerald-500/20 animate-pulse" 
                          : "bg-slate-900 border-slate-700"
                  }`}
                >
                  {agent?.customization?.author_image_url || agent?.customization?.logo_url ? (
                    <img
                      src={mediaUrl(agent.customization.author_image_url || agent.customization.logo_url)}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <LuBot className={`h-10 w-10 text-white ${chatLoading ? "animate-bounce" : ""}`} />
                  )}
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
                  {chatLoading ? "Thinking..." : isPlayingAudio ? "Speaking... Speak or tap to interrupt" : isRecording ? "Listening... speak now" : "Tap Mic to Start"}
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
                  onClick={() => {
                    if (isPlayingAudio) {
                      stopAiSpeech();
                      isManuallyMutedRef.current = false;
                      startRecording();
                    } else if (isRecording) {
                      isManuallyMutedRef.current = true;
                      stopRecording();
                    } else {
                      isManuallyMutedRef.current = false;
                      startRecording();
                    }
                  }}
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
                    isManuallyMutedRef.current = true;
                    stopRecording();
                    disableAEC();
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
          <div className="flex-1 flex flex-col justify-between h-full bg-slate-900 text-slate-200 text-xs relative overflow-hidden">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 max-h-[calc(100vh-8.5rem)] no-scrollbar scrollbar-none">
              {messages.map((chat, idx) => (
                <div key={idx} className={`flex flex-col ${chat.role === "user" ? "items-end" : "items-start"}`}>
                  <div
                    style={chat.role === "user" ? { backgroundColor: brandColor, color: "#fff" } : { backgroundColor: "#1e293b", color: "#f1f5f9", borderWidth: "1px", borderColor: "#334155" }}
                    className={`max-w-2xl px-5 py-3.5 rounded-2xl shadow-md leading-relaxed text-xs md:text-sm ${
                      chat.role === "user" ? "rounded-tr-xs" : "rounded-tl-xs"
                    }`}
                  >
                    <div className="prose prose-invert prose-xs max-w-none [&_p]:my-1.5 [&_ul]:my-1.5 [&_ol]:my-1.5 [&_li]:my-0.5 [&_strong]:text-indigo-300 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-xs font-normal">
                      <ReactMarkdown>{chat.content}</ReactMarkdown>
                    </div>
                  </div>
                  {chat.role === "assistant" && (
                    <button
                      onClick={() => playSpeech(chat.content)}
                      className="text-slate-400 hover:text-indigo-400 mt-1.5 flex items-center gap-1 text-[10px] font-bold transition cursor-pointer px-1 py-0.5"
                      title="Play Audio"
                    >
                      <LuVolume2 className="h-3.5 w-3.5 text-indigo-400" /> Read aloud
                    </button>
                  )}
                </div>
              ))}
              {chatLoading && (
                <div className="flex items-center gap-2 text-xs text-indigo-400 font-bold animate-pulse p-2">
                  <LuBot className="h-4 w-4" /> Thinking response...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Floating Input Dock (Sticky Pinned to Bottom for 0% Mobile Scroll Access) */}
            <div className="p-2.5 sm:p-4 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800 shadow-2xl flex flex-col gap-2 shrink-0 sticky bottom-0 z-30">
              
              {/* Creator Action Button Banner */}
              {activeActionButton && (
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-3 rounded-xl flex items-center justify-between shadow-lg animate-pulse">
                  <div className="flex items-center gap-2.5">
                    {activeActionButton.action_type === "whatsapp" ? (
                      <LuMessageCircle className="h-6 w-6 text-emerald-100" />
                    ) : (
                      <LuPhone className="h-6 w-6 text-emerald-100" />
                    )}
                    <div>
                      <p className="font-extrabold text-xs">{activeActionButton.message || (activeActionButton.action_type === "whatsapp" ? "Connect on WhatsApp" : "Call Us Now")}</p>
                      <p className="text-[10px] text-emerald-100 font-semibold">{activeActionButton.phone_number}</p>
                    </div>
                  </div>
                  <a
                    href={activeActionButton.action_type === "whatsapp" ? `https://wa.me/${String(activeActionButton.phone_number).replace(/\D/g, '')}` : `tel:${activeActionButton.phone_number}`}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-white text-emerald-800 font-extrabold px-4 py-2 rounded-lg text-xs hover:bg-emerald-50 transition shadow-md"
                  >
                    {activeActionButton.action_type === "whatsapp" ? "WhatsApp Connect" : "Call Now"}
                  </a>
                </div>
              )}

              {/* FAQ Q&A Suggestion Chips (Desktop: 5 FAQs, Mobile: 3 FAQs) */}
              {agent?.customization?.qa_pairs && agent.customization.qa_pairs.length > 0 && (() => {
                const availableFaqs = agent.customization.qa_pairs
                  .filter(qa => qa.q && !askedQuestions.includes(qa.q.trim()))
                  .slice(0, 5);

                if (availableFaqs.length === 0) return null;

                return (
                  <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar scrollbar-none snap-x touch-pan-x">
                    {availableFaqs.map((qa, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => sendTextMessage(qa.q)}
                        className={`shrink-0 bg-slate-800/90 hover:bg-indigo-600 hover:text-white border border-slate-700/80 text-[10px] sm:text-[11px] font-bold text-slate-300 px-3 py-1.5 rounded-full transition-all cursor-pointer shadow-2xs hover:scale-[1.02] snap-start ${
                          idx >= 3 ? "hidden md:inline-block" : "inline-block"
                        }`}
                      >
                        {qa.q}
                      </button>
                    ))}
                  </div>
                );
              })()}

              <form onSubmit={sendMessage} className="flex gap-1.5 sm:gap-2.5 items-center bg-slate-900 border border-slate-800 p-1 sm:p-1.5 rounded-2xl shadow-inner">
                <button
                  type="button"
                  onClick={() => {
                    setIsVoicePageOpen(true);
                    startRecording();
                  }}
                  className="p-2.5 sm:p-3 rounded-xl border border-slate-700 text-indigo-400 bg-slate-800 hover:bg-indigo-600 hover:text-white transition shrink-0 cursor-pointer shadow-xs"
                  title="Switch to Voice-to-Voice Call Mode"
                >
                  <LuMic className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>

                <input
                  type="text"
                  placeholder="Ask any question..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 text-xs md:text-sm px-2 sm:px-3 py-1.5 sm:py-2 focus:outline-none min-w-0"
                  disabled={chatLoading}
                />

                <button
                  type="submit"
                  disabled={chatLoading || !chatInput.trim()}
                  style={{ backgroundColor: brandColor }}
                  className="text-white font-bold p-2.5 sm:p-3 rounded-xl shadow-md transition hover:brightness-110 disabled:opacity-40 flex items-center justify-center shrink-0 cursor-pointer"
                >
                  <LuSend className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </form>
            </div>
          </div>
        )}
      </main>



    </div>
  );
}
