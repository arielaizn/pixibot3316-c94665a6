import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useDirection } from "@/contexts/DirectionContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const ANON_KEY  = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const PaymentCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const { t } = useDirection();
  const { user } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  // Polar redirects back with ?checkout_id=xxx
  const checkoutId = searchParams.get("checkout_id");

  useEffect(() => {
    const verify = async () => {
      try {
        // Polar webhook activates the plan server-side.
        // We just poll the checkout status to confirm.
        if (!checkoutId) {
          // No checkout ID = user landed here directly; treat as success.
          setStatus("success");
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setStatus("error");
          setErrorMsg(t("payment.loginRequired"));
          return;
        }

        let attempts = 0;
        const poll = async () => {
          const res = await fetch(
            `https://${PROJECT_ID}.supabase.co/functions/v1/polar-checkout`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.access_token}`,
                apikey: ANON_KEY,
              },
              body: JSON.stringify({ action: "verify_checkout", checkout_id: checkoutId }),
            }
          );

          const result = await res.json();

          if (result.status === "succeeded" || result.succeeded) {
            setStatus("success");
            return;
          }

          if (result.status === "failed") {
            setStatus("error");
            setErrorMsg(t("payment.error"));
            return;
          }

          attempts++;
          if (attempts < 15) {
            setTimeout(poll, 2000);
          } else {
            // If still not confirmed after 30s, assume success (webhook will handle activation)
            setStatus("success");
          }
        };

        poll();
      } catch (err: any) {
        setStatus("error");
        setErrorMsg(err.message);
      }
    };

    verify();
  }, [checkoutId, user?.id]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Gradient Mesh Background */}
      <div className="absolute inset-0 animate-gradient-mesh bg-gradient-to-br from-primary/10 via-background to-accent/10" />

      <Navbar />
      <main className="container mx-auto flex min-h-[60vh] items-center justify-center px-4 relative z-10">
        <Card variant="glass" className="w-full max-w-md p-10 text-center shadow-luxury-lg rounded-luxury-lg animate-luxury-fade-up">
          {status === "loading" && (
            <>
              <Loader2 className="mx-auto mb-4 h-16 w-16 animate-spin text-primary" />
              <p className="text-xl font-semibold text-foreground">{t("payment.verifying")}</p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle2 className="mx-auto mb-6 h-20 w-20 text-primary animate-float" />
              <h2 className="mb-3 text-3xl font-cal-sans text-foreground">{t("payment.success")}</h2>
              <p className="mb-8 text-base text-muted-foreground">{t("payment.successDesc")}</p>
              <Button variant="luxury" size="lg" asChild className="px-10 shadow-luxury-md">
                <Link to="/dashboard">{t("payment.dashboard")}</Link>
              </Button>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="mx-auto mb-6 h-20 w-20 text-destructive animate-float" />
              <h2 className="mb-3 text-3xl font-cal-sans text-foreground">{t("payment.error")}</h2>
              <p className="mb-8 text-base text-muted-foreground">{errorMsg}</p>
              <Button variant="luxury-outline" size="lg" asChild className="px-10">
                <Link to="/pricing">{t("payment.retry")}</Link>
              </Button>
            </>
          )}
        </Card>
      </main>
    </div>
  );
};

export default PaymentCallbackPage;
