import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { getNavIcon, IconNavChevron, IconNested } from "./icons";

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

function NavItemLink({ item, sidebarExpanded }) {
  const Icon = getNavIcon(item.icon);
  const nested = Boolean(item.nested);

  return (
    <NavLink
      to={item.to}
      end={item.end}
      title={!sidebarExpanded ? item.label : undefined}
      className={({ isActive }) =>
        cn(
          "flex items-center rounded-lg border-l-4 font-medium transition",
          sidebarExpanded
            ? cn("gap-2.5 py-1.5 text-[13px]", nested ? "ml-3 pl-2" : "px-2.5")
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
        <IconNested className="h-4 w-4 shrink-0 text-slate-500" />
      ) : (
        <Icon className="h-5 w-5 shrink-0" />
      )}
      {sidebarExpanded ? <span className="truncate">{item.label}</span> : null}
    </NavLink>
  );
}

function NavGroup({ group, sidebarExpanded }) {
  const location = useLocation();
  const groupId = group.id || group.label;
  const basePath = group.to;

  const isGroupActive =
    location.pathname === basePath ||
    location.pathname.startsWith(`${basePath}/`) ||
    group.children?.some((c) =>
      c.end ? location.pathname === c.to : location.pathname.startsWith(c.to),
    );

  const [open, setOpen] = useState(isGroupActive);

  useEffect(() => {
    if (isGroupActive) setOpen(true);
  }, [isGroupActive]);

  const Icon = getNavIcon(group.icon);

  if (!sidebarExpanded) {
    return (
      <NavLink
        to={group.children?.[0]?.to || basePath}
        title={group.label}
        className={({ isActive }) =>
          cn(
            "flex justify-center rounded-lg py-2.5 transition",
            isActive || isGroupActive ? "bg-indigo-600/30 text-white" : "text-slate-400 hover:bg-slate-800/80 hover:text-white",
          )
        }
      >
        <Icon className="h-5 w-5" />
      </NavLink>
    );
  }

  return (
    <div className="space-y-0.5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-lg border-l-4 px-2.5 py-1.5 text-left text-[13px] font-medium transition",
          isGroupActive
            ? "border-indigo-400 bg-indigo-600/25 text-white"
            : "border-transparent text-slate-400 hover:bg-slate-800/80 hover:text-white",
        )}
      >
        <Icon className="h-5 w-5 shrink-0" />
        <span className="min-w-0 flex-1 truncate">{group.label}</span>
        <IconNavChevron className={cn("h-4 w-4 shrink-0 text-slate-500 transition", open && "rotate-180")} />
      </button>
      {open ? (
        <div className="space-y-0.5 pb-1">
          {group.children?.map((child) => (
            <NavItemLink key={child.to} item={{ ...child, nested: true }} sidebarExpanded={sidebarExpanded} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function SidebarNav({ navItems, sidebarExpanded }) {
  return (
    <>
      {navItems.map((item) =>
        item.children?.length ? (
          <NavGroup key={item.id || item.label} group={item} sidebarExpanded={sidebarExpanded} />
        ) : (
          <NavItemLink key={item.to} item={item} sidebarExpanded={sidebarExpanded} />
        ),
      )}
    </>
  );
}
