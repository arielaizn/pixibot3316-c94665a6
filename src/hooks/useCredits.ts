import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface UserCredits {
  plan_type: string;
  plan_credits: number;
  extra_credits: number;
  used_credits: number;
  billing_cycle_start: string;
  is_unlimited: boolean;
}

export interface CreditSummary extends UserCredits {
  totalCredits: number;
  remainingCredits: number;
  usagePercent: number;
  isLow: boolean;
  isEmpty: boolean;
  isUnlimited: boolean;
}

const PLAN_LABELS: Record<string, { he: string; en: string }> = {
  free: { he: "מנוי חופשי", en: "Free" },
  starter: { he: "Starter", en: "Starter" },
  creator: { he: "Creator", en: "Creator" },
  pro: { he: "Pro", en: "Pro" },
  business: { he: "Business", en: "Business" },
  enterprise: { he: "Enterprise", en: "Enterprise" },
};

export const getPlanLabel = (plan: string, isRTL: boolean) =>
  PLAN_LABELS[plan]?.[isRTL ? "he" : "en"] ?? plan;

export function useCredits() {
  const { user } = useAuth();

  const query = useQuery<CreditSummary | null>({
    queryKey: ["user-credits", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_credits")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      const totalCredits = data.plan_credits + data.extra_credits;
      const remainingCredits = Math.max(0, totalCredits - data.used_credits);
      const usagePercent = totalCredits > 0 ? (data.used_credits / totalCredits) * 100 : 100;

      return {
        plan_type: data.plan_type,
        plan_credits: data.plan_credits,
        extra_credits: data.extra_credits,
        used_credits: data.used_credits,
        billing_cycle_start: data.billing_cycle_start,
        totalCredits,
        remainingCredits,
        usagePercent,
        isLow: remainingCredits > 0 && remainingCredits / totalCredits < 0.2,
        isEmpty: remainingCredits <= 0,
      };
    },
    staleTime: 30_000,
  });

  return {
    credits: query.data ?? null,
    loading: query.isLoading,
    refetch: query.refetch,
  };
}
