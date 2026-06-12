import { useEffect, useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import {
  LuFolder, LuFolderOpen, LuSearch, LuEye, LuTrash2, LuCopy,
  LuCheck, LuX, LuCalendar, LuArrowLeft, LuPencil, LuPlus,
  LuSparkles, LuChevronDown, LuLoader, LuSettings2,
} from "react-icons/lu";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { api } from "../../lib/api";
import { toastFromError, toastSuccess } from "../../lib/toast";
import { CreateContentModal } from "./AppCreateContent";

// ── Helpers ────────────────────────────────────────────────

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  const str = Array.isArray(text) ? text.join(" ") : (text || "");
  return (
    <button onClick={() => { navigator.clipboard.writeText(str); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition">
      {copied ? <LuCheck className="h-3.5 w-3.5 text-green-500" /> : <LuCopy className="h-3.5 w-3.5" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function OutputBlock({ label, value }) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;
  if (Array.isArray(value) && value.length === 0) return null;
  const text = Array.isArray(value) ? value.join("\n") : value;
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</span>
        <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50">
          {copied ? <LuCheck className="h-3 w-3 text-green-500" /> : <LuCopy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div className="prose prose-sm max-w-none text-slate-700"><ReactMarkdown>{text}</ReactMarkdown></div>
    </div>
  );
}

function Badge({ label, color = "slate" }) {
  const cls = {
    indigo:  "bg-indigo-50 text-indigo-700 border-indigo-100",
    violet:  "bg-violet-50 text-violet-700 border-violet-100",
    slate:   "bg-slate-50  text-slate-600  border-slate-100",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
  }[color] || "bg-slate-50 text-slate-600 border-slate-100";
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${cls}`}>
      {label}
    </span>
  );
}

const FOLDER_COLORS = ["#6366f1","#8b5cf6","#ec4899","#f97316","#10b981","#0ea5e9","#f59e0b","#ef4444"];

// ── Folder Create/Edit Modal ───────────────────────────────

function FolderModal({ open, onClose, onSaved, token, editFolder }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Alpha");
  const [color, setColor] = useState(FOLDER_COLORS[0]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(editFolder?.name || "");
      setDescription(editFolder?.description || "");
      setCategory(editFolder?.category || "Alpha");
      setColor(editFolder?.color || FOLDER_COLORS[0]);
    }
  }, [open, editFolder]);

  if (!open) return null;

  async function onSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const body = { name, description, category, color };
      if (editFolder) {
        await api(`/api/app/content/folders/${editFolder._id}`, { method: "PATCH", token, body });
        toastSuccess("Folder updated!");
      } else {
        await api("/api/app/content/folders", { method: "POST", token, body });
        toastSuccess("Folder created!");
      }
      onSaved(); onClose();
    } catch (err) {
      toastFromError(err, "Failed to save folder");
    } finally { setSaving(false); }
  }

  const inp = "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400";
  const CATEGORY_META = {
    Alpha: { color: "text-emerald-700 bg-emerald-50 border-emerald-200", desc: "High priority / Primary" },
    Beta:  { color: "text-amber-700 bg-amber-50 border-amber-200",       desc: "Medium priority / Secondary" },
    Gamma: { color: "text-slate-600 bg-slate-50 border-slate-200",       desc: "Low priority / Experimental" },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl shadow text-white" style={{ backgroundColor: color }}>
              <LuFolder className="h-4 w-4" />
            </span>
            <h3 className="text-base font-bold text-slate-900">{editFolder ? "Edit Folder" : "Create Folder"}</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><LuX className="h-5 w-5" /></button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Folder Name <span className="text-red-400">*</span></label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. LinkedIn Posts, Blogs" className={inp} required autoFocus />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              placeholder="What kind of content will go in this folder?" rows={3} className={inp + " resize-none"} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Category</label>
            <div className="relative">
              <select value={category} onChange={e => setCategory(e.target.value)} className={inp + " appearance-none pr-8"}>
                <option value="Alpha">Alpha</option>
                <option value="Beta">Beta</option>
                <option value="Gamma">Gamma</option>
              </select>
              <LuChevronDown className="pointer-events-none absolute right-2.5 top-3 h-4 w-4 text-slate-400" />
            </div>
            {category && (
              <p className={`mt-1.5 text-xs font-medium px-2.5 py-1 rounded-full border inline-block ${CATEGORY_META[category].color}`}>
                {CATEGORY_META[category].desc}
              </p>
            )}
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Color</label>
            <div className="flex gap-2 flex-wrap">
              {FOLDER_COLORS.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className={`h-7 w-7 rounded-full border-2 transition ${color === c ? "border-slate-800 scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
              {saving ? "Saving…" : editFolder ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Content View Modal ─────────────────────────────────────

function ContentViewModal({ item, onClose, token }) {
  const [full, setFull] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!item) { setFull(null); return; }
    setLoading(true);
    api(`/api/app/content/${item._id}`, { token })
      .then(d => setFull(d.content))
      .catch(() => setFull(item))
      .finally(() => setLoading(false));
  }, [item?._id]);

  if (!item) return null;
  const d = full || item;
  const o = d.output || {};

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pb-10">
      <button type="button" className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-4xl rounded-2xl bg-white shadow-2xl my-6 flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 sticky top-0 bg-white rounded-t-2xl z-10">
          <div className="flex-1 min-w-0 pr-4">
            <h3 className="text-base font-bold text-slate-900 truncate">{o.title || d.topic || "Content"}</h3>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {d.contentType && <Badge label={d.contentType} color="indigo" />}
              {d.platform    && <Badge label={d.platform}    color="violet" />}
              {d.language    && <Badge label={d.language}    color="slate" />}
              {d.status      && <Badge label={d.status}      color="emerald" />}
            </div>
          </div>
          <button onClick={onClose} className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><LuX className="h-5 w-5" /></button>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-20"><LuLoader className="h-6 w-6 animate-spin text-indigo-500" /></div>
        ) : (
          <div className="overflow-y-auto flex-1 p-6 space-y-4">
            {o.scores && Object.values(o.scores).some(Boolean) && (
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                {[["SEO",o.scores.seo],["AEO",o.scores.aeo],["GEO",o.scores.geo],
                  ["Read",o.scores.readability],["Human",o.scores.humanScore],
                  ["AI Det",o.scores.aiDetection],["Orig",o.scores.originality]
                ].map(([l,v]) => v ? (
                  <div key={l} className="rounded-lg border border-slate-100 bg-slate-50 p-2 text-center">
                    <div className={`text-base font-bold ${v>=80?"text-emerald-600":v>=60?"text-amber-600":"text-red-600"}`}>{v}</div>
                    <div className="text-[9px] font-semibold text-slate-400">{l}</div>
                  </div>
                ) : null)}
              </div>
            )}
            <OutputBlock label="Title"                   value={o.title} />
            <OutputBlock label="Meta Title"              value={o.metaTitle} />
            <OutputBlock label="Meta Description"        value={o.metaDesc} />
            <OutputBlock label="Slug"                    value={o.slug} />
            <OutputBlock label="Keywords"                value={o.keywords} />
            <OutputBlock label="Full Content"            value={o.content} />
            <OutputBlock label="FAQ"                     value={o.faq} />
            <OutputBlock label="Call to Action"          value={o.cta} />
            <OutputBlock label="Hashtags"                value={o.hashtags} />
            <OutputBlock label="Image Generation Prompt" value={o.imagePrompt} />
            <OutputBlock label="Video Script"            value={o.videoPrompt} />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Content Card ──────────────────────────────────────────

function ContentCard({ item, folder, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handle(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const title = item.output?.title || item.topic || "Untitled";
  const date = item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" }) + " · " + new Date(item.createdAt).toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit", hour12:true }) : "—";

  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-white bg-white p-5 shadow-sm hover:shadow-xl hover:bg-slate-50 hover:-translate-y-0.5 hover:scale-[1.01] transition-all duration-200 cursor-pointer"
      onClick={() => navigate(`/app/contents/${item._id}`, { state: { folderId: item.folderId, topic: item.topic } })}>
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className="mt-0.5 shrink-0 h-10 w-10 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-sm"
          style={{ backgroundColor: folder?.color || "#6366f1" }}>
          {(item.contentType || "C").slice(0,2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">{title}</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {item.contentType && <Badge label={item.contentType} color="indigo" />}
            {Array.isArray(item.platforms) && item.platforms.length > 0
              ? item.platforms.map(p => <Badge key={p} label={p} color="violet" />)
              : item.platform && <Badge label={item.platform} color="violet" />}
            {item.language    && <Badge label={item.language}    color="slate" />}
            {item.status      && <Badge label={item.status}      color="emerald" />}
          </div>
          <p className="mt-1.5 text-[11px] text-slate-400 flex items-center gap-1">
            <LuCalendar className="h-3 w-3" />{date}
          </p>
        </div>
      </div>
      <div className="relative shrink-0" ref={ref} onClick={e => e.stopPropagation()}>
        <button onClick={() => setOpen(p => !p)}
          className="rounded-xl border border-slate-200 p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition">
          <LuSettings2 className="h-4 w-4" />
        </button>
        {open && (
          <div className="absolute right-0 top-10 z-30 w-40 rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden">
            <button onClick={() => { setOpen(false); navigate(`/app/contents/${item._id}`, { state: { folderId: item.folderId, topic: item.topic } }); }}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition">
              <LuEye className="h-4 w-4" /> View
            </button>
            <div className="border-t border-slate-100" />
            <button onClick={() => { setOpen(false); onDelete(item); }}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition">
              <LuTrash2 className="h-4 w-4" /> Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Topic Card ────────────────────────────────────────────

function TopicCard({ topic, items, idx, folder, onTopicClick }) {
  const typeMap = {}, platMap = {};
  items.forEach(c => {
    if (c.contentType) typeMap[c.contentType] = (typeMap[c.contentType]||0)+1;
    if (c.platform)    platMap[c.platform]    = (platMap[c.platform]   ||0)+1;
  });
  const latest = items.reduce((a,b) => new Date(a.createdAt)>new Date(b.createdAt)?a:b, items[0]);
  const latestDate = latest?.createdAt
    ? new Date(latest.createdAt).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})
    : "—";

  return (
    <div className="rounded-2xl border border-white bg-white shadow-sm overflow-hidden hover:shadow-xl hover:bg-slate-50 hover:-translate-y-0.5 hover:scale-[1.01] transition-all duration-200 cursor-pointer"
      onClick={() => onTopicClick(topic, items)}>
      <div className="h-1 w-full" style={{ backgroundColor: folder.color }} />
      <div className="flex items-start gap-4 p-5">
        <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-xl text-white text-sm font-bold shadow-sm"
          style={{ backgroundColor: folder.color }}>
          {String(idx+1).padStart(2,"0")}
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Topic</p>
            <p className="text-sm font-bold text-slate-900 leading-snug mt-0.5 line-clamp-2">{topic}</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(typeMap).map(([k,v]) => (
              <span key={k} className="inline-flex items-center rounded-full bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700">
                {k} <span className="ml-1 font-bold text-indigo-500">{v}</span>
              </span>
            ))}
            {Object.keys(platMap).map(k => (
              <span key={k} className="inline-flex items-center rounded-full bg-violet-50 border border-violet-100 px-2.5 py-0.5 text-[11px] font-semibold text-violet-700">
                {k}
              </span>
            ))}
          </div>
          <p className="text-[11px] text-slate-400 flex items-center gap-1">
            <LuCalendar className="h-3 w-3" /> Latest: {latestDate}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Topic Contents Page ───────────────────────────────────

function TopicContents({ topic, items, folder, onBack, onDelete }) {
  const [typeFilter, setTypeFilter] = useState("All");
  const types = ["All", ...Array.from(new Set(items.map(c => c.contentType).filter(Boolean)))];
  const filtered = typeFilter === "All" ? items : items.filter(c => c.contentType === typeFilter);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={onBack}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
            <LuArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="h-8 w-1.5 rounded-full" style={{ backgroundColor: folder.color }} />
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Topic</p>
            <h2 className="text-base font-bold text-slate-900 leading-snug">{topic}</h2>
          </div>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          {filtered.length} of {items.length} contents
        </span>
      </div>

      {/* Content Type Filter */}
      <div className="flex flex-wrap gap-2">
        {types.map(t => (
          <button key={t} onClick={() => setTypeFilter(t)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
              typeFilter === t
                ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}>
            {t}
          </button>
        ))}
      </div>

      {/* Contents */}
      {filtered.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-10">No contents for this type.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((item, i) => (
            <ContentCard key={item._id || i} item={item} folder={folder} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Contents List (inside a folder) ───────────────────────

function FolderContents({ folder, token, onBack, initialTopic }) {
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [openTopic, setOpenTopic] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const d = await api(`/api/app/content?limit=200&folderId=${folder._id}`, { token });
      setContents(d.items || []);
    } catch (e) { toastFromError(e, "Failed to load contents"); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [folder._id]);

  // Restore topic on back navigation
  useEffect(() => {
    if (initialTopic && contents.length > 0) {
      const topicItems = contents.filter(c => (c.topic || "Untitled").trim() === initialTopic);
      if (topicItems.length > 0) setOpenTopic({ topic: initialTopic, items: topicItems });
    }
  }, [initialTopic, contents]);

  async function onDelete(item) {
    if (!window.confirm(`Delete "${item.output?.title || item.topic}"?`)) return;
    try {
      await api(`/api/app/content/${item._id}`, { method: "DELETE", token });
      toastSuccess("Content deleted.");
      // update local state too
      setContents(p => p.filter(c => c._id !== item._id));
      if (openTopic) {
        const updated = openTopic.items.filter(c => c._id !== item._id);
        if (updated.length === 0) setOpenTopic(null);
        else setOpenTopic({ ...openTopic, items: updated });
      }
    } catch (e) { toastFromError(e, "Failed to delete"); }
  }

  // Group by topic
  const topicMap = {};
  contents.forEach(c => {
    const key = (c.topic || "Untitled").trim();
    if (!topicMap[key]) topicMap[key] = [];
    topicMap[key].push(c);
  });
  const topics = Object.entries(topicMap).filter(([t]) =>
    !search || t.toLowerCase().includes(search.toLowerCase())
  );

  // Show topic contents page
  if (openTopic) {
    return (
      <div className="space-y-5">
        <TopicContents
          topic={openTopic.topic}
          items={openTopic.items}
          folder={folder}
          onBack={() => setOpenTopic(null)}
          onDelete={onDelete}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={onBack}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
            <LuArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="h-8 w-1.5 rounded-full" style={{ backgroundColor: folder.color }} />
          <div>
            <h2 className="text-lg font-bold text-slate-900">{folder.name}</h2>
            <p className="text-xs text-slate-400">
              {topics.length} topic{topics.length !== 1 ? "s" : ""} &middot; {contents.length} content{contents.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <button onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition shadow-sm">
          <LuSparkles className="h-4 w-4" /> Generate Content
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <LuSearch className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search topics…"
          className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20" />
      </div>

      {/* Topics */}
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100" />)}</div>
      ) : topics.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
          <LuFolderOpen className="h-10 w-10 text-slate-300" />
          <p className="text-sm font-semibold text-slate-700">No contents in this folder yet.</p>
          <button onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
            <LuSparkles className="h-4 w-4" /> Generate Content
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {topics.map(([topic, items], tidx) => (
            <TopicCard
              key={topic}
              topic={topic}
              items={items}
              idx={tidx}
              folder={folder}
              onTopicClick={(t, i) => setOpenTopic({ topic: t, items: i })}
            />
          ))}
        </div>
      )}

      <CreateContentModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        folderId={folder._id}
        folderName={folder.name}
        onCreated={() => { setCreateOpen(false); load(); }}
      />
    </div>
  );
}

// ── Main AppContents ───────────────────────────────────────

export function AppContents() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editFolder, setEditFolder] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [folderContents, setFolderContents] = useState({});
  const [contentsLoading, setContentsLoading] = useState({});
  const [viewItem, setViewItem] = useState(null);
  const [openFolder, setOpenFolder] = useState(null);
  const [folderSearch, setFolderSearch] = useState("");
  const [folderOrder, setFolderOrder] = useState("asc");
  const [folderCategory, setFolderCategory] = useState("All");

  async function loadFolders() {
    setLoading(true);
    try {
      const d = await api("/api/app/content/folders", { token });
      const foldersData = d.folders || [];
      setFolders(foldersData.slice().sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));
      foldersData.forEach(f => loadFolderContents(f._id));
      // Restore folder/topic from back navigation state (only once, then clear)
      const { folderId, topic } = location.state || {};
      if (folderId) {
        const folder = foldersData.find(f => f._id === folderId);
        if (folder) setOpenFolder(folder);
        // Clear state so refresh doesn't restore
        window.history.replaceState({}, "");
      }
    } catch (e) { toastFromError(e, "Failed to load folders"); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadFolders(); }, [token]);

  async function loadFolderContents(folderId) {
    setContentsLoading(p => ({ ...p, [folderId]: true }));
    try {
      const d = await api(`/api/app/content?limit=200&folderId=${folderId}`, { token });
      setFolderContents(p => ({ ...p, [folderId]: d.items || [] }));
    } catch (e) { toastFromError(e, "Failed to load contents"); }
    finally { setContentsLoading(p => ({ ...p, [folderId]: false })); }
  }

  function toggleFolder(folderId) {
    if (expandedId === folderId) { setExpandedId(null); return; }
    setExpandedId(folderId);
    if (!folderContents[folderId]) loadFolderContents(folderId);
  }

  async function onDeleteFolder(folder) {
    if (!window.confirm(`Delete folder "${folder.name}"?`)) return;
    try {
      await api(`/api/app/content/folders/${folder._id}`, { method: "DELETE", token });
      toastSuccess("Folder deleted."); loadFolders();
    } catch (e) { toastFromError(e, "Failed to delete folder"); }
  }

  async function onDeleteContent(item, folderId) {
    if (!window.confirm(`Delete "${item.output?.title || item.topic}"?`)) return;
    try {
      await api(`/api/app/content/${item._id}`, { method: "DELETE", token });
      toastSuccess("Content deleted.");
      loadFolderContents(folderId);
      loadFolders();
    } catch (e) { toastFromError(e, "Failed to delete"); }
  }

  const catCls = {
    Alpha: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Beta:  "bg-amber-50 text-amber-700 border-amber-200",
    Gamma: "bg-slate-50 text-slate-600 border-slate-200",
  };

  if (openFolder) {
    return (
      <div className="p-4 sm:p-6">
        <FolderContents
          folder={openFolder}
          token={token}
          onBack={() => setOpenFolder(null)}
          initialTopic={(location.state?.folderId === openFolder._id) ? location.state?.topic : null}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 sm:p-6">

      {/* Top Row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="relative">
              <LuSearch className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input value={folderSearch} onChange={e => setFolderSearch(e.target.value)}
                placeholder="Search folders…"
                className="w-80 rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20" />
            </div>
            <div className="flex flex-col border border-slate-200 rounded-lg overflow-hidden">
              <button onClick={() => setFolderOrder("asc")}
                className={`px-2 py-1 transition ${folderOrder === "asc" ? "bg-indigo-600 text-white" : "bg-white text-slate-400 hover:bg-slate-50"}`}
                title="Ascending">
                <LuChevronDown className="h-3.5 w-3.5 rotate-180" />
              </button>
              <button onClick={() => setFolderOrder("desc")}
                className={`px-2 py-1 transition border-t border-slate-200 ${folderOrder === "desc" ? "bg-indigo-600 text-white" : "bg-white text-slate-400 hover:bg-slate-50"}`}
                title="Descending">
                <LuChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {["All","Alpha","Beta","Gamma"].map(cat => (
              <button key={cat} onClick={() => setFolderCategory(cat)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                  folderCategory === cat
                    ? "bg-indigo-600 border-indigo-600 text-white"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}>
                {cat}
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => { setEditFolder(null); setModalOpen(true); }}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition">
          <LuPlus className="h-4 w-4" /> Create Folder
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100" />)}</div>
      ) : folders.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-slate-200 bg-white py-20 text-center">
          <LuFolder className="h-12 w-12 text-slate-300" />
          <p className="text-sm font-semibold text-slate-700">No folders yet</p>
          <p className="text-xs text-slate-400">Create a folder to organise your generated contents.</p>
          <button onClick={() => { setEditFolder(null); setModalOpen(true); }}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
            <LuPlus className="h-4 w-4" /> Create Folder
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {folders
            .filter(f =>
              (!folderSearch || f.name.toLowerCase().includes(folderSearch.toLowerCase()) || (f.description||"").toLowerCase().includes(folderSearch.toLowerCase())) &&
              (folderCategory === "All" || f.category === folderCategory)
            )
            .sort((a,b) => folderOrder === "asc" ? new Date(a.createdAt)-new Date(b.createdAt) : new Date(b.createdAt)-new Date(a.createdAt))
            .map((folder, idx, arr) => {
              const displayNum = folderOrder === "asc" ? idx+1 : arr.length-idx;
              const isExpanded = expandedId === folder._id;
              const contents  = folderContents[folder._id] || [];
              const isLoading = contentsLoading[folder._id];

              const typeMap = {}, platMap = {}, statMap = {};
              contents.forEach(c => {
                if (c.contentType) typeMap[c.contentType] = (typeMap[c.contentType]||0)+1;
                if (c.platform)    platMap[c.platform]    = (platMap[c.platform]   ||0)+1;
                if (c.status)      statMap[c.status]      = (statMap[c.status]     ||0)+1;
              });

              return (
                <div key={folder._id} className="rounded-2xl border border-white bg-white shadow-sm overflow-hidden hover:shadow-xl hover:bg-slate-50 hover:-translate-y-0.5 hover:scale-[1.01] transition-all duration-200">
                  <div className="relative flex items-start gap-4 px-5 py-4 cursor-pointer hover:bg-slate-50 transition"
                    onClick={() => setOpenFolder(folder)}>
                    <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: folder.color }} />
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-500">
                      {displayNum}
                    </span>
                    <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
                      style={{ backgroundColor: folder.color }}>
                      <LuFolder className="h-5 w-5" />
                    </span>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-slate-900">{folder.name}</p>
                        {folder.category && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${catCls[folder.category] || catCls.Gamma}`}>
                            {folder.category}
                          </span>
                        )}
                        <span className="text-xs font-semibold text-slate-500 bg-slate-100 rounded-full px-2 py-0.5">
                          {folder.contentCount || 0} contents
                        </span>
                        {folder.createdAt && (
                          <span className="text-[10px] text-slate-400">
                            {new Date(folder.createdAt).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}
                            {" "}
                            {new Date(folder.createdAt).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:true})}
                          </span>
                        )}
                      </div>
                      {folder.description && <p className="text-xs text-slate-400 line-clamp-1">{folder.description}</p>}
                      {contents.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {Object.entries(typeMap).map(([k,v]) => (
                            <span key={k} className="inline-flex items-center rounded-full bg-indigo-50 border border-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                              {k} · {v}
                            </span>
                          ))}
                          {Object.entries(platMap).map(([k,v]) => (
                            <span key={k} className="inline-flex items-center rounded-full bg-violet-50 border border-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
                              {k} · {v}
                            </span>
                          ))}
                          {Object.entries(statMap).map(([k,v]) => (
                            <span key={k} className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                              {k} · {v}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      <button onClick={() => { setEditFolder(folder); setModalOpen(true); }}
                        className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:bg-slate-100 transition">
                        <LuPencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => onDeleteFolder(folder)}
                        className="rounded-lg border border-red-100 p-1.5 text-red-400 hover:bg-red-50 transition">
                        <LuTrash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      <ContentViewModal item={viewItem} onClose={() => setViewItem(null)} token={token} />
      <FolderModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditFolder(null); }}
        onSaved={loadFolders}
        token={token}
        editFolder={editFolder}
      />
    </div>
  );
}
