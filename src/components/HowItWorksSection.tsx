import { motion } from "framer-motion";
import { UserPlus, MessageSquare, Video } from "lucide-react";
import ScrollReveal from "@/components/motion/ScrollReveal";

const steps = [
  { icon: UserPlus, title: "הירשם בחינם" },
  { icon: MessageSquare, title: "ספר לנו מה אתה רוצה ב-WhatsApp" },
  { icon: Video, title: "קבל את הסרטון המוגמר" },
];

const HowItWorksSection = () => (
  <section className="py-20">
    <div className="container mx-auto px-4">
      <ScrollReveal>
        <h2 className="mb-16 text-center text-3xl font-bold text-foreground md:text-4xl">איך זה עובד?</h2>
      </ScrollReveal>
      <div className="flex flex-col items-center gap-8 md:flex-row md:justify-center md:gap-0">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center">
            <ScrollReveal delay={i * 0.15} direction="up">
              <div className="flex flex-col items-center text-center">
                <motion.div
                  className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary shadow-sm"
                  whileHover={{ scale: 1.1, boxShadow: "0 0 20px hsl(145 63% 49% / 0.3)" }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <step.icon className="h-7 w-7" />
                </motion.div>
                <span className="mb-1 text-sm font-bold text-primary">שלב {i + 1}</span>
                <p className="max-w-[180px] text-sm font-medium text-foreground">{step.title}</p>
              </div>
            </ScrollReveal>
            {i < steps.length - 1 && (
              <motion.div
                className="mx-8 hidden h-0.5 w-16 bg-border md:block"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + i * 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default HowItWorksSection;
