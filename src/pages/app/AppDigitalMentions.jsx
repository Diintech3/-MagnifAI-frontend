import { useCallback, useEffect, useState } from "react";
import { LuRadio, LuTrendingUp, LuTrendingDown, LuMinus, LuExternalLink, LuCalendar } from "react-icons/lu";
import { useAuth } from "../../auth/AuthProvider";
import { api } from "../../lib/api";
import { toastFromError } from "../../lib/toast";

const SENTIMENT_STYLE = {
  positive: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", bar: "bg-emerald-500", Icon: LuTrendingUp },
  negative: { bg: "bg-rose-50",    text: "text-rose-700",    border: "border-rose-200",    bar: "bg-rose-500",    Icon: LuTrendingDown },
  neutral:  { bg: "bg-slate-50",   text: "text-slate-600",   border: "border-slate-200",   bar: "bg-slate-400",   Icon: LuMinus },
};

function SentimentBar({ label, count, total, sentiment }) {
  const s = SENTIMENT_STYLE[sentiment] || SENTIMENT_STYLE.neutral;
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className={`rounded-xl border ${s.border} ${s.bg} p-4`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <s.Icon className={`h-4 w-4 ${s.text}`} strokeWidth={1.75} />
          <span className={`text-sm font-semibold ${s.text}`}>{label}</span>
        </div>
        <span className={`text-lg font-bold ${s.text}`}>{count?.toLocaleString("en-IN") ?? 0}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/60">
        <div className={`h-full rounded-full ${s.bar} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <div className={`mt-1 text-right text-[11px] ${s.text}`}>{pct}% of total</div>
    </div>
  );
}

function MentionCard({ mention }) {
  const s = SENTIMENT_STYLE[mention.sentiment] || SENTIMENT_STYLE.neutral;
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-slate-500">{mention.source || "Unknown"}</span>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${s.border} ${s.bg} ${s.text}`}>
              {mention.sentiment}
            </span>
          </div>
          <p className="text-sm text-slate-800 line-clamp-2">{mention.text || mention.title || "—"}</p>
        </div>
        {mention.url && (
          <a href={mention.url} target="_blank" rel="noopener noreferrer"
            className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition">
            <LuExternalLink className="h-4 w-4" strokeWidth={1.75} />
          </a>
        )}
      </div>
      <div className="mt-2 flex items-center gap-1 text-[11px] text-slate-400">
        <LuCalendar className="h-3 w-3" />
        {mention.date ? new Date(mention.date).toLocaleDateString("en-IN") : "—"}
      </div>
    </div>
  );
}

const RANGE_OPTIONS = [
  { value: "7",  label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
];

export function AppDigitalMentions() {
  const { token } = useAuth();
  const [range, setRange] = useState("30");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api(`/api/app/digital-mentions?range=${range}`, { token });
      setData(d);
    } catch (e) {
      toastFromError(e, "Failed to load digital mentions");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [token, range]);

  useEffect(() => { load(); }, [load]);

  const total = (data?.positive ?? 0) + (data?.negative ?? 0) + (data?.neutral ?? 0);
  const mentions = data?.mentions || [];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow">
            <LuRadio className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Digital Mentions</h2>
            <p className="text-sm text-slate-500">Online mentions &amp; sentiment analysis</p>
          </div>
        </div>
        <div className="flex gap-1.5">
          {RANGE_OPTIONS.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setRange(r.value)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                range === r.value
                  ? "border-violet-500 bg-violet-600 text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white text-sm text-slate-400">
          <span className="animate-pulse">Analyzing mentions…</span>
        </div>
      ) : !data ? (
        <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white text-sm text-slate-400">
          No mention data available yet.
        </div>
      ) : (
        <>
          {/* Total badge */}
          <div className="rounded-2xl border border-violet-100 bg-gradient-to-r from-violet-50 to-indigo-50 px-5 py-4">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-violet-500">Total Mentions</div>
            <div className="mt-1 text-3xl font-bold text-violet-900">{total.toLocaleString("en-IN")}</div>
            <div className="mt-0.5 text-xs text-slate-500">Across all online sources in the selected period</div>
          </div>

          {/* Sentiment breakdown */}
          <div className="grid gap-3 sm:grid-cols-3">
            <SentimentBar label="Positive" count={data.positive} total={total} sentiment="positive" />
            <SentimentBar label="Negative" count={data.negative} total={total} sentiment="negative" />
            <SentimentBar label="Neutral"  count={data.neutral}  total={total} sentiment="neutral" />
          </div>

          {/* Mention list */}
          {mentions.length ? (
            <div>
              <h3 className="mb-3 text-sm font-semibold text-slate-700">Recent Mentions</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {mentions.map((m, i) => <MentionCard key={m.id ?? i} mention={m} />)}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white py-10 text-center text-sm text-slate-400">
              No individual mentions to display.
            </div>
          )}
        </>
      )}
    </div>
  );
}
