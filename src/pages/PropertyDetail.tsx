import { Link, useParams } from "react-router-dom";
import { useState } from "react";
import { recentActivity, gbp } from "@/data/demo";
import { useLedgerData } from "@/hooks/useLedgerData";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { StatusBadge, statusTone, priorityTone } from "@/components/StatusBadge";
import { ArrowLeft, Building2, MapPin, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import PropertyFormDialog, { type PropertyFormInitial } from "@/components/PropertyFormDialog";
import UnitFormDialog, { type UnitFormInitial } from "@/components/UnitFormDialog";
import TenancyFormDialog from "@/components/TenancyFormDialog";
import { usePropertyUnits } from "@/hooks/usePropertyUnits";
import { usePropertyTenancies, type TenancyRow } from "@/hooks/usePropertyTenancies";
import { toast } from "sonner";

const tabs = ["Overview", "Rent", "Expenses", "Documents", "Compliance", "Quarterly Pack"] as const;
type Tab = typeof tabs[number];

export default function PropertyDetail() {
  const { id = "" } = useParams();
  const { properties, rentRows, expenses, documents, reviewItems, source } = useLedgerData();
  const { user } = useAuth();
  const property = properties.find(p => p.id === id);
  const [tab, setTab] = useState<Tab>("Overview");
  const [editOpen, setEditOpen] = useState(false);
  const [editInitial, setEditInitial] = useState<PropertyFormInitial | null>(null);
  const [unitOpen, setUnitOpen] = useState(false);
  const [unitMode, setUnitMode] = useState<"create" | "edit">("create");
  const [unitInitial, setUnitInitial] = useState<UnitFormInitial | undefined>(undefined);
  const [tenancyOpen, setTenancyOpen] = useState(false);
  const [tenancyMode, setTenancyMode] = useState<"create" | "edit">("create");
  const [tenancyInitial, setTenancyInitial] = useState<TenancyRow | undefined>(undefined);

  const canManage = !!user && source === "supabase";
  const unitsQuery = usePropertyUnits(property?.id, canManage);
  const tenanciesQuery = usePropertyTenancies(property?.id, canManage);


  const openEdit = async () => {
    if (!user || !property) return;
    const { data, error } = await supabase.from("properties").select("*").eq("id", property.id).maybeSingle();
    if (error || !data) {
      toast.error("Could not load property details");
      return;
    }
    setEditInitial(data as PropertyFormInitial);
    setEditOpen(true);
  };

  const openAddUnit = () => {
    setUnitMode("create");
    setUnitInitial(undefined);
    setUnitOpen(true);
  };
  const openEditUnit = (u: UnitFormInitial) => {
    setUnitMode("edit");
    setUnitInitial(u);
    setUnitOpen(true);
  };
  const openAddTenancy = () => {
    setTenancyMode("create");
    setTenancyInitial(undefined);
    setTenancyOpen(true);
  };
  const openEditTenancy = (t: TenancyRow) => {
    setTenancyMode("edit");
    setTenancyInitial(t);
    setTenancyOpen(true);
  };



  if (!property) {
    return (
      <div className="card-surface p-8 text-center">
        <p className="text-muted-foreground">Property not found.</p>
        <Link to="/properties" className="text-accent text-sm mt-2 inline-block">Back to properties</Link>
      </div>
    );
  }

  const propRent = rentRows.filter(r => r.propertyId === property.id);
  const propExp = expenses.filter(e => e.propertyId === property.id);
  const propDocs = documents.filter(d => d.propertyId === property.id);
  const propReview = reviewItems.filter(r => r.propertyId === property.id);
  const expiringSoon = propDocs.filter(d => d.status === "Expiring soon" || d.status === "Expired");
  const missingReceipts = propExp.filter(e => e.receipt === "Missing receipt");

  return (
    <div className="space-y-6 max-w-7xl">
      <Link to="/properties" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" /> All properties
      </Link>

      {/* Header */}
      <section className="card-surface p-6">
        <div className="flex flex-wrap items-start gap-4 justify-between">
          <div className="flex items-start gap-3 min-w-0">
            <div className="size-11 rounded-lg bg-secondary grid place-items-center">
              <Building2 className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-display text-2xl font-semibold">{property.name}</h2>
                <StatusBadge tone={property.type === "HMO" ? "info" : "neutral"} dot={false}>{property.type}</StatusBadge>
              </div>
              <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="size-3.5" /> {property.address}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <Metric label="Readiness" value={`${property.readiness}%`} />
            <Metric label="Open review" value={`${property.openReviewItems}`} />
            <Metric label="Monthly rent" value={gbp(property.expectedMonthlyRent)} />
            {(() => {
              const canEdit = !!user && source === "supabase";
              const title = !user
                ? "Sign in to manage properties."
                : source !== "supabase"
                  ? "Demo records cannot be edited."
                  : "Edit property";
              return (
                <button
                  type="button"
                  onClick={openEdit}
                  disabled={!canEdit}
                  title={title}
                  className="h-9 px-3 rounded-lg border border-border text-sm inline-flex items-center gap-1.5 hover:bg-secondary disabled:opacity-50"
                >
                  <Pencil className="size-3.5" /> Edit
                </button>
              );
            })()}
          </div>

        </div>

        <div className="mt-5 h-1.5 rounded-full bg-border overflow-hidden">
          <div className="h-full bg-status-done" style={{ width: `${property.readiness}%` }} />
        </div>
      </section>

      {/* Tabs */}
      <div className="border-b border-border overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {tabs.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-3.5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
                tab === t ? "border-accent text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {tab === "Overview" && (
        <section className="grid lg:grid-cols-3 gap-4">
          <SummaryCard title="Rent status" tone={statusTone(property.rentStatus)} label={property.rentStatus}
            footer={`${propRent.length} expected charges this month`} />
          <SummaryCard title="Expenses needing review" tone={statusTone(property.expenseStatus)} label={`${propExp.filter(e=>e.review==="Needs review").length} item(s)`}
            footer={`${propExp.length} expenses on file`} />
          <SummaryCard title="Missing receipts" tone={missingReceipts.length ? "missing" : "done"} label={`${missingReceipts.length} receipt(s)`}
            footer="Add receipts to keep quarterly pack ready" />
          <SummaryCard title="Documents expiring soon" tone={expiringSoon.length ? "soon" : "done"} label={`${expiringSoon.length} document(s)`}
            footer={`${propDocs.length} documents on file`} />
          <SummaryCard title="Compliance items" tone={statusTone(property.documentStatus)} label={property.documentStatus}
            footer="Gas safety, EICR, HMO licence and more" />
          <SummaryCard title="Quarterly pack" tone={property.readiness >= 85 ? "done" : "review"} label={`${property.readiness}% ready`}
            footer="Evidence assembled from rent, expenses and documents" />

          <div className="lg:col-span-2 card-surface p-5">
            <h3 className="font-display text-lg font-semibold">Items needing review</h3>
            <ul className="mt-3 divide-y divide-border">
              {propReview.length === 0 && <li className="py-4 text-sm text-muted-foreground">Nothing to review. Great work.</li>}
              {propReview.map(r => (
                <li key={r.id} className="py-3 flex flex-wrap items-center gap-3">
                  <StatusBadge tone={priorityTone(r.priority)}>{r.priority}</StatusBadge>
                  <span className="text-sm flex-1 min-w-[200px]">{r.title}</span>
                  <span className="text-xs text-muted-foreground">{r.type}</span>
                  <button className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:opacity-90">{r.primaryAction}</button>
                </li>
              ))}
            </ul>
          </div>

          <div className="card-surface p-5">
            <h3 className="font-display text-lg font-semibold">Recent activity</h3>
            <ul className="mt-3 space-y-3">
              {recentActivity.slice(0,4).map(a => (
                <li key={a.id} className="flex gap-2.5 text-sm">
                  <span className="size-1.5 rounded-full bg-status-done mt-2 shrink-0" />
                  <div>
                    <div>{a.text}</div>
                    <div className="text-xs text-muted-foreground">{a.when}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3">
            <UnitsSection
              units={unitsQuery.data ?? []}
              loading={unitsQuery.isLoading}
              canManage={canManage}
              fallbackCount={property.rooms}
              source={source}
              onAdd={openAddUnit}
              onEdit={openEditUnit}
            />
          </div>

          <div className="lg:col-span-3">
            <TenanciesSection
              tenancies={tenanciesQuery.data ?? []}
              loading={tenanciesQuery.isLoading}
              canManage={canManage}
              hasUnits={(unitsQuery.data ?? []).length > 0}
              source={source}
              onAdd={openAddTenancy}
              onEdit={openEditTenancy}
            />
          </div>
        </section>
      )}

      {tab === "Rent" && <PropertyRent rows={propRent} />}
      {tab === "Expenses" && <PropertyExpenses rows={propExp} />}
      {tab === "Documents" && <PropertyDocs rows={propDocs} />}
      {tab === "Compliance" && <PropertyDocs rows={propDocs.filter(d => d.type !== "Repair Invoice" && d.type !== "Tenancy Agreement")} title="Compliance documents" />}
      {tab === "Quarterly Pack" && <PropertyPack property={property} />}

      {editInitial && (
        <PropertyFormDialog
          open={editOpen}
          onOpenChange={(o) => { setEditOpen(o); if (!o) setEditInitial(null); }}
          mode="edit"
          initial={editInitial}
        />
      )}

      <UnitFormDialog
        open={unitOpen}
        onOpenChange={setUnitOpen}
        mode={unitMode}
        propertyId={property.id}
        initial={unitInitial}
      />

      <TenancyFormDialog
        open={tenancyOpen}
        onOpenChange={setTenancyOpen}
        mode={tenancyMode}
        propertyId={property.id}
        units={unitsQuery.data ?? []}
        initial={tenancyInitial}
      />
    </div>
  );
}

function UnitsSection({
  units, loading, canManage, fallbackCount, source, onAdd, onEdit,
}: {
  units: import("@/hooks/usePropertyUnits").UnitRow[];
  loading: boolean;
  canManage: boolean;
  fallbackCount: number;
  source: "loading" | "demo" | "supabase";
  onAdd: () => void;
  onEdit: (u: import("@/components/UnitFormDialog").UnitFormInitial) => void;
}) {
  const freqLabel: Record<string, string> = { weekly: "Weekly", monthly: "Monthly", quarterly: "Quarterly" };
  const statusLabel: Record<string, string> = { available: "Available", occupied: "Occupied", inactive: "Inactive" };
  const addTitle = canManage ? "Add unit / room" : source === "supabase" ? "Sign in to manage units." : "Demo records cannot be edited.";
  return (
    <div className="card-surface p-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="font-display text-lg font-semibold">Units / rooms</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {canManage ? `${units.length} unit(s) on file` : `${fallbackCount} room(s) on file (demo)`}
          </p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          disabled={!canManage}
          title={addTitle}
          className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          Add unit
        </button>
      </div>
      <div className="mt-4">
        {!canManage ? (
          <p className="text-sm text-muted-foreground">{source === "supabase" ? "Sign in to view units." : "Sign in to manage real units. Demo properties show a static room count."}</p>
        ) : loading ? (
          <p className="text-sm text-muted-foreground">Loading units…</p>
        ) : units.length === 0 ? (
          <p className="text-sm text-muted-foreground">No units yet. Add one to structure this property.</p>
        ) : (
          <ul className="divide-y divide-border">
            {units.map(u => (
              <li key={u.id} className="py-3 flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium flex-1 min-w-[160px]">{u.name}</span>
                <span className="text-xs text-muted-foreground">{statusLabel[u.status ?? ""] ?? "—"}</span>
                <span className="text-xs text-muted-foreground num">£{Number(u.expected_rent ?? 0).toLocaleString()} {freqLabel[u.rent_frequency ?? ""] ?? ""}</span>
                <button
                  type="button"
                  onClick={() => onEdit(u)}
                  className="h-8 px-3 rounded-md border border-border text-xs hover:bg-secondary"
                >
                  Edit
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}



function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-display text-xl font-semibold num">{value}</div>
    </div>
  );
}

function SummaryCard({ title, tone, label, footer }: { title: string; tone: ReturnType<typeof statusTone>; label: string; footer: string }) {
  return (
    <div className="card-surface p-5">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{title}</div>
      <div className="mt-2"><StatusBadge tone={tone}>{label}</StatusBadge></div>
      <div className="text-xs text-muted-foreground mt-3">{footer}</div>
    </div>
  );
}

function PropertyRent({ rows }: { rows: import("@/data/demo").RentRow[] }) {
  return (
    <div className="card-surface overflow-hidden">
      <RentTable rows={rows} hideProperty />
    </div>
  );
}
function PropertyExpenses({ rows }: { rows: import("@/data/demo").Expense[] }) {
  return (
    <div className="card-surface overflow-hidden">
      <ExpensesTable rows={rows} hideProperty />
    </div>
  );
}
function PropertyDocs({ rows, title }: { rows: import("@/data/demo").PropertyDoc[]; title?: string }) {
  return (
    <div className="card-surface overflow-hidden">
      {title && <div className="px-5 pt-5 font-display text-lg font-semibold">{title}</div>}
      <DocumentsTable rows={rows} hideProperty />
    </div>
  );
}

function PropertyPack({ property }: { property: import("@/data/demo").Property | undefined }) {
  if (!property) return null;
  return (
    <div className="card-surface p-6 space-y-5">
      <div>
        <h3 className="font-display text-xl font-semibold">Quarterly pack readiness</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Your pack for {property.name} is {property.readiness}% ready.
          {property.openReviewItems > 0 && ` Clear ${property.openReviewItems} review item(s) before export.`}
        </p>
      </div>
      <div className="h-2 rounded-full bg-border overflow-hidden">
        <div className="h-full bg-accent" style={{ width: `${property.readiness}%` }} />
      </div>
      <div className="flex flex-wrap gap-2">
        <button disabled={property.readiness < 100}
          className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed">
          Export summary
        </button>
        <Link to="/review" className="h-10 px-4 rounded-lg border border-border text-sm font-medium hover:bg-secondary inline-flex items-center">
          Clear review items
        </Link>
      </div>
      <p className="text-xs text-muted-foreground">
        This is a readiness view, not a tax submission. Share with your accountant when ready.
      </p>
    </div>
  );
}

// Shared tables imported via re-export to avoid duplication
import { RentTable } from "./Rent";
import { ExpensesTable } from "./Expenses";
import { DocumentsTable } from "./Documents";
