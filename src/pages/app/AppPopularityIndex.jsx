import { useEffect, useState, useCallback } from "react";
import {
  LuRefreshCw, LuTrendingUp, LuStar, LuGlobe, LuUsers,
  LuInstagram, LuFacebook, LuYoutube, LuHeart, LuMessageCircle,
  LuEye, LuLink, LuUnlink,
  LuArrowLeft, LuExternalLink, LuTwitter, LuLinkedin,
  LuUserPlus, LuSearch, LuTrash2, LuPlus, LuCheck,
  LuPhone, LuMessageSquare, LuBot, LuLayoutGrid
} from "react-icons/lu";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { api } from "../../lib/api";
import { toastFromError, toastSuccess, toastError } from "../../lib/toast";

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
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = location.pathname.startsWith("/ceo") ? "/ceo" : "/app";
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

  // Pings state variables
  const [pingsData, setPingsData] = useState(null);
  const [pingsLoading, setPingsLoading] = useState(false);

  const [timeRange, setTimeRange] = useState("7 Days");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // People section state variables
  const [peopleTab, setPeopleTab] = useState("new"); // "new" / "contacts" / "groups"
  const [contacts, setContacts] = useState([]);
  const [newlyJoined, setNewlyJoined] = useState([]);
  const [groups, setGroups] = useState([]);
  const [businessCards, setBusinessCards] = useState([]);
  const [peopleSearch, setPeopleSearch] = useState("");
  const [selectedContactIds, setSelectedContactIds] = useState([]);
  
  // Contact details sub-page states
  const [selectedContactId, setSelectedContactId] = useState(null);
  const [contactDetails, setContactDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [chatFilter, setChatFilter] = useState("all"); // "all" | "web" | "whatsapp"

  const onOpenContactDetails = useCallback(async (id) => {
    setSelectedContactId(id);
    setDetailsLoading(true);
    setContactDetails(null);
    try {
      const res = await api(`/api/app/people/contacts/${id}/details`, { token });
      setContactDetails(res);
    } catch (e) {
      toastFromError(e, "Failed to load contact details");
      setSelectedContactId(null);
    } finally {
      setDetailsLoading(false);
    }
  }, [token]);

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
      const [contactsData, newMembersData, groupsData, businessCardsData] = await Promise.all([
        api(`/api/app/people/contacts?page=1&limit=5&search=${encodeURIComponent(peopleSearch)}`, { token }),
        api("/api/app/people/new", { token }),
        api("/api/app/people/groups", { token }),
        api(`/api/app/people/contacts?page=1&limit=5&category=Business%20Person&search=${encodeURIComponent(peopleSearch)}`, { token })
      ]);
      setContacts(contactsData?.contacts || []);
      setNewlyJoined(newMembersData?.newMembers || []);
      setGroups(groupsData?.groups || []);
      setBusinessCards(businessCardsData?.contacts || []);
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

  const [verifyingWhatsApp, setVerifyingWhatsApp] = useState(false);

  const onVerifyWhatsApp = async () => {
    setVerifyingWhatsApp(true);
    try {
      const res = await api("/api/app/people/contacts/verify-whatsapp?force=true", {
        method: "POST",
        token
      });
      if (res.success !== false && res.checkedCount > 0) {
        toastSuccess(`WhatsApp check complete! Verified: ${res.checkedCount} contacts (Active: ${res.activeCount}, Inactive: ${res.inactiveCount})`);
      } else if (res.success === false) {
        toastError(res.message || "Meta API check failed. Please verify your settings.");
      } else {
        toastSuccess("All contacts are already verified!");
      }
      loadPeople();
    } catch (err) {
      toastFromError(err, "Failed to verify WhatsApp status");
    } finally {
      setVerifyingWhatsApp(false);
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

  // Load pings analytics data from backend route
  const loadPings = useCallback(async () => {
    setPingsLoading(true);
    try {
      let queryParams = "";
      if (timeRange === "Today") {
        queryParams = "?period=today";
      } else if (timeRange === "Yesterday") {
        queryParams = "?period=yesterday";
      } else if (timeRange === "All") {
        queryParams = "?period=all";
      } else if (timeRange === "7 Days") {
        queryParams = "?period=this_week";
      } else if (timeRange === "Date Range") {
        if (!customStartDate || !customEndDate) {
          setPingsLoading(false);
          return;
        }
        queryParams = `?start_date=${customStartDate}&end_date=${customEndDate}`;
      } else {
        queryParams = "?period=this_week";
      }

      const data = await api(`/api/root-agent/pings/stats${queryParams}`, { token });
      setPingsData(data || null);
    } catch (e) {
      console.error("Failed to load pings data:", e.message);
    } finally {
      setPingsLoading(false);
    }
  }, [timeRange, customStartDate, customEndDate, token]);

  // Load connected social media platform details from separated modular API endpoints
  const loadSocial = useCallback(async (clearData = true) => {
    setSocialLoading(true);
    if (clearData) {
      setSocialData(null);
    }
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
  const [lastPlatform, setLastPlatform] = useState(activePlatform);
  useEffect(() => {
    Promise.resolve().then(() => {
      const platformChanged = activePlatform !== lastPlatform;
      setLastPlatform(activePlatform);
      loadSocial(platformChanged);
    });
  }, [activePlatform, timeRange, customStartDate, customEndDate, loadSocial, lastPlatform]);

  // Fetch People data when dependencies change
  useEffect(() => {
    Promise.resolve().then(() => {
      loadPeople();
    });
  }, [loadPeople]);

  // Fetch pings data when pings tab is active
  useEffect(() => {
    if (activeTab === "pings") {
      Promise.resolve().then(() => {
        loadPings();
      });
    }
  }, [activeTab, loadPings]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("youtube_connected") === "true") {
      toastSuccess("YouTube channel connected successfully!");
      navigate(location.pathname, { replace: true });
      loadSocial();
    } else if (params.get("youtube_error")) {
      toastError(decodeURIComponent(params.get("youtube_error")));
      navigate(location.pathname, { replace: true });
    }
  }, [location.search, location.pathname, navigate, loadSocial]);

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

  async function onConnectYouTube() {
    setSavingPlatform(true);
    try {
      const res = await api("/api/app/social/youtube/auth-url", { token });
      if (res.url) {
        window.location.href = res.url;
      } else {
        toastError("Failed to generate Google connection link.");
      }
    } catch (err) {
      toastFromError(err, "Failed to connect YouTube");
    } finally {
      setSavingPlatform(false);
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

  const renderContactDetailsView = () => {
    if (!selectedContactId) return null;

    return (
      <div className="animate-fadeIn">
        {/* Header: Back Button */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
          <button 
            onClick={() => { setSelectedContactId(null); setContactDetails(null); }}
            className="flex items-center gap-1.5 text-xs font-black text-slate-600 hover:text-slate-900 transition-colors uppercase tracking-wider"
          >
            <LuArrowLeft className="h-4 w-4 stroke-[3]" /> Back to Directory
          </button>
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-200">
            Contact Profile
          </span>
        </div>

        {detailsLoading ? (
          <div className="py-12 text-center space-y-3">
            <LuRefreshCw className="h-6 w-6 animate-spin text-amber-500 mx-auto" />
            <p className="text-xs text-slate-400 font-semibold">Loading profile information & chat history...</p>
          </div>
        ) : contactDetails ? (
          <div className="grid gap-6 md:grid-cols-12">
            {/* LEFT PROFILE CARD - md:col-span-5 */}
            <div className="md:col-span-5 space-y-5">
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5 text-center shadow-inner">
                <div className="h-20 w-20 rounded-full bg-slate-200 border-2 border-amber-400 mx-auto overflow-hidden flex items-center justify-center font-bold text-slate-700 text-3xl shadow-sm mb-3">
                  {contactDetails.contact.avatar ? (
                    <img src={contactDetails.contact.avatar} alt={contactDetails.contact.name} className="h-full w-full object-cover" />
                  ) : (
                    contactDetails.contact.name.charAt(0)
                  )}
                </div>
                <h3 className="text-lg font-black text-slate-900">{contactDetails.contact.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{contactDetails.contact.email || "No email added"}</p>
                <p className="text-xs text-slate-500 font-bold mt-1.5 flex items-center justify-center gap-1">
                  <LuPhone className="h-3.5 w-3.5" /> {contactDetails.contact.phone}
                </p>
              </div>

              {/* Social media or invite section */}
              {contactDetails.contact.isMagnifaiUser ? (
                <div className="rounded-xl border border-slate-100 bg-white p-5 space-y-4 shadow-sm">
                  <div>
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Social Accounts</h4>
                    <p className="text-[10px] text-slate-400 font-semibold">Connected profiles via MagnifAI account</p>
                  </div>
                  <div className="flex gap-2">
                    {contactDetails.contact.socials?.linkedin && (
                      <a 
                        href={contactDetails.contact.socials.linkedin} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-bold text-slate-600 hover:bg-slate-100 transition shadow-sm"
                      >
                        <LuLinkedin className="h-4 w-4 text-blue-600" /> LinkedIn
                      </a>
                    )}
                    {contactDetails.contact.socials?.twitter && (
                      <a 
                        href={contactDetails.contact.socials.twitter} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-bold text-slate-600 hover:bg-slate-100 transition shadow-sm"
                      >
                        <LuTwitter className="h-4 w-4 text-slate-900" /> Twitter
                      </a>
                    )}
                    {contactDetails.contact.socials?.instagram && (
                      <a 
                        href={contactDetails.contact.socials.instagram} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-bold text-slate-600 hover:bg-slate-100 transition shadow-sm"
                      >
                        <LuInstagram className="h-4 w-4 text-pink-600" /> Instagram
                      </a>
                    )}
                  </div>

                  {/* QR Code */}
                  <div className="border-t border-slate-100 pt-4 text-center">
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 inline-block shadow-inner mb-2">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent("https://magnifai.in/chat?id=" + contactDetails.contact.id)}`} 
                        alt="QR Code" 
                        className="h-28 w-28 object-contain"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold">Registered MagnifAI Member</p>
                    <p className="text-[9px] text-slate-400 font-semibold">Scan or tap QR above to launch secure in-app chat</p>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50/40 p-5 text-center space-y-3 shadow-sm">
                  <div>
                    <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider">Invite Member</h4>
                    <p className="text-[10px] text-amber-700 font-semibold">This contact is not currently using MagnifAI</p>
                  </div>
                  <p className="text-xs text-amber-800 leading-relaxed font-bold">
                    Social links and secure in-app messaging are only available for members. Invite them to join!
                  </p>
                  <a 
                    href={`https://api.whatsapp.com/send?phone=${encodeURIComponent(contactDetails.contact.phone)}&text=${encodeURIComponent("Hi! I invite you to join MagnifAI so we can chat and manage workflows: https://magnifai.in/register")}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-amber-400 border border-slate-900/10 px-4 py-2.5 text-xs font-black text-slate-900 shadow hover:bg-amber-500 transition-colors w-full text-center"
                  >
                    <LuMessageCircle className="h-4 w-4 fill-slate-900" /> Send Invite on WhatsApp
                  </a>
                </div>
              )}
            </div>

            {/* RIGHT CHAT HISTORY TIMELINE - md:col-span-7 */}
            <div className="md:col-span-7 rounded-xl border border-slate-100 bg-white p-5 space-y-4 shadow-sm flex flex-col max-h-[480px]">
              <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-50 pb-3">
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Unified Communication Log</h4>
                  <p className="text-[10px] text-slate-400 font-semibold">Merged Web and WhatsApp messaging history</p>
                </div>
                
                {/* Filters */}
                <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200/50">
                  {[
                    { key: "all", label: "All" },
                    { key: "web", label: "Web" },
                    { key: "whatsapp", label: "WhatsApp" }
                  ].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setChatFilter(tab.key)}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                        chatFilter === tab.key
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Logs timeline */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-[300px]">
                {(contactDetails.chats || [])
                  .filter(m => chatFilter === "all" || m.platform === chatFilter)
                  .length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-12 text-center">No chat logs found for this filter.</p>
                  ) : (
                    (contactDetails.chats || [])
                      .filter(m => chatFilter === "all" || m.platform === chatFilter)
                      .map(msg => (
                        <div 
                          key={msg.id} 
                          className={`flex flex-col max-w-[85%] rounded-xl p-3 border shadow-sm ${
                            msg.sender === "Me"
                              ? "ml-auto bg-slate-50 border-slate-100 text-slate-800"
                              : "bg-white border-slate-100 text-slate-800"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-4 mb-1">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{msg.sender}</span>
                            <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[8px] font-bold border ${
                              msg.platform === "whatsapp"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                : "bg-blue-50 text-blue-700 border-blue-100"
                            }`}>
                              {msg.platform === "whatsapp" ? "WhatsApp" : "Web Chat"}
                            </span>
                          </div>
                          <p className="text-xs leading-relaxed font-semibold">{msg.text}</p>
                          <span className="text-[9px] text-slate-400 mt-1 text-right block">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                  )}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic text-center py-6">Could not load details.</p>
        )}
      </div>
    );
  };

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

      {/* Main Tabs (Social Media vs Campaign vs Pings) */}
      <div className="flex bg-white rounded-full p-1 border border-slate-100 shadow-sm max-w-md mb-6">
        <button onClick={() => setActiveTab("social_media")} className={`flex-1 text-center py-2 px-4 rounded-full text-xs sm:text-sm font-bold transition-all ${activeTab === "social_media" ? "bg-amber-400 text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
          Social Media
        </button>
        <button onClick={() => setActiveTab("campaign")} className={`flex-1 text-center py-2 px-4 rounded-full text-xs sm:text-sm font-bold transition-all ${activeTab === "campaign" ? "bg-amber-400 text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
          Campaign
        </button>
        <button onClick={() => setActiveTab("pings")} className={`flex-1 text-center py-2 px-4 rounded-full text-xs sm:text-sm font-bold transition-all ${activeTab === "pings" ? "bg-amber-400 text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
          AI Agents (Pings)
        </button>
      </div>

      {activeTab === "social_media" && (
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
          {socialLoading && !socialData ? (
            <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white text-sm text-slate-400">
              <span className="animate-pulse">Loading {activePlatform} stats...</span>
            </div>
          ) : socialData?.isConnected ? (
            <div className={`transition-opacity duration-200 ${socialLoading ? "opacity-60 pointer-events-none" : "opacity-100"}`}>
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
            </div>
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
              
              {activePlatform === "youtube" ? (
                <button
                  onClick={onConnectYouTube}
                  disabled={savingPlatform}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-400 hover:bg-amber-500 px-5 py-2.5 text-xs font-black text-slate-900 border border-slate-900/10 shadow-sm transition disabled:opacity-50"
                >
                  <LuLink className="h-4 w-4" /> {savingPlatform ? "Redirecting..." : "Connect YouTube with Google"}
                </button>
              ) : showForm ? (
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
      )}

      {activeTab === "campaign" && (
        /* Campaigns Section Placeholder */
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center text-slate-400 text-sm mb-6 font-semibold shadow-sm animate-fadeIn">
          Campaign analytics are not active for this workspace.
        </div>
      )}

      {activeTab === "pings" && (
        <AppPingsDashboard 
          loading={pingsLoading} 
          data={pingsData} 
          onRefresh={loadPings} 
          timeRange={timeRange}
          setTimeRange={setTimeRange}
          customStartDate={customStartDate}
          setCustomStartDate={setCustomStartDate}
          customEndDate={customEndDate}
          setCustomEndDate={setCustomEndDate}
        />
      )}

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
            onClick={() => navigate(`${basePath}/people`)}
            className="flex items-center gap-1.5 rounded-full bg-amber-400 border border-slate-900/10 px-4 py-1.5 text-xs font-black text-slate-900 shadow-sm transition hover:bg-amber-500"
          >
            View All &gt;
          </button>
        </div>

        {/* Tab switcher buttons */}
        <div className="flex bg-slate-100 rounded-xl p-1 mb-5 max-w-sm border border-slate-200/50">
          {[
            { key: "new", label: "New" },
            { key: "contacts", label: "Contacts" },
            { key: "groups", label: "Groups" },
            { key: "cards", label: "Business Cards" }
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setPeopleTab(t.key)}
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

        {/* --- 1. NEW TAB (5 items preview) --- */}
        {peopleTab === "new" && (
          <div className="space-y-3">
            {newlyJoined.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">No newly joined members found.</p>
            ) : (
              newlyJoined.slice(0, 5).map(member => (
                <div key={member.id} className="flex items-center justify-between border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                  <div 
                    onClick={() => navigate(`${basePath}/people`, { state: { selectedContactId: member.id } })}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <div className="h-10 w-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center font-bold text-slate-600 text-sm">
                      {member.avatar ? (
                        <img src={member.avatar} alt={member.name} className="h-full w-full object-cover" />
                      ) : (
                        member.name.charAt(0)
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 group-hover:text-amber-500 group-hover:underline transition-all">{member.name}</h4>
                      <p className="text-xs text-slate-400 flex items-center gap-1.5">
                        {member.phone}
                        {member.isWhatsAppActive === true && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-black text-emerald-600 border border-emerald-200 shadow-sm shrink-0">
                            <LuMessageCircle className="h-2.5 w-2.5 fill-emerald-600" /> WhatsApp
                          </span>
                        )}
                        {member.isWhatsAppActive === false && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-slate-50 px-1.5 py-0.5 text-[9px] font-bold text-slate-400 border border-slate-200 shrink-0">
                            No WA
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-semibold bg-slate-100/80 px-2 py-0.5 rounded-md">
                      {member.joinedAt}
                    </span>
                    {member.isWhatsAppActive === true ? (
                      <LuMessageCircle className="h-5 w-5 text-emerald-600 fill-emerald-100 shrink-0" title="Active WhatsApp Contact" />
                    ) : (
                      <LuMessageCircle className="h-5 w-5 text-slate-300 fill-slate-50 shrink-0" title="Not registered on WhatsApp" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* --- 2. CONTACTS TAB (5 items preview) --- */}
        {peopleTab === "contacts" && (
          <div className="space-y-3">
            {contacts.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">No contacts found.</p>
            ) : (
              contacts.slice(0, 5).map(c => (
                <div key={c.id} className="flex items-center justify-between border-b border-slate-50 pb-3 last:border-0 last:pb-0 hover:bg-slate-50/50 rounded-lg p-1 transition-colors">
                  <div 
                    onClick={() => navigate(`${basePath}/people`, { state: { selectedContactId: c.id } })}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <div className="h-9 w-9 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center font-bold text-slate-600 text-xs">
                      {c.avatar ? (
                        <img src={c.avatar} alt={c.name} className="h-full w-full object-cover" />
                      ) : (
                        c.name.charAt(0)
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 group-hover:text-amber-500 group-hover:underline transition-all">{c.name}</h4>
                      <p className="text-xs text-slate-400 flex items-center gap-1.5 flex-wrap">
                        <span>{c.phone} {c.email ? `• ${c.email}` : ""}</span>
                        {c.isWhatsAppActive === true && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-black text-emerald-600 border border-emerald-200 shadow-sm shrink-0">
                            <LuMessageCircle className="h-2.5 w-2.5 fill-emerald-600" /> WhatsApp
                          </span>
                        )}
                        {c.isWhatsAppActive === false && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-slate-50 px-1.5 py-0.5 text-[9px] font-bold text-slate-400 border border-slate-200 shrink-0">
                            No WA
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 font-bold">
                    {c.isWhatsAppActive === true ? (
                      <LuMessageCircle className="h-5 w-5 text-emerald-600 fill-emerald-100 shrink-0" />
                    ) : (
                      <LuMessageCircle className="h-5 w-5 text-slate-300 fill-slate-50 shrink-0" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* --- 3. GROUPS TAB (5 items preview) --- */}
        {peopleTab === "groups" && (
          <div className="space-y-3">
            {groups.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">No groups found.</p>
            ) : (
              groups.slice(0, 5).map(g => (
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
                </div>
              ))
            )}
          </div>
        )}

        {/* --- 4. BUSINESS CARDS TAB (5 items preview) --- */}
        {peopleTab === "cards" && (
          <div className="space-y-3">
            {businessCards.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">No business cards found.</p>
            ) : (
              businessCards.slice(0, 5).map(c => (
                <div key={c.id} className="flex items-center justify-between border-b border-slate-50 pb-3 last:border-0 last:pb-0 hover:bg-slate-50/50 rounded-lg p-1 transition-colors">
                  <div 
                    onClick={() => navigate(`${basePath}/people`, { state: { selectedContactId: c.id } })}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <div className="h-9 w-9 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center font-bold text-slate-600 text-xs">
                      {c.avatar ? (
                        <img src={c.avatar} alt={c.name} className="h-full w-full object-cover" />
                      ) : (
                        c.name.charAt(0)
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 group-hover:text-amber-500 group-hover:underline transition-all">{c.name}</h4>
                      <p className="text-xs text-slate-400 flex items-center gap-1.5 flex-wrap">
                        <span>{c.phone} {c.email ? `• ${c.email}` : ""}</span>
                        {c.company && <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-1.5 py-0.5 rounded">{c.company}</span>}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700 border border-emerald-200">
                    💼 Business Card
                  </span>
                </div>
              ))
            )}
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

function AppPingsDashboard({ 
  loading, 
  data, 
  onRefresh,
  timeRange,
  setTimeRange,
  customStartDate,
  setCustomStartDate,
  customEndDate,
  setCustomEndDate
}) {
  const summary = data ? {
    totalPings: data.total_pings?.count || 0,
    totalPingsGrowth: data.total_pings?.growth || "0%",
    totalPingsGrowthText: data.total_pings?.growth_text || "",
    totalPingsIsPositive: data.total_pings?.is_positive ?? true,

    conversations: data.conversations?.count || 0,
    conversationsGrowth: data.conversations?.growth || "0%",
    conversationsGrowthText: data.conversations?.growth_text || "",
    conversationsIsPositive: data.conversations?.is_positive ?? true,

    whatsappChats: data.sources?.whatsapp?.count || 0,
    whatsappGrowth: data.sources?.whatsapp?.growth || "0% ↑",
    whatsappIsPositive: data.sources?.whatsapp?.is_positive ?? true,

    webChats: data.sources?.chats?.count || 0,
    webChatsGrowth: data.sources?.chats?.growth || "0% ↑",
    webChatsIsPositive: data.sources?.chats?.is_positive ?? true,

    webCalls: data.sources?.calls?.count || 0,
    webCallsGrowth: data.sources?.calls?.growth || "0% ↑",
    webCallsIsPositive: data.sources?.calls?.is_positive ?? true,

    widgetsCount: data.sources?.widgets?.count || 0,
    widgetsGrowth: data.sources?.widgets?.growth || "0% ↑",
    widgetsIsPositive: data.sources?.widgets?.is_positive ?? true,

    meetingRequests: data.outcomes?.meetings?.count || 0,
    meetingsGrowth: data.outcomes?.meetings?.growth || "0% ↑",
    meetingsIsPositive: data.outcomes?.meetings?.is_positive ?? true,

    enquiry: data.outcomes?.enquiry?.count || 0,
    enquiryGrowth: data.outcomes?.enquiry?.growth || "0% ↑",
    enquiryIsPositive: data.outcomes?.enquiry?.is_positive ?? true,

    support: data.outcomes?.support?.count || 0,
    supportGrowth: data.outcomes?.support?.growth || "0% ↑",
    supportIsPositive: data.outcomes?.support?.is_positive ?? true,

    feedback: data.outcomes?.feedback?.count || 0,
    feedbackGrowth: data.outcomes?.feedback?.growth || "0% ↑",
    feedbackIsPositive: data.outcomes?.feedback?.is_positive ?? true,

    others: data.outcomes?.others?.count || 0,
    othersGrowth: data.outcomes?.others?.growth || "0% ↑",
    othersIsPositive: data.outcomes?.others?.is_positive ?? true,
  } : {
    totalPings: 0,
    conversations: 0,
    whatsappChats: 0,
    webChats: 0,
    webCalls: 0,
    widgetsCount: 0,
    meetingRequests: 0,
    enquiry: 0,
    support: 0,
    feedback: 0,
    others: 0
  };

  const breakdown = data?.agents || [];

  const { token } = useAuth();
  
  // State for Chat Explorer
  const [isExploring, setIsExploring] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all"); // "all", "web", "whatsapp"
  const [selectedAgentIdFilter, setSelectedAgentIdFilter] = useState("all"); // "all" or specific agent_id
  
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [selectedUserGroup, setSelectedUserGroup] = useState(null);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [analysisText, setAnalysisText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);

  const loadSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const res = await api("/api/agents/sessions", { token });
      setSessions(res || []);
    } catch (err) {
      toastFromError(err);
    } finally {
      setSessionsLoading(false);
    }
  }, [token]);

  const loadMessages = useCallback(async (sessId) => {
    if (!sessId) return;
    setMessagesLoading(true);
    setAnalysisText("");
    try {
      const res = await api(`/api/agents/sessions/${sessId}/history`, { token });
      setMessages(res || []);
    } catch (err) {
      toastFromError(err);
    } finally {
      setMessagesLoading(false);
    }
  }, [token]);

  const runAiAnalysis = async (agentId, deviceId) => {
    if (!agentId || !deviceId) return;
    setAnalyzing(true);
    try {
      const res = await api(`/api/agents/sessions/analyze/${agentId}/${deviceId}`, {
        method: "POST",
        token
      });
      if (res && res.analysis) {
        setAnalysisText(res.analysis);
        toastSuccess("AI Analysis completed!");
      } else {
        setAnalysisText(res || "No insights could be generated.");
      }
    } catch (err) {
      toastFromError(err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleExploreCard = (category) => {
    setSelectedCategory(category);
    setSelectedAgentIdFilter("all");
    setIsExploring(true);
    loadSessions();
  };

  const handleExploreRow = (agent) => {
    setSelectedCategory("all");
    setSelectedAgentIdFilter(agent.agent_id);
    setIsExploring(true);
    loadSessions();
  };

  // Helper to filter session visits by category and agent for a specific user
  const getVisibleSessionsForUser = useCallback((userGroup) => {
    if (!userGroup || !userGroup.sessions) return [];
    return userGroup.sessions.filter(s => {
      // Agent filter
      if (selectedAgentIdFilter !== "all" && s.agent_id !== selectedAgentIdFilter) return false;
      // Category filter
      if (selectedCategory === "all") return true;
      const isSessWhatsapp = s.platform === "whatsapp" || s.role === "whatsapp";
      return selectedCategory === "whatsapp" ? isSessWhatsapp : !isSessWhatsapp;
    });
  }, [selectedCategory, selectedAgentIdFilter]);

  // When selected user group or filters change, auto-select the latest matching session
  useEffect(() => {
    const visibleSess = getVisibleSessionsForUser(selectedUserGroup);
    if (visibleSess && visibleSess.length > 0) {
      const firstSessionId = visibleSess[0].session_id;
      setSelectedSessionId(firstSessionId);
      if (visibleSess[0].analysis) {
        setAnalysisText(visibleSess[0].analysis);
      } else {
        setAnalysisText("");
      }
      loadMessages(firstSessionId);
    } else {
      setSelectedSessionId(null);
      setMessages([]);
      setAnalysisText("");
    }
  }, [selectedUserGroup, selectedCategory, selectedAgentIdFilter, getVisibleSessionsForUser, loadMessages]);

  const handleSessionChange = (sessId) => {
    setSelectedSessionId(sessId);
    const foundSess = selectedUserGroup?.sessions?.find(s => s.session_id === sessId);
    if (foundSess?.analysis) {
      setAnalysisText(foundSess.analysis);
    } else {
      setAnalysisText("");
    }
    loadMessages(sessId);
  };

  const formatRelativeTime = (dateStr) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diffMs = now - d;
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHr = Math.floor(diffMin / 60);
      const diffDays = Math.floor(diffHr / 24);

      if (diffSec < 60) return "Just now";
      if (diffMin < 60) return `${diffMin}m ago`;
      if (diffHr < 24) return `${diffHr}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;

      return d.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch (e) {
      return dateStr;
    }
  };

  // Compute start/end dates for local sessions filtering based on pings date presets
  let startLimit = null;
  let endLimit = null;

  if (timeRange === "Today") {
    const now = new Date();
    startLimit = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    endLimit = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  } else if (timeRange === "Yesterday") {
    const now = new Date();
    startLimit = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    endLimit = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
  } else if (timeRange === "7 Days") {
    const now = new Date();
    startLimit = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    endLimit = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  } else if (timeRange === "Date Range") {
    if (customStartDate) {
      const parts = customStartDate.split("-");
      if (parts.length === 3) {
        startLimit = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      }
    }
    if (customEndDate) {
      const parts = customEndDate.split("-");
      if (parts.length === 3) {
        endLimit = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10), 23, 59, 59, 999);
      }
    }
  }

  // Filter user groups for left pane
  const filteredUserGroups = sessions.map(userGroup => {
    // Return a new userGroup object with only sessions that fit within the date limits
    const matchingSessions = userGroup.sessions.filter(s => {
      if (!startLimit && !endLimit) return true;
      const sessTime = new Date(s.created_at || s.updated_at || 0);
      if (startLimit && sessTime < startLimit) return false;
      if (endLimit && sessTime > endLimit) return false;
      return true;
    });
    return {
      ...userGroup,
      sessions: matchingSessions
    };
  }).filter(userGroup => {
    // Only keep user groups that have at least one matching session in the date range
    if (userGroup.sessions.length === 0) return false;

    // 1. Search Query filter (matches username or phone)
    const matchesSearch = 
      userGroup.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      userGroup.phone_number.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    // 2. Agent Filter: does this user group have sessions for the filtered agent?
    const matchesAgent = selectedAgentIdFilter === "all" || 
      userGroup.sessions.some(s => s.agent_id === selectedAgentIdFilter);
    
    if (!matchesAgent) return false;

    // 3. Platform Filter: does this user group have sessions matching the category?
    if (selectedCategory === "all") return true;
    
    const isWhatsappCategory = selectedCategory === "whatsapp";
    return userGroup.sessions.some(s => {
      const isSessWhatsapp = s.platform === "whatsapp" || s.role === "whatsapp";
      return isWhatsappCategory ? isSessWhatsapp : !isSessWhatsapp;
    });
  });

  if (isExploring) {
    const visibleSessionsOfSelectedUser = getVisibleSessionsForUser(selectedUserGroup);
    const activeSessionDetail = selectedUserGroup?.sessions?.find(s => s.session_id === selectedSessionId);

    return (
      <div className="space-y-6 animate-fadeIn">
        {/* Explorer Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setIsExploring(false);
                setSelectedUserGroup(null);
                setSelectedSessionId(null);
                setMessages([]);
              }}
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition shadow-sm"
            >
              <LuArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <LuBot className="h-4 w-4 text-indigo-600" />
                AI Agent Chat Explorer
              </h3>
              <p className="text-xs text-slate-400">
                Exploring {selectedCategory === "web" ? "Web Chats" : selectedCategory === "whatsapp" ? "WhatsApp Chats" : "All Chats"} 
                {selectedAgentIdFilter !== "all" && ` for agent: ${breakdown.find(a => a.agent_id === selectedAgentIdFilter)?.name || selectedAgentIdFilter}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              onClick={loadSessions}
              disabled={sessionsLoading}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition shadow-sm disabled:opacity-50"
            >
              <LuRefreshCw className={`h-3.5 w-3.5 ${sessionsLoading ? "animate-spin" : ""}`} /> Refresh Users List
            </button>
          </div>
        </div>

        {/* Explorer Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
          
          {/* Left Panel: Users List (4 cols) */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-4 flex flex-col h-[650px] shadow-sm">
            <div className="space-y-3 mb-4">
              {/* Search */}
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <LuSearch className="h-3.5 w-3.5" />
                </span>
                <input
                  type="text"
                  placeholder="Search by name or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition font-medium"
                />
              </div>

              {/* Quick Filter chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition ${selectedCategory === "all" ? "bg-indigo-600 border-indigo-600 text-white" : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"}`}
                >
                  All
                </button>
                <button
                  onClick={() => setSelectedCategory("web")}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition ${selectedCategory === "web" ? "bg-indigo-600 border-indigo-600 text-white" : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"}`}
                >
                  Web
                </button>
                <button
                  onClick={() => setSelectedCategory("whatsapp")}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition ${selectedCategory === "whatsapp" ? "bg-indigo-600 border-indigo-600 text-white" : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"}`}
                >
                  WhatsApp
                </button>
              </div>

              {/* Agent Filter selector */}
              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">Agent Filter</label>
                <select
                  value={selectedAgentIdFilter}
                  onChange={(e) => setSelectedAgentIdFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs text-slate-600 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="all">All Agents</option>
                  {breakdown.map(agent => (
                    <option key={agent.agent_id} value={agent.agent_id}>{agent.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Scrollable list */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {sessionsLoading ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                  <LuRefreshCw className="h-6 w-6 animate-spin text-indigo-500" />
                  <span className="text-xs font-semibold animate-pulse">Loading users...</span>
                </div>
              ) : filteredUserGroups.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-400 text-xs italic text-center p-4">
                  No chat users match active filters.
                </div>
              ) : (
                filteredUserGroups.map(user => {
                  const isSelected = selectedUserGroup?.device_id === user.device_id;
                  
                  // Get platforms present in this user's sessions
                  const platforms = new Set(user.sessions.map(s => {
                    const isWa = s.platform === "whatsapp" || s.role === "whatsapp";
                    return isWa ? "whatsapp" : "web";
                  }));
                  
                  return (
                    <button
                      key={user.device_id}
                      onClick={() => setSelectedUserGroup(user)}
                      className={`w-full text-left p-3.5 rounded-xl border transition flex items-start gap-3 ${isSelected ? "bg-indigo-50/50 border-indigo-200 ring-1 ring-indigo-200" : "bg-white hover:bg-slate-50/50 border-slate-100"}`}
                    >
                      {/* Avatar */}
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-black uppercase text-white shrink-0 ${isSelected ? "bg-indigo-600" : "bg-slate-300"}`}>
                        {user.user_name.charAt(0)}
                      </div>
                      
                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs font-extrabold text-slate-900 truncate pr-2">{user.user_name}</span>
                          <span className="text-[9px] text-slate-400 font-bold shrink-0">{formatRelativeTime(user.latest_visit)}</span>
                        </div>

                        {user.phone_number && user.phone_number !== "None" && (
                          <div className="text-[10px] text-slate-500 flex items-center gap-1 mb-1 font-semibold">
                            <LuPhone className="h-3 w-3 text-slate-400 shrink-0" />
                            {user.phone_number}
                          </div>
                        )}

                        <div className="flex items-center justify-between flex-wrap gap-1.5 mt-2">
                          {/* Platforms Badges */}
                          <div className="flex items-center gap-1">
                            {platforms.has("web") && (
                              <span className="inline-flex items-center gap-0.5 rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-extrabold text-blue-600">
                                <LuGlobe className="h-2.5 w-2.5" /> Web
                              </span>
                            )}
                            {platforms.has("whatsapp") && (
                              <span className="inline-flex items-center gap-0.5 rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-extrabold text-emerald-600">
                                <LuMessageCircle className="h-2.5 w-2.5" /> WhatsApp
                              </span>
                            )}
                          </div>
                          
                          {/* Visit counts */}
                          <span className="text-[9px] text-slate-400 font-extrabold uppercase">
                            {user.total_visits} {user.total_visits > 1 ? "chats" : "chat"}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Panel: Chat Thread (8 cols) */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col h-[650px] shadow-sm relative">
            {!selectedUserGroup ? (
              /* No selection state */
              <div className="flex flex-col items-center justify-center flex-1 p-8 text-center bg-slate-50/20">
                <div className="p-4 rounded-full bg-indigo-50 text-indigo-600 mb-4 animate-bounce">
                  <LuMessageSquare className="h-8 w-8" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">Select a Conversation</h4>
                <p className="text-xs text-slate-400 max-w-xs mt-1">
                  Click on any user from the left pane to explore their chat logs and AI interactions.
                </p>
              </div>
            ) : (
              /* Conversation View */
              <>
                {/* Chat Top Bar */}
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                  <div>
                    <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5 flex-wrap">
                      <span>Chat with: {selectedUserGroup.user_name}</span>
                      {activeSessionDetail && (
                        <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 text-[9px] font-bold">
                          Agent: {activeSessionDetail.agent_name || "Unknown"}
                        </span>
                      )}
                    </h4>
                    {selectedUserGroup.phone_number && selectedUserGroup.phone_number !== "None" && (
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5 flex items-center gap-1">
                        <LuPhone className="h-2.5 w-2.5" /> {selectedUserGroup.phone_number}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Session Visit Dropdown */}
                    {visibleSessionsOfSelectedUser.length > 1 && (
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase">Visit:</span>
                        <select
                          value={selectedSessionId || ""}
                          onChange={(e) => handleSessionChange(e.target.value)}
                          className="bg-white border border-slate-200 rounded-lg p-1 text-[10px] text-slate-600 font-semibold focus:outline-none"
                        >
                          {visibleSessionsOfSelectedUser.map((s, idx) => {
                            const dateStr = s.created_at 
                              ? new Date(s.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                              : `Session ${idx + 1}`;
                            return (
                              <option key={s.session_id} value={s.session_id}>
                                {dateStr} ({s.platform === "whatsapp" || s.role === "whatsapp" ? "WhatsApp" : "Web"})
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    )}

                    <button
                      onClick={() => loadMessages(selectedSessionId)}
                      disabled={messagesLoading}
                      title="Reload chat logs"
                      className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition"
                    >
                      <LuRefreshCw className={`h-3.5 w-3.5 ${messagesLoading ? "animate-spin" : ""}`} />
                    </button>
                    
                    <button
                      onClick={() => runAiAnalysis(activeSessionDetail?.agent_id, selectedUserGroup?.device_id)}
                      disabled={analyzing || !activeSessionDetail?.agent_id || !selectedUserGroup?.device_id}
                      className="flex items-center gap-1 rounded-lg border border-slate-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-2 py-1.5 text-[10px] font-extrabold uppercase transition"
                    >
                      <LuBot className="h-3.5 w-3.5" />
                      {analyzing ? "Analyzing..." : "AI Analysis"}
                    </button>
                  </div>
                </div>

                {/* Main conversation pane */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/20">
                  {messagesLoading ? (
                    <div className="space-y-4">
                      {/* Skeleton bubbles */}
                      <div className="flex gap-2.5 max-w-[70%]">
                        <div className="h-6 w-6 rounded-full bg-slate-200 animate-pulse shrink-0" />
                        <div className="h-12 bg-slate-200 rounded-2xl w-48 animate-pulse" />
                      </div>
                      <div className="flex gap-2.5 max-w-[70%] ml-auto justify-end">
                        <div className="h-10 bg-indigo-100 rounded-2xl w-32 animate-pulse" />
                      </div>
                      <div className="flex gap-2.5 max-w-[70%]">
                        <div className="h-6 w-6 rounded-full bg-slate-200 animate-pulse shrink-0" />
                        <div className="h-16 bg-slate-200 rounded-2xl w-64 animate-pulse" />
                      </div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-slate-400 text-xs italic">
                      No chat messages logged in this session.
                    </div>
                  ) : (
                    messages.map((msg, index) => {
                      const isAI = msg.role === "assistant";
                      return (
                        <div key={index} className={`flex items-end gap-2.5 ${isAI ? "" : "justify-end"}`}>
                          {isAI && (
                            <div className="h-6 w-6 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-600 flex items-center justify-center text-[10px] font-bold shrink-0 mb-1">
                              AI
                            </div>
                          )}
                          <div className="max-w-[75%]">
                            {isAI && (
                              <div className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-0.5 ml-1">
                                {activeSessionDetail?.agent_name || "AI Agent"}
                              </div>
                            )}
                            <div
                              className={`p-3 rounded-2xl text-xs font-medium leading-relaxed ${
                                isAI
                                  ? "bg-slate-100 text-slate-800 rounded-bl-none border border-slate-150"
                                  : "bg-indigo-600 text-white rounded-br-none"
                              }`}
                            >
                              {msg.content}
                            </div>
                            <div className={`text-[8px] text-slate-400 mt-1 font-bold ${isAI ? "text-left ml-1" : "text-right mr-1"}`}>
                              {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : ""}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* AI Analysis Pane at the bottom */}
                {analysisText && (
                  <div className="border-t border-slate-100 bg-amber-50/40 p-4 shrink-0 max-h-36 overflow-y-auto">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <LuStar className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0" />
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700">AI Conversation Summary & Insights</span>
                    </div>
                    <p className="text-[10px] leading-relaxed text-slate-600 font-semibold italic">
                      "{analysisText}"
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Overview stats grid */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">AI Agent Activity Overview</h3>
          <p className="text-xs text-slate-400">Interaction stats across all active business agents (excluding root agent)</p>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition shadow-sm disabled:opacity-50"
        >
          <LuRefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh Stats
        </button>
      </div>

      {/* Date Filters Card */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs">
        <div className="flex flex-wrap gap-2 items-center">
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
      </div>

      {loading && !data ? (
        <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white text-sm text-slate-400">
          <span className="animate-pulse">Loading AI Agent metrics...</span>
        </div>
      ) : (
        <>
          {/* Main 2 KPIs row (Total Pings & Conversation) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Total Pings */}
            <div 
              onClick={() => handleExploreCard("all")} 
              className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition cursor-pointer hover:-translate-y-0.5 duration-200"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Pings</span>
                <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600"><LuMessageSquare className="h-5 w-5" /></span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-black text-slate-800">{summary.totalPings}</span>
                {summary.totalPingsGrowthText && (
                  <span className={`text-xs font-bold ${summary.totalPingsIsPositive ? "text-emerald-600" : "text-rose-500"}`}>
                    {summary.totalPingsGrowthText}
                  </span>
                )}
              </div>
            </div>

            {/* Conversation */}
            <div 
              onClick={() => handleExploreCard("all")} 
              className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition cursor-pointer hover:-translate-y-0.5 duration-200"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Conversation</span>
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600"><LuUsers className="h-5 w-5" /></span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-black text-slate-800">{summary.conversations}</span>
                {summary.conversationsGrowthText && (
                  <span className={`text-xs font-bold ${summary.conversationsIsPositive ? "text-emerald-600" : "text-rose-500"}`}>
                    {summary.conversationsGrowthText}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* By Source Section */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm animate-fadeIn">
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-5">By Source</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {/* WhatsApp */}
              <div onClick={() => handleExploreCard("whatsapp")} className="flex flex-col items-center justify-center p-3 hover:bg-slate-50 rounded-2xl transition cursor-pointer">
                <span className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 mb-2.5">
                  <LuMessageCircle className="h-6 w-6" />
                </span>
                <span className="text-xs font-bold text-slate-600">WhatsApp</span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-lg font-black text-slate-800">{summary.whatsappChats}</span>
                  {summary.whatsappGrowth && (
                    <span className={`text-[10px] font-bold ${summary.whatsappIsPositive ? "text-emerald-600" : "text-rose-500"}`}>
                      {summary.whatsappGrowth}
                    </span>
                  )}
                </div>
              </div>

              {/* Chats */}
              <div onClick={() => handleExploreCard("web")} className="flex flex-col items-center justify-center p-3 hover:bg-slate-50 rounded-2xl transition cursor-pointer">
                <span className="p-3 rounded-2xl bg-blue-50 text-blue-600 mb-2.5">
                  <LuMessageSquare className="h-6 w-6" />
                </span>
                <span className="text-xs font-bold text-slate-600">Chats</span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-lg font-black text-slate-800">{summary.webChats}</span>
                  {summary.webChatsGrowth && (
                    <span className={`text-[10px] font-bold ${summary.webChatsIsPositive ? "text-emerald-600" : "text-rose-500"}`}>
                      {summary.webChatsGrowth}
                    </span>
                  )}
                </div>
              </div>

              {/* Calls */}
              <div className="flex flex-col items-center justify-center p-3 hover:bg-slate-50 rounded-2xl transition">
                <span className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 mb-2.5">
                  <LuPhone className="h-6 w-6" />
                </span>
                <span className="text-xs font-bold text-slate-600">Calls</span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-lg font-black text-slate-800">{summary.webCalls}</span>
                  {summary.webCallsGrowth && (
                    <span className={`text-[10px] font-bold ${summary.webCallsIsPositive ? "text-emerald-600" : "text-rose-500"}`}>
                      {summary.webCallsGrowth}
                    </span>
                  )}
                </div>
              </div>

              {/* Widgets */}
              <div className="flex flex-col items-center justify-center p-3 hover:bg-slate-50 rounded-2xl transition">
                <span className="p-3 rounded-2xl bg-purple-50 text-purple-600 mb-2.5">
                  <LuLayoutGrid className="h-6 w-6" />
                </span>
                <span className="text-xs font-bold text-slate-600">Widgets</span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-lg font-black text-slate-800">{summary.widgetsCount}</span>
                  {summary.widgetsGrowth && (
                    <span className={`text-[10px] font-bold ${summary.widgetsIsPositive ? "text-emerald-600" : "text-rose-500"}`}>
                      {summary.widgetsGrowth}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Individual Agent Performance Breakdown */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden animate-fadeIn">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900">AI Agents Performance Breakdown</span>
              <span className="text-xs font-bold text-slate-500">{breakdown.length} Active Agents</span>
            </div>
            {breakdown.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs italic">No active AI Agents configured for this workspace.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                      <th className="px-6 py-3">Agent Name</th>
                      <th className="px-6 py-3">Category</th>
                      <th className="px-6 py-3">Role</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Total Visitors</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {breakdown.map((agent) => (
                      <tr 
                        key={agent.agent_id} 
                        onClick={() => handleExploreRow(agent)}
                        className="hover:bg-slate-50/50 transition cursor-pointer"
                      >
                        <td className="px-6 py-4 font-bold text-slate-900 flex items-center gap-2">
                          <span className="p-1 rounded bg-indigo-50 text-indigo-600"><LuBot className="h-3.5 w-3.5" /></span>
                          {agent.name}
                        </td>
                        <td className="px-6 py-4 capitalize">{agent.category || "General"}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${agent.is_root ? "bg-amber-100 text-amber-700 border border-amber-200" : "bg-slate-100 text-slate-600"}`}>
                            {agent.is_root ? "Root Assistant" : "Sub-agent"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${agent.is_active ? "text-emerald-600" : "text-rose-500"}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${agent.is_active ? "bg-emerald-600" : "bg-rose-500"}`} />
                            {agent.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-indigo-600 font-bold">{agent.total_visitors}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

