import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  LuArrowLeft, LuLoader, LuSave, LuSend, LuEye,
  LuGlobe, LuTag, LuHash, LuZap, LuSettings2,
  LuChevronDown, LuChevronUp, LuChartBar, LuCalendar,
  LuLink, LuImage, LuVideo, LuAtSign, LuX, LuUpload,
} from "react-icons/lu";
import { useAuth } from "../../auth/AuthProvider";
import { api, mediaUrl } from "../../lib/api";
import { toastFromError, toastSuccess } from "../../lib/toast";
import { RichTextEditor } from "../../components/RichTextEditor";

// ── Shared helpers ───────────────────────────────────────────

function ScoreRing({ value, label }) {
  if (!value && value !== 0) return null;
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
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${textColor}`}>{value}</span>
      </div>
      <span className="text-[10px] font-semibold text-slate-500 text-center leading-tight">{label}</span>
    </div>
  );
}

function SettingsCard({ icon: Icon, title, defaultOpen = true, badge, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <button type="button" onClick={() => setOpen(p => !p)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition">
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

function FieldLabel({ children }) {
  return <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1.5">{children}</label>;
}

function TextInput({ value, onChange, placeholder, mono }) {
  return (
    <input
      type="text"
      value={value || ""}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition ${mono ? "font-mono" : ""}`}
    />
  );
}

function TextArea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea
      value={value || ""}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition resize-none leading-relaxed"
    />
  );
}

function decodeHtml(text) {
  if (!text) return "";
  return text
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"');
}

const STATUS_OPTIONS = ["draft", "pending", "approved", "scheduled", "published", "completed", "rejected"];

// ── Image Insert Modal ───────────────────────────────────

function ImageInsertModal({ onInsert, onClose, token, editorRef }) {
  const [tab, setTab]             = useState("upload");
  const [url, setUrl]             = useState("");
  const [alt, setAlt]             = useState("");
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview]     = useState("");
  const [blobUrl, setBlobUrl]     = useState("");
  const fileRef = useRef(null);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const localBlob = URL.createObjectURL(file);
    setPreview(localBlob);
    setBlobUrl(localBlob);
    try {
      // Step 1: Get presigned URL from backend
      const { presignedUrl, publicUrl } = await api("/api/app/content/presign-upload", {
        method: "POST", token,
        body: { mimetype: file.type },
      });
      // Step 2: Upload directly to R2 via presigned URL
      const uploadRes = await fetch(presignedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!uploadRes.ok) throw new Error("Upload to R2 failed");
      const serverUrl = mediaUrl(publicUrl) || publicUrl;
      setUrl(serverUrl);
      if (!alt) setAlt(file.name.replace(/\.[^.]+$/, ""));
      toastSuccess("Image uploaded!");
    } catch (err) {
      setPreview(""); setBlobUrl("");
      toastFromError(err, "Upload failed");
    } finally { setUploading(false); }
  }

  function handleInsert() {
    if (!url.trim()) return;
    const serverUrl = mediaUrl(url.trim()) || url.trim();
    // Use blob for immediate display, server URL stored in data-src for persistence
    const displayUrl = blobUrl || serverUrl;
    if (editorRef?.current) {
      editorRef.current.insertImageUrl(displayUrl, serverUrl);
    } else {
      onInsert(serverUrl, alt.trim() || "image");
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <LuImage className="h-4 w-4 text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-900">Insert Image</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><LuX className="h-4 w-4" /></button>
        </div>
        <div className="flex border-b border-slate-100">
          {[["upload", "Upload File"], ["url", "Paste URL"]].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`flex-1 py-2.5 text-xs font-semibold transition ${tab === k ? "border-b-2 border-indigo-600 text-indigo-600" : "text-slate-400 hover:text-slate-600"}`}>
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
                  {uploading ? <LuLoader className="h-7 w-7 text-indigo-400 animate-spin" /> : <LuUpload className="h-7 w-7 text-slate-300" />}
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
                <input value={url} onChange={e => { setUrl(e.target.value); setPreview(e.target.value); }}
                  placeholder="https://example.com/image.jpg" autoFocus
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
              {preview && (
                <div className="rounded-xl overflow-hidden border border-slate-200">
                  <img src={preview} alt="preview" className="w-full max-h-40 object-contain bg-slate-50" onError={() => setPreview("")} />
                </div>
              )}
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Alt Text</label>
            <input value={alt} onChange={e => setAlt(e.target.value)} placeholder="Describe the image…"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">Cancel</button>
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

// ── Main Editor Page ─────────────────────────────────────────

export function AppContentEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useAuth();
  const fromState = location.state || {};

  const editorRef = useRef(null);

  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [imageModal, setImageModal] = useState(false);
  const [editorFullscreen, setEditorFullscreen] = useState(false);

  // Editable fields
  const [title, setTitle]         = useState("");
  const [body, setBody]           = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDesc, setMetaDesc]   = useState("");
  const [slug, setSlug]           = useState("");
  const [labels, setLabels]       = useState("");
  const [status, setStatus]       = useState("draft");
  const [cta, setCta]             = useState("");
  const [faq, setFaq]             = useState("");
  const [hashtags, setHashtags]   = useState("");
  const [imagePrompt, setImagePrompt] = useState("");
  const [videoPrompt, setVideoPrompt] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");

  const markDirty = useCallback(() => setDirty(true), []);

  useEffect(() => {
    setLoading(true);
    api(`/api/app/content/${id}`, { token })
      .then(d => {
        const c = d.content;
        setContent(c);
        const o = c.output || {};
        setTitle(o.title || c.topic || "");
        setBody(decodeHtml(o.content || ""));
        setMetaTitle(o.metaTitle || "");
        setMetaDesc(o.metaDesc || "");
        setSlug(o.slug || "");
        setLabels((o.keywords || []).join(", "));
        setStatus(c.status || "draft");
        setCta(o.cta || "");
        setFaq(o.faq || "");
        setHashtags((o.hashtags || []).join(", "));
        setImagePrompt(o.imagePrompt || "");
        setVideoPrompt(o.videoPrompt || "");
        setScheduledAt(c.scheduledAt ? new Date(c.scheduledAt).toISOString().slice(0, 16) : "");
        setDirty(false);
      })
      .catch(e => toastFromError(e, "Failed to load content"))
      .finally(() => setLoading(false));
  }, [id, token]);

  function goBack() {
    if (dirty && !window.confirm("You have unsaved changes. Leave anyway?")) return;
    navigate(`/app/contents/${id}`, { state: fromState });
  }

  async function save(publish = false) {
    setSaving(true);
    try {
      const keywords = labels.split(",").map(s => s.trim()).filter(Boolean);
      const hashtagArr = hashtags.split(",").map(s => s.trim()).filter(Boolean);

      // Replace blob URLs with server URLs before saving
      let savedBody = body;
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = body;
      tempDiv.querySelectorAll("img[data-src]").forEach(img => {
        img.setAttribute("src", img.getAttribute("data-src"));
        img.removeAttribute("data-src");
      });
      savedBody = tempDiv.innerHTML;

      const output = {
        title,
        content: savedBody,
        metaTitle,
        metaDesc,
        slug,
        keywords,
        cta,
        faq,
        hashtags: hashtagArr,
        imagePrompt,
        videoPrompt,
      };

      let newStatus = status;
      if (publish) {
        newStatus = scheduledAt ? "scheduled" : "published";
      }

      const patchBody = { output, status: newStatus, topic: title };
      if (newStatus === "scheduled" && scheduledAt) {
        patchBody.scheduledAt = scheduledAt;
      }

      await api(`/api/app/content/${id}`, {
        method: "PATCH", token,
        body: patchBody,
      });

      setContent(p => ({
        ...p,
        status: newStatus,
        topic: title,
        output: { ...p.output, ...output },
      }));
      setStatus(newStatus);
      setDirty(false);
      toastSuccess(publish ? (newStatus === "scheduled" ? "Scheduled successfully!" : "Published successfully!") : "Saved successfully!");
    } catch (e) {
      toastFromError(e, "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
      <LuLoader className="h-8 w-8 animate-spin text-indigo-500" />
    </div>
  );

  if (!content) return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white gap-3">
      <p className="text-slate-500 font-medium">Content not found.</p>
      <button onClick={() => navigate("/app/contents")} className="text-indigo-600 text-sm font-semibold hover:underline">Go Back</button>
    </div>
  );

  const scores = content.output?.scores || {};
  const hasScores = Object.values(scores).some(v => v !== undefined && v !== null);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-50 overflow-hidden">

      {/* ── Top Bar (Blogger-style) ── */}
      <div className="shrink-0 flex items-center gap-3 px-4 py-2.5 bg-white border-b border-slate-200 shadow-sm">
        <button type="button" onClick={goBack}
          className="flex items-center gap-1.5 rounded-lg p-2 text-slate-600 hover:bg-slate-100 transition shrink-0">
          <LuArrowLeft className="h-5 w-5" />
        </button>

        {/* Title input */}
        <input
          type="text"
          value={title}
          onChange={e => { setTitle(e.target.value); markDirty(); }}
          placeholder="Title"
          className="flex-1 text-xl font-normal text-slate-800 outline-none placeholder:text-slate-400 bg-transparent min-w-0"
        />

        <div className="flex items-center gap-2 shrink-0">
          {dirty && (
            <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
              Unsaved
            </span>
          )}

          <button type="button" onClick={() => setEditorFullscreen(p => !p)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
              editorFullscreen
                ? "border-indigo-400 bg-indigo-50 text-indigo-600"
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}>
            <LuSettings2 className="h-4 w-4" /> {editorFullscreen ? "Show Settings" : "Editor"}
          </button>

          <button type="button" onClick={goBack}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
            <LuEye className="h-4 w-4" /> Preview
          </button>

          <button type="button" onClick={() => save(false)} disabled={saving}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 transition">
            <LuSave className="h-4 w-4" />
            {saving ? "Saving…" : "Save"}
          </button>

          <button type="button" onClick={() => save(true)} disabled={saving}
            className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-1.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60 transition shadow-sm">
            <LuSend className="h-4 w-4" />
            Publish
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Editor area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <RichTextEditor
            ref={editorRef}
            key={id}
            contentKey={id}
            value={body}
            onChange={v => { setBody(v); markDirty(); }}
            placeholder="Compose your post…"
            onInsertImage={() => setImageModal(true)}
          />
        </div>

        {/* ── Post Settings Sidebar ── */}
        <div className={`w-80 shrink-0 overflow-y-auto border-l border-slate-200 bg-white transition-all duration-300 ${editorFullscreen ? "hidden" : ""}`}>
          <div className="p-3 space-y-2.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1 pt-1 pb-0.5">
              Post Settings
            </p>

            {/* Status */}
            <SettingsCard icon={LuSettings2} title="Status" defaultOpen={true}>
              <FieldLabel>Post Status</FieldLabel>
              <select
                value={status}
                onChange={e => { setStatus(e.target.value); markDirty(); }}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 outline-none focus:border-indigo-400 capitalize"
              >
                {STATUS_OPTIONS.map(s => (
                  <option key={s} value={s} className="capitalize">{s}</option>
                ))}
              </select>
            </SettingsCard>

            {/* Labels / Keywords */}
            <SettingsCard icon={LuTag} title="Labels" defaultOpen={true}>
              <FieldLabel>Labels (comma separated)</FieldLabel>
              <TextInput
                value={labels}
                onChange={v => { setLabels(v); markDirty(); }}
                placeholder="startup, founder, blogger"
              />
              <p className="text-[10px] text-slate-400 mt-1.5">Separate labels by commas.</p>
            </SettingsCard>

            {/* Published on / Schedule */}
            <SettingsCard icon={LuCalendar} title="Published on" defaultOpen={false}>
              <FieldLabel>Schedule Date & Time</FieldLabel>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={e => { setScheduledAt(e.target.value); markDirty(); }}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 outline-none focus:border-indigo-400"
              />
              <p className="text-[10px] text-slate-400 mt-1.5">Leave empty to publish immediately.</p>
            </SettingsCard>

            {/* Permalink / Slug */}
            <SettingsCard icon={LuLink} title="Permalink" defaultOpen={true}>
              <FieldLabel>URL Slug</FieldLabel>
              <TextInput
                value={slug}
                onChange={v => { setSlug(v); markDirty(); }}
                placeholder="meet-our-founder-startup-founders"
                mono
              />
            </SettingsCard>

            {/* Meta Data */}
            <SettingsCard icon={LuGlobe} title="Meta Data" defaultOpen={true}>
              <div className="space-y-3">
                <div>
                  <FieldLabel>Meta Title</FieldLabel>
                  <TextInput value={metaTitle} onChange={v => { setMetaTitle(v); markDirty(); }} placeholder="SEO title" />
                </div>
                <div>
                  <FieldLabel>Meta Description</FieldLabel>
                  <TextArea value={metaDesc} onChange={v => { setMetaDesc(v); markDirty(); }} placeholder="SEO description" rows={3} />
                </div>
              </div>
            </SettingsCard>

            {/* Content Score (read-only) */}
            {hasScores && (
              <SettingsCard icon={LuChartBar} title="Content Score" defaultOpen={false}>
                <div className="grid grid-cols-4 gap-x-2 gap-y-3">
                  <ScoreRing value={scores.seo}         label="SEO" />
                  <ScoreRing value={scores.aeo}         label="AEO" />
                  <ScoreRing value={scores.geo}         label="GEO" />
                  <ScoreRing value={scores.readability} label="Read" />
                  <ScoreRing value={scores.humanScore}  label="Human" />
                  <ScoreRing value={scores.aiDetection} label="AI Det" />
                  <ScoreRing value={scores.originality} label="Orig" />
                </div>
              </SettingsCard>
            )}

            {/* CTA */}
            <SettingsCard icon={LuZap} title="CTA" defaultOpen={false}>
              <FieldLabel>Call to Action</FieldLabel>
              <TextArea value={cta} onChange={v => { setCta(v); markDirty(); }} placeholder="Your call to action text…" rows={3} />
            </SettingsCard>

            {/* Hashtags */}
            <SettingsCard icon={LuHash} title="Hashtags" defaultOpen={false}>
              <FieldLabel>Hashtags (comma separated)</FieldLabel>
              <TextInput value={hashtags} onChange={v => { setHashtags(v); markDirty(); }} placeholder="#startup, #founder" />
            </SettingsCard>

            {/* FAQ */}
            <SettingsCard icon={LuGlobe} title="FAQ" defaultOpen={false}>
              <FieldLabel>FAQ Content</FieldLabel>
              <TextArea value={faq} onChange={v => { setFaq(v); markDirty(); }} placeholder="Q: Question? A: Answer." rows={5} />
            </SettingsCard>

            {/* Image Prompt */}
            <SettingsCard icon={LuImage} title="Image Prompt" defaultOpen={false}>
              <FieldLabel>Featured Image Prompt</FieldLabel>
              <TextArea value={imagePrompt} onChange={v => { setImagePrompt(v); markDirty(); }} placeholder="Describe the image…" rows={3} />
            </SettingsCard>

            {/* Reel Script */}
            <SettingsCard icon={LuVideo} title="Reel Script" defaultOpen={false}>
              <FieldLabel>Video / Reel Script</FieldLabel>
              <TextArea value={videoPrompt} onChange={v => { setVideoPrompt(v); markDirty(); }} placeholder="Video script…" rows={4} />
            </SettingsCard>

            {/* DM Signature (read-only template) */}
            <SettingsCard icon={LuAtSign} title="DM Signature" defaultOpen={false}>
              <p className="text-[10px] text-slate-400 leading-relaxed mb-2">Auto-generated outreach signature.</p>
              <div className="rounded-lg bg-slate-50 border border-slate-100 p-3">
                <p className="text-xs text-slate-600 leading-relaxed italic">
                  "Hi, I recently published an article on <strong>{title || content.topic}</strong>
                  {content.domain ? ` in the ${content.domain} space` : ""}. Would love to hear your thoughts!"
                </p>
              </div>
            </SettingsCard>

            {/* Info */}
            <SettingsCard icon={LuSettings2} title="Content Info" defaultOpen={false}>
              <div className="space-y-2">
                {[
                  ["Content Type", content.contentType],
                  ["Platform", content.platform],
                  ["Domain", content.domain],
                  ["Language", content.language],
                  ["Tone", content.tone],
                  ["Word Count", content.wordCount ? `${content.wordCount} words` : null],
                  ["Location", content.targetLocation],
                ].filter(([, v]) => v).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-slate-400 font-medium">{k}</span>
                    <span className="font-semibold text-slate-700 capitalize text-right">{v}</span>
                  </div>
                ))}
              </div>
            </SettingsCard>

          </div>
        </div>
      </div>

      {/* Image Insert Modal */}
      {imageModal && (
        <ImageInsertModal
          token={token}
          editorRef={editorRef}
          onInsert={() => {}}
          onClose={() => setImageModal(false)}
        />
      )}
    </div>
  );
}
