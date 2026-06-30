import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useActiveOrg } from "@/hooks/useActiveOrg";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const PROPERTY_TYPES = ["standard_rental", "hmo", "mixed", "other"] as const;
type PropertyType = typeof PROPERTY_TYPES[number];

const schema = z.object({
  name: z.string().trim().min(1, "Property name is required").max(120),
  address_line_1: z.string().trim().max(200).optional().or(z.literal("")),
  address_line_2: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().max(120).optional().or(z.literal("")),
  postcode: z.string().trim().max(20).optional().or(z.literal("")),
  council_name: z.string().trim().max(160).optional().or(z.literal("")),
  property_type: z.enum(PROPERTY_TYPES),
  is_hmo: z.boolean(),
  expected_monthly_rent: z.number().min(0).max(1_000_000),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export interface PropertyFormInitial {
  id?: string;
  name?: string;
  address_line_1?: string | null;
  address_line_2?: string | null;
  city?: string | null;
  postcode?: string | null;
  council_name?: string | null;
  property_type?: string | null;
  is_hmo?: boolean | null;
  expected_monthly_rent?: number | null;
  notes?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initial?: PropertyFormInitial;
}

const empty = {
  name: "",
  address_line_1: "",
  address_line_2: "",
  city: "",
  postcode: "",
  council_name: "",
  property_type: "standard_rental" as PropertyType,
  is_hmo: false,
  expected_monthly_rent: 0,
  notes: "",
};

export default function PropertyFormDialog({ open, onOpenChange, mode, initial }: Props) {
  const { user } = useAuth();
  const { orgId, loading: orgLoading } = useActiveOrg();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (mode === "edit" && initial) {
      setForm({
        name: initial.name ?? "",
        address_line_1: initial.address_line_1 ?? "",
        address_line_2: initial.address_line_2 ?? "",
        city: initial.city ?? "",
        postcode: initial.postcode ?? "",
        council_name: initial.council_name ?? "",
        property_type: (PROPERTY_TYPES.includes((initial.property_type ?? "") as PropertyType)
          ? initial.property_type
          : initial.is_hmo ? "hmo" : "standard_rental") as PropertyType,
        is_hmo: !!initial.is_hmo,
        expected_monthly_rent: Number(initial.expected_monthly_rent ?? 0),
        notes: initial.notes ?? "",
      });
    } else {
      setForm(empty);
    }
  }, [open, mode, initial]);

  if (!user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign in required</DialogTitle>
            <DialogDescription>Sign in to manage properties.</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const issue of parsed.error.issues) errs[issue.path[0] as string] = issue.message;
      setErrors(errs);
      return;
    }
    if (!orgId) {
      toast.error("No organisation available. Sign in to manage properties.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: parsed.data.name,
        address_line_1: parsed.data.address_line_1 || null,
        address_line_2: parsed.data.address_line_2 || null,
        city: parsed.data.city || null,
        postcode: parsed.data.postcode || null,
        council_name: parsed.data.council_name || null,
        property_type: parsed.data.property_type,
        is_hmo: parsed.data.is_hmo,
        expected_monthly_rent: parsed.data.expected_monthly_rent,
        notes: parsed.data.notes || null,
      };

      if (mode === "create") {
        const { data, error } = await supabase
          .from("properties")
          .insert({
            ...payload,
            organisation_id: orgId,
            readiness_score: 0,
            rent_status: "unknown",
            document_status: "unknown",
            expense_status: "unknown",
          })
          .select("id")
          .single();
        if (error) throw error;
        toast.success("Property added");
        await qc.invalidateQueries({ queryKey: ["ledger"] });
        onOpenChange(false);
        if (data?.id) navigate(`/properties/${data.id}`);
      } else if (initial?.id) {
        const { error } = await supabase.from("properties").update(payload).eq("id", initial.id);
        if (error) throw error;
        toast.success("Property updated");
        await qc.invalidateQueries({ queryKey: ["ledger"] });
        onOpenChange(false);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not save property";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const disabled = submitting || orgLoading || !orgId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add property" : "Edit property"}</DialogTitle>
          <DialogDescription>
            {orgLoading
              ? "Loading organisation…"
              : !orgId
                ? "Sign in to manage properties."
                : "Property details are private to your organisation."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field id="name" label="Property name" error={errors.name}>
            <Input id="name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} maxLength={120} required />
          </Field>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field id="address_line_1" label="Address line 1" error={errors.address_line_1}>
              <Input id="address_line_1" value={form.address_line_1} onChange={e => setForm({ ...form, address_line_1: e.target.value })} maxLength={200} />
            </Field>
            <Field id="address_line_2" label="Address line 2" error={errors.address_line_2}>
              <Input id="address_line_2" value={form.address_line_2} onChange={e => setForm({ ...form, address_line_2: e.target.value })} maxLength={200} />
            </Field>
            <Field id="city" label="City" error={errors.city}>
              <Input id="city" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} maxLength={120} />
            </Field>
            <Field id="postcode" label="Postcode" error={errors.postcode}>
              <Input id="postcode" value={form.postcode} onChange={e => setForm({ ...form, postcode: e.target.value })} maxLength={20} />
            </Field>
            <Field id="council_name" label="Council name" error={errors.council_name}>
              <Input id="council_name" value={form.council_name} onChange={e => setForm({ ...form, council_name: e.target.value })} maxLength={160} />
            </Field>
            <Field id="expected_monthly_rent" label="Expected monthly rent (£)" error={errors.expected_monthly_rent}>
              <Input
                id="expected_monthly_rent"
                type="number"
                min={0}
                step="0.01"
                value={form.expected_monthly_rent}
                onChange={e => setForm({ ...form, expected_monthly_rent: Number(e.target.value) || 0 })}
              />
            </Field>
            <Field id="property_type" label="Property type" error={errors.property_type}>
              <Select
                value={form.property_type}
                onValueChange={(v: PropertyType) => setForm({ ...form, property_type: v, is_hmo: v === "hmo" ? true : form.is_hmo })}
              >
                <SelectTrigger id="property_type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard_rental">Standard rental</SelectItem>
                  <SelectItem value="hmo">HMO</SelectItem>
                  <SelectItem value="mixed">Mixed</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <div className="flex items-end">
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.is_hmo}
                  onChange={e => setForm({ ...form, is_hmo: e.target.checked })}
                  className="size-4 rounded border-border"
                />
                Is HMO
              </label>
            </div>
          </div>

          <Field id="notes" label="Notes" error={errors.notes}>
            <Textarea id="notes" rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} maxLength={2000} />
          </Field>

          <DialogFooter>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-10 px-4 rounded-lg border border-border text-sm"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={disabled}
              className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "Saving…" : mode === "create" ? "Add property" : "Save changes"}
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
