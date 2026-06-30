import { useState } from "react";
import { Link } from "react-router-dom";
import { reviewItems, type ReviewPriority, type ReviewType } from "@/data/demo";
import { StatusBadge, priorityTone } from "@/components/StatusBadge";
import { cn } from "@/lib/utils";

const priorities: (ReviewPriority | "All")[] = ["All", "Urgent", "High", "Medium", "Low"];
const types: (ReviewType | "All")[] = ["All", "Rent", "Expenses", "Documents", "Compliance", "Quarterly Pack"];

export default function ReviewPage() {
  const [priority, setPriority] = useState<typeof priorities[number]>("All");
  const [type, setType] = useState<typeof types[number]>("All");

  const items = reviewItems.filter(r =>
    (priority === "All" || r.priority === priority) &&
    (type === "All" || r.type === type),
  );

  const urgentCount = reviewItems.filter(r => r.priority === "Urgent").length;
  const highCount   = reviewItems.filter(r => r.priority === "High").length;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="card-surface p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Review queue</div>
          <div className="font-display text-2xl font-semibold mt-1">
            {reviewItems.length} items to clear
            <span className="text-sm text-muted-foreground font-sans font-normal ml-2">
              · {urgentCount} urgent · {highCount} high
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Clear items so every property is rent, evidence and document ready.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <FilterRow label="Priority" options={priorities} value={priority} onChange={setPriority} />
        <FilterRow label="Type"     options={types}      value={type}     onChange={setType} />
      </div>

      <div className="space-y-3">
        {items.length === 0 && (
          <div className="card-surface p-8 text-center text-sm text-muted-foreground">
            No items match these filters. Try clearing them.
          </div>
        )}

        {items.map(item => (
          <article key={item.id} className="card-surface p-5">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone={priorityTone(item.priority)}>{item.priority}</StatusBadge>
              <StatusBadge tone="neutral" dot={false}>{item.type}</StatusBadge>
              <span className="text-xs text-muted-foreground">·</span>
              {item.propertyId ? (
                <Link to={`/properties/${item.propertyId}`} className="text-xs font-medium hover:underline">
                  {item.propertyName}
                </Link>
              ) : (
                <span className="text-xs font-medium text-muted-foreground">{item.propertyName}</span>
              )}
            </div>
            <h3 className="mt-2 font-display text-lg font-semibold leading-snug">{item.title}</h3>
            <p className="text-sm text-muted-foreground mt-1.5">
              <span className="font-medium text-foreground/70">Why it matters: </span>{item.why}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
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
  );
}

function FilterRow<T extends string>({
  label, options, value, onChange,
}: { label: string; options: readonly T[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs uppercase tracking-wider text-muted-foreground w-16">{label}</span>
      {options.map(o => (
        <button key={o} onClick={() => onChange(o)}
          className={cn(
            "h-8 px-3 rounded-full text-xs font-medium border transition-colors",
            value === o ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:bg-secondary",
          )}>
          {o}
        </button>
      ))}
    </div>
  );
}
