import { useEffect, useState, useCallback } from "react";
import {
  LuRefreshCw, LuTrendingUp, LuStar, LuGlobe, LuUsers,
  LuInstagram, LuFacebook, LuYoutube, LuHeart, LuMessageCircle,
  LuEye, LuLink, LuUnlink,
  LuArrowLeft, LuExternalLink, LuTwitter,
  LuUserPlus, LuSearch, LuTrash2, LuPlus, LuCheck
} from "react-icons/lu";
import { useAuth } from "../../auth/AuthProvider";
import { api } from "../../lib/api";
import { toastFromError, toastSuccess } from "../../lib/toast";

const PLATFORMS = [
  { key: "instagram", label: "Instagram", Icon: LuInstagram, color: "bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500", textCol: "text-pink-600", light: "bg-pink-50 text-pink-700 border-pink-200" },
  { key: "facebook",  label: "Facebook",  Icon: LuFacebook,  color: "bg-blue-600", textCol: "text-blue-600", light: "bg-blue-50 text-blue-700 border-blue-200" },
  { key: "youtube",   label: "YouTube",   Icon: LuYoutube,   color: "bg-red-600", textCol: "text-red-600", light: "bg-red-50 text-red-700 border-red-200" },
  { key: "twitter",   label: "Twitter (X)", Icon: LuTwitter,   color: "bg-slate-900", textCol: "text-slate-900", light: "bg-slate-50 text-slate-800 border-slate-200" },
];

const PLATFORM_FIELDS = {
  instagram: [{ key: "username", label: "Instagram Username", placeholder: "@yourhandle" }],
  facebook: [
    { key: "pageUrl",   label: "Facebook Page URL",   placeholder: "https://www.facebook.com/yourpage-123456" }
  ],
  youtube: [
    { key: "channelId",   label: "YouTube Channel URL / Handle",   placeholder: "https://www.youtube.com/@channelName" }
  ],
  twitter: [
    { key: "username",   label: "Twitter (X) Username / Profile URL",   placeholder: "https://x.com/yourhandle or @yourhandle" }
  ],
};

function ScoreBar({ label, value, color = "bg-indigo-500", icon }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="shrink-0 text-slate-500">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-slate-600">{label}</span>
          <span className="text-sm font-bold text-slate-900">{value}/100</span>
        </div>
        <div className="h-2 rounded-full bg-slate-100">
          <div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${value}%` }} />
        </div>
      </div>
    </div>
  );
}

export function AppPopularityIndex() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [ceos, setCeos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Social media state variables
  const [activeTab, setActiveTab] = useState("social_media"); // "social_media" / "campaign"
  const [activePlatform, setActivePlatform] = useState("instagram");
  const [socialData, setSocialData] = useState(null);
  const [socialLoading, setSocialLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formState, setFormState] = useState({});
  const [savingPlatform, setSavingPlatform] = useState(false);

  const [timeRange, setTimeRange] = useState("7 Days");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // People section state variables
  const [peopleTab, setPeopleTab] = useState("new"); // "new" / "contacts" / "groups"
  const [contacts, setContacts] = useState([]);
  const [newlyJoined, setNewlyJoined] = useState([]);
  const [groups, setGroups] = useState([]);
  const [peopleSearch, setPeopleSearch] = useState("");
  const [selectedContactIds, setSelectedContactIds] = useState([]);
  
  const [showAddContactForm, setShowAddContactForm] = useState(false);
  const [addContactName, setAddContactName] = useState("");
  const [addContactPhone, setAddContactPhone] = useState("");
  const [addContactEmail, setAddContactEmail] = useState("");
  
  const [showCreateGroupForm, setShowCreateGroupForm] = useState(false);
  const [createGroupName, setCreateGroupName] = useState("");
  const [createGroupColor, setCreateGroupColor] = useState("#FFD54F");
  
  const [peopleLoading, setPeopleLoading] = useState(false);

  const loadPeople = useCallback(async () => {
    setPeopleLoading(true);
    try {
      const [contactsData, newMembersData, groupsData] = await Promise.all([
        api(`/api/app/people/contacts?search=${encodeURIComponent(peopleSearch)}`, { token }),
        api("/api/app/people/new", { token }),
        api("/api/app/people/groups", { token })
      ]);
      setContacts(contactsData || []);
      setNewlyJoined(newMembersData || []);
      setGroups(groupsData || []);
    } catch (e) {
      console.error("Failed to load People data:", e.message);
    } finally {
      setPeopleLoading(false);
    }
  }, [peopleSearch, token]);

  const onAddContact = async (e) => {
    e.preventDefault();
    if (!addContactName || !addContactPhone) return;
    try {
      await api("/api/app/people/contacts", {
        method: "POST",
        token,
        body: { name: addContactName, phone: addContactPhone, email: addContactEmail }
      });
      toastSuccess("Contact added successfully!");
      setShowAddContactForm(false);
      setAddContactName("");
      setAddContactPhone("");
      setAddContactEmail("");
      loadPeople();
    } catch (err) {
      toastFromError(err, "Failed to add contact");
    }
  };

  const onSyncContacts = async () => {
    // Generate dummy sync data to show it working
    const mockContacts = [
      { name: "Rahul Sharma", phone: "+91 98765 43210", email: "rahul@example.com" },
      { name: "Priya Patel", phone: "+91 91234 56789", email: "priya@example.com" },
      { name: "Sanya Malhotra", phone: "+91 95432 10987", email: "sanya@example.com" },
      { name: "Vikram Malhotra", phone: "+91 98989 89898" }
    ];
    try {
      const res = await api("/api/app/people/contacts/sync", {
        method: "POST",
        token,
        body: { contacts: mockContacts }
      });
      toastSuccess(`Sync complete! Added: ${res.addedCount}, Updated: ${res.updatedCount}`);
      loadPeople();
    } catch (err) {
      toastFromError(err, "Failed to sync contacts");
    }
  };

  const onCreateGroup = async (e) => {
    e.preventDefault();
    if (!createGroupName) return;
    try {
      await api("/api/app/people/groups", {
        method: "POST",
        token,
        body: {
          name: createGroupName,
          colorHex: createGroupColor,
          memberIds: selectedContactIds
        }
      });
      toastSuccess("Group created successfully!");
      setShowCreateGroupForm(false);
      setCreateGroupName("");
      setSelectedContactIds([]);
      loadPeople();
    } catch (err) {
      toastFromError(err, "Failed to create group");
    }
  };

  const onDeleteGroup = async (groupId) => {
    if (!window.confirm("Are you sure you want to delete this group?")) return;
    try {
      await api(`/api/app/people/groups/${groupId}`, { method: "DELETE", token });
      toastSuccess("Group deleted");
      loadPeople();
    } catch (err) {
      toastFromError(err, "Failed to delete group");
    }
  };

  const onDeleteContact = async (contactId) => {
    if (!window.confirm("Are you sure you want to delete this contact?")) return;
    try {
      await api(`/api/app/people/contacts/${contactId}`, { method: "DELETE", token });
      toastSuccess("Contact deleted");
      loadPeople();
    } catch (err) {
      toastFromError(err, "Failed to delete contact");
    }
  };


  const formatNumber = (val) => {
    if (val === null || val === undefined) return "0";
    const num = Number(val);
    if (isNaN(num)) return "0";
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "k";
    return num.toString();
  };

  const getMetricGrowth = (metricName) => {
    const key = metricName === "reach" ? "reach" : metricName;
    return socialData?.growth?.[key] || "+0.0%";
  };

  const getSubtext = () => {
    if (timeRange === "Today") return "vs yesterday";
    if (timeRange === "Yesterday") return "vs day before";
    if (timeRange === "7 Days") return "vs last 7 days";
    if (timeRange === "Date Range") return "for selected range";
    return "vs last 7 days";
  };

  const filteredPosts = socialData?.posts || [];

  const metrics = socialData?.metrics || { totalLikes: 0, totalComments: 0, totalReach: 0 };

  const chartData = socialData?.chartData || [];

  // Load CEO rankings and score index
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, ceosData] = await Promise.all([
        api("/api/app/content/stats/overview", { token }),
        api("/api/app/workspace/ceos", { token }),
      ]);
      setStats(statsData);
      setCeos(ceosData.ceos || []);
    } catch (e) { toastFromError(e, "Failed to load dashboard data"); }
    finally { setLoading(false); }
  }, [token]);

  // Load connected social media platform details from separated modular API endpoints
  const loadSocial = useCallback(async () => {
    setSocialLoading(true);
    setSocialData(null);
    try {
      let queryParams = `?timeRange=${timeRange}`;
      if (timeRange === "Date Range" && customStartDate && customEndDate) {
        queryParams += `&startDate=${customStartDate}&endDate=${customEndDate}`;
      }

      const [statusData, analyticsData, postsData] = await Promise.all([
        api(`/api/app/social/${activePlatform}`, { token }),
        api(`/api/app/social/${activePlatform}/analytics${queryParams}`, { token }),
        api(`/api/app/social/${activePlatform}/posts${queryParams}`, { token })
      ]);

      setSocialData({
        ...statusData,
        metrics: analyticsData.metrics,
        growth: analyticsData.growth,
        chartData: analyticsData.chartData,
        posts: postsData.posts
      });

      // Initialize form fields with saved credentials
      const fields = PLATFORM_FIELDS[activePlatform] || [];
      const init = {};
      fields.forEach((f) => {
        init[f.key] = statusData.credentials?.[f.key] || "";
      });
      setFormState(init);
    } catch (e) {
      console.error("Failed to load platform data:", e.message);
    } finally {
      setSocialLoading(false);
    }
  }, [activePlatform, timeRange, customStartDate, customEndDate, token]);

  useEffect(() => {
    Promise.resolve().then(() => {
      load();
    });
  }, [load]);

  // Hide form only when activePlatform changes
  useEffect(() => {
    Promise.resolve().then(() => {
      setShowForm(false);
    });
  }, [activePlatform]);

  // Fetch social stats whenever active platform or timeframe parameters update
  useEffect(() => {
    Promise.resolve().then(() => {
      loadSocial();
    });
  }, [loadSocial]);

  // Fetch People data when dependencies change
  useEffect(() => {
    Promise.resolve().then(() => {
      loadPeople();
    });
  }, [loadPeople]);

  async function onSavePlatform(e) {
    e.preventDefault();
    setSavingPlatform(true);
    try {
      await api(`/api/app/social/${activePlatform}/connect`, {
        method: "POST",
        token,
        body: formState
      });
      toastSuccess(`${activePlatform} details connected!`);
      setShowForm(false);
      loadSocial();
    } catch (err) {
      toastFromError(err, "Failed to save connection details");
    } finally {
      setSavingPlatform(false);
    }
  }

  async function onDisconnectPlatform() {
    if (!window.confirm(`Disconnect ${activePlatform}?`)) return;
    try {
      await api(`/api/app/social/${activePlatform}/connect`, { method: "DELETE", token });
      toastSuccess(`${activePlatform} disconnected`);
      loadSocial();
    } catch (err) {
      toastFromError(err, "Failed to disconnect");
    }
  }

  // Compute scores from index stats
  function computeScores() {
    if (!stats) return null;
    const a = stats.analytics || {};
    const total = stats.total || 0;
    const published = (stats.byStatus||[]).find(s => s._id==="published")?.count || 0;
    const verified  = (stats.byStatus||[]).find(s => s._id==="verified")?.count || 0;

    const seoScore      = Math.min(95, 50 + Math.floor((total / Math.max(total,1)) * 45));
    const aeoScore      = Math.min(92, 48 + Math.floor((published / Math.max(total,1)) * 44));
    const geoScore      = Math.min(88, 45 + Math.floor((verified / Math.max(total,1)) * 43));
    const brandAuth     = Math.min(90, 40 + Math.min(stats.activeCeos||0, 10) * 5);
    const contentVelocity = Math.min(95, Math.floor(Math.min((stats.todayCount||0)*10, 95)));
    const teamPerf      = stats.teamStats?.length > 0
      ? Math.round(stats.teamStats.reduce((s,m) => s + (m.total>0?(m.completed/m.total)*100:0), 0) / stats.teamStats.length)
      : 50;
    const aiMentions    = Math.min(80, 30 + Math.floor((a.totalMentions||0) * 2));
    const trustScore    = Math.min(93, Math.floor((seoScore + aeoScore + brandAuth) / 3));

    const overall = Math.round((seoScore + aeoScore + geoScore + brandAuth + contentVelocity + teamPerf + aiMentions + trustScore) / 8);

    return { overall, seoScore, aeoScore, geoScore, brandAuth, contentVelocity, teamPerf, aiMentions, trustScore };
  }

  const scores = computeScores();

  const scoreItems = scores ? [
    { label:"SEO Score",         value: scores.seoScore,       color:"bg-emerald-500", icon:<LuGlobe className="h-4 w-4" /> },
    { label:"AEO Score",         value: scores.aeoScore,       color:"bg-blue-500",    icon:<LuStar className="h-4 w-4" /> },
    { label:"GEO Score",         value: scores.geoScore,       color:"bg-violet-500",  icon:<LuGlobe className="h-4 w-4" /> },
    { label:"Brand Authority",   value: scores.brandAuth,      color:"bg-indigo-500",  icon:<LuStar className="h-4 w-4" /> },
    { label:"Content Velocity",  value: scores.contentVelocity,color:"bg-amber-500",   icon:<LuTrendingUp className="h-4 w-4" /> },
    { label:"Team Performance",  value: scores.teamPerf,       color:"bg-green-500",   icon:<LuUsers className="h-4 w-4" /> },
    { label:"AI Mentions",       value: scores.aiMentions,     color:"bg-rose-500",    icon:<LuStar className="h-4 w-4" /> },
    { label:"Trust Score",       value: scores.trustScore,     color:"bg-teal-500",    icon:<LuShieldCheck className="h-4 w-4" /> },
  ] : [];

  const overall = scores?.overall || 0;
  const overallColor = overall >= 80 ? "#10b981" : overall >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <div className="space-y-6 p-4 sm:p-6 bg-slate-50/30 min-h-screen">
      {/* Header back button and title */}
      <div className="flex items-center gap-3">
        <button onClick={() => window.history.back()} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition shadow-sm">
          <LuArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Popularity</h2>
        </div>
      </div>

      {/* Main Tabs (Social Media vs Campaign) */}
      <div className="flex bg-white rounded-full p-1 border border-slate-100 shadow-sm max-w-sm mb-6">
        <button onClick={() => setActiveTab("social_media")} className={`flex-1 text-center py-2 px-4 rounded-full text-sm font-bold transition-all ${activeTab === "social_media" ? "bg-amber-400 text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
          Social Media
        </button>
        <button onClick={() => setActiveTab("campaign")} className={`flex-1 text-center py-2 px-4 rounded-full text-sm font-bold transition-all ${activeTab === "campaign" ? "bg-amber-400 text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
          Campaign
        </button>
      </div>

      {activeTab === "social_media" ? (
        <>
          {/* Sub-tabs / Platform Chips */}
          <div className="flex flex-wrap gap-3 mb-6">
            {PLATFORMS.map(({ key, label, Icon, textCol }) => (
              <button key={key} onClick={() => setActivePlatform(key)} className={`flex items-center gap-2.5 rounded-full border px-4 py-2 text-sm font-bold shadow-sm transition ${activePlatform === key ? "bg-amber-400 border-slate-900/10 text-slate-900" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"}`}>
                <Icon className={`h-4 w-4 ${activePlatform === key ? "text-slate-900" : textCol}`} />
                {label}
              </button>
            ))}
          </div>

          {/* Social Media Content Loader */}
          {socialLoading ? (
            <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white text-sm text-slate-400">
              <span className="animate-pulse">Loading {activePlatform} stats...</span>
            </div>
          ) : socialData?.isConnected ? (
            <>
              {socialData.isPersonal && (
                <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/50 p-4 flex gap-3 text-amber-800 text-xs font-semibold leading-relaxed animate-fadeIn">
                  <span className="text-base shrink-0">⚠️</span>
                  <div>
                    <strong className="block text-amber-900 font-bold mb-0.5">
                      {activePlatform === "twitter" ? "Profile Link Mode" : "Personal Profile Linked"}
                    </strong>
                    {activePlatform === "twitter" ? (
                      <>
                        Twitter (X) API access requires a paid Developer subscription. This handle is connected in **Profile Link Mode**; 
                        you can visit the profile directly using the link above.
                      </>
                    ) : (
                      <>
                        Meta API does not support fetching live metrics, subscriber counts, or posts for personal Facebook accounts. 
                        To track real-time analytics and display post metrics, please disconnect this handle and connect a **Facebook Business Page** or **Public Creator Page**.
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Account profile card */}
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm mb-6 relative">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-14 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center shadow-inner shrink-0 overflow-hidden">
                      {activePlatform === "instagram" && <LuInstagram className="h-8 w-8 text-pink-600" />}
                      {activePlatform === "facebook" && <LuFacebook className="h-8 w-8 text-blue-600" />}
                      {activePlatform === "youtube" && <LuYoutube className="h-8 w-8 text-red-600" />}
                      {activePlatform === "twitter" && <LuTwitter className="h-8 w-8 text-slate-900" />}
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 capitalize">{activePlatform}</h3>
                      <a
                        href={socialData.profileUrl || socialData.credentials?.pageUrl || socialData.credentials?.channelUrl || `https://www.facebook.com/${socialData.credentials?.pageId || ""}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-bold hover:underline flex items-center gap-1 transition-all mt-0.5"
                      >
                        <span>{socialData.credentials?.username || socialData.credentials?.pageName || socialData.credentials?.channelName || `@${activePlatform}_handle`}</span>
                        <LuExternalLink className="h-3 w-3 inline opacity-70" />
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <div className="bg-emerald-100 text-emerald-800 text-xs font-black px-3 py-1.5 rounded-full flex items-center gap-1 shadow-sm">
                      <span>↑ {getMetricGrowth("likes")}</span>
                      <span className="text-[10px] opacity-80 font-normal">{getSubtext()}</span>
                    </div>
                    <button onClick={onDisconnectPlatform} className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 transition shadow-sm" title="Disconnect Account">
                      <LuUnlink className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2 mt-6 items-center">
                  {["Today", "Yesterday", "7 Days", "All", "Date Range"].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTimeRange(t)}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${
                        t === timeRange
                          ? "bg-amber-400 border border-slate-900/10 text-slate-900 shadow-sm"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      {t}
                    </button>
                  ))}

                  {timeRange === "Date Range" && (
                    <div className="flex items-center gap-2 ml-2 animate-fadeIn">
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-amber-400 font-semibold"
                      />
                      <span className="text-slate-400 text-xs">to</span>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-amber-400 font-semibold"
                      />
                    </div>
                  )}
                </div>

                {/* 4 KPIs grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                  <div className="bg-slate-50/50 rounded-xl border border-slate-100/50 p-4 text-center">
                    <LuUsers className="h-5 w-5 mx-auto mb-2 text-indigo-500" />
                    <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Followers</div>
                    <div className="text-xl font-black text-slate-800 mt-1">
                      {formatNumber(socialData.followers)}
                    </div>
                  </div>
                  <div className="bg-slate-50/50 rounded-xl border border-slate-100/50 p-4 text-center">
                    <LuEye className="h-5 w-5 mx-auto mb-2 text-blue-500" />
                    <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Views</div>
                    <div className="text-xl font-black text-slate-800 mt-1">
                      {formatNumber(metrics.totalReach)}
                    </div>
                  </div>
                  <div className="bg-slate-50/50 rounded-xl border border-slate-100/50 p-4 text-center">
                    <LuHeart className="h-5 w-5 mx-auto mb-2 text-rose-500" />
                    <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Likes</div>
                    <div className="text-xl font-black text-slate-800 mt-1">
                      {formatNumber(metrics.totalLikes)}
                    </div>
                  </div>
                  <div className="bg-slate-50/50 rounded-xl border border-slate-100/50 p-4 text-center">
                    <LuMessageCircle className="h-5 w-5 mx-auto mb-2 text-emerald-500" />
                    <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Comments</div>
                    <div className="text-xl font-black text-slate-800 mt-1">
                      {formatNumber(metrics.totalComments)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Analytics Section - Four Interactive Chart Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                
                {/* 1. Total Followers Card */}
                <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-500 mb-1">Total Followers</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-slate-900 animate-fadeIn">
                        {formatNumber(socialData.followers)}
                      </span>
                      <span className="text-xs font-bold text-emerald-600">+9.1%</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                      {getSubtext()}
                    </div>
                  </div>

                  {/* Chart Wrapper */}
                  <div className="flex gap-3 pt-6 border-b border-dashed border-slate-100 pb-2 h-36">
                    {/* Y-axis Column */}
                    <div className="flex flex-col justify-between h-28 text-right w-8 select-none text-[8px] font-bold text-slate-400 pr-1">
                      {(() => {
                        const maxVal = socialData?.followers || 100;
                        const yLabels = [maxVal, Math.round(maxVal * 0.6), Math.round(maxVal * 0.2), 0];
                        return yLabels.map((lbl, idx) => (
                          <span key={idx} className="block">{formatNumber(lbl)}</span>
                        ));
                      })()}
                    </div>
                    {/* Columns Column */}
                    <div className="flex-1 h-28 flex items-end justify-between gap-1.5 relative">
                      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-0.5">
                        <div className="w-full border-t border-slate-100/50" />
                        <div className="w-full border-t border-slate-100/50" />
                        <div className="w-full border-t border-slate-100/50" />
                      </div>
                      
                      {(() => {
                        const maxVal = socialData?.followers || 100;
                        return chartData.map((day, idx) => {
                          const currentFollowers = socialData?.followers || 0;
                          const val = Math.max(0, currentFollowers - ((chartData.length - 1 - idx) * Math.ceil(currentFollowers * 0.005)));
                          const percent = Math.max(10, Math.min(100, (val / maxVal) * 100));

                          return (
                            <div key={idx} className="flex-1 min-w-0 flex flex-col items-center z-10 h-full justify-end">
                              <div
                                className="w-full rounded-t-md bg-emerald-500 hover:bg-emerald-600 transition-all duration-300 shadow-sm relative group cursor-pointer"
                                style={{ height: `${percent}%` }}
                              >
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity font-bold pointer-events-none whitespace-nowrap z-50">
                                  Followers: {val}
                                </div>
                              </div>
                              <span className="text-[8px] font-bold text-slate-400 mt-1.5 truncate w-full text-center">
                                {chartData.length > 10 ? (idx % 5 === 0 ? day.dayName : "") : day.dayName}
                              </span>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>

                {/* 2. Total Views Card */}
                <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-500 mb-1">Total Views</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-slate-900 animate-fadeIn">
                        {formatNumber(metrics.totalReach)}
                      </span>
                      <span className="text-xs font-bold text-emerald-600">{getMetricGrowth("reach")}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                      {getSubtext()}
                    </div>
                  </div>

                  {/* Chart Wrapper */}
                  <div className="flex gap-3 pt-6 border-b border-dashed border-slate-100 pb-2 h-36">
                    {/* Y-axis Column */}
                    <div className="flex flex-col justify-between h-28 text-right w-8 select-none text-[8px] font-bold text-slate-400 pr-1">
                      {(() => {
                        const maxVal = Math.max(...chartData.map(d => d.reach), 1);
                        const yLabels = [maxVal, Math.round(maxVal * 0.6), Math.round(maxVal * 0.2), 0];
                        return yLabels.map((lbl, idx) => (
                          <span key={idx} className="block">{formatNumber(lbl)}</span>
                        ));
                      })()}
                    </div>
                    {/* Columns Column */}
                    <div className="flex-1 h-28 flex items-end justify-between gap-1.5 relative">
                      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-0.5">
                        <div className="w-full border-t border-slate-100/50" />
                        <div className="w-full border-t border-slate-100/50" />
                        <div className="w-full border-t border-slate-100/50" />
                      </div>
                      
                      {(() => {
                        const maxVal = Math.max(...chartData.map(d => d.reach), 1);
                        return chartData.map((day, idx) => {
                          const val = day.reach;
                          const percent = Math.max(10, Math.min(100, (val / maxVal) * 100));

                          return (
                            <div key={idx} className="flex-1 min-w-0 flex flex-col items-center z-10 h-full justify-end">
                              <div
                                className="w-full rounded-t-md bg-emerald-500 hover:bg-emerald-600 transition-all duration-300 shadow-sm relative group cursor-pointer"
                                style={{ height: `${percent}%` }}
                              >
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity font-bold pointer-events-none whitespace-nowrap z-50">
                                  Views: {val}
                                </div>
                              </div>
                              <span className="text-[8px] font-bold text-slate-400 mt-1.5 truncate w-full text-center">
                                {chartData.length > 10 ? (idx % 5 === 0 ? day.dayName : "") : day.dayName}
                              </span>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>

                {/* 3. Total Likes Card */}
                <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-500 mb-1">Total Likes</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-slate-900 animate-fadeIn">
                        {formatNumber(metrics.totalLikes)}
                      </span>
                      <span className="text-xs font-bold text-emerald-600">{getMetricGrowth("likes")}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                      {getSubtext()}
                    </div>
                  </div>

                  {/* Chart Wrapper */}
                  <div className="flex gap-3 pt-6 border-b border-dashed border-slate-100 pb-2 h-36">
                    {/* Y-axis Column */}
                    <div className="flex flex-col justify-between h-28 text-right w-8 select-none text-[8px] font-bold text-slate-400 pr-1">
                      {(() => {
                        const maxVal = Math.max(...chartData.map(d => d.likes), 1);
                        const yLabels = [maxVal, Math.round(maxVal * 0.6), Math.round(maxVal * 0.2), 0];
                        return yLabels.map((lbl, idx) => (
                          <span key={idx} className="block">{formatNumber(lbl)}</span>
                        ));
                      })()}
                    </div>
                    {/* Columns Column */}
                    <div className="flex-1 h-28 flex items-end justify-between gap-1.5 relative">
                      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-0.5">
                        <div className="w-full border-t border-slate-100/50" />
                        <div className="w-full border-t border-slate-100/50" />
                        <div className="w-full border-t border-slate-100/50" />
                      </div>
                      
                      {(() => {
                        const maxVal = Math.max(...chartData.map(d => d.likes), 1);
                        return chartData.map((day, idx) => {
                          const val = day.likes;
                          const percent = Math.max(10, Math.min(100, (val / maxVal) * 100));

                          return (
                            <div key={idx} className="flex-1 min-w-0 flex flex-col items-center z-10 h-full justify-end">
                              <div
                                className="w-full rounded-t-md bg-emerald-500 hover:bg-emerald-600 transition-all duration-300 shadow-sm relative group cursor-pointer"
                                style={{ height: `${percent}%` }}
                              >
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity font-bold pointer-events-none whitespace-nowrap z-50">
                                  Likes: {val}
                                </div>
                              </div>
                              <span className="text-[8px] font-bold text-slate-400 mt-1.5 truncate w-full text-center">
                                {chartData.length > 10 ? (idx % 5 === 0 ? day.dayName : "") : day.dayName}
                              </span>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>

                {/* 4. Total Comments Card */}
                <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-500 mb-1">Total Comments</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-slate-900 animate-fadeIn">
                        {formatNumber(metrics.totalComments)}
                      </span>
                      <span className="text-xs font-bold text-emerald-600">{getMetricGrowth("comments")}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                      {getSubtext()}
                    </div>
                  </div>

                  {/* Chart Wrapper */}
                  <div className="flex gap-3 pt-6 border-b border-dashed border-slate-100 pb-2 h-36">
                    {/* Y-axis Column */}
                    <div className="flex flex-col justify-between h-28 text-right w-8 select-none text-[8px] font-bold text-slate-400 pr-1">
                      {(() => {
                        const maxVal = Math.max(...chartData.map(d => d.comments), 1);
                        const yLabels = [maxVal, Math.round(maxVal * 0.6), Math.round(maxVal * 0.2), 0];
                        return yLabels.map((lbl, idx) => (
                          <span key={idx} className="block">{formatNumber(lbl)}</span>
                        ));
                      })()}
                    </div>
                    {/* Columns Column */}
                    <div className="flex-1 h-28 flex items-end justify-between gap-1.5 relative">
                      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-0.5">
                        <div className="w-full border-t border-slate-100/50" />
                        <div className="w-full border-t border-slate-100/50" />
                        <div className="w-full border-t border-slate-100/50" />
                      </div>
                      
                      {(() => {
                        const maxVal = Math.max(...chartData.map(d => d.comments), 1);
                        return chartData.map((day, idx) => {
                          const val = day.comments;
                          const percent = Math.max(10, Math.min(100, (val / maxVal) * 100));

                          return (
                            <div key={idx} className="flex-1 min-w-0 flex flex-col items-center z-10 h-full justify-end">
                              <div
                                className="w-full rounded-t-md bg-emerald-500 hover:bg-emerald-600 transition-all duration-300 shadow-sm relative group cursor-pointer"
                                style={{ height: `${percent}%` }}
                              >
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity font-bold pointer-events-none whitespace-nowrap z-50">
                                  Comments: {val}
                                </div>
                              </div>
                              <span className="text-[8px] font-bold text-slate-400 mt-1.5 truncate w-full text-center">
                                {chartData.length > 10 ? (idx % 5 === 0 ? day.dayName : "") : day.dayName}
                              </span>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>

              </div>

              {/* Recent posts grid */}
              {filteredPosts.length > 0 ? (
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-slate-700 mb-4">Recent Posts ({filteredPosts.length})</h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredPosts.map((post, idx) => (
                      <SocialPostCard
                        key={post.id || idx}
                        post={post}
                        platform={activePlatform}
                        username={socialData.credentials?.username || socialData.credentials?.pageName || socialData.credentials?.channelName || "User"}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-center text-slate-400 text-sm mb-6 font-semibold shadow-sm">
                  No posts found for this time range.
                </div>
              )}
            </>
          ) : (
            /* Connect profile prompt card */
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center mb-6 shadow-sm">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 border border-slate-200 text-slate-400 shadow-inner">
                {activePlatform === "instagram" && <LuInstagram className="h-8 w-8 text-pink-500" />}
                {activePlatform === "facebook" && <LuFacebook className="h-8 w-8 text-blue-600" />}
                {activePlatform === "youtube" && <LuYoutube className="h-8 w-8 text-red-600" />}
                {activePlatform === "twitter" && <LuTwitter className="h-8 w-8 text-slate-900" />}
              </div>
              <h3 className="text-base font-black text-slate-800 mb-1 capitalize">{activePlatform} Not Connected</h3>
              <p className="text-xs text-slate-500 mb-6 max-w-sm mx-auto">Connect your {activePlatform} account to start tracking live analytics, followers growth, and post reach.</p>
              
              {showForm ? (
                <form onSubmit={onSavePlatform} className="max-w-md mx-auto text-left bg-slate-50/50 border border-slate-100 p-6 rounded-2xl space-y-4 shadow-sm">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-2 mb-2">Connection Settings</h4>
                  {(PLATFORM_FIELDS[activePlatform] || []).map((f) => (
                    <div key={f.key}>
                      <label className="block text-xs font-bold text-slate-600 mb-1">{f.label}</label>
                      <input
                        type="text"
                        required
                        value={formState[f.key] || ""}
                        onChange={(e) => setFormState(prev => ({ ...prev, [f.key]: e.target.value }))}
                        placeholder={f.placeholder}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                      />
                    </div>
                  ))}
                  <div className="flex gap-2 pt-2 justify-end">
                    <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition">Cancel</button>
                    <button type="submit" disabled={savingPlatform} className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-xs font-black text-slate-900 border border-slate-900/10 shadow transition disabled:opacity-50">
                      {savingPlatform ? "Saving..." : "Save & Connect"}
                    </button>
                  </div>
                </form>
              ) : (
                <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 rounded-xl bg-amber-400 hover:bg-amber-500 px-5 py-2.5 text-xs font-black text-slate-900 border border-slate-900/10 shadow-sm transition">
                  <LuLink className="h-4 w-4" /> Connect {activePlatform}
                </button>
              )}
            </div>
          )}
        </>
      ) : (
        /* Campaigns Section Placeholder */
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center text-slate-400 text-sm mb-6 font-semibold shadow-sm">
          Campaign analytics are not active for this workspace.
        </div>
      )}

      {/* PEOPLE SECTION */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm mb-6 animate-fadeIn">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-black text-slate-950">People</h3>
              {newlyJoined.length > 0 && (
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                  +{newlyJoined.length} New Joined
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Gain knowledge everyday</p>
          </div>
          <button 
            onClick={() => setPeopleTab(peopleTab === "contacts" ? "new" : "contacts")}
            className="flex items-center gap-1.5 rounded-full bg-amber-400 border border-slate-900/10 px-4 py-1.5 text-xs font-black text-slate-900 shadow-sm transition hover:bg-amber-500"
          >
            View All &gt;
          </button>
        </div>

        {/* Tab switcher buttons */}
        <div className="flex bg-slate-100 rounded-xl p-1 mb-5 max-w-xs border border-slate-200/50">
          {[
            { key: "new", label: "New" },
            { key: "contacts", label: "Contacts" },
            { key: "groups", label: "Groups" }
          ].map(t => (
            <button
              key={t.key}
              onClick={() => {
                setPeopleTab(t.key);
                setSelectedContactIds([]);
              }}
              className={`flex-1 text-center py-1.5 rounded-lg text-xs font-bold transition-all ${
                peopleTab === t.key
                  ? "bg-white text-slate-900 shadow-sm border border-slate-200/20"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* --- 1. NEW TAB --- */}
        {peopleTab === "new" && (
          <div className="space-y-3">
            {newlyJoined.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">No newly joined members found.</p>
            ) : (
              newlyJoined.map(member => (
                <div key={member.id} className="flex items-center justify-between border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center font-bold text-slate-600 text-sm">
                      {member.avatar ? (
                        <img src={member.avatar} alt={member.name} className="h-full w-full object-cover" />
                      ) : (
                        member.name.charAt(0)
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">{member.name}</h4>
                      <p className="text-xs text-slate-400">{member.phone}</p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-500 font-semibold bg-slate-100/80 px-2 py-0.5 rounded-md">
                    {member.joinedAt}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {/* --- 2. CONTACTS TAB --- */}
        {peopleTab === "contacts" && (
          <div className="space-y-4">
            {/* Search and Action Bar */}
            <div className="flex gap-2 flex-wrap items-center">
              <div className="relative flex-1 min-w-[200px]">
                <LuSearch className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search contacts..."
                  value={peopleSearch}
                  onChange={(e) => setPeopleSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <button
                onClick={() => setShowAddContactForm(!showAddContactForm)}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 shadow-sm"
              >
                <LuUserPlus className="h-3.5 w-3.5" /> Add Contact
              </button>
              <button
                onClick={onSyncContacts}
                className="flex items-center gap-1.5 rounded-xl bg-slate-800 text-white px-3 py-2 text-xs font-semibold hover:bg-slate-900 shadow-sm"
                title="Mock sync of device contacts"
              >
                <LuRefreshCw className="h-3.5 w-3.5" /> Sync
              </button>
            </div>

            {/* Inline Add Contact Form */}
            {showAddContactForm && (
              <form onSubmit={onAddContact} className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3 animate-fadeIn">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-2">New Contact Detail</h4>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Name *</label>
                    <input
                      type="text"
                      required
                      value={addContactName}
                      onChange={(e) => setAddContactName(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Phone *</label>
                    <input
                      type="text"
                      required
                      value={addContactPhone}
                      onChange={(e) => setAddContactPhone(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Email</label>
                    <input
                      type="email"
                      value={addContactEmail}
                      onChange={(e) => setAddContactEmail(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button type="button" onClick={() => setShowAddContactForm(false)} className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs hover:bg-slate-100 font-semibold text-slate-600">Cancel</button>
                  <button type="submit" className="px-4 py-1.5 rounded-lg bg-amber-400 border border-slate-900/10 text-xs font-bold text-slate-900 shadow">Save Contact</button>
                </div>
              </form>
            )}

            {/* Checkbox Group Creation Action Bar */}
            {selectedContactIds.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col gap-3 justify-between items-start sm:flex-row sm:items-center animate-fadeIn shadow-sm">
                <div>
                  <span className="text-xs font-black text-amber-900">{selectedContactIds.length} Contacts Selected</span>
                  <p className="text-[10px] text-amber-700">Combine selected contacts into a custom group</p>
                </div>
                
                {showCreateGroupForm ? (
                  <form onSubmit={onCreateGroup} className="flex gap-2 flex-wrap items-center w-full sm:w-auto">
                    <input
                      type="text"
                      placeholder="Group Name..."
                      required
                      value={createGroupName}
                      onChange={(e) => setCreateGroupName(e.target.value)}
                      className="rounded-lg border border-amber-200 bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                    <select
                      value={createGroupColor}
                      onChange={(e) => setCreateGroupColor(e.target.value)}
                      className="rounded-lg border border-amber-200 bg-white px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 font-bold"
                    >
                      <option value="#FFD54F">Yellow</option>
                      <option value="#EC4899">Pink</option>
                      <option value="#3B82F6">Blue</option>
                      <option value="#10B981">Green</option>
                      <option value="#8B5CF6">Purple</option>
                    </select>
                    <button type="submit" className="px-3.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800">
                      Create
                    </button>
                    <button type="button" onClick={() => { setShowCreateGroupForm(false); setSelectedContactIds([]); }} className="px-3 py-1.5 rounded-lg border border-amber-200 text-xs hover:bg-white text-slate-600 font-bold">
                      Cancel
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={() => setShowCreateGroupForm(true)}
                    className="flex items-center gap-1.5 rounded-lg bg-amber-500 border border-slate-900/10 text-white px-3.5 py-1.5 text-xs font-bold shadow-sm hover:bg-amber-600"
                  >
                    <LuPlus className="h-3.5 w-3.5" /> Make Group
                  </button>
                )}
              </div>
            )}

            {/* Contacts list */}
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {contacts.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-4 text-center">No contacts found.</p>
              ) : (
                contacts.map(c => (
                  <div key={c.id} className="flex items-center justify-between border-b border-slate-50 pb-3 last:border-0 last:pb-0 hover:bg-slate-50/50 rounded-lg p-1.5 transition-colors">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedContactIds.includes(c.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedContactIds(prev => [...prev, c.id]);
                          } else {
                            setSelectedContactIds(prev => prev.filter(id => id !== c.id));
                          }
                        }}
                        className="rounded border-slate-300 text-amber-500 focus:ring-amber-400 h-3.5 w-3.5"
                      />
                      <div className="h-9 w-9 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center font-bold text-slate-600 text-xs">
                        {c.avatar ? (
                          <img src={c.avatar} alt={c.name} className="h-full w-full object-cover" />
                        ) : (
                          c.name.charAt(0)
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">{c.name}</h4>
                        <p className="text-xs text-slate-400">{c.phone} {c.email ? `• ${c.email}` : ""}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => onDeleteContact(c.id)}
                      className="text-slate-400 hover:text-red-500 p-1.5 transition-colors"
                      title="Delete Contact"
                    >
                      <LuTrash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* --- 3. GROUPS TAB --- */}
        {peopleTab === "groups" && (
          <div className="space-y-4">
            {/* Create Group Quick Action */}
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500">Workspace Groups ({groups.length})</span>
              <button
                onClick={() => {
                  setPeopleTab("contacts");
                  toastSuccess("Select contacts below first to form a group!");
                }}
                className="flex items-center gap-1.5 rounded-xl bg-amber-400 border border-slate-900/10 text-slate-900 px-3 py-1.5 text-xs font-black shadow-sm hover:bg-amber-500"
              >
                <LuPlus className="h-3.5 w-3.5" /> Create Group
              </button>
            </div>

            {/* Groups list */}
            <div className="space-y-3">
              {groups.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-4 text-center">No groups found.</p>
              ) : (
                groups.map(g => (
                  <div key={g.id} className="flex items-center justify-between border border-slate-100 bg-slate-50/30 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm" style={{ backgroundColor: g.colorHex || "#FFD54F" }}>
                        <LuUsers className="h-5 w-5" strokeWidth={2} />
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">{g.name}</h4>
                        <div className="flex flex-wrap items-center gap-1 text-[11px] text-slate-500 font-semibold mt-0.5">
                          <span>{g.membersCount} Members</span>
                          {g.members && g.members.length > 0 && (
                            <span className="opacity-70">• {(g.members || []).map(m => m.name).slice(0, 3).join(", ") + (g.members.length > 3 ? "..." : "")}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => onDeleteGroup(g.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 transition shadow-sm"
                      title="Delete Group"
                    >
                      <LuTrash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* CEO POPULARITY INDEX SECTION (EXISTING WORK) -> PLACED AT THE BOTTOM */}
      <div className="border-t border-slate-200/60 pt-8 mt-10">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
          <div>
            <h3 className="text-base font-black text-slate-950">CEO Popularity Rankings & Index Performance</h3>
            <p className="text-xs text-slate-500 mt-1">SEO, AEO, GEO and Trust Index statistics for active workspace CEOs</p>
          </div>
          <button onClick={load} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition">
            <LuRefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100" />)}</div>
        ) : (
          <div className="space-y-6">
            {/* Overall score hero */}
            <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/50 to-violet-50/50 p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row items-center gap-8">
                {/* Ring */}
                <div className="relative flex items-center justify-center">
                  <svg width="160" height="160" className="-rotate-90">
                    <circle cx="80" cy="80" r="65" fill="none" stroke="#e2e8f0" strokeWidth="14" />
                    <circle cx="80" cy="80" r="65" fill="none" stroke={overallColor} strokeWidth="14"
                      strokeDasharray={2*Math.PI*65} strokeDashoffset={2*Math.PI*65 - (overall/100)*2*Math.PI*65}
                      strokeLinecap="round" style={{ transition:"stroke-dashoffset 1s ease" }} />
                  </svg>
                  <div className="absolute text-center">
                    <div className="text-4xl font-black text-slate-900">{overall}</div>
                    <div className="text-xs font-semibold text-slate-500">/100</div>
                  </div>
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <div className="text-2xl font-black text-slate-900 mb-1">
                    {overall >= 80 ? "🚀 Excellent" : overall >= 60 ? "📈 Good" : "⚠️ Needs Work"}
                  </div>
                  <p className="text-sm text-slate-600 mb-4 font-semibold">Overall CEO Popularity & Brand Authority Score</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      ["Total Content", stats?.total||0, "text-indigo-600"],
                      ["Published",     (stats?.byStatus||[]).find(s=>s._id==="published")?.count||0, "text-green-600"],
                      ["Active CEOs",   stats?.activeCeos||0, "text-violet-600"],
                      ["Today",         stats?.todayCount||0, "text-amber-600"],
                    ].map(([l,v,c]) => (
                      <div key={l} className="rounded-xl bg-white border border-slate-100 p-3 text-center shadow-sm">
                        <div className={`text-xl font-black ${c}`}>{v}</div>
                        <div className="text-[10px] font-semibold text-slate-500">{l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Score breakdown */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {scoreItems.map(({ label, value, color, icon }) => (
                <ScoreBar key={label} label={label} value={value} color={color} icon={icon} />
              ))}
            </div>

            {/* Per-CEO scores */}
            {ceos.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                  <div className="text-sm font-bold text-slate-900">CEO Popularity Rankings</div>
                </div>
                <div className="divide-y divide-slate-100">
                  {ceos.map((ceo, i) => {
                    const ceoScore = Math.max(40, overall - i * 3 + (i % 5));
                    return (
                      <div key={ceo._id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition">
                        <div className="text-sm font-bold text-slate-400 w-6">{i===0?"🥇":i===1?"🥈":i===2?"🥉":`#${i+1}`}</div>
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                          {ceo.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-slate-900">{ceo.name}</div>
                          <div className="text-xs text-slate-500 font-bold">{ceo.company}{ceo.industry ? ` · ${ceo.industry}` : ""}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-2 rounded-full bg-slate-100">
                            <div className="h-2 rounded-full bg-indigo-500 transition-all" style={{ width:`${ceoScore}%` }} />
                          </div>
                          <span className="text-sm font-bold text-indigo-600 w-12 text-right">{ceoScore}/100</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SocialPostCard({ post, platform, username }) {
  const [imgError, setImgError] = useState(false);
  const brandGradient = {
    instagram: "from-purple-600 via-pink-500 to-orange-400",
    facebook: "from-blue-700 to-blue-500",
    youtube: "from-red-700 to-rose-600",
    twitter: "from-slate-800 to-slate-900"
  }[platform] || "from-slate-700 to-slate-500";

  const PlatformIcon = {
    instagram: LuInstagram,
    facebook: LuFacebook,
    youtube: LuYoutube,
    twitter: LuTwitter
  }[platform] || LuGlobe;

  let proxyUrl = "";
  if (post.thumbnailUrl) {
    try {
      proxyUrl = `/api/public/image-proxy?url=b64_${window.btoa(post.thumbnailUrl)}`;
    } catch {
      proxyUrl = `/api/public/image-proxy?url=${encodeURIComponent(post.thumbnailUrl)}`;
    }
  }

  // Get first letter of username for avatar
  const avatarLetter = String(username || "U").replace(/^@/, "").charAt(0).toUpperCase();

  return (
    <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-sm hover:shadow-md transition duration-200 flex flex-col h-full">
      {/* Post Header */}
      <div className="flex items-center justify-between p-3 border-b border-slate-50">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-amber-100 border border-amber-200/50 flex items-center justify-center text-[10px] font-black text-amber-700 uppercase shrink-0">
            {avatarLetter}
          </div>
          <span className="text-xs font-bold text-slate-700 truncate max-w-[150px]">
            {username}
          </span>
        </div>
        <PlatformIcon className={`h-4 w-4 ${
          platform === "instagram" ? "text-pink-600" :
          platform === "facebook" ? "text-blue-600" :
          platform === "youtube" ? "text-red-600" : "text-slate-900"
        }`} />
      </div>

      {/* Post Image/Placeholder Section */}
      <div className="aspect-square w-full bg-slate-50 relative flex items-center justify-center border-b border-slate-50 overflow-hidden">
        {!imgError && proxyUrl ? (
          <img
            src={proxyUrl}
            alt=""
            onError={() => setImgError(true)}
            className="h-full w-full object-cover transition duration-300 hover:scale-105"
          />
        ) : (
          <div className={`h-full w-full bg-gradient-to-tr ${brandGradient} flex flex-col items-center justify-center p-4 text-white/90`}>
            <PlatformIcon className="h-10 w-10 mb-2 opacity-90" />
            <span className="text-[10px] uppercase font-bold tracking-wider opacity-75">{platform} Update</span>
          </div>
        )}
      </div>

      {/* Post Text & Metrics Section */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <p className="text-xs text-slate-700 line-clamp-3 font-semibold leading-relaxed mb-4">
            {post.caption || "No caption"}
          </p>
        </div>
        <div className="flex items-center justify-between border-t border-slate-50 pt-3 mt-auto text-[10px] font-black text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><LuHeart className="h-3.5 w-3.5 text-rose-400" />{post.likes ?? 0}</span>
            <span className="flex items-center gap-1"><LuMessageCircle className="h-3.5 w-3.5 text-blue-400" />{post.comments ?? 0}</span>
            {platform === "youtube" && (
              <span className="flex items-center gap-1"><LuEye className="h-3.5 w-3.5 text-amber-400" />{post.reach ?? 0}</span>
            )}
          </div>
          <span className="font-normal text-slate-400">
            {post.date ? new Date(post.date).toLocaleDateString("en-IN") : ""}
          </span>
        </div>
      </div>
    </div>
  );
}

function LuShieldCheck({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>
    </svg>
  );
}

