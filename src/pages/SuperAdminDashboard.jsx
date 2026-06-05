import { Route, Routes } from "react-router-dom";
import { DashboardShell } from "../components/DashboardShell";
import { SuperAdminOverview } from "./superadmin/SuperAdminOverview";
import { SuperAdminAdmins } from "./superadmin/SuperAdminAdmins";
import { SettingsPage } from "./shared/SettingsPage";
import { HelpPage } from "./shared/HelpPage";

export function SuperAdminDashboard() {
  return (
    <DashboardShell
      loginPath="/superadmin/login"
      portalLabel="SUPER ADMIN PORTAL"
      navItems={[
        { to: "/superadmin", label: "Overview", headerTitle: "Super Admin Overview", end: true, icon: "overview" },
        { to: "/superadmin/admins", label: "Admins", headerTitle: "Admins", icon: "admins" },
        { to: "/superadmin/settings", label: "Settings", headerTitle: "Settings", icon: "appSettings" },
        { to: "/superadmin/help", label: "Help", headerTitle: "Help & Support", icon: "help" },
      ]}
    >
      <Routes>
        <Route index element={<SuperAdminOverview />} />
        <Route path="admins" element={<SuperAdminAdmins />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="help" element={<HelpPage />} />
      </Routes>
    </DashboardShell>
  );
}
