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
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <ScrollReveal>
          <h2 className="mb-12 text-center text-3xl font-bold text-foreground md:text-4xl">{t("features.title")}</h2>
        </ScrollReveal>
        <StaggerChildren className="grid gap-6 md:grid-cols-3" stagger={0.15}>
          {features.map((f, i) => (
            <motion.div
              key={i}
              variants={staggerItem}
              className="group card-hover rounded-2xl border border-border bg-card p-8 shadow-sm"
            >
              <motion.div
                className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground"
                whileHover={{ rotate: [0, -10, 10, 0], transition: { duration: 0.4 } }}
              >
                <f.icon className="h-6 w-6" />
              </motion.div>
              <h3 className="mb-2 text-xl font-bold text-foreground">{f.title}</h3>
              <p className="text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </StaggerChildren>
      </div>
    </section>
  );
};

export default FeaturesSection;
