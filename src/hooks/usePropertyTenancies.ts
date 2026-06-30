import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TenancyRow {
  id: string;
  organisation_id: string;
  tenant_id: string | null;
  property_id: string | null;
  unit_id: string | null;
  start_date: string | null;
  end_date: string | null;
  rent_amount: number | null;
  rent_due_day: number | null;
  deposit_status: string | null;
  status: string | null;
  tenant?: { id: string; display_name: string; email: string | null; phone: string | null; status: string | null } | null;
  unit?: { id: string; name: string } | null;
}

export function usePropertyTenancies(propertyId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ["tenancies", propertyId],
    enabled: !!propertyId && enabled,
    staleTime: 30_000,
    queryFn: async (): Promise<TenancyRow[]> => {
      const { data, error } = await supabase
        .from("tenancies")
        .select("*, tenant:tenants(id, display_name, email, phone, status), unit:units(id, name)")
        .eq("property_id", propertyId!)
        .order("start_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as TenancyRow[];
    },
  });
}

export interface TenantRow {
  id: string;
  display_name: string;
  email: string | null;
  phone: string | null;
  status: string | null;
}

export function useOrgTenants(enabled: boolean) {
  return useQuery({
    queryKey: ["tenants", "org"],
    enabled,
    staleTime: 30_000,
    queryFn: async (): Promise<TenantRow[]> => {
      const { data, error } = await supabase
        .from("tenants")
        .select("id, display_name, email, phone, status")
        .order("display_name");
      if (error) throw error;
      return (data ?? []) as TenantRow[];
    },
  });
}
