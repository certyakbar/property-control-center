import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useActiveOrg } from "@/hooks/useActiveOrg";
import { useOrgTenants, type TenancyRow } from "@/hooks/usePropertyTenancies";
import type { UnitRow } from "@/hooks/usePropertyUnits";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const TENANT_STATUSES = ["active", "former", "prospective"] as const;
const DEPOSIT_STATUSES = ["unknown", "not_required", "protected", "unprotected", "returned"] as const;
const TENANCY_STATUSES = ["active", "ended", "pending"] as const;
type TenantStatus = typeof TENANT_STATUSES[number];
type DepositStatus = typeof DEPOSIT_STATUSES[number];
type TenancyStatus = typeof TENANCY_STATUSES[number];

const tenantSchema = z.object({
  display_name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email("Invalid email").max(255).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  status: z.enum(TENANT_STATUSES),
});

const tenancySchema = z.object({
  unit_id: z.string().uuid().nullable(),
  start_date: z.string().optional().or(z.literal("")),
  end_date: z.string().optional().or(z.literal("")),
  rent_amount: z.number().min(0).max(1_000_000),
  rent_due_day: z.number().int().min(1).max(31).nullable(),
  deposit_status: z.enum(DEPOSIT_STATUSES),
  status: z.enum(TENANCY_STATUSES),
});

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  propertyId: string;
  units: UnitRow[];
  initial?: TenancyRow;
}

const emptyTenant = { display_name: "", email: "", phone: "", status: "active" as TenantStatus };
const emptyTenancy = {
  unit_id: null as string | null,
  start_date: "",
  end_date: "",
  rent_amount: 0,
  rent_due_day: 1 as number | null,
  deposit_status: "unknown" as DepositStatus,
  status: "active" as TenancyStatus,
};

export default function TenancyFormDialog({ open, onOpenChange, mode, propertyId, units, initial }: Props) {
  const { user } = useAuth();
  const { orgId } = useActiveOrg();
  const qc = useQueryClient();
  const tenantsQuery = useOrgTenants(!!user && open);
  const [tenantMode, setTenantMode] = useState<"existing" | "new">("new");
  const [existingTenantId, setExistingTenantId] = useState<string>("");
  const [tenant, setTenant] = useState(emptyTenant);
  const [tenancy, setTenancy] = useState(emptyTenancy);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (mode === "edit" && initial) {
      setTenantMode("existing");
      setExistingTenantId(initial.tenant_id ?? "");
      setTenant({
        display_name: initial.tenant?.display_name ?? "",
        email: initial.tenant?.email ?? "",
        phone: initial.tenant?.phone ?? "",
        status: (TENANT_STATUSES.includes((initial.tenant?.status ?? "") as TenantStatus) ? initial.tenant?.status : "active") as TenantStatus,
      });
      setTenancy({
        unit_id: initial.unit_id,
        start_date: initial.start_date ?? "",
        end_date: initial.end_date ?? "",
        rent_amount: Number(initial.rent_amount ?? 0),
        rent_due_day: initial.rent_due_day ?? 1,
        deposit_status: (DEPOSIT_STATUSES.includes((initial.deposit_status ?? "") as DepositStatus) ? initial.deposit_status : "unknown") as DepositStatus,
        status: (TENANCY_STATUSES.includes((initial.status ?? "") as TenancyStatus) ? initial.status : "active") as TenancyStatus,
      });
    } else {
      setTenantMode("new");
      setExistingTenantId("");
      setTenant(emptyTenant);
      setTenancy(emptyTenancy);
    }
  }, [open, mode, initial]);

  if (!user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign in required</DialogTitle>
            <DialogDescription>Sign in to manage tenancies.</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};

    let tenantId: string | null = null;
    if (mode === "create" && tenantMode === "existing") {
      if (!existingTenantId) errs.tenant = "Select a tenant or add a new one";
      tenantId = existingTenantId || null;
    } else if (mode === "create" && tenantMode === "new") {
      const parsed = tenantSchema.safeParse(tenant);
      if (!parsed.success) {
        for (const issue of parsed.error.issues) errs[`tenant_${issue.path[0]}`] = issue.message;
      }
    } else if (mode === "edit") {
      tenantId = initial?.tenant_id ?? null;
    }

    const parsedT = tenancySchema.safeParse(tenancy);
    if (!parsedT.success) {
      for (const issue of parsedT.error.issues) errs[`tenancy_${issue.path[0]}`] = issue.message;
    }
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    if (!orgId) { toast.error("No organisation available. Sign in to manage tenancies."); return; }

    setSubmitting(true);
    try {
      if (mode === "create" && tenantMode === "new") {
        const { data, error } = await supabase
          .from("tenants")
          .insert({
            organisation_id: orgId,
            display_name: tenant.display_name,
            email: tenant.email || null,
            phone: tenant.phone || null,
            status: tenant.status,
          })
          .select("id")
          .single();
        if (error) throw error;
        tenantId = data.id;
      }

      const tenancyPayload = {
        unit_id: tenancy.unit_id,
        start_date: tenancy.start_date || null,
        end_date: tenancy.end_date || null,
        rent_amount: tenancy.rent_amount,
        rent_due_day: tenancy.rent_due_day,
        deposit_status: tenancy.deposit_status,
        status: tenancy.status,
      };

      if (mode === "create") {
        const { error } = await supabase.from("tenancies").insert({
          ...tenancyPayload,
          organisation_id: orgId,
          property_id: propertyId,
          tenant_id: tenantId,
        });
        if (error) throw error;
        toast.success("Tenancy added");
      } else if (initial?.id) {
        const { error } = await supabase.from("tenancies").update(tenancyPayload).eq("id", initial.id);
        if (error) throw error;
        toast.success("Tenancy updated");
      }

      await Promise.all([
        qc.invalidateQueries({ queryKey: ["tenancies", propertyId] }),
        qc.invalidateQueries({ queryKey: ["tenants", "org"] }),
        qc.invalidateQueries({ queryKey: ["ledger"] }),
      ]);
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save tenancy");
    } finally {
      setSubmitting(false);
    }
  };

  const noUnits = units.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add tenancy" : "Edit tenancy"}</DialogTitle>
          <DialogDescription>
            {noUnits ? "Add a unit or room before creating a tenancy." : "Tenancy belongs to this property only."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Tenant */}
          <fieldset className="space-y-3 border border-border rounded-lg p-4">
            <legend className="text-sm font-medium px-1">Tenant</legend>
            {mode === "create" && (
              <div className="flex items-center gap-3 text-sm">
                <label className="inline-flex items-center gap-1.5">
                  <input type="radio" checked={tenantMode === "new"} onChange={() => setTenantMode("new")} />
                  Add new tenant
                </label>
                <label className="inline-flex items-center gap-1.5">
                  <input type="radio" checked={tenantMode === "existing"} onChange={() => setTenantMode("existing")} />
                  Use existing
                </label>
              </div>
            )}

            {mode === "create" && tenantMode === "existing" ? (
              <Field id="existing_tenant" label="Existing tenant" error={errors.tenant}>
                <Select value={existingTenantId} onValueChange={setExistingTenantId}>
                  <SelectTrigger id="existing_tenant"><SelectValue placeholder={tenantsQuery.isLoading ? "Loading…" : "Select tenant"} /></SelectTrigger>
                  <SelectContent>
                    {(tenantsQuery.data ?? []).map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.display_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                <Field id="tenant_display_name" label="Display name" error={errors.tenant_display_name}>
                  <Input
                    id="tenant_display_name"
                    value={tenant.display_name}
                    onChange={e => setTenant({ ...tenant, display_name: e.target.value })}
                    maxLength={120}
                    disabled={mode === "edit"}
                    required={mode === "create"}
                  />
                </Field>
                <Field id="tenant_email" label="Email" error={errors.tenant_email}>
                  <Input
                    id="tenant_email" type="email" value={tenant.email}
                    onChange={e => setTenant({ ...tenant, email: e.target.value })}
                    maxLength={255} disabled={mode === "edit"}
                  />
                </Field>
                <Field id="tenant_phone" label="Phone" error={errors.tenant_phone}>
                  <Input
                    id="tenant_phone" value={tenant.phone}
                    onChange={e => setTenant({ ...tenant, phone: e.target.value })}
                    maxLength={40} disabled={mode === "edit"}
                  />
                </Field>
                <Field id="tenant_status" label="Status" error={errors.tenant_status}>
                  <Select
                    value={tenant.status}
                    onValueChange={(v: TenantStatus) => setTenant({ ...tenant, status: v })}
                    disabled={mode === "edit"}
                  >
                    <SelectTrigger id="tenant_status"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="former">Former</SelectItem>
                      <SelectItem value="prospective">Prospective</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            )}
            {mode === "edit" && (
              <p className="text-xs text-muted-foreground">Tenant details are read-only here.</p>
            )}
          </fieldset>

          {/* Tenancy */}
          <fieldset className="space-y-3 border border-border rounded-lg p-4">
            <legend className="text-sm font-medium px-1">Tenancy</legend>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field id="unit_id" label="Unit / room" error={errors.tenancy_unit_id}>
                <Select
                  value={tenancy.unit_id ?? "__none__"}
                  onValueChange={v => setTenancy({ ...tenancy, unit_id: v === "__none__" ? null : v })}
                  disabled={noUnits}
                >
                  <SelectTrigger id="unit_id"><SelectValue placeholder={noUnits ? "No units" : "Select unit"} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Whole property</SelectItem>
                    {units.map(u => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field id="status" label="Tenancy status" error={errors.tenancy_status}>
                <Select value={tenancy.status} onValueChange={(v: TenancyStatus) => setTenancy({ ...tenancy, status: v })}>
                  <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="ended">Ended</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field id="start_date" label="Start date" error={errors.tenancy_start_date}>
                <Input id="start_date" type="date" value={tenancy.start_date} onChange={e => setTenancy({ ...tenancy, start_date: e.target.value })} />
              </Field>
              <Field id="end_date" label="End date" error={errors.tenancy_end_date}>
                <Input id="end_date" type="date" value={tenancy.end_date} onChange={e => setTenancy({ ...tenancy, end_date: e.target.value })} />
              </Field>
              <Field id="rent_amount" label="Rent amount (£)" error={errors.tenancy_rent_amount}>
                <Input
                  id="rent_amount" type="number" min={0} step="0.01"
                  value={tenancy.rent_amount}
                  onChange={e => setTenancy({ ...tenancy, rent_amount: Number(e.target.value) || 0 })}
                />
              </Field>
              <Field id="rent_due_day" label="Rent due day (1-31)" error={errors.tenancy_rent_due_day}>
                <Input
                  id="rent_due_day" type="number" min={1} max={31}
                  value={tenancy.rent_due_day ?? ""}
                  onChange={e => setTenancy({ ...tenancy, rent_due_day: e.target.value ? Math.min(31, Math.max(1, Number(e.target.value))) : null })}
                />
              </Field>
              <Field id="deposit_status" label="Deposit status" error={errors.tenancy_deposit_status}>
                <Select value={tenancy.deposit_status} onValueChange={(v: DepositStatus) => setTenancy({ ...tenancy, deposit_status: v })}>
                  <SelectTrigger id="deposit_status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unknown">Unknown</SelectItem>
                    <SelectItem value="not_required">Not required</SelectItem>
                    <SelectItem value="protected">Protected</SelectItem>
                    <SelectItem value="unprotected">Unprotected</SelectItem>
                    <SelectItem value="returned">Returned</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </fieldset>

          <DialogFooter>
            <button type="button" onClick={() => onOpenChange(false)} className="h-10 px-4 rounded-lg border border-border text-sm" disabled={submitting}>
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50">
              {submitting ? "Saving…" : mode === "create" ? "Add tenancy" : "Save changes"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
