import { useState, useEffect } from "react";
import { Link, useNavigate, Navigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useDirection } from "@/contexts/DirectionContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import mascot from "@/assets/pixi-mascot.png";

const PHONE_REGEX = /^\+\d{10,15}$/;

const SignupPage = () => {
  const { user, loading: authLoading, signUp } = useAuth();
  const { t } = useDirection();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [whatsapp, setWhatsapp] = useState("+972");
  const [whatsappError, setWhatsappError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const refCode = searchParams.get("ref");
    if (refCode) {
      localStorage.setItem("pixi_referral_code", refCode);
    }
  }, [searchParams]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWhatsappError("");

    if (!fullName.trim() || !email.trim() || !password.trim()) return;

    const cleanPhone = whatsapp.trim();
    if (!PHONE_REGEX.test(cleanPhone)) {
      setWhatsappError(t("signup.whatsappError"));
      return;
    }

    setLoading(true);
    const { error } = await signUp(email, password, fullName);

    if (error) {
      toast({ title: t("signup.error"), description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    localStorage.setItem("pixi_pending_whatsapp", cleanPhone);

    toast({ title: t("signup.success"), description: t("signup.successDesc") });
    setLoading(false);
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) {
      toast({ title: t("login.error"), description: error.message, variant: "destructive" });
      setLoading(false);
    }
    // OAuth will redirect to Google, so no need to handle success here
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
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-foreground">{t("signup.title")}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{t("signup.subtitle")}</p>
          </div>

          <Button
            variant="outline"
            className="mb-6 w-full gap-3 rounded-xl border-border py-6 text-base font-medium"
            onClick={handleGoogleSignup}
            disabled={loading}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            {t("signup.google")}
          </Button>

          <div className="mb-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">{t("signup.or")}</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">{t("signup.fullName")}</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={t("signup.fullNamePlaceholder")} className="rounded-xl py-5" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("signup.email")}</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@email.com" dir="ltr" className="rounded-xl py-5 text-left" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">{t("signup.whatsapp")}</Label>
              <Input
                id="whatsapp"
                type="tel"
                value={whatsapp}
                onChange={(e) => { setWhatsapp(e.target.value); setWhatsappError(""); }}
                placeholder="+972525551234"
                dir="ltr"
                className="rounded-xl py-5 text-left tracking-wide"
                required
              />
              {whatsappError && <p className="text-sm text-destructive">{whatsappError}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("signup.password")}</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" dir="ltr" className="rounded-xl py-5 text-left" minLength={6} required />
            </div>

            <Button type="submit" className="w-full rounded-xl bg-primary py-6 text-base font-bold text-primary-foreground hover:bg-primary/90" disabled={loading}>
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : t("signup.submit")}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t("signup.hasAccount")}{" "}
            <Link to="/login" className="font-semibold text-primary hover:underline">{t("signup.loginLink")}</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
