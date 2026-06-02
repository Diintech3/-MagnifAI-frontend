import { useState } from "react";

export function CandidateAvatar({ candidate, className = "h-10 w-10", textClassName = "text-xs" }) {
  const [failed, setFailed] = useState(false);
  const initial = candidate?.name?.[0]?.toUpperCase() || "C";

  if (!candidate?.photoUrl || failed) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700 ${className} ${textClassName}`}
      >
        {initial}
      </div>
    );
  }

  return (
    <img
      src={candidate.photoUrl}
      alt=""
      className={`shrink-0 rounded-full border border-slate-200 object-cover ${className}`}
      onError={() => setFailed(true)}
    />
  );
}

export function PartyLogo({ url, name, className = "h-8 w-8" }) {
  const [failed, setFailed] = useState(false);
  const initial = name?.[0]?.toUpperCase() || "P";

  if (!url || failed) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center rounded-md bg-slate-100 text-[10px] font-bold text-slate-600 ${className}`}
      >
        {initial}
      </div>
    );
  }

  return (
    <img
      src={url}
      alt=""
      className={`shrink-0 rounded-md border border-slate-200 object-cover ${className}`}
      onError={() => setFailed(true)}
    />
  );
}
