import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDirection } from "@/contexts/DirectionContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import mascot from "@/assets/pixi-mascot.png";

const ForgotPasswordPage = () => {
  const { isRTL } = useDirection();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);
    if (error) {
      toast({
        title: isRTL ? "שגיאה" : "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setSent(true);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <img src={mascot} alt="Pixi" className="fixed bottom-8 left-8 h-16 w-16 animate-float opacity-60 hidden md:block" />

      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Link to="/" className="flex items-center gap-2">
            <img src={mascot} alt="Pixi" className="h-10 w-10" />
            <span className="text-2xl font-bold text-foreground">Pixi</span>
          </Link>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-lg">
          {sent ? (
            <div className="text-center space-y-4">
              <CheckCircle className="mx-auto h-12 w-12 text-primary" />
              <h1 className="text-xl font-bold text-foreground">
                {isRTL ? "המייל נשלח!" : "Email Sent!"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isRTL
                  ? "שלחנו לך קישור לאיפוס הסיסמה. בדוק את תיבת המייל."
                  : "We sent you a password reset link. Check your inbox."}
              </p>
              <Link to="/login">
                <Button variant="outline" className="mt-4">
                  {isRTL ? "חזרה להתחברות" : "Back to Login"}
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6 text-center">
                <h1 className="text-2xl font-bold text-foreground">
                  {isRTL ? "שכחת סיסמה?" : "Forgot Password?"}
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  {isRTL
                    ? "הזן את כתובת המייל שלך ונשלח לך קישור לאיפוס"
                    : "Enter your email and we'll send you a reset link"}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{isRTL ? "אימייל" : "Email"}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    dir="ltr"
                    className="rounded-xl py-5 text-left"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full rounded-xl bg-primary py-6 text-base font-bold text-primary-foreground hover:bg-primary/90"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (isRTL ? "שלח קישור איפוס" : "Send Reset Link")}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                <Link to="/login" className="font-semibold text-primary hover:underline">
                  {isRTL ? "חזרה להתחברות" : "Back to Login"}
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
