import { Link } from "react-router-dom";
import { gbp } from "@/data/demo";
import { useLedgerData } from "@/hooks/useLedgerData";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import { Building2, MapPin, BedDouble, ArrowRight } from "lucide-react";

export default function Properties() {
  const { properties } = useLedgerData();
  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Every property is a control room. Open one to see rent, expenses, documents and quarterly readiness.</p>
        </div>
        <button className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
          Add property
        </button>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {properties.map(p => (
          <Link key={p.id} to={`/properties/${p.id}`} className="card-surface p-5 hover:shadow-elevated transition-shadow block">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="size-9 rounded-lg bg-secondary grid place-items-center">
                    <Building2 className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-display text-lg font-semibold leading-tight truncate">{p.name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                      <MapPin className="size-3" /> {p.address}
                    </div>
                  </div>
                </div>
              </div>
              <StatusBadge tone={p.type === "HMO" ? "info" : "neutral"} dot={false}>
                {p.type}
              </StatusBadge>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Expected rent</div>
                <div className="font-display text-xl font-semibold num">{gbp(p.expectedMonthlyRent)}<span className="text-xs text-muted-foreground font-sans font-normal">/mo</span></div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1"><BedDouble className="size-3" /> {p.type === "HMO" ? "Rooms" : "Unit"}</div>
                <div className="font-display text-xl font-semibold num">{p.rooms}</div>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              <Row label="Rent"      tone={statusTone(p.rentStatus)}     value={p.rentStatus} />
              <Row label="Documents" tone={statusTone(p.documentStatus)} value={p.documentStatus} />
              <Row label="Expenses"  tone={statusTone(p.expenseStatus)}  value={p.expenseStatus} />
            </div>

            <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Readiness</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-display text-lg font-semibold num">{p.readiness}%</span>
                  <span className="text-xs text-muted-foreground">· {p.openReviewItems} to review</span>
                </div>
                <div className="mt-1.5 h-1.5 w-40 rounded-full bg-border overflow-hidden">
                  <div className="h-full bg-status-done" style={{ width: `${p.readiness}%` }} />
                </div>
              </div>
              <ArrowRight className="size-4 text-muted-foreground" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone: ReturnType<typeof statusTone> }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <StatusBadge tone={tone}>{value}</StatusBadge>
    </div>
  );
}
