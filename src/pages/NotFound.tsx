import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useDirection } from "@/contexts/DirectionContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const { t } = useDirection();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Gradient Mesh Background */}
      <div className="absolute inset-0 animate-gradient-mesh bg-gradient-to-br from-primary/10 via-background to-accent/10" />

      {/* Main Card */}
      <Card variant="glass" className="relative z-10 p-12 max-w-2xl mx-4 animate-luxury-fade-up shadow-luxury-lg">
        {/* 404 Title with gradient */}
        <h1 className="text-9xl font-bold bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent text-center mb-4">
          404
        </h1>

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <AlertCircle className="w-24 h-24 text-primary animate-float" />
        </div>

        {/* Message */}
        <h2 className="text-3xl font-cal-sans text-center mb-4">
          {t("notFound.title")}
        </h2>
        <p className="text-muted-foreground text-center mb-8 text-lg">
          {t("notFound.message")}
        </p>

        {/* CTA */}
        <div className="flex justify-center">
          <Button variant="luxury" size="lg" asChild>
            <Link to="/">
              <Home className="ml-2" />
              {t("notFound.back")}
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default NotFound;
