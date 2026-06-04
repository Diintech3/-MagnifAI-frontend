import { useEffect, useState, useCallback } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  LuTrophy, LuUsers, LuUser, LuGraduationCap, LuBriefcase,
  LuWallet, LuTriangleAlert, LuShieldCheck, LuMapPin,
  LuExternalLink, LuArrowLeft, LuBadgeCheck, LuShare2,
  LuGlobe, LuHash, LuMessageSquare, LuBookOpen, LuStar,
  LuNewspaper, LuFileText, LuSearch, LuLink, LuRefreshCw,
  LuCircleAlert, LuImage, LuCirclePlay, LuLayers,
} from "react-icons/lu";
import { useAuth } from "../../auth/AuthProvider";
import { api } from "../../lib/api";
import { toastFromError } from "../../lib/toast";

/* ─── Constants ─────────────────────────────────────────── */
const PARTY_COLORS = {
  BJP: "bg-orange-500", SP: "bg-lime-600", INC: "bg-sky-600",
  BSP: "bg-slate-700",  RLD: "bg-green-600", IND: "bg-gray-500",
  AAP: "bg-emerald-600", Others: "bg-slate-400",
};

const TABS = [
  { id: "winner",   label: "Winner",          icon: LuTrophy,  active: "bg-emerald-700", inactive: "hover:text-emerald-900" },
  { id: "loser",    label: "Losers",           icon: LuUsers,   active: "bg-rose-600",    inactive: "hover:text-rose-900"    },
  { id: "social",   label: "Social Media",     icon: LuShare2,  active: "bg-indigo-600",  inactive: "hover:text-indigo-900"  },
  { id: "mentions", label: "Digital Mentions", icon: LuGlobe,   active: "bg-amber-600",   inactive: "hover:text-amber-900"   },
];

const SOCIAL_PLATFORMS = [
  { id: "instagram", label: "Instagram",  color: "from-pink-500 to-rose-500",    textColor: "text-pink-700",  bg: "bg-pink-50",  border: "border-pink-200",  icon: "IG" },
  { id: "facebook",  label: "Facebook",   color: "from-blue-600 to-blue-500",    textColor: "text-blue-700",  bg: "bg-blue-50",  border: "border-blue-200",  icon: "FB" },
  { id: "youtube",   label: "YouTube",    color: "from-red-600 to-red-500",      textColor: "text-red-700",   bg: "bg-red-50",   border: "border-red-200",   icon: "YT" },
  { id: "twitter",   label: "X (Twitter)",color: "from-slate-800 to-slate-700",  textColor: "text-slate-700", bg: "bg-slate-50", border: "border-slate-200", icon: "X"  },
  { id: "threads",   label: "Threads",    color: "from-gray-800 to-gray-700",    textColor: "text-gray-700",  bg: "bg-gray-50",  border: "border-gray-200",  icon: "TH" },
];

const MENTION_CATEGORIES = [
  { id: "news",         label: "News",         icon: LuNewspaper     },
  { id: "blogs",        label: "Blogs",        icon: LuBookOpen      },
  { id: "articles",     label: "Articles",     icon: LuFileText      },
  { id: "qa",           label: "Q&A",          icon: LuMessageSquare },
  { id: "reviews",      label: "Reviews",      icon: LuStar          },
  { id: "websites",     label: "Websites",     icon: LuGlobe         },
  { id: "forum",        label: "Forums",       icon: LuHash          },
  { id: "testimonials", label: "Testimonials", icon: LuMessageSquare },
  { id: "others",       label: "Other Pages",  icon: LuLink          },
];

const CATEGORY_COLORS = {
  news:         { color: "bg-red-100    text-red-700",    border: "border-red-200"    },
  blogs:        { color: "bg-indigo-100 text-indigo-700", border: "border-indigo-200" },
  articles:     { color: "bg-blue-100   text-blue-700",   border: "border-blue-200"   },
  qa:           { color: "bg-amber-100  text-amber-700",  border: "border-amber-200"  },
  reviews:      { color: "bg-yellow-100 text-yellow-700", border: "border-yellow-200" },
  websites:     { color: "bg-teal-100   text-teal-700",   border: "border-teal-200"   },
  forum:        { color: "bg-violet-100 text-violet-700", border: "border-violet-200" },
  testimonials: { color: "bg-emerald-100 text-emerald-700", border: "border-emerald-200" },
  others:       { color: "bg-slate-100  text-slate-700",  border: "border-slate-200"  },
};

/* ─── Reusable small components ─────────────────────────── */
function PartyBadge({ party }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white ${PARTY_COLORS[party] || PARTY_COLORS.Others}`}>
      {party || "—"}
    </span>
  );
}

function ResultBadge({ result }) {
  const s = {
    WINNER:    { cls: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300", label: "Winner"    },
    RUNNER_UP: { cls: "bg-amber-100   text-amber-800   ring-1 ring-amber-300",   label: "Runner-Up" },
    CONTESTED: { cls: "bg-slate-100   text-slate-600   ring-1 ring-slate-200",   label: "Contested" },
  }[result] || { cls: "bg-slate-100 text-slate-600 ring-1 ring-slate-200", label: result };
  return <span className={`rounded-full px-3 py-0.5 text-[11px] font-bold ${s.cls}`}>{s.label}</span>;
}

function StatBox({ label, value, accent }) {
  return (
    <div className={`rounded-xl border px-4 py-3 shadow-sm ${accent ? "border-emerald-200 bg-emerald-50" : "border-amber-200/70 bg-[#faf6f0]"}`}>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">{label}</div>
      <div className={`mt-1 truncate text-base font-bold ${accent ? "text-emerald-900" : "text-emerald-950"}`}>{value || "—"}</div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2.5 py-1.5 border-b border-slate-100 last:border-0">
      {Icon ? <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-stone-400" /> : null}
      <span className="shrink-0 text-[11px] text-stone-400 min-w-[90px]">{label}</span>
      <span className="text-[11px] font-semibold text-emerald-950 break-words text-right flex-1">{value}</span>
    </div>
  );
}

function CriminalBadge({ totalCases }) {
  const n = parseInt(totalCases, 10);
  if (totalCases === undefined || totalCases === null || totalCases === "")
    return <span className="text-xs text-stone-400">Not available</span>;
  if (n > 0)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-3 py-0.5 text-xs font-bold text-rose-800 ring-1 ring-rose-200">
        <LuTriangleAlert className="h-3 w-3" /> {n} case{n > 1 ? "s" : ""} filed
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-bold text-emerald-800 ring-1 ring-emerald-200">
      <LuShieldCheck className="h-3 w-3" /> No criminal cases
    </span>
  );
}

function TabSpinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <LuRefreshCw className="h-5 w-5 animate-spin text-stone-400" />
      <span className="ml-2 text-sm text-stone-400">Loading…</span>
    </div>
  );
}

function TabError({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 py-12 text-center">
      <LuCircleAlert className="h-6 w-6 text-rose-400" />
      <p className="text-sm text-rose-700">{message || "Failed to load data."}</p>
      {onRetry && (
        <button onClick={onRetry}
          className="inline-flex items-center gap-1.5 rounded-lg bg-rose-100 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-200 transition">
          <LuRefreshCw className="h-3.5 w-3.5" /> Retry
        </button>
      )}
    </div>
  );
}

/* ─── Candidate Card ─────────────────────────────────────── */
function CandidateCard({ c, polledVotes, winnerVotes }) {
  const isWinner   = c.result === "WINNER";
  const isRunnerUp = c.result === "RUNNER_UP";
  const base = polledVotes > 0 ? polledVotes : winnerVotes > 0 ? winnerVotes * 1.5 : 1;
  const pct  = Math.min(100, Math.round((c.votes / base) * 100));

  return (
    <div className={`overflow-hidden rounded-2xl border shadow-sm ${
      isWinner ? "border-emerald-300 bg-gradient-to-br from-emerald-50 to-[#faf6f0]"
      : isRunnerUp ? "border-amber-300 bg-[#fffdf7]"
      : "border-slate-200 bg-white"
    }`}>
      <div className={`h-1 w-full ${isWinner ? "bg-emerald-500" : isRunnerUp ? "bg-amber-400" : "bg-slate-200"}`} />
      <div className="flex items-start justify-between gap-4 px-5 py-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${isWinner ? "bg-emerald-700" : isRunnerUp ? "bg-amber-500" : "bg-slate-400"}`}>{c.rank}</span>
            <ResultBadge result={c.result} />
            <PartyBadge party={c.party} />
          </div>
          <h3 className="text-xl font-bold text-emerald-950 leading-tight">{c.candidate || "—"}</h3>
          <div className="mt-1.5 flex flex-wrap gap-3 text-[11px] text-stone-500">
            {c.personal?.age        ? <span className="flex items-center gap-1"><LuUser className="h-3 w-3" /> Age {c.personal.age}</span>           : null}
            {c.personal?.education  ? <span className="flex items-center gap-1"><LuGraduationCap className="h-3 w-3" /> {c.personal.education}</span> : null}
            {c.personal?.profession ? <span className="flex items-center gap-1"><LuBriefcase className="h-3 w-3" /> {c.personal.profession}</span>    : null}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-2xl font-bold tabular-nums text-emerald-950">{(c.votes || 0).toLocaleString("en-IN")}</div>
          <div className="text-[11px] text-stone-500">votes</div>
          <div className="mt-0.5 text-sm font-bold text-teal-700">{c.votePercent ?? "—"}%</div>
        </div>
      </div>

      <div className="px-5 pt-1 pb-2">
        <div className="flex items-center justify-between text-[10px] text-stone-500 mb-1">
          <span>{pct}% of polled votes</span>
          {!isWinner && winnerVotes > 0 ? <span className="font-medium text-rose-600">−{(winnerVotes - c.votes).toLocaleString("en-IN")} vs winner</span> : null}
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div className={`h-2 rounded-full ${isWinner ? "bg-emerald-500" : "bg-amber-400"}`} style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="grid gap-3 p-5 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
          <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400"><LuUser className="h-3 w-3" /> Personal Info</div>
          <InfoRow icon={LuGraduationCap} label="Education"  value={c.personal?.education} />
          <InfoRow icon={LuBriefcase}     label="Profession" value={c.personal?.profession} />
          <InfoRow icon={LuUser}          label="Age"        value={c.personal?.age ? `${c.personal.age} years` : ""} />
          <InfoRow icon={LuUser}          label="Gender"     value={c.personal?.gender} />
          {!c.personal?.education && !c.personal?.age && <p className="text-[11px] text-stone-400 italic mt-1">No affidavit data</p>}
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
          <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400"><LuWallet className="h-3 w-3" /> Declared Assets</div>
          <InfoRow icon={LuWallet} label="Total Assets"  value={c.financials?.totalAssets} />
          <InfoRow icon={LuWallet} label="Liabilities"   value={c.financials?.totalLiabilities} />
          {!c.financials?.totalAssets && <p className="text-[11px] text-stone-400 italic mt-1">No asset data</p>}
          <div className="mt-3">
            <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400"><LuTriangleAlert className="h-3 w-3" /> Criminal Record</div>
            <CriminalBadge totalCases={c.criminal?.totalCases} />
          </div>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
          <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400"><LuExternalLink className="h-3 w-3" /> Links & Address</div>
          {c.address?.self ? <div className="mb-2 flex items-start gap-1.5"><LuMapPin className="mt-0.5 h-3 w-3 shrink-0 text-stone-400" /><span className="text-[11px] text-stone-600">{c.address.self}</span></div> : null}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {c.social?.facebook  ? <a href={c.social.facebook}  target="_blank" rel="noreferrer" className="rounded-lg bg-blue-50  px-2.5 py-1 text-[11px] font-semibold text-blue-700  hover:bg-blue-100 transition">Facebook</a>  : null}
            {c.social?.twitter   ? <a href={c.social.twitter}   target="_blank" rel="noreferrer" className="rounded-lg bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 transition">Twitter</a>   : null}
            {c.social?.instagram ? <a href={c.social.instagram} target="_blank" rel="noreferrer" className="rounded-lg bg-pink-50  px-2.5 py-1 text-[11px] font-semibold text-pink-700  hover:bg-pink-100 transition">Instagram</a> : null}
            {c.social?.youtube   ? <a href={c.social.youtube}   target="_blank" rel="noreferrer" className="rounded-lg bg-red-50   px-2.5 py-1 text-[11px] font-semibold text-red-700   hover:bg-red-100 transition">YouTube</a>   : null}
            {c.social?.website   ? <a href={c.social.website}   target="_blank" rel="noreferrer" className="rounded-lg bg-teal-50  px-2.5 py-1 text-[11px] font-semibold text-teal-700  hover:bg-teal-100 transition">Website</a>   : null}
            {c.wikipedia         ? <a href={c.wikipedia}        target="_blank" rel="noreferrer" className="rounded-lg bg-gray-50  px-2.5 py-1 text-[11px] font-semibold text-gray-700  hover:bg-gray-100 transition">Wikipedia</a> : null}
            {c.mynetaUrl         ? <a href={c.mynetaUrl}        target="_blank" rel="noreferrer" className="rounded-lg bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 hover:bg-amber-100 transition">Myneta</a>    : null}
            {!c.social?.facebook && !c.wikipedia && !c.mynetaUrl && <p className="text-[11px] text-stone-400 italic">No links available</p>}
          </div>
        </div>
      </div>
      {c.bio ? <div className="mx-5 mb-5 rounded-xl border border-amber-100 bg-amber-50/60 px-4 py-3 text-[11px] leading-relaxed text-stone-600 italic">{c.bio}</div> : null}
    </div>
  );
}

/* ─── Social Media Tab ───────────────────────────────────── */
function SocialStatCard({ platform, stats }) {
  const p = SOCIAL_PLATFORMS.find((x) => x.id === platform);
  if (!p) return null;
  const connected = stats?.connected ?? false;

  return (
    <div className={`rounded-2xl border ${p.border} ${p.bg} p-5 shadow-sm`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <span className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${p.color} text-xs font-black text-white shadow`}>
            {p.icon}
          </span>
          <div>
            <p className={`text-sm font-bold ${p.textColor}`}>{p.label}</p>
            <p className="text-[11px] text-stone-400">{connected ? (stats?.handle || "Connected") : "Not linked"}</p>
          </div>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${connected ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
          {connected ? "Live" : "Not Connected"}
        </span>
      </div>

      {connected ? (
        <>
          <div className="grid grid-cols-3 gap-2 mt-3">
            {[
              { label: "Followers", value: stats?.followers },
              { label: "Following", value: stats?.following },
              { label: "Posts",     value: stats?.posts     },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-white/70 px-3 py-2 text-center border border-white/80">
                <p className={`text-base font-bold ${p.textColor}`}>{s.value || "—"}</p>
                <p className="text-[10px] text-stone-400">{s.label}</p>
              </div>
            ))}
          </div>
          {stats?.bio && (
            <p className="mt-2 text-[11px] text-stone-500 leading-relaxed line-clamp-2">{stats.bio}</p>
          )}
        </>
      ) : (
        <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-white/50 py-4 text-center text-xs text-stone-400">
          API integration pending — connect account to see live stats
        </div>
      )}
    </div>
  );
}

function mediaIcon(type) {
  if (!type) return null;
  const t = type.toLowerCase();
  if (t === "video") return <LuCirclePlay className="h-3 w-3" />;
  if (t === "carousel") return <LuLayers className="h-3 w-3" />;
  return <LuImage className="h-3 w-3" />;
}

function PostCard({ index, post }) {
  const p = SOCIAL_PLATFORMS.find((x) => x.id === post.platform);
  const borderBg = p ? `border-${p.border.split("-")[1]}-100 bg-${p.bg.split("-")[1]}-50/40` : "border-slate-100 bg-slate-50/40";

  const colorMap = {
    instagram: "border-pink-100 bg-pink-50/40 badge-bg-pink-100 badge-text-pink-700",
    facebook:  "border-blue-100 bg-blue-50/40",
    youtube:   "border-red-100  bg-red-50/40",
    twitter:   "border-slate-100 bg-slate-50/40",
    threads:   "border-gray-100 bg-gray-50/40",
  };
  const badgeMap = {
    instagram: "bg-pink-100 text-pink-700",
    facebook:  "bg-blue-100 text-blue-700",
    youtube:   "bg-red-100  text-red-700",
    twitter:   "bg-slate-100 text-slate-700",
    threads:   "bg-gray-100 text-gray-700",
  };

  return (
    <div className={`rounded-xl border p-4 ${colorMap[post.platform] || "border-slate-100 bg-slate-50/40"}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[9px] font-black text-stone-500 shadow-sm border">{index}</span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${badgeMap[post.platform] || "bg-slate-100 text-slate-600"}`}>
            {p?.label || post.platform}
          </span>
          {post.type ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] text-stone-400 border">
              {mediaIcon(post.type)}{post.type}
            </span>
          ) : null}
        </div>
        <span className="text-[10px] text-stone-400 shrink-0">{post.date || "—"}</span>
      </div>

      {post.mediaUrl && (
        <img
          src={post.mediaUrl}
          alt="post media"
          loading="lazy"
          className="mb-2 w-full max-h-36 rounded-lg object-cover border border-white/60"
          onError={(e) => { e.currentTarget.style.display = "none"; }}
        />
      )}

      <p className="text-xs text-stone-600 leading-relaxed line-clamp-3">{post.content}</p>

      <div className="mt-2 flex items-center justify-between gap-3">
        <div className="flex gap-3 text-[11px] text-stone-400">
          {post.likes    != null ? <span>👍 {post.likes.toLocaleString("en-IN")}</span>    : null}
          {post.comments != null ? <span>💬 {post.comments.toLocaleString("en-IN")}</span> : null}
          {post.shares   != null ? <span>↗ {post.shares.toLocaleString("en-IN")}</span>   : null}
        </div>
        {post.url ? (
          <a href={post.url} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-teal-700 hover:underline shrink-0">
            <LuExternalLink className="h-3 w-3" /> View
          </a>
        ) : null}
      </div>
    </div>
  );
}

/* ─── Connect Social Links Form ─────────────────────────── */
function ConnectSocialForm({ constituencyInfo, candidates, token, onSaved, initialCandidate }) {
  const [selectedCandidate, setSelectedCandidate] = useState(initialCandidate || candidates[0]?.candidate || "");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    instagram_igUserId: "", instagram_handle: "", instagram_profileUrl: "",
    facebook_pageId: "",    facebook_handle: "",  facebook_profileUrl: "",
    youtube_channelId: "",  youtube_handle: "",   youtube_profileUrl: "",
    twitter_handle: "",     twitter_profileUrl: "",
    threads_handle: "",     threads_profileUrl: "",
  });

  // Sync when parent changes selected candidate
  useEffect(() => {
    if (initialCandidate) setSelectedCandidate(initialCandidate);
  }, [initialCandidate]);

  // Load existing links when candidate changes
  useEffect(() => {
    if (!selectedCandidate) return;
    const qs = new URLSearchParams({
      stateCode: constituencyInfo.stateCode,
      bodyType:  constituencyInfo.bodyType,
      year:      constituencyInfo.year,
      seatNo:    constituencyInfo.seatNo,
    });
    api(`/api/admin/social-data/links?${qs}`, { token })
      .then((d) => {
        const link = d.links?.find((l) =>
          l.candidateName.toLowerCase() === selectedCandidate.toLowerCase()
        );
        if (link) {
          setForm({
            instagram_igUserId:   link.instagram?.igUserId   || "",
            instagram_handle:     link.instagram?.handle     || "",
            instagram_profileUrl: link.instagram?.profileUrl || "",
            facebook_pageId:      link.facebook?.pageId      || "",
            facebook_handle:      link.facebook?.handle      || "",
            facebook_profileUrl:  link.facebook?.profileUrl  || "",
            youtube_channelId:    link.youtube?.channelId    || "",
            youtube_handle:       link.youtube?.handle       || "",
            youtube_profileUrl:   link.youtube?.profileUrl   || "",
            twitter_handle:       link.twitter?.handle       || "",
            twitter_profileUrl:   link.twitter?.profileUrl   || "",
            threads_handle:       link.threads?.handle       || "",
            threads_profileUrl:   link.threads?.profileUrl   || "",
          });
        } else {
          setForm({ instagram_igUserId:"",instagram_handle:"",instagram_profileUrl:"",facebook_pageId:"",facebook_handle:"",facebook_profileUrl:"",youtube_channelId:"",youtube_handle:"",youtube_profileUrl:"",twitter_handle:"",twitter_profileUrl:"",threads_handle:"",threads_profileUrl:"" });
        }
      })
      .catch(() => {});
  }, [selectedCandidate, constituencyInfo, token]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!selectedCandidate) return;
    setSaving(true);
    try {
      await api("/api/admin/social-data/links", {
        method: "POST", token,
        body: {
          stateCode:     constituencyInfo.stateCode,
          bodyType:      constituencyInfo.bodyType,
          year:          constituencyInfo.year,
          seatNo:        constituencyInfo.seatNo,
          seatName:      constituencyInfo.seatName,
          candidateName: selectedCandidate,
          instagram: { igUserId: form.instagram_igUserId, handle: form.instagram_handle, profileUrl: form.instagram_profileUrl },
          facebook:  { pageId:   form.facebook_pageId,   handle: form.facebook_handle,  profileUrl: form.facebook_profileUrl  },
          youtube:   { channelId:form.youtube_channelId, handle: form.youtube_handle,   profileUrl: form.youtube_profileUrl   },
          twitter:   { handle:   form.twitter_handle,    profileUrl: form.twitter_profileUrl },
          threads:   { handle:   form.threads_handle,    profileUrl: form.threads_profileUrl },
        },
      });
      onSaved(selectedCandidate);
    } catch (e) {
      alert(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const fields = [
    { platform: "Instagram", keys: [
      { k: "instagram_igUserId", label: "Instagram Business Account ID", placeholder: "17841404386799884", hint: "From Meta Business Suite → Settings" },
      { k: "instagram_handle",   label: "Handle",                        placeholder: "@candidate_official" },
      { k: "instagram_profileUrl",label: "Profile URL",                   placeholder: "https://instagram.com/..." },
    ]},
    { platform: "Facebook", keys: [
      { k: "facebook_pageId",    label: "Page ID",     placeholder: "123456789" },
      { k: "facebook_handle",    label: "Handle",      placeholder: "@candidatepage" },
      { k: "facebook_profileUrl",label: "Profile URL", placeholder: "https://facebook.com/..." },
    ]},
    { platform: "YouTube", keys: [
      { k: "youtube_channelId",  label: "Channel ID",  placeholder: "UCxxxxxxxx" },
      { k: "youtube_handle",     label: "Handle",      placeholder: "@channel" },
      { k: "youtube_profileUrl", label: "Profile URL", placeholder: "https://youtube.com/@..." },
    ]},
    { platform: "X (Twitter)", keys: [
      { k: "twitter_handle",     label: "Handle",      placeholder: "@candidate" },
      { k: "twitter_profileUrl", label: "Profile URL", placeholder: "https://x.com/..." },
    ]},
    { platform: "Threads", keys: [
      { k: "threads_handle",     label: "Handle",      placeholder: "@candidate" },
      { k: "threads_profileUrl", label: "Profile URL", placeholder: "https://threads.net/@..." },
    ]},
  ];

  return (
    <div className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
          <LuLink className="h-4 w-4" /> Connect Social Accounts
        </h3>
        <select
          value={selectedCandidate}
          onChange={(e) => setSelectedCandidate(e.target.value)}
          className="rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300">
          {candidates.map((c) => (
            <option key={c.candidate} value={c.candidate}>{c.candidate} ({c.party})</option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map(({ platform, keys }) => (
          <div key={platform} className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">{platform}</p>
            {keys.map(({ k, label, placeholder, hint }) => (
              <div key={k}>
                <label className="block text-[10px] text-stone-400 mb-0.5">{label}</label>
                <input
                  type="text"
                  value={form[k]}
                  onChange={(e) => set(k, e.target.value)}
                  placeholder={placeholder}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
                {hint && <p className="text-[10px] text-stone-400 mt-0.5">{hint}</p>}
              </div>
            ))}
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 transition disabled:opacity-50">
        {saving ? <LuRefreshCw className="h-4 w-4 animate-spin" /> : <LuLink className="h-4 w-4" />}
        {saving ? "Saving…" : `Save for ${selectedCandidate}`}
      </button>
    </div>
  );
}

function SocialMediaTab({ constituencyInfo, candidates, token }) {
  const [activePlatform, setActivePlatform] = useState("all");
  const [showConnectForm, setShowConnectForm] = useState(false);
  const winner = candidates.find((c) => c.result === "WINNER");
  const [selectedCandidate, setSelectedCandidate] = useState(
    winner?.candidate || candidates[0]?.candidate || ""
  );
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const [data, setData]     = useState(null);

  const load = useCallback(() => {
    if (!selectedCandidate) return;
    setLoading(true);
    setError(null);
    setData(null);
    const qs = new URLSearchParams({
      stateCode:     constituencyInfo.stateCode,
      bodyType:      constituencyInfo.bodyType,
      year:          String(constituencyInfo.year),
      seatNo:        String(constituencyInfo.seatNo),
      candidateName: selectedCandidate,
    });
    api(`/api/admin/social-data/social?${qs}`, { token })
      .then(setData)
      .catch((e) => setError(e.message || "Failed to load"))
      .finally(() => setLoading(false));
  }, [constituencyInfo, selectedCandidate, token]);

  useEffect(() => { load(); }, [load]);

  // Auto-open form if no links found after loading
  useEffect(() => {
    if (!loading && data && !data.hasLinks) setShowConnectForm(true);
  }, [loading, data]);

  const platformsMap = {};
  (data?.platforms || []).forEach((p) => { platformsMap[p.platform] = p; });
  const allPosts    = data?.posts || [];
  const shownPosts  = activePlatform === "all" ? allPosts : allPosts.filter((p) => p.platform === activePlatform);
  const hasLinks    = data?.hasLinks;
  const connectedCount = (data?.platforms || []).filter((p) => p.connected).length;

  return (
    <div className="space-y-5">

      {/* Candidate selector */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-stone-400">Select Candidate to View Social Data</p>
        <div className="flex flex-wrap gap-2">
          {candidates.map((c) => {
            const isWinner   = c.result === "WINNER";
            const isRunnerUp = c.result === "RUNNER_UP";
            const isSelected = selectedCandidate === c.candidate;
            return (
              <button
                key={c.candidate}
                onClick={() => { setSelectedCandidate(c.candidate); setActivePlatform("all"); setShowConnectForm(false); }}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition border ${
                  isSelected
                    ? isWinner   ? "bg-emerald-600 text-white border-emerald-600 shadow"
                    : isRunnerUp ? "bg-amber-500  text-white border-amber-500  shadow"
                    :              "bg-indigo-600 text-white border-indigo-600 shadow"
                    : isWinner   ? "border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100"
                    : isRunnerUp ? "border-amber-300  text-amber-800  bg-amber-50  hover:bg-amber-100"
                    :              "border-slate-200  text-slate-600  bg-white     hover:border-slate-300"
                }`}>
                {isWinner   ? "🏆" : isRunnerUp ? "🥈" : null}
                {c.candidate}
                <span className="opacity-70">· {c.party}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Connect Accounts toggle */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-700">
          {selectedCandidate}
          {data?.hasLinks
            ? <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Linked</span>
            : <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">Not Linked</span>
          }
        </p>
        <button
          onClick={() => setShowConnectForm((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 transition">
          <LuLink className="h-3.5 w-3.5" />
          {showConnectForm ? "Hide Form" : data?.hasLinks ? "Edit Accounts" : "+ Connect Accounts"}
        </button>
      </div>

      {/* Connect form */}
      {showConnectForm && (
        <ConnectSocialForm
          constituencyInfo={constituencyInfo}
          candidates={candidates}
          token={token}
          initialCandidate={selectedCandidate}
          onSaved={(name) => { setShowConnectForm(false); setSelectedCandidate(name); }}
        />
      )}

      {loading ? <TabSpinner /> : error ? <TabError message={error} onRetry={load} /> : (
        <>
          {/* No links yet */}
          {!hasLinks && !showConnectForm && (
            <div className="rounded-2xl border border-dashed border-indigo-300 bg-indigo-50/50 p-6 text-center">
              <LuShare2 className="mx-auto h-8 w-8 text-indigo-300 mb-2" />
              <p className="text-sm font-semibold text-indigo-800">No social accounts linked for {selectedCandidate}</p>
              <p className="mt-1 text-xs text-indigo-600">Click &ldquo;Connect Accounts&rdquo; above to add Instagram, Facebook, YouTube, X and Threads handles.</p>
            </div>
          )}

          {/* Platform stats */}
          {hasLinks && (
            <div>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-stone-500 flex items-center gap-2">
                <LuShare2 className="h-3.5 w-3.5" /> {selectedCandidate} — Platform Overview
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {SOCIAL_PLATFORMS.map((p) => (
                  <SocialStatCard key={p.id} platform={p.id} stats={platformsMap[p.id]} />
                ))}
              </div>
              {connectedCount === 0 && (
                <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
                  Social handles saved but Instagram Business Account ID needed for live stats. Add the ID via &ldquo;Connect Accounts&rdquo;.
                </p>
              )}
            </div>
          )}

          {/* Last 10 Posts */}
          {hasLinks && (
            <div>
              <div className="mb-3 flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wide text-stone-500 flex items-center gap-2">
                  <LuHash className="h-3.5 w-3.5" /> Last {allPosts.length || 10} Posts
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  <button onClick={() => setActivePlatform("all")}
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold transition ${activePlatform === "all" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                    All ({allPosts.length})
                  </button>
                  {SOCIAL_PLATFORMS.map((p) => {
                    const count = allPosts.filter((x) => x.platform === p.id).length;
                    if (count === 0) return null;
                    return (
                      <button key={p.id} onClick={() => setActivePlatform(p.id)}
                        className={`rounded-full px-3 py-1 text-[11px] font-semibold transition ${
                          activePlatform === p.id ? `bg-gradient-to-r ${p.color} text-white` : `${p.bg} ${p.textColor} hover:opacity-80`
                        }`}>
                        {p.label} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>
              {shownPosts.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {shownPosts.map((post, i) => <PostCard key={post.id || i} index={i + 1} post={post} />)}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-10 text-center text-sm text-stone-400">
                  No posts yet. Make sure Instagram Business Account ID is set.
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ─── Digital Mentions Tab ───────────────────────────────── */
function SentimentBadge({ sentiment }) {
  const map = {
    positive: "bg-emerald-100 text-emerald-700",
    negative: "bg-rose-100    text-rose-700",
    neutral:  "bg-slate-100   text-slate-600",
  };
  return (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${map[sentiment] || map.neutral}`}>
      {sentiment || "neutral"}
    </span>
  );
}

function MentionItem({ index, m }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-300 transition">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[9px] font-bold text-slate-500">{index}</span>
          <p className="text-sm font-semibold text-slate-800 line-clamp-1">{m.title}</p>
        </div>
        <SentimentBadge sentiment={m.sentiment} />
      </div>
      <p className="text-[11px] text-stone-500 leading-relaxed line-clamp-2">{m.snippet}</p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-[10px] text-stone-400">{m.source}{m.date ? ` · ${m.date}` : ""}</span>
        {m.url ? (
          <a href={m.url} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-teal-700 hover:underline shrink-0">
            <LuExternalLink className="h-3 w-3" /> View
          </a>
        ) : null}
      </div>
    </div>
  );
}

function DigitalMentionsTab({ seatName, winnerName, token }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [activeCategory, setActiveCategory] = useState("news");

  const load = useCallback(() => {
    if (!seatName) return;
    setLoading(true);
    setError(null);
    const qs = new URLSearchParams({ seatName, state: "Uttar Pradesh", winnerName: winnerName || "" });
    api(`/api/admin/social-data/mentions?${qs}`, { token })
      .then((d) => { setData(d); setActiveCategory(getCategoryWithMostResults(d)); })
      .catch((e) => setError(e.message || "Failed to load mentions"))
      .finally(() => setLoading(false));
  }, [seatName, winnerName, token]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <TabSpinner />;
  if (error) return <TabError message={error} onRetry={load} />;

  const summary = data?.summary || { total: 0, positive: 0, negative: 0, neutral: 0 };
  const byCategory = data?.byCategory || {};
  const currentMentions = byCategory[activeCategory] || [];
  const catMeta = data?.categoryMeta || [];

  return (
    <div className="space-y-5">
      {/* Summary bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-amber-200/70 bg-[#faf6f0] px-4 py-3 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-wide text-stone-400">Total Mentions</div>
          <div className="mt-1 text-2xl font-bold text-emerald-950">{summary.total}</div>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-wide text-stone-400">Positive</div>
          <div className="mt-1 text-2xl font-bold text-emerald-700">{summary.positive}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-wide text-stone-400">Neutral</div>
          <div className="mt-1 text-2xl font-bold text-slate-700">{summary.neutral}</div>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-wide text-stone-400">Negative</div>
          <div className="mt-1 text-2xl font-bold text-rose-700">{summary.negative}</div>
        </div>
      </div>

      {/* Category selector */}
      <div>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-stone-500 flex items-center gap-2">
          <LuSearch className="h-3.5 w-3.5" /> Mention Categories
        </h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {MENTION_CATEGORIES.map((cat) => {
            const meta = catMeta.find((m) => m.id === cat.id);
            const count = meta?.count ?? 0;
            const cc = CATEGORY_COLORS[cat.id] || CATEGORY_COLORS.others;
            const isActive = activeCategory === cat.id;
            return (
              <button key={cat.id} type="button" onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition-all ${
                  isActive
                    ? `${cc.border} ring-2 ring-offset-1 ${cc.border.replace("border-", "ring-")} bg-white`
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}>
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${cc.color}`}>
                  <cat.icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{cat.label}</p>
                  <p className="text-xs text-stone-400">{count} results</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mentions list */}
      <div>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-stone-500">
          {MENTION_CATEGORIES.find((c) => c.id === activeCategory)?.label} ({currentMentions.length})
        </h3>
        {currentMentions.length > 0 ? (
          <div className="space-y-3">
            {currentMentions.map((m, i) => (
              <MentionItem key={i} index={i + 1} m={m} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-10 text-center text-sm text-stone-400">
            No {MENTION_CATEGORIES.find((c) => c.id === activeCategory)?.label} mentions found for &ldquo;{seatName}&rdquo;.
          </div>
        )}
      </div>

      {data?.isFallback && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
          <strong>Note:</strong> No specific articles found for &ldquo;{seatName}&rdquo; — showing related {data.queryUsed?.includes("vidhan") ? "state-level" : "broader"} news. NewsAPI free tier covers last 30 days only.
        </div>
      )}
      {summary.total === 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
          <strong>Note:</strong> No articles found. NewsAPI free tier covers English sources from last 30 days only.
        </div>
      )}
    </div>
  );
}

function getCategoryWithMostResults(data) {
  if (!data?.categoryMeta) return "news";
  const sorted = [...data.categoryMeta].sort((a, b) => b.count - a.count);
  return sorted[0]?.id || "news";
}

/* ─── Main Page ──────────────────────────────────────────── */
export function ConstituencyDetailPage() {
  const { token }                  = useAuth();
  const { bodyType, year, seatNo } = useParams();
  const [searchParams]             = useSearchParams();
  const [loading, setLoading]      = useState(true);
  const [data, setData]            = useState(null);
  const [tab, setTab]              = useState("winner");

  const backTo = searchParams.get("from") || `/admin/election/results?bodyType=${bodyType || "VIDHAN_SABHA"}&year=${year || "2022"}&tab=winners`;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setData(null);
    const qs = new URLSearchParams({ bodyType: bodyType || "VIDHAN_SABHA", year: year || "2022" });
    api(`/api/admin/constituency/UP/seat/${seatNo}?${qs}`, { token })
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) toastFromError(e, "Failed to load constituency"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token, bodyType, year, seatNo]);

  const winners = data?.candidates?.filter((c) => c.result === "WINNER") || [];
  const losers  = data?.candidates?.filter((c) => c.result !== "WINNER") || [];

  const tabCounts = {
    winner:   winners.length,
    loser:    losers.length,
    social:   5,
    mentions: "Live",
  };

  return (
    <div className="-m-4 flex min-h-[calc(100dvh-3.5rem)] flex-col bg-[#f3ede4] sm:-m-6">

      {/* Header */}
      <div className="shrink-0 border-b border-amber-200/70 bg-gradient-to-r from-[#e5efe8] via-[#faf6f0] to-[#f0e6dc] px-4 py-5 sm:px-6">
        <Link to={backTo} className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-700 hover:text-teal-900 hover:underline">
          <LuArrowLeft className="h-3.5 w-3.5" /> Back to Constituency Results
        </Link>
        {data?.supported ? (
          <>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-emerald-950">
              {data.seatName}
              <span className="ml-2 text-sm font-normal text-stone-500">Seat #{data.seatNo}</span>
            </h1>
            <div className="mt-1 flex flex-wrap gap-4 text-xs text-stone-600">
              <span className="flex items-center gap-1"><LuMapPin className="h-3 w-3" />{data.district || "Uttar Pradesh"}</span>
              <span>{data.bodyType?.replace(/_/g, " ")} · {data.year}</span>
              <span className="flex items-center gap-1"><LuUsers className="h-3 w-3" />{data.totalContestants} candidates</span>
              {data.polledVotes ? <span>{Number(data.polledVotes).toLocaleString("en-IN")} votes polled</span> : null}
              {data.marginVotes > 0 ? <span>Margin: {data.marginVotes.toLocaleString("en-IN")}</span> : null}
            </div>
          </>
        ) : (
          <h1 className="mt-2 text-xl font-bold text-emerald-950">Constituency #{seatNo}</h1>
        )}
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="animate-pulse text-sm text-stone-500">Loading constituency data…</p>
        </div>
      ) : !data?.supported ? (
        <div className="m-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-10 text-center text-sm text-amber-900">
          {data?.message || "Constituency data unavailable."}
        </div>
      ) : (
        <div className="flex-1 space-y-4 p-4 sm:p-6">

          {/* KPI row */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatBox label="Winner"           value={data.winner?.candidate} accent />
            <StatBox label="Party"            value={data.winner?.party} />
            <StatBox label="Winner Vote %"    value={`${data.winnerVoteShare}%`} />
            <StatBox label="Total Candidates" value={String(data.totalContestants)} />
          </div>

          {/* 4-Tab bar */}
          <div className="flex rounded-2xl border border-amber-200/70 bg-[#f0e6dc] p-1 gap-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold transition-all duration-150 ${
                  tab === t.id
                    ? `${t.active} text-white shadow`
                    : `bg-transparent text-stone-600 ${t.inactive}`
                }`}
              >
                <t.icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t.label}</span>
                <span className="sm:hidden">{t.label.split(" ")[0]}</span>
                <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${tab === t.id ? "bg-white/20 text-white" : "bg-stone-200 text-stone-600"}`}>
                  {tabCounts[t.id]}
                </span>
              </button>
            ))}
          </div>

          {/* Tab content */}
          {tab === "winner" && (
            <div className="space-y-4">
              {winners.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50/50 py-12 text-center text-sm text-stone-400">No winner data.</div>
              ) : winners.map((c) => (
                <CandidateCard key={`${c.rank}-${c.candidate}`} c={c} polledVotes={data.polledVotes || 0} winnerVotes={data.winner?.votes || 0} />
              ))}
            </div>
          )}

          {tab === "loser" && (
            <div className="space-y-4">
              {losers.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50/50 py-12 text-center text-sm text-stone-400">No loser data.</div>
              ) : losers.map((c) => (
                <CandidateCard key={`${c.rank}-${c.candidate}`} c={c} polledVotes={data.polledVotes || 0} winnerVotes={data.winner?.votes || 0} />
              ))}
            </div>
          )}

          {tab === "social" && (
            <SocialMediaTab
              constituencyInfo={{
                stateCode: data.stateCode || "UP",
                bodyType:  data.bodyType  || "VIDHAN_SABHA",
                year:      data.year      || "2022",
                seatNo:    data.seatNo,
                seatName:  data.seatName,
              }}
              candidates={data.candidates || []}
              token={token}
            />
          )}

          {tab === "mentions" && <DigitalMentionsTab seatName={data.seatName} winnerName={data.winner?.candidate} token={token} />}

          {/* Source */}
          <div className="rounded-xl border border-amber-200/60 bg-amber-50/70 px-4 py-3 text-[11px] text-stone-500 flex items-center justify-between flex-wrap gap-2">
            <span><strong className="text-amber-800">Sources:</strong> {data.source}</span>
            <a href="https://myneta.info/uttarpradesh2022/" target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1 font-medium text-teal-700 hover:underline">
              <LuBadgeCheck className="h-3.5 w-3.5" /> myneta.info
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
