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
    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-luxury-md ${
      isUser
        ? "rounded-bl-md bg-gradient-to-br from-primary to-primary/80 text-primary-foreground"
        : "rounded-br-md glass-morphism text-card-foreground"
    }`}>
      {children}
    </div>
  </motion.div>
);

const HeroSection = () => {
  const { t } = useDirection();

  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-accent/8 animate-gradient-drift" />
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-luxury-purple/3 to-luxury-gold/3" />
      <FloatingParticles count={15} />

      <div className="container relative mx-auto px-4">
        <div className="flex flex-col items-center gap-12 md:flex-row md:gap-16">
          <motion.div
            className="flex-1 text-center md:text-right"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight md:text-5xl lg:text-6xl">
              <span className="text-foreground">{t("hero.title1")}</span>
              <br />
              <span className="gradient-text">{t("hero.title2")}</span>
            </h1>
            <motion.p
              className="mb-8 text-lg text-muted-foreground md:text-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              {t("hero.subtitle")}
            </motion.p>
            <motion.div
              className="flex flex-col items-center gap-4 md:flex-row md:items-start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <Button asChild size="lg" variant="luxury" className="rounded-full px-10 text-lg">
                <Link to="/signup">{t("hero.cta")}</Link>
              </Button>
            </motion.div>
            <motion.p
              className="mt-4 text-sm text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              {t("hero.noCreditCard")}
            </motion.p>
          </motion.div>

          <motion.div
            className="flex-1 flex justify-center"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="relative w-full max-w-sm">
              {/* Glow behind card */}
              <div className="absolute -inset-4 rounded-[32px] bg-gradient-to-br from-primary/20 via-accent/10 to-primary/20 blur-2xl opacity-60" />
              
              <div className="relative rounded-luxury-xl border-2 border-border/50 bg-card/95 p-4 shadow-luxury-xl backdrop-blur-sm">
                <div className="mb-4 flex items-center gap-3 rounded-luxury-lg bg-gradient-to-r from-primary/15 to-accent/10 px-3 py-2">
                  <motion.img
                    src={mascot}
                    alt="Pixi"
                    className="h-8 w-8 animate-float"
                    animate={{ rotate: [0, -5, 5, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <div>
                    <p className="text-sm font-bold text-foreground">Pixi AI</p>
                    <p className="text-xs text-primary">{t("hero.chatOnline")}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <ChatBubble isUser delay={0.6}>
                    {t("hero.chatUser")}
                  </ChatBubble>
                  <ChatBubble delay={1.1}>
                    {t("hero.chatBot1")}
                  </ChatBubble>
                  <ChatBubble delay={1.6}>
                    <p className="mb-2">{t("hero.chatBot2")}</p>
                    <div className="relative overflow-hidden rounded-luxury-lg bg-foreground/5 aspect-video flex items-center justify-center border border-border/50">
                      <motion.div
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-luxury-lg"
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Play className="h-5 w-5" />
                      </motion.div>
                      <div className="absolute flex h-10 w-10 items-center justify-center">
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
