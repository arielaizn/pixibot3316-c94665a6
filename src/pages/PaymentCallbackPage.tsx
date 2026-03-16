import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { usePayment } from "@/hooks/usePayment";
import { useDirection } from "@/contexts/DirectionContext";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

const PaymentCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const { verifyPayment } = usePayment();
  const { isRTL } = useDirection();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  const paymentId = searchParams.get("payment_id");

  useEffect(() => {
    if (!paymentId) {
      setStatus("error");
      setErrorMsg(isRTL ? "מזהה תשלום חסר" : "Missing payment ID");
      return;
    }

    // Poll payment status — webhook activates it server-side
    let attempts = 0;
    const maxAttempts = 20;
    const pollInterval = 3000;

    const poll = async () => {
      try {
        const result = await verifyPayment(paymentId);
        if (result.status === "completed" || result.status === "already_completed") {
          setStatus("success");
          return;
        }
        if (result.status === "failed" || result.status === "amount_mismatch") {
          setStatus("error");
          setErrorMsg(isRTL ? "התשלום נכשל" : "Payment failed");
          return;
        }
        // Still pending — retry
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, pollInterval);
        } else {
          // After ~60s, show success optimistically (webhook may still be processing)
          setStatus("success");
        }
      } catch (err: any) {
        setStatus("error");
        setErrorMsg(err.message);
      }
    };

    poll();
  }, [paymentId]);

  const t = {
    verifying: isRTL ? "מאמת את התשלום..." : "Verifying payment...",
    success: isRTL ? "התשלום בוצע בהצלחה!" : "Payment successful!",
    successDesc: isRTL
      ? "התוכנית שלכם עודכנה. חשבונית נשלחה למייל."
      : "Your plan has been updated. An invoice has been sent to your email.",
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
