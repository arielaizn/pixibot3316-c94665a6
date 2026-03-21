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
    <section className="py-32 bg-muted/20 relative overflow-hidden">
      {/* Premium background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      <div className="absolute inset-0 texture-noise" />

      <div className="container mx-auto px-4 relative">
        <ScrollReveal>
          <h2 className="mb-16 text-center text-4xl md:text-5xl font-extrabold text-foreground">
            {t("features.title")}
          </h2>
        </ScrollReveal>

        <StaggerChildren className="grid gap-8 md:grid-cols-3 max-w-premium mx-auto" stagger={0.15}>
          {features.map((f, i) => (
            <motion.div
              key={i}
              variants={staggerItem}
              className="group"
            >
              {/* Premium glass card */}
              <div className="h-full rounded-luxury-lg border border-border/30 bg-card/40 backdrop-blur-xl p-10 shadow-luxury-md hover:shadow-luxury-lg hover:-translate-y-2 hover:border-primary/30 transition-all duration-500 ease-out relative overflow-hidden">
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-luxury-lg" />

                <div className="relative z-10">
                  {/* Icon with gradient background and glow */}
                  <motion.div
                    className="mb-6 flex h-16 w-16 items-center justify-center rounded-luxury bg-gradient-to-br from-primary/20 to-accent/20 text-primary border border-primary/20 shadow-lg group-hover:shadow-primary/30 transition-all duration-300"
                    whileHover={{
                      rotate: [0, -8, 8, 0],
                      scale: 1.1,
                    }}
                    transition={{ duration: 0.5 }}
                  >
                    <f.icon className="h-7 w-7" />
                  </motion.div>

                  <h3 className="mb-3 text-2xl font-bold text-foreground">
                    {f.title}
                  </h3>
                  <p className="text-base text-muted-foreground leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </StaggerChildren>
      </div>
    </section>
  );
};

export default FeaturesSection;
