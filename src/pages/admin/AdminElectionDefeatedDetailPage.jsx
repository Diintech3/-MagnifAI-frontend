import { Link, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { api } from "../../lib/api";
import { toastFromError } from "../../lib/toast";
import { useEffect, useMemo, useState } from "react";

const PARTY_CHIP = {
  BJP: "bg-orange-500",
  SP: "bg-lime-600",
  INC: "bg-sky-600",
  BSP: "bg-slate-600",
  RLD: "bg-green-600",
  IND: "bg-gray-500",
  AAP: "bg-emerald-600",
  Others: "bg-slate-400",
};

function ResultBadge({ result }) {
  const r = String(result || "");
  const tone =
    r === "WINNER"
      ? "bg-emerald-100 text-emerald-900 ring-emerald-200"
      : r === "RUNNER_UP"
        ? "bg-amber-100 text-amber-900 ring-amber-200"
        : "bg-rose-100 text-rose-900 ring-rose-200";
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${tone}`}>{r}</span>;
}

function ProfileRow({ label, value, href }) {
  if (!value && !href) return null;
  return (
    <div className="flex items-start justify-between gap-3 py-1 text-sm">
      <span className="text-stone-600">{label}</span>
      {href ? (
        <a className="max-w-[70%] truncate font-semibold text-teal-800 hover:underline" href={href} target="_blank" rel="noreferrer">
          {value || href}
        </a>
      ) : (
        <span className="max-w-[70%] truncate font-semibold text-emerald-950">{value}</span>
      )}
    </div>
  );
}

function CandidateProfileCard({ title, candidate, party, profile }) {
  return (
    <div className="rounded-xl border border-amber-200/80 bg-[#faf6f0] p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-stone-600">{title}</div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="font-semibold text-emerald-950">{candidate || "—"}</span>
            <span className={`rounded px-1.5 py-0.5 text-xs font-semibold text-white ${PARTY_CHIP[party] || PARTY_CHIP.Others}`}>
              {party || "—"}
            </span>
          </div>
        </div>
        {!profile ? (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-900 ring-1 ring-amber-200">
            Profile not available
          </span>
        ) : (
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-900 ring-1 ring-emerald-200">
            Profile found
          </span>
        )}
      </div>

      {profile ? (
        <div className="mt-3 border-t border-amber-200/60 pt-3">
          <ProfileRow label="Phone" value={profile.phone} />
          <ProfileRow label="Email" value={profile.email} />
          <ProfileRow
            label="Address"
            value={
              [profile.address?.line1, profile.address?.line2, profile.address?.city, profile.address?.district, profile.address?.state, profile.address?.pincode]
                .filter(Boolean)
                .join(", ")
            }
          />

          <div className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-stone-600">Social</div>
          <ProfileRow label="Facebook" href={profile.social?.facebook} value={profile.social?.facebook} />
          <ProfileRow label="Instagram" href={profile.social?.instagram} value={profile.social?.instagram} />
          <ProfileRow label="Twitter/X" href={profile.social?.twitter} value={profile.social?.twitter} />
          <ProfileRow label="YouTube" href={profile.social?.youtube} value={profile.social?.youtube} />
          <ProfileRow label="Website" href={profile.social?.website} value={profile.social?.website} />

          <div className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-stone-600">Personal</div>
          <ProfileRow label="Age" value={profile.personal?.age ? String(profile.personal.age) : ""} />
          <ProfileRow label="Gender" value={profile.personal?.gender} />
          <ProfileRow label="Education" value={profile.personal?.education} />
          <ProfileRow label="Profession" value={profile.personal?.profession} />
        </div>
      ) : (
        <div className="mt-3 text-sm text-stone-700">
          This information is not present in the election result dataset. Add profile data in{" "}
          <code className="rounded bg-amber-100 px-1">backend/data/candidate-profiles/</code> to show phone, address, and social links.
        </div>
      )}
    </div>
  );
}

export function AdminElectionDefeatedDetailPage() {
  const { token } = useAuth();
  const { bodyType, year, seatNo } = useParams();
  const [searchParams] = useSearchParams();
  const highlightCandidate = searchParams.get("candidate") || "";

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const backHref = useMemo(() => {
    const qs = new URLSearchParams({
      bodyType: String(bodyType || "VIDHAN_SABHA"),
      year: String(year || "2022"),
      rankMode: "all",
      party: "ALL",
      page: "1",
    });
    return `/admin/election/defeated?${qs.toString()}`;
  }, [bodyType, year]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const qs = new URLSearchParams({
          bodyType: String(bodyType || "VIDHAN_SABHA"),
          year: String(year || "2022"),
          candidate: highlightCandidate,
        });
        const d = await api(`/api/admin/election-defeats/UP/seat/${seatNo}?${qs.toString()}`, { token });
        if (!cancelled) setData(d);
      } catch (e) {
        if (!cancelled) {
          setData(null);
          toastFromError(e, "Failed to load seat details");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [token, bodyType, year, seatNo, highlightCandidate]);

  return (
    <div className="-m-4 flex min-h-[calc(100dvh-3.5rem)] flex-col bg-[#f3ede4] sm:-m-6">
      <div className="shrink-0 border-b border-amber-200/70 bg-gradient-to-br from-[#e5efe8] via-[#faf6f0] to-[#f5e8e6] px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <Link to={backHref} className="text-sm font-medium text-teal-800 hover:text-teal-950 hover:underline">
              ← Back to Winners & Defeated list
            </Link>
            <h1 className="mt-1 text-xl font-bold tracking-tight text-emerald-950 sm:text-2xl">
              Seat detail — {data?.seatName ? data.seatName : `#${seatNo}`}
            </h1>
            <p className="mt-1 text-sm text-stone-700">
              {data?.stateName || "Uttar Pradesh"} · {String(bodyType || "").replace(/_/g, " ")} · {year}
              {data?.district ? ` · ${data.district}` : ""}
            </p>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 sm:p-6">
        {loading ? (
          <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-amber-300/80 bg-[#faf6f0] text-sm text-stone-600">
            Loading seat detail…
          </div>
        ) : !data?.supported ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-8 text-sm text-amber-950">
            {data?.message || "Seat details unavailable."}
          </div>
        ) : (
          <>
            <div className="grid gap-3 lg:grid-cols-3">
              <div className="rounded-xl border border-amber-200/80 bg-[#faf6f0] p-4 shadow-sm">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-stone-600">Winner</div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <ResultBadge result="WINNER" />
                  <span className="font-semibold text-emerald-950">{data.winner?.candidate || "—"}</span>
                  <span className={`rounded px-1.5 py-0.5 text-xs font-semibold text-white ${PARTY_CHIP[data.winner?.party] || PARTY_CHIP.Others}`}>
                    {data.winner?.party || "—"}
                  </span>
                </div>
                <div className="mt-2 text-sm text-stone-700">
                  Votes: <span className="font-semibold tabular-nums text-emerald-950">{(data.winner?.votes || 0).toLocaleString("en-IN")}</span>{" "}
                  · {data.winner?.votePercent ? `${data.winner.votePercent}%` : "—"}
                </div>
              </div>

              <div className="rounded-xl border border-amber-200/80 bg-[#faf6f0] p-4 shadow-sm">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-stone-600">Seat</div>
                <div className="mt-2 text-sm text-stone-700">
                  Seat no: <span className="font-semibold text-emerald-950">{data.seatNo}</span>
                </div>
                <div className="mt-1 text-sm text-stone-700">
                  Constituency: <span className="font-semibold text-emerald-950">{data.seatName}</span>
                </div>
                <div className="mt-1 text-sm text-stone-700">
                  Polled votes:{" "}
                  <span className="font-semibold tabular-nums text-emerald-950">
                    {data.polledVotes ? Number(data.polledVotes).toLocaleString("en-IN") : "—"}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-amber-200/80 bg-[#faf6f0] p-4 shadow-sm">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-stone-600">Source</div>
                <div className="mt-2 text-sm text-stone-700">{data.source}</div>
                {data.partial ? (
                  <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                    Lok Sabha: runner-up data partial in source.
                  </div>
                ) : null}
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              <CandidateProfileCard
                title="Winner profile"
                candidate={data.winner?.candidate}
                party={data.winner?.party}
                profile={data.winner?.profile}
              />
              <CandidateProfileCard
                title="Selected candidate profile"
                candidate={
                  (data.contestants || []).find((c) => c.highlighted)?.candidate || highlightCandidate || "—"
                }
                party={(data.contestants || []).find((c) => c.highlighted)?.party || ""}
                profile={(data.contestants || []).find((c) => c.highlighted)?.profile || null}
              />
            </div>

            <div className="rounded-xl border border-amber-200/80 bg-[#fff7ec] px-4 py-3 text-sm text-stone-700">
              <span className="font-semibold text-amber-900">Data note:</span> votes, percentages, party, rank and margin come
              from election results. Personal/contact/social details are optional profile records.
            </div>

            <div className="overflow-hidden rounded-xl border border-amber-200/80 bg-[#faf6f0] shadow-sm">
              <div className="border-b border-amber-200/60 bg-[#f0e6dc] px-5 py-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-950">All candidates (seat-wise)</h2>
              </div>
              <div className="overflow-auto">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead className="sticky top-0 bg-[#f7efe6] text-xs uppercase text-stone-700">
                    <tr>
                      <th className="px-3 py-2">Rank</th>
                      <th className="px-3 py-2">Result</th>
                      <th className="px-3 py-2">Candidate</th>
                      <th className="px-3 py-2">Party</th>
                      <th className="px-3 py-2 text-right">Votes</th>
                      <th className="px-3 py-2 text-right">%</th>
                      <th className="px-3 py-2 text-right">Margin vs winner</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.contestants || []).map((c) => (
                      <tr
                        key={`${c.rank}-${c.candidate}`}
                        className={`border-t border-amber-100/70 ${
                          c.highlighted ? "bg-rose-100/60" : "hover:bg-amber-50/60"
                        }`}
                      >
                        <td className="px-3 py-2 tabular-nums text-stone-700">{c.rank}</td>
                        <td className="px-3 py-2">
                          <ResultBadge result={c.result} />
                        </td>
                        <td className="px-3 py-2 font-medium text-emerald-950">{c.candidate}</td>
                        <td className="px-3 py-2">
                          <span className={`rounded px-1.5 py-0.5 text-xs font-semibold text-white ${PARTY_CHIP[c.party] || PARTY_CHIP.Others}`}>
                            {c.party}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-stone-800">{(c.votes || 0).toLocaleString("en-IN")}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-stone-800">{c.votePercent ? `${c.votePercent}%` : "—"}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-rose-900">
                          {c.result === "WINNER" ? "—" : (c.marginVotes || 0).toLocaleString("en-IN")}
                          {c.result === "WINNER" ? null : <span className="block text-[10px] text-stone-600">{c.marginPercent}% gap</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

