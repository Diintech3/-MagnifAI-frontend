import { useState } from "react";
import { useAuth } from "../../auth/AuthProvider";
import {
  LuUser, LuLock, LuBell, LuShield, LuMonitor, LuCircleCheck,
} from "react-icons/lu";

function Section({ title, children }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-slate-100 px-5 py-3.5">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      </div>
      <div className="divide-y divide-slate-100">{children}</div>
    </div>
  );
}

function Row({ label, sub, children }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <div>
        <div className="text-sm font-medium text-slate-800">{label}</div>
        {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ value, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${value ? "bg-indigo-600" : "bg-slate-200"}`}
    >
      <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${value ? "translate-x-4" : "translate-x-1"}`} />
    </button>
  );
}

export function SettingsPage({ basePath = "" }) {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);

  const [notifs, setNotifs] = useState({
    emailAlerts: true,
    weeklyReport: true,
    loginAlerts: true,
    productUpdates: false,
  });

  const [display, setDisplay] = useState({
    compactMode: false,
    darkSidebar: true,
    showBadges: true,
  });

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-2xl">

      {/* Account */}
      <Section title="Account">
        <Row label="Name" sub="Your display name">
          <span className="text-sm text-slate-600">{user?.fullName || user?.businessName || user?.name || "—"}</span>
        </Row>
        <Row label="Email" sub="Registered email address">
          <span className="text-sm text-slate-600">{user?.email || "—"}</span>
        </Row>
        <Row label="Role" sub="Portal access level">
          <span className="rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
            {user?.role || "—"}
          </span>
        </Row>
      </Section>

      {/* Security */}
      <Section title="Security">
        <Row label="Password" sub="Last changed: never">
          <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition">
            Change Password
          </button>
        </Row>
        <Row label="Two-Factor Auth" sub="Extra layer of security on login">
          <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-semibold text-amber-700">Not Enabled</span>
        </Row>
        <Row label="Active Sessions" sub="Devices currently logged in">
          <span className="text-sm font-semibold text-slate-700">1 device</span>
        </Row>
      </Section>

      {/* Notifications */}
      <Section title="Notifications">
        <Row label="Email Alerts" sub="Critical system notifications">
          <Toggle value={notifs.emailAlerts} onChange={(v) => setNotifs((p) => ({ ...p, emailAlerts: v }))} />
        </Row>
        <Row label="Weekly Report" sub="Summary every Monday morning">
          <Toggle value={notifs.weeklyReport} onChange={(v) => setNotifs((p) => ({ ...p, weeklyReport: v }))} />
        </Row>
        <Row label="Login Alerts" sub="Notify on new device login">
          <Toggle value={notifs.loginAlerts} onChange={(v) => setNotifs((p) => ({ ...p, loginAlerts: v }))} />
        </Row>
        <Row label="Product Updates" sub="New features and announcements">
          <Toggle value={notifs.productUpdates} onChange={(v) => setNotifs((p) => ({ ...p, productUpdates: v }))} />
        </Row>
      </Section>

      {/* Display */}
      <Section title="Display">
        <Row label="Compact Mode" sub="Reduce spacing in lists and tables">
          <Toggle value={display.compactMode} onChange={(v) => setDisplay((p) => ({ ...p, compactMode: v }))} />
        </Row>
        <Row label="Dark Sidebar" sub="Keep sidebar dark theme">
          <Toggle value={display.darkSidebar} onChange={(v) => setDisplay((p) => ({ ...p, darkSidebar: v }))} />
        </Row>
        <Row label="Show Badges" sub="Status badges on nav items">
          <Toggle value={display.showBadges} onChange={(v) => setDisplay((p) => ({ ...p, showBadges: v }))} />
        </Row>
      </Section>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition"
        >
          Save Settings
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
            <LuCircleCheck className="h-4 w-4" /> Saved
          </span>
        )}
      </div>

      {/* Danger */}
      <Section title="Danger Zone">
        <Row label="Clear Cache" sub="Reset local app data">
          <button
            onClick={() => { localStorage.clear(); window.location.reload(); }}
            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition"
          >
            Clear Cache
          </button>
        </Row>
      </Section>
    </div>
  );
}
