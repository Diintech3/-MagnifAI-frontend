import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { toastSuccess } from "../lib/toast";
import { LuUser } from "react-icons/lu";
import { IconChevronDown, IconHelp, IconMenu, IconSettings } from "./icons";
import { SidebarNav } from "./SidebarNav";

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

export function DashboardShell({ portalLabel, loginPath, navItems, children, flatContent = false, fullscreen = false }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const activeItem = (() => {
    for (const it of navItems) {
      if (it.children?.length) {
        const child = it.children.find((c) =>
          c.end ? location.pathname === c.to : location.pathname.startsWith(c.to),
        );
        if (child) return child;
        if (location.pathname.startsWith(it.to)) return it;
      } else if (it.end ? location.pathname === it.to : location.pathname.startsWith(it.to)) {
        return it;
      }
    }
    return null;
  })();
  const pageTitle = location.pathname.includes("/election/defeated")
    ? "Winners & Defeated (UP)"
    : activeItem?.headerTitle || activeItem?.label || "Dashboard";
  const portalShort = portalLabel.includes("SUPER")
    ? "SA"
    : portalLabel.includes("CANDIDATE")
      ? "CD"
      : portalLabel.includes("APP")
        ? "AP"
        : "AD";

  useEffect(() => {
    function onDocClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function handleLogout() {
    setMenuOpen(false);
    logout();
    toastSuccess("Logged out successfully");
    navigate(loginPath, { replace: true });
  }

  if (fullscreen) {
    return (
      <div className="min-h-dvh bg-slate-50">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-slate-100">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex h-dvh flex-col overflow-hidden bg-slate-950 text-slate-300 transition-all duration-200",
          sidebarExpanded ? "w-64" : "w-[4.5rem]",
        )}
      >
        <div
          className={cn(
            "shrink-0 border-b border-slate-800 py-3.5",
            sidebarExpanded ? "flex items-center gap-3 px-4" : "flex flex-col items-center gap-2 px-2",
          )}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full overflow-hidden border border-slate-700">
            <img src="/MagnifAI logo.jpeg" alt="MagnifAI" className="h-full w-full object-cover" />
          </div>
          {sidebarExpanded ? (
            <div className="min-w-0">
              <div className="truncate text-base font-semibold text-white">MagnifAI</div>
              <div className="text-[10px] font-medium tracking-wider text-slate-500">{portalLabel}</div>
            </div>
          ) : (
            <div className="text-[10px] font-bold tracking-wide text-slate-500">{portalShort}</div>
          )}
        </div>

        <nav
          className={cn(
            "scrollbar-none min-h-0 flex-1 space-y-0.5 overflow-y-auto overscroll-contain py-2",
            sidebarExpanded ? "px-2.5" : "px-2",
          )}
        >
          <SidebarNav navItems={navItems} sidebarExpanded={sidebarExpanded} />
        </nav>

        <div className={cn("shrink-0 space-y-0.5 border-t border-slate-800 py-2", sidebarExpanded ? "px-2.5" : "px-2")}>
          <NavLink
            to={`${loginPath.replace("/login", "/settings")}`}
            title={!sidebarExpanded ? "Settings" : undefined}
            className={({ isActive }) => cn(
              "flex w-full items-center rounded-lg text-sm transition hover:bg-slate-800/80 hover:text-white",
              sidebarExpanded ? "gap-2.5 px-2.5 py-1.5" : "justify-center py-2.5",
              isActive ? "bg-slate-800 text-white" : "text-slate-400",
            )}
          >
            <IconSettings className="h-5 w-5 shrink-0" />
            {sidebarExpanded ? <span>Settings</span> : null}
          </NavLink>
          <NavLink
            to={`${loginPath.replace("/login", "/profile")}`}
            title={!sidebarExpanded ? "Profile" : undefined}
            className={({ isActive }) => cn(
              "flex w-full items-center rounded-lg text-sm transition hover:bg-slate-800/80 hover:text-white",
              sidebarExpanded ? "gap-2.5 px-2.5 py-1.5" : "justify-center py-2.5",
              isActive ? "bg-slate-800 text-white" : "text-slate-400",
            )}
          >
            <LuUser className="h-5 w-5 shrink-0" strokeWidth={1.75} />
            {sidebarExpanded ? <span>Profile</span> : null}
          </NavLink>
        </div>
      </aside>

      <div
        className={cn(
          "flex min-h-dvh flex-col transition-[margin-left] duration-200",
          sidebarExpanded ? "ml-64" : "ml-[4.5rem]",
        )}
      >
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
          <div className="flex items-center gap-3 text-slate-900">
            <button
              type="button"
              aria-label={sidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
              aria-pressed={sidebarExpanded}
              onClick={() => setSidebarExpanded((v) => !v)}
              className="rounded-lg p-1.5 text-slate-600 transition hover:bg-slate-100"
            >
              <IconMenu className="h-5 w-5" />
            </button>
            <h1 className="text-base font-semibold">{pageTitle}</h1>
          </div>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-left transition hover:bg-slate-200 sm:px-4"
            >
              <div className="hidden text-right sm:block">
                <div className="max-w-[180px] truncate text-sm font-medium text-slate-900">
                  {user?.businessName || user?.name || user?.email}
                </div>
              </div>
              <div className="sm:hidden">
                <div className="text-sm font-medium text-slate-900">{user?.name || "Account"}</div>
              </div>
              <IconChevronDown
                className={cn("h-4 w-4 shrink-0 text-slate-500 transition", menuOpen && "rotate-180")}
              />
            </button>

            {menuOpen ? (
              <div className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                <div className="border-b border-slate-100 px-4 py-2">
                  <div className="truncate text-sm font-medium text-slate-900">{user?.email}</div>
                  <div className="text-xs text-slate-500">{user?.role}</div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full px-4 py-2.5 text-left text-sm text-red-600 transition hover:bg-red-50"
                >
                  Logout
                </button>
              </div>
            ) : null}
          </div>
        </header>

        <main className={cn("flex-1", flatContent ? "p-0" : "p-4 sm:p-6")}>
          {flatContent ? children : <div className="rounded-xl border border-slate-200 bg-white shadow-sm">{children}</div>}
        </main>
      </div>
    </div>
  );
}
