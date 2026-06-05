import { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthProvider";
import { api } from "../../lib/api";
import { toastFromError } from "../../lib/toast";
import {
  LuFileText, LuShare2, LuMegaphone, LuChartBar, LuSettings,
  LuShieldCheck, LuCpu, LuUsers, LuTrendingUp, LuTrendingDown,
  LuMinus, LuCircleCheck, LuCircleX, LuZap, LuNewspaper,
  LuLink, LuInstagram, LuYoutube, LuTwitter, LuFacebook,
  LuCalendarDays, LuRefreshCw, LuPlay
} from "react-icons/lu";

function SectionHeader({ title, subtitle, Icon, color }) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-white shadow ${color}`}>
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <div>
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}

function StatBox({ label, value, sub, color = "bg-slate-50 border-slate-200" }) {
  return (
    <div className={`rounded-xl border ${color} p-4`}>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 text-2xl font-bold text-slate-900">{value ?? "—"}</div>
      {sub && <div className="mt-0.5 text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

function ProgressBar({ label, value, color = "bg-indigo-500" }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="font-medium text-slate-800">{label}</span>
        <span className="text-slate-500">{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100">
        <div className={`h-2 rounded-full ${color} transition-all`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

// ── ANALYTICS ──────────────────────────────────────────────
function AnalyticsSection({ data }) {
  const p = data?.data || {};
  return (
    <div className="space-y-6">
      <SectionHeader title="Analytics" subtitle="Constituency performance metrics and insights" Icon={LuChartBar} color="bg-gradient-to-br from-blue-500 to-indigo-600" />
      <div className="grid gap-4 sm:grid-cols-3">
        {p.scorecard?.map((s) => <StatBox key={s.label} label={s.label} value={s.value} />)}
      </div>
      {p.insights && <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-4 text-sm text-indigo-900">{p.insights}</div>}
    </div>
  );
}

// ── TECHNOLOGY ─────────────────────────────────────────────
function TechnologySection({ data }) {
  const p = data?.data || {};
  return (
    <div className="space-y-6">
      <SectionHeader title="Technology" subtitle="Digital war-room and campaign tech stack" Icon={LuCpu} color="bg-gradient-to-br from-violet-500 to-purple-600" />
      <div className="overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 font-semibold">Tool</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Usage</th>
              <th className="px-4 py-3 font-semibold">Health</th>
            </tr>
          </thead>
          <tbody>
            {p.tools?.map((t, i) => (
              <tr key={t.name} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/60"}>
                <td className="px-4 py-3 font-medium text-slate-900">{t.name}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${t.status === "Active" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                    {t.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">{t.usage}</td>
                <td className="px-4 py-3 w-32">
                  <div className="h-1.5 rounded-full bg-slate-100">
                    <div className="h-1.5 rounded-full bg-indigo-500" style={{ width: t.usage }} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── CONTENT ────────────────────────────────────────────────
function ContentSection({ data }) {
  const p = data?.data || {};
  const CONTENT_COLORS = {
    "Short video": "from-pink-500 to-rose-500",
    "Posters": "from-blue-500 to-indigo-500",
    "Speeches": "from-amber-500 to-orange-500",
  };
  return (
    <div className="space-y-6">
      <SectionHeader title="Content" subtitle="Creative and digital content pipeline" Icon={LuFileText} color="bg-gradient-to-br from-amber-500 to-orange-500" />
      <div className="grid gap-4 sm:grid-cols-3">
        {p.items?.map((item) => (
          <div key={item.type} className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${CONTENT_COLORS[item.type] || "from-slate-500 to-slate-700"} text-white shadow`}>
              <LuFileText className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <div className="text-sm font-semibold text-slate-700">{item.type}</div>
            <div className="mt-1 text-3xl font-bold text-slate-900">{item.count}</div>
            <span className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${item.status === "Published" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : item.status === "In design" ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-slate-100 text-slate-600"}`}>
              {item.status}
            </span>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-dashed border-indigo-200 bg-indigo-50 p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-indigo-800"><LuZap className="h-4 w-4" /> AI Content Generation</div>
        <p className="mt-1 text-xs text-indigo-600">100+ digital mentions per day will be auto-generated — News Articles, Blog Posts, Press Releases, Social Media Content and more.</p>
        <button className="mt-3 rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700">Coming Soon</button>
      </div>
    </div>
  );
}

// ── DISTRIBUTION ───────────────────────────────────────────
function DistributionSection({ data }) {
  const p = data?.data || {};
  return (
    <div className="space-y-6">
      <SectionHeader title="Distribution" subtitle="Ground distribution and publishing channels" Icon={LuShare2} color="bg-gradient-to-br from-emerald-500 to-teal-600" />
      <div className="space-y-3">
        {p.channels?.map((c) => (
          <div key={c.channel} className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 border border-emerald-100">
                <LuShare2 className="h-4 w-4 text-emerald-600" strokeWidth={1.75} />
              </span>
              <span className="text-sm font-semibold text-slate-800">{c.channel}</span>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{c.reach}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── ADS ────────────────────────────────────────────────────
function AdsSection({ data }) {
  const p = data?.data || {};
  const PLATFORM_COLORS = { Meta: "from-blue-600 to-indigo-600", YouTube: "from-red-500 to-rose-600", "Local cable": "from-slate-600 to-slate-800" };
  return (
    <div className="space-y-6">
      <SectionHeader title="Ads" subtitle="Paid media performance across platforms" Icon={LuMegaphone} color="bg-gradient-to-br from-rose-500 to-pink-600" />
      <div className="grid gap-4 sm:grid-cols-3">
        {p.campaigns?.map((c) => (
          <div key={c.platform} className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${PLATFORM_COLORS[c.platform] || "from-slate-500 to-slate-700"} text-white shadow`}>
              <LuMegaphone className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <div className="text-sm font-semibold text-slate-700">{c.platform}</div>
            <div className="mt-3 space-y-1.5 text-sm text-slate-600">
              <div className="flex justify-between"><span>Spend</span><span className="font-semibold text-slate-900">{c.spend}</span></div>
              <div className="flex justify-between"><span>ROAS</span><span className="font-semibold text-emerald-600">{c.roas}</span></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── OPERATION ──────────────────────────────────────────────
function OperationSection({ data }) {
  const p = data?.data || {};
  return (
    <div className="space-y-6">
      <SectionHeader title="Operation" subtitle="Field operations and rally logistics tracker" Icon={LuSettings} color="bg-gradient-to-br from-slate-600 to-slate-800" />
      <div className="space-y-4 rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
        {p.tasks?.map((t) => (
          <ProgressBar key={t.task} label={t.task} value={t.progress}
            color={t.progress >= 80 ? "bg-emerald-500" : t.progress >= 60 ? "bg-indigo-500" : "bg-amber-500"} />
        ))}
      </div>
    </div>
  );
}

// ── CONSISTENCY ────────────────────────────────────────────
function ConsistencySection({ data }) {
  const p = data?.data || {};
  const score = p.score ?? 0;
  const color = score >= 80 ? "text-emerald-600" : score >= 60 ? "text-amber-600" : "text-red-500";
  return (
    <div className="space-y-6">
      <SectionHeader title="Consistency" subtitle="Brand and message discipline score" Icon={LuShieldCheck} color="bg-gradient-to-br from-teal-500 to-emerald-600" />
      <div className="flex items-center gap-6 rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="text-center">
          <div className={`text-5xl font-bold ${color}`}>{score}</div>
          <div className="mt-1 text-xs text-slate-400">out of 100</div>
        </div>
        <div className="flex-1">
          <div className="h-3 rounded-full bg-slate-100">
            <div className={`h-3 rounded-full transition-all ${score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${score}%` }} />
          </div>
          <p className="mt-2 text-xs text-slate-500">{score >= 80 ? "Excellent brand consistency" : score >= 60 ? "Good — minor improvements needed" : "Needs improvement"}</p>
        </div>
      </div>
      <div className="space-y-2">
        {p.checks?.map((c) => (
          <div key={c.item} className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
            <span className="text-sm text-slate-700">{c.item}</span>
            {c.pass ? <LuCircleCheck className="h-5 w-5 text-emerald-500" strokeWidth={1.75} /> : <LuCircleX className="h-5 w-5 text-amber-500" strokeWidth={1.75} />}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── DEMOGRAPHY ─────────────────────────────────────────────
function DemographySection({ data }) {
  const p = data?.data || {};
  return (
    <div className="space-y-6">
      <SectionHeader title="Demography" subtitle="Voter demographic breakdown for your constituency" Icon={LuUsers} color="bg-gradient-to-br from-indigo-500 to-violet-600" />
      {p.blocks?.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {p.blocks.map((b) => <StatBox key={b.label} label={b.label} value={b.value} />)}
        </div>
      ) : null}
      {p.swingRegions?.length ? (
        <div>
          <div className="mb-2 text-sm font-semibold text-slate-600">Swing Regions</div>
          <div className="flex flex-wrap gap-2">
            {p.swingRegions.map((r) => (
              <span key={r} className="rounded-full bg-indigo-50 border border-indigo-100 px-3 py-1 text-xs font-medium text-indigo-800">{r}</span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ── DEMOGRAPHY NEWS ────────────────────────────────────────
function DemographyNewsSection({ data }) {
  const p = data?.data || {};
  return (
    <div className="space-y-6">
      <SectionHeader title="News" subtitle="Regional election news feed" Icon={LuFileText} color="bg-gradient-to-br from-blue-500 to-indigo-600" />
      {p.articles?.length ? (
        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white overflow-hidden">
          {p.articles.map((a, i) => (
            <div key={i} className="px-5 py-4">
              <div className="text-sm font-semibold text-slate-900">{a.title}</div>
              <div className="mt-1 text-xs text-slate-400">{a.date} · {a.source}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white py-12 text-center text-sm text-slate-400">No news articles available.</div>
      )}
    </div>
  );
}

// ── NEWS ANALYSIS ──────────────────────────────────────────
function NewsAnalysisSection({ data }) {
  const p = data?.data || {};
  const SENTIMENT_COLOR = { Positive: "bg-emerald-50 text-emerald-700 border-emerald-200", Negative: "bg-rose-50 text-rose-700 border-rose-200", Neutral: "bg-slate-50 text-slate-600 border-slate-200" };
  const IMPACT_ICON = { High: <LuTrendingUp className="h-4 w-4 text-emerald-500" />, Medium: <LuMinus className="h-4 w-4 text-amber-500" />, Low: <LuTrendingDown className="h-4 w-4 text-rose-500" /> };
  return (
    <div className="space-y-6">
      <SectionHeader title="News Analysis" subtitle="Narrative tracking and impact analysis" Icon={LuChartBar} color="bg-gradient-to-br from-violet-500 to-indigo-600" />
      <div className="space-y-3">
        {p.narratives?.map((n) => (
          <div key={n.topic} className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
            <span className="text-sm font-semibold text-slate-800">{n.topic}</span>
            <div className="flex items-center gap-2">
              {IMPACT_ICON[n.impact]}
              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${SENTIMENT_COLOR[n.sentiment] || ""}`}>{n.sentiment}</span>
            </div>
          </div>
        ))}
      </div>
      {p.recommendation && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{p.recommendation}</div>
      )}
    </div>
  );
}

// ── NEWS PLAN ──────────────────────────────────────────────
const NEWS_PLATFORMS = [
  { name: "Google News", posts: 10, color: "bg-blue-500" },
  { name: "Yahoo News", posts: 10, color: "bg-purple-500" },
  { name: "Bing News", posts: 10, color: "bg-teal-500" },
  { name: "NewsBreak", posts: 10, color: "bg-orange-500" },
  { name: "Medium", posts: 10, color: "bg-slate-700" },
  { name: "Substack", posts: 10, color: "bg-amber-500" },
  { name: "LinkedIn Articles", posts: 10, color: "bg-blue-700" },
  { name: "Quora Spaces", posts: 10, color: "bg-red-500" },
  { name: "Reddit", posts: 10, color: "bg-orange-600" },
  { name: "Tumblr", posts: 10, color: "bg-indigo-600" },
];
const NEWS_TODAY = [
  { title: "Candidate launches new youth employment initiative", platform: "Google News", status: "Published", time: "09:00" },
  { title: "Community development drive gains momentum", platform: "Medium", status: "Published", time: "10:30" },
  { title: "Infrastructure projects announced for constituency", platform: "NewsBreak", status: "Scheduled", time: "12:00" },
  { title: "Voter outreach program reaches 10,000 households", platform: "LinkedIn Articles", status: "Scheduled", time: "14:00" },
  { title: "Press release: Education policy framework unveiled", platform: "Yahoo News", status: "Pending", time: "16:00" },
];
const STATUS_COLOR = {
  Published: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Scheduled: "bg-blue-50 text-blue-700 border-blue-200",
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
};

function NewsPlanSection() {
  return (
    <div className="space-y-6">
      <SectionHeader title="News Plan" subtitle="Daily 100 news posts across 10 platforms — 10 posts each" Icon={LuNewspaper} color="bg-gradient-to-br from-blue-500 to-indigo-600" />
      <div className="grid gap-4 sm:grid-cols-4">
        <StatBox label="Daily Target" value="100" sub="News posts/day" color="bg-indigo-50 border-indigo-200" />
        <StatBox label="Platforms" value="10" sub="Active channels" color="bg-blue-50 border-blue-200" />
        <StatBox label="Published Today" value="38" sub="as of now" color="bg-emerald-50 border-emerald-200" />
        <StatBox label="Scheduled" value="62" sub="upcoming today" color="bg-amber-50 border-amber-200" />
      </div>
      <div>
        <div className="mb-3 text-sm font-semibold text-slate-700">Platform Breakdown — 10 posts each</div>
        <div className="grid gap-3 sm:grid-cols-2">
          {NEWS_PLATFORMS.map((p) => (
            <div key={p.name} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
              <span className={`h-2.5 w-2.5 rounded-full ${p.color}`} />
              <span className="flex-1 text-sm font-medium text-slate-800">{p.name}</span>
              <span className="text-xs font-semibold text-slate-500">{p.posts} posts/day</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="mb-3 text-sm font-semibold text-slate-700">Today's Articles (sample)</div>
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-600">Title</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Platform</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Time</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {NEWS_TODAY.map((a, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/60"}>
                  <td className="px-4 py-3 text-slate-900 font-medium max-w-xs truncate">{a.title}</td>
                  <td className="px-4 py-3 text-slate-600">{a.platform}</td>
                  <td className="px-4 py-3 text-slate-500">{a.time}</td>
                  <td className="px-4 py-3"><span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLOR[a.status]}`}>{a.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex items-start gap-3 rounded-xl border border-dashed border-blue-200 bg-blue-50 p-4">
        <LuRefreshCw className="mt-0.5 h-5 w-5 text-blue-500 shrink-0" strokeWidth={1.75} />
        <div>
          <div className="text-sm font-semibold text-blue-900">AI News Automation — Coming Soon</div>
          <div className="mt-0.5 text-xs text-blue-600">AI will auto-generate 100 unique news articles daily and publish across all 10 platforms with candidate-specific keywords to boost Google News indexing.</div>
        </div>
      </div>
    </div>
  );
}

// ── DIGITAL MENTION ────────────────────────────────────────
const MENTION_TYPES = [
  { type: "Blog Articles", count: 30, color: "bg-indigo-500", platforms: "WordPress, Blogger, Medium" },
  { type: "Q&A Mentions", count: 25, color: "bg-purple-500", platforms: "Quora, Reddit, StackExchange" },
  { type: "Forum Posts", count: 20, color: "bg-teal-500", platforms: "Reddit, niche forums" },
  { type: "Press Articles", count: 15, color: "bg-orange-500", platforms: "PRLog, free PR sites" },
  { type: "Wiki / Directory", count: 10, color: "bg-blue-500", platforms: "Local directories, Wikis" },
];

function DigitalMentionSection() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Digital Mention" subtitle="Daily 100 mentions — Blogs, QA, Forums, Press, Directories" Icon={LuLink} color="bg-gradient-to-br from-indigo-500 to-purple-600" />
      <div className="grid gap-4 sm:grid-cols-4">
        <StatBox label="Daily Target" value="100" sub="mentions/day" color="bg-indigo-50 border-indigo-200" />
        <StatBox label="Link Index" value="+2,840" sub="indexed URLs" color="bg-emerald-50 border-emerald-200" />
        <StatBox label="Published Today" value="67" sub="live mentions" color="bg-blue-50 border-blue-200" />
        <StatBox label="Pending" value="33" sub="in queue" color="bg-amber-50 border-amber-200" />
      </div>
      <div>
        <div className="mb-3 text-sm font-semibold text-slate-700">Mention Type Breakdown</div>
        <div className="space-y-3">
          {MENTION_TYPES.map((m) => (
            <div key={m.type} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold text-slate-800">{m.type}</span>
                  <span className="ml-2 text-xs text-slate-400">{m.platforms}</span>
                </div>
                <span className="text-sm font-bold text-slate-700">{m.count}/day</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100">
                <div className={`h-2 rounded-full ${m.color} transition-all`} style={{ width: `${m.count}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-700">Link Index Growth</span>
          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600"><LuTrendingUp className="h-4 w-4" /> +340 this week</span>
        </div>
        <div className="flex items-end gap-1 h-16">
          {[40, 55, 48, 70, 65, 80, 67].map((h, i) => (
            <div key={i} className="flex-1 rounded-t bg-indigo-200 hover:bg-indigo-400 transition-colors" style={{ height: `${h}%` }} />
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-slate-400">
          {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => <span key={d}>{d}</span>)}
        </div>
      </div>
      <div className="flex items-start gap-3 rounded-xl border border-dashed border-indigo-200 bg-indigo-50 p-4">
        <LuZap className="mt-0.5 h-5 w-5 text-indigo-500 shrink-0" strokeWidth={1.75} />
        <div>
          <div className="text-sm font-semibold text-indigo-900">AI Mention Automation — Coming Soon</div>
          <div className="mt-0.5 text-xs text-indigo-600">AI will generate 100 unique candidate mentions daily across blogs, Q&A, forums, and press releases — boosting Google link index and search visibility automatically.</div>
        </div>
      </div>
    </div>
  );
}

// ── SOCIAL MEDIA ───────────────────────────────────────────
const SOCIAL_PLATFORMS = [
  { name: "Instagram", Icon: LuInstagram, color: "from-pink-500 to-rose-500", bg: "bg-pink-50 border-pink-200", posts: 25, types: "Posts · Reels · Stories" },
  { name: "Facebook", Icon: LuFacebook, color: "from-blue-600 to-blue-700", bg: "bg-blue-50 border-blue-200", posts: 25, types: "Posts · Pages · Groups" },
  { name: "X (Twitter)", Icon: LuTwitter, color: "from-slate-700 to-slate-900", bg: "bg-slate-50 border-slate-200", posts: 25, types: "Tweets · Threads" },
  { name: "YouTube", Icon: LuYoutube, color: "from-red-500 to-rose-600", bg: "bg-red-50 border-red-200", posts: 25, types: "Shorts · Videos" },
];
const CONTENT_MIX = [
  { type: "Image Posts", count: 8, color: "bg-pink-500" },
  { type: "Short Videos / Reels", count: 7, color: "bg-purple-500" },
  { type: "Story Posts", count: 5, color: "bg-amber-500" },
  { type: "Long-form Videos", count: 5, color: "bg-red-500" },
];
const SCHEDULE = [
  { time: "08:00", content: "Morning quote + candidate photo", platform: "Instagram / Facebook", status: "Scheduled" },
  { time: "10:00", content: "Development work highlights reel", platform: "YouTube Shorts", status: "Scheduled" },
  { time: "12:00", content: "Poll / Q&A story", platform: "Instagram Stories", status: "Pending" },
  { time: "15:00", content: "Press coverage thread", platform: "X (Twitter)", status: "Pending" },
  { time: "18:00", content: "Evening rally video", platform: "YouTube / Facebook", status: "Pending" },
  { time: "21:00", content: "Goodnight message post", platform: "All Platforms", status: "Pending" },
];

function SocialMediaSection() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Social Media" subtitle="Daily 25 posts × 4 platforms = 100 social actions/day" Icon={LuShare2} color="bg-gradient-to-br from-pink-500 to-rose-600" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SOCIAL_PLATFORMS.map(({ name, Icon, color, bg, posts, types }) => (
          <div key={name} className={`rounded-xl border ${bg} p-4`}>
            <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-white shadow`}>
              <Icon className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <div className="text-sm font-bold text-slate-800">{name}</div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">{posts} <span className="text-sm font-normal text-slate-500">posts/day</span></div>
            <div className="mt-1 text-xs text-slate-500">{types}</div>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="mb-3 text-sm font-semibold text-slate-700">Daily Content Mix (25 posts)</div>
        <div className="space-y-3">
          {CONTENT_MIX.map((c) => (
            <div key={c.type} className="flex items-center gap-3">
              <span className="w-36 text-sm text-slate-700 shrink-0">{c.type}</span>
              <div className="flex-1 h-2 rounded-full bg-slate-100">
                <div className={`h-2 rounded-full ${c.color}`} style={{ width: `${(c.count / 25) * 100}%` }} />
              </div>
              <span className="w-6 text-right text-sm font-semibold text-slate-600">{c.count}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <LuCalendarDays className="h-4 w-4 text-slate-400" /> Today's Post Schedule
        </div>
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-600">Time</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Content</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Platform</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {SCHEDULE.map((s, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/60"}>
                  <td className="px-4 py-3 font-mono text-slate-700 font-semibold">{s.time}</td>
                  <td className="px-4 py-3 text-slate-800">{s.content}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{s.platform}</td>
                  <td className="px-4 py-3"><span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLOR[s.status]}`}>{s.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex items-start gap-3 rounded-xl border border-dashed border-pink-200 bg-pink-50 p-4">
        <LuPlay className="mt-0.5 h-5 w-5 text-pink-500 shrink-0" strokeWidth={1.75} />
        <div>
          <div className="text-sm font-semibold text-pink-900">Auto-Posting Automation — Coming Soon</div>
          <div className="mt-0.5 text-xs text-pink-600">AI will generate captions, visuals, and short videos daily and auto-schedule them on Instagram, Facebook, X, and YouTube at peak engagement hours.</div>
        </div>
      </div>
    </div>
  );
}

// ── MAIN COMPONENT ─────────────────────────────────────────
const LOCAL_SECTIONS = ["news-plan", "digital-mention", "social-media"];

const SECTION_MAP = {
  analysis: AnalyticsSection,
  technology: TechnologySection,
  content: ContentSection,
  distribution: DistributionSection,
  ads: AdsSection,
  operation: OperationSection,
  consistency: ConsistencySection,
  demography: DemographySection,
  "demography-news": DemographyNewsSection,
  "demography-news-analysis": NewsAnalysisSection,
  "news-plan": NewsPlanSection,
  "digital-mention": DigitalMentionSection,
  "social-media": SocialMediaSection,
};

export function CandidateSectionPage({ section }) {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (LOCAL_SECTIONS.includes(section)) { setLoading(false); return; }
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const d = await api(`/api/candidate/sections/${section}`, { token });
        if (!cancelled) setData(d);
      } catch (e) {
        if (!cancelled) toastFromError(e, "Failed to load section");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [token, section]);

  if (loading) return <div className="flex h-48 items-center justify-center text-sm text-slate-400 animate-pulse">Loading…</div>;

  const SectionComponent = SECTION_MAP[section];
  if (!SectionComponent) return <div className="p-6 text-sm text-slate-400">Section not found.</div>;

  return (
    <div className="p-4 sm:p-6">
      <SectionComponent data={data} />
    </div>
  );
}
