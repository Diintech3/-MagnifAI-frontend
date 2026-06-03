import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  LuTrophy,
  LuUsers,
  LuUser,
  LuGraduationCap,
  LuBriefcase,
  LuWallet,
  LuTriangleAlert,
  LuShieldCheck,
  LuMapPin,
  LuExternalLink,
  LuArrowLeft,
  LuBadgeCheck,
} from "react-icons/lu";
import { useAuth } from "../../auth/AuthProvider";
import { api } from "../../lib/api";
import { toastFromError } from "../../lib/toast";

const PARTY_COLORS = {
  BJP: "bg-orange-500", SP: "bg-lime-600", INC: "bg-sky-600",
  BSP: "bg-slate-700", RLD: "bg-green-600", IND: "bg-gray-500",
  AAP: "bg-emerald-600", Others: "bg-slate-400",
};

function PartyBadge({ party }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white ${PARTY_COLORS[party] || PARTY_COLORS.Others}`}>
      {party || "—"}
    </span>
  );
}

function ResultBadge({ result }) {
  const styles = {
    WINNER:    { cls: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300", label: "Winner" },
    RUNNER_UP: { cls: "bg-amber-100 text-amber-800 ring-1 ring-amber-300",       label: "Runner-Up" },
    CONTESTED: { cls: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",       label: "Contested" },
  };
  const s = styles[result] || styles.CONTESTED;
  return <span className={`rounded-full px-3 py-0.5 text-[11px] font-bold ${s.cls}`}>{s.label}</span>;
}

function StatBox({ label, value, accent }) {
  return (
    <div className={`rounded-xl border px-4 py-3 shadow-sm ${accent ? "border-emerald-200 bg-emerald-50" : "border-amber-200/70 bg-[#faf6f0]"}`}>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">{label}</div>
      <div className={`mt-1 truncate text-base font-bold ${accent ? "text-emerald-900" : "text-emerald-950"}`}>{value || "—"}</div>
    </div>
  );
}

function VoteBar({ votes, total, winnerVotes, isWinner }) {
  const base = total > 0 ? total : winnerVotes > 0 ? winnerVotes * 1.5 : 1;
  const pct  = Math.min(100, Math.round((votes / base) * 100));
  return (
    <div className="px-5 pt-3 pb-1">
      <div className="flex items-center justify-between text-[10px] text-stone-500 mb-1">
        <span>{pct}% of polled votes</span>
        {!isWinner && winnerVotes > 0 ? (
          <span className="font-medium text-rose-600">
            −{(winnerVotes - votes).toLocaleString("en-IN")} vs winner
          </span>
        ) : null}
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-2 rounded-full ${isWinner ? "bg-emerald-500" : "bg-amber-400"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2.5 py-1.5 border-b border-slate-100 last:border-0">
      {Icon ? <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-stone-400" /> : null}
      <span className="shrink-0 text-[11px] text-stone-400 min-w-[90px]">{label}</span>
      <span className="text-[11px] font-semibold text-emerald-950 break-words text-right flex-1">{value}</span>
    </div>
  );
}

function CriminalBadge({ totalCases }) {
  const n = parseInt(totalCases, 10);
  if (totalCases === undefined || totalCases === null || totalCases === "") {
    return <span className="text-xs text-stone-400">Not available</span>;
  }
  if (n > 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-3 py-0.5 text-xs font-bold text-rose-800 ring-1 ring-rose-200">
        <LuTriangleAlert className="h-3 w-3" />
        {n} case{n > 1 ? "s" : ""} filed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-bold text-emerald-800 ring-1 ring-emerald-200">
      <LuShieldCheck className="h-3 w-3" />
      No criminal cases
    </span>
  );
}

function CandidateCard({ c, polledVotes, winnerVotes }) {
  const isWinner   = c.result === "WINNER";
  const isRunnerUp = c.result === "RUNNER_UP";

  return (
    <div className={`overflow-hidden rounded-2xl border shadow-sm ${
      isWinner   ? "border-emerald-300 bg-gradient-to-br from-emerald-50 to-[#faf6f0]"
      : isRunnerUp ? "border-amber-300 bg-[#fffdf7]"
      : "border-slate-200 bg-white"
    }`}>
      {/* top stripe */}
      <div className={`h-1 w-full ${isWinner ? "bg-emerald-500" : isRunnerUp ? "bg-amber-400" : "bg-slate-200"}`} />

      {/* header */}
      <div className="flex items-start justify-between gap-4 px-5 py-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
              isWinner ? "bg-emerald-700" : isRunnerUp ? "bg-amber-500" : "bg-slate-400"
            }`}>
              {c.rank}
            </span>
            <ResultBadge result={c.result} />
            <PartyBadge party={c.party} />
          </div>
          <h3 className="text-xl font-bold text-emerald-950 leading-tight">{c.candidate || "—"}</h3>
          <div className="mt-1.5 flex flex-wrap gap-3 text-[11px] text-stone-500">
            {c.personal?.age       ? <span className="flex items-center gap-1"><LuUser className="h-3 w-3" /> Age {c.personal.age}</span> : null}
            {c.personal?.education ? <span className="flex items-center gap-1"><LuGraduationCap className="h-3 w-3" /> {c.personal.education}</span> : null}
            {c.personal?.profession ? <span className="flex items-center gap-1"><LuBriefcase className="h-3 w-3" /> {c.personal.profession}</span> : null}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-2xl font-bold tabular-nums text-emerald-950">
            {(c.votes || 0).toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-stone-500">votes</div>
          <div className="mt-0.5 text-sm font-bold text-teal-700">{c.votePercent ?? "—"}%</div>
        </div>
      </div>

      {/* vote bar */}
      <VoteBar votes={c.votes} total={polledVotes} winnerVotes={winnerVotes} isWinner={isWinner} />

      {/* details */}
      <div className="grid gap-3 p-5 sm:grid-cols-3">

        {/* Personal */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
          <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
            <LuUser className="h-3 w-3" /> Personal Info
          </div>
          <InfoRow icon={LuGraduationCap} label="Education"  value={c.personal?.education} />
          <InfoRow icon={LuBriefcase}     label="Profession" value={c.personal?.profession} />
          <InfoRow icon={LuUser}          label="Age"        value={c.personal?.age ? `${c.personal.age} years` : ""} />
          <InfoRow icon={LuUser}          label="Gender"     value={c.personal?.gender} />
          {!c.personal?.education && !c.personal?.age && (
            <p className="text-[11px] text-stone-400 italic mt-1">No affidavit data available</p>
          )}
        </div>

        {/* Financial */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
          <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
            <LuWallet className="h-3 w-3" /> Declared Assets
          </div>
          <InfoRow icon={LuWallet} label="Total Assets"      value={c.financials?.totalAssets} />
          <InfoRow icon={LuWallet} label="Liabilities"       value={c.financials?.totalLiabilities} />
          {!c.financials?.totalAssets && (
            <p className="text-[11px] text-stone-400 italic mt-1">No asset data available</p>
          )}
          <div className="mt-3">
            <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
              <LuTriangleAlert className="h-3 w-3" /> Criminal Record
            </div>
            <CriminalBadge totalCases={c.criminal?.totalCases} />
          </div>
        </div>

        {/* Links */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
          <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
            <LuExternalLink className="h-3 w-3" /> Links & Address
          </div>
          {c.address?.self ? (
            <div className="mb-2 flex items-start gap-1.5">
              <LuMapPin className="mt-0.5 h-3 w-3 shrink-0 text-stone-400" />
              <span className="text-[11px] text-stone-600">{c.address.self}</span>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {c.social?.facebook  ? <a href={c.social.facebook}  target="_blank" rel="noreferrer" className="rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-100 transition">Facebook</a>   : null}
            {c.social?.twitter   ? <a href={c.social.twitter}   target="_blank" rel="noreferrer" className="rounded-lg bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 transition">Twitter</a>    : null}
            {c.social?.instagram ? <a href={c.social.instagram} target="_blank" rel="noreferrer" className="rounded-lg bg-pink-50  px-2.5 py-1 text-[11px] font-semibold text-pink-700  hover:bg-pink-100 transition">Instagram</a>  : null}
            {c.social?.youtube   ? <a href={c.social.youtube}   target="_blank" rel="noreferrer" className="rounded-lg bg-red-50   px-2.5 py-1 text-[11px] font-semibold text-red-700   hover:bg-red-100 transition">YouTube</a>    : null}
            {c.social?.website   ? <a href={c.social.website}   target="_blank" rel="noreferrer" className="rounded-lg bg-teal-50  px-2.5 py-1 text-[11px] font-semibold text-teal-700  hover:bg-teal-100 transition">Website</a>   : null}
            {c.wikipedia         ? <a href={c.wikipedia}        target="_blank" rel="noreferrer" className="rounded-lg bg-gray-50  px-2.5 py-1 text-[11px] font-semibold text-gray-700  hover:bg-gray-100 transition">Wikipedia</a>  : null}
            {c.mynetaUrl         ? <a href={c.mynetaUrl}        target="_blank" rel="noreferrer" className="rounded-lg bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 hover:bg-amber-100 transition">Myneta</a>     : null}
            {!c.social?.facebook && !c.wikipedia && !c.mynetaUrl && (
              <p className="text-[11px] text-stone-400 italic">No links available</p>
            )}
          </div>
        </div>
      </div>

      {/* bio */}
      {c.bio ? (
        <div className="mx-5 mb-5 rounded-xl border border-amber-100 bg-amber-50/60 px-4 py-3 text-[11px] leading-relaxed text-stone-600 italic">
          {c.bio}
        </div>
      ) : null}
    </div>
  );
}

export function ConstituencyDetailPage() {
  const { token }                  = useAuth();
  const { bodyType, year, seatNo } = useParams();
  const [searchParams]             = useSearchParams();
  const [loading, setLoading]      = useState(true);
  const [data, setData]            = useState(null);
  const [tab, setTab]              = useState("winner");

  const backTo = searchParams.get("from") || `/admin/election/results?bodyType=${bodyType || "VIDHAN_SABHA"}&year=${year || "2022"}&tab=winners`;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setData(null);
    const qs = new URLSearchParams({ bodyType: bodyType || "VIDHAN_SABHA", year: year || "2022" });
    api(`/api/admin/constituency/UP/seat/${seatNo}?${qs}`, { token })
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) toastFromError(e, "Failed to load constituency"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token, bodyType, year, seatNo]);

  const winners = data?.candidates?.filter((c) => c.result === "WINNER")  || [];
  const losers  = data?.candidates?.filter((c) => c.result !== "WINNER")  || [];
  const shown   = tab === "winner" ? winners : losers;

  return (
    <div className="-m-4 flex min-h-[calc(100dvh-3.5rem)] flex-col bg-[#f3ede4] sm:-m-6">

      {/* Header */}
      <div className="shrink-0 border-b border-amber-200/70 bg-gradient-to-r from-[#e5efe8] via-[#faf6f0] to-[#f0e6dc] px-4 py-5 sm:px-6">
        <Link to={backTo} className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-700 hover:text-teal-900 hover:underline">
          <LuArrowLeft className="h-3.5 w-3.5" /> Back to Constituency Results
        </Link>
        {data?.supported ? (
          <>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-emerald-950">
              {data.seatName}
              <span className="ml-2 text-sm font-normal text-stone-500">Seat #{data.seatNo}</span>
            </h1>
            <div className="mt-1 flex flex-wrap gap-4 text-xs text-stone-600">
              <span className="flex items-center gap-1"><LuMapPin className="h-3 w-3" />{data.district || "Uttar Pradesh"}</span>
              <span>{data.bodyType?.replace(/_/g, " ")} · {data.year}</span>
              <span className="flex items-center gap-1"><LuUsers className="h-3 w-3" />{data.totalContestants} candidates</span>
              {data.polledVotes ? <span>{Number(data.polledVotes).toLocaleString("en-IN")} votes polled</span> : null}
              {data.marginVotes > 0 ? <span>Margin: {data.marginVotes.toLocaleString("en-IN")}</span> : null}
            </div>
          </>
        ) : (
          <h1 className="mt-2 text-xl font-bold text-emerald-950">Constituency #{seatNo}</h1>
        )}
      </div>

      {/* Body */}
      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="animate-pulse text-sm text-stone-500">Loading constituency data…</p>
        </div>
      ) : !data?.supported ? (
        <div className="m-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-10 text-center text-sm text-amber-900">
          {data?.message || "Constituency data unavailable."}
        </div>
      ) : (
        <div className="flex-1 space-y-4 p-4 sm:p-6">

          {/* KPI row */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatBox label="Winner"           value={data.winner?.candidate} accent />
            <StatBox label="Party"            value={data.winner?.party} />
            <StatBox label="Winner Vote %"    value={`${data.winnerVoteShare}%`} />
            <StatBox label="Total Candidates" value={String(data.totalContestants)} />
          </div>

          {/* Tab switcher — NO emoji, React icons only */}
          <div className="flex rounded-2xl border border-amber-200/70 bg-[#f0e6dc] p-1 gap-1">
            <button
              type="button"
              onClick={() => setTab("winner")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all duration-150 ${
                tab === "winner"
                  ? "bg-emerald-700 text-white shadow"
                  : "bg-transparent text-stone-600 hover:bg-white/60 hover:text-emerald-900"
              }`}
            >
              <LuTrophy className="h-4 w-4" />
              Winner
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${tab === "winner" ? "bg-emerald-600 text-white" : "bg-stone-200 text-stone-600"}`}>
                {winners.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setTab("loser")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all duration-150 ${
                tab === "loser"
                  ? "bg-rose-600 text-white shadow"
                  : "bg-transparent text-stone-600 hover:bg-white/60 hover:text-rose-900"
              }`}
            >
              <LuUsers className="h-4 w-4" />
              Losers
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${tab === "loser" ? "bg-rose-500 text-white" : "bg-stone-200 text-stone-600"}`}>
                {losers.length}
              </span>
            </button>
          </div>

          {/* Cards */}
          <div className="space-y-4">
            {shown.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50/50 py-12 text-center text-sm text-stone-400">
                No candidates in this category.
              </div>
            ) : (
              shown.map((c) => (
                <CandidateCard
                  key={`${c.rank}-${c.candidate}`}
                  c={c}
                  polledVotes={data.polledVotes || 0}
                  winnerVotes={data.winner?.votes || 0}
                />
              ))
            )}
          </div>

          {/* Source */}
          <div className="rounded-xl border border-amber-200/60 bg-amber-50/70 px-4 py-3 text-[11px] text-stone-500 flex items-center justify-between flex-wrap gap-2">
            <span><strong className="text-amber-800">Sources:</strong> {data.source}</span>
            <a href="https://myneta.info/uttarpradesh2022/" target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1 font-medium text-teal-700 hover:underline">
              <LuBadgeCheck className="h-3.5 w-3.5" /> myneta.info
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
