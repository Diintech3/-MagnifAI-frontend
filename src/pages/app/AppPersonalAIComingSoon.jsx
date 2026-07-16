import { LuSparkles, LuBot, LuMessageSquare, LuSpeech, LuBriefcase } from "react-icons/lu";

export function AppPersonalAIComingSoon() {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex items-center gap-3 mb-6">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow">
          <LuSparkles className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Personal AI</h2>
          <p className="text-sm text-slate-500">Your dedicated thought-leadership copilot</p>
        </div>
      </div>

      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center max-w-2xl mx-auto shadow-sm">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 mb-4 animate-pulse">
          <LuBot className="h-8 w-8" />
        </span>
        <h3 className="text-lg font-bold text-slate-900">Personal AI Assistant Coming Soon</h3>
        <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
          Your personal CEO Copilot is being prepared. It will draft emails, write keynotes, schedule thoughts, and help brainstorm startup ideas with the depth of a human chief-of-staff.
        </p>

        <div className="mt-8 grid gap-4 grid-cols-1 sm:grid-cols-3 text-left">
          {[
            { title: "Speeches & Writing", desc: "Draft high-impact keynotes & articles.", Icon: LuSpeech },
            { title: "Thought Copilot", desc: "Brainstorm business and branding strategies.", Icon: LuBriefcase },
            { title: "Instant Chat", desc: "Get real-time advice and content drafts.", Icon: LuMessageSquare },
          ].map(({ title, desc, Icon }) => (
            <div key={title} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <Icon className="h-5 w-5 text-indigo-600 mb-2" />
              <div className="text-xs font-bold text-slate-800">{title}</div>
              <div className="text-[11px] text-slate-500 mt-1">{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
