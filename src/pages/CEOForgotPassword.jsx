import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { toastError, toastSuccess } from "../lib/toast";
import { LuMail, LuKey, LuArrowLeft, LuSparkles, LuEye, LuEyeOff } from "react-icons/lu";

export function CEOForgotPassword() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Send Password Reset OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const data = await api("/api/auth/forgot-password", {
        method: "POST",
        body: { email: email.trim() }
      });
      toastSuccess(data.message || "OTP code sent successfully!");
      setOtpSent(true);
    } catch (err) {
      toastError(err?.payload?.error || "Failed to send reset code");
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP & Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!otp || !newPassword) return;
    setLoading(true);
    try {
      const data = await api("/api/auth/reset-password", {
        method: "POST",
        body: {
          email: email.trim(),
          otp: otp.trim(),
          newPassword: newPassword.trim()
        }
      });
      toastSuccess(data.message || "Password updated successfully!");
      nav("/ceo/login");
    } catch (err) {
      toastError(err?.payload?.error || "Verification failed or code expired");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#f0f4f8] px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-10 shadow-[0_8px_30px_rgba(0,0,0,0.08)] space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <span className="inline-flex items-center gap-1 bg-blue-50 border border-blue-100 rounded-full px-3 py-1 text-[11px] font-bold text-blue-700 uppercase tracking-wider">
            <LuSparkles className="h-3 w-3" /> Account Recovery
          </span>
          <h1 className="text-2xl font-bold text-slate-900">Forgot Password</h1>
          <p className="text-sm text-slate-500">
            {!otpSent ? "Enter your email to receive a password reset OTP." : "Enter OTP and your new password to reset."}
          </p>
        </div>

        {!otpSent ? (
          /* Step 1 Form */
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Registered Email Address</label>
              <div className="relative">
                <LuMail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. name@domain.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || !email}
              className="w-full rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white py-2.5 text-xs font-bold transition shadow cursor-pointer disabled:opacity-50"
            >
              {loading ? "Sending OTP Code…" : "Send Reset Code"}
            </button>
          </form>
        ) : (
          /* Step 2 Form */
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Enter 6-Digit OTP Code</label>
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="OTP Code"
                className="w-full text-center py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-base font-extrabold"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">New Password</label>
              <div className="relative">
                <LuKey className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  {showPassword ? <LuEyeOff className="h-4 w-4" /> : <LuEye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length < 6 || !newPassword}
              className="w-full rounded-xl bg-green-650 hover:bg-green-755 text-white py-2.5 text-xs font-bold transition shadow cursor-pointer disabled:opacity-50"
            >
              {loading ? "Updating Password…" : "Reset & Update Password"}
            </button>
          </form>
        )}

        {/* Back Link */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              if (otpSent) setOtpSent(false);
              else nav("/ceo/login");
            }}
            className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-755 transition cursor-pointer"
          >
            <LuArrowLeft className="h-3.5 w-3.5" /> Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
