import { useState } from "react";
import {
  LuLayoutDashboard, LuUsers, LuCalendar, LuBookOpen, LuVideo,
  LuMusic, LuHeart, LuStar, LuBell, LuTrendingUp, LuMessageCircle,
  LuGlobe, LuMic, LuImage,
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

function OverviewTab() {
  const cards = [
    { label: "Total Followers",   value: "12.4K", color: "bg-violet-500",  icon: LuUsers },
    { label: "Live Sessions",      value: "8",     color: "bg-indigo-500",  icon: LuVideo },
    { label: "Content Published",  value: "124",   color: "bg-emerald-500", icon: LuBookOpen },
    { label: "Upcoming Events",    value: "3",     color: "bg-amber-500",   icon: LuCalendar },
    { label: "Donations Received", value: "₹84K",  color: "bg-rose-500",    icon: LuHeart },
    { label: "AI Mentions",        value: "290",   color: "bg-teal-500",    icon: LuStar },
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
              { icon: LuVideo,    text: "Live satsang scheduled — Sunday 6 AM",       time: "2h ago", color: "bg-indigo-100 text-indigo-600" },
              { icon: LuBookOpen, text: "New blog — 'Power of Meditation' published",  time: "5h ago", color: "bg-violet-100 text-violet-600" },
              { icon: LuHeart,    text: "15 new donation entries received",             time: "1d ago", color: "bg-rose-100 text-rose-600" },
              { icon: LuUsers,    text: "42 new followers joined this week",            time: "2d ago", color: "bg-emerald-100 text-emerald-600" },
              { icon: LuStar,     text: "Featured in 'Top Spiritual Voices 2025'",      time: "3d ago", color: "bg-amber-100 text-amber-600" },
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
              { platform: "YouTube",   followers: "8.2K", color: "bg-red-500",   pct: 82 },
              { platform: "Instagram", followers: "3.1K", color: "bg-pink-500",  pct: 31 },
              { platform: "Facebook",  followers: "1.8K", color: "bg-blue-600",  pct: 18 },
              { platform: "Telegram",  followers: "620",  color: "bg-sky-500",   pct: 6 },
              { platform: "WhatsApp",  followers: "980",  color: "bg-green-500", pct: 10 },
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

function ContentTab() {
  const TYPES = [
    { label: "Satsang Video",     icon: LuVideo,    color: "bg-indigo-100 text-indigo-700" },
    { label: "Spiritual Blog",    icon: LuBookOpen, color: "bg-violet-100 text-violet-700" },
    { label: "Guided Meditation", icon: LuMic,      color: "bg-teal-100 text-teal-700" },
    { label: "Devotional Song",   icon: LuMusic,    color: "bg-rose-100 text-rose-700" },
    { label: "Quote / Shayari",   icon: LuStar,     color: "bg-amber-100 text-amber-700" },
    { label: "Podcast Episode",   icon: LuMic,      color: "bg-cyan-100 text-cyan-700" },
    { label: "Event Poster",      icon: LuImage,    color: "bg-orange-100 text-orange-700" },
    { label: "Live Session",      icon: LuVideo,    color: "bg-emerald-100 text-emerald-700" },
  ];
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50 p-5">
        <div className="flex items-center gap-2 mb-1">
          <LuStar className="h-5 w-5 text-indigo-600" />
          <span className="text-base font-bold text-slate-900">Spiritual Content Hub</span>
        </div>
        <p className="text-sm text-slate-600">Create, manage and distribute all your spiritual content from one place.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {TYPES.map(t => (
          <div key={t.label} className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 flex flex-col items-center gap-3 hover:border-indigo-200 hover:shadow-md transition cursor-pointer text-center">
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

function FollowersTab() {
  const followers = [
    { name: "Ramesh Sharma", location: "Delhi",    joined: "2 days ago",  platform: "YouTube" },
    { name: "Priya Verma",   location: "Mumbai",   joined: "5 days ago",  platform: "Instagram" },
    { name: "Suresh Kumar",  location: "Lucknow",  joined: "1 week ago",  platform: "Facebook" },
    { name: "Anita Gupta",   location: "Varanasi", joined: "2 weeks ago", platform: "Telegram" },
    { name: "Vikram Singh",  location: "Jaipur",   joined: "1 month ago", platform: "YouTube" },
  ];
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <span className="text-sm font-bold text-slate-900">Recent Followers</span>
        <span className="rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2.5 py-1">12,400 total</span>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-100">
          <tr>{["Name","Location","Platform","Joined"].map(h => <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">{h}</th>)}</tr>
        </thead>
        <tbody>
          {followers.map((f, i) => (
            <tr key={i} className="border-t border-slate-50 hover:bg-slate-50 transition">
              <td className="px-5 py-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">{f.name.charAt(0)}</div>
                  <span className="font-medium text-slate-800">{f.name}</span>
                </div>
              </td>
              <td className="px-5 py-3 text-slate-500">{f.location}</td>
              <td className="px-5 py-3"><span className="rounded-full bg-indigo-50 text-indigo-700 px-2.5 py-0.5 text-[10px] font-semibold">{f.platform}</span></td>
              <td className="px-5 py-3 text-slate-400 text-xs">{f.joined}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EventsTab() {
  const events = [
    { title: "Sunday Satsang",   date: "Every Sunday 6:00 AM", platform: "YouTube Live",    status: "Recurring", color: "bg-indigo-500" },
    { title: "Meditation Camp",  date: "15 Jun 2025",           platform: "Offline + Online", status: "Upcoming",  color: "bg-emerald-500" },
    { title: "Bhajan Sandhya",   date: "21 Jun 2025",           platform: "Facebook Live",   status: "Upcoming",  color: "bg-violet-500" },
    { title: "Annual Pravachan", date: "10 Jul 2025",           platform: "All Platforms",   status: "Planning",  color: "bg-amber-500" },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {events.map((e, i) => (
        <div key={i} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden hover:shadow-md transition">
          <div className={`h-1.5 w-full ${e.color}`} />
          <div className="p-5 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-sm font-bold text-slate-900">{e.title}</h4>
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${e.status==="Recurring"?"bg-indigo-100 text-indigo-700":e.status==="Upcoming"?"bg-emerald-100 text-emerald-700":"bg-amber-100 text-amber-700"}`}>{e.status}</span>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1.5"><LuCalendar className="h-3.5 w-3.5" />{e.date}</p>
            <p className="text-xs text-slate-500 flex items-center gap-1.5"><LuGlobe className="h-3.5 w-3.5" />{e.platform}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function DonationsTab() {
  const donations = [
    { name: "Ramesh Sharma", amount: "₹2,100", message: "Jai Gurudev",       date: "Today" },
    { name: "Priya Verma",   amount: "₹501",   message: "Pranam Guruji",     date: "Yesterday" },
    { name: "Suresh Kumar",  amount: "₹5,001", message: "Bless our family",  date: "2 days ago" },
    { name: "Anonymous",     amount: "₹1,100", message: "",                  date: "3 days ago" },
    { name: "Anita Gupta",   amount: "₹251",   message: "Charan sparsh",     date: "1 week ago" },
  ];
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {[["Total Received","₹84,350","bg-rose-500"],["This Month","₹12,100","bg-violet-500"],["Total Donors","248","bg-indigo-500"]].map(([l,v,c]) => (
          <div key={l} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm text-center">
            <div className="text-2xl font-bold text-slate-900">{v}</div>
            <div className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold text-white ${c}`}>{l}</div>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100"><span className="text-sm font-bold text-slate-900">Recent Donations</span></div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>{["Donor","Amount","Message","Date"].map(h=><th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">{h}</th>)}</tr>
          </thead>
          <tbody>
            {donations.map((d, i) => (
              <tr key={i} className="border-t border-slate-50 hover:bg-slate-50 transition">
                <td className="px-5 py-3 font-medium text-slate-800">{d.name}</td>
                <td className="px-5 py-3 font-bold text-emerald-600">{d.amount}</td>
                <td className="px-5 py-3 text-slate-500 italic text-xs">{d.message || "—"}</td>
                <td className="px-5 py-3 text-slate-400 text-xs">{d.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main Spiritual Dashboard ───────────────────────────────────────────────────
export function SpiritualDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  const TABS = [
    { key: "overview",   label: "Overview",   Icon: LuLayoutDashboard },
    { key: "content",    label: "Content",    Icon: LuBookOpen },
    { key: "followers",  label: "Followers",  Icon: LuUsers },
    { key: "events",     label: "Events",     Icon: LuCalendar },
    { key: "donations",  label: "Donations",  Icon: LuHeart },
    { key: "messages",   label: "Messages",   Icon: LuMessageCircle },
    { key: "analytics",  label: "Analytics",  Icon: LuTrendingUp },
    { key: "broadcasts", label: "Broadcasts", Icon: LuBell },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="rounded-2xl border border-violet-100 bg-gradient-to-r from-violet-50 via-indigo-50 to-purple-50 p-6">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-2xl shadow-lg">
            🕉️
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{user?.businessName || "Spiritual Guru Dashboard"}</h2>
            <p className="text-sm text-slate-500">Manage your spiritual community, content &amp; divine outreach</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="rounded-full bg-violet-100 text-violet-700 text-[10px] font-bold px-2.5 py-1">🌟 Spiritual Guru</span>
              <span className="rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2.5 py-1">✓ Active</span>
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
              activeTab === key ? "bg-white shadow text-violet-700 border border-slate-200" : "text-slate-500 hover:text-slate-700"
            }`}>
            <Icon className="h-3.5 w-3.5" /> {label}
          </button>
        ))}
      </div>

      {/* Panels */}
      {activeTab === "overview"   && <OverviewTab />}
      {activeTab === "content"    && <ContentTab />}
      {activeTab === "followers"  && <FollowersTab />}
      {activeTab === "events"     && <EventsTab />}
      {activeTab === "donations"  && <DonationsTab />}
      {["messages","analytics","broadcasts"].includes(activeTab) && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-20 text-center">
          <LuStar className="mx-auto mb-3 h-10 w-10 text-slate-300" strokeWidth={1.5} />
          <p className="text-sm font-semibold text-slate-500 capitalize">{activeTab} — Coming Soon</p>
        </div>
      )}
    </div>
  );
}
