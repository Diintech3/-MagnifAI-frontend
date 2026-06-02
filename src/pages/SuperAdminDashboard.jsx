import { Route, Routes } from "react-router-dom";
import { DashboardShell } from "../components/DashboardShell";
import { SuperAdminOverview } from "./superadmin/SuperAdminOverview";
import { SuperAdminAdmins } from "./superadmin/SuperAdminAdmins";

export function SuperAdminDashboard() {
  return (
    <DashboardShell
      loginPath="/superadmin/login"
      portalLabel="SUPER ADMIN PORTAL"
      navItems={[
        {
          to: "/superadmin",
          label: "Overview",
          headerTitle: "Super Admin Overview",
          end: true,
          icon: "overview",
        },
        { to: "/superadmin/admins", label: "Admins", headerTitle: "Super Admin Admins", icon: "admins" },
      ]}
    >
      <Routes>
        <Route index element={<SuperAdminOverview />} />
        <Route path="admins" element={<SuperAdminAdmins />} />
      </Routes>
    </DashboardShell>
  );
}
