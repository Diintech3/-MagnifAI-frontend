const API_BASE_URL = String(import.meta.env.VITE_API_BASE_URL || "").trim().replace(/\/$/, "");

function withBase(path) {
  if (!path) return API_BASE_URL || "";
  if (/^https?:\/\//i.test(path)) return path;
  if (!API_BASE_URL) return path;
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

function wrapNetworkError(err) {
  const msg = String(err?.message || "");
  if (err?.name === "TypeError" || msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
    const target = API_BASE_URL || "Vite proxy (/api -> localhost:4000)";
    const e = new Error(`Cannot reach API server (${target}).`);
    e.code = "BACKEND_UNREACHABLE";
    e.cause = err;
    return e;
  }
  return err;
}

export async function api(path, { method = "GET", body, token } = {}) {
  let res;
  try {
    res = await fetch(withBase(path), {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw wrapNetworkError(err);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.error || "REQUEST_FAILED");
    err.status = res.status;
    err.payload = data;
    throw err;
  }
  return data;
}

export async function apiForm(path, { method = "POST", token, formData } = {}) {
  let res;
  try {
    res = await fetch(withBase(path), {
      method,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
  } catch (err) {
    throw wrapNetworkError(err);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.error || "REQUEST_FAILED");
    err.status = res.status;
    err.payload = data;
    throw err;
  }
  return data;
}

