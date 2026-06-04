import { useEffect, useState, useCallback, useRef } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { MapContainer, GeoJSON, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  LuTrophy, LuUsers, LuUser, LuGraduationCap, LuBriefcase,
  LuWallet, LuTriangleAlert, LuShieldCheck, LuMapPin,
  LuExternalLink, LuArrowLeft, LuBadgeCheck, LuShare2,
  LuGlobe, LuHash, LuMessageSquare, LuBookOpen, LuStar,
  LuNewspaper, LuFileText, LuSearch, LuLink, LuRefreshCw,
  LuCircleAlert, LuImage, LuCirclePlay, LuLayers,
  LuChartBar, LuRadar, LuTrendingUp, LuTrendingDown,
  LuMinus, LuActivity,
} from "react-icons/lu";
import { useAuth } from "../../auth/AuthProvider";
import { api } from "../../lib/api";
import { toastFromError } from "../../lib/toast";

/* ─── Constants ─────────────────────────────────────────── */
const PARTY_COLORS = {
  BJP: "bg-orange-500", SP: "bg-lime-600", INC: "bg-sky-600",
  BSP: "bg-slate-700", RLD: "bg-green-600", IND: "bg-gray-500",
  AAP: "bg-emerald-600", Others: "bg-slate-400",
};

const TABS = [
  { id: "winner",     label: "Winner",           icon: LuTrophy,    active: "bg-emerald-700", inactive: "hover:text-emerald-900" },
  { id: "loser",      label: "Losers",            icon: LuUsers,     active: "bg-rose-600",    inactive: "hover:text-rose-900"    },
  { id: "social",     label: "Social Media",      icon: LuShare2,    active: "bg-indigo-600",  inactive: "hover:text-indigo-900"  },
  { id: "mentions",   label: "Digital Mentions",  icon: LuGlobe,     active: "bg-amber-600",   inactive: "hover:text-amber-900"   },
  { id: "popularity", label: "Popularity Index",  icon: LuChartBar,  active: "bg-violet-600",  inactive: "hover:text-violet-900"  },
  { id: "sensing",    label: "Social Sensing",    icon: LuRadar,     active: "bg-teal-600",    inactive: "hover:text-teal-900"    },
];

const SOCIAL_PLATFORMS = [
  { id: "instagram", label: "Instagram",   color: "from-pink-500 to-rose-500",   textColor: "text-pink-700",  bg: "bg-pink-50",  border: "border-pink-200",  icon: "IG" },
  { id: "facebook",  label: "Facebook",    color: "from-blue-600 to-blue-500",   textColor: "text-blue-700",  bg: "bg-blue-50",  border: "border-blue-200",  icon: "FB" },
  { id: "youtube",   label: "YouTube",     color: "from-red-600 to-red-500",     textColor: "text-red-700",   bg: "bg-red-50",   border: "border-red-200",   icon: "YT" },
  { id: "twitter",   label: "X (Twitter)", color: "from-slate-800 to-slate-700", textColor: "text-slate-700", bg: "bg-slate-50", border: "border-slate-200", icon: "X"  },
  { id: "threads",   label: "Threads",     color: "from-gray-800 to-gray-700",   textColor: "text-gray-700",  bg: "bg-gray-50",  border: "border-gray-200",  icon: "TH" },
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
  news:         { color: "bg-red-100    text-red-700",      border: "border-red-200"    },
  blogs:        { color: "bg-indigo-100 text-indigo-700",   border: "border-indigo-200" },
  articles:     { color: "bg-blue-100   text-blue-700",     border: "border-blue-200"   },
  qa:           { color: "bg-amber-100  text-amber-700",    border: "border-amber-200"  },
  reviews:      { color: "bg-yellow-100 text-yellow-700",   border: "border-yellow-200" },
  websites:     { color: "bg-teal-100   text-teal-700",     border: "border-teal-200"   },
  forum:        { color: "bg-violet-100 text-violet-700",   border: "border-violet-200" },
  testimonials: { color: "bg-emerald-100 text-emerald-700", border: "border-emerald-200"},
  others:       { color: "bg-slate-100  text-slate-700",    border: "border-slate-200"  },
};

/* ─── Small reusable UI ──────────────────────────────────── */
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
      {Icon && <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-stone-400" />}
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
    <div className="flex items-center justify-center py-12">
      <LuRefreshCw className="h-5 w-5 animate-spin text-stone-400" />
      <span className="ml-2 text-sm text-stone-400">Loading…</span>
    </div>
  );
}

function TabError({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 py-10 text-center">
      <LuCircleAlert className="h-6 w-6 text-rose-400" />
      <p className="text-sm text-rose-700">{message || "Failed to load data."}</p>
      {onRetry && (
        <button onClick={onRetry} className="inline-flex items-center gap-1.5 rounded-lg bg-rose-100 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-200 transition">
          <LuRefreshCw className="h-3.5 w-3.5" /> Retry
        </button>
      )}
    </div>
  );
}

/* ─── Constituency Map ───────────────────────────────────── */
const PARTY_MAP_COLORS = {
  BJP: "#ff8a1a", SP: "#a9b247", INC: "#4ea8de", BSP: "#9aa5b1",
  RLD: "#8db46a", AAP: "#2fa84f", IND: "#95a5a6", Others: "#cfd8e3",
};

function FitToConstituency({ geoJson }) {
  const map = useMap();
  useEffect(() => {
    if (!geoJson?.features?.length) return;
    try {
      const layer = L.geoJSON(geoJson);
      const bounds = layer.getBounds();
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [30, 30], maxZoom: 12, animate: false });
    } catch { /* ignore */ }
  }, [geoJson, map]);
  return null;
}

function ConstituencyMap({ seatName, seatNo, bodyType, year }) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [geoJson, setGeoJson]   = useState(null);
  const [winnerParty, setWinnerParty] = useState(null);

  useEffect(() => {
    if (!seatNo) return;
    setLoading(true);
    const qs = new URLSearchParams({
      bodyType: bodyType || "VIDHAN_SABHA",
      year:     year     || "2022",
      search:   String(seatNo),
      party:    "ALL",
      party2012: "All selected",
      party2017: "All selected",
      party2022: "All selected",
    });
    api(`/api/admin/election-analytics/UP?${qs}`, { token })
      .then((d) => {
        const all = d?.geoJson?.features || [];
        // try to find exact seat, fallback to all features returned
        const seat = all.filter((f) => Number(f.properties?.acNo || f.properties?.seatNo || f.properties?.ac_no) === Number(seatNo));
        const features = seat.length > 0 ? seat : all;
        if (features.length > 0) setWinnerParty(features[0].properties?.party || null);
        setGeoJson({ type: "FeatureCollection", features });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [seatNo, bodyType, year, token]);

  const geoStyle = useCallback((feature) => {
    const party = feature?.properties?.party || "Others";
    return { color: "#374151", weight: 1.5, fillColor: PARTY_MAP_COLORS[party] || PARTY_MAP_COLORS.Others, fillOpacity: 0.85 };
  }, []);

  const onEachFeature = useCallback((feature, layer) => {
    const p = feature?.properties || {};
    layer.bindTooltip(
      `<div style="font-size:12px;line-height:1.5"><b>${p.constituency || p.acName || seatName}</b><br/>Winner: <b>${p.candidate || "—"}</b><br/>Party: ${p.party || "—"} · ${p.votePercent || "—"}%<br/>Votes: ${(p.votes || 0).toLocaleString("en-IN")}</div>`,
      { sticky: true, className: "leaflet-tooltip-custom" }
    );
  }, [seatName]);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Header — same orange style as election page */}
      <div className="bg-[#eb7f2b] px-5 py-3 flex items-center gap-3">
        <LuMapPin className="h-4 w-4 text-white shrink-0" />
        <span className="text-sm font-bold text-white tracking-wide">
          ASSEMBLY ELECTIONS VIEW BY INDIVIDUAL ELECTIONS ({year || "2022"})
        </span>
        <span className="ml-auto text-[11px] font-medium text-orange-100 shrink-0">Seat #{seatNo}</span>
      </div>

      {/* Map */}
      <div style={{ height: 400 }} className="bg-[#eef1f4]">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">
            <LuRefreshCw className="h-4 w-4 animate-spin mr-2" /> Loading map…
          </div>
        ) : geoJson?.features?.length > 0 ? (
          <MapContainer
            key={`cmap-${seatNo}-${year}`}
            center={[27.5, 80.5]}
            zoom={7}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={false}
            zoomControl
            preferCanvas
          >
            <FitToConstituency geoJson={geoJson} />
            <GeoJSON key={JSON.stringify(geoJson?.features?.length)} data={geoJson} style={geoStyle} onEachFeature={onEachFeature} />
          </MapContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            Constituency boundary data not available.
          </div>
        )}
      </div>

      {/* Footer legend */}
      <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center gap-3 flex-wrap">
        {winnerParty && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <span className="inline-block h-3 w-3 rounded-sm" style={{ background: PARTY_MAP_COLORS[winnerParty] || PARTY_MAP_COLORS.Others }} />
            {winnerParty} — {seatName}
          </span>
        )}
        <span className="ml-auto text-[10px] text-stone-400">ECI · {bodyType?.replace(/_/g, " ")} {year}</span>
      </div>
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
      isWinner   ? "border-emerald-300 bg-gradient-to-br from-emerald-50 to-[#faf6f0]"
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
            {c.personal?.age        && <span className="flex items-center gap-1"><LuUser className="h-3 w-3" /> Age {c.personal.age}</span>}
            {c.personal?.education  && <span className="flex items-center gap-1"><LuGraduationCap className="h-3 w-3" /> {c.personal.education}</span>}
            {c.personal?.profession && <span className="flex items-center gap-1"><LuBriefcase className="h-3 w-3" /> {c.personal.profession}</span>}
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
          {!isWinner && winnerVotes > 0 && <span className="font-medium text-rose-600">−{(winnerVotes - c.votes).toLocaleString("en-IN")} vs winner</span>}
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div className={`h-2 rounded-full ${isWinner ? "bg-emerald-500" : "bg-amber-400"}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="grid gap-3 p-5 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">Personal Info</div>
          <InfoRow icon={LuGraduationCap} label="Education"  value={c.personal?.education} />
          <InfoRow icon={LuBriefcase}     label="Profession" value={c.personal?.profession} />
          <InfoRow icon={LuUser}          label="Age"        value={c.personal?.age ? `${c.personal.age} years` : ""} />
          <InfoRow icon={LuUser}          label="Gender"     value={c.personal?.gender} />
          {!c.personal?.education && !c.personal?.age && <p className="text-[11px] text-stone-400 italic mt-1">No affidavit data</p>}
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">Declared Assets</div>
          <InfoRow icon={LuWallet} label="Total Assets" value={c.financials?.totalAssets} />
          <InfoRow icon={LuWallet} label="Liabilities"  value={c.financials?.totalLiabilities} />
          {!c.financials?.totalAssets && <p className="text-[11px] text-stone-400 italic mt-1">No asset data</p>}
          <div className="mt-3">
            <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">Criminal Record</div>
            <CriminalBadge totalCases={c.criminal?.totalCases} />
          </div>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">Links &amp; Address</div>
          {c.address?.self && <div className="mb-2 flex items-start gap-1.5"><LuMapPin className="mt-0.5 h-3 w-3 shrink-0 text-stone-400" /><span className="text-[11px] text-stone-600">{c.address.self}</span></div>}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {c.social?.facebook  && <a href={c.social.facebook}  target="_blank" rel="noreferrer" className="rounded-lg bg-blue-50  px-2.5 py-1 text-[11px] font-semibold text-blue-700  hover:bg-blue-100 transition">Facebook</a>}
            {c.social?.twitter   && <a href={c.social.twitter}   target="_blank" rel="noreferrer" className="rounded-lg bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 transition">Twitter</a>}
            {c.social?.instagram && <a href={c.social.instagram} target="_blank" rel="noreferrer" className="rounded-lg bg-pink-50  px-2.5 py-1 text-[11px] font-semibold text-pink-700  hover:bg-pink-100 transition">Instagram</a>}
            {c.social?.youtube   && <a href={c.social.youtube}   target="_blank" rel="noreferrer" className="rounded-lg bg-red-50   px-2.5 py-1 text-[11px] font-semibold text-red-700   hover:bg-red-100 transition">YouTube</a>}
            {c.social?.website   && <a href={c.social.website}   target="_blank" rel="noreferrer" className="rounded-lg bg-teal-50  px-2.5 py-1 text-[11px] font-semibold text-teal-700  hover:bg-teal-100 transition">Website</a>}
            {c.wikipedia         && <a href={c.wikipedia}        target="_blank" rel="noreferrer" className="rounded-lg bg-gray-50  px-2.5 py-1 text-[11px] font-semibold text-gray-700  hover:bg-gray-100 transition">Wikipedia</a>}
            {c.mynetaUrl         && <a href={c.mynetaUrl}        target="_blank" rel="noreferrer" className="rounded-lg bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 hover:bg-amber-100 transition">Myneta</a>}
            {!c.social?.facebook && !c.wikipedia && !c.mynetaUrl && <p className="text-[11px] text-stone-400 italic">No links available</p>}
          </div>
        </div>
      </div>
      {c.bio && <div className="mx-5 mb-5 rounded-xl border border-amber-100 bg-amber-50/60 px-4 py-3 text-[11px] leading-relaxed text-stone-600 italic">{c.bio}</div>}
    </div>
  );
}

/* ─── Social Media — Winner only ────────────────────────── */
function SocialStatCard({ platform, stats }) {
  const p = SOCIAL_PLATFORMS.find((x) => x.id === platform);
  if (!p) return null;
  const connected = stats?.connected ?? false;
  return (
    <div className={`rounded-2xl border ${p.border} ${p.bg} p-4 shadow-sm`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br ${p.color} text-xs font-black text-white shadow`}>{p.icon}</span>
          <div>
            <p className={`text-sm font-bold ${p.textColor}`}>{p.label}</p>
            <p className="text-[10px] text-stone-400">{connected ? (stats?.handle || "Connected") : "Not linked"}</p>
          </div>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${connected ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
          {connected ? "Live" : "—"}
        </span>
      </div>
      {connected ? (
        <div className="grid grid-cols-3 gap-1.5 mt-2">
          {[{ label: "Followers", value: stats?.followers }, { label: "Following", value: stats?.following }, { label: "Posts", value: stats?.posts }].map((s) => (
            <div key={s.label} className="rounded-lg bg-white/70 px-2 py-1.5 text-center border border-white/80">
              <p className={`text-sm font-bold ${p.textColor}`}>{s.value || "—"}</p>
              <p className="text-[10px] text-stone-400">{s.label}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-2 rounded-xl border border-dashed border-slate-200 bg-white/50 py-3 text-center text-[11px] text-stone-400">Not connected</div>
      )}
    </div>
  );
}

function mediaIcon(type) {
  if (!type) return null;
  const t = type.toLowerCase();
  if (t === "video")    return <LuCirclePlay className="h-3 w-3" />;
  if (t === "carousel") return <LuLayers className="h-3 w-3" />;
  return <LuImage className="h-3 w-3" />;
}

function PostCard({ index, post }) {
  const p = SOCIAL_PLATFORMS.find((x) => x.id === post.platform);
  const colorMap = { instagram: "border-pink-100 bg-pink-50/40", facebook: "border-blue-100 bg-blue-50/40", youtube: "border-red-100 bg-red-50/40", twitter: "border-slate-100 bg-slate-50/40", threads: "border-gray-100 bg-gray-50/40" };
  const badgeMap = { instagram: "bg-pink-100 text-pink-700", facebook: "bg-blue-100 text-blue-700", youtube: "bg-red-100 text-red-700", twitter: "bg-slate-100 text-slate-700", threads: "bg-gray-100 text-gray-700" };
  return (
    <div className={`rounded-xl border p-4 ${colorMap[post.platform] || "border-slate-100 bg-slate-50/40"}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[9px] font-black text-stone-500 shadow-sm border">{index}</span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${badgeMap[post.platform] || "bg-slate-100 text-slate-600"}`}>{p?.label || post.platform}</span>
          {post.type && <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] text-stone-400 border">{mediaIcon(post.type)}{post.type}</span>}
        </div>
        <span className="text-[10px] text-stone-400 shrink-0">{post.date || "—"}</span>
      </div>
      {post.mediaUrl && <img src={post.mediaUrl} alt="post" loading="lazy" className="mb-2 w-full max-h-32 rounded-lg object-cover border border-white/60" onError={(e) => { e.currentTarget.style.display = "none"; }} />}
      <p className="text-xs text-stone-600 leading-relaxed line-clamp-3">{post.content}</p>
      <div className="mt-2 flex items-center justify-between gap-3">
        <div className="flex gap-3 text-[11px] text-stone-400">
          {post.likes    != null && <span>👍 {post.likes.toLocaleString("en-IN")}</span>}
          {post.comments != null && <span>💬 {post.comments.toLocaleString("en-IN")}</span>}
          {post.shares   != null && <span>↗ {post.shares.toLocaleString("en-IN")}</span>}
        </div>
        {post.url && <a href={post.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] font-medium text-teal-700 hover:underline shrink-0"><LuExternalLink className="h-3 w-3" /> View</a>}
      </div>
    </div>
  );
}

function ConnectSocialForm({ constituencyInfo, winner, token, onSaved }) {
  const [saving, setSaving] = useState(false);
  const emptyForm = { ig_id: "", ig_handle: "", fb_id: "", fb_handle: "", yt_id: "", yt_handle: "", tw_handle: "", th_handle: "" };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!winner) return;
    const qs = new URLSearchParams({ stateCode: constituencyInfo.stateCode, bodyType: constituencyInfo.bodyType, year: constituencyInfo.year, seatNo: constituencyInfo.seatNo });
    api(`/api/admin/social-data/links?${qs}`, { token })
      .then((d) => {
        const link = d.links?.find((l) => l.candidateName.toLowerCase() === winner.toLowerCase());
        if (link) setForm({ ig_id: link.instagram?.igUserId || "", ig_handle: link.instagram?.handle || "", fb_id: link.facebook?.pageId || "", fb_handle: link.facebook?.handle || "", yt_id: link.youtube?.channelId || "", yt_handle: link.youtube?.handle || "", tw_handle: link.twitter?.handle || "", th_handle: link.threads?.handle || "" });
        else setForm(emptyForm);
      }).catch(() => {});
  }, [winner, constituencyInfo, token]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await api("/api/admin/social-data/links", { method: "POST", token, body: { stateCode: constituencyInfo.stateCode, bodyType: constituencyInfo.bodyType, year: constituencyInfo.year, seatNo: constituencyInfo.seatNo, seatName: constituencyInfo.seatName, candidateName: winner, instagram: { igUserId: form.ig_id, handle: form.ig_handle }, facebook: { pageId: form.fb_id, handle: form.fb_handle }, youtube: { channelId: form.yt_id, handle: form.yt_handle }, twitter: { handle: form.tw_handle }, threads: { handle: form.th_handle } } });
      onSaved();
    } catch (e) { alert(e.message || "Save failed"); }
    finally { setSaving(false); }
  };

  const rows = [
    { label: "Instagram", items: [{ k: "ig_id", ph: "Business Account ID (e.g. 17841404386799884)", hint: "From Meta Business Suite" }, { k: "ig_handle", ph: "@handle" }] },
    { label: "Facebook",  items: [{ k: "fb_id",  ph: "Page ID" }, { k: "fb_handle", ph: "@page" }] },
    { label: "YouTube",   items: [{ k: "yt_id",  ph: "Channel ID (UCxxxx)" }, { k: "yt_handle", ph: "@channel" }] },
    { label: "X (Twitter)", items: [{ k: "tw_handle", ph: "@handle" }] },
    { label: "Threads",   items: [{ k: "th_handle", ph: "@handle" }] },
  ];

  return (
    <div className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-4 space-y-3">
      <p className="text-xs font-bold text-indigo-800 flex items-center gap-1.5"><LuLink className="h-3.5 w-3.5" /> Connect Social Accounts for {winner}</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map(({ label, items }) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{label}</p>
            {items.map(({ k, ph, hint }) => (
              <div key={k}>
                <input type="text" value={form[k]} onChange={(e) => set(k, e.target.value)} placeholder={ph}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                {hint && <p className="text-[10px] text-stone-400 mt-0.5">{hint}</p>}
              </div>
            ))}
          </div>
        ))}
      </div>
      <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition disabled:opacity-50">
        {saving ? <LuRefreshCw className="h-3.5 w-3.5 animate-spin" /> : <LuLink className="h-3.5 w-3.5" />}
        {saving ? "Saving…" : "Save Accounts"}
      </button>
    </div>
  );
}

function WinnerSocialSection({ constituencyInfo, winner, token }) {
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [data, setData]             = useState(null);
  const [showForm, setShowForm]     = useState(false);
  const [activePlatform, setActivePlatform] = useState("all");

  const load = useCallback(() => {
    if (!winner) return;
    setLoading(true); setError(null);
    const qs = new URLSearchParams({ stateCode: constituencyInfo.stateCode, bodyType: constituencyInfo.bodyType, year: String(constituencyInfo.year), seatNo: String(constituencyInfo.seatNo), candidateName: winner });
    api(`/api/admin/social-data/social?${qs}`, { token })
      .then(setData).catch((e) => setError(e.message || "Failed")).finally(() => setLoading(false));
  }, [constituencyInfo, winner, token]);

  useEffect(() => { load(); }, [load]);

  const platformsMap = {};
  (data?.platforms || []).forEach((p) => { platformsMap[p.platform] = p; });
  const allPosts   = data?.posts || [];
  const shownPosts = activePlatform === "all" ? allPosts : allPosts.filter((p) => p.platform === activePlatform);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-xs font-bold uppercase tracking-wide text-stone-500 flex items-center gap-2">
          <LuShare2 className="h-3.5 w-3.5" /> {winner} — Social Media
          {!loading && (data?.hasLinks
            ? <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Linked</span>
            : <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">Not Linked</span>
          )}
        </h3>
        <button onClick={() => setShowForm((v) => !v)} className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-50 transition">
          <LuLink className="h-3 w-3" /> {showForm ? "Hide" : data?.hasLinks ? "Edit Accounts" : "+ Connect"}
        </button>
      </div>

      {showForm && <ConnectSocialForm constituencyInfo={constituencyInfo} winner={winner} token={token} onSaved={() => { setShowForm(false); load(); }} />}

      {loading && <TabSpinner />}
      {!loading && error && <TabError message={error} onRetry={load} />}

      {!loading && !error && !data?.hasLinks && !showForm && (
        <div className="rounded-xl border border-dashed border-indigo-200 bg-indigo-50/40 px-4 py-5 text-center text-xs text-indigo-600">
          Click &ldquo;+ Connect&rdquo; to link {winner}&apos;s social accounts and see live data.
        </div>
      )}

      {!loading && !error && data?.hasLinks && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SOCIAL_PLATFORMS.map((p) => <SocialStatCard key={p.id} platform={p.id} stats={platformsMap[p.id]} />)}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between flex-wrap gap-2">
              <p className="text-xs font-bold uppercase tracking-wide text-stone-500 flex items-center gap-1.5">
                <LuHash className="h-3.5 w-3.5" /> Last {allPosts.length} Posts
              </p>
              <div className="flex flex-wrap gap-1.5">
                <button onClick={() => setActivePlatform("all")} className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition ${activePlatform === "all" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                  All ({allPosts.length})
                </button>
                {SOCIAL_PLATFORMS.map((p) => {
                  const count = allPosts.filter((x) => x.platform === p.id).length;
                  if (!count) return null;
                  return (
                    <button key={p.id} onClick={() => setActivePlatform(p.id)}
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition ${activePlatform === p.id ? `bg-gradient-to-r ${p.color} text-white` : `${p.bg} ${p.textColor} hover:opacity-80`}`}>
                      {p.label} ({count})
                    </button>
                  );
                })}
              </div>
            </div>
            {shownPosts.length > 0
              ? <div className="grid gap-3 sm:grid-cols-2">{shownPosts.map((post, i) => <PostCard key={post.id || i} index={i + 1} post={post} />)}</div>
              : <div className="rounded-xl border border-dashed border-slate-200 bg-white py-8 text-center text-xs text-stone-400">No posts yet. Add Instagram Business Account ID to see live posts.</div>
            }
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Popularity Index ───────────────────────────────────── */
function PopularityIndexTab({ data }) {
  const candidates = data?.candidates || [];
  const polled     = data?.polledVotes || 1;
  const maxVotes   = data?.winner?.votes || 1;

  const items = candidates.map((c) => {
    const voteScore   = (c.votePercent || 0) * 0.5;
    const marginScore = c.result === "WINNER" ? 20 : Math.max(0, 30 - (((maxVotes - c.votes) / maxVotes) * 30));
    const winBonus    = c.result === "WINNER" ? 20 : c.result === "RUNNER_UP" ? 10 : 0;
    const pi          = Math.min(100, Math.round(voteScore + marginScore + winBonus));
    return { ...c, pi };
  }).sort((a, b) => b.pi - a.pi);

  const topPI = items[0]?.pi || 1;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-wide text-violet-400">Winner PI</div>
          <div className="mt-1 text-2xl font-bold text-violet-900">{items[0]?.pi ?? "—"}</div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-wide text-amber-400">Runner-Up PI</div>
          <div className="mt-1 text-2xl font-bold text-amber-700">{items.find((c) => c.result === "RUNNER_UP")?.pi ?? "—"}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-wide text-stone-400">Candidates</div>
          <div className="mt-1 text-2xl font-bold text-slate-700">{candidates.length}</div>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-wide text-stone-400">Votes Polled</div>
          <div className="mt-1 text-2xl font-bold text-emerald-700">{Number(polled).toLocaleString("en-IN")}</div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="px-5 py-3 border-b border-slate-100 text-xs font-bold uppercase tracking-wide text-stone-500 flex items-center gap-2">
          <LuChartBar className="h-3.5 w-3.5" /> Popularity Index — All Candidates
        </div>
        <div className="divide-y divide-slate-50">
          {items.map((c, i) => {
            const barW = Math.round((c.pi / topPI) * 100);
            const isW  = c.result === "WINNER";
            const isR  = c.result === "RUNNER_UP";
            return (
              <div key={c.candidate} className={`px-5 py-3 flex items-center gap-4 ${isW ? "bg-emerald-50/60" : ""}`}>
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${isW ? "bg-emerald-600" : isR ? "bg-amber-500" : "bg-slate-400"}`}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-800 truncate">{c.candidate}</span>
                    <span className="text-[10px] text-stone-400 ml-2 shrink-0">{c.party} · {c.votePercent}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div className={`h-2 rounded-full ${isW ? "bg-emerald-500" : isR ? "bg-amber-400" : "bg-slate-300"}`} style={{ width: `${barW}%` }} />
                  </div>
                </div>
                <span className={`shrink-0 text-sm font-bold w-8 text-right ${isW ? "text-emerald-700" : isR ? "text-amber-600" : "text-slate-500"}`}>{c.pi}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-[11px] text-stone-500">
        <strong className="text-slate-700">PI Formula:</strong> Vote Share (50%) + Margin Score (30%) + Win/Runner-Up Bonus (20%). Range 0–100.
      </div>
    </div>
  );
}

/* ─── Digital Mentions ───────────────────────────────────── */
function SentimentBadge({ sentiment }) {
  const map = { positive: "bg-emerald-100 text-emerald-700", negative: "bg-rose-100 text-rose-700", neutral: "bg-slate-100 text-slate-600" };
  return <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${map[sentiment] || map.neutral}`}>{sentiment || "neutral"}</span>;
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
        {m.url && <a href={m.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] font-medium text-teal-700 hover:underline shrink-0"><LuExternalLink className="h-3 w-3" /> View</a>}
      </div>
    </div>
  );
}

function DigitalMentionsTab({ seatName, winnerName, token }) {
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [data, setData]         = useState(null);
  const [activeCategory, setActiveCategory] = useState("news");

  const load = useCallback(() => {
    if (!seatName) return;
    setLoading(true); setError(null);
    const qs = new URLSearchParams({ seatName, state: "Uttar Pradesh", winnerName: winnerName || "" });
    api(`/api/admin/social-data/mentions?${qs}`, { token })
      .then((d) => {
        setData(d);
        const top = [...(d.categoryMeta || [])].sort((a, b) => b.count - a.count)[0];
        if (top) setActiveCategory(top.id);
      })
      .catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [seatName, winnerName, token]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <TabSpinner />;
  if (error)   return <TabError message={error} onRetry={load} />;

  const summary         = data?.summary || { total: 0, positive: 0, negative: 0, neutral: 0 };
  const byCategory      = data?.byCategory || {};
  const currentMentions = byCategory[activeCategory] || [];
  const catMeta         = data?.categoryMeta || [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total",    value: summary.total,    cls: "border-amber-200/70 bg-[#faf6f0]", v: "text-emerald-950" },
          { label: "Positive", value: summary.positive, cls: "border-emerald-200 bg-emerald-50", v: "text-emerald-700" },
          { label: "Neutral",  value: summary.neutral,  cls: "border-slate-200   bg-slate-50",   v: "text-slate-700"   },
          { label: "Negative", value: summary.negative, cls: "border-rose-200    bg-rose-50",     v: "text-rose-700"    },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border ${s.cls} px-4 py-3 shadow-sm`}>
            <div className="text-[10px] font-bold uppercase tracking-wide text-stone-400">{s.label}</div>
            <div className={`mt-1 text-2xl font-bold ${s.v}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {MENTION_CATEGORIES.map((cat) => {
          const count  = catMeta.find((m) => m.id === cat.id)?.count ?? 0;
          const cc     = CATEGORY_COLORS[cat.id] || CATEGORY_COLORS.others;
          const active = activeCategory === cat.id;
          return (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 rounded-2xl border p-3 text-left transition-all ${active ? `${cc.border} ring-2 ring-offset-1 ${cc.border.replace("border-", "ring-")} bg-white` : "border-slate-200 bg-white hover:border-slate-300"}`}>
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${cc.color}`}><cat.icon className="h-4 w-4" /></span>
              <div><p className="text-xs font-semibold text-slate-800">{cat.label}</p><p className="text-[10px] text-stone-400">{count} results</p></div>
            </button>
          );
        })}
      </div>

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-stone-500">{MENTION_CATEGORIES.find((c) => c.id === activeCategory)?.label} ({currentMentions.length})</p>
        {currentMentions.length > 0
          ? <div className="space-y-3">{currentMentions.map((m, i) => <MentionItem key={i} index={i + 1} m={m} />)}</div>
          : <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-10 text-center text-sm text-stone-400">No results in this category.</div>
        }
      </div>

      {data?.isFallback && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
          Showing broader UP election news — no specific results found for &ldquo;{seatName}&rdquo;. NewsAPI free tier covers last 30 days only.
        </div>
      )}
    </div>
  );
}

/* ─── Social Sensing Tab ─────────────────────────────────── */
function SocialSensingTab({ seatName, candidates }) {
  const winner     = candidates.find((c) => c.result === "WINNER");
  const totalVotes = candidates.reduce((s, c) => s + (c.votes || 0), 0) || 1;

  const getSentiment = (c) => {
    const criminal  = parseInt(c?.criminal?.totalCases, 10) || 0;
    const voteShare = c?.votePercent || 0;
    if (voteShare > 40 && !criminal) return "positive";
    if (criminal > 0 || voteShare < 5) return "negative";
    return "neutral";
  };

  const overall       = winner ? getSentiment(winner) : "neutral";
  const sentColor     = { positive: "text-emerald-600", negative: "text-rose-600", neutral: "text-slate-500" };
  const sentBg        = { positive: "bg-emerald-50 border-emerald-200", negative: "bg-rose-50 border-rose-200", neutral: "bg-slate-50 border-slate-200" };
  const SentIcon      = { positive: LuTrendingUp, negative: LuTrendingDown, neutral: LuMinus }[overall] || LuMinus;
  const criminalCount = candidates.filter((c) => parseInt(c.criminal?.totalCases, 10) > 0).length;
  const competition   = candidates.length > 10 ? "High" : candidates.length > 6 ? "Medium" : "Low";

  return (
    <div className="space-y-4">
      {/* Overall pulse */}
      <div className={`rounded-2xl border ${sentBg[overall]} p-5 flex items-center gap-5`}>
        <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${overall === "positive" ? "bg-emerald-100" : overall === "negative" ? "bg-rose-100" : "bg-slate-100"}`}>
          <SentIcon className={`h-6 w-6 ${sentColor[overall]}`} />
        </span>
        <div className="flex-1">
          <p className="text-xs font-bold uppercase tracking-wide text-stone-400">Constituency Social Pulse — {seatName}</p>
          <p className={`text-xl font-bold mt-0.5 capitalize ${sentColor[overall]}`}>{overall}</p>
          <p className="text-xs text-stone-500 mt-0.5">Based on vote share, margin and candidate profile analysis</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] text-stone-400">Winner Buzz</p>
          <p className="text-2xl font-bold text-slate-800">{winner ? Math.round((winner.votes / totalVotes) * 100) : 0}%</p>
        </div>
      </div>

      {/* Insight cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-violet-400 mb-1">Dominance Score</p>
          <p className="text-2xl font-bold text-violet-800">{winner?.votePercent ?? "—"}%</p>
          <p className="text-[11px] text-violet-600 mt-1">Above 40% = Strong mandate</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-amber-400 mb-1">Competition Level</p>
          <p className="text-2xl font-bold text-amber-700">{competition}</p>
          <p className="text-[11px] text-amber-600 mt-1">{candidates.length} candidates contested</p>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-rose-400 mb-1">Criminal Candidates</p>
          <p className="text-2xl font-bold text-rose-700">{criminalCount}</p>
          <p className="text-[11px] text-rose-600 mt-1">out of {candidates.length} total</p>
        </div>
      </div>

      {/* Candidate signal list */}
      <div>
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-stone-500 flex items-center gap-2"><LuActivity className="h-3.5 w-3.5" /> Candidate Social Signal</p>
        <div className="space-y-2">
          {candidates.slice(0, 8).map((c) => {
            const sent  = getSentiment(c);
            const sc    = sentColor[sent] || "text-slate-500";
            const SIcon = { positive: LuTrendingUp, negative: LuTrendingDown, neutral: LuMinus }[sent] || LuMinus;
            const buzz  = Math.round(((c.votes || 0) / totalVotes) * 100);
            const crim  = parseInt(c.criminal?.totalCases, 10) || 0;
            const isW   = c.result === "WINNER";
            const isR   = c.result === "RUNNER_UP";
            return (
              <div key={c.candidate} className={`flex items-center gap-3 rounded-xl border bg-white px-4 py-3 ${isW ? "border-emerald-200 bg-emerald-50/50" : isR ? "border-amber-200 bg-amber-50/30" : "border-slate-200"}`}>
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${isW ? "bg-emerald-600" : isR ? "bg-amber-500" : "bg-slate-400"}`}>
                  {c.rank}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">{c.candidate}</p>
                  <p className="text-[10px] text-stone-400">{c.party} · {c.votePercent}% votes</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {crim > 0 && <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">{crim} cases</span>}
                  <div className="text-right">
                    <p className="text-[10px] text-stone-400">Buzz</p>
                    <p className="text-xs font-bold text-slate-700">{buzz}%</p>
                  </div>
                  <SIcon className={`h-4 w-4 ${sc}`} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-[11px] text-stone-500">
        <strong className="text-slate-700">Social Sensing</strong> uses vote share, margin, criminal records and candidate profiles to estimate constituency sentiment. Connect real social accounts for live signal data.
      </div>
    </div>
  );
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
    setLoading(true); setData(null);
    const qs = new URLSearchParams({ bodyType: bodyType || "VIDHAN_SABHA", year: year || "2022" });
    api(`/api/admin/constituency/UP/seat/${seatNo}?${qs}`, { token })
      .then((d)  => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) toastFromError(e, "Failed to load constituency"); })
      .finally(()  => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token, bodyType, year, seatNo]);

  const winners = data?.candidates?.filter((c) => c.result === "WINNER") || [];
  const losers  = data?.candidates?.filter((c) => c.result !== "WINNER") || [];

  const constituencyInfo = {
    stateCode: data?.stateCode || "UP",
    bodyType:  data?.bodyType  || "VIDHAN_SABHA",
    year:      data?.year      || "2022",
    seatNo:    data?.seatNo,
    seatName:  data?.seatName,
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
              {data.polledVotes  > 0 && <span>{Number(data.polledVotes).toLocaleString("en-IN")} votes polled</span>}
              {data.marginVotes > 0  && <span>Margin: {data.marginVotes.toLocaleString("en-IN")}</span>}
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

          {/* 5-Tab bar */}
          <div className="flex rounded-2xl border border-amber-200/70 bg-[#f0e6dc] p-1 gap-1 overflow-x-auto">
            {TABS.map((t) => (
              <button key={t.id} type="button" onClick={() => setTab(t.id)}
                className={`flex flex-1 min-w-fit items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-xs font-semibold transition-all duration-150 ${
                  tab === t.id ? `${t.active} text-white shadow` : `bg-transparent text-stone-600 ${t.inactive}`
                }`}>
                <t.icon className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline whitespace-nowrap">{t.label}</span>
                <span className="sm:hidden">{t.label.split(" ")[0]}</span>
              </button>
            ))}
          </div>

          {/* Tab: Winner — Card + Map + Popularity Index + Social Sensing */}
          {tab === "winner" && (
            <div className="space-y-6">
              {winners.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50/50 py-12 text-center text-sm text-stone-400">No winner data.</div>
              ) : (
                winners.map((c) => <CandidateCard key={c.candidate} c={c} polledVotes={data.polledVotes || 0} winnerVotes={data.winner?.votes || 0} />)
              )}

              {/* Constituency Map */}
              <ConstituencyMap seatName={data.seatName} seatNo={data.seatNo} bodyType={data.bodyType} year={data.year} />

              {/* Popularity Index — embedded in Winner tab */}
              <div className="rounded-2xl border border-violet-200 bg-white overflow-hidden shadow-sm">
                <div className="bg-violet-600 px-5 py-3 flex items-center gap-2">
                  <LuChartBar className="h-4 w-4 text-white" />
                  <span className="text-sm font-bold text-white">Popularity Index (PI)</span>
                  <span className="ml-auto text-[11px] text-violet-200">Score 0–100 based on vote share &amp; margin</span>
                </div>
                <div className="p-5">
                  <PopularityIndexTab data={data} />
                </div>
              </div>

              {/* Social Sensing — embedded in Winner tab */}
              <div className="rounded-2xl border border-indigo-200 bg-white overflow-hidden shadow-sm">
                <div className="bg-indigo-600 px-5 py-3 flex items-center gap-2">
                  <LuRadar className="h-4 w-4 text-white" />
                  <span className="text-sm font-bold text-white">Social Sensing</span>
                  <span className="ml-auto text-[11px] text-indigo-200">Constituency pulse &amp; candidate signals</span>
                </div>
                <div className="p-5">
                  <SocialSensingTab seatName={data.seatName} candidates={data.candidates || []} />
                </div>
              </div>
            </div>
          )}

          {/* Tab: Losers */}
          {tab === "loser" && (
            <div className="space-y-4">
              {losers.length === 0
                ? <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50/50 py-12 text-center text-sm text-stone-400">No loser data.</div>
                : losers.map((c) => <CandidateCard key={c.candidate} c={c} polledVotes={data.polledVotes || 0} winnerVotes={data.winner?.votes || 0} />)
              }
            </div>
          )}

          {/* Tab: Social Media — Winner only */}
          {tab === "social" && (
            <WinnerSocialSection constituencyInfo={constituencyInfo} winner={data.winner?.candidate} token={token} />
          )}

          {/* Tab: Digital Mentions */}
          {tab === "mentions" && (
            <DigitalMentionsTab seatName={data.seatName} winnerName={data.winner?.candidate} token={token} />
          )}

          {/* Source */}
          <div className="rounded-xl border border-amber-200/60 bg-amber-50/70 px-4 py-3 text-[11px] text-stone-500 flex items-center justify-between flex-wrap gap-2">
            <span><strong className="text-amber-800">Sources:</strong> {data.source}</span>
            <a href="https://myneta.info/uttarpradesh2022/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-teal-700 hover:underline">
              <LuBadgeCheck className="h-3.5 w-3.5" /> myneta.info
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
