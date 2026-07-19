import {
  HiOutlineBars3,
  HiOutlineChevronDown,
  HiOutlineSquares2X2,
  HiOutlineXMark,
} from "react-icons/hi2";
import {
  LuArmchair,
  LuChartBar,
  LuCircleHelp,
  LuCornerDownRight,
  LuCpu,
  LuFileText,
  LuLandmark,
  LuLayoutDashboard,
  LuChartLine,
  LuChevronDown,
  LuList,
  LuMap,
  LuMegaphone,
  LuNewspaper,
  LuPercent,
  LuSettings,
  LuShare2,
  LuShieldCheck,
  LuUser,
  LuUserRound,
  LuUsers,
  LuVote,
  LuZap,
  LuRadio,
  LuAtSign,
  LuSparkles,
  LuGrid3X3,
  LuBookOpen,
  LuCalendar,
  LuTrendingUp,
  LuSend,
  LuGlobe,
  LuImage,
  LuCode,
  LuCreditCard,
  LuBuilding2,
  LuTarget,
  LuBot,
} from "react-icons/lu";
import { RiAdminLine } from "react-icons/ri";

const DEFAULT_CLASS = "h-5 w-5";

function wrap(Icon) {
  return function WrappedIcon({ className = DEFAULT_CLASS }) {
    return <Icon className={className} strokeWidth={1.75} aria-hidden />;
  };
}

/** Sidebar & nav — keyed by nav `icon` string */
export const NAV_ICONS = {
  overview: wrap(LuLayoutDashboard),
  profile: wrap(LuUser),
  analysis: wrap(LuChartBar),
  technology: wrap(LuCpu),
  content: wrap(LuFileText),
  distribution: wrap(LuShare2),
  ads: wrap(LuMegaphone),
  operation: wrap(LuSettings),
  consistency: wrap(LuShieldCheck),
  demography: wrap(LuUsers),
  election: wrap(LuVote),
  news: wrap(LuNewspaper),
  newsAnalysis: wrap(LuChartLine),
  social: wrap(LuShare2),
  digitalMentions: wrap(LuRadio),
  appSettings: wrap(LuSettings),
  apps: wrap(LuList),
  candidates: wrap(LuUserRound),
  admins: wrap(RiAdminLine),
  users: wrap(LuUsers),
  // CEO Content OS icons
  aiGenerator: wrap(LuSparkles),
  matrix: wrap(LuGrid3X3),
  promptLibrary: wrap(LuBookOpen),
  calendar: wrap(LuCalendar),
  popularity: wrap(LuTrendingUp),
  queue: wrap(LuSend),
  workspace: wrap(LuUser),
  mediaLibrary: wrap(LuImage),
  apiCenter: wrap(LuCode),
  billing: wrap(LuCreditCard),
  companies: wrap(LuBuilding2),
  campaign: wrap(LuTarget),
  globe: wrap(LuGlobe),
  bot: wrap(LuBot),
};

export function getNavIcon(key) {
  return NAV_ICONS[key] || NAV_ICONS.overview;
}

export const IconNested = wrap(LuCornerDownRight);
export const IconNavChevron = wrap(LuChevronDown);

export const IconOverview = NAV_ICONS.overview;
export const IconGrid = NAV_ICONS.overview;
export const IconApps = NAV_ICONS.apps;
export const IconCandidates = NAV_ICONS.candidates;
export const IconAnalytics = NAV_ICONS.analysis;
export const IconUsers = NAV_ICONS.users;
export const IconMenu = wrap(HiOutlineBars3);
export const IconSettings = NAV_ICONS.operation;
export const IconHelp = wrap(LuCircleHelp);
export const IconCog = NAV_ICONS.operation;
export const IconGear = NAV_ICONS.operation;
export const IconX = wrap(HiOutlineXMark);
export const IconChevronDown = wrap(HiOutlineChevronDown);
export const IconElection = NAV_ICONS.election;
export const IconProfile = NAV_ICONS.profile;
export const IconAnalysis = NAV_ICONS.analysis;
export const IconTechnology = NAV_ICONS.technology;
export const IconContent = NAV_ICONS.content;
export const IconDistribution = NAV_ICONS.distribution;
export const IconAds = NAV_ICONS.ads;
export const IconOperation = NAV_ICONS.operation;
export const IconConsistency = NAV_ICONS.consistency;
export const IconDemography = NAV_ICONS.demography;
export const IconNews = NAV_ICONS.news;
export const IconNewsAnalysis = NAV_ICONS.newsAnalysis;

/** Election dashboard KPIs */
export const IconKpiStates = wrap(LuMap);
export const IconKpiSeats = wrap(LuArmchair);
export const IconKpiTurnout = wrap(LuPercent);
export const IconKpiCompetitive = wrap(LuZap);
export const IconKpiLandmark = wrap(LuLandmark);

/** @deprecated */
export const HiIconSquares = wrap(HiOutlineSquares2X2);
