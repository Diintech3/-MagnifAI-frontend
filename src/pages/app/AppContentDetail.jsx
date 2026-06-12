import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import {
  LuArrowLeft, LuCopy, LuCheck, LuLoader, LuCalendar,
  LuFileText, LuGlobe, LuTag, LuHash, LuLink, LuImage,
  LuVideo, LuMessageSquare, LuSearch, LuMapPin, LuEye,
  LuPencil, LuExternalLink, LuChevronDown, LuChevronUp,
  LuSettings2, LuChartBar, LuZap, LuAtSign,
  LuSave, LuAlignLeft, LuBold, LuItalic,
  LuList, LuListOrdered, LuQuote, LuMinus,
} from "react-icons/lu";
import { useAuth } from "../../auth/AuthProvider";
import { api } from "../../lib/api";
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
    published:   "bg-emerald-50 text-emerald-700 border-emerald-200",
    completed:   "bg-emerald-50 text-emerald-700 border-emerald-200",
    draft:       "bg-slate-100 text-slate-600 border-slate-200",
    rejected:    "bg-red-50 text-red-600 border-red-200",
    pending:     "bg-amber-50 text-amber-700 border-amber-200",
    approved:    "bg-blue-50 text-blue-700 border-blue-200",
    scheduled:   "bg-violet-50 text-violet-700 border-violet-200",
    assigned:    "bg-cyan-50 text-cyan-700 border-cyan-200",
    verified:    "bg-teal-50 text-teal-700 border-teal-200",
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
          {badge && <span className="rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold px-1.5 py-0.5">{badge}</span>}
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

function RenderContent({ text, className = "" }) {
  if (!text) return null;
  const str = typeof text === "string" ? text : text.join("\n");
  const decoded = decodeHtml(str);
  return (
    <div className={`prose prose-sm max-w-none text-slate-700 ${className}`}>
      {decoded
        ? <div dangerouslySetInnerHTML={{ __html: decoded }} />
        : <ReactMarkdown>{str}</ReactMarkdown>
      }
    </div>
  );
}

// ── Editor Toolbar ─────────────────────────────────────────

function EditorToolbar({ onFormat }) {
  const tools = [
    { icon: LuBold,        cmd: "bold",  title: "Bold" },
    { icon: LuItalic,      cmd: "italic",title: "Italic" },
    { icon: LuAlignLeft,   cmd: "h2",    title: "Heading 2" },
    { icon: LuAlignLeft,   cmd: "h3",    title: "Heading 3" },
    { icon: LuList,        cmd: "ul",    title: "Bullet List" },
    { icon: LuListOrdered, cmd: "ol",    title: "Numbered List" },
    { icon: LuQuote,       cmd: "quote", title: "Blockquote" },
    { icon: LuMinus,       cmd: "hr",    title: "Divider" },
  ];
  return (
    <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-200 bg-white flex-wrap shrink-0">
      {tools.map(({ icon: Icon, cmd, title }) => (
        <button key={cmd} title={title} onClick={() => onFormat(cmd)}
          className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition">
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  );
}

// ── Open in New Tab ────────────────────────────────────────

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
  strong{font-weight:700}em{font-style:italic}
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

// ── Main Page ──────────────────────────────────────────────

export function AppContentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useAuth();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("preview");
  const [editedContent, setEditedContent] = useState("");
  const [saving, setSaving] = useState(false);
  const editorRef = useRef(null);
  const fromState = location.state || {};

  function goBack() {
    if (fromState.folderId) {
      navigate("/app/contents", { state: { folderId: fromState.folderId, topic: fromState.topic } });
    } else {
      navigate("/app/contents");
    }
  }

  useEffect(() => {
    setLoading(true);
    api(`/api/app/content/${id}`, { token })
      .then(d => {
        setContent(d.content);
        const raw = d.content?.output?.content || "";
        setEditedContent(decodeHtml(raw) || raw);
      })
      .catch(e => toastFromError(e, "Failed to load content"))
      .finally(() => setLoading(false));
  }, [id]);

  function handleFormat(cmd) {
    const ta = editorRef.current;
    if (!ta) return;
    const start = ta.selectionStart, end = ta.selectionEnd;
    const sel = editedContent.slice(start, end);
    const wrap = {
      bold:   `**${sel || "bold text"}**`,
      italic: `*${sel || "italic text"}*`,
      ul:     `\n- ${sel || "List item"}`,
      ol:     `\n1. ${sel || "List item"}`,
      quote:  `\n> ${sel || "Blockquote"}`,
      hr:     `\n---\n`,
      h2:     `\n## ${sel || "Heading"}`,
      h3:     `\n### ${sel || "Heading"}`,
    }[cmd] || sel;
    setEditedContent(editedContent.slice(0, start) + wrap + editedContent.slice(end));
  }

  async function saveContent() {
    setSaving(true);
    try {
      await api(`/api/app/content/${id}`, {
        method: "PATCH", token,
        body: { output: { content: editedContent } },
      });
      setContent(p => ({ ...p, output: { ...p.output, content: editedContent } }));
      toastSuccess("Content saved!");
    } catch (e) {
      toastFromError(e, "Failed to save");
    } finally { setSaving(false); }
  }

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
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button onClick={goBack}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition shrink-0">
            <LuArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-slate-900 truncate leading-tight">{o.title || content.topic || "Untitled"}</h1>
            <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
              {content.contentType && <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full px-2 py-0.5">{content.contentType}</span>}
              {content.platform    && <span className="text-[10px] font-semibold text-violet-600 bg-violet-50 border border-violet-100 rounded-full px-2 py-0.5">{content.platform}</span>}
              {content.domain      && <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-100 rounded-full px-2 py-0.5">{content.domain}</span>}
              <StatusBadge status={content.status} />
            </div>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100 p-1 gap-1 shrink-0">
          {[
            { key: "preview", icon: LuEye,    label: "Preview" },
            { key: "editor",  icon: LuPencil, label: "Editor"  },
          ].map(({ key, icon: Icon, label }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${tab === key ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => openPreviewTab(content, o)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition">
            <LuExternalLink className="h-3.5 w-3.5" /> Open in Tab
          </button>
          <CopyBtn text={o.content || ""} label="Copy" />
          {tab === "editor" && (
            <button onClick={saveContent} disabled={saving}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition">
              <LuSave className="h-3.5 w-3.5" />
              {saving ? "Saving…" : "Save"}
            </button>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left Panel ── */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {tab === "preview" ? (
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-3xl mx-auto p-6 space-y-5">
                {/* Article meta card */}
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 leading-snug">{o.title || content.topic}</h2>
                    {content.topic && o.title && o.title !== content.topic && (
                      <p className="text-sm text-slate-400 mt-1">{content.topic}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-slate-400 border-t border-slate-100 pt-4">
                    <span className="flex items-center gap-1.5"><LuCalendar className="h-3.5 w-3.5" />{date}</span>
                    {content.wordCount    && <span className="flex items-center gap-1.5"><LuFileText className="h-3.5 w-3.5" />{content.wordCount} words</span>}
                    {content.tone         && <span className="flex items-center gap-1.5"><LuMessageSquare className="h-3.5 w-3.5" />{content.tone}</span>}
                    {content.language     && <span className="flex items-center gap-1.5"><LuGlobe className="h-3.5 w-3.5" />{content.language}</span>}
                    {content.targetLocation && <span className="flex items-center gap-1.5"><LuMapPin className="h-3.5 w-3.5" />{content.targetLocation}</span>}
                  </div>
                </div>

                {/* Full content */}
                {o.content && (
                  <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
                    <RenderContent text={o.content} className="leading-relaxed" />
                  </div>
                )}

                {/* FAQ */}
                {o.faq && (
                  <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">FAQ</p>
                    <RenderContent text={o.faq} />
                  </div>
                )}
              </div>
            </div>

          ) : (
            <div className="flex flex-col flex-1 overflow-hidden">
              <EditorToolbar onFormat={handleFormat} />
              <div className="flex flex-1 overflow-hidden divide-x divide-slate-200">
                {/* Raw editor */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="px-4 py-2 bg-white border-b border-slate-100 shrink-0">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Markdown / HTML</span>
                  </div>
                  <textarea
                    ref={editorRef}
                    value={editedContent}
                    onChange={e => setEditedContent(e.target.value)}
                    className="flex-1 resize-none p-4 text-sm font-mono text-slate-700 bg-white outline-none leading-relaxed"
                    placeholder="Start writing content here..."
                    spellCheck={false}
                  />
                </div>
                {/* Live preview */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="px-4 py-2 bg-white border-b border-slate-100 shrink-0">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Live Preview</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                    <RenderContent text={editedContent} className="leading-relaxed" />
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
              <ConfigCard icon={LuTag} title="Keywords" badge={o.keywords?.length || undefined} defaultOpen={false}>
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

            {/* 6. Backlinks / Image Prompt */}
            {o.imagePrompt && (
              <ConfigCard icon={LuImage} title="Backlinks / Image Prompt" defaultOpen={false}>
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
                <p className="text-[10px] text-slate-400 leading-relaxed">Auto-generated signature for DMs & outreach based on this content.</p>
                <div className="rounded-lg bg-slate-50 border border-slate-100 p-3">
                  <p className="text-xs text-slate-600 leading-relaxed italic">
                    "Hi, I recently published an article on <strong>{o.title || content.topic}</strong>
                    {content.domain ? ` in the ${content.domain} space` : ""}. Would love to hear your thoughts! 🚀"
                  </p>
                </div>
                <CopyBtn text={`Hi, I recently published an article on "${o.title || content.topic}"${content.domain ? ` in the ${content.domain} space` : ""}. Would love to hear your thoughts! 🚀`} />
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
    </div>
  );
}
