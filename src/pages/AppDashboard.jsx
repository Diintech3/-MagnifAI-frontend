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
import { AppPeople } from "./app/AppPeople";
import { AppContents } from "./app/AppContents";
import { AppCreateContent } from "./app/AppCreateContent";
import { AppContentDetail } from "./app/AppContentDetail";
import { AppContentEditor } from "./app/AppContentEditor";
import { SpiritualDashboard } from "./app/SpiritualDashboard";
import { ChangeMakerDashboard } from "./app/ChangeMakerDashboard";
import { FounderDashboard } from "./app/FounderDashboard";
import { useAuth } from "../auth/AuthProvider";
import { AppTools } from "./app/AppTools";
import { AppPersonalityComingSoon } from "./app/AppPersonalityComingSoon";
import { AppPersonalAIComingSoon } from "./app/AppPersonalAIComingSoon";
import { AppScriptsApproval } from "./app/AppScriptsApproval";
import { CategoryManagement } from "./app/CategoryManagement";
import { AppAiAgent } from "./app/AppAiAgent";
import { AppDailyPlanner } from "./app/AppDailyPlanner";
import { AppDailyPlannerAnalysis } from "./app/AppDailyPlannerAnalysis";

// ── Nav configs ────────────────────────────────────────────────────────────────

const FC_NAV = [
  { to: "/app",               label: "Overview",     headerTitle: "Overview",             end: true, icon: "overview" },
  { to: "/app/personality",   label: "Personality",  headerTitle: "Personality Profile",   icon: "candidates" },
  { to: "/app/personal-ai",   label: "Personal AI",  headerTitle: "Personal AI Copilot",   icon: "aiGenerator" },
  { to: "/app/daily-planner", label: "Daily Planner", headerTitle: "Daily Planner",         icon: "calendar" },
  { to: "/app/ai-agent",      label: "AI Agent",     headerTitle: "AI Agent Management",   icon: "bot" },
  { to: "/app/popularity",    label: "Popularity",   headerTitle: "CEO Popularity Index", icon: "popularity" },
  { to: "/app/tools",         label: "Tools",        headerTitle: "Tools Hub",            icon: "matrix" },
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
  { to: "/app/ugc-prompter", label: "UGC Prompter", headerTitle: "UGC Prompter",           icon: "ads" },
  { to: "/app/tools",         label: "Tools",        headerTitle: "Tools Hub",            icon: "matrix" },
];

// ── Dashboard selector ─────────────────────────────────────────────────────────

export function AppDashboard() {
  const { user } = useAuth();

  const dashboardType = user?.dashboardType || "default";
  const isManager = user?.showCandidates === true;
  const location = useLocation();

  const basePath = location.pathname.startsWith("/ceo") ? "/ceo" : "/app";
  const isDetailPage = new RegExp("^" + basePath + "/contents/[^/]+$").test(location.pathname);
  const isEditorPage = new RegExp("^" + basePath + "/contents/[^/]+/edit$").test(location.pathname);
  const isFullPageContent = isDetailPage || isEditorPage;

  const loginPath = basePath === "/ceo" ? "/ceo/login" : "/app/login";

  // Map nav paths dynamically to basePath
  const fcNav = FC_NAV.map(item => ({ ...item, to: item.to.replace("/app", basePath) }));
  const managerNav = MANAGER_NAV.map(item => ({ ...item, to: item.to.replace("/app", basePath) }));
  const spiritualNav = SPIRITUAL_NAV.map(item => ({ ...item, to: item.to.replace("/app", basePath) }));
  const changemakerNav = CHANGEMAKER_NAV.map(item => ({ ...item, to: item.to.replace("/app", basePath) }));
  const founderNav = FOUNDER_NAV.map(item => ({ ...item, to: item.to.replace("/app", basePath) }));

  // Founder dashboard
  if (dashboardType === "founder") {
    return (
      <DashboardShell loginPath={loginPath} portalLabel="FOUNDER OS" navItems={founderNav}>
        <Routes>
          <Route index    element={<AppOverview />} />
          <Route path="ceos"     element={<FounderDashboard />} />
          <Route path="ugc-prompter" element={<AppScriptsApproval />} />
          <Route path="tools" element={<AppTools />} />
          <Route path="category-management" element={<CategoryManagement />} />
          <Route path="settings" element={<AppSettings />} />
          <Route path="help"     element={<HelpPage />} />
          <Route path="*"        element={<Navigate to={basePath} replace />} />
        </Routes>
      </DashboardShell>
    );
  }

  // Change Maker dashboard
  if (dashboardType === "changemaker") {
    return (
      <DashboardShell loginPath={loginPath} portalLabel="CHANGE MAKER OS" navItems={changemakerNav}>
        <Routes>
          <Route index element={<ChangeMakerDashboard />} />
          <Route path="social"   element={<AppSocialMedia />} />
          <Route path="news"     element={<AppNews />} />
          <Route path="settings" element={<AppSettings />} />
          <Route path="help"     element={<HelpPage />} />
          <Route path="*"        element={<Navigate to={basePath} replace />} />
        </Routes>
      </DashboardShell>
    );
  }

  // Spiritual Guru dashboard
  if (dashboardType === "spiritual") {
    return (
      <DashboardShell loginPath={loginPath} portalLabel="SPIRITUAL GURU OS" navItems={spiritualNav}>
        <Routes>
          <Route index element={<SpiritualDashboard />} />
          <Route path="social"   element={<AppSocialMedia />} />
          <Route path="news"     element={<AppNews />} />
          <Route path="settings" element={<AppSettings />} />
          <Route path="help"     element={<HelpPage />} />
          <Route path="*"        element={<Navigate to={basePath} replace />} />
        </Routes>
      </DashboardShell>
    );
  }

  // Candidate manager dashboard
  if (isManager) {
    return (
      <DashboardShell loginPath={loginPath} portalLabel="APP PORTAL" navItems={managerNav}>
        <Routes>
          <Route index element={<AppOverview />} />
          <Route path="candidates" element={<AppCandidates />} />
          <Route path="settings"   element={<SettingsPage />} />
          <Route path="help"       element={<HelpPage />} />
          <Route path="*"          element={<Navigate to={basePath} replace />} />
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
          <Route path="*" element={<Navigate to={basePath} replace />} />
        </Routes>
      </GenerationProvider>
    );
  }

  return (
    <GenerationProvider>
    <DashboardShell loginPath={loginPath} portalLabel="CEO CONTENT OS" navItems={fcNav} flatContent={isFullPageContent}>
      <Routes>
        <Route index element={<AppOverview />} />
        <Route path="profile"          element={<AppProfile />} />
        <Route path="ai-assistant"     element={<AppAIAssistant />} />
        <Route path="campaign"         element={<AppCampaign />} />
        <Route path="content-tools"    element={<AppContentTools />} />
        <Route path="distribution"     element={<AppDistributionQueue />} />
        <Route path="calendar"         element={<AppCalendar />} />
        <Route path="popularity"       element={<AppPopularityIndex />} />
        <Route path="people"           element={<AppPeople />} />
        <Route path="social"           element={<AppSocialMedia />} />
        <Route path="news"             element={<AppNews />} />
        <Route path="digital-mentions" element={<AppDigitalMentions />} />
        <Route path="contents"          element={<AppContents />} />
        <Route path="contents/create"    element={<AppCreateContent />} />
        <Route path="contents/:id/edit"  element={<AppContentEditor />} />
        <Route path="contents/:id"       element={<AppContentDetail />} />
        <Route path="settings"         element={<AppSettings />} />
        <Route path="tools"            element={<AppTools />} />
        <Route path="ugc-prompter"     element={<AppScriptsApproval />} />
        <Route path="personality"      element={<AppPersonalityComingSoon />} />
        <Route path="personal-ai"      element={<AppAiAgent mode="personal" />} />
        <Route path="daily-planner"    element={<AppDailyPlanner />} />
        <Route path="daily-planner/analysis" element={<AppDailyPlannerAnalysis />} />
        <Route path="ai-agent"         element={<AppAiAgent mode="business" />} />
        <Route path="help"             element={<HelpPage />} />
        <Route path="*"                element={<Navigate to={basePath} replace />} />
      </Routes>
    </DashboardShell>
    </GenerationProvider>
  );
}
