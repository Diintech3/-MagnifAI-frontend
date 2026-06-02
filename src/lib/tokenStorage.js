export const TOKEN_KEYS = {
  SUPERADMIN: "magnifai_superadmin_token",
  ADMIN: "magnifai_admin_token",
  APP: "magnifai_app_token",
  CANDIDATE: "magnifai_candidate_token",
};

export function getRoleFromPath(pathname) {
  if (pathname.startsWith("/candidate")) return "CANDIDATE";
  if (pathname.startsWith("/app")) return "APP";
  if (pathname.startsWith("/superadmin")) return "SUPERADMIN";
  if (pathname.startsWith("/admin")) return "ADMIN";
  return null;
}

export function getTokenKeyForRole(role) {
  if (role === "SUPERADMIN") return TOKEN_KEYS.SUPERADMIN;
  if (role === "ADMIN") return TOKEN_KEYS.ADMIN;
  if (role === "APP") return TOKEN_KEYS.APP;
  if (role === "CANDIDATE") return TOKEN_KEYS.CANDIDATE;
  return null;
}

export function saveToken(role, token) {
  const key = getTokenKeyForRole(role);
  if (key && token) localStorage.setItem(key, token);
}

export function getToken(role) {
  const key = getTokenKeyForRole(role);
  return key ? localStorage.getItem(key) : null;
}

export function clearToken(role) {
  const key = getTokenKeyForRole(role);
  if (key) localStorage.removeItem(key);
}

export function clearAllTokens() {
  Object.values(TOKEN_KEYS).forEach((k) => localStorage.removeItem(k));
}
