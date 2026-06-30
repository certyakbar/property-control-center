import { useState } from "react";
import { Link } from "react-router-dom";
import { expenses, gbp, type Expense } from "@/data/demo";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import { cn } from "@/lib/utils";

const filters = ["All", "Needs review", "Missing receipt", "Approved"] as const;

export default function ExpensesPage() {
  const [filter, setFilter] = useState<typeof filters[number]>("All");
  const rows = expenses.filter(e => {
    if (filter === "All") return true;
    if (filter === "Needs review") return e.review === "Needs review";
    if (filter === "Missing receipt") return e.receipt === "Missing receipt";
    if (filter === "Approved") return e.review === "Approved";
    return true;
  });

  const total = expenses.reduce((a, e) => a + e.amount, 0);
  const missing = expenses.filter(e => e.receipt === "Missing receipt").length;
  const review = expenses.filter(e => e.review === "Needs review").length;

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="grid sm:grid-cols-3 gap-3">
        <Stat label="Total this period" value={gbp(total)} />
        <Stat label="Missing receipts" value={`${missing}`} tone="missing" />
        <Stat label="Needs review" value={`${review}`} tone="review" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {filters.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn(
                "h-8 px-3 rounded-full text-xs font-medium border transition-colors",
                filter === f ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:bg-secondary",
              )}>
              {f}
            </button>
          ))}
        </div>
        <button className="h-9 px-3.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium">Add expense</button>
      </div>

      <div className="card-surface overflow-hidden">
        <ExpensesTable rows={rows} />
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "missing" | "review" }) {
  return (
    <div className="card-surface p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn(
        "font-display text-2xl font-semibold mt-1 num",
        tone === "missing" && "text-status-missing",
        tone === "review" && "text-status-review",
      )}>{value}</div>
    </div>
  );
}

export function ExpensesTable({ rows, hideProperty = false }: { rows: Expense[]; hideProperty?: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground bg-secondary/50">
            <th className="px-4 py-3 font-medium">Date</th>
            {!hideProperty && <th className="px-4 py-3 font-medium">Property</th>}
            <th className="px-4 py-3 font-medium">Merchant</th>
            <th className="px-4 py-3 font-medium text-right">Amount</th>
            <th className="px-4 py-3 font-medium">Category</th>
            <th className="px-4 py-3 font-medium">Receipt</th>
            <th className="px-4 py-3 font-medium">Review</th>
            <th className="px-4 py-3 font-medium text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map(e => (
            <tr key={e.id} className="hover:bg-secondary/30">
              <td className="px-4 py-3 num text-muted-foreground">{e.date}</td>
              {!hideProperty && (
                <td className="px-4 py-3">
                  {e.propertyId ? (
                    <Link to={`/properties/${e.propertyId}`} className="font-medium hover:underline">{e.propertyName}</Link>
                  ) : (
                    <span className="text-status-missing font-medium">{e.propertyName}</span>
                  )}
                </td>
              )}
              <td className="px-4 py-3">{e.merchant}</td>
              <td className="px-4 py-3 num text-right">{gbp(e.amount)}</td>
              <td className="px-4 py-3 text-muted-foreground">{e.category}</td>
              <td className="px-4 py-3"><StatusBadge tone={e.receipt === "Receipt attached" ? "done" : "missing"}>{e.receipt}</StatusBadge></td>
              <td className="px-4 py-3"><StatusBadge tone={statusTone(e.review)}>{e.review}</StatusBadge></td>
              <td className="px-4 py-3 text-right">
                <button className="h-8 px-3 rounded-md border border-border text-xs font-medium hover:bg-secondary">
                  {e.receipt === "Missing receipt" ? "Add receipt" : e.review === "Needs review" ? "Review" : "View"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
