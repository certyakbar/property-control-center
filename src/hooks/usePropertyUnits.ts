import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface UnitRow {
  id: string;
  property_id: string;
  name: string;
  expected_rent: number | null;
  rent_frequency: string | null;
  status: string | null;
  notes: string | null;
}

export function usePropertyUnits(propertyId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ["units", propertyId],
    enabled: !!propertyId && enabled,
    staleTime: 30_000,
    queryFn: async (): Promise<UnitRow[]> => {
      const { data, error } = await supabase
        .from("units")
        .select("*")
        .eq("property_id", propertyId!)
        .order("name");
      if (error) throw error;
      return (data ?? []) as UnitRow[];
    },
  });
}
