import { useState } from "react";

export function AppLogo({ app, className = "h-10 w-10", textClassName = "text-xs" }) {
  const [failed, setFailed] = useState(false);
  const initial = app?.businessName?.[0]?.toUpperCase() || "A";

  if (!app?.logoUrl || failed) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center rounded-full bg-slate-200 font-bold text-slate-600 ${className} ${textClassName}`}
      >
        {initial}
      </div>
    );
  }

  return (
    <img
      src={app.logoUrl}
      alt=""
      className={`shrink-0 rounded-full border border-slate-200 object-cover ${className}`}
      onError={() => setFailed(true)}
    />
  );
}
