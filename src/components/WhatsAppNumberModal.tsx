import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDirection } from "@/contexts/DirectionContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PHONE_REGEX = /^\+\d{10,15}$/;

interface Props {
  onComplete: () => void;
}

const WhatsAppNumberModal = ({ onComplete }: Props) => {
  const { user } = useAuth();
  const { t } = useDirection();
  const { toast } = useToast();
  const [phone, setPhone] = useState("+972");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleaned = phone.trim();
    if (!PHONE_REGEX.test(cleaned)) {
      setError(t("whatsapp.invalid"));
      return;
    }

    if (!user) return;

    setLoading(true);
    const { error: dbError } = await supabase
      .from("profiles")
      .update({ whatsapp_number: cleaned })
      .eq("user_id", user.id);

    setLoading(false);

    if (dbError) {
      toast({ title: t("common.error"), description: dbError.message, variant: "destructive" });
      return;
    }

    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-2xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <MessageCircle className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">{t("whatsapp.title")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("whatsapp.desc")}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="whatsapp">{t("whatsapp.label")}</Label>
            <Input
              id="whatsapp"
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setError("");
              }}
              placeholder="+972525551234"
              dir="ltr"
              className="rounded-xl py-5 text-left text-lg tracking-wide"
              required
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary py-6 text-base font-bold text-primary-foreground hover:bg-primary/90"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                {t("whatsapp.saving")}
              </span>
            ) : (
              t("whatsapp.submit")
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default WhatsAppNumberModal;
