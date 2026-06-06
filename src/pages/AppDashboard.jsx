import { Route, Routes, Navigate } from "react-router-dom";
import { DashboardShell } from "../components/DashboardShell";
import { AppOverview } from "./app/AppOverview";
import { AppCandidates } from "./app/AppCandidates";
import { AppSocialMedia } from "./app/AppSocialMedia";
import { AppNews } from "./app/AppNews";
import { AppDigitalMentions } from "./app/AppDigitalMentions";
import { AppSettings } from "./app/AppSettings";
import { SettingsPage } from "./shared/SettingsPage";
import { HelpPage } from "./shared/HelpPage";
import { AppProfile } from "./app/AppProfile";
import { useAuth } from "../auth/AuthProvider";

const FC_NAV = [
  { to: "/app", label: "Overview", headerTitle: "App Overview", end: true, icon: "overview" },
  { to: "/app/profile", label: "Profile", headerTitle: "Profile", icon: "profile" },
  { to: "/app/social", label: "Social Media", headerTitle: "Social Media", icon: "social" },
  { to: "/app/news", label: "News", headerTitle: "News", icon: "news" },
  { to: "/app/digital-mentions", label: "Digital Mentions", headerTitle: "Digital Mentions", icon: "digitalMentions" },
];

const MANAGER_NAV = [
  { to: "/app", label: "Overview", headerTitle: "App Overview", end: true, icon: "overview" },
  { to: "/app/candidates", label: "Candidates", headerTitle: "Candidates", icon: "candidates" },
];

export function AppDashboard() {
  const { user } = useAuth();
  const isManager = user?.showCandidates === true;

  if (isManager) {
    return (
      <DashboardShell loginPath="/app/login" portalLabel="APP PORTAL" navItems={MANAGER_NAV}>
        <Routes>
          <Route index element={<AppOverview />} />
          <Route path="candidates" element={<AppCandidates />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="help" element={<HelpPage />} />
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell loginPath="/app/login" portalLabel="APP PORTAL" navItems={FC_NAV}>
      <Routes>
        <Route index element={<AppOverview />} />
        <Route path="profile" element={<AppProfile />} />
        <Route path="social" element={<AppSocialMedia />} />
        <Route path="news" element={<AppNews />} />
        <Route path="digital-mentions" element={<AppDigitalMentions />} />
        <Route path="settings" element={<AppSettings />} />
        <Route path="help" element={<HelpPage />} />
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Routes>
    </DashboardShell>
  );
}
