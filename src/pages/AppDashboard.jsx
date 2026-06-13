import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import { DashboardShell } from "../components/DashboardShell";
import { GenerationProvider } from "../components/GenerationContext";
import { AppOverview } from "./app/AppOverview";
import { AppCandidates } from "./app/AppCandidates";
import { AppSocialMedia } from "./app/AppSocialMedia";
import { AppNews } from "./app/AppNews";
import { AppDigitalMentions } from "./app/AppDigitalMentions";
import { AppSettings } from "./app/AppSettings";
import { SettingsPage } from "./shared/SettingsPage";
import { HelpPage } from "./shared/HelpPage";
import { AppAIAssistant } from "./app/AppAIAssistant";
import { AppCampaign } from "./app/AppCampaign";
import { AppContentTools } from "./app/AppContentTools";
import { AppProfile } from "./app/AppProfile";
import { AppDistributionQueue } from "./app/AppDistributionQueue";
import { AppCalendar } from "./app/AppCalendar";
import { AppPopularityIndex } from "./app/AppPopularityIndex";
import { AppContents } from "./app/AppContents";
import { AppCreateContent } from "./app/AppCreateContent";
import { AppContentDetail } from "./app/AppContentDetail";
import { AppContentEditor } from "./app/AppContentEditor";
import { SpiritualDashboard } from "./app/SpiritualDashboard";
import { ChangeMakerDashboard } from "./app/ChangeMakerDashboard";
import { FounderDashboard } from "./app/FounderDashboard";
import { useAuth } from "../auth/AuthProvider";

// ── Nav configs ────────────────────────────────────────────────────────────────

const FC_NAV = [
  { to: "/app",               label: "Dashboard",    headerTitle: "Dashboard",            end: true, icon: "overview" },
  { to: "/app/profile",       label: "Profile",      headerTitle: "Profile",              icon: "profile" },
  { to: "/app/content-tools", label: "Content Tools",headerTitle: "CEO Content OS",       icon: "aiGenerator" },
  { to: "/app/distribution",  label: "Distribution", headerTitle: "Distribution Queue",   icon: "queue" },
  { to: "/app/calendar",      label: "Calendar",     headerTitle: "Content Calendar",     icon: "calendar" },
  { to: "/app/popularity",    label: "Popularity",   headerTitle: "CEO Popularity Index", icon: "popularity" },
  { to: "/app/campaign",      label: "Campaigns",    headerTitle: "Campaigns",            icon: "campaign" },
  { to: "/app/social",        label: "Social Media", headerTitle: "Social Media",         icon: "social" },
  { to: "/app/news",          label: "News",         headerTitle: "News",                 icon: "news" },
  { to: "/app/digital-mentions", label: "AI Mentions", headerTitle: "Digital Mentions",   icon: "digitalMentions" },
  { to: "/app/contents",         label: "Contents",   headerTitle: "Contents",            icon: "queue" },
];

const MANAGER_NAV = [
  { to: "/app",            label: "Overview",    headerTitle: "App Overview", end: true, icon: "overview" },
  { to: "/app/candidates", label: "Candidates",  headerTitle: "Candidates",              icon: "candidates" },
];

const SPIRITUAL_NAV = [
  { to: "/app",        label: "Dashboard",    headerTitle: "Spiritual Dashboard", end: true, icon: "overview" },
  { to: "/app/social", label: "Social Media",  headerTitle: "Social Media",         icon: "social" },
  { to: "/app/news",   label: "News",          headerTitle: "News",                  icon: "news" },
];

const CHANGEMAKER_NAV = [
  { to: "/app",        label: "Dashboard",    headerTitle: "Change Maker Dashboard", end: true, icon: "overview" },
  { to: "/app/social", label: "Social Media",  headerTitle: "Social Media",           icon: "social" },
  { to: "/app/news",   label: "News",          headerTitle: "News",                   icon: "news" },
];

const FOUNDER_NAV = [
  { to: "/app",          label: "Overview",       headerTitle: "Overview",                end: true, icon: "overview" },
  { to: "/app/ceos",     label: "CEOs / Founders", headerTitle: "CEO & Founder Management", icon: "candidates" },
];

// ── Dashboard selector ─────────────────────────────────────────────────────────

export function AppDashboard() {
  const { user } = useAuth();

  const dashboardType = user?.dashboardType || "default";
  const isManager = user?.showCandidates === true;
  const location = useLocation();
  const isDetailPage = /^\/app\/contents\/[^/]+$/.test(location.pathname);
  const isEditorPage = /^\/app\/contents\/[^/]+\/edit$/.test(location.pathname);
  const isFullPageContent = isDetailPage || isEditorPage;

  // Founder dashboard
  if (dashboardType === "founder") {
    return (
      <DashboardShell loginPath="/app/login" portalLabel="FOUNDER OS" navItems={FOUNDER_NAV}>
        <Routes>
          <Route index    element={<AppOverview />} />
          <Route path="ceos"     element={<FounderDashboard />} />
          <Route path="settings" element={<AppSettings />} />
          <Route path="help"     element={<HelpPage />} />
          <Route path="*"        element={<Navigate to="/app" replace />} />
        </Routes>
      </DashboardShell>
    );
  }

  // Change Maker dashboard
  if (dashboardType === "changemaker") {
    return (
      <DashboardShell loginPath="/app/login" portalLabel="CHANGE MAKER OS" navItems={CHANGEMAKER_NAV}>
        <Routes>
          <Route index element={<ChangeMakerDashboard />} />
          <Route path="social"   element={<AppSocialMedia />} />
          <Route path="news"     element={<AppNews />} />
          <Route path="settings" element={<AppSettings />} />
          <Route path="help"     element={<HelpPage />} />
          <Route path="*"        element={<Navigate to="/app" replace />} />
        </Routes>
      </DashboardShell>
    );
  }

  // Spiritual Guru dashboard
  if (dashboardType === "spiritual") {
    return (
      <DashboardShell loginPath="/app/login" portalLabel="SPIRITUAL GURU OS" navItems={SPIRITUAL_NAV}>
        <Routes>
          <Route index element={<SpiritualDashboard />} />
          <Route path="social"   element={<AppSocialMedia />} />
          <Route path="news"     element={<AppNews />} />
          <Route path="settings" element={<AppSettings />} />
          <Route path="help"     element={<HelpPage />} />
          <Route path="*"        element={<Navigate to="/app" replace />} />
        </Routes>
      </DashboardShell>
    );
  }

  // Candidate manager dashboard
  if (isManager) {
    return (
      <DashboardShell loginPath="/app/login" portalLabel="APP PORTAL" navItems={MANAGER_NAV}>
        <Routes>
          <Route index element={<AppOverview />} />
          <Route path="candidates" element={<AppCandidates />} />
          <Route path="settings"   element={<SettingsPage />} />
          <Route path="help"       element={<HelpPage />} />
          <Route path="*"          element={<Navigate to="/app" replace />} />
        </Routes>
      </DashboardShell>
    );
  }

  // Default CEO Content OS dashboard
  // Editor page — completely bypass shell (true full screen)
  if (isEditorPage) {
    return (
      <GenerationProvider>
        <Routes>
          <Route path="contents/:id/edit" element={<AppContentEditor />} />
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
      </GenerationProvider>
    );
  }

  return (
    <GenerationProvider>
    <DashboardShell loginPath="/app/login" portalLabel="CEO CONTENT OS" navItems={FC_NAV} flatContent={isFullPageContent}>
      <Routes>
        <Route index element={<AppOverview />} />
        <Route path="profile"          element={<AppProfile />} />
        <Route path="ai-assistant"     element={<AppAIAssistant />} />
        <Route path="campaign"         element={<AppCampaign />} />
        <Route path="content-tools"    element={<AppContentTools />} />
        <Route path="distribution"     element={<AppDistributionQueue />} />
        <Route path="calendar"         element={<AppCalendar />} />
        <Route path="popularity"       element={<AppPopularityIndex />} />
        <Route path="social"           element={<AppSocialMedia />} />
        <Route path="news"             element={<AppNews />} />
        <Route path="digital-mentions" element={<AppDigitalMentions />} />
        <Route path="contents"          element={<AppContents />} />
        <Route path="contents/create"    element={<AppCreateContent />} />
        <Route path="contents/:id/edit"  element={<AppContentEditor />} />
        <Route path="contents/:id"       element={<AppContentDetail />} />
        <Route path="settings"         element={<AppSettings />} />
        <Route path="help"             element={<HelpPage />} />
        <Route path="*"                element={<Navigate to="/app" replace />} />
      </Routes>
    </DashboardShell>
    </GenerationProvider>
  );
}
