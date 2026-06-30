import { Link } from "react-router-dom";
import {
  Building2, AlertOctagon, ReceiptText, FileWarning, CheckSquare, FolderArchive,
  ArrowRight, Sparkles, ChevronRight,
} from "lucide-react";
import { gbp } from "@/data/demo";
import { useLedgerData } from "@/hooks/useLedgerData";
import { StatusBadge, priorityTone } from "@/components/StatusBadge";
import { cn } from "@/lib/utils";

function buildTiles(stats: ReturnType<typeof useLedgerData>["stats"]) {
  return [
    { label: "Properties",            value: stats.totalProperties,         icon: Building2,    to: "/properties",   tone: "neutral" as const },
    { label: "Overdue rent",          value: stats.overdueRent,             icon: AlertOctagon, to: "/rent",         tone: "overdue" as const },
    { label: "Missing receipts",      value: stats.missingReceipts,         icon: ReceiptText,  to: "/expenses",     tone: "missing" as const },
    { label: "Documents expiring",    value: stats.documentsExpiringSoon,   icon: FileWarning,  to: "/documents",    tone: "soon" as const },
    { label: "Review items",          value: stats.reviewItems,             icon: CheckSquare,  to: "/review",       tone: "review" as const },
    { label: "Quarterly pack",        value: `${stats.quarterlyReadiness}%`,icon: FolderArchive,to: "/quarterly-pack", tone: "info" as const },
  ];
}

const toneRing: Record<string, string> = {
  neutral: "bg-status-neutral-bg text-status-neutral",
  overdue: "bg-status-overdue-bg text-status-overdue",
  missing: "bg-status-missing-bg text-status-missing",
  soon:    "bg-status-soon-bg text-status-soon",
  review:  "bg-status-review-bg text-status-review",
  info:    "bg-status-info-bg text-status-info",
};

export default function Dashboard() {
  const { stats, todaysActions, recentActivity, properties } = useLedgerData();
  const tiles = buildTiles(stats);
  return (
    <div className="space-y-8 max-w-7xl">
      {/* Hero / readiness banner */}
      <section className="card-surface p-6 md:p-7 flex flex-col md:flex-row md:items-center gap-5 md:gap-8">
        <div className="flex-1">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <Sparkles className="size-3.5" /> Review-first overview
          </div>
          <h2 className="font-display text-2xl md:text-[28px] font-semibold mt-2">
            Good morning, Sam. You have <span className="text-accent">{stats.reviewItems} items</span> to review.
          </h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
            Your quarterly pack is {stats.quarterlyReadiness}% ready. Clear a few items today and every property stays accountant-ready.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/review"
              className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
              Open review queue <ArrowRight className="size-4" />
            </Link>
            <Link to="/quarterly-pack"
              className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-border text-sm font-medium hover:bg-secondary">
              View quarterly pack
            </Link>
          </div>
        </div>

        <div className="md:w-64 shrink-0">
          <div className="rounded-xl border border-border p-4 bg-secondary/40">
            <div className="text-xs text-muted-foreground">Quarterly pack readiness</div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="font-display text-4xl font-semibold num">{stats.quarterlyReadiness}%</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-border overflow-hidden">
              <div className="h-full bg-accent" style={{ width: `${stats.quarterlyReadiness}%` }} />
            </div>
            <div className="mt-2 text-xs text-muted-foreground">6 items to clear before export.</div>
          </div>
        </div>
      </section>

      {/* Stat tiles */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {tiles.map(t => (
          <Link key={t.label} to={t.to}
            className="card-surface p-4 hover:shadow-elevated transition-shadow group">
            <div className={cn("size-9 rounded-lg grid place-items-center", toneRing[t.tone])}>
              <t.icon className="size-4" />
            </div>
            <div className="mt-3 font-display text-2xl font-semibold num">{t.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5 flex items-center justify-between">
              <span>{t.label}</span>
              <ChevronRight className="size-3 opacity-0 group-hover:opacity-100 transition" />
            </div>
          </Link>
        ))}
      </section>

      {/* Today's actions + properties readiness */}
      <section className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-baseline justify-between">
            <h3 className="font-display text-lg font-semibold">Today's actions</h3>
            <Link to="/review" className="text-xs text-muted-foreground hover:text-foreground">See all {stats.reviewItems} →</Link>
          </div>

          <div className="space-y-3">
            {todaysActions.map(item => (
              <article key={item.id} className="card-surface p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge tone={priorityTone(item.priority)}>{item.priority}</StatusBadge>
                    <span className="text-xs text-muted-foreground">·</span>
                    <Link to={item.propertyId ? `/properties/${item.propertyId}` : "/properties"}
                      className="text-xs font-medium hover:underline">
                      {item.propertyName}
                    </Link>
                  </div>
                  <h4 className="mt-1.5 font-medium leading-snug">{item.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{item.why}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button className="h-9 px-3.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
                    {item.primaryAction}
                  </button>
                  <button className="h-9 px-3.5 rounded-lg border border-border text-sm font-medium hover:bg-secondary">
                    {item.secondaryAction}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h3 className="font-display text-lg font-semibold">Property readiness</h3>
            <Link to="/properties" className="text-xs text-muted-foreground hover:text-foreground">View all →</Link>
          </div>
          <div className="card-surface divide-y divide-border">
            {properties.map(p => (
              <Link key={p.id} to={`/properties/${p.id}`} className="block p-4 hover:bg-secondary/40">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{p.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{p.type} · {gbp(p.expectedMonthlyRent)}/mo</div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-lg font-semibold num">{p.readiness}%</div>
                    <div className="text-[11px] text-muted-foreground">{p.openReviewItems} to review</div>
                  </div>
                </div>
                <div className="mt-2.5 h-1.5 rounded-full bg-border overflow-hidden">
                  <div className="h-full bg-status-done" style={{ width: `${p.readiness}%` }} />
                </div>
              </Link>
            ))}
          </div>

          <div className="card-surface p-5">
            <h4 className="font-medium text-sm">Recent activity</h4>
            <ul className="mt-3 space-y-3">
              {recentActivity.map(a => (
                <li key={a.id} className="flex gap-3 text-sm">
                  <span className="size-1.5 rounded-full bg-status-done mt-2 shrink-0" />
                  <div>
                    <div>{a.text}</div>
                    <div className="text-xs text-muted-foreground">{a.when}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
