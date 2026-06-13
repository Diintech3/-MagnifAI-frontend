import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import {
  LuArrowLeft, LuCopy, LuCheck, LuLoader, LuCalendar,
  LuFileText, LuGlobe, LuTag, LuHash, LuLink, LuImage,
  LuVideo, LuMessageSquare, LuMapPin, LuEye, LuSave,
  LuPencil, LuExternalLink, LuChevronDown, LuChevronUp,
  LuSettings2, LuChartBar, LuZap, LuAtSign, LuUpload,
  LuBold, LuItalic, LuList, LuListOrdered, LuQuote,
  LuMinus, LuAlignLeft, LuUndo, LuRedo, LuX,
} from "react-icons/lu";
import { useAuth } from "../../auth/AuthProvider";
import { api, apiForm } from "../../lib/api";
import { toastFromError, toastSuccess } from "../../lib/toast";

// ── Helpers ────────────────────────────────────────────────

function CopyBtn({ text, label = "Copy" }) {
  const [copied, setCopied] = useState(false);
  const str = Array.isArray(text) ? text.join("\n") : (text || "");
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(str); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
    >
      {copied ? <LuCheck className="h-3 w-3 text-green-500" /> : <LuCopy className="h-3 w-3" />}
      {copied ? "Copied" : label}
    </button>
  );
}

function StatusBadge({ status }) {
  const map = {
    published:  "bg-emerald-50 text-emerald-700 border-emerald-200",
    completed:  "bg-emerald-50 text-emerald-700 border-emerald-200",
    draft:      "bg-slate-100 text-slate-600 border-slate-200",
    rejected:   "bg-red-50 text-red-600 border-red-200",
    pending:    "bg-amber-50 text-amber-700 border-amber-200",
    approved:   "bg-blue-50 text-blue-700 border-blue-200",
    scheduled:  "bg-violet-50 text-violet-700 border-violet-200",
    assigned:   "bg-cyan-50 text-cyan-700 border-cyan-200",
    verified:   "bg-teal-50 text-teal-700 border-teal-200",
  };
  if (!status) return null;
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold capitalize ${map[status] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
      {status}
    </span>
  );
}

function ScoreRing({ value, label }) {
  if (!value) return null;
  const color = value >= 80 ? "#10b981" : value >= 60 ? "#f59e0b" : "#ef4444";
  const textColor = value >= 80 ? "text-emerald-600" : value >= 60 ? "text-amber-500" : "text-red-500";
  const r = 22, circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative h-14 w-14">
        <svg className="h-14 w-14 -rotate-90" viewBox="0 0 56 56">
          <circle cx="28" cy="28" r={r} fill="none" stroke="#e2e8f0" strokeWidth="5" />
          <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="5"
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.6s ease" }} />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${textColor}`}>{value}</span>
      </div>
      <span className="text-[10px] font-semibold text-slate-500 text-center leading-tight">{label}</span>
    </div>
  );
}

function ConfigCard({ icon: Icon, title, defaultOpen = true, badge, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(p => !p)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition"
      >
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-indigo-500" />
          <span className="text-xs font-bold uppercase tracking-wide text-slate-700">{title}</span>
          {badge != null && <span className="rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold px-1.5 py-0.5">{badge}</span>}
        </div>
        {open ? <LuChevronUp className="h-3.5 w-3.5 text-slate-400" /> : <LuChevronDown className="h-3.5 w-3.5 text-slate-400" />}
      </button>
      {open && <div className="p-4">{children}</div>}
    </div>
  );
}

function decodeHtml(text) {
  if (!text) return null;
  const hasEncoded = /&lt;|&gt;|&amp;|&#39;|&quot;/.test(text);
  if (!hasEncoded) return null;
  return text
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"');
}

function isHtml(str) {
  return /<[a-z][\s\S]*>/i.test(str);
}

function RenderContent({ text, className = "" }) {
  if (!text) return null;
  const str = typeof text === "string" ? text : text.join("\n");
  // Decode HTML entities first
  const decoded = str
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"');
  return (
    <div className={`prose prose-sm max-w-none text-slate-700 [&_img]:max-w-full [&_img]:max-h-96 [&_img]:rounded-lg [&_img]:my-2 ${className}`}>
      {isHtml(decoded)
        ? <div dangerouslySetInnerHTML={{ __html: decoded }} />
        : <ReactMarkdown>{decoded}</ReactMarkdown>
      }
    </div>
  );
}

function openPreviewTab(content, o) {
  const title = o.title || content.topic || "Content Preview";
  const body = decodeHtml(o.content || "") || o.content || "";
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title}</title>
<style>
  *{box-sizing:border-box}
  body{font-family:'Segoe UI',system-ui,sans-serif;max-width:780px;margin:48px auto;padding:0 24px;color:#1e293b;line-height:1.75;background:#fff}
  h1{font-size:2rem;font-weight:800;margin-bottom:8px;color:#0f172a;line-height:1.2}
  h2{font-size:1.4rem;font-weight:700;margin-top:2rem;color:#1e293b;border-bottom:2px solid #e2e8f0;padding-bottom:6px}
  h3{font-size:1.1rem;font-weight:600;margin-top:1.5rem;color:#334155}
  p{margin:.75rem 0}ul,ol{padding-left:1.5rem;margin:.5rem 0}li{margin:.25rem 0}
  blockquote{border-left:4px solid #6366f1;margin:1rem 0;padding:.5rem 1rem;background:#f8f8ff;border-radius:0 8px 8px 0;color:#4338ca}
  strong{font-weight:700}em{font-style:italic}img{max-width:100%;border-radius:8px;margin:1rem 0}
  .meta{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0 28px;padding:14px 0;border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0}
  .badge{display:inline-flex;align-items:center;background:#eef2ff;color:#4338ca;border:1px solid #c7d2fe;border-radius:999px;padding:3px 10px;font-size:11px;font-weight:600}
  .badge.v{background:#f5f3ff;color:#6d28d9;border-color:#ddd6fe}
  .badge.a{background:#fffbeb;color:#92400e;border-color:#fde68a}
  .badge.s{background:#f1f5f9;color:#475569;border-color:#cbd5e1}
  hr{border:none;border-top:1px solid #e2e8f0;margin:1.5rem 0}
  @media print{body{margin:20px}}
</style>
</head>
<body>
<h1>${title}</h1>
<div class="meta">
  ${content.contentType ? `<span class="badge">${content.contentType}</span>` : ""}
  ${content.platform    ? `<span class="badge v">${content.platform}</span>` : ""}
  ${content.domain      ? `<span class="badge a">${content.domain}</span>` : ""}
  ${content.language    ? `<span class="badge s">${content.language}</span>` : ""}
  ${content.status      ? `<span class="badge s">${content.status}</span>` : ""}
</div>
${body}
</body>
</html>`;
  const blob = new Blob([html], { type: "text/html" });
  window.open(URL.createObjectURL(blob), "_blank");
}

// ── Image Insert Modal ───────────────────────────────────

function ImageInsertModal({ onInsert, onClose, token }) {
  const [tab, setTab]       = useState("upload"); // "upload" | "url"
  const [url, setUrl]       = useState("");
  const [alt, setAlt]       = useState("");
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview]     = useState("");
  const fileRef = useRef(null);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const data = await apiForm(`/api/app/content/upload-image`, { method: "POST", token, formData: fd });
      setPreview(data.url);
      setUrl(data.url);
      if (!alt) setAlt(file.name.replace(/\.[^.]+$/, ""));
      toastSuccess("Image uploaded!");
    } catch (err) {
      toastFromError(err, "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function handleInsert() {
    if (!url.trim()) return;
    onInsert(url.trim(), alt.trim() || "image");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <LuImage className="h-4 w-4 text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-900">Insert Image</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <LuX className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100">
          {[["upload", "Upload File"], ["url", "Paste URL"]].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`flex-1 py-2.5 text-xs font-semibold transition ${
                tab === k
                  ? "border-b-2 border-indigo-600 text-indigo-600"
                  : "text-slate-400 hover:text-slate-600"
              }`}>
              {l}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-4">
          {tab === "upload" ? (
            <div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
              {preview ? (
                <div className="relative rounded-xl overflow-hidden border border-slate-200">
                  <img src={preview} alt="preview" className="w-full max-h-48 object-contain bg-slate-50" />
                  <button onClick={() => { setPreview(""); setUrl(""); if (fileRef.current) fileRef.current.value = ""; }}
                    className="absolute top-2 right-2 rounded-full bg-white/90 border border-slate-200 p-1 text-slate-500 hover:text-red-500">
                    <LuX className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button onClick={() => fileRef.current?.click()} disabled={uploading}
                  className="w-full flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-indigo-300 transition py-10 disabled:opacity-50">
                  {uploading
                    ? <LuLoader className="h-7 w-7 text-indigo-400 animate-spin" />
                    : <LuUpload className="h-7 w-7 text-slate-300" />
                  }
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-600">{uploading ? "Uploading…" : "Click to upload"}</p>
                    <p className="text-xs text-slate-400 mt-0.5">PNG, JPG, GIF, WebP — max 5MB</p>
                  </div>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Image URL</label>
                <input
                  value={url} onChange={e => { setUrl(e.target.value); setPreview(e.target.value); }}
                  placeholder="https://example.com/image.jpg"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  autoFocus
                />
              </div>
              {preview && (
                <div className="rounded-xl overflow-hidden border border-slate-200">
                  <img src={preview} alt="preview" className="w-full max-h-40 object-contain bg-slate-50"
                    onError={() => setPreview("")} />
                </div>
              )}
            </div>
          )}

          {/* Alt text */}
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Alt Text</label>
            <input
              value={alt} onChange={e => setAlt(e.target.value)}
              placeholder="Describe the image…"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button onClick={onClose}
              className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">
              Cancel
            </button>
            <button onClick={handleInsert} disabled={!url.trim() || uploading}
              className="flex-1 rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition">
              Insert Image
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Editor Toolbar ─────────────────────────────────────────

function EditorToolbar({ onFormat, onImageClick }) {
  const tools = [
    { icon: LuBold,        cmd: "bold",   title: "Bold (Ctrl+B)" },
    { icon: LuItalic,      cmd: "italic", title: "Italic (Ctrl+I)" },
    { sep: true },
    { icon: LuAlignLeft,   cmd: "h2",     title: "Heading 2" },
    { icon: LuAlignLeft,   cmd: "h3",     title: "Heading 3", small: true },
    { sep: true },
    { icon: LuList,        cmd: "ul",     title: "Bullet List" },
    { icon: LuListOrdered, cmd: "ol",     title: "Numbered List" },
    { sep: true },
    { icon: LuQuote,       cmd: "quote",  title: "Blockquote" },
    { icon: LuMinus,       cmd: "hr",     title: "Divider" },
  ];

  return (
    <div className="flex items-center gap-0.5 px-3 py-2 border-b border-slate-200 bg-white flex-wrap shrink-0">
      {tools.map((t, i) =>
        t.sep
          ? <div key={i} className="w-px h-5 bg-slate-200 mx-1" />
          : (
            <button key={t.cmd} title={t.title} onClick={() => onFormat(t.cmd)}
              className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition">
              <t.icon className={`${t.small ? "h-3 w-3" : "h-3.5 w-3.5"}`} />
            </button>
          )
      )}
      <div className="w-px h-5 bg-slate-200 mx-1" />
      <button onClick={onImageClick} title="Insert Image"
        className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition">
        <LuImage className="h-3.5 w-3.5" />
        <span className="text-[11px]">Image</span>
      </button>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────

export function AppContentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useAuth();

  const [content, setContent]         = useState(null);
  const [loading, setLoading]         = useState(true);
  const [tab, setTab]                 = useState("preview");
  const [editedContent, setEditedContent] = useState("");
  const [editedTitle, setEditedTitle]     = useState("");
  const [isDirty, setIsDirty]         = useState(false);
  const [saving, setSaving]           = useState(false);
  const [uploading, setUploading]     = useState(false);
  const [imageModal, setImageModal]   = useState(false);
  const [history, setHistory]         = useState([]);
  const [historyIdx, setHistoryIdx]   = useState(-1);

  const taRef = useRef(null);
  const fromState = location.state || {};

  // ── Load content ────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    api(`/api/app/content/${id}`, { token })
      .then(d => {
        const c = d.content;
        setContent(c);
        const raw = c?.output?.content || "";
        const decoded = decodeHtml(raw) || raw;
        setEditedContent(decoded);
        setEditedTitle(c?.output?.title || c?.topic || "");
        setHistory([decoded]);
        setHistoryIdx(0);
        setIsDirty(false);
      })
      .catch(e => toastFromError(e, "Failed to load content"))
      .finally(() => setLoading(false));
  }, [id]);

  // ── Warn before leaving with unsaved changes ────────────
  useEffect(() => {
    function handler(e) {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // ── Keyboard shortcuts ───────────────────────────────────
  useEffect(() => {
    function handler(e) {
      if (tab !== "editor") return;
      if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); handleSave(); }
      if ((e.ctrlKey || e.metaKey) && e.key === "b") { e.preventDefault(); applyFormat("bold"); }
      if ((e.ctrlKey || e.metaKey) && e.key === "i") { e.preventDefault(); applyFormat("italic"); }
      if ((e.ctrlKey || e.metaKey) && e.key === "z") { e.preventDefault(); e.shiftKey ? redo() : undo(); }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [tab, editedContent, historyIdx, history]);

  function goBack() {
    if (isDirty && !window.confirm("You have unsaved changes. Leave anyway?")) return;
    if (fromState.folderId) {
      navigate("/app/contents", { state: { folderId: fromState.folderId, topic: fromState.topic } });
    } else {
      navigate("/app/contents");
    }
  }

  // ── History (undo/redo) ──────────────────────────────────
  function pushHistory(val) {
    const newHist = history.slice(0, historyIdx + 1);
    newHist.push(val);
    if (newHist.length > 100) newHist.shift();
    setHistory(newHist);
    setHistoryIdx(newHist.length - 1);
  }

  function undo() {
    if (historyIdx <= 0) return;
    const idx = historyIdx - 1;
    setHistoryIdx(idx);
    setEditedContent(history[idx]);
    setIsDirty(true);
  }

  function redo() {
    if (historyIdx >= history.length - 1) return;
    const idx = historyIdx + 1;
    setHistoryIdx(idx);
    setEditedContent(history[idx]);
    setIsDirty(true);
  }

  // ── Content change handler ───────────────────────────────
  const handleContentChange = useCallback((val) => {
    setEditedContent(val);
    setIsDirty(true);
    pushHistory(val);
  }, [history, historyIdx]);

  // ── Format toolbar ───────────────────────────────────────
  function applyFormat(cmd) {
    const ta = taRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end   = ta.selectionEnd;
    const sel   = editedContent.slice(start, end);
    const before = editedContent.slice(0, start);
    const after  = editedContent.slice(end);

    const wrap = {
      bold:   `**${sel || "bold text"}**`,
      italic: `*${sel || "italic text"}*`,
      h2:     `\n## ${sel || "Heading 2"}\n`,
      h3:     `\n### ${sel || "Heading 3"}\n`,
      ul:     `\n- ${sel || "List item"}\n`,
      ol:     `\n1. ${sel || "List item"}\n`,
      quote:  `\n> ${sel || "Blockquote text"}\n`,
      hr:     `\n\n---\n\n`,
    }[cmd] || sel;

    const next = before + wrap + after;
    setEditedContent(next);
    setIsDirty(true);
    pushHistory(next);

    // Restore cursor
    setTimeout(() => {
      if (!taRef.current) return;
      const pos = start + wrap.length;
      taRef.current.selectionStart = pos;
      taRef.current.selectionEnd   = pos;
      taRef.current.focus();
    }, 0);
  }

  // ── Image Insert from modal ─────────────────────────────────
  function handleImageInsertFromModal(imgUrl, altText) {
    const imgMd = `\n![${altText}](${imgUrl})\n`;
    const ta = taRef.current;
    const pos = ta ? ta.selectionStart : editedContent.length;
    const next = editedContent.slice(0, pos) + imgMd + editedContent.slice(pos);
    setEditedContent(next);
    setIsDirty(true);
    pushHistory(next);
    setTimeout(() => taRef.current?.focus(), 100);
  }

  // ── Save ─────────────────────────────────────────────────
  async function handleSave() {
    if (saving) return;
    setSaving(true);
    try {
      await api(`/api/app/content/${id}`, {
        method: "PATCH", token,
        body: { output: { content: editedContent, title: editedTitle } },
      });
      setContent(p => ({
        ...p,
        output: { ...p.output, content: editedContent, title: editedTitle },
      }));
      setIsDirty(false);
      toastSuccess("Saved successfully!");
    } catch (err) {
      toastFromError(err, "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  // ── Switch to editor tab ──────────────────────────────────
  function switchToEditor() {
    setTab("editor");
    setTimeout(() => taRef.current?.focus(), 100);
  }

  // ── Loading / not found ───────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <LuLoader className="h-7 w-7 animate-spin text-indigo-500" />
    </div>
  );

  if (!content) return (
    <div className="flex flex-col items-center justify-center py-32 gap-3">
      <p className="text-slate-500 font-medium">Content not found.</p>
      <button onClick={() => navigate(-1)} className="text-indigo-600 text-sm font-semibold hover:underline">Go Back</button>
    </div>
  );

  const o = content.output || {};
  const scores = o.scores || {};
  const hasScores = Object.values(scores).some(Boolean);
  const date = content.createdAt
    ? new Date(content.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) +
      " · " + new Date(content.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
    : "—";

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50">

      {/* ── Top Bar ── */}
      <div className="shrink-0 flex items-center justify-between gap-3 px-4 py-3 bg-white border-b border-slate-200 shadow-sm z-10">

        {/* Left: back + title */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button onClick={goBack}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition shrink-0">
            <LuArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="min-w-0 flex-1">
            {tab === "editor" ? (
              <input
                value={editedTitle}
                onChange={e => { setEditedTitle(e.target.value); setIsDirty(true); }}
                className="w-full text-sm font-bold text-slate-900 bg-transparent border-b border-dashed border-slate-300 focus:border-indigo-400 outline-none pb-0.5 leading-tight"
                placeholder="Title…"
              />
            ) : (
              <h1 className="text-sm font-bold text-slate-900 truncate leading-tight">
                {o.title || content.topic || "Untitled"}
              </h1>
            )}
            <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
              {content.contentType && <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full px-2 py-0.5">{content.contentType}</span>}
              {content.platform    && <span className="text-[10px] font-semibold text-violet-600 bg-violet-50 border border-violet-100 rounded-full px-2 py-0.5">{content.platform}</span>}
              {content.domain      && <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-100 rounded-full px-2 py-0.5">{content.domain}</span>}
              <StatusBadge status={content.status} />
              {isDirty && (
                <span className="text-[10px] font-semibold text-orange-500 bg-orange-50 border border-orange-200 rounded-full px-2 py-0.5 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-400 inline-block" />
                  Unsaved
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Center: tab switcher */}
        <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100 p-1 gap-1 shrink-0">
          <button
            onClick={() => setTab("preview")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${tab === "preview" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            <LuEye className="h-3.5 w-3.5" /> Preview
          </button>
          <button
            onClick={() => navigate(`/app/contents/${id}/edit`, { state: fromState })}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition text-slate-500 hover:text-slate-700">
            <LuPencil className="h-3.5 w-3.5" /> Editor
          </button>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2 shrink-0">
          {tab === "editor" && (
            <>
              <button onClick={undo} disabled={historyIdx <= 0} title="Undo (Ctrl+Z)"
                className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:bg-slate-50 disabled:opacity-30 transition">
                <LuUndo className="h-3.5 w-3.5" />
              </button>
              <button onClick={redo} disabled={historyIdx >= history.length - 1} title="Redo (Ctrl+Shift+Z)"
                className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:bg-slate-50 disabled:opacity-30 transition">
                <LuRedo className="h-3.5 w-3.5" />
              </button>
            </>
          )}
          <button onClick={() => openPreviewTab(content, { ...o, content: tab === "editor" ? editedContent : o.content, title: editedTitle || o.title })}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition">
            <LuExternalLink className="h-3.5 w-3.5" /> Open in Tab
          </button>
          <CopyBtn text={tab === "editor" ? editedContent : (o.content || "")} label="Copy" />
          {tab === "editor" && (
            <button onClick={handleSave} disabled={saving || !isDirty}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${isDirty ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm" : "bg-slate-100 text-slate-400 cursor-not-allowed"} disabled:opacity-60`}>
              {saving ? <LuLoader className="h-3.5 w-3.5 animate-spin" /> : <LuSave className="h-3.5 w-3.5" />}
              {saving ? "Saving…" : "Save"}
            </button>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left Panel ── */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">

          {/* Preview mode */}
          {tab === "preview" && (
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-3xl mx-auto p-6 space-y-5">
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 leading-snug">{o.title || content.topic}</h2>
                    {content.topic && o.title && o.title !== content.topic && (
                      <p className="text-sm text-slate-400 mt-1">{content.topic}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-slate-400 border-t border-slate-100 pt-4">
                    <span className="flex items-center gap-1.5"><LuCalendar className="h-3.5 w-3.5" />{date}</span>
                    {content.wordCount     && <span className="flex items-center gap-1.5"><LuFileText className="h-3.5 w-3.5" />{content.wordCount} words</span>}
                    {content.tone          && <span className="flex items-center gap-1.5"><LuMessageSquare className="h-3.5 w-3.5" />{content.tone}</span>}
                    {content.language      && <span className="flex items-center gap-1.5"><LuGlobe className="h-3.5 w-3.5" />{content.language}</span>}
                    {content.targetLocation && <span className="flex items-center gap-1.5"><LuMapPin className="h-3.5 w-3.5" />{content.targetLocation}</span>}
                  </div>
                </div>
                {o.content && (
                  <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
                    <RenderContent text={o.content} className="leading-relaxed" />
                  </div>
                )}
                {o.faq && (
                  <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">FAQ</p>
                    <RenderContent text={o.faq} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Editor mode */}
          {tab === "editor" && (
            <div className="flex flex-col flex-1 overflow-hidden">
              <EditorToolbar
                onFormat={applyFormat}
                onImageClick={() => setImageModal(true)}
              />
              <div className="flex flex-1 overflow-hidden divide-x divide-slate-200">
                {/* Raw textarea */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="px-4 py-2 bg-white border-b border-slate-100 shrink-0 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Markdown / HTML Editor</span>
                    <span className="text-[10px] text-slate-400">{editedContent.length} chars</span>
                  </div>
                  <textarea
                    ref={taRef}
                    value={editedContent}
                    onChange={e => handleContentChange(e.target.value)}
                    className="flex-1 resize-none p-4 text-sm font-mono text-slate-700 bg-white outline-none leading-relaxed"
                    placeholder="Start writing here… supports Markdown and HTML"
                    spellCheck={false}
                  />
                </div>
                {/* Live preview */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="px-4 py-2 bg-white border-b border-slate-100 shrink-0">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Live Preview</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                    {editedContent
                      ? <RenderContent text={editedContent} className="leading-relaxed" />
                      : <p className="text-sm text-slate-300 italic">Preview will appear here…</p>
                    }
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Right Panel: Configuration ── */}
        <div className="w-80 shrink-0 overflow-y-auto border-l border-slate-200 bg-white">
          <div className="p-3 space-y-2.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1 pt-1 pb-0.5">Configuration</p>

            {/* 1. Content Score */}
            {hasScores && (
              <ConfigCard icon={LuChartBar} title="Content Score" defaultOpen={true}>
                <div className="grid grid-cols-4 gap-x-2 gap-y-3">
                  <ScoreRing value={scores.seo}         label="SEO" />
                  <ScoreRing value={scores.aeo}         label="AEO" />
                  <ScoreRing value={scores.geo}         label="GEO" />
                  <ScoreRing value={scores.readability} label="Read" />
                  <ScoreRing value={scores.humanScore}  label="Human" />
                  <ScoreRing value={scores.aiDetection} label="AI Det" />
                  <ScoreRing value={scores.originality} label="Orig" />
                </div>
              </ConfigCard>
            )}

            {/* 2. Meta Data */}
            {(o.metaTitle || o.metaDesc || o.slug) && (
              <ConfigCard icon={LuGlobe} title="Meta Data" defaultOpen={true}>
                <div className="space-y-3">
                  {[
                    { label: "Meta Title", val: o.metaTitle },
                    { label: "Meta Description", val: o.metaDesc },
                    { label: "Slug", val: o.slug, mono: true },
                  ].filter(x => x.val).map(({ label, val, mono }) => (
                    <div key={label} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-slate-400">{label}</span>
                        <CopyBtn text={val} />
                      </div>
                      <p className={`text-xs text-slate-700 bg-slate-50 rounded-lg p-2 border border-slate-100 leading-relaxed ${mono ? "font-mono" : ""}`}>{val}</p>
                    </div>
                  ))}
                </div>
              </ConfigCard>
            )}

            {/* 3. Keywords */}
            {(o.keywords?.length > 0 || content.primaryKeyword || content.secondaryKeyword) && (
              <ConfigCard icon={LuTag} title="Keywords" badge={o.keywords?.length} defaultOpen={false}>
                <div className="space-y-3">
                  {content.primaryKeyword && (
                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-400 mb-1.5">Primary</p>
                      <span className="inline-flex items-center rounded-full bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">{content.primaryKeyword}</span>
                    </div>
                  )}
                  {content.secondaryKeyword && (
                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-400 mb-1.5">Secondary</p>
                      <span className="inline-flex items-center rounded-full bg-violet-50 border border-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-700">{content.secondaryKeyword}</span>
                    </div>
                  )}
                  {o.keywords?.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-400 mb-1.5">All Keywords</p>
                      <div className="flex flex-wrap gap-1.5">
                        {o.keywords.map((k, i) => (
                          <span key={i} className="inline-flex items-center rounded-full bg-slate-50 border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">{k}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </ConfigCard>
            )}

            {/* 4. CTA */}
            {o.cta && (
              <ConfigCard icon={LuZap} title="CTA" defaultOpen={false}>
                <div className="space-y-2">
                  <div className="flex justify-end"><CopyBtn text={o.cta} /></div>
                  <p className="text-xs text-slate-700 bg-slate-50 rounded-lg p-2.5 border border-slate-100 leading-relaxed">{o.cta}</p>
                </div>
              </ConfigCard>
            )}

            {/* 5. Hashtags */}
            {o.hashtags?.length > 0 && (
              <ConfigCard icon={LuHash} title="Hashtags" badge={o.hashtags.length} defaultOpen={false}>
                <div className="space-y-2">
                  <div className="flex justify-end"><CopyBtn text={o.hashtags.join(" ")} /></div>
                  <div className="flex flex-wrap gap-1.5">
                    {o.hashtags.map((h, i) => (
                      <span key={i} className="rounded-full bg-violet-50 border border-violet-100 px-2.5 py-0.5 text-[10px] font-semibold text-violet-700">{h}</span>
                    ))}
                  </div>
                </div>
              </ConfigCard>
            )}

            {/* 6. Image Prompt */}
            {o.imagePrompt && (
              <ConfigCard icon={LuImage} title="Image Prompt" defaultOpen={false}>
                <div className="space-y-2">
                  <div className="flex justify-end"><CopyBtn text={o.imagePrompt} /></div>
                  <p className="text-xs text-slate-700 bg-slate-50 rounded-lg p-2.5 border border-slate-100 leading-relaxed">{o.imagePrompt}</p>
                </div>
              </ConfigCard>
            )}

            {/* 7. Reel Script */}
            {o.videoPrompt && (
              <ConfigCard icon={LuVideo} title="Reel Script" defaultOpen={false}>
                <div className="space-y-2">
                  <div className="flex justify-end"><CopyBtn text={o.videoPrompt} /></div>
                  <RenderContent text={o.videoPrompt} />
                </div>
              </ConfigCard>
            )}

            {/* 8. Internal Links */}
            {o.internalLinks?.length > 0 && (
              <ConfigCard icon={LuLink} title="Internal Links" badge={o.internalLinks.length} defaultOpen={false}>
                <ul className="space-y-2">
                  {o.internalLinks.map((l, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                      <LuLink className="h-3 w-3 text-indigo-400 shrink-0 mt-0.5" />
                      <span className="break-all">{l}</span>
                    </li>
                  ))}
                </ul>
              </ConfigCard>
            )}

            {/* 9. External Links */}
            {o.externalRefs?.length > 0 && (
              <ConfigCard icon={LuGlobe} title="External Links" badge={o.externalRefs.length} defaultOpen={false}>
                <ul className="space-y-2">
                  {o.externalRefs.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                      <LuExternalLink className="h-3 w-3 text-violet-400 shrink-0 mt-0.5" />
                      <span className="break-all">{r}</span>
                    </li>
                  ))}
                </ul>
              </ConfigCard>
            )}

            {/* 10. DM Signature */}
            <ConfigCard icon={LuAtSign} title="DM Signature" defaultOpen={false}>
              <div className="space-y-2.5">
                <p className="text-[10px] text-slate-400 leading-relaxed">Auto-generated DM for outreach based on this content.</p>
                <div className="rounded-lg bg-slate-50 border border-slate-100 p-3">
                  <p className="text-xs text-slate-600 leading-relaxed italic">
                    "Hi, I recently published an article on <strong>{editedTitle || o.title || content.topic}</strong>
                    {content.domain ? ` in the ${content.domain} space` : ""}. Would love to hear your thoughts! 🚀"
                  </p>
                </div>
                <CopyBtn text={`Hi, I recently published an article on "${editedTitle || o.title || content.topic}"${content.domain ? ` in the ${content.domain} space` : ""}. Would love to hear your thoughts! 🚀`} />
              </div>
            </ConfigCard>

            {/* Settings */}
            <ConfigCard icon={LuSettings2} title="Settings" defaultOpen={false}>
              <div className="space-y-2">
                {[
                  ["Content Type", content.contentType],
                  ["Platform",     content.platform],
                  ["Domain",       content.domain],
                  ["Language",     content.language],
                  ["Tone",         content.tone],
                  ["Word Count",   content.wordCount ? `${content.wordCount} words` : null],
                  ["Status",       content.status],
                  ["Location",     content.targetLocation],
                ].filter(([, v]) => v).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-slate-400 font-medium">{k}</span>
                    <span className="font-semibold text-slate-700 capitalize text-right">{v}</span>
                  </div>
                ))}
              </div>
            </ConfigCard>

          </div>
        </div>
      </div>

      {/* Image Insert Modal */}
      {imageModal && (
        <ImageInsertModal
          token={token}
          onInsert={handleImageInsertFromModal}
          onClose={() => setImageModal(false)}
        />
      )}
    </div>
  );
}