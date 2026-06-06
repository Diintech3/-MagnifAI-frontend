import { useCallback, useEffect, useRef, useState } from "react";
import {
  LuNewspaper, LuSearch, LuCalendar, LuTag,
  LuPlus, LuX, LuSparkles, LuImage, LuTrash2, LuPencil,
  LuEye, LuEllipsisVertical, LuUser, LuBookOpen, LuCheck,
} from "react-icons/lu";
import { useAuth } from "../../auth/AuthProvider";
import { api, apiForm, mediaUrl } from "../../lib/api";
import { toastFromError, toastSuccess } from "../../lib/toast";

const CATEGORIES = [
  "All", "News", "Technology", "Social", "Events", "Opinion",
  "Article", "Interview", "Organization", "Announcement", "Issues", "Others",
];

const CATEGORY_COLORS = {
  News:         "bg-blue-50 text-blue-700 border-blue-200",
  Technology:   "bg-violet-50 text-violet-700 border-violet-200",
  Social:       "bg-pink-50 text-pink-700 border-pink-200",
  Events:       "bg-amber-50 text-amber-700 border-amber-200",
  Opinion:      "bg-orange-50 text-orange-700 border-orange-200",
  Article:      "bg-teal-50 text-teal-700 border-teal-200",
  Interview:    "bg-indigo-50 text-indigo-700 border-indigo-200",
  Organization: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Announcement: "bg-rose-50 text-rose-700 border-rose-200",
  Issues:       "bg-red-50 text-red-700 border-red-200",
  Others:       "bg-slate-50 text-slate-600 border-slate-200",
};

// ── 3-dot Dropdown ────────────────────────────────────────────────────────────
function CardMenu({ onView, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition">
        <LuEllipsisVertical className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-20 w-36 rounded-xl border border-slate-100 bg-white shadow-xl py-1">
          <button type="button" onClick={() => { onView(); setOpen(false); }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition">
            <LuEye className="h-3.5 w-3.5 text-indigo-500" /> View
          </button>
          <button type="button" onClick={() => { onEdit(); setOpen(false); }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition">
            <LuPencil className="h-3.5 w-3.5 text-amber-500" /> Edit
          </button>
          <div className="my-1 border-t border-slate-100" />
          <button type="button" onClick={() => { onDelete(); setOpen(false); }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition">
            <LuTrash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

// ── Post Card ─────────────────────────────────────────────────────────────────
function PostCard({ post, onEdit, onDelete, onView }) {
  const cat = CATEGORY_COLORS[post.category] || CATEGORY_COLORS.Others;
  return (
    <div className="flex flex-col rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden group">
      {post.mediaUrls?.[0] ? (
        <div className="relative h-44 w-full overflow-hidden bg-slate-100">
          <img src={mediaUrl(post.mediaUrls[0])} alt={post.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          <span className={`absolute top-3 left-3 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${cat}`}>{post.category}</span>
          {!post.published && <span className="absolute top-3 right-3 rounded-full bg-slate-700/80 px-2 py-0.5 text-[10px] font-semibold text-white">Draft</span>}
        </div>
      ) : (
        <div className="relative flex h-24 w-full items-center justify-center bg-gradient-to-br from-indigo-50 to-slate-100">
          <LuNewspaper className="h-8 w-8 text-slate-300" />
          <span className={`absolute top-3 left-3 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${cat}`}>{post.category}</span>
          {!post.published && <span className="absolute top-3 right-3 rounded-full bg-slate-700/80 px-2 py-0.5 text-[10px] font-semibold text-white">Draft</span>}
        </div>
      )}
      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="flex-1 text-sm font-bold text-slate-900 line-clamp-2 leading-snug">{post.title}</h3>
          <CardMenu onView={() => onView(post)} onEdit={() => onEdit(post)} onDelete={() => onDelete(post)} />
        </div>
        {post.summary && <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{post.summary}</p>}
        {post.author && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <LuUser className="h-3 w-3" /><span>{post.author}</span>
          </div>
        )}
        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {post.tags.slice(0, 3).map((t) => (
              <span key={t} className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-600">#{t}</span>
            ))}
            {post.tags.length > 3 && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-400">+{post.tags.length - 3}</span>}
          </div>
        )}
        <div className="mt-auto flex items-center justify-between border-t border-slate-50 pt-2.5">
          <span className="flex items-center gap-1 text-[11px] text-slate-400">
            <LuCalendar className="h-3 w-3" />
            {post.createdAt ? new Date(post.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
          </span>
          <button type="button" onClick={() => onView(post)}
            className="flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-600 hover:bg-indigo-100 transition">
            <LuEye className="h-3 w-3" /> View
          </button>
        </div>
      </div>
    </div>
  );
}

// ── View Modal ────────────────────────────────────────────────────────────────
function ViewModal({ post, onClose, onEdit }) {
  if (!post) return null;
  const cat = CATEGORY_COLORS[post.category] || CATEGORY_COLORS.Others;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl flex flex-col" style={{ maxHeight: "90vh" }}>
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <LuBookOpen className="h-4 w-4 text-indigo-500" />
            <span className="text-sm font-bold text-slate-800">Post Details</span>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onEdit}
              className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition">
              <LuPencil className="h-3.5 w-3.5" /> Edit
            </button>
            <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 transition">
              <LuX className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {post.mediaUrls?.[0] && (
            <img src={mediaUrl(post.mediaUrls[0])} alt={post.title} className="w-full h-44 object-cover rounded-xl" />
          )}
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${cat}`}>
              <LuTag className="mr-1 inline h-3 w-3" />{post.category}
            </span>
            <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${post.published ? "bg-green-50 text-green-700 border-green-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
              {post.published ? "✓ Published" : "Draft"}
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 leading-snug">{post.title}</h2>
          <div className="flex flex-wrap gap-4 text-xs text-slate-500">
            {post.author && (
              <span className="flex items-center gap-1.5">
                <LuUser className="h-3.5 w-3.5 text-slate-400" />
                <span className="font-medium text-slate-700">{post.author}</span>
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <LuCalendar className="h-3.5 w-3.5 text-slate-400" />
              {post.createdAt ? new Date(post.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : "—"}
            </span>
          </div>
          {post.summary && (
            <div className="rounded-xl bg-indigo-50 border border-indigo-100 px-4 py-3">
              <p className="text-sm font-medium text-indigo-800 leading-relaxed">{post.summary}</p>
            </div>
          )}
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Content</p>
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700 leading-7 whitespace-pre-wrap">
              {post.content}
            </div>
          </div>
          {post.tags?.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {post.tags.map((t) => (
                  <span key={t} className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600">#{t}</span>
                ))}
              </div>
            </div>
          )}
          {post.mediaUrls?.length > 1 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Media ({post.mediaUrls.length})</p>
              <div className="flex flex-wrap gap-2">
                {post.mediaUrls.map((url, i) => (
                  <img key={i} src={mediaUrl(url)} alt="" className="h-20 w-20 rounded-lg object-cover border border-slate-200" />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Create / Edit Post Modal ──────────────────────────────────────────────────
const EMPTY_FORM = {
  title: "", category: "News", author: "", summary: "",
  content: "", tags: "", mediaUrl: "", published: true,
};

function PostModal({ open, onClose, onSaved, token, editPost }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreviews, setMediaPreviews] = useState([]);  // proxy/display URLs
  const [origUrls, setOrigUrls] = useState([]);            // raw DB URLs (edit only)
  const [aiSelectedUrls, setAiSelectedUrls] = useState([]);
  const [aiTopic, setAiTopic] = useState("");
  const [aiImagePrompt, setAiImagePrompt] = useState("");
  const [aiImages, setAiImages] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [imgLoading, setImgLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    if (!open) return;
    if (editPost) {
      setForm({
        title: editPost.title || "", category: editPost.category || "News",
        author: editPost.author || "", summary: editPost.summary || "",
        content: editPost.content || "", tags: (editPost.tags || []).join(", "),
        mediaUrl: "", published: editPost.published ?? true,
      });
      const dbUrls = editPost.mediaUrls || [];
      setOrigUrls(dbUrls);
      setMediaPreviews(dbUrls.map(mediaUrl));
    } else {
      setForm(EMPTY_FORM);
      setMediaPreviews([]);
      setOrigUrls([]);
    }
    setMediaFiles([]);
    setAiImages([]);
    setAiSelectedUrls([]);
    setAiTopic("");
    setAiImagePrompt("");
  }, [open, editPost]);

  function setField(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  function onFileChange(e) {
    const files = Array.from(e.target.files || []);
    setMediaFiles((prev) => [...prev, ...files]);
    files.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (ev) => setMediaPreviews((p) => [...p, ev.target.result]);
      reader.readAsDataURL(f);
    });
  }

  function removePreview(i) {
    const removedPreview = mediaPreviews[i];
    setMediaPreviews((p) => p.filter((_, j) => j !== i));
    setAiSelectedUrls((prev) => prev.filter((u) => u !== removedPreview));
    // Remove from origUrls if it was an existing DB image
    setOrigUrls((prev) => prev.filter((u) => mediaUrl(u) !== removedPreview));
  }

  async function aiFill() {
    if (!aiTopic.trim()) return;
    setAiLoading(true);
    try {
      const d = await api("/api/app/posts/ai-fill", { method: "POST", token, body: { topic: aiTopic } });
      setForm((f) => ({
        ...f,
        title:    d.title    || f.title,
        summary:  d.summary  || f.summary,
        content:  d.content  || f.content,
        tags:     d.tags     || f.tags,
        category: d.category || f.category,
      }));
      toastSuccess("AI content generated!");
    } catch (e) { toastFromError(e, "AI fill failed"); }
    finally { setAiLoading(false); }
  }

  async function generateImages() {
    if (!aiImagePrompt.trim()) return;
    setImgLoading(true);
    try {
      const d = await api("/api/app/posts/ai-images", { method: "POST", token, body: { prompt: aiImagePrompt } });
      setAiImages(d.images || []);
    } catch (e) { toastFromError(e, "Image generation failed"); }
    finally { setImgLoading(false); }
  }

  function addAiImage(url) {
    if (aiSelectedUrls.includes(url)) return;
    setAiSelectedUrls((prev) => [...prev, url]);
    setMediaPreviews((p) => [...p, url]);
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return;
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (k !== "mediaUrl") fd.append(k, String(v)); });
      mediaFiles.forEach((f) => fd.append("media", f));
      aiSelectedUrls.forEach((url) => fd.append("mediaUrls", url));
      if (form.mediaUrl.trim()) fd.append("mediaUrls", form.mediaUrl.trim());

      if (editPost) {
        fd.append("replaceMedia", "true");
        // surviving original DB URLs (after user may have removed some)
        origUrls.forEach((url) => fd.append("mediaUrls", url));
        await apiForm(`/api/app/posts/${editPost._id}`, { method: "PATCH", token, formData: fd });
      } else {
        await apiForm("/api/app/posts", { method: "POST", token, formData: fd });
      }
      toastSuccess(editPost ? "Post updated!" : "Post published!");
      onSaved();
      onClose();
    } catch (err) { toastFromError(err, "Failed to save post"); }
    finally { setSaving(false); }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl flex flex-col" style={{ maxHeight: "90vh" }}>
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 flex-shrink-0">
          <h2 className="text-base font-bold text-slate-900">{editPost ? "Edit Post" : "Create New Post"}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <LuX className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="overflow-y-auto flex-1">
          <div className="space-y-4 p-6">
            {/* AI Fill */}
            <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <LuSparkles className="h-4 w-4 text-violet-600" />
                <span className="text-sm font-semibold text-violet-800">✨ AI Content Generator</span>
              </div>
              <p className="text-xs text-violet-600 mb-3">Topic likho — AI title, summary, content, tags sab generate karega</p>
              <div className="flex gap-2">
                <input value={aiTopic} onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="e.g. India election 2025 campaign"
                  className="flex-1 rounded-lg border border-violet-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400" />
                <button type="button" onClick={aiFill} disabled={aiLoading || !aiTopic.trim()}
                  className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50">
                  <LuSparkles className="h-4 w-4" />{aiLoading ? "Generating…" : "✨ AI Fill"}
                </button>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Title <span className="text-red-500">*</span></label>
              <input value={form.title} onChange={(e) => setField("title", e.target.value)} required
                placeholder="Post title"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>

            {/* Category + Author */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Category</label>
                <select value={form.category} onChange={(e) => setField("category", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                  {CATEGORIES.filter((c) => c !== "All").map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Author</label>
                <input value={form.author} onChange={(e) => setField("author", e.target.value)}
                  placeholder="Author name"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
            </div>

            {/* Summary */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Summary</label>
              <textarea value={form.summary} onChange={(e) => setField("summary", e.target.value)} rows={2}
                placeholder="Short description"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
            </div>

            {/* Content */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Content <span className="text-red-500">*</span></label>
              <textarea value={form.content} onChange={(e) => setField("content", e.target.value)} required rows={6}
                placeholder="Full post content..."
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
            </div>

            {/* Media */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <LuImage className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-semibold text-slate-700">Photos &amp; Videos</span>
              </div>
              <button type="button" onClick={() => fileRef.current?.click()}
                className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 transition w-full text-center">
                Upload images &amp; videos (multiple)
              </button>
              <input ref={fileRef} type="file" multiple accept="image/*,video/mp4,video/webm" onChange={onFileChange} className="hidden" />

              {mediaPreviews.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {mediaPreviews.map((src, i) => (
                    <div key={i} className="relative">
                      <img src={src} alt="" className="h-16 w-16 rounded-lg object-cover border border-slate-200" />
                      <button type="button" onClick={() => removePreview(i)}
                        className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white text-[10px]">×</button>
                    </div>
                  ))}
                </div>
              )}

              {/* AI Image Generator */}
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <LuSparkles className="h-3.5 w-3.5 text-amber-600" />
                  <span className="text-xs font-semibold text-amber-800">🎨 AI Image Generator (Unsplash)</span>
                </div>
                <div className="flex gap-2">
                  <input value={aiImagePrompt} onChange={(e) => setAiImagePrompt(e.target.value)}
                    placeholder="e.g. India politics rally vibrant crowd"
                    className="flex-1 rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400" />
                  <button type="button" onClick={generateImages} disabled={imgLoading || !aiImagePrompt.trim()}
                    className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 disabled:opacity-50 min-w-[90px]">
                    {imgLoading ? "Searching…" : "✨ Generate 6"}
                  </button>
                </div>
                {aiImages.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {aiImages.map((img) => (
                      <button key={img.id} type="button" onClick={() => addAiImage(img.url)}
                        className={`relative overflow-hidden rounded-lg border-2 transition ${aiSelectedUrls.includes(img.url) ? "border-amber-500 ring-2 ring-amber-300" : "border-transparent hover:border-amber-400"}`}>
                        <img src={img.thumb} alt={img.alt} className="h-16 w-16 object-cover" crossOrigin="anonymous" />
                        {aiSelectedUrls.includes(img.url) && (
                          <span className="absolute inset-0 flex items-center justify-center bg-amber-500/40">
                            <LuCheck className="h-5 w-5 text-white drop-shadow" />
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
                {aiImages.length > 0 && (
                  <p className="mt-1.5 text-[10px] text-amber-600">Image click karo select karne ke liye</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Or paste image URL:</label>
                <input value={form.mediaUrl} onChange={(e) => setField("mediaUrl", e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Tags (comma separated)</label>
              <input value={form.tags} onChange={(e) => setField("tags", e.target.value)}
                placeholder="politics, campaign, India"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>

            {/* Publish toggle */}
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div className={`relative h-5 w-9 rounded-full transition ${form.published ? "bg-indigo-600" : "bg-slate-300"}`}
                onClick={() => setField("published", !form.published)}>
                <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${form.published ? "translate-x-4" : ""}`} />
              </div>
              <span className="text-sm font-medium text-slate-700">Publish immediately</span>
            </label>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button type="button" onClick={onClose}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Cancel
              </button>
              <button type="submit" disabled={saving || !form.title.trim() || !form.content.trim()}
                className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
                {saving ? "Saving…" : editPost ? "Update Post" : "Publish Post"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function AppNews() {
  const { token } = useAuth();
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editPost, setEditPost] = useState(null);
  const [viewPost, setViewPost] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ category, search: appliedSearch });
      const d = await api(`/api/app/posts?${qs}`, { token });
      setData(d);
    } catch (e) {
      toastFromError(e, "Failed to load posts");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [token, category, appliedSearch]);

  useEffect(() => { load(); }, [load]);

  async function onDelete(post) {
    if (!window.confirm(`Delete "${post.title}"?`)) return;
    try {
      await api(`/api/app/posts/${post._id}`, { method: "DELETE", token });
      toastSuccess("Post deleted");
      load();
    } catch (e) { toastFromError(e, "Failed to delete"); }
  }

  function openEdit(post) { setViewPost(null); setEditPost(post); setModalOpen(true); }
  function openCreate() { setEditPost(null); setModalOpen(true); }

  const posts = data?.posts || [];

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow">
            <LuNewspaper className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <div>
            <h2 className="text-xl font-bold text-slate-900">News &amp; Posts</h2>
            <p className="text-sm text-slate-500">Create and manage your content</p>
          </div>
        </div>
        <button type="button" onClick={openCreate}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 shadow-sm transition">
          <LuPlus className="h-4 w-4" /> Create Post
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {CATEGORIES.map((c) => (
          <button key={c} type="button" onClick={() => setCategory(c)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${category === c ? "border-indigo-500 bg-indigo-600 text-white shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
            {c}
          </button>
        ))}
      </div>

      <form className="flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); setAppliedSearch(search.trim()); }}>
        <div className="relative flex-1 max-w-sm">
          <LuSearch className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" strokeWidth={1.75} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search posts…"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
        <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Search</button>
      </form>

      {loading ? (
        <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white text-sm text-slate-400">
          <span className="animate-pulse">Loading posts…</span>
        </div>
      ) : !posts.length ? (
        <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white text-sm text-slate-400">
          <LuNewspaper className="h-8 w-8 text-slate-300" />
          <p>No posts yet. Click <strong>Create Post</strong> to get started.</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-slate-400">{data?.total ?? posts.length} post{posts.length !== 1 ? "s" : ""}</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <PostCard key={p._id} post={p} onEdit={openEdit} onDelete={onDelete} onView={setViewPost} />
            ))}
          </div>
        </>
      )}

      <PostModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditPost(null); }}
        onSaved={load}
        token={token}
        editPost={editPost}
      />

      <ViewModal
        post={viewPost}
        onClose={() => setViewPost(null)}
        onEdit={() => openEdit(viewPost)}
      />
    </div>
  );
}
