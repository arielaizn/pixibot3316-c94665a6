import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useWhatsAppRequired() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["whatsapp-check", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("whatsapp_number")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (error) throw error;
      return !data?.whatsapp_number;
    },
    staleTime: 30_000,
  });

  return {
    needsWhatsApp: query.data === true,
    loading: query.isLoading,
    refetch: query.refetch,
  };
}
