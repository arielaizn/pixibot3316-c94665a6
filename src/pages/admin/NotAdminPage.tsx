import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ShieldX } from "lucide-react";
import { useDirection } from "@/contexts/DirectionContext";

const NotAdminPage = () => {
  const { t } = useDirection();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background relative overflow-hidden px-4 text-center">
      {/* Gradient Mesh Background */}
      <div className="absolute inset-0 animate-gradient-mesh bg-gradient-to-br from-primary/10 via-background to-accent/10" />

      <Card variant="glass" className="relative z-10 p-12 max-w-md animate-luxury-fade-up shadow-luxury-lg">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 mx-auto animate-float">
          <ShieldX className="h-10 w-10 text-destructive" />
        </div>
        <h1 className="mb-3 text-4xl font-cal-sans text-foreground">{t("notAdmin.title")}</h1>
        <p className="mb-8 text-lg text-muted-foreground">{t("notAdmin.desc")}</p>
        <Button variant="luxury" size="lg" asChild className="px-10 shadow-luxury-md">
          <Link to="/">{t("notAdmin.back")}</Link>
        </Button>
      </Card>
    </div>
  );
};

export default NotAdminPage;
