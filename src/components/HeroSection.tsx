import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import FloatingParticles from "@/components/motion/FloatingParticles";
import { useDirection } from "@/contexts/DirectionContext";
import mascot from "@/assets/pixi-mascot.png";

const ChatBubble = ({ isUser, children, delay }: { isUser?: boolean; children: React.ReactNode; delay: number }) => (
  <motion.div
    className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    initial={{ opacity: 0, y: 16, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
  >
    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
      isUser
        ? "rounded-bl-md bg-primary text-primary-foreground"
        : "rounded-br-md bg-card text-card-foreground border border-border"
    }`}>
      {children}
    </div>
  </motion.div>
);

const HeroSection = () => {
  const { t } = useDirection();

  return (
    <section className="relative overflow-hidden py-24 md:py-32">
      {/* Multi-layer premium background */}
      <div className="absolute inset-0 -z-10">
        {/* Base mesh gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10 animate-gradient-mesh" />

        {/* Radial glow spots */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-mesh-drift" />
        <div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/15 rounded-full blur-3xl animate-mesh-drift"
          style={{ animationDelay: '5s' }}
        />

        {/* Noise texture overlay */}
        <div className="absolute inset-0 texture-noise" />
      </div>

      {/* Enhanced particles */}
      <FloatingParticles count={20} />

      <div className="container relative mx-auto px-4 max-w-premium">
        <div className="flex flex-col items-center gap-16 md:flex-row md:gap-20">
          {/* Text content with premium typography */}
          <motion.div
            className="flex-1 text-center md:text-right"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Large display heading with gradient text */}
            <h1 className="mb-8 text-5xl font-extrabold leading-tight md:text-6xl lg:text-7xl">
              {t("hero.title1")}
              <br />
              <span className="text-gradient-premium inline-block mt-2">
                {t("hero.title2")}
              </span>
            </h1>

            {/* Premium subtitle */}
            <motion.p
              className="mb-10 text-xl md:text-2xl text-muted-foreground font-medium leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.7 }}
            >
              {t("hero.subtitle")}
            </motion.p>

            {/* Premium CTA button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.7 }}
            >
              <Button
                asChild
                variant="luxury"
                size="luxury-lg"
                className="group"
              >
                <Link to="/signup">
                  <span className="relative z-10">{t("hero.cta")}</span>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-primary-glow to-accent opacity-0 group-hover:opacity-20 rounded-luxury-lg blur-xl"
                    initial={false}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </Link>
              </Button>
            </motion.div>

            {/* Badge with shimmer */}
            <motion.p
              className="mt-6 text-sm text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              {t("hero.noCreditCard")}
            </motion.p>
          </motion.div>

          {/* Premium demo card with glass effect */}
          <motion.div
            className="flex-1 flex justify-center"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.3 }}
          >
            <div className="relative w-full max-w-lg">
              {/* Glow halo effect */}
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/30 to-accent/30 rounded-luxury-xl blur-2xl opacity-50 animate-glow-pulse" />

              {/* Glass morphism card */}
              <div className="relative rounded-luxury-xl border border-border/30 bg-card/40 backdrop-blur-2xl p-8 shadow-luxury-lg">
                {/* Header with avatar */}
                <div className="mb-6 flex items-center gap-4 rounded-luxury bg-gradient-to-r from-primary/10 to-accent/10 px-4 py-3 border border-primary/20">
                  <motion.img
                    src={mascot}
                    alt="Pixi"
                    className="h-12 w-12 drop-shadow-lg"
                    animate={{
                      y: [0, -4, 0],
                      rotate: [0, -3, 3, 0]
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                  <div>
                    <p className="text-base font-bold text-foreground">Pixi AI</p>
                    <p className="text-sm text-primary font-semibold flex items-center gap-1">
                      <span className="inline-block w-2 h-2 bg-primary rounded-full animate-pulse" />
                      {t("hero.chatOnline")}
                    </p>
                  </div>
                </div>

                {/* Chat bubbles */}
                <div className="flex flex-col gap-4">
                  <ChatBubble isUser delay={0.6}>
                    {t("hero.chatUser")}
                  </ChatBubble>
                  <ChatBubble delay={1.1}>
                    {t("hero.chatBot1")}
                  </ChatBubble>
                  <ChatBubble delay={1.6}>
                    <p className="mb-3">{t("hero.chatBot2")}</p>
                    <div className="relative overflow-hidden rounded-xl bg-foreground/5 aspect-video flex items-center justify-center border border-border backdrop-blur-sm">
                      <motion.div
                        className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30"
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Play className="h-6 w-6" />
                      </motion.div>
                      <div className="absolute flex h-12 w-12 items-center justify-center">
                        <div className="absolute h-full w-full rounded-full bg-primary/30 animate-pulse-ring" />
                      </div>
                    </div>
                  </ChatBubble>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
