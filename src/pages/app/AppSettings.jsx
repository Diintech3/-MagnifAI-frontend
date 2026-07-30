import { useEffect, useState } from "react";
import { LuSettings, LuBuilding2, LuMail, LuPhone, LuGlobe, LuMapPin, LuCircleHelp, LuInstagram, LuTwitter, LuFacebook, LuYoutube, LuCircleCheck, LuCircleAlert, LuExternalLink, LuBot, LuKey, LuEye, LuEyeOff } from "react-icons/lu";
import { useAuth } from "../../auth/AuthProvider";
import { api } from "../../lib/api";
import { toastFromError } from "../../lib/toast";

function InfoRow({ Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-50 last:border-0">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" strokeWidth={1.75} />
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</div>
        <div className="mt-0.5 text-sm text-slate-900 break-words">{value || "—"}</div>
      </div>
    </div>
  );
}

const SOCIAL_PLATFORMS = [
  { key: "instagram", label: "Instagram",   Icon: LuInstagram, color: "text-pink-600",  bg: "bg-pink-50 border-pink-100" },
  { key: "twitter",   label: "Twitter / X", Icon: LuTwitter,   color: "text-slate-800", bg: "bg-slate-50 border-slate-100" },
  { key: "facebook",  label: "Facebook",    Icon: LuFacebook,  color: "text-blue-600",  bg: "bg-blue-50 border-blue-100" },
  { key: "youtube",   label: "YouTube",     Icon: LuYoutube,   color: "text-red-600",   bg: "bg-red-50 border-red-100" },
];

const HELP_ITEMS = [
  { q: "How to add a candidate?", a: "Go to the Candidates tab → click 'Add New Candidate' → fill in details and save." },
  { q: "How to connect social media accounts?", a: "In the Social Connections section above, click 'Connect' next to the platform and follow the OAuth flow." },
  { q: "How to view news for my constituency?", a: "Go to the News tab. News is auto-filtered based on your registered city and linked candidates." },
  { q: "What are Digital Mentions?", a: "Digital Mentions tracks online references to your app's candidates across news sites, blogs, and social media." },
  { q: "How to reset password?", a: "Contact your admin or superadmin to reset the app account password." },
];

function HelpAccordion({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-slate-100 bg-white overflow-hidden shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold text-slate-800 hover:bg-slate-50 transition"
      >
        {q}
        <span className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
      </button>
      {open && (
        <div className="border-t border-slate-50 px-4 py-3 text-sm text-slate-600">{a}</div>
      )}
    </div>
  );
}

export function AppSettings() {
  const { token, user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showClientId, setShowClientId] = useState(false);
  const [showToken, setShowToken] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const d = await api("/api/app/overview", { token });
        if (!cancelled) setProfile(d);
      } catch (e) {
        if (!cancelled) toastFromError(e, "Failed to load profile");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [token]);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 text-white shadow">
          <LuSettings className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Settings &amp; Help</h2>
          <p className="text-sm text-slate-500">App profile, social connections, and support</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* App Profile */}
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3">
            <LuBuilding2 className="h-4 w-4 text-slate-500" strokeWidth={1.75} />
            <h3 className="text-sm font-bold text-slate-800">App Profile</h3>
          </div>
          {loading ? (
            <div className="px-5 py-8 text-center text-sm text-slate-400 animate-pulse">Loading…</div>
          ) : (
            <div className="px-5 py-2">
              <InfoRow Icon={LuBuilding2} label="Business Name" value={profile?.businessName || user?.businessName} />
              <InfoRow Icon={LuMail}      label="Email"         value={profile?.email || user?.email} />
              <InfoRow Icon={LuPhone}     label="Mobile"        value={profile?.mobile} />
              <InfoRow Icon={LuGlobe}     label="Website"       value={profile?.website} />
              <InfoRow Icon={LuMapPin}    label="City"          value={profile?.city} />
              <InfoRow Icon={LuBuilding2} label="Status"        value={profile?.isActive ? "Active" : "Inactive"} />
              <InfoRow Icon={LuBuilding2} label="Total Candidates" value={String(profile?.totalCandidates ?? "—")} />
              {profile?.ragClientId && (
                <div className="flex items-start gap-3 py-3 border-b border-slate-50 last:border-0">
                  <LuBot className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" strokeWidth={1.75} />
                  <div className="min-w-0 flex-1 flex justify-between items-center gap-2">
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">RAG Client ID</div>
                      <div className="mt-0.5 text-sm text-slate-900 break-words font-mono">
                        {showClientId ? profile.ragClientId : "••••••••••••••••"}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowClientId(!showClientId)}
                      className="text-slate-400 hover:text-slate-600 transition cursor-pointer p-1 rounded-md hover:bg-slate-50"
                      title={showClientId ? "Hide Client ID" : "Show Client ID"}
                    >
                      {showClientId ? <LuEyeOff className="h-4 w-4" /> : <LuEye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}
              {profile?.ragToken && (
                <div className="flex items-start gap-3 py-3 border-b border-slate-50 last:border-0">
                  <LuKey className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" strokeWidth={1.75} />
                  <div className="min-w-0 flex-1 flex justify-between items-center gap-2">
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">RAG Integration Token</div>
                      <div className="mt-0.5 text-sm text-slate-900 break-all font-mono">
                        {showToken ? profile.ragToken : "••••••••••••••••••••••••••••••••••••••••"}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="text-slate-400 hover:text-slate-600 transition cursor-pointer p-1 rounded-md hover:bg-slate-50"
                      title={showToken ? "Hide Token" : "Show Token"}
                    >
                      {showToken ? <LuEyeOff className="h-4 w-4" /> : <LuEye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Social Connections */}
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3">
            <LuGlobe className="h-4 w-4 text-slate-500" strokeWidth={1.75} />
            <h3 className="text-sm font-bold text-slate-800">Social Connections</h3>
          </div>
          <div className="divide-y divide-slate-50 px-5">
            {SOCIAL_PLATFORMS.map(({ key, label, Icon, color, bg }) => {
              const connected = profile?.socialConnections?.[key];
              return (
                <div key={key} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-lg border ${bg}`}>
                      <Icon className={`h-4 w-4 ${color}`} strokeWidth={1.75} />
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-slate-800">{label}</div>
                      {connected && (
                        <div className="text-[11px] text-slate-400">@{connected.username || "connected"}</div>
                      )}
                    </div>
                  </div>
                  {connected ? (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                      <LuCircleCheck className="h-3.5 w-3.5" strokeWidth={1.75} /> Connected
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 rounded-full bg-slate-50 border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                      <LuCircleAlert className="h-3.5 w-3.5" strokeWidth={1.75} /> Not connected
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Help & Support */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3">
          <LuCircleHelp className="h-4 w-4 text-slate-500" strokeWidth={1.75} />
          <h3 className="text-sm font-bold text-slate-800">Help &amp; FAQ</h3>
        </div>
        <div className="space-y-2 p-5">
          {HELP_ITEMS.map((item) => (
            <HelpAccordion key={item.q} q={item.q} a={item.a} />
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-5 py-4">
          <div className="text-sm text-slate-600">
            Need more help? Contact support at{" "}
            <a href="mailto:support@magnifai.in" className="font-medium text-indigo-600 hover:underline">
              support@magnifai.in
            </a>
          </div>
          <a
            href="https://magnifai.diintech.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Visit Website <LuExternalLink className="h-3.5 w-3.5" strokeWidth={1.75} />
          </a>
        </div>
      </div>
    </div>
  );
}
