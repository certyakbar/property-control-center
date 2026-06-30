import { properties, expenses, rentRows, reviewItems, gbp } from "@/data/demo";
import { StatusBadge, priorityTone } from "@/components/StatusBadge";
import { Download, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

export default function QuarterlyPack() {
  const readiness = 82;
  const blocking = 6;

  const incomeByProperty = properties.map(p => ({
    name: p.name,
    id: p.id,
    income: rentRows.filter(r => r.propertyId === p.id).reduce((a, r) => a + r.amountPaid, 0),
  }));

  const expensesByProperty = properties.map(p => ({
    name: p.name,
    id: p.id,
    total: expenses.filter(e => e.propertyId === p.id).reduce((a, e) => a + e.amount, 0),
  }));

  const expensesByCategory = Object.entries(
    expenses.reduce<Record<string, number>>((acc, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + e.amount;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);

  const missingReceipts = expenses.filter(e => e.receipt === "Missing receipt");
  const uncategorised = expenses.filter(e => e.category === "Uncategorised" || e.category === "Likely repairs");
  const unresolved = reviewItems.filter(r => r.type !== "Quarterly Pack");

  const maxIncome = Math.max(...incomeByProperty.map(p => p.income), 1);
  const maxExpense = Math.max(...expensesByProperty.map(p => p.total), 1);
  const maxCat = Math.max(...expensesByCategory.map(([, v]) => v), 1);

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Readiness hero */}
      <section className="card-surface p-6 md:p-7">
        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
          <div className="flex-1">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Quarterly pack readiness</div>
            <div className="font-display text-3xl font-semibold mt-1">
              Your quarterly pack is <span className="text-accent">{readiness}% ready</span>.
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Clear {blocking} review items before export. This is a readiness view, not a tax submission — share with your accountant when ready.
            </p>
            <div className="mt-4 h-2 rounded-full bg-border overflow-hidden">
              <div className="h-full bg-accent" style={{ width: `${readiness}%` }} />
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button disabled
              className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium opacity-50 cursor-not-allowed inline-flex items-center gap-2">
              <Download className="size-4" /> Export summary
            </button>
            <Link to="/review" className="h-10 px-4 rounded-lg border border-border text-sm font-medium hover:bg-secondary inline-flex items-center">
              Clear review items
            </Link>
          </div>
        </div>
      </section>

      {/* Distributions */}
      <section className="grid lg:grid-cols-3 gap-4">
        <Distribution title="Income by property"
          rows={incomeByProperty.map(p => ({ label: p.name, value: p.income, max: maxIncome, link: `/properties/${p.id}` }))} />
        <Distribution title="Expenses by property"
          rows={expensesByProperty.map(p => ({ label: p.name, value: p.total, max: maxExpense, link: `/properties/${p.id}` }))} />
        <Distribution title="Expenses by category"
          rows={expensesByCategory.map(([k, v]) => ({ label: k, value: v, max: maxCat }))} />
      </section>

      {/* Blockers */}
      <section className="grid lg:grid-cols-3 gap-4">
        <Blocker title="Missing receipts"
          count={missingReceipts.length}
          desc="Each receipt protects an expense in your quarterly pack."
          link="/expenses" linkLabel="Add receipts"
        >
          <ul className="space-y-2 text-sm">
            {missingReceipts.map(e => (
              <li key={e.id} className="flex justify-between gap-2">
                <span className="truncate">{e.merchant} <span className="text-muted-foreground">· {e.propertyName}</span></span>
                <span className="num font-medium shrink-0">{gbp(e.amount)}</span>
              </li>
            ))}
            {missingReceipts.length === 0 && <li className="text-muted-foreground">All receipts in place.</li>}
          </ul>
        </Blocker>

        <Blocker title="Uncategorised expenses"
          count={uncategorised.length}
          desc="Confirm a category so each expense lands in the right place."
          link="/expenses" linkLabel="Review categories"
        >
          <ul className="space-y-2 text-sm">
            {uncategorised.map(e => (
              <li key={e.id} className="flex justify-between gap-2">
                <span className="truncate">{e.merchant} <span className="text-muted-foreground">· {e.category}</span></span>
                <span className="num font-medium shrink-0">{gbp(e.amount)}</span>
              </li>
            ))}
          </ul>
        </Blocker>

        <Blocker title="Unresolved review items"
          count={unresolved.length}
          desc="These need a decision before the pack is ready for your accountant."
          link="/review" linkLabel="Open review queue"
        >
          <ul className="space-y-2 text-sm">
            {unresolved.slice(0, 5).map(r => (
              <li key={r.id} className="flex items-center gap-2">
                <StatusBadge tone={priorityTone(r.priority)}>{r.priority}</StatusBadge>
                <span className="truncate">{r.title}</span>
              </li>
            ))}
          </ul>
        </Blocker>
      </section>

      <p className="text-xs text-muted-foreground">
        Ledgerless HMO does not submit to HMRC. We help you organise rent, expenses, receipts and documents so your accountant has everything needed.
      </p>
    </div>
  );
}

function Distribution({ title, rows }: { title: string; rows: { label: string; value: number; max: number; link?: string }[] }) {
  return (
    <div className="card-surface p-5">
      <h3 className="font-display text-base font-semibold">{title}</h3>
      <ul className="mt-4 space-y-3">
        {rows.map(r => (
          <li key={r.label}>
            <div className="flex items-center justify-between text-sm">
              {r.link ? (
                <Link to={r.link} className="hover:underline truncate">{r.label}</Link>
              ) : (
                <span className="truncate">{r.label}</span>
              )}
              <span className="num font-medium tabular">{gbp(r.value)}</span>
            </div>
            <div className="mt-1.5 h-1.5 rounded-full bg-border overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${(r.value / r.max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Blocker({
  title, count, desc, link, linkLabel, children,
}: { title: string; count: number; desc: string; link: string; linkLabel: string; children: React.ReactNode }) {
  const tone = count === 0 ? "done" : "review";
  const Icon = count === 0 ? CheckCircle2 : AlertTriangle;
  return (
    <div className="card-surface p-5 flex flex-col">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-display text-base font-semibold flex items-center gap-2">
            <Icon className={`size-4 ${tone === "done" ? "text-status-done" : "text-status-review"}`} />
            {title}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">{desc}</p>
        </div>
        <span className="font-display text-2xl font-semibold num">{count}</span>
      </div>
      <div className="mt-4 flex-1">{children}</div>
      <Link to={link} className="mt-4 inline-flex h-9 px-3.5 rounded-lg border border-border text-sm font-medium hover:bg-secondary items-center justify-center">
        {linkLabel}
      </Link>
    </div>
  );
}
