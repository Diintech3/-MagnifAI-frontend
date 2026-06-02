function wrapNetworkError(err) {
  const msg = String(err?.message || "");
  if (err?.name === "TypeError" || msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
    const e = new Error("Cannot reach API server. Start backend: cd backend && node index.js (port 4000)");
    e.code = "BACKEND_UNREACHABLE";
    e.cause = err;
    return e;
  }
  return err;
}

export async function api(path, { method = "GET", body, token } = {}) {
  let res;
  try {
    res = await fetch(path, {
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
    res = await fetch(path, {
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

