import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useDirection } from "@/contexts/DirectionContext";

interface HandoffResponse {
  token: string;
  expiresAt: string;
  whatsappUrl: string;
}

export const useWhatsAppHandoff = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { isRTL } = useDirection();

  const initiateHandoff = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke<HandoffResponse>(
        "pixi-handoff",
        { body: { language: isRTL ? "he" : "en" } }
      );

      if (error) throw error;
      if (!data?.whatsappUrl) throw new Error("No handoff URL received");

      window.open(data.whatsappUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Handoff failed:", err);
      toast({
        title: isRTL ? "שגיאה" : "Error",
        description: isRTL
          ? "לא הצלחנו ליצור קישור מאובטח. נסו שוב."
          : "We couldn't create a secure link. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return { initiateHandoff, loading };
};
