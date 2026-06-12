import { useEffect, useState } from "react";
import { LuChevronLeft, LuChevronRight, LuRefreshCw } from "react-icons/lu";
import { useAuth } from "../../auth/AuthProvider";
import { api } from "../../lib/api";
import { toastFromError } from "../../lib/toast";

const STATUS_DOT = {
  scheduled: "bg-indigo-500",
  published:  "bg-green-500",
  pending:    "bg-amber-500",
  assigned:   "bg-violet-500",
  approved:   "bg-blue-500",
  draft:      "bg-slate-400",
  verified:   "bg-emerald-500",
};

const STATUS_LABEL = {
  scheduled:"bg-indigo-100 text-indigo-700",
  published:"bg-green-100 text-green-700",
  pending:"bg-amber-100 text-amber-700",
  assigned:"bg-violet-100 text-violet-700",
  approved:"bg-blue-100 text-blue-700",
  draft:"bg-slate-100 text-slate-600",
  verified:"bg-emerald-100 text-emerald-700",
};

export function AppCalendar() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selected, setSelected] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const from = new Date(year, month, 1).toISOString().slice(0,10);
      const to   = new Date(year, month+1, 0).toISOString().slice(0,10);
      const d = await api(`/api/app/content?limit=200&dateFrom=${from}&dateTo=${to}`, { token });
      setItems(d.items || []);
    } catch (e) { toastFromError(e, "Failed"); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [token, year, month]);

  function prevMonth() { if (month === 0) { setMonth(11); setYear(y => y-1); } else setMonth(m => m-1); }
  function nextMonth() { if (month === 11) { setMonth(0); setYear(y => y+1); } else setMonth(m => m+1); }

  const daysInMonth = new Date(year, month+1, 0).getDate();
  const firstDay    = new Date(year, month, 1).getDay();
  const monthName   = new Date(year, month, 1).toLocaleString("default", { month:"long" });

  // Map items to day
  function itemsOnDay(day) {
    return items.filter(item => {
      const d = item.scheduledAt || item.publishedAt || item.createdAt;
      if (!d) return false;
      const date = new Date(d);
      return date.getFullYear()===year && date.getMonth()===month && date.getDate()===day;
    });
  }

  const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Content Calendar</h2>
          <p className="text-sm text-slate-500">View scheduled, published and pending content by date</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Legend */}
          <div className="hidden sm:flex items-center gap-3 text-xs text-slate-500 mr-2">
            {["scheduled","published","pending","assigned"].map(s => (
              <span key={s} className="flex items-center gap-1">
                <span className={`h-2 w-2 rounded-full ${STATUS_DOT[s]}`} />{s}
              </span>
            ))}
          </div>
          <button onClick={load} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition">
            <LuRefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Month navigator */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <button onClick={prevMonth} className="rounded-lg p-2 hover:bg-slate-100 transition"><LuChevronLeft className="h-4 w-4 text-slate-600" /></button>
          <div className="text-base font-bold text-slate-900">{monthName} {year}</div>
          <button onClick={nextMonth} className="rounded-lg p-2 hover:bg-slate-100 transition"><LuChevronRight className="h-4 w-4 text-slate-600" /></button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-slate-100">
          {DAYS.map(d => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-slate-400">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        {loading ? (
          <div className="grid grid-cols-7">
            {Array.from({ length: 35 }).map((_, i) => <div key={i} className="h-20 border-b border-r border-slate-50 animate-pulse bg-slate-50" />)}
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {/* Empty cells before month start */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`e${i}`} className="min-h-[80px] border-b border-r border-slate-50 bg-slate-50/50" />
            ))}
            {/* Day cells */}
            {Array.from({ length: daysInMonth }, (_, i) => i+1).map(day => {
              const dayItems = itemsOnDay(day);
              const isToday = now.getFullYear()===year && now.getMonth()===month && now.getDate()===day;
              return (
                <div key={day} onClick={() => setSelected({ day, items: dayItems })}
                  className={`min-h-[80px] border-b border-r border-slate-100 p-1.5 cursor-pointer transition hover:bg-indigo-50/30 ${isToday?"bg-indigo-50/60":""}`}>
                  <div className={`text-xs font-bold mb-1 h-5 w-5 flex items-center justify-center rounded-full ${isToday?"bg-indigo-600 text-white":"text-slate-600"}`}>{day}</div>
                  <div className="space-y-0.5">
                    {dayItems.slice(0,3).map(item => (
                      <div key={item._id} className={`flex items-center gap-1 rounded px-1 py-0.5 text-[9px] font-semibold truncate ${STATUS_LABEL[item.status]||"bg-slate-100 text-slate-600"}`}>
                        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${STATUS_DOT[item.status]||"bg-slate-400"}`} />
                        <span className="truncate">{item.output?.title || item.topic}</span>
                      </div>
                    ))}
                    {dayItems.length > 3 && <div className="text-[9px] text-slate-400 pl-1">+{dayItems.length-3} more</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Day detail panel */}
      {selected && selected.items.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">{monthName} {selected.day}, {year} — {selected.items.length} content piece{selected.items.length>1?"s":""}</h3>
            <button onClick={() => setSelected(null)} className="text-xs text-slate-400 hover:text-slate-600">Close</button>
          </div>
          <div className="space-y-3">
            {selected.items.map(item => (
              <div key={item._id} className="rounded-xl border border-slate-100 p-4 flex items-start gap-3">
                <span className={`mt-0.5 h-2.5 w-2.5 rounded-full shrink-0 ${STATUS_DOT[item.status]||"bg-slate-400"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{item.output?.title || item.topic}</p>
                  <p className="text-xs text-slate-500">{item.ceoName} · {item.contentType} · {item.platform}</p>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${STATUS_LABEL[item.status]||""}`}>{item.status}</span>
                    {item.assignedTo && <span className="text-[10px] text-slate-400">→ {item.assignedTo}</span>}
                    {item.output?.scores?.seo && <span className="rounded bg-emerald-50 text-emerald-700 px-1.5 text-[10px] font-semibold">SEO:{item.output.scores.seo}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
