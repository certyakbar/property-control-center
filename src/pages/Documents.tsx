import { useState } from "react";
import { Link } from "react-router-dom";
import { documents, type PropertyDoc } from "@/data/demo";
import { StatusBadge, statusTone } from "@/components/StatusBadge";
import { cn } from "@/lib/utils";

const filters = ["All", "Expiring soon", "Expired", "Missing information", "Active"] as const;

export default function DocumentsPage() {
  const [filter, setFilter] = useState<typeof filters[number]>("All");
  const rows = filter === "All" ? documents : documents.filter(d => d.status === filter);

  return (
    <div className="space-y-6 max-w-7xl">
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
        <button className="h-9 px-3.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium">Upload document</button>
      </div>

      <div className="card-surface overflow-hidden">
        <DocumentsTable rows={rows} />
      </div>

      <p className="text-xs text-muted-foreground">
        Document types include HMO Licence, Gas Safety Certificate, EICR, EPC, Insurance, Tenancy Agreement, Fire Risk Assessment and Repair Invoice.
      </p>
    </div>
  );
}

export function DocumentsTable({ rows, hideProperty = false }: { rows: PropertyDoc[]; hideProperty?: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground bg-secondary/50">
            <th className="px-4 py-3 font-medium">Document</th>
            {!hideProperty && <th className="px-4 py-3 font-medium">Property</th>}
            <th className="px-4 py-3 font-medium">Type</th>
            <th className="px-4 py-3 font-medium">Issued</th>
            <th className="px-4 py-3 font-medium">Expires</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map(d => (
            <tr key={d.id} className="hover:bg-secondary/30">
              <td className="px-4 py-3 font-medium">{d.name}</td>
              {!hideProperty && (
                <td className="px-4 py-3">
                  <Link to={`/properties/${d.propertyId}`} className="hover:underline">{d.propertyName}</Link>
                </td>
              )}
              <td className="px-4 py-3 text-muted-foreground">{d.type}</td>
              <td className="px-4 py-3 num text-muted-foreground">{d.issueDate}</td>
              <td className="px-4 py-3 num text-muted-foreground">{d.expiryDate}</td>
              <td className="px-4 py-3"><StatusBadge tone={statusTone(d.status)}>{d.status}</StatusBadge></td>
              <td className="px-4 py-3 text-right">
                <button className="h-8 px-3 rounded-md border border-border text-xs font-medium hover:bg-secondary">
                  {d.status === "Missing information" ? "Add details" :
                   d.status === "Expired" || d.status === "Expiring soon" ? "Upload new" : "View"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
