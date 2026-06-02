import { Route, Routes } from "react-router-dom";
import { DashboardShell } from "../components/DashboardShell";
import { AdminOverview } from "./admin/AdminOverview";
import { AdminApps } from "./admin/AdminApps";
import { AdminElection } from "./admin/AdminElection";
import { AdminElectionDefeatedPage } from "./admin/AdminElectionDefeatedPage";
import { AdminElectionDefeatedDetailPage } from "./admin/AdminElectionDefeatedDetailPage";

export function AdminDashboard() {
  return (
    <DashboardShell
      loginPath="/admin/login"
      portalLabel="ADMIN PORTAL"
      navItems={[
        {
          to: "/admin",
          label: "Overview",
          headerTitle: "Admin Overview",
          end: true,
          icon: "overview",
        },
        {
          to: "/admin/apps",
          label: "Apps",
          headerTitle: "Apps Management",
          icon: "apps",
        },
        {
          to: "/admin/election",
          label: "Election",
          headerTitle: "Electoral Analytics",
          icon: "election",
        },
      ]}
    >
      <Routes>
        <Route index element={<AdminOverview />} />
        <Route path="apps" element={<AdminApps />} />
        <Route path="election/defeated/:bodyType/:year/seat/:seatNo" element={<AdminElectionDefeatedDetailPage />} />
        <Route path="election/defeated" element={<AdminElectionDefeatedPage />} />
        <Route path="election" element={<AdminElection />} />
      </Routes>
    </DashboardShell>
  );
}