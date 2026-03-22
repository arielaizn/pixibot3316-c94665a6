import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useDirection } from "@/contexts/DirectionContext";
import { lovable } from "@/integrations/lovable";
import { Loader2, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import mascot from "@/assets/pixi-mascot.png";

const AdminLoginPage = () => {
  const { user, loading: authLoading, signIn } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminAuth();
  const { t } = useDirection();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (authLoading || adminLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (user && isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (user && !adminLoading && !isAdmin) {
    return <Navigate to="/not-admin" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast({ title: t("admin.login.error"), description: t("admin.login.errorDesc"), variant: "destructive" });
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/admin",
    });
    if (result.error) {
      toast({ title: t("admin.login.error"), description: String(result.error), variant: "destructive" });
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background relative overflow-hidden px-4">
      {/* Gradient Mesh Background */}
      <div className="absolute inset-0 animate-gradient-mesh bg-gradient-to-br from-primary/10 via-background to-accent/10" />

      <div className="w-full max-w-md relative z-10">
        <div className="mb-8 flex flex-col items-center gap-3 animate-luxury-fade-up">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 animate-float">
            <Shield className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-3xl font-cal-sans text-foreground">Pixi Admin</h1>
          <p className="text-sm text-muted-foreground">{t("admin.login.desc")}</p>
        </div>

        <Card variant="glass" className="p-8 shadow-luxury-lg rounded-luxury-lg animate-luxury-fade-up">
          <Button
            variant="luxury-outline"
            className="mb-6 w-full gap-3 py-6 text-base font-medium"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            {t("login.google")}
          </Button>

          <div className="mb-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">{t("login.or")}</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("login.email")}</Label>
              <Input variant="luxury" id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@pixi.com" dir="ltr" className="text-left" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("login.password")}</Label>
              <Input variant="luxury" id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" dir="ltr" className="text-left" required />
            </div>
            <Button variant="luxury" type="submit" className="w-full py-6 text-base font-bold shadow-luxury-md" disabled={loading}>
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : t("admin.login.submit")}
            </Button>
          </form>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:underline">{t("admin.login.backToSite")}</Link>
        </p>
      </div>
    </div>
  );
};

export default AdminLoginPage;
