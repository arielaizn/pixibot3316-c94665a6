import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useDirection } from "@/contexts/DirectionContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const PaymentCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const { t } = useDirection();
  const { user } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  const pixiUserId = searchParams.get("pixi_user_id");
  const plan = searchParams.get("plan");
  const cycle = searchParams.get("cycle");
  const paymentId = searchParams.get("payment_id");

  useEffect(() => {
    const activate = async () => {
      try {
        const userId = pixiUserId || user?.id;
        if (!userId) {
          setStatus("error");
          setErrorMsg(t("payment.noUser"));
          return;
        }

        if (plan) {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            setStatus("error");
            setErrorMsg(t("payment.loginRequired"));
            return;
          }

          const res = await fetch(
            `https://${PROJECT_ID}.supabase.co/functions/v1/sumit-payment`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.access_token}`,
                apikey: ANON_KEY,
              },
              body: JSON.stringify({
                action: "activate_plan",
                plan_key: plan,
                billing_cycle: cycle || "monthly",
                pixi_user_id: userId,
              }),
            }
          );

          const result = await res.json();
          if (!res.ok) throw new Error(result.error || "Activation failed");

          setStatus("success");
          return;
        }

        if (paymentId) {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            setStatus("error");
            setErrorMsg(t("payment.loginRequired"));
            return;
          }

          let attempts = 0;
          const poll = async () => {
            const res = await fetch(
              `https://${PROJECT_ID}.supabase.co/functions/v1/sumit-payment`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${session.access_token}`,
                  apikey: ANON_KEY,
                },
                body: JSON.stringify({ action: "verify_payment", payment_id: paymentId }),
              }
            );
            const result = await res.json();
            if (result.status === "completed" || result.status === "already_completed") {
              setStatus("success");
              return;
            }
            attempts++;
            if (attempts < 15) setTimeout(poll, 3000);
            else setStatus("success");
          };
          poll();
          return;
        }

        setStatus("error");
        setErrorMsg(t("payment.missingDetails"));
      } catch (err: any) {
        setStatus("error");
        setErrorMsg(err.message);
      }
    };

    activate();
  }, [pixiUserId, plan, cycle, paymentId, user?.id]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto flex min-h-[60vh] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          {status === "loading" && (
            <>
              <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary" />
              <p className="text-lg font-semibold text-foreground">{t("payment.verifying")}</p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-primary" />
              <h2 className="mb-2 text-2xl font-extrabold text-foreground">{t("payment.success")}</h2>
              <p className="mb-6 text-sm text-muted-foreground">{t("payment.successDesc")}</p>
              <Button asChild className="rounded-xl bg-primary px-8 py-5 text-base font-bold text-primary-foreground hover:bg-primary/90">
                <Link to="/dashboard">{t("payment.dashboard")}</Link>
              </Button>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
              <h2 className="mb-2 text-2xl font-extrabold text-foreground">{t("payment.error")}</h2>
              <p className="mb-6 text-sm text-muted-foreground">{errorMsg}</p>
              <Button asChild variant="outline" className="rounded-xl px-8 py-5">
                <Link to="/pricing">{t("payment.retry")}</Link>
              </Button>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default PaymentCallbackPage;
