import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import {
  LuSparkles, LuChevronDown, LuLoader, LuCopy, LuCheck,
  LuArrowLeft, LuFolder, LuX, LuZap, LuBrain, LuPenLine,
} from "react-icons/lu";
import { useAuth } from "../../auth/AuthProvider";
import { api } from "../../lib/api";
import { toastFromError, toastSuccess } from "../../lib/toast";
import { useGeneration } from "../../components/GenerationContext";

const CONTENT_TYPES = [
  "Article", "Blog", "FAQs", "Review", "Analysis", "Comparison", "Case Study",
  "Guide", "Tutorial", "Checklist", "White Paper", "Research Report", "Interview",
  "Opinion", "Success Story", "News Summary", "Listicle", "Infographic",
  "Myth vs Fact", "Resource Collection",
];
const DOMAINS = [
  "Technology", "Artificial Intelligence (AI)", "Startups", "Business", "Finance",
  "Jobs & Careers", "Marketing", "Branding", "Leadership", "Entrepreneurship",
  "Sales", "Productivity", "Education", "Software Development", "Cyber Security",
  "Data Science", "E-commerce", "Innovation", "Investment & Venture Capital", "Digital Transformation",
];
const PLATFORMS = [
  "LinkedIn", "Medium", "Blogger", "Reddit", "Quora", "X (Twitter)", "Facebook",
  "Instagram", "Threads", "YouTube", "Dev.to", "Hashnode", "Substack", "Tumblr",
  "Pinterest", "GitHub Discussions", "Discord", "Slack", "Product Hunt", "Indie Hackers",
];
const TONES       = ["Professional", "Casual", "Visionary", "Authoritative", "Friendly", "Expert", "Inspirational"];
const LANGUAGES   = ["English", "Hindi", "Spanish", "French", "German", "Arabic", "Portuguese", "Bengali", "Tamil", "Telugu"];
const WORD_COUNTS = [300, 500, 800, 1000, 1200, 1500, 2000, 2500, 3000];

// Type colors for badges
const TYPE_COLORS = [
  "bg-indigo-100 text-indigo-700 border-indigo-200",
  "bg-violet-100 text-violet-700 border-violet-200",
  "bg-emerald-100 text-emerald-700 border-emerald-200",
  "bg-amber-100 text-amber-700 border-amber-200",
  "bg-rose-100 text-rose-700 border-rose-200",
  "bg-cyan-100 text-cyan-700 border-cyan-200",
  "bg-orange-100 text-orange-700 border-orange-200",
];

const mkEmpty = (folderId = "") => ({
  topic: "", domain: DOMAINS[0],
  typeConfig: { "Article": 1 },
  platforms: [PLATFORMS[0]], tone: TONES[0], language: LANGUAGES[0], wordCount: 1000,
  primaryKeyword: "", secondaryKeyword: "", targetLocation: "", folderId,
  options: {
    seoOptimized: true, aeoOptimized: true, geoOptimized: false, humanized: true,
    addCta: true, addHashtags: true, addFaq: false,
    generateImagePrompt: false, generateVideoScript: false,
    addMetaTitle: true, addMetaDesc: true,
    addInternalLinks: false, addExternalRefs: false,
  },
});

const inputCls = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400";

function Field({ label, required, hint, children }) {
  return (
    <div>
      <label className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}{required && <span className="text-red-400">*</span>}
        {hint && <span className="ml-auto text-[10px] normal-case font-medium text-slate-400">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

function Select({ label, required, value, onChange, options }) {
  return (
    <Field label={label} required={required}>
      <div className="relative">
        <select value={value} onChange={e => onChange(e.target.value)} className={inputCls + " appearance-none pr-8"}>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <LuChevronDown className="pointer-events-none absolute right-2.5 top-3 h-4 w-4 text-slate-400" />
      </div>
    </Field>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-100 bg-white px-4 py-3 hover:bg-slate-50 transition">
      <div onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${checked ? "bg-indigo-600" : "bg-slate-200"}`}>
        <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"}`} />
      </div>
      <span className="text-sm font-medium text-slate-700">{label}</span>
    </label>
  );
}

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
  if (!value) return null;
  if (Array.isArray(value) && value.length === 0) return null;
  const text = Array.isArray(value) ? value.join("\n") : value;
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</span>
        <CopyBtn text={text} />
      </div>
      <div className="prose prose-sm max-w-none text-slate-700">
        <ReactMarkdown>{text}</ReactMarkdown>
      </div>
    </div>
  );
}

function SectionNum({ n, label }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white text-xs font-bold">{n}</span>
      <span className="text-sm font-bold text-slate-900 uppercase tracking-wide">{label}</span>
    </div>
  );
}

// ── Platform Multi-Select Matrix ────────────────────────────

function PlatformMatrix({ platforms, onChange }) {
  function toggle(p) {
    if (platforms.includes(p)) {
      if (platforms.length === 1) return; // at least 1 required
      onChange(platforms.filter(x => x !== p));
    } else {
      onChange([...platforms, p]);
    }
  }
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-0 divide-y divide-slate-100">
        {PLATFORMS.map(p => {
          const isActive = platforms.includes(p);
          return (
            <button key={p} type="button" onClick={() => toggle(p)}
              className={`flex items-center gap-2.5 px-4 py-2.5 text-left transition ${
                isActive ? "bg-indigo-50" : "bg-white hover:bg-slate-50"
              }`}>
              <span className={`h-4 w-4 rounded shrink-0 border-2 flex items-center justify-center transition ${
                isActive ? "bg-indigo-600 border-indigo-600" : "border-slate-300 bg-white"
              }`}>
                {isActive && <LuCheck className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
              </span>
              <span className={`text-sm font-medium truncate ${
                isActive ? "text-indigo-700" : "text-slate-500"
              }`}>{p}</span>
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between bg-slate-50 border-t border-slate-200 px-4 py-2">
        <span className="text-xs text-slate-500">
          <span className="font-semibold text-slate-700">{platforms.length}</span> platform{platforms.length > 1 ? "s" : ""} selected
        </span>
        <span className="text-xs font-medium text-indigo-600">{platforms.join(", ")}</span>
      </div>
    </div>
  );
}

// ── Content Type Matrix (Row per type, count boxes) ────────

const COUNT_BOXES = [1, 2, 3, 4, 5];

function ContentTypeMatrix({ typeConfig, onChange }) {
  function setCount(type, count) {
    const next = { ...typeConfig };
    if (count === 0) {
      // deselect — but keep at least 1 type selected
      const selected = Object.keys(next).filter(t => next[t] > 0);
      if (selected.length === 1 && selected[0] === type) return;
      delete next[type];
    } else {
      next[type] = count;
    }
    onChange(next);
  }

  function toggleType(type) {
    if (typeConfig[type]) {
      setCount(type, 0);
    } else {
      onChange({ ...typeConfig, [type]: 1 });
    }
  }

  const total = Object.values(typeConfig).reduce((s, v) => s + v, 0);

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[1fr_auto_auto] items-center gap-4 bg-slate-100 px-4 py-2 border-b border-slate-200">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Type</span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 text-center w-48">Count (click to select)</span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 text-right w-16">Total</span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-slate-100 bg-white">
        {CONTENT_TYPES.map((type) => {
          const isActive = !!typeConfig[type];
          const count = typeConfig[type] || 0;
          return (
            <div key={type}
              className={`grid grid-cols-[1fr_auto_auto] items-center gap-4 px-4 py-2.5 transition ${
                isActive ? "bg-indigo-50/50" : "hover:bg-slate-50"
              }`}>
              {/* Type name + toggle */}
              <button type="button" onClick={() => toggleType(type)}
                className="flex items-center gap-2.5 text-left">
                <span className={`h-4 w-4 rounded shrink-0 border-2 flex items-center justify-center transition ${
                  isActive ? "bg-indigo-600 border-indigo-600" : "border-slate-300 bg-white"
                }`}>
                  {isActive && <LuCheck className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                </span>
                <span className={`text-sm font-medium transition ${
                  isActive ? "text-indigo-700" : "text-slate-500"
                }`}>{type}</span>
              </button>

              {/* Count boxes 1–5 */}
              <div className="flex items-center gap-1.5 w-48 justify-center">
                {COUNT_BOXES.map(n => (
                  <button key={n} type="button"
                    onClick={() => setCount(type, isActive && count === n ? 0 : n)}
                    disabled={!isActive && n > 0}
                    className={`h-7 w-7 rounded-md border text-xs font-bold transition ${
                      isActive && count === n
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                        : isActive
                          ? "border-slate-200 bg-white text-slate-500 hover:border-indigo-300 hover:text-indigo-600"
                          : "border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed"
                    }`}>
                    {n}
                  </button>
                ))}
              </div>

              {/* Total for this row */}
              <div className="w-16 text-right">
                {isActive ? (
                  <span className="inline-flex items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5">
                    {count}
                  </span>
                ) : (
                  <span className="text-xs text-slate-300">—</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer summary */}
      <div className="flex items-center justify-between gap-3 bg-slate-50 border-t border-slate-200 px-4 py-2.5">
        <span className="text-xs text-slate-500">
          <span className="font-semibold text-slate-700">{Object.keys(typeConfig).length}</span> type{Object.keys(typeConfig).length > 1 ? "s" : ""} selected
        </span>
        <div className="flex items-center gap-1.5">
          <LuZap className="h-3.5 w-3.5 text-indigo-500" />
          <span className="text-xs font-bold text-indigo-700">{total} content{total > 1 ? "s" : ""} will be generated</span>
        </div>
      </div>
    </div>
  );
}

// ── Batch Result Card ──────────────────────────────────────

function BatchResultCard({ item, index }) {
  const [expanded, setExpanded] = useState(index === 0);
  const o = item.output || {};
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <button type="button" onClick={() => setExpanded(p => !p)}
        className="w-full flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-slate-50 transition">
        <div className="flex items-center gap-3 min-w-0">
          <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${TYPE_COLORS[index % TYPE_COLORS.length]}`}>
            {item.contentType}
          </span>
          <span className="text-sm font-semibold text-slate-800 truncate">{o.title || item.topic || "Untitled"}</span>
        </div>
        <LuChevronDown className={`h-4 w-4 text-slate-400 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>
      {expanded && (
        <div className="border-t border-slate-100 p-5 space-y-4">
          {o.scores && Object.values(o.scores).some(Boolean) && (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
              {[["SEO", o.scores.seo], ["AEO", o.scores.aeo], ["GEO", o.scores.geo],
                ["Read", o.scores.readability], ["Human", o.scores.humanScore],
                ["AI Det", o.scores.aiDetection], ["Orig", o.scores.originality]
              ].map(([l, v]) => v ? (
                <div key={l} className="rounded-lg border border-slate-100 bg-slate-50 p-2 text-center">
                  <div className={`text-base font-bold ${v >= 80 ? "text-emerald-600" : v >= 60 ? "text-amber-600" : "text-red-600"}`}>{v}</div>
                  <div className="text-[9px] font-semibold text-slate-400">{l}</div>
                </div>
              ) : null)}
            </div>
          )}
          <OutputBlock label="Title"                   value={o.title} />
          <OutputBlock label="Meta Description"        value={o.metaDesc} />
          <OutputBlock label="Full Content"            value={o.content} />
          <OutputBlock label="FAQ"                     value={o.faq} />
          <OutputBlock label="Call to Action"          value={o.cta} />
          <OutputBlock label="Hashtags"                value={o.hashtags} />
          <OutputBlock label="Image Generation Prompt" value={o.imagePrompt} />
          <OutputBlock label="Video Script"            value={o.videoPrompt} />
          <OutputBlock label="Meta Title"              value={o.metaTitle} />
          <OutputBlock label="Slug"                    value={o.slug} />
          <OutputBlock label="Keywords"                value={o.keywords} />
        </div>
      )}
    </div>
  );
}

// ── Shared Form Body ───────────────────────────────────────

export function CreateContentForm({ token, folderId, folderName, folders, onSuccess, mode = "ai" }) {
  const [form, setForm] = useState(mkEmpty(folderId || ""));
  const [suggesting, setSuggesting] = useState(false);
  const { startGeneration } = useGeneration();
  const isAI = mode === "ai";

  useEffect(() => {
    setForm(mkEmpty(folderId || ""));
  }, [folderId]);

  const set    = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const setOpt = (k, v) => setForm(p => ({ ...p, options: { ...p.options, [k]: v } }));

  // Auto keyword suggest
  useEffect(() => {
    if (!form.topic.trim()) return;
    const timer = setTimeout(async () => {
      setSuggesting(true);
      try {
        const data = await api("/api/app/content/suggest-keywords", {
          method: "POST", token,
          body: { topic: form.topic, domain: form.domain, platform: form.platforms[0] },
        });
        setForm(p => ({
          ...p,
          primaryKeyword:   data.primaryKeyword   || p.primaryKeyword,
          secondaryKeyword: data.secondaryKeyword || p.secondaryKeyword,
          targetLocation:   data.targetLocation   || p.targetLocation,
        }));
      } catch (e) { /* silent */ }
      finally { setSuggesting(false); }
    }, 1000);
    return () => clearTimeout(timer);
  }, [form.topic, form.domain, form.platforms]);

  const totalToGenerate = Object.values(form.typeConfig).reduce((s, v) => s + v, 0);

  function generate() {
    if (!form.topic.trim()) { toastFromError(new Error("Topic is required"), ""); return; }
    startGeneration({ token, form, onComplete: onSuccess });
    if (onSuccess) onSuccess(); // close modal immediately
  }

  return (
    <div className="space-y-5">
      {/* Section 1 */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

          {/* Topic — full width */}
          <div className="sm:col-span-2 lg:col-span-3">
            <Field label="Topic" required>
              <input value={form.topic} onChange={e => set("topic", e.target.value)}
                placeholder="e.g. How AI is transforming the Indian startup ecosystem in 2025"
                className={inputCls} autoFocus />
            </Field>
          </div>

          {/* Folder — full width */}
          <div className="sm:col-span-2 lg:col-span-3">
            <Field label="Save to Folder">
              <div className="relative">
                <LuFolder className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <select value={form.folderId} onChange={e => set("folderId", e.target.value)}
                  className={inputCls + " appearance-none pl-9 pr-8"}>
                  <option value="">No folder (ungrouped)</option>
                  {folders.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
                </select>
                <LuChevronDown className="pointer-events-none absolute right-2.5 top-3 h-4 w-4 text-slate-400" />
              </div>
            </Field>
          </div>

          {/* Content Type Matrix — full width */}
          <div className="sm:col-span-2 lg:col-span-3">
            <Field label="Content Type & Count" required hint="Select type + how many to generate">
              <ContentTypeMatrix typeConfig={form.typeConfig} onChange={v => set("typeConfig", v)} />
            </Field>
          </div>

          {/* Platform — full width */}
          <div className="sm:col-span-2 lg:col-span-3">
            <Field label="Platform" required hint="Select all platforms to post on">
              <PlatformMatrix platforms={form.platforms} onChange={v => set("platforms", v)} />
            </Field>
          </div>

          <Select label="Content Domain" required value={form.domain}   onChange={v => set("domain", v)}   options={DOMAINS} />
          <Select label="Tone"           required value={form.tone}     onChange={v => set("tone", v)}     options={TONES} />
          <Select label="Language"       required value={form.language} onChange={v => set("language", v)} options={LANGUAGES} />
          <Field label="Word Count" required>
            <div className="relative">
              <select value={form.wordCount} onChange={e => set("wordCount", Number(e.target.value))} className={inputCls + " appearance-none pr-8"}>
                {WORD_COUNTS.map(w => <option key={w} value={w}>{w} words</option>)}
              </select>
              <LuChevronDown className="pointer-events-none absolute right-2.5 top-3 h-4 w-4 text-slate-400" />
            </div>
          </Field>

          {/* AI mode only: keywords + location */}
          {isAI && (<>
            <Field label="Primary Keyword">
              <div className="relative">
                <input value={form.primaryKeyword} onChange={e => set("primaryKeyword", e.target.value)}
                  placeholder="e.g. AI startup India" className={inputCls} />
                {suggesting && <LuLoader className="absolute right-3 top-3 h-3.5 w-3.5 animate-spin text-indigo-400" />}
              </div>
            </Field>
            <Field label="Secondary Keyword">
              <div className="relative">
                <input value={form.secondaryKeyword} onChange={e => set("secondaryKeyword", e.target.value)}
                  placeholder="e.g. artificial intelligence business" className={inputCls} />
                {suggesting && <LuLoader className="absolute right-3 top-3 h-3.5 w-3.5 animate-spin text-indigo-400" />}
              </div>
            </Field>
            <Field label="Target Location">
              <div className="relative">
                <input value={form.targetLocation} onChange={e => set("targetLocation", e.target.value)}
                  placeholder="e.g. Mumbai, Delhi NCR" className={inputCls} />
                {suggesting && <LuLoader className="absolute right-3 top-3 h-3.5 w-3.5 animate-spin text-indigo-400" />}
              </div>
            </Field>
          </>)}

        </div>
      </div>

      {/* Section 2 — AI Options (AI mode only) */}
      {isAI && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
          <SectionNum n="2" label="AI Options" />
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[
              { key: "seoOptimized",        label: "SEO Optimized" },
              { key: "aeoOptimized",        label: "AEO Optimized" },
              { key: "geoOptimized",        label: "GEO Optimized" },
              { key: "humanized",           label: "Humanized" },
              { key: "addCta",              label: "Add CTA" },
              { key: "addHashtags",         label: "Add Hashtags" },
              { key: "addFaq",              label: "Add FAQ" },
              { key: "generateImagePrompt", label: "Image Prompt" },
              { key: "generateVideoScript", label: "Video Script" },
              { key: "addMetaTitle",        label: "Meta Title" },
              { key: "addMetaDesc",         label: "Meta Description" },
              { key: "addInternalLinks",    label: "Internal Links" },
              { key: "addExternalRefs",     label: "External References" },
            ].map(({ key, label }) => (
              <Toggle key={key} label={label} checked={form.options[key]} onChange={v => setOpt(key, v)} />
            ))}
          </div>
        </div>
      )}

      {/* Generate Button */}
      <button onClick={generate}
        className={`flex w-full items-center justify-center gap-2 rounded-xl py-4 text-sm font-bold text-white shadow-lg hover:opacity-90 transition ${
          isAI
            ? "bg-gradient-to-r from-indigo-600 to-violet-600"
            : "bg-gradient-to-r from-slate-700 to-slate-900"
        }`}>
        {isAI ? <LuSparkles className="h-5 w-5" /> : <LuPenLine className="h-5 w-5" />}
        Generate {totalToGenerate} Content{totalToGenerate > 1 ? "s" : ""} in Background
      </button>
    </div>
  );
}

// ── Modal Version ──────────────────────────────────────────

export function CreateContentModal({ open, onClose, folderId, folderName, onCreated }) {
  const { token } = useAuth();
  const [folders, setFolders] = useState([]);
  const [mode, setMode] = useState("ai");

  useEffect(() => {
    if (open) {
      api("/api/app/content/folders", { token }).then(d => setFolders(d.folders || [])).catch(() => {});
    }
  }, [open, token]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 pl-72">
      <button type="button" className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-4xl rounded-2xl bg-slate-50 shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 rounded-t-2xl shrink-0">
          <div className="flex items-center gap-3">
            <span className={`flex h-9 w-9 items-center justify-center rounded-xl text-white shadow ${
              mode === "ai" ? "bg-gradient-to-br from-violet-500 to-indigo-600" : "bg-gradient-to-br from-slate-600 to-slate-800"
            }`}>
              {mode === "ai" ? <LuSparkles className="h-4 w-4" /> : <LuPenLine className="h-4 w-4" />}
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900">Create Content</h3>
              {folderName && (
                <p className="text-xs text-slate-500">Saving to: <span className="font-semibold text-indigo-600">{folderName}</span></p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Mode Toggle */}
            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100 p-1 gap-1">
              <button
                onClick={() => setMode("ai")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  mode === "ai"
                    ? "bg-gradient-to-r from-violet-500 to-indigo-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}>
                <LuBrain className="h-3.5 w-3.5" /> AI Mode
              </button>
              <button
                onClick={() => setMode("normal")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  mode === "normal"
                    ? "bg-gradient-to-r from-slate-600 to-slate-800 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}>
                <LuPenLine className="h-3.5 w-3.5" /> Normal Mode
              </button>
            </div>
            <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
              <LuX className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="overflow-y-auto flex-1 p-6">
          <CreateContentForm token={token} folderId={folderId} folderName={folderName} folders={folders} onSuccess={onCreated} mode={mode} />
        </div>
      </div>
    </div>
  );
}

// ── Page Version ───────────────────────────────────────────

export function AppCreateContent() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const folderIdFromUrl = searchParams.get("folderId") || "";
  const [folders, setFolders] = useState([]);
  const [folderName, setFolderName] = useState("");
  const [mode, setMode] = useState("ai");

  useEffect(() => {
    api("/api/app/content/folders", { token })
      .then(d => {
        setFolders(d.folders || []);
        if (folderIdFromUrl) {
          const f = (d.folders || []).find(f => f._id === folderIdFromUrl);
          if (f) setFolderName(f.name);
        }
      })
      .catch(() => {});
  }, [token]);

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/app/contents")}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
            <LuArrowLeft className="h-4 w-4" /> Back
          </button>
          <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-white shadow ${
            mode === "ai" ? "bg-gradient-to-br from-violet-500 to-indigo-600" : "bg-gradient-to-br from-slate-600 to-slate-800"
          }`}>
            {mode === "ai" ? <LuSparkles className="h-5 w-5" strokeWidth={1.75} /> : <LuPenLine className="h-5 w-5" strokeWidth={1.75} />}
          </span>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Create Content</h2>
            <p className="text-sm text-slate-500">
              {folderName ? <>Saving to: <span className="font-semibold text-indigo-600">{folderName}</span></> : "Generate multiple content types in one click"}
            </p>
          </div>
        </div>
        {/* Mode Toggle */}
        <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100 p-1 gap-1">
          <button
            onClick={() => setMode("ai")}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition ${
              mode === "ai"
                ? "bg-gradient-to-r from-violet-500 to-indigo-600 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}>
            <LuBrain className="h-4 w-4" /> AI Mode
          </button>
          <button
            onClick={() => setMode("normal")}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition ${
              mode === "normal"
                ? "bg-gradient-to-r from-slate-600 to-slate-800 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}>
            <LuPenLine className="h-4 w-4" /> Normal Mode
          </button>
        </div>
      </div>

      <CreateContentForm token={token} folderId={folderIdFromUrl} folderName={folderName} folders={folders} onSuccess={() => {}} mode={mode} />
    </div>
  );
}
