import { cn } from "@/lib/utils";

type Tone =
  | "done" | "review" | "overdue" | "missing" | "soon" | "info" | "neutral";

const toneMap: Record<Tone, string> = {
  done:    "bg-status-done-bg text-status-done",
  review:  "bg-status-review-bg text-status-review",
  overdue: "bg-status-overdue-bg text-status-overdue",
  missing: "bg-status-missing-bg text-status-missing",
  soon:    "bg-status-soon-bg text-status-soon",
  info:    "bg-status-info-bg text-status-info",
  neutral: "bg-status-neutral-bg text-status-neutral",
};

const dotMap: Record<Tone, string> = {
  done: "bg-status-done", review: "bg-status-review", overdue: "bg-status-overdue",
  missing: "bg-status-missing", soon: "bg-status-soon", info: "bg-status-info", neutral: "bg-status-neutral",
};

export function StatusBadge({
  tone = "neutral",
  children,
  dot = true,
  className,
}: { tone?: Tone; children: React.ReactNode; dot?: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        toneMap[tone],
        className,
      )}
    >
      {dot && <span className={cn("size-1.5 rounded-full", dotMap[tone])} />}
      {children}
    </span>
  );
}

// Convenience mappers used across pages
export function statusTone(label: string): Tone {
  const s = label.toLowerCase();
  if (["paid", "approved", "active", "done", "on track", "all evidenced", "up to date", "ready"].some(k => s.includes(k))) return "done";
  if (s.includes("overdue")) return "overdue";
  if (s.includes("expir") && s.includes("soon")) return "soon";
  if (s.includes("expired")) return "overdue";
  if (s.includes("missing")) return "missing";
  if (s.includes("partial") || s.includes("partially")) return "review";
  if (s.includes("needs review") || s.includes("action needed")) return "review";
  if (s.includes("due soon")) return "info";
  if (s.includes("not ready")) return "missing";
  return "neutral";
}

export function priorityTone(p: string): Tone {
  if (p === "Urgent") return "overdue";
  if (p === "High") return "missing";
  if (p === "Medium") return "review";
  return "info";
}
