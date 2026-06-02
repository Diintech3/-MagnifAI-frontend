import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { ChartContainer } from "./ChartContainer";

const DEFAULT_COLORS = {
  BJP: "#ff8a1a",
  SP: "#a9b247",
  INC: "#4ea8de",
  BSP: "#9aa5b1",
  RLD: "#8db46a",
  AAP: "#2fa84f",
  SBSP: "#e91e63",
  Others: "#cfd8e3",
};

const CHART_HEIGHT = 288;

function SunburstRing({ data, size = 280, innerRadius = 50, outerRadius = 120 }) {
  if (!data?.length) {
    return (
      <div className="flex items-center justify-center text-sm text-slate-500" style={{ height: size }}>
        No party data for this selection.
      </div>
    );
  }

  const total = data.reduce((s, d) => s + (d.value || 0), 0) || 1;
  let angle = -90;
  const cx = size / 2;
  const cy = size / 2;
  const slices = data.map((d) => {
    const sweep = (d.value / total) * 360;
    const start = angle;
    angle += sweep;
    const end = angle;
    const toRad = (deg) => (deg * Math.PI) / 180;
    const x1 = cx + outerRadius * Math.cos(toRad(start));
    const y1 = cy + outerRadius * Math.sin(toRad(start));
    const x2 = cx + outerRadius * Math.cos(toRad(end));
    const y2 = cy + outerRadius * Math.sin(toRad(end));
    const xi1 = cx + innerRadius * Math.cos(toRad(end));
    const yi1 = cy + innerRadius * Math.sin(toRad(end));
    const xi2 = cx + innerRadius * Math.cos(toRad(start));
    const yi2 = cy + innerRadius * Math.sin(toRad(start));
    const large = sweep > 180 ? 1 : 0;
    const path = `M ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${large} 1 ${x2} ${y2} L ${xi1} ${yi1} A ${innerRadius} ${innerRadius} 0 ${large} 0 ${xi2} ${yi2} Z`;
    return { ...d, path };
  });

  const leader = data[0]?.name || "—";

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Party seat share">
        {slices.map((s) => (
          <path key={s.name} d={s.path} fill={s.color} stroke="#fff" strokeWidth={1}>
            <title>{`${s.name}: ${s.value} seats`}</title>
          </path>
        ))}
        <circle cx={cx} cy={cy} r={innerRadius - 4} fill="#fff" />
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" className="fill-slate-800 text-sm font-bold">
          {leader}
        </text>
      </svg>
    </div>
  );
}

function SeatSharePie({ data }) {
  if (!data.length) {
    return <div className="flex h-full items-center justify-center text-sm text-slate-500">No seat data</div>;
  }

  return (
    <ChartContainer height={CHART_HEIGHT}>
      {({ width, height }) => (
        <ResponsiveContainer width={width} height={height} debounce={50}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={Math.min(width, height) * 0.32}
              isAnimationActive={false}
              label={({ name, value }) => `${name} (${value})`}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color || DEFAULT_COLORS.Others} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
    </ChartContainer>
  );
}

function PartyBarChart({ data }) {
  if (!data.length) {
    return <div className="flex h-full items-center justify-center text-sm text-slate-500">No seat data</div>;
  }

  return (
    <ChartContainer height={CHART_HEIGHT}>
      {({ width, height }) => (
        <ResponsiveContainer width={width} height={height} debounce={50}>
          <BarChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 4 }}>
            <XAxis dataKey="party" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="seats" name="Seats" radius={[4, 4, 0, 0]} isAnimationActive={false}>
              {data.map((entry) => (
                <Cell key={entry.party} fill={entry.color || DEFAULT_COLORS.Others} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartContainer>
  );
}

export function ElectionAnalyticsCharts({ analytics, year }) {
  const partyStats = analytics?.filteredPartyStats?.length
    ? analytics.filteredPartyStats
    : analytics?.partyStats || [];
  const sunburst = analytics?.sunburst?.children || [];

  const pieData = useMemo(
    () =>
      partyStats
        .filter((p) => (p.seats || 0) > 0)
        .map((p) => ({ name: p.party, value: p.seats, color: p.color || DEFAULT_COLORS[p.party] })),
    [partyStats],
  );

  const barData = useMemo(
    () =>
      partyStats
        .filter((p) => (p.seats || 0) > 0)
        .slice(0, 10)
        .map((p) => ({
          party: p.party,
          seats: p.seats,
          voteShare: p.voteShare,
          color: p.color || DEFAULT_COLORS[p.party],
        })),
    [partyStats],
  );

  if (!analytics?.supported) return null;

  const constituencies = analytics?.constituencies || [];

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-[#eb7f2b] px-5 py-3">
          <h3 className="text-center text-base font-semibold uppercase text-white">
            Party wise performance trend ({year})
          </h3>
        </div>
        <div className="p-4">
          {sunburst.length ? (
            <div className="mb-3 flex flex-wrap justify-center gap-2 text-[10px]">
              {sunburst.map((p) => (
                <span
                  key={p.name}
                  className="flex items-center gap-1 rounded px-2 py-0.5 text-white"
                  style={{ backgroundColor: p.color }}
                >
                  {p.name}
                </span>
              ))}
            </div>
          ) : null}
          <SunburstRing data={sunburst} />
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-[#eb7f2b] px-5 py-3">
            <h3 className="text-center text-sm font-semibold uppercase text-white">Seat share ({year})</h3>
          </div>
          <div className="p-4">
            <SeatSharePie data={pieData} />
          </div>
        </section>

        <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-[#eb7f2b] px-5 py-3">
            <h3 className="text-center text-sm font-semibold uppercase text-white">Top parties — seats</h3>
          </div>
          <div className="p-4">
            <PartyBarChart data={barData} />
          </div>
        </section>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-[#eb7f2b] px-5 py-3">
          <h3 className="text-center text-base font-semibold uppercase text-white">
            Constituency wise winner results detail view ({year})
          </h3>
        </div>
        <div className="max-h-96 overflow-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="sticky top-0 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Constituency</th>
                <th className="px-3 py-2">District</th>
                <th className="px-3 py-2">Winner</th>
                <th className="px-3 py-2">Party</th>
                <th className="px-3 py-2 text-right">Votes</th>
                <th className="px-3 py-2 text-right">%</th>
                <th className="px-3 py-2">2012</th>
                <th className="px-3 py-2">2017</th>
                <th className="px-3 py-2">2022</th>
              </tr>
            </thead>
            <tbody>
              {constituencies.map((c) => (
                <tr key={c.acNo} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2 tabular-nums text-slate-500">{c.acNo}</td>
                  <td className="px-3 py-2 font-medium text-slate-900">{c.acName}</td>
                  <td className="px-3 py-2 text-slate-600">{c.district}</td>
                  <td className="px-3 py-2">{c.candidate}</td>
                  <td className="px-3 py-2">
                    <span
                      className="rounded px-1.5 py-0.5 text-xs font-semibold text-white"
                      style={{ backgroundColor: DEFAULT_COLORS[c.party] || DEFAULT_COLORS.Others }}
                    >
                      {c.party}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{c.votes?.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{c.votePercent || "—"}</td>
                  <td className="px-3 py-2 text-xs">{c.party2012}</td>
                  <td className="px-3 py-2 text-xs">{c.party2017}</td>
                  <td className="px-3 py-2 text-xs">{c.party2022}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
