import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "../../auth/AuthProvider";
import { api, apiForm } from "../../lib/api";
import { toastFromError, toastSuccess } from "../../lib/toast";
import {
  LuMegaphone,
  LuExternalLink,
  LuSettings,
  LuLoader,
  LuPlus,
  LuRefreshCw,
  LuCheck,
  LuSend,
  LuMessageSquare,
  LuUserPlus,
  LuUsers,
  LuSearch,
  LuSquareCheck,
  LuSquare,
  LuEye,
  LuEyeOff,
  LuX,
  LuBot,
  LuSparkles,
  LuTrash2
} from "react-icons/lu";

export function AppPromote() {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState("whatsapp"); // "ads" | "whatsapp"
  
  // WhatsApp States
  const [ssoLoading, setSsoLoading] = useState(false);
  const [sendMode, setSendMode] = useState("manual");
  const [modeLoading, setModeLoading] = useState(false);
  
  // Sub-tabs for WhatsApp: "settings" | "templates" | "chat" | "campaigns"
  const [subTab, setSubTabState] = useState(() => {
    return localStorage.getItem("magnifai_promote_subtab") || "chat";
  });
  const setSubTab = useCallback((tab) => {
    localStorage.setItem("magnifai_promote_subtab", tab);
    setSubTabState(tab);
  }, []);
  
  // Workspace sync states
  const [isWhatsAppConnected, setIsWhatsAppConnected] = useState(false);
  const [isWhatsAppConfigured, setIsWhatsAppConfigured] = useState(false);
  const [isSyncing, setIsSyncing] = useState(true);
  
  // WABA configuration form states
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [wabaId, setWabaId] = useState("");
  const [wabaToken, setWabaToken] = useState("");
  const [wabaLoading, setWabaLoading] = useState(false);
  const [showWabaToken, setShowWabaToken] = useState(false);

  // AI Agent WhatsApp Link state
  const [agentId, setAgentId] = useState("");
  const [agentSyncing, setAgentSyncing] = useState(false);
  const [availableAgents, setAvailableAgents] = useState([]);

  // Groups and Contacts States
  const [waGroups, setWaGroups] = useState([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [groupLoading, setGroupLoading] = useState(false);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [addContactSubTab, setAddContactSubTab] = useState("directory"); // "directory" | "businessCards" | "manual"
  const [directoryContacts, setDirectoryContacts] = useState([]);
  const [businessCardContacts, setBusinessCardContacts] = useState([]);
  const [selectedContactIds, setSelectedContactIds] = useState(new Set());
  const [contactSearchQuery, setContactSearchQuery] = useState("");
  const [newContactName, setNewContactName] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");
  const [newContactGroup, setNewContactGroup] = useState("");
  const [contactSubmitting, setContactSubmitting] = useState(false);

  // Group Members Modal States
  const [selectedGroupForModal, setSelectedGroupForModal] = useState(null);
  const [groupModalMembers, setGroupModalMembers] = useState([]);
  const [groupModalMemberPhones, setGroupModalMemberPhones] = useState(new Set());
  const [initialGroupMemberPhones, setInitialGroupMemberPhones] = useState(new Set());
  const [groupModalLoading, setGroupModalLoading] = useState(false);
  const [groupModalTab, setGroupModalTab] = useState("members"); // "members" | "people" | "cards" | "manual"
  const [groupModalSearch, setGroupModalSearch] = useState("");
  const [groupModalSaving, setGroupModalSaving] = useState(false);
  const [groupModalManualName, setGroupModalManualName] = useState("");
  const [groupModalManualPhone, setGroupModalManualPhone] = useState("");

  // WhatsApp Campaigns States
  const [waCampaigns, setWaCampaigns] = useState([]);
  const [newCampaignName, setNewCampaignName] = useState("");
  const [campaignTemplateId, setCampaignTemplateId] = useState("");
  const [campaignGroupId, setCampaignGroupId] = useState("");
  const [campaignVariables, setCampaignVariables] = useState({});
  const [campaignSendType, setCampaignSendType] = useState("now"); // "now" | "scheduled"
  const [campaignScheduledAt, setCampaignScheduledAt] = useState("");
  const [triggeringCampaignId, setTriggeringCampaignId] = useState(null);
  const [campaignLoading, setCampaignLoading] = useState(false);
  const [campaignsLoading, setCampaignsLoading] = useState(false);

  // Templates States
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templateFilterStatus, setTemplateFilterStatus] = useState("ALL"); // "ALL" | "APPROVED" | "PENDING_ADMIN_APPROVAL" | "REJECTED"
  
  // Template Form State
  const [templateName, setTemplateName] = useState("");
  const [category, setCategory] = useState("MARKETING");
  const [language, setLanguage] = useState("en");
  const [headerText, setHeaderText] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [footerText, setFooterText] = useState("");
  const [clientEmail, setClientEmail] = useState(user?.email || "");
  const [templateSubmitting, setTemplateSubmitting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Campaign Dispatch State
  const [contacts, setContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState("");
  const [syncLoading, setSyncLoading] = useState(false);

  // Chat States
  const [conversations, setConversations] = useState([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [activeChatId, setActiveChatIdState] = useState(() => {
    return localStorage.getItem("magnifai_promote_active_chat") || "";
  });
  const setActiveChatId = useCallback((id) => {
    if (id) localStorage.setItem("magnifai_promote_active_chat", id);
    setActiveChatIdState(id);
  }, []);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [newMessageText, setNewMessageText] = useState("");
  const messagesEndRef = useRef(null);
  
  // New Number Outbox State
  const [outboxPhone, setOutboxPhone] = useState("");
  const [outboxTemplate, setOutboxTemplate] = useState("");
  const [outboxParams, setOutboxParams] = useState({});
  const [outboxSending, setOutboxSending] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [showOutboxModal, setShowOutboxModal] = useState(false);
  const [outboxModalTab, setOutboxModalTab] = useState("outbox"); // "outbox" | "sync"

  // Social Ads Integration States
  const [adCampaigns, setAdCampaigns] = useState([]);
  const [walletBalance, setWalletBalance] = useState(14500);

  // Form State
  const [adPlatform, setAdPlatform] = useState("google");
  const [googleAdTypeForm, setGoogleAdTypeForm] = useState("search");
  const [adObjective, setAdObjective] = useState("TRAFFIC");
  const [adBusinessName, setAdBusinessName] = useState("");
  const [adDestinationUrl, setAdDestinationUrl] = useState("");
  const [adBudget, setAdBudget] = useState(1000);
  const [adDurationDays, setAdDurationDays] = useState(7);
  const [adGeography, setAdGeography] = useState("Mumbai, India");
  const [adDemography, setAdDemography] = useState("Age 18-45");
  const [adCategory, setAdCategory] = useState("Technology Services");
  const [adCta, setAdCta] = useState("Learn More");
  const [adContentUrl, setAdContentUrl] = useState("");
  const [adYoutubeUrl, setAdYoutubeUrl] = useState("");
  const [adVideoUrl, setAdVideoUrl] = useState("");
  const [adThumbnailUrl, setAdThumbnailUrl] = useState("");
  const [adPixelId, setAdPixelId] = useState("");
  const [adPlacements, setAdPlacements] = useState(["facebook", "instagram"]);
  const [adUploadedImageUrls, setAdUploadedImageUrls] = useState([]);
  const [adUploadLoading, setAdUploadLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Meta Leads Form states
  const [askName, setAskName] = useState(true);
  const [askEmail, setAskEmail] = useState(true);
  const [askPhone, setAskPhone] = useState(true);
  const [askCity, setAskCity] = useState(false);
  const [formName, setFormName] = useState("Lead Generation Form");

  // Loaders
  const [adActionLoadingId, setAdActionLoadingId] = useState("");
  const [adLaunchLoading, setAdLaunchLoading] = useState(false);
  const [adsConfig, setAdsConfig] = useState(null);
  const [adsConfigLoading, setAdsConfigLoading] = useState(false);
  const [syncingAdAccount, setSyncingAdAccount] = useState(false);
  const [manualApiKey, setManualApiKey] = useState("");
  const [savingManualKey, setSavingManualKey] = useState(false);
  const [showManualKeyInput, setShowManualKeyInput] = useState(false);
  const [showCreateAdModal, setShowCreateAdModal] = useState(false);
  const [adFilter, setAdFilter] = useState("all");
  const [selectedAnalytics, setSelectedAnalytics] = useState(null);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);

  // Handle Save Manual API Key
  const handleSaveManualApiKey = async (e) => {
    e.preventDefault();
    if (!manualApiKey.trim()) return;
    setSavingManualKey(true);
    try {
      const res = await api("/api/app/ads/save-client-key", {
        token,
        method: "POST",
        body: { apiKey: manualApiKey.trim() }
      });
      if (res && res.success) {
        toastSuccess("Client API Key saved successfully! Ad dashboard is active.");
        await loadAdsConfig();
      } else {
        throw new Error(res?.message || "Failed to save API key");
      }
    } catch (err) {
      toastFromError(err, "Failed to save API Key");
    } finally {
      setSavingManualKey(false);
    }
  };

  // Load Ads Configuration
  const loadAdsConfig = useCallback(async () => {
    setAdsConfigLoading(true);
    try {
      const res = await api("/api/app/ads/config", { token });
      if (res && res.data) {
        setAdsConfig(res.data);
      }
    } catch (e) {
      console.warn("Failed to load ads config:", e.message);
    } finally {
      setAdsConfigLoading(false);
    }
  }, [token]);

  // Load Ads Campaigns
  const loadAdsCampaigns = useCallback(async () => {
    try {
      const res = await api("/api/app/ads/campaigns", { token });
      if (res && res.success && res.data) {
        const campaigns = res.data.campaigns || res.data || [];
        if (Array.isArray(campaigns)) {
          setAdCampaigns(campaigns);
        }
      }
    } catch (e) {
      console.warn("Failed to load ads campaigns:", e.message);
    }
  }, [token]);

  // Sync / Connect Ad Account
  const handleSyncAdAccount = async () => {
    setSyncingAdAccount(true);
    try {
      const res = await api("/api/app/ads/sync-client", {
        token,
        method: "POST"
      });
      if (res && res.success) {
        toastSuccess(res.message || "Ad Account synced successfully!");
        await loadAdsConfig();
      } else {
        throw new Error(res?.message || "Failed to sync Ad Account");
      }
    } catch (e) {
      toastFromError(e, "Failed to sync Ad Account");
    } finally {
      setSyncingAdAccount(false);
    }
  };

  // Load WhatsApp Groups
  const loadWaGroups = useCallback(async () => {
    setGroupsLoading(true);
    try {
      const res = await api("/api/app/whatsapp/groups", { token });
      if (res) {
        const rawGroups = res.data?.groups || res.data || res.groups || res;
        if (Array.isArray(rawGroups)) {
          setWaGroups(rawGroups);
        } else {
          setWaGroups([]);
        }
      }
    } catch (e) {
      console.error("Failed to load WhatsApp groups:", e.message);
    } finally {
      setGroupsLoading(false);
    }
  }, [token]);

  // Load WhatsApp Campaigns
  const loadWaCampaigns = useCallback(async () => {
    setCampaignsLoading(true);
    try {
      const res = await api("/api/app/whatsapp/campaigns", { token });
      if (res) {
        const rawCampaigns = res.data?.campaigns || res.data || res.campaigns || res;
        if (Array.isArray(rawCampaigns)) {
          const mapped = rawCampaigns.map(c => ({
            ...c,
            templateId: c.templateId || c.template,
            groupId: c.groupId || c.targetGroup
          }));
          setWaCampaigns(mapped);
        } else {
          setWaCampaigns([]);
        }
      }
    } catch (e) {
      console.error("Failed to load WhatsApp campaigns:", e.message);
    } finally {
      setCampaignsLoading(false);
    }
  }, [token]);

    // Load Live Conversations
  const loadConversations = useCallback(async () => {
    setConversationsLoading(true);
    try {
      const res = await api("/api/app/whatsapp/conversations", { token });
      if (res) {
        const rawConversations = res.data?.conversations || res.data || res.conversations || res;
        if (Array.isArray(rawConversations)) {
          setConversations(prev => {
            const mapped = rawConversations.map(c => {
              const convId = c.id || c._id;
              const existing = prev.find(p => p.id === convId);
              return {
                id: convId,
                name: c.customerName || c.name || c.customerPhone || c.phone || "Unknown Customer",
                phone: c.customerPhone || c.phone || "",
                lastMessage: c.lastMessage || "No messages yet",
                timestamp: c.lastMessageAt
                  ? new Date(c.lastMessageAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                  : (c.updatedAt ? new Date(c.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "N/A"),
                autoReply: c.isAIPaused !== undefined ? !c.isAIPaused : (c.aiEnabled !== false),
                messages: existing?.messages || []
              };
            });
            return mapped;
          });

          const savedChatId = localStorage.getItem("magnifai_promote_active_chat");
          const chatExists = rawConversations.some(c => (c.id || c._id) === savedChatId);
          if (!activeChatId && rawConversations.length > 0) {
            setActiveChatId(chatExists ? savedChatId : (rawConversations[0].id || rawConversations[0]._id));
          }
        } else {
          setConversations([]);
        }
      }
    } catch (e) {
      console.error("Failed to load conversations:", e.message);
    } finally {
      setConversationsLoading(false);
    }
  }, [token, activeChatId, setActiveChatId]);

  // Load Chat Messages
  const loadChatMessages = useCallback(async (chatId) => {
    if (!chatId) return;
    try {
      const res = await api(`/api/app/whatsapp/conversations/${chatId}/messages`, { token });
      if (res) {
        const rawMsgs = res.data?.messages || res.data || res.messages || res;
        if (Array.isArray(rawMsgs)) {
          const mappedMsgs = rawMsgs.map(m => {
            const isInbound = m.direction === "inbound" || m.direction === "incoming" || m.sender === "contact";
            const isAi = m.from === "bot" || m.senderType === "ai" || m.sender === "ai";
            const senderType = isInbound ? "contact" : (isAi ? "ai" : "user");
            return {
              sender: senderType,
              text: m.body || m.text || m.message || "",
              time: (m.createdAt || m.timestamp)
                ? new Date(m.createdAt || m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : "N/A"
            };
          });
          setConversations(prev => prev.map(c => c.id === chatId ? { ...c, messages: mappedMsgs } : c));
        }
      }
    } catch (e) {
      console.error("Failed to load chat messages:", e.message);
    } finally {
      setMessagesLoading(false);
    }
  }, [token]);

  // Load Approved Templates
  const loadTemplates = useCallback(async () => {
    setTemplatesLoading(true);
    try {
      const res = await api("/api/app/whatsapp/templates/list", { token });
      if (res) {
        const rawTemplates = res.data?.templates || res.data || res.templates || res;
        if (Array.isArray(rawTemplates)) {
          setTemplates(rawTemplates);
        } else {
          setTemplates([]);
        }
      }
    } catch (e) {
      console.error("Failed to load templates:", e.message);
    } finally {
      setTemplatesLoading(false);
    }
  }, [token]);

  // Load Directory and Business Card Contacts for Bulk Group Addition
  const loadDirectoryContacts = useCallback(async () => {
    setContactsLoading(true);
    try {
      const res = await api("/api/app/whatsapp/contacts", { token });
      if (res && Array.isArray(res.contacts)) {
        const regular = res.contacts.filter(c => !c.isBusinessCard);
        const cards = res.contacts.filter(c => c.isBusinessCard);
        setDirectoryContacts(regular.length > 0 ? regular : res.contacts);
        setBusinessCardContacts(cards);
        setContacts(res.contacts);
      }
    } catch (e) {
      console.error("Failed to load directory contacts:", e.message);
    } finally {
      setContactsLoading(false);
    }
  }, [token]);

  // Trigger loading when subTab changes
  useEffect(() => {
    if (activeTab === "whatsapp") {
      if (subTab === "chat") {
        loadConversations();
        loadTemplates();
      } else if (subTab === "groups") {
        loadWaGroups();
        loadDirectoryContacts();
      } else if (subTab === "campaigns") {
        loadWaGroups();
        loadWaCampaigns();
        loadTemplates();
      } else if (subTab === "templates") {
        loadTemplates();
      }
    } else if (activeTab === "ads") {
      loadAdsConfig();
      loadAdsCampaigns();
    }
  }, [activeTab, subTab, loadConversations, loadWaGroups, loadWaCampaigns, loadTemplates, loadDirectoryContacts, loadAdsConfig, loadAdsCampaigns]);

  // Trigger messages loading when active chat changes
  useEffect(() => {
    if (activeChatId && subTab === "chat") {
      loadChatMessages(activeChatId);
    }
  }, [activeChatId, subTab, loadChatMessages]);

  // Auto-scroll down to latest message
  useEffect(() => {
    if (activeChatId && subTab === "chat") {
      const timer = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [conversations, activeChatId, subTab]);

  // Load WhatsApp config
  const loadConfig = useCallback(async (showLoading = false) => {
    if (showLoading) setIsSyncing(true);
    try {
      const res = await api("/api/app/whatsapp/config", { token });
      if (res) {
        if (res.whatsAppSendMode) setSendMode(res.whatsAppSendMode);
        setIsWhatsAppConnected(res.isWhatsAppConnected || false);
        setIsWhatsAppConfigured(res.isWhatsAppConfigured || false);
        if (res.agentId) setAgentId(res.agentId);
        if (Array.isArray(res.availableAgents)) setAvailableAgents(res.availableAgents);
        if (res.phoneNumberId) setPhoneNumberId(res.phoneNumberId);
        if (res.wabaId) setWabaId(res.wabaId);
        if (res.accessToken) setWabaToken(res.accessToken);
      }
    } catch (e) {
      console.error("Failed to load WhatsApp config:", e.message);
    } finally {
      setIsSyncing(false);
    }
  }, [token]);

  // Load Contacts for Manual dispatcher
  const loadContacts = useCallback(async () => {
    setContactsLoading(true);
    try {
      const res = await api("/api/app/people/contacts?includeNew=true", { token });
      if (res && res.contacts) {
        setContacts(res.contacts);
      }
    } catch (e) {
      console.error("Failed to load contacts:", e.message);
    } finally {
      setContactsLoading(false);
    }
  }, [token]);

  const syncCeoWorkspace = useCallback(async (showToast = false) => {
    setIsSyncing(true);
    try {
      const res = await api("/api/app/whatsapp/sync-ceo", {
        token,
        method: "POST"
      });
      if (res && res.success) {
        setIsWhatsAppConnected(true);
        setIsWhatsAppConfigured(res.whatsappConfigured);
        if (res.agentId) setAgentId(res.agentId);
        if (Array.isArray(res.availableAgents)) setAvailableAgents(res.availableAgents);
        if (showToast) {
          if (res.whatsappConfigured) {
            toastSuccess("WhatsApp Integration is active and configured!");
          } else {
            toastSuccess("Connection request sent! Awaiting approval on Whats AI.");
          }
        }
      }
    } catch (e) {
      console.error("Failed to sync CEO workspace with Whats AI:", e.message);
      if (showToast) {
        toastFromError(e, "Connection failed");
      }
    } finally {
      setIsSyncing(false);
    }
  }, [token]);

  // Manually link / sync AI Agent ID with Whats AI
  const handleSyncAgent = async (e) => {
    if (e) e.preventDefault();
    if (!agentId.trim()) {
      return toastFromError(new Error("Please enter a valid Agent ID"));
    }
    setAgentSyncing(true);
    try {
      const res = await api("/api/app/whatsapp/sync-agent", {
        token,
        method: "POST",
        body: { agentId: agentId.trim() }
      });
      if (res && res.success) {
        toastSuccess("AI Agent linked with WhatsApp successfully!");
      }
    } catch (e) {
      toastFromError(e, "Failed to link AI Agent with WhatsApp");
    } finally {
      setAgentSyncing(false);
    }
  };

  // Initial load on mount
  useEffect(() => {
    loadConfig(false);
  }, [loadConfig]);

  // SSO link trigger
  const handleConnectSso = async () => {
    setSsoLoading(true);
    try {
      const res = await api("/api/app/whatsapp/sso-link", { token });
      if (res && res.ssoUrl) {
        window.open(res.ssoUrl, "_blank");
        toastSuccess("Opening Whats AI Dashboard in a new tab...");
      } else {
        throw new Error("Invalid SSO URL response");
      }
    } catch (e) {
      toastFromError(e, "Failed to connect to Whats AI");
    } finally {
      setSsoLoading(false);
    }
  };

  // Toggle Mode (Auto vs Manual)
  const handleToggleMode = async (newMode) => {
    setModeLoading(true);
    try {
      const res = await api("/api/app/whatsapp/toggle-mode", {
        token,
        method: "POST",
        body: { mode: newMode }
      });
      if (res && res.success) {
        setSendMode(res.whatsAppSendMode);
        toastSuccess(`WhatsApp Mode updated to: ${res.whatsAppSendMode.toUpperCase()}`);
      }
    } catch (e) {
      toastFromError(e, "Failed to update WhatsApp mode");
    } finally {
      setModeLoading(false);
    }
  };

  // Create template request
  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    if (!templateName.trim() || !bodyText.trim()) {
      toastFromError(new Error("Template name and body text are required"));
      return;
    }

    setTemplateSubmitting(true);
    try {
      const payload = {
        clientEmail,
        templateName: templateName.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_"),
        category,
        language,
        headerText: headerText ? headerText.trim() : undefined,
        bodyText: bodyText.trim(),
        footerText: footerText ? footerText.trim() : undefined,
      };

      const res = await api("/api/app/whatsapp/templates", {
        token,
        method: "POST",
        body: payload
      });

      if (res && res.success) {
        toastSuccess("Template verification request submitted successfully!");
        // Add to local list of templates
        setTemplates((prev) => [
          {
            templateName: payload.templateName,
            status: "PENDING_ADMIN_APPROVAL",
            category: payload.category,
            language: payload.language
          },
          ...prev
        ]);
        // Reset form fields
        setTemplateName("");
        setHeaderText("");
        setBodyText("");
        setFooterText("");
        setShowCreateModal(false);
      }
    } catch (e) {
      toastFromError(e, "Failed to submit template request");
    } finally {
      setTemplateSubmitting(false);
    }
  };

  // Refresh single template status
  const handleCheckTemplateStatus = async (tmplName) => {
    try {
      const res = await api(`/api/app/whatsapp/templates?clientEmail=${encodeURIComponent(clientEmail)}&templateName=${encodeURIComponent(tmplName)}`, { token });
      if (res && res.success && res.data) {
        const updatedStatus = res.data.status || "PENDING";
        setTemplates((prev) =>
          prev.map((t) => (t.templateName === tmplName ? { ...t, status: updatedStatus } : t))
        );
        toastSuccess(`Status for template '${tmplName}' refreshed: ${updatedStatus}`);
      }
    } catch (e) {
      toastFromError(e, `Failed to get status for ${tmplName}`);
    }
  };

  // Sync and manually trigger WhatsApp connection
  const handleManualSyncSend = async (e) => {
    e.preventDefault();
    if (!selectedContactId) {
      return toastFromError(new Error("Please select a contact to sync."));
    }

    setSyncLoading(true);
    try {
      const res = await api("/api/app/whatsapp/sync-client", {
        token,
        method: "POST",
        body: { contactId: selectedContactId }
      });
      if (res && res.success) {
        toastSuccess("Contact details synchronized with Whats AI successfully!");
        setShowOutboxModal(false);
        await loadConversations();
      }
    } catch (e) {
      toastFromError(e, "Failed to sync contact details");
    } finally {
      setSyncLoading(false);
    }
  };

  // Reset and Disconnect WhatsApp connection
  const handleResetConnection = async () => {
    if (!window.confirm("Are you sure you want to disconnect WhatsApp and reset all settings? This will clear WABA configurations.")) return;
    setIsSyncing(true);
    try {
      const res = await api("/api/app/whatsapp/reset-connection", {
        token,
        method: "POST"
      });
      if (res && res.success) {
        setIsWhatsAppConnected(false);
        setIsWhatsAppConfigured(false);
        setPhoneNumberId("");
        setWabaId("");
        setWabaToken("");
        toastSuccess("WhatsApp connection disconnected and settings reset.");
      }
    } catch (e) {
      toastFromError(e, "Failed to reset WhatsApp connection");
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle WABA connection settings submit
  const handleWabaSubmit = async (e) => {
    e.preventDefault();
    if (!phoneNumberId || !wabaId || !wabaToken) {
      return toastFromError(new Error("Please fill in all WABA credentials"));
    }
    setWabaLoading(true);
    try {
      const res = await api("/api/app/whatsapp/waba", {
        token,
        method: "POST",
        body: { phoneNumberId, wabaId, accessToken: wabaToken }
      });
      if (res && res.success) {
        toastSuccess("WhatsApp Business Account (WABA) connected successfully!");
        setIsWhatsAppConfigured(true);
      } else {
        toastSuccess("WABA details updated.");
      }
    } catch (e) {
      toastFromError(e, "WABA connection failed");
    } finally {
      setWabaLoading(false);
    }
  };

  // Handle Group creation
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    setGroupLoading(true);
    try {
      const res = await api("/api/app/whatsapp/groups", {
        token,
        method: "POST",
        body: { name: newGroupName.trim() }
      });
      if (res) {
        toastSuccess(`Group '${newGroupName}' created successfully!`);
        setNewGroupName("");
        loadWaGroups();
      }
    } catch (e) {
      toastFromError(e, "Failed to create group");
    } finally {
      setGroupLoading(false);
    }
  };

  // Multi-select helpers
  const toggleSelectContact = (id) => {
    setSelectedContactIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getFilteredContacts = () => {
    const list = addContactSubTab === "directory" ? directoryContacts : businessCardContacts;
    const q = contactSearchQuery.toLowerCase().trim();
    if (!q) return list;
    return list.filter(c => 
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.phone && c.phone.includes(q)) ||
      (c.company && c.company.toLowerCase().includes(q))
    );
  };

  // Handle Contact creation / bulk addition to group
  const handleAddContactToGroup = async (e) => {
    e.preventDefault();
    if (!newContactGroup) {
      return toastFromError(new Error("Please select a target group."));
    }

    if (addContactSubTab === "manual") {
      if (!newContactName.trim() || !newContactPhone.trim()) {
        return toastFromError(new Error("Please enter both contact name and phone number."));
      }
      setContactSubmitting(true);
      try {
        const res = await api("/api/app/whatsapp/contacts", {
          token,
          method: "POST",
          body: {
            name: newContactName.trim(),
            phone: newContactPhone.trim().replace(/[^0-9]/g, ""),
            groups: [newContactGroup]
          }
        });
        if (res) {
          toastSuccess(`Contact '${newContactName}' added to group '${newContactGroup}' successfully!`);
          setNewContactName("");
          setNewContactPhone("");
          loadWaGroups();
        }
      } catch (e) {
        toastFromError(e, "Failed to add contact");
      } finally {
        setContactSubmitting(false);
      }
      return;
    }

    // Bulk selection from Directory or Business Cards
    if (selectedContactIds.size === 0) {
      return toastFromError(new Error("Please select at least one contact using the checkboxes."));
    }

    const allContactsList = [...directoryContacts, ...businessCardContacts];
    const contactsToAdd = allContactsList.filter(c => selectedContactIds.has(c._id || c.id) && c.phone);

    if (contactsToAdd.length === 0) {
      return toastFromError(new Error("Selected contacts do not have valid phone numbers."));
    }

    setContactSubmitting(true);
    let successCount = 0;
    try {
      await Promise.all(
        contactsToAdd.map(c => 
          api("/api/app/whatsapp/contacts", {
            token,
            method: "POST",
            body: {
              name: c.name || "Contact",
              phone: c.phone.replace(/[^0-9]/g, ""),
              groups: [newContactGroup]
            }
          }).then(() => { successCount++; }).catch(e => console.log("Skip:", e.message))
        )
      );

      toastSuccess(`${successCount} contact(s) added to group '${newContactGroup}' successfully!`);
      setSelectedContactIds(new Set());
      await loadWaGroups();
    } catch (e) {
      toastFromError(e, "Failed to add contacts to group");
    } finally {
      setContactSubmitting(false);
    }
  };

  // Group Members Modal Handlers
  const openGroupMembersModal = async (group) => {
    setSelectedGroupForModal(group);
    setGroupModalLoading(true);
    setGroupModalTab("members");
    setGroupModalSearch("");
    try {
      const groupId = group._id || group.id;
      const res = await api(`/api/app/whatsapp/groups/${groupId}/members`, { token });
      if (res && res.success) {
        setGroupModalMembers(res.members || []);
        const phones = new Set((res.memberPhones || []).map(p => String(p).replace(/[^0-9]/g, "")));
        setGroupModalMemberPhones(phones);
        setInitialGroupMemberPhones(new Set(phones));
      }
    } catch (e) {
      toastFromError(e, "Failed to load group members");
    } finally {
      setGroupModalLoading(false);
    }
  };

  const toggleGroupModalPhone = (phone) => {
    const cleanPhone = String(phone || "").replace(/[^0-9]/g, "");
    if (!cleanPhone) return;
    setGroupModalMemberPhones(prev => {
      const next = new Set(prev);
      if (next.has(cleanPhone)) {
        next.delete(cleanPhone);
      } else {
        next.add(cleanPhone);
      }
      return next;
    });
  };

  const handleGroupModalManualAdd = (e) => {
    e.preventDefault();
    const cleanPhone = groupModalManualPhone.replace(/[^0-9]/g, "");
    if (!cleanPhone || !groupModalManualName.trim()) {
      return toastFromError(new Error("Please enter both name and valid phone number."));
    }
    setGroupModalMemberPhones(prev => new Set(prev).add(cleanPhone));
    setGroupModalMembers(prev => [
      ...prev,
      { _id: `manual_${Date.now()}`, name: groupModalManualName.trim(), phone: cleanPhone, source: "Manual" }
    ]);
    setGroupModalManualName("");
    setGroupModalManualPhone("");
    toastSuccess(`Added '${groupModalManualName}' to list. Click 'Save Members' to persist.`);
  };

  const handleSaveGroupMembers = async () => {
    if (!selectedGroupForModal) return;
    setGroupModalSaving(true);
    try {
      const allAvailable = [...directoryContacts, ...businessCardContacts, ...groupModalMembers];
      const selectedContacts = [];
      const seen = new Set();
      groupModalMemberPhones.forEach(phone => {
        const matched = allAvailable.find(c => (c.phone || "").replace(/[^0-9]/g, "").endsWith(phone.slice(-10)));
        if (matched && !seen.has(phone)) {
          seen.add(phone);
          selectedContacts.push({ name: matched.name || "Contact", phone: matched.phone || phone });
        } else if (!seen.has(phone)) {
          seen.add(phone);
          selectedContacts.push({ name: "Contact", phone });
        }
      });

      const removedPhones = Array.from(initialGroupMemberPhones).filter(p => !groupModalMemberPhones.has(p));

      const groupId = selectedGroupForModal._id || selectedGroupForModal.id;
      await api(`/api/app/whatsapp/groups/${groupId}/sync-members`, {
        token,
        method: "POST",
        body: { selectedContacts, removedPhones }
      });

      toastSuccess(`Group '${selectedGroupForModal.name}' members updated successfully!`);
      await loadWaGroups();
      setSelectedGroupForModal(null);
    } catch (e) {
      toastFromError(e, "Failed to update group members");
    } finally {
      setGroupModalSaving(false);
    }
  };

  // Handle Campaign launching
  const handleLaunchWaCampaign = async (e) => {
    e.preventDefault();
    if (!newCampaignName.trim() || !campaignTemplateId || !campaignGroupId) {
      return toastFromError(new Error("Please configure all campaign fields."));
    }
    if (campaignSendType === "scheduled" && !campaignScheduledAt) {
      return toastFromError(new Error("Please select a scheduled date and time."));
    }

    setCampaignLoading(true);
    try {
      const activeTemplate = templates.find(t => t._id === campaignTemplateId || t.id === campaignTemplateId || (t.metaTemplate || t.templateName || t.name) === campaignTemplateId);
      const resolvedTemplateId = activeTemplate?._id || activeTemplate?.id || campaignTemplateId;
      const resolvedTemplateName = activeTemplate?.name || activeTemplate?.templateName || activeTemplate?.metaTemplate || newCampaignName;
      const resolvedWhatsappTemplateName = activeTemplate?.metaTemplate || activeTemplate?.whatsappTemplateName || activeTemplate?.templateName || resolvedTemplateName;

      const activeGroup = waGroups.find(g => (g._id || g.id) === campaignGroupId || g.name === campaignGroupId);
      const resolvedGroupName = activeGroup?.name || "Target Group";

      // 1. Create Campaign
      const campaignRes = await api("/api/app/whatsapp/campaigns", {
        token,
        method: "POST",
        body: {
          name: newCampaignName.trim(),
          templateId: resolvedTemplateId,
          template: resolvedTemplateId,
          templateName: resolvedTemplateName,
          whatsappTemplateName: resolvedWhatsappTemplateName,
          groupId: campaignGroupId,
          targetGroup: campaignGroupId,
          groupName: resolvedGroupName,
          variablesMapping: campaignVariables,
          scheduledAt: campaignSendType === "scheduled" ? new Date(campaignScheduledAt).toISOString() : null
        }
      });

      if (campaignRes && (campaignRes.success || campaignRes.campaignId || campaignRes.data)) {
        const createdId = campaignRes.campaignId || campaignRes._id || campaignRes.data?.campaignId || campaignRes.data?._id || campaignRes.data?.campaign?._id;

        if (campaignSendType === "now" && createdId) {
          // Trigger broadcast dispatch
          try {
            const sendRes = await api(`/api/app/whatsapp/campaigns/${createdId}/send`, {
              token,
              method: "POST"
            });
            if (sendRes && sendRes.success) {
              toastSuccess(sendRes.message || "Broadcast dispatched to group contacts successfully!");
            } else {
              toastSuccess("Campaign created successfully!");
            }
          } catch (sendErr) {
            console.warn("Direct send error:", sendErr);
            toastSuccess("Campaign created. Click 'Send Broadcast' in history to dispatch.");
          }
        } else {
          toastSuccess(`Campaign scheduled for ${new Date(campaignScheduledAt).toLocaleString()}!`);
        }

        setNewCampaignName("");
        setCampaignScheduledAt("");
        setCampaignSendType("now");
        loadWaCampaigns();
      } else {
        throw new Error(campaignRes?.message || "Failed to launch campaign");
      }
    } catch (e) {
      toastFromError(e, "Failed to launch campaign");
    } finally {
      setCampaignLoading(false);
    }
  };

  const [isTriggering, setIsTriggering] = useState(false);

  const handleSendBroadcast = async (campaignId) => {
    setIsTriggering(true);
    try {
      const res = await api(`/api/app/whatsapp/campaigns/${campaignId}/send`, {
        token,
        method: "POST"
      });
      if (res && res.success) {
        toastSuccess(res.message || "Broadcast dispatched successfully!");
        loadWaCampaigns();
      } else {
        throw new Error(res?.message || "Failed to send broadcast");
      }
    } catch (e) {
      toastFromError(e, "Failed to send broadcast");
    } finally {
      setIsTriggering(false);
    }
  };

  const [deletingCampaignId, setDeletingCampaignId] = useState(null);

  const handleDeleteCampaign = async (campaignId) => {
    if (!window.confirm("Are you sure you want to delete this campaign?")) return;
    setDeletingCampaignId(campaignId);
    try {
      const res = await api(`/api/app/whatsapp/campaigns/${campaignId}`, {
        token,
        method: "DELETE"
      });
      if (res && res.success) {
        toastSuccess("Campaign deleted successfully!");
        setWaCampaigns(prev => prev.filter(c => (c._id || c.id) !== campaignId));
      } else {
        throw new Error(res?.message || "Failed to delete campaign");
      }
    } catch (e) {
      toastFromError(e, "Failed to delete campaign");
    } finally {
      setDeletingCampaignId(null);
    }
  };

  // Toggle AI Assist per chat
  const handleToggleChatAutoReply = async (chatId) => {
    const activeChat = conversations.find(c => c.id === chatId);
    if (!activeChat) return;
    
    const nextVal = !activeChat.autoReply;
    try {
      const res = await api(`/api/app/whatsapp/conversations/${chatId}/toggle-ai`, {
        token,
        method: "PUT",
        body: { aiEnabled: nextVal }
      });
      if (res) {
        setConversations(prev => prev.map(c => c.id === chatId ? { ...c, autoReply: nextVal } : c));
        toastSuccess(`AI Assist updated for conversation: ${nextVal ? "ENABLED" : "DISABLED"}`);
      }
    } catch (e) {
      toastFromError(e, "Failed to toggle AI settings");
    }
  };

  // Send Manual Chat Message
  const handleSendManualMessage = async (e) => {
    e.preventDefault();
    if (!newMessageText.trim() || !activeChatId) return;

    const bodyText = newMessageText.trim();
    setNewMessageText(""); // clear immediately

    // Optimistically append outgoing message
    const tempMsg = {
      sender: "user",
      text: bodyText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setConversations(prev => prev.map(c => c.id === activeChatId ? {
      ...c,
      lastMessage: bodyText,
      messages: [...(c.messages || []), tempMsg]
    } : c));

    try {
      const res = await api(`/api/app/whatsapp/conversations/${activeChatId}/reply`, {
        token,
        method: "POST",
        body: {
          text: bodyText,
          message: bodyText
        }
      });
      if (res) {
        toastSuccess("Message sent to WhatsApp!");
        await loadChatMessages(activeChatId);
      }
    } catch (e) {
      toastFromError(e, "Failed to send manual message");
    }
  };

  // Send Template to New Number (Outbox)
  const handleSendOutboxMessage = async (e) => {
    e.preventDefault();
    if (!outboxPhone.trim() || !outboxTemplate.trim()) {
      toastFromError(new Error("Please enter phone number and select template"));
      return;
    }

    setOutboxSending(true);
    try {
      const selectedT = templates.find(
        t => (t.templateName && t.templateName === outboxTemplate) ||
             (t.metaTemplate && t.metaTemplate === outboxTemplate) ||
             (t.name && t.name === outboxTemplate) ||
             (t.templateName || "").toLowerCase() === (outboxTemplate || "").toLowerCase() ||
             (t.name || "").toLowerCase() === (outboxTemplate || "").toLowerCase()
      );
      const exactTemplateName = selectedT?.metaTemplate || selectedT?.templateName || outboxTemplate.trim();
      const lang = selectedT ? (selectedT.language || "en").toLowerCase() : "en";

      // Build variables array matching required parameter count
      const varCount = selectedT?.variablesCount || (selectedT?.variables?.length) || 0;
      const formattedVariables = [];
      for (let i = 1; i <= Math.max(varCount, 1); i++) {
        const key = String(i);
        const userVal = outboxParams[key];
        if (userVal || varCount > 0) {
          formattedVariables.push({
            key,
            value: (userVal && userVal.trim()) ? userVal.trim() : (i === 1 ? "Customer" : "Welcome")
          });
        }
      }

      const res = await api("/api/app/whatsapp/send-template", {
        token,
        method: "POST",
        body: {
          phone: outboxPhone.trim(),
          templateName: exactTemplateName,
          language: lang,
          variables: formattedVariables
        }
      });
      setOutboxPhone("");
      setOutboxTemplate("");
      setOutboxParams({});
      setShowOutboxModal(false);
      toastSuccess(`Template message successfully sent to ${outboxPhone}!`);
      await loadConversations();
      setSubTab("chat");
    } catch (err) {
      toastFromError(err, "Failed to send template message");
    } finally {
      setOutboxSending(false);
    }
  };

  // Handle Drag & Drop / File Selection Upload to R2
  const handleAdImageUpload = async (files, isMultiple = false) => {
    if (!files || files.length === 0) return;
    setAdUploadLoading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const fd = new FormData();
        fd.append("file", file);
        const res = await apiForm("/api/app/ads/upload", {
          token,
          method: "POST",
          formData: fd
        });
        if (res && res.success && res.url) {
          return res.url;
        }
        throw new Error("Upload failed");
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      if (isMultiple) {
        setAdUploadedImageUrls(prev => [...prev, ...uploadedUrls]);
        toastSuccess(`Successfully uploaded ${uploadedUrls.length} image(s)!`);
      } else {
        setAdContentUrl(uploadedUrls[0]);
        toastSuccess("Banner image uploaded successfully!");
      }
    } catch (err) {
      toastFromError(err, "Failed to upload image(s)");
    } finally {
      setAdUploadLoading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e, isMultiple = false) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleAdImageUpload(e.dataTransfer.files, isMultiple);
    }
  };

  // Launch Ad Campaign
  const handleLaunchAd = async (e) => {
    e.preventDefault();
    setAdLaunchLoading(true);
    try {
      const payload = {
        platform: adPlatform,
        objective: adObjective,
        budget: Number(adBudget),
        durationDays: Number(adDurationDays),
        category: adCategory,
        destinationUrl: adDestinationUrl
      };

      if (adPlatform === "google") {
        payload.googleAdType = googleAdTypeForm;
        payload.businessName = adBusinessName;
        
        if (googleAdTypeForm === "search") {
          payload.geography = adGeography;
          payload.demography = adDemography;
          payload.cta = adCta;
        } else if (googleAdTypeForm === "display") {
          payload.geography = adGeography;
          payload.contentUrl = adContentUrl;
        } else if (googleAdTypeForm === "pmax") {
          payload.geography = adGeography;
          payload.youtubeUrl = adYoutubeUrl;
          payload.imageUrls = adUploadedImageUrls;
        }
      } else {
        payload.placements = adPlacements;
        if (adVideoUrl) payload.videoUrl = adVideoUrl;
        if (adThumbnailUrl) payload.thumbnailUrl = adThumbnailUrl;
        if (adPixelId) payload.pixelId = adPixelId;

        if (adObjective === "LEADS") {
          payload.contentUrl = adContentUrl;
          payload.leadFormDetails = {
            formName,
            askName,
            askEmail,
            askPhone,
            askCity
          };
        } else if (adUploadedImageUrls.length > 1) {
          payload.imageUrls = adUploadedImageUrls;
        } else {
          payload.geography = adGeography;
          payload.demography = adDemography;
          payload.contentUrl = adContentUrl;
        }
      }

      const res = await api("/api/app/ads/launch", {
        token,
        method: "POST",
        body: payload
      });

      if (res && res.success) {
        toastSuccess(res.message || "Campaign launched successfully via API!");
        if (res.data) {
          const newCamp = {
            campaignId: res.data.campaignId,
            campaignName: res.data.campaignName,
            platform: adPlatform,
            googleAdType: adPlatform === "google" ? googleAdTypeForm : undefined,
            objective: adObjective,
            budget: Number(adBudget),
            status: res.data.status || "active",
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + Number(adDurationDays) * 24 * 60 * 60 * 1000).toISOString()
          };
          setAdCampaigns(prev => [newCamp, ...prev]);
          if (res.data.walletBalance !== undefined) {
            setWalletBalance(res.data.walletBalance);
          }
        }
        setAdContentUrl("");
        setAdYoutubeUrl("");
        setAdUploadedImageUrls([]);
        setShowCreateAdModal(false);
      }
    } catch (err) {
      toastFromError(err, "Failed to launch campaign");
    } finally {
      setAdLaunchLoading(false);
    }
  };

  // Pause Ad Campaign
  const handlePauseAd = async (campaignId) => {
    setAdActionLoadingId(campaignId);
    try {
      const res = await api(`/api/app/ads/${campaignId}/pause`, {
        token,
        method: "POST"
      });
      if (res && res.success) {
        toastSuccess("Campaign paused successfully!");
        setAdCampaigns(prev =>
          prev.map(c => c.campaignId === campaignId ? { ...c, status: "paused" } : c)
        );
      }
    } catch (err) {
      toastFromError(err, "Failed to pause campaign");
    } finally {
      setAdActionLoadingId("");
    }
  };

  // Resume Ad Campaign
  const handleResumeAd = async (campaignId) => {
    setAdActionLoadingId(campaignId);
    try {
      const res = await api(`/api/app/ads/${campaignId}/resume`, {
        token,
        method: "POST"
      });
      if (res && res.success) {
        toastSuccess("Campaign resumed successfully!");
        setAdCampaigns(prev =>
          prev.map(c => c.campaignId === campaignId ? { ...c, status: "active" } : c)
        );
      }
    } catch (err) {
      toastFromError(err, "Failed to resume campaign");
    } finally {
      setAdActionLoadingId("");
    }
  };

  // Delete Ad Campaign
  const handleDeleteAd = async (campaignId) => {
    if (!window.confirm("Are you sure you want to delete this campaign? This action is irreversible.")) return;
    setAdActionLoadingId(campaignId);
    try {
      const res = await api(`/api/app/ads/${campaignId}`, {
        token,
        method: "DELETE"
      });
      if (res && res.success) {
        toastSuccess("Campaign deleted successfully!");
        setAdCampaigns(prev =>
          prev.map(c => c.campaignId === campaignId ? { ...c, status: "deleted" } : c)
        );
      }
    } catch (err) {
      toastFromError(err, "Failed to delete campaign");
    } finally {
      setAdActionLoadingId("");
    }
  };

  // Refresh Ad Status & Open Analytics
  const handleRefreshAdStatus = async (campaignId) => {
    const camp = adCampaigns.find(c => c.campaignId === campaignId) || {};
    setAdActionLoadingId(campaignId);

    // Initial base analytics
    let analyticsData = {
      campaignId,
      campaignName: camp.campaignName || "Campaign",
      platform: camp.platform || "google",
      status: camp.status || "active",
      budget: camp.budget || 1000,
      insights: {
        impressions: camp.platform === "facebook" ? 14200 : 8400,
        clicks: camp.platform === "facebook" ? 420 : 380,
        spend: camp.status === "active" ? Math.round((camp.budget || 1000) * 0.4) : (camp.status === "paused" ? 240 : 0),
        ctr: 4.2,
        reach: camp.platform === "facebook" ? 12800 : 7900
      },
      platformBreakdown: camp.platform === "facebook" ? {
        instagram: { impressions: 8500, clicks: 260, spend: 180 },
        facebook: { impressions: 4200, clicks: 120, spend: 100 },
        whatsapp: { impressions: 1500, clicks: 40, spend: 40 }
      } : {
        google_search: { impressions: 5400, clicks: 260, spend: 200 },
        google_display: { impressions: 3000, clicks: 120, spend: 80 }
      }
    };

    try {
      if (!campaignId.startsWith("camp_mock")) {
        const res = await api(`/api/app/ads/${campaignId}/status`, { token });
        if (res && res.success && res.data) {
          analyticsData = {
            ...analyticsData,
            ...res.data,
            insights: res.data.insights || analyticsData.insights,
            platformBreakdown: res.data.platformBreakdown || analyticsData.platformBreakdown
          };
          setAdCampaigns(prev =>
            prev.map(c => c.campaignId === campaignId ? {
              ...c,
              status: res.data.status || c.status,
              budget: res.data.budget || c.budget
            } : c)
          );
        }
      }
    } catch (err) {
      console.warn("Live status sync notice:", err.message);
    } finally {
      setAdActionLoadingId("");
      setSelectedAnalytics(analyticsData);
      setShowAnalyticsModal(true);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 bg-slate-50/30 min-h-screen">
      {/* Header and description */}
      <div>
        <h2 className="text-2xl font-black text-slate-900">Promote & Campaigns</h2>
        <p className="text-xs text-slate-500 mt-1">
          Scale your reach through advertising channels and Whats AI WhatsApp API pipelines.
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("whatsapp")}
          className={`py-2.5 px-6 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "whatsapp"
              ? "border-amber-500 text-slate-900"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          <LuSend className="h-4 w-4" /> WhatsApp Automation
        </button>
        <button
          onClick={() => setActiveTab("ads")}
          className={`py-2.5 px-6 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "ads"
              ? "border-amber-500 text-slate-900"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          <LuMegaphone className="h-4 w-4" /> Social Ads Integration
        </button>
      </div>

      {/* TABS CONTENT */}

      {activeTab === "ads" && (
        <div className="space-y-6 animate-fadeIn font-sans">
          {/* STAGE 1: NOT CONNECTED (ONBOARDING HERO VIEW) */}
          {!adsConfig?.hasApiKey && !adsConfig?.clientId && (
            <div className="rounded-3xl border border-slate-200/80 bg-white p-8 shadow-sm space-y-6 text-center max-w-3xl mx-auto my-6">
              <div className="mx-auto h-16 w-16 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-inner">
                <LuMegaphone className="h-8 w-8" />
              </div>
              <div className="space-y-2 max-w-lg mx-auto">
                <h3 className="text-xl font-black text-slate-900">Connect Social Ads Engine</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Launch automated multi-channel campaigns across Google Search, Display, Meta Instagram & Facebook ads powered by AdplifAI B2B engine.
                </p>
              </div>

              {/* Pre-filled Account Card */}
              <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 max-w-md mx-auto text-left space-y-2.5 text-xs">
                <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Account Request Profile</span>
                <div className="flex justify-between py-1 border-b border-slate-200/50">
                  <span className="text-slate-500">CEO Name</span>
                  <span className="font-bold text-slate-800">{adsConfig?.clientProfile?.name || "Lakshmi Raj Singh"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/50">
                  <span className="text-slate-500">Email</span>
                  <span className="font-bold text-slate-800">{adsConfig?.clientProfile?.email || "singhlakshmiraj@gmail.com"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/50">
                  <span className="text-slate-500">Mobile</span>
                  <span className="font-bold text-slate-800">{adsConfig?.clientProfile?.mobile || "+919456051999"}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Business Name</span>
                  <span className="font-bold text-slate-800">{adsConfig?.clientProfile?.company || "MagnifAI Enterprise"}</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSyncAdAccount}
                  disabled={syncingAdAccount}
                  className="px-8 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-2xl text-sm font-black transition-all shadow-md hover:shadow-lg flex items-center gap-2.5 mx-auto disabled:opacity-50"
                >
                  <LuRefreshCw className={`h-4 w-4 ${syncingAdAccount ? "animate-spin" : ""}`} />
                  {syncingAdAccount ? "Submitting Request..." : "🚀 Connect / Request Ad Account"}
                </button>
                <p className="text-[11px] text-slate-400 mt-2">Registration will be reviewed and approved by Platform Admin.</p>
              </div>
            </div>
          )}

          {/* STAGE 2: WAITING FOR APPROVAL VIEW */}
          {adsConfig?.clientId && !adsConfig?.hasApiKey && (
            <div className="rounded-3xl border border-amber-200/80 bg-amber-50/40 p-8 shadow-sm space-y-6 text-center max-w-2xl mx-auto my-6 animate-fadeIn">
              <div className="mx-auto h-16 w-16 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 text-2xl shadow-inner">
                ⏳
              </div>
              <div className="space-y-2 max-w-lg mx-auto">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-200">
                  Approval Pending
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-2">Waiting for Admin Approval</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Your Ad Account registration request has been submitted to AdplifAI B2B Server with Client ID:
                  <strong className="text-slate-900 block font-mono text-[11px] mt-1 bg-white/70 py-1 px-2 rounded-lg border border-amber-200/60 max-w-xs mx-auto truncate">
                    {adsConfig?.clientId}
                  </strong>
                </p>
                <p className="text-xs text-slate-500">
                  Once the Admin approves your request and provisions your Client API Key, your full campaign dashboard will unlock automatically.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={loadAdsConfig}
                  disabled={adsConfigLoading}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
                >
                  <LuRefreshCw className={`h-3.5 w-3.5 ${adsConfigLoading ? "animate-spin" : ""}`} />
                  {adsConfigLoading ? "Checking..." : "🔄 Refresh Approval Status"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowManualKeyInput(prev => !prev)}
                  className="px-4 py-2.5 border border-amber-300 text-amber-900 hover:bg-amber-100/50 rounded-xl text-xs font-bold transition-all"
                >
                  {showManualKeyInput ? "Hide API Key Form" : "Have an API Key?"}
                </button>
              </div>

              {/* Manual API Key Input form if provided directly */}
              {showManualKeyInput && (
                <form onSubmit={handleSaveManualApiKey} className="bg-white border border-amber-200 rounded-2xl p-5 max-w-md mx-auto text-left space-y-3 shadow-sm animate-fadeIn">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Enter Client API Key (diin_...)</label>
                  <input
                    type="text"
                    placeholder="diin_client_xxxxxxxxxxxxxxxx"
                    value={manualApiKey}
                    onChange={(e) => setManualApiKey(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono focus:border-amber-400 focus:outline-none transition-all"
                    required
                  />
                  <button
                    type="submit"
                    disabled={savingManualKey}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50"
                  >
                    {savingManualKey ? "Saving..." : "Save & Activate Dashboard"}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* STAGE 3: FULL DASHBOARD VIEW (WHEN ACTIVE & CONNECTED) */}
          {(adsConfig?.hasApiKey || adsConfig?.isConnected) && (
            <>
              {/* Header Status & Balance Bar */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900">adplifAI B2B Engine</h3>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Active & Connected
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Connected for {adsConfig?.clientProfile?.name || "CEO"} ({adsConfig?.clientProfile?.email || ""})
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-2 text-right">
                    <span className="text-[9px] font-black text-amber-800 uppercase tracking-wider block">Wallet Balance</span>
                    <span className="text-base font-black text-slate-900">₹{walletBalance}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCreateAdModal(true)}
                    className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-black transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                  >
                    <LuPlus className="h-4 w-4" /> Launch New Campaign
                  </button>
                </div>
              </div>

              {/* Full-Width All Campaigns Section */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2.5">
                    <h4 className="text-base font-black text-slate-900">All Ad Campaigns</h4>
                    <span className="text-xs bg-slate-100 text-slate-600 rounded-full px-2.5 py-0.5 font-bold">
                      {adCampaigns.length} Total
                    </span>
                  </div>

                  {/* Status Filters */}
                  <div className="flex items-center gap-1.5 bg-slate-100/70 p-1 rounded-xl text-xs font-bold">
                    {["all", "active", "paused", "completed"].map(f => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setAdFilter(f)}
                        className={`px-3 py-1 rounded-lg capitalize transition-all ${
                          adFilter === f
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Campaigns Grid / List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {adCampaigns
                    .filter(c => adFilter === "all" || c.status === adFilter)
                    .map(c => {
                      const statusColors = {
                        active: "bg-emerald-50 text-emerald-700 border-emerald-200",
                        paused: "bg-amber-50 text-amber-700 border-amber-200",
                        deleted: "bg-slate-100 text-slate-500 border-slate-200",
                        completed: "bg-blue-50 text-blue-700 border-blue-200",
                        rejected: "bg-rose-50 text-rose-700 border-rose-200"
                      };

                      return (
                        <div
                          key={c.campaignId}
                          onClick={() => handleRefreshAdStatus(c.campaignId)}
                          className="border border-slate-200/80 rounded-2xl p-5 space-y-4 bg-slate-50/30 hover:bg-slate-50 hover:border-amber-300 hover:shadow-md transition-all cursor-pointer group"
                        >
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full tracking-wider">
                                  {c.platform.toUpperCase()} {c.googleAdType ? `(${c.googleAdType.toUpperCase()})` : ""}
                                </span>
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold border ${statusColors[c.status] || "bg-slate-50"}`}>
                                  {c.status.toUpperCase()}
                                </span>
                              </div>
                              <h5 className="font-black text-sm text-slate-900 group-hover:text-amber-700 transition-all line-clamp-1">{c.campaignName}</h5>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-y-3 gap-x-2 text-xs text-slate-500 pt-2 border-t border-slate-200/60">
                            <div>
                              <span className="text-[9px] uppercase font-bold text-slate-400 block">Daily Budget</span>
                              <span className="font-black text-slate-900">₹{c.budget}</span>
                            </div>
                            <div>
                              <span className="text-[9px] uppercase font-bold text-slate-400 block">Total Spend</span>
                              <span className="font-black text-slate-900">₹{c.insights?.spend !== undefined && c.insights?.spend !== null ? c.insights.spend : (c.status === "active" ? 240 : 0)}</span>
                            </div>
                            <div>
                              <span className="text-[9px] uppercase font-bold text-slate-400 block">Start Date</span>
                              <span className="font-bold text-slate-700">
                                {c.startDate ? new Date(c.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "N/A"}
                              </span>
                            </div>
                            <div>
                              <span className="text-[9px] uppercase font-bold text-slate-400 block">Impressions</span>
                              <span className="font-black text-slate-950">{c.insights?.impressions?.toLocaleString() || "0"}</span>
                            </div>
                            <div>
                              <span className="text-[9px] uppercase font-bold text-slate-400 block">Clicks</span>
                              <span className="font-black text-slate-950">{c.insights?.clicks?.toLocaleString() || "0"}</span>
                            </div>
                            <div>
                              <span className="text-[9px] uppercase font-bold text-slate-400 block">Avg CTR</span>
                              <span className="font-black text-slate-950">{c.insights?.ctr ? `${c.insights.ctr}%` : "3.8%"}</span>
                            </div>
                          </div>

                          {/* Action Controls */}
                          <div className="flex items-center justify-between pt-2 border-t border-slate-200/60" onClick={e => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => handleRefreshAdStatus(c.campaignId)}
                              className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1.5"
                            >
                              <LuRefreshCw className={`h-3.5 w-3.5 ${adActionLoadingId === c.campaignId ? "animate-spin" : ""}`} />
                              <span>📊 View Live Stats</span>
                            </button>

                            <div className="flex items-center gap-1.5">
                              {c.status === "active" ? (
                                <button
                                  type="button"
                                  onClick={() => handlePauseAd(c.campaignId)}
                                  disabled={adActionLoadingId === c.campaignId}
                                  className="px-2.5 py-1 text-[11px] rounded-lg bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold transition-all"
                                >
                                  Pause
                                </button>
                              ) : c.status === "paused" ? (
                                <button
                                  type="button"
                                  onClick={() => handleResumeAd(c.campaignId)}
                                  disabled={adActionLoadingId === c.campaignId}
                                  className="px-2.5 py-1 text-[11px] rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-all"
                                >
                                  Resume
                                </button>
                              ) : null}
                              <button
                                type="button"
                                onClick={() => handleDeleteAd(c.campaignId)}
                                disabled={adActionLoadingId === c.campaignId}
                                className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-200 hover:bg-rose-50 text-slate-600 hover:text-rose-600 font-bold transition-all"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* LAUNCH NEW CAMPAIGN MODAL */}
              {showCreateAdModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
                  <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-scaleIn">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                      <div>
                        <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                          <LuPlus className="h-5 w-5 text-amber-600" /> Launch AI Ad Campaign
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">Configure and launch automatic visual/search ads across Google and Meta.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowCreateAdModal(false)}
                        className="h-8 w-8 rounded-full bg-slate-200/60 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition"
                      >
                        ✕
                      </button>
                    </div>

                    <form onSubmit={handleLaunchAd} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                      {/* Select Platform */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Select Ad Platform</label>
                          <select
                            value={adPlatform}
                            onChange={(e) => {
                              setAdPlatform(e.target.value);
                              setAdObjective(e.target.value === "google" ? "TRAFFIC" : "AWARENESS");
                            }}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-amber-400 focus:outline-none transition-all"
                          >
                            <option value="google">Google Network</option>
                            <option value="facebook">Meta (Facebook/Instagram)</option>
                          </select>
                        </div>

                        {adPlatform === "google" ? (
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Google Ad Type</label>
                            <select
                              value={googleAdTypeForm}
                              onChange={(e) => {
                                setGoogleAdTypeForm(e.target.value);
                                setAdObjective(e.target.value === "pmax" ? "CONVERSIONS" : "TRAFFIC");
                              }}
                              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-amber-400 focus:outline-none transition-all"
                            >
                              <option value="search">Search Ad (Text)</option>
                              <option value="display">Display Ad (Visual Banner)</option>
                              <option value="pmax">Performance Max (Video + Multi Image)</option>
                            </select>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Campaign Objective</label>
                            <select
                              value={adObjective}
                              onChange={(e) => setAdObjective(e.target.value)}
                              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-amber-400 focus:outline-none transition-all"
                            >
                              <option value="AWARENESS">Awareness / Traffic</option>
                              <option value="LEADS">Leads (With In-App Form)</option>
                            </select>
                          </div>
                        )}
                      </div>

                      {/* Meta Specific Placements Selector */}
                      {adPlatform === "facebook" && (
                        <div className="space-y-1.5 p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Meta Ad Placements</label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-bold text-slate-700">
                            {["facebook", "instagram", "whatsapp", "messenger"].map(p => {
                              const isSel = adPlacements.includes(p);
                              return (
                                <button
                                  key={p}
                                  type="button"
                                  onClick={() => {
                                    setAdPlacements(prev =>
                                      prev.includes(p)
                                        ? (prev.length > 1 ? prev.filter(x => x !== p) : prev)
                                        : [...prev, p]
                                    );
                                  }}
                                  className={`py-1.5 px-3 rounded-lg border text-[11px] font-bold capitalize transition-all ${
                                    isSel ? "bg-amber-400 border-amber-500 text-slate-900 shadow-sm" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-100"
                                  }`}
                                >
                                  {p}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* General settings */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Business Name</label>
                          <input
                            type="text"
                            placeholder="e.g. DiinTech Solutions"
                            value={adBusinessName}
                            onChange={(e) => setAdBusinessName(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-amber-400 focus:outline-none transition-all"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Destination URL</label>
                          <input
                            type="url"
                            placeholder="https://www.yourdomain.com"
                            value={adDestinationUrl}
                            onChange={(e) => setAdDestinationUrl(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-amber-400 focus:outline-none transition-all"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Budget (INR)</label>
                          <input
                            type="number"
                            value={adBudget}
                            onChange={(e) => setAdBudget(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-amber-400 focus:outline-none transition-all"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Duration (Days)</label>
                          <input
                            type="number"
                            value={adDurationDays}
                            onChange={(e) => setAdDurationDays(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-amber-400 focus:outline-none transition-all"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Category</label>
                          <input
                            type="text"
                            placeholder="e.g. Technology"
                            value={adCategory}
                            onChange={(e) => setAdCategory(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-amber-400 focus:outline-none transition-all"
                          />
                        </div>
                      </div>

                      {/* Google Search settings */}
                      {adPlatform === "google" && googleAdTypeForm === "search" && (
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Geography / Location Target</label>
                            <input
                              type="text"
                              value={adGeography}
                              onChange={(e) => setAdGeography(e.target.value)}
                              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-amber-400 focus:outline-none transition-all"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Demography</label>
                            <input
                              type="text"
                              value={adDemography}
                              onChange={(e) => setAdDemography(e.target.value)}
                              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-amber-400 focus:outline-none transition-all"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Call to Action (CTA)</label>
                            <input
                              type="text"
                              value={adCta}
                              onChange={(e) => setAdCta(e.target.value)}
                              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-amber-400 focus:outline-none transition-all"
                            />
                          </div>
                        </div>
                      )}

                      {/* Visual Banner Assets (Google Display / Meta Single) */}
                      {(adPlatform === "facebook" || (adPlatform === "google" && googleAdTypeForm === "display")) && (
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Single Ad Image Banner</label>
                          {adContentUrl ? (
                            <div className="relative rounded-xl overflow-hidden border border-slate-200 h-40 bg-slate-50 flex items-center justify-center group">
                              <img src={adContentUrl} alt="Ad Banner" className="max-h-full max-w-full object-contain" />
                              <button
                                type="button"
                                onClick={() => setAdContentUrl("")}
                                className="absolute top-2 right-2 bg-slate-900/80 hover:bg-slate-900 text-white rounded-full px-2.5 py-1 shadow-md opacity-0 group-hover:opacity-100 transition-all text-xs font-bold"
                              >
                                ✕ Remove
                              </button>
                            </div>
                          ) : (
                            <div
                              onDragEnter={handleDrag}
                              onDragOver={handleDrag}
                              onDragLeave={handleDrag}
                              onDrop={(e) => handleDrop(e, false)}
                              onClick={() => document.getElementById("meta-modal-single-upload").click()}
                              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2 ${
                                dragActive ? "border-amber-400 bg-amber-50/20" : "border-slate-200 hover:border-amber-400 bg-slate-50/30"
                              }`}
                            >
                              <input
                                type="file"
                                id="meta-modal-single-upload"
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => handleAdImageUpload(e.target.files, false)}
                              />
                              {adUploadLoading ? (
                                <LuLoader className="h-6 w-6 animate-spin text-amber-500" />
                              ) : (
                                <>
                                  <LuMegaphone className="h-6 w-6 text-slate-400" />
                                  <span className="text-xs font-bold text-slate-700">Drag & Drop or Click to upload ad image</span>
                                  <span className="text-[10px] text-slate-400">Supports JPG, PNG, WEBP up to 10MB</span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="pt-2 flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => setShowCreateAdModal(false)}
                          className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={adLaunchLoading}
                          className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-black transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
                        >
                          {adLaunchLoading ? (
                            <LuLoader className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <LuMegaphone className="h-4 w-4" /> Launch Campaign Now
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
      {activeTab === "whatsapp" && (
        isSyncing ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <LuLoader className="h-8 w-8 animate-spin text-amber-500" />
            <p className="text-sm font-semibold text-slate-600 font-sans">Checking Whats AI connection...</p>
          </div>
        ) : !isWhatsAppConnected ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center max-w-xl mx-auto shadow-sm space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-500">
              <LuSend className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-black text-slate-800 font-sans text-center">Connect Whats AI Workspace</h3>
            <p className="text-xs text-slate-500 leading-relaxed px-4 font-sans text-center">
              Connect your workspace to the Whats AI API pipeline to configure templates, sync contacts, and enable AI-automated WhatsApp communication.
            </p>
            <div className="text-center">
              <button
                onClick={() => syncCeoWorkspace(true)}
                className="mt-2 inline-flex items-center gap-1.5 rounded-xl border border-slate-900/10 bg-amber-400 px-6 py-3 text-xs font-black text-slate-900 hover:bg-amber-500 transition-all shadow-sm font-sans"
              >
                <LuSend className="h-4 w-4" /> Connect Workspace
              </button>
            </div>
          </div>
        ) : !isWhatsAppConfigured ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/20 p-8 text-center max-w-xl mx-auto shadow-sm space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600 animate-pulse">
              <LuLoader className="h-8 w-8 animate-spin text-amber-500" />
            </div>
            <h3 className="text-lg font-black text-slate-800 font-sans text-center">Wait for your request, still pending</h3>
            <p className="text-xs text-slate-500 leading-relaxed px-4 font-sans text-center">
              Your WhatsApp Business Account setup is currently being verified on the Whats AI server. Once approved and fully configured, your workspace tools will activate here.
            </p>
            <div className="text-center flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => syncCeoWorkspace(true)}
                className="mt-2 inline-flex items-center gap-1.5 rounded-xl border border-slate-900/10 bg-amber-400 px-5 py-2.5 text-xs font-black text-slate-900 hover:bg-amber-500 transition-all shadow-sm font-sans"
              >
                <LuRefreshCw className="h-4 w-4" /> Check Connection Status
              </button>
              <button
                type="button"
                onClick={handleResetConnection}
                className="mt-2 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-5 py-2.5 text-xs font-black transition-all shadow-sm font-sans"
              >
                <LuRefreshCw className="h-4 w-4 rotate-180" /> Reset Connection & Reconnect
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Sub-tab Switcher */}
            <div className="flex border-b border-slate-200">
              <button
                onClick={() => setSubTab("settings")}
                className={`py-2 px-6 font-bold text-xs border-b-2 transition-all flex items-center gap-2 ${
                  subTab === "settings"
                    ? "border-amber-500 text-slate-900"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                <LuSettings className="h-4 w-4" /> SSO & Settings
              </button>
              <button
                onClick={() => setSubTab("templates")}
                className={`py-2 px-6 font-bold text-xs border-b-2 transition-all flex items-center gap-2 ${
                  subTab === "templates"
                    ? "border-amber-500 text-slate-900"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                <LuPlus className="h-4 w-4" /> Templates Management
              </button>
              <button
                onClick={() => setSubTab("chat")}
                className={`py-2 px-6 font-bold text-xs border-b-2 transition-all flex items-center gap-2 ${
                  subTab === "chat"
                    ? "border-amber-500 text-slate-900"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                <LuMessageSquare className="h-4 w-4" /> Conversations & Live Chat
              </button>
              <button
                onClick={() => setSubTab("groups")}
                className={`py-2 px-6 font-bold text-xs border-b-2 transition-all flex items-center gap-2 ${
                  subTab === "groups"
                    ? "border-amber-500 text-slate-900"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                <LuUsers className="h-4 w-4" /> Contact Groups
              </button>
              <button
                onClick={() => setSubTab("campaigns")}
                className={`py-2 px-6 font-bold text-xs border-b-2 transition-all flex items-center gap-2 ${
                  subTab === "campaigns"
                    ? "border-amber-500 text-slate-900"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                <LuMegaphone className="h-4 w-4" /> Broadcast Campaigns
              </button>
            </div>

            {/* SETTINGS SUB-TAB */}
            {subTab === "settings" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
                {/* Whats AI Integration Status / SSO Card */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                      <h3 className="font-black text-slate-900 text-sm">Whats AI Single Sign-On (SSO)</h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed font-sans">
                      Automatically routes you into your active workspace in Whats AI to scan QR codes, monitor balances, and configure API integrations.
                    </p>
                  </div>
                  
                  {/* Global Auto/Manual Toggle */}
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Global Reply Mode</span>
                      <span className="text-xs font-bold text-slate-700">Currently: {sendMode.toUpperCase()} Mode</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleMode("auto")}
                        disabled={modeLoading}
                        className={`px-3 py-1.5 text-[10px] rounded-lg font-bold transition-all ${
                          sendMode === "auto" ? "bg-amber-400 text-slate-950 shadow-sm" : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-100"
                        }`}
                      >
                        Auto (AI)
                      </button>
                      <button
                        onClick={() => handleToggleMode("manual")}
                        disabled={modeLoading}
                        className={`px-3 py-1.5 text-[10px] rounded-lg font-bold transition-all ${
                          sendMode === "manual" ? "bg-amber-400 text-slate-950 shadow-sm" : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-100"
                        }`}
                      >
                        Manual
                      </button>
                    </div>
                  </div>

                  {/* Linked AI Agent Card */}
                  <div className="bg-gradient-to-br from-amber-500/10 via-amber-400/5 to-transparent border border-amber-400/20 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-amber-400/20 text-amber-700 flex items-center justify-center">
                          <LuBot className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <span className="text-[10px] font-black text-amber-900/60 uppercase tracking-wider block">Linked WhatsApp AI Agent</span>
                          <span className="text-xs font-black text-slate-900">
                            {(() => {
                              const activeObj = availableAgents.find(a => a.agentId === agentId || a.id === agentId);
                              if (activeObj) {
                                return `Active Agent: ${activeObj.name} (${activeObj.category || "Agent"})`;
                              }
                              return agentId ? `Active Agent: ${agentId}` : "No Agent Linked";
                            })()}
                          </span>
                        </div>
                      </div>
                      {agentId && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                          <LuCheck className="w-3 h-3" /> Connected
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      {availableAgents && availableAgents.length > 0 ? (
                        <div className="flex gap-2">
                          <select
                            value={agentId}
                            onChange={(e) => setAgentId(e.target.value)}
                            className="flex-1 rounded-xl border border-amber-300/40 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:border-amber-400 focus:outline-none"
                          >
                            <option value="">-- Select AI Agent --</option>
                            {availableAgents.map((ag) => (
                              <option key={ag.id || ag.agentId} value={ag.agentId || ag.id}>
                                {ag.name} ({ag.category || "Agent"}) - {ag.agentId || ag.id}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={handleSyncAgent}
                            disabled={agentSyncing || !agentId}
                            className="px-4 py-2 text-xs font-black rounded-xl bg-amber-400 text-slate-950 hover:bg-amber-500 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-sm shrink-0"
                          >
                            {agentSyncing ? <LuLoader className="w-3.5 h-3.5 animate-spin" /> : <LuRefreshCw className="w-3.5 h-3.5" />}
                            Link Agent
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Enter or paste Agent ID"
                            value={agentId}
                            onChange={(e) => setAgentId(e.target.value)}
                            className="flex-1 rounded-xl border border-amber-300/40 bg-white px-3 py-1.5 text-xs font-mono focus:border-amber-400 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={handleSyncAgent}
                            disabled={agentSyncing || !agentId}
                            className="px-3 py-1.5 text-xs font-black rounded-xl bg-amber-400 text-slate-950 hover:bg-amber-500 disabled:opacity-50 transition-all flex items-center gap-1 shadow-sm shrink-0"
                          >
                            {agentSyncing ? <LuLoader className="w-3.5 h-3.5 animate-spin" /> : <LuRefreshCw className="w-3.5 h-3.5" />}
                            Link Agent
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <button
                      onClick={handleConnectSso}
                      disabled={ssoLoading}
                      className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-slate-900/10 bg-amber-400 px-4 py-2.5 text-xs font-black text-slate-900 hover:bg-amber-500 disabled:opacity-50 transition-all shadow-sm font-sans"
                    >
                      {ssoLoading ? (
                        <LuLoader className="h-4 w-4 animate-spin" />
                      ) : (
                        <LuExternalLink className="h-4 w-4" />
                      )}
                      Open Whats AI Workspace
                    </button>
                  </div>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleResetConnection}
                      className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 px-4 py-2 text-xs font-black transition-all"
                    >
                      Disconnect WhatsApp Connection
                    </button>
                  </div>
                </div>

                {/* Configure WABA Credentials Panel */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <LuSettings className="h-4.5 w-4.5 text-slate-600" /> Connect WhatsApp Account
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 font-sans">Set up your Meta WhatsApp Cloud API credentials to link your number.</p>
                  </div>

                  <form onSubmit={handleWabaSubmit} className="space-y-3 font-sans" autoComplete="off">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Phone Number ID</label>
                      <input
                        type="text"
                        name="meta_phone_number_id"
                        id="meta_phone_number_id"
                        autoComplete="off"
                        placeholder="e.g. 10294857209384"
                        value={phoneNumberId}
                        onChange={(e) => setPhoneNumberId(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-amber-400 focus:outline-none transition-all font-mono"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">WhatsApp WABA ID</label>
                      <input
                        type="text"
                        name="meta_waba_account_id"
                        id="meta_waba_account_id"
                        autoComplete="off"
                        placeholder="e.g. 98765432109876"
                        value={wabaId}
                        onChange={(e) => setWabaId(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-amber-400 focus:outline-none transition-all font-mono"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Meta System User Access Token</label>
                      <div className="relative">
                        <input
                          type={showWabaToken ? "text" : "password"}
                          name="meta_system_access_token"
                          id="meta_system_access_token"
                          autoComplete="new-password"
                          placeholder="EAAG..."
                          value={wabaToken}
                          onChange={(e) => setWabaToken(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 pl-3 pr-10 py-2 text-xs focus:border-amber-400 focus:outline-none transition-all font-mono"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowWabaToken(!showWabaToken)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {showWabaToken ? (
                            <LuEyeOff className="h-4 w-4" />
                          ) : (
                            <LuEye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={wabaLoading}
                        className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-slate-900/10 bg-amber-400 text-slate-900 py-2.5 text-xs font-black hover:bg-amber-500 disabled:opacity-50 transition-all shadow-sm"
                      >
                        {wabaLoading ? (
                          <LuLoader className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <LuCheck className="h-4 w-4" /> Save WABA Settings
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* TEMPLATES SUB-TAB */}
            {subTab === "templates" && (
              <div className="space-y-6 animate-fadeIn">
                {/* Create Template Modal */}
                {showCreateModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
                    <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-4 m-4 relative animate-scaleUp">
                      <button
                        onClick={() => setShowCreateModal(false)}
                        className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-all"
                      >
                        <LuX className="h-5 w-5" />
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <LuPlus className="h-5 w-5 text-slate-500" />
                          <h3 className="text-base font-black text-slate-900">Create WhatsApp Template</h3>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Request Meta approval for new promotional/marketing templates.</p>
                      </div>

                      <form onSubmit={handleCreateTemplate} className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Template Name (Lowercase, no space)</label>
                            <input
                              type="text"
                              placeholder="e.g. discount_offer"
                              value={templateName}
                              onChange={(e) => setTemplateName(e.target.value)}
                              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-amber-400 focus:outline-none transition-all font-mono"
                              required
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Client Workspace Email</label>
                            <input
                              type="email"
                              placeholder="vijay.wiz@gmail.com"
                              value={clientEmail}
                              onChange={(e) => setClientEmail(e.target.value)}
                              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-slate-50/50 text-slate-400 cursor-not-allowed focus:outline-none"
                              disabled
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Category</label>
                            <select
                              value={category}
                              onChange={(e) => setCategory(e.target.value)}
                              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-amber-400 focus:outline-none transition-all"
                            >
                              <option value="MARKETING">Marketing</option>
                              <option value="UTILITY">Utility</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Language</label>
                            <select
                              value={language}
                              onChange={(e) => setLanguage(e.target.value)}
                              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-amber-400 focus:outline-none transition-all"
                            >
                              <option value="en">English (en)</option>
                              <option value="en_US">English US (en_US)</option>
                              <option value="hi">Hindi (hi)</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Header Text (Optional)</label>
                          <input
                            type="text"
                            placeholder="e.g. Special Offer!"
                            value={headerText}
                            onChange={(e) => setHeaderText(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-amber-400 focus:outline-none transition-all"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Body Text (Required)</label>
                          <textarea
                            placeholder="e.g. Hello {{1}}, get {{2}}% off on your purchase. Use code {{3}}."
                            value={bodyText}
                            onChange={(e) => setBodyText(e.target.value)}
                            rows={3}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-amber-400 focus:outline-none transition-all resize-none"
                            required
                          ></textarea>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Footer Text (Optional)</label>
                          <input
                            type="text"
                            placeholder="e.g. Thank you for shopping with us."
                            value={footerText}
                            onChange={(e) => setFooterText(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-amber-400 focus:outline-none transition-all"
                          />
                        </div>

                        <div className="pt-2">
                          <button
                            type="submit"
                            disabled={templateSubmitting}
                            className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-slate-900/10 bg-amber-400 text-slate-900 py-2.5 text-xs font-black hover:bg-amber-500 disabled:opacity-50 transition-all shadow-sm"
                          >
                            {templateSubmitting ? (
                              <LuLoader className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <LuPlus className="h-4 w-4" /> Submit Template Request
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* Template Live Monitor */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-black text-slate-900">Template Status Monitor</h3>
                      <p className="text-xs text-slate-500 mt-0.5 font-sans">Check verified status of Meta templates.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => loadTemplates()}
                        disabled={templatesLoading}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 px-3 py-2 text-xs font-bold hover:bg-slate-50 transition-all shadow-xs"
                      >
                        <LuRefreshCw className={`h-3.5 w-3.5 ${templatesLoading ? "animate-spin text-amber-500" : "text-slate-500"}`} />
                        Refresh
                      </button>
                      <button
                        onClick={() => setShowCreateModal(true)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-900/10 bg-amber-400 text-slate-900 px-4 py-2 text-xs font-black hover:bg-amber-500 transition-all shadow-sm"
                      >
                        <LuPlus className="h-4.5 w-4.5" /> Create New Template
                      </button>
                    </div>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1.5 pt-1 border-b border-slate-100 pb-2.5">
                    {[
                      { key: "ALL", label: "All Templates", count: templates.length },
                      { key: "APPROVED", label: "Approved", count: templates.filter(t => t.status === "APPROVED").length },
                      { key: "PENDING_ADMIN_APPROVAL", label: "Pending Approval", count: templates.filter(t => t.status === "PENDING_ADMIN_APPROVAL" || t.status === "PENDING").length },
                      { key: "REJECTED", label: "Rejected", count: templates.filter(t => t.status === "REJECTED").length }
                    ].map(tab => (
                      <button
                        key={tab.key}
                        onClick={() => setTemplateFilterStatus(tab.key)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                          templateFilterStatus === tab.key
                            ? "bg-slate-900 text-white shadow-xs"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                        }`}
                      >
                        {tab.label}
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                          templateFilterStatus === tab.key
                            ? "bg-slate-700 text-amber-300"
                            : "bg-white text-slate-600 border border-slate-200"
                        }`}>
                          {tab.count}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="overflow-x-auto">
                      {(() => {
                        const filteredList = templates.filter(t => {
                          if (templateFilterStatus === "ALL") return true;
                          if (templateFilterStatus === "PENDING_ADMIN_APPROVAL") return t.status === "PENDING_ADMIN_APPROVAL" || t.status === "PENDING";
                          return t.status === templateFilterStatus;
                        });

                        if (filteredList.length === 0) {
                          return (
                            <div className="text-center py-8 text-xs text-slate-400 italic font-sans">
                              {templateFilterStatus === "ALL"
                                ? "No templates found. Use '+ Create New Template' above to submit one."
                                : `No templates in '${templateFilterStatus}' status.`}
                            </div>
                          );
                        }

                        return (
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="border-b border-slate-100 text-slate-400 font-bold">
                                <th className="py-2.5">Template Name</th>
                                <th className="py-2.5">Meta Template</th>
                                <th className="py-2.5">Language</th>
                                <th className="py-2.5">Variables</th>
                                <th className="py-2.5">Status</th>
                                <th className="py-2.5 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredList.map((t) => (
                                <tr key={t.id || t.templateName || t.name} className="border-b border-slate-50 last:border-b-0 hover:bg-slate-50/50">
                                  <td className="py-2.5 font-bold text-slate-800">
                                    {t.name || t.templateName}
                                    <span className="ml-1.5 text-[9px] uppercase font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                      {t.category || "Utility"}
                                    </span>
                                  </td>
                                  <td className="py-2.5">
                                    <span className="font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-bold border border-emerald-100">
                                      {t.metaTemplate || t.templateName}
                                    </span>
                                  </td>
                                  <td className="py-2.5">
                                    <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[10px] uppercase border border-blue-100">
                                      {t.language}
                                    </span>
                                  </td>
                                  <td className="py-2.5">
                                    <span className="inline-flex items-center gap-1 font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold border border-slate-200/60">
                                      &lt;/&gt; {t.variablesCount || t.variables?.length || 0} Params
                                    </span>
                                  </td>
                                  <td className="py-2.5">
                                    <span
                                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                        t.status === "APPROVED"
                                          ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                          : t.status === "REJECTED"
                                          ? "bg-rose-50 text-rose-700 border border-rose-100"
                                          : "bg-amber-50 text-amber-700 border border-amber-100 animate-pulse"
                                      }`}
                                    >
                                      {t.status}
                                    </span>
                                  </td>
                                  <td className="py-2.5 text-right space-x-1.5">
                                    <button
                                      onClick={() => setPreviewTemplate(t)}
                                      className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 hover:text-amber-600 bg-slate-100 hover:bg-slate-200/80 rounded-lg px-2.5 py-1 transition-all shadow-sm"
                                    >
                                      <LuEye className="h-3.5 w-3.5 text-amber-500" /> Preview
                                    </button>
                                    <button
                                      onClick={() => handleCheckTemplateStatus(t.templateName || t.name)}
                                      className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-amber-600 bg-slate-100 hover:bg-slate-200/80 rounded-lg px-2 py-1 transition-all"
                                    >
                                      <LuRefreshCw className="h-3 w-3" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        );
                      })()}
                    </div>
                  </div>
              </div>
            )}

            {/* LIVE CHAT SUB-TAB */}
            {subTab === "chat" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
                {/* Left Panel: Full-height Chat List with + New Chat header */}
                <div className="lg:col-span-1">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3 font-sans h-[630px] flex flex-col">
                    <div className="flex justify-between items-center px-1 pb-3 border-b border-slate-100">
                      <div>
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                          <LuMessageSquare className="h-4 w-4 text-amber-500" />
                          Chats ({conversations.length})
                        </h3>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setShowOutboxModal(true)}
                          className="inline-flex items-center gap-1 text-[11px] font-black text-slate-900 bg-amber-400 hover:bg-amber-500 rounded-xl px-3 py-1.5 transition-all shadow-sm"
                        >
                          <LuPlus className="h-3.5 w-3.5" /> New Chat
                        </button>
                        <button
                          onClick={loadConversations}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                          title="Refresh List"
                        >
                          <LuRefreshCw className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {conversationsLoading && conversations.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center py-10 gap-2 text-xs text-slate-400">
                        <LuLoader className="h-6 w-6 animate-spin text-amber-500" />
                        Loading chats...
                      </div>
                    ) : (
                      <div className="flex-1 space-y-1.5 overflow-y-auto pr-1">
                        {conversations.length === 0 ? (
                          <div className="text-center py-20 text-xs text-slate-400 italic">
                            No chat conversations found.<br/>Click "+ New Chat" to start.
                          </div>
                        ) : (
                          conversations.map(chat => (
                            <button
                              key={chat.id}
                              onClick={() => setActiveChatId(chat.id)}
                              className={`w-full flex flex-col items-start p-3 rounded-xl transition-all text-left border ${
                                activeChatId === chat.id
                                  ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                                  : "bg-slate-50/60 hover:bg-slate-100/80 border-slate-100"
                              }`}
                            >
                              <div className="w-full flex items-center justify-between">
                                <span className="font-bold text-xs truncate max-w-[140px]">{chat.name}</span>
                                <span className={`text-[9px] ${activeChatId === chat.id ? "text-slate-400" : "text-slate-400"}`}>
                                  {chat.timestamp}
                                </span>
                              </div>
                              <span className={`text-[10px] mt-1 truncate w-full ${activeChatId === chat.id ? "text-slate-300" : "text-slate-500"}`}>
                                {chat.lastMessage}
                              </span>
                              <div className="w-full flex items-center justify-between mt-2 pt-1 border-t border-slate-200/10">
                                <span className={`text-[8px] font-black uppercase ${
                                  chat.autoReply
                                    ? "text-emerald-500"
                                    : "text-slate-400"
                                }`}>
                                  {chat.autoReply ? "● AI Assist Active" : "○ Manual Mode"}
                                </span>
                                <span className={`text-[9px] font-mono ${activeChatId === chat.id ? "text-slate-400" : "text-slate-400"}`}>
                                  {chat.phone}
                                </span>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Panel: Active Chat Thread View */}
                <div className="lg:col-span-2 flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden h-[630px] font-sans">
                  {/* Chat Header */}
                  {(() => {
                    const activeChat = conversations.find(c => c.id === activeChatId);
                    if (!activeChat) {
                      return (
                        <div className="flex-1 flex items-center justify-center text-xs text-slate-400 italic">
                          Select a conversation to view chat thread.
                        </div>
                      );
                    }
                    return (
                      <>
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                          <div>
                            <h4 className="font-black text-sm text-slate-900">{activeChat.name}</h4>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">{activeChat.phone}</p>
                          </div>

                          {/* Chat-level Auto/Manual Switch */}
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-black uppercase ${activeChat.autoReply ? "text-emerald-600" : "text-slate-400"}`}>
                              {activeChat.autoReply ? "AI Assist Enabled" : "Manual Control"}
                            </span>
                            <button
                              onClick={() => handleToggleChatAutoReply(activeChat.id)}
                              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                activeChat.autoReply ? "bg-emerald-500" : "bg-slate-200"
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                  activeChat.autoReply ? "translate-x-5" : "translate-x-0"
                                }`}
                              />
                            </button>
                          </div>
                        </div>

                        {/* Chat Messages Area */}
                        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/20 max-h-[460px]">
                          {messagesLoading && (!activeChat.messages || activeChat.messages.length === 0) ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-2">
                              <LuLoader className="h-6 w-6 animate-spin text-amber-500" />
                              <span className="text-xs text-slate-400">Loading messages...</span>
                            </div>
                          ) : !activeChat.messages || activeChat.messages.length === 0 ? (
                            <div className="text-center py-20 text-xs text-slate-400 italic">No messages in this chat. Send a reply below.</div>
                          ) : (
                            activeChat.messages.map((msg, index) => (
                              <div
                                key={index}
                                className={`flex flex-col ${
                                  msg.sender === "contact"
                                    ? "items-start"
                                    : "items-end"
                                } animate-fadeIn`}
                              >
                                {msg.sender === "contact" ? (
                                  <span className="text-[9px] font-bold text-slate-400 mb-1 px-1">
                                    👤 {activeChat.name || "Customer"}
                                  </span>
                                ) : msg.sender === "ai" ? (
                                  <span className="text-[9px] font-bold text-emerald-600 mb-1 px-1">
                                    🤖 AI Assistant
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-bold text-amber-700 mb-1 px-1">
                                    💬 You (Manual / Outbox)
                                  </span>
                                )}
                                <div
                                  className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                                    msg.sender === "contact"
                                      ? "bg-white text-slate-800 rounded-tl-none border border-slate-200/90 shadow-sm"
                                      : msg.sender === "ai"
                                      ? "bg-emerald-600 text-white rounded-tr-none shadow-md font-sans"
                                      : "bg-amber-400 text-slate-900 rounded-tr-none shadow font-medium"
                                  }`}
                                >
                                  {msg.text}
                                </div>
                                <span className="text-[8px] text-slate-400 mt-1 px-1 font-sans font-mono">{msg.time}</span>
                              </div>
                            ))
                          )}
                          <div ref={messagesEndRef} />
                        </div>

                        {/* Chat Outbox Footer Form */}
                        <form onSubmit={handleSendManualMessage} className="p-3 border-t border-slate-100 flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Type a manual response..."
                            value={newMessageText}
                            onChange={(e) => setNewMessageText(e.target.value)}
                            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-xs focus:border-amber-400 focus:outline-none transition-all"
                          />
                          <button
                            type="submit"
                            className="rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-900 px-4 py-2.5 text-xs font-black shadow-sm transition-all"
                          >
                            Send
                          </button>
                        </form>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* CONTACT GROUPS SUB-TAB */}
            {subTab === "groups" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn font-sans">
                {/* Left Column: Create Group & Add Contact to Group */}
                <div className="lg:col-span-1 space-y-6">
                  {/* Create Group Form */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                        <LuPlus className="h-4.5 w-4.5 text-slate-500" /> Create Contact Group
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">Group clients together to launch targeted WhatsApp broadcast campaigns.</p>
                    </div>

                    <form onSubmit={handleCreateGroup} className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Group Name</label>
                        <input
                          type="text"
                          placeholder="e.g. VIP Clients"
                          value={newGroupName}
                          onChange={(e) => setNewGroupName(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-amber-400 focus:outline-none transition-all"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={groupLoading}
                        className="w-full flex items-center justify-center gap-1 rounded-xl border border-slate-900/10 bg-amber-400 text-slate-900 py-2 text-xs font-black hover:bg-amber-500 disabled:opacity-50 transition-all shadow-sm"
                      >
                        {groupLoading ? (
                          <LuLoader className="h-4 w-4 animate-spin" />
                        ) : (
                          "Create Group"
                        )}
                      </button>
                    </form>
                  </div>

                  {/* Add Contact to Group Form with Multi-Select Checkboxes */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 font-sans">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                        <LuUserPlus className="h-4.5 w-4.5 text-amber-500" /> Add Contacts to Group
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">Bulk-select contacts from People Directory or Business Cards.</p>
                    </div>

                    {/* Source Selector 3 Pills */}
                    <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200/50 text-[11px] font-bold">
                      <button
                        type="button"
                        onClick={() => {
                          setAddContactSubTab("directory");
                          setContactSearchQuery("");
                        }}
                        className={`flex-1 text-center py-1.5 rounded-lg transition-all ${
                          addContactSubTab === "directory" ? "bg-white text-slate-900 shadow-sm font-black" : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        People ({directoryContacts.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAddContactSubTab("businessCards");
                          setContactSearchQuery("");
                        }}
                        className={`flex-1 text-center py-1.5 rounded-lg transition-all ${
                          addContactSubTab === "businessCards" ? "bg-white text-slate-900 shadow-sm font-black" : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        Cards ({businessCardContacts.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAddContactSubTab("manual");
                          setContactSearchQuery("");
                        }}
                        className={`flex-1 text-center py-1.5 rounded-lg transition-all ${
                          addContactSubTab === "manual" ? "bg-white text-slate-900 shadow-sm font-black" : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        Manual
                      </button>
                    </div>

                    <form onSubmit={handleAddContactToGroup} className="space-y-3">
                      {addContactSubTab === "manual" ? (
                        <>
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Contact Name *</label>
                            <input
                              type="text"
                              placeholder="e.g. Amit Kumar"
                              value={newContactName}
                              onChange={(e) => setNewContactName(e.target.value)}
                              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-amber-400 focus:outline-none transition-all"
                              required
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Phone Number (with Country Code) *</label>
                            <input
                              type="text"
                              placeholder="e.g. 919999900000"
                              value={newContactPhone}
                              onChange={(e) => setNewContactPhone(e.target.value)}
                              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-amber-400 focus:outline-none transition-all font-mono"
                              required
                            />
                          </div>
                        </>
                      ) : (
                        <div className="space-y-2">
                          {/* Search bar */}
                          <div className="relative">
                            <LuSearch className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                            <input
                              type="text"
                              placeholder="Search by name, phone, or company..."
                              value={contactSearchQuery}
                              onChange={(e) => setContactSearchQuery(e.target.value)}
                              className="w-full rounded-xl border border-slate-200 pl-8 pr-3 py-1.5 text-xs focus:border-amber-400 focus:outline-none transition-all"
                            />
                          </div>

                          {/* Select All Toggle Header */}
                          {(() => {
                            const filtered = getFilteredContacts();
                            const isAllSelected = filtered.length > 0 && filtered.every(c => selectedContactIds.has(c._id || c.id));
                            const toggleAll = () => {
                              setSelectedContactIds(prev => {
                                const next = new Set(prev);
                                if (isAllSelected) {
                                  filtered.forEach(c => next.delete(c._id || c.id));
                                } else {
                                  filtered.forEach(c => next.add(c._id || c.id));
                                }
                                return next;
                              });
                            };

                            return (
                              <div className="flex items-center justify-between px-1 py-1 text-[11px] border-b border-slate-100 font-bold">
                                <button
                                  type="button"
                                  onClick={toggleAll}
                                  className="flex items-center gap-1.5 text-slate-600 hover:text-amber-600 transition"
                                >
                                  {isAllSelected ? (
                                    <LuSquareCheck className="h-4 w-4 text-amber-500" />
                                  ) : (
                                    <LuSquare className="h-4 w-4 text-slate-400" />
                                  )}
                                  <span>{isAllSelected ? "Deselect All" : "Select All"}</span>
                                </button>
                                <span className="text-[10px] font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                                  Selected: <strong>{selectedContactIds.size}</strong>
                                </span>
                              </div>
                            );
                          })()}

                          {/* Scrollable Checkbox List */}
                          <div className="max-h-[220px] overflow-y-auto space-y-1 border border-slate-100 rounded-xl p-1.5 bg-slate-50/40">
                            {contactsLoading ? (
                              <div className="flex flex-col items-center py-8 gap-1.5 text-xs text-slate-400">
                                <LuLoader className="h-4 w-4 animate-spin text-amber-500" /> Loading contacts...
                              </div>
                            ) : getFilteredContacts().length === 0 ? (
                              <div className="text-center py-8 text-xs text-slate-400 italic">
                                No contacts found.
                              </div>
                            ) : (
                              getFilteredContacts().map(c => {
                                const contactKey = c._id || c.id;
                                const isChecked = selectedContactIds.has(contactKey);
                                return (
                                  <div
                                    key={contactKey}
                                    onClick={() => toggleSelectContact(contactKey)}
                                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all border ${
                                      isChecked
                                        ? "bg-amber-50/80 border-amber-200/80"
                                        : "bg-white hover:bg-slate-50 border-slate-100"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5">
                                      {isChecked ? (
                                        <LuSquareCheck className="h-4 w-4 text-amber-500 shrink-0" />
                                      ) : (
                                        <LuSquare className="h-4 w-4 text-slate-300 shrink-0" />
                                      )}
                                      <div>
                                        <h5 className="text-xs font-bold text-slate-900 leading-none">{c.name}</h5>
                                        <p className="text-[10px] font-mono text-slate-400 mt-0.5">{c.phone || "No Phone"}</p>
                                      </div>
                                    </div>
                                    {c.company && (
                                      <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded truncate max-w-[90px]">
                                        {c.company}
                                      </span>
                                    )}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}

                      <div className="space-y-1 pt-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Target Group *</label>
                        <select
                          value={newContactGroup}
                          onChange={(e) => setNewContactGroup(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-amber-400 focus:outline-none transition-all font-semibold"
                          required
                        >
                          <option value="">-- Select Target Group --</option>
                          {waGroups.map(g => (
                            <option key={g._id || g.id} value={g._id || g.id}>
                              {g.name} ({g.contactCount !== undefined ? g.contactCount : (g.contactsCount || 0)} Contacts)
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        type="submit"
                        disabled={contactSubmitting || (addContactSubTab !== "manual" && selectedContactIds.size === 0)}
                        className="w-full flex items-center justify-center gap-1 rounded-xl border border-slate-900/10 bg-amber-400 text-slate-900 py-2.5 text-xs font-black hover:bg-amber-500 disabled:opacity-50 transition-all shadow-sm"
                      >
                        {contactSubmitting ? (
                          <LuLoader className="h-4 w-4 animate-spin" />
                        ) : (
                          `+ Add ${addContactSubTab !== "manual" && selectedContactIds.size > 0 ? `${selectedContactIds.size} ` : ""}Contacts to Group`
                        )}
                      </button>
                    </form>
                  </div>
                </div>

                {/* Right Column: Contact Groups Overview Table */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <div>
                        <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                          <LuUsers className="h-5 w-5 text-amber-500" /> Active Contact Groups
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">Synced across MagnifAI People Directory and WhatsAI workspace</p>
                      </div>
                      <button
                        onClick={loadWaGroups}
                        className="text-xs text-amber-600 hover:text-amber-700 flex items-center gap-1 font-bold bg-amber-50 hover:bg-amber-100/80 px-3 py-1.5 rounded-xl transition"
                      >
                        <LuRefreshCw className="h-3 w-3" /> Refresh Groups
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      {groupsLoading ? (
                        <div className="flex flex-col items-center py-10 gap-2 text-xs text-slate-400">
                          <LuLoader className="h-5 w-5 animate-spin text-amber-500" />
                          Loading contact groups...
                        </div>
                      ) : waGroups.length === 0 ? (
                        <div className="text-center py-12 text-xs text-slate-400 italic">No contact groups created yet. Use the form on the left to create one.</div>
                      ) : (
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-slate-100 text-slate-400 font-bold">
                              <th className="py-2.5">Group Name</th>
                              <th className="py-2.5">Total Contacts</th>
                              <th className="py-2.5">Sync Source</th>
                              <th className="py-2.5 text-right">Quick Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {waGroups.map((g) => (
                              <tr
                                key={g._id || g.id}
                                onClick={() => openGroupMembersModal(g)}
                                className="border-b border-slate-50 last:border-b-0 hover:bg-amber-50/50 cursor-pointer transition-colors"
                              >
                                <td className="py-3 font-bold text-slate-800 flex items-center gap-2">
                                  <div className="h-2 w-2 rounded-full bg-amber-400"></div>
                                  <span className="hover:underline">{g.name}</span>
                                </td>
                                <td className="py-3">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openGroupMembersModal(g);
                                    }}
                                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-100 transition shadow-xs"
                                  >
                                    <LuUsers className="h-3 w-3 text-blue-500" />
                                    {g.contactCount !== undefined ? g.contactCount : (g.contactsCount || 0)} Contacts
                                  </button>
                                </td>
                                <td className="py-3">
                                  <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                    {g.source === "peopleDirectory" ? "People Directory" : "WhatsAI Synced"}
                                  </span>
                                </td>
                                <td className="py-3 text-right">
                                  <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                                    <button
                                      onClick={() => openGroupMembersModal(g)}
                                      className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 hover:text-amber-700 bg-slate-100 hover:bg-amber-100/80 rounded-lg px-2.5 py-1 transition-all"
                                    >
                                      <LuUsers className="h-3 w-3 text-amber-500" /> Manage Members
                                    </button>
                                    <button
                                      onClick={() => {
                                        setCampaignGroupId(g._id || g.id);
                                        setSubTab("campaigns");
                                      }}
                                      className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-100/80 rounded-lg px-2.5 py-1 transition-all"
                                    >
                                      <LuMegaphone className="h-3 w-3 text-emerald-500" /> Use in Campaign
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* BROADCAST CAMPAIGNS SUB-TAB */}
            {subTab === "campaigns" && (
              <div className="space-y-6 animate-fadeIn font-sans">
                {/* Launch WhatsApp Campaign */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                  <div>
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <LuMegaphone className="h-5 w-5 text-amber-500" /> Launch WhatsApp Broadcast Campaign
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Configure template variables and send instant broadcast campaigns to targeted contact groups.</p>
                  </div>

                  <form onSubmit={handleLaunchWaCampaign} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block font-sans">Campaign Name *</label>
                        <input
                          type="text"
                          placeholder="e.g. Festival Offer Broadcast"
                          value={newCampaignName}
                          onChange={(e) => setNewCampaignName(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-amber-400 focus:outline-none transition-all"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block font-sans">Select Approved Template *</label>
                        <select
                          value={campaignTemplateId}
                          onChange={(e) => setCampaignTemplateId(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-amber-400 focus:outline-none transition-all font-semibold"
                          required
                        >
                          <option value="">-- Choose Template --</option>
                          {templates
                            .filter(t => t.status === "APPROVED")
                            .map(t => (
                              <option key={t._id || t.id || t.templateName || t.name} value={t._id || t.id}>
                                {t.name || t.templateName} ({t.language.toUpperCase()} • {t.variablesCount || t.variables?.length || 0} Params)
                              </option>
                            ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block font-sans">Target Contact Group *</label>
                        <select
                          value={campaignGroupId}
                          onChange={(e) => setCampaignGroupId(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-amber-400 focus:outline-none transition-all font-semibold"
                          required
                        >
                          <option value="">-- Choose Target Group --</option>
                          {waGroups.map(g => (
                            <option key={g._id || g.id} value={g._id || g.id}>
                              {g.name} ({g.contactCount !== undefined ? g.contactCount : (g.contactsCount || 0)} Contacts)
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Dynamic Template Variable Mapping & Live Preview Section */}
                    {(() => {
                      const selectedTemplate = templates.find(t => t._id === campaignTemplateId || t.id === campaignTemplateId || (t.metaTemplate || t.templateName || t.name) === campaignTemplateId);
                      if (!selectedTemplate) return null;

                      const body = selectedTemplate.bodyText || selectedTemplate.bodyPreview || "";
                      const matches = body.match(/\{\{(\d+)\}\}/g) || [];
                      const varKeys = Array.from(new Set(matches.map(m => m.replace(/[\{\}]/g, "")))).sort((a, b) => Number(a) - Number(b));

                      // Compute live preview text
                      let previewRendered = body;
                      varKeys.forEach(k => {
                        const val = campaignVariables[k] || `{{${k}}}`;
                        previewRendered = previewRendered.replaceAll(`{{${k}}}`, val);
                      });

                      return (
                        <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-4 animate-fadeIn">
                          <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                            <div className="flex items-center gap-2">
                              <span className="p-1.5 bg-amber-100 text-amber-800 rounded-lg text-xs font-black">
                                &lt;/&gt;
                              </span>
                              <div>
                                <h4 className="text-xs font-black text-slate-900">
                                  Message Personalization & Parameters ({varKeys.length} Variables)
                                </h4>
                                <p className="text-[11px] text-slate-500">
                                  Choose how recipient contact names, CEO name, and custom fields map into this template
                                </p>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                              {selectedTemplate.category || "MARKETING"} • {selectedTemplate.language.toUpperCase()}
                            </span>
                          </div>

                          {varKeys.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {varKeys.map((k) => {
                                const currentVal = campaignVariables[k] || "";
                                const isContactName = currentVal === "{{contact.name}}" || currentVal === "Recipient Contact Name";
                                const isCeoName = currentVal === (user?.name || "Lakshmi Raj Singh");
                                return (
                                  <div key={k} className="p-3 bg-white rounded-xl border border-slate-200 space-y-2 shadow-xs">
                                    <div className="flex items-center justify-between">
                                      <label className="text-[10px] font-black text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                        Variable &#123;&#123;{k}&#125;&#125;
                                      </label>
                                      <div className="flex items-center gap-1">
                                        <button
                                          type="button"
                                          onClick={() => setCampaignVariables(prev => ({ ...prev, [k]: "{{contact.name}}" }))}
                                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition ${
                                            isContactName
                                              ? "bg-emerald-600 text-white shadow-xs"
                                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                          }`}
                                        >
                                          👤 Contact Name
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setCampaignVariables(prev => ({ ...prev, [k]: user?.name || "Lakshmi Raj Singh" }))}
                                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition ${
                                            isCeoName
                                              ? "bg-blue-600 text-white shadow-xs"
                                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                          }`}
                                        >
                                          👔 CEO Name
                                        </button>
                                      </div>
                                    </div>
                                    <input
                                      type="text"
                                      placeholder={k === "1" ? "e.g. {{contact.name}} or Customer Name" : `Value for parameter {{${k}}}`}
                                      value={campaignVariables[k] || ""}
                                      onChange={(e) => setCampaignVariables(prev => ({ ...prev, [k]: e.target.value }))}
                                      className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs focus:border-amber-400 focus:bg-white focus:outline-none transition"
                                      required
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-500 italic">
                              This template has static content without variable parameters.
                            </p>
                          )}

                          {/* Header Media Uploader */}
                          {(selectedTemplate.headerType === "IMAGE" || selectedTemplate.headerType === "VIDEO") && (
                            <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2.5 shadow-xs">
                              <div className="flex items-center justify-between">
                                <label className="text-[10px] font-black text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 uppercase tracking-wider">
                                  {selectedTemplate.headerType === "IMAGE" ? "🖼️ Header Image (Required)" : "📹 Header Video (Required)"}
                                </label>
                                {campaignVariables["header_image"] && (
                                  <button
                                    type="button"
                                    onClick={() => setCampaignVariables(prev => {
                                      const copy = { ...prev };
                                      delete copy["header_image"];
                                      return copy;
                                    })}
                                    className="text-[10px] font-bold text-red-600 hover:text-red-800 transition"
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                              
                              {campaignVariables["header_image"] ? (
                                <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-50 h-32 flex items-center justify-center">
                                  {selectedTemplate.headerType === "IMAGE" ? (
                                    <img 
                                      src={campaignVariables["header_image"]} 
                                      alt="Header preview" 
                                      className="h-full w-full object-contain"
                                    />
                                  ) : (
                                    <video 
                                      src={campaignVariables["header_image"]} 
                                      controls
                                      className="h-full w-full object-contain"
                                    />
                                  )}
                                </div>
                              ) : (
                                <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl p-4 bg-slate-50/50 hover:bg-white transition cursor-pointer relative">
                                  <input
                                    type="file"
                                    accept={selectedTemplate.headerType === "IMAGE" ? "image/*" : "video/*"}
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (!file) return;
                                      try {
                                        toastSuccess(selectedTemplate.headerType === "IMAGE" ? "Uploading image..." : "Uploading video...");
                                        const fd = new FormData();
                                        fd.append("file", file);
                                        const uploadRes = await apiForm("/api/app/whatsapp/upload-media", {
                                          method: "POST",
                                          token,
                                          formData: fd
                                        });
                                        if (uploadRes && uploadRes.success && uploadRes.url) {
                                          setCampaignVariables(prev => ({ ...prev, header_image: uploadRes.url }));
                                          toastSuccess(selectedTemplate.headerType === "IMAGE" ? "Header image uploaded successfully!" : "Header video uploaded successfully!");
                                        } else {
                                          throw new Error(uploadRes?.error || "Failed to upload file");
                                        }
                                      } catch (err) {
                                        toastFromError(err);
                                      }
                                    }}
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                  />
                                  <div className="text-center space-y-1">
                                    <LuPlus className="mx-auto text-slate-400 text-lg" />
                                    <p className="text-xs font-bold text-slate-600">
                                      {selectedTemplate.headerType === "IMAGE" ? "Upload Header Image" : "Upload Header Video"}
                                    </p>
                                    <p className="text-[10px] text-slate-400">
                                      {selectedTemplate.headerType === "IMAGE" ? "Supports JPG, PNG, WEBP (Max 50MB)" : "Supports MP4, WEBM (Max 50MB)"}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Real-time Message Preview Box */}
                          <div className="space-y-1.5 pt-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                              Live Message Preview
                            </label>
                            <div className="p-3.5 bg-emerald-900/90 text-emerald-50 rounded-xl font-sans text-xs whitespace-pre-wrap leading-relaxed shadow-inner border border-emerald-800/80">
                              {selectedTemplate.headerType === "IMAGE" && (
                                <div className="mb-2 rounded overflow-hidden max-h-32 bg-emerald-950/60 flex items-center justify-center border border-emerald-800/80">
                                  {campaignVariables["header_image"] ? (
                                    <img 
                                      src={campaignVariables["header_image"]} 
                                      alt="Header attached" 
                                      className="max-h-32 w-full object-contain"
                                    />
                                  ) : (
                                    <span className="text-[10px] font-mono text-emerald-300 p-2 block">
                                      🖼️ [Header Media: Image Attached]
                                    </span>
                                  )}
                                </div>
                              )}
                              {selectedTemplate.headerType === "VIDEO" && (
                                <div className="mb-2 rounded overflow-hidden max-h-32 bg-emerald-950/60 flex items-center justify-center border border-emerald-800/80">
                                  {campaignVariables["header_image"] ? (
                                    <video 
                                      src={campaignVariables["header_image"]} 
                                      controls
                                      className="max-h-32 w-full object-contain"
                                    />
                                  ) : (
                                    <span className="text-[10px] font-mono text-emerald-300 p-2 block">
                                      📹 [Header Media: Video Attached]
                                    </span>
                                  )}
                                </div>
                              )}
                              {previewRendered}
                              {selectedTemplate.footerText && (
                                <div className="mt-2 text-[10px] text-emerald-300/80 border-t border-emerald-800/60 pt-1">
                                  {selectedTemplate.footerText}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Scheduling Mode Option */}
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block">
                          Delivery Scheduling
                        </label>
                        <p className="text-[11px] text-slate-400">
                          Send broadcast immediately to group or schedule for a specific date & time
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setCampaignSendType("now")}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            campaignSendType === "now"
                              ? "bg-slate-900 text-white shadow-xs"
                              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          🚀 Send Immediately
                        </button>
                        <button
                          type="button"
                          onClick={() => setCampaignSendType("scheduled")}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            campaignSendType === "scheduled"
                              ? "bg-slate-900 text-white shadow-xs"
                              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          📅 Schedule for Later
                        </button>
                        {campaignSendType === "scheduled" && (
                          <input
                            type="datetime-local"
                            value={campaignScheduledAt}
                            onChange={(e) => setCampaignScheduledAt(e.target.value)}
                            className="rounded-xl border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-xs"
                            required={campaignSendType === "scheduled"}
                          />
                        )}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={campaignLoading}
                      className="w-full md:w-auto px-8 flex items-center justify-center gap-1.5 rounded-xl border border-slate-900/10 bg-amber-400 text-slate-900 py-2.5 text-xs font-black hover:bg-amber-500 disabled:opacity-50 transition-all shadow-sm"
                    >
                      {campaignLoading ? (
                        <LuLoader className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <LuMegaphone className="h-4 w-4" /> {campaignSendType === "scheduled" ? "Schedule Broadcast Campaign" : "Launch & Send Broadcast"}
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* WhatsApp Campaigns Status Tracker */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <div>
                      <h3 className="text-base font-black text-slate-900">Broadcast Campaigns History</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Track delivery logs and status of all launched WhatsApp broadcasts.</p>
                    </div>
                    <button
                      onClick={loadWaCampaigns}
                      className="text-xs text-amber-600 hover:text-amber-700 flex items-center gap-1 font-bold bg-amber-50 hover:bg-amber-100/80 px-3 py-1.5 rounded-xl transition"
                    >
                      <LuRefreshCw className="h-3 w-3" /> Refresh Logs
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    {campaignsLoading ? (
                      <div className="flex flex-col items-center py-10 gap-2 text-xs text-slate-400">
                        <LuLoader className="h-5 w-5 animate-spin text-amber-500" />
                        Loading campaigns logs...
                      </div>
                    ) : waCampaigns.length === 0 ? (
                      <div className="text-center py-12 text-xs text-slate-400 italic">No campaigns launched yet. Use the form above to launch your first broadcast.</div>
                    ) : (
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 font-bold">
                            <th className="py-2.5">Campaign Name</th>
                            <th className="py-2.5">Template</th>
                            <th className="py-2.5">Target Group</th>
                            <th className="py-2.5">Status</th>
                            <th className="py-2.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {waCampaigns.map((c) => {
                            const matchedT = templates.find(t => t.id === c.templateId || t.templateName === c.templateId || t.name === c.templateId);
                            const matchedG = waGroups.find(g => (g._id || g.id) === (c.groupId || c.targetGroup));
                            const isDraft = (c.status || "").toLowerCase() === "draft";
                            const isCompleted = (c.status || "").toLowerCase() === "completed";
                            const isTriggering = triggeringCampaignId === (c._id || c.id);

                            return (
                              <tr key={c._id || c.id} className="border-b border-slate-50 last:border-b-0 hover:bg-slate-50/50">
                                <td className="py-3 font-bold text-slate-800">
                                  {c.name}
                                  {c.scheduledAt && (
                                    <div className="text-[10px] text-amber-600 font-medium">
                                      🕒 Scheduled: {new Date(c.scheduledAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                    </div>
                                  )}
                                </td>
                                <td className="py-3 text-slate-700">
                                  <span className="font-mono text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                    {c.templateName || (matchedT ? (matchedT.name || matchedT.templateName) : (c.templateId || "Template"))}
                                  </span>
                                </td>
                                <td className="py-3 text-slate-700 font-semibold">
                                  <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[11px] font-bold border border-blue-100">
                                    <LuUsers className="h-3 w-3 text-blue-500" />
                                    {c.groupName || (matchedG ? matchedG.name : (c.groupId || "Target Group"))}
                                  </span>
                                </td>
                                <td className="py-3">
                                  <div className="flex flex-col gap-1 items-start">
                                    <span
                                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                        isCompleted
                                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                          : isDraft
                                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                                          : "bg-blue-50 text-blue-700 border border-blue-100"
                                      }`}
                                    >
                                      {isCompleted ? "✓ Completed" : isDraft ? (c.scheduledAt ? "🕒 Scheduled" : "Draft") : (c.status || "SENT")}
                                    </span>
                                    {(c.sent > 0 || c.totalContacts > 0 || c.sentCount > 0) && (
                                      <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-mono">
                                        📨 Sent: {c.sent || c.sentCount || 0}/{c.totalContacts || c.sent || c.sentCount || 0}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    {isDraft ? (
                                      <button
                                        onClick={() => handleSendBroadcast(c._id || c.id)}
                                        disabled={isTriggering || deletingCampaignId === (c._id || c.id)}
                                        className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg px-3 py-1.5 transition-all shadow-xs disabled:opacity-50"
                                      >
                                        {isTriggering ? (
                                          <LuLoader className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                          <LuSend className="h-3.5 w-3.5" />
                                        )}
                                        Send Broadcast
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => handleSendBroadcast(c._id || c.id)}
                                        disabled={isTriggering || deletingCampaignId === (c._id || c.id)}
                                        className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 rounded-lg px-2.5 py-1 transition-all disabled:opacity-50"
                                      >
                                        {isTriggering ? (
                                          <LuLoader className="h-3 w-3 animate-spin" />
                                        ) : (
                                          <LuRefreshCw className="h-3 w-3" />
                                        )}
                                        Re-send
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleDeleteCampaign(c._id || c.id)}
                                      disabled={deletingCampaignId === (c._id || c.id) || isTriggering}
                                      title="Delete Campaign"
                                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all disabled:opacity-50"
                                    >
                                      {deletingCampaignId === (c._id || c.id) ? (
                                        <LuLoader className="h-3.5 w-3.5 animate-spin text-rose-500" />
                                      ) : (
                                        <LuTrash2 className="h-3.5 w-3.5" />
                                      )}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      )}

      {/* Template Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <LuEye className="h-5 w-5 text-amber-500" />
                  {previewTemplate.name || previewTemplate.templateName}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Language: {previewTemplate.language.toUpperCase()} • Category: {previewTemplate.category}
                </p>
              </div>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <LuX className="h-5 w-5" />
              </button>
            </div>

            {/* WhatsApp Chat Preview Bubble */}
            <div className="bg-emerald-50/40 rounded-xl p-4 border border-emerald-100 space-y-2">
              <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider block">
                WhatsApp Message Preview
              </span>
              <div className="bg-white rounded-xl rounded-tl-none p-3.5 shadow-sm border border-emerald-100 space-y-2 text-xs text-slate-800 leading-relaxed font-sans">
                {previewTemplate.headerText && (
                  <div className="font-bold text-slate-900 pb-1 border-b border-slate-100">
                    {previewTemplate.headerText}
                  </div>
                )}
                <div className="whitespace-pre-wrap">
                  {previewTemplate.bodyPreview || previewTemplate.bodyText || previewTemplate.body || "No message text available."}
                </div>
                {previewTemplate.footerText && (
                  <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-50 font-sans">
                    {previewTemplate.footerText}
                  </div>
                )}
              </div>
              <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1 font-mono">
                <span>Required Params: <strong className="text-slate-800">{previewTemplate.variablesCount || 0}</strong></span>
                <span className="text-emerald-700 font-bold bg-emerald-100/60 px-2 py-0.5 rounded">{previewTemplate.status}</span>
              </div>
            </div>

            <button
              onClick={() => setPreviewTemplate(null)}
              className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}

      {/* Initiate New Chat / Outbox Modal */}
      {showOutboxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <LuMessageSquare className="h-5 w-5 text-amber-500" />
                  Initiate New Conversation
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Send a verified WhatsApp template or sync a lead</p>
              </div>
              <button
                onClick={() => setShowOutboxModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <LuX className="h-5 w-5" />
              </button>
            </div>

            {/* Sub-tabs inside modal */}
            <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200/50">
              <button
                type="button"
                onClick={() => setOutboxModalTab("outbox")}
                className={`flex-1 text-center py-1.5 rounded-lg text-xs font-bold transition-all ${
                  outboxModalTab === "outbox" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Direct Template Message
              </button>
              <button
                type="button"
                onClick={() => setOutboxModalTab("sync")}
                className={`flex-1 text-center py-1.5 rounded-lg text-xs font-bold transition-all ${
                  outboxModalTab === "sync" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Sync Registered Lead
              </button>
            </div>

            {/* Tab 1: Outbox Form */}
            {outboxModalTab === "outbox" ? (
              <form onSubmit={handleSendOutboxMessage} className="space-y-3 font-sans">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">
                    Mobile Number *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +919876543210"
                    value={outboxPhone}
                    onChange={(e) => setOutboxPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-amber-400 focus:outline-none transition-all font-mono"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">
                    Select Approved Template *
                  </label>
                  <select
                    value={outboxTemplate}
                    onChange={(e) => {
                      setOutboxTemplate(e.target.value);
                      setOutboxParams({});
                    }}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-amber-400 focus:outline-none transition-all font-mono font-semibold"
                    required
                  >
                    <option value="">-- Choose Template --</option>
                    {templates
                      .filter(t => t.status === "APPROVED")
                      .map(t => {
                        const valKey = t.templateName || t.metaTemplate || t.name;
                        return (
                          <option key={valKey} value={valKey}>
                            {t.name || t.templateName} ({t.language.toUpperCase()} • {t.variablesCount || t.variables?.length || 0} Params)
                          </option>
                        );
                      })}
                  </select>
                </div>

                {/* Dynamic Template Variables */}
                {(() => {
                  const selT = templates.find(
                    t => (t.templateName && t.templateName === outboxTemplate) ||
                         (t.metaTemplate && t.metaTemplate === outboxTemplate) ||
                         (t.name && t.name === outboxTemplate) ||
                         (t.templateName || "").toLowerCase() === (outboxTemplate || "").toLowerCase() ||
                         (t.name || "").toLowerCase() === (outboxTemplate || "").toLowerCase()
                  );
                  const vCount = selT?.variablesCount || (selT?.variables?.length) || 0;
                  if (!selT || vCount === 0) return null;

                  return (
                    <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-3 space-y-2 animate-fadeIn">
                      <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider block">
                        Required Parameters ({vCount})
                      </span>
                      {Array.from({ length: vCount }).map((_, idx) => {
                        const key = String(idx + 1);
                        return (
                          <div key={key} className="space-y-0.5">
                            <label className="text-[9px] font-bold text-slate-600">
                              Variable {key} {idx === 0 ? "(e.g. Name)" : idx === 1 ? "(e.g. Festival / Note)" : ""}
                            </label>
                            <input
                              type="text"
                              placeholder={idx === 0 ? "Customer Name" : `Parameter ${key}`}
                              value={outboxParams[key] || ""}
                              onChange={(e) => setOutboxParams(prev => ({ ...prev, [key]: e.target.value }))}
                              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs focus:border-amber-400 focus:outline-none"
                            />
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowOutboxModal(false)}
                    className="w-1/3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={outboxSending}
                    className="w-2/3 flex items-center justify-center gap-1.5 rounded-xl border border-slate-900/10 bg-amber-400 text-slate-900 py-2.5 text-xs font-black hover:bg-amber-500 disabled:opacity-50 transition-all shadow-sm"
                  >
                    {outboxSending ? (
                      <LuLoader className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <LuSend className="h-4 w-4" /> Send Initial Message
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* Tab 2: Sync Lead Form */
              <form onSubmit={handleManualSyncSend} className="space-y-3 font-sans">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">
                    Choose Registered Contact
                  </label>
                  {contactsLoading ? (
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 py-2">
                      <LuLoader className="h-3.5 w-3.5 animate-spin text-amber-500" /> Loading contacts...
                    </div>
                  ) : (
                    <select
                      value={selectedContactId}
                      onChange={(e) => setSelectedContactId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-amber-400 focus:outline-none transition-all"
                      required
                    >
                      <option value="">-- Choose contact --</option>
                      {contacts.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name} ({c.phone})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowOutboxModal(false)}
                    className="w-1/3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={syncLoading || !selectedContactId}
                    className="w-2/3 flex items-center justify-center gap-1 rounded-xl border border-slate-900/10 bg-slate-900 hover:bg-slate-800 text-white py-2.5 text-xs font-black disabled:opacity-50 transition-all shadow-sm"
                  >
                    {syncLoading ? (
                      <LuLoader className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      "Sync Profile to WhatsAI"
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Group Members Inspection & Management Modal */}
      {selectedGroupForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] animate-scaleUp">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-100/80 text-amber-700 rounded-xl">
                  <LuUsers className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black text-slate-900 leading-none">
                      {selectedGroupForModal.name}
                    </h4>
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      {groupModalMemberPhones.size} Members Selected
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Inspect, add, or remove contacts for this WhatsApp Group
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedGroupForModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <LuX className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="px-4 pt-3 pb-2 border-b border-slate-100 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setGroupModalTab("members")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    groupModalTab === "members"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Current Members ({groupModalMemberPhones.size})
                </button>
                <button
                  type="button"
                  onClick={() => setGroupModalTab("people")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    groupModalTab === "people"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  People ({directoryContacts.length})
                </button>
                <button
                  type="button"
                  onClick={() => setGroupModalTab("cards")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    groupModalTab === "cards"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Cards ({businessCardContacts.length})
                </button>
                <button
                  type="button"
                  onClick={() => setGroupModalTab("manual")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    groupModalTab === "manual"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  + Manual
                </button>
              </div>

              {groupModalTab !== "manual" && (
                <div className="relative max-w-[160px]">
                  <LuSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={groupModalSearch}
                    onChange={(e) => setGroupModalSearch(e.target.value)}
                    placeholder="Search..."
                    className="w-full pl-8 pr-2.5 py-1 text-[11px] rounded-lg border border-slate-200 bg-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Modal Body Content */}
            <div className="p-4 overflow-y-auto max-h-[360px] flex-1">
              {groupModalLoading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2 text-xs text-slate-400">
                  <LuLoader className="h-6 w-6 animate-spin text-amber-500" />
                  Loading group members...
                </div>
              ) : groupModalTab === "manual" ? (
                /* Tab: Manual Add */
                <form onSubmit={handleGroupModalManualAdd} className="space-y-3 p-2 bg-slate-50/50 rounded-xl border border-slate-100">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Full Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. John Doe"
                      value={groupModalManualName}
                      onChange={(e) => setGroupModalManualName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:border-amber-400 focus:outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Phone Number (with Country Code) *</label>
                    <input
                      type="text"
                      placeholder="e.g. 919876543210"
                      value={groupModalManualPhone}
                      onChange={(e) => setGroupModalManualPhone(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:border-amber-400 focus:outline-none"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-amber-400 text-slate-900 font-black text-xs hover:bg-amber-500 transition shadow-xs flex items-center justify-center gap-1"
                  >
                    <LuPlus className="h-3.5 w-3.5" /> Add Contact to Selection
                  </button>
                </form>
              ) : (
                /* Tabs: Current Members / People / Cards */
                (() => {
                  let listToRender = [];
                  if (groupModalTab === "members") {
                    const allSources = [...groupModalMembers, ...directoryContacts, ...businessCardContacts];
                    const seen = new Set();
                    listToRender = Array.from(groupModalMemberPhones).map(phone => {
                      const found = allSources.find(c => (c.phone || "").replace(/[^0-9]/g, "").endsWith(phone.slice(-10)));
                      return found || { name: "Group Contact", phone, _id: phone, source: "Group" };
                    }).filter(c => {
                      if (!c.phone || seen.has(c.phone)) return false;
                      seen.add(c.phone);
                      return true;
                    });
                  } else if (groupModalTab === "people") {
                    listToRender = directoryContacts;
                  } else if (groupModalTab === "cards") {
                    listToRender = businessCardContacts;
                  }

                  if (groupModalSearch.trim()) {
                    const q = groupModalSearch.toLowerCase();
                    listToRender = listToRender.filter(c => 
                      (c.name || "").toLowerCase().includes(q) ||
                      (c.phone || "").includes(q) ||
                      (c.company || "").toLowerCase().includes(q)
                    );
                  }

                  if (listToRender.length === 0) {
                    return (
                      <div className="text-center py-12 text-xs text-slate-400 italic">
                        {groupModalTab === "members"
                          ? "No contacts currently selected in this group. Use the 'People' or 'Cards' tab above to select contacts."
                          : "No matching contacts found."}
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-1.5">
                      {listToRender.map(c => {
                        const cleanPhone = String(c.phone || "").replace(/[^0-9]/g, "");
                        const isChecked = groupModalMemberPhones.has(cleanPhone);
                        return (
                          <div
                            key={c._id || c.id || cleanPhone}
                            onClick={() => toggleGroupModalPhone(c.phone)}
                            className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all border ${
                              isChecked
                                ? "bg-amber-50/80 border-amber-200"
                                : "bg-white hover:bg-slate-50 border-slate-100"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {isChecked ? (
                                <LuSquareCheck className="h-4 w-4 text-amber-500 shrink-0" />
                              ) : (
                                <LuSquare className="h-4 w-4 text-slate-300 shrink-0" />
                              )}
                              <div>
                                <h5 className="text-xs font-bold text-slate-900 leading-none">{c.name}</h5>
                                <p className="text-[10px] font-mono text-slate-400 mt-0.5">{c.phone || "No Phone"}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {c.company && (
                                <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded truncate max-w-[100px]">
                                  {c.company}
                                </span>
                              )}
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                                isChecked
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-slate-100 text-slate-500"
                              }`}>
                                {isChecked ? "In Group" : "Available"}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()
              )}
            </div>

            {/* Modal Footer with Actions */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="text-xs text-slate-500">
                Total in Group: <strong className="text-slate-900 font-bold">{groupModalMemberPhones.size} contacts</strong>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedGroupForModal(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={groupModalSaving}
                  onClick={handleSaveGroupMembers}
                  className="px-5 py-2 flex items-center gap-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-900 text-xs font-black transition shadow-sm disabled:opacity-50"
                >
                  {groupModalSaving ? (
                    <LuLoader className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <LuCheck className="h-4 w-4" /> Save Group Members
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Real-time Ad Campaign Analytics Modal */}
      {showAnalyticsModal && selectedAnalytics && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-scaleIn">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                    {selectedAnalytics.platform?.toUpperCase() || "META"} ADS
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    selectedAnalytics.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-700 border-slate-200"
                  }`}>
                    {selectedAnalytics.status?.toUpperCase()}
                  </span>
                </div>
                <h3 className="text-base font-black text-slate-900 line-clamp-1">{selectedAnalytics.campaignName || "Campaign Analytics"}</h3>
                {selectedAnalytics.objective && (
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider mt-0.5">
                    🎯 Objective: {selectedAnalytics.objective}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowAnalyticsModal(false)}
                className="h-8 w-8 rounded-full bg-slate-200/60 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Overall Performance Insights */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">Overall Performance Metrics</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Impressions</span>
                    <span className="text-lg font-black text-slate-900 mt-1 block">
                      {selectedAnalytics.insights?.impressions?.toLocaleString() || "0"}
                    </span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Clicks</span>
                    <span className="text-lg font-black text-slate-900 mt-1 block">
                      {selectedAnalytics.insights?.clicks?.toLocaleString() || "0"}
                    </span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Spend</span>
                    <span className="text-lg font-black text-slate-900 mt-1 block">
                      ₹{selectedAnalytics.insights?.spend || selectedAnalytics.budget || 0}
                    </span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Avg CTR</span>
                    <span className="text-lg font-black text-slate-900 mt-1 block">
                      {selectedAnalytics.insights?.ctr ? `${selectedAnalytics.insights.ctr}%` : "3.8%"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Platform Breakdown */}
              {selectedAnalytics.platformBreakdown && (
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">Platform Breakdown</h4>
                  <div className="space-y-3">
                    {Object.entries(selectedAnalytics.platformBreakdown).map(([platform, data]) => (
                      <div key={platform} className="bg-slate-50/80 border border-slate-100 rounded-2xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-white shadow-sm border border-slate-200/60 flex items-center justify-center font-bold text-xs uppercase text-slate-800">
                            {platform.slice(0, 2)}
                          </div>
                          <div>
                            <h5 className="font-bold text-xs text-slate-900 capitalize">{platform} Placement</h5>
                            <span className="text-[10px] text-slate-500">Impressions: {data.impressions?.toLocaleString() || 0}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-slate-900 block">{data.clicks || 0} clicks</span>
                          <span className="text-[10px] font-bold text-slate-400">Spend: ₹{data.spend || 0}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ad Creatives & Copies */}
              {selectedAnalytics.ads && selectedAnalytics.ads.length > 0 && (
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">Ad Copies & Creatives</h4>
                  <div className="space-y-4">
                    {selectedAnalytics.ads.map((ad, idx) => (
                      <div key={idx} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-200/50 pb-2">
                          <span className="text-xs font-black text-slate-800">{ad.name || `Ad Creative #${idx + 1}`}</span>
                          <span className="text-[9px] uppercase font-bold text-slate-400">Preview</span>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4">
                          {ad.imageUrl && (
                            <div className="w-full sm:w-32 h-32 rounded-xl overflow-hidden border border-slate-200 bg-white flex items-center justify-center flex-shrink-0">
                              <img src={ad.imageUrl} alt="Ad creative preview" className="h-full w-full object-contain" />
                            </div>
                          )}
                          <div className="flex-1 space-y-2">
                            {ad.headline && (
                              <div>
                                <span className="text-[9px] uppercase font-bold text-slate-400 block">Headline</span>
                                <p className="text-xs font-black text-slate-900">{ad.headline}</p>
                              </div>
                            )}
                            {ad.primaryText && (
                              <div>
                                <span className="text-[9px] uppercase font-bold text-slate-400 block">Primary Text / Description</span>
                                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{ad.primaryText}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/60 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAnalyticsModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-sm"
              >
                Close Analytics
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
