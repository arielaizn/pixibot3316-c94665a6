import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Construction, Home } from "lucide-react";

const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
    {/* Gradient Mesh Background */}
    <div className="absolute inset-0 animate-gradient-mesh bg-gradient-to-br from-primary/10 via-background to-accent/10" />

    {/* Main Card */}
    <Card variant="glow" className="relative z-10 p-12 max-w-2xl mx-4 animate-luxury-fade-up shadow-luxury-lg">
      {/* Construction Icon */}
      <div className="flex justify-center mb-6">
        <Construction className="w-24 h-24 text-primary animate-float" />
      </div>

      {/* Title with gradient */}
      <h1 className="text-5xl font-cal-sans text-center mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
        {title || "בקרוב..."}
      </h1>

      {/* Message */}
      <p className="text-xl text-muted-foreground text-center mb-8">
        אנחנו עובדים קשה כדי להביא לך תכונות חדשות ומרגשות 🚀
      </p>

      {/* CTA Buttons */}
      <div className="flex justify-center gap-4">
        <Button variant="luxury" asChild>
          <Link to="/dashboard">
            <Home className="ml-2" />
            חזור לדשבורד
          </Link>
        </Button>
        <Button variant="luxury-outline" asChild>
          <Link to="/">דף הבית</Link>
        </Button>
      </div>
    </Card>
  </div>
);

export default PlaceholderPage;
