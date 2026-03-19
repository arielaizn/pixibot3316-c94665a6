import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDirection } from "@/contexts/DirectionContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import mascot from "@/assets/pixi-mascot.png";

const ResetPasswordPage = () => {
  const { isRTL } = useDirection();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({
        title: isRTL ? "שגיאה" : "Error",
        description: isRTL ? "הסיסמה חייבת להכיל לפחות 6 תווים" : "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }
    if (password !== confirm) {
      toast({
        title: isRTL ? "שגיאה" : "Error",
        description: isRTL ? "הסיסמאות לא תואמות" : "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast({
        title: isRTL ? "שגיאה" : "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setDone(true);
      setTimeout(() => navigate("/dashboard"), 2000);
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
          {done ? (
            <div className="text-center space-y-4">
              <CheckCircle className="mx-auto h-12 w-12 text-primary" />
              <h1 className="text-xl font-bold text-foreground">
                {isRTL ? "הסיסמה עודכנה!" : "Password Updated!"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isRTL ? "מעביר אותך לדשבורד..." : "Redirecting to dashboard..."}
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6 text-center">
                <h1 className="text-2xl font-bold text-foreground">
                  {isRTL ? "סיסמה חדשה" : "New Password"}
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  {isRTL ? "הזן סיסמה חדשה לחשבון שלך" : "Enter a new password for your account"}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">{isRTL ? "סיסמה חדשה" : "New Password"}</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    dir="ltr"
                    className="rounded-xl py-5 text-left"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm">{isRTL ? "אימות סיסמה" : "Confirm Password"}</Label>
                  <Input
                    id="confirm"
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••••"
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
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (isRTL ? "עדכן סיסמה" : "Update Password")}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
