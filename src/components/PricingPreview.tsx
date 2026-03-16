import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const PricingPreview = () => (
  <section className="py-20 bg-muted/30">
    <div className="container mx-auto px-4 text-center">
      <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">התחל חינם, שדרג בהמשך</h2>
      <p className="mb-8 text-lg text-muted-foreground">סרטון ראשון חינם — שדרוג רק אם צריך</p>
      <Button asChild variant="outline" size="lg" className="rounded-full border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all">
        <Link to="/pricing">ראה תוכניות ומחירים</Link>
      </Button>
    </div>
  </section>
);

export default PricingPreview;
