import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { LuSparkles, LuSend, LuCalendar, LuTarget, LuShare2, LuNewspaper, LuRadio, LuFileText, LuBox, LuFolder, LuVideo } from "react-icons/lu";

const CEO_TOOLS = [
  { to: "/content-tools", label: "Content Tools",     desc: "AI-powered content generation",     Icon: LuSparkles,  color: "from-violet-500 to-purple-600" },
  { to: "/distribution",  label: "Distribution",      desc: "Schedule & distribute content",      Icon: LuSend,      color: "from-blue-500 to-indigo-600" },
  { to: "/calendar",      label: "Calendar",          desc: "Content calendar & planning",        Icon: LuCalendar,  color: "from-pink-500 to-violet-500" },
  { to: "/campaign",      label: "Campaigns",         desc: "Manage marketing campaigns",         Icon: LuTarget,    color: "from-red-500 to-orange-500" },
  { to: "/social",        label: "Social Media",      desc: "Platform stats & posts",             Icon: LuShare2,    color: "from-emerald-500 to-teal-600" },
  { to: "/news",          label: "News",              desc: "Latest industry news",              Icon: LuNewspaper, color: "from-blue-500 to-indigo-500" },
  { to: "/digital-mentions", label: "AI Mentions",    desc: "Online sentiment & mentions",       Icon: LuRadio,     color: "from-indigo-500 to-violet-600" },
  { to: "/contents",      label: "Contents",          desc: "All created contents",              Icon: LuFileText,  color: "from-amber-500 to-orange-600" },
  { to: "/content-pool",  label: "Content Pool",      desc: "All generated & AI-edited videos",  Icon: LuVideo,     color: "from-purple-500 to-indigo-600" },
];

const FOUNDER_TOOLS = [
  { to: "/category-management", label: "Category Management", desc: "Manage content & prompter categories", Icon: LuFolder, color: "from-orange-500 to-amber-600" }
];

export function AppTools() {
  const { user } = useAuth();
  const location = useLocation();
  const basePath = location.pathname.startsWith("/ceo") ? "/ceo" : "/app";

  const isFounder = user?.dashboardType === "founder";
  const tools = isFounder ? FOUNDER_TOOLS : CEO_TOOLS;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex items-center gap-3 mb-6">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow">
          <LuBox className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Tools Hub</h2>
          <p className="text-sm text-slate-500">Access all your content OS tools and settings</p>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map(({ to, label, desc, Icon, color }) => (
          <Link key={to} to={`${basePath}${to}`}
            className="group flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md hover:border-slate-200 transition-all">
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-white shadow group-hover:scale-105 transition-transform`}>
              <Icon className="h-6 w-6" strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors">{label}</div>
              <div className="text-xs text-slate-400 mt-0.5">{desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
