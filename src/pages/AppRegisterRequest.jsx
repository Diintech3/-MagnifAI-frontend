import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { api, apiForm } from "../lib/api";
import { toastError, toastSuccess } from "../lib/toast";
import { LuMail, LuPhone, LuUser, LuBriefcase, LuMapPin, LuImage, LuArrowRight, LuCheck, LuSparkles, LuEye, LuEyeOff } from "react-icons/lu";

export function AppRegisterRequest() {
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form states
  const [email, setEmail] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

  const [mobile, setMobile] = useState("");
  const [mobileOtp, setMobileOtp] = useState("");
  const [mobileSent, setMobileSent] = useState(false);
  const [mobileVerified, setMobileVerified] = useState(false);

  const [name, setName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [designation, setDesignation] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [description, setDescription] = useState("");
  const [password, setPassword] = useState("");
  const [googleId, setGoogleId] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  // Helper: word count for description
  const getWordCount = (text) => {
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  const location = useLocation();

  useEffect(() => {
    if (location.state?.step) {
      setStep(location.state.step);
      if (location.state.email) setEmail(location.state.email);
      if (location.state.organizationName) setOrganizationName(location.state.organizationName);
    } else if (location.state?.email) {
      setEmail(location.state.email);
      setName(location.state.name || "");
      setGoogleId(location.state.googleId || "");
      setEmailVerified(true);
      setEmailSent(true);
      toastSuccess("Successfully connected with Google! Email pre-verified.");
      setStep(2);
    }
  }, [location.state]);

  const handleGoogleCredentialResponse = async (response) => {
    if (!response || !response.credential) {
      console.warn("[GSI] Empty credential callback:", response);
      return;
    }
    setLoading(true);
    try {
      const data = await api("/api/auth/google-login", {
        method: "POST",
        body: { idToken: response.credential }
      });

      if (data.success) {
        toastSuccess("Account already exists. Redirecting to login...");
        nav("/ceo/login");
      } else {
        if (data.status === "AwaitingApproval") {
          toastError("Your registration request is currently awaiting Admin approval.");
        } else if (data.status === "Rejected") {
          toastError(data.message);
        } else if (data.status === "RegisterRequired") {
          setEmail(data.email);
          setName(data.name || "");
          setGoogleId(data.googleId || "");
          setEmailVerified(true);
          setEmailSent(true);
          toastSuccess("Google account connected! Email pre-verified.");
          setStep(2);
        }
      }
    } catch (err) {
      toastError(err?.payload?.error || "Google login failed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (step !== 1 || emailVerified) return;
    
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
              document.getElementById("google-signup-button"),
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
  }, [step, emailVerified]);

  // Step 1: Send Email OTP
  const handleSendEmailOtp = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await api("/api/auth/register-step1-email", {
        method: "POST",
        body: { email: email.trim() }
      });
      toastSuccess("OTP sent to your email address!");
      setEmailSent(true);
    } catch (err) {
      toastError(err?.payload?.error || "Failed to send email OTP");
    } finally {
      setLoading(false);
    }
  };

  // Step 1 Verify: Email OTP Verification
  const handleVerifyEmailOtp = async (e) => {
    e.preventDefault();
    if (!emailOtp) return;
    setLoading(true);
    try {
      await api("/api/auth/verify-step1-email", {
        method: "POST",
        body: { email: email.trim(), otp: emailOtp.trim() }
      });
      toastSuccess("Email verified successfully!");
      setEmailVerified(true);
      setStep(2);
    } catch (err) {
      toastError(err?.payload?.error || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Send Mobile WhatsApp OTP
  const handleSendMobileOtp = async (e) => {
    e.preventDefault();
    if (!mobile) return;
    setLoading(true);
    try {
      await api("/api/auth/register-step2-mobile", {
        method: "POST",
        body: { email: email.trim(), mobile: mobile.trim() }
      });
      toastSuccess("OTP sent to your WhatsApp number!");
      setMobileSent(true);
    } catch (err) {
      toastError(err?.payload?.error || "Failed to send WhatsApp OTP");
    } finally {
      setLoading(false);
    }
  };

  // Step 2 Verify: Mobile OTP Verification
  const handleVerifyMobileOtp = async (e) => {
    e.preventDefault();
    if (!mobileOtp) return;
    setLoading(true);
    try {
      await api("/api/auth/verify-step2-mobile", {
        method: "POST",
        body: { email: email.trim(), otp: mobileOtp.trim() }
      });
      toastSuccess("Mobile number verified successfully!");
      setMobileVerified(true);
      setStep(3);
    } catch (err) {
      toastError(err?.payload?.error || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Save Profile Details
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (getWordCount(description) > 30) {
      toastError("Introduction must not exceed 30 words");
      return;
    }

    setLoading(true);
    try {
      await api("/api/auth/register-step3-profile", {
        method: "POST",
        body: {
          email: email.trim(),
          name: name.trim(),
          organizationName: organizationName.trim(),
          designation: designation.trim(),
          address: address.trim(),
          city: city.trim(),
          pincode: pincode.trim(),
          description: description.trim(),
          password,
          googleId
        }
      });
      toastSuccess("Profile details saved!");
      setStep(4);
    } catch (err) {
      toastError(err?.payload?.error || "Failed to save profile details");
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Upload Image & Final Submit
  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("email", email.trim());
      if (photoFile) {
        formData.append("photo", photoFile);
      }

      await apiForm("/api/auth/register-step4-photo", {
        method: "POST",
        formData
      });

      toastSuccess("Registration request submitted successfully!");
      setStep(5); // Show success view
    } catch (err) {
      toastError(err?.payload?.error || "Failed to complete photo upload");
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#f0f4f8] py-12 px-4">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-8 sm:p-10 shadow-[0_8px_30px_rgba(0,0,0,0.08)] space-y-6">
        
        {/* Top Header */}
        <div className="text-center space-y-2">
          <span className="inline-flex items-center gap-1 bg-orange-50 border border-orange-100 rounded-full px-3 py-1 text-[11px] font-bold text-orange-700 uppercase tracking-wider">
            <LuSparkles className="h-3 w-3" /> Creator Onboarding
          </span>
          <h1 className="text-2xl font-bold text-slate-900">Request Platform Access</h1>
          <p className="text-sm text-slate-500">Submit your registration details for admin verification and activation.</p>
        </div>

        {/* Progress Timeline (Not visible on step 5) */}
        {step < 5 && (
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 text-xs font-semibold">
            <div className="flex gap-2.5 mx-auto">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className="flex items-center gap-1.5">
                  <span className={`inline-flex items-center justify-center h-5 w-5 rounded-full text-[10px] font-extrabold transition-all border ${
                    step === s 
                      ? "bg-orange-500 border-orange-500 text-white shadow-xs scale-105" 
                      : step > s 
                        ? "bg-green-600 border-green-600 text-white" 
                        : "bg-slate-50 border-slate-200 text-slate-400"
                  }`}>
                    {step > s ? "✓" : s}
                  </span>
                  <span className={step === s ? "text-slate-950 font-bold" : "text-slate-455 font-normal"}>
                    {s === 1 ? "Email" : s === 2 ? "Mobile" : s === 3 ? "Profile" : "Photo"}
                  </span>
                  {s < 4 && <span className="text-slate-300">→</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 1: EMAIL & VERIFICATION */}
        {step === 1 && (
          <div className="space-y-6">
            {!emailSent ? (
              <form onSubmit={handleSendEmailOtp} className="space-y-4">
                 <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Gmail/Email Address</label>
                  <div className="relative">
                    <LuMail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. name@domain.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Create Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password (minimum 6 characters)"
                      className="w-full px-4 py-2.5 pr-10 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm"
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
                  disabled={loading || !email}
                  className="w-full rounded-xl bg-orange-600 hover:bg-orange-700 text-white py-2.5 text-xs font-bold transition shadow cursor-pointer disabled:opacity-50"
                >
                  {loading ? "Sending OTP Code…" : "Send Email OTP Code"}
                </button>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink mx-4 text-slate-400 text-xs font-bold uppercase tracking-wider">Or</span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                {/* Google Sign up Button */}
                <div id="google-signup-button" className="w-full flex justify-center font-bold"></div>
              </form>
            ) : (
              <form onSubmit={handleVerifyEmailOtp} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Enter Email OTP Verification Code</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className="w-full text-center tracking-[8px] py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-base font-extrabold"
                  />
                  <span className="block text-[10px] text-slate-500 text-center mt-1">We sent an email verification OTP code to <strong>{email}</strong></span>
                </div>
                <button
                  type="submit"
                  disabled={loading || emailOtp.length < 6}
                  className="w-full rounded-xl bg-orange-600 hover:bg-orange-700 text-white py-2.5 text-xs font-bold transition shadow cursor-pointer disabled:opacity-50"
                >
                  {loading ? "Verifying Email…" : "Verify Email & Continue"}
                </button>
                <button
                  type="button"
                  onClick={() => setEmailSent(false)}
                  className="w-full text-center text-xs text-slate-500 hover:text-slate-800 font-bold transition"
                >
                  ← Go back to Email Entry
                </button>
              </form>
            )}
          </div>
        )}

        {/* STEP 2: WHATSAPP MOBILE & OTP */}
        {step === 2 && (
          <div className="space-y-6">
            {!mobileSent ? (
              <form onSubmit={handleSendMobileOtp} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">WhatsApp Mobile Number</label>
                  <div className="relative">
                    <LuPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <input
                      type="tel"
                      required
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="e.g. +91 9999999999"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm"
                    />
                  </div>
                  <span className="block text-[10px] text-slate-500 mt-1">Verification code will be sent to your WhatsApp number.</span>
                </div>
                <button
                  type="submit"
                  disabled={loading || !mobile}
                  className="w-full rounded-xl bg-orange-600 hover:bg-orange-700 text-white py-2.5 text-xs font-bold transition shadow cursor-pointer disabled:opacity-50"
                >
                  {loading ? "Sending WhatsApp OTP…" : "Send WhatsApp OTP Code"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyMobileOtp} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Enter WhatsApp OTP Verification Code</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={mobileOtp}
                    onChange={(e) => setMobileOtp(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className="w-full text-center tracking-[8px] py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-base font-extrabold"
                  />
                  <span className="block text-[10px] text-slate-500 text-center mt-1">We sent a verification OTP message to WhatsApp number <strong>{mobile}</strong></span>
                </div>
                <button
                  type="submit"
                  disabled={loading || mobileOtp.length < 6}
                  className="w-full rounded-xl bg-orange-600 hover:bg-orange-700 text-white py-2.5 text-xs font-bold transition shadow cursor-pointer disabled:opacity-50"
                >
                  {loading ? "Verifying Mobile…" : "Verify WhatsApp & Continue"}
                </button>
                <button
                  type="button"
                  onClick={() => setMobileSent(false)}
                  className="w-full text-center text-xs text-slate-500 hover:text-slate-800 font-bold transition"
                >
                  ← Go back to WhatsApp number entry
                </button>
              </form>
            )}
          </div>
        )}

        {/* STEP 3: PROFILE DATA FORM */}
        {step === 3 && (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Adarsh Bharat"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">Organization Name (Company)</label>
                <input
                  type="text"
                  required
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder="e.g. IIP Academy"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">Designation</label>
                <input
                  type="text"
                  required
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="e.g. Managing Director"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">City</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. New Delhi"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700">Office / Business Address</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. A-1/2, Kirti Nagar"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">Pincode</label>
                <input
                  type="text"
                  required
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="e.g. 110015"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              
              {/* Short Bio (30 word max check) */}
              <div className="space-y-1 sm:col-span-2">
                <div className="flex justify-between items-center">
                  <label className="block text-[11px] font-bold text-slate-700">Short Description (About Yourself)</label>
                  <span className={`text-[10px] font-extrabold ${getWordCount(description) > 30 ? "text-red-500" : "text-slate-455"}`}>
                    {getWordCount(description)}/30 words
                  </span>
                </div>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Write a brief intro about yourself and your role (max 30 words)..."
                  rows={3}
                  className="w-full p-3 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading || getWordCount(description) > 30}
              className="w-full rounded-xl bg-orange-600 hover:bg-orange-700 text-white py-2.5 text-xs font-bold transition shadow cursor-pointer disabled:opacity-50"
            >
              {loading ? "Saving Details…" : "Save & Continue"}
            </button>
          </form>
        )}

        {/* STEP 4: PROFILE IMAGE UPLOAD */}
        {step === 4 && (
          <form onSubmit={handleFinalSubmit} className="space-y-6">
            <div className="space-y-2 text-center">
              <label className="block text-xs font-bold text-slate-700">Upload Profile Photo</label>
              
              <div className="flex flex-col items-center justify-center gap-4">
                {photoPreview ? (
                  <div className="h-32 w-32 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 shadow-inner">
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="h-32 w-32 rounded-2xl bg-slate-50 border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400">
                    <LuImage className="h-10 w-10 text-slate-300 mb-1" />
                    <span className="text-[10px] font-medium">Select photo</span>
                  </div>
                )}
                
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3.5 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 cursor-pointer"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-orange-600 hover:bg-orange-700 text-white py-2.5 text-xs font-bold transition shadow cursor-pointer disabled:opacity-50"
            >
              {loading ? "Submitting Request…" : "Submit Onboarding Request"}
            </button>
          </form>
        )}

        {/* STEP 5: SUCCESS SUBMISSION */}
        {step === 5 && (
          <div className="text-center py-6 space-y-5">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 animate-bounce">
              <LuCheck className="h-10 w-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-900">Request Submitted!</h2>
              <p className="text-sm text-slate-650 max-w-sm mx-auto leading-relaxed">
                Your profile request for <strong>{organizationName}</strong> has been successfully submitted to administrators.
              </p>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-xs text-amber-700 font-medium max-w-sm mx-auto mt-4 leading-relaxed">
                ⏳ We are verifying your details. You will receive an email update once your workspace account is activated.
              </div>
            </div>
            <button
              onClick={() => nav("/ceo/login")}
              className="rounded-xl border border-slate-200 hover:bg-slate-50 px-6 py-2.5 text-xs font-bold text-slate-700 transition shadow-xs cursor-pointer"
            >
              Back to Login Screen
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
