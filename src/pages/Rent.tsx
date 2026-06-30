import { useState } from "react";
import { Link } from "react-router-dom";
import { gbp, type RentRow } from "@/data/demo";
import { useLedgerData } from "@/hooks/useLedgerData";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import { cn } from "@/lib/utils";

const filters = ["All", "Overdue", "Partial", "Paid", "Due soon"] as const;

export default function RentPage() {
  const { rentRows } = useLedgerData();
  const [filter, setFilter] = useState<typeof filters[number]>("All");
  const rows = filter === "All" ? rentRows : rentRows.filter(r => r.status === filter || (filter === "Partial" && r.status === "Partial"));

  const totalDue = rentRows.reduce((a, r) => a + r.amountDue, 0);
  const totalPaid = rentRows.reduce((a, r) => a + r.amountPaid, 0);
  const outstanding = totalDue - totalPaid;

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="grid sm:grid-cols-3 gap-3">
        <Stat label="Expected this period" value={gbp(totalDue)} />
        <Stat label="Received" value={gbp(totalPaid)} tone="done" />
        <Stat label="Outstanding" value={gbp(outstanding)} tone={outstanding > 0 ? "overdue" : "done"} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn(
              "h-8 px-3 rounded-full text-xs font-medium border transition-colors",
              filter === f
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-foreground border-border hover:bg-secondary",
            )}>
            {f}
          </button>
        ))}
      </div>

      <div className="card-surface overflow-hidden">
        <RentTable rows={rows} />
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "done" | "overdue" }) {
  return (
    <div className="card-surface p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn(
        "font-display text-2xl font-semibold mt-1 num",
        tone === "done" && "text-status-done",
        tone === "overdue" && "text-status-overdue",
      )}>{value}</div>
    </div>
  );
}

export function RentTable({ rows, hideProperty = false }: { rows: RentRow[]; hideProperty?: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground bg-secondary/50">
            {!hideProperty && <th className="px-4 py-3 font-medium">Property</th>}
            <th className="px-4 py-3 font-medium">Unit / room</th>
            <th className="px-4 py-3 font-medium">Tenant</th>
            <th className="px-4 py-3 font-medium">Due</th>
            <th className="px-4 py-3 font-medium text-right">Expected</th>
            <th className="px-4 py-3 font-medium text-right">Paid</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map(r => {
            const short = r.amountDue - r.amountPaid;
            return (
              <tr key={r.id} className="hover:bg-secondary/30">
                {!hideProperty && (
                  <td className="px-4 py-3">
                    <Link to={`/properties/${r.propertyId}`} className="font-medium hover:underline">{r.propertyName}</Link>
                  </td>
                )}
                <td className="px-4 py-3">{r.unit}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.tenant}</td>
                <td className="px-4 py-3 num text-muted-foreground">{r.dueDate}</td>
                <td className="px-4 py-3 num text-right">{gbp(r.amountDue)}</td>
                <td className="px-4 py-3 num text-right">
                  {gbp(r.amountPaid)}
                  {short > 0 && r.amountPaid > 0 && (
                    <div className="text-[11px] text-status-overdue">{gbp(short)} short</div>
                  )}
                </td>
                <td className="px-4 py-3"><StatusBadge tone={statusTone(r.status)}>{r.status}</StatusBadge></td>
                <td className="px-4 py-3 text-right">
                  <button className="h-8 px-3 rounded-md border border-border text-xs font-medium hover:bg-secondary">
                    {r.status === "Paid" ? "View" : r.status === "Overdue" ? "Chase" : "Match payment"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
