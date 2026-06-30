import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const FREQS = ["weekly", "monthly", "quarterly"] as const;
const STATUSES = ["available", "occupied", "inactive"] as const;
type Freq = typeof FREQS[number];
type Status = typeof STATUSES[number];

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  expected_rent: z.number().min(0).max(1_000_000),
  rent_frequency: z.enum(FREQS),
  status: z.enum(STATUSES),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export interface UnitFormInitial {
  id?: string;
  name?: string;
  expected_rent?: number | null;
  rent_frequency?: string | null;
  status?: string | null;
  notes?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  propertyId: string;
  initial?: UnitFormInitial;
}

const empty = {
  name: "",
  expected_rent: 0,
  rent_frequency: "monthly" as Freq,
  status: "available" as Status,
  notes: "",
};

export default function UnitFormDialog({ open, onOpenChange, mode, propertyId, initial }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (mode === "edit" && initial) {
      setForm({
        name: initial.name ?? "",
        expected_rent: Number(initial.expected_rent ?? 0),
        rent_frequency: (FREQS.includes((initial.rent_frequency ?? "") as Freq)
          ? initial.rent_frequency
          : "monthly") as Freq,
        status: (STATUSES.includes((initial.status ?? "") as Status)
          ? initial.status
          : "available") as Status,
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
            <DialogDescription>Sign in to manage units.</DialogDescription>
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
    setSubmitting(true);
    try {
      const payload = {
        name: parsed.data.name,
        expected_rent: parsed.data.expected_rent,
        rent_frequency: parsed.data.rent_frequency,
        status: parsed.data.status,
        notes: parsed.data.notes || null,
      };
      if (mode === "create") {
        const { error } = await supabase
          .from("units")
          .insert({ ...payload, property_id: propertyId });
        if (error) throw error;
        toast.success("Unit added");
      } else if (initial?.id) {
        const { error } = await supabase.from("units").update(payload).eq("id", initial.id);
        if (error) throw error;
        toast.success("Unit updated");
      }
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["ledger"] }),
        qc.invalidateQueries({ queryKey: ["units", propertyId] }),
      ]);
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save unit");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add unit / room" : "Edit unit / room"}</DialogTitle>
          <DialogDescription>Units belong to this property only.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field id="name" label="Unit / room name" error={errors.name}>
            <Input id="name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} maxLength={120} required />
          </Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field id="expected_rent" label="Expected rent (£)" error={errors.expected_rent}>
              <Input
                id="expected_rent"
                type="number"
                min={0}
                step="0.01"
                value={form.expected_rent}
                onChange={e => setForm({ ...form, expected_rent: Number(e.target.value) || 0 })}
              />
            </Field>
            <Field id="rent_frequency" label="Rent frequency" error={errors.rent_frequency}>
              <Select value={form.rent_frequency} onValueChange={(v: Freq) => setForm({ ...form, rent_frequency: v })}>
                <SelectTrigger id="rent_frequency"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field id="status" label="Status" error={errors.status}>
              <Select value={form.status} onValueChange={(v: Status) => setForm({ ...form, status: v })}>
                <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="occupied">Occupied</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field id="notes" label="Notes" error={errors.notes}>
            <Textarea id="notes" rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} maxLength={2000} />
          </Field>
          <DialogFooter>
            <button type="button" onClick={() => onOpenChange(false)} className="h-10 px-4 rounded-lg border border-border text-sm" disabled={submitting}>
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50">
              {submitting ? "Saving…" : mode === "create" ? "Add unit" : "Save changes"}
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
