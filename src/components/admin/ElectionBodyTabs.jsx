import { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthProvider";
import { api } from "../../lib/api";

const DEFAULT_BODIES = [
  { id: "VIDHAN_SABHA", label: "Vidhan Sabha", role: "MLA", defaultYear: 2022, years: [2012, 2017, 2022], hasMap: true },
  { id: "LOK_SABHA", label: "Lok Sabha", role: "MP", defaultYear: 2019, years: [2019], hasMap: false },
  { id: "MLC", label: "Vidhan Parishad", role: "MLC", defaultYear: 2022, years: [2022], hasMap: false },
  { id: "MUNICIPAL", label: "Municipality", role: "Mayor", defaultYear: 2023, years: [2023], hasMap: false },
];

export function ElectionBodyTabs({ activeBody, onChange, stateCode }) {
  const { token } = useAuth();
  const [bodies, setBodies] = useState(DEFAULT_BODIES);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const d = await api("/api/admin/election/bodies", { token });
        if (!cancelled && d?.bodies?.length) setBodies(d.bodies);
      } catch {
        /* use defaults */
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (stateCode !== "UP") {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Detailed body-wise results (Vidhan Sabha, Lok Sabha, MLC, Municipality) are available for{" "}
        <strong>Uttar Pradesh</strong>. Select UP to view.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-900">Election body</h3>
        <p className="text-xs text-slate-500">
          Uttar Pradesh (UP) — Vidhan Sabha · Lok Sabha · MLC · Municipality — role-wise results
        </p>
      </div>
      <div className="scrollbar-none overflow-x-auto p-3">
        <div className="flex min-w-max gap-2">
          {bodies.map((b) => {
            const active = activeBody === b.id;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => onChange(b.id, b.defaultYear)}
                className={`rounded-lg border px-4 py-2.5 text-left transition ${
                  active ? "border-[#eb7f2b] bg-orange-50 ring-1 ring-[#eb7f2b]" : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <div className="text-sm font-semibold text-slate-900">{b.label}</div>
                <div className="text-[11px] text-slate-500">
                  {b.role} · {b.defaultYear}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function getBodyMeta(bodies, bodyId) {
  return bodies.find((b) => b.id === bodyId) || DEFAULT_BODIES.find((b) => b.id === bodyId);
}

export { DEFAULT_BODIES };
