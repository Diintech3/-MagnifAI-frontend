import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { toastError, toastSuccess } from "../lib/toast";

export function AppLoginPage() {
  const { login, logout, status } = useAuth();
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const disabled = useMemo(() => submitting || status === "loading", [submitting, status]);

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const user = await login(email.trim(), password, "APP");
      if (user.role !== "APP") {
        logout("APP");
        toastError("This account cannot sign in here.");
        return;
      }
      toastSuccess("Signed in successfully");
      nav("/app", { replace: true });
    } catch (err) {
      toastError(
        err?.status === 500
          ? "Server error. Restart backend and try again."
          : err?.status === 400
            ? "Invalid email or password format."
            : err?.payload?.error === "INVALID_CREDENTIALS"
              ? "Invalid email or password"
              : err?.payload?.error || "Login failed",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#f0f4f8] px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-10 shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
        <h1 className="text-center text-2xl font-bold text-slate-900">App Login</h1>
        <p className="mt-2 text-center text-sm text-slate-500">Sign in with your app credentials</p>

        <form className="mt-8 space-y-5" onSubmit={onSubmit}>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              placeholder="Enter app email"
              autoComplete="username"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={disabled}
            className="w-full rounded-lg bg-[#2563eb] py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Signing in…" : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
