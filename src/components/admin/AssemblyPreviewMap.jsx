import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, GeoJSON, useMap } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useAuth } from "../../auth/AuthProvider";
import { api } from "../../lib/api";
import { toastFromError } from "../../lib/toast";

const PARTY_COLORS = {
  BJP: "#ff8a1a",
  SP: "#a9b247",
  INC: "#4ea8de",
  BSP: "#9aa5b1",
  RLD: "#8db46a",
  AITC: "#2fa84f",
  AAP: "#2fa84f",
  DMK: "#e91e63",
  AIADMK: "#f4b400",
  SBSP: "#e91e63",
  ADS: "#f4b400",
  NISHAD: "#c0392b",
  IND: "#95a5a6",
  CPI: "#e74c3c",
  CPM: "#c0392b",
  Others: "#cfd8e3",
};

const PARTY_BUCKETS = ["BJP", "SP", "INC", "BSP", "RLD", "AAP", "SBSP", "IND", "Others"];

function MapResizeHandler() {
  const map = useMap();
  useEffect(() => {
    let cancelled = false;
    const run = () => {
      if (cancelled) return;
      try {
        map.invalidateSize({ animate: false });
      } catch {
        /* map tearing down */
      }
    };
    const t1 = window.setTimeout(run, 0);
    const t2 = window.setTimeout(run, 200);
    window.addEventListener("resize", run);
    return () => {
      cancelled = true;
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.removeEventListener("resize", run);
    };
  }, [map]);
  return null;
}

function FitBounds({ geoJson }) {
  const map = useMap();
  useEffect(() => {
    if (!geoJson?.features?.length) return undefined;
    let cancelled = false;
    const frame = window.requestAnimationFrame(() => {
      if (cancelled) return;
      try {
        const layer = L.geoJSON(geoJson);
        const bounds = layer.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [12, 12], maxZoom: 9, animate: false });
        }
      } catch {
        /* ignore during unmount */
      }
    });
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
    };
  }, [geoJson, map]);
  return null;
}

function ElectionGeoLayer({ geoJson, geoStyle, onEachFeature }) {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    if (!geoJson?.features?.length) return undefined;

    if (layerRef.current) {
      map.removeLayer(layerRef.current);
      layerRef.current = null;
    }

    const layer = L.geoJSON(geoJson, { style: geoStyle, onEachFeature });
    layer.addTo(map);
    layerRef.current = layer;

    return () => {
      if (layerRef.current) {
        try {
          map.removeLayer(layerRef.current);
        } catch {
          /* already removed */
        }
        layerRef.current = null;
      }
    };
  }, [geoJson, map, geoStyle, onEachFeature]);

  return null;
}

function popupHtml(p, year, bodyType) {
  const seatNo = p.acNo || p.seatNo || p.ac_no;
  const rows = [
    ["Constituency", p.constituency || p.acName],
    ["Candidate", p.candidate || "—"],
    ["Party", p.party || "—"],
    ["Votes", (p.votes || 0).toLocaleString("en-IN")],
    ["Vote %", p.votePercent ? `${p.votePercent}%` : "—"],
    ["Year", p.year || year || "—"],
  ];
  const link = seatNo
    ? `<a href="/admin/election/constituency/${bodyType || "VIDHAN_SABHA"}/${year || "2022"}/seat/${seatNo}?from=/admin/election" style="display:block;margin-top:8px;background:#0f766e;color:#fff;text-align:center;padding:5px 8px;border-radius:6px;font-weight:700;font-size:11px;text-decoration:none;">View Full Profile →</a>`
    : "";
  return `<div class="election-ac-popup">${rows
    .map(([label, value]) =>
      `<div class="election-ac-popup-row"><span class="election-ac-popup-label">${label}</span><span class="election-ac-popup-value">${value}</span></div>`
    )
    .join("")}${link}</div>`;
}

function featureStyle(feature, partyColors) {
  const p = feature?.properties || {};
  const party = p.party || "Others";
  const color = p.fillColor || partyColors[party] || PARTY_COLORS.Others;
  return {
    color: "#5c6578",
    weight: 0.45,
    fillColor: color,
    fillOpacity: 0.82,
  };
}

export function AssemblyPreviewMap({ stateCode, stateName, onDataLoaded, bodyType = "VIDHAN_SABHA", year: yearProp }) {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [year, setYear] = useState(yearProp || "2022");
  const [base2012, setBase2012] = useState("All selected");
  const [base2017, setBase2017] = useState("All selected");
  const [base2022, setBase2022] = useState("All selected");
  const [searchText, setSearchText] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [activeParty, setActiveParty] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const onDataLoadedRef = useRef(onDataLoaded);

  useEffect(() => {
    onDataLoadedRef.current = onDataLoaded;
  }, [onDataLoaded]);

  useEffect(() => {
    if (yearProp) setYear(String(yearProp));
  }, [yearProp]);

  const loadData = useCallback(async () => {
    if (stateCode !== "UP") return;
    setLoading(true);
    setLoadError(null);
    try {
      const qs = new URLSearchParams({
        bodyType,
        year,
        search: appliedSearch,
        party: activeParty,
        party2012: base2012,
        party2017: base2017,
        party2022: base2022,
      });
      const d = await api(`/api/admin/election-analytics/${stateCode}?${qs.toString()}`, { token });
      setAnalytics(d);
      onDataLoadedRef.current?.(d);
    } catch (e) {
      setAnalytics(null);
      setLoadError(e?.message || "Failed to load election analytics");
      toastFromError(e, "Failed to load election analytics");
    } finally {
      setLoading(false);
    }
  }, [stateCode, token, bodyType, year, appliedSearch, activeParty, base2012, base2017, base2022]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const geoJson = analytics?.geoJson;
  const matchCount = analytics?.matchCount ?? 0;
  const partyColors = useMemo(() => ({ ...PARTY_COLORS, ...analytics?.partyColors }), [analytics]);

  const geoStyle = useCallback((feature) => featureStyle(feature, partyColors), [partyColors]);

  const onEachFeature = useCallback(
    (feature, layer) => {
      const p = feature?.properties || {};
      const baseStyle = featureStyle(feature, partyColors);
      layer.bindPopup(popupHtml(p, year, bodyType), { className: "election-map-popup", maxWidth: 280 });
      layer.on({
        mouseover: (e) => {
          e.target.setStyle({ ...baseStyle, color: "#111827", weight: 1.5, fillOpacity: 0.95 });
        },
        mouseout: (e) => {
          e.target.setStyle(baseStyle);
        },
        click: () => {
          const seatNo = p.acNo || p.seatNo || p.ac_no;
          if (seatNo) {
            navigate(`/admin/election/constituency/${bodyType}/${year}/seat/${seatNo}?from=/admin/election`);
          }
        },
      });
    },
    [partyColors, navigate, bodyType, year],
  );

  const handleSubmit = (e) => {
    e?.preventDefault?.();
    setAppliedSearch(searchText.trim());
  };

  if (stateCode !== "UP") {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
        Constituency map is configured for Uttar Pradesh. Upload results for `{stateName}` to enable this panel.
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <style>{`
        .election-map-popup .leaflet-popup-content-wrapper {
          background: #0f0f0f;
          color: #fff;
          border-radius: 2px;
          padding: 0;
          box-shadow: 0 8px 24px rgba(0,0,0,0.35);
        }
        .election-map-popup .leaflet-popup-content { margin: 0; }
        .election-map-popup .leaflet-popup-tip { background: #0f0f0f; }
        .election-ac-popup { padding: 10px 12px; font-size: 12px; line-height: 1.45; min-width: 200px; }
        .election-ac-popup-row { display: flex; justify-content: space-between; gap: 12px; padding: 2px 0; }
        .election-ac-popup-label { opacity: 0.72; }
        .election-ac-popup-value { font-weight: 600; text-align: right; }
        .assembly-election-map .leaflet-container { background: #eef1f4; }
      `}</style>
      <div className="border-b border-slate-100 bg-[#eb7f2b] px-5 py-3">
        <h3 className="text-center text-base font-semibold text-white">
          ASSEMBLY ELECTIONS VIEW BY INDIVIDUAL ELECTIONS ({year})
        </h3>
      </div>
      <div className="space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="rounded bg-[#2f86c8] px-3 py-1.5 font-medium text-white">Select Year</span>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="rounded border border-slate-300 px-2 py-1"
          >
            <option value="2012">2012</option>
            <option value="2017">2017</option>
            <option value="2022">2022</option>
          </select>
          {analytics?.source ? (
            <span className="text-slate-500">
              {matchCount} constituencies · constituency boundaries (ECI / reference map)
            </span>
          ) : null}
        </div>

        <form className="flex flex-wrap items-center gap-2 text-xs" onSubmit={handleSubmit}>
          <label className="text-slate-700" htmlFor="ac-search">
            Search:
          </label>
          <input
            id="ac-search"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="AC name, number or district"
            className="min-w-[180px] rounded border border-slate-300 px-2 py-1.5"
          />

          <label className="ml-2 text-slate-700">based on 2012 :</label>
          <select
            value={base2012}
            onChange={(e) => setBase2012(e.target.value)}
            className="rounded border border-slate-300 px-2 py-1"
          >
            <option>All selected</option>
            {PARTY_BUCKETS.map((p) => (
              <option key={`y12-${p}`}>{p}</option>
            ))}
          </select>

          <label className="ml-2 text-slate-700">based on 2017 :</label>
          <select
            value={base2017}
            onChange={(e) => setBase2017(e.target.value)}
            className="rounded border border-slate-300 px-2 py-1"
          >
            <option>All selected</option>
            {PARTY_BUCKETS.map((p) => (
              <option key={`y17-${p}`}>{p}</option>
            ))}
          </select>

          <label className="ml-2 text-slate-700">based on {year} :</label>
          <select
            value={base2022}
            onChange={(e) => setBase2022(e.target.value)}
            className="rounded border border-slate-300 px-2 py-1"
          >
            <option>All selected</option>
            {PARTY_BUCKETS.map((p) => (
              <option key={`y22-${p}`}>{p}</option>
            ))}
          </select>

          <button
            type="submit"
            className="rounded border border-slate-400 bg-slate-100 px-3 py-1 text-slate-900 hover:bg-slate-200"
          >
            submit
          </button>
        </form>

        <div className="flex flex-wrap gap-1 text-[10px]">
          {PARTY_BUCKETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setActiveParty((cur) => (cur === p ? "ALL" : p))}
              className="rounded px-2 py-0.5 text-white"
              style={{
                backgroundColor: partyColors[p] || PARTY_COLORS.Others,
                outline: activeParty === p ? "2px solid #111827" : "none",
              }}
            >
              {p}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setActiveParty("ALL");
              setAppliedSearch("");
              setSearchText("");
              setBase2012("All selected");
              setBase2017("All selected");
              setBase2022("All selected");
            }}
            className="rounded border border-slate-300 bg-white px-2 py-0.5 text-slate-700"
          >
            Reset
          </button>
        </div>

        <div
          className="assembly-election-map overflow-hidden rounded border border-slate-200 bg-[#eef1f4]"
          style={{ height: 480 }}
        >
          {loading ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-500">Loading map…</div>
          ) : loadError ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center text-sm text-red-700">
              <span>Could not load map data.</span>
              <span className="text-xs text-slate-600">
                Start the backend on port 4000 (<code className="rounded bg-slate-100 px-1">cd backend && node index.js</code>
                ), then refresh.
              </span>
              <button
                type="button"
                onClick={() => loadData()}
                className="mt-1 rounded border border-slate-300 bg-white px-3 py-1 text-xs text-slate-800 hover:bg-slate-50"
              >
                Retry
              </button>
            </div>
          ) : geoJson?.features?.length ? (
            <MapContainer
              key={`up-assembly-map-${year}-${matchCount}`}
              style={{ height: "100%", width: "100%" }}
              center={[26.8, 80.9]}
              zoom={7}
              zoomControl
              scrollWheelZoom={false}
              preferCanvas
            >
              <MapResizeHandler />
              <FitBounds geoJson={geoJson} />
              <ElectionGeoLayer geoJson={geoJson} geoStyle={geoStyle} onEachFeature={onEachFeature} />
            </MapContainer>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-1 text-sm text-slate-500">
              <span>No constituencies match your filters.</span>
              {appliedSearch ? <span>Search: “{appliedSearch}”</span> : null}
            </div>
          )}
        </div>
        <div className="text-xs text-slate-500">
          Showing {matchCount} of {analytics?.totalConstituencies ?? 0} constituencies for {year}. Click a seat for
          winner details.
        </div>
      </div>
    </section>
  );
}
