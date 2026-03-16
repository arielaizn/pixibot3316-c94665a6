import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useWhatsAppHandoff = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const initiateHandoff = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("pixi-handoff");

      if (error) throw error;

      const token = data?.handoff_token;
      if (!token) throw new Error("No token received");

      const whatsappUrl = `https://wa.me/972525515776?text=${encodeURIComponent(token)}`;
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Handoff failed:", err);
      toast({
        title: "שגיאה",
        description: "לא הצלחנו ליצור קישור מאובטח. נסו שוב.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return { initiateHandoff, loading };
};
