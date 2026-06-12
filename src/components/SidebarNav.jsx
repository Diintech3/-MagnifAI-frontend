import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { getNavIcon, IconNavChevron, IconNested } from "./icons";

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

function isChildActive(child, pathname) {
  return child.end ? pathname === child.to : pathname.startsWith(child.to);
}

function isGroupActive(group, pathname) {
  return group.children?.some(c => isChildActive(c, pathname));
}

function NavItemLink({ item, sidebarExpanded, nested = false }) {
  const Icon = getNavIcon(item.icon);
  return (
    <NavLink
      to={item.to}
      end={item.end}
      title={!sidebarExpanded ? item.label : undefined}
      className={({ isActive }) =>
        cn(
          "flex items-center rounded-lg border-l-4 font-medium transition",
          sidebarExpanded
            ? cn("gap-2.5 py-1.5 text-[13px]", nested ? "ml-3 pl-2 pr-2" : "px-2.5")
            : "justify-center border-l-0 px-0 py-2.5",
          isActive
            ? sidebarExpanded
              ? "border-indigo-400 bg-indigo-600/25 text-white"
              : "bg-indigo-600/30 text-white"
            : "border-transparent text-slate-400 hover:bg-slate-800/80 hover:text-white",
        )
      }
    >
      {nested && sidebarExpanded ? (
        <span className="h-4 w-4 shrink-0 flex items-center justify-center">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
        </span>
      ) : (
        <Icon className="h-5 w-5 shrink-0" />
      )}
      {sidebarExpanded ? <span className="truncate">{item.label}</span> : null}
    </NavLink>
  );
}

function NavGroup({ group, sidebarExpanded, isOpen, onToggle }) {
  const location = useLocation();
  const active = isGroupActive(group, location.pathname);
  const Icon = getNavIcon(group.icon);

  if (!sidebarExpanded) {
    return (
      <NavLink
        to={group.children?.[0]?.to || group.to}
        title={group.label}
        className={() =>
          cn(
            "flex justify-center rounded-lg py-2.5 transition",
            active ? "bg-indigo-600/30 text-white" : "text-slate-400 hover:bg-slate-800/80 hover:text-white",
          )
        }
      >
        <Icon className="h-5 w-5" />
      </NavLink>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-lg border-l-4 px-2.5 py-1.5 text-left text-[13px] font-medium transition",
          active
            ? "border-indigo-400 bg-indigo-600/25 text-white"
            : "border-transparent text-slate-400 hover:bg-slate-800/80 hover:text-white",
        )}
      >
        <Icon className="h-5 w-5 shrink-0" />
        <span className="min-w-0 flex-1 truncate">{group.label}</span>
        <IconNavChevron
          className={cn("h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200", isOpen && "rotate-180")}
        />
      </button>

      {isOpen && (
        <div className="mt-0.5 mb-1 space-y-0.5">
          {group.children?.map(child => (
            <NavItemLink key={child.to} item={child} sidebarExpanded={sidebarExpanded} nested />
          ))}
        </div>
      )}
    </div>
  );
}

export function SidebarNav({ navItems, sidebarExpanded }) {
  const location = useLocation();

  // Find which group should be open based on current route
  const activeGroupId = navItems.find(
    item => item.children?.length && isGroupActive(item, location.pathname)
  )?.id || null;

  const [openGroupId, setOpenGroupId] = useState(activeGroupId);

  // Update open group when route changes
  useEffect(() => {
    if (activeGroupId) setOpenGroupId(activeGroupId);
  }, [activeGroupId]);

  function handleToggle(id) {
    setOpenGroupId(prev => (prev === id ? null : id));
  }

  return (
    <div className="space-y-0.5">
      {navItems.map(item =>
        item.children?.length ? (
          <NavGroup
            key={item.id || item.label}
            group={item}
            sidebarExpanded={sidebarExpanded}
            isOpen={openGroupId === (item.id || item.label)}
            onToggle={() => handleToggle(item.id || item.label)}
          />
        ) : (
          <NavItemLink key={item.to} item={item} sidebarExpanded={sidebarExpanded} />
        )
      )}
    </div>
  );
}
