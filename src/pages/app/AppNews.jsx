import { useCallback, useEffect, useState } from "react";
import { LuNewspaper, LuSearch, LuExternalLink, LuCalendar, LuTag } from "react-icons/lu";
import { useAuth } from "../../auth/AuthProvider";
import { api } from "../../lib/api";
import { toastFromError } from "../../lib/toast";

const CATEGORIES = ["All", "Politics", "Election", "Local", "National", "International"];

function NewsCard({ article }) {
  return (
    <div className="flex flex-col rounded-xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {article.imageUrl && (
        <img src={article.imageUrl} alt={article.title} className="h-40 w-full object-cover" />
      )}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex flex-wrap items-center gap-2">
          {article.category && (
            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-700 border border-indigo-100">
              <LuTag className="mr-1 inline h-3 w-3" />{article.category}
            </span>
          )}
          {article.source && (
            <span className="text-[11px] text-slate-400">{article.source}</span>
          )}
        </div>
        <h3 className="flex-1 text-sm font-semibold text-slate-900 line-clamp-2 leading-snug">
          {article.title}
        </h3>
        {article.description && (
          <p className="text-xs text-slate-500 line-clamp-2">{article.description}</p>
        )}
        <div className="mt-auto flex items-center justify-between pt-2 border-t border-slate-50">
          <span className="flex items-center gap-1 text-[11px] text-slate-400">
            <LuCalendar className="h-3 w-3" />
            {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString("en-IN") : "—"}
          </span>
          {article.url && (
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 rounded-lg bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 transition border border-slate-100"
            >
              Read <LuExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export function AppNews() {
  const { token } = useAuth();
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ category, search: appliedSearch });
      const d = await api(`/api/app/news?${qs}`, { token });
      setData(d);
    } catch (e) {
      toastFromError(e, "Failed to load news");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [token, category, appliedSearch]);

  useEffect(() => { load(); }, [load]);

  const articles = data?.articles || [];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow">
          <LuNewspaper className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <div>
          <h2 className="text-xl font-bold text-slate-900">News</h2>
          <p className="text-sm text-slate-500">Latest news relevant to your constituency &amp; candidates</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                category === c
                  ? "border-indigo-500 bg-indigo-600 text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <form
          className="ml-auto flex items-center gap-2"
          onSubmit={(e) => { e.preventDefault(); setAppliedSearch(search.trim()); }}
        >
          <div className="relative">
            <LuSearch className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" strokeWidth={1.75} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search news…"
              className="rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
            Search
          </button>
        </form>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white text-sm text-slate-400">
          <span className="animate-pulse">Fetching news…</span>
        </div>
      ) : !articles.length ? (
        <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white text-sm text-slate-400">
          No news articles found. Try a different category or search term.
        </div>
      ) : (
        <>
          <p className="text-xs text-slate-400">{articles.length} article{articles.length !== 1 ? "s" : ""} found</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((a, i) => <NewsCard key={a.id ?? i} article={a} />)}
          </div>
        </>
      )}
    </div>
  );
}
