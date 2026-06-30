import { Outlet, useLocation, NavLink } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { Search, Bell, Menu, LogOut } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useLedgerData } from "@/hooks/useLedgerData";

const titles: Record<string, { title: string; sub: string }> = {
  "/":              { title: "Today",          sub: "Your property operations at a glance." },
  "/properties":    { title: "Properties",     sub: "Every property and its readiness." },
  "/rent":          { title: "Rent",           sub: "Expected charges and payment status." },
  "/expenses":      { title: "Expenses",       sub: "Costs and receipt evidence." },
  "/documents":     { title: "Documents",      sub: "Certificates, licences and tenancies." },
  "/review":        { title: "Review queue",   sub: "Clear items so each property is ready." },
  "/quarterly-pack":{ title: "Quarterly pack", sub: "Readiness for your accountant." },
  "/settings":      { title: "Settings",       sub: "Organisation, role and preferences." },
};

export default function Layout() {
  const { pathname } = useLocation();
  const key = Object.keys(titles).find(k => k !== "/" && pathname.startsWith(k)) ?? "/";
  const meta = titles[key] ?? { title: "Property", sub: "" };
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { source } = useLedgerData();
  const initials = (user?.email ?? "SH").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen w-full flex bg-background">
      <AppSidebar />

      {/* Mobile sidebar (simple overlay) */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-foreground/40" onClick={() => setMobileOpen(false)} />
          <div className="relative z-50 w-72 h-full"><AppSidebar /></div>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur border-b border-border">
          <div className="flex items-center gap-3 px-4 md:px-8 h-16">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="md:hidden inline-flex size-9 items-center justify-center rounded-lg border border-border"
              aria-label="Open navigation"
            >
              <Menu className="size-4" />
            </button>

            <div className="min-w-0">
              <h1 className="font-display text-xl md:text-2xl font-semibold leading-none">{meta.title}</h1>
              <p className="text-xs text-muted-foreground mt-1 hidden sm:block">{meta.sub}</p>
            </div>

            <div className="hidden lg:flex flex-1 max-w-md ml-6">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search properties, expenses, documents…"
                  className="w-full h-9 pl-9 pr-3 rounded-lg bg-secondary text-sm placeholder:text-muted-foreground ring-focus"
                />
              </div>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <NavLink
                to="/review"
                className="relative inline-flex size-9 items-center justify-center rounded-lg border border-border hover:bg-secondary"
                aria-label="Review queue"
              >
                <Bell className="size-4" />
                <span className="absolute -top-1 -right-1 size-4 grid place-items-center rounded-full bg-accent text-accent-foreground text-[10px] font-semibold">
                  9
                </span>
              </NavLink>
              {user ? (
                <>
                  <div className="h-9 px-3 rounded-lg border border-border flex items-center gap-2">
                    <div className="size-6 rounded-full bg-primary text-primary-foreground grid place-items-center text-[11px] font-semibold">{initials}</div>
                    <span className="text-sm hidden sm:inline max-w-[160px] truncate">{user.email}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => signOut()}
                    className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border text-sm hover:bg-secondary"
                    aria-label="Sign out"
                  >
                    <LogOut className="size-4" />
                    <span className="hidden sm:inline">Sign out</span>
                  </button>
                </>
              ) : (
                <NavLink to="/sign-in" className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium inline-flex items-center">
                  Sign in
                </NavLink>
              )}
            </div>
          </div>
        </header>

        <main className={cn("flex-1 px-4 md:px-8 py-6 md:py-8")}>
          <Outlet />
        </main>

        <footer className="px-4 md:px-8 py-6 text-xs text-muted-foreground border-t border-border flex flex-wrap items-center gap-2">
          <span>Ledgerless HMO · Phase 1 prototype · Not for tax filing</span>
          {source !== "supabase" && (
            <span className="ml-auto inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-border bg-secondary text-foreground">
              <span className="size-1.5 rounded-full bg-accent" />
              Demo data
            </span>
          )}
        </footer>
      </div>
    </div>
  );
}
