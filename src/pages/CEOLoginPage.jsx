import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { toastError, toastSuccess } from "../lib/toast";
import { api } from "../lib/api";

export function CEOLoginPage() {
  const { login, logout, status, setSession } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const disabled = useMemo(() => submitting || status === "loading", [submitting, status]);

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const user = await login(email.trim(), password, "CEO");
      if (user.role !== "CEO") {
        logout("CEO");
        toastError("This account cannot sign in here.");
        return;
      }
      toastSuccess("Welcome back!");
      nav("/ceo", { replace: true });
    } catch (err) {
      toastError(
        err?.payload?.error === "INVALID_CREDENTIALS"
          ? "Invalid email or password"
          : err?.payload?.error || "Login failed",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const handleGoogleCredentialResponse = async (response) => {
    if (!response || !response.credential) {
      console.warn("[GSI] Empty credential callback:", response);
      return;
    }
    setSubmitting(true);
    try {
      const data = await api("/api/auth/google-login", {
        method: "POST",
        body: { idToken: response.credential }
      });

      if (data.success) {
        setSession("CEO", data.accessToken, data.user);
        toastSuccess("Successfully signed in via Google!");
        nav("/ceo", { replace: true });
      } else {
        if (data.status === "AwaitingApproval") {
          toastSuccess("Redirecting to your pending request status...");
          nav("/ceo/register", { state: { step: 5, email: data.email, organizationName: data.organizationName } });
        } else if (data.status === "Rejected") {
          toastError(data.message);
        } else if (data.status === "RegisterRequired") {
          toastSuccess("Google auth success! Please complete registration.");
          nav("/ceo/register", { state: { email: data.email, name: data.name, googleId: data.googleId } });
        }
      }
    } catch (err) {
      toastError(err?.payload?.error || "Google login failed.");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    let script = null;
    let isMounted = true;

    async function initGoogleSignIn() {
      try {
        const res = await api("/api/auth/google-client-id");
        const clientId = res.clientId;
        if (!clientId) return;

        script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onload = () => {
          if (window.google && isMounted) {
            window.google.accounts.id.initialize({
              client_id: clientId,
              callback: handleGoogleCredentialResponse
            });
            window.google.accounts.id.renderButton(
              document.getElementById("google-signin-button"),
              { theme: "outline", size: "large", width: 368 }
            );
          }
        };
        document.body.appendChild(script);
      } catch (err) {
        console.error("Google script load error", err.message);
      }
    }

    initGoogleSignIn();

    return () => {
      isMounted = false;
      if (script && document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#f0f4f8] px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-10 shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
        <h1 className="text-center text-2xl font-bold text-slate-900">CEO / Founder Login</h1>
        <p className="mt-2 text-center text-sm text-slate-500">Access your thought leadership dashboard</p>
        
        <form className="mt-8 space-y-5" onSubmit={onSubmit}>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              placeholder="Enter CEO email"
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <button
                type="button"
                onClick={() => nav("/ceo/forgot-password")}
                className="text-xs font-semibold text-[#2563eb] hover:text-[#1d4ed8] transition cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={disabled}
            className="w-full rounded-lg bg-[#2563eb] py-2.5 text-sm font-semibold text-white hover:bg-[#1d4ed8] disabled:opacity-60 cursor-pointer"
          >
            {submitting ? "Signing in…" : "Login"}
          </button>
        </form>

        <div className="relative flex py-4 items-center">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink mx-4 text-slate-400 text-xs font-bold uppercase tracking-wider">Or</span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        <div id="google-signin-button" className="w-full flex justify-center font-bold"></div>

        <div className="text-center pt-5 border-t border-slate-100 mt-5">
          <span className="text-xs text-slate-500">New Creator? </span>
          <button
            type="button"
            onClick={() => nav("/ceo/register")}
            className="text-xs font-bold text-[#2563eb] hover:text-[#1d4ed8] transition cursor-pointer"
          >
            Request Platform Access
          </button>
        </div>
      </div>
    </div>
  );
}
