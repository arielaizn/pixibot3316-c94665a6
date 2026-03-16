import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function paymentAction(action: string, params: Record<string, any> = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const url = `https://${PROJECT_ID}.supabase.co/functions/v1/sumit-payment`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      apikey: ANON_KEY,
    },
    body: JSON.stringify({ action, ...params }),
  });

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
      const baseUrl = window.location.origin;
      const result = await paymentAction("open_terminal", {
        plan_key: planKey,
        billing_cycle: billingCycle,
        success_url: `${baseUrl}/payment/callback`,
        cancel_url: `${baseUrl}/pricing`,
      });

      if (result.paymentUrl) {
        window.location.href = result.paymentUrl;
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

  const buyCredits = async (credits: number, price: number) => {
    setLoading(true);
    try {
      const baseUrl = window.location.origin;
      const result = await paymentAction("open_terminal", {
        pack_credits: credits,
        pack_price: price,
        success_url: `${baseUrl}/payment/callback`,
        cancel_url: `${baseUrl}/pricing`,
      });

      if (result.paymentUrl) {
        window.location.href = result.paymentUrl;
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

  const verifyPayment = async (paymentId: string) => {
    return paymentAction("verify_payment", { payment_id: paymentId });
  };

  return { startSubscription, buyCredits, verifyPayment, loading };
}
