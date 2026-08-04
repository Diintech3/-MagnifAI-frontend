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
  LuEyeOff,
  LuStar,
  LuPhone,
  LuMessageCircle,
  LuSearch,
  LuUsers,
  LuUserCheck,
  LuInfo,
  LuX,
  LuPrinter,
  LuDownload
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
export function AppAiAgent({ mode = "business" }) {
  const { token, user } = useAuth();
  const [agents, setAgents] = useState([]);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [viewMode, setViewMode] = useState("list"); // list | dashboard | form
  const [dashboardTab, setDashboardTab] = useState(mode === "personal" ? "playground" : "overview"); // overview | logs | playground
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

  const getAgentChatLink = (agentId, customizationObj) => {
    const defaultLink = `https://vectorize.diintech.com/agent-chat?id=${agentId}`;
    const customLink = customizationObj?.chat_link?.trim();
    if (!customLink) return defaultLink;

    let base = customLink;
    if (!/^https?:\/\//i.test(base)) {
      base = "https://" + base;
    }
    if (base.includes("/agent-chat")) {
      return base.includes("?") ? `${base}&id=${agentId}` : `${base}?id=${agentId}`;
    } else {
      base = base.replace(/\/$/, "");
      return `${base}/agent-chat?id=${agentId}`;
    }
  };

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
  const [selectedContactKey, setSelectedContactKey] = useState("");
  const [contactSearchTerm, setContactSearchTerm] = useState("");
  const [showMetadataModal, setShowMetadataModal] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [sessionActiveTab, setSessionActiveTab] = useState("user_info");
  const [historyLoading, setHistoryLoading] = useState(false);
  const [analyzingSessionId, setAnalyzingSessionId] = useState(null);

  // Feedbacks & Creator Actions State
  const [feedbacks, setFeedbacks] = useState([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false);
  const [sendingAction, setSendingAction] = useState(false);

  // CEO AI Quality & Accuracy Audit State
  const [evaluations, setEvaluations] = useState({});
  const [evalNoteMap, setEvalNoteMap] = useState({});
  const [deviceAnalysis, setDeviceAnalysis] = useState(null);
  const [analyzingDevice, setAnalyzingDevice] = useState(false);
  const [auditSubTab, setAuditSubTab] = useState("feedback"); // "feedback" | "report"
  const [sessionDropOpen, setSessionDropOpen] = useState(false);

  async function runDeviceAnalysis(deviceId) {
    if (!selectedAgentId || !deviceId) return;
    setAnalyzingDevice(true);
    setDeviceAnalysis(null);
    try {
      const data = await api("/api/agents/sessions/analyze-device", {
        method: "POST",
        token,
        body: { agent_id: selectedAgentId, device_id: deviceId }
      });
      toastSuccess("Visitor holistic analysis complete!");
      setDeviceAnalysis(data);
    } catch (e) {
      toastFromError(e, "Failed to analyze visitor device");
    } finally {
      setAnalyzingDevice(false);
    }
  }

  async function handleEvaluateMessage(msgId, status) {
    setEvaluations(prev => ({ ...prev, [msgId]: status }));
    if (status === "good") {
      toastSuccess("Marked AI response as Accurate (Nice Job) 👍");
    } else {
      toastSuccess("Marked AI response as Inaccurate / Needs Prompt Fix 👎");
    }

    try {
      let sessId = msgId;
      let msgDetails = "";
      if (msgId.includes("_")) {
        const [sId, idxStr] = msgId.split("_");
        sessId = sId;
        const idx = parseInt(idxStr, 10);
        const chatMsg = chatHistory[idx];
        const contentSnippet = chatMsg ? chatMsg.content.slice(0, 150) : "";
        msgDetails = ` | Msg Index: ${idx} | Answer: "${contentSnippet}"`;
      }

      await api(`/api/agents/${selectedAgentId}/feedback`, {
        method: "POST",
        token,
        body: {
          feedback_type: "feedback",
          rating: status === "good" ? 5 : 1,
          comment: `Accuracy Evaluation${msgDetails} | Status: ${status === "good" ? "Sahi Jawab" : "Need to improve"}`,
          session_id: sessId,
          device_id: selectedSession?.device_id || ""
        }
      });
      if (selectedAgentId) {
        loadFeedbacks(selectedAgentId);
      }
    } catch (e) {
      console.error("[evaluate-api-error]", e);
    }
  }

  async function handleSaveSessionAudit(sessionId, type = "feedback") {
    const notesText = evalNoteMap[sessionId] || "";

    // Validation for Report
    if (type === "report" && !notesText.trim()) {
      toastSuccess("Please add some report comments/notes first! 🚨");
      return;
    }

    // Validation for Feedback
    if (type === "feedback" && !notesText.trim() && !evaluations[sessionId]) {
      toastSuccess("Please select a star rating or write some assessment notes first! 🎯");
      return;
    }

    try {
      const overallRating = type === "feedback"
        ? (evaluations[sessionId] || 5)
        : undefined;

      const defaultComment = type === "feedback"
        ? `Accuracy Evaluation | Rated: ${overallRating}/5 Stars`
        : "CEO Audit Report";

      await api(`/api/agents/${selectedAgentId}/feedback`, {
        method: "POST",
        token,
        body: {
          feedback_type: type,
          rating: overallRating,
          comment: notesText.trim() || defaultComment,
          session_id: sessionId,
          device_id: selectedSession?.device_id || ""
        }
      });
      if (type === "feedback") {
        toastSuccess("CEO AI Accuracy Audit & Notes saved to external API! 🎯");
      } else {
        toastSuccess("CEO AI Audit Report saved to external API! 🚨");
      }
      if (selectedAgentId) {
        loadFeedbacks(selectedAgentId);
      }
    } catch (e) {
      toastFromError(e, `Failed to save CEO audit ${type} to external API`);
    }
  }

  // Visiting Card Customization State
  const [cardTemplate, setCardTemplate] = useState("gold"); // "gold" | "yellow" | "wave"
  const [cardSide, setCardSide] = useState("front"); // "front" | "back"

  function getCardCanvasBlob(side, cardData) {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      canvas.width = 1050;
      canvas.height = 600;
      const ctx = canvas.getContext("2d");

      // Draw background gradient based on template
      const grad = ctx.createLinearGradient(0, 0, 1050, 600);
      if (cardData.template === "gold") {
        grad.addColorStop(0, "#030712");
        grad.addColorStop(0.5, "#0f172a");
        grad.addColorStop(1, "#1c0d02");
      } else if (cardData.template === "yellow") {
        grad.addColorStop(0, "#facc15");
        grad.addColorStop(0.5, "#eab308");
        grad.addColorStop(1, "#ca8a04");
      } else {
        grad.addColorStop(0, "#090d16");
        grad.addColorStop(0.5, "#1e1b4b");
        grad.addColorStop(1, "#312e81");
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1050, 600);

      // Gold Border (except for Yellow template which has its own borders)
      if (cardData.template !== "yellow") {
        ctx.strokeStyle = "#eab308";
        ctx.lineWidth = 8;
        ctx.strokeRect(15, 15, 1020, 570);
      }

      // Rounded rect helper
      function drawRoundedRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
      }

      // Cover image helper
      function drawCoverImage(ctx, img, x, y, w, h) {
        const imgRatio = img.width / img.height;
        const targetRatio = w / h;
        let sx, sy, sw, sh;
        if (imgRatio > targetRatio) {
          sh = img.height;
          sw = sh * targetRatio;
          sx = (img.width - sw) / 2;
          sy = 0;
        } else {
          sw = img.width;
          sh = sw / targetRatio;
          sx = 0;
          sy = (img.height - sh) / 2;
        }
        ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
      }

      if (side === "front") {
        const promises = [];
        let avatarImg = null;
        let logoImg = null;
        let qrImg = null;

        if (cardData.authorImgUrl) {
          promises.push(
            new Promise((resolveImg) => {
              const img = new Image();
              img.crossOrigin = "anonymous";
              img.onload = () => { avatarImg = img; resolveImg(); };
              img.onerror = () => resolveImg();
              img.src = cardData.authorImgUrl;
            })
          );
        }

        if (cardData.logoImgUrl) {
          promises.push(
            new Promise((resolveImg) => {
              const img = new Image();
              img.crossOrigin = "anonymous";
              img.onload = () => { logoImg = img; resolveImg(); };
              img.onerror = () => resolveImg();
              img.src = cardData.logoImgUrl;
            })
          );
        }

        // Always load QR code on front side
        if (cardData.qrUrl) {
          promises.push(
            new Promise((resolveImg) => {
              const img = new Image();
              img.crossOrigin = "anonymous";
              img.onload = () => { qrImg = img; resolveImg(); };
              img.onerror = () => resolveImg();
              img.src = cardData.qrUrl;
            })
          );
        }

        Promise.all(promises).then(() => {
          renderFront(avatarImg, logoImg, qrImg);
        });

        function renderFront(img, logoImg, qrImg) {
          if (cardData.template === "gold") {
            // Glow accents
            ctx.fillStyle = "rgba(245, 158, 11, 0.03)";
            ctx.beginPath();
            ctx.arc(1050, 0, 350, 0, Math.PI * 2);
            ctx.fill();

            // LEFT SIDE - QR Code (Larger with yellow border & shadow glow)
            if (qrImg) {
              ctx.fillStyle = "#ffffff";
              ctx.strokeStyle = "#eab308";
              ctx.lineWidth = 6;
              drawRoundedRect(ctx, 132, 120, 260, 260, 20);
              ctx.fill();
              ctx.stroke();

              ctx.drawImage(qrImg, 152, 140, 220, 220);
            }

            // RIGHT SIDE - Profile photo or Initials (Larger with thick ring and outer glow ring)
            const photoX = 787;
            const photoY = 175;
            const photoR = 90;

            if (img) {
              // Outer thick glow ring
              ctx.strokeStyle = "rgba(234, 179, 8, 0.25)";
              ctx.lineWidth = 20;
              ctx.beginPath();
              ctx.arc(photoX, photoY, photoR + 10, 0, Math.PI * 2);
              ctx.stroke();

              // Inner solid border ring
              ctx.strokeStyle = "#fbbf24";
              ctx.lineWidth = 6;
              ctx.beginPath();
              ctx.arc(photoX, photoY, photoR, 0, Math.PI * 2);
              ctx.stroke();

              ctx.save();
              ctx.beginPath();
              ctx.arc(photoX, photoY, photoR - 3, 0, Math.PI * 2);
              ctx.clip();
              drawCoverImage(ctx, img, photoX - photoR, photoY - photoR, photoR * 2, photoR * 2);
              ctx.restore();
            } else {
              const circleGrad = ctx.createLinearGradient(photoX - photoR, photoY - photoR, photoX + photoR, photoY + photoR);
              circleGrad.addColorStop(0, "#facc15");
              circleGrad.addColorStop(1, "#f59e0b");
              ctx.fillStyle = circleGrad;
              ctx.beginPath();
              ctx.arc(photoX, photoY, photoR, 0, Math.PI * 2);
              ctx.fill();

              ctx.strokeStyle = "#ffffff";
              ctx.lineWidth = 4;
              ctx.stroke();

              const initial = cardData.userName ? cardData.userName.charAt(0).toUpperCase() : "V";
              ctx.fillStyle = "#020617";
              ctx.font = "bold 80px sans-serif";
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillText(initial, photoX, photoY);
              ctx.textAlign = "left";
              ctx.textBaseline = "alphabetic";
            }

            // RIGHT SIDE - Name and Designation right below the photo
            ctx.textAlign = "center";
            ctx.fillStyle = "#eab308";
            ctx.font = "bold 42px sans-serif";
            ctx.fillText(cardData.userName, photoX, 360);

            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 22px sans-serif";
            ctx.fillText(cardData.designation, photoX, 405);

            // Gradient line under designation
            const lineGrad = ctx.createLinearGradient(photoX - 150, 435, photoX + 150, 435);
            lineGrad.addColorStop(0, "rgba(234, 179, 8, 0)");
            lineGrad.addColorStop(0.5, "rgba(234, 179, 8, 0.8)");
            lineGrad.addColorStop(1, "rgba(234, 179, 8, 0)");
            ctx.strokeStyle = lineGrad;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(photoX - 150, 435);
            ctx.lineTo(photoX + 150, 435);
            ctx.stroke();
            ctx.textAlign = "left";

            // Footer (centered, no ID, gold horizontal line)
            ctx.strokeStyle = "rgba(234, 179, 8, 0.2)";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(40, 495);
            ctx.lineTo(1010, 495);
            ctx.stroke();

            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 18px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("⚡ POWERED BY MAGNIFAI", 525, 545);
            ctx.textAlign = "left";

          } else if (cardData.template === "yellow") {
            // Left Side Photo/Logo Container (vertical split)
            ctx.fillStyle = "#0f172a";
            ctx.fillRect(20, 20, 395, 560);

            if (img) {
              ctx.save();
              ctx.beginPath();
              ctx.rect(20, 20, 395, 560);
              ctx.clip();
              drawCoverImage(ctx, img, 20, 20, 395, 560);
              ctx.restore();
            } else {
              ctx.fillStyle = "#fbbf24";
              ctx.fillRect(20, 20, 395, 560);

              const initial = cardData.userName ? cardData.userName.charAt(0).toUpperCase() : "M";
              ctx.fillStyle = "#0f172a";
              ctx.font = "bold 150px sans-serif";
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillText(initial, 217, 300);
              ctx.textAlign = "left";
              ctx.textBaseline = "alphabetic";
            }

            // Right side crisp white background
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(415, 20, 615, 470);

            // User Name
            ctx.fillStyle = "#0f172a";
            ctx.font = "bold 56px sans-serif";
            ctx.fillText(cardData.userName, 460, 110);

            // Designation badge
            ctx.fillStyle = "#eab308";
            ctx.font = "bold 20px sans-serif";
            const textW = ctx.measureText(cardData.designation).width + 40;
            drawRoundedRect(ctx, 460, 140, textW, 42, 6);
            ctx.fill();

            ctx.fillStyle = "#0f172a";
            ctx.fillText(cardData.designation, 480, 168);

            // Center QR Code
            if (qrImg) {
              ctx.fillStyle = "#ffffff";
              ctx.strokeStyle = "#cbd5e1";
              ctx.lineWidth = 2;
              drawRoundedRect(ctx, 632, 240, 180, 180, 15);
              ctx.fill();
              ctx.stroke();

              ctx.drawImage(qrImg, 647, 255, 150, 150);
            }

            // Footer block (centered, no ID)
            ctx.fillStyle = "#0f172a";
            ctx.fillRect(415, 490, 615, 90);

            ctx.textAlign = "center";
            ctx.fillStyle = "#facc15";
            ctx.font = "bold 18px sans-serif";
            ctx.fillText("⚡ POWERED BY MAGNIFAI", 722, 545);
            ctx.textAlign = "left";

            // Border
            ctx.strokeStyle = "#eab308";
            ctx.lineWidth = 10;
            ctx.strokeRect(15, 15, 1020, 570);

          } else { // template === "wave" -> Restyled layout: QR Code on Front!
            // Draw background (crisp white)
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(20, 20, 1010, 560);

            // Left Side Photo/Logo portrait (split)
            ctx.fillStyle = "#020617";
            ctx.fillRect(20, 20, 420, 560);

            if (img) {
              ctx.save();
              ctx.beginPath();
              ctx.rect(20, 20, 420, 560);
              ctx.clip();
              drawCoverImage(ctx, img, 20, 20, 420, 560);
              ctx.restore();
            } else {
              const avatarGrad = ctx.createLinearGradient(20, 20, 440, 580);
              avatarGrad.addColorStop(0, "#fbbf24");
              avatarGrad.addColorStop(1, "#ca8a04");
              ctx.fillStyle = avatarGrad;
              ctx.fillRect(20, 20, 420, 560);

              const initial = cardData.userName ? cardData.userName.charAt(0).toUpperCase() : "V";
              ctx.fillStyle = "#0f172a";
              ctx.font = "bold 150px sans-serif";
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillText(initial, 230, 300);
              ctx.textAlign = "left";
              ctx.textBaseline = "alphabetic";
            }

            // Draw curved gold border separator outline
            ctx.strokeStyle = "#eab308";
            ctx.lineWidth = 12;
            ctx.beginPath();
            ctx.moveTo(375, 20);
            ctx.quadraticCurveTo(435, 300, 375, 580);
            ctx.stroke();

            // Draw crisp white background overlay (covering the right side completely, starting from the curve)
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.moveTo(375, 20);
            ctx.quadraticCurveTo(435, 300, 375, 580);
            ctx.lineTo(1030, 580);
            ctx.lineTo(1030, 20);
            ctx.closePath();
            ctx.fill();

            // Right side - Top Logo (shifted down and made larger)
            if (logoImg) {
              const lw = logoImg.width;
              const lh = logoImg.height;
              const ratio = Math.min(280 / lw, 110 / lh);
              const dw = lw * ratio;
              const dh = lh * ratio;
              ctx.drawImage(logoImg, 725 - dw / 2, 105 - dh / 2, dw, dh);
            } else {
              ctx.fillStyle = "#eab308";
              ctx.font = "bold 24px monospace";
              ctx.textAlign = "center";
              ctx.fillText("★ MAGNIFAI ★", 725, 110);
              ctx.textAlign = "left";
            }

            // Right side - Middle: Name and Designation Badge
            ctx.strokeStyle = "#fcd34d";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(600, 238);
            ctx.lineTo(650, 238);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(800, 238);
            ctx.lineTo(850, 238);
            ctx.stroke();

            ctx.fillStyle = "#d97706";
            ctx.font = "bold italic 22px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("Hello I am", 725, 245);

            // User Name
            ctx.fillStyle = "#0f172a";
            ctx.font = "bold 48px sans-serif";
            ctx.fillText(cardData.userName, 725, 315);

            // Designation Badge
            const badgeText = "• " + cardData.designation.toUpperCase() + " •";
            ctx.font = "bold 20px sans-serif";
            const textWidth = ctx.measureText(badgeText).width;
            const badgeW = textWidth + 40;
            const badgeH = 40;
            const badgeX = 725 - badgeW / 2;
            const badgeY = 355;

            ctx.fillStyle = "#fef9c3";
            ctx.strokeStyle = "rgba(234, 179, 8, 0.4)";
            ctx.lineWidth = 2;
            drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, 20);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = "#ca8a04";
            ctx.fillText(badgeText, 725, 382);

            // Right side - Bottom: QR Code scanner container and image (moved down)
            if (qrImg) {
              ctx.fillStyle = "#ffffff";
              ctx.strokeStyle = "#eab308";
              ctx.lineWidth = 4;
              drawRoundedRect(ctx, 640, 420, 170, 170, 15);
              ctx.fill();
              ctx.stroke();

              ctx.drawImage(qrImg, 655, 435, 140, 140);
            }

            // Reset alignments
            ctx.textAlign = "left";
            ctx.textBaseline = "alphabetic";

            // Border
            ctx.strokeStyle = "#eab308";
            ctx.lineWidth = 10;
            ctx.strokeRect(15, 15, 1020, 570);
          }

          canvas.toBlob((blob) => resolve(blob), "image/png");
        }

      } else {
        // Back Side
        const promises = [];
        let avatarImg = null;
        let logoImg = null;
        let qrImg = null;

        if (cardData.authorImgUrl) {
          promises.push(
            new Promise((resolveImg) => {
              const img = new Image();
              img.crossOrigin = "anonymous";
              img.onload = () => { avatarImg = img; resolveImg(); };
              img.onerror = () => resolveImg();
              img.src = cardData.authorImgUrl;
            })
          );
        }

        if (cardData.logoImgUrl) {
          promises.push(
            new Promise((resolveImg) => {
              const img = new Image();
              img.crossOrigin = "anonymous";
              img.onload = () => { logoImg = img; resolveImg(); };
              img.onerror = () => resolveImg();
              img.src = cardData.logoImgUrl;
            })
          );
        }

        if (cardData.template !== "wave" && cardData.qrUrl) {
          promises.push(
            new Promise((resolveImg) => {
              const img = new Image();
              img.crossOrigin = "anonymous";
              img.onload = () => { qrImg = img; resolveImg(); };
              img.onerror = () => resolveImg();
              img.src = cardData.qrUrl;
            })
          );
        }

        Promise.all(promises).then(() => {
          renderBack(avatarImg, logoImg, qrImg);
        });

        function renderBack(img, logoImg, qrImg) {
          if (cardData.template === "wave") {
            // Draw background (crisp white)
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, 1050, 600);

            // Top Logo centered (shifted down and made larger)
            if (logoImg) {
              const lw = logoImg.width;
              const lh = logoImg.height;
              const ratio = Math.min(280 / lw, 110 / lh);
              const dw = lw * ratio;
              const dh = lh * ratio;
              ctx.drawImage(logoImg, 525 - dw / 2, 105 - dh / 2, dw, dh);
            } else {
              ctx.fillStyle = "#eab308";
              ctx.font = "bold 24px monospace";
              ctx.textAlign = "center";
              ctx.fillText("★ MAGNIFAI ★", 525, 110);
              ctx.textAlign = "left";
            }

            // Middle Info (Name and Designation) centered (shifted down)
            ctx.strokeStyle = "#fcd34d";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(400, 238);
            ctx.lineTo(450, 238);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(600, 238);
            ctx.lineTo(650, 238);
            ctx.stroke();

            ctx.fillStyle = "#d97706";
            ctx.font = "bold italic 22px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("Hello I am", 525, 245);

            // User Name
            ctx.fillStyle = "#0f172a";
            ctx.font = "bold 48px sans-serif";
            ctx.fillText(cardData.userName, 525, 315);

            // Designation Badge
            const badgeText = "• " + cardData.designation.toUpperCase() + " •";
            ctx.font = "bold 20px sans-serif";
            const textWidth = ctx.measureText(badgeText).width;
            const badgeW = textWidth + 40;
            const badgeH = 40;
            const badgeX = 525 - badgeW / 2;
            const badgeY = 355;

            ctx.fillStyle = "#fef9c3";
            ctx.strokeStyle = "rgba(234, 179, 8, 0.4)";
            ctx.lineWidth = 2;
            drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, 20);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = "#ca8a04";
            ctx.fillText(badgeText, 525, 382);

            // Footer Text
            ctx.fillStyle = "#f59e0b";
            ctx.font = "bold 18px sans-serif";
            ctx.fillText("⚡ POWERED BY MAGNIFAI", 525, 535);

            // Reset alignments
            ctx.textAlign = "left";
            ctx.textBaseline = "alphabetic";

            // Border
            ctx.strokeStyle = "#eab308";
            ctx.lineWidth = 10;
            ctx.strokeRect(15, 15, 1020, 570);

          } else {
            // Draw background based on template (Gold/Yellow)
            ctx.fillStyle = "#020617";
            ctx.fillRect(0, 0, 1050, 600);
            
            if (cardData.template === "gold") {
              ctx.strokeStyle = "#f59e0b";
              ctx.lineWidth = 10;
              ctx.strokeRect(15, 15, 1020, 570);

              // Name (shifted up)
              ctx.fillStyle = "#fde047";
              ctx.font = "bold 48px sans-serif";
              ctx.fillText(cardData.userName, 525, 200);

              // Title (shifted up)
              ctx.fillStyle = "#facc15";
              ctx.font = "bold 26px sans-serif";
              ctx.fillText(cardData.designation, 525, 270);

              // Divider
              ctx.strokeStyle = "#1e293b";
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(60, 490);
              ctx.lineTo(990, 490);
              ctx.stroke();

              // Footer Text
              ctx.fillStyle = "#fbbf24";
              ctx.font = "bold 18px sans-serif";
              ctx.fillText("⚡ POWERED BY MAGNIFAI", 525, 545);

            } else { // yellow template
              ctx.strokeStyle = "#eab308";
              ctx.lineWidth = 10;
              ctx.strokeRect(15, 15, 1020, 570);

              // ★ MAGNIFAI ★ Emblem
              ctx.fillStyle = "#eab308";
              ctx.font = "bold 24px monospace";
              ctx.textAlign = "center";
              ctx.fillText("★ MAGNIFAI ★", 525, 120);

              // Name
              ctx.fillStyle = "#ffffff";
              ctx.font = "bold 48px sans-serif";
              ctx.fillText(cardData.userName, 525, 245);

              // Designation Badge
              const badgeText = "• " + cardData.designation.toUpperCase() + " •";
              ctx.font = "bold 20px sans-serif";
              const textWidth = ctx.measureText(badgeText).width;
              const badgeW = textWidth + 40;
              const badgeH = 40;
              const badgeX = 525 - badgeW / 2;
              const badgeY = 295;

              ctx.fillStyle = "#fef9c3";
              ctx.strokeStyle = "rgba(234, 179, 8, 0.4)";
              ctx.lineWidth = 2;
              drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, 20);
              ctx.fill();
              ctx.stroke();

              ctx.fillStyle = "#ca8a04";
              ctx.fillText(badgeText, 525, 322);

              // Footer Text
              ctx.fillStyle = "#facc15";
              ctx.font = "bold 18px sans-serif";
              ctx.fillText("⚡ POWERED BY MAGNIFAI", 525, 535);
            }
          }

          canvas.toBlob((blob) => resolve(blob), "image/png");
        }
      }
    });
  }

  async function handleShareCard(agentId) {
    const userName = user?.name || "CEO";
    const targetAgentId = agentId || selectedAgentId;
    const targetAgent = agents.find(a => (a._id === targetAgentId || a.agent_id === targetAgentId || a.id === targetAgentId));
    const cardUrl = getAgentChatLink(targetAgentId, targetAgent?.customization);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(cardUrl)}`;
    
    const authorImg = targetAgent?.customization?.author_image_url || targetAgent?.customization?.logo_url;
    const authorImgUrl = authorImg ? mediaUrl(authorImg) : "";
    const brandLogo = targetAgent?.customization?.logo_url || custLogoUrl;
    const logoImgUrl = brandLogo ? mediaUrl(brandLogo) : "";
    
    const cardData = {
      userName,
      template: cardTemplate,
      qrUrl,
      chatLink: cardUrl,
      authorImgUrl,
      logoImgUrl,
      agentName: targetAgent?.name || "AI Smart Agent",
      agentCategory: targetAgent?.category || "Voice & Chat Assistant",
      agentId: targetAgentId,
      designation: user?.designation || "CEO & Founder",
      companyName: user?.company || "DIIN TECHNOLOGIES",
    };

    try {
      // 1. Generate Front & Back Blobs
      const frontBlob = await getCardCanvasBlob("front", cardData);
      const backBlob = await getCardCanvasBlob("back", cardData);

      const cleanName = userName.replace(/\s+/g, "_");
      const frontFile = new File([frontBlob], `Visiting_Card_Front_${cleanName}.png`, { type: "image/png" });
      const backFile = new File([backBlob], `Visiting_Card_Back_${cleanName}.png`, { type: "image/png" });

      // 2. Try native file sharing with images + link
      if (navigator.canShare && navigator.canShare({ files: [frontFile, backFile] })) {
        await navigator.share({
          title: `${userName} - AI Agent Visiting Card`,
          text: `Connect & chat with ${userName}'s AI Assistant:`,
          url: cardUrl,
          files: [frontFile, backFile]
        });
        toastSuccess("Visiting Card Front/Back Images & URL shared!");
        return;
      }
    } catch (e) {
      console.warn("Native image file share dismissed or unsupported", e);
    }

    // Fallback if browser doesn't support direct image file sharing in Web Share API
    const shareMsg = `🎴 *${userName}'s Official AI Agent Visiting Card*\n\nConnect & chat with ${userName}'s AI Assistant directly here:\n👇\n${cardUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${userName} - AI Agent Visiting Card`,
          text: `Connect & chat with ${userName}'s AI Assistant:`,
          url: cardUrl
        });
        toastSuccess("Visiting Card link shared!");
        return;
      } catch (err) { }
    }

    navigator.clipboard.writeText(shareMsg);
    toastSuccess("Visiting Card details & Chat URL copied! Ready to paste & share on WhatsApp.");
  }

  async function downloadCardSide(side, cardData) {
    const blob = await getCardCanvasBlob(side, cardData);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `Visiting_Card_${side.toUpperCase()}_${cardData.userName.replace(/\s+/g, "_")}.png`;
    link.href = url;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  async function handleDownloadCard() {
    const userName = user?.name || "CEO";
    const targetAgent = selectedAgent || agents.find(a => (a._id === selectedAgentId || a.agent_id === selectedAgentId || a.id === selectedAgentId));
    const chatLink = getAgentChatLink(selectedAgentId, targetAgent?.customization);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(chatLink)}`;
    
    const authorImg = targetAgent?.customization?.author_image_url || targetAgent?.customization?.logo_url;
    const authorImgUrl = authorImg ? mediaUrl(authorImg) : "";
    const brandLogo = targetAgent?.customization?.logo_url || custLogoUrl;
    const logoImgUrl = brandLogo ? mediaUrl(brandLogo) : "";
    
    const cardData = {
      userName,
      template: cardTemplate,
      qrUrl,
      chatLink,
      authorImgUrl,
      logoImgUrl,
      agentName: targetAgent?.name || "AI Smart Agent",
      agentCategory: targetAgent?.category || "Voice & Chat Assistant",
      agentId: selectedAgentId,
      designation: user?.designation || "CEO & Founder",
      companyName: user?.company || "DIIN TECHNOLOGIES",
    };

    await downloadCardSide("front", cardData);

    setTimeout(async () => {
      await downloadCardSide("back", cardData);
      toastSuccess("Downloaded Front & Back PNG Cards directly to your Downloads folder! 🎴");
    }, 500);
  }

  const [contactFilter, setContactFilter] = useState("all"); // "all" | "whatsapp" | "web"

  // Compute grouped contact list by identity key (Device ID > Phone > Real Name)
  const allContacts = (() => {
    if (!Array.isArray(sessions) || sessions.length === 0) return [];
    const map = {};

    // Pass 1: Resolve persistent names and phone numbers per device_id
    const resolvedIdentities = {};
    sessions.forEach(sess => {
      const devKey = sess.device_id || sess.session_id;
      if (!resolvedIdentities[devKey]) {
        resolvedIdentities[devKey] = { name: "Anonymous Visitor", phone: "None" };
      }
      if (sess.user_name && sess.user_name !== "Anonymous Visitor" && !sess.user_name.includes("?")) {
        resolvedIdentities[devKey].name = sess.user_name;
      }
      if (sess.phone_number && sess.phone_number !== "None" && !sess.phone_number.includes("?")) {
        resolvedIdentities[devKey].phone = sess.phone_number;
      }
    });

    // Pass 2: Group sessions under resolved visitor identities
    sessions.forEach(sess => {
      const devKey = sess.device_id || sess.session_id;
      const identity = resolvedIdentities[devKey] || {};
      const realName = (sess.user_name && sess.user_name !== "Anonymous Visitor") ? sess.user_name : identity.name;
      const realPhone = (sess.phone_number && sess.phone_number !== "None") ? sess.phone_number : identity.phone;

      let key = sess.device_id;
      if (!key) {
        if (realPhone && realPhone !== "None") key = `phone_${realPhone}`;
        else if (realName && realName !== "Anonymous Visitor") key = `name_${realName}`;
        else key = sess.session_id;
      }

      if (!map[key]) {
        map[key] = {
          key,
          device_id: sess.device_id || key,
          user_name: realName || "Anonymous Visitor",
          phone_number: realPhone || "None",
          device_name: sess.device_name || "Device",
          last_active: sess.created_at || Date.now(),
          visit_count: 0,
          sessions: []
        };
      }

      const enrichedSess = {
        ...sess,
        user_name: realName || sess.user_name || "Anonymous Visitor",
        phone_number: realPhone || sess.phone_number || "None"
      };

      map[key].sessions.push(enrichedSess);
      map[key].visit_count = map[key].sessions.length;

      if (realName && realName !== "Anonymous Visitor") {
        map[key].user_name = realName;
      }
      if (realPhone && realPhone !== "None") {
        map[key].phone_number = realPhone;
      }
      if (new Date(sess.created_at) > new Date(map[key].last_active)) {
        map[key].last_active = sess.created_at;
      }
    });

    // Sort sessions in each contact group by created_at desc (latest first)
    Object.values(map).forEach(group => {
      group.sessions.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    });

    return Object.values(map).sort((a, b) => new Date(b.last_active) - new Date(a.last_active));
  })();

  const filteredSearchContacts = (() => {
    let list = allContacts;
    if (contactSearchTerm.trim()) {
      const q = contactSearchTerm.toLowerCase();
      list = list.filter(c => c.user_name.toLowerCase().includes(q) || c.phone_number.toLowerCase().includes(q) || c.device_name.toLowerCase().includes(q) || String(c.device_id).toLowerCase().includes(q));
    }
    return list;
  })();

  const whatsappCount = allContacts.filter(c => String(c.device_name).toLowerCase().includes("whatsapp")).length;
  const webCount = allContacts.length - whatsappCount;
  const totalCount = allContacts.length;

  const groupedContacts = (() => {
    let list = filteredSearchContacts;
    if (contactFilter === "whatsapp") {
      list = list.filter(c => String(c.device_name).toLowerCase().includes("whatsapp"));
    } else if (contactFilter === "web") {
      list = list.filter(c => !String(c.device_name).toLowerCase().includes("whatsapp"));
    }
    return list;
  })();

  function handleContactSelect(contact) {
    setSelectedContactKey(contact.key);
    setDeviceAnalysis(null);
    if (contact.sessions && contact.sessions.length > 0) {
      handleSessionSelect(contact.sessions[0]);
    }
  }

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
      const rawList = data || [];
      const list = rawList.filter(ag => {
        if (mode === "personal") {
          return ag.category === "root_assistant";
        } else {
          return ag.category !== "root_assistant";
        }
      });
      setAgents(list);
      if (list.length > 0) {
        if (selectFirst || !selectedAgentId) {
          setSelectedAgentId(list[0].agent_id);
        }
      } else {
        setSelectedAgentId("");
        setSelectedAgent(null);
        setViewMode("list");
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
      let rawData = await api(`/api/agents/${id}/user-sessions`, { token }).catch(() => null);
      let flatList = [];
      if (rawData && Array.isArray(rawData) && rawData.length > 0 && rawData[0].sessions) {
        rawData.forEach(userGroup => {
          if (Array.isArray(userGroup.sessions)) {
            userGroup.sessions.forEach(s => {
              flatList.push({
                ...s,
                device_id: userGroup.device_id,
                device_name: userGroup.device_name || s.device_name || "Device",
                user_name: userGroup.user_name || s.user_name || "Anonymous Visitor",
                phone_number: userGroup.phone_number || s.phone_number || "None",
                visit_count: userGroup.total_visits || userGroup.sessions.length
              });
            });
          }
        });
      } else {
        flatList = await api(`/api/agents/${id}/sessions`, { token }) || [];
      }
      setSessions(flatList || []);
      if (Array.isArray(flatList) && flatList.length > 0) {
        handleSessionSelect(flatList[0]);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function loadFeedbacks(id) {
    if (!id) return;
    setLoadingFeedbacks(true);
    try {
      const data = await api(`/api/agents/${id}/feedback`, { token });
      const filtered = (data || []).filter(item => {
        const comment = (item.comment || "").toLowerCase();
        const email = (item.user_email || "").toLowerCase();
        const name = (item.user_name || "").toLowerCase();
        const isCeoEmail = email === "vijay.wiz@gmail.com" || email === "ceo@admin.com";
        const isAccuracyEval = comment.includes("accuracy evaluation");
        const isCeoAuditName = name.includes("ceo audit");
        return !isCeoEmail && !isAccuracyEval && !isCeoAuditName;
      });
      setFeedbacks(filtered);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingFeedbacks(false);
    }
  }

  async function handleSendAction(sessId, actionType) {
    if (!sessId) return;
    setSendingAction(true);
    try {
      const phoneNum = selectedSession?.phone_number && selectedSession.phone_number !== "None" ? selectedSession.phone_number : "9876543210";
      const customMsg = actionType === "whatsapp" ? "Connect on WhatsApp" : "Call Us Now";
      const data = await api(`/api/agents/sessions/${sessId}/send-action`, {
        method: "POST",
        token,
        body: {
          action_type: actionType,
          phone_number: phoneNum,
          message: customMsg
        }
      });
      toastSuccess(`Action button (${actionType.toUpperCase()}) sent to visitor session!`);
      const updatedAction = data?.action_button || { action_type: actionType, phone_number: phoneNum, message: customMsg };
      setSelectedSession(prev => ({ ...prev, action_button: updatedAction }));
      setSessions(prev => prev.map(s => s.session_id === sessId ? { ...s, action_button: updatedAction } : s));
    } catch (e) {
      toastFromError(e, "Failed to send action button");
    } finally {
      setSendingAction(false);
    }
  }

  async function handleClearAction(sessId) {
    if (!sessId) return;
    setSendingAction(true);
    try {
      await api(`/api/agents/sessions/${sessId}/clear-action`, {
        method: "DELETE",
        token
      });
      toastSuccess("Action button cleared from visitor chat.");
      setSelectedSession(prev => ({ ...prev, action_button: null }));
      setSessions(prev => prev.map(s => s.session_id === sessId ? { ...s, action_button: null } : s));
    } catch (e) {
      toastFromError(e, "Failed to clear action button");
    } finally {
      setSendingAction(false);
    }
  }

  useEffect(() => {
    loadAgents(true);
  }, [token, mode]);

  useEffect(() => {
    if (selectedAgentId) {
      loadAgentDetails(selectedAgentId);
      loadSessions(selectedAgentId);
      loadFeedbacks(selectedAgentId);
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
          const fakeEvent = { preventDefault: () => { } };
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
    try {
      const nameVal = (formName || "").trim();
      const descVal = (formDesc || "").trim();
      const catVal = (formCategory || "").trim();
      const persVal = (formPersonality || "").trim();
      const startMsgVal = (formStartingMsg || "").trim();
      const sysApiVal = (sysApiKey || "").trim();
      const sysPromptVal = (sysPrompt || "").trim();
      const voiceApiVal = (voiceApiKey || "").trim();
      const logoUrlVal = (custLogoUrl || "").trim();
      const colorVal = (custColor || "").trim();
      const chatLinkVal = (custChatLink || "").trim();
      const authorImgVal = (custAuthorImage || "").trim();

      if (!nameVal) {
        toastFromError(new Error("Agent name is required"));
        setFormActiveTab("info");
        return;
      }

      const payload = {
        name: nameVal,
        description: descVal,
        category: catVal,
        personality: persVal,
        starting_message: startMsgVal,
        system_config: {
          provider: sysProvider,
          model: sysModel,
          ...(sysApiVal ? { api_key: sysApiVal } : {}),
          ...(sysPromptVal ? { system_prompt: sysPromptVal } : {})
        },
        voice_config: {
          provider: voiceProvider,
          ...(voiceName ? { voice_name: voiceName } : {}),
          ...(voiceApiVal ? { api_key: voiceApiVal } : {})
        },
        customization: {
          ...(logoUrlVal ? { logo_url: logoUrlVal } : {}),
          ...(colorVal ? { color: colorVal } : {}),
          ...(chatLinkVal ? { chat_link: chatLinkVal } : {}),
          ...(authorImgVal ? { author_image_url: authorImgVal } : {}),
          qa_pairs: (qaPairs || []).filter(pair => pair && pair.q && pair.a && pair.q.trim() && pair.a.trim())
        },
        datastores: []
      };
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

      {viewMode === "list" ? (
        /* ==================== VIEW 1: LIST MODE ==================== */
        <div>
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-4 mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-indigo-900">
                <LuBot className="h-6 sm:h-7 w-6 sm:w-7 text-indigo-600 animate-pulse" />
                {mode === "personal" ? "Personal AI Assistant" : "AI Assistant / Agents"}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
                {mode === "personal" 
                  ? "Your root Personal AI Copilot with system-wide controls." 
                  : "Select or create an AI Agent for your business."}
              </p>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {agents.map((agent) => (
              <div
                key={agent.agent_id}
                onClick={() => {
                  setSelectedAgentId(agent.agent_id);
                  setViewMode("dashboard");
                }}
                className="border border-slate-200 bg-white rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-indigo-300 transition cursor-pointer flex flex-col justify-between min-h-[160px]"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 text-indigo-900 font-extrabold text-sm sm:text-base">
                    <div className="flex items-center gap-2">
                      <LuBot className="h-5 w-5 text-indigo-600" />
                      {agent.name}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAgentDelete(agent.agent_id);
                      }}
                      className="text-red-500 hover:text-red-750 hover:bg-red-50 p-1.5 rounded-lg transition cursor-pointer"
                      title="Delete Agent"
                    >
                      <LuTrash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {agent.description || "No description provided."}
                  </p>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-slate-50 mt-4">
                  <span className="text-[10px] text-indigo-700 bg-indigo-50 font-bold px-2 py-0.5 rounded capitalize">
                    {agent.category || "Voice & Chat"}
                  </span>
                  <span className="text-xs text-indigo-600 font-bold hover:underline">
                    Manage Agent &rarr;
                  </span>
                </div>
              </div>
            ))}

            {mode !== "personal" && (
              /* Create New Agent Card */
              <div
                onClick={enterCreateMode}
                className="border-2 border-dashed border-slate-300 bg-slate-50/50 rounded-2xl p-6 hover:bg-slate-50 hover:border-indigo-400 transition cursor-pointer flex flex-col items-center justify-center min-h-[160px] text-center group"
              >
                <div className="h-10 w-10 rounded-full bg-slate-200 group-hover:bg-indigo-50 flex items-center justify-center text-slate-600 group-hover:text-indigo-600 transition mb-3">
                  <LuPlus className="h-5 w-5" />
                </div>
                <span className="font-extrabold text-slate-800 text-xs sm:text-sm group-hover:text-indigo-600 transition">
                  + Create New Agent
                </span>
                <p className="text-[10px] text-slate-400 font-semibold mt-1">Configure another AI chatbot</p>
              </div>
            )}
          </div>
        </div>
      ) : viewMode === "dashboard" ? (
        /* ==================== VIEW 2: DASHBOARD MODE ==================== */
        <div>
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-4 mb-4 sm:mb-6 gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className="flex items-center gap-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs py-2 px-3 rounded-lg shadow-sm transition cursor-pointer shrink-0"
              >
                <LuArrowLeft className="h-4 w-4" /> Back to Agents
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-indigo-900">
                  <LuBot className="h-6 sm:h-7 w-6 sm:w-7 text-indigo-600" />
                  {selectedAgent?.name || "AI Assistant / Agent"}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">Create, customize, and manage your business AI agents.</p>
              </div>
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
              { id: "playground", label: mode === "personal" ? "Personal AI Copilot" : "Test Chat Room", icon: LuMessageSquare }
            ].map((tab) => {
              const Icon = tab.icon;
              const active = dashboardTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setDashboardTab(tab.id)}
                  className={`flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 border-b-2 font-bold text-xs sm:text-sm text-nowrap shrink-0 transition-colors duration-150 ${active
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
                {/* 2. LEADS AND VISITOR CHATS TAB (WhatsApp-Style Visitor Contact CRM) */}
                {dashboardTab === "logs" && (
                  <div>
                    {!selectedAgentId ? (
                      <p className="text-slate-400 text-center py-12">Please create an agent first to view logs.</p>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[600px]">

                        {/* ==================== LEFT PANEL: WHATSAPP-STYLE VISITOR CONTACTS LIST ==================== */}
                        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col h-full overflow-hidden">
                          {/* Header & Search Bar */}
                          <div className="p-3 border-b border-slate-200 bg-slate-50/70 space-y-2.5">
                            <div className="flex justify-between items-center">
                              <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                                <LuUsers className="h-4 w-4 text-indigo-600" /> Visitor Contacts ({groupedContacts.length})
                              </h3>
                              <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full">
                                {sessions.length} Total
                              </span>
                            </div>

                            <div className="relative">
                              <LuSearch className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                              <input
                                type="text"
                                placeholder="Search contact or phone..."
                                value={contactSearchTerm}
                                onChange={(e) => setContactSearchTerm(e.target.value)}
                                className="w-full bg-white border border-slate-200 text-slate-700 text-xs rounded-lg pl-8 pr-3 py-1.5 shadow-2xs focus:ring-indigo-500 focus:border-indigo-500"
                              />
                            </div>

                            {/* Segment Switch to toggle WhatsApp vs Web Agent */}
                            <div className="flex bg-slate-150 p-0.5 rounded-lg text-[9.5px] font-extrabold">
                              <button
                                type="button"
                                onClick={() => setContactFilter("all")}
                                className={`flex-1 py-1 rounded-md transition text-center cursor-pointer ${contactFilter === "all" ? "bg-white text-indigo-600 shadow-3xs" : "text-slate-500 hover:text-slate-800"}`}
                              >
                                All ({totalCount})
                              </button>
                              <button
                                type="button"
                                onClick={() => setContactFilter("whatsapp")}
                                className={`flex-1 py-1 rounded-md transition text-center cursor-pointer ${contactFilter === "whatsapp" ? "bg-white text-emerald-650 shadow-3xs" : "text-slate-500 hover:text-slate-800"}`}
                              >
                                WhatsApp ({whatsappCount})
                              </button>
                              <button
                                type="button"
                                onClick={() => setContactFilter("web")}
                                className={`flex-1 py-1 rounded-md transition text-center cursor-pointer ${contactFilter === "web" ? "bg-white text-indigo-650 shadow-3xs" : "text-slate-500 hover:text-slate-800"}`}
                              >
                                Web Agent ({webCount})
                              </button>
                            </div>
                          </div>

                          {/* Contact Items List */}
                          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 no-scrollbar scrollbar-none">
                            {groupedContacts.length > 0 ? (
                              groupedContacts.map((contact) => {
                                const isSelected = selectedContactKey === contact.key || (selectedSession && (selectedSession.device_id === contact.device_id || selectedSession.session_id === contact.key));
                                const isRealName = contact.user_name !== "Anonymous Visitor";

                                return (
                                  <div
                                    key={contact.key}
                                    onClick={() => handleContactSelect(contact)}
                                    className={`p-3 cursor-pointer transition flex items-start gap-2.5 ${isSelected ? "bg-indigo-50/70 border-l-4 border-l-indigo-600 shadow-2xs" : "hover:bg-slate-50"
                                      }`}
                                  >
                                    {/* Avatar circle */}
                                    <div className={`h-8 w-8 rounded-full shrink-0 flex items-center justify-center font-extrabold text-xs shadow-2xs ${String(contact.device_name).toLowerCase().includes("whatsapp")
                                      ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                      : isRealName
                                        ? "bg-indigo-600 text-white"
                                        : "bg-slate-200 text-slate-600"
                                      }`}>
                                      {String(contact.device_name).toLowerCase().includes("whatsapp") ? (
                                        <LuMessageCircle className="h-4 w-4" />
                                      ) : isRealName ? (
                                        contact.user_name.charAt(0).toUpperCase()
                                      ) : (
                                        <LuUsers className="h-3.5 w-3.5" />
                                      )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                      <div className="flex justify-between items-baseline mb-0.5">
                                        <h4 className={`text-xs truncate font-bold ${isRealName ? "text-slate-900" : "text-slate-650"}`}>
                                          {contact.user_name}
                                        </h4>
                                        <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded shrink-0 ml-1 ${String(contact.device_name).toLowerCase().includes("whatsapp")
                                          ? "bg-emerald-100 text-emerald-800"
                                          : "bg-indigo-100 text-indigo-800"
                                          }`}>
                                          {contact.visit_count} {contact.visit_count === 1 ? "Visit" : "Visits"}
                                        </span>
                                      </div>

                                      <p className="text-[10px] font-bold text-slate-500 truncate mb-0.5">
                                        Phone: {contact.phone_number}
                                      </p>

                                      {contact.device_id && (
                                        <p className="text-[9.5px] font-mono text-slate-450 truncate mb-0.5" title={contact.device_id}>
                                          ID: {contact.device_id}
                                        </p>
                                      )}

                                      <div className="flex justify-between items-center text-[9px] text-slate-400">
                                        <span className={String(contact.device_name).toLowerCase().includes("whatsapp") ? "text-emerald-600 font-bold flex items-center gap-1" : "truncate"}>
                                          {String(contact.device_name).toLowerCase().includes("whatsapp") && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>}
                                          {contact.device_name}
                                        </span>
                                        <span>{new Date(contact.last_active).toLocaleDateString()}</span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <p className="text-slate-400 text-xs text-center py-12">No visitor contacts found.</p>
                            )}
                          </div>
                        </div>

                        {/* ==================== RIGHT PANEL: SELECTED VISITOR WORKSPACE & TIMELINE ==================== */}
                        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col h-full overflow-hidden">
                          {!selectedSession ? (
                            <div className="flex-1 flex flex-col justify-center items-center text-center p-8">
                              <LuUsers className="h-12 w-12 text-slate-300 mb-3" />
                              <h4 className="font-bold text-slate-700 text-sm mb-1">No Visitor Selected</h4>
                              <p className="text-xs text-slate-400 max-w-xs">Select a contact from the left list to view conversation history, AI analysis, and action controls.</p>
                            </div>
                          ) : (
                            <div className="flex flex-col h-full min-h-0 space-y-3">

                              {/* Visitor Contact Header: Name Tap for Metadata Popup + Action Control + Timeline */}
                              <div className="flex flex-wrap items-center justify-between gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200/80 shrink-0">
                                <div className="flex items-center gap-2.5">
                                  {/* Tap Name to Open Metadata Modal */}
                                  <button
                                    type="button"
                                    onClick={() => setShowMetadataModal(true)}
                                    title="Click to view full visitor metadata"
                                    className="flex items-center gap-2.5 text-left group cursor-pointer hover:bg-white p-1 rounded-lg transition"
                                  >
                                    <div className="h-9 w-9 rounded-full bg-indigo-600 text-white font-extrabold flex items-center justify-center text-xs shadow-2xs">
                                      {selectedSession.user_name !== "Anonymous Visitor" ? selectedSession.user_name.charAt(0).toUpperCase() : <LuUsers className="h-4 w-4" />}
                                    </div>
                                    <div>
                                      <h3 className="font-extrabold text-slate-900 text-xs group-hover:text-indigo-600 flex items-center gap-1.5">
                                        {selectedSession.user_name || "Anonymous Visitor"}
                                        <LuInfo className="h-3.5 w-3.5 text-indigo-500" />
                                      </h3>
                                      <p className="text-[10px] text-slate-500 font-medium">
                                        Phone: <span className="font-bold text-slate-800">{selectedSession.phone_number || "None"}</span> • {selectedSession.device_name || "Device"}
                                      </p>
                                    </div>
                                  </button>
                                </div>

                                <div className="flex items-center gap-2">
                                  {/* Compact Creator Live Action Controls */}
                                  {selectedSession.action_button ? (
                                    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg text-[10px] text-emerald-900 font-bold">
                                      <span>Active: {selectedSession.action_button.action_type === "whatsapp" ? "WhatsApp" : "Call"}</span>
                                      <button
                                        type="button"
                                        onClick={() => handleClearAction(selectedSession.session_id)}
                                        disabled={sendingAction}
                                        className="text-red-600 hover:text-red-800 underline font-bold cursor-pointer"
                                      >
                                        Clear
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => handleSendAction(selectedSession.session_id, "call")}
                                        disabled={sendingAction}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] py-1 px-2.5 rounded-md transition flex items-center gap-1 cursor-pointer shadow-3xs"
                                      >
                                        <LuPhone className="h-3 w-3" /> Call
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleSendAction(selectedSession.session_id, "whatsapp")}
                                        disabled={sendingAction}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] py-1 px-2.5 rounded-md transition flex items-center gap-1 cursor-pointer shadow-3xs"
                                      >
                                        <LuMessageCircle className="h-3 w-3" /> WhatsApp
                                      </button>
                                    </div>
                                  )}

                                  {/* Session Timeline Selector */}
                                  {(() => {
                                    const currentContactGroup = allContacts.find(c => c.sessions.some(s => s.session_id === selectedSession.session_id)) || allContacts.find(c => c.key === (selectedSession.device_id || selectedSession.session_id));
                                    const contactSessions = currentContactGroup?.sessions || [selectedSession];
                                    const selectedIndex = contactSessions.findIndex(s => s.session_id === selectedSession.session_id);
                                    const currentLabel = `Session ${contactSessions.length - (selectedIndex !== -1 ? selectedIndex : 0)} (${new Date(selectedSession.created_at || Date.now()).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })})`;
                                    return (
                                      <div className="relative">
                                        <button
                                          type="button"
                                          onClick={() => setSessionDropOpen(!sessionDropOpen)}
                                          className="bg-white border border-slate-300 font-bold text-slate-800 text-xs rounded-lg px-3 py-1.5 shadow-3xs cursor-pointer flex items-center justify-between gap-1.5 hover:bg-slate-50 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                        >
                                          <span>{currentLabel}</span>
                                          <svg className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${sessionDropOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                          </svg>
                                        </button>

                                        {sessionDropOpen && (
                                          <>
                                            <div className="fixed inset-0 z-10" onClick={() => setSessionDropOpen(false)} />
                                            <div className="absolute right-0 mt-1.5 w-60 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1 max-h-48 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-100">
                                              {contactSessions.map((s, idx) => {
                                                const isActive = s.session_id === selectedSession.session_id;
                                                return (
                                                  <button
                                                    key={s.session_id}
                                                    type="button"
                                                    onClick={() => {
                                                      handleSessionSelect(s);
                                                      setSessionDropOpen(false);
                                                    }}
                                                    className={`w-full text-left px-3.5 py-2 text-xs font-semibold transition cursor-pointer flex items-center justify-between ${isActive
                                                        ? "bg-indigo-50 text-indigo-700 font-extrabold"
                                                        : "text-slate-700 hover:bg-slate-50"
                                                      }`}
                                                  >
                                                    <span>Session {contactSessions.length - idx}</span>
                                                    <span className="text-[10px] text-slate-400 font-medium">
                                                      {new Date(s.created_at || Date.now()).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })}
                                                    </span>
                                                  </button>
                                                );
                                              })}
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    );
                                  })()}
                                </div>
                              </div>

                              {/* Sub-tab Navigation Bar (GUARANTEED ALL 5 TABS IN 1 SINGLE ROW!) */}
                              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/70 p-1 rounded-xl gap-1 shrink-0 overflow-x-hidden whitespace-nowrap">
                                {[
                                  { id: "user_info", label: "User Info", icon: LuBot },
                                  { id: "conversation", label: "Conversation", icon: LuMessageSquare },
                                  { id: "summary", label: "Summary", icon: LuFileText },
                                  { id: "outcome", label: "Outcome", icon: LuSparkles },
                                  { id: "feedback", label: "Feedbacks", icon: LuStar }
                                ].map((tab) => {
                                  const Icon = tab.icon;
                                  const active = sessionActiveTab === tab.id;
                                  return (
                                    <button
                                      key={tab.id}
                                      type="button"
                                      onClick={() => setSessionActiveTab(tab.id)}
                                      className={`flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg font-extrabold text-[11px] transition-all text-center ${active
                                        ? "bg-white text-indigo-700 shadow-2xs border border-slate-200 cursor-pointer"
                                        : "text-slate-500 hover:text-slate-800 cursor-pointer"
                                        }`}
                                    >
                                      <Icon className="h-3.5 w-3.5 shrink-0" />
                                      <span>{tab.label}</span>
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Workspace Content Display - Single Frame Full Height */}
                              <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar scrollbar-none">
                                {/* Tab 1: USER INFORMATION (Clean Visitor Metadata Profile Card) */}
                                {sessionActiveTab === "user_info" && (
                                  <div className="h-full overflow-y-auto space-y-4 bg-slate-50/50 p-5 rounded-xl border border-slate-200 no-scrollbar scrollbar-none">
                                    <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                                      <h4 className="font-extrabold text-slate-855 text-xs uppercase tracking-wider flex items-center gap-1.5">
                                        <LuBot className="h-4 w-4 text-indigo-600" /> Visitor Metadata Profile
                                      </h4>
                                      <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2.5 py-0.5 rounded-full">
                                        {selectedSession.visit_count || 1} Total Visits
                                      </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                      <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-3xs space-y-1">
                                        <span className="font-bold text-slate-400 block text-[9px] uppercase">Visitor Real Name</span>
                                        <span className="font-extrabold text-slate-900 text-sm block">{selectedSession.user_name || "Anonymous Visitor"}</span>
                                      </div>

                                      <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-3xs space-y-1">
                                        <span className="font-bold text-slate-400 block text-[9px] uppercase">Phone Number</span>
                                        <span className="font-extrabold text-slate-900 text-sm block">{selectedSession.phone_number || "Not Provided"}</span>
                                      </div>

                                      <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-3xs space-y-1">
                                        <span className="font-bold text-slate-400 block text-[9px] uppercase">Platform / Device</span>
                                        <span className="font-semibold text-slate-800 text-xs block">{selectedSession.device_name || "N/A"}</span>
                                      </div>

                                      <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-3xs space-y-1">
                                        <span className="font-bold text-slate-400 block text-[9px] uppercase">Session Start Date</span>
                                        <span className="font-semibold text-slate-800 text-xs block">{new Date(selectedSession.created_at).toLocaleString()}</span>
                                      </div>

                                      {selectedSession.device_id && (
                                        <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-3xs space-y-1 md:col-span-2">
                                          <span className="font-bold text-slate-400 block text-[9px] uppercase">Device ID</span>
                                          <span className="font-mono text-slate-700 text-[10.5px] block select-all truncate" title={selectedSession.device_id}>
                                            {selectedSession.device_id}
                                          </span>
                                        </div>
                                      )}
                                    </div>

                                    {/* Creator Action Buttons Control */}
                                    <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-3xs space-y-2.5">
                                      <span className="font-bold text-slate-400 block text-[9px] uppercase">Creator Action Control</span>
                                      {selectedSession.action_button ? (
                                        <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg flex justify-between items-center">
                                          <div>
                                            <span className="text-xs text-emerald-900 font-bold block">
                                              Active Action: {selectedSession.action_button.action_type === "whatsapp" ? "WhatsApp Button" : "Call Button"}
                                            </span>
                                            <span className="text-[10px] text-emerald-700 font-medium">
                                              {selectedSession.action_button.message || selectedSession.action_button.phone_number}
                                            </span>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => handleClearAction(selectedSession.session_id)}
                                            disabled={sendingAction}
                                            className="text-red-600 hover:text-red-800 text-xs font-bold underline cursor-pointer"
                                          >
                                            Clear Action
                                          </button>
                                        </div>
                                      ) : (
                                        <div className="flex gap-3 pt-1">
                                          <button
                                            type="button"
                                            onClick={() => handleSendAction(selectedSession.session_id, "call")}
                                            disabled={sendingAction}
                                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-3 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs"
                                          >
                                            <LuPhone className="h-4 w-4" /> Send "Call Now" Button
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleSendAction(selectedSession.session_id, "whatsapp")}
                                            disabled={sendingAction}
                                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-3 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs"
                                          >
                                            <LuMessageCircle className="h-4 w-4" /> Send "WhatsApp" Button
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Tab 2: CONVERSATION (100% Full-Width Transcript) */}
                                {sessionActiveTab === "conversation" && (
                                  <div className="h-full flex flex-col space-y-2">
                                    <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-200 pb-1.5">
                                      Transcript: {selectedSession.user_name || "Anonymous Visitor"}
                                    </h4>
                                    <div className="flex-1 overflow-y-auto space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 min-h-[360px] no-scrollbar scrollbar-none">
                                      {historyLoading ? (
                                        <p className="text-xs text-slate-400 text-center py-12">Loading messages...</p>
                                      ) : chatHistory.length > 0 ? (
                                        chatHistory.flatMap((chat) => {
                                          if (chat.role !== "assistant" || !chat.content) return [chat];
                                          const match = chat.content.match(/(?:\r?\n\r?\n|\r?\n|\.\s+)(?=(?:By the way|Also,|May I know|Could you (?:please )?share|What is your name|What's your name|Please share your)[,\?\s])/i);
                                          if (match && match.index > 0) {
                                            const mainAnswer = chat.content.substring(0, match.index).trim();
                                            const followUp = chat.content.substring(match.index).trim();
                                            if (mainAnswer && followUp) {
                                              return [
                                                { ...chat, content: mainAnswer },
                                                { ...chat, content: followUp }
                                              ];
                                            }
                                          }
                                          return [chat];
                                        }).map((chat, idx) => {
                                          const msgKey = `${selectedSession.session_id}_${idx}`;
                                          const currentEval = evaluations[msgKey];
                                          return (
                                            <div key={idx} className={`flex flex-col ${chat.role === "user" ? "items-end" : "items-start"}`}>
                                              <div className={`max-w-lg px-4 py-2.5 rounded-xl text-xs shadow-2xs leading-relaxed ${chat.role === "user" ? "bg-indigo-600 text-white rounded-tr-none" : "bg-white border border-slate-200 text-slate-800 rounded-tl-none"
                                                }`}>
                                                <div className="prose prose-xs max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_strong]:text-inherit [&_h1]:text-sm [&_h2]:text-xs [&_h3]:text-xs">
                                                  <ReactMarkdown>{chat.content}</ReactMarkdown>
                                                </div>
                                              </div>
                                              <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[9px] text-slate-400">{new Date(chat.created_at || Date.now()).toLocaleTimeString()}</span>
                                                {chat.role === "assistant" && (
                                                  <div className="flex items-center gap-1 bg-white border border-slate-200/80 px-2 py-0.5 rounded-md shadow-3xs text-[9px]">
                                                    <span className="font-bold text-slate-400 mr-0.5">AI Response:</span>
                                                    <button
                                                      type="button"
                                                      onClick={() => handleEvaluateMessage(msgKey, "good")}
                                                      className={`font-extrabold px-1.5 py-0.5 rounded transition cursor-pointer flex items-center gap-0.5 ${currentEval === "good" ? "bg-emerald-100 text-emerald-800" : "text-slate-500 hover:text-emerald-700"
                                                        }`}
                                                      title="Mark response as Accurate (Sahi Jawab)"
                                                    >
                                                      👍 Accurate
                                                    </button>
                                                    <button
                                                      type="button"
                                                      onClick={() => handleEvaluateMessage(msgKey, "bad")}
                                                      className={`font-extrabold px-1.5 py-0.5 rounded transition cursor-pointer flex items-center gap-0.5 ${currentEval === "bad" ? "bg-red-100 text-red-800" : "text-slate-500 hover:text-red-700"
                                                        }`}
                                                      title="Mark response as Needs Fix (Galat Jawab)"
                                                    >
                                                      👎 Needs Fix
                                                    </button>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          );
                                        })
                                      ) : (
                                        <p className="text-xs text-slate-400 text-center py-12">No chat logged.</p>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Tab 3: SUMMARY & CEO AI AUDIT */}
                                {sessionActiveTab === "summary" && (
                                  <div className="bg-slate-50/50 border border-slate-200/60 p-4 rounded-xl h-full overflow-y-auto space-y-4 no-scrollbar scrollbar-none">
                                    <div>
                                      <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-200 pb-2 mb-3">AI Context Summary</h4>
                                      {selectedSession.analysis ? (
                                        <p className="text-xs text-slate-700 font-semibold leading-relaxed">{selectedSession.analysis.meaning || "No summary content."}</p>
                                      ) : (
                                        <div className="text-center py-6">
                                          <p className="text-xs text-slate-400 font-bold mb-2">No summary generated yet.</p>
                                          <button
                                            type="button"
                                            onClick={() => runAiAnalysis(selectedSession.session_id)}
                                            disabled={analyzingSessionId === selectedSession.session_id}
                                            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-extrabold text-xs px-4.5 py-2 rounded-lg shadow-sm transition cursor-pointer"
                                          >
                                            {analyzingSessionId === selectedSession.session_id ? "Analyzing..." : "Analyze Conversation"}
                                          </button>
                                        </div>
                                      )}
                                    </div>

                                    {/* Holistic Device-Level Summary Section */}
                                    <div className="border-t border-slate-200 pt-4">
                                      <div className="flex justify-between items-center mb-3">
                                        <div>
                                          <h4 className="font-extrabold text-slate-850 text-xs uppercase tracking-wider">Holistic Visitor Summary (Device-Level)</h4>
                                          <p className="text-[10px] text-slate-400 font-medium">Aggregated summary across all sessions for this device ID</p>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => runDeviceAnalysis(selectedSession.device_id)}
                                          disabled={analyzingDevice || !selectedSession.device_id}
                                          className="flex items-center gap-1 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-400 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition cursor-pointer"
                                        >
                                          {analyzingDevice ? "Analyzing..." : "Analyze All Sessions"}
                                        </button>
                                      </div>

                                      {deviceAnalysis ? (
                                        <div className="space-y-3 text-xs">
                                          <div className="bg-white border border-slate-200/80 p-3 rounded-lg shadow-3xs space-y-1">
                                            <span className="font-bold text-slate-400 block text-[9px] uppercase">History Summary & Meaning</span>
                                            <p className="text-slate-700 leading-relaxed">{deviceAnalysis.meaning || "No summary content."}</p>
                                          </div>

                                          {Array.isArray(deviceAnalysis.key_points) && deviceAnalysis.key_points.length > 0 && (
                                            <div className="bg-white border border-slate-200/80 p-3 rounded-lg shadow-3xs space-y-1">
                                              <span className="font-bold text-slate-400 block text-[9px] uppercase">Key Discussion Points</span>
                                              <ul className="list-disc pl-4 space-y-1 text-slate-700">
                                                {deviceAnalysis.key_points.map((pt, idx) => (
                                                  <li key={idx} className="leading-relaxed">{pt}</li>
                                                ))}
                                              </ul>
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <div className="text-center py-6 bg-slate-100/40 border border-dashed border-slate-200 rounded-xl">
                                          <p className="text-xs text-slate-400 font-bold">No aggregated summary generated yet.</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Tab 4: OUTCOME */}
                                {sessionActiveTab === "outcome" && (
                                  <div className="bg-slate-50/50 border border-slate-200/60 p-4 rounded-xl h-full overflow-y-auto no-scrollbar scrollbar-none space-y-4">
                                    <div>
                                      <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-3">
                                        <h4 className="font-extrabold text-slate-850 text-xs uppercase tracking-wider">AI Leads Classification & Outcome</h4>
                                        <button
                                          type="button"
                                          onClick={() => runAiAnalysis(selectedSession.session_id)}
                                          disabled={analyzingSessionId === selectedSession.session_id}
                                          className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition cursor-pointer"
                                        >
                                          {analyzingSessionId === selectedSession.session_id ? "Analyzing..." : "Analyze Conversation"}
                                        </button>
                                      </div>
                                      {selectedSession.analysis ? (
                                        <div className="space-y-3 text-xs">
                                          <div className="grid grid-cols-2 gap-3">
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
                                        <div className="text-center py-6 bg-slate-100/30 border border-dashed border-slate-200 rounded-xl">
                                          <p className="text-xs text-slate-400 font-bold mb-1">No outcome metrics generated yet.</p>
                                          <p className="text-[10px] text-slate-400 mb-3">Click "Analyze Conversation" above to extract intent and next action steps using AI.</p>
                                        </div>
                                      )}
                                    </div>

                                    {/* Holistic Device-Level Analysis Section */}
                                    <div className="border-t border-slate-200 pt-4">
                                      <div className="flex justify-between items-center mb-3">
                                        <div>
                                          <h4 className="font-extrabold text-slate-850 text-xs uppercase tracking-wider">Holistic Visitor History (Device-Level)</h4>
                                          <p className="text-[10px] text-slate-400 font-medium">Aggregated analysis across all sessions for this device ID</p>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => runDeviceAnalysis(selectedSession.device_id)}
                                          disabled={analyzingDevice || !selectedSession.device_id}
                                          className="flex items-center gap-1 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-400 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition cursor-pointer"
                                        >
                                          {analyzingDevice ? "Analyzing..." : "Analyze All Sessions"}
                                        </button>
                                      </div>

                                      {deviceAnalysis ? (
                                        <div className="space-y-3 text-xs">
                                          <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-white border border-slate-200/80 p-3 rounded-lg shadow-3xs">
                                              <span className="font-bold text-slate-400 block mb-1 text-[9px] uppercase">Holistic Category</span>
                                              <span className="capitalize font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded text-[10px]">{deviceAnalysis.category || "N/A"}</span>
                                            </div>
                                            <div className="bg-white border border-slate-200/80 p-3 rounded-lg shadow-3xs">
                                              <span className="font-bold text-slate-400 block mb-1 text-[9px] uppercase">Aggregated Intent</span>
                                              <span className="font-bold text-slate-750">{deviceAnalysis.intent || "No intent extracted."}</span>
                                            </div>
                                          </div>

                                          <div className="bg-white border border-slate-200/80 p-3 rounded-lg shadow-3xs space-y-1">
                                            <span className="font-bold text-slate-400 block text-[9px] uppercase">History Summary & Meaning</span>
                                            <p className="text-slate-700 leading-relaxed">{deviceAnalysis.meaning || "No summary content."}</p>
                                          </div>

                                          {Array.isArray(deviceAnalysis.key_points) && deviceAnalysis.key_points.length > 0 && (
                                            <div className="bg-white border border-slate-200/80 p-3 rounded-lg shadow-3xs space-y-1">
                                              <span className="font-bold text-slate-400 block text-[9px] uppercase">Key Discussion Points</span>
                                              <ul className="list-disc pl-4 space-y-1 text-slate-700">
                                                {deviceAnalysis.key_points.map((pt, idx) => (
                                                  <li key={idx} className="leading-relaxed">{pt}</li>
                                                ))}
                                              </ul>
                                            </div>
                                          )}

                                          <div className="bg-emerald-50/30 border border-emerald-200 p-3 rounded-lg shadow-3xs">
                                            <span className="font-bold text-emerald-700 block mb-1 text-[9px] uppercase">Holistic Next Steps</span>
                                            <span className="font-semibold text-emerald-850 leading-relaxed">{deviceAnalysis.next_steps || "No next steps generated."}</span>
                                          </div>

                                          <div className="text-[10px] text-slate-400 font-bold flex gap-3 justify-end pt-1">
                                            <span>Sessions: {deviceAnalysis.session_count || 1}</span>
                                            <span>Messages: {deviceAnalysis.total_messages || 0}</span>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="text-center py-6 bg-slate-100/40 border border-dashed border-slate-200 rounded-xl">
                                          <p className="text-xs text-slate-400 font-bold">No aggregated analysis generated yet.</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Tab 5: FEEDBACKS */}
                                {sessionActiveTab === "feedback" && (
                                  <div className="bg-slate-50/50 border border-slate-200/60 p-4 rounded-xl h-full overflow-y-auto space-y-4 no-scrollbar scrollbar-none">
                                    {/* CEO AI Response Evaluation Audit Card */}
                                    <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-3xs space-y-3 text-left">
                                      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                        <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                                          <LuStar className="h-4 w-4 text-amber-500 fill-amber-400" /> CEO AI Accuracy Assessment & Report
                                        </h4>
                                        <span className="text-[10px] font-extrabold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">Client Audit</span>
                                      </div>

                                      {/* Sub-Tabs Selector */}
                                      <div className="flex bg-slate-100 p-1 rounded-lg gap-1 border border-slate-200/60 shrink-0">
                                        <button
                                          type="button"
                                          onClick={() => setAuditSubTab("feedback")}
                                          className={`flex-1 py-1 rounded-md font-bold text-center text-xs transition cursor-pointer ${auditSubTab === "feedback"
                                              ? "bg-white text-indigo-700 shadow-2xs border border-slate-200/40"
                                              : "text-slate-500 hover:text-slate-800"
                                            }`}
                                        >
                                          👍 Star Feedback
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setAuditSubTab("report")}
                                          className={`flex-1 py-1 rounded-md font-bold text-center text-xs transition cursor-pointer ${auditSubTab === "report"
                                              ? "bg-white text-rose-700 shadow-2xs border border-slate-200/40"
                                              : "text-slate-500 hover:text-slate-800"
                                            }`}
                                        >
                                          🚨 Report Issue
                                        </button>
                                      </div>

                                      {auditSubTab === "feedback" ? (
                                        /* FEEDBACK SUB-TAB */
                                        <div className="space-y-3 pt-1">
                                          <div className="space-y-1.5">
                                            <label className="block font-bold text-slate-500 text-[10px] uppercase">Rate AI Performance (1-5 Stars)</label>
                                            <div className="flex items-center gap-1.5 py-0.5">
                                              {[1, 2, 3, 4, 5].map((star) => {
                                                const isSelected = (evaluations[selectedSession.session_id] || 0) >= star;
                                                return (
                                                  <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => setEvaluations(prev => ({ ...prev, [selectedSession.session_id]: star }))}
                                                    className="focus:outline-none transition cursor-pointer p-0.5"
                                                  >
                                                    <LuStar
                                                      className={`h-6 w-6 ${isSelected
                                                          ? "text-amber-500 fill-amber-400"
                                                          : "text-slate-300 hover:text-amber-400"
                                                        }`}
                                                    />
                                                  </button>
                                                );
                                              })}
                                            </div>
                                          </div>

                                          <div className="space-y-1.5">
                                            <label className="block font-bold text-slate-500 text-[10px] uppercase">Optional Comments & Notes</label>
                                            <textarea
                                              rows="2"
                                              placeholder="Add positive details, observations, or leave empty..."
                                              value={evalNoteMap[selectedSession.session_id] || ""}
                                              onChange={(e) => setEvalNoteMap({ ...evalNoteMap, [selectedSession.session_id]: e.target.value })}
                                              className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-lg p-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            />
                                          </div>

                                          <button
                                            type="button"
                                            onClick={() => handleSaveSessionAudit(selectedSession.session_id, "feedback")}
                                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 rounded-lg transition cursor-pointer shadow-3xs text-center"
                                          >
                                            Submit Feedback
                                          </button>
                                        </div>
                                      ) : (
                                        /* REPORT SUB-TAB */
                                        <div className="space-y-3 pt-1">
                                          <div className="space-y-1.5">
                                            <label className="block font-bold text-rose-500 text-[10px] uppercase">Describe Chat Issue (Mandatory)</label>
                                            <textarea
                                              rows="3"
                                              placeholder="Describe the complaint/issue (e.g. AI gave incorrect details, or got stuck in a loop)..."
                                              value={evalNoteMap[selectedSession.session_id] || ""}
                                              onChange={(e) => setEvalNoteMap({ ...evalNoteMap, [selectedSession.session_id]: e.target.value })}
                                              className="w-full bg-slate-50 border border-slate-350 text-slate-800 text-xs rounded-lg p-2.5 focus:ring-rose-500 focus:border-rose-500"
                                            />
                                          </div>

                                          <button
                                            type="button"
                                            onClick={() => handleSaveSessionAudit(selectedSession.session_id, "report")}
                                            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2 rounded-lg transition cursor-pointer shadow-3xs text-center"
                                          >
                                            Submit Issue Report
                                          </button>
                                        </div>
                                      )}
                                    </div>

                                    <div className="border-t border-slate-200 pt-3">
                                      <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-2">
                                        <h3 className="font-extrabold text-slate-855 text-xs uppercase tracking-wider">Visitor Ratings & Reports List</h3>
                                        <button
                                          type="button"
                                          onClick={() => loadFeedbacks(selectedAgentId)}
                                          className="text-xs text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
                                        >
                                          Refresh List
                                        </button>
                                      </div>
                                      {loadingFeedbacks ? (
                                        <p className="text-slate-400 text-xs text-center py-12">Loading visitor feedback records...</p>
                                      ) : feedbacks.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                          {feedbacks.map((item, idx) => (
                                            <div key={idx} className="bg-white border border-slate-200/80 p-3.5 rounded-xl shadow-3xs space-y-1.5 text-left">
                                              <div className="flex justify-between items-start">
                                                <div>
                                                  <span className="font-bold text-slate-900 text-xs block">{item.user_name || "Anonymous Visitor"}</span>
                                                  <span className="text-[10px] text-slate-400">{item.user_email || "No Email Provided"}</span>
                                                </div>
                                                <div className="flex items-center text-amber-500 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                                  {[...Array(item.rating || 5)].map((_, i) => (
                                                    <LuStar key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                                                  ))}
                                                  <span className="text-[10px] font-bold text-amber-800 ml-1">{item.rating || 5}/5</span>
                                                </div>
                                              </div>
                                              <p className="text-xs text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100 italic">
                                                "{item.comment || "No comment provided."}"
                                              </p>
                                              <span className="text-[9px] text-slate-400 block text-right">
                                                {new Date(item.created_at || Date.now()).toLocaleString()}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="text-slate-400 text-xs text-center py-12">No visitor ratings or reports submitted for this agent yet.</p>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* ==================== VISITOR METADATA POPUP MODAL ==================== */}
                        {showMetadataModal && selectedSession && (
                          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl max-w-md w-full space-y-4 animate-in fade-in zoom-in duration-150">
                              <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                                  <LuInfo className="h-4 w-4 text-indigo-600" /> Visitor Metadata Profile
                                </h3>
                                <button
                                  type="button"
                                  onClick={() => setShowMetadataModal(false)}
                                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                                >
                                  <LuX className="h-4 w-4" />
                                </button>
                              </div>

                              <div className="space-y-3 text-xs">
                                <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl">
                                  <span className="font-bold text-slate-400 block mb-0.5 text-[9px] uppercase">Visitor Real Name</span>
                                  <span className="font-extrabold text-slate-900 text-sm">{selectedSession.user_name || "Anonymous Visitor"}</span>
                                </div>
                                <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl">
                                  <span className="font-bold text-slate-400 block mb-0.5 text-[9px] uppercase">Phone Number</span>
                                  <span className="font-extrabold text-slate-900 text-sm">{selectedSession.phone_number || "Not Provided"}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl">
                                    <span className="font-bold text-slate-400 block mb-0.5 text-[9px] uppercase">Platform / Device</span>
                                    <span className="font-semibold text-slate-800">{selectedSession.device_name || "N/A"}</span>
                                  </div>
                                  <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl">
                                    <span className="font-bold text-slate-400 block mb-0.5 text-[9px] uppercase">Device ID</span>
                                    <span className="font-mono text-[10px] text-slate-600 truncate block">{selectedSession.device_id || "N/A"}</span>
                                  </div>
                                </div>
                                <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl">
                                  <span className="font-bold text-slate-400 block mb-0.5 text-[9px] uppercase">Session Start Date</span>
                                  <span className="font-semibold text-slate-800">{new Date(selectedSession.created_at).toLocaleString()}</span>
                                </div>
                              </div>

                              <div className="pt-2 flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => setShowMetadataModal(false)}
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs cursor-pointer"
                                >
                                  Close Profile
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
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
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Interactive Sandbox Chat room (Compact Height) */}
                        <div className="lg:col-span-2 border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col h-[410px] bg-white">
                          <div className="flex justify-between items-center border-b border-slate-200 pb-2.5 mb-3">
                            <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                              <LuBot className="h-4 w-4 text-indigo-600" /> {mode === "personal" ? "Personal AI Copilot" : "Testing Sandbox"}
                            </h3>
                            <div className="flex items-center gap-3">
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isVoiceMode}
                                  onChange={(e) => setIsVoiceMode(e.target.checked)}
                                  className="w-3.5 h-3.5 text-indigo-600 border-slate-350 rounded"
                                />
                                <span className="text-[11px] font-bold text-slate-600 flex items-center gap-0.5">
                                  <LuVolume2 className="h-3.5 w-3.5 text-slate-500" /> Speech Response Mode
                                </span>
                              </label>
                              {isPlayingAudio && (
                                <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                                  Playing...
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Message view */}
                          <div className="flex-1 overflow-y-auto space-y-3 bg-slate-50/60 p-3.5 rounded-xl border border-slate-200/80 mb-3 text-xs no-scrollbar scrollbar-none">
                            {sandboxHistory.length > 0 ? (
                              sandboxHistory.map((chat, idx) => (
                                <div key={idx} className={`flex flex-col ${chat.role === "user" ? "items-end" : "items-start"}`}>
                                  <div className={`max-w-md px-3.5 py-2 rounded-xl shadow-2xs ${chat.role === "user" ? "bg-indigo-600 text-white rounded-tr-none" : "bg-white border border-slate-200 text-slate-800 rounded-tl-none"
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
                                      className="text-slate-400 hover:text-indigo-600 mt-1 flex items-center gap-0.5 text-[9px] font-semibold cursor-pointer"
                                    >
                                      <LuVolume2 className="h-3 w-3" /> Speak response
                                    </button>
                                  )}
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-12 text-slate-400">
                                <LuBot className="h-8 w-8 mx-auto text-slate-300 mb-1.5" />
                                <p className="font-bold text-xs text-slate-600">Sandbox Chat Ready</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">Send a message to test the agent's RAG knowledge retrieval.</p>
                              </div>
                            )}
                            {chatLoading && <p className="text-[10px] text-slate-400 animate-pulse font-medium">Agent is typing...</p>}
                          </div>

                          <form onSubmit={sendSandboxMessage} className="flex gap-2">
                            <button
                              type="button"
                              onClick={toggleVoiceListening}
                              disabled={chatLoading}
                              className={`shrink-0 flex items-center justify-center w-9 h-9 rounded-lg border transition cursor-pointer ${isListening
                                ? "bg-red-500 border-red-600 text-white animate-pulse shadow-lg shadow-red-200"
                                : "bg-white border-slate-350 text-slate-500 hover:text-indigo-600 hover:border-indigo-400 hover:bg-indigo-50"
                                }`}
                              title={isListening ? "Stop listening" : "Hold to speak"}
                            >
                              <LuMic className="h-4 w-4" />
                            </button>
                            <input
                              type="text"
                              placeholder={isListening ? "Listening... speak now" : mode === "personal" ? "Ask your Personal AI Copilot to manage daily planner or write scripts..." : "Type a message or click mic to speak..."}
                              value={chatInput}
                              onChange={(e) => setChatInput(e.target.value)}
                              className={`flex-1 bg-white border text-slate-700 text-xs rounded-lg focus:ring-indigo-500 focus:border-indigo-500 px-3 py-2 w-full shadow-2xs ${isListening ? "border-red-400 bg-red-50/30" : "border-slate-300"
                                }`}
                              disabled={chatLoading || isListening}
                            />
                            <button
                              type="submit"
                              disabled={chatLoading || !chatInput.trim()}
                              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                            >
                              Send
                            </button>
                          </form>
                        </div>

                        {/* Right: Interactive 3D Visiting Card Studio */}
                        <div className="flex flex-col space-y-3">
                          {/* Card Controls Header */}
                          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2.5 shadow-3xs">
                            <div className="flex justify-between items-center">
                              <span className="font-extrabold text-slate-850 text-xs uppercase tracking-wider flex items-center gap-1.5">
                                <LuShare2 className="h-3.5 w-3.5 text-indigo-600" /> Visiting Card Studio
                              </span>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleShareCard(selectedAgentId)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-1.5 px-3 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                                  title="Share Card Link / Details"
                                >
                                  <LuShare2 className="h-3.5 w-3.5" /> Share
                                </button>
                                <button
                                  type="button"
                                  onClick={handleDownloadCard}
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-1.5 px-3 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                                  title="Download Front & Back PNG Cards directly"
                                >
                                  <LuDownload className="h-3.5 w-3.5" /> Download Both Sides
                                </button>
                              </div>
                            </div>

                            {/* Template Selector & Front/Back Flip Toggle Bar */}
                            <div className="flex flex-wrap items-center justify-between gap-1.5 bg-white p-1 rounded-xl border border-slate-200 text-xs">
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => setCardTemplate("gold")}
                                  className={`px-2.5 py-1 rounded-lg font-extrabold text-[10px] transition cursor-pointer ${cardTemplate === "gold" ? "bg-amber-400 text-slate-950 shadow-2xs" : "text-slate-600 hover:bg-slate-100"
                                    }`}
                                >
                                  👑 Royal Gold
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setCardTemplate("yellow")}
                                  className={`px-2.5 py-1 rounded-lg font-extrabold text-[10px] transition cursor-pointer ${cardTemplate === "yellow" ? "bg-amber-400 text-slate-950 shadow-2xs" : "text-slate-600 hover:bg-slate-100"
                                    }`}
                                >
                                  ⚡ Dark Yellow
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setCardTemplate("wave")}
                                  className={`px-2.5 py-1 rounded-lg font-extrabold text-[10px] transition cursor-pointer ${cardTemplate === "wave" ? "bg-amber-400 text-slate-950 shadow-2xs" : "text-slate-600 hover:bg-slate-100"
                                    }`}
                                >
                                  🌊 Metallic Wave
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => setCardSide(prev => (prev === "front" ? "back" : "front"))}
                                className="bg-slate-900 hover:bg-slate-800 text-amber-300 font-black text-[10px] px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer border border-slate-700 shadow-3xs"
                              >
                                🔄 {cardSide === "front" ? "Show Back Side" : "Show Front Side"}
                              </button>
                            </div>
                          </div>

                          {/* DYNAMIC VISITING CARD DISPLAY */}
                          {(() => {
                            const currentAgent = selectedAgent || agents.find(a => (a._id === selectedAgentId || a.agent_id === selectedAgentId || a.id === selectedAgentId));
                            const authorImg = currentAgent?.customization?.author_image_url || currentAgent?.customization?.logo_url;
                            const chatLink = getAgentChatLink(selectedAgentId, currentAgent?.customization);
                            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(chatLink)}`;

                            return (
                              <div className="space-y-3">
                                {/* CARD VIEW CONTAINER (Clickable on Desktop to open chatbot in a new tab) */}
                                <a
                                  href={chatLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block w-full rounded-2xl shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.01] border border-slate-200 relative cursor-pointer group"
                                  title="Click card to test chatbot (opens in a new tab)"
                                >
                                  {/* TEMPLATE 1: ROYAL DARK GOLD GEOMETRIC PASS (Reference Image 2 Style) */}
                                  {cardTemplate === "gold" && (
                                    <div className="bg-gradient-to-br from-slate-950 via-[#0f172a] to-[#1c0d02] text-white min-h-[230px] p-0 relative flex flex-col justify-between border-[3px] border-amber-500 shadow-2xl overflow-hidden rounded-2xl">
                                      {/* Polygons Glow Accents */}
                                      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>

                                      {cardSide === "front" ? (
                                        /* FRONT SIDE: LEFT QR WITH BORDER/GLOW + RIGHT PHOTO/NAME/DESIGNATION */
                                        <div className="flex flex-col h-full min-h-[230px] justify-between p-4 z-10">
                                          <div className="flex justify-between items-center flex-1">
                                            {/* LEFT SIDE: QR CODE CONTAINER (Yellow border & golden glow) */}
                                            <div className="flex flex-col items-start justify-center pl-4">
                                              <div className="bg-white p-1.5 rounded-2xl border-[3px] border-amber-400 shadow-[0_0_15px_rgba(234,179,8,0.4)]">
                                                <img src={qrUrl} alt="QR Code" className="h-[90px] w-[90px] object-contain" />
                                              </div>
                                            </div>

                                            {/* RIGHT SIDE: PHOTO + NAME + DESIGNATION */}
                                            <div className="flex flex-col items-center text-center pr-4 space-y-1.5">
                                              {/* GOLD EMBLEM RING PHOTO WITH RING & GLOW */}
                                              {authorImg ? (
                                                <img src={mediaUrl(authorImg)} alt="CEO Avatar" className="h-20 w-20 rounded-full object-cover border-[3px] border-amber-400 shadow-[0_0_20px_rgba(234,179,8,0.5)] ring-4 ring-amber-500/20" />
                                              ) : (
                                                <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-amber-400 to-amber-300 text-slate-950 font-black flex items-center justify-center text-2xl border-2 border-white shadow-2xl">
                                                  {user?.name ? user.name.charAt(0).toUpperCase() : "V"}
                                                </div>
                                              )}
                                              {/* NAME & DESIGNATION RIGHT BELOW IT */}
                                              <div className="space-y-0.5">
                                                <h2 className="font-black text-sm text-amber-400 tracking-wide max-w-[170px] truncate leading-tight">
                                                  {user?.name || "Vijay Kumar Singh"}
                                                </h2>
                                                <p className="text-[9px] text-white font-extrabold uppercase tracking-wider max-w-[170px] truncate">
                                                  {user?.designation || "CEO & FOUNDER"}
                                                </p>
                                                {/* Gradient line under designation */}
                                                <div className="w-28 h-[1px] bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto mt-2 opacity-80 shadow-[0_1px_4px_rgba(234,179,8,0.4)]"></div>
                                              </div>
                                            </div>
                                          </div>

                                          {/* BOTTOM FOOTER */}
                                          <div className="border-t border-amber-500/20 pt-2 flex justify-center items-center text-[8px] text-slate-400 font-bold w-full">
                                            <span className="text-white/90 tracking-widest font-black flex items-center justify-center gap-1.5 uppercase">
                                              <span className="text-amber-400">⚡</span> POWERED BY MAGNIFAI
                                            </span>
                                          </div>
                                        </div>
                                      ) : (
                                        /* BACK SIDE */
                                        <div className="flex flex-col items-center justify-between min-h-[230px] p-4 bg-slate-950 text-center border-[3px] border-amber-500 rounded-2xl bg-gradient-to-br from-slate-950 via-[#0f172a] to-[#1c0d02]">
                                          <div className="flex-1 flex flex-col items-center justify-center space-y-3">
                                            <h2 className="font-black text-lg text-amber-400 tracking-wide leading-tight truncate max-w-[240px]">
                                              {user?.name || "Vijay Kumar Singh"}
                                            </h2>
                                            <p className="text-xs text-white font-extrabold uppercase tracking-wider block mt-1 truncate max-w-[240px]">
                                              {user?.designation || "CEO & FOUNDER"}
                                            </p>
                                            <div className="w-36 h-[1.5px] bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto mt-3 opacity-80"></div>
                                          </div>
                                          <div className="border-t border-amber-500/20 pt-2 flex justify-center items-center text-[8px] text-slate-400 font-bold w-full">
                                            <span className="text-white/90 tracking-widest font-black flex items-center justify-center gap-1.5 uppercase">
                                              <span className="text-amber-400">⚡</span> POWERED BY MAGNIFAI
                                            </span>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* TEMPLATE 2: MODERN SPLIT DARK & WHITE (Reference Image 3 Style) */}
                                  {cardTemplate === "yellow" && (
                                    <div className="bg-slate-900 text-slate-900 min-h-[230px] relative overflow-hidden flex flex-col justify-between border-2 border-amber-400 shadow-xl">
                                      {cardSide === "front" ? (
                                        /* FRONT SIDE: VERTICAL SPLIT DARK/WHITE */
                                        <div className="flex flex-col h-full min-h-[230px] justify-between">
                                          <div className="grid grid-cols-12 min-h-[195px] flex-1">
                                            {/* LEFT 5 COLUMNS: DARK SIDE WITH FULL-HEIGHT PHOTO */}
                                            <div className="col-span-5 h-full relative overflow-hidden border-r-4 border-amber-400 bg-slate-950">
                                              {authorImg ? (
                                                <img src={mediaUrl(authorImg)} alt="Agent Logo" className="h-full w-full object-cover object-top" />
                                              ) : (
                                                <div className="h-full w-full bg-amber-400 text-slate-950 font-black flex items-center justify-center text-3xl">
                                                  {user?.name ? user.name.charAt(0).toUpperCase() : "M"}
                                                </div>
                                              )}
                                            </div>
                                            {/* RIGHT 7 COLUMNS: CRISP WHITE DETAILS */}
                                            <div className="col-span-7 bg-white p-4 text-center flex flex-col justify-between items-center">
                                              <div className="space-y-1 text-left w-full">
                                                <h2 className="font-extrabold text-base text-slate-900 uppercase tracking-tight">{user?.name || "Vijay Kumar Singh"}</h2>
                                                <span className="bg-amber-400 text-slate-950 px-2 py-0.5 rounded font-black text-[9px] uppercase tracking-wider inline-block">
                                                  {user?.designation || "CEO & FOUNDER"}
                                                </span>
                                              </div>
                                              {/* Center QR Code */}
                                              <div className="flex justify-center items-center py-1">
                                                <div className="bg-white p-1 rounded-lg border border-amber-400 shadow-3xs">
                                                  <img src={qrUrl} alt="QR Code" className="h-[64px] w-[64px] object-contain" />
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                          {/* FOOTER */}
                                          <div className="bg-slate-950 text-slate-300 px-4 py-1.5 text-[9px] flex justify-center items-center font-bold border-t border-amber-400">
                                            <span className="text-amber-400 font-extrabold text-center w-full">⚡ POWERED BY MAGNIFAI</span>
                                          </div>
                                        </div>
                                      ) : (
                                        /* BACK SIDE */
                                        <div className="p-4 flex flex-col justify-between min-h-[230px] bg-slate-950 text-white text-center">
                                          <div className="flex-1 flex flex-col items-center justify-center space-y-3">
                                            <span className="text-[12px] font-black text-amber-400 uppercase tracking-widest">★ MAGNIFAI ★</span>
                                            
                                            <div className="space-y-1">
                                              <h2 className="font-extrabold text-lg text-white uppercase tracking-tight">{user?.name || "Vijay Kumar Singh"}</h2>
                                              <span className="bg-amber-400 text-slate-950 px-2 py-0.5 rounded font-black text-[9px] uppercase tracking-wider inline-block">
                                                {user?.designation || "CEO & FOUNDER"}
                                              </span>
                                            </div>
                                          </div>
                                          <p className="text-[8px] font-bold text-amber-400">⚡ POWERED BY MAGNIFAI</p>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* TEMPLATE 3: EXECUTIVE METALLIC GOLD WAVE (Reference Image 4 Style) */}
                                  {cardTemplate === "wave" && (
                                    <div className="bg-white text-slate-800 min-h-[230px] p-0 relative flex border-2 border-amber-400 shadow-2xl overflow-hidden">
                                      {cardSide === "front" ? (
                                        /* FRONT SIDE: PHOTO + LOGO + NAME/DESIGNATION + QR */
                                        <>
                                          {/* Left side portrait */}
                                          <div className="relative w-[38%] min-h-[230px] bg-slate-950 flex items-center justify-center shrink-0">
                                            {authorImg ? (
                                              <img src={mediaUrl(authorImg)} alt="CEO Portrait" className="w-full h-full object-cover" />
                                            ) : (
                                              <div className="w-full h-full bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 font-black flex items-center justify-center text-4xl uppercase">
                                                {user?.name ? user.name.charAt(0) : "V"}
                                              </div>
                                            )}
                                          </div>

                                          {/* Curved Wave Separators */}
                                          <svg className="absolute inset-y-0 left-[34%] w-[12%] h-full text-amber-500 fill-current pointer-events-none z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
                                            <path d="M0,0 Q40,50 0,100 L100,100 L100,0 Z" />
                                          </svg>
                                          <svg className="absolute inset-y-0 left-[35%] w-[12%] h-full text-white fill-current pointer-events-none z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
                                            <path d="M0,0 Q40,50 0,100 L100,100 L100,0 Z" />
                                          </svg>

                                          {/* Right side info panel */}
                                          <div className="flex-1 flex flex-col justify-between p-3 pl-8 min-w-0 z-10">
                                            {/* Top logo (shifted down and made larger) */}
                                            <div className="flex justify-center items-center h-12 w-full pt-2">
                                              {currentAgent?.customization?.logo_url || custLogoUrl ? (
                                                <img src={mediaUrl(currentAgent?.customization?.logo_url || custLogoUrl)} alt="Brand Logo" className="h-10 max-w-[170px] object-contain" />
                                              ) : (
                                                <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">★ MAGNIFAI ★</span>
                                              )}
                                            </div>

                                            {/* Middle Name and Designation */}
                                            <div className="text-center space-y-0.5 min-w-0">
                                              <div className="flex items-center justify-center gap-1.5">
                                                <span className="h-[1px] w-5 bg-amber-300"></span>
                                                <span className="text-[8px] text-amber-600 font-bold uppercase tracking-wider">Hello I am</span>
                                                <span className="h-[1px] w-5 bg-amber-300"></span>
                                              </div>
                                              <h2 className="font-black text-sm text-slate-900 leading-tight truncate">
                                                {user?.name || "Vijay Kumar Singh"}
                                              </h2>
                                              {/* Designation Badge */}
                                              <div className="inline-block bg-amber-50 border border-amber-300/40 rounded-full px-2.5 py-0.5 shadow-2xs">
                                                <span className="text-[8px] font-black text-amber-600 uppercase tracking-wider block truncate max-w-[160px]">
                                                  • {user?.designation || "CEO & Founder"} •
                                                </span>
                                              </div>
                                            </div>

                                            {/* Bottom: QR Code scanner moved down, pills removed */}
                                            <div className="flex justify-center items-center pb-1">
                                              <div className="bg-white p-1 rounded-lg border border-amber-400 shadow-3xs">
                                                <img src={qrUrl} alt="QR Code" className="h-[64px] w-[64px] object-contain" />
                                              </div>
                                            </div>
                                          </div>
                                        </>
                                      ) : (
                                        /* BACK SIDE: LOGO + NAME/DESIGNATION */
                                        <div className="flex flex-col items-center justify-between min-h-[230px] w-full p-4 bg-white z-10 text-slate-800 border-2 border-amber-400">
                                          {/* Top logo (shifted down and made larger) */}
                                          <div className="flex justify-center items-center h-12 w-full pt-2">
                                            {currentAgent?.customization?.logo_url || custLogoUrl ? (
                                              <img src={mediaUrl(currentAgent?.customization?.logo_url || custLogoUrl)} alt="Brand Logo" className="h-10 max-w-[170px] object-contain" />
                                            ) : (
                                              <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">★ MAGNIFAI ★</span>
                                            )}
                                          </div>

                                          {/* Middle Name and Designation */}
                                          <div className="text-center space-y-1 min-w-0 my-auto">
                                            <div className="flex items-center justify-center gap-1.5">
                                              <span className="h-[1px] w-5 bg-amber-300"></span>
                                              <span className="text-[8px] text-amber-600 font-bold uppercase tracking-wider">Hello I am</span>
                                              <span className="h-[1px] w-5 bg-amber-300"></span>
                                            </div>
                                            <h2 className="font-black text-sm text-slate-900 leading-tight truncate">
                                              {user?.name || "Vijay Kumar Singh"}
                                            </h2>
                                            {/* Designation Badge */}
                                            <div className="inline-block bg-amber-50 border border-amber-300/40 rounded-full px-2.5 py-0.5 shadow-2xs">
                                              <span className="text-[8px] font-black text-amber-600 uppercase tracking-wider block truncate max-w-[160px]">
                                                • {user?.designation || "CEO & Founder"} •
                                              </span>
                                            </div>
                                          </div>

                                          {/* Bottom Footer */}
                                          <div className="text-center text-[8px] font-bold text-amber-500 pt-1">
                                            ⚡ POWERED BY MAGNIFAI
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </a>
                              </div>
                            );
                          })()}
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
                  onClick={() => setViewMode(selectedAgentId ? "dashboard" : "list")}
                  className="flex items-center gap-1 bg-white hover:bg-slate-100 border border-slate-350 text-slate-700 font-bold text-xs py-2 px-3 rounded-lg shadow-xs transition cursor-pointer shrink-0"
                >
                  <LuArrowLeft className="h-4 w-4" /> Back
                </button>
              )}
              <div>
                <h1 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-1.5">
                  {formMode === "create" ? "Create New Agent" : "Edit Agent Configuration"}
                </h1>
                {formMode === "edit" && selectedAgentId && (
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5 flex items-center gap-1.5">
                    Agent ID: <span className="bg-slate-100 text-slate-700 font-mono px-2 py-0.5 rounded-md select-all border border-slate-250 font-semibold text-[10px]">{selectedAgentId}</span>
                  </p>
                )}
                <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase mt-1">Define your specialized AI personality</p>
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
                      className={`flex items-center gap-2 py-2 sm:py-2.5 px-3 rounded-lg font-bold text-xs text-left text-nowrap shrink-0 transition cursor-pointer border-b-2 md:border-b-0 md:border-l-4 ${active
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
                                autoComplete="off"
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
                          type="text"
                          placeholder="Enter Voice API Key..."
                          value={voiceApiKey}
                          onChange={(e) => setVoiceApiKey(e.target.value)}
                          autoComplete="off"
                          style={{ WebkitTextSecurity: showVoiceApiKey ? "none" : "disc" }}
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
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${src.isStaged ? "bg-orange-100 text-orange-800" : "bg-emerald-100 text-emerald-800"
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
                  <span className="text-slate-500 font-semibold">Agent ID:</span>
                  <span className="col-span-2 font-mono font-semibold text-slate-700 bg-slate-100 border border-slate-250 px-2 py-0.5 rounded-md select-all w-fit text-[10px]">{selectedAgent.agent_id}</span>

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
