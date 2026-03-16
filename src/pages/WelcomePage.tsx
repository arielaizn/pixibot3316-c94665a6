import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, MessageCircle, Loader2 } from "lucide-react";
import mascot from "@/assets/pixi-mascot.png";

const WelcomePage = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signup" replace />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      {/* Logo */}
      <div className="mb-10 flex justify-center">
        <Link to="/" className="flex items-center gap-2">
          <img src={mascot} alt="Pixi" className="h-10 w-10" />
          <span className="text-2xl font-bold text-foreground">Pixi</span>
        </Link>
      </div>

      {/* Hero */}
      <div className="mb-10 text-center">
        <img src={mascot} alt="Pixi" className="mx-auto mb-4 h-20 w-20 animate-float" />
        <h1 className="text-3xl font-extrabold text-foreground md:text-4xl">🎉 אתם בפנים</h1>
        <p className="mt-3 text-lg text-muted-foreground">איך תרצו להמשיך?</p>
      </div>

      {/* Cards */}
      <div className="grid w-full max-w-3xl gap-6 md:grid-cols-2">
        {/* Dashboard card */}
        <div className="flex flex-col rounded-2xl border border-border bg-card p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <LayoutDashboard className="h-6 w-6" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-foreground">כניסה לאזור האישי</h2>
          <p className="mb-6 flex-1 text-sm text-muted-foreground">
            נהלו את הפרויקטים שלכם, צפו בסרטונים ועקבו אחרי ההתקדמות
          </p>
          <Button asChild variant="outline" className="w-full rounded-xl border-accent py-5 text-accent hover:bg-accent hover:text-accent-foreground">
            <Link to="/dashboard">כניסה לדשבורד</Link>
          </Button>
        </div>

        {/* WhatsApp card */}
        <div className="flex flex-col rounded-2xl border border-border bg-card p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <MessageCircle className="h-6 w-6" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-foreground">המשיכו ל-Pixi ב-WhatsApp</h2>
          <p className="mb-2 text-sm text-muted-foreground">
            שלחו הודעה למספר הייעודי שלנו והתחילו ליצור סרטונים מיד
          </p>
          <p className="mb-6 text-sm font-semibold text-foreground" dir="ltr">+972 52-551-5776</p>
          <Button asChild className="w-full rounded-xl bg-primary py-5 text-base font-bold text-primary-foreground hover:bg-primary/90">
            <a href="https://wa.me/972525515776" target="_blank" rel="noopener noreferrer">
              המשיכו ל-WhatsApp
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
