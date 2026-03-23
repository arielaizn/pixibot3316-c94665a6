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
  challengeActive: boolean;
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
      // Fetch credits, admin role, and active challenges in parallel
      const [creditsResult, roleResult, challengeResult] = await Promise.all([
        supabase.from("user_credits").select("*").eq("user_id", user!.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user!.id).eq("role", "admin"),
        supabase.from("challenges" as any).select("id").limit(1),
      ]);

      if (creditsResult.error) throw creditsResult.error;
      const data = creditsResult.data;
      if (!data) return null;

      const isAdmin = (roleResult.data && roleResult.data.length > 0) || false;
      const hasActiveChallenge = (challengeResult.data && challengeResult.data.length > 0) || false;
      const isUnlimited = data.is_unlimited === true || isAdmin || hasActiveChallenge;
      const totalCredits = data.plan_credits + data.extra_credits;
      const remainingCredits = isUnlimited ? Infinity : Math.max(0, totalCredits - data.used_credits);
      const usagePercent = isUnlimited ? 0 : totalCredits > 0 ? (data.used_credits / totalCredits) * 100 : 100;

      return {
        plan_type: data.plan_type,
        plan_credits: data.plan_credits,
        extra_credits: data.extra_credits,
        used_credits: data.used_credits,
        billing_cycle_start: data.billing_cycle_start,
        is_unlimited: isUnlimited,
        totalCredits,
        remainingCredits,
        usagePercent,
        isUnlimited,
        challengeActive: hasActiveChallenge,
        isLow: !isUnlimited && remainingCredits > 0 && remainingCredits / totalCredits < 0.2,
        isEmpty: !isUnlimited && remainingCredits <= 0,
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
