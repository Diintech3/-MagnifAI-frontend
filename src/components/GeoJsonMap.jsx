import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useAuth } from "../auth/AuthProvider";
import { api } from "../lib/api";
import { toastFromError } from "../lib/toast";

function fitBoundsFromGeoJson(geo) {
  const coords = [];

  function pushCoord(c) {
    if (Array.isArray(c) && typeof c[0] === "number" && typeof c[1] === "number") coords.push(c);
  }
  function walk(node) {
    if (!node) return;
    if (node.type === "FeatureCollection") {
      node.features?.forEach(walk);
      return;
    }
    if (node.type === "Feature") {
      walk(node.geometry);
      return;
    }
    if (node.type === "GeometryCollection") {
      node.geometries?.forEach(walk);
      return;
    }
    const c = node.coordinates;
    if (!c) return;
    // coordinates can be nested to arbitrary depth depending on geometry type
    const stack = [c];
    while (stack.length) {
      const cur = stack.pop();
      if (!Array.isArray(cur)) continue;
      if (typeof cur[0] === "number" && typeof cur[1] === "number") {
        pushCoord(cur);
      } else {
        for (const x of cur) stack.push(x);
      }
    }
  }

  walk(geo);
  if (!coords.length) return null;

  // GeoJSON order is [lng, lat]
  let minLng = coords[0][0];
  let maxLng = coords[0][0];
  let minLat = coords[0][1];
  let maxLat = coords[0][1];
  for (const [lng, lat] of coords) {
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  }
  return [
    [minLat, minLng],
    [maxLat, maxLng],
  ];
}

export function GeoJsonMap({ r2Key, title = "Map", height = 420, circle }) {
  const { token } = useAuth();
  const [geo, setGeo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        // Large GeoJSON files can freeze the browser. Always request a simplified version.
        // tolerance tuned for a fast interactive overview; can be adjusted later per dataset.
        const qs = new URLSearchParams({
          key: r2Key,
          tolerance: "0.2",
          ...(circle ? { circle } : {}),
        });
        const d = await api(`/api/admin/geojson?${qs.toString()}`, { token });
        if (!cancelled) setGeo(d);
      } catch (e) {
        if (!cancelled) toastFromError(e, "Failed to load map data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (r2Key) load();
    return () => {
      cancelled = true;
    };
  }, [r2Key, token]);

  const bounds = useMemo(() => (geo ? fitBoundsFromGeoJson(geo) : null), [geo]);

  if (loading) return <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading map…</div>;
  if (!geo)
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
        Map data unavailable.
      </div>
    );

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <p className="mt-0.5 text-xs text-slate-500">GeoJSON source: `{r2Key}`</p>
      </div>
      <div style={{ height }}>
        <MapContainer
          style={{ height: "100%", width: "100%" }}
          bounds={bounds || undefined}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <GeoJSON
            data={geo}
            style={() => ({
              color: "#4f46e5",
              weight: 1,
              fillColor: "#818cf8",
              fillOpacity: 0.2,
            })}
          />
        </MapContainer>
      </div>
    </div>
  );
}

