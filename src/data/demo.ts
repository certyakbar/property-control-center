// Static demo data for Ledgerless HMO Phase 1 prototype.
// No real personal data. Fake addresses & display names only.

export type PropertyType = "HMO" | "Standard Rental";

export interface Property {
  id: string;
  name: string;
  address: string;
  type: PropertyType;
  rooms: number;
  expectedMonthlyRent: number;
  readiness: number; // 0-100
  openReviewItems: number;
  rentStatus: "On track" | "Partial" | "Overdue";
  documentStatus: "Up to date" | "Expiring soon" | "Action needed";
  expenseStatus: "All evidenced" | "Missing receipts" | "Needs review";
}

export const properties: Property[] = [
  {
    id: "14-green-street",
    name: "14 Green Street",
    address: "14 Green Street, Manchester M14",
    type: "HMO",
    rooms: 4,
    expectedMonthlyRent: 2500,
    readiness: 76,
    openReviewItems: 4,
    rentStatus: "Partial",
    documentStatus: "Up to date",
    expenseStatus: "Missing receipts",
  },
  {
    id: "21-baker-road",
    name: "21 Baker Road",
    address: "21 Baker Road, Leeds LS6",
    type: "Standard Rental",
    rooms: 1,
    expectedMonthlyRent: 1200,
    readiness: 88,
    openReviewItems: 2,
    rentStatus: "On track",
    documentStatus: "Expiring soon",
    expenseStatus: "All evidenced",
  },
  {
    id: "8-kings-avenue",
    name: "8 Kings Avenue",
    address: "8 Kings Avenue, Birmingham B29",
    type: "HMO",
    rooms: 5,
    expectedMonthlyRent: 3100,
    readiness: 64,
    openReviewItems: 5,
    rentStatus: "On track",
    documentStatus: "Action needed",
    expenseStatus: "Needs review",
  },
];

export type RentStatus = "Paid" | "Partial" | "Overdue" | "Due soon";

export interface RentRow {
  id: string;
  propertyId: string;
  propertyName: string;
  unit: string;
  tenant: string;
  dueDate: string;
  amountDue: number;
  amountPaid: number;
  status: RentStatus;
}

export const rentRows: RentRow[] = [
  { id: "r1", propertyId: "14-green-street", propertyName: "14 Green Street", unit: "Room 1", tenant: "Tenant A",   dueDate: "2026-06-01", amountDue: 625,  amountPaid: 625,  status: "Paid" },
  { id: "r2", propertyId: "14-green-street", propertyName: "14 Green Street", unit: "Room 2", tenant: "Room 2 tenant", dueDate: "2026-06-01", amountDue: 625, amountPaid: 475, status: "Partial" },
  { id: "r3", propertyId: "14-green-street", propertyName: "14 Green Street", unit: "Room 3", tenant: "M. Khan",    dueDate: "2026-06-01", amountDue: 625,  amountPaid: 0,    status: "Overdue" },
  { id: "r4", propertyId: "14-green-street", propertyName: "14 Green Street", unit: "Room 4", tenant: "Tenant D",   dueDate: "2026-06-01", amountDue: 625,  amountPaid: 625,  status: "Paid" },
  { id: "r5", propertyId: "21-baker-road",   propertyName: "21 Baker Road",   unit: "Whole property", tenant: "J. Patel", dueDate: "2026-06-05", amountDue: 1200, amountPaid: 1200, status: "Paid" },
  { id: "r6", propertyId: "8-kings-avenue",  propertyName: "8 Kings Avenue",  unit: "Room 1", tenant: "Tenant K",   dueDate: "2026-07-01", amountDue: 620,  amountPaid: 0,    status: "Due soon" },
  { id: "r7", propertyId: "8-kings-avenue",  propertyName: "8 Kings Avenue",  unit: "Room 2", tenant: "Tenant L",   dueDate: "2026-06-01", amountDue: 620,  amountPaid: 620,  status: "Paid" },
];

export type ExpenseReceipt = "Receipt attached" | "Missing receipt";
export type ExpenseReview = "Approved" | "Needs review";

export interface Expense {
  id: string;
  date: string;
  propertyId: string | null;
  propertyName: string;
  merchant: string;
  amount: number;
  category: string;
  receipt: ExpenseReceipt;
  review: ExpenseReview;
}

export const expenses: Expense[] = [
  { id: "e1", date: "2026-06-18", propertyId: "14-green-street", propertyName: "14 Green Street", merchant: "Screwfix",      amount: 86.40,   category: "Likely repairs", receipt: "Missing receipt",  review: "Needs review" },
  { id: "e2", date: "2026-06-12", propertyId: "14-green-street", propertyName: "14 Green Street", merchant: "British Gas",   amount: 142.20,  category: "Utilities",       receipt: "Receipt attached", review: "Approved" },
  { id: "e3", date: "2026-05-30", propertyId: "8-kings-avenue",  propertyName: "8 Kings Avenue",  merchant: "Local Council", amount: 1150.00, category: "Licence fee",     receipt: "Receipt attached", review: "Approved" },
  { id: "e4", date: "2026-06-22", propertyId: null,              propertyName: "Unknown property", merchant: "Amazon",        amount: 39.99,   category: "Uncategorised",   receipt: "Missing receipt",  review: "Needs review" },
  { id: "e5", date: "2026-06-08", propertyId: "21-baker-road",   propertyName: "21 Baker Road",   merchant: "City Plumbers", amount: 220.00,  category: "Repairs",         receipt: "Receipt attached", review: "Approved" },
  { id: "e6", date: "2026-06-02", propertyId: "8-kings-avenue",  propertyName: "8 Kings Avenue",  merchant: "Direct Line",   amount: 412.00,  category: "Insurance",       receipt: "Receipt attached", review: "Approved" },
];

export type DocStatus = "Active" | "Expiring soon" | "Expired" | "Missing information";
export type DocType =
  | "HMO Licence" | "Gas Safety Certificate" | "EICR" | "EPC"
  | "Insurance" | "Tenancy Agreement" | "Fire Risk Assessment" | "Repair Invoice";

export interface PropertyDoc {
  id: string;
  name: string;
  propertyId: string;
  propertyName: string;
  type: DocType;
  issueDate: string;
  expiryDate: string;
  status: DocStatus;
}

export const documents: PropertyDoc[] = [
  { id: "d1", name: "Gas Safety Certificate 2025", propertyId: "14-green-street", propertyName: "14 Green Street", type: "Gas Safety Certificate", issueDate: "2025-07-28", expiryDate: "2026-07-28", status: "Expiring soon" },
  { id: "d2", name: "HMO Licence",                 propertyId: "14-green-street", propertyName: "14 Green Street", type: "HMO Licence",            issueDate: "2024-09-01", expiryDate: "2029-09-01", status: "Active" },
  { id: "d3", name: "EICR Report",                 propertyId: "14-green-street", propertyName: "14 Green Street", type: "EICR",                   issueDate: "2024-04-12", expiryDate: "2029-04-12", status: "Active" },
  { id: "d4", name: "Insurance policy",            propertyId: "21-baker-road",   propertyName: "21 Baker Road",   type: "Insurance",              issueDate: "—",          expiryDate: "—",          status: "Missing information" },
  { id: "d5", name: "Fire Risk Assessment",        propertyId: "8-kings-avenue",  propertyName: "8 Kings Avenue",  type: "Fire Risk Assessment",   issueDate: "2024-03-01", expiryDate: "2026-03-01", status: "Expired" },
  { id: "d6", name: "EPC Certificate",             propertyId: "21-baker-road",   propertyName: "21 Baker Road",   type: "EPC",                    issueDate: "2022-01-10", expiryDate: "2032-01-10", status: "Active" },
  { id: "d7", name: "HMO Licence",                 propertyId: "8-kings-avenue",  propertyName: "8 Kings Avenue",  type: "HMO Licence",            issueDate: "2023-11-01", expiryDate: "2026-08-12", status: "Expiring soon" },
  { id: "d8", name: "Tenancy Agreement — Room 2",  propertyId: "14-green-street", propertyName: "14 Green Street", type: "Tenancy Agreement",      issueDate: "2025-09-01", expiryDate: "2026-09-01", status: "Active" },
];

export type ReviewPriority = "Urgent" | "High" | "Medium" | "Low";
export type ReviewType = "Rent" | "Expenses" | "Documents" | "Compliance" | "Quarterly Pack";

export interface ReviewItem {
  id: string;
  title: string;
  why: string;
  propertyId: string | null;
  propertyName: string;
  priority: ReviewPriority;
  type: ReviewType;
  primaryAction: string;
  secondaryAction: string;
}

export const reviewItems: ReviewItem[] = [
  {
    id: "rv1",
    title: "Room 2 rent is £150 short",
    why: "Expected £625. Matched payment shows £475.",
    propertyId: "14-green-street", propertyName: "14 Green Street",
    priority: "High", type: "Rent",
    primaryAction: "Review payment", secondaryAction: "Mark resolved",
  },
  {
    id: "rv2",
    title: "Room 3 rent is overdue",
    why: "£625 due 1 June. No matched payment.",
    propertyId: "14-green-street", propertyName: "14 Green Street",
    priority: "Urgent", type: "Rent",
    primaryAction: "Chase rent", secondaryAction: "Mark resolved",
  },
  {
    id: "rv3",
    title: "Receipt missing for £86.40 Screwfix expense",
    why: "This expense is not ready for your quarterly pack until a receipt is added or marked as unavailable.",
    propertyId: "14-green-street", propertyName: "14 Green Street",
    priority: "Medium", type: "Expenses",
    primaryAction: "Add receipt", secondaryAction: "Mark unavailable",
  },
  {
    id: "rv4",
    title: "Gas Safety Certificate expires in 28 days",
    why: "This property document needs updating soon to stay compliant.",
    propertyId: "14-green-street", propertyName: "14 Green Street",
    priority: "High", type: "Compliance",
    primaryAction: "Upload new certificate", secondaryAction: "Remind later",
  },
  {
    id: "rv5",
    title: "Fire Risk Assessment has expired",
    why: "This HMO must have an in-date Fire Risk Assessment on file.",
    propertyId: "8-kings-avenue", propertyName: "8 Kings Avenue",
    priority: "Urgent", type: "Compliance",
    primaryAction: "Upload new assessment", secondaryAction: "Remind later",
  },
  {
    id: "rv6",
    title: "Expense needs property confirmation",
    why: "We need to know which property the £39.99 Amazon expense belongs to.",
    propertyId: null, propertyName: "Unknown property",
    priority: "Medium", type: "Expenses",
    primaryAction: "Confirm property", secondaryAction: "Ignore",
  },
  {
    id: "rv7",
    title: "Document type needs confirmation",
    why: "This document was uploaded but has not been labelled.",
    propertyId: "21-baker-road", propertyName: "21 Baker Road",
    priority: "Low", type: "Documents",
    primaryAction: "Choose document type", secondaryAction: "Dismiss",
  },
  {
    id: "rv8",
    title: "Insurance policy is missing key information",
    why: "Issue and expiry dates are not yet recorded.",
    propertyId: "21-baker-road", propertyName: "21 Baker Road",
    priority: "Medium", type: "Documents",
    primaryAction: "Add details", secondaryAction: "Dismiss",
  },
  {
    id: "rv9",
    title: "Quarterly pack is 82% ready",
    why: "Clear 6 review items before exporting your accountant pack.",
    propertyId: null, propertyName: "All properties",
    priority: "Medium", type: "Quarterly Pack",
    primaryAction: "Open quarterly pack", secondaryAction: "Remind later",
  },
];

// Aggregates ------------------------------------------------------
export const stats = {
  totalProperties: properties.length,
  overdueRent: rentRows.filter(r => r.status === "Overdue").length,
  missingReceipts: expenses.filter(e => e.receipt === "Missing receipt").length,
  documentsExpiringSoon: documents.filter(d => d.status === "Expiring soon" || d.status === "Expired").length,
  reviewItems: reviewItems.length,
  quarterlyReadiness: 82,
};

export const todaysActions = reviewItems.slice(0, 4);

export const recentActivity = [
  { id: "a1", when: "2 hours ago", text: "Rent payment matched for 14 Green Street, Room 1." },
  { id: "a2", when: "Yesterday",   text: "British Gas £142.20 expense approved." },
  { id: "a3", when: "2 days ago",  text: "EICR report uploaded for 14 Green Street." },
  { id: "a4", when: "3 days ago",  text: "21 Baker Road rent received in full." },
];

// Helpers ---------------------------------------------------------
export const gbp = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 2 }).format(n);

export const findProperty = (id: string) => properties.find(p => p.id === id);
