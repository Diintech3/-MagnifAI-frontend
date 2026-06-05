import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { api } from "../lib/api";
import { clearToken, getRoleFromPath, getToken, saveToken } from "../lib/tokenStorage";

const AuthContext = createContext(null);

async function fetchMe(role, token) {
  if (role === "APP") return api("/api/auth/app/me", { token });
  if (role === "CANDIDATE") return api("/api/auth/candidate/me", { token });
  return api("/api/auth/me", { token });
}

function loginEndpoint(role) {
  if (role === "APP") return "/api/auth/app/login";
  if (role === "CANDIDATE") return "/api/auth/candidate/login";
  return "/api/auth/login";
}

export function AuthProvider({ children }) {
  const location = useLocation();
  const portalRole = getRoleFromPath(location.pathname);
  const [status, setStatus] = useState("loading");
  const [user, setUser] = useState(null);

  const token = useMemo(() => (portalRole ? getToken(portalRole) : null), [portalRole, status]);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      if (!portalRole) {
        setStatus("guest");
        setUser(null);
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const sessionToken = params.get("session");
      if (sessionToken) {
        saveToken(portalRole, sessionToken);
        setUser(null);
        setStatus("loading");
        params.delete("session");
        const clean = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
        window.history.replaceState({}, "", clean);
      }

      const t = getToken(portalRole);
      if (!t) {
        setStatus("guest");
        setUser(null);
        return;
      }

      try {
        const me = await fetchMe(portalRole, t);
        if (cancelled) return;
        setUser(me);
        setStatus("authed");
      } catch {
        if (cancelled) return;
        clearToken(portalRole);
        setUser(null);
        setStatus("guest");
      }
    }

    boot();
    return () => {
      cancelled = true;
    };
  }, [portalRole, location.search]);

  const value = useMemo(() => {
    return {
      status,
      user,
      portalRole,
      async login(email, password, role = portalRole) {
        const data = await api(loginEndpoint(role), { method: "POST", body: { email, password } });
        saveToken(role, data.accessToken);
        setUser(null);
        setStatus("loading");
        setUser(data.user);
        setStatus("authed");
        return data.user;
      },
      setSession(role, accessToken, sessionUser) {
        saveToken(role, accessToken);
        setUser(sessionUser);
        setStatus("authed");
      },
      logout(role = portalRole) {
        if (role) clearToken(role);
        setUser(null);
        setStatus("guest");
      },
      token: portalRole ? getToken(portalRole) : null,
    };
  }, [status, user, portalRole]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
