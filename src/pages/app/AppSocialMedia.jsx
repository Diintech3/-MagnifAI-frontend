import { useEffect, useState } from "react";
import {
  LuShare2, LuInstagram, LuTwitter, LuFacebook, LuYoutube,
  LuTrendingUp, LuHeart, LuMessageCircle, LuEye, LuRepeat2,
  LuLink, LuUnlink, LuCheck, LuPencil,
} from "react-icons/lu";
import { useAuth } from "../../auth/AuthProvider";
import { api } from "../../lib/api";
import { toastFromError, toastSuccess } from "../../lib/toast";

const PLATFORMS = [
  { key: "instagram", label: "Instagram", Icon: LuInstagram, color: "bg-pink-500",   light: "bg-pink-50 text-pink-700 border-pink-200" },
  { key: "twitter",   label: "Twitter / X", Icon: LuTwitter, color: "bg-slate-800", light: "bg-slate-50 text-slate-700 border-slate-200" },
  { key: "facebook",  label: "Facebook",  Icon: LuFacebook,  color: "bg-blue-600",  light: "bg-blue-50 text-blue-700 border-blue-200" },
  { key: "youtube",   label: "YouTube",   Icon: LuYoutube,   color: "bg-red-600",   light: "bg-red-50 text-red-700 border-red-200" },
];

// Fields for each platform connect form
const PLATFORM_FIELDS = {
  instagram: [
    { key: "username", label: "Instagram Username", placeholder: "@yourhandle" },
  ],
  twitter: [
    { key: "username", label: "Username", placeholder: "@yourhandle" },
  ],
  facebook: [
    { key: "pageId",   label: "Page ID",   placeholder: "123456789" },
    { key: "pageName", label: "Page Name", placeholder: "Your Page Name" },
  ],
  youtube: [
    { key: "channelId",   label: "Channel ID",   placeholder: "UCxxxxxxxxxxxxxxxx" },
    { key: "channelName", label: "Channel Name", placeholder: "Your Channel Name" },
  ],
};

function StatPill({ Icon, label, value, color }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${color} text-white`}>
        <Icon className="h-4 w-4" strokeWidth={1.75} />
      </span>
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</div>
        <div className="text-lg font-bold text-slate-900">{value ?? "—"}</div>
      </div>
    </div>
  );
}

function PostCard({ post }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <p className="flex-1 text-sm text-slate-700 line-clamp-3">{post.caption || post.text || "—"}</p>
        {post.thumbnailUrl && (
          <img src={post.thumbnailUrl} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-slate-50 pt-3 text-xs text-slate-500">
        <span className="flex items-center gap-1"><LuHeart className="h-3.5 w-3.5 text-rose-400" />{post.likes ?? 0}</span>
        <span className="flex items-center gap-1"><LuMessageCircle className="h-3.5 w-3.5 text-blue-400" />{post.comments ?? 0}</span>
        <span className="flex items-center gap-1"><LuRepeat2 className="h-3.5 w-3.5 text-emerald-400" />{post.shares ?? 0}</span>
        <span className="flex items-center gap-1"><LuEye className="h-3.5 w-3.5 text-amber-400" />{post.reach ?? 0}</span>
        <span className="ml-auto">{post.date ? new Date(post.date).toLocaleDateString("en-IN") : ""}</span>
      </div>
    </div>
  );
}

// ── Connect Form ──────────────────────────────────────────────────────────────
function ConnectForm({ platform, existing, onSaved, onCancel, token }) {
  const fields = PLATFORM_FIELDS[platform.key] || [];
  const [form, setForm] = useState(() => {
    const init = {};
    fields.forEach((f) => { init[f.key] = existing?.[f.key] || ""; });
    return init;
  });
  const [saving, setSaving] = useState(false);
  const [show, setShow] = useState({});

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api(`/api/app/social/${platform.key}/connect`, { method: "POST", token, body: form });
      toastSuccess(`${platform.label} connected!`);
      onSaved();
    } catch (err) { toastFromError(err, "Failed to save"); }
    finally { setSaving(false); }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
      <div className="flex items-center gap-3 mb-5">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${platform.color} text-white shadow`}>
          <platform.Icon className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <div>
          <h3 className="text-base font-bold text-slate-900">Connect {platform.label}</h3>
          <p className="text-xs text-slate-500">Enter your {platform.label} credentials to connect</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="mb-1 block text-sm font-medium text-slate-700">{f.label}</label>
              <div className="relative">
                <input
                  type={f.type === "password" && !show[f.key] ? "password" : "text"}
                  value={form[f.key]}
                  onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                {f.type === "password" && (
                  <button type="button" tabIndex={-1}
                    onClick={() => setShow((s) => ({ ...s, [f.key]: !s[f.key] }))}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs">
                    {show[f.key] ? "Hide" : "Show"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <button type="button" onClick={onCancel}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className={`flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold text-white disabled:opacity-60 ${platform.color} hover:opacity-90`}>
            <LuCheck className="h-4 w-4" />
            {saving ? "Saving…" : "Save & Connect"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Connected Card ────────────────────────────────────────────────────────────
function ConnectedCard({ platform, credentials, onEdit, onDisconnect }) {
  const displayName = credentials.username || credentials.pageName || credentials.channelName || "Connected";
  return (
    <div className={`flex items-center justify-between rounded-2xl border p-4 ${platform.light}`}>
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${platform.color} text-white shadow`}>
          <platform.Icon className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold">{platform.label}</span>
            <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
              <LuCheck className="h-3 w-3" /> Connected
            </span>
          </div>
          <p className="text-xs opacity-70">{displayName}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button type="button" onClick={onEdit}
          className="flex items-center gap-1.5 rounded-lg border border-current px-3 py-1.5 text-xs font-semibold opacity-80 hover:opacity-100 transition">
          <LuPencil className="h-3.5 w-3.5" /> Edit
        </button>
        <button type="button" onClick={onDisconnect}
          className="flex items-center gap-1.5 rounded-lg bg-white/60 border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition">
          <LuUnlink className="h-3.5 w-3.5" /> Disconnect
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function AppSocialMedia() {
  const { token } = useAuth();
  const [activePlatform, setActivePlatform] = useState("instagram");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const platform = PLATFORMS.find((p) => p.key === activePlatform);

  async function load() {
    setLoading(true);
    setData(null);
    try {
      const d = await api(`/api/app/social/${activePlatform}`, { token });
      setData(d);
    } catch (e) {
      toastFromError(e, "Failed to load social data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setShowForm(false);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePlatform]);

  async function onDisconnect() {
    if (!window.confirm(`Disconnect ${platform.label}?`)) return;
    try {
      await api(`/api/app/social/${activePlatform}/connect`, { method: "DELETE", token });
      toastSuccess(`${platform.label} disconnected`);
      load();
    } catch (e) { toastFromError(e, "Failed to disconnect"); }
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-violet-600 text-white shadow">
          <LuShare2 className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Social Media</h2>
          <p className="text-sm text-slate-500">Connect your social accounts and view analytics</p>
        </div>
      </div>

      {/* Platform tabs */}
      <div className="flex flex-wrap gap-2">
        {PLATFORMS.map(({ key, label, Icon, light }) => (
          <button key={key} type="button" onClick={() => setActivePlatform(key)}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition ${
              activePlatform === key ? light + " shadow-sm" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
            }`}>
            <Icon className="h-4 w-4" strokeWidth={1.75} />
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white text-sm text-slate-400">
          <span className="animate-pulse">Loading {platform?.label} data…</span>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Connected status or connect prompt */}
          {data?.isConnected && !showForm ? (
            <ConnectedCard
              platform={platform}
              credentials={data.credentials}
              onEdit={() => setShowForm(true)}
              onDisconnect={onDisconnect}
            />
          ) : showForm ? (
            <ConnectForm
              platform={platform}
              existing={data?.credentials}
              token={token}
              onSaved={() => { setShowForm(false); load(); }}
              onCancel={() => setShowForm(false)}
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
              <span className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${platform?.color} text-white shadow`}>
                <platform.Icon className="h-7 w-7" strokeWidth={1.5} />
              </span>
              <h3 className="text-base font-bold text-slate-800 mb-1">{platform?.label} Not Connected</h3>
              <p className="text-sm text-slate-500 mb-5">Connect your {platform?.label} account to view analytics and manage posts.</p>
              <button type="button" onClick={() => setShowForm(true)}
                className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm ${platform?.color} hover:opacity-90 transition`}>
                <LuLink className="h-4 w-4" /> Connect {platform?.label}
              </button>
            </div>
          )}

          {/* Stats — shown when connected and has data */}
          {data?.isConnected && !showForm && (
            <>
              {data.profileUrl && data.followers == null ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-white py-8 text-center">
                  <p className="text-sm text-slate-500 mb-4">This is a personal account. Live stats are not available.</p>
                  <a href={data.profileUrl} target="_blank" rel="noreferrer"
                    className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white ${platform?.color} hover:opacity-90 transition`}>
                    <LuLink className="h-4 w-4" /> View on Instagram
                  </a>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <StatPill Icon={LuTrendingUp} label="Followers"   value={data.followers?.toLocaleString("en-IN")}     color={platform?.color} />
                    <StatPill Icon={LuHeart}      label="Total Likes" value={data.totalLikes?.toLocaleString("en-IN")}    color="bg-rose-500" />
                    <StatPill Icon={LuMessageCircle} label="Comments" value={data.totalComments?.toLocaleString("en-IN")} color="bg-blue-500" />
                    <StatPill Icon={LuEye}        label="Reach"       value={data.totalReach?.toLocaleString("en-IN")}    color="bg-amber-500" />
                  </div>
                  {data.posts?.length > 0 ? (
                    <div>
                      <h3 className="mb-3 text-sm font-semibold text-slate-700">Recent Posts</h3>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {data.posts.map((post, i) => <PostCard key={post.id ?? i} post={post} />)}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-white py-8 text-center text-sm text-slate-400">
                      No posts found on this account.
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
