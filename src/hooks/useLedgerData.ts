import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  properties as demoProps,
  rentRows as demoRent,
  expenses as demoExpenses,
  documents as demoDocs,
  reviewItems as demoReview,
  recentActivity,
  type Property,
  type RentRow,
  type RentStatus,
  type Expense,
  type ExpenseReceipt,
  type ExpenseReview,
  type PropertyDoc,
  type DocStatus,
  type DocType,
  type ReviewItem,
  type ReviewPriority,
  type ReviewType,
} from "@/data/demo";

export type LedgerSource = "loading" | "demo" | "supabase";

export interface LedgerData {
  source: LedgerSource;
  reason?: string;
  properties: Property[];
  rentRows: RentRow[];
  expenses: Expense[];
  documents: PropertyDoc[];
  reviewItems: ReviewItem[];
  recentActivity: typeof recentActivity;
  stats: {
    totalProperties: number;
    overdueRent: number;
    missingReceipts: number;
    documentsExpiringSoon: number;
    reviewItems: number;
    quarterlyReadiness: number;
  };
  todaysActions: ReviewItem[];
}

// ---------- mappers ----------

const rentStatusMap: Record<string, RentStatus> = {
  paid: "Paid",
  partially_paid: "Partial",
  partial: "Partial",
  overdue: "Overdue",
  scheduled: "Due soon",
  pending: "Due soon",
  due: "Due soon",
};

const docStatusMap: Record<string, DocStatus> = {
  active: "Active",
  expiring_soon: "Expiring soon",
  expired: "Expired",
  missing_info: "Missing information",
};

const priorityMap: Record<string, ReviewPriority> = {
  urgent: "Urgent", high: "High", medium: "Medium", low: "Low",
};

const reviewTypeMap: Record<string, ReviewType> = {
  rent_issue: "Rent",
  missing_receipt: "Expenses",
  expense_review: "Expenses",
  uncategorised: "Expenses",
  document_missing: "Documents",
  document_expiring: "Compliance",
  compliance: "Compliance",
  quarterly_pack: "Quarterly Pack",
};

function reviewActions(t: ReviewType): { primaryAction: string; secondaryAction: string } {
  switch (t) {
    case "Rent": return { primaryAction: "Review payment", secondaryAction: "Mark resolved" };
    case "Expenses": return { primaryAction: "Review expense", secondaryAction: "Mark resolved" };
    case "Documents": return { primaryAction: "Add details", secondaryAction: "Dismiss" };
    case "Compliance": return { primaryAction: "Upload new", secondaryAction: "Remind later" };
    case "Quarterly Pack": return { primaryAction: "Open quarterly pack", secondaryAction: "Remind later" };
  }
}

function titleCase(s: string | null | undefined): string {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

async function fetchAll() {
  const [props, units, rent, tx, cats, docs, rv, packs] = await Promise.all([
    supabase.from("properties").select("*").order("name"),
    supabase.from("units").select("*"),
    supabase.from("rent_charges").select("*").order("due_date", { ascending: false }),
    supabase.from("transactions").select("*").order("date", { ascending: false }),
    supabase.from("categories").select("*"),
    supabase.from("documents").select("*").order("expiry_date"),
    supabase.from("review_items").select("*").eq("status", "open").order("created_at", { ascending: false }),
    supabase.from("quarterly_packs").select("*").order("period_end", { ascending: false }).limit(1),
  ]);

  const firstErr = [props, units, rent, tx, cats, docs, rv, packs].find(r => r.error);
  if (firstErr?.error) throw new Error(firstErr.error.message);

  return {
    props: props.data ?? [],
    units: units.data ?? [],
    rent: rent.data ?? [],
    tx: tx.data ?? [],
    cats: cats.data ?? [],
    docs: docs.data ?? [],
    rv: rv.data ?? [],
    packs: packs.data ?? [],
  };
}

function mapToPhase1(raw: Awaited<ReturnType<typeof fetchAll>>): Omit<LedgerData, "source" | "reason"> {
  const propIdToName = new Map<string, string>();
  const unitsByProp = new Map<string, typeof raw.units>();
  for (const u of raw.units) {
    const arr = unitsByProp.get(u.property_id) ?? [];
    arr.push(u);
    unitsByProp.set(u.property_id, arr);
  }
  const catById = new Map(raw.cats.map(c => [c.id, c]));
  const openReviewByProp = new Map<string, number>();
  for (const r of raw.rv) {
    if (r.property_id) openReviewByProp.set(r.property_id, (openReviewByProp.get(r.property_id) ?? 0) + 1);
  }

  const properties: Property[] = raw.props.map(p => {
    propIdToName.set(p.id, p.name);
    const units = unitsByProp.get(p.id) ?? [];
    const address = [p.address_line_1, p.city, p.postcode].filter(Boolean).join(", ");
    return {
      id: p.id,
      name: p.name,
      address,
      type: p.is_hmo ? "HMO" : "Standard Rental",
      rooms: units.length || 1,
      expectedMonthlyRent: Number(p.expected_monthly_rent ?? 0),
      readiness: Number(p.readiness_score ?? 0),
      openReviewItems: openReviewByProp.get(p.id) ?? 0,
      rentStatus: ((p.rent_status && p.rent_status !== "unknown") ? p.rent_status : "On track") as Property["rentStatus"],
      documentStatus: ((p.document_status && p.document_status !== "unknown") ? p.document_status : "Up to date") as Property["documentStatus"],
      expenseStatus: ((p.expense_status && p.expense_status !== "unknown") ? p.expense_status : "All evidenced") as Property["expenseStatus"],
    };
  });

  const unitById = new Map(raw.units.map(u => [u.id, u]));

  const rentRows: RentRow[] = raw.rent.map(r => {
    const unit = r.unit_id ? unitById.get(r.unit_id) : null;
    const status = rentStatusMap[r.status ?? ""] ?? "Due soon";
    return {
      id: r.id,
      propertyId: r.property_id,
      propertyName: propIdToName.get(r.property_id) ?? "Property",
      unit: unit?.name ?? "Whole property",
      tenant: unit?.name ? `${unit.name} tenant` : "Tenant",
      dueDate: r.due_date,
      amountDue: Number(r.amount_due ?? 0),
      amountPaid: Number(r.amount_paid ?? 0),
      status,
    };
  });

  const expenses: Expense[] = raw.tx
    .filter(t => t.direction === "expense")
    .map(t => {
      const cat = t.confirmed_category_id ? catById.get(t.confirmed_category_id) : null;
      const receipt: ExpenseReceipt = t.evidence_status === "complete" ? "Receipt attached" : "Missing receipt";
      const review: ExpenseReview = t.review_status === "approved" ? "Approved" : "Needs review";
      return {
        id: t.id,
        date: t.date,
        propertyId: t.property_id,
        propertyName: t.property_id ? (propIdToName.get(t.property_id) ?? "Property") : "Unknown property",
        merchant: t.merchant_or_payer ?? t.description ?? "—",
        amount: Number(t.amount ?? 0),
        category: cat?.name ?? "Uncategorised",
        receipt,
        review,
      };
    });

  const documents: PropertyDoc[] = raw.docs.map(d => ({
    id: d.id,
    name: d.file_name ?? d.document_type ?? "Document",
    propertyId: d.property_id,
    propertyName: propIdToName.get(d.property_id) ?? "Property",
    type: (d.document_type ?? "Repair Invoice") as DocType,
    issueDate: d.issue_date ?? "—",
    expiryDate: d.expiry_date ?? "—",
    status: docStatusMap[d.status ?? ""] ?? "Active",
  }));

  const reviewItems: ReviewItem[] = raw.rv.map(r => {
    const type = reviewTypeMap[r.item_type ?? ""] ?? "Documents";
    const acts = reviewActions(type);
    return {
      id: r.id,
      title: r.title,
      why: r.description ?? "",
      propertyId: r.property_id,
      propertyName: r.property_id ? (propIdToName.get(r.property_id) ?? "Property") : "All properties",
      priority: priorityMap[r.priority ?? ""] ?? "Medium",
      type,
      ...acts,
    };
  });

  const quarterlyReadiness = raw.packs[0]?.readiness_score != null
    ? Math.round(Number(raw.packs[0].readiness_score))
    : Math.round(properties.reduce((a, p) => a + p.readiness, 0) / Math.max(properties.length, 1));

  const stats = {
    totalProperties: properties.length,
    overdueRent: rentRows.filter(r => r.status === "Overdue").length,
    missingReceipts: expenses.filter(e => e.receipt === "Missing receipt").length,
    documentsExpiringSoon: documents.filter(d => d.status === "Expiring soon" || d.status === "Expired").length,
    reviewItems: reviewItems.length,
    quarterlyReadiness,
  };

  const priorityRank: Record<ReviewPriority, number> = { Urgent: 0, High: 1, Medium: 2, Low: 3 };
  const todaysActions = [...reviewItems].sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority]).slice(0, 4);

  return { properties, rentRows, expenses, documents, reviewItems, recentActivity, stats, todaysActions };
}

const demoBundle: Omit<LedgerData, "source" | "reason"> = {
  properties: demoProps,
  rentRows: demoRent,
  expenses: demoExpenses,
  documents: demoDocs,
  reviewItems: demoReview,
  recentActivity,
  stats: {
    totalProperties: demoProps.length,
    overdueRent: demoRent.filter(r => r.status === "Overdue").length,
    missingReceipts: demoExpenses.filter(e => e.receipt === "Missing receipt").length,
    documentsExpiringSoon: demoDocs.filter(d => d.status === "Expiring soon" || d.status === "Expired").length,
    reviewItems: demoReview.length,
    quarterlyReadiness: 82,
  },
  todaysActions: demoReview.slice(0, 4),
};

export function useLedgerData(): LedgerData {
  const { user, loading: authLoading } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ["ledger", user?.id ?? "anon"],
    queryFn: fetchAll,
    enabled: !!user,
    staleTime: 30_000,
  });

  if (authLoading) {
    if (import.meta.env.DEV) console.info("[ledger] fallback: auth loading");
    return { source: "loading", reason: "auth loading", ...demoBundle };
  }
  if (!user) {
    if (import.meta.env.DEV) console.info("[ledger] fallback: signed out");
    return { source: "demo", reason: "signed out", ...demoBundle };
  }
  if (isLoading) {
    if (import.meta.env.DEV) console.info("[ledger] fallback: supabase loading");
    return { source: "loading", reason: "supabase loading", ...demoBundle };
  }
  if (error) {
    console.warn("[ledger] fallback: supabase error", error);
    return { source: "demo", reason: "supabase error", ...demoBundle };
  }
  if (!data || data.props.length === 0) {
    if (import.meta.env.DEV) console.info("[ledger] fallback: zero properties returned (RLS or empty org)");
    return { source: "demo", reason: "no properties", ...demoBundle };
  }

  return { source: "supabase", ...mapToPhase1(data) };
}
