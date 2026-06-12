import { useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  LuSparkles, LuChevronDown, LuLoader, LuCopy, LuCheck,
} from "react-icons/lu";
import { useAuth } from "../../auth/AuthProvider";
import { api } from "../../lib/api";
import { toastFromError, toastSuccess } from "../../lib/toast";

// ── Constants ──────────────────────────────────────────────────────────────────
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
const TONES = ["Professional", "Casual", "Visionary", "Authoritative", "Friendly", "Expert", "Inspirational"];
const LANGUAGES = ["English", "Hindi", "Spanish", "French", "German", "Arabic", "Portuguese", "Bengali", "Tamil", "Telugu"];
const WORD_COUNTS = [300, 500, 800, 1000, 1200, 1500, 2000, 2500, 3000];
const AUDIENCES = ["Business Professionals", "Startup Founders", "Investors", "Students", "Job Seekers", "Developers", "Marketers", "General Public", "C-Suite Executives", "SMB Owners"];
const COUNTRIES = ["India", "USA", "UK", "UAE", "Canada", "Australia", "Germany", "Singapore", "Japan", "Brazil"];

const EMPTY_FORM = {
  topic: "", domain: DOMAINS[0], contentType: CONTENT_TYPES[0],
  platform: PLATFORMS[0], tone: TONES[0], language: LANGUAGES[0], wordCount: 1000,
  primaryKeyword: "", secondaryKeyword: "", targetLocation: "",
  options: {
    seoOptimized: true, aeoOptimized: true, geoOptimized: false, humanized: true,
    addCta: true, addHashtags: true, addFaq: false,
    generateImagePrompt: false, generateVideoScript: false,
    addMetaTitle: true, addMetaDesc: true,
    addInternalLinks: false, addExternalRefs: false,
  },
};

// ── UI Helpers ─────────────────────────────────────────────────────────────────
const inputCls = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400";

function Field({ label, required, children }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}{required && <span className="ml-0.5 text-red-400">*</span>}
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

// ── Main ───────────────────────────────────────────────────────────────────────
export function AppContentTools() {
  const { token } = useAuth();
  const [form, setForm] = useState(EMPTY_FORM);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const setOpt = (k, v) => setForm(p => ({ ...p, options: { ...p.options, [k]: v } }));

  async function generate() {
    if (!form.topic.trim()) {
      toastFromError(new Error("Topic is required"), "");
      return;
    }
    setGenerating(true);
    setResult(null);
    try {
      const data = await api("/api/app/content/generate", {
        method: "POST", token,
        body: { ...form, saveMode: "draft" },
      });
      setResult(data.content);
      toastSuccess("Content generated!");
    } catch (e) {
      toastFromError(e, "Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  const o = result?.output || {};

  return (
    <div className="space-y-5 p-4 sm:p-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow">
          <LuSparkles className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <div>
          <h2 className="text-xl font-bold text-slate-900">AI Content Generator</h2>
          <p className="text-sm text-slate-500">Generate high-quality content for any platform in seconds</p>
        </div>
      </div>

      {/* Section 1 — Content Info */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
        <SectionNum n="1" label="Content Information" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="sm:col-span-2 lg:col-span-3">
            <Field label="Topic" required>
              <input value={form.topic} onChange={e => set("topic", e.target.value)}
                placeholder="e.g. How AI is transforming the Indian startup ecosystem in 2025" className={inputCls} />
            </Field>
          </div>
          <Select label="Content Domain" required value={form.domain} onChange={v => set("domain", v)} options={DOMAINS} />
          <Select label="Content Type" required value={form.contentType} onChange={v => set("contentType", v)} options={CONTENT_TYPES} />
          <Select label="Platform" required value={form.platform} onChange={v => set("platform", v)} options={PLATFORMS} />
          <Select label="Tone" required value={form.tone} onChange={v => set("tone", v)} options={TONES} />
          <Select label="Language" required value={form.language} onChange={v => set("language", v)} options={LANGUAGES} />
          <Field label="Word Count" required>
            <div className="relative">
              <select value={form.wordCount} onChange={e => set("wordCount", Number(e.target.value))} className={inputCls + " appearance-none pr-8"}>
                {WORD_COUNTS.map(w => <option key={w} value={w}>{w} words</option>)}
              </select>
              <LuChevronDown className="pointer-events-none absolute right-2.5 top-3 h-4 w-4 text-slate-400" />
            </div>
          </Field>
          <Field label="Primary Keyword">
            <input value={form.primaryKeyword} onChange={e => set("primaryKeyword", e.target.value)}
              placeholder="e.g. AI startup India" className={inputCls} />
          </Field>
          <Field label="Secondary Keyword">
            <input value={form.secondaryKeyword} onChange={e => set("secondaryKeyword", e.target.value)}
              placeholder="e.g. artificial intelligence business" className={inputCls} />
          </Field>
          <Field label="Target Location">
            <input value={form.targetLocation} onChange={e => set("targetLocation", e.target.value)}
              placeholder="e.g. Mumbai, Delhi NCR" className={inputCls} />
          </Field>
        </div>
      </div>

      {/* Section 2 — AI Options */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
        <SectionNum n="2" label="AI Options" />
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[
            { key: "seoOptimized",       label: "SEO Optimized" },
            { key: "aeoOptimized",       label: "AEO Optimized" },
            { key: "geoOptimized",       label: "GEO Optimized" },
            { key: "humanized",          label: "Humanized" },
            { key: "addCta",             label: "Add CTA" },
            { key: "addHashtags",        label: "Add Hashtags" },
            { key: "addFaq",             label: "Add FAQ" },
            { key: "generateImagePrompt",label: "Image Prompt" },
            { key: "generateVideoScript",label: "Video Script" },
            { key: "addMetaTitle",       label: "Meta Title" },
            { key: "addMetaDesc",        label: "Meta Description" },
            { key: "addInternalLinks",   label: "Internal Links" },
            { key: "addExternalRefs",    label: "External References" },
          ].map(({ key, label }) => (
            <Toggle key={key} label={label} checked={form.options[key]} onChange={v => setOpt(key, v)} />
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <button onClick={generate} disabled={generating}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-4 text-sm font-bold text-white shadow-lg hover:opacity-90 disabled:opacity-60 transition">
        {generating
          ? <><LuLoader className="h-5 w-5 animate-spin" /> Generating — please wait…</>
          : <><LuSparkles className="h-5 w-5" /> Generate Content</>
        }
      </button>

      {generating && (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-center text-sm text-indigo-700 animate-pulse">
          AI is generating your {form.contentType} — this takes 15–30 seconds…
        </div>
      )}

      {/* Output */}
      {result && (
        <div className="space-y-4">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-5 py-3 flex items-center gap-2">
            <LuCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="text-sm font-semibold text-emerald-700">Content generated successfully!</span>
          </div>

          {/* Scores */}
          {o.scores && Object.values(o.scores).some(Boolean) && (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-7">
              {[["SEO", o.scores.seo], ["AEO", o.scores.aeo], ["GEO", o.scores.geo],
                ["Readability", o.scores.readability], ["Human", o.scores.humanScore],
                ["AI Det", o.scores.aiDetection], ["Originality", o.scores.originality]
              ].map(([l, v]) => v ? (
                <div key={l} className="rounded-lg border border-slate-100 bg-white p-3 text-center shadow-sm">
                  <div className={`text-lg font-bold ${v >= 80 ? "text-emerald-600" : v >= 60 ? "text-amber-600" : "text-red-600"}`}>{v}</div>
                  <div className="text-[10px] font-semibold text-slate-400 mt-0.5">{l}</div>
                </div>
              ) : null)}
            </div>
          )}

          <OutputBlock label="Title" value={o.title} />
          <OutputBlock label="Meta Description" value={o.metaDesc} />
          <OutputBlock label="Full Content" value={o.content} />
          <OutputBlock label="FAQ" value={o.faq} />
          <OutputBlock label="Call to Action" value={o.cta} />
          <OutputBlock label="Hashtags" value={o.hashtags} />
          <OutputBlock label="Image Generation Prompt" value={o.imagePrompt} />
          <OutputBlock label="Video Script" value={o.videoPrompt} />
          <OutputBlock label="Meta Title" value={o.metaTitle} />
          <OutputBlock label="Slug" value={o.slug} />
          <OutputBlock label="Keywords" value={o.keywords} />
        </div>
      )}
    </div>
  );
}
