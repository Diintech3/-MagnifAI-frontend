import { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthProvider";
import { api } from "../../lib/api";
import { CandidateAvatar, PartyLogo } from "../../components/CandidateAvatar";
import { toastFromError } from "../../lib/toast";

function Row({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-slate-100 py-3 sm:flex-row sm:gap-4">
      <dt className="w-40 shrink-0 text-sm text-slate-500">{label}</dt>
      <dd className="text-sm font-medium text-slate-900 break-words">{value || "—"}</dd>
    </div>
  );
}

export function CandidateProfile() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api("/api/candidate/profile", { token })
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled) toastFromError(e, "Failed to load profile");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading) return <div className="p-6 text-center text-slate-500">Loading…</div>;

  const c = data?.candidate;

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-start gap-4 border-b border-slate-100 pb-6">
        <CandidateAvatar candidate={c} className="h-20 w-20" textClassName="text-xl" />
        <div>
          <h2 className="text-xl font-bold text-slate-900">{c?.name}</h2>
          <div className="mt-2 flex items-center gap-2">
            <PartyLogo url={c?.partyLogoUrl} name={c?.partyName} className="h-8 w-8" />
            <span className="text-sm text-slate-600">{c?.partyName}</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Managed by {data?.appName}</p>
        </div>
      </div>

      <dl className="mt-2 max-w-2xl">
        <Row label="Email" value={c?.email} />
        <Row label="Mobile" value={c?.mobile} />
        <Row label="Constituency" value={c?.constituency} />
        <Row label="Assembly" value={c?.assembly} />
        <Row label="Address" value={c?.address} />
        <Row label="Status" value={c?.isActive ? "Active" : "Inactive"} />
      </dl>
    </div>
  );
}
