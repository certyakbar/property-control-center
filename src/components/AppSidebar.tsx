import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Building2, Banknote, ReceiptText, FileText,
  CheckSquare, FolderArchive, Settings as SettingsIcon, ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { stats } from "@/data/demo";

const nav = [
  { to: "/", label: "Dashboard",      icon: LayoutDashboard,  end: true },
  { to: "/properties",     label: "Properties",   icon: Building2 },
  { to: "/rent",           label: "Rent",         icon: Banknote },
  { to: "/expenses",       label: "Expenses",     icon: ReceiptText },
  { to: "/documents",      label: "Documents",    icon: FileText },
  { to: "/review",         label: "Review",       icon: CheckSquare, badge: stats.reviewItems },
  { to: "/quarterly-pack", label: "Quarterly Pack", icon: FolderArchive },
  { to: "/settings",       label: "Settings",     icon: SettingsIcon },
];

export function AppSidebar() {
  return (
    <aside className="hidden md:flex md:w-64 lg:w-72 shrink-0 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border bg-gradient-room sticky top-0 h-screen">
      <div className="px-6 py-6 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground grid place-items-center">
            <ShieldCheck className="size-5" />
          </div>
          <div className="leading-tight">
            <div className="font-display font-semibold text-sidebar-accent-foreground text-base">Ledgerless HMO</div>
            <div className="text-[11px] uppercase tracking-wider text-sidebar-foreground/70">Operations control room</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <div className="px-3 pb-2 pt-1 text-[11px] uppercase tracking-wider text-sidebar-foreground/50">
          Workspace
        </div>
        {nav.map(({ to, label, icon: Icon, end, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )
            }
          >
            <Icon className="size-4 shrink-0" />
            <span className="flex-1">{label}</span>
            {badge ? (
              <span className="rounded-full bg-sidebar-primary text-sidebar-primary-foreground text-[11px] font-semibold px-2 py-0.5">
                {badge}
              </span>
            ) : null}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <div className="rounded-lg bg-sidebar-accent/60 p-3">
          <div className="text-xs font-medium text-sidebar-accent-foreground">Quarterly pack</div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-display font-semibold text-sidebar-accent-foreground">{stats.quarterlyReadiness}%</span>
            <span className="text-[11px] text-sidebar-foreground/70">ready</span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-sidebar-border overflow-hidden">
            <div className="h-full bg-sidebar-primary" style={{ width: `${stats.quarterlyReadiness}%` }} />
          </div>
        </div>
      </div>
    </aside>
  );
}
