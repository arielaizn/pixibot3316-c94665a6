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

const PLAN_CREDITS: Record<string, number> = {
  starter: 3,
  creator: 7,
  pro: 15,
  business: 35,
  enterprise: 80,
};

const PaymentCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const { isRTL } = useDirection();
  const { user } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  // Params from Sumit redirect back
  const pixiUserId = searchParams.get("pixi_user_id");
  const plan = searchParams.get("plan");
  const cycle = searchParams.get("cycle");
  const paymentId = searchParams.get("payment_id"); // legacy support

  useEffect(() => {
    const activate = async () => {
      try {
        // Determine user ID: from URL param or from current session
        const userId = pixiUserId || user?.id;
        if (!userId) {
          setStatus("error");
          setErrorMsg(isRTL ? "לא ניתן לזהות את המשתמש" : "Could not identify user");
          return;
        }

        // If we have a plan from Sumit redirect, call the activation endpoint
        if (plan) {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            setStatus("error");
            setErrorMsg(isRTL ? "יש להתחבר כדי להפעיל את המנוי" : "Please log in to activate your subscription");
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

        // Legacy: poll payment_id status
        if (paymentId) {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            setStatus("error");
            setErrorMsg(isRTL ? "יש להתחבר" : "Please log in");
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
            else setStatus("success"); // optimistic after timeout
          };
          poll();
          return;
        }

        // No plan or payment_id — can't proceed
        setStatus("error");
        setErrorMsg(isRTL ? "פרטי תשלום חסרים" : "Missing payment details");
      } catch (err: any) {
        setStatus("error");
        setErrorMsg(err.message);
      }
    };

    activate();
  }, [pixiUserId, plan, cycle, paymentId, user?.id]);

  const t = {
    verifying: isRTL ? "מפעיל את המנוי שלכם..." : "Activating your subscription...",
    success: isRTL ? "התשלום בוצע בהצלחה!" : "Payment successful!",
    successDesc: isRTL
      ? "התוכנית שלכם עודכנה. חשבונית תישלח למייל."
      : "Your plan has been updated. An invoice will be sent to your email.",
    error: isRTL ? "שגיאה באימות התשלום" : "Payment verification failed",
    dashboard: isRTL ? "לדשבורד" : "Go to Dashboard",
    retry: isRTL ? "חזרה לתוכניות" : "Back to Plans",
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto flex min-h-[60vh] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          {status === "loading" && (
            <>
              <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary" />
              <p className="text-lg font-semibold text-foreground">{t.verifying}</p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-primary" />
              <h2 className="mb-2 text-2xl font-extrabold text-foreground">{t.success}</h2>
              <p className="mb-6 text-sm text-muted-foreground">{t.successDesc}</p>
              <Button asChild className="rounded-xl bg-primary px-8 py-5 text-base font-bold text-primary-foreground hover:bg-primary/90">
                <Link to="/dashboard">{t.dashboard}</Link>
              </Button>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
              <h2 className="mb-2 text-2xl font-extrabold text-foreground">{t.error}</h2>
              <p className="mb-6 text-sm text-muted-foreground">{errorMsg}</p>
              <Button asChild variant="outline" className="rounded-xl px-8 py-5">
                <Link to="/pricing">{t.retry}</Link>
              </Button>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default PaymentCallbackPage;
