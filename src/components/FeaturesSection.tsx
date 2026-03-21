import { motion } from "framer-motion";
import { Zap, Sparkles, MessageCircle } from "lucide-react";
import StaggerChildren, { staggerItem } from "@/components/motion/StaggerChildren";
import ScrollReveal from "@/components/motion/ScrollReveal";
import { useDirection } from "@/contexts/DirectionContext";

const FeaturesSection = () => {
  const { t } = useDirection();

  const features = [
    { icon: Zap, title: t("features.fast.title"), desc: t("features.fast.desc") },
    { icon: Sparkles, title: t("features.ai.title"), desc: t("features.ai.desc") },
    { icon: MessageCircle, title: t("features.whatsapp.title"), desc: t("features.whatsapp.desc") },
  ];

  return (
    <section className="relative py-24 bg-muted/30 overflow-hidden">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent" />
      
      <div className="container relative mx-auto px-4">
        <ScrollReveal>
          <h2 className="mb-4 text-center text-3xl font-extrabold text-foreground md:text-4xl">{t("features.title")}</h2>
          <div className="mx-auto mb-12 h-1 w-16 rounded-full bg-gradient-to-r from-primary to-accent" />
        </ScrollReveal>
        <StaggerChildren className="grid gap-8 md:grid-cols-3" stagger={0.15}>
          {features.map((f, i) => (
            <motion.div
              key={i}
              variants={staggerItem}
              className="group luxury-card luxury-border-gradient rounded-luxury-xl p-8"
            >
              <motion.div
                className="mb-5 flex h-14 w-14 items-center justify-center rounded-luxury-lg bg-gradient-to-br from-primary/15 to-accent/10 text-primary ring-4 ring-primary/10 transition-all duration-300 group-hover:from-primary group-hover:to-primary/80 group-hover:text-primary-foreground group-hover:ring-primary/30 group-hover:shadow-luxury-md"
                whileHover={{ rotate: [0, -10, 10, 0], transition: { duration: 0.4 } }}
              >
                <f.icon className="h-6 w-6" />
              </motion.div>
              <h3 className="mb-2 text-xl font-bold text-foreground">{f.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </StaggerChildren>
      </div>
    </section>
  );
};

export default FeaturesSection;
