import { useEffect, useState } from "react";
import { LuShare2, LuInstagram, LuTwitter, LuFacebook, LuYoutube, LuTrendingUp, LuHeart, LuMessageCircle, LuRepeat2, LuEye } from "react-icons/lu";
import { useAuth } from "../../auth/AuthProvider";
import { api } from "../../lib/api";
import { toastFromError } from "../../lib/toast";

const PLATFORMS = [
  { key: "instagram", label: "Instagram", Icon: LuInstagram, color: "bg-pink-500", light: "bg-pink-50 text-pink-700 border-pink-200" },
  { key: "twitter",   label: "Twitter / X", Icon: LuTwitter,   color: "bg-slate-800", light: "bg-slate-50 text-slate-700 border-slate-200" },
  { key: "facebook",  label: "Facebook",  Icon: LuFacebook,  color: "bg-blue-600",  light: "bg-blue-50 text-blue-700 border-blue-200" },
  { key: "youtube",   label: "YouTube",   Icon: LuYoutube,   color: "bg-red-600",   light: "bg-red-50 text-red-700 border-red-200" },
];

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

export function AppSocialMedia() {
  const { token } = useAuth();
  const [activePlatform, setActivePlatform] = useState("instagram");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setData(null);
      try {
        const d = await api(`/api/app/social/${activePlatform}`, { token });
        if (!cancelled) setData(d);
      } catch (e) {
        if (!cancelled) toastFromError(e, "Failed to load social data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [token, activePlatform]);

  const platform = PLATFORMS.find((p) => p.key === activePlatform);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-violet-600 text-white shadow">
          <LuShare2 className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Social Media</h2>
          <p className="text-sm text-slate-500">Connected platform analytics &amp; recent posts</p>
        </div>
      </div>

      {/* Platform tabs */}
      <div className="flex flex-wrap gap-2">
        {PLATFORMS.map(({ key, label, Icon, light }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActivePlatform(key)}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition ${
              activePlatform === key ? light + " shadow-sm" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
            }`}
          >
            <Icon className="h-4 w-4" strokeWidth={1.75} />
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white text-sm text-slate-400">
          <span className="animate-pulse">Loading {platform?.label} data…</span>
        </div>
      ) : !data ? (
        <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-white text-sm text-slate-400">
          <span className={`flex h-12 w-12 items-center justify-center rounded-full ${platform?.color} text-white`}>
            <platform.Icon className="h-6 w-6" strokeWidth={1.75} />
          </span>
          <p>No {platform?.label} data connected yet.</p>
          <p className="text-xs text-slate-400">Connect your account from Settings to fetch data.</p>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatPill Icon={LuTrendingUp} label="Followers" value={data.followers?.toLocaleString("en-IN")} color={platform?.color} />
            <StatPill Icon={LuHeart} label="Total Likes" value={data.totalLikes?.toLocaleString("en-IN")} color="bg-rose-500" />
            <StatPill Icon={LuMessageCircle} label="Comments" value={data.totalComments?.toLocaleString("en-IN")} color="bg-blue-500" />
            <StatPill Icon={LuEye} label="Reach" value={data.totalReach?.toLocaleString("en-IN")} color="bg-amber-500" />
          </div>

          {/* Posts */}
          {data.posts?.length ? (
            <div>
              <h3 className="mb-3 text-sm font-semibold text-slate-700">Recent Posts</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {data.posts.map((post, i) => <PostCard key={post.id ?? i} post={post} />)}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white py-10 text-center text-sm text-slate-400">
              No posts found for this period.
            </div>
          )}
        </>
      )}
    </div>
  );
}
