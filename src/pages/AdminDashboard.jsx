import { Route, Routes } from "react-router-dom";
import { DashboardShell } from "../components/DashboardShell";
import { AdminOverview } from "./admin/AdminOverview";
import { AdminApps } from "./admin/AdminApps";
import { AdminElection } from "./admin/AdminElection";
import { AdminElectionDefeatedPage } from "./admin/AdminElectionDefeatedPage";
import { AdminElectionDefeatedDetailPage } from "./admin/AdminElectionDefeatedDetailPage";
import { ConstituencyDetailPage } from "./admin/ConstituencyDetailPage";
import { CandidateDetailPage } from "./admin/CandidateDetailPage";
import { AdminMagnifAI } from "./admin/AdminMagnifAI";
import { SettingsPage } from "./shared/SettingsPage";
import { HelpPage } from "./shared/HelpPage";

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
          to: "/admin/magnifai",
          label: "MagnifAI",
          headerTitle: "MagnifAI Dashboard",
          icon: "analysis",
        },
        {
          to: "/admin/apps",
          label: "Apps",
          headerTitle: "Apps Management",
          icon: "apps",
        },
        { to: "/admin/election", label: "Election", headerTitle: "Electoral Analytics", icon: "election" },
        { to: "/admin/settings", label: "Settings", headerTitle: "Settings", icon: "appSettings" },
        { to: "/admin/help", label: "Help", headerTitle: "Help & Support", icon: "help" },
      ]}
    >
      <Routes>
        <Route index element={<AdminOverview />} />
        <Route path="magnifai" element={<AdminMagnifAI />} />
        <Route path="apps" element={<AdminApps />} />
        <Route path="election/constituency/:bodyType/:year/seat/:seatNo/candidate/:candidateName" element={<CandidateDetailPage />} />
        <Route path="election/constituency/:bodyType/:year/seat/:seatNo" element={<ConstituencyDetailPage />} />
        <Route path="election/defeated/:bodyType/:year/seat/:seatNo" element={<AdminElectionDefeatedDetailPage />} />
        <Route path="election/defeated" element={<AdminElectionDefeatedPage />} />
        <Route path="election/results" element={<AdminElectionDefeatedPage />} />
        <Route path="election" element={<AdminElection />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="help" element={<HelpPage />} />
      </Routes>
    </DashboardShell>
  );
}