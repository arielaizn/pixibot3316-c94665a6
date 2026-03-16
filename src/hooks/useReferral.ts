import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ReferralData {
  referral_code: string;
  referrals: Array<{
    id: string;
    referred_user_id: string;
    referred_email: string;
    status: string;
    created_at: string;
    converted_at: string | null;
  }>;
  rewards: Array<{
    id: string;
    reward_type: string;
    reward_value: number;
    created_at: string;
  }>;
  stats: {
    total_invited: number;
    total_paid: number;
    total_rewards: number;
  };
}

export function useReferral() {
  const { user } = useAuth();

  return useQuery<ReferralData>({
    queryKey: ["referral-stats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("pixi-referral", {
        body: { action: "get_stats" },
      });
      if (error) throw error;
      return data as ReferralData;
    },
    staleTime: 30_000,
  });
}

export function useAdminReferralStats() {
  return useQuery({
    queryKey: ["admin-referral-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("pixi-referral", {
        body: { action: "admin_stats" },
      });
      if (error) throw error;
      return data;
    },
    staleTime: 30_000,
  });
}

export async function attributeReferralSignup(referralCode: string, referredUserId: string) {
  const { data, error } = await supabase.functions.invoke("pixi-referral", {
    body: { action: "attribute_signup", referral_code: referralCode, referred_user_id: referredUserId },
  });
  if (error) throw error;
  return data;
}
