import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function polarCheckout(action: string, params: Record<string, any> = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const res = await fetch(
    `https://${PROJECT_ID}.supabase.co/functions/v1/polar-checkout`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        apikey: ANON_KEY,
      },
      body: JSON.stringify({ action, ...params }),
    },
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Payment action failed");
  }

  return res.json();
}

export function usePayment() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const startSubscription = async (planKey: string, billingCycle: "monthly" | "yearly") => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Not authenticated");

      const result = await polarCheckout("create_checkout", {
        plan_key: planKey,
        billing_cycle: billingCycle,
        pixi_user_id: session.user.id,
      });

      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: any) {
      toast({
        title: "שגיאה",
        description: err.message || "אירעה שגיאה בתהליך התשלום",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const buyCredits = async (credits: number, _price: number) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Not authenticated");

      const result = await polarCheckout("create_checkout", {
        plan_key: `credits_${credits}`,
        pack_credits: credits,
        pixi_user_id: session.user.id,
      });

      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: any) {
      toast({
        title: "שגיאה",
        description: err.message || "אירעה שגיאה ברכישה",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyCheckout = async (checkoutId: string) => {
    return polarCheckout("verify_checkout", { checkout_id: checkoutId });
  };

  return { startSubscription, buyCredits, verifyCheckout, loading };
}
