import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./auth/AuthProvider";
import { LoginPage } from "./pages/LoginPage";
import { AppLoginPage } from "./pages/AppLoginPage";
import { CandidateLoginPage } from "./pages/CandidateLoginPage";
import { SuperAdminDashboard } from "./pages/SuperAdminDashboard";
import { AdminDashboard } from "./pages/AdminDashboard";
import { AppDashboard } from "./pages/AppDashboard";
import { CandidateDashboard } from "./pages/CandidateDashboard";
import { NotFoundPage } from "./pages/NotFoundPage";
import { getToken } from "./lib/tokenStorage";

function RoleRoute({ allow, loginPath, children }) {
  const { status, user } = useAuth();
  if (status === "loading") return <div className="p-6">Loading…</div>;
  if (status === "guest") return <Navigate to={loginPath} replace />;
  if (!user || !allow.includes(user.role)) return <Navigate to={loginPath} replace />;
  return children;
}

function GuestLoginRoute({ loginPath, allowedRoles, children }) {
  const { status, user } = useAuth();
  if (status === "loading") return <div className="p-6">Loading…</div>;
  if (status === "authed" && user) {
    if (allowedRoles.includes(user.role)) {
      if (user.role === "SUPERADMIN") return <Navigate to="/superadmin" replace />;
      if (user.role === "CANDIDATE") return <Navigate to="/candidate" replace />;
      if (user.role === "APP") return <Navigate to="/app" replace />;
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to={loginPath} replace />;
  }
  return children;
}

function HomeRedirect() {
  const { status, user } = useAuth();
  if (status === "loading") return <div className="p-6">Loading…</div>;
  if (status === "authed" && user) {
    if (user.role === "SUPERADMIN") return <Navigate to="/superadmin" replace />;
    if (user.role === "CANDIDATE") return <Navigate to="/candidate" replace />;
    if (user.role === "APP") return <Navigate to="/app" replace />;
    return <Navigate to="/admin" replace />;
  }
  if (getToken("SUPERADMIN")) return <Navigate to="/superadmin" replace />;
  if (getToken("ADMIN")) return <Navigate to="/admin" replace />;
  if (getToken("APP")) return <Navigate to="/app" replace />;
  if (getToken("CANDIDATE")) return <Navigate to="/candidate" replace />;
  return <Navigate to="/superadmin/login" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route
        path="/superadmin/login"
        element={
          <GuestLoginRoute loginPath="/superadmin/login" allowedRoles={["SUPERADMIN"]}>
            <LoginPage
              title="Super Admin Login"
              emailPlaceholder="Enter super admin email"
              afterLoginPath="/superadmin"
              expectedRole="SUPERADMIN"
            />
          </GuestLoginRoute>
        }
      />
      <Route
        path="/admin/login"
        element={
          <GuestLoginRoute loginPath="/admin/login" allowedRoles={["ADMIN"]}>
            <LoginPage
              title="Admin Login"
              emailPlaceholder="Enter admin email"
              afterLoginPath="/admin"
              expectedRole="ADMIN"
            />
          </GuestLoginRoute>
        }
      />
      <Route
        path="/app/login"
        element={
          <GuestLoginRoute loginPath="/app/login" allowedRoles={["APP"]}>
            <AppLoginPage />
          </GuestLoginRoute>
        }
      />
      <Route
        path="/candidate/login"
        element={
          <GuestLoginRoute loginPath="/candidate/login" allowedRoles={["CANDIDATE"]}>
            <CandidateLoginPage />
          </GuestLoginRoute>
        }
      />
      <Route path="/login" element={<Navigate to="/superadmin/login" replace />} />
      <Route
        path="/superadmin/*"
        element={
          <RoleRoute allow={["SUPERADMIN"]} loginPath="/superadmin/login">
            <SuperAdminDashboard />
          </RoleRoute>
        }
      />
      <Route
        path="/admin/*"
        element={
          <RoleRoute allow={["ADMIN"]} loginPath="/admin/login">
            <AdminDashboard />
          </RoleRoute>
        }
      />
      <Route
        path="/app/*"
        element={
          <RoleRoute allow={["APP"]} loginPath="/app/login">
            <AppDashboard />
          </RoleRoute>
        }
      />
      <Route
        path="/candidate/*"
        element={
          <RoleRoute allow={["CANDIDATE"]} loginPath="/candidate/login">
            <CandidateDashboard />
          </RoleRoute>
        }
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: "#fff",
              color: "#0f172a",
              border: "1px solid #e2e8f0",
              borderRadius: "0.75rem",
              fontSize: "0.875rem",
              boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
            },
            success: { iconTheme: { primary: "#10b981", secondary: "#fff" } },
            error: { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
