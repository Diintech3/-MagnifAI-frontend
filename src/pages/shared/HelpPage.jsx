import { useState } from "react";
import {
  LuChevronDown, LuMail, LuMessageCircle, LuBook,
  LuVideo, LuCircleCheck, LuSearch,
} from "react-icons/lu";

const FAQS = [
  {
    q: "How do I update my profile information?",
    a: "Go to Settings → Account section or click 'Edit Profile' on the Overview page to update your name, mobile, website, city, and address.",
  },
  {
    q: "How does the Social Sensing score work?",
    a: "Social Sensing aggregates mentions, engagement, and sentiment data from social media and news platforms to generate a popularity score. More digital mentions = higher score.",
  },
  {
    q: "What is Digital Mention and why does it matter?",
    a: "Digital Mentions are online references to your name across blogs, Q&A sites, forums, and press releases. More indexed mentions improve your Google search visibility and link index count.",
  },
  {
    q: "How are the daily 100 news posts published?",
    a: "Once the AI automation is live, the system will auto-generate 100 unique articles per day and distribute them across 10 news platforms using platform APIs.",
  },
  {
    q: "Can I connect my own social media accounts?",
    a: "Social media account linking is coming soon. Once enabled, you can connect Instagram, Facebook, X, and YouTube for direct auto-posting.",
  },
  {
    q: "Who can see my dashboard data?",
    a: "Only you and your assigned admin can view your dashboard data. All data is role-protected and isolated per portal login.",
  },
  {
    q: "How do I contact support?",
    a: "Use the contact form below or email us directly at support@magnifai.in. We typically respond within 24 hours.",
  },
  {
    q: "What does 'Coming Soon' mean on automation features?",
    a: "These features are actively being built. Coming Soon means the planning and UI is ready — backend automation will be activated once integration is complete.",
  },
];

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left gap-4"
      >
        <span className="text-sm font-medium text-slate-800">{q}</span>
        <LuChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-slate-500 leading-relaxed">{a}</div>
      )}
    </div>
  );
}

export function HelpPage() {
  const [query, setQuery] = useState("");
  const [msgSent, setMsgSent] = useState(false);
  const [form, setForm] = useState({ subject: "", message: "" });

  const filtered = query.trim()
    ? FAQS.filter((f) => f.q.toLowerCase().includes(query.toLowerCase()) || f.a.toLowerCase().includes(query.toLowerCase()))
    : FAQS;

  function handleSend(e) {
    e.preventDefault();
    setMsgSent(true);
    setForm({ subject: "", message: "" });
    setTimeout(() => setMsgSent(false), 3000);
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-2xl">

      {/* Quick Links */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { Icon: LuBook, label: "Documentation", sub: "Guides & tutorials", color: "text-indigo-600 bg-indigo-50 border-indigo-200" },
          { Icon: LuVideo, label: "Video Tutorials", sub: "Watch how-to videos", color: "text-rose-600 bg-rose-50 border-rose-200" },
          { Icon: LuMessageCircle, label: "Live Chat", sub: "Chat with support", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
        ].map(({ Icon, label, sub, color }) => (
          <button key={label} type="button" className="flex items-center gap-3 rounded-xl border bg-white p-4 shadow-sm text-left hover:shadow-md transition">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${color}`}>
              <Icon className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <div>
              <div className="text-sm font-semibold text-slate-800">{label}</div>
              <div className="text-xs text-slate-400">{sub}</div>
            </div>
          </button>
        ))}
      </div>

      {/* FAQ */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-3.5 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-slate-800">Frequently Asked Questions</h3>
          <div className="relative">
            <LuSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search FAQs…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 pl-7 pr-3 py-1.5 text-xs text-slate-700 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 w-40"
            />
          </div>
        </div>
        {filtered.length ? (
          filtered.map((f) => <FaqItem key={f.q} q={f.q} a={f.a} />)
        ) : (
          <div className="py-10 text-center text-sm text-slate-400">No results found for "{query}"</div>
        )}
      </div>

      {/* Contact Support */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-3.5">
          <h3 className="text-sm font-semibold text-slate-800">Contact Support</h3>
        </div>
        <form onSubmit={handleSend} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Subject</label>
            <input
              type="text"
              required
              placeholder="What do you need help with?"
              value={form.subject}
              onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Message</label>
            <textarea
              required
              rows={4}
              placeholder="Describe your issue or question in detail…"
              value={form.message}
              onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 resize-none"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition"
            >
              <LuMail className="h-4 w-4" /> Send Message
            </button>
            {msgSent && (
              <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
                <LuCircleCheck className="h-4 w-4" /> Message sent!
              </span>
            )}
          </div>
        </form>
        <div className="border-t border-slate-100 bg-slate-50 px-5 py-3 text-xs text-slate-400">
          Or email us directly at <span className="font-medium text-slate-600">support@magnifai.in</span> · Typical response time: 24 hours
        </div>
      </div>

    </div>
  );
}
