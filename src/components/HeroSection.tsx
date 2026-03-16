import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import mascot from "@/assets/pixi-mascot.png";

const ChatBubble = ({ isUser, children, delay }: { isUser?: boolean; children: React.ReactNode; delay: string }) => (
  <div
    className={`flex ${isUser ? "justify-end" : "justify-start"} opacity-0 animate-fade-in`}
    style={{ animationDelay: delay }}
  >
    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
      isUser
        ? "rounded-bl-md bg-primary text-primary-foreground"
        : "rounded-br-md bg-card text-card-foreground border border-border"
    }`}>
      {children}
    </div>
  </div>
);

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center gap-12 md:flex-row md:gap-16">
          {/* Text side */}
          <div className="flex-1 text-center md:text-right">
            <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight text-foreground md:text-5xl lg:text-6xl">
              סרטוני AI
              <br />
              <span className="text-primary">שמניעים פעולה</span>
            </h1>
            <p className="mb-8 text-lg text-muted-foreground md:text-xl">
              צור סרטונים מקצועיים בדקות — ישירות דרך WhatsApp
            </p>
            <div className="flex flex-col items-center gap-4 md:flex-row md:items-start">
              <Button asChild size="lg" className="rounded-full bg-primary px-8 text-lg font-bold text-primary-foreground shadow-lg hover:bg-primary/90 hover:shadow-xl transition-all">
                <Link to="/signup">התחל עכשיו - חינם</Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              סרטון ראשון חינם. בלי כרטיס אשראי.
            </p>
          </div>

          {/* Chat mockup side */}
          <div className="flex-1 flex justify-center">
            <div className="relative w-full max-w-sm">
              {/* Phone frame */}
              <div className="rounded-3xl border border-border bg-muted/50 p-4 shadow-2xl backdrop-blur">
                {/* Chat header */}
                <div className="mb-4 flex items-center gap-3 rounded-xl bg-primary/10 px-3 py-2">
                  <img src={mascot} alt="Pixi" className="h-8 w-8" />
                  <div>
                    <p className="text-sm font-bold text-foreground">Pixi AI</p>
                    <p className="text-xs text-primary">מקוון</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex flex-col gap-3">
                  <ChatBubble isUser delay="0.3s">
                    אני צריך סרטון שיווקי
                  </ChatBubble>
                  <ChatBubble delay="0.8s">
                    מעולה! אנחנו מתחילים ליצור את הסרטון שלך 🎬
                  </ChatBubble>
                  <ChatBubble delay="1.3s">
                    <p className="mb-2">הסרטון שלך מוכן! 🎉</p>
                    <div className="relative overflow-hidden rounded-xl bg-foreground/5 aspect-video flex items-center justify-center border border-border">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/90 text-primary-foreground shadow-lg">
                        <Play className="h-5 w-5" />
                      </div>
                    </div>
                  </ChatBubble>
                </div>
              </div>


            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
