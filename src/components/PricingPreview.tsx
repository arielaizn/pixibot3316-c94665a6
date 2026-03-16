import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ScrollReveal from "@/components/motion/ScrollReveal";
import { useDirection } from "@/contexts/DirectionContext";

const PricingPreview = () => {
  const { t } = useDirection();

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 text-center">
        <ScrollReveal>
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">{t("pricingPreview.title")}</h2>
          <p className="mb-8 text-lg text-muted-foreground">{t("pricingPreview.subtitle")}</p>
        </ScrollReveal>
        <ScrollReveal delay={0.15}>
          <Button asChild variant="outline" size="lg" className="btn-press rounded-full border-primary text-primary hover:bg-primary hover:text-primary-foreground">
            <Link to="/pricing">{t("pricingPreview.cta")}</Link>
          </Button>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default PricingPreview;
