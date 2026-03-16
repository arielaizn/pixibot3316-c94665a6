import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import FloatingParticles from "@/components/motion/FloatingParticles";
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
  return (
    <section className="relative overflow-hidden py-16 md:py-24">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 animate-gradient-drift" />
      <FloatingParticles count={15} />

      <div className="container relative mx-auto px-4">
        <div className="flex flex-col items-center gap-12 md:flex-row md:gap-16">
          {/* Text side */}
          <motion.div
            className="flex-1 text-center md:text-right"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight text-foreground md:text-5xl lg:text-6xl">
              סרטוני AI
              <br />
              <span className="text-primary">שמניעים פעולה</span>
            </h1>
            <motion.p
              className="mb-8 text-lg text-muted-foreground md:text-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              צור סרטונים מקצועיים בדקות — ישירות דרך WhatsApp
            </motion.p>
            <motion.div
              className="flex flex-col items-center gap-4 md:flex-row md:items-start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <Button asChild size="lg" className="btn-press rounded-full bg-primary px-8 text-lg font-bold text-primary-foreground shadow-lg hover:bg-primary/90">
                <Link to="/signup">התחל עכשיו - חינם</Link>
              </Button>
            </motion.div>
            <motion.p
              className="mt-4 text-sm text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              סרטון ראשון חינם. בלי כרטיס אשראי.
            </motion.p>
          </motion.div>

          {/* Chat mockup side */}
          <motion.div
            className="flex-1 flex justify-center"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="relative w-full max-w-sm">
              {/* Phone frame */}
              <div className="rounded-3xl border border-border bg-muted/50 p-4 shadow-2xl backdrop-blur">
                {/* Chat header */}
                <div className="mb-4 flex items-center gap-3 rounded-xl bg-primary/10 px-3 py-2">
                  <motion.img
                    src={mascot}
                    alt="Pixi"
                    className="h-8 w-8"
                    animate={{ rotate: [0, -5, 5, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <div>
                    <p className="text-sm font-bold text-foreground">Pixi AI</p>
                    <p className="text-xs text-primary">מקוון</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex flex-col gap-3">
                  <ChatBubble isUser delay={0.6}>
                    אני צריך סרטון שיווקי
                  </ChatBubble>
                  <ChatBubble delay={1.1}>
                    מעולה! אנחנו מתחילים ליצור את הסרטון שלך 🎬
                  </ChatBubble>
                  <ChatBubble delay={1.6}>
                    <p className="mb-2">הסרטון שלך מוכן! 🎉</p>
                    <div className="relative overflow-hidden rounded-xl bg-foreground/5 aspect-video flex items-center justify-center border border-border">
                      <motion.div
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/90 text-primary-foreground shadow-lg"
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Play className="h-5 w-5" />
                      </motion.div>
                      {/* Pulse ring behind play */}
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
