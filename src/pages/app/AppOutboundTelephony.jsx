import { useState } from "react";
import { LuPhoneCall, LuUsers, LuClock, LuSlidersHorizontal, LuMic, LuCheck, LuTrendingUp, LuPlay } from "react-icons/lu";

export function AppOutboundTelephony() {
  const [activeTab, setActiveTab] = useState("campaigns");

  const stats = [
    { label: "Active Campaigns", value: "3", Icon: LuTrendingUp, color: "from-blue-500 to-indigo-600" },
    { label: "Total Calls Placed", value: "1,248", Icon: LuPhoneCall, color: "from-violet-500 to-purple-600" },
    { label: "Lead Contacts", value: "482", Icon: LuUsers, color: "from-emerald-500 to-teal-600" },
    { label: "Avg Duration", value: "1m 14s", Icon: LuClock, color: "from-amber-500 to-orange-600" },
  ];

  const voiceTemplates = [
    { id: 1, name: "Intro & Welcome Campaign", voice: "Rachel (ElevenLabs)", status: "Active", lang: "Hindi-English" },
    { id: 2, name: "Product Launch Pitch", voice: "Vijay (ElevenLabs)", status: "Active", lang: "English Only" },
    { id: 3, name: "Feedback Survey", voice: "Drew (ElevenLabs)", status: "Draft", lang: "Hindi Only" },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow">
            <LuPhoneCall className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Outbound Telephony</h2>
            <p className="text-sm text-slate-500">Launch automated outbound voice assistant campaigns</p>
          </div>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors">
          <LuPlay className="h-4 w-4" /> Create Call Campaign
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, Icon, color }) => (
          <div key={label} className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-white shadow`}>
              <Icon className="h-6 w-6" strokeWidth={1.75} />
            </span>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</div>
              <div className="mt-0.5 text-2xl font-bold text-slate-900">{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("campaigns")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === "campaigns"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Active Campaigns
        </button>
        <button
          onClick={() => setActiveTab("voices")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === "voices"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Voice Profiles
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === "settings"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Settings
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "campaigns" && (
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900">Campaign History</h3>
            <span className="text-xs text-slate-400">Showing last 30 days</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Campaign Name</th>
                  <th className="py-3 px-4">Target Group</th>
                  <th className="py-3 px-4">Voice agent</th>
                  <th className="py-3 px-4">Success Rate</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-4 font-semibold text-slate-900">CEO Welcome Outreach</td>
                  <td className="py-4 px-4 text-slate-500">New Onboarding List</td>
                  <td className="py-4 px-4 text-slate-500">Rachel (ElevenLabs)</td>
                  <td className="py-4 px-4 text-slate-900 font-medium">92.4%</td>
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      <LuCheck className="h-3 w-3" /> Running
                    </span>
                  </td>
                </tr>
                <tr className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-4 font-semibold text-slate-900">Voter Awareness Polls</td>
                  <td className="py-4 px-4 text-slate-500">Voters UP Seat 3</td>
                  <td className="py-4 px-4 text-slate-500">Vijay (ElevenLabs)</td>
                  <td className="py-4 px-4 text-slate-900 font-medium">85.1%</td>
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                      Completed
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "voices" && (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {voiceTemplates.map(template => (
            <div key={template.id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-slate-200 transition-all">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded-md">{template.lang}</span>
                  <span className={`h-2.5 w-2.5 rounded-full ${template.status === "Active" ? "bg-emerald-500" : "bg-slate-300"}`} />
                </div>
                <h4 className="text-base font-bold text-slate-900 mb-1">{template.name}</h4>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-4">
                  <LuMic className="h-3.5 w-3.5" /> {template.voice}
                </div>
              </div>
              <button className="w-full flex items-center justify-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50/40 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 transition-colors">
                <LuSlidersHorizontal className="h-3.5 w-3.5" /> Tune Parameters
              </button>
            </div>
          ))}
        </div>
      )}

      {activeTab === "settings" && (
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm max-w-2xl">
          <h3 className="text-base font-bold text-slate-900 mb-4">Caller ID & Routing Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Outbound Caller ID (Vobiz Line)</label>
              <input type="text" readOnly value="+91 806 535 4041" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Max Concurrent Calls</label>
              <input type="number" readOnly value="10" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Daily Budget Limit</label>
              <input type="text" readOnly value="₹5,000.00" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
