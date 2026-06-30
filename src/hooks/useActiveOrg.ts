import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export function useActiveOrg() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["active-org", user?.id ?? "anon"],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organisation_members")
        .select("organisation_id, role")
        .order("created_at", { ascending: true })
        .limit(1);
      if (error) throw error;
      return data?.[0] ?? null;
    },
  });
  return { orgId: data?.organisation_id ?? null, role: data?.role ?? null, loading: isLoading };
}
