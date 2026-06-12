import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import {
  LuArrowLeft, LuCopy, LuCheck, LuLoader, LuCalendar,
  LuFileText, LuGlobe, LuTag, LuHash, LuLink, LuImage,
  LuVideo, LuMessageSquare, LuSearch, LuMapPin,
} from "react-icons/lu";
import { useAuth } from "../../auth/AuthProvider";
import { api } from "../../lib/api";
import { toastFromError } from "../../lib/toast";

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  const str = Array.isArray(text) ? text.join("\n") : (text || "");
  return (
    <button onClick={() => { navigator.clipboard.writeText(str); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 transition">
      {copied ? <LuCheck className="h-3 w-3 text-green-500" /> : <LuCopy className="h-3 w-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function Badge({ label, color = "slate" }) {
  const cls = {
    indigo:  "bg-indigo-50 text-indigo-700 border-indigo-100",
    violet:  "bg-violet-50 text-violet-700 border-violet-100",
    slate:   "bg-slate-50  text-slate-600  border-slate-100",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    amber:   "bg-amber-50 text-amber-700 border-amber-100",
  }[color] || "bg-slate-50 text-slate-600 border-slate-100";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}

function ScoreBar({ label, value, max = 100 }) {
  if (!value) return null;
  const color = value >= 80 ? "bg-emerald-500" : value >= 60 ? "bg-amber-400" : "bg-red-400";
  const textColor = value >= 80 ? "text-emerald-600" : value >= 60 ? "text-amber-600" : "text-red-500";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-slate-600">{label}</span>
        <span className={`font-bold ${textColor}`}>{value}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-100">
        <div className={`h-2 rounded-full ${color} transition-all`} style={{ width: `${(value / max) * 100}%` }} />
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-3.5 bg-slate-50">
        <Icon className="h-4 w-4 text-indigo-500" />
        <span className="text-sm font-bold text-slate-700 uppercase tracking-wide">{title}</span>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function ContentBlock({ label, value, copyable = true }) {
  if (!value) return null;
  if (Array.isArray(value) && value.length === 0) return null;
  const text = Array.isArray(value) ? value.join("\n") : value;
  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</span>
          {copyable && <CopyBtn text={text} />}
        </div>
      )}
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 prose prose-sm max-w-none text-slate-700">
        <ReactMarkdown>{text}</ReactMarkdown>
      </div>
    </div>
  );
}

export function AppContentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useAuth();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);

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
      .then(d => setContent(d.content))
      .catch(e => toastFromError(e, "Failed to load content"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <LuLoader className="h-7 w-7 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <p className="text-slate-500 font-medium">Content not found.</p>
        <button onClick={() => navigate(-1)} className="text-indigo-600 text-sm font-semibold hover:underline">Go Back</button>
      </div>
    );
  }

  const o = content.output || {};
  const scores = o.scores || {};
  const date = content.createdAt
    ? new Date(content.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) +
      " · " + new Date(content.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
    : "—";

  return (
    <div className="space-y-5 p-4 sm:p-6">

      {/* Back */}
      <button onClick={goBack}
        className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
        <LuArrowLeft className="h-4 w-4" /> Back
      </button>

      {/* Hero Card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2 flex-1 min-w-0">
            <h1 className="text-xl font-bold text-slate-900 leading-snug">{o.title || content.topic || "Untitled"}</h1>
            {content.topic && o.title && o.title !== content.topic && (
              <p className="text-sm text-slate-400">{content.topic}</p>
            )}
            <div className="flex flex-wrap gap-1.5">
              {content.contentType && <Badge label={content.contentType} color="indigo" />}
              {content.platform    && <Badge label={content.platform}    color="violet" />}
              {content.language    && <Badge label={content.language}    color="slate" />}
              {content.status      && <Badge label={content.status}      color="emerald" />}
              {content.domain      && <Badge label={content.domain}      color="amber" />}
            </div>
          </div>
          <CopyBtn text={o.content || ""} />
        </div>

        {/* Meta info */}
        <div className="flex flex-wrap gap-4 text-xs text-slate-400 border-t border-slate-100 pt-4">
          <span className="flex items-center gap-1"><LuCalendar className="h-3.5 w-3.5" />{date}</span>
          {content.wordCount && <span className="flex items-center gap-1"><LuFileText className="h-3.5 w-3.5" />{content.wordCount} words</span>}
          {content.tone      && <span className="flex items-center gap-1"><LuMessageSquare className="h-3.5 w-3.5" />{content.tone}</span>}
          {content.targetLocation && <span className="flex items-center gap-1"><LuMapPin className="h-3.5 w-3.5" />{content.targetLocation}</span>}
        </div>
      </div>

      {/* Scores */}
      {Object.values(scores).some(Boolean) && (
        <Section icon={LuSearch} title="Content Scores">
          <div className="grid gap-3 sm:grid-cols-2">
            <ScoreBar label="SEO Score"       value={scores.seo} />
            <ScoreBar label="AEO Score"       value={scores.aeo} />
            <ScoreBar label="GEO Score"       value={scores.geo} />
            <ScoreBar label="Readability"     value={scores.readability} />
            <ScoreBar label="Human Score"     value={scores.humanScore} />
            <ScoreBar label="AI Detection"    value={scores.aiDetection} />
            <ScoreBar label="Originality"     value={scores.originality} />
          </div>
        </Section>
      )}

      {/* SEO Meta */}
      {(o.metaTitle || o.metaDesc || o.slug) && (
        <Section icon={LuGlobe} title="SEO Meta">
          <div className="space-y-4">
            {o.metaTitle && <ContentBlock label="Meta Title" value={o.metaTitle} />}
            {o.metaDesc  && <ContentBlock label="Meta Description" value={o.metaDesc} />}
            {o.slug      && <ContentBlock label="Slug" value={o.slug} />}
          </div>
        </Section>
      )}

      {/* Keywords */}
      {(o.keywords?.length > 0 || content.primaryKeyword || content.secondaryKeyword) && (
        <Section icon={LuTag} title="Keywords">
          <div className="space-y-3">
            {content.primaryKeyword   && <div><span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Primary</span><p className="mt-1 text-sm font-medium text-slate-700">{content.primaryKeyword}</p></div>}
            {content.secondaryKeyword && <div><span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Secondary</span><p className="mt-1 text-sm font-medium text-slate-700">{content.secondaryKeyword}</p></div>}
            {o.keywords?.length > 0   && (
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">All Keywords</span>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {o.keywords.map((k, i) => <Badge key={i} label={k} color="indigo" />)}
                </div>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Full Content */}
      {o.content && (
        <Section icon={LuFileText} title="Full Content">
          <ContentBlock value={o.content} />
        </Section>
      )}

      {/* FAQ */}
      {o.faq && (
        <Section icon={LuMessageSquare} title="FAQ">
          <ContentBlock value={o.faq} />
        </Section>
      )}

      {/* CTA */}
      {o.cta && (
        <Section icon={LuLink} title="Call to Action">
          <ContentBlock value={o.cta} />
        </Section>
      )}

      {/* Hashtags */}
      {o.hashtags?.length > 0 && (
        <Section icon={LuHash} title="Hashtags">
          <div className="flex flex-wrap gap-2">
            {o.hashtags.map((h, i) => (
              <span key={i} className="rounded-full bg-violet-50 border border-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">{h}</span>
            ))}
          </div>
        </Section>
      )}

      {/* Image Prompt */}
      {o.imagePrompt && (
        <Section icon={LuImage} title="Image Generation Prompt">
          <ContentBlock value={o.imagePrompt} />
        </Section>
      )}

      {/* Video Script */}
      {o.videoPrompt && (
        <Section icon={LuVideo} title="Video Script">
          <ContentBlock value={o.videoPrompt} />
        </Section>
      )}

      {/* Internal Links */}
      {o.internalLinks?.length > 0 && (
        <Section icon={LuLink} title="Internal Links">
          <ul className="space-y-1.5">
            {o.internalLinks.map((l, i) => <li key={i} className="text-sm text-slate-700">• {l}</li>)}
          </ul>
        </Section>
      )}

      {/* External Refs */}
      {o.externalRefs?.length > 0 && (
        <Section icon={LuGlobe} title="External References">
          <ul className="space-y-1.5">
            {o.externalRefs.map((r, i) => <li key={i} className="text-sm text-slate-700">• {r}</li>)}
          </ul>
        </Section>
      )}

    </div>
  );
}
