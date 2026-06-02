import { Route, Routes } from "react-router-dom";
import { DashboardShell } from "../components/DashboardShell";
import { AppOverview } from "./app/AppOverview";
import { AppCandidates } from "./app/AppCandidates";

export function AppDashboard() {
  return (
    <DashboardShell
      loginPath="/app/login"
      portalLabel="APP PORTAL"
      navItems={[
        {
          to: "/app",
          label: "Overview",
          headerTitle: "App Overview",
          end: true,
          icon: "overview",
        },
        {
          to: "/app/candidates",
          label: "Candidates",
          headerTitle: "Candidates",
          icon: "candidates",
        },
      ]}
    >
      <Routes>
        <Route index element={<AppOverview />} />
        <Route path="candidates" element={<AppCandidates />} />
      </Routes>
    </DashboardShell>
  );
}
