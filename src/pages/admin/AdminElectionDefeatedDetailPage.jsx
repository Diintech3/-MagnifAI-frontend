import { useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

export function AdminElectionDefeatedDetailPage() {
  const navigate = useNavigate();
  const { bodyType, year, seatNo } = useParams();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    navigate(
      `/admin/election/constituency/${bodyType}/${year}/seat/${seatNo}?from=/admin/election/results&${searchParams.toString()}`,
      { replace: true }
    );
  }, [navigate, bodyType, year, seatNo, searchParams]);

  return null;
}
