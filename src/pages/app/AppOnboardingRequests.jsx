import { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthProvider";
import { api, mediaUrl } from "../../lib/api";
import { toastFromError, toastSuccess } from "../../lib/toast";
import { LuCheck, LuX, LuSearch, LuUser, LuBriefcase, LuMapPin, LuMail, LuPhone, LuFileText, LuInfo } from "react-icons/lu";

export function AppOnboardingRequests() {
  const { token } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Pending");
  
  // Modal states for rejection
  const [rejectingRequest, setRejectingRequest] = useState(null);
  const [rejectionNote, setRejectionNote] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    setLoading(true);
    try {
      const data = await api("/api/app/onboarding-requests", { token });
      setRequests(data.onboardingRequests || []);
    } catch (err) {
      toastFromError(err, "Failed to load onboarding requests");
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(requestId) {
    if (!window.confirm("Are you sure you want to approve this onboarding request? This will initialize their tenant workspace.")) return;
    setSubmittingAction(true);
    try {
      await api(`/api/app/onboarding-requests/${requestId}/approve`, {
        method: "POST",
        token
      });
      toastSuccess("Workspace initialized and credentials sent successfully!");
      loadRequests();
    } catch (err) {
      toastFromError(err, "Failed to approve request");
    } finally {
      setSubmittingAction(false);
    }
  }

  async function handleRejectSubmit(e) {
    e.preventDefault();
    if (!rejectingRequest || !rejectionNote.trim()) return;
    setSubmittingAction(true);
    try {
      await api(`/api/app/onboarding-requests/${rejectingRequest._id}/reject`, {
        method: "POST",
        token,
        body: { note: rejectionNote.trim() }
      });
      toastSuccess("Onboarding request rejected successfully.");
      setRejectingRequest(null);
      setRejectionNote("");
      loadRequests();
    } catch (err) {
      toastFromError(err, "Failed to reject request");
    } finally {
      setSubmittingAction(false);
    }
  }

  const filteredRequests = requests.filter(req => {
    const matchesStatus = filterStatus === "All" || req.status === filterStatus;
    const matchesSearch = 
      req.name?.toLowerCase().includes(search.toLowerCase()) ||
      req.organizationName?.toLowerCase().includes(search.toLowerCase()) ||
      req.email?.toLowerCase().includes(search.toLowerCase()) ||
      req.mobile?.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-slate-100 pb-5">
        <h2 className="text-xl font-bold text-slate-900 font-sans">Onboarding Requests</h2>
        <p className="mt-0.5 text-sm text-slate-500">Review and approve self-registration requests from new creators & CEOs</p>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        {/* Status Tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          {["All", "Pending", "Approved", "Rejected"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterStatus === status
                  ? "bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {status} ({requests.filter(r => status === "All" || r.status === status).length})
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <LuSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search requests..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 animate-pulse font-medium">Loading requests…</div>
      ) : filteredRequests.length === 0 ? (
        <div className="py-20 text-center max-w-sm mx-auto border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
          <LuInfo className="h-10 w-10 text-slate-350 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No requests found</h3>
          <p className="text-xs text-slate-500 mt-1">No registration requests match your search or filter.</p>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          {filteredRequests.map((req) => (
            <div key={req._id} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 hover:shadow-md transition-all flex flex-col justify-between">
              <div className="space-y-4">
                {/* User Header Info */}
                <div className="flex gap-4 items-start">
                  {req.photoUrl ? (
                    <div className="h-14 w-14 rounded-xl overflow-hidden border border-slate-100 bg-slate-50 shrink-0">
                      <img src={mediaUrl(req.photoUrl)} alt={req.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="h-14 w-14 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 font-bold text-lg shrink-0">
                      {req.name ? req.name.charAt(0).toUpperCase() : "?"}
                    </div>
                  )}
                  <div className="space-y-1">
                    <h3 className="text-sm font-extrabold text-slate-900">{req.name}</h3>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex rounded-full bg-indigo-50 px-2 py-0.5 text-[9px] font-bold text-indigo-700 border border-indigo-100">
                        {req.designation}
                      </span>
                      <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-700 border border-slate-200">
                        {req.organizationName}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Self Description (30 word bio) */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-150">
                  <div className="flex gap-1.5 items-center text-slate-500 mb-1 text-[10px] font-bold uppercase tracking-wider">
                    <LuFileText className="h-3 w-3" />
                    <span>Creator Introduction</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed font-normal italic">
                    "{req.description || "No description provided."}"
                  </p>
                </div>

                {/* Contact and address grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-2 text-slate-650">
                    <LuMail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{req.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-650">
                    <LuPhone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>{req.mobile}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-650 sm:col-span-2">
                    <LuMapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">
                      {[req.address, req.city, req.pincode].filter(Boolean).join(", ")}
                    </span>
                  </div>
                </div>

                {/* Verification badges */}
                <div className="flex gap-2.5 pt-1">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    req.isEmailVerified 
                      ? "bg-green-50 text-green-700 border-green-200" 
                      : "bg-red-50 text-red-700 border-red-200"
                  }`}>
                    <LuCheck className="h-3 w-3" /> Email Verified
                  </span>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    req.isMobileVerified 
                      ? "bg-green-50 text-green-700 border-green-200" 
                      : "bg-red-50 text-red-700 border-red-200"
                  }`}>
                    <LuCheck className="h-3 w-3" /> Mobile Verified
                  </span>
                </div>

                {req.status === "Rejected" && req.rejectionReason && (
                  <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-xl text-xs font-normal">
                    <strong>Reason for rejection:</strong> {req.rejectionReason}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {req.status === "Pending" && (
                <div className="flex gap-3 pt-5 mt-5 border-t border-slate-100">
                  <button
                    disabled={submittingAction}
                    onClick={() => handleApprove(req._id)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2 text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    <LuCheck className="h-3.5 w-3.5" /> Approve & Onboard
                  </button>
                  <button
                    disabled={submittingAction}
                    onClick={() => setRejectingRequest(req)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-700 border border-red-250 py-2 text-xs font-bold transition cursor-pointer"
                  >
                    <LuX className="h-3.5 w-3.5" /> Reject Request
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Rejection Modal */}
      {rejectingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Reject Onboarding Request</h3>
              <button 
                onClick={() => {
                  setRejectingRequest(null);
                  setRejectionNote("");
                }} 
                className="text-slate-400 hover:text-slate-655 cursor-pointer"
              >
                <LuX className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Rejection Feedback/Reason</label>
                <textarea
                  required
                  value={rejectionNote}
                  onChange={(e) => setRejectionNote(e.target.value)}
                  placeholder="Explain why this request is being rejected (e.g. details incorrect or invalid description)..."
                  rows={4}
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
              <div className="flex gap-3 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setRejectingRequest(null);
                    setRejectionNote("");
                  }}
                  className="rounded-xl border border-slate-200 hover:bg-slate-50 px-4 py-2 text-xs font-bold text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction || !rejectionNote.trim()}
                  className="rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-5 py-2 text-xs font-bold transition shadow cursor-pointer"
                >
                  Confirm Reject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
