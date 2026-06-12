import { useState } from "react";
import {
  LuLayoutDashboard, LuUsers, LuTarget, LuTrendingUp, LuHeart,
  LuGlobe, LuMic, LuShare2, LuCalendar, LuBell, LuBookOpen,
  LuMessageCircle, LuStar, LuZap, LuAward, LuImage, LuVideo,
  LuFileText,
} from "react-icons/lu";
import { useAuth } from "../../auth/AuthProvider";

function StatCard({ label, value, color, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm flex items-center gap-4">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        <div className="text-xs font-medium text-slate-500">{label}</div>
      </div>
    </div>
  );
}

// ── Overview Tab ───────────────────────────────────────────────────────────────
function OverviewTab() {
  const cards = [
    { label: "Community Members", value: "24.6K", color: "bg-emerald-500",  icon: LuUsers },
    { label: "Active Campaigns",   value: "12",    color: "bg-indigo-500",   icon: LuTarget },
    { label: "Impact Reach",       value: "1.2M",  color: "bg-violet-500",   icon: LuGlobe },
    { label: "Petitions Signed",   value: "8,400", color: "bg-amber-500",    icon: LuHeart },
    { label: "Media Mentions",     value: "340",   color: "bg-rose-500",     icon: LuStar },
    { label: "Events This Month",  value: "6",     color: "bg-teal-500",     icon: LuCalendar },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(c => <StatCard key={c.label} {...c} />)}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent Activity */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
          <div className="text-sm font-bold text-slate-900 mb-4">Recent Activity</div>
          <div className="space-y-3">
            {[
              { icon: LuTarget,  text: "Campaign 'Clean India Drive' reached 10K signatures", time: "1h ago",  color: "bg-indigo-100 text-indigo-600" },
              { icon: LuMic,     text: "TEDx Talk invitation received from Delhi chapter",    time: "3h ago",  color: "bg-rose-100 text-rose-600" },
              { icon: LuUsers,   text: "220 new community members joined this week",          time: "1d ago",  color: "bg-emerald-100 text-emerald-600" },
              { icon: LuGlobe,   text: "Featured in Times of India — Social Impact column",   time: "2d ago",  color: "bg-amber-100 text-amber-600" },
              { icon: LuHeart,   text: "Petition 'Save Local Farmers' crossed 5000 signs",   time: "3d ago",  color: "bg-violet-100 text-violet-600" },
            ].map((a, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${a.color}`}>
                  <a.icon className="h-3.5 w-3.5" />
                </span>
                <div>
                  <p className="text-sm text-slate-700">{a.text}</p>
                  <p className="text-[10px] text-slate-400">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Platform Reach */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
          <div className="text-sm font-bold text-slate-900 mb-4">Platform Reach</div>
          <div className="space-y-3">
            {[
              { platform: "LinkedIn",   followers: "9.8K",  color: "bg-blue-600",    pct: 80 },
              { platform: "Instagram",  followers: "6.2K",  color: "bg-pink-500",    pct: 62 },
              { platform: "Twitter/X",  followers: "4.1K",  color: "bg-slate-800",   pct: 41 },
              { platform: "YouTube",    followers: "2.8K",  color: "bg-red-500",     pct: 28 },
              { platform: "Facebook",   followers: "1.7K",  color: "bg-blue-500",    pct: 17 },
            ].map(p => (
              <div key={p.platform} className="flex items-center gap-3">
                <span className="w-20 text-xs font-semibold text-slate-600 shrink-0">{p.platform}</span>
                <div className="flex-1 h-2 rounded-full bg-slate-100">
                  <div className={`h-2 rounded-full ${p.color}`} style={{ width: `${p.pct}%` }} />
                </div>
                <span className="w-12 text-xs font-semibold text-slate-500 text-right shrink-0">{p.followers}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Campaigns Tab ──────────────────────────────────────────────────────────────
function CampaignsTab() {
  const campaigns = [
    { title: "Clean India Drive",        goal: "50,000 signatures", progress: 84, status: "Active",    color: "bg-emerald-500" },
    { title: "Save Local Farmers",       goal: "10,000 signatures", progress: 53, status: "Active",    color: "bg-amber-500" },
    { title: "Digital Literacy for All", goal: "1,000 volunteers",  progress: 72, status: "Active",    color: "bg-indigo-500" },
    { title: "Plant 10K Trees",          goal: "10,000 trees",      progress: 100, status: "Completed", color: "bg-teal-500" },
    { title: "Anti-Plastic Month",       goal: "5,000 pledges",     progress: 30, status: "Planning",  color: "bg-violet-500" },
  ];
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {campaigns.map((c, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden hover:shadow-md transition">
            <div className={`h-1.5 w-full ${c.color}`} />
            <div className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-sm font-bold text-slate-900">{c.title}</h4>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold shrink-0 ${
                  c.status==="Active"?"bg-emerald-100 text-emerald-700":
                  c.status==="Completed"?"bg-teal-100 text-teal-700":"bg-amber-100 text-amber-700"
                }`}>{c.status}</span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1.5"><LuTarget className="h-3.5 w-3.5" />Goal: {c.goal}</p>
              <div>
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Progress</span><span className="font-semibold text-slate-700">{c.progress}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div className={`h-2 rounded-full ${c.color} transition-all`} style={{ width: `${c.progress}%` }} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Community Tab ──────────────────────────────────────────────────────────────
function CommunityTab() {
  const members = [
    { name: "Priya Sharma",    role: "Volunteer Lead",   location: "Delhi",     joined: "1 week ago" },
    { name: "Rohit Verma",     role: "Campaign Manager", location: "Mumbai",    joined: "2 weeks ago" },
    { name: "Ananya Singh",    role: "Content Creator",  location: "Bangalore", joined: "1 month ago" },
    { name: "Suresh Patel",    role: "Volunteer",        location: "Ahmedabad", joined: "1 month ago" },
    { name: "Kavita Nair",     role: "Social Media",     location: "Pune",      joined: "2 months ago" },
  ];
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <span className="text-sm font-bold text-slate-900">Community Members</span>
        <span className="rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2.5 py-1">24,600 total</span>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-100">
          <tr>{["Name","Role","Location","Joined"].map(h => <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">{h}</th>)}</tr>
        </thead>
        <tbody>
          {members.map((m, i) => (
            <tr key={i} className="border-t border-slate-50 hover:bg-slate-50 transition">
              <td className="px-5 py-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold shrink-0">{m.name.charAt(0)}</div>
                  <span className="font-medium text-slate-800">{m.name}</span>
                </div>
              </td>
              <td className="px-5 py-3"><span className="rounded-full bg-indigo-50 text-indigo-700 px-2.5 py-0.5 text-[10px] font-semibold">{m.role}</span></td>
              <td className="px-5 py-3 text-slate-500">{m.location}</td>
              <td className="px-5 py-3 text-slate-400 text-xs">{m.joined}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Impact Tab ─────────────────────────────────────────────────────────────────
function ImpactTab() {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["Lives Impacted", "1.2M",   "bg-emerald-500"],
          ["Campaigns Won",  "18",     "bg-indigo-500"],
          ["Media Features", "340",    "bg-violet-500"],
        ].map(([l,v,c]) => (
          <div key={l} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm text-center">
            <div className="text-3xl font-black text-slate-900">{v}</div>
            <div className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold text-white ${c}`}>{l}</div>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
        <div className="text-sm font-bold text-slate-900 mb-4">Impact Areas</div>
        <div className="space-y-3">
          {[
            { area: "Environment",       count: "4.2L trees planted",     pct: 85, color: "bg-emerald-500" },
            { area: "Education",         count: "12K students supported",  pct: 72, color: "bg-blue-500" },
            { area: "Women Empowerment", count: "8K women trained",        pct: 60, color: "bg-violet-500" },
            { area: "Rural Development", count: "50 villages impacted",    pct: 45, color: "bg-amber-500" },
            { area: "Healthcare",        count: "20K free checkups",       pct: 38, color: "bg-rose-500" },
          ].map(a => (
            <div key={a.area} className="flex items-center gap-3">
              <div className="w-36 shrink-0">
                <div className="text-xs font-semibold text-slate-700">{a.area}</div>
                <div className="text-[10px] text-slate-400">{a.count}</div>
              </div>
              <div className="flex-1 h-2 rounded-full bg-slate-100">
                <div className={`h-2 rounded-full ${a.color}`} style={{ width: `${a.pct}%` }} />
              </div>
              <span className="text-xs font-semibold text-slate-500 w-8 text-right">{a.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Content Tab ───────────────────────────────────────────────────────────────
function ContentTab() {
  const TYPES = [
    { label: "Campaign Post",    icon: LuTarget,   color: "bg-indigo-100 text-indigo-700" },
    { label: "Awareness Video",  icon: LuVideo,    color: "bg-rose-100 text-rose-700" },
    { label: "Blog / Article",   icon: LuFileText, color: "bg-violet-100 text-violet-700" },
    { label: "Petition",         icon: LuBookOpen, color: "bg-amber-100 text-amber-700" },
    { label: "Infographic",      icon: LuImage,    color: "bg-teal-100 text-teal-700" },
    { label: "Podcast",          icon: LuMic,      color: "bg-cyan-100 text-cyan-700" },
    { label: "Quote Card",       icon: LuStar,     color: "bg-orange-100 text-orange-700" },
    { label: "Event Invite",     icon: LuCalendar, color: "bg-emerald-100 text-emerald-700" },
  ];
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 p-5">
        <div className="flex items-center gap-2 mb-1">
          <LuBookOpen className="h-5 w-5 text-emerald-600" />
          <span className="text-base font-bold text-slate-900">Change Maker Content Hub</span>
        </div>
        <p className="text-sm text-slate-600">Create, manage and distribute all your campaign content from one place.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {TYPES.map(t => (
          <div key={t.label} className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 flex flex-col items-center gap-3 hover:border-emerald-200 hover:shadow-md transition cursor-pointer text-center">
            <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${t.color}`}>
              <t.icon className="h-6 w-6" />
            </span>
            <span className="text-sm font-semibold text-slate-800">{t.label}</span>
            <span className="text-[10px] text-slate-400 rounded-full bg-slate-100 px-2 py-0.5">Coming Soon</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Events Tab ─────────────────────────────────────────────────────────────────
function EventsTab() {
  const events = [
    { title: "Clean India Rally",       date: "20 Jun 2025",          platform: "Delhi, Offline",   status: "Upcoming",  color: "bg-emerald-500" },
    { title: "Digital Literacy Camp",   date: "25 Jun 2025",          platform: "Online + Offline", status: "Upcoming",  color: "bg-indigo-500" },
    { title: "Farmer Solidarity March", date: "Every Saturday 9 AM",  platform: "Multiple Cities",  status: "Recurring", color: "bg-amber-500" },
    { title: "Youth Leadership Summit", date: "10 Jul 2025",          platform: "Mumbai, Offline",  status: "Planning",  color: "bg-violet-500" },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {events.map((e, i) => (
        <div key={i} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden hover:shadow-md transition">
          <div className={`h-1.5 w-full ${e.color}`} />
          <div className="p-5 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-sm font-bold text-slate-900">{e.title}</h4>
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold shrink-0 ${
                e.status==="Recurring"?"bg-indigo-100 text-indigo-700":
                e.status==="Upcoming"?"bg-emerald-100 text-emerald-700":"bg-amber-100 text-amber-700"
              }`}>{e.status}</span>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1.5"><LuCalendar className="h-3.5 w-3.5" />{e.date}</p>
            <p className="text-xs text-slate-500 flex items-center gap-1.5"><LuGlobe className="h-3.5 w-3.5" />{e.platform}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Analytics Tab ──────────────────────────────────────────────────────────────
function AnalyticsTab() {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Total Reach",       "1.2M",  "bg-emerald-500", LuGlobe],
          ["Engagement Rate",   "4.8%",  "bg-indigo-500",  LuTrendingUp],
          ["Shares",            "18.4K", "bg-violet-500",  LuShare2],
          ["Comments",          "6.2K",  "bg-amber-500",   LuMessageCircle],
        ].map(([l, v, c, Icon]) => (
          <div key={l} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm flex items-center gap-4">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${c}`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{v}</div>
              <div className="text-xs font-medium text-slate-500">{l}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
          <div className="text-sm font-bold text-slate-900 mb-4">Campaign Performance</div>
          <div className="space-y-3">
            {[
              { name: "Clean India Drive",        reach: "480K", pct: 84, color: "bg-emerald-500" },
              { name: "Save Local Farmers",       reach: "210K", pct: 53, color: "bg-amber-500" },
              { name: "Digital Literacy for All", reach: "310K", pct: 72, color: "bg-indigo-500" },
              { name: "Anti-Plastic Month",        reach: "90K",  pct: 30, color: "bg-violet-500" },
            ].map(c => (
              <div key={c.name} className="flex items-center gap-3">
                <div className="w-40 shrink-0">
                  <div className="text-xs font-semibold text-slate-700 truncate">{c.name}</div>
                  <div className="text-[10px] text-slate-400">{c.reach} reach</div>
                </div>
                <div className="flex-1 h-2 rounded-full bg-slate-100">
                  <div className={`h-2 rounded-full ${c.color}`} style={{ width: `${c.pct}%` }} />
                </div>
                <span className="text-xs font-semibold text-slate-500 w-8 text-right">{c.pct}%</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
          <div className="text-sm font-bold text-slate-900 mb-4">Audience Demographics</div>
          <div className="space-y-3">
            {[
              { label: "18–25 yrs", pct: 38, color: "bg-indigo-500" },
              { label: "26–35 yrs", pct: 32, color: "bg-emerald-500" },
              { label: "36–45 yrs", pct: 18, color: "bg-amber-500" },
              { label: "46+ yrs",   pct: 12, color: "bg-violet-500" },
            ].map(a => (
              <div key={a.label} className="flex items-center gap-3">
                <span className="w-20 text-xs font-semibold text-slate-600 shrink-0">{a.label}</span>
                <div className="flex-1 h-2 rounded-full bg-slate-100">
                  <div className={`h-2 rounded-full ${a.color}`} style={{ width: `${a.pct}%` }} />
                </div>
                <span className="text-xs font-semibold text-slate-500 w-8 text-right">{a.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Broadcasts Tab ─────────────────────────────────────────────────────────────
function BroadcastsTab() {
  const broadcasts = [
    { title: "Clean India Drive — Final Push!",   channel: "WhatsApp",  sent: "12,400", opened: "8,200",  date: "Today 10:00 AM",   status: "Sent",      color: "bg-green-500" },
    { title: "Join our Farmer March this Saturday", channel: "Telegram",  sent: "6,800",  opened: "5,100",  date: "Yesterday 6 PM",   status: "Sent",      color: "bg-sky-500" },
    { title: "Youth Summit — Register Now",         channel: "Email",     sent: "3,200",  opened: "1,840",  date: "20 Jun 2025",      status: "Scheduled", color: "bg-violet-500" },
    { title: "Impact Report June 2025",             channel: "Instagram", sent: "—",      opened: "—",      date: "25 Jun 2025",      status: "Draft",     color: "bg-slate-400" },
  ];
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {[["Total Sent","42.6K","bg-emerald-500"],["Open Rate","67%","bg-indigo-500"],["Broadcasts","18","bg-violet-500"]].map(([l,v,c]) => (
          <div key={l} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm text-center">
            <div className="text-2xl font-bold text-slate-900">{v}</div>
            <div className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold text-white ${c}`}>{l}</div>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100"><span className="text-sm font-bold text-slate-900">Recent Broadcasts</span></div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>{["Title","Channel","Sent","Opened","Date","Status"].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">{h}</th>)}</tr>
          </thead>
          <tbody>
            {broadcasts.map((b, i) => (
              <tr key={i} className="border-t border-slate-50 hover:bg-slate-50 transition">
                <td className="px-4 py-3 font-medium text-slate-800 max-w-[180px] truncate">{b.title}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-slate-100 text-slate-600 px-2.5 py-0.5 text-[10px] font-semibold">{b.channel}</span>
                </td>
                <td className="px-4 py-3 text-slate-600">{b.sent}</td>
                <td className="px-4 py-3 text-slate-600">{b.opened}</td>
                <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{b.date}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    b.status==="Sent"?"bg-emerald-100 text-emerald-700":
                    b.status==="Scheduled"?"bg-indigo-100 text-indigo-700":"bg-slate-100 text-slate-500"
                  }`}>{b.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main Change Maker Dashboard ────────────────────────────────────────────────
export function ChangeMakerDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  const TABS = [
    { key: "overview",   label: "Overview",   Icon: LuLayoutDashboard },
    { key: "campaigns",  label: "Campaigns",  Icon: LuTarget },
    { key: "community",  label: "Community",  Icon: LuUsers },
    { key: "impact",     label: "Impact",     Icon: LuAward },
    { key: "content",    label: "Content",    Icon: LuBookOpen },
    { key: "events",     label: "Events",     Icon: LuCalendar },
    { key: "analytics",  label: "Analytics",  Icon: LuTrendingUp },
    { key: "broadcasts", label: "Broadcasts", Icon: LuBell },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 p-6">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-2xl shadow-lg">
            ✊
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{user?.businessName || "Change Maker Dashboard"}</h2>
            <p className="text-sm text-slate-500">Drive campaigns, build community & measure your social impact</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2.5 py-1">🌱 Change Maker</span>
              <span className="rounded-full bg-teal-100 text-teal-700 text-[10px] font-bold px-2.5 py-1">✓ Active</span>
              {user?.mobile && <span className="rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold px-2.5 py-1">{user.mobile}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
        {TABS.map(({ key, label, Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold whitespace-nowrap transition ${
              activeTab === key ? "bg-white shadow text-emerald-700 border border-slate-200" : "text-slate-500 hover:text-slate-700"
            }`}>
            <Icon className="h-3.5 w-3.5" /> {label}
          </button>
        ))}
      </div>

      {/* Panels */}
      {activeTab === "overview"   && <OverviewTab />}
      {activeTab === "campaigns"  && <CampaignsTab />}
      {activeTab === "community"  && <CommunityTab />}
      {activeTab === "impact"     && <ImpactTab />}
      {activeTab === "content"    && <ContentTab />}
      {activeTab === "events"      && <EventsTab />}
      {activeTab === "analytics"   && <AnalyticsTab />}
      {activeTab === "broadcasts"  && <BroadcastsTab />}
    </div>
  );
}
