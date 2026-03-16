import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useAdminAuth() {
  const { user, loading: authLoading } = useAuth();

  const roleQuery = useQuery({
    queryKey: ["admin-role", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .eq("role", "admin");

      if (error) throw error;
      return data && data.length > 0;
    },
    staleTime: 60_000,
  });

  return {
    user,
    isAdmin: roleQuery.data === true,
    loading: authLoading || roleQuery.isLoading,
  };
}

export async function adminAction(action: string, params: Record<string, any> = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const url = `https://${projectId}.supabase.co/functions/v1/pixi-admin`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    body: JSON.stringify({ action, ...params }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Admin action failed");
  }

  return res.json();
}
