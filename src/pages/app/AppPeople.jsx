import { useEffect, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import {
  LuRefreshCw, LuUsers, LuInstagram, LuFacebook, LuYoutube,
  LuMessageCircle, LuArrowLeft, LuExternalLink, LuTwitter, LuLinkedin,
  LuUserPlus, LuSearch, LuTrash2, LuPlus, LuCheck, LuPhone,
  LuMessageSquare, LuStar, LuTrendingUp, LuShieldCheck, LuUnlink
} from "react-icons/lu";
import { useAuth } from "../../auth/AuthProvider";
import { api } from "../../lib/api";
import { toastFromError, toastSuccess, toastError } from "../../lib/toast";

export function AppPeople() {
  const { token } = useAuth();
  const location = useLocation();
  const basePath = location.pathname.startsWith("/ceo") ? "/ceo" : "/app";

  // People section state variables
  const [peopleTab, setPeopleTab] = useState("new"); // "new" | "contacts" | "groups"
  const [contacts, setContacts] = useState([]);
  const [newlyJoined, setNewlyJoined] = useState([]);
  const [groups, setGroups] = useState([]);
  const [peopleSearch, setPeopleSearch] = useState("");
  const [selectedContactIds, setSelectedContactIds] = useState([]);
  const [peopleLoading, setPeopleLoading] = useState(false);
  
  // Total counts for header chips
  const [totalContactsCount, setTotalContactsCount] = useState(0);
  const [totalNewMembersCount, setTotalNewMembersCount] = useState(0);
  const [totalGroupsCount, setTotalGroupsCount] = useState(0);

  // Pagination states
  const [contactsPage, setContactsPage] = useState(1);
  const [hasMoreContacts, setHasMoreContacts] = useState(false);

  const [newMembersPage, setNewMembersPage] = useState(1);
  const [hasMoreNewMembers, setHasMoreNewMembers] = useState(false);

  const [groupsPage, setGroupsPage] = useState(1);
  const [hasMoreGroups, setHasMoreGroups] = useState(false);

  // Contact details sub-page states
  const [selectedContactId, setSelectedContactId] = useState(null);
  const [contactDetails, setContactDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [chatFilter, setChatFilter] = useState("all"); // "all" | "web" | "whatsapp"
  const [activeAgentIndex, setActiveAgentIndex] = useState(0);

  // Inline forms state
  const [showAddContactForm, setShowAddContactForm] = useState(false);
  const [addContactName, setAddContactName] = useState("");
  const [addContactPhone, setAddContactPhone] = useState("");
  const [addContactEmail, setAddContactEmail] = useState("");
  
  const [showCreateGroupForm, setShowCreateGroupForm] = useState(false);
  const [createGroupName, setCreateGroupName] = useState("");
  const [createGroupColor, setCreateGroupColor] = useState("#FFD54F");
  
  const [verifyingWhatsApp, setVerifyingWhatsApp] = useState(false);

  // Load all people data
  const loadPeople = useCallback(async () => {
    setPeopleLoading(true);
    try {
      const [contactsData, newMembersData, groupsData] = await Promise.all([
        api(`/api/app/people/contacts?page=1&limit=50&search=${encodeURIComponent(peopleSearch)}`, { token }),
        api("/api/app/people/new?page=1&limit=15", { token }),
        api("/api/app/people/groups?page=1&limit=10", { token })
      ]);
      setContacts(contactsData?.contacts || []);
      setTotalContactsCount(contactsData?.totalContacts || 0);
      setContactsPage(1);
      setHasMoreContacts(contactsData?.hasMore || false);

      setNewlyJoined(newMembersData?.newMembers || []);
      setTotalNewMembersCount(newMembersData?.total || 0);
      setNewMembersPage(1);
      setHasMoreNewMembers(newMembersData?.hasMore || false);

      setGroups(groupsData?.groups || []);
      setTotalGroupsCount(groupsData?.total || 0);
      setGroupsPage(1);
      setHasMoreGroups(groupsData?.hasMore || false);
    } catch (e) {
      console.error("Failed to load People data:", e.message);
      toastFromError(e, "Failed to load People data");
    } finally {
      setPeopleLoading(false);
    }
  }, [peopleSearch, token]);

  const onLoadMoreContacts = async () => {
    try {
      const nextPage = contactsPage + 1;
      const contactsData = await api(`/api/app/people/contacts?page=${nextPage}&limit=50&search=${encodeURIComponent(peopleSearch)}`, { token });
      if (contactsData?.contacts && contactsData.contacts.length > 0) {
        setContacts(prev => [...prev, ...contactsData.contacts]);
      }
      setContactsPage(nextPage);
      setHasMoreContacts(contactsData?.hasMore || false);
    } catch (e) {
      console.error("Failed to load more contacts:", e.message);
      toastFromError(e, "Failed to load more contacts");
    }
  };

  const onLoadMoreNewMembers = async () => {
    try {
      const nextPage = newMembersPage + 1;
      const newMembersData = await api(`/api/app/people/new?page=${nextPage}&limit=15`, { token });
      if (newMembersData?.newMembers && newMembersData.newMembers.length > 0) {
        setNewlyJoined(prev => [...prev, ...newMembersData.newMembers]);
      }
      setNewMembersPage(nextPage);
      setHasMoreNewMembers(newMembersData?.hasMore || false);
    } catch (e) {
      console.error("Failed to load more new members:", e.message);
      toastFromError(e, "Failed to load more new members");
    }
  };

  const onLoadMoreGroups = async () => {
    try {
      const nextPage = groupsPage + 1;
      const groupsData = await api(`/api/app/people/groups?page=${nextPage}&limit=10`, { token });
      if (groupsData?.groups && groupsData.groups.length > 0) {
        setGroups(prev => [...prev, ...groupsData.groups]);
      }
      setGroupsPage(nextPage);
      setHasMoreGroups(groupsData?.hasMore || false);
    } catch (e) {
      console.error("Failed to load more groups:", e.message);
      toastFromError(e, "Failed to load more groups");
    }
  };

  // Action Handlers
  const onOpenContactDetails = useCallback(async (id) => {
    setSelectedContactId(id);
    setDetailsLoading(true);
    setContactDetails(null);
    setActiveAgentIndex(0);
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

  // Load on mount and search query update
  useEffect(() => {
    Promise.resolve().then(() => {
      loadPeople();
    });
  }, [loadPeople]);

  // Handle selectedContactId passed from route state
  useEffect(() => {
    if (location.state?.selectedContactId) {
      onOpenContactDetails(location.state.selectedContactId);
    }
  }, [location.state, onOpenContactDetails]);

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
      // If the currently viewed contact is deleted, close the detail view
      if (selectedContactId === contactId) {
        setSelectedContactId(null);
        setContactDetails(null);
      }
      loadPeople();
    } catch (err) {
      toastFromError(err, "Failed to delete contact");
    }
  };

  // Sub-renderer for contact details log
  const renderContactDetailsView = () => {
    if (!selectedContactId) return null;

    return (
      <div className="animate-fadeIn bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
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
            {/* LEFT PROFILE CARD */}
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
                {contactDetails.contact.isMagnifaiUser && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <p className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full inline-block">
                      {contactDetails.contact.designation || "Product Lead"}
                    </p>
                    <p className="text-[11px] font-semibold text-slate-500 mt-1">
                      at <span className="font-bold text-slate-700">{contactDetails.contact.company || "MagnifAI Technologies"}</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Social links */}
              {contactDetails.contact.isMagnifaiUser ? (
                <div className="rounded-xl border border-slate-100 bg-white p-5 space-y-4 shadow-sm">
                  <div>
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Social Accounts</h4>
                    <p className="text-[10px] text-slate-400 font-semibold">Connected profiles via MagnifAI account</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {contactDetails.contact.socials?.linkedin && (
                      <a 
                        href={contactDetails.contact.socials.linkedin} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex-1 min-w-[80px] flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-bold text-slate-600 hover:bg-slate-100 transition shadow-sm"
                      >
                        <LuLinkedin className="h-4 w-4 text-blue-600" /> LinkedIn
                      </a>
                    )}
                    {contactDetails.contact.socials?.twitter && (
                      <a 
                        href={contactDetails.contact.socials.twitter} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex-1 min-w-[80px] flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-bold text-slate-600 hover:bg-slate-100 transition shadow-sm"
                      >
                        <LuTwitter className="h-4 w-4 text-slate-900" /> Twitter
                      </a>
                    )}
                    {contactDetails.contact.socials?.instagram && (
                      <a 
                        href={contactDetails.contact.socials.instagram} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex-1 min-w-[80px] flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-bold text-slate-600 hover:bg-slate-100 transition shadow-sm"
                      >
                        <LuInstagram className="h-4 w-4 text-pink-600" /> Instagram
                      </a>
                    )}
                  </div>

                  {/* AI Agents QR Codes */}
                  {contactDetails.contact.agents && contactDetails.contact.agents.length > 0 ? (
                    <div className="border-t border-slate-100 pt-4 space-y-4">
                      <div className="text-center">
                        <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-bold text-indigo-600 border border-indigo-200">
                          Active AI Agents ({contactDetails.contact.agents.length})
                        </span>
                      </div>
                      
                      {contactDetails.contact.agents.length > 1 ? (
                        <div className="space-y-4">
                          {/* Selector */}
                          <div className="flex flex-col gap-1 text-left">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Select AI Agent</label>
                            <select 
                              value={activeAgentIndex} 
                              onChange={(e) => setActiveAgentIndex(Number(e.target.value))}
                              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                            >
                              {contactDetails.contact.agents.map((ag, idx) => (
                                <option key={ag.agentId} value={idx}>{ag.name}</option>
                              ))}
                            </select>
                          </div>
                          
                          {/* Active Agent QR */}
                          <div className="text-center">
                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 inline-block shadow-inner mb-2">
                              <img 
                                src={contactDetails.contact.agents[activeAgentIndex].qrCodeUrl} 
                                alt="Agent QR Code" 
                                className="h-28 w-28 object-contain"
                              />
                            </div>
                            <p className="text-[11px] text-indigo-600 font-black uppercase tracking-wider">
                              {contactDetails.contact.agents[activeAgentIndex].name}
                            </p>
                            <p className="text-[9px] text-slate-400 font-semibold mt-0.5">
                              Scan or tap QR to chat with this AI Agent
                            </p>
                          </div>
                        </div>
                      ) : (
                        /* Single Agent QR */
                        <div className="text-center">
                          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 inline-block shadow-inner mb-2">
                            <img 
                              src={contactDetails.contact.agents[0].qrCodeUrl} 
                              alt="Agent QR Code" 
                              className="h-28 w-28 object-contain"
                            />
                          </div>
                          <p className="text-[11px] text-indigo-600 font-black uppercase tracking-wider">
                            {contactDetails.contact.agents[0].name}
                          </p>
                          <p className="text-[9px] text-slate-400 font-semibold mt-0.5">
                            Scan or tap QR to chat with this AI Agent
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Fallback if no agents found (e.g. Candidates or empty) */
                    <div className="border-t border-slate-100 pt-4 text-center">
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 inline-block shadow-inner mb-2">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(
                            `https://magnifai.in/chat?id=${contactDetails.contact.id}`
                          )}`} 
                          alt="QR Code" 
                          className="h-28 w-28 object-contain"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold">Registered MagnifAI Member</p>
                      <p className="text-[9px] text-slate-400 font-semibold">Scan or tap QR above to launch secure in-app chat</p>
                    </div>
                  )}
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

            {/* RIGHT TIMELINE */}
            <div className="md:col-span-7 rounded-xl border border-slate-100 bg-white p-5 space-y-4 shadow-sm flex flex-col max-h-[500px]">
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

              {/* Chat timeline */}
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
                            (msg.sender === "Me" || msg.sender !== contactDetails.contact.name)
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

  return (
    <div className="space-y-6 p-4 sm:p-6 bg-slate-50/30 min-h-screen">
      {/* Header section with back button and statistics counts */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.history.back()} 
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition shadow-sm"
          >
            <LuArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-xl font-black text-slate-900">People Directory</h2>
            <p className="text-xs text-slate-500 mt-0.5">Manage and monitor all your communication logs</p>
          </div>
        </div>

        {/* Dynamic stat chips */}
        <div className="flex gap-2 flex-wrap items-center">
          <span className="inline-flex items-center rounded-xl bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 border border-blue-200 shadow-sm">
            {totalContactsCount} Total Contacts
          </span>
          {totalNewMembersCount > 0 && (
            <span className="inline-flex items-center rounded-xl bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200 shadow-sm">
              {totalNewMembersCount} Newly Joined
            </span>
          )}
          <span className="inline-flex items-center rounded-xl bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700 border border-violet-200 shadow-sm">
            {totalGroupsCount} Groups
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      {selectedContactId ? (
        renderContactDetailsView()
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm animate-fadeIn">
          {/* Header toolbar for listing */}
          <div className="flex items-center justify-between flex-wrap gap-4 mb-5 pb-4 border-b border-slate-100">
            {/* Tab switcher buttons */}
            <div className="flex bg-slate-100 rounded-xl p-1 max-w-xs border border-slate-200/50 w-full sm:w-auto">
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
                  className={`flex-1 sm:flex-none sm:px-6 text-center py-1.5 rounded-lg text-xs font-bold transition-all ${
                    peopleTab === t.key
                      ? "bg-white text-slate-900 shadow-sm border border-slate-200/20"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {/* Global Add Contact Button */}
            <button
              onClick={() => setShowAddContactForm(!showAddContactForm)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-900/10 bg-amber-400 px-4 py-2 text-xs font-black text-slate-900 hover:bg-amber-500 shadow-sm transition-all"
            >
              <LuUserPlus className="h-3.5 w-3.5" /> Add Contact
            </button>
          </div>

          {/* Inline Add Contact Form - Rendered globally below header */}
          {showAddContactForm && (
            <form onSubmit={onAddContact} className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-5 space-y-3 animate-fadeIn shadow-inner">
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
                <button type="submit" className="px-4 py-1.5 rounded-lg bg-amber-400 border border-slate-900/10 text-xs font-bold text-slate-900 shadow hover:bg-amber-500 transition">Save Contact</button>
              </div>
            </form>
          )}

          {/* --- 1. NEW TAB --- */}
          {peopleTab === "new" && (
            <div className="space-y-3">
              {peopleLoading && newlyJoined.length === 0 ? (
                <div className="py-8 text-center"><LuRefreshCw className="h-5 w-5 animate-spin mx-auto text-amber-500" /></div>
              ) : newlyJoined.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-4 text-center animate-fadeIn">No newly joined members found.</p>
              ) : (
                newlyJoined.map(member => (
                  <div key={member.id} className="flex items-center justify-between border-b border-slate-50 pb-3 last:border-0 last:pb-0 hover:bg-slate-50/50 p-2 rounded-xl transition-all">
                    <div 
                      onClick={() => onOpenContactDetails(member.id)}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <div className="h-10 w-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center font-bold text-slate-600 text-sm shadow-sm shrink-0">
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
                      <span className="text-xs text-slate-500 font-semibold bg-slate-100/80 px-2 py-0.5 rounded-md shadow-sm">
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
              {hasMoreNewMembers && (
                <div className="pt-4 pb-2 text-center animate-fadeIn">
                  <button
                    type="button"
                    onClick={onLoadMoreNewMembers}
                    className="px-5 py-2 text-xs font-black bg-amber-500 hover:bg-amber-600 border border-slate-950/10 text-white rounded-xl transition shadow-md"
                  >
                    Load More Members
                  </button>
                </div>
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
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
                  />
                </div>


                <button
                  onClick={onVerifyWhatsApp}
                  disabled={verifyingWhatsApp}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 text-white px-3.5 py-2 text-xs font-bold hover:bg-emerald-700 shadow-sm disabled:opacity-50 transition-colors"
                  title="Verify WhatsApp status of unchecked contacts using Meta API"
                >
                  <LuMessageCircle className={`h-3.5 w-3.5 ${verifyingWhatsApp ? "animate-pulse" : ""}`} /> 
                  {verifyingWhatsApp ? "Checking..." : "Verify WhatsApp"}
                </button>
                <button
                  onClick={onSyncContacts}
                  className="flex items-center gap-1.5 rounded-xl bg-slate-800 text-white px-3.5 py-2 text-xs font-semibold hover:bg-slate-900 shadow-sm transition"
                  title="Mock sync of device contacts"
                >
                  <LuRefreshCw className="h-3.5 w-3.5" /> Sync
                </button>
              </div>



              {/* Group Creation Action Bar */}
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
                      className="flex items-center gap-1.5 rounded-lg bg-amber-500 border border-slate-900/10 text-white px-3.5 py-1.5 text-xs font-bold shadow-sm hover:bg-amber-600 transition"
                    >
                      <LuPlus className="h-3.5 w-3.5" /> Make Group
                    </button>
                  )}
                </div>
              )}

              {/* Contacts List */}
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {peopleLoading && contacts.length === 0 ? (
                  <div className="py-8 text-center"><LuRefreshCw className="h-5 w-5 animate-spin mx-auto text-amber-500" /></div>
                ) : contacts.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4 text-center animate-fadeIn">No contacts found.</p>
                ) : (
                  contacts.map(c => (
                    <div key={c.id} className="flex items-center justify-between border-b border-slate-50 pb-3 last:border-0 last:pb-0 hover:bg-slate-50/50 rounded-xl p-2 transition-colors">
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
                          className="rounded border-slate-300 text-amber-500 focus:ring-amber-400 h-3.5 w-3.5 shadow-sm"
                        />
                        <div 
                          onClick={() => onOpenContactDetails(c.id)}
                          className="flex items-center gap-3 cursor-pointer group"
                        >
                          <div className="h-9 w-9 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center font-bold text-slate-600 text-xs shadow-sm">
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
                      </div>
                      <div className="flex items-center gap-2">
                        {c.isWhatsAppActive === true ? (
                          <LuMessageCircle className="h-5 w-5 text-emerald-600 fill-emerald-100 shrink-0" title="Active WhatsApp Contact" />
                        ) : (
                          <LuMessageCircle className="h-5 w-5 text-slate-300 fill-slate-50 shrink-0" title="Not registered on WhatsApp" />
                        )}
                        <button
                          onClick={() => onDeleteContact(c.id)}
                          className="text-slate-400 hover:text-red-500 p-1.5 transition-colors rounded-full hover:bg-red-50"
                          title="Delete Contact"
                        >
                          <LuTrash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}

                {hasMoreContacts && (
                  <div className="pt-4 pb-2 text-center animate-fadeIn">
                    <button
                      type="button"
                      onClick={onLoadMoreContacts}
                      className="px-5 py-2 text-xs font-black bg-amber-500 hover:bg-amber-600 border border-slate-950/10 text-white rounded-xl transition shadow-md"
                    >
                      Load More Contacts
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* --- 3. GROUPS TAB --- */}
          {peopleTab === "groups" && (
            <div className="space-y-4">
              {/* Create Group Quick Action */}
              <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                <span className="text-xs font-bold text-slate-500">Workspace Groups ({totalGroupsCount})</span>
                <button
                  onClick={() => {
                    setPeopleTab("contacts");
                    toastSuccess("Select contacts below first to form a group!");
                  }}
                  className="flex items-center gap-1.5 rounded-xl bg-amber-400 border border-slate-900/10 text-slate-900 px-3 py-1.5 text-xs font-black shadow-sm hover:bg-amber-500 transition"
                >
                  <LuPlus className="h-3.5 w-3.5" /> Create Group
                </button>
              </div>

              {/* Groups List */}
              <div className="space-y-3">
                {peopleLoading && groups.length === 0 ? (
                  <div className="py-8 text-center"><LuRefreshCw className="h-5 w-5 animate-spin mx-auto text-amber-500" /></div>
                ) : groups.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4 text-center animate-fadeIn">No groups found.</p>
                ) : (
                  groups.map(g => (
                    <div key={g.id} className="flex items-center justify-between border border-slate-100 bg-slate-50/30 rounded-xl p-4 shadow-sm hover:bg-slate-50 transition-colors">
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
                {hasMoreGroups && (
                  <div className="pt-4 pb-2 text-center animate-fadeIn">
                    <button
                      type="button"
                      onClick={onLoadMoreGroups}
                      className="px-5 py-2 text-xs font-black bg-amber-500 hover:bg-amber-600 border border-slate-950/10 text-white rounded-xl transition shadow-md"
                    >
                      Load More Groups
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
