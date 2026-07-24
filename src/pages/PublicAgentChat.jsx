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
  LuChevronRight,
  LuX,
  LuPaperclip,
  LuFileText
} from "react-icons/lu";

function getContrastColor(hexColor) {
  if (!hexColor || typeof hexColor !== "string") return "#ffffff";
  let hex = hexColor.replace("#", "");
  if (hex.length === 3) {
    hex = hex.split("").map(c => c + c).join("");
  }
  if (hex.length !== 6) return "#ffffff";
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#090d16" : "#ffffff";
}

export function PublicAgentChat() {
  const [searchParams] = useSearchParams();
  const agentId = searchParams.get("id");

  const [agent, setAgent] = useState(null);
  const [loadingAgent, setLoadingAgent] = useState(true);

  // Screen Mode: "welcome" | "chat" | "voice"
  const [activeScreenMode, setActiveScreenMode] = useState("welcome");

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
  const [stagedFile, setStagedFile] = useState(null); // { name, type, size, extractedText }
  const [uploadingFile, setUploadingFile] = useState(false);

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
      const storedSession = sessionStorage.getItem(`magnifai_sess_${agentId}`);
      const storedDevice = localStorage.getItem("magnifai_device_id");
      const storedName = localStorage.getItem("magnifai_user_name");
      const storedPhone = localStorage.getItem("magnifai_user_phone");

      const sysDeviceName = getBrowserDeviceName();
      setDeviceName(sysDeviceName);

      // Always resolve device ID persistently
      const activeDevice = storedDevice || "dev-" + Math.random().toString(36).substring(2, 11);
      setDeviceId(activeDevice);
      if (!storedDevice) {
        localStorage.setItem("magnifai_device_id", activeDevice);
      }

      if (storedName) setUserName(storedName);
      if (storedPhone) setPhoneNumber(storedPhone);

      if (storedSession) {
        setSessionId(storedSession);
        setIsRegistered(true);
      } else {
        const newSess = "sess-" + Math.random().toString(36).substring(2, 11);
        setSessionId(newSess);
        sessionStorage.setItem(`magnifai_sess_${agentId}`, newSess);
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

    sessionStorage.setItem(`magnifai_sess_${agentId}`, sessionId);
    localStorage.setItem("magnifai_device_id", deviceId);
    localStorage.setItem("magnifai_user_name", userName.trim());
    localStorage.setItem("magnifai_user_phone", phoneNumber.trim());

    setIsRegistered(true);
    toastSuccess("Welcome! Chat room initialized.");
  }

  async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file || !agentId) return;

    const limitBytes = 20 * 1024 * 1024;
    if (file.size > limitBytes) {
      alert("File size exceeds the 20MB limit.");
      return;
    }

    setUploadingFile(true);
    const apiBase = import.meta.env.VITE_API_BASE_URL || "";
    try {
      const formData = new FormData();
      formData.append("file", file);

      let uploadUrl = `${apiBase}/api/agents/${agentId}/upload-chat-file`;
      let res = await fetch(uploadUrl, {
        method: "POST",
        body: formData
      });

      if (!res.ok) {
        if (!apiBase || apiBase.includes("localhost")) {
          console.warn("[API] Local upload failed; trying live EC2 fallback...");
          const liveBase = "http://65.2.129.159:4000";
          uploadUrl = `${liveBase}/api/agents/${agentId}/upload-chat-file`;
          res = await fetch(uploadUrl, {
            method: "POST",
            body: formData
          });
        }
      }

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      
      setStagedFile({
        name: file.name,
        type: file.type,
        size: file.size,
        extractedText: data.extracted_text || ""
      });
      toastSuccess(`File "${file.name}" uploaded successfully! 📎`);
    } catch (err) {
      console.error("[file-upload-error]", err);
      alert("Failed to upload file. Please try again.");
    } finally {
      setUploadingFile(false);
      e.target.value = null;
    }
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

    const activeFile = stagedFile;
    const fileContext = activeFile ? activeFile.extractedText : "";
    setStagedFile(null); // Clear staged state

    setMessages(prev => [
      ...prev,
      {
        role: "user",
        content: trimmedTxt,
        attachment: activeFile ? { name: activeFile.name, type: activeFile.type } : null
      }
    ]);

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
            phone_number: (phoneNumber && phoneNumber !== "Not Provided") ? phoneNumber : "",
            file_context: fileContext
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
              phone_number: (phoneNumber && phoneNumber !== "Not Provided") ? phoneNumber : "",
              file_context: fileContext
            })
          });
        } else {
          throw firstErr;
        }
      }

      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();

      const rawAnswer = data.answer || "";
      // Split main answer and follow-up lead capture question into 2 distinct messages
      const match = rawAnswer.match(/(?:\r?\n\r?\n|\r?\n|\.\s+)(?=(?:By the way|Also,|May I know|Could you (?:please )?share|What is your name|What's your name|Please share your)[,\?\s])/i);
      let parts = [rawAnswer];
      if (match && match.index > 0) {
        const mainAnswer = rawAnswer.substring(0, match.index).trim();
        const followUp = rawAnswer.substring(match.index).trim();
        if (mainAnswer && followUp) {
          parts = [mainAnswer, followUp];
        }
      }

      if (parts.length > 1) {
        parts.forEach((partText, index) => {
          setTimeout(() => {
            setMessages(prev => [...prev, { role: "assistant", content: partText }]);
          }, index * 400);
        });
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: rawAnswer }]);
      }

      if (isVoicePageOpenRef.current) {
        if (rawAnswer) {
          playSpeech(rawAnswer);
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
    if (chatLoading) return;
    const txt = chatInput.trim();
    if (!txt && !stagedFile) return;
    setChatInput("");
    await sendTextMessage(txt || `Please analyze this attached document: ${stagedFile.name}`);
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
    const assistantName = agent?.name || "Vijay AI Assistant";
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-950 text-white p-6 z-50 overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none animate-pulse"></div>

        <div className="relative z-10 text-center space-y-5 max-w-sm mx-auto">
          {/* Glowing MagnifAI Logo */}
          <div className="relative inline-block">
            <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-75 blur-md animate-pulse"></div>
            <img
              src="/MagnifAI logo.jpeg"
              alt="MagnifAI Logo"
              className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-full object-cover border-2 border-indigo-400/40 shadow-2xl mx-auto"
            />
          </div>

          {/* Dynamic Loading Message */}
          <div className="space-y-1.5">
            <h3 className="text-base sm:text-lg font-bold text-slate-100 tracking-wide">
              Connecting to <span className="text-indigo-400 font-extrabold">{assistantName}</span>...
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              Initializing secure AI assistant session
            </p>
          </div>

          {/* Animated Dots */}
          <div className="flex justify-center items-center gap-2 pt-1">
            <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
            <span className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
            <span className="w-2.5 h-2.5 bg-pink-500 rounded-full animate-bounce"></span>
          </div>
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
    <div className="fixed inset-0 flex flex-col h-[100dvh] w-full bg-slate-950 text-slate-100 font-sans overflow-hidden">
      
      {/* Brand Header (Only shown when activeScreenMode !== "welcome") */}
      {activeScreenMode !== "welcome" && (
        <header className="sticky top-0 bg-slate-900/95 backdrop-blur-md text-white px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between border-b border-slate-800/80 shadow-lg shrink-0 z-30 transition-all duration-300 animate-fade-in">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full overflow-hidden border-2 border-indigo-500/50 bg-white flex items-center justify-center shadow-md shrink-0">
              {agent?.customization?.author_image_url || agent?.customization?.logo_url ? (
                <img src={mediaUrl(agent.customization.author_image_url || agent.customization.logo_url)} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <img src="/bot-avatar.png" alt="Bot Logo" className="h-full w-full object-cover" />
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
            <button
              type="button"
              onClick={() => {
                setActiveScreenMode("welcome");
                setIsVoicePageOpen(false);
              }}
              className="p-1.5 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center transition cursor-pointer shadow-sm hover:scale-105"
              title="Close"
            >
              <LuX className="w-4 h-4" />
            </button>
            {isPlayingAudio && (
              <span className="text-[9px] sm:text-[10px] bg-indigo-600 text-white font-bold px-2.5 py-1 rounded-full flex items-center gap-1 animate-pulse shadow-md">
                <LuVolume2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> <span className="hidden xs:inline">Agent</span> Speaking...
              </span>
            )}
          </div>
        </header>
      )}

      {/* Main Container */}
      <main className={`flex-1 min-h-0 flex flex-col w-full mx-auto shadow-2xl overflow-hidden relative transition-all duration-300 ${
        activeScreenMode === "welcome" ? "bg-slate-950" : "max-w-4xl lg:max-w-5xl bg-slate-900/40 border-x border-slate-800/60"
      }`}>
        {activeScreenMode === "welcome" ? (
          /* ==================== MagnifAI Signature Dark Glassmorphic QR Landing ==================== */
          <div className="flex-1 flex flex-col justify-center items-center p-6 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 relative overflow-y-auto min-h-0 select-none no-scrollbar">
            
            {/* Ambient Background Glowing Orbs */}
            <div className="absolute -top-24 -left-24 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
            <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
            <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none"></div>

            {/* Glowing CEO Avatar Container with Glowing Aura Backdrop */}
            <div className="relative mb-5 z-10 group">
              {/* Outer Glowing Backdrop Aura */}
              <div className="absolute -inset-3 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 rounded-full blur-xl opacity-70 animate-pulse pointer-events-none"></div>
              <div className="absolute -inset-1.5 bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500 rounded-full blur-md opacity-80 pointer-events-none"></div>

              {/* Main Avatar Frame */}
              <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-full p-1 bg-gradient-to-tr from-indigo-400 via-purple-400 to-pink-400 shadow-2xl shadow-indigo-500/40 flex items-center justify-center relative z-10">
                <div className="w-full h-full rounded-full overflow-hidden border-2 border-slate-900 bg-slate-900 flex items-center justify-center">
                  {agent?.customization?.author_image_url || agent?.customization?.logo_url ? (
                    <img
                      src={mediaUrl(agent.customization.author_image_url || agent.customization.logo_url)}
                      alt="Avatar"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <img src="/bot-avatar.png" alt="Bot Logo" className="w-full h-full object-cover" />
                  )}
                </div>
              </div>

              {/* Bot icon badge attached at bottom center */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-slate-900 border-2 border-indigo-500/80 shadow-lg shadow-indigo-500/50 flex items-center justify-center z-20 overflow-hidden">
                <img src="/bot-avatar.png" alt="Bot Badge" className="w-full h-full object-cover scale-[1.7] transform" />
              </div>
            </div>

            {/* Typography */}
            <div className="text-center max-w-sm mb-6 space-y-1 z-10">
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                Hello !
              </h2>
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-100">
                I am <span className="text-indigo-400 drop-shadow-[0_0_12px_rgba(99,102,241,0.6)]">{agent?.name || "Vijay AI Assistant"}</span>
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-400 font-medium leading-relaxed pt-1.5 px-2">
                {agent?.customization?.welcome_description || "I am here to answer your questions, provide smart solutions and help you get things done."}
              </p>
            </div>

            {/* Sleek Compact Action Cards */}
            <div className="w-full max-w-[280px] sm:max-w-[320px] space-y-2.5 z-10">
              {/* Chat Button (Compact Vibrant Indigo/Purple Gradient) */}
              <button
                type="button"
                onClick={() => {
                  setActiveScreenMode("chat");
                  setIsVoicePageOpen(false);
                }}
                className="w-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:brightness-110 active:scale-[0.99] text-white py-2.5 px-3.5 rounded-xl shadow-lg shadow-indigo-600/30 border border-indigo-400/30 flex items-center justify-between transition-all duration-200 cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
                    <LuMessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-extrabold text-sm leading-tight">Chat</h3>
                    <p className="text-[10px] text-indigo-100 font-medium">Start a conversation</p>
                  </div>
                </div>
                <div className="w-7 h-7 rounded-full bg-white text-indigo-600 flex items-center justify-center shadow group-hover:translate-x-0.5 transition-transform">
                  <LuChevronRight className="w-4 h-4 font-bold" />
                </div>
              </button>

              {/* Talk Button (Compact Glassmorphic Dark Card) */}
              <button
                type="button"
                onClick={() => {
                  setActiveScreenMode("voice");
                  setIsVoicePageOpen(true);
                }}
                className="w-full bg-slate-900/80 backdrop-blur-xl border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/90 active:scale-[0.99] text-slate-100 py-2.5 px-3.5 rounded-xl shadow-lg shadow-slate-950/60 flex items-center justify-between transition-all duration-200 cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                    <LuPhone className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-extrabold text-sm text-slate-100 leading-tight">Talk</h3>
                    <p className="text-[10px] text-slate-400 font-medium">Talk to me</p>
                  </div>
                </div>
                <div className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 group-hover:text-indigo-400 group-hover:bg-indigo-500/20 flex items-center justify-center group-hover:translate-x-0.5 transition-all">
                  <LuChevronRight className="w-4 h-4 font-bold" />
                </div>
              </button>
            </div>
          </div>
        ) : !isRegistered ? (
          /* Registration Form */
          <div className="p-6 space-y-6 max-w-md mx-auto w-full my-auto">
            <div className="text-center">
              <div className="h-16 w-16 bg-indigo-900/40 border border-indigo-500/30 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg overflow-hidden">
                {agent?.customization?.author_image_url || agent?.customization?.logo_url ? (
                  <img src={mediaUrl(agent.customization.author_image_url || agent.customization.logo_url)} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <img src="/bot-avatar.png" alt="Bot Logo" className="h-full w-full object-cover" />
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
                    <img src="/bot-avatar.png" alt="Bot Logo" className={`w-16 h-16 object-cover ${chatLoading ? "animate-bounce" : ""}`} />
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
          <div className="flex-1 min-h-0 flex flex-col justify-between bg-slate-900 text-slate-200 text-sm md:text-base relative overflow-hidden">
            {/* Messages Area */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 space-y-4.5 no-scrollbar scrollbar-none">
              {messages.map((chat, idx) => {
                const isUser = chat.role === "user";
                const userTextColor = getContrastColor(brandColor);
                const textColor = isUser ? userTextColor : "#f1f5f9";
                return (
                  <div key={idx} className={`flex flex-col ${isUser ? "items-end" : "items-start"} transition-all duration-300 transform animate-fade-in`}>
                    <div
                      style={isUser ? { backgroundColor: brandColor, color: textColor } : { backgroundColor: "#1e293b", color: textColor, borderWidth: "1px", borderColor: "#334155" }}
                      className={`max-w-3xl px-4.5 py-2.5 sm:px-5 sm:py-3 rounded-2xl shadow-md leading-normal text-sm sm:text-base font-medium ${
                        isUser ? "rounded-tr-xs" : "rounded-tl-xs"
                      }`}
                    >
                      {chat.attachment && (
                        <div className="flex items-center gap-2 bg-black/15 border border-white/10 px-3 py-1.5 rounded-xl mb-1.5 text-xs text-inherit w-fit">
                          <LuFileText className="h-4 w-4 shrink-0" />
                          <span className="font-bold truncate max-w-[150px] sm:max-w-xs">{chat.attachment.name}</span>
                        </div>
                      )}
                      <div
                        style={{ color: textColor }}
                        className={`prose prose-sm max-w-none text-sm sm:text-base leading-normal [&_p]:my-1 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_ul]:my-1.5 [&_ol]:my-1.5 [&_li]:my-0.5 [&_strong]:text-inherit [&_h1]:text-lg [&_h2]:text-base [&_h3]:text-sm font-medium ${isUser ? "" : "prose-invert"}`}
                      >
                        <ReactMarkdown>{chat.content}</ReactMarkdown>
                      </div>
                    </div>
                    {chat.role === "assistant" && (
                      <button
                        onClick={() => playSpeech(chat.content)}
                        className="text-slate-400 hover:text-indigo-400 mt-1.5 flex items-center gap-1.5 text-xs font-bold transition cursor-pointer px-1 py-0.5"
                        title="Play Audio"
                      >
                        <LuVolume2 className="h-4 w-4 text-indigo-400" /> Read aloud
                      </button>
                    )}
                  </div>
                );
              })}
              {chatLoading && (
                <div className="flex items-center gap-2.5 text-xs text-indigo-400 font-bold animate-pulse p-2">
                  <img src="/bot-avatar.png" alt="Bot" className="h-5 w-5 rounded-full object-cover" /> Thinking response...
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
                  <div className="flex gap-2 overflow-x-auto pb-1 max-w-full no-scrollbar scrollbar-none snap-x touch-pan-x">
                    {availableFaqs.map((qa, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => sendTextMessage(qa.q)}
                        className={`shrink-0 bg-slate-800/90 hover:bg-indigo-600 hover:text-white border border-slate-700/80 text-xs sm:text-sm font-semibold text-slate-200 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl transition-all duration-200 cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98] snap-start ${
                          idx >= 3 ? "hidden md:inline-block" : "inline-block"
                        }`}
                      >
                        {qa.q}
                      </button>
                    ))}
                  </div>
                );
              })()}

              {stagedFile && (
                <div className="bg-slate-800/85 border border-slate-700 p-2.5 rounded-xl mb-2 flex items-center justify-between text-slate-200">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <LuFileText className="h-5 w-5 text-indigo-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate max-w-[200px] sm:max-w-xs">{stagedFile.name}</p>
                      <p className="text-[9px] text-slate-400 font-semibold">Staged Context ({(stagedFile.size / 1024).toFixed(1)} KB)</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStagedFile(null)}
                    className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
                  >
                    <LuX className="h-4 w-4" />
                  </button>
                </div>
              )}

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
                  type="file"
                  id="chat-file-input"
                  className="hidden"
                  onChange={handleFileUpload}
                  accept=".pdf,.doc,.docx,.txt,.csv,image/*,video/*"
                />

                <button
                  type="button"
                  onClick={() => document.getElementById("chat-file-input").click()}
                  disabled={uploadingFile}
                  className="p-2.5 sm:p-3 rounded-xl border border-slate-700 text-slate-400 bg-slate-800 hover:bg-slate-700 hover:text-white transition shrink-0 cursor-pointer shadow-xs relative"
                  title="Attach document, image, or video"
                >
                  <LuPaperclip className="h-4 w-4 sm:h-5 sm:w-5" />
                  {uploadingFile && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-800/80 rounded-xl">
                      <span className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </button>

                <input
                  type="text"
                  placeholder="Ask any question..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 text-sm sm:text-base px-2 sm:px-3 py-1.5 sm:py-2 focus:outline-none min-w-0 font-medium"
                  disabled={chatLoading}
                />

                <button
                  type="submit"
                  disabled={chatLoading || (!chatInput.trim() && !stagedFile)}
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
