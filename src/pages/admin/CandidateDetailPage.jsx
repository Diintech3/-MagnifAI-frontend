import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { LuArrowLeft, LuMapPin, LuExpand, LuX, LuUsers } from "react-icons/lu";
import { useAuth } from "../../auth/AuthProvider";
import { api } from "../../lib/api";
import { toastFromError } from "../../lib/toast";
import { CandidateCard, SocialMediaCard, MiniMapContent } from "./ConstituencyDetailPage";

export function CandidateDetailPage() {
  const { token } = useAuth();
  const { bodyType, year, seatNo, candidateName } = useParams();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [data, setData]       = useState(null);
  const [mapOpen, setMapOpen] = useState(false);

  const decoded = decodeURIComponent(candidateName || "");
  const backTo  = searchParams.get("from") ||
    `/admin/election/constituency/${bodyType}/${year}/seat/${seatNo}`;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const qs = new URLSearchParams({ bodyType: bodyType || "VIDHAN_SABHA", year: year || "2022" });
    api(`/api/admin/constituency/UP/seat/${seatNo}?${qs}`, { token })
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) toastFromError(e, "Failed to load"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token, bodyType, year, seatNo]);

  const candidate = data?.candidates?.find(
    (c) => c.candidate?.toLowerCase() === decoded.toLowerCase()
  );

  const constituencyInfo = {
    stateCode: data?.stateCode || "UP",
    bodyType:  data?.bodyType  || "VIDHAN_SABHA",
    year:      data?.year      || "2022",
    seatNo:    data?.seatNo,
    seatName:  data?.seatName,
  };

  return (
    <div className="-m-4 flex min-h-[calc(100dvh-3.5rem)] flex-col bg-[#f3ede4] sm:-m-6">
      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="animate-pulse text-sm text-stone-500">Loading…</p>
        </div>
      ) : !candidate ? (
        <div className="m-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-10 text-center text-sm text-amber-900">
          Candidate not found.
        </div>
      ) : (
        <div className="flex-1 space-y-4 p-4 sm:p-6">

          {/* Top: Info + Map */}
          <div className="grid gap-4 lg:grid-cols-[1fr_380px]">

            {/* LEFT: back + candidate header + constituency stats */}
            <div className="rounded-2xl border border-amber-200/70 bg-gradient-to-br from-[#e5efe8] via-[#faf6f0] to-[#f0e6dc] p-5 flex flex-col gap-4">
              <Link
                to={backTo}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-700 hover:text-teal-900 hover:underline w-fit"
              >
                <LuArrowLeft className="h-3.5 w-3.5" /> Back to Constituency Results
              </Link>

              {/* Constituency info */}
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-emerald-950">
                  {data.seatName}
                  <span className="ml-2 text-sm font-normal text-stone-500">Seat #{data.seatNo}</span>
                </h1>
                <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-stone-600">
                  <span className="flex items-center gap-1"><LuMapPin className="h-3 w-3" />{data.district || "Uttar Pradesh"}</span>
                  <span>{data.bodyType?.replace(/_/g, " ")} · {data.year}</span>
                  <span className="flex items-center gap-1"><LuUsers className="h-3 w-3" />{data.totalContestants} candidates</span>
                  {data.polledVotes > 0 && <span>{Number(data.polledVotes).toLocaleString("en-IN")} votes polled</span>}
                  {data.marginVotes > 0 && <span>Margin: {data.marginVotes.toLocaleString("en-IN")}</span>}
                </div>
              </div>

              {/* Constituency KPI cards */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: "Winner",          value: data.winner?.candidate, accent: true },
                  { label: "Party",            value: data.winner?.party },
                  { label: "Winner Vote %",    value: `${data.winnerVoteShare}%` },
                  { label: "Total Candidates", value: String(data.totalContestants) },
                ].map((s) => (
                  <div key={s.label} className={`rounded-xl border px-4 py-3 shadow-sm ${
                    s.accent ? "border-emerald-200 bg-emerald-50" : "border-amber-200/70 bg-[#faf6f0]"
                  }`}>
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">{s.label}</div>
                    <div className={`mt-1 truncate text-base font-bold ${
                      s.accent ? "text-emerald-900" : "text-emerald-950"
                    }`}>{s.value || "—"}</div>
                  </div>
                ))}
              </div>

              {/* Selected candidate highlight */}
              <div className="rounded-xl border border-rose-200 bg-rose-50/60 px-4 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-stone-400 uppercase tracking-wide mb-0.5">Viewing Candidate</p>
                  <p className="text-lg font-bold text-emerald-950 truncate">{candidate.candidate}</p>
                  <div className="flex flex-wrap gap-2 mt-1 text-[11px] text-stone-500">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white ${
                      {BJP:"bg-orange-500",SP:"bg-lime-600",INC:"bg-sky-600",BSP:"bg-slate-700",IND:"bg-gray-500",AAP:"bg-emerald-600"}[candidate.party] || "bg-slate-400"
                    }`}>{candidate.party}</span>
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                      {candidate.result === "RUNNER_UP" ? "Runner-Up" : candidate.result}
                    </span>
                    <span>{(candidate.votes || 0).toLocaleString("en-IN")} votes ({candidate.votePercent}%)</span>
                    {candidate.personal?.age && <span>· Age {candidate.personal.age}</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: Mini map */}
            <div
              className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm cursor-pointer group"
              onClick={() => setMapOpen(true)}
            >
              <div className="bg-[#eb7f2b] px-4 py-2.5 flex items-center gap-2">
                <LuMapPin className="h-3.5 w-3.5 text-white shrink-0" />
                <span className="text-xs font-bold text-white tracking-wide truncate">
                  ASSEMBLY ELECTIONS ({data.year})
                </span>
                <span className="ml-auto text-[10px] font-medium text-orange-100 shrink-0">Seat #{data.seatNo}</span>
              </div>
              <div style={{ height: 220 }} className="bg-[#eef1f4]">
                <MiniMapContent
                  seatName={data.seatName}
                  seatNo={data.seatNo}
                  bodyType={data.bodyType}
                  year={data.year}
                />
              </div>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 transition flex items-center gap-1.5 rounded-xl bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow">
                  <LuExpand className="h-3.5 w-3.5" /> Click to expand
                </span>
              </div>
            </div>
          </div>

          {/* Fullscreen Map Modal */}
          {mapOpen && (
            <div className="fixed inset-0 z-50 flex flex-col bg-black/70" onClick={() => setMapOpen(false)}>
              <div className="flex items-center justify-between bg-[#eb7f2b] px-5 py-3" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-2">
                  <LuMapPin className="h-4 w-4 text-white" />
                  <span className="text-sm font-bold text-white">ASSEMBLY ELECTIONS ({data.year})</span>
                  <span className="ml-2 text-[11px] text-orange-200">Seat #{data.seatNo} · {data.seatName}</span>
                </div>
                <button onClick={() => setMapOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition">
                  <LuX className="h-4 w-4 text-white" />
                </button>
              </div>
              <div className="flex-1" onClick={(e) => e.stopPropagation()}>
                <MiniMapContent seatName={data.seatName} seatNo={data.seatNo} bodyType={data.bodyType} year={data.year} fullscreen />
              </div>
            </div>
          )}

          {/* Candidate Detail Card */}
          <CandidateCard
            c={candidate}
            polledVotes={data.polledVotes || 0}
            winnerVotes={data.winner?.votes || 0}
          />

          {/* Social Media Card */}
          <SocialMediaCard
            constituencyInfo={constituencyInfo}
            winnerName={candidate.candidate}
            seatName={data.seatName}
            allCandidates={data.candidates || []}
            polledVotes={data.polledVotes || 0}
            token={token}
          />
        </div>
      )}
    </div>
  );
}
