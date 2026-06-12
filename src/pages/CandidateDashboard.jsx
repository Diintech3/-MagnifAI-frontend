import { Route, Routes } from "react-router-dom";
import { DashboardShell } from "../components/DashboardShell";
import { CandidateOverview } from "./candidate/CandidateOverview";
import { CandidateProfile } from "./candidate/CandidateProfile";
import { CandidateSectionPage } from "../components/candidate/CandidateSectionPage";
import { CandidateDemographyElection } from "./candidate/CandidateDemographyElection";
import { CandidateConstituencyOverview } from "./candidate/CandidateConstituencyOverview";
import { SettingsPage } from "./shared/SettingsPage";
import { HelpPage } from "./shared/HelpPage";

const MAIN_NAV = [
  { to: "/candidate", label: "Overview", headerTitle: "Overview", end: true, icon: "overview" },
  { to: "/candidate/profile", label: "Profile", headerTitle: "Profile", icon: "profile" },
  { to: "/candidate/analysis", label: "Analytics", headerTitle: "Analytics", icon: "analysis" },
  { to: "/candidate/technology", label: "Technology", headerTitle: "Technology", icon: "technology" },
  { to: "/candidate/content", label: "Content", headerTitle: "Content", icon: "content" },
  { to: "/candidate/distribution", label: "Distribution", headerTitle: "Distribution", icon: "distribution" },
  { to: "/candidate/ads", label: "Ads", headerTitle: "Ads", icon: "ads" },
  { to: "/candidate/operation", label: "Operation", headerTitle: "Operation", icon: "operation" },
  { to: "/candidate/news-plan", label: "News", headerTitle: "News", icon: "news" },
  { to: "/candidate/digital-mention", label: "Digital Mention", headerTitle: "Digital Mention", icon: "analysis" },
  { to: "/candidate/social-media", label: "Social Media", headerTitle: "Social Media", icon: "distribution" },
  {
    id: "constituency",
    label: "Constituency",
    icon: "demography",
    to: "/candidate/constituency",
    headerTitle: "Constituency",
    children: [
      { to: "/candidate/constituency", label: "Overview", headerTitle: "Constituency · Overview", end: true, icon: "overview" },
      { to: "/candidate/demography", label: "Demography", headerTitle: "Demography", icon: "demography" },
      { to: "/candidate/demography/election", label: "Election", headerTitle: "Constituency · Election", icon: "election" },
      { to: "/candidate/demography/news", label: "Local News", headerTitle: "Constituency · Local News", icon: "news" },
      { to: "/candidate/demography/news-analysis", label: "News Analysis", headerTitle: "Constituency · News Analysis", icon: "newsAnalysis" },
    ],
  },
];

export function CandidateDashboard() {
  return (
    <DashboardShell loginPath="/candidate/login" portalLabel="CANDIDATE PORTAL" navItems={MAIN_NAV}>
      <Routes>
        <Route index element={<CandidateOverview />} />
        <Route path="profile" element={<CandidateProfile />} />
        <Route path="analysis" element={<CandidateSectionPage section="analysis" title="Analytics" subtitle="Constituency performance metrics and insights" />} />
        <Route path="technology" element={<CandidateSectionPage section="technology" title="Technology" subtitle="Campaign tech stack" />} />
        <Route path="content" element={<CandidateSectionPage section="content" title="Content" subtitle="Creative and messaging pipeline" />} />
        <Route path="distribution" element={<CandidateSectionPage section="distribution" title="Distribution" subtitle="Ground distribution channels" />} />
        <Route path="ads" element={<CandidateSectionPage section="ads" title="Ads" subtitle="Paid media performance" />} />
        <Route path="operation" element={<CandidateSectionPage section="operation" title="Operation" subtitle="Field operations tracker" />} />
        <Route path="news-plan" element={<CandidateSectionPage section="news-plan" />} />
        <Route path="digital-mention" element={<CandidateSectionPage section="digital-mention" />} />
        <Route path="social-media" element={<CandidateSectionPage section="social-media" />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="help" element={<HelpPage />} />
        <Route path="demography" element={<CandidateSectionPage section="demography" title="Demography" subtitle="Voter demographic profiles and segment data" />} />
        <Route path="constituency" element={<CandidateConstituencyOverview />} />
        <Route path="demography/election" element={<CandidateDemographyElection />} />
        <Route path="demography/news" element={<CandidateSectionPage section="demography-news" title="News" subtitle="Regional election news feed" />} />
        <Route path="demography/news-analysis" element={<CandidateSectionPage section="demography-news-analysis" title="News Analysis" subtitle="Narrative tracking and impact" />} />
      </Routes>
    </DashboardShell>
  );
}
