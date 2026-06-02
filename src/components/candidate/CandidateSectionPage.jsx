import { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthProvider";
import { api } from "../../lib/api";
import { StatCard } from "../StatCard";
import { toastFromError } from "../../lib/toast";

export function CandidateSectionPage({ section, title, subtitle }) {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const d = await api(`/api/candidate/sections/${section}`, { token });
        if (!cancelled) setData(d);
      } catch (e) {
        if (!cancelled) toastFromError(e, "Failed to load section");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [token, section]);

  if (loading) return <div className="p-6 text-center text-slate-500">Loading…</div>;

  const payload = data?.data || {};

  return (
    <div className="p-4 sm:p-6">
      <div className="border-b border-slate-100 pb-5">
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{subtitle || payload.summary}</p>
        {data?.state ? (
          <p className="mt-1 text-xs text-indigo-600">
            State context: {data.state.name} · Leading: {data.state.leadingParty}
          </p>
        ) : null}
      </div>

      {payload.scorecard ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {payload.scorecard.map((s) => (
            <StatCard key={s.label} label={s.label} value={s.value} />
          ))}
        </div>
      ) : null}

      {payload.blocks?.length ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {payload.blocks.map((b) => (
            <StatCard key={b.label} label={b.label} value={b.value} />
          ))}
        </div>
      ) : null}

      {payload.tools?.length ? (
        <div className="mt-6 overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3">Tool</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Usage</th>
              </tr>
            </thead>
            <tbody>
              {payload.tools.map((t) => (
                <tr key={t.name} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium">{t.name}</td>
                  <td className="px-4 py-3">{t.status}</td>
                  <td className="px-4 py-3">{t.usage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {payload.items?.length ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {payload.items.map((item) => (
            <div key={item.type} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm text-slate-500">{item.type}</div>
              <div className="mt-1 text-2xl font-bold text-slate-900">{item.count}</div>
              <div className="text-xs text-slate-600">{item.status}</div>
            </div>
          ))}
        </div>
      ) : null}

      {payload.channels?.length ? (
        <ul className="mt-6 space-y-2">
          {payload.channels.map((c) => (
            <li key={c.channel} className="flex justify-between rounded-lg border border-slate-200 px-4 py-3 text-sm">
              <span className="font-medium">{c.channel}</span>
              <span className="text-slate-600">{c.reach}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {payload.campaigns?.length ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {payload.campaigns.map((c) => (
            <div key={c.platform} className="rounded-lg border border-slate-200 p-4">
              <div className="font-semibold text-slate-900">{c.platform}</div>
              <div className="mt-2 text-sm text-slate-600">Spend: {c.spend}</div>
              <div className="text-sm text-slate-600">ROAS: {c.roas}</div>
            </div>
          ))}
        </div>
      ) : null}

      {payload.tasks?.length ? (
        <div className="mt-6 space-y-3">
          {payload.tasks.map((t) => (
            <div key={t.task}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="font-medium text-slate-800">{t.task}</span>
                <span className="text-slate-500">{t.progress}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100">
                <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${t.progress}%` }} />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {payload.score !== undefined ? (
        <div className="mt-6">
          <StatCard label="Consistency score" value={`${payload.score}/100`} />
          <ul className="mt-4 space-y-2">
            {payload.checks?.map((c) => (
              <li key={c.item} className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-2 text-sm">
                <span>{c.item}</span>
                <span className={c.pass ? "text-emerald-600" : "text-amber-600"}>{c.pass ? "Pass" : "Review"}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {payload.swingRegions?.length ? (
        <div className="mt-6 flex flex-wrap gap-2">
          {payload.swingRegions.map((r) => (
            <span key={r} className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-800">
              {r}
            </span>
          ))}
        </div>
      ) : null}

      {payload.state?.partyBreakdown?.length ? (
        <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3">Party</th>
                <th className="px-4 py-3">Seats</th>
                <th className="px-4 py-3">Vote share</th>
                <th className="px-4 py-3">Trend</th>
              </tr>
            </thead>
            <tbody>
              {payload.state.partyBreakdown.map((p) => (
                <tr key={p.party} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium">{p.party}</td>
                  <td className="px-4 py-3">{p.seats}</td>
                  <td className="px-4 py-3">{p.voteShare}</td>
                  <td className="px-4 py-3 capitalize">{p.trend}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {payload.articles?.length ? (
        <ul className="mt-6 divide-y divide-slate-100 rounded-lg border border-slate-200">
          {payload.articles.map((a) => (
            <li key={a.title} className="px-4 py-3">
              <div className="font-medium text-slate-900">{a.title}</div>
              <div className="mt-1 text-xs text-slate-500">
                {a.date} · {a.source}
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {payload.narratives?.length ? (
        <div className="mt-6 space-y-2">
          {payload.narratives.map((n) => (
            <div key={n.topic} className="rounded-lg border border-slate-200 px-4 py-3 text-sm">
              <div className="font-medium text-slate-900">{n.topic}</div>
              <div className="mt-1 text-slate-600">
                Sentiment: {n.sentiment} · Impact: {n.impact}
              </div>
            </div>
          ))}
          {payload.recommendation ? (
            <p className="mt-4 rounded-lg bg-amber-50 p-4 text-sm text-amber-900">{payload.recommendation}</p>
          ) : null}
        </div>
      ) : null}

      {payload.insights ? (
        <p className="mt-6 rounded-lg bg-slate-50 p-4 text-sm text-slate-700">{payload.insights}</p>
      ) : null}
    </div>
  );
}
